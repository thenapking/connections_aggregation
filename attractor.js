class Attractor {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.radius = 10;
  }

  discharge() {
    deposit_food(this.position, this.radius);
  }

  draw() {
    if(!show_slimeagents) {return;}
    let colour_idx = palette.groups[0]
    fill(palette.colours[colour_idx]);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
}

function create_attractors(){
  for (let i = 0; i < NUM_ATTRACTORS; i++) {
    let x = random(w);
    let y = random(h);
    attractors.push(new Attractor(x, y));
  }
}
