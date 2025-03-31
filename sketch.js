// --- Global Variables and Constants ---
let agents = [];
let emitters = [];
let attractors = [];
let connections = [];
let foodLayer;

const SENSOR_ANGLE = Math.PI / 6; // 30° sensor offset angle
const SENSOR_DISTANCE = 60;       // distance from agent for sensing
const TURN_ANGLE = 0.3;           // how much the agent turns when a sensor is stronger
const STEP_SIZE = 2.5;            // movement step per frame
const EMITTER_ASSIGN_DISTANCE = 20;  // distance threshold to switch emitters
const MIN_JOURNEYS_TO_DRAW = 3;   // minimum journey count required to draw a connection
let numEmitters = 15;
// --- p5.js Setup ---
function setup() {
  createCanvas(800, 600);
  // Create an off-screen graphics buffer for the food map
  foodLayer = createGraphics(width, height);
  foodLayer.background(0);
  
  // Create several attractors (which add food to the food map)
  let numAttractors = 500;
  for (let i = 0; i < numAttractors; i++) {
    let x = random(width);
    let y = random(height);
    attractors.push(new Attractor(x, y));
  }
  
  // Create a small random number of emitters (2 to 4)
  
  for (let i = 0; i < numEmitters; i++) {
    let x = random(width);
    let y = random(height);
    emitters.push(new Emitter(x, y));
  }
  
  // Create agents at each emitter (10 per emitter, for example)
  let agentsPerEmitter = 200;
  for (let emitter of emitters) {
    for (let i = 0; i < agentsPerEmitter; i++) {
      agents.push(new Agent(emitter.position.x, emitter.position.y, emitter));
    }
  }
}

// --- p5.js Draw ---
function draw() {
  background(51);
  
  // Fade the food map slightly for a decay/diffusion effect
  foodLayer.fill(0, 20);
  foodLayer.noStroke();
  foodLayer.rect(0, 0, width, height);
  
  // Each attractor deposits food and draws itself
  for (let attractor of attractors) {
    attractor.addFood();
    // attractor.draw();
  }

  for (let emitter of emitters) {
    emitter.addFood();
    emitter.draw();
  }
  
  
  // Update and draw agents
  for (let agent of agents) {
    agent.update();
    agent.checkEmitters();
    // agent.draw();
  }
  
  // Draw connections only if they've been traversed enough times
  connections.sort((a, b) => b.journeyCount - a.journeyCount);
  // connections.sort((a, b) => a.path.length - b.path.length);
  for (let i = connections.length; i > floor(connections.length *0.06); i--){ 
    conn = connections[i];
    if(conn){
      conn.draw(i, connections.length);
    }
  }

  
  // (Optional: For debugging you can display the foodLayer)
  // image(foodLayer, 0, 0);
}

