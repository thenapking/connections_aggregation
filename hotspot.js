class Hotspot {
  constructor(pt) {
    this.points = [pt.copy()];
    this.centroid = pt.copy();
    this.id = null;
  }

  add_point(pt) {
    this.points.push(pt.copy());
  }

  delete_points() {
    this.points = [];
  }
  
  recompute_centroid() {
    let sumX = 0, sumY = 0;
    for (let pt of this.points) {
      sumX += pt.x;
      sumY += pt.y;
    }
    this.centroid = createVector(sumX / this.points.length, sumY / this.points.length);
  }
}
