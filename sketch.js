const DPI = 96
let w = 6 * DPI;
let h = 8 * DPI;
let bw = 1 * DPI;



let slimeagents = [];
let emitters = [];
let attractors = [];
let journeys = [];
let obstacles = [];
let groups = [];
let hotspots = [];
let connections = [];
let chains = [];  

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
const OBSTACLE_MARGIN = 30; // distance between obstacles
const OBSTACLE_SPACING = 10; // distance between hotspots and obstacles

const PATH_DETAIL = 80;
const MIN_JOURNEYS_TO_DRAW = 10;
const MIN_HOTSPOT_DISTANCE = DPI/2; 
const MIN_STROKE = 1;
const MAX_STROKE = 50;
const MIN_CHAIN_COUNT = 4;  
const MAX_CHAIN_COUNT = 50; 


const CSW = 8;

const NUM_SLIMEAGENTS = 50;
const NUM_EMITTERS = 80;
const NUM_ATTRACTORS = 1500
const NUM_OBSTACLES = 100;

const CELL_SIZE = 20;

let show_slime = true
let show_emitters = false;

let enable_slimeagents = true

let exporting = false;
let running = true
let debug = false;

function setup() {
  createCanvas(w + 2*bw, h + 2*bw);
  create_food();

  setup_gui();

  create_emitters(w, h);
}

function draw() {
  if(!running) { noLoop(); }
  if(exporting){ beginRecordSVG(this, 'flower_agents.svg') }

  update_slimeagents();


  background(palette.background);
  translate(bw, bw);

  push();
    draw_emitters();
    draw_obstacles();
    draw_attractors();
  pop();
  
  draw_groups(palette.depth[0]);
  draw_groups(palette.depth[1]);

  
  push();
    draw_journeys();
    draw_hotspots();
    draw_chains();
    draw_slimeagents();
  pop();

  draw_groups(palette.depth[2]);
  draw_groups(palette.depth[3]);
  draw_groups(palette.depth[4]);
  draw_groups(palette.depth[5]);
  delete_empty_groups();

  if(exporting){ 
    endRecordSVG() 
    exporting = false;
  }
}

function update_slimeagents(){
  if(!enable_slimeagents) return;
  add_food();

  for (let slimeagent of slimeagents) {
    slimeagent.update();
    slimeagent.check();
  }
}


function draw_slimeagents() {
  for (let slimeagent of slimeagents) {
    if(show_slime){
      slimeagent.draw();
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
  if(!show_emitters) return;

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
  if(!debug) { return; }

  for (let attractor of attractors) {
    attractor.draw();
  }
}

function draw_obstacles() {
  if(!debug) { return; }

  for (let obstacle of obstacles) {
    obstacle.draw();
  }
}

function create_food(){
  foodLayer = createGraphics(w + 2*bw, h + 2*bw);
  foodLayer.background(0);
}

function delete_slimeagents(){
  slimeagents = [];
  hotspots = [];
  connections = [];
  journeys = [];
  filtered_journeys = [];
  chains = [];
  foodLayer.clear();
  foodLayer.background(0);

}

function add_food(){
  foodLayer.fill(0, 20);
  foodLayer.noStroke();
  foodLayer.rect(0, 0, width, height);

  for (let attractor of attractors) {
    attractor.discharge();
  }
}


function mousePressed() {
  let position = createVector(mouseX - bw, mouseY - bw)
  console.log(groupSettings)
  let group = new Group(position, 
    groupSettings.fillColorIndex,
    groupSettings.strokeColorIndex,
    groupSettings
  )
  groups.push(group);
}

function keyPressed() {
  if (key === 'p') {
    saveCanvas('plant', 'png');
  }
  
  if (key === 's') {
    exporting = true;
    let old_palette = palette_name;
    palette_name = "debug";
    palette = palettes[palette_name];
    redraw();
    palette_name = old_palette;
    palette = palettes[palette_name];
    exporting = false;
  }

  if (key === 'd') {
    generateHotspotsAndFlow();
    loop();
  }

  if( key === 'a'){
    show_slime = !show_slime
  }
  
}
  
