class Emitter {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.radius = 10;
  }
  draw() {
    fill(0, 0, 255);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
}
