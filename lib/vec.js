// Modified version of Vec.js from https://randomgamingdev.github.io/EzDok/#v1/%22https://raw.githubusercontent.com/RandomGamingDev/VecJs/main/documentation/documentation.dok%22/0/

class Vec {
  constructor(length) {
    this.list = new Float32Array(length);
  }

  static fromList(list) {
    const toReturn = new Vec(
      Array.isArray(list) ? list.length : list.byteLength / 4
    );
    toReturn.list = new Float32Array(list);
    return toReturn;
  }

  static mono(num, length) {
    let toReturn = new Vec(length);
    toReturn.list.fill(num);
    return toReturn;
  }

  ind(i) {
    return this.list[i];
  }

  setInd(i, num) {
    this.list[i] = num;
    return this;
  }

  length() {
    return this.list.length;
  }

  forEach(func) {
    for (let i = 0; i < this.list.length; i++) {
      this.list[i] = func(this.list, this.list[i], i);
    }
    return this;
  }

  abs() {
    return this.forEach((l, v) => Math.abs(v));
  }

  floor() {
    return this.forEach((l, v) => Math.floor(v));
  }

  ceil() {
    return this.forEach((l, v) => Math.ceil(v));
  }

  round() {
    return this.forEach((l, v) => Math.round(v));
  }

  addNum(num) {
    return this.forEach((l, v) => v + num);
  }

  subNum(num) {
    return this.forEach((l, v) => v - num);
  }

  numSub(num) {
    return this.forEach((l, v) => num - v);
  }

  mulNum(num) {
    return this.forEach((l, v) => v * num);
  }

  divNum(num) {
    return this.forEach((l, v) => v / num);
  }

  numDiv(num) {
    return this.forEach((l, v) => num / v);
  }

  powNum(num) {
    return this.forEach((l, v) => v ** num);
  }

  numPow(num) {
    return this.forEach((l, v) => num ** v);
  }

  flip() {
    return this.mulNum(-1);
  }

  inv() {
    return this.numDiv(1);
  }

  addVec(vec) {
    return this.forEach((l, v, i) => v + vec.ind(i));
  }

  subVec(vec) {
    return this.forEach((l, v, i) => v - vec.ind(i));
  }

  mulVec(vec) {
    return this.forEach((l, v, i) => v * vec.ind(i));
  }

  divVec(vec) {
    return this.forEach((l, v, i) => v / vec.ind(i));
  }

  powVec(vec) {
    return this.forEach((l, v, i) => v ** vec.ind(i));
  }

  equ(vec) {
    if (this.list.length !== vec.list.length) return false;
    for (let i = 0; i < this.list.length; i++) {
      // if (this.list[i] !== vec.list[i]) return false;
      // should have a tolerance
      if (Math.abs(this.list[i] - vec.list[i]) > 0.001) return false;
    }
    return true;
  }

  lerp(to, t) {
    return this.forEach((l, v, i) => v + (to.ind(i) - v) * t);
  }

  copy() {
    return Vec.fromList(new Float32Array(this.list));
  }

  slice(start, end) {
    return Vec.fromList(this.list.slice(start, end));
  }

  miniVec(i, length) {
    return this.slice(i, i + length);
  }
}
