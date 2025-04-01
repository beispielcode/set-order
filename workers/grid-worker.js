importScripts("../lib/vec.js", "../lib/matrix.js", "../lib/vertex.js");
let gridSize, mode, speed, grid;

// Helpers

const polarToCartesian = (r, theta) => {
  return [r * Math.cos(theta), r * Math.sin(theta)];
};
const cartesianToPolar = (x, y) => {
  return [Math.sqrt(x ** 2 + y ** 2), Math.atan2(y, x)];
};

function lcm(...numbers) {
  // Handle edge cases
  if (numbers.length === 0) return 0;
  if (numbers.length === 1) return Math.abs(numbers[0]);

  // Check if any number is 0
  if (numbers.includes(0)) return 0;

  // Start with the first number
  let result = Math.abs(numbers[0]);

  // Calculate LCM for each additional number
  for (let i = 1; i < numbers.length; i++) {
    const num = Math.abs(numbers[i]);
    // LCM(a,b) = (a * b) / gcd(a,b)
    result = (result * num) / gcd(result, num);
  }

  return result;
}
function gcd(a, b) {
  // Handle special cases
  if (a === 0) return b;
  if (b === 0) return a;
  if (a === b) return a;

  // Optimize for powers of 2
  if (a === 1 || b === 1) return 1;

  // Using binary GCD algorithm (Stein's algorithm)
  let shift = 0;

  // Find common factors of 2
  while (((a | b) & 1) === 0) {
    a >>= 1;
    b >>= 1;
    shift++;
  }

  // Remove all factors of 2 from a
  while ((a & 1) === 0) {
    a >>= 1;
  }

  // Main loop
  do {
    // Remove all factors of 2 from b
    while ((b & 1) === 0) {
      b >>= 1;
    }

    // Ensure a ≤ b
    if (a > b) {
      [a, b] = [b, a];
    }

    b -= a;
  } while (b !== 0);
  // Restore common factors of 2
  return a << shift;
}

