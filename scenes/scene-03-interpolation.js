/**
 * Scene 03 – Interpolation
 * Interpolation of a bezier curve with varying resolution and noise
 */

// === SCENE CONSTANTS ===
// Colour scheme for the scene
const s03_backgroundColor = "#e6e6e6";
const s03_pink = new paper.Color(
  "color(display-p3 1.267976512366232 -0.25502970586750234 0.6899703995058147)"
);

const s03_strokeWidth = 8 * GLOBAL_SCALE;

// Precalculated constant for efficiency
const PI = Math.PI;
const CANVAS_HYPOTENUSE = Math.sqrt(
  paper.view.viewSize.width ** 2 + paper.view.viewSize.height ** 2
);
const ONE_OVER_CANVAS_HYPOTENUSE = 1 / CANVAS_HYPOTENUSE;
const ONE_OVER_CANVAS_WIDTH = 1 / paper.view.viewSize.width;
const ONE_OVER_CANVAS_HEIGHT = 1 / paper.view.viewSize.height;
// Limits divisions
const ONE_THIRD = 1 / 3;
const ONE_TWELFTH = 1 / 12;
const DEG_TO_RAD = Math.PI / 180;
const NOISE_SCALE = 0.0025;

// Resolution of the curve (number of segments)
const CURVE_RESOLUTION = 128;

// === SCENE SETUP ===
// Main scene group container
const s03_scenGroup = new paper.Group();
s03_scenGroup.name = "interpolation";
const s03_sceneChoreographies = [];

// === BACKGROUND ===
const s03_background = new paper.Path.Rectangle({
  name: "background",
  parent: s03_scenGroup,
  point: [0, 0],
  size: [paper.view.viewSize.width, paper.view.viewSize.height],
  fillColor: s03_backgroundColor,
});

// === CURVE SETUP ===
// Define the control points for the curve
const s03_curvePoints = [
  new paper.Point(0, paper.view.viewSize.height), // Start point
  new paper.Point(0, 0), // Handle 1
  new paper.Point(0, 0), // Handle 2
  new paper.Point(paper.view.viewSize.width, 0), // End point
];

// Create markers along the curve
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

// Create the curve using the control points
const s03_curve = new paper.Curve(...s03_curvePoints);

// Create a path to visually represent the curve
const s03_curvePath = new paper.Path({
  segments: [s03_curve.segment1, s03_curve.segment2],
  parent: s03_scenGroup,
  strokeColor: s03_pink,
  strokeWidth: s03_strokeWidth,
});

// Precalculate colours for the markers
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

// === CURVE CHOREOGRAPHY ===
// Animation controller for the curve and markers
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
      markers: s03_curveMarkers.reverse(), // (reversed for easier indexing)
      noiseZ: 0,
      fillColorArray: s03_fillColorArray,
    },
    [
      // Resolution animation (controlled by axis 0)
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
      // Exponential scaling of resolution (controlled by axis 0)
      {
        attribute: "resolutionExponent",
        axes: [0],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [127, 0, 0, 0], value: 1 },
        ],
      },
      // Tension animation (controlled by axis 1)
      {
        attribute: "tension",
        axes: [1],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 127, 0, 0], value: 1 },
        ],
      },
      // Counter tension animation (controlled by axis 2)
      {
        attribute: "counterTension",
        axes: [2],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 0, 127, 0], value: 1 },
        ],
      },
      // Dance animation (controlled by axis 3)
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
    /**
     * Animation render function
     * @param {number} deltaTime - Delta time for the animation
     */
    function (deltaTime = 0.016) {
      const { curve, drawnPath, curvePath, markers, noiseZ, fillColorArray } =
        this.element;
      // Exponentially increase the resolution for smoother transitions
      // Smaller increments at lower resolutions
      const resolutionExponent = this.resolutionExponent ** 1.125;
      const resolution = 2 + this.resolution * resolutionExponent;
      const tension = this.tension;
      const counterTension = this.counterTension;
      const dance = this.dance;
      const { width, height } = paper.view.viewSize;

      // Calculate curve handles based on tension and counter-tension
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

      // Update curve handles
      curve.handle1.set([handle1X, handle1Y]);
      curve.handle2.set([handle2X, handle2Y]);
      curvePath.segments[0][2] = curve.handle1;
      curvePath.segments[1][1] = curve.handle2;
      curvePath.visible = false;

      // Precompute reusable values for efficiency
      const oneOverResolutionMinusOne = 1 / (resolution - 1);
      const oneOverResolution = 1 / resolution;

      // Reusable points for marker updates
      const reusableBottomRight = new paper.Point(0, 0);
      const reusableTopLeft = new paper.Point(0, 0);
      const reusableTopRight = new paper.Point(0, 0);

      // Update each marker along the curve
      markers.forEach((marker, index) => {
        // Determine fill colour based on marker index
        const fillColor =
          fillColorArray[
            Math.min(
              Math.round(
                index * oneOverResolutionMinusOne * CURVE_RESOLUTION * 2
              ),
              CURVE_RESOLUTION * 2 - 1
            )
          ];

        // Calculate curve time based on marker index
        const curveTime = Math.min(oneOverResolution * (index + 1), 1);
        reusableBottomRight.set([width * curveTime, height]);

        // Update marker position based on curve location
        if (curveTime >= 1 - 1e-6) {
          reusableTopRight.set([width, 0]);
          reusableTopLeft.set([0, 0]);
          marker.visible = false; // Hide marker out of bounds
        } else {
          const curveAtTime = curve.getLocationAtTime(curveTime).point;
          reusableTopLeft.set([0, curveAtTime.y]);
          reusableTopRight.set([curveAtTime.x, curveAtTime.y - height]);
        }

        // Introduce noise-based rotation around curve start
        if (curveTime < 1 - 1e-6) {
          const vectorLength = reusableTopRight.length;
          const angle = reusableTopRight.angle;

          // Define maximum angle angle based on vector length
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

          // Define minimum angle angle based on vector length
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

          // Rotate the marker based on the angle
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

        // Update marker geometry
        marker.segments[1].point = reusableTopLeft;
        marker.segments[2].point = reusableTopRight;
        marker.segments[3].point = reusableBottomRight;
        marker.fillColor = fillColor;
        marker.strokeColor = fillColor;
        marker.visible = true;

        // Update the drawn path with the marker position
        drawnPath.segments[index + 1].point = reusableTopRight;
      });

      // Increment noise offset for animation
      this.element.noiseZ +=
        map(dance, 0, 1, 0.25, 1) * 0.0025 * deltaTime * 120;
    }
  )
);

// === SCENE REGISTRATION ===
// Create and register the scene with the scene manager
const s03_scene = new Scene(
  "scene-03-interpolation",
  s03_scenGroup,
  s03_sceneChoreographies
);
sceneManager.addScene(s03_scene);

// === CLEANUP ===
// Delete variables that are no longer needed to free memory
delete s03_backgroundColor;
delete CANVAS_HYPOTENUSE;
delete s03_pink;
delete s03_strokeWidth;
delete s03_curvePoints;
delete s03_curveMarkers;
delete s03_curve;
delete s03_curvePath;
delete s03_fillColorArray;
