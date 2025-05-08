// Helper function to create a canvas
function createCanvas(id, width = canvasWidth, height = canvasHeight) {
  let canvas = document.createElement("canvas");
  canvas.id = id;
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  return canvas;
}

// Function to calculate the convex hull using Graham's scan
function calculateConvexHull(points) {
  // Sort points by x-coordinate (and y-coordinate as a tie-breaker)
  points.sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  // Helper function to calculate cross product
  function cross(o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  // Build the lower hull
  const lower = [];
  for (const point of points) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
    ) {
      lower.pop();
    }
    lower.push(point);
  }

  // Build the upper hull
  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
    ) {
      upper.pop();
    }
    upper.push(point);
  }

  // Remove the last point of each half because it's repeated at the beginning of the other half
  upper.pop();
  lower.pop();

  // Combine lower and upper hull to get the full convex hull
  return lower.concat(upper);
}

/**
 * Rotates a 3D vector around an axis by the specified angle.
 * @param {number[]} vect - The 3D vector to rotate [x, y, z].
 * @param {number[]} axis - The axis to rotate around [x, y, z].
 * @param {number} angle - The angle to rotate by in radians.
 * @returns {number[]} - The rotated vector [x, y, z].
 */
function rotateAround(vect, axis, angle) {
  // Helper functions for vector operations
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }
  function scale(v, s) {
    return [v[0] * s, v[1] * s, v[2] * s];
  }
  function add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }
  function norm(v) {
    const len = Math.sqrt(dot(v, v));
    return len === 0 ? [0, 0, 0] : scale(v, 1 / len);
  }

  // Ensure axis is a unit vector
  const k = norm(axis);

  // Rodrigues' rotation formula
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const term1 = scale(vect, cosA);
  const term2 = scale(cross(k, vect), sinA);
  const term3 = scale(k, dot(k, vect) * (1 - cosA));

  return add(add(term1, term2), term3);
}
