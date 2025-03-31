class Agent {
  constructor(x, y, emitter) {
    this.position = createVector(x, y);
    this.angle = random(TWO_PI);
    this.assignedEmitter = emitter;
    this.path = [this.position.copy()];
    this.length = 0;
  }

  update() {
    this.set_angle();

    let previous = this.position.copy();
    let velocity = p5.Vector.fromAngle(this.angle).mult(STEP_SIZE);
    
    this.position = p5.Vector.add(this.position, velocity);;
    this.edges();

    this.path.push(this.position.copy());

    this.length += p5.Vector.dist(previous, this.position);

    deposit_food(this.position, 2);
  }

  sense(pos) {
    let c = foodLayer.get(floor(pos.x), floor(pos.y));
    return c[0];
  }

  edges(){
    if (this.position.x < 0) { this.position.x = 0; this.angle = PI - this.angle; }
    if (this.position.x > width) { this.position.x = width; this.angle = PI - this.angle; }
    if (this.position.y < 0) { this.position.y = 0; this.angle = -this.angle; }
    if (this.position.y > height) { this.position.y = height; this.angle = -this.angle; }

  }

  set_angle(){
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
  }

  check() {
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

function deposit_food(position, radius) {
  foodLayer.noStroke();
  foodLayer.fill(255, 50);
  foodLayer.ellipse(position.x, position.y, radius);
}

