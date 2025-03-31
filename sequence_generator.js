class SequenceGenerator {
  constructor(centroidFeatures, trajectoryFeatures, weight_field) {
    this.centroids = centroidFeatures;
    this.trajectories = trajectoryFeatures;
    this.weight_field = weight_field || null;
    this.id_to_centroid = {};
    for (let f of this.centroids) {
      this.id_to_centroid[f.id] = { feature: f, counts: [0, 0, 0, 0, 0] };
    }
    this.sequences = {};
    for (let traj of this.trajectories) {
      this.evaluate_trajectory(traj);
    }
  }
  evaluate_trajectory(trajectory) {
    let points = trajectory;
    let seq = [];
    let weight = this.weight_field ? trajectory.weight : 1;
    let prev_cell = null;
    for (let pt of points) {
      let nearest = this.nearestNeighbor(pt);
      let cellId = nearest.id;
      if (seq.length >= 1) {
        prev_cell = seq[seq.length - 1];
        if (cellId != prev_cell) {
          let key = prev_cell + "," + cellId;
          if (this.sequences.hasOwnProperty(key)) {
            this.sequences[key] += weight;
          } else {
            this.sequences[key] = weight;
          }
        }
      }
      if (cellId != prev_cell) {
        let m_val = pt.m || 0;
        let t = new Date((m_val + 8 * 3600) * 1000);
        let h = t.getHours();
        let quarter = Math.floor(h / 6);
        this.id_to_centroid[cellId].counts[0] += weight;
        this.id_to_centroid[cellId].counts[quarter + 1] += weight;
        seq.push(cellId);
      }
    }
  }
  nearestNeighbor(pt) {
    let best = null;
    let bestDist = Infinity;
    for (let f of this.centroids) {
      let d = p5.Vector.dist(pt, f.geometry);
      if (d < bestDist) {
        bestDist = d;
        best = f;
      }
    }
    return best;
  }
  create_flow_lines() {
    let lines = [];
    for (let key in this.sequences) {
      if (this.sequences.hasOwnProperty(key)) {
        let parts = key.split(",");
        let fromId = parts[0];
        let toId = parts[1];
        let fromFeature = this.id_to_centroid[fromId].feature;
        let toFeature = this.id_to_centroid[toId].feature;
        let lineGeom = [fromFeature.geometry.copy(), toFeature.geometry.copy()];
        let flowFeature = { geometry: lineGeom, attributes: { FROM: parseInt(fromId), TO: parseInt(toId), COUNT: this.sequences[key] } };
        lines.push(flowFeature);
      }
    }
    return lines;
  }
}
