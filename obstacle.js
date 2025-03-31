class Obstacle {
  constructor(position, radius) {
    this.position = position;
    this.radius = radius;
  }

  draw() {
    fill(0);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
}

function create_obstacles() {
  for (let i = 0; i < NUM_OBSTACLES; i++) {
    let x = random(w);
    let y = random(h);
    obstacles.push(new Obstacle(createVector(x, y), 20));
  }
}
