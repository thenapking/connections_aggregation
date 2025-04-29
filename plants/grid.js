class Grid {
  constructor() {
    this.cols = Math.ceil(w/CELL_SIZE);
    this.rows = Math.ceil(h/CELL_SIZE);
    this.cells = [];

    for (let i = 0; i < this.cols; i++) {
      this.cells[i] = [];
      for (let j =0; j < this.rows; j++) {
        this.cells[i][j] = [];
      }
    }
  }

  add(item) {
      let col = Math.floor(item.position.x / CELL_SIZE);
      let row = Math.floor(item.position.y / CELL_SIZE);
      col = constrain(col, 0, this.cols - 1);
      row = constrain(row, 0, this.rows - 1);

      this.cells[col][row].push(item);
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
