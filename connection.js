class Connection {
  constructor(from, to, geometry, count) {
    this.from = from;
    this.to = to;
    this.geometry = geometry;
    this.count = count;

  }

  draw(){
    stroke(255, 192, 0);
    strokeWeight(CSW);

    line(this.geometry[0].x, this.geometry[0].y, this.geometry[1].x, this.geometry[1].y);
  }
}
