const DPI = 96
let wi = 6;
let hi = 8;
let bwi = 1
let w = wi * DPI;
let h = hi * DPI;
let bw = bwi * DPI;


let u = 0.42
let t = 0;
let interval = 20;

let slimeagents = [];
let emitters = [];
let attractors = [];
let journeys = [];
let obstacles = [];
let groups = [];
let hotspots = [];
let connections = [];
let chains = [];  
let obstacles_grid; 

let filtered_journeys = [];
let median_journey_count = 0;
let top_journey_count = 0;  
let foodLayer;


const EMITTER_MARGIN = 30;
const OBSTACLE_MARGIN = 20; // distance between obstacles
const OBSTACLE_SPACING = 5; // distance between hotspots and obstacles
const AGENT_MARGIN_FACTOR = 8;
const AGENT_OBSTACLE_FACTOR = 1;

const SENSOR_ANGLE = Math.PI / 6;
const TURN_ANGLE = 0.3;

const SENSOR_DISTANCE = 10;
const STEP_SIZE = 1.5
const EMITTER_ASSIGN_DISTANCE = 5;
const OBSTACLE_DESTRUCTION_DISTANCE = 30;

// TO DO: both grids use the same cell size
// But the hotspot grid needs to be much finer to get the effect
// Should be proportional to the SENSOR DISTANCE and STEP SIZE
const CELL_SIZE = 20;

const PATH_DETAIL = 80;
const MIN_JOURNEYS_TO_DRAW = 10;

// higher values give a more abstract network
// perhaps we can combine high values for a large network, but with more detail in the paths?
// when there are obstacles, a high hotspot distance stops paths forming through the obstacles, 
// because they cannot bend round them

const MIN_HOTSPOT_DISTANCE = 10; 
const MIN_CONNECTION_ANGLE = 50;
const MAX_CONNECTION_ANGLE = 120;
const MIN_STROKE = 1;
const MAX_STROKE = 50;
const MIN_CHAIN_COUNT = 4;  
const MAX_CHAIN_COUNT = 50; 


const CSW = 2;

const NUM_SLIMEAGENTS = 30;
const NUM_EMITTERS = 100;
const NUM_ATTRACTORS = 1500
const NUM_OBSTACLES = 4000;



let show_slime = true
let show_emitters = true;
let show_obstacles = false;
let enable_slimeagents = false

let exporting = false;
let running = true
let debug = false;

let stroke_colour;
let paper;
let seed;

function setup() {
  seed = random(1000000);
  // seed = 348097.90726263414
  randomSeed(seed);
  noiseSeed(seed);
  console.log("Seed: " + seed);

  createCanvas(w + 2*bw, h + 2*bw);
  paper = createGraphics(w + 2*bw, h + 2*bw);

  w = w / u
  h = h / u 
  bw = bw / u

  

  pixelDensity(2);

  stroke_colour = palette.black

  create_noise_field()
  create_food();
  create_map();

  setup_gui();

}


function draw() {
  if(!running) { noLoop(); }
  if(exporting){ beginRecordSVG(this, 'flower_agents.svg') }
  
  image(paper, 0, 0);

  scale(u)
  translate(bw, bw);

  update_slimeagents();

  let update_fixtures = t % interval == 0;
 
  draw_groups(palette.depth[0], true);

  if(update_fixtures){
    add_obstacles_to_grid();  
  }

  push();
    draw_obstacles();
    draw_attractors();
    draw_emitters();

  pop();
  
  push();
    draw_journeys();
    draw_hotspots();
    draw_chains();
    draw_slimeagents();
  pop();

  
  delete_empty_groups();

  if(exporting){ 
    endRecordSVG() 
    exporting = false;
  }

  if(update_fixtures && enable_slimeagents){
    generateHotspotsAndFlow();
    if(t % (interval * 4) == 0){
      remove_intersecting_agents();
      create_emitters_from_foodlayer()
    }
  }

  t++;
}

function create_slimeagents(){
  remove_intersecting_agents();
  emitters = [];
  console.log("Creating emitters");
  create_emitters(w, h);
  add_obstacles_to_grid();

  for (let emitter of emitters) {
    for (let i = 0; i < NUM_SLIMEAGENTS; i++) {
      slimeagents.push(new SlimeAgent(emitter.position.x, emitter.position.y, emitter));
    }
  }

  enable_slimeagents = true;
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
  if(!show_obstacles) return;

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
  emitters = [];
  hotspots = [];
  connections = [];
  journeys = [];
  filtered_journeys = [];
  chains = [];
  foodLayer.clear();
  foodLayer.background(0);
  enable_slimeagents  = false;

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
  let position = createVector(mouseX/u - bw, mouseY/u - bw)
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

  let keys = Object.keys(paper_palettes)

  if (key == '+' || key == '=') {
    paper_palette_name = keys[(keys.indexOf(paper_palette_name) + 1) % keys.length]
    paper_palette = paper_palettes[paper_palette_name]
    console.log(paper_palette_name)
    create_map();
    redraw();
  } else if (key == '-' || key == '_') {
    paper_palette_name = keys[(keys.indexOf(paper_palette_name) - 1 + keys.length) % keys.length]
    paper_palette = paper_palettes[paper_palette_name]

    console.log(paper_palette_name)
    create_map();
    redraw();
  }
  
}
  
