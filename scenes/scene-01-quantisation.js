/**
 * Scene 01 – Quantisation
 * Rotating cube with vertices quantised to a shifting grid
 */

// === HELPER FUNCTION ===
/**
 * Quantises a position to the nearest grid intersection
 * @param {paper.Point} position - The position to quantise
 * @returns {paper.Point} The quantised position snapped to grid
 */
function quantisePosition(position) {
  const { x, y } = position;
  let newPosition = new paper.Point(x, y);
  let minDistanceX = Infinity,
    minDistanceY = Infinity;
  // Find the nearest grid column
  for (let i = 0; i < s01_gridIntersections.columns.length; i++) {
    const distanceX = Math.abs(x - s01_gridIntersections.columns[i]);
    if (distanceX < minDistanceX) {
      minDistanceX = distanceX;
      newPosition.x = s01_gridIntersections.columns[i];
    }
  }
  // Find the nearest grid row
  for (let i = 0; i < s01_gridIntersections.rows.length; i++) {
    const distanceY = Math.abs(y - s01_gridIntersections.rows[i]);
    if (distanceY < minDistanceY) {
      minDistanceY = distanceY;
      newPosition.y = s01_gridIntersections.rows[i];
    }
  }
  return newPosition;
}

/**
 * Rotates a 3D vector around an axis by the specified angle.
 * @param {number[]} vect - The 3D vector to rotate [x, y, z].
 * @param {number[]} axis - The axis to rotate around [x, y, z].
 * @param {number} angle - The angle to rotate by in radians.
 * @returns {number[]} - The rotated vector [x, y, z].
 */
function rotateAround(vect, axis, angle) {
  // Helper functions for vector operations
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }
  function scale(v, s) {
    return [v[0] * s, v[1] * s, v[2] * s];
  }
  function add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }
  function norm(v) {
    const len = Math.sqrt(dot(v, v));
    return len === 0 ? [0, 0, 0] : scale(v, 1 / len);
  }

  // Ensure axis is a unit vector
  const k = norm(axis);

  // Rodrigues' rotation formula
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const term1 = scale(vect, cosA);
  const term2 = scale(cross(k, vect), sinA);
  const term3 = scale(k, dot(k, vect) * (1 - cosA));

  return add(add(term1, term2), term3);
}

// === SCENE CONSTANTS ===
// Colour scheme for the scene
const s01_colorBackground = "#e6e6e6";
const s01_colorGrid = "#fff";
const s01_colorTarget = "#fff";
const s01_colorQuantised = new paper.Color(
  "color(display-p3 1.267976512366232 -0.25502970586750234 0.6899703995058147)"
);

// Stroke widths
const s01_gridStrokeWidth = 4 * GLOBAL_SCALE;
const s01_cubeStrokeWidth = 8 * GLOBAL_SCALE;

// Grid size range for animation (min to max spacing)
const s01_gridSizeRange = [20 * GLOBAL_SCALE, 630 * GLOBAL_SCALE];

// Cube size range for animation
const s01_cubeSizeRange = [280 * GLOBAL_SCALE, 3360 * GLOBAL_SCALE];

// === SCENE SETUP ===
// Main scene group container
const s01_scenGroup = new paper.Group({
  name: "quantisation",
});
const s01_sceneChoreographies = [];

// === BACKGROUND ===
const background = new paper.Path.Rectangle({
  name: "background",
  parent: s01_scenGroup,
  point: [0, 0],
  size: [paper.view.viewSize.width, paper.view.viewSize.height],
  fillColor: s01_colorBackground,
});

// === GRID SETUP ===
// Group to contain all grid elements
const s01_gridGroup = new paper.Group({
  name: "grid",
  parent: s01_scenGroup,
});

// Template paths for grid lines (horizontal and vertical)
const s01_gridRowTemplate = new paper.Path.Line({
  parent: s01_gridGroup,
  strokeColor: s01_colorGrid,
  strokeWidth: s01_gridStrokeWidth,
  from: new paper.Point(0, 0),
  to: new paper.Point(paper.view.viewSize.width, 0),
});
const s01_gridColumnTemplate = new paper.Path.Line({
  parent: s01_gridGroup,
  strokeColor: s01_colorGrid,
  strokeWidth: s01_gridStrokeWidth,
  from: new paper.Point(0, 0),
  to: new paper.Point(0, paper.view.viewSize.height),
});

// Create symbols from templates for efficient reuse
const s01_gridRowSymbol = new paper.Symbol(s01_gridRowTemplate);
const s01_gridColumnSymbol = new paper.Symbol(s01_gridColumnTemplate);

