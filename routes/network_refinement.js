function connection_map(connections) {
  const connection_map = {}

  for (let i = 0; i < connections.length; i++) {
    const connection = connections[i];
    connection_map[connection.from.id] = connection_map[connection.from.id] || [];
    connection_map[connection.to.id] = connection_map[connection.to.id] || [];
    let ang1 = p5.Vector.sub(connection.from.centroid, connection.to.centroid).heading();
    let ang2 = p5.Vector.sub(connection.to.centroid, connection.from.centroid).heading();
    if (ang1 < 0) ang1 += TWO_PI;
    if (ang2 < 0) ang2 += TWO_PI;
    let edge1 = {from_id: connection.from.id, to_id: connection.to.id,   from: connection.from, to: connection.to,   ang: ang1, connection: connection};
    let edge2 = {from_id: connection.to.id,   to_id: connection.from.id, from: connection.to,   to: connection.from, ang: ang2, connection: connection};

    connection_map[connection.from.id].push(edge1);
    connection_map[connection.to.id].push(edge2);
  }

  return connection_map;
}

function refineNetwork(connections, hotspots) {
  let new_connections    = connections.slice();
  const maxIter   = 3;
  console.log("Refining network with", new_connections.length, "connections and", hotspots.length, "hotspots");

  for (let iter = 0; iter < maxIter; iter++) {
    const mapped_connections = connection_map(new_connections);
    // console.log(mapped_connections)
    let didSplit = false;

    
    for (let hotspot_id in mapped_connections) {
      let edges = mapped_connections[hotspot_id];
      if (edges.length < 2) continue;
      // console.log("Hotspot", hotspot_id, "has", edges.length, "edges");
      
      edges = edges.sort((a, b) => a.ang - b.ang);

      for(let i = 0; i < edges.length - 1; i++) {
        let edge1 = edges[i];
        let edge2 = edges[i + 1];
        let angle_diff = abs(edge1.ang - edge2.ang);

        if(angle_diff < PI/4 || angle_diff > 3*PI/4) {
          // Split edge
          let new_hotspot_position = edge1.connection.from.centroid.copy().add(p5.Vector.sub(edge1.connection.to.centroid, edge1.connection.from.centroid).mult(0.5));
          let new_hotspot = new Hotspot(new_hotspot_position);
          hotspots.push(new_hotspot);
          new_hotspot.id = hotspots.length - 1;
          new_connections = split_edge(new_connections, edge1, new_hotspot);
        }
      }
      
    

      if (didSplit) break;
    }

    // stop early if nothing got split
    if (!didSplit) break;
  }

  console.log("Refined network with", new_connections.length, "connections and", hotspots.length, "hotspots");
  return new_connections;
}


function split_edge(connections, edge, hotspot) {
  let new_connections = [];
  // console.log("Splitting edge: ", hotspot, edge);
  for (let connection of connections) {
    if (connection === edge.connection) {
      let connection_a = new Connection(edge.connection.from, hotspot, [edge.from.position.copy(), hotspot.centroid.copy()], connection.sequence_key, edge.connection.count);
      let connection_b = new Connection(hotspot, edge.connection.to, [hotspot.centroid.copy(), edge.to.position.copy()], connection.sequence_key, edge.connection.count);

      new_connections.push(connection_a);
      new_connections.push(connection_b);
    } else {
      new_connections.push(connection);
    }
  }
  return new_connections;
}


