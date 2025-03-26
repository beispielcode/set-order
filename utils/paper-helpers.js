// Helper function to create a canvas
function createCanvas(id, width = canvasWidth, height = canvasHeight) {
  let canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  return canvas;
}