class Branch {
  constructor(parent, angle, minDistance, maxDistance) {
    this.parent = parent;
    this.angle = angle;      
    this.currentLength = 0;  
    this.minDistance = minDistance || 30;   
    this.maxDistance = maxDistance || 100;
    this.growthRate = 1;     
  }

  update() {
    this.currentLength += this.growthRate;
  }

  getEndPoint() {
    let x = this.parent.position.x + cos(this.angle) * this.currentLength;
    let y = this.parent.position.y + sin(this.angle) * this.currentLength;
    return createVector(x, y);
  }
}
