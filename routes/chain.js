class Chain {
  constructor(points) {
    this.points = points;
    this.count = 0;
    this.journeys = 0;
    this.percentile = 0;
    this.length = this.points.length - 1
  }

  add(point){
    this.points.push(point);
    this.length++;
  }

  draw(){
    strokeWeight(4);
    noFill();
    stroke(stroke_colour);
    beginShape();
      curveVertex(this.points[0].x, this.points[0].y);
      for (let point of this.points) {
        curveVertex(point.x, point.y);
      }
      curveVertex(this.points[this.length].x, this.points[this.length].y);
    endShape();
  }

 
}

const MAX_CHAIN_LENGTH = 1000;

let visited;
let hotspot_connections = {};

function create_hotspot_connections(connections, hotspots) {
  hotspot_connections = {};

  for (let hotspot of hotspots) {
    hotspot_connections[hotspot.id] = [];
  }

  for (let connection of connections) {
    hotspot_connections[connection.from].push(connection);
    hotspot_connections[connection.to].push(connection);
  }
}

function create_chains(connections, hotspots) {
  create_hotspot_connections(connections, hotspots);

  visited = new Set(); 
  let chains = [];

  for (let hotspot of hotspots) {
    let connections = hotspot_connections[hotspot.id];
    for (let connection of connections) {
      if (!visited.has(connection)) {
        let chain = create_chain(connection, hotspot.id);
        chains.push(chain);
      }
    }
  }

  for (let connection of connections) {
    if (!visited.has(connection)) {
      let chain = create_chain(connection, connection.from);
      chains.push(chain);
    }
  }

  return chains;
}

function create_chain(connection, hotspot_id) {
  let current_connection = connection;
  let current_hotspot_id = hotspot_id;
  let current_hotspot = find_hotspot(current_hotspot_id);

  if (!current_hotspot) { return };

  let chain = new Chain([current_hotspot.centroid.copy()]);
  
  while (chain.points.length < MAX_CHAIN_LENGTH) {
    visited.add(current_connection);
    chain.count += current_connection.count;
    chain.percentile += current_connection.percentile;
    chain.journeys += current_connection.journeys;
    
    let next_hotspot_id = (current_connection.from === current_hotspot_id) ? current_connection.to : current_connection.from;
    let next_hotspot = find_hotspot(next_hotspot_id);

    // If next hotspot is not found then stop
    if (!next_hotspot) break;
    chain.add(next_hotspot.centroid.copy());

    // If next hotspot is an endpoint then stop
    if (next_hotspot.count !== 2) break;

    // If next hotspot is already visited then stop
    let next_connections = hotspot_connections[next_hotspot_id].filter(c => !visited.has(c));
    if (next_connections.length === 0) break;
    
    current_connection = next_connections[0];
    current_hotspot_id = next_hotspot_id;
  }

  chain.percentile = chain.percentile / (chain.length - 1);


  return chain
}
