/* agent.js */
class Agent {
  constructor(position, direction, theta, radius, n, group, depth = 0, options) {
    this.position = position.copy();
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(0, 0);

    this.direction = direction; // an angle in radians, not a vector
    this.max_direction_change = PI/2;
    this.theta = theta;         
    this.radius = radius;      
    this.depth = depth;         
    this.n = n; 
    this.children = [];   
    this.group = group;
    this.enable_separation = options.enable_separation;
    this.enable_resize = options.enable_resize;

    this.enable_alignment = options.enable_alignment;
    this.enable_obstacles = options.enable_obstacles;
    this.noiseScale = options.noiseScale;
    this.minSize = options.minAgentSize;
    this.maxSize = options.maxAgentSize;
    this.maxForce = 0.25;
    this.maxSpeed = 2;
    this.initialize();
    this.active = true;
    this.outside = false;
  }

  initialize(){
    if(this.enable_obstacles){
      let obstacle = new Obstacle(this.position, this.radius, this.group, this);
      this.obstacle = obstacle;
      obstacles.push(obstacle);
    }
    this.resize();
  }

  applyForce(force, m = 1) {
    force.mult(m);
    this.acceleration.add(force);
  }

  applyAlignment(delta) {
    let new_direction = this.direction + delta;
    let col = constrain(floor(this.position.x / (resolution * u)), 0 , cols);
    let row = constrain(floor(this.position.y / (resolution * u)), 0 , rows);
    let fv = flow_values[col][row];
    
    new_direction = constrain(new_direction, fv - PI/8, fv + PI/8);
    if(Math.abs(this.direction - new_direction) < this.max_direction_change){
      this.direction = new_direction;
    }
  }
  
  update() {
    this.edges();
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
    this.velocity.mult(0.95);
    if (this.velocity.mag() < 0.001) {
      this.active = false;
      this.velocity.mult(0);
    }
  }

  edges(){
    if (this.position.x - this.radius < 0) { this.outside = true }
    if (this.position.x + this.radius > w) { this.outside = true  }
    if (this.position.y - this.radius < 0) { this.outside = true  }
    if (this.position.y + this.radius > h) { this.outside = true  }

    let col = constrain(floor(this.position.x / (resolution * u)), 0 , cols - 1);
    let row = constrain(floor(this.position.y / (resolution * u)), 0 , rows - 1);
    let v = values[col][row];
    if(v > WATER_LEVEL){
      this.outside = true;
    }

    for(let park of parks){
      if(park.inside(this.position, 0, 0)) { this.outside = true };
    }
  }

  resize() {
    if(!this.enable_resize){ return }

    let nz = noise(this.position.x * this.noiseScale, this.position.y * this.noiseScale);
    this.radius = lerp(this.minSize, this.maxSize, nz);
    this.obstacle.radius = this.radius * AGENT_OBSTACLE_FACTOR;
  }

  separation(agents) {
    if(!this.enable_separation){ return createVector(0, 0) }

    let steer = createVector(0, 0);
    let count = 0;
    for (let other of agents) {
      if (other !== this) {
        let d = p5.Vector.dist(this.position, other.position);
        let col = constrain(floor(this.position.x / (resolution * u)), 0 , cols - 1);
        let row = constrain(floor(this.position.y / (resolution * u)), 0 , rows - 1);
        let v = values[col][row];
        let factor = map(v, 0, 1, AGENT_MARGIN_FACTOR/8, AGENT_MARGIN_FACTOR*2);
        if (d < (this.radius + other.radius + 0.01)*factor) { 
          let diff = p5.Vector.sub(this.position, other.position);
          diff.normalize();
          diff.div(d);
          steer.add(diff);
          count++;
        }
      }
    }
    if (count > 0) {
      steer.div(count);
      steer.setMag(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
      return steer;
    } else {
      let stop = this.velocity.copy().mult(-1);
      stop.limit(this.maxForce);
      return stop;
    }
  }

  alignment(agents) {
    if(!this.enable_alignment){ return createVector(0, 0) }

    let sumAngle = 0;
    let count = 0;
    for (let other of agents) {
      if (other !== this) {
        let d = p5.Vector.dist(this.position, other.position);
        if (d < 25) {
          sumAngle += other.direction
          count++;
        }
      }
    }
    if (count > 0) {
      let desired = sumAngle / count;
      let dAngle = desired - this.direction;
      return 0.00005* dAngle;
    }
    return 0;
  }

  avoid(items){
    if(!this.enable_obstacles){ return createVector(0, 0) }

    let steer = createVector(0, 0);
    let count = 0;

    for (let item of items) {
      let d = p5.Vector.dist(this.position, item.position);
      if (d < OBSTACLE_DESTRUCTION_DISTANCE) { 
        let diff = p5.Vector.sub(this.position, item.position);
        diff.normalize();
        diff.div(d);
        steer.add(diff);
        count++;
      }
    }
    if (count > 0) {
      steer.div(count);
      steer.setMag(this.maxSpeed);
      steer.sub(this.velocity);
      steer.limit(this.maxForce);
      return steer;
    } else {
      let stop = this.velocity.copy().mult(-1);
      stop.limit(this.maxForce);
      return stop;
    }
  }


  spawn() {
    let branches = [];
    if (this.n <= 0) return branches;
    if (this.n === 1) {
      branches.push(new Branch(this, this.direction));
    } else {
      let startAngle = this.direction - this.theta / 2;
      let angleIncrement = this.theta / (this.n);
      for (let i = 0; i < this.n; i++) {
        let angle = startAngle + i * angleIncrement;
        branches.push(new Branch(this, angle));
      }
    }
    return branches;
  }

  deposit() {
    if(this.enable_obstacles){ return }
    
    deposit_food(this.position, this.radius);
  }

  draw(){
    if(exporting){
      this.draw_svg()
    } else {
      this.draw_screen()
    }
  }

  draw_svg(){
    push();
      noFill();
      stroke(palette.colours[this.group.strokeColorIndex]);
      translate(this.position.x, this.position.y);
      rotate(this.direction);

      let th = 0;
      let r = 0;

      // draw spiral
      beginShape();
        while(r < this.radius){
          r = .25 * th
          let x = r * cos(th)
          let y = r * sin(th)
          curveVertex(x, y)
          th++;
        }
      endShape()
    
      circle(0, 0, this.radius * 2 + 1)

    pop();

  }

  draw_screen(){
    push();
      fill(paper_palette.black);
      stroke(paper_palette.black);
      strokeWeight(2);
      translate(this.position.x, this.position.y);
      rotate(this.direction);
      circle(0, 0, this.radius);
      
    pop();
  }

}