// --- Attractor Class ---
class Attractor {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.radius = 5;
  }
  // Add food to the food map at the attractor's location
  addFood() {
    foodLayer.noStroke();
    foodLayer.fill(255, 100);
    foodLayer.ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
  // Draw the attractor on the main canvas
  draw() {
    fill(255, 0, 0);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
}

// --- Emitter Class ---
class Emitter {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.radius = 10;
  }

  addFood() {
    foodLayer.noStroke();
    foodLayer.fill(255, 1);
    foodLayer.ellipse(this.position.x, this.position.y, this.radius * 16, this.radius * 16);
  }
  // (Optional) Draw the emitter as a blue circle
  draw() {
    fill(0, 0, 255);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
}

// --- Agent Class ---
class Agent {
  constructor(x, y, emitter) {
    this.position = createVector(x, y);
    this.angle = random(TWO_PI);
    this.assignedEmitter = emitter;
    this.path = [this.position.copy()];
    this.pathLength = 0;
  }
  
  update() {
    // Determine sensor positions (left, center, right)
    let sensorLeft = p5.Vector.fromAngle(this.angle - SENSOR_ANGLE).setMag(SENSOR_DISTANCE).add(this.position);
    let sensorCenter = p5.Vector.fromAngle(this.angle).setMag(SENSOR_DISTANCE).add(this.position);
    let sensorRight = p5.Vector.fromAngle(this.angle + SENSOR_ANGLE).setMag(SENSOR_DISTANCE).add(this.position);
    
    // Get food values from the food map at sensor positions (using red channel)
    let leftVal = this.sense(sensorLeft);
    let centerVal = this.sense(sensorCenter);
    let rightVal = this.sense(sensorRight);
    
    // Adjust heading based on sensor readings
    if (centerVal > leftVal && centerVal > rightVal) {
      // Continue straight
    } else if (leftVal > rightVal) {
      this.angle -= TURN_ANGLE;
    } else if (rightVal > leftVal) {
      this.angle += TURN_ANGLE;
    } else {
      // If equal, add a slight random turn
      this.angle += random(-TURN_ANGLE, TURN_ANGLE);
    }
    
    // Move forward and bounce off edges if necessary
    let oldPos = this.position.copy();
    let velocity = p5.Vector.fromAngle(this.angle).mult(STEP_SIZE);
    let newPos = p5.Vector.add(this.position, velocity);
    
    // Bounce off left/right edges
    if (newPos.x < 0) {
      newPos.x = 0;
      this.angle = PI - this.angle;
    }
    if (newPos.x > width) {
      newPos.x = width;
      this.angle = PI - this.angle;
    }
    // Bounce off top/bottom edges
    if (newPos.y < 0) {
      newPos.y = 0;
      this.angle = -this.angle;
    }
    if (newPos.y > height) {
      newPos.y = height;
      this.angle = -this.angle;
    }
    
    this.position = newPos;
    
    // Record the path and update total distance traveled
    this.path.push(this.position.copy());
    this.pathLength += p5.Vector.dist(oldPos, this.position);
    
    // Deposit food at the current position onto the food map
    foodLayer.noStroke();
    foodLayer.fill(255, 50);
    foodLayer.ellipse(this.position.x, this.position.y, 2, 2);
  }
  
  // Sample the food value at a given position
  sense(pos) {
    // Using floor to ensure valid pixel indices
    let c = foodLayer.get(floor(pos.x), floor(pos.y)); // returns [r, g, b, a]
    return c[0]; // use the red channel as the food level
  }
  
  // Check for nearby emitters and update emitter assignment if within threshold
  checkEmitters() {
    for (let emitter of emitters) {
      if (emitter !== this.assignedEmitter) {
        let d = p5.Vector.dist(this.position, emitter.position);
        if (d < EMITTER_ASSIGN_DISTANCE) {
          this.updateConnection(emitter);
          // Switch assignment and reset the path for a new journey
          this.assignedEmitter = emitter;
          this.path = [this.position.copy()];
          this.pathLength = 0;
          break; // only update one emitter per frame
        }
      }
    }
  }
  
  // When switching emitters, update the connection between the old and new emitters
  updateConnection(newEmitter) {
    // Look for an existing connection (order does not matter)
    let existing = null;
    for (let conn of connections) {
      if ((conn.emitterA === this.assignedEmitter && conn.emitterB === newEmitter) ||
          (conn.emitterA === newEmitter && conn.emitterB === this.assignedEmitter)) {
        existing = conn;
        break;
      }
    }
    if (existing == null) {
      // No connection yet – create one using the current path
      let newConn = new Connection(this.assignedEmitter, newEmitter, this.path.slice(), this.pathLength);
      newConn.journeyCount = 1; // start journey count
      connections.push(newConn);
    } else {
      // Update journey count and, if the new path is shorter, update the connection
      existing.journeyCount++;
      if (this.pathLength < existing.pathLength) {
        existing.path = this.path.slice();
        existing.pathLength = this.pathLength;
      }
    }
  }
  
  // Draw the agent as a 4px white circle
  draw() {
    fill(255);
    noStroke();
    ellipse(this.position.x, this.position.y, 4, 4);
  }
}

// --- Connection Class ---
class Connection {
  constructor(emitterA, emitterB, path, pathLength) {
    this.emitterA = emitterA;
    this.emitterB = emitterB;
    this.path = path;
    this.pathLength = pathLength;
    this.journeyCount = 0; // count how many journeys have used this connection
    this.simple_path = this.simplifyPath();
  }

  simplifyPath(){
    return simplify(this.path, 15, false);
  }
  
  // Draw the connection path as a green line (polyline)
  draw(i, n) {
    let sw = 0.125 * i**2 / n;
    stroke(0, 255 * sw * 2, 0);
    strokeWeight(sw);
    noFill();
    beginShape();
    vertex(this.emitterA.position.x, this.emitterA.position.y);
    for (let p of this.simple_path) {
      curveVertex(p.x, p.y);
    }
    vertex(this.emitterB.position.x, this.emitterB.position.y);
    endShape();
  }
}
