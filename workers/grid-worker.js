importScripts("../lib/vec.js", "../lib/matrix.js");
let canvasWidth, canvasHeight, gridSize, mode, speed;

onmessage = function (e) {
  switch (e.data.type) {
    case "init":
      canvasWidth = e.data.canvasWidth ? e.data.canvasWidth : canvasWidth;
      canvasHeight = e.data.canvasHeight ? e.data.canvasHeight : canvasHeight;
      gridSize = e.data.gridSize ? e.data.gridSize : 10;
      break;
    case "sync":
      canvasWidth = e.data.canvasWidth ? e.data.canvasWidth : canvasWidth;
      canvasHeight = e.data.canvasHeight ? e.data.canvasHeight : canvasHeight;
      gridSize = e.data.gridSize ? e.data.gridSize : gridSize;
      init();
      break;
    case "update":
      updateGrid();
      break;
  }
};

function sendGrid() {
  self.postMessage({
    type: "grid",
    grid: grid.toArray(),
    canvasWidth: canvasWidth,
    canvasHeight: canvasHeight,
    gridSize: gridSize,
  });
}

function init() {
  sendGrid();
}

function updateGrid() {
  console.log("j");

  sendGrid();
}
