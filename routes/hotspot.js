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
    ellipse(this.centroid.x, this.centroid.y, CSW + 2);
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
function generateHotspotsAndFlow() {
  filter_journeys();

  let points = extract_points();

  let hotspot_grid = new HotspotGrid();
  hotspot_grid.insert(points);

  hotspots = hotspot_grid.resulting_groups;
  major_hotspots = mergeCloseHotspots(hotspots, 160);
  minor_hotspots = mergeCloseHotspots(hotspots, 20);

  for(let hotspot of major_hotspots){
    hotspot.major = true;
  }

  hotspots = major_hotspots.concat(minor_hotspots);

  


  for (let i = 0; i < hotspots.length; i++) {
    hotspots[i].id = i;
    hotspots[i].geometry = hotspots[i].centroid.copy();
  }

  
  let trajectories = [];

  for(let journey of filtered_journeys){
    trajectories.push(journey.path);
  }

  let seqGen = new SequenceGenerator(hotspots, trajectories, null);
  connections = seqGen.create_connections();
  
  count_connections()

  
  connections = refineNetwork(connections);

  attach_emitters();
  create_hotspot_emitters()
  aggregate_journeys();
  connection_statistics();

  chains = create_chains(connections, hotspots);

  
}

function refineNetwork(connections, minAngle, maxAngle) {
  let new_connections = connections.slice();
  let iterations = 0;
  let maxIterations = 3;
  let changed = true;
  let nextNodeId = hotspots.length;
  while (changed && iterations < maxIterations) {
    changed = false;
    let nodes = getNodesFromFlowLines(new_connections);
    for (let node of nodes) {
      let edges = getEdgesForNode(node, new_connections);
      if (edges.length < 2) continue;
      let edgeAngles = [];
      for (let edge of edges) {
        let v = p5.Vector.sub(edge.other, node.pos);
        let angle = degrees(v.heading());
        if (angle < 0) angle += 360;
        edgeAngles.push({ edge: edge, angle: angle });
      }
      edgeAngles.sort((a, b) => a.angle - b.angle);
      for (let i = 0; i < edgeAngles.length; i++) {
        let a1 = edgeAngles[i].angle;
        let a2 = (i === edgeAngles.length - 1) ? (360 - a1 + edgeAngles[0].angle) : (edgeAngles[i + 1].angle - a1);
        if (a1 < MIN_CONNECTION_ANGLE || a2 < MIN_CONNECTION_ANGLE || 
            a1 > MAX_CONNECTION_ANGLE || a2 > MAX_CONNECTION_ANGLE) {
          // For simplicity, choose the longer edge among the two adjacent ones
          if(debug) { console.log("Splitting edge", edgeAngles[i].edge, "at angle", edgeAngles[i].angle); }
          let edge1 = edgeAngles[i].edge;
          let edge2 = edgeAngles[(i + 1) % edgeAngles.length].edge;
          let len1 = p5.Vector.dist(edge1.node, edge1.other);
          let len2 = p5.Vector.dist(edge2.node, edge2.other);
          let edgeToSplit = (len1 >= len2) ? edge1 : edge2;
          let mid = p5.Vector.add(edgeToSplit.node, edgeToSplit.other).mult(0.5);
          let hotspot = new Hotspot(mid);
          hotspot.id = nextNodeId++;
          hotspots.push(hotspot);
          new_connections = split_edge(new_connections, edgeToSplit, hotspot);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    iterations++;
  }
  return new_connections;
}

function getNodesFromFlowLines(new_connections) {
  let nodes = [];
  let tolerance = 0.001;
  for (let connection of new_connections) {
    if(!connection.geometry) continue;
    let ptA = connection.geometry[0];
    let ptB = connection.geometry[1];
    addNode(ptA, nodes, tolerance);
    addNode(ptB, nodes, tolerance);
  }
  return nodes;
}

function addNode(pt, nodes, tol) {
  for (let node of nodes) {
    if (p5.Vector.dist(pt, node.pos) < tol) return;
  }
  nodes.push({ id: pt.id !== undefined ? pt.id : null, pos: pt.copy() });
}

function getEdgesForNode(node, connections) {
  let edges = [];
  let tol = 0.001;
  for (let connection of connections) {
    let a = connection.geometry[0];
    let b = connection.geometry[1];
    if (p5.Vector.dist(node.pos, a) < tol) {
      edges.push({ node: a.copy(), other: b.copy(), connection: connection });
    } else if (p5.Vector.dist(node.pos, b) < tol) {
      edges.push({ node: b.copy(), other: a.copy(), connection: connection });
    }
  }
  return edges;
}

function split_edge(connections, edge, hotspot) {
  let new_connections = [];
  for (let connection of connections) {
    if (connection === edge.connection) {
      let connection_a = new Connection(edge.connection.from, hotspot.id, [edge.node.copy(), hotspot.centroid.copy()], connection.key, edge.connection.count);
      let connection_b = new Connection(hotspot.id, edge.connection.to, [hotspot.centroid.copy(), edge.other.copy()], connection.key, edge.connection.count);

      new_connections.push(connection_a);
      new_connections.push(connection_b);
    } else {
      new_connections.push(connection);
    }
  }
  return new_connections;
}





let max_journey_count;




