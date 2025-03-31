let agents = [];
let emitters = [];
let attractors = [];
let connections = [];
let filtered_connections = [];
let foodLayer;

const SENSOR_ANGLE = Math.PI / 6;
const SENSOR_DISTANCE = 10;
const TURN_ANGLE = 0.3;
const STEP_SIZE = 1.5;
const EMITTER_ASSIGN_DISTANCE = 20;

const PATH_DETAIL = 80;
const MIN_JOURNEYS_TO_DRAW = 10;

const CSW = 8;

const NUM_AGENTS = 50;
const NUM_EMITTERS = 20;
const NUM_ATTRACTORS = 500

const CELL_SIZE = 20;

let show_agents = true

let hotspots = [];
let flowLines = [];

function setup() {
  createCanvas(800, 600);

  foodLayer = createGraphics(width, height);
  foodLayer.background(0);

  create_attractors();
  for (let i = 0; i < NUM_EMITTERS; i++) {
    let x = random(width);
    let y = random(height);
    emitters.push(new Emitter(x, y));
  }
  for (let emitter of emitters) {
    for (let i = 0; i < NUM_AGENTS; i++) {
      agents.push(new Agent(emitter.position.x, emitter.position.y, emitter));
    }
  }
}

function draw() {
  background(51);
  foodLayer.fill(0, 20);
  foodLayer.noStroke();
  foodLayer.rect(0, 0, width, height);
  
  draw_attractors();
  draw_emitters();

  draw_connections();
  draw_hotspots();
  draw_flowlines();
  draw_agents();


}

function keyPressed() {
  if (key === 'h') {
    generateHotspotsAndFlow();
    loop();
  }

  if( key === 'a'){
    show_agents = !show_agents
  }
  
}

function draw_agents() {
  for (let agent of agents) {
    agent.update();
    agent.checkEmitters();
    if(show_agents){
      agent.draw();
    } 
  }
}

function draw_connections() {
  if(hotspots.length > 0) return;
  
  for (let conn of filtered_connections) {
    conn.draw();
  }
}

function draw_hotspots() {
  if (hotspots.length > 0) {
    noStroke();
    fill(255, 192, 0);
    for (let h of hotspots) {
      if(h.centroid === undefined) continue;
      let sz = h.connectionCount > 2 ? CSW*2 : CSW+2;
      ellipse(h.centroid.x, h.centroid.y, sz, sz);
    }
  }
}

function draw_emitters() {
  for (let emitter of emitters) {
    emitter.draw();
  }
}

function draw_flowlines(){
  if (flowLines.length > 0) {
    stroke(255, 192, 0);
    strokeWeight(CSW);
    for (let l of flowLines) {
      let geom = l.geometry;
      line(geom[0].x, geom[0].y, geom[1].x, geom[1].y);
    }
  }
}

function draw_attractors() {

  for (let attractor of attractors) {
    attractor.discharge();
    attractor.draw();
  }
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
          let newNode = { id: nextNodeId++, pos: mid.copy() };
          hotspots.push(newNode);
          newFlowLines = splitEdge(newFlowLines, edgeToSplit, newNode);
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
  let tol = 0.001;
  for (let line of flowLines) {
    let ptA = line.geometry[0];
    let ptB = line.geometry[1];
    addNode(ptA, nodes, tol);
    addNode(ptB, nodes, tol);
  }
  return nodes;
}

function addNode(pt, nodes, tol) {
  for (let node of nodes) {
    if (p5.Vector.dist(pt, node.pos) < tol) return;
  }
  // If the point already has an id (set when creating hotspots), use it; otherwise null.
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
      newFlowLines.push({ geometry: [edgeToSplit.node.copy(), newNode.pos.copy()] });
      newFlowLines.push({ geometry: [newNode.pos.copy(), edgeToSplit.other.copy()] });
    } else {
      newFlowLines.push(line);
    }
  }
  return newFlowLines;
}


function refineNetworkWithTriangle(hotspots) {
  let points = [];
  for (let i = 0; i < hotspots.length; i++) {
    if(hotspots[i].centroid === undefined) continue;
    points.push(hotspots[i].centroid.x, hotspots[i].centroid.y);
  }
  const numPoints = hotspots.length;
  const nFloats = points.length; // should be numPoints * 2

  const sizeInBytes = nFloats * Float32Array.BYTES_PER_ELEMENT;
  const ptr = Module._malloc(sizeInBytes);
  
  Module.HEAPF32.set(points, ptr / Float32Array.BYTES_PER_ELEMENT);
  
  const meshPtr = triangulateMesh(ptr, numPoints);
  
  console.log('Returned mesh pointer:', meshPtr);
  
  Module._free(ptr);
  
  return meshPtr;
}


function drawFlowLineBezier(from, to) {
  let mid = p5.Vector.add(from, to).mult(0.5);
  let dir = p5.Vector.sub(to, from);
  let offset = dir.copy().rotate(HALF_PI).setMag(dir.mag() * 0.2);
  let cp1 = p5.Vector.add(from, offset);
  let cp2 = p5.Vector.add(to, offset);
  
  noFill();
  stroke(0, 255, 0);
  strokeWeight(2);
  bezier(from.x, from.y, cp1.x, cp1.y, cp2.x, cp2.y, to.x, to.y);
}




function create_trajectories_from_agents(){
  let trajectories = [];

  for (let agent of agents) {
    for (let j = 0; j < agent.path.length; j++) {
      if (agent.path[j].m === undefined) {
        agent.path[j].m = j;
      }
    }
    trajectories.push(agent.path);
  }
}


