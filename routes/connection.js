class Connection {
  constructor(from, to, geometry, count, key) {
    this.from = from;
    this.to = to;
    this.squence_key = key;
    this.count = count;
    this.journeys = 0;
    this.percentile = 0;
  }

  draw(){
    stroke(stroke_colour);
    strokeWeight(CSW);

    line(this.from.centroid.x, this.from.centroid.y, 
         this.to.centroid.x, this.to.centroid.y);
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
    if (from) { from.count++; }
    if (to) { to.count++; }
  }
}
