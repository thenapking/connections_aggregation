class Hotspot {
  constructor(pt) {
    this.points = [pt.copy()];
    this.centroid = pt.copy();
    this.id = null;
    this.connectionCount = 0;
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
    fill(255, 192, 0);
    let sz = this.connectionCount > 2 ? CSW*2 : CSW+2;
    ellipse(this.centroid.x, this.centroid.y, sz);
  }
}

const MIN_HOTSPOT_DISTANCE = 20; // Set your minimum distance in pixels

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
  let connectionCount = 0;
  for (let h of group) {
    // Weight the centroid by the number of points in the group
    sumX += h.centroid.x * h.points.length;
    sumY += h.centroid.y * h.points.length;
    totalPoints += h.points.length;
    // You could also sum or take the maximum of the connection counts:
    connectionCount = Math.max(connectionCount, h.connectionCount);
  }
  let newCentroid = createVector(sumX / totalPoints, sumY / totalPoints);
  let newHotspot = new Hotspot(newCentroid);
  newHotspot.points = [];
  for (let h of group) {
    newHotspot.points = newHotspot.points.concat(h.points);
  }
  newHotspot.recompute_centroid();
  newHotspot.connectionCount = connectionCount;
  return newHotspot;
}




function generateHotspotsAndFlow() {
  let allPoints = [];

  filter_connections();

  for(let connection of filtered_connections){
    for (let i = 0; i < connection.path.length; i++) {
      allPoints.push(connection.path[i].copy());
    }
  }

  let bbox = { xMin: 0, yMin: 0, xMax: width, yMax: height };
  let grid = new Grid(bbox, CELL_SIZE);
  grid.insert_points(allPoints);
  hotspots = grid.resulting_groups;

  hotspots = mergeCloseHotspots(hotspots, MIN_HOTSPOT_DISTANCE);

  for (let i = 0; i < hotspots.length; i++) {
    hotspots[i].id = i;
    hotspots[i].geometry = hotspots[i].centroid.copy();
  }

  
  let trajectories = [];

  for(let connection of filtered_connections){
    trajectories.push(connection.path);
  }

  let seqGen = new SequenceGenerator(hotspots, trajectories, null);
  flowLines = seqGen.create_flow_lines();
  
  for (let line of flowLines) {
    let from = line.attributes.FROM;
    let to = line.attributes.TO;
    if (hotspots[from]) {
      hotspots[from].connectionCount++;
    }
    if (hotspots[to]) {
      hotspots[to].connectionCount++;
    }
  }
  
  flowLines = refineNetwork(flowLines, 20, 140);
 
}

function refineNetwork(flowLines, minAngle, maxAngle) {
  let newFlowLines = flowLines.slice();
  let iterations = 0;
  let maxIterations = 3;
  let changed = true;
  let nextNodeId = hotspots.length;
  while (changed && iterations < maxIterations) {
    changed = false;
    let nodes = getNodesFromFlowLines(newFlowLines);
    for (let node of nodes) {
      let edges = getEdgesForNode(node, newFlowLines);
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
          let newHotspot = new Hotspot(mid);
          newHotspot.id = nextNodeId++;
          hotspots.push(newHotspot);
          newFlowLines = splitEdge(newFlowLines, edgeToSplit, newHotspot);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    iterations++;
  }
  return newFlowLines;
}

function getNodesFromFlowLines(flowLines) {
  let nodes = [];
  let tolerance = 0.001;
  for (let line of flowLines) {
    let ptA = line.geometry[0];
    let ptB = line.geometry[1];
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

function getEdgesForNode(node, flowLines) {
  let edges = [];
  let tol = 0.001;
  for (let line of flowLines) {
    let a = line.geometry[0];
    let b = line.geometry[1];
    if (p5.Vector.dist(node.pos, a) < tol) {
      edges.push({ node: a.copy(), other: b.copy(), line: line });
    } else if (p5.Vector.dist(node.pos, b) < tol) {
      edges.push({ node: b.copy(), other: a.copy(), line: line });
    }
  }
  return edges;
}

function splitEdge(flowLines, edgeToSplit, newNode) {
  let newFlowLines = [];
  for (let line of flowLines) {
    if (line === edgeToSplit.line) {
      newFlowLines.push({ geometry: [edgeToSplit.node.copy(), newNode.centroid.copy()] });
      newFlowLines.push({ geometry: [newNode.centroid.copy(), edgeToSplit.other.copy()] });
    } else {
      newFlowLines.push(line);
    }
  }
  return newFlowLines;
}


