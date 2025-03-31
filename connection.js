class Connection {
  constructor(emitterA, emitterB, path, pathLength) {
    this.emitterA = emitterA;
    this.emitterB = emitterB;
    this.numSamplePoints = PATH_DETAIL;
    this.path = resamplePath(path, this.numSamplePoints);
    this.pathLength = pathLength;
    this.journeyCount = 1;
  }
  
  updateWithNewJourney(newPath, newPathLength) {
    newPath = resamplePath(newPath, this.numSamplePoints);
    for (let i = 0; i < this.numSamplePoints; i++) {
      this.path[i].x = (this.path[i].x * this.journeyCount + newPath[i].x) / (this.journeyCount + 1);
      this.path[i].y = (this.path[i].y * this.journeyCount + newPath[i].y) / (this.journeyCount + 1);
    }
    this.journeyCount++;
    
    if (newPathLength < this.pathLength) {
      this.pathLength = newPathLength;
    }
  }

  draw() {
    stroke(0, 255, 0);
    noFill();
    beginShape();
    for (let p of this.path) {
      vertex(p.x, p.y);
    }
    endShape();
  }
}
