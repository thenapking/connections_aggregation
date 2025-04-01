/* agent.js */
class Agent {
  constructor(position, direction, theta, radius, n, group, depth = 0, options) {
    this.position = position.copy();
    this.direction = direction; // an angle in radians, not a vector
    this.theta = theta;         
    this.radius = radius;      
    this.depth = depth;         
    this.n = n; 
    this.children = [];   
    this.group = group;
    this.enable_separation = options.enable_separation || false;
    this.enable_alignment = options.enable_alignment   || false;
    this.enable_obstacles = options.enable_obstacles   || false;

    this.initialize();
  }

  initialize(){
    if(this.enable_obstacles){
      let obstacle = new Obstacle(this.position, this.radius);
      obstacles.push(obstacle);
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
      fill(palette.colours[this.group.fillColorIndex]);
      stroke(palette.colours[this.group.strokeColorIndex]);
      translate(this.position.x, this.position.y);
      rotate(this.direction);
      ellipse(0, 0, this.radius * 2);
    pop();
  }
}