// Calculate maximum number of grid lines based on minimum spacing
const s01_maxColumns = Math.floor(
  paper.view.viewSize.width / s01_gridSizeRange[0]
);
const s01_maxRows = Math.floor(
  paper.view.viewSize.height / s01_gridSizeRange[0]
);
const s01_gridIntersections = {
  columns: new Array(s01_maxColumns + 1).fill(0),
  rows: new Array(s01_maxRows + 1).fill(0),
};

// Create column instances positioned symmetrically around centre
const s01_columns = new Array(s01_maxColumns + 1)
  .fill(0)
  .map((_, index) =>
    s01_gridColumnSymbol.place(
      paper.view.center.add(
        new paper.Point(
          (((index % 2 ? -1 : 1) * roundToDecimal(index, 2)) / 2) *
            s01_gridSizeRange[0],
          0
        )
      )
    )
  );
// Add columns to scene group
s01_columns.forEach(
  (symbolInstance) => (symbolInstance.parent = s01_scenGroup)
);

// Create row instances positioned symmetrically around centre
const s01_rows = new Array(s01_maxRows + 1)
  .fill(0)
  .map((_, index) =>
    s01_gridRowSymbol.place(
      paper.view.center.add(
        new paper.Point(
          0,
          (((index % 2 ? -1 : 1) * roundToDecimal(index, 2)) / 2) *
            s01_gridSizeRange[0]
        )
      )
    )
  );
// Add rows to scene group
s01_rows.forEach((symbolInstance) => (symbolInstance.parent = s01_scenGroup));

// === GRID CHOREOGRAPHY ===
// Animation controller for the grid system
s01_sceneChoreographies.push(
  new Choreography(
    {
      columns: s01_columns,
      rows: s01_rows,
      gridSizeRange: s01_gridSizeRange,
      gridGroup: s01_gridGroup,
      gridIntersections: s01_gridIntersections,
      noiseY: 0,
    },
    [
      // Grid scale animation (controlled by axis 0)
      {
        attribute: "scale",
        axes: [0],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 1 },
          { position: [127, 0, 0, 0], value: 0.2 },
        ],
      },
      // Grid spacing exponent (controlled by axis 3)
      {
        attribute: "exponent",
        axes: [3],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 1 },
          { position: [0, 0, 0, 127], value: 6 },
        ],
      },
      // Noise amount for grid distortion (controlled by axis 3)
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
    /**
     * Animation render function
     * @param {number} deltaTime - Delta time for the animation
     */
    function (deltaTime = 0.016) {
      const { columns, rows, gridSizeRange, noiseY } = this.element;
      // Calculate grid spacing with exponential scaling
      const scale = lerp(gridSizeRange[0], gridSizeRange[1], this.scale ** 6);
      const exponent = this.exponent;
      const noiseAmount = this.noiseAmount;
      const exponentScale = 20 * exponent;

      // Clear previous intersection positions
      this.element.gridIntersections.columns = [];
      this.element.gridIntersections.rows = [];

      // Update column positions with noise and exponential spacing
      columns.forEach((column, index) => {
        const normalisedIndex =
          (index -
            (columns.length - 1) / 2 +
            noise.simplex2(index, noiseY * 0.0005) * noiseAmount) /
          exponentScale;
        const direction = Math.sign(normalisedIndex);
        let step =
          direction * Math.abs(normalisedIndex) * exponentScale * scale;
        const position = paper.view.center.add(new paper.Point(step, 0));

        // Remove out of bounds columns
        if (position.x < 0 || position.x > paper.view.viewSize.width)
          column.remove();
        else {
          this.element.gridGroup.addChild(column);
          column.position = position;
          this.element.gridIntersections.columns.push(position.x);
        }
      });

      // Update row positions with noise and exponential spacing
      rows.forEach((row, index) => {
        const normalisedIndex =
          (index -
            (rows.length - 1) / 2 +
            noise.simplex2(index, noiseY * 0.0004) * noiseAmount) /
          exponentScale;
        const direction = Math.sign(normalisedIndex);
        let step =
          direction * Math.abs(normalisedIndex) * exponentScale * scale;
        const position = paper.view.center.add(new paper.Point(0, step));
        // Remove out of bounds rows
        if (position.y < 0 || position.y > paper.view.viewSize.height)
          row.remove();
        else {
          this.element.gridGroup.addChild(row);
          row.position = position;
          this.element.gridIntersections.rows.push(position.y);
        }
      });
      // Advance noise  (faster when noise is high)
      this.element.noiseY +=
        (1 + Math.max(0, noiseAmount - 2)) * deltaTime * 120;
    }
  )
);

// === CUBE SETUP ===
// Group to contain the cube drawings
const s01_drawingGroup = new paper.Group({
  parent: s01_scenGroup,
});
s01_drawingGroup.name = "cube";

