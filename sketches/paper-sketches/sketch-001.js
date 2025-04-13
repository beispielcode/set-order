// paper.install(window);
paper.setup("paper-canvas");
paper.view.viewSize = new paper.Size(canvasWidth, canvasHeight);
with (paper) {
  let frameCount = 0;

  // Define the grid parameters
  const gridSize = 70;
  const gridRows = Math.ceil(view.size.height / gridSize);
  const gridCols = Math.ceil(view.size.width / gridSize);
  const squareGridTemplate = new Path.Rectangle({
    point: [0, 0],
    size: [gridSize, gridSize],
    strokeColor: "#000",
    fillColor: "#E6E6E6",
    strokeWidth: 1,
  });
  // const square = new Path.Rectangle({
  //   point: [0, 0],
  //   size: [gridSize * 2, gridSize * 2],
  //   strokeColor: "#000",
  //   fillColor: "#E6E6E6",
  //   strokeWidth: 1,
  // });
  const square = new Path.Circle({
    point: [0, 0],
    radius: gridSize,
    // size: [gridSize * 2, gridSize * 2],
    // strokeColor: "#000",
    // fillColor: "#E6E6E6",
    fillColor: "#000",
    // strokeWidth: 1,
  });
  // Create a symbol from the square path
  const squareGridSymbol = new Symbol(squareGridTemplate);
  const squareSymbol = new Symbol(square);
  const squareSymbolArray = [];
  const squareDestinationArray = [];
  // Place the symbols in a grid
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      // Calculate position for this grid cell
      const x = col * gridSize;
      const y = row * gridSize;

      // Place a symbol instance at this position
      const instance = squareGridSymbol.place([
        x + gridSize / 2,
        y + gridSize / 2,
      ]);
    }
  }
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      // Calculate position for this grid cell
      const x = col * gridSize;
      const y = row * gridSize;
      if (
        row > 2 &&
        row < gridRows - 2 &&
        col > 3 &&
        col < gridCols - 3 &&
        x % 3 == 1 &&
        y % 3 == 0
      ) {
        console.log(x, y);

        const symbol = squareSymbol.place([x, y]);
        squareDestinationArray.push([col, row]);
        const pathfinder = new PathFinder(
          gridCols,
          gridRows,
          [col, row],
          // [col, row]
          [Math.round(gridCols / 2), Math.round(gridRows / 2)]
        );
        const path = pathfinder.search();
        // const path2Dest = new Path();
        // path2Dest.strokeColor = "black";
        // path2Dest.selected = true;
        // for (const vertex of path) {
        //   path2Dest.add(
        //     new Point(
        //       vertex.vec.ind(0) * gridSize,
        //       vertex.vec.ind(1) * gridSize
        //     )
        //   );
        // }
        squareSymbolArray.push({ symbol, path, pathfinder });
        // console.log(path2Dest);
      }
    }
  }
  // Create a circle
  // var circle = new Path.Circle({
  //   center: view.center,
  //   radius: 50,
  //   fillColor: colors[1],
  // });
  let threshold = 1;

  view.onFrame = function (event) {
    frameCount++;

    // circle.radius = Math.round(Math.sin(frameCount / 100) * 50);
    // square.bounds.width = Math.sin(frameCount / 100) * 100 + 100;
    // square.bounds.height = Math.cos(frameCount / 100) * 100 + 100;
    // square.point = view.center;
    // console.log(square.size);
    if (frameCount % 10 == 0) {
      squareSymbolArray.forEach(({ symbol, path, pathfinder }, index) => {
        // if (Math.random() > threshold) {
        if (
          index > 0 &&
          squareSymbolArray[index - 1].pathfinder.coordinateIndex <
            squareSymbolArray[index - 1].path.length - 2
        )
          return;
        pathfinder.coordinateIndex++;
        if (pathfinder.coordinateIndex < path.length) {
          symbol.selected = true;
          clearTimeout(symbol.timeout);
          symbol.timeout = setTimeout(() => {
            symbol.selected = false;
          }, 500);
          const nextGridPoint =
            path[
              Math.min(pathfinder.coordinateIndex, path.length - 1)
            ].toArray();
          const nextPoint = new Point(
            nextGridPoint[0] * gridSize,
            nextGridPoint[1] * gridSize
          );
          // console.log(nextPoint);

          symbol.translate(
            nextPoint.x - symbol.position.x,
            nextPoint.y - symbol.position.y
          );
        }
        // }
      });
    }
    const destinationReached = squareSymbolArray.reduce((acc, v) => {
      return acc ? v.pathfinder.coordinateIndex >= v.path.length + 20 : acc;
    }, true);

    if (destinationReached) {
      console.log(destinationReached);
      squareDestinationArray.shuffle();
      // squareDestinationArray.push(squareDestinationArray.shift());
      squareSymbolArray.forEach((obj, index) => {
        obj.pathfinder.setStartIndex(obj.pathfinder.endIndex);
        obj.pathfinder.setEndIndex(squareDestinationArray[index]);
        obj.path = obj.pathfinder.search();
      });
    }
  };

  // On mouse move
  view.onMouseMove = function (event) {
    threshold = map(event.point.x, 0, canvasWidth, 1, 0.75);

    // circle.position = event.point;
    // square.size = new Size(
    //   Math.sin(frameCount / 100) * 100,
    //   Math.cos(frameCount / 100) * 100
    // );
  };
}
