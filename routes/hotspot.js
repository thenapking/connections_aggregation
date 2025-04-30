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

  draw(){
    if(this.centroid === undefined) { return }
    noStroke();
    fill(stroke_colour);
    let sz = this.major ? CSW*8 : CSW;
    ellipse(this.centroid.x, this.centroid.y, sz);
  }
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


function extract_points(){
  let points = [];

  for(let journey of filtered_journeys){
    for (let i = 0; i < journey.path.length; i++) {
      points.push(journey.path[i].copy());
    }
  }

  return points;
}


let hotspot_grid;
function generateHotspotsAndFlow() {
  filter_journeys();

  let points = extract_points();

  let hotspot_grid = new HotspotGrid();
  hotspot_grid.insert(points);

  hotspots = hotspot_grid.resulting_groups;
  major_hotspots = mergeCloseHotspots(hotspots, 160);
  minor_hotspots = mergeCloseHotspots(hotspots, 30);

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
  count_journeys();
  connection_statistics();

  chains = groupChains(connections, hotspots);

  
}

function attach_emitters(){
  for(let emitter of emitters){
    let nearest  = null;
    let nearest_dist = Infinity;
    for(let hotspot of hotspots) {
      let d = p5.Vector.dist(hotspot.centroid, emitter.position);
      if (d < nearest_dist) {
        nearest_dist = d;
        nearest = hotspot;
        if(d < hotspot.nearest_emitter_distance){
          hotspot.nearest_emitter_distance = d;
        }
      }
    }

    if(nearest_dist < EMITTER_MARGIN){
      nearest.emitter = emitter;
      emitter.hotspot = nearest;
      
      let moving_closer = false;

      for(let other of emitters){
        if(other == emitter) continue;
        let d1 = p5.Vector.dist(other.position, nearest.position);
        let d2 = p5.Vector.dist(other.position, emitter.position);
        if (d1 < EMITTER_MARGIN && d1 < d2) {
          moving_closer = true;
          break;
        }
      }

      if(!moving_closer){
        emitter.position = nearest.centroid.copy();
        if(nearest.major && emitter.attractor){
          emitter.attractor.radius = 20;
        } else {
          emitter.attractor.radius = 2;
        }
      }
    }
  }
}

function create_hotspot_emitters(){
  for(let hotspot of hotspots){
    if(hotspot.count > 1 && !hotspot.emitter ) {
      if(below_water_level(hotspot.centroid)) { continue; }

      let nearest_dist = Infinity;
      for(let other of emitters){
        let d = p5.Vector.dist(other.position, hotspot.centroid);
        if(d < nearest_dist){
          nearest_dist = d;
        }
      }

      if(nearest_dist < EMITTER_MARGIN ) { continue; }
      let r = hotspot.major ? 20 : 2;
      let emitter = new Emitter(hotspot.position.x, hotspot.position.y);
      let attractor = new Attractor(hotspot.position.x, hotspot.position.y, r);

      emitter.hotspot = hotspot;
      emitter.attractor = attractor;

      emitters.push(emitter);

      hotspot.emitter = emitter;

    }
  }
}

function count_journeys(){
  for (let journey of filtered_journeys) {
    let eA = journey.emitterA;
    let eB = journey.emitterB;

    for(let connection of connections){
      let hA = hotspots[connection.from];
      let hB = hotspots[connection.to];
      if(hA.emitter == eA && hB.emitter == eB
        || hA.emitter == eB && hB.emitter == eA){
       
        connection.journeys += journey.count;
        break;
      }
    }
  }
}

function connection_statistics(){
  let journey_counts = [];
  max_journey_count = 0;
  for(let connection of connections){
    journey_counts.push(connection.journeys);
    if(connection.journeys > max_journey_count){
      max_journey_count = connection.journeys;
    }
  }

  for(let connection of connections){
    connection.percentile = journey_percentiles(journey_counts, connection.journeys);
  }

}

function journey_percentiles(arr, val) {
  let count = 0;

  for(let v of arr){
    if (v < val) {
      count++;
    } else if (v == val) {
      count += 0.5;
    }
  };

  return 100 * count / arr.length;
}

function count_connections(){
  for (let connection of connections) {
    let from = connection.from;
    let to = connection.to;
    if (hotspots[from]) {
      hotspots[from].count++;
    }
    if (hotspots[to]) {
      hotspots[to].count++;
    }
  }
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


let visited;
let hotspotConnections = {};

function groupChains(connections, hotspots) {
  hotspotConnections = {};
  for (let h of hotspots) {
    hotspotConnections[h.id] = [];
  }
  for (let conn of connections) {
    hotspotConnections[conn.from].push(conn);
    hotspotConnections[conn.to].push(conn);
  }

  visited = new Set(); // Mark connections we've already processed.
  let chains = [];

  for (let h of hotspots) {
    if (h.major) {
      let conns = hotspotConnections[h.id];
      for (let conn of conns) {
        if (!visited.has(conn)) {
          let chain = followChain(conn, h.id);
          chains.push(chain);
        }
      }
    }
  }

  for (let conn of connections) {
    if (!visited.has(conn)) {
      let chain = followChain(conn, conn.from);
      chains.push(chain);
    }
  }

  return chains;
}

// Helper function to follow a chain starting from a given hotspot along a connection.
function followChain(startConn, startHotspot) {
  let chainPoints = [];
  let chainCount = 0;
  let chainPercentile = 0;
  let chainJourneys = 0;
  let currentHotspot = startHotspot;
  let currentConn = startConn;
  // Start chain with the starting hotspot's centroid.
  let startH = hotspots.find(h => h.id === currentHotspot);
  if (startH) chainPoints.push(startH.centroid.copy());
  
  // Follow the chain:
  while (true) {
    visited.add(currentConn);
    chainCount += currentConn.count;
    chainPercentile += currentConn.percentile;
    chainJourneys += currentConn.journeys;
    // Determine the next hotspot (the one on the other end of the connection)
    let nextHotspot = (currentConn.from === currentHotspot) ? currentConn.to : currentConn.from;
    let nextH = hotspots.find(h => h.id === nextHotspot);
    if (!nextH) break;
    chainPoints.push(nextH.centroid.copy());
    
    // If next hotspot is an endpoint (i.e. its connection count is not 2), or there’s no unvisited connection from it, stop.
    if (nextH.count !== 2) break;
    let nextConns = hotspotConnections[nextHotspot].filter(conn => !visited.has(conn));
    if (nextConns.length === 0) break;
    
    // Otherwise, follow the single available unvisited connection.
    currentConn = nextConns[0];
    currentHotspot = nextHotspot;
  }
  return { points: chainPoints, count: chainCount, journeys: chainJourneys, percentile: chainPercentile / chainPoints.length };
}

let max_journey_count;

function draw_chains() {
  push()
  for (let chain of chains) {
    
    strokeWeight(4);
    noFill();
    stroke(stroke_colour);
    beginShape();
      curveVertex(chain.points[0].x, chain.points[0].y);
      for (let pt of chain.points) {
        curveVertex(pt.x, pt.y);
      }
      curveVertex(chain.points[chain.points.length-1].x, chain.points[chain.points.length-1].y);
    endShape();
  }
  pop()
}


