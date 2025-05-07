function create_map(){
  paper.background(paper_palette.background);

  paper.push()
    paper.scale(u);
    paper.translate(bw, bw);
    draw_contours();
  paper.pop()

  paper.push()
    paper.scale(u);
    paper.translate(bw, bw);
    draw_grid();
  paper.pop()



  paper.push()
    // paper_texture();
  paper.pop();
}

function draw_grid(){
  paper.push()
    for(let i = 0; i < wi + 1; i++){
      paper.stroke(paper_palette.black)
      let sw = i%2 == 0 ? 0.75 : 0.25;
      paper.strokeWeight(sw/u);
      paper.line(0, 0, 0, h);
      paper.translate(DPI/u, 0)
    }
  paper.pop()

  paper.push()
    for(let j = 0; j < hi + 1; j++){
      paper.stroke(paper_palette.black)
      let sw = j%2 == 0 ? 0.75 : 0.25;
      paper.strokeWeight(sw/u);
      paper.line(0, 0, w, 0);
      paper.translate(0, DPI/u)
    }
  paper.pop()
}


function paper_texture() {
  // This function is based on the code from:
  // Kink by Pixel Symphony https://www.fxhash.xyz/generative/slug/kink

  const segments = Math.floor(random(0.1*w, 0.3*w))
  const segment_w = width / segments;
  const grain_density = random(1.2,1.6) / u;
  const angle = random(-0.05,  0.05)

  
  let grain_colour = color(paper_palette.white);
  grain_colour.setAlpha(paper_palette.strength);
  paper.stroke(grain_colour);
  paper.noFill();

  for (let i = 0; i < height; i += grain_density) {
    let x1 = Math.random(w);
    
    let y1 = max_from_min(i + width * Math.tan(angle), height)
    
    for (let j = 1; j <= segments; j++) {
      let x2 = random_point_from(x1);
      let y2 = random_point_from(y1);

      let x4 = j * segment_w;
      let y4 = i;

      let x3 = random_point_from(x4);
      let y3 = max_from_min(i + random_point_from(), height);

      paper.bezier(x1, y1, x2, y2, x3, y3, x4, y4)
      x1 = x4;
      y1 = y4;
    }
  }
}

function random_point_from(z = 0){
  const curviness = 20; // from 2 to 25
  return z + random(-curviness, curviness);
}

function max_from_min(a,b){
  return Math.max(Math.min(a, b), 0);
}


const isoStep = 0.015;       // Contour step (0–1 scale)
const noiseScale = 0.0005;    // Perlin noise scale (detail level)
const resolution = 10;        // Grid cell size in pixels
const simplifyTolerance = 0.1; // Tolerance for simplify-js (higher = smoother)
let cols, rows; // Number of columns and rows in the grid
let values = []; // 2D array to hold noise values 
let grouped_values = {}; // Object to hold grouped noise values
let min_threshold = 1.0; // Minimum threshold for noise values
let max_threshold = 0.0; // Maximum threshold for noise values
let WATER_LEVEL;
function create_noise_field(){
  cols = floor(w / (resolution * u)) + 1;
  rows = floor(h / (resolution * u)) + 1;

  for (let i = 0; i < cols; i++) {
    values[i] = [];
    
    for (let j = 0; j < rows; j++) {
      let x = i * resolution * noiseScale;
      let y = j * resolution * noiseScale;
      let v = fbm(x, y) ;

      let k = Math.floor(v*100)/100
      
      values[i][j] = v
      
      if(!grouped_values[k]) { grouped_values[k] = 0}
      grouped_values[k]++;
      min_threshold = min(min_threshold, v);
      max_threshold = max(max_threshold, v);
    }
  }

  let keys = Object.keys(grouped_values);
  keys = keys.map(str => parseFloat(str)).sort((a, b) => a - b);
  WATER_LEVEL = keys[Math.floor(keys.length * 0.5)];
  console.log("Water level: " + WATER_LEVEL);
  create_flow_field();

}

function fbm(x, y, octaves=5) {
  let sum = 0, amp = 1, freq = 1
  for (let i = 0; i < octaves; i++) {
    sum   += amp * noise(x * freq, y * freq);
    freq  *= 1.5; // was 2
    amp   *= 0.5;
  }
  return sum;
}

