let agents = [];
let emitters = [];
let attractors = [];
let journeys = [];
let filtered_journeys = [];
let median_journey_count = 0;
let top_journey_count = 0;  
let foodLayer;

const SENSOR_ANGLE = Math.PI / 6;
const SENSOR_DISTANCE = 10;
const TURN_ANGLE = 0.3;
const STEP_SIZE = 1.5;
const EMITTER_ASSIGN_DISTANCE = 20;

const PATH_DETAIL = 80;
const MIN_JOURNEYS_TO_DRAW = 10;
const MIN_HOTSPOT_DISTANCE = 40; 
const MIN_STROKE = 1;
const MAX_STROKE = 50;
const MIN_CHAIN_COUNT = 4;  
const MAX_CHAIN_COUNT = 50; 


const CSW = 8;

const NUM_AGENTS = 50;
const NUM_EMITTERS = 80;
const NUM_ATTRACTORS = 1500

const CELL_SIZE = 20;

let show_agents = true

let hotspots = [];
let connections = [];
let chains = [];  

function setup() {
  createCanvas(1200, 1200);

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

  draw_journeys();
  draw_hotspots();
  // draw_connections();
  draw_chains();
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
    agent.check();
    if(show_agents){
      agent.draw();
    } 
  }
}

function draw_journeys() {
  if(hotspots.length > 0) return;
  
  for (let journey of filtered_journeys) {
    journey.draw();
  }
}

function draw_hotspots() {
  for (let hotspot of hotspots) {
    hotspot.draw();
  }
}

function draw_emitters() {
  for (let emitter of emitters) {
    emitter.draw();
  }
}

function draw_connections(){
  for (let connection of connections) {
    connection.draw()
  }
}

function draw_attractors() {
  for (let attractor of attractors) {
    attractor.discharge();
    attractor.draw();
  }
}


