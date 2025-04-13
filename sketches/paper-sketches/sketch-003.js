// paper.install(window);
paper.setup("paper-canvas");
paper.view.viewSize = new paper.Size(canvasWidth, canvasHeight);
with (paper) {
  const background = new Path.Rectangle({
    point: [0, 0],
    size: [canvasWidth, canvasHeight],
    fillColor: colors[0],
  });
  let frameCount = 0;
  const margins = new Point(105, 105);

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
  // Create a symbol from the square path
  const squareGridSymbol = new Symbol(squareGridTemplate);
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

  let imprecisionRange = gridSize * 0.125;
  const dotTemplate = new Path.Rectangle({
    point: [0, 0],
    // size: [paper.view.viewSize.height / 2, paper.view.viewSize.height / 2],
    // size: [gridSize, gridSize],
    size: [paper.view.viewSize.width / 3, paper.view.viewSize.height / 3],
    fillColor: "#000",
  });
  const dotSymbol = new Symbol(dotTemplate);
  class Dot {
    constructor(pos, tempo, tempoOffset = 0, precision = 1) {
      this.position = pos;
      this.tempo = tempo;
      this.tempoOffset = tempoOffset;
      this.precision = precision;
      this.dot = dotSymbol.place(this.position);
    }
    move(pos) {
      // const offsetX = x - this.x;
      // const offsetY = y - this.y;
      const { x, y } = this.dot.position;
      this.position = pos;
      const [targetX, targetY] = pos;
      const destX =
        targetX +
        random(
          ((1 - this.precision) * -imprecisionRange) / 2,
          ((1 - this.precision) * imprecisionRange) / 2
        );
      const destY =
        targetY +
        random(
          ((1 - this.precision) * -imprecisionRange) / 2,
          ((1 - this.precision) * imprecisionRange) / 2
        );
      this.dot.position = new Point(destX, destY);
    }
    shake() {
      const [x, y] = this.position;
      // const { x, y } = this.dot.position;
      this.dot.position = new Point(
        x +
          random(
            ((1 - this.precision) * -imprecisionRange) / 2,
            ((1 - this.precision) * imprecisionRange) / 2
          ),
        y +
          random(
            ((1 - this.precision) * -imprecisionRange) / 2,
            ((1 - this.precision) * imprecisionRange) / 2
          )
      );
    }
    update(pos = this.position) {
      if (frameCount % (this.tempo * speed + this.tempoOffset) == 0) {
        this.move(pos);
      } else this.shake();
    }
  }
  const movementGroups = [[]];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      // movementGroups[0].push([
      //   parseInt(
      //     margins.x + (x * (paper.view.viewSize.width - margins.x * 2)) / 2
      //   ),
      //   parseInt(
      //     margins.y + (y * (paper.view.viewSize.height - margins.y * 2)) / 2
      //   ),
      // ]);
      movementGroups[0].push([
        parseInt(
          paper.view.viewSize.width / 6 +
            (x * (paper.view.viewSize.width - paper.view.viewSize.width / 3)) /
              2
        ),
        parseInt(
          paper.view.viewSize.height / 6 +
            (y *
              (paper.view.viewSize.height - paper.view.viewSize.height / 3)) /
              2
        ),
      ]);
    }
  }
  movementGroups.push(movementGroups[0]);
  movementGroups.push(movementGroups[0]);
  const groupDestIndex = [4, 4, 4];
  let dotGroups = [
    [new Dot(movementGroups[0][4], 1, 0, 1)],
    [new Dot(movementGroups[0][4], 2, 0, 1)],
    [new Dot(movementGroups[0][4], 3, 0, 1)],
  ];

  let speed = parseInt(map(easedChannels[1], 0, 127, 200, 1));
  let precision = map(easedChannels[2], 0, 127, 0, 1);

  let delayEnded = !recordingActive;
  view.onFrame = function (event) {
    frameCount++;
    if (!delayEnded && recordingActive && frameCount < 650) return;
    else if (!delayEnded && recordingActive && frameCount == 650) {
      delayEnded = true;
      recordingActive = false;
      recordingActiveInput.checked = false;
      updateConfig({ recording: recordingActive ? "true" : "false" });
      frameCount = 0;
    }

    speed = parseInt(map(easedChannels[1], 0, 127, 200, 1));
    const newPrecision = map(easedChannels[2], 0, 127, 1, 0);
    if (precision != newPrecision) {
      precision = newPrecision;
      for (let g = 0; g < dotGroups.length; g++)
        for (let index = 0; index < dotGroups[g].length; index++) {
          dotGroups[g][index].precision = precision;
          dotGroups[g][index].tempoOffset = randomInt(
            map(precision, 0, 1, Math.min(dotGroups[g].length, speed / 16), 0)
          );
        }
    }
    for (let g = 0; g < dotGroups.length; g++) {
      const group = dotGroups[g];
      if (frameCount % (group[0].tempo * speed) == 0)
        groupDestIndex[g] = (groupDestIndex[g] + 1) % movementGroups[g].length;
      for (let index = 0; index < group.length; index++) {
        const dot = group[index];
        // movementGroups[0][4];
        dot.update(
          movementGroups[g][groupDestIndex[g]]
          // movementGroups[0][randomInt(0, 0)]
        );
      }
    }
  };
}
