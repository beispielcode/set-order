class Vertex {
  constructor(vec, index, neighbors, weight, debug) {
    const coords = [
      Number(vec[0]) || 0,
      Number(vec[1]) || 0,
      Number(vec[2]) || 0,
    ];
    this.vec = Vec.fromList(coords);
    this.index = index;
    this.neighbors = neighbors || [];
    this.weight = weight == undefined ? 1 : weight;
    this.debug = debug || new Map();
  }
  static fromObject(obj) {
    return new Vertex(
      [...obj.vec.list],
      obj.index,
      obj.neighbors,
      obj.weight,
      obj.debug
    );
  }
  addNeighbor(neighbor) {
    this.neighbors.push(neighbor);
    return this;
  }
  setNeighbors(neighbors, overwrite = false) {
    if (overwrite) {
      this.neighbors = neighbors;
    } else {
      this.neighbors.push(...neighbors);
    }
    return this;
  }
  lerp(to, t) {
    this.vec.lerp(to.vec, t);
    this.weight = this.weight * (1 - t) + to.weight * t;

    // lerp neighbors
    const fromNeighborsIndexes = this.neighbors.map(
      (neighbor) => neighbor.index
    );
    const toNeighborsIndex = to.neighbors.map((neighbor) => neighbor.index);
    toNeighborsIndex.forEach((toNeighbor, index) => {
      const fromNeighborIndex = fromNeighborsIndexes.indexOf(toNeighbor);
      if (fromNeighborIndex == -1) {
        this.addNeighbor({ index: toNeighbor, weight: 0 });
        fromNeighborsIndexes.push(toNeighbor);
      }
    });
    fromNeighborsIndexes.forEach((fromNeighbor, index) => {
      const fromNeighborWeight = this.neighbors[index].weight;
      const toNeighborIndex = toNeighborsIndex.indexOf(fromNeighbor);
      if (toNeighborIndex > -1)
        this.neighbors[index].weight =
          fromNeighborWeight +
          (to.neighbors[toNeighborIndex].weight - fromNeighborWeight) * t;
      else
        this.neighbors[index].weight =
          fromNeighborWeight + (0 - fromNeighborWeight) * t;
    });

    // lerp debug
    for (const [key, value] of to.debug.entries()) this.debug.set(key, value);
    for (const [key, value] of this.debug.entries())
      if (!to.debug.has(key)) this.debug.delete(key);
    return this;
  }
  equ(vertex, tolerance = 0.0001) {
    // if (this.neighbors.length != vertex.neighbors.length) return false;
    // if (this.neighbors[i] != vertex.neighbors[i]) return false;
    for (let i in this.neighbors) if (this.index != vertex.index) return false;
    // if (this.weight != vertex.weight) return false;
    // Add a tolerance
    if (Math.abs(this.weight - vertex.weight) > tolerance) return false;
    return this.vec.equ(vertex.vec);
  }
  dist(vertex) {
    return this.vec.dist(vertex.vec);
  }
  addDebug(key, value) {
    this.debug.set(key, value);
    return this;
  }

  copy() {
    return Vertex.fromObject(this);
  }
}
