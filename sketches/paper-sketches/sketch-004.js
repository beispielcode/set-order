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
    fillColor: colors[0],
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
      // const instance = squareGridSymbol.place([
      //   x + gridSize / 2,
      //   y + gridSize / 2,
      // ]);
    }
  }

  let imprecisionRange = gridSize * 0.125;
  const dotTemplate = new Path.Rectangle({
    point: [0, 0],
    // size: [paper.view.viewSize.height / 2, paper.view.viewSize.height / 2],
    // size: [paper.view.viewSize.width / 3, paper.view.viewSize.height / 3],
    size: [gridSize * 2, gridSize * 2],
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
      // const [x, y] = this.position;
      const { x, y } = this.dot.position;
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
  const sizes = [
    [980, 980],
    [980 - 140 * 2, 980 - 140 * 2],
    [980 - 140 * 4, 980 - 140 * 4],
    [140, 140],
  ];
  const dotArray = [
    new Path.Rectangle({
      // point: [70, 70],
      point: [140 + 490, 140],
      size: sizes[0],
      fillColor: "#000",
      applyMatrix: false,
      targetPosition: this.position,
      valueDynamics: {
        scaling: new SecondOrderDynamics(
          easedChannelDynamicsF,
          easedChannelDynamicsZeta,
          easedChannelDynamicsR / 2,
          0
        ),
        shakyness: new SecondOrderDynamics(
          easedChannelDynamicsF * 0.75,
          easedChannelDynamicsZeta,
          easedChannelDynamicsR,
          0
        ),
      },
    }),
    new Path.Rectangle({
      // point: [70 + 140 * 1, 70 + 140 * 1],
      point: [70 + 140 * 1 + 490, 70 + 140 * 1],
      size: sizes[1],
      fillColor: "#e6e6e6",
      fillColor: colors[0],
      applyMatrix: false,
      targetPosition: this.position,
      valueDynamics: {
        scaling: new SecondOrderDynamics(
          easedChannelDynamicsF,
          easedChannelDynamicsZeta,
          easedChannelDynamicsR / 2,
          0
        ),
        shakyness: new SecondOrderDynamics(
          easedChannelDynamicsF * 0.75,
          easedChannelDynamicsZeta,
          easedChannelDynamicsR,
          0
        ),
      },
    }),
    new Path.Rectangle({
      // point: [70 + 140 * 2, 70 + 140 * 2],
      point: [70 + 140 * 2 + 490, 70 + 140 * 2],
      size: sizes[2],
      fillColor: "#FFFF00",
      fillColor: "#000",
      applyMatrix: false,
      targetPosition: this.position,
      valueDynamics: {
        scaling: new SecondOrderDynamics(
          easedChannelDynamicsF,
          easedChannelDynamicsZeta,
          easedChannelDynamicsR / 2,
          0
        ),
        shakyness: new SecondOrderDynamics(
          easedChannelDynamicsF * 0.75,
          easedChannelDynamicsZeta,
          easedChannelDynamicsR,
          0
        ),
      },
    }),
    new Path.Rectangle({
      // point: [70 + 140 * 3.5, 70 + 140 * 3.5],
      point: [70 + 140 * 3.5 + 490, 70 + 140 * 3.5],
      size: sizes[3],
      fillColor: "#FF1493",
      fillColor: "#e6e6e6",
      fillColor: colors[0],
      applyMatrix: false,
      targetPosition: this.position,
      valueDynamics: {
        scaling: new SecondOrderDynamics(
          easedChannelDynamicsF,
          easedChannelDynamicsZeta,
          easedChannelDynamicsR,
          0
        ),
        shakyness: new SecondOrderDynamics(
          easedChannelDynamicsF * 0.75,
          easedChannelDynamicsZeta,
          easedChannelDynamicsR,
          0
        ),
      },
    }),
  ];

  window.addEventListener("midimessage", (e) => {
    if (e.data.type == "controlchange") {
      if (e.data.control == 0) {
      } else if (e.data.control == 1) {
        // speed = parseInt(map(e.data.value, 0, 127, 200, 1));
        console.log(speed);
      } else if (e.data.control == 2) {
        // precision = map(e.data.value, 0, 127, 0, 1);
      }
    }
  });

  let speed = parseInt(map(easedChannels[1], 0, 127, 200, 1));
  let precision = map(easedChannels[2], 0, 127, 0, 1);

  function lerpPoint(a, b, t) {
    return new Point(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
  }

  let delayEnded = !recordingActive;
  view.onFrame = function (event) {
    speed = map(easedChannels[1], 0, 127, 200, 1);
    precision = map(easedChannels[2], 0, 127, 0, 1);
    frameCount++;
    if (!delayEnded && recordingActive && frameCount < 650) return;
    else if (!delayEnded && recordingActive && frameCount == 650) {
      delayEnded = true;
      recordingActive = false;
      recordingActiveInput.checked = false;
      updateConfig({ recording: recordingActive ? "true" : "false" });
      frameCount = 0;
    }
    let movement = new Point(490, 0);
    const origin = new Point(630 + 490, 630);

    const shakeAmount = cap(
      map(performance.now() - lastInteraction, 500, 45000, 0, 1),
      0,
      1
    );
    // const shakeAmount = Math.max(
    //   map(performance.now() - lastInteraction, 500, 45000, 0, 1),
    //   0
    // );

    for (let i = 0; i < dotArray.length; i++) {
      const dot = dotArray[i];
      let prevDot = dot;
      if (i > 0) prevDot = dotArray[i - 1];
      // console.log(dot.position);
      let addedMovement;
      let lerp, from, to, fromIndex, toIndex, t;
      switch (i) {
        case 1:
          movementPattern = [
            new Point((prevDot.bounds.width + 140) / 2, 140),
            // new Point(-140, 140),
            // new Point(-140, -140),
            new Point(-(prevDot.bounds.width + 140) / 2, 140),
            new Point(-(prevDot.bounds.width + 140) / 2, -140),
            new Point((prevDot.bounds.width + 140) / 2, -140),
          ];
          lerp = map(speed, 1 * 1, 200 * 1, 0, movementPattern.length);
          // fromIndex = Math.floor(frameCount / speed) % movementPattern.length;
          fromIndex = Math.floor(lerp) % movementPattern.length;
          toIndex = (fromIndex + 1) % movementPattern.length;
          from = movementPattern[fromIndex];
          to = movementPattern[toIndex];
          (from + 1) % movementPattern.length;
          // t = map(frameCount % speed, 0, speed, 0, 1);
          t = lerp % 1;
          break;
        case 2:
          movementPattern = [
            new Point(
              -(prevDot.bounds.width + 140 * 2) / 2,
              (prevDot.bounds.height + 140 * 2) / 2
            ),
            new Point(
              -(prevDot.bounds.width + 140 * 2) / 2,
              -(prevDot.bounds.height + 140 * 2) / 2
            ),
            new Point(
              (prevDot.bounds.width + 140 * 2) / 2,
              -(prevDot.bounds.height + 140 * 2) / 2
            ),
            new Point(
              (prevDot.bounds.width + 140 * 2) / 2,
              (prevDot.bounds.height + 140 * 2) / 2
            ),
          ];
          // fromIndex =
          //   Math.floor(frameCount / (speed * 1.5)) % movementPattern.length;
          lerp = map(speed, 1 * 1, 200 * 1, 0, movementPattern.length * 4);
          fromIndex = Math.floor(lerp) % movementPattern.length;
          toIndex = (fromIndex + 1) % movementPattern.length;
          from = movementPattern[fromIndex];
          to = movementPattern[toIndex];
          (from + 1) % movementPattern.length;
          // t = map(frameCount % (speed * 1.5), 0, speed * 1.5, 0, 1);
          t = lerp % 1;
          break;
        case 3:
          addedMovement = new Point(
            (precision * (prevDot.bounds.width + 140)) / 2,
            (precision * -(prevDot.bounds.height + 140)) / 2
          );
          movementPattern = [
            new Point(
              -(prevDot.bounds.width - 140) / 2,
              -(prevDot.bounds.height - 140) / 2
            ),
            new Point(
              -(prevDot.bounds.width - 140) / 2,
              (prevDot.bounds.height - 140) / 2
            ),
            new Point(
              (prevDot.bounds.width - 140) / 2,
              (prevDot.bounds.height - 140) / 2
            ),
            new Point(
              (prevDot.bounds.width - 140) / 2,
              -(prevDot.bounds.height - 140) / 2
            ),
          ];
          // fromIndex =
          //   Math.floor(frameCount / ((speed * 2) / 3)) % movementPattern.length;
          lerp = map(speed, 1 * 1, 200 * 1, 0, movementPattern.length * 8);
          fromIndex = Math.floor(lerp) % movementPattern.length;
          toIndex = (fromIndex + 1) % movementPattern.length;
          from = movementPattern[fromIndex];
          to = movementPattern[toIndex];
          (from + 1) % movementPattern.length;
          // t = map(frameCount % ((speed * 2) / 3), 0, (speed * 2) / 3, 0, 1);
          t = lerp % 1;
          break;
        default:
          from = new Point(0, 0);
          to = new Point(0, 0);
          t = 0;
          break;
      }

      // dot.scaling = cap(
      //   map(easedChannels[0], 0 + 31 * i, 15 + 31 * i, 0, 1),
      //   0,
      //   1
      // );
      if (i > 0)
        dot.scaling = dot.valueDynamics.scaling.update(
          deltaTime,
          channels[0] <= 0 + 31 * i ? 0 : 1
        );
      // console.log(
      //   new SecondOrderDynamics(
      //     easedChannelDynamicsF,
      //     easedChannelDynamicsZeta,
      //     easedChannelDynamicsR,
      //     0
      //   ).update(1)
      // );

      addedMovement = lerpPoint(from, to, t).multiply(precision);
      movement = movement.add(addedMovement);
      dot.position = new Point(630, 630).add(movement);
      let shakyness = dot.valueDynamics.shakyness.update(
        deltaTime,
        shakeAmount
      );

      dot.position = dot.position.add(
        new Point(
          random(-shakyness * imprecisionRange, shakyness * imprecisionRange),
          random(-shakyness * imprecisionRange, shakyness * imprecisionRange)
        )
      );
      // dot.targetPosition = dot.position;
    }
  };
}
