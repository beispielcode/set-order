class Vertex {
  constructor(vec, index, neighbors, weight = 1) {
    const coords = [
      Number(vec[0]) || 0,
      Number(vec[1]) || 0,
      Number(vec[2]) || 0,
    ];
    this.vec = Vec.fromList(coords);
    this.index = index;
    this.neighbors = neighbors;
    this.weight = weight || 1;
  }
  static fromObject(obj) {
    return new Vertex([...obj.vec.list], obj.index, obj.neighbors, obj.weight);
  }
  lerp(to, t) {
    // Create a copy of the target vector to avoid modifying the original
    const toVecCopy = to.vec.copy();

    // Calculate the difference (this creates a modified copy of toVecCopy)
    const diff = toVecCopy.subVec(this.vec.copy());

    // Scale the difference and add to this.vec
    const lerped = diff.mulNum(t);
    this.vec.addVec(lerped);
    return this;
  }
  equ(vertex) {
    if (this.neighbors.length != vertex.neighbors.length) return false;
    for (let i in this.neighbors)
      if (this.neighbors[i] != vertex.neighbors[i]) return false;
    if (this.index != vertex.index) return false;
    if (this.weight != vertex.weight) return false;
    return this.vec.equ(vertex.vec);
  }
}
