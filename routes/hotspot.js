class Hotspot {
  constructor(pt, group) {
    this.points = [pt.copy()];
    this.centroid = pt.copy();
    this.group = group;
    this.id = null;
    this.count = 0;
    this.position = this.centroid;
    this.major = false;
    // this.emitter = null;
    this.nearest_emitter_distance = Infinity;
    this.nearest_major_hotspot = null;
    this.flagged = false;
    this.outside = false;
    this.edges();
  }

  edges(){
    if(this.position.x < HOTSPOT_MARGIN/u || this.position.x > width/u - HOTSPOT_MARGIN/u ||
       this.position.y < HOTSPOT_MARGIN/u || this.position.y > height/u - HOTSPOT_MARGIN/u ){
      this.outside = true;  
    }
  }

  add_point(pt) {
    this.points.push(pt.copy());
  }

  delete_points() {
    this.points = [];
  }

  recompute_centroid() {
    let sumX = 0, sumY = 0;
    for (let pt of this.points) {
      sumX += pt.x;
      sumY += pt.y;
    }
    this.centroid = createVector(sumX / this.points.length, sumY / this.points.length);
    this.edges();
  }

  emitter(){
    let this_emitter;
    for(let emitter of emitters){
      if(emitter.hotspot == this){
        this_emitter = emitter;
        break;
      }
    }
    return this_emitter;
  }

  create_emitter(){
    if(this.count == 0 ) { return }
    if(this.outside) { return }
    if(this.emitter()) { return }
    if(below_water_level(this.position)) { return }

    let nearest_dist = Infinity;
    for(let other of emitters){
      let d = p5.Vector.dist(other.position, this.position);
      if(d < nearest_dist){
        nearest_dist = d;
      }
    }

    if(nearest_dist < EMITTER_MARGIN ) { return }

    let r = this.major ? 20 : 2;
    // TODO
    let emitter = new Emitter(this.position.x, this.position.y, this.group, false);
    let attractor = new Attractor(this.position.x, this.position.y, r);

    emitter.hotspot = this;
    emitter.attractor = attractor;

    emitters.push(emitter);
  }

  draw(){
    if(this.flagged) { return }
    if(this.outside) { return }

    noStroke();
    fill(stroke_colour);

    if(this.major) { fill(255, 0, 0)}
    let sz = this.major ? CSW * 8 : CSW * 2
    ellipse(this.position.x, this.position.y, sz, sz);
  }
}

function find_hotspot(id){
  return hotspots.find(h => h.id === id);
}


function mergeCloseHotspots(hotspots, min_distance, group) {
  let merged = [];
  let used = new Array(hotspots.length).fill(false);
  for (let i = 0; i < hotspots.length; i++) {
    if (used[i]) continue;
    let hotspot_group = [hotspots[i]];
    used[i] = true;
    for (let j = i + 1; j < hotspots.length; j++) {
      if (used[j]) continue;
      let d = p5.Vector.dist(hotspots[i].centroid, hotspots[j].centroid);
      if (d < min_distance) {
        hotspot_group.push(hotspots[j]);
        used[j] = true;
      }
    }
    merged.push(mergeHotspotGroup(hotspot_group, group));
  }
  return merged;
}

function mergeHotspotGroup(hotspot_group, group) {
  let sumX = 0, sumY = 0, totalPoints = 0;
  let count = 0;
  for (let h of hotspot_group) {
    sumX += h.centroid.x * h.points.length;
    sumY += h.centroid.y * h.points.length;
    totalPoints += h.points.length;
    count = Math.max(count, h.count);
  }
  let newCentroid = createVector(sumX / totalPoints, sumY / totalPoints);
  let hotspot = new Hotspot(newCentroid, group);
  hotspot.points = [];
  for (let h of hotspot_group) {
    hotspot.points = hotspot.points.concat(h.points);
  }
  hotspot.recompute_centroid();
  hotspot.count = count;
  return hotspot;
}





let hotspot_grid;
let minor_hotspots = [];
let major_hotspots = [];
let major_chains = [];
let minor_chains = [];
let minor_connections = [];
let major_connections = [];
let minor_seq
let major_seq
let seqGen;

function create_hotspots(group) {
  filter_journeys(group);

  let points = extract_journey_points();

  let hotspot_grid = new HotspotGrid(group);
  hotspot_grid.insert(points);

  let new_hotspots = hotspot_grid.hotspot_groups;
  

  new_hotspots = mergeCloseHotspots(new_hotspots, group.hotspot_proximity, group);

  let start_id  = hotspots.length || 0;
  for(let i = 0; i < new_hotspots.length; i++){
    new_hotspots[i].id = i+start_id;
  }
  
  for(let hotspot of new_hotspots){
    hotspots.push(hotspot);
  }


  let trajectories = [];

  for(let journey of filtered_journeys){
    trajectories.push(journey.path);
  }

  let seqGen = new SequenceGenerator(new_hotspots, trajectories, group);
  let new_connections = seqGen.create_connections();

  new_connections = refineNetwork(new_connections, new_hotspots);
  
  count_connections()

  // let hotspot_connections = create_hotspot_connections(new_connections, new_hotspots)

  for(let connection of new_connections){
    connections.push(connection)  
  }

  attach_emitters();
  create_hotspot_emitters();


}



let max_journey_count;




