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
