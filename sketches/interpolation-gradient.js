// Set up the Paper.js environment
// paper.setup("paper-canvas");
// paper.view.viewSize = [canvasWidth, canvasHeight];
// with (paper) {
// Add MIDI event listener for control change messages
// window.addEventListener("midimessage", (e) => {
//   const { type, control, value } = e.data;
//   if (type === "controlchange" && control >= 0 && control < 4)
//     updateAxesValue(control, value);
// });
// let frameCount = 0;
const s03_backgroundColor = "#e6e6e6";
const s03_pink = new paper.Color(
  "color(display-p3 1.267976512366232 -0.25502970586750234 0.6899703995058147)"
);
const s03_strokeWidth = 8 * GLOBAL_SCALE;
const PI = Math.PI;
const ONE_THIRD = 1 / 3;
const ONE_TWELFTH = 1 / 12;
const CANVAS_HYPOTENUSE = Math.sqrt(
  paper.view.viewSize.width ** 2 + paper.view.viewSize.height ** 2
);
const ONE_OVER_CANVAS_HYPOTENUSE = 1 / CANVAS_HYPOTENUSE;
const ONE_OVER_CANVAS_WIDTH = 1 / paper.view.viewSize.width;
const ONE_OVER_CANVAS_HEIGHT = 1 / paper.view.viewSize.height;
const DEG_TO_RAD = Math.PI / 180;
const NOISE_SCALE = 0.0025;

// Scene 03 – Interpolation

const s03_scenGroup = new paper.Group();
s03_scenGroup.name = "interpolation";
const s03_sceneChoreographies = [];

// Create a background rectangle
const s03_background = new paper.Path.Rectangle({
  name: "background",
  parent: s03_scenGroup,
  point: [0, 0],
  size: [paper.view.viewSize.width, paper.view.viewSize.height],
  fillColor: s03_backgroundColor,
});

const CURVE_RESOLUTION = 128;
const s03_curvePoints = [
  new paper.Point(0, paper.view.viewSize.height),
  new paper.Point(0, 0),
  new paper.Point(0, 0),
  new paper.Point(paper.view.viewSize.width, 0),
];
const s03_curveMarkers = new Array(CURVE_RESOLUTION).fill(0).map(
  (_, index) =>
    new paper.Path.Rectangle({
      parent: s03_scenGroup,
      from: new paper.Point(0, paper.view.viewSize.height),
      to: new paper.Point(
        (paper.view.viewSize.width / CURVE_RESOLUTION) *
          (CURVE_RESOLUTION - index - 1),
        (paper.view.viewSize.height / CURVE_RESOLUTION) * (index + 1)
      ),
      strokeWidth: s03_strokeWidth,
      strokeColor: index % 2 ? "#000" : "#fff",
      fillColor: index % 2 ? "#000" : "#fff",
      strokeJoin: "round",
    })
);
const s03_curve = new paper.Curve(...s03_curvePoints);
const s03_curvePath = new paper.Path({
  segments: [s03_curve.segment1, s03_curve.segment2],
  parent: s03_scenGroup,
  strokeColor: s03_pink,
  strokeWidth: s03_strokeWidth,
});

const s03_fillColorArray = new Array(CURVE_RESOLUTION * 2)
  .fill(0)
  .map((_, index) =>
    culori.formatHex({
      mode: "hsl",
      h: 0,
      s: 0,
      l: Math.min(1, index / (CURVE_RESOLUTION * 2)),
      alpha: 1,
    })
  );

