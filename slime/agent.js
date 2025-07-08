class SlimeAgent {
  constructor(x, y, emitter, group) {
    this.position = createVector(x, y);
    this.angle = random(TWO_PI);
    this.assignedEmitter = emitter;
    this.path = [this.position.copy()];
    this.length = 0;
    this.group = group;
  }

  update() {
    this.set_angle();

    let previous = this.position.copy();
    
    let velocity = p5.Vector.fromAngle(this.angle).mult(this.group.stepSize);
    this.position = p5.Vector.add(this.position, velocity);
  

    this.edges();

    this.path.push(this.position.copy());

    this.length += p5.Vector.dist(previous, this.position);

    deposit_food(this.group.id, this.position, 2/u);
  }

  sense(pos) {
    if(pos.x < 0 || pos.x >= w + 2*bw || pos.y < 0 || pos.y >= h + 2*bw) { return 0 }

    let c = foodLayer[floor(pos.x)][floor(pos.y)][this.group.id];
    return c || 0;
  }

  edges(){
    if (this.position.x <     HOTSPOT_MARGIN) { this.position.x =     HOTSPOT_MARGIN; this.angle = PI - this.angle; }
    if (this.position.x > w - HOTSPOT_MARGIN) { this.position.x = w - HOTSPOT_MARGIN; this.angle = PI - this.angle; }
    if (this.position.y <     HOTSPOT_MARGIN) { this.position.y =     HOTSPOT_MARGIN; this.angle = -this.angle; }
    if (this.position.y > h - HOTSPOT_MARGIN) { this.position.y = h - HOTSPOT_MARGIN; this.angle = -this.angle; }
    let col = constrain(floor(this.position.x / (resolution * u)), 0 , cols - 1);
    let row = constrain(floor(this.position.y / (resolution * u)), 0 , rows - 1);
    let v = values[col][row];

    if(v > WATER_LEVEL){
      this.reset_position();
    }

    for(let park of parks){
      if(park.inside(this.position, 0, 0)) {
        this.reset_position();
      };
    }

  }

  reset_position(){
    this.position.x = this.assignedEmitter.position.x + random(-10, 10);
    this.position.y = this.assignedEmitter.position.y + random(-10, 10);
    this.angle = random(TWO_PI);
    this.path = [this.position.copy()];
    this.length = 0;
  }

  set_angle(){
    let sensorLeft = p5.Vector.fromAngle(this.angle - this.group.sensorAngle).setMag(this.group.sensorDistance).add(this.position);
    let sensorCenter = p5.Vector.fromAngle(this.angle).setMag(this.group.sensorDistance).add(this.position);
    let sensorRight = p5.Vector.fromAngle(this.angle + this.group.sensorAngle).setMag(this.group.sensorDistance).add(this.position);
    let leftVal = this.sense(sensorLeft);
    let centerVal = this.sense(sensorCenter);
    let rightVal = this.sense(sensorRight);

    if (centerVal > leftVal && centerVal > rightVal) {
    } else if (leftVal > rightVal) {
      this.angle -= this.group.turnAngle;
    } else if (rightVal > leftVal) {
      this.angle += this.group.turnAngle;
    } else {
      this.angle += random(-this.group.turnAngle, this.group.turnAngle);
    }

    this.angle += this.avoid();
  }

  check() {
    for (let emitter of emitters) {
      if (emitter !== this.assignedEmitter) {
        let d = p5.Vector.dist(this.position, emitter.position);
        if (d < emitter.radius + EMITTER_ASSIGN_DISTANCE) {
          this.updateJourney(emitter);
          this.assignedEmitter = emitter;
          this.path = [this.position.copy()];
          this.length = 0;
          break;
        }
      }
    }
  }

  avoid() {
    let adjustment = 0;
    let count = 0;
    let margin = 10; // safety margin
    let i = floor(this.position.x / CELL_SIZE);
    let j = floor(this.position.y / CELL_SIZE);
    let neighbours = obstacles_grid.neighbours(i, j);
    
    for (let obs of neighbours) {
      let d = p5.Vector.dist(this.position, obs.position);
      if (d < obs.radius + margin) {
        let desiredAngle = atan2(this.position.y - obs.position.y, this.position.x - obs.position.x);
        let diff = desiredAngle - this.angle;
        while (diff < -PI) diff += TWO_PI;
        while (diff > PI) diff -= TWO_PI;
        adjustment += diff;
        count++;
      }
    }
    if (count > 0) {
      adjustment /= count;
      adjustment *= 0.5; // scale down the obstacle avoidance influence
      return adjustment;
    }
    return 0;
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
      let newConn = new Journey(this.assignedEmitter, newEmitter, this.path.slice(), this.length, this.group);
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
    let c = this.group.colour || 'black'
    fill(c);
    noStroke();
    ellipse(this.position.x, this.position.y, 4, 4);
  }
}

function deposit_food(layer_id, position, radius) {
  let x0 = floor(position.x)
  let y0 = floor(position.y);
  let r =   floor(radius);
  for(let i = -r; i <= r; i++) {
    let x = x0 + i;
    for(let j = -r; j <= r; j++) {
      let y = y0 + j;
      foodLayer[x][y][layer_id]++;
    }
  }
}