class Grid {
  constructor(gridSize = 15, type = "cartesian") {
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
  }
  getCartesianGrid() {
    const grid = [];
    const halfWidth = Math.floor(this.gridSize / 2);
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const index = x + y * this.gridSize;
        grid.push(new Vertex([x - halfWidth, y - halfWidth], index, [], 1));
      }
    }
    this.center = halfWidth + halfWidth * this.gridSize;
    this.getNeighbors(grid);
    return grid;
  }
  getPolarGrid() {
    const grid = [];
    const maxRadius = Math.floor(this.gridSize / 2);
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const index = x + y * this.gridSize;
        let dx = x - maxRadius;
        let dy = y - maxRadius;
        const r = Math.max(Math.abs(dx), Math.abs(dy));

        // Get polar angle index (in range 0 to number of segments)
        const [u, v] = this.squareToDisc(x, y, maxRadius);

        // Create vertex
        grid.push(new Vertex([u, v], index, [], 0));
        if (!dx && !dy) grid[index].addDebug("center", true);
        if (!dx && !dy) this.center = index;
        // console.log(index);
        console.log(grid[index].weight);
      }
    }
    this.getNeighbors(grid);
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
  update(args) {
    let { gridSize, type, speed } = args;

    // gridSize = gridSize % 2 ? gridSize : gridSize + 1;
    // console.log(gridSize);
    // if (!isNaN(gridSize) && this.gridSize != gridSize) {
    //   this.changeGridSize(gridSize);
    // }

    if (this.compareGrids(this.destGrid)) {
      console.log("Grids are equal, switching type");
      this.type = this.type === "cartesian" ? "polar" : "cartesian";
      this.destGrid = this.getGrid(this.type);
      return;
    }

    // console.log("lerping");

    // this.lerpGrid(this.destGrid, speed || 0.0125);
    // this.lerpGrid(this.destGrid, speed || 0.75);
    this.lerpGrid(this.destGrid, speed || 0.075);
  }
  changeGridSize(gridSize) {
    const prevGridSize = this.gridSize;
    this.gridSize = gridSize;
    const newGrid = this.getGrid(this.type);
    // if (prevGridSize < gridSize) {
    //   const offsetX = gridSize - prevGridSize;
    //   for (let i = 0; i < prevGridSize; i++) {
    //     newGrid.splice(
    //       offsetX + (offsetX + i) * prevGridSize,
    //       prevGridSize,
    //       ...this.grid.splice(i * prevGridSize, prevGridSize)
    //     );
    //   }
    // }

    this.grid = newGrid;
  }
  compareGrids(to) {
    if (this.grid.length != to.length) return false;
    for (let i = 0; i < this.grid.length; i++) {
      if (!this.grid[i].equ(to[i])) return false;
    }
    return true;
  }
  lerpGrid(to, t) {
    if (this.grid.length >= to.length) {
      for (let i = 0; i < this.grid.length; i++) {
        // if (i < to.length) this.grid[i].lerp(to[i], t);
        if (i < to.length) {
          if (!i || this.grid[i - 1].equ(to[i - 1]))
            this.grid[i].lerp(to[i], t);
          // this.grid[i].lerp(to[i], (Math.sin(i) + 1) * 0.25);
        } else if (this.grid[i].weight > 0.001) {
          const newVertex = this.grid[i];
          newVertex.weight = 0;
          this.grid[i].lerp(newVertex, t);
          // this.grid[i].lerp(newVertex, (Math.sin(i) + 1) * 0.25);
        }
        //remove vertices with weight 0
        else {
          this.grid.splice(i, 1);
          i--;
        }
        // if (!this.grid[i].equ(to[i])) break;
      }
    } else {
      for (let i = 0; i < to.length; i++) {
        // if (i < this.grid.length) this.grid[i].lerp(to[i], t);
        if (i < this.grid.length) {
          if (!i || this.grid[i - 1].equ(to[i - 1]))
            this.grid[i].lerp(to[i], t);
          // this.grid[i].lerp(to[i], (Math.sin(i) + 1) * 0.25);
        } else {
          let newNeighbors = [];
          to[i].neighbors.forEach((neighbor) => {
            newNeighbors.push({ index: neighbor.index, weight: 0 });
          });
          const newVertex = new Vertex([...to[i].vec.list], i, newNeighbors, 1);
          // newVertex.weight = 0;

          newVertex.neighbors.forEach((neighbor) => (neighbor.weight = 0));

          this.grid.push(newVertex);
        }
      }
    }
    return this;
  }
  getNeighbors(grid = this.grid, gridSize = this.gridSize, type = this.type) {
    if (type === "cartesian") {
      // Direction offsets: top, left, bottom, right
      const directions = [-gridSize, -1, gridSize, 1];

      grid.forEach((vertex, index) => {
        grid[index].addDebug("i", index);
        const x = index % gridSize;
        const y = Math.floor(index / gridSize);
        const neighbors = [];

        // Check each direction
        if (y > 0) neighbors.push({ index: index - gridSize, weight: 1 }); // top
        if (x > 0) neighbors.push({ index: index - 1, weight: 1 }); // left
        if (y < gridSize - 1)
          neighbors.push({ index: index + gridSize, weight: 1 }); // bottom
        if (x < gridSize - 1) neighbors.push({ index: index + 1, weight: 1 }); // right

        vertex.setNeighbors(neighbors);
      });
    } else if (type === "polar") {
      const maxRadius = Math.floor(gridSize / 2);
      const centerIndex = maxRadius + maxRadius * gridSize;

      // Pre-compute all common neighborhoods
      // Create lookup objects for different neighborhood types
      const centerNeighbors = [];
      const axisNeighbors = new Map(); // Key: position descriptor, Value: neighbor offsets
      const diagonalNeighbors = new Map();
      const normalNeighbors = new Map();

      // Fill center neighborhood (all 8 directions)
      if (maxRadius > 0) {
        const offsets = [
          -gridSize - 1,
          -gridSize,
          -gridSize + 1,
          -1,
          1,
          gridSize - 1,
          gridSize,
          gridSize + 1,
        ];
        for (const offset of offsets) {
          centerNeighbors.push({ index: centerIndex + offset, weight: 1 });
        }
      }

      // Process each cell
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const index = x + y * gridSize;
          const dx = x - maxRadius;
          const dy = y - maxRadius;
          const r = Math.max(Math.abs(dx), Math.abs(dy));
          let neighbors = [];
          grid[index].addDebug("i", index);

          // Center point
          if (r === 0) {
            grid[index].setNeighbors(centerNeighbors);
            continue;
          }

          // Axis points (horizontal or vertical)
          if (dx === 0 || dy === 0) {
            // Add horizontal neighbors if not at horizontal edge
            if (dx !== -maxRadius && dx !== maxRadius) {
              neighbors.push({ index: index - 1, weight: 1 });
              neighbors.push({ index: index + 1, weight: 1 });
            }
            // Add vertical neighbors if not at vertical edge
            if (dy !== -maxRadius && dy !== maxRadius) {
              neighbors.push({ index: index - gridSize, weight: 1 });
              neighbors.push({ index: index + gridSize, weight: 1 });
            }
            // Handle special cases for edges
            if (dx === -maxRadius)
              neighbors.push({ index: index + 1, weight: 1 });
            if (dx === maxRadius)
              neighbors.push({ index: index - 1, weight: 1 });
            if (dy === -maxRadius)
              neighbors.push({ index: index + gridSize, weight: 1 });
            if (dy === maxRadius)
              neighbors.push({ index: index - gridSize, weight: 1 });
          }
          // Diagonal points
          else if (Math.abs(dx) === Math.abs(dy)) {
            // These are the same diagonal type cases (dx == dy or dx == -dy)
            // Combining them with a more mathematical approach

            // Determine which diagonal and find appropriate neighbors
            const diagonalType = dx * dy > 0 ? "main" : "anti";

            // Calculate neighbors based on quadrant and distance from edge
            if (diagonalType === "main") {
              // Main diagonal (top-left to bottom-right)
              //   if (dx > 0) {
              //     // Bottom-right quadrant
              //     neighbors.push({ index: index - 1, weight: 1 });
              //     if (dy !== -maxRadius) {
              //       neighbors.push({ index: index - gridSize, weight: 1 });
              //       neighbors.push({ index: index - gridSize - 1, weight: 1 });
              //     }
              //     if (dy !== maxRadius && dx !== maxRadius)
              //       neighbors.push({ index: index + gridSize + 1, weight: 1 });
              //   } else {
              //     // Top-left quadrant
              //     neighbors.push({ index: index + 1, weight: 1 });
              //     if (dy !== maxRadius) {
              //       neighbors.push({ index: index + gridSize, weight: 1 });
              //       neighbors.push({ index: index + gridSize + 1, weight: 1 });
              //     }
              //     if (dy !== -maxRadius && dx !== -maxRadius)
              //       neighbors.push({ index: index - gridSize - 1, weight: 1 });
              //   }
              // } else {
              //   // Anti-diagonal (bottom-left to top-right)
              //   if (dy > 0) {
              //     // Bottom-left quadrant
              //     neighbors.push({ index: index + 1, weight: 1 });
              //     if (dx !== maxRadius) {
              //       neighbors.push({ index: index - gridSize, weight: 1 });
              //       neighbors.push({ index: index - gridSize + 1, weight: 1 });
              //     }
              //     if (dy !== maxRadius && dx !== -maxRadius)
              //       neighbors.push({ index: index + gridSize - 1, weight: 1 });
              //   } else {
              //     // Top-right quadrant
              //     neighbors.push({ index: index - 1, weight: 1 });
              //     if (dy !== maxRadius) {
              //       neighbors.push({ index: index + gridSize, weight: 1 });
              //       neighbors.push({ index: index + gridSize - 1, weight: 1 });
              //     }
              //     if (dx !== maxRadius && dy !== -maxRadius)
              //       neighbors.push({ index: index - gridSize + 1, weight: 1 });
              //   }
            }
          }
          // Regular points (not on axes or diagonals)
          else {
            // Determine if this is an x-dominated or y-dominated point
            const isXDominated = Math.abs(dx) > Math.abs(dy);
            const gdcXY = gcd(Math.abs(dx), Math.abs(dy));

            // Add vertical neighbors for x-dominated points
            if (isXDominated) {
              if (dy !== -maxRadius)
                neighbors.push({ index: index - gridSize, weight: 1 });
              if (dy !== maxRadius)
                neighbors.push({ index: index + gridSize, weight: 1 });
            }
            // Add horizontal neighbors for y-dominated points
            else {
              if (dx !== -maxRadius)
                neighbors.push({ index: index - 1, weight: 1 });
              if (dx !== maxRadius)
                neighbors.push({ index: index + 1, weight: 1 });
            }

            // Add diagonal neighbors
            grid[index].addDebug("dx", dx);
            grid[index].addDebug("dy", dy);
            grid[index].addDebug("gdcXY", gdcXY);

            // console.log(
            //   dx,
            //   dy,
            //   gdcXY,
            //   dx / gdcXY,
            //   dy / gdcXY,
            //   maxRadius,
            //   Math.abs(dx + dx / gdcXY) <= maxRadius,
            //   Math.abs(dy + dy / gdcXY) <= maxRadius,
            //   index + dx / gdcXY + (dy / gdcXY) * gridSize,
            //   Math.abs(dx - dx / gdcXY) <= maxRadius,
            //   Math.abs(dy - dy / gdcXY) <= maxRadius,
            //   index - dx / gdcXY - (dy / gdcXY) * gridSize
            // );

            // if (
            //   Math.abs(dx + dx / gdcXY) <= maxRadius &&
            //   Math.abs(dy + dy / gdcXY) <= maxRadius
            // )
            //   neighbors.push({
            //     index: index + dx / gdcXY + (dy / gdcXY) * gridSize,
            //     weight: 1,
            //   });

            // if (Math.abs(dx - dx / gdcXY) > 0 && Math.abs(dy - dy / gdcXY) > 0)
            //   neighbors.push({
            //     index: index - dx / gdcXY - (dy / gdcXY) * gridSize,
            //     weight: 1,
            //   });
            if (gdcXY == 1) {
              // grid[centerIndex].addNeighbor({ index: index, weight: 1 });
            }
          }

          grid[index].setNeighbors(neighbors);
          // console.log(grid[index].neighbors);
        }
      }
    }

    return grid;
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
      gridSize = e.data.gridSize ? e.data.gridSize : gridSize;
      grid.update({ gridSize });
      sendGrid();
      break;
  }
};

function sendGrid() {
  postMessage({
    type: "grid",
    grid: grid.toArray(),
    center: grid.center,
    gridType: grid.type,
    gridSize: grid.gridSize,
  });
}
