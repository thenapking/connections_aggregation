class Attractor {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.radius = 10;
  }

  discharge() {
    deposit_food(this.position, this.radius);
  }

  draw() {
    if(!show_agents) {return;}
    fill(255, 0, 0);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius, this.radius);
  }
}

function create_attractors(){
  for (let i = 0; i < NUM_ATTRACTORS; i++) {
    let x = random(width);
    let y = random(height);
    attractors.push(new Attractor(x, y));
  }
}
