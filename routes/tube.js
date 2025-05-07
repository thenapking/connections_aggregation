// intersection helpers
function ccw(ax, ay, bx, by, cx, cy) {
  return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
}
function intersects(a1, a2, b1, b2) {
  return ccw(a1.x,a1.y,b1.x,b1.y,b2.x,b2.y) !== ccw(a2.x,a2.y,b1.x,b1.y,b2.x,b2.y)
      && ccw(a1.x,a1.y,a2.x,a2.y,b1.x,b1.y) !== ccw(a1.x,a1.y,a2.x,a2.y,b2.x,b2.y);
}

const MAX_TURN = 3.141 / 6
const MAX_LENGTH = 40;
const K = 4;

function create_group_hotspots(){
  for(let group of groups){
    let hotspot = new Hotspot(group.position);
    hotspot.major = true;
    hotspot.id = hotspots.length;
    for(let hotspot of major_hotspots){
      let dist = hotspot.position.dist(group.position);
      if(dist > 80) { continue; }
      hotspot.flagged = true;
    }
    major_hotspots.push(hotspot);

  }
}

function create_polar_coordinates(group){
  let polar_coordinates = [];
    
  for(let i = 0; i < hotspots.length; i++){
    // if(hotspots[i].flagged) { continue; }
    if(!hotspots[i].major) { continue; }
    let hotspot = hotspots[i];
    let p = hotspot.position.copy()
    let v = p.copy().sub(group.position);
    let dist = v.mag();
    let direction = v.heading();
    let obj = { i: i, 
                hotspot_id: hotspot.id,
                hotspot: hotspot,
                group_id: group.id,
                group: group,
                position: p, 
                r: dist,
                k: group.k,
                direction: direction };

    polar_coordinates.push(obj);
  };

  return polar_coordinates;
}

function create_clusters(polar_coordinates){
  let clusters = [];
  for (let k = 0; k < K; k++) {
    clusters[k] = [];
  }

  console.log("Polar coordinates: ", polar_coordinates);
  for(let i = 0; i < polar_coordinates.length; i ++) {
    let pc = polar_coordinates[i];
    let norm = (pc.direction + PI) / TWO_PI;
    let k = floor(norm * pc.k) % pc.k;
    clusters[k].push(pc);
  }

  console.log("Clusters: ", clusters);

  return clusters;
}

let MAX_LINE_ID = 0;

function build_tube_network(){
  let current_line_id = 1;
  tube_chains = [];
  MAX_LINE_ID = 1;
  for(let group of groups){
    let polar_coordinates = create_polar_coordinates(group);
    let clusters = create_clusters(polar_coordinates);

    for(let k = 0; k < clusters.length; k++){
      let cluster = clusters[k];

      if (!cluster.length) { continue; }
      
      cluster.sort((a, b) => a.r - b.r);

      let first = cluster[0];
      let first_dist = p5.Vector.dist(group.position, first.position);
      if (first_dist > MAX_LENGTH * 20) { continue; }
      let chain = new Chain([group.position.copy()], group.id, current_line_id);
      chain.add(first.position.copy());

      connections.push({ from: group, to: first, group_id: group.id });

      let prev = first;
      let previous_direction = prev.direction;

      let remaining_cluster = cluster.slice(1);
      let invalid_connection_count = 0

      for(let next of remaining_cluster){
        let next_connection = new Connection(prev, next, [], 0, '', previous_direction)

        if(!next_connection.valid) {
          invalid_connection_count++;
          continue;
        }

        if (next_connection.dist <= MAX_LENGTH) {
          chain.add(next.position.copy());
          connections.push(next_connection);
          prev = next; 
          previous_direction = next_connection.direction;

        } else {

          let midpoint = prev.position.copy().add(next.position).mult(0.5);
          let candidates = hotspots.slice();

          candidates.sort((a,b)=> dist(a.position, midpoint) - dist(b.position, midpoint))

          for (let candidate of candidates) {
            let connection1 = new Connection(prev, candidate, [], 0, '', previous_direction)
            let connection2 = new Connection(candidate, next, [], 0, '', connection1.direction)
            
            if (connection1.valid && connection2.valid) {
              candidate.major = true;
              chain.add(candidate.position.copy());
              chain.add(next.position.copy());
              connections.push(connection1, connection2);
              prev = next; 
              previous_direction = connection2.direction;
              break;
            }
          }
        }
      };
      console.log("invalid connections: ", invalid_connection_count, polar_coordinates.length, cluster.length);
      tube_chains.push(chain);
      current_line_id++;
    };
  };
  MAX_LINE_ID = current_line_id;
}



