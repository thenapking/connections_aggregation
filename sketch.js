const DPI = 96
let wi = 9.5;
let hi = 12.75;
let bwi = 1;
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
const AGENT_MARGIN_FACTOR = 16;
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
const CELL_SIZE = 10;

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
const NUM_EMITTERS = 50;
const NUM_ATTRACTORS = 1500
const NUM_OBSTACLES = 0;


let show_major_routes = false;
let show_slime = true
let show_emitters = false;
let show_obstacles = false;
let show_hotspots = false;
let enable_slimeagents = true

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
  // seed = 631107.3191591513
  // seed = 943595.245785884
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

  create_slimeagents();

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

    draw_connections();
    // draw_chains(tube_chains, 10, palette.colours[2]);
    draw_hotspots();

    draw_slimeagents();
  pop();

  
  delete_empty_groups();

  if(exporting){ 
    endRecordSVG() 
    exporting = false;
  }

  if(update_fixtures && enable_slimeagents){
    hotspots = [];
    connections = [];
    create_hotspots(slimegroups[0]);
    create_hotspots(slimegroups[1]);

    if(t % (interval * 4) == 0){
      create_emitters_from_foodlayer()
    }
  }

  t++;
  noLoop;
}

let group_a, group_b, slimegroups = []
function create_slimeagents(){
  remove_intersecting_agents();
  emitters = [];
  console.log("Creating emitters");
  create_emitters(w, h);
  add_obstacles_to_grid();

  // ID, stepSize, sensorAngle, sensorDistance, turnAngle, colour, hotspot proximity
  // original 1.5, PI / 6. 10, 0.3
  
  group_a = new SlimeGroup(0, 3,  0.53, 25, 0.07, 'red', 40)
  group_b = new SlimeGroup(1, 20, 1.06, 50, 0.07, 'blue', 100)

  group_a.setAttraction(group_a.id,  1);
  group_a.setAttraction(group_b.id, -1);

  group_b.setAttraction(group_a.id, -1);
  group_b.setAttraction(group_b.id,  1);

  slimegroups.push(group_a);
  slimegroups.push(group_b);

  for(let group of slimegroups){
    for (let emitter of emitters) {
      for (let i = 0; i < NUM_SLIMEAGENTS; i++) {
        slimeagents.push(new SlimeAgent(emitter.position.x, emitter.position.y, emitter, group));
      }
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

function draw_chains(chains, sw = 4, c = palette.black) {
  push()
  for (let chain of chains) {
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

function create_food(n_layers = 2){
  foodLayer = []
  for(let i = 0; i < w + 2*bw; i++){
    foodLayer[i] = [];
    for(let j = 0; j < h + 2*bw; j++){
      foodLayer[i][j] = [];
      for(let k = 0; k < n_layers; k++){
        foodLayer[i][j][k] = 0;
      }
    }
  }
}

function delete_slimeagents(){
  slimeagents = [];
  emitters = [];
  hotspots = [];
  connections = [];
  journeys = [];
  filtered_journeys = [];
  road_chains = [];
  create_food();
  enable_slimeagents  = false;

}

function add_food(){
  for (let attractor of attractors) {
    attractor.discharge();
  }
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
  } else if (key == 'x') {
    saveJSON(connections, 'connections.json');
    saveJSON(emitters, 'emitters.json');
    saveJSON(hotspots, 'hotspots.json');
    saveJSON(journeys, 'journeys.json');
    saveJSON(groups, 'groups.json');


  }
  
}
  
