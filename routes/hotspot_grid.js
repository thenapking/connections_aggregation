class HotspotGrid {
  constructor() {
    this.rows = Math.ceil(h / CELL_SIZE);
    this.cols = Math.ceil(w / CELL_SIZE);
    this.cells = [];
    this.resulting_groups = [];
    this.initialize();
  }

  initialize() {
    for (let i = 0; i < this.cols; i++) {
      this.cells[i] = [];
      for (let j = 0; j < this.rows; j++) {
        this.cells[i][j] = null;
      }
    }
  }

  intersects_obstacle(point) {
    for (let obstacle of obstacles) {
      let dist = p5.Vector.dist(point, obstacle.position)
      if (dist < obstacle.radius + OBSTACLE_SPACING) {
        return true;
      }
    }
    return false;
  }

  insert(points) {
    for (let point of points) {
      if (this.intersects_obstacle(point)) continue;

      let c = this.closest_centroid(point, CELL_SIZE);
      
      if (!c) {
        let g = new Hotspot(point);
        let i = this.col(g.centroid);
        let j = this.row(g.centroid);

        if(i < 0 || j < 0 || i >= this.cols || j >= this.rows) {
          console.log("Error: centroid out of range?", i, j);
        } else {
          this.resulting_groups.push(g);
          this.cells[i][j] = g;
        }
      } else {
        let i = c[0], j = c[1];
        let g = this.cells[i][j];
        if (g) {
          g.add_point(point);
          g.recompute_centroid();
        } else {
          console.log("Error: no group in cell", i, j);
        }
      }
    }
  }

  closest_centroid(point, max_dist = 1e8) {
    let i = this.col(point), j = this.row(point);
    let shortest = CELL_SIZE * 100;
    let nearest = null;
    for (let k = max(i - 1, 0); k < min(i + 2, this.cols); k++) {
      for (let m = max(j - 1, 0); m < min(j + 2, this.rows); m++) {
        if (this.cells[k][m] == null) continue;
        let d = p5.Vector.dist(point, this.cells[k][m].centroid);
        if (d < shortest && d <= max_dist) {
          nearest = [k, m];
          shortest = d;
        }
      }
    }
    return nearest;
  }

  col(point){
    let i = Math.floor(point.x / CELL_SIZE);
    return i;
  }

  row(point){
    let j = Math.floor(point.y / CELL_SIZE);
    return j;
  }

  // not used
  redistribute_points(points) {
    for (let g of this.resulting_groups) {
      g.delete_points();
    }
    for (let point of points) {
      let c = this.closest_centroid(point, CELL_SIZE * 20);
      if (c != null) {
        let g = this.cells[c[0]][c[1]];
        g.add_point(point);
      } else {
        console.log("Discarding", point);
      }
    }
  }

  neighbours_in(col, row) {
    if ( col >= 0 && col < this.cols 
      && row >= 0 && row < this.rows) {
      return this.cells[col][row];
    } else {
      return [];
    }
  }

  neighbours(col, row) {
    let items = [];
    for (let i = -1; i < 2; i++){
      for (let j = -1; j < 2; j++){
        items = items.concat(this.neighbours_in(col + i, row + j));
      }
    }
    return items;
  }
}
