class Connection {
  constructor(from, to, geometry, count, key) {
    this.from = from;
    this.to = to;
    this.geometry = geometry;
    this.squence_key = key;
    this.count = count;
    this.journeys = 0;
    this.percentile = 0;
  }

  draw(){
    stroke(stroke_colour);
    strokeWeight(CSW);

    line(this.geometry[0].x, this.geometry[0].y, this.geometry[1].x, this.geometry[1].y);
  }
}