// Define cube vertices in 3D space (unit cube)
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

// Convert 3D vertices to 2D points with initial positioning
const s01_cube = s01_cubeVertices.map((pos) => ({
  point: paper.view.center.add(
    new paper.Point(pos[0] - 0.5, pos[1] - 0.5).multiply(s01_cubeSizeRange[0])
  ),
  position: pos,
}));

// Define which vertices connect to form cube edges
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

// Create line paths for the original cube
const s01_cubeLines = s01_cubeConnections.map((connection) => ({
  line: new paper.Path.Line({
    parent: s01_drawingGroup,
    strokeColor: s01_colorTarget,
    strokeWidth: s01_cubeStrokeWidth,
    strokeCap: "round",
    from: s01_cube[connection[0]].point,
    to: s01_cube[connection[1]].point,
  }),
  from: connection[0],
  to: connection[1],
}));

// Create line paths for the quantised cube
const s01_cubeQuantised = s01_cubeConnections.map((connection) => ({
  line: new paper.Path.Line({
    parent: s01_drawingGroup,
    strokeColor: s01_colorQuantised,
    strokeWidth: s01_cubeStrokeWidth,
    strokeCap: "round",
    from: s01_cube[connection[0]].point,
    to: s01_cube[connection[1]].point,
  }),
  from: connection[0],
  to: connection[1],
}));

// === CUBE CHOREOGRAPHY ===
// Animation controller for the cube system
s01_sceneChoreographies.push(
  new Choreography(
    {
      cube: s01_cubeLines,
      cubeQuantised: s01_cubeQuantised,
      vertices: s01_cube,
    },
    [
      // Cube size animation (controlled by axis 1)
      {
        attribute: "size",
        axes: [1],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: s01_cubeSizeRange[0] },
          { position: [0, 127, 0, 0], value: s01_cubeSizeRange[1] },
        ],
      },
      // Cube rotation animation (controlled by axis 2)
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
    /**
     * Animation render function
     * @param {number} deltaTime - Delta time for the animation
     */
    function (deltaTime = 0.016) {
      const { cube, cubeQuantised, vertices } = this.element;
      const size = this.size;
      const angle = this.rotation;

      // Transform each vertex: rotate in 3D space, then project to 2D
      const renderedVertices = vertices.map((vertex) => {
        // Centre the vertex coordinates around origin
        const vector = vertex.position.map((value) => value - 0.5);

        // Apply rotation around multiple axes for complex 3D rotation
        const rotationAxes = [
          [0, 0, 1],
          [0, 1, 0],
          [1, 0, 0],
        ];
        let rotatedVector = vector;
        rotationAxes.forEach((axis) => {
          rotatedVector = rotateAround(rotatedVector, axis, angle);
        });

        // Project 3D position to 2D screen coordinates
        const position = paper.view.center.add(
          new paper.Point(rotatedVector[0], rotatedVector[1]).multiply(size)
        );

        // Calculate quantised position snapped to grid
        const quantisedPosition = quantisePosition(position);
        return {
          ...vertex,
          point: position,
          quantised: quantisedPosition,
        };
      });

      // Update all cube edge lines with new vertex positions
      cube.forEach((line, index) => {
        const from = renderedVertices[line.from];
        const to = renderedVertices[line.to];

        // Update original cube line endpoints
        cube[index].line.firstSegment.point = from.point;
        cube[index].line.lastSegment.point = to.point;

        // Update quantised cube line endpoints
        cubeQuantised[index].line.firstSegment.point = from.quantised;
        cubeQuantised[index].line.lastSegment.point = to.quantised;
      });
    }
  )
);

// === SCENE REGISTRATION ===
// Create and register the scene with the scene manager
const s01_scene = new Scene(
  "scene-01-quantisation",
  s01_scenGroup,
  s01_sceneChoreographies
);
sceneManager.addScene(s01_scene);

// === CLEANUP ===
// Delete variables that are no longer needed to free memory
delete s01_colorBackground;
delete s01_colorGrid;
delete s01_colorTarget;
delete s01_colorQuantised;
delete s01_cubeStrokeWidth;
delete s01_gridSizeRange;
delete s01_gridRowTemplate;
delete s01_gridColumnTemplate;
delete s01_gridRowSymbol;
delete s01_gridColumnSymbol;
delete s01_maxColumns;
delete s01_maxRows;
delete s01_gridIntersections;
delete s01_columns;
delete s01_rows;
delete s01_cubeSizeRange;
delete s01_cubeVertices;
delete s01_cube;
delete s01_cubeConnections;
delete s01_cubeLines;
delete s01_cubeQuantised;
