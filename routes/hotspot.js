class Hotspot {
  constructor(pt) {
    this.points = [pt.copy()];
    this.centroid = pt.copy();
    this.id = null;
    this.count = 0;
    this.position = this.centroid;
    this.major = false;
    this.emitter = null;
    this.nearest_emitter_distance = Infinity;
    this.nearest_major_hotspot = null;
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
  }

  create_emitter(){
    if(this.count == 0 || this.emitter ) { return }
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
    let emitter = new Emitter(this.position.x, this.position.y);
    let attractor = new Attractor(this.position.x, this.position.y, r);

    emitter.hotspot = this;
    emitter.attractor = attractor;

    emitters.push(emitter);

    this.emitter = emitter;

  }

  draw(){
    if(this.centroid === undefined) { return }
    noStroke();
    fill(stroke_colour);
    if(this.nearest_major_hotspot) { fill(255, 0, 0)}
    let sz = this.nearest_major_hotspot ? CSW * 8 : CSW + 2
    ellipse(this.centroid.x, this.centroid.y, sz);
  }
}

function find_hotspot(id){
  return hotspots.find(h => h.id === id);
}


function mergeCloseHotspots(hotspots, min_distance) {
  let merged = [];
  let used = new Array(hotspots.length).fill(false);
  for (let i = 0; i < hotspots.length; i++) {
    if (used[i]) continue;
    let group = [hotspots[i]];
    used[i] = true;
    for (let j = i + 1; j < hotspots.length; j++) {
      if (used[j]) continue;
      let d = p5.Vector.dist(hotspots[i].centroid, hotspots[j].centroid);
      if (d < min_distance) {
        group.push(hotspots[j]);
        used[j] = true;
      }
    }
    merged.push(mergeHotspotGroup(group));
  }
  return merged;
}

function mergeHotspotGroup(group) {
  let sumX = 0, sumY = 0, totalPoints = 0;
  let count = 0;
  for (let h of group) {
    sumX += h.centroid.x * h.points.length;
    sumY += h.centroid.y * h.points.length;
    totalPoints += h.points.length;
    count = Math.max(count, h.count);
  }
  let newCentroid = createVector(sumX / totalPoints, sumY / totalPoints);
  let hotspot = new Hotspot(newCentroid);
  hotspot.points = [];
  for (let h of group) {
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

function create_hotspots() {
  filter_journeys();

  let points = extract_journey_points();

  let hotspot_grid = new HotspotGrid();
  hotspot_grid.insert(points);

  hotspots = hotspot_grid.resulting_groups;
  major_hotspots = mergeCloseHotspots(hotspots, 160);
  minor_hotspots = mergeCloseHotspots(hotspots, 20);

  for(let hotspot of major_hotspots){
    hotspot.major = true;
  }

  for(let i = 0; i < major_hotspots.length; i++){
    major_hotspots[i].id = i;
  }

  for(let i = 0; i < minor_hotspots.length; i++){
    minor_hotspots[i].id = i + major_hotspots.length;
  }

  hotspots = major_hotspots.concat(minor_hotspots);

  
  let trajectories = [];

  for(let journey of filtered_journeys){
    trajectories.push(journey.path);
  }

  seqGen = new SequenceGenerator(hotspots, trajectories);
  connections = seqGen.create_connections();
  
  count_connections()

  let hotspot_connections = create_hotspot_connections(connections, hotspots)

  attach_major_hotspots(160)

  chains = create_chains(hotspot_connections, connections, hotspots);

  
}

  // attach_emitters();
  // create_hotspot_emitters()
  // aggregate_journeys();
  // connection_statistics();

function attach_major_hotspots(max_dist) {
  for(let major_hotspot of major_hotspots) {
    let nearest = null;
    let nearest_dist = Infinity;
    for(let hotspot of hotspots) {
      if(hotspot.count < 3) { continue; }
      let d = p5.Vector.dist(major_hotspot.centroid, hotspot.centroid);
      if (d < nearest_dist && d < max_dist) {
        nearest_dist = d;
        nearest = hotspot;
      }
    }
    if (nearest) {
      nearest.nearest_major_hotspot = major_hotspot;
      major_hotspot.centroid = nearest.centroid.copy();
      major_hotspot.position = nearest.position.copy();
    }
  }
}




let max_journey_count;




