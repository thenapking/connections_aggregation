// THis code no longer works
function getNodesFromFlowLines(connections) {
  const map = {};
  for (let conn of connections) {
    map[conn.from.id] = conn.from;
    map[conn.to.id]   = conn.to;
  }
  return Object.keys(map).map(id => ({
    id:   +id,
    // make a defensive copy so we never accidentally mutate the real hotspot
    position: map[id].centroid.copy()
  }));
}

// --- REFINED refineNetwork
function refineNetwork(connections, hotspots) {
  let newConns    = connections.slice();
  let nextNodeId  = hotspots.length;
  const maxIter   = 3;

  for (let iter = 0; iter < maxIter; iter++) {
    let didSplit = false;

    // 1) Build an adjacency map: hotspot.id → [ { connection, node, other } … ]
    const adj = {};
    newConns.forEach(conn => {
      // from → to
      adj[conn.from.id] = adj[conn.from.id] || [];
      adj[conn.from.id].push({
        connection: conn,
        id:       conn.from.id,
        node:       conn.from.centroid.copy(),
        other:      conn.to.centroid.copy()
      });
      // to → from
      adj[conn.to.id] = adj[conn.to.id] || [];
      adj[conn.to.id].push({
        connection: conn,
        id:       conn.to.id,
        node:       conn.to.centroid.copy(),
        other:      conn.from.centroid.copy()
      });
    });

    // 2) For each hotspot with ≥2 edges, sort its edges by heading and look for bad gaps
    for (let idStr in adj) {
      const edges = adj[idStr];
      if (edges.length < 2) continue;

      // Compute absolute headings and sort
      const info = edges.map(e => {
        let ang = degrees(p5.Vector.sub(e.other, e.node).heading());
        if (ang < 0) ang += 360;
        return { edge: e, angle: ang };
      }).sort((A, B) => A.angle - B.angle);

      // Check each adjacent‐pair (with wraparound)
      for (let i = 0; i < info.length; i++) {
        const j     = (i + 1) % info.length;
        const a1    = info[i].angle;
        const a2    = info[j].angle;
        const delta = (a2 - a1 + 360) % 360;

        if (delta < MIN_CONNECTION_ANGLE || delta > MAX_CONNECTION_ANGLE) {
          // 3) Split the longer of the two “bad” edges
          const e1   = info[i].edge;
          const e2   = info[j].edge;
          const L1   = p5.Vector.dist(e1.node, e1.other);
          const L2   = p5.Vector.dist(e2.node, e2.other);
          const pick = (L1 >= L2 ? e1 : e2);

          // 4) Make a new Hotspot at the midpoint
          const mid = p5.Vector.lerp(pick.node, pick.other, 0.5);
          const H   = new Hotspot(mid);
          H.id      = nextNodeId++;
          hotspots.push(H);

          // 5) Call your existing split_edge helper
          newConns  = split_edge(newConns, pick, H);

          didSplit  = true;
          break;
        }
      }

      if (didSplit) break;
    }

    // stop early if nothing got split
    if (!didSplit) break;
  }

  return newConns;
}


function split_edge(connections, edge, hotspot) {
  let new_connections = [];
  console.log("Splitting edge: ", hotspot, edge);
  for (let connection of connections) {
    if (connection === edge.connection) {
      let connection_a = new Connection(edge.connection.from, hotspot, [edge.node.copy(), hotspot.centroid.copy()], connection.key, edge.connection.count);
      let connection_b = new Connection(hotspot, edge.connection.to, [hotspot.centroid.copy(), edge.other.copy()], connection.key, edge.connection.count);

      new_connections.push(connection_a);
      new_connections.push(connection_b);
    } else {
      new_connections.push(connection);
    }
  }
  return new_connections;
}


