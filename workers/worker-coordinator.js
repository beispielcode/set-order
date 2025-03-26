const gridWorker = new Worker("grid-worker.js");

gridWorker.onmessage = function (e) {
  console.log(e.data);
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

initWorkers();

function updateWorkers() {
  [gridWorker].forEach((worker) =>
    worker.postMessage({
      type: "update",
    })
  );
  if (workerActive) requestAnimationFrame(updateWorkers);
}

updateWorkers();
