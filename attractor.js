class Attractor {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.radius = 5;
  }

  discharge() {
    foodLayer.noStroke();
    foodLayer.fill(255, 50);
    foodLayer.ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }

  draw() {
    if(!show_agents) {return;}
    fill(255, 0, 0);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
}

function create_attractors(){
  for (let i = 0; i < NUM_ATTRACTORS; i++) {
    let x = random(width);
    let y = random(height);
    attractors.push(new Attractor(x, y));
  }
}
