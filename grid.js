class Grid {
  constructor(bbox, cell_size) {
    let w = bbox.xMax - bbox.xMin;
    let h = bbox.yMax - bbox.yMin;
    this.x_min = bbox.xMin || 0;
    this.y_min = bbox.yMin || 0;
    this.cell_size = cell_size;
    this.n_rows = Math.ceil(h / this.cell_size);
    this.n_cols = Math.ceil(w / this.cell_size);
    this.cells = [];
    for (let i = 0; i < this.n_cols; i++) {
      this.cells[i] = [];
      for (let j = 0; j < this.n_rows; j++) {
        this.cells[i][j] = null;
      }
    }
    this.resulting_groups = [];
  }

  insert(points) {
    for (let pt of points) {
      let c = this.closest_centroid(pt, this.cell_size);
      
      if (!c) {
        let g = new Hotspot(pt);
        let pos = this.coordinates(g.centroid);
        if(pos[0] < 0 || pos[1] < 0 || pos[0] >= this.n_cols || pos[1] >= this.n_rows) {
          console.log("Error: centroid out of range?", pos);
        } else {
          this.resulting_groups.push(g);
          this.cells[pos[0]][pos[1]] = g;
        }
      } else {
        let i = c[0], j = c[1];
        let g = this.cells[i][j];
        if (g) {
          g.add_point(pt);
          g.recompute_centroid();
        } else {
          console.log("Error: no group in cell", i, j);
        }
      }
    }
  }

  closest_centroid(pt, max_dist = 1e8) {
    let pos = this.coordinates(pt);
    let i = pos[0], j = pos[1];
    let shortest = this.cell_size * 100;
    let nearest = null;
    for (let k = max(i - 1, 0); k < min(i + 2, this.n_cols); k++) {
      for (let m = max(j - 1, 0); m < min(j + 2, this.n_rows); m++) {
        if (this.cells[k][m] == null) continue;
        let d = p5.Vector.dist(pt, this.cells[k][m].centroid);
        if (d < shortest && d <= max_dist) {
          nearest = [k, m];
          shortest = d;
        }
      }
    }
    return nearest;
  }

  coordinates(pt) {
    let i = Math.floor((pt.x - this.x_min) / this.cell_size);
    let j = Math.floor((pt.y - this.y_min) / this.cell_size);
    return [i, j];
  }

  redistribute_points(points) {
    for (let g of this.resulting_groups) {
      g.delete_points();
    }
    for (let pt of points) {
      let c = this.closest_centroid(pt, this.cell_size * 20);
      if (c != null) {
        let g = this.cells[c[0]][c[1]];
        g.add_point(pt);
      } else {
        console.log("Discarding", pt);
      }
    }
  }
}
