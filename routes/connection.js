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

function connection_statistics(){
  let journey_counts = [];
  max_journey_count = 0;
  for(let connection of connections){
    journey_counts.push(connection.journeys);
    if(connection.journeys > max_journey_count){
      max_journey_count = connection.journeys;
    }
  }

  for(let connection of connections){
    connection.percentile = journey_percentiles(journey_counts, connection.journeys);
  }

}

function journey_percentiles(arr, val) {
  let count = 0;

  for(let v of arr){
    if (v < val) {
      count++;
    } else if (v == val) {
      count += 0.5;
    }
  };

  return 100 * count / arr.length;
}

function count_connections(){
  for (let connection of connections) {
    let from = connection.from;
    let to = connection.to;
    if (hotspots[from]) {
      hotspots[from].count++;
    }
    if (hotspots[to]) {
      hotspots[to].count++;
    }
  }
}
