class Chain {
  constructor(points) {
    this.points = points;
    this.count = 0;
    this.journeys = 0;
    this.percentile = 0;
    this.length = this.points.length - 1
    this.major = false;
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


function create_hotspot_connections(connections, hotspots) {
  let hotspot_connections = {};

  for (let hotspot of hotspots) {
    hotspot_connections[hotspot.id] = [];
  }

  for (let connection of connections) {
    hotspot_connections[connection.from.id].push(connection);
    hotspot_connections[connection.to.id].push(connection);
  }

  return hotspot_connections;
}

function create_chains(hotspot_connections, connections, hotspots) {
  let visited = new Set(); 
  let chains = [];

  for (let hotspot of hotspots) {
    let connections = hotspot_connections[hotspot.id];
    for (let connection of connections) {
      if (!visited.has(connection)) {
        let chain = create_chain(hotspot_connections, connection, hotspot.id, visited);
        chains.push(chain);
      }
    }
  }

  for (let connection of connections) {
    if (!visited.has(connection)) {
      let chain = create_chain(hotspot_connections, connection, connection.from, visited);
      chains.push(chain);
    }
  }

  return chains;
}

function create_chain(hotspot_connections, connection, hotspot_id, visited) {
  let current_connection = connection;
  let current_hotspot_id = hotspot_id;
  let current_hotspot = find_hotspot(current_hotspot_id);

  if (!current_hotspot) { return };

  let chain = new Chain([current_hotspot.centroid.copy()]);
  let major_hotspot_count = 0;
  
  while (chain.points.length < MAX_CHAIN_LENGTH) {
    visited.add(current_connection);
    chain.count += current_connection.count;
    chain.percentile += current_connection.percentile;
    chain.journeys += current_connection.journeys;
    if(current_hotspot.major) major_hotspot_count++;
    
    let next_hotspot_id = (current_connection.from.id === current_hotspot_id) ? current_connection.to.id : current_connection.from.id;
    let next_hotspot = find_hotspot(next_hotspot_id);

    // If next hotspot is not found then stop
    if (!next_hotspot) break;
    chain.add(next_hotspot.centroid.copy());

    // If next hotspot is an endpoint then stop
    if (next_hotspot.count < 2) break;

    // If next hotspot is already visited then stop
    let next_connections = hotspot_connections[next_hotspot_id].filter(c => !visited.has(c));
    if (next_connections.length === 0) break;
    
    current_connection = next_connections[0];
    current_hotspot_id = next_hotspot_id;
  }

  chain.percentile = chain.percentile / (chain.length - 1);
  if(major_hotspot_count > 2) { chain.major = true; }
  return chain
}
