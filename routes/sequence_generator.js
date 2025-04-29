class SequenceGenerator {
  constructor(centroidFeatures, trajectoryFeatures, weight_field) {
    this.centroids = centroidFeatures;
    this.trajectories = trajectoryFeatures;
    this.weight_field = weight_field || null;
    this.id_to_centroid = {};
    this.sequences = {};
    this.initialize();
  }

  initialize() {
    for (let f of this.centroids) {
      this.id_to_centroid[f.id] = { feature: f, counts: [0, 0, 0, 0, 0] };
    }

    for (let traj of this.trajectories) {
      this.evaluate_trajectory(traj);
    }
  }

  evaluate_trajectory(trajectory) {
    let points = trajectory;
    let sequence = [];
    let weight = this.weight_field ? trajectory.weight : 1;
    let prev_cell = null;
    for (let point of points) {
      let nearest = this.nearest_neighbour(point);
      let cell_id = nearest.id;
      if (sequence.length >= 1) {
        prev_cell = sequence[sequence.length - 1];
        if (cell_id != prev_cell) {
          let key = prev_cell + "," + cell_id;
          if (this.sequences.hasOwnProperty(key)) {
            this.sequences[key] += weight;
          } else {
            this.sequences[key] = weight;
          }
        }
      }
      if (cell_id != prev_cell) {
        let m_val = point.m || 0;
        let t = new Date((m_val + 8 * 3600) * 1000);
        let h = t.getHours();
        let quarter = Math.floor(h / 6);
        this.id_to_centroid[cell_id].counts[0] += weight;
        this.id_to_centroid[cell_id].counts[quarter + 1] += weight;
        sequence.push(cell_id);
      }
    }
  }
  
  nearest_neighbour(p) {
    let nearest = null;
    let nearest_dist = Infinity;
    for (let f of this.centroids) {
      let d = p5.Vector.dist(p, f.geometry);
      if (d < nearest_dist) {
        nearest_dist = d;
        nearest = f;
      }
    }
    return nearest;
  }

  create_connections() {
    let connections = [];
    for (let key in this.sequences) {
      if (this.sequences.hasOwnProperty(key)) {
        let parts = key.split(",");
        let from = parts[0];
        let to = parts[1];

       

        let fromFeature = this.id_to_centroid[from].feature;
        let toFeature = this.id_to_centroid[to].feature;

        if (this.intersectsObstacle(fromFeature, toFeature)) { continue }

        let geometry = [fromFeature.geometry.copy(), toFeature.geometry.copy()];
        let connection = new Connection(parseInt(from), parseInt(to), geometry, 0, this.sequences[key]);
        connections.push(connection);
      }
    }
    return connections;
  }

  intersectsObstacle(fromFeature, toFeature) {
    let A = fromFeature.geometry.copy();
    let B = toFeature.geometry.copy();

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