s03_sceneChoreographies.push(
  new Choreography(
    {
      curve: s03_curve,
      drawnPath: new paper.Path({
        segments: new Array(CURVE_RESOLUTION + 1)
          .fill(0)
          .map(
            (_, index) =>
              s03_curve.getLocationAtTime(index / CURVE_RESOLUTION).point
          ),
        parent: s03_scenGroup,
        strokeColor: s03_pink,
        strokeWidth: s03_strokeWidth,
        strokeJoin: "round",
      }),
      curvePath: s03_curvePath,
      // Reversed markers in order to facilitate index calculation
      markers: s03_curveMarkers.reverse(),
      noiseZ: 0,
      fillColorArray: s03_fillColorArray,
    },
    [
      {
        attribute: "resolution",
        axes: [0],
        transitions: ["smooth"],
        dynamicContants: [{ f: 1.5, z: 1, r: 0.5 }],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 1 },
          { position: [127, 0, 0, 0], value: CURVE_RESOLUTION - 2 },
        ],
      },
      {
        attribute: "resolutionExponent",
        axes: [0],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [127, 0, 0, 0], value: 1 },
        ],
      },
      {
        attribute: "tension",
        axes: [1],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 127, 0, 0], value: 1 },
        ],
      },
      {
        attribute: "counterTension",
        axes: [2],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 0, 127, 0], value: 1 },
        ],
      },
      {
        attribute: "dance",
        axes: [3],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 0, 0, 127], value: 1 },
        ],
      },
    ],
    function () {
      const { curve, drawnPath, curvePath, markers, noiseZ, fillColorArray } =
        this.element;
      // Exponentially increase the resolution
      // -> Linear increments were too overwhelming at lower resolutions
      // const resolutionExponent = Math.max(0, this.resolutionExponent) ** 1.125;
      const resolutionExponent = this.resolutionExponent ** 1.125;
      const resolution = 2 + this.resolution * resolutionExponent;
      const tension = this.tension;
      const counterTension = this.counterTension;
      const dance = this.dance;
      const { width, height } = paper.view.viewSize;

      // This serves its purpose.
      const handle1X =
        width *
        ((1 + 2 * counterTension - tension) * ONE_THIRD +
          25 * ONE_TWELFTH * counterTension * tension);
      const handle2X =
        -width *
        (4 - 4 * counterTension + 8 * tension + 25 * counterTension * tension) *
        ONE_TWELFTH;
      const handle1Y =
        -height * (1 - counterTension) * (1 + 2 * tension) * ONE_THIRD;
      const handle2Y =
        height * (1 - tension) * (1 - counterTension ** 3) * ONE_THIRD;
      curve.handle1.set([handle1X, handle1Y]);
      curve.handle2.set([handle2X, handle2Y]);
      curvePath.segments[0][2] = curve.handle1;
      curvePath.segments[1][1] = curve.handle2;
      curvePath.visible = false;

      const oneOverResolutionMinusOne = 1 / (resolution - 1);
      const oneOverResolution = 1 / resolution;

      const reusableBottomRight = new paper.Point(0, 0);
      const reusableTopLeft = new paper.Point(0, 0);
      const reusableTopRight = new paper.Point(0, 0);

      markers.forEach((marker, index) => {
        const fillColor =
          fillColorArray[
            Math.min(
              Math.round(
                index * oneOverResolutionMinusOne * CURVE_RESOLUTION * 2
              ),
              CURVE_RESOLUTION * 2 - 1
            )
          ];

        const curveTime = Math.min(oneOverResolution * (index + 1), 1);
        reusableBottomRight.set([width * curveTime, height]);

        // Only compute getLocationAtTime() if curveTime is within bounds
        if (curveTime >= 1 - 1e-6) {
          reusableTopRight.set([width, 0]);
          reusableTopLeft.set([0, 0]);
          marker.visible = false;
        } else {
          const curveAtTime = curve.getLocationAtTime(curveTime).point;
          reusableTopLeft.set([0, curveAtTime.y]);
          reusableTopRight.set([curveAtTime.x, curveAtTime.y - height]);
        }

        // Only compute angles if curveTime is within bounds
        if (curveTime < 1 - 1e-6) {
          const vectorLength = reusableTopRight.length;
          const angle = reusableTopRight.angle;
          let maxAngle =
            -Math.asin(
              cap(
                (height * (reusableTopRight.x * ONE_OVER_CANVAS_WIDTH) ** 4) /
                  vectorLength,
                -1,
                1
              )
            ) *
            (180 / PI);
          let minAngle =
            -Math.asin(
              cap(
                (height *
                  (1 - (1 - vectorLength * ONE_OVER_CANVAS_HYPOTENUSE) ** 2)) /
                  vectorLength,
                -1,
                1
              )
            ) *
            (180 / PI);

          reusableTopRight.angle = lerp(
            angle,
            (noise.simplex3(resolution * 0.001, index * 0.25, noiseZ) *
              map(dance, 0, 1, 2, 1) +
              1) *
              0.5 *
              (maxAngle - minAngle) +
              minAngle,
            dance
          );
          reusableTopRight.y += height;
        }
        marker.segments[1].point = reusableTopLeft;
        marker.segments[2].point = reusableTopRight;
        marker.segments[3].point = reusableBottomRight;
        marker.fillColor = fillColor;
        marker.strokeColor = fillColor;
        marker.visible = true;
        drawnPath.segments[index + 1].point = reusableTopRight;
      });
      this.element.noiseZ += map(dance, 0, 1, 0.25, 1) * 0.0025;
    }
  )
);

const s03_scene = new Scene(
  "interpolation",
  s03_scenGroup,
  s03_sceneChoreographies
);
sceneManager.addScene(s03_scene);

// Delete variables that are no longer needed
delete s03_backgroundColor;
delete CANVAS_HYPOTENUSE;
delete s03_pink;
delete s03_strokeWidth;
delete s03_curvePoints;
delete s03_curveMarkers;
delete s03_curve;
delete s03_curvePath;
delete s03_fillColorArray;

// Define the onFrame event handler for animation and interaction
// let lastInteractionTime = performance.now(); // Ensure this is defined
// view.onFrame = () => {
//   updateAxes(deltaTime);
//   s03_sceneChoreographies.forEach((sceneElement) => {
//     sceneElement.update();
//   });
// };
// s03_sceneChoreographies.forEach((sceneElement) => {
//   sceneElement.update();
// });
// }
