importScripts("../lib/vec.js", "../lib/matrix.js", "../lib/vertex.js");
let gridSize, mode, speed, grid;

// Helpers

const polarToCartesian = (r, theta) => {
  return [r * Math.cos(theta), r * Math.sin(theta)];
};
const cartesianToPolar = (x, y) => {
  return [Math.sqrt(x ** 2 + y ** 2), Math.atan2(y, x)];
};

class Grid {
  constructor(gridSize = 100, type = "cartesian") {
    this.gridSize = gridSize % 2 ? gridSize : gridSize + 1;
    // this.gridSize = 11;
    this.type = type;
    this.grid = this.getGrid();
    this.destGrid = this.getGrid();
  }
  getGrid(type = this.type) {
    console.log("getGrid", type);

    switch (type) {
      case "cartesian":
        return this.getCartesianGrid();
      case "polar":
        return this.getPolarGrid();
    }

    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i].neighbors = this.getNeighbors(i);
    }
  }
  getCartesianGrid() {
    const grid = [];
    const halfWidth = Math.floor(this.gridSize / 2);
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const index = x + y * this.gridSize;
        grid.push(new Vertex([x - halfWidth, y - halfWidth], index, []));
      }
    }
    return grid;
  }
  getPolarGrid() {
    const grid = [];
    const maxRadius = Math.floor(this.gridSize / 2);
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        const index = x + y * this.gridSize;
        let tempX = x - maxRadius;
        let tempY = y - maxRadius;
        const r = Math.max(Math.abs(tempX), Math.abs(tempY));

        // Get polar angle index (in range 0 to number of segments)
        const [u, v] = this.squareToDisc(x, y, maxRadius);

        // Create vertex
        grid.push(new Vertex([u, v], index, []));
      }
    }
    return grid;
  }
  squareToDisc(x, y, maxRadius) {
    // Calculate the Manhattan distance from center
    x -= maxRadius;
    x /= maxRadius;
    y -= maxRadius;
    y /= maxRadius;
    // Calculate u, v coordinates according to the Shirley-Chiu mapping function
    if (Math.abs(x) >= Math.abs(y)) {
      return [
        x * Math.cos(((Math.PI / 4) * y) / x) * maxRadius,
        x * Math.sin(((Math.PI / 4) * y) / x) * maxRadius,
      ];
    } else {
      return [
        y * Math.cos(Math.PI / 2 - (Math.PI / 4) * (x / y)) * maxRadius,
        y * Math.sin(Math.PI / 2 - (Math.PI / 4) * (x / y)) * maxRadius,
      ];
    }
  }
  update(...args) {
    const { gridSize, type, speed } = args;

    if (this.compareGrids(this.grid, this.destGrid)) {
      console.log("Grids are equal, switching type");
      this.type = this.type === "cartesian" ? "polar" : "cartesian";
      this.destGrid = this.getGrid(this.type);
      return;
    }

    // console.log("lerping");
    this.lerpGrid(this.destGrid, speed || 0.09); // Use a smaller value for smoother transition
  }
  compareGrids(grid1, grid2) {
    for (let i = 0; i < grid1.length; i++) {
      if (!grid1[i].equ(grid2[i])) return false;
    }
    return true;
  }
  lerpGrid(to, t) {
    for (let i = 0; i < this.grid.length; i++) {
      this.grid[i].lerp(to[i], t);
    }
    return this;
  }
  getNeighbors(index) {
    let neighbors = [];
    if (this.type === "cartesian") {
      if (index > 0) neighbors.push(this.grid[index - 1]);
      if (index > this.gridSize - 1)
        neighbors.push(this.grid[index - this.gridSize]);
      if (index < this.gridSize - 1)
        neighbors.push(this.grid[index + this.gridSize]);
      if (index < this.gridSize * this.gridSize - 1)
        neighbors.push(this.grid[index + 1]);
    } else if (this.type === "polar") {
      if (index > 0) neighbors.push(this.grid[index - 1]);
      if (index > this.gridSize - 1)
        neighbors.push(this.grid[index - this.gridSize]);
      if (index < this.gridSize - 1)
        neighbors.push(this.grid[index + this.gridSize]);
      if (index < this.gridSize * this.gridSize - 1)
        neighbors.push(this.grid[index + 1]);
    }
    return neighbors;
  }
  toArray() {
    return this.grid;
  }
  get(x, y) {
    return this.grid[x][y];
  }
}

onmessage = (e) => {
  switch (e.data.type) {
    case "init":
      gridSize = e.data.gridSize ? e.data.gridSize : gridSize;
      grid = new Grid(gridSize);
      break;
    case "sync":
      grid.update({ gridSize });
      init();
      break;
    case "update":
      grid.update({ gridSize });
      sendGrid();
      break;
  }
};

function sendGrid() {
  postMessage({
    type: "grid",
    grid: grid.toArray(),
    gridType: grid.type,
  });
}
