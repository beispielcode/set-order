// Modified from https://dev.to/codesphere/pathfinding-with-javascript-the-a-algorithm-3jlb

class PathFinder {
  constructor(cols, rows, start, end) {
    this.cols = cols; //columns in the grid
    this.rows = rows; //rows in the grid
    this.grid = new Array(cols); //array of all the grid points
    this.openSet = []; //array containing unevaluated grid points
    this.closedSet = []; //array containing completely evaluated grid points
    this.startIndex = start || undefined; //starting grid point
    this.endIndex = end || undefined; // ending grid point (goal)
    this.start = undefined; //starting grid point
    this.end = undefined; // ending grid point (goal)
    this.path = [];
    this.coordinateIndex = 0;
  }

  init() {
    this.path = [];
    // Make a 2D array
    for (let i = 0; i < this.cols; i++) {
      this.grid[i] = new Array(this.rows);
    }

    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        this.grid[i][j] = new GridPoint(i, j);
      }
    }
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        this.grid[i][j].updateNeighbors(this);
      }
    }
    this.start = this.startIndex
      ? this.grid[this.startIndex[0]][this.startIndex[1]]
      : this.grid[0][0];

    this.end = this.endIndex
      ? this.grid[this.endIndex[0]][this.endIndex[1]]
      : this.grid[this.cols - 1][this.rows - 1];
    this.openSet.push(this.start);
    this.coordinateIndex = 0;
    // console.log(this.grid);
  }
  search() {
    this.init();

    while (this.openSet.length > 0) {
      // Assumption lowest index is the first one to begin with
      let lowestIndex = 0;
      for (let i = 0; i < this.openSet.length; i++)
        if (this.openSet[i].f < this.openSet[lowestIndex].f) lowestIndex = i;
      let current = this.openSet[lowestIndex];

      if (current === this.end) {
        let temp = current;
        this.path.push(temp);
        while (temp.parent) {
          this.path.push(temp.parent);
          temp = temp.parent;
        }
        console.log("DONE!");
        // return the traced path
        return this.path.reverse();
      }

      // Remove current from openSet
      this.openSet.splice(lowestIndex, 1);
      // Add current to closedSet
      this.closedSet.push(current);

      let neighbors = current.neighbors;

      for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];

        if (!this.closedSet.includes(neighbor)) {
          let possibleG = current.g + 1;

          if (!this.openSet.includes(neighbor)) this.openSet.push(neighbor);
          else if (possibleG >= neighbor.g) continue;

          neighbor.g = possibleG;
          neighbor.h = neighbor.heuristic(this.end);

          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
        }
      }
    }

    //no solution by default
    return [];
  }
  setStartIndex(...args) {
    if (args.length === 2) this.startIndex = args;
    else if (args.length === 1) this.startIndex = args[0];
    else console.warn("Invalid arguments for setStartIndex");
    // console.log(this.startIndex);
  }

  setEndIndex(...args) {
    if (args.length === 2) this.endIndex = args;
    else if (args.length === 1) this.endIndex = args[0];
    else console.warn("Invalid arguments for setEnd");
  }
}

//constructor function to create all the grid points as objects containind the data for the points
// updated to use Vertex from vertex.js
class GridPoint extends Vertex {
  constructor(x, y) {
    super([x, y]);
    this.f = 0; //total cost function
    this.g = 0; //cost function from start to the current grid point
    this.h = 0; //heuristic estimated cost function from current grid point to the goal
    this.neighbors = []; // neighbors of the current grid point
    this.parent = undefined; // immediate source of the current grid point
    this.toArray = () => this.vec.list;
    this.heuristic = (vertex) => {
      let d1 = Math.abs(this.vec.ind(0) - vertex.vec.ind(0));
      let d2 = Math.abs(this.vec.ind(1) - vertex.vec.ind(1));
      return d1 + d2;
    };
    this.copy = () => {
      const copy = new GridPoint(this.vec.list[0], this.vec.list[1]);
      copy.f = this.f;
      copy.g = this.g;
      copy.h = this.h;
      copy.neighbors = this.neighbors;
      copy.parent = this.parent;
      return copy;
    };

    // update neighbors array for a given grid point
    this.updateNeighbors = function (pathFinder) {
      let [i, j, k] = this.vec.list;

      if (i < pathFinder.cols - 1) this.addNeighbor(pathFinder.grid[i + 1][j]);
      if (i > 0) this.addNeighbor(pathFinder.grid[i - 1][j]);
      if (j < pathFinder.rows - 1) this.addNeighbor(pathFinder.grid[i][j + 1]);
      if (j > 0) this.addNeighbor(pathFinder.grid[i][j - 1]);
      return this;
    };
  }
}
// function GridPoint(x, y) {
//   this.x = x; //x location of the grid point
//   this.y = y; //y location of the grid point
//   this.vec = new Vertex(x, y);
//   this.f = 0; //total cost function
//   this.g = 0; //cost function from start to the current grid point
//   this.h = 0; //heuristic estimated cost function from current grid point to the goal
//   this.neighbors = []; // neighbors of the current grid point
//   this.parent = undefined; // immediate source of the current grid point

//   // update neighbors array for a given grid point
//   this.updateNeighbors = function (grid) {
//     let [i, j, k] = this.vec.toArray();
//     if (i < cols - 1) this.neighbors.push(grid[i + 1][j]);
//     if (i > 0) this.neighbors.push(grid[i - 1][j]);
//     if (j < rows - 1) this.neighbors.push(grid[i][j + 1]);
//     if (j > 0) this.neighbors.push(grid[i][j - 1]);
//   };
// }
