// paper.install(window);
paper.setup("paper-canvas");
paper.view.viewSize = new paper.Size(canvasWidth, canvasHeight);
with (paper) {
  // Create a circle
  var circle = new Path.Circle({
    center: view.center,
    radius: 50,
    fillColor: colors[1],
  });

  // On mouse move
  view.onMouseMove = function (event) {
    circle.position = event.point;
  };
}
