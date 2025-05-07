const DPI = 96
let wi = 6;
let hi = 8;
let bwi = 1
let w = wi * DPI;
let h = hi * DPI;
let bw = bwi * DPI;


let u = 0.5 //0.42
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
let road_chains = [];  
let tube_chains = [];
let obstacles_grid; 

let filtered_journeys = [];
let median_journey_count = 0;
let top_journey_count = 0;  
let foodLayer;


const EMITTER_MARGIN = 30;
const OBSTACLE_MARGIN = 20; // distance between obstacles
const OBSTACLE_SPACING = 5; // distance between hotspots and obstacles
const HOTSPOT_MARGIN = 40 / u; // distance between border and hotspots
const AGENT_MARGIN_FACTOR = 1/2;
const AGENT_OBSTACLE_FACTOR = 1;
const PARK_MARGIN = 100 / u;

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
const MIN_CONNECTION_ANGLE = 60;
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


let show_major_routes = false;
let show_slime = false
let show_emitters = false;
let show_obstacles = false;
let show_hotspots = false;
let enable_slimeagents = false

let exporting = false;
let running = true
let debug = false;

let stroke_colour;
let paper;
let hatchBuffer;
let seed;

function setup() {
  seed = random(1000000);
  // seed = 475648.5161106501
  // seed = 348097.90726263414
  // seed = 973226.451118719
  // seed = 393616.97942586313
  // seed = 84609.98579586975
  // seed = 1599.153869747849
  // seed = 61328.402068553056
  // seed = 148542.22929977023
  seed = 631107.3191591513
  randomSeed(seed);
  noiseSeed(seed);
  console.log("Seed: " + seed);

  createCanvas(w + 2*bw, h + 2*bw);
  paper = createGraphics(w + 2*bw, h + 2*bw);
  hatchBuffer = createGraphics(2*w + 2*bw, 2*h + 2*bw);
  hatchBuffer.pixelDensity(1);
  hatchBuffer.scale(u);
  
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
  draw_groups(palette.depth[1], true);
  draw_groups(palette.depth[2], true);
  draw_groups(palette.depth[3], true);
  draw_groups(palette.depth[4], true);
  draw_groups(palette.depth[5], true);

  if(update_fixtures){
    add_obstacles_to_grid();  
  }

  push();
    draw_obstacles();
    draw_attractors();
    draw_emitters();

  pop();
  
  push();
    // draw_journeys();
    // draw_chains();
    draw_chains(road_chains);
    // draw_chains(tube_chains);
    draw_hotspots();

    draw_slimeagents();
  pop();

  
  delete_empty_groups();

  if(exporting){ 
    endRecordSVG() 
    exporting = false;
  }

  if(update_fixtures && enable_slimeagents){
    create_hotspots();
    if(t % (interval * 4) == 0){
      remove_intersecting_agents();
      create_emitters_from_foodlayer()
    }

    if(t % (interval * 16) == 0){
      build_tube_network();
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
  if(!show_slime) return;
  if(!enable_slimeagents) return;

  push()
  for (let slimeagent of slimeagents) {
    slimeagent.draw();
  }
  pop()
}

function draw_journeys() {
  if(hotspots.length > 0) return;
  
  push()
  for (let journey of filtered_journeys) {
    journey.draw();
  }
  pop()
}

function draw_hotspots() {
  if(!show_hotspots) return;

  push()
  for (let hotspot of hotspots) {
    hotspot.draw();
  }
  pop()
}

function draw_emitters() {
  if(!show_emitters) return;

  push()
  for (let emitter of emitters) {
    emitter.draw();
  }
  pop()
}

function draw_connections(){
  push()
  for (let connection of connections) {
    connection.draw()
  }
  pop()
}

function draw_chains(chains) {
  push()
  for (let chain of chains) {
    let c = paper_palette.black
    let sw = 4

    
    chain.draw(c, sw);
  }
  pop()
}

function draw_attractors() {
  if(!debug) { return; }
  push()
  for (let attractor of attractors) {
    attractor.draw();
  }
  pop()
}

function draw_obstacles() {
  if(!show_obstacles) return;

  push()
  for (let obstacle of obstacles) {
    obstacle.draw();
  }
  pop()
}

function draw_parks() {
  push()
  for (let park of parks) {
    park.draw();
  }
  pop()
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
  road_chains = [];
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
  group.id = groups.length - 1;
  console.log("group: ", group.id, "created at: ", position.x, position.y)
  console.log(groupSettings)

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
  
