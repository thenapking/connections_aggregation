const DPI = 96
let w = 12 * DPI;
let h = 16 * DPI;
let bw = 1 * DPI;



let agents = [];
let emitters = [];
let attractors = [];
let journeys = [];
let obstacles = [];
let filtered_journeys = [];
let median_journey_count = 0;
let top_journey_count = 0;  
let foodLayer;

const SENSOR_ANGLE = Math.PI / 6;
const SENSOR_DISTANCE = 10;
const TURN_ANGLE = 0.3;
const STEP_SIZE = 1.5;
const EMITTER_ASSIGN_DISTANCE = 20;

const EMITTER_MARGIN = 30;
const OBSTACLE_MARGIN = 30;

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
const NUM_OBSTACLES = 100;

const CELL_SIZE = 20;

let show_agents = true

let hotspots = [];
let connections = [];
let chains = [];  

function setup() {
  createCanvas(w + 2*bw, h + 2*bw);


  foodLayer = createGraphics(w + 2*bw, h + 2*bw);
  foodLayer.background(0);

  create_attractors();
  create_obstacles();
  create_emitters(w, h);
  create_agents();
  
}

function draw() {
  background(palette.background);
  translate(bw, bw);
  
  add_food();
  
  
  draw_attractors();
  draw_emitters();
  draw_obstacles();

  draw_journeys();
  draw_hotspots();
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

function draw_obstacles() {
  for (let obstacle of obstacles) {
    obstacle.draw();
  }
}

function add_food(){
  foodLayer.fill(0, 20);
  foodLayer.noStroke();
  foodLayer.rect(0, 0, width, height);
}

