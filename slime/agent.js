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

    deposit_food(this.group.id, this.position, 2);
  }

  sense(pos) {
    if(pos.x < 0 || pos.x >= w + 2*bw || pos.y < 0 || pos.y >= h + 2*bw) { return 0 }
    let c =  foodLayer[floor(pos.x)][floor(pos.y)]
    let total = 0;
    for(let group of slimegroups){
      total += c[group.id] * this.group.attraction[group.id];
    }
    return total || 0;
  }

  edges(){
    let previous_position = this.position.copy(); 

    if (this.position.x < HOTSPOT_MARGIN) {
      this.position.x = w - HOTSPOT_MARGIN; // Wrap to the right
    }
    if (this.position.x > w - HOTSPOT_MARGIN) {
      this.position.x = HOTSPOT_MARGIN; // Wrap to the left
    }
    if (this.position.y < HOTSPOT_MARGIN) {
      this.position.y = h - HOTSPOT_MARGIN; // Wrap to the bottom
    }
    if (this.position.y > h - HOTSPOT_MARGIN) {
      this.position.y = HOTSPOT_MARGIN; // Wrap to the top
    }

    if(previous_position.x !== this.position.x || previous_position.y !== this.position.y) {
      this.splitJourney(previous_position);
    }

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
    for (let journey of journeys) {
      if ((journey.emitterA === this.assignedEmitter && journey.emitterB === newEmitter) ||
          (journey.emitterA === newEmitter && journey.emitterB === this.assignedEmitter)) {
        existing = journey;
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

  splitJourney(previous_position) {
    let previous_emitter;
    let new_emitter;

    for(let other of emitters){
      let dist = p5.Vector.dist(this.position, other.position);
      if (dist < other.radius + EMITTER_ASSIGN_DISTANCE) {
        new_emitter = other;
        break;
      }
    }

    if (!new_emitter) {
      new_emitter = new Emitter(this.position.x, this.position.y, this.group);
      let attractor = new Attractor(this.position.x, this.position.y, 2);
      emitters.push(new_emitter);
      new_emitter.attractor = attractor;
    }

    for(let other of emitters){
      let dist = p5.Vector.dist(previous_position, other.position);
      if (dist < other.radius + EMITTER_ASSIGN_DISTANCE) {
        previous_emitter = other;
        break;
      }
    }

    if (!previous_emitter) {
      previous_emitter = new Emitter(previous_position.x, previous_position.y, this.group);
      let attractor = new Attractor(previous_position.x, previous_position.y, 2);
      emitters.push(previous_emitter);
      previous_emitter.attractor = attractor;
    }

    this.updateJourney(previous_emitter);
    this.assignedEmitter = new_emitter;
    this.path = [this.position.copy()];
    this.length = 0;
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

