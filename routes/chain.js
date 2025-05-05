class Chain {
  constructor(points, group_id, line_id) {
    this.points = points;
    this.count = 0;
    this.journeys = 0;
    this.percentile = 0;
    this.length = this.points.length - 1
    this.major = false
    this.group_id = group_id  || -1;
    this.line_id = line_id || -1;
  }
  add(point){
    this.points.push(point);
    this.length++;
  }

  draw(colour){
    strokeWeight(4);
    stroke(colour);

    noFill();
    beginShape();
      for (let point of this.points) {
        vertex(point.x, point.y);
      }
    endShape();
  } 
}

const MAX_CHAIN_LENGTH = 1000;



function create_chains(hotspot_connections, connections, hotspots) {
  let visited = new Set(); 
  let chains = [];

  for (let hotspot of hotspots) {
    let connections = hotspot_connections[hotspot.id];
    if(hotspot.count < 3) { continue; }
    for (let connection of connections) {
      if (!visited.has(connection)) {
        let chain = create_chain(hotspot_connections, connection, hotspot, visited);
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

function create_chain(hotspot_connections, connection, hotspot, visited) {
  let current_connection = connection;
  let current_hotspot = hotspot;

  if (!current_hotspot) { return };

  let chain = new Chain([current_hotspot.centroid.copy()]);
  
  while (chain.points.length < MAX_CHAIN_LENGTH) {
    visited.add(current_connection);
    chain.count += current_connection.count;
    chain.percentile += current_connection.percentile;
    chain.journeys += current_connection.journeys;
    
    let next_hotspot = (current_connection.from.id === current_hotspot.id) ? current_connection.to : current_connection.from;

    // If next hotspot is not found then stop
    if (!next_hotspot) break;
    chain.add(next_hotspot.centroid.copy());

    // chains go between ends and junctions
    // If next hotspot is an endpoint then stop
    if (next_hotspot.count !== 2) break;

    // If next hotspot is already visited then stop
    let next_connections = hotspot_connections[next_hotspot.id].filter(c => !visited.has(c));
    if (next_connections.length === 0) break;
    
    current_connection = next_connections[0];
    current_hotspot = next_hotspot;
  }

  chain.percentile = chain.percentile / (chain.length - 1);
  return chain
}
