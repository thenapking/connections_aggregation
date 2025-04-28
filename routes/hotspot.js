class Hotspot {
  constructor(pt) {
    this.points = [pt.copy()];
    this.centroid = pt.copy();
    this.id = null;
    this.count = 0;
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
s
  draw(){
    if(this.centroid === undefined) { return }
    noStroke();
    fill(palette.route);
    let sz = this.count > 2 ? CSW*2 : CSW+2;
    ellipse(this.centroid.x, this.centroid.y, sz);
  }
}


function mergeCloseHotspots(hotspots, minDistance) {
  let merged = [];
  let used = new Array(hotspots.length).fill(false);
  for (let i = 0; i < hotspots.length; i++) {
    if (used[i]) continue;
    let group = [hotspots[i]];
    used[i] = true;
    for (let j = i + 1; j < hotspots.length; j++) {
      if (used[j]) continue;
      let d = p5.Vector.dist(hotspots[i].centroid, hotspots[j].centroid);
      if (d < minDistance) {
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




function generateHotspotsAndFlow() {
  let allPoints = [];

  filter_journeys();

  for(let journey of filtered_journeys){
    for (let i = 0; i < journey.path.length; i++) {
      allPoints.push(journey.path[i].copy());
    }
  }

  let bbox = { xMin: 0, yMin: 0, xMax: w, yMax: h };
  let grid = new Grid(bbox, CELL_SIZE);
  grid.insert(allPoints);
  hotspots = grid.resulting_groups;

  hotspots = mergeCloseHotspots(hotspots, MIN_HOTSPOT_DISTANCE);

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
  
  connections = refineNetwork(connections, 20, 140);
  chains = groupChains(connections, hotspots);
 
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
        if (a1 < minAngle || a2 < minAngle || a1 > maxAngle || a2 > maxAngle) {
          // For simplicity, choose the longer edge among the two adjacent ones
          console.log("Splitting edge", edgeAngles[i].edge, "at angle", edgeAngles[i].angle);
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
      let connection_a = new Connection(edge.connection.from, hotspot.id, [edge.node.copy(), hotspot.centroid.copy()], edge.connection.count);
      let connection_b = new Connection(hotspot.id, edge.connection.to, [hotspot.centroid.copy(), edge.other.copy()], edge.connection.count);

      new_connections.push(connection_a);
      new_connections.push(connection_b);
    } else {
      new_connections.push(connection);
    }
  }
  return new_connections;
}



function groupChains(connections, hotspots) {
  let hotspotConnections = {};
  for (let h of hotspots) {
    hotspotConnections[h.id] = [];
  }
  for (let conn of connections) {
    hotspotConnections[conn.from].push(conn);
    hotspotConnections[conn.to].push(conn);
  }

  let visited = new Set(); // Mark connections we've already processed.
  let chains = [];

  // Helper function to follow a chain starting from a given hotspot along a connection.
  function followChain(startConn, startHotspot) {
    let chainPoints = [];
    let chainCount = 0;
    let currentHotspot = startHotspot;
    let currentConn = startConn;
    // Start chain with the starting hotspot's centroid.
    let startH = hotspots.find(h => h.id === currentHotspot);
    if (startH) chainPoints.push(startH.centroid.copy());
    
    // Follow the chain:
    while (true) {
      visited.add(currentConn);
      chainCount += currentConn.count;
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
    return { points: chainPoints, count: chainCount };
  }

  for (let h of hotspots) {
    if (h.count !== 2) {
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

function draw_chains() {
  push()
  for (let chain of chains) {
    strokeWeight(4);
    noFill();
    stroke(palette.route);
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


