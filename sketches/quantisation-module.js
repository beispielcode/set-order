// Set up the Paper.js environment
paper.setup("paper-canvas");
paper.view.viewSize = [canvasWidth, canvasHeight];
const sceneElements = [];
// with (paper) {
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
// const P3converter = culori.converter("p3");
// const CSSFormater = culori.formatCss;
const s01_colorQuantised = new paper.Color(
  "color(display-p3 1.267976512366232 -0.25502970586750234 0.6899703995058147)"
);

const s01_strokeWidth = 8 * GLOBAL_SCALE;

// Create a background rectangle
const backgroundLayer = new paper.Layer();
const background = new paper.Path.Rectangle({
  parent: backgroundLayer,
  point: [0, 0],
  size: [paper.view.viewSize.width, paper.view.viewSize.height],
  // fillColor: colors[0],
  fillColor: s01_colorBackground,
});

// Scene 01 – Cube
const s01_gridLayer = new paper.Layer();
const s01_gridSizeRange = [20 * GLOBAL_SCALE, 630 * GLOBAL_SCALE];
const s01_gridRowTemplate = new paper.Path.Line({
  parent: s01_gridLayer,
  strokeColor: s01_colorGrid,
  strokeWidth: 4 * GLOBAL_SCALE,
  from: new paper.Point(0, 0),
  to: new paper.Point(paper.view.viewSize.width, 0),
});
const s01_gridColumnTemplate = new paper.Path.Line({
  parent: s01_gridLayer,
  strokeColor: s01_colorGrid,
  strokeWidth: 4 * GLOBAL_SCALE,
  from: new paper.Point(0, 0),
  to: new paper.Point(0, paper.view.viewSize.height),
});
const s01_gridRowSymbol = new paper.Symbol(s01_gridRowTemplate);
const s01_gridColumnSymbol = new paper.Symbol(s01_gridColumnTemplate);
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
function quantisePosition(position) {
  const { x, y } = position;
  let newPosition = new paper.Point(x, y);
  let minDistanceX = Infinity,
    minDistanceY = Infinity;
  let columnIndex = 0;
  let rowIndex = 0;
  for (let i = 0; i < s01_gridIntersections.columns.length; i++) {
    const distanceX = Math.abs(x - s01_gridIntersections.columns[i]);
    if (distanceX < minDistanceX) {
      minDistanceX = distanceX;
      columnIndex = i;
      newPosition.x = s01_gridIntersections.columns[i];
    }
  }
  for (let i = 0; i < s01_gridIntersections.rows.length; i++) {
    const distanceY = Math.abs(y - s01_gridIntersections.rows[i]);
    if (distanceY < minDistanceY) {
      minDistanceY = distanceY;
      rowIndex = i;
      newPosition.y = s01_gridIntersections.rows[i];
    }
  }
  return newPosition;
}

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
sceneElements.push(
  new Choreography(
    {
      columns: s01_columns,
      rows: s01_rows,
      gridSizeRange: s01_gridSizeRange,
      gridLayer: s01_gridLayer,
      gridIntersections: s01_gridIntersections,
    },
    [
      {
        attribute: "scale",
        axes: [0],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 1 },
          { position: [127, 0, 0, 0], value: 0.2 },
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
      const { columns, rows, gridSizeRange } = this.element;
      const scale = lerp(gridSizeRange[0], gridSizeRange[1], this.scale ** 6);
      const exponent = this.exponent;
      const noiseAmount = this.noiseAmount;
      const exponentScale = 20 * exponent;

      this.element.gridIntersections.columns = [];
      this.element.gridIntersections.rows = [];
      columns.forEach((column, index) => {
        const normalisedIndex =
          (index -
            (columns.length - 1) / 2 +
            noise.simplex2(index, frameCount * 0.0005) * noiseAmount) /
          exponentScale;
        const direction = Math.sign(normalisedIndex);
        let step =
          direction * Math.abs(normalisedIndex) * exponentScale * scale;
        const position = paper.view.center.add(new paper.Point(step, 0));
        if (position.x < 0 || position.x > paper.view.viewSize.width)
          column.remove();
        else {
          this.element.gridLayer.addChild(column);
          column.position = position;
          this.element.gridIntersections.columns.push(position.x);
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
          direction * Math.abs(normalisedIndex) * exponentScale * scale;
        const position = paper.view.center.add(new paper.Point(0, step));
        if (position.y < 0 || position.y > paper.view.viewSize.height)
          row.remove();
        else {
          this.element.gridLayer.addChild(row);
          row.position = position;
          this.element.gridIntersections.rows.push(position.y);
        }
      });
      frameCount += 1 + Math.max(0, noiseAmount - 2);
    }
  )
);

const s01_drawingLayer = new paper.Layer();
const s01_cubeSizeRange = [280 * GLOBAL_SCALE, 3360 * GLOBAL_SCALE];
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
  point: paper.view.center.add(
    new paper.Point(pos[0] - 0.5, pos[1] - 0.5).multiply(s01_cubeSizeRange[0])
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

const s01_cubeLines = s01_cubeConnections.map((connection) => ({
  line: new paper.Path.Line({
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
const s01_cubeQuantised = s01_cubeConnections.map((connection) => ({
  line: new paper.Path.Line({
    parent: s01_drawingLayer,
    strokeColor: s01_colorQuantised,
    strokeWidth: s01_strokeWidth,
    strokeCap: "round",
    from: s01_cube[connection[0]].point,
    to: s01_cube[connection[1]].point,
  }),
  from: connection[0],
  to: connection[1],
}));

sceneElements.push(
  new Choreography(
    {
      cube: s01_cubeLines,
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
      const { cube, cubeQuantised, vertices } = this.element;
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
        const position = paper.view.center.add(
          new paper.Point(rotatedVector[0], rotatedVector[1]).multiply(size)
        );
        const quantisedPosition = quantisePosition(position);
        return {
          ...vertex,
          point: position,
          quantised: quantisedPosition,
        };
      });
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
// let lastInteractionTime = performance.now(); // Ensure this is defined
// paper.view.onFrame = () => {
//   updateAxes(deltaTime);
//   sceneElements.forEach((sceneElement) => {
//     sceneElement.update();
//   });
// };
// sceneElements.forEach((sceneElement) => {
//   sceneElement.update();
// });
// }

export default sceneElements;
