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
    stroke(0, 255, 192);
    noFill();
    beginShape();
    for (let p of this.path) {
      vertex(p.x, p.y);
    }
    endShape();
  }
}

function filter_connections(){
  filtered_connections = connections.filter(conn => conn.journeyCount >= MIN_JOURNEYS_TO_DRAW);
}



function resamplePath(path, numPoints) {
  if (path.length < 2) return path.slice();
  let cumulativeDists = [0];
  let totalDist = 0;
  for (let i = 1; i < path.length; i++) {
    totalDist += p5.Vector.dist(path[i], path[i - 1]);
    cumulativeDists.push(totalDist);
  }
  let newPath = [];
  let interval = totalDist / (numPoints - 1);
  newPath.push(path[0].copy());
  for (let j = 1; j < numPoints - 1; j++) {
    let targetDist = j * interval;
    let k = 1;
    while (k < cumulativeDists.length && cumulativeDists[k] < targetDist) { k++; }
    let t = (targetDist - cumulativeDists[k - 1]) / (cumulativeDists[k] - cumulativeDists[k - 1]);
    let newX = lerp(path[k - 1].x, path[k].x, t);
    let newY = lerp(path[k - 1].y, path[k].y, t);
    newPath.push(createVector(newX, newY));
  }
  newPath.push(path[path.length - 1].copy());
  return newPath;
}

