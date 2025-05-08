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

  const s01_colorBackground = "#e6e6e6";
  const s01_colorGrid = "#fff";
  const s01_colorTarget = "#fff";
  const s01_colorQuantised = "#FF1493";
  const s01_colorHull = "#0000";
  const s01_strokeWidth = 16;

  // Create a background rectangle
  const backgroundLayer = new Layer();
  const background = new Path.Rectangle({
    parent: backgroundLayer,
    point: [0, 0],
    size: [view.viewSize.width, view.viewSize.height],
    // fillColor: colors[0],
    fillColor: s01_colorBackground,
  });

  const sceneElements = [];

  // Scene 01 – Cube
  const s01_gridLayer = new Layer();
  const s01_gridSizeRange = [10, 210];
  const s01_gridRowTemplate = new Path.Line({
    parent: s01_gridLayer,
    strokeColor: s01_colorGrid,
    strokeWidth: 2,
    from: new Point(0, 0),
    to: new Point(view.viewSize.width, 0),
  });
  const s01_gridColumnTemplate = new Path.Line({
    parent: s01_gridLayer,
    strokeColor: s01_colorGrid,
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
        const exponentScale = 20 * exponent;

        s01_gridIntersections.columns = [];
        s01_gridIntersections.rows = [];
        columns.forEach((column, index) => {
          const normalisedIndex =
            (index -
              (columns.length - 1) / 2 +
              noise.simplex2(index, frameCount * 0.0005) * noiseAmount) /
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
  const s01_cubeVertices = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
  ];
  const s01_cube = s01_cubeVertices.map((pos) => ({
    point: view.center.add(
      new Point(pos[0] - 0.5, pos[1] - 0.5).multiply(s01_cubeSizeRange[0])
    ),
    position: pos,
  }));

  const s01_cubeConnections = [
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
  ];

  const s02_cobeConvexHull = new Path(...calculateConvexHull(s01_cube));
  // s02_cobeConvexHull.fillColor = "#000";
  // s02_cobeConvexHull.fillColor = "#e6e6e6";
  s02_cobeConvexHull.fillColor = s01_colorHull;
  s02_cobeConvexHull.closed = true;

  const s01_cubeLines = s01_cubeConnections.map((connection) => ({
    line: new Path.Line({
      parent: s01_drawingLayer,
      strokeColor: s01_colorTarget,
      strokeWidth: s01_strokeWidth,
      strokeCap: "round",
      from: s01_cube[connection[0]].point,
      to: s01_cube[connection[1]].point,
    }),
    from: connection[0],
    to: connection[1],
  }));
  const s01_cubeError = s01_cubeVertices.map((pos, index) => ({
    line: new Path.Line({
      parent: s01_drawingLayer,
      strokeWidth: s01_strokeWidth,
      strokeCap: "butt",
      strokeColor: {
        gradient: {
          stops: [s01_colorTarget, s01_colorQuantised],
        },
        origin: s01_cube[index].point,
        destination: s01_cube[index].point,
      },
      from: s01_cube[index].point,
      to: s01_cube[index].point,
    }),
    index,
  }));
  const s01_cubeQuantised = s01_cubeConnections.map((connection) => ({
    line: new Path.Line({
      parent: s01_drawingLayer,
      // strokeColor: "#FF1493",
      strokeColor: s01_colorQuantised,
      strokeWidth: s01_strokeWidth,
      strokeCap: "round",
      // visible: false,
      from: s01_cube[connection[0]].point,
      to: s01_cube[connection[1]].point,
    }),
    from: connection[0],
    to: connection[1],
  }));
  sceneElements.push(
    new Choreography(
      {
        convexHull: s02_cobeConvexHull,
        cube: s01_cubeLines,
        cubeError: s01_cubeError,
        cubeQuantised: s01_cubeQuantised,
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
        const { convexHull, cube, cubeError, cubeQuantised, vertices } =
          this.element;
        const size = this.size;
        const angle = this.rotation;
        const quantisedVertices = [];
        const renderedVertices = vertices.map((vertex, index) => {
          const vector = vertex.position.map((value) => value - 0.5);
          // Rotate cube vertices along axis
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
          const quantisedPosition = quantisePosition(position);

          // Update error lines and gradient
          cubeError[index].line.visible = false;
          cubeError[index].line.firstSegment.point = position;
          cubeError[index].line.lastSegment.point = quantisedPosition;
          cubeError[index].line.strokeColor.origin = position;
          cubeError[index].line.strokeColor.destination = quantisedPosition;
          return {
            ...vertex,
            point: position,
            quantised: quantisedPosition,
          };
        });

        convexHull.segments = calculateConvexHull(
          renderedVertices.map((v) => v.quantised)
        );
        cube.forEach((line, index) => {
          const from = renderedVertices[line.from];
          const to = renderedVertices[line.to];
          // Update precise cube
          cube[index].line.firstSegment.point = from.point;
          cube[index].line.lastSegment.point = to.point;
          // Update quantised cube
          cubeQuantised[index].line.firstSegment.point = from.quantised;
          cubeQuantised[index].line.lastSegment.point = to.quantised;
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

    updateAxes(deltaTime);
    sceneElements.forEach((sceneElement) => {
      sceneElement.update();
    });
  };
  sceneElements.forEach((sceneElement) => {
    sceneElement.update();
  });
}
