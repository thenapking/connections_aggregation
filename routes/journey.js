class Journey {
  constructor(emitterA, emitterB, path, length) {
    this.emitterA = emitterA;
    this.emitterB = emitterB;
    this.length = length;
    this.distance = 0;

    this.path = this.resample(path)
    this.count = 1;
  }

  calculate_distances(path){
    let aggregated_distances = [0];


    let distance = 0;
    for (let i = 1; i < path.length; i++) {
      distance += p5.Vector.dist(path[i], path[i - 1]);
      aggregated_distances.push(distance);
    }

    this.distance = distance;
    return aggregated_distances
  }

  aggregate(){
    let eA = this.emitterA;
    let eB = this.emitterB;

    for(let connection of connections){
      let hA = hotspots[connection.from];
      let hB = hotspots[connection.to];
      if(hA.emitter == eA && hB.emitter == eB
        || hA.emitter == eB && hB.emitter == eA){
       
        connection.journeys += this.count;
        break;
      }
    }
  }

  resample(path) {
    if (path.length < 2) return path.slice();

    let aggregated_distances = this.calculate_distances(path);
    let interval = this.distance / (PATH_DETAIL - 1);

    let new_path = [path[0].copy()];

    for (let j = 1; j < PATH_DETAIL - 1; j++) {
      let required_distance = j * interval;
      let k = 1;
      while (k < aggregated_distances.length && aggregated_distances[k] < required_distance) { k++; }
      let t = (required_distance - aggregated_distances[k - 1]) / (aggregated_distances[k] - aggregated_distances[k - 1]);
      let x = lerp(path[k - 1].x, path[k].x, t);
      let y = lerp(path[k - 1].y, path[k].y, t);
      new_path.push(createVector(x, y));
    }

    new_path.push(path[path.length - 1].copy());
    return new_path;
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

function filter_journeys(){
  filtered_journeys = journeys.filter(conn => conn.count >= MIN_JOURNEYS_TO_DRAW);
}

function extract_journey_points(){
  let points = [];

  for(let journey of filtered_journeys){
    for (let i = 0; i < journey.path.length; i++) {
      points.push(journey.path[i].copy());
    }
  }

  return points;
}

function aggregate_journeys(){
  for (let journey of filtered_journeys) {
    journey.aggregate();
  }
}
