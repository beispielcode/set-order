let vw = Math.max(
  document.documentElement.clientWidth || 0,
  window.innerWidth || 0
);
let vh = Math.max(
  document.documentElement.clientHeight || 0,
  window.innerHeight || 0
);

const GLOBAL_SCALE = 0.5;

let canvasWidth = 4480 * GLOBAL_SCALE;
let canvasHeight = 2520 * GLOBAL_SCALE;

// Update viewport size
window.addEventListener("resize", () => {
  vw = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
  vh = Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0
  );
  canvasWidth = 4480 * GLOBAL_SCALE;
  canvasHeight = 2520 * GLOBAL_SCALE;
});

// Math helpers
function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

function map(value, from1, to1, from2, to2) {
  return ((value - from1) / (to1 - from1)) * (to2 - from2) + from2;
}

function random(min, max) {
  if (!max) return Math.random() * min;
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  if (!max) return parseInt(Math.random() * min);
  return parseInt(Math.floor(Math.random() * (max - min + 1)) + min);
}

function cap(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundToDecimal(value, decimal) {
  return Math.round(value * (1 / decimal)) / (1 / decimal);
}

// Array helpers
Array.prototype.shuffle = function () {
  for (let i = this.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [this[i], this[j]] = [this[j], this[i]];
  }
  return this;
};

const primeArray = [
  1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
  73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151,
  157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233,
  239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317,
  331, 337, 347,
];

// https://www.youtube.com/watch?v=KPoeNZZ6H4s
// class SecondOrderDynamics {
//   /**
//    * Constructor to initialise the dynamics constants and state variables.
//    * @param {number} f - Frequency (how fast the system reacts).
//    * @param {number} z - Damping ratio (controls oscillations).
//    * @param {number} r - Responsiveness (how quickly the system reacts to changes).
//    * @param {number} x0 - Initial position.
//    */
//   constructor(f, z, r, x0) {
//     // Compute constants
//     this.k1 = z / (Math.PI * f);
//     this.k2 = 1 / (2 * Math.PI * f * (2 * Math.PI * f));
//     this.k3 = (r * z) / (2 * Math.PI * f);

//     // Initialise variables
//     this.xp = x0; // Previous input
//     this.y = x0; // Current position
//     this.yd = 0; // Current velocity
//     return this.y;
//   }

//   /**
//    * Update the position and velocity using second-order dynamics.
//    * @param {number} T - Time step (delta time).
//    * @param {number} x - Current input position.
//    * @param {number|null} xd - Current input velocity (optional).
//    * @returns {number} - Updated position.
//    */
//   update(T, x, xd = null) {
//     if (xd === null) {
//       // Estimate velocity if not provided
//       xd = (x - this.xp) / T;
//       this.xp = x;
//     }

//     // Integrate position by velocity
//     this.y += T * this.yd;

//     // Integrate velocity by acceleration
//     this.yd += T * ((x + this.k3 * xd - this.y - this.k1 * this.yd) / this.k2);

//     return this.y; // Return the updated position
//   }
// }
