class Attractor {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.radius = 5;
  }

  addFood() {
    foodLayer.noStroke();
    foodLayer.fill(255, 50);
    foodLayer.ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
  
  draw() {
    fill(255, 0, 0);
    noStroke();
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }
}
