// Set up the Paper.js environment
paper.setup("paper-canvas");
paper.view.viewSize = [canvasWidth, canvasHeight];
with (paper) {
  // Add MIDI event listener for control change messages
  window.addEventListener("midimessage", (e) => {
    const { type, control, value } = e.data;
    if (type === "controlchange" && control >= 0 && control < 4)
      updateAxesValue(control, value);
  });
  let frameCount = 0;

  // Create a background rectangle
  const backgroundLayer = new Layer();
  const background = new Path.Rectangle({
    parent: backgroundLayer,
    point: [0, 0],
    size: [view.viewSize.width, view.viewSize.height],
    fillColor: colors[0],
  });

  const sceneElements = [];

  // Scene 01 – Cube
  const s01_gridLayer = new Layer();
  const s01_gridSizeRange = [10, 210];
  const s01_gridRowTemplate = new Path.Line({
    parent: s01_gridLayer,
    strokeColor: "#fff",
    strokeWidth: 2,
    from: new Point(0, 0),
    to: new Point(view.viewSize.width, 0),
  });
  const s01_gridColumnTemplate = new Path.Line({
    parent: s01_gridLayer,
    strokeColor: "#fff",
    strokeWidth: 2,
    from: new Point(0, 0),
    to: new Point(0, view.viewSize.height),
  });
  const s01_gridRowSymbol = new Symbol(s01_gridRowTemplate);
  const s01_gridColumnSymbol = new Symbol(s01_gridColumnTemplate);
  const s01_maxColumns = Math.floor(view.viewSize.width / s01_gridSizeRange[0]);
  const s01_maxRows = Math.floor(view.viewSize.height / s01_gridSizeRange[0]);
  const s01_gridIntersections = {
    columns: new Array(s01_maxColumns + 1).fill(0),
    rows: new Array(s01_maxRows + 1).fill(0),
  };
  function quantisePosition(position) {
    const { x, y } = position;
    let newPosition = new Point(x, y);
    let minDistanceX = Infinity,
      minDistanceY = Infinity;
    for (let i = 0; i < s01_gridIntersections.columns.length; i++) {
      const distanceX = Math.abs(x - s01_gridIntersections.columns[i]);
      if (distanceX < minDistanceX) {
        minDistanceX = distanceX;
        newPosition.x = s01_gridIntersections.columns[i];
      }
    }
    for (let i = 0; i < s01_gridIntersections.rows.length; i++) {
      const distanceY = Math.abs(y - s01_gridIntersections.rows[i]);
      if (distanceY < minDistanceY) {
        minDistanceY = distanceY;
        newPosition.y = s01_gridIntersections.rows[i];
      }
    }
    return newPosition;
  }

  const s01_columns = new Array(s01_maxColumns + 1)
    .fill(0)
    .map((_, index) =>
      s01_gridColumnSymbol.place(
        view.center.add(
          new Point(
            (((index % 2 ? -1 : 1) * roundToDecimal(index, 2)) / 2) *
              s01_gridSizeRange[0],
            0
          )
        )
      )
    );
  const s01_rows = new Array(s01_maxRows + 1)
    .fill(0)
    .map((_, index) =>
      s01_gridRowSymbol.place(
        view.center.add(
          new Point(
            0,
            (((index % 2 ? -1 : 1) * roundToDecimal(index, 2)) / 2) *
              s01_gridSizeRange[0]
          )
        )
      )
    );
  sceneElements.push(
    new Choreography(
      {
        columns: s01_columns,
        rows: s01_rows,
      },
      [
        {
          attribute: "scale",
          axes: [0],
          transitions: ["smooth"],
          controlPoints: [
            { position: [0, 0, 0, 0], value: s01_gridSizeRange[1] },
            { position: [127, 0, 0, 0], value: s01_gridSizeRange[0] },
          ],
        },
        {
          attribute: "exponent",
          axes: [3],
          transitions: ["smooth"],
          controlPoints: [
            { position: [0, 0, 0, 0], value: 1 },
            { position: [0, 0, 0, 127], value: 6 },
          ],
        },
        {
          attribute: "noiseAmount",
          axes: [3],
          transitions: ["smooth"],
          controlPoints: [
            { position: [0, 0, 0, 0], value: 0 },
            { position: [0, 0, 0, 127], value: 4 },
          ],
        },
      ],
      function () {
        const scale = this.scale;
        const exponent = this.exponent;
        const { columns, rows } = this.element;
        const noiseAmount = this.noiseAmount;
        const exponentScale = 10 * exponent;

        s01_gridIntersections.columns = [];
        s01_gridIntersections.rows = [];
        columns.forEach((column, index) => {
          const normalisedIndex =
            (index -
              (columns.length - 1) / 2 +
              noise.simplex2(index, frameCount * 0.0004) * noiseAmount) /
            exponentScale;
          const direction = Math.sign(normalisedIndex);
          let step =
            direction *
            // Math.abs(normalisedIndex) ** exponent *
            Math.abs(normalisedIndex) *
            // exponent *
            exponentScale *
            scale;
          const position = view.center.add(new Point(step, 0));
          if (position.x < 0 || position.x > view.viewSize.width)
            column.remove();
          else {
            s01_gridLayer.addChild(column);
            column.position = position;
            s01_gridIntersections.columns.push(position.x);
          }
        });
        rows.forEach((row, index) => {
          const normalisedIndex =
            (index -
              (rows.length - 1) / 2 +
              noise.simplex2(index, frameCount * 0.0004) * noiseAmount) /
            exponentScale;
          const direction = Math.sign(normalisedIndex);
          let step =
            direction *
            // Math.abs(normalisedIndex) ** exponent *
            Math.abs(normalisedIndex) *
            exponentScale *
            scale;
          const position = view.center.add(new Point(0, step));
          if (position.y < 0 || position.y > view.viewSize.height) row.remove();
          else {
            s01_gridLayer.addChild(row);
            row.position = position;
            s01_gridIntersections.rows.push(position.y);
          }
        });
        frameCount += 1 + Math.max(0, noiseAmount - 2);
      }
    )
  );

  const s01_drawingLayer = new Layer();
  const s01_cubeSizeRange = [140, 1680];
  const s01_cube = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
  ].map((pos) => ({
    point: view.center.add(
      new Point(pos[0] - 0.5, pos[1] - 0.5).multiply(s01_cubeSizeRange[0])
    ),
    position: pos,
  }));

  const s01_cubeLines = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ].map((lines) => ({
    lines: [
      new Path.Line({
        parent: s01_drawingLayer,
        strokeColor: "#FF1493",
        strokeWidth: 2,
        from: s01_cube[lines[0]].point,
        to: s01_cube[lines[1]].point,
      }),
      new Path.Line({
        parent: s01_drawingLayer,
        strokeColor: "#FF1493",
        strokeWidth: 2,
        from: s01_cube[lines[0]].point,
        to: s01_cube[lines[1]].point,
      }),
    ],
    from: lines[0],
    to: lines[1],
  }));
  sceneElements.push(
    new Choreography(
      {
        lines: s01_cubeLines,
        vertices: s01_cube,
      },
      [
        {
          attribute: "size",
          axes: [1],
          transitions: ["smooth"],
          controlPoints: [
            { position: [0, 0, 0, 0], value: s01_cubeSizeRange[0] },
            { position: [0, 127, 0, 0], value: s01_cubeSizeRange[1] },
          ],
        },
        {
          attribute: "rotation",
          axes: [2],
          transitions: ["smooth"],
          controlPoints: [
            { position: [0, 0, 0, 0], value: 0 },
            { position: [0, 0, 127, 0], value: Math.PI / 2 },
          ],
        },
      ],
      function () {
        const { lines, vertices } = this.element;
        const size = this.size;
        const angle = this.rotation;
        const quantisedVertices = [];
        const renderedVertices = vertices.map((vertex, index) => {
          const vector = vertex.position.map((value) => value - 0.5);
          const rotationAxes = [
            [0, 0, 1],
            [0, 1, 0],
            [1, 0, 0],
          ];
          let rotatedVector = vector;
          rotationAxes.forEach((axis) => {
            rotatedVector = rotateAround(rotatedVector, axis, angle);
          });
          const position = view.center.add(
            new Point(rotatedVector[0], rotatedVector[1]).multiply(size)
          );
          // quantisedVertices.push(quantisePosition(position));
          return {
            ...vertex,
            point: position,
          };
        });
        lines.forEach((line, index) => {
          line.lines[0].remove();
          line.lines[1].remove();
          const from = renderedVertices[line.from];
          const to = renderedVertices[line.to];
          lines[index].lines = [
            new Path.Line({
              parent: s01_drawingLayer,
              strokeColor: "#FFF",
              strokeWidth: 2,
              from: from.point,
              to: to.point,
            }),
            new Path.Line({
              parent: s01_drawingLayer,
              strokeColor: "#FF1493",
              strokeWidth: 2,
              strokeCap: "round",
              from: quantisePosition(from.point),
              to: quantisePosition(to.point),
            }),
          ];
        });
      }
    )
  );

  // Define the onFrame event handler for animation and interaction
  let lastInteractionTime = performance.now(); // Ensure this is defined
  view.onFrame = () => {
    if (performance.now() - lastInteractionTime > 600)
      document.getElementById("navigation").classList.add("hidden");
    else document.getElementById("navigation").classList.remove("hidden");
    // Update the global variables
    gridSize = view.viewSize.width / 32;

    updateAxes(deltaTime);
    sceneElements.forEach((sceneElement) => {
      sceneElement.update();
    });
  };
  sceneElements.forEach((sceneElement) => {
    sceneElement.update();
  });
}
