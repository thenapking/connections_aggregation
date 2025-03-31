class Agent {
  constructor(x, y, emitter) {
    this.position = createVector(x, y);
    this.angle = random(TWO_PI);
    this.assignedEmitter = emitter;
    this.path = [this.position.copy()];
    this.length = 0;
  }
  update() {
    let sensorLeft = p5.Vector.fromAngle(this.angle - SENSOR_ANGLE).setMag(SENSOR_DISTANCE).add(this.position);
    let sensorCenter = p5.Vector.fromAngle(this.angle).setMag(SENSOR_DISTANCE).add(this.position);
    let sensorRight = p5.Vector.fromAngle(this.angle + SENSOR_ANGLE).setMag(SENSOR_DISTANCE).add(this.position);
    let leftVal = this.sense(sensorLeft);
    let centerVal = this.sense(sensorCenter);
    let rightVal = this.sense(sensorRight);
    if (centerVal > leftVal && centerVal > rightVal) {
    } else if (leftVal > rightVal) {
      this.angle -= TURN_ANGLE;
    } else if (rightVal > leftVal) {
      this.angle += TURN_ANGLE;
    } else {
      this.angle += random(-TURN_ANGLE, TURN_ANGLE);
    }
    let oldPos = this.position.copy();
    let velocity = p5.Vector.fromAngle(this.angle).mult(STEP_SIZE);
    let newPos = p5.Vector.add(this.position, velocity);
    if (newPos.x < 0) { newPos.x = 0; this.angle = PI - this.angle; }
    if (newPos.x > width) { newPos.x = width; this.angle = PI - this.angle; }
    if (newPos.y < 0) { newPos.y = 0; this.angle = -this.angle; }
    if (newPos.y > height) { newPos.y = height; this.angle = -this.angle; }
    this.position = newPos;
    this.path.push(this.position.copy());
    this.length += p5.Vector.dist(oldPos, this.position);
    foodLayer.noStroke();
    foodLayer.fill(255, 50);
    foodLayer.ellipse(this.position.x, this.position.y, 2, 2);
  }
  sense(pos) {
    let c = foodLayer.get(floor(pos.x), floor(pos.y));
    return c[0];
  }
  checkEmitters() {
    for (let emitter of emitters) {
      if (emitter !== this.assignedEmitter) {
        let d = p5.Vector.dist(this.position, emitter.position);
        if (d < EMITTER_ASSIGN_DISTANCE) {
          this.updateJourney(emitter);
          this.assignedEmitter = emitter;
          this.path = [this.position.copy()];
          this.length = 0;
          break;
        }
      }
    }
  }
  updateJourney(newEmitter) {
    let existing = null;
    for (let conn of journeys) {
      if ((conn.emitterA === this.assignedEmitter && conn.emitterB === newEmitter) ||
          (conn.emitterA === newEmitter && conn.emitterB === this.assignedEmitter)) {
        existing = conn;
        break;
      }
    }
    if (existing == null) {
      let newConn = new Journey(this.assignedEmitter, newEmitter, this.path.slice(), this.length);
      newConn.count = 1;
      journeys.push(newConn);
    } else {
      existing.count++;
      if (this.length < existing.length) {
        existing.path = this.path.slice();
        existing.length = this.length;
      }
    }
  }
  draw() {
      fill(255);
      noStroke();
      ellipse(this.position.x, this.position.y, 2, 2);
  }
}


const SNAP_DISTANCE = 10; // maximum distance (in pixels) for an agent to be snapped to a journey

function getSnappedPoint(pos) {
  let bestDist = SNAP_DISTANCE;
  let bestPoint = null;
  // Iterate through each journey and each point along its path
  for (let conn of filtered_journeys) {
    for (let p of conn.path) {
      let d = p5.Vector.dist(pos, p);
      if (d < bestDist) {
        bestDist = d;
        bestPoint = p;
      }
    }
  }
  return bestPoint;
}