function draw_contours(){
  paper.strokeWeight(2/u)
  let contour_colour = color(paper_palette.white);
  paper.strokeCap(SQUARE)
  paper.noFill();
  paper.scale(u) //why twice?

  for (let t = 0; t <= WATER_LEVEL; t += isoStep) {
    let segments = marchingSquares(values, cols, rows, resolution, t);
    for(let segment of segments){
      let alpha = paper_palette.strength * map(t, min_threshold, max_threshold, 10, 20);
      contour_colour.setAlpha(alpha);
      paper.stroke(contour_colour);
      paper.line(segment[0].x, segment[0].y, segment[1].x, segment[1].y);
    };
  }
}


function getIntersection(x1, y1, v1, x2, y2, v2, threshold) {
  let t = (threshold - v1) / (v2 - v1);
  return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
}

function marchingSquares(grid, cols, rows, resolution, threshold) {
  let segments = [];
  for (let i = 0; i < cols - 1; i++) {
    for (let j = 0; j < rows - 1; j++) {
      let vTL = grid[i][j];
      let vTR = grid[i+1][j];
      let vBR = grid[i+1][j+1];
      let vBL = grid[i][j+1];

      let tl = vTL > threshold ? 1 : 0;
      let tr = vTR > threshold ? 1 : 0;
      let br = vBR > threshold ? 1 : 0;
      let bl = vBL > threshold ? 1 : 0;
      let state = tl*8 + tr*4 + br*2 + bl;

      let x = i * resolution;
      let y = j * resolution;
      let top = null, right = null, bottom = null, left = null;

      if ((vTL - threshold)*(vTR - threshold) < 0) {
        top = getIntersection(x, y, vTL, x+resolution, y, vTR, threshold);
      }
      if ((vTR - threshold)*(vBR - threshold) < 0) {
        right = getIntersection(x+resolution, y, vTR, x+resolution, y+resolution, vBR, threshold);
      }
      if ((vBL - threshold)*(vBR - threshold) < 0) {
        bottom = getIntersection(x, y+resolution, vBL, x+resolution, y+resolution, vBR, threshold);
      }
      if ((vTL - threshold)*(vBL - threshold) < 0) {
        left = getIntersection(x, y, vTL, x, y+resolution, vBL, threshold);
      }

      switch (state) {
        case 1: case 14:
          segments.push([left, bottom]); break;
        case 2: case 13:
          segments.push([bottom, right]); break;
        case 3: case 12:
          segments.push([left, right]); break;
        case 4: case 11:
          segments.push([top, right]); break;
        case 5:
          segments.push([top, left]);
          segments.push([bottom, right]); break;
        case 6: case 9:
          segments.push([top, bottom]); break;
        case 7: case 8:
          segments.push([top, left]); break;
        case 10:
          segments.push([top, right]);
          segments.push([bottom, left]); break;
        // states 0 and 15 produce no segment
      }
    }
  }
  return segments;
}

// TODO get WATER_LEVEL the right way up
function below_water_level(position){
  let col = constrain(floor(position.x / (resolution * u)), 0 , cols - 1);
  let row = constrain(floor(position.y / (resolution * u)), 0 , rows - 1);
  let v = values[col][row];
  return v > WATER_LEVEL
}

function above_water_level(position){
  !below_water_level(position)
}

let flow_values = [];  
let max_fv = 0, min_fv = Infinity ;
function create_flow_field() {
  flow_values = [];
  for (let i = 0; i < cols; i++) {
    flow_values[i] = [];
    for (let j = 0; j < rows; j++) {
      let left  = values[max(i-1,0)][j];
      let right = values[min(i+1,cols-1)][j];
      let top   = values[i][max(j-1,0)];
      let bot   = values[i][min(j+1,rows-1)];

      // gradient ∇f = (df/dx, df/dy)
      let dfdx = (right - left)  / (2 * resolution * u);
      let dfdy = (bot   - top)   / (2 * resolution * u);

      // rotate by +90° to get tangent (or –90° depending on direction you prefer)
      // [tx, ty] = normalize( [-dfdy, dfdx] )
      let tx = -dfdy;
      let ty =  dfdx;
      let mag = sqrt(tx*tx + ty*ty) || 1;

      flow_values[i][j] = createVector(tx/mag, ty/mag).rotate(HALF_PI).heading();
    }
  }
}
