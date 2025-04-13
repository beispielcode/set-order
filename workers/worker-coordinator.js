const gridWorker = new Worker("workers/grid-worker.js");
let structure = {};
gridWorker.onmessage = function (e) {
  // console.log(e.data);

  if (e.data.type === "grid") {
    structure.vertices = e.data.grid.map((vertex) => Vertex.fromObject(vertex));
    structure.type = e.data.gridType;
    structure.gridSize = e.data.gridSize;
  }
};

function initWorkers() {
  [gridWorker].forEach((worker) =>
    worker.postMessage({
      type: "init",
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
    })
  );
}

function syncWorkers() {
  [gridWorker].forEach((worker) =>
    worker.postMessage({
      type: "sync",
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
    })
  );
}

function updateWorkers(options) {
  if (workerActive)
    [gridWorker].forEach((worker) =>
      worker.postMessage({
        type: "update",
        ...options,
      })
    );
  // if (workerActive) requestAnimationFrame(updateWorkers);
}

initWorkers();
updateWorkers();
