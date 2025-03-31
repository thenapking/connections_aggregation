class Hotspot {
  constructor(pt) {
    this.points = [pt.copy()];
    this.centroid = pt.copy();
    this.id = null;
    this.connectionCount = 0;
  }

  add_point(pt) {
    this.points.push(pt.copy());
  }

  delete_points() {
    this.points = [];
  }

  recompute_centroid() {
    let sumX = 0, sumY = 0;
    for (let pt of this.points) {
      sumX += pt.x;
      sumY += pt.y;
    }
    this.centroid = createVector(sumX / this.points.length, sumY / this.points.length);
  }
}

const MIN_HOTSPOT_DISTANCE = 20; // Set your minimum distance in pixels

function mergeCloseHotspots(hotspots, minDistance) {
  let merged = [];
  let used = new Array(hotspots.length).fill(false);
  for (let i = 0; i < hotspots.length; i++) {
    if (used[i]) continue;
    let group = [hotspots[i]];
    used[i] = true;
    for (let j = i + 1; j < hotspots.length; j++) {
      if (used[j]) continue;
      let d = p5.Vector.dist(hotspots[i].centroid, hotspots[j].centroid);
      if (d < minDistance) {
        group.push(hotspots[j]);
        used[j] = true;
      }
    }
    merged.push(mergeHotspotGroup(group));
  }
  return merged;
}

function mergeHotspotGroup(group) {
  let sumX = 0, sumY = 0, totalPoints = 0;
  let connectionCount = 0;
  for (let h of group) {
    // Weight the centroid by the number of points in the group
    sumX += h.centroid.x * h.points.length;
    sumY += h.centroid.y * h.points.length;
    totalPoints += h.points.length;
    // You could also sum or take the maximum of the connection counts:
    connectionCount = Math.max(connectionCount, h.connectionCount);
  }
  let newCentroid = createVector(sumX / totalPoints, sumY / totalPoints);
  let newHotspot = new Hotspot(newCentroid);
  newHotspot.points = [];
  for (let h of group) {
    newHotspot.points = newHotspot.points.concat(h.points);
  }
  newHotspot.recompute_centroid();
  newHotspot.connectionCount = connectionCount;
  return newHotspot;
}
