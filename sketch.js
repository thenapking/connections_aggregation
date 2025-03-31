let agents = [];
let emitters = [];
let attractors = [];
let connections = [];
let foodLayer;

const SENSOR_ANGLE = Math.PI / 6;
const SENSOR_DISTANCE = 10;
const TURN_ANGLE = 0.3;
const STEP_SIZE = 1.5;
const EMITTER_ASSIGN_DISTANCE = 20;

const PATH_DETAIL = 50;
const MIN_JOURNEYS_TO_DRAW = 3;

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
  for (let i = 0; i < NUM_ATTRACTORS; i++) {
    let x = random(width);
    let y = random(height);
    attractors.push(new Attractor(x, y));
  }
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

  draw_agents();
  draw_connections();
  draw_hotspots();
  draw_flowlines();

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

  for (let conn of connections) {
    if (conn.journeyCount >= MIN_JOURNEYS_TO_DRAW) {
      conn.draw();
    }
  }
}

function draw_hotspots() {
  if (hotspots.length > 0) {
    noStroke();
    fill(255, 192, 0);
    for (let h of hotspots) {
      ellipse(h.centroid.x, h.centroid.y, 6, 6);
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
    stroke(0, 255, 0);
    strokeWeight(2);
    for (let l of flowLines) {
      let geom = l.geometry;
      line(geom[0].x, geom[0].y, geom[1].x, geom[1].y);
    }
  }
}

function draw_attractors() {

  for (let attractor of attractors) {
    attractor.addFood();
    if(show_agents){
      attractor.draw();
    }
  }
}



function generateHotspotsAndFlow() {
  let allPoints = [];

  for(let connection of connections){
    for (let i = 0; i < connection.path.length; i += 5) {
      allPoints.push(connection.path[i].copy());
    }
  }

  let bbox = { xMin: 0, yMin: 0, xMax: width, yMax: height };
  let grid = new Grid(bbox, CELL_SIZE);
  grid.insert_points(allPoints);
  hotspots = grid.resulting_groups;

  for (let i = 0; i < hotspots.length; i++) {
    hotspots[i].id = i;
    hotspots[i].geometry = hotspots[i].centroid.copy();
  }

  let trajectories = [];

  for(let connection of connections){
    trajectories.push(connection.path);
  }

  let seqGen = new SequenceGenerator(hotspots, trajectories, null);
  flowLines = seqGen.create_flow_lines();
}


function resamplePath(path, numPoints) {
  if (path.length < 2) return path.slice();
  let cumulativeDists = [0];
  let totalDist = 0;
  for (let i = 1; i < path.length; i++) {
    totalDist += p5.Vector.dist(path[i], path[i - 1]);
    cumulativeDists.push(totalDist);
  }
  let newPath = [];
  let interval = totalDist / (numPoints - 1);
  newPath.push(path[0].copy());
  for (let j = 1; j < numPoints - 1; j++) {
    let targetDist = j * interval;
    let k = 1;
    while (k < cumulativeDists.length && cumulativeDists[k] < targetDist) { k++; }
    let t = (targetDist - cumulativeDists[k - 1]) / (cumulativeDists[k] - cumulativeDists[k - 1]);
    let newX = lerp(path[k - 1].x, path[k].x, t);
    let newY = lerp(path[k - 1].y, path[k].y, t);
    newPath.push(createVector(newX, newY));
  }
  newPath.push(path[path.length - 1].copy());
  return newPath;
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


