class SequenceGenerator {
  constructor(hotspots, trajectories) {
    this.hotspots = hotspots;
    this.trajectories = trajectories;
    this.sequences = {};
    this.initialize();
  }

  initialize() {
    for (let traj of this.trajectories) {
      this.evaluate_trajectory(traj);
    }
  }

  evaluate_trajectory(trajectory) {
    let points = trajectory;
    let sequence = [];
    let prev_cell = null;
    for (let point of points) {
      let nearest = this.nearest_neighbour(point);
      let cell_id = nearest.id;
      if (sequence.length >= 1) {
        prev_cell = sequence[sequence.length - 1];
        if (cell_id != prev_cell) {
          let key = prev_cell + "," + cell_id;
          if (this.sequences.hasOwnProperty(key)) {
            this.sequences[key] += 1;
          } else {
            this.sequences[key] = 1;
          }
        }
      }
      if (cell_id != prev_cell) {
        sequence.push(cell_id);
      }
    }
  }
  
  nearest_neighbour(p) {
    let nearest = null;
    let nearest_dist = Infinity;
    for (let hotspot of this.hotspots) {
      let d = p5.Vector.dist(p, hotspot.centroid);
      if (d < nearest_dist) {
        nearest_dist = d;
        nearest = hotspot;
      }
    }
    return nearest;
  }

  create_connections(check_obstacles = true) {
    let connections = [];
    for (let key in this.sequences) {
      if (this.sequences.hasOwnProperty(key)) {
        let parts = key.split(",");
        let from_id = int(parts[0]);
        let to_id = int(parts[1]);

       

        let from_hotspot = find_hotspot(from_id);
        let to_hotspot = find_hotspot(to_id);

        if (check_obstacles && this.intersectsObstacle(from_hotspot, to_hotspot)) { continue }

        let geometry = [from_hotspot.centroid.copy(), to_hotspot.centroid.copy()];
        let connection = new Connection(from_hotspot, to_hotspot, geometry, 0, this.sequences[key]);
        connections.push(connection);
      }
    }
    return connections;
  }

  intersectsObstacle(from_hotspot, to_hotspot) {

    let A = from_hotspot.centroid.copy();
    let B = to_hotspot.centroid.copy();

    for (let obs of obstacles) {
      let C = obs.position;  
      let r = obs.radius + OBSTACLE_SPACING;   

      let AB = p5.Vector.sub(B, A);
      let AC = p5.Vector.sub(C, A);
      let AB_sq = AB.magSq();  
  
      let t = AC.dot(AB) / AB_sq;
      
      let closest;
      if (t < 0) {
        closest = A; 
      } else if (t > 1) {
        closest = B; 
      } else {
        closest = p5.Vector.add(A, p5.Vector.mult(AB, t));
      }
      
      if (p5.Vector.dist(closest, C) < r) {
        return true;
      }
    }
    return false;
  }
}
