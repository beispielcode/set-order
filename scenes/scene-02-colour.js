/**
 * Scene 02 – Colour
 * Wheel of colours with depth and colour variation
 */

// === HELPER FUNCTIONS ===
/**
 * Gets colour from index and channel scalers
 * @param {number} index - Index of the colour
 * @param {number[]} channelScalers - Array of channel scalers
 * @returns {string} Colour in hex format
 */
function getColor(index, channelScalers = [1, 1, 1]) {
  const [r, g, b] = channelScalers.map((scale) =>
    Math.floor(255 - (255 / 2 ** s02_maxDepth) * index * scale)
  );
  return culori.formatHex(`rgb(${r}, ${g}, ${b})`);
}

/**
 * Divides a circle into multiple paths
 * @param {paper.Path} path - Path to divide
 * @param {number[]} divisions - Array of divisions
 * @param {paper.Point} center - Center of the divisions
 * @param {Array} fillArray - Array of fill colours
 * @returns {paper.Path[]} Array of paths
 */
function divideCircle(path, divisions, center, fillArray) {
  const result = [];
  const pathLength = path.length;

  // Sort divisions in descending order
  divisions = divisions.sort((a, b) => b - a);

  // Clone the path and split it into segments
  const clone = path.clone().splitAt(pathLength);
  let prevTo = 1;

  // Iterate through divisions to create new paths
  divisions.forEach((to, index) => {
    if (to && to !== 1 && prevTo - to > 1e-6) {
      let newPath = clone.splitAt(to * pathLength);
      if (newPath?.segments.length > 1) {
        if (fillArray && fillArray[index]) {
          newPath.fillColor = fillArray[index];
          newPath.strokeWidth = 0;
        }
        newPath.pathIndex = index;
        newPath.thickness = Math.min(1, (prevTo - to) * 200);
        result.push(newPath);
      }
      prevTo = to;
    } else if (
      index < divisions.length / 2 &&
      to &&
      to !== 1 &&
      (divisions[index + 1] - to > 1e-6 || index == divisions.length - 1)
    ) {
      let newPath = clone.splitAt(to * pathLength);
      if (newPath?.segments.length > 1) {
        if (fillArray && fillArray[index]) {
          newPath.fillColor = fillArray[index];
          newPath.strokeWidth = 0;
        }
        newPath.pathIndex = index + 1;
        newPath.thickness = Math.min(1, (divisions[index + 1] - to) * 200);
        result.push(newPath);
      }
      prevTo = to;
    }
  });

  // Add the remaining path
  if (fillArray && fillArray[fillArray.length - 1]) {
    clone.fillColor = fillArray[fillArray.length - 1];
    clone.strokeWidth = 0;
  }
  clone.pathIndex = divisions.length - 1;
  clone.thickness = 0;
  result.push(clone);

  // Finalise paths
  result.forEach((path) => {
    path.applyMatrix = false;
    path.firstSegment.handleIn.set([0, 0]);
    path.lastSegment.handleOut.set([0, 0]);
    path.add(center);
    path.pivot = center;
    path.closePath();
  });
  return result;
}

// === SCENE CONSTANTS ===
// Colour scheme for the scene
const s02_backgroundColor = "#e6e6e6";
const s02_strokeColor = "#fff";

// Stroke width
const s02_circleStrokeWidth = 4 * GLOBAL_SCALE;

// Depth and colour range for animation
const s02_maxDepth = 8;
const s02_maxColor = 2 ** s02_maxDepth;
const s02_center = paper.view.center;

// Base circle radius for animation
const s02_circleRadius = 1024 * GLOBAL_SCALE;

// === SCENE SETUP ===
// Main scene group container
const s02_sceneGroup = new paper.Group();
s02_sceneGroup.name = "color";
const s02_sceneChoreographies = [];

// === BACKGROUND ===
const s02_background = new paper.Path.Rectangle({
  name: "background",
  parent: s02_sceneGroup,
  point: [0, 0],
  size: paper.view.viewSize,
  fillColor: s02_backgroundColor,
});

// === CIRCLES ===
// Create an array of circles for each depth level
const s02_circles = new Array(s02_maxDepth).fill(0).map(
  (_) =>
    new paper.Path.Circle({
      name: "circle",
      parent: s02_sceneGroup,
      center: s02_center,
      radius: s02_circleRadius,
      strokeColor: s02_strokeColor,
      strokeWidth: s02_circleStrokeWidth,
      fillColor: s02_backgroundColor,
      rotation: 90,
      strokeScaling: false,
      applyMatrix: false,
      insert: false,
    })
);

// === CONTROL POINTS ===
// Arrays to store control points for various attributes
const s02_circleScaleControlPoints = [];
const s02_circleDivisionControlPoints = [];
const s02_circleRotationControlPoints = [];
const s02_circleColorControlPoints = [];

// Generate control points for each depth level
for (let depth = 0; depth < s02_maxDepth; depth++) {
  let scaleArray = new Array(s02_maxDepth).fill(1);
  let divisionArray = new Array(s02_maxDepth).fill(0);
  let colorArray = new Array(s02_maxDepth).fill(0);

  // Scale control points (controlled by axis 0)
  for (let amount = 0; amount < s02_maxDepth; amount++) {
    scaleArray = scaleArray.map((value, index) => {
      if (index < amount - 1) return (1 / (amount + 0)) * (1 + index);
      return value;
    });

    s02_circleScaleControlPoints.push({
      position: [
        Math.floor((depth / (s02_maxDepth - 1)) * 127),
        Math.floor((amount / (s02_maxDepth - 1)) * 127),
        0,
        0,
      ],
      value: scaleArray,
    });

    // Division control points (controlled by axis 0 and axis 1)
    divisionArray = divisionArray
      .map((_, index) => {
        const divisionAmount =
          index < amount
            ? 2 ** (index + 1)
            : 2 ** (Math.max(amount, depth) + 1);
        let disivsionArray = new Array(2 ** s02_maxDepth).fill(0);

        disivsionArray = disivsionArray.map((_, depthIndex) => {
          if (divisionAmount == 2) return 0.5;
          else if (!depthIndex) return 1 / divisionAmount;
          return depthIndex < 2 ** (s02_maxDepth - 1)
            ? (1 / divisionAmount) *
                Math.ceil(
                  map(depthIndex, 0, 2 ** s02_maxDepth, 0, divisionAmount)
                )
            : (1 / divisionAmount) *
                Math.floor(
                  map(depthIndex, 0, 2 ** s02_maxDepth, 0, divisionAmount)
                );
        });
        return disivsionArray;
      })
      .reverse();
    s02_circleDivisionControlPoints.push({
      position: [
        Math.floor((depth / (s02_maxDepth - 1)) * 127),
        Math.floor((amount / (s02_maxDepth - 1)) * 127),
        0,
        0,
      ],
      value: divisionArray,
    });

    // Colour control points (controlled by axis 0 and axis 1)
    colorArray = colorArray.map((_) => {
      const divisionAmount =
        (!depth && !amount) || depth > amount
          ? Math.max(1, s02_maxDepth - depth - 1)
          : Math.max(1, s02_maxDepth - Math.min(depth, amount));
      let colorGuide = new Array(2 ** s02_maxDepth).fill(0);

      colorGuide = colorGuide.map((_, depthIndex) => {
        const targetMatch =
          depthIndex < 2 ** (s02_maxDepth - 1)
            ? 0
            : 2 ** (divisionAmount - 1) - 1;
        return depthIndex % 2 ** (divisionAmount - 1) == targetMatch ? 1 : 0;
      });
      return colorGuide;
    });

    s02_circleColorControlPoints.push({
      position: [
        Math.floor((depth / (s02_maxDepth - 1)) * 127),
        Math.floor((amount / (s02_maxDepth - 1)) * 127),
        // 0,
        0,
        0,
      ],
      value: colorArray,
    });
  }
}

// Divide circles into segments based on control points
const s02_circlesDivided = s02_circles.map(
  (circle, index) =>
    new paper.Group({
      name: "circle-division",
      parent: s02_sceneGroup,
      children: divideCircle(
        circle,
        s02_circleDivisionControlPoints[0].value[index],
        s02_center
      ),
      applyMatrix: false,
    })
);

// Rotation control points (controlled by axis 1)
const s02_rotationControlPoints = new Array(s02_maxDepth)
  .fill(0)
  .map((_, depth) => ({
    position: [0, Math.floor((depth / (s02_maxDepth - 1)) * 127), 0, 0],
    value: new Array(s02_maxDepth)
      .fill(90)
      .map((angle, index) => angle * Math.max(0, depth - index + 1)),
  }));

// Colour scalers for colour variation (inverted)
const s02_colorScaler = [
  [0, 1, 1], // Red
  [0, 0, 1], // Yellow
  [1, 0, 1], // Green
  [1, 0, 0], // Cyan
  [1, 1, 0], // Blue
  [1, 1, 1], // White
  [0, 1, 1 - (1 / 255) * 178], //Magenta (#ff00b2 inverted)
];

// === COLOUR CHOREOGRAPHY ===
// Animation controller for the colour system
s02_sceneChoreographies.push(
  new Choreography(
    {
      circles: s02_circles,
      circlesDivided: s02_circlesDivided,
      maxDepth: s02_maxDepth,
      colorIndex: 0,
      colorScaler: s02_colorScaler,
      center: s02_center,
    },
    [
      // Depth render limit (controlled by axis 1)
      {
        attribute: "depthRenderLimit",
        axes: [1],
        transitions: ["smooth"],
        controlPoints: new Array(s02_maxDepth + 1).fill(0).map((_, index) => ({
          position: [0, Math.floor((index / (s02_maxDepth - 1)) * 127), 0, 0],
          value: index ?? s02_maxDepth,
        })),
      },
      // Divisions (controlled by axis 0 and axis 1)
      {
        attribute: "divisions",
        axes: [0, 1],
        transitions: ["smooth", "smooth"],
        dynamicContants: [
          { f: 1.75, z: 1, r: 0.1 },
          { f: 1.875, z: 1.125, r: 0 },
        ],
        controlPoints: s02_circleDivisionControlPoints,
      },
      // Scale (controlled by axis 0 and axis 1)
      {
        attribute: "scale",
        axes: [0, 1],
        transitions: ["smooth", "smooth"],
        dynamicContants: [
          { f: 1.75, z: 1, r: 0.1 },
          { f: 2, z: 1, r: 0 },
        ],
        controlPoints: s02_circleScaleControlPoints,
      },
      // Angles (controlled by axis 1)
      {
        attribute: "angles",
        axes: [1],
        transitions: ["smooth"],
        controlPoints: s02_rotationControlPoints,
      },
      // Rotation amount (controlled by axis 2)
      {
        attribute: "rotationAmount",
        axes: [2],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 0, 127, 0], value: 1 },
        ],
        // Colour (controlled by axis 0 and axis 1)
      },
      {
        attribute: "color",
        axes: [0, 1],
        transitions: ["smooth", "smooth"],
        dynamicContants: [
          { f: 1.75, z: 1, r: 0.1 },
          { f: 2, z: 1, r: 0 },
        ],
        controlPoints: s02_circleColorControlPoints,
      },
      // Tint (controlled by axis 3)
      {
        attribute: "tint",
        axes: [3],
        transitions: ["smooth"],
        dynamicContants: [{ f: 1.75, z: 1, r: 0.2 }],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 0, 0, 12], value: 1 },
        ],
      },
      // Colour variation (controlled by axis 3)
      {
        attribute: "colorVariation",
        axes: [3],
        transitions: ["smooth"],
        dynamicContants: [{ f: 1.25, z: 1.5, r: 0.1 }],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 0, 0, 12], value: 0 },
          { position: [0, 0, 0, 127], value: 0.125 },
        ],
      },
      // Colour speed (controlled by axis 3)
      {
        attribute: "colorSpeed",
        axes: [3],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 0, 0, 127], value: 0.5 },
        ],
      },
    ],
    /**
     * Animation render function
     * @param {number} deltaTime - Delta time for the animation
     */
    function (deltaTime = 0.016) {
      const { circles, maxDepth, colorIndex, colorScaler, center } =
        this.element;

      // Retrieve animation parameters
      const divisions = this.divisions;
      const depthRenderLimit = Math.floor(this.depthRenderLimit + 2);
      const scale = this.scale;
      const rotationAmount = this.rotationAmount;
      const angles = this.angles.map((angle) => angle * rotationAmount);
      const color = this.color;
      const tint = this.tint;
      const colorVariation = this.colorVariation;
      const colorSpeed = Math.max(0, this.colorSpeed) ** 1.5 * 1.25;
      const colorInterpolationExponent = 6;
      const colorDisparity = 0.75;
      const interpolationMode = "oklch";

      // Update divided circles
      this.element.circlesDivided = this.element.circlesDivided.map(
        (oldGroup, depthIndex) => {
          const groupDepth = maxDepth - depthIndex;

          // Remove old group if it exists
          if (oldGroup) oldGroup.remove();

          // Skip rendering if hidden behind lower depths
          if (groupDepth > depthRenderLimit && groupDepth < maxDepth)
            return false;

          // Generate fill colours for the segments
          const strokeArray = new Array(color[depthIndex].length).fill(0);
          const fillArray = color[depthIndex]
            .map((value, index) => {
              strokeArray[index] =
                Math.min(1, map(value ** 0.5, 0, 0.5, 1, 0)) * 4 * GLOBAL_SCALE;
              const offset =
                colorScaler.length * colorDisparity +
                noise.simplex2(
                  groupDepth * 0.2,
                  index * 2 + colorIndex * 0.001
                ) *
                  colorScaler.length *
                  colorDisparity *
                  colorVariation;
              const colorGreyscale = index;
              const colorFromIndex = Math.floor(
                (colorIndex + offset) % colorScaler.length
              );
              const colorToIndex = Math.floor(
                (colorIndex + offset + 1) % colorScaler.length
              );

              const colorStart = getColor(
                colorGreyscale,
                colorScaler[colorFromIndex]
              );
              const colorEnd = getColor(
                colorGreyscale,
                colorScaler[colorToIndex]
              );
              let interpolator = culori.interpolate(
                [colorStart, colorEnd],
                interpolationMode
              );
              const targetColor = interpolator(
                ((colorIndex + offset) % 1) ** colorInterpolationExponent
              );
              interpolator = culori.interpolate(
                [getColor(colorGreyscale), targetColor],
                interpolationMode
              );
              const color = interpolator(tint);

              interpolator = culori.interpolate(
                ["#e6e6e6", color],
                interpolationMode
              );
              return culori.formatHex(interpolator(value));
            })
            .reverse();

          // Create a new group for the divided circle
          const newGroup = new paper.Group({
            name: "circle-division",
            parent: s02_sceneGroup,
            children: divideCircle(
              circles[depthIndex],
              divisions[depthIndex],
              center,
              fillArray
            ),
            applyMatrix: false,
          });

          // Update scaling and stroke width for each segment
          newGroup.children.forEach((path) => {
            path.scaling = groupDepth < maxDepth ? scale[groupDepth - 1] : 4;
            path.strokeWidth = strokeArray[path.pathIndex] * path.thickness;
          });

          // Sort the children by stroke width for consistent stroke widths
          const sortedChildren = newGroup.children
            .slice()
            .sort((a, b) => a.strokeWidth - b.strokeWidth);
          newGroup.removeChildren();
          sortedChildren.forEach((path) => newGroup.addChild(path));

          // Apply rotation to the group
          newGroup.rotation = angles[groupDepth - 1];
          return newGroup;
        }
      );

      // Increment the colour index for animation
      this.element.colorIndex += deltaTime * colorSpeed;
    }
  )
);

// === SCENE REGISTRATION ===
// Create and register the scene with the scene manager
const s02_scene = new Scene(
  "scene-02-colour",
  s02_sceneGroup,
  s02_sceneChoreographies
);
sceneManager.addScene(s02_scene);

// === CLEANUP ===
// Delete variables that are no longer needed to free memory
delete s02_backgroundColor;
delete s02_strokeColor;
delete s02_circleStrokeWidth;
delete s02_maxDepth;
delete s02_maxColor;
delete s02_center;
delete s02_circleRadius;
delete s02_circles;
delete s02_circleScaleControlPoints;
delete s02_circleDivisionControlPoints;
delete s02_circleRotationControlPoints;
delete s02_circleColorControlPoints;
delete s02_circlesDivided;
delete s02_rotationControlPoints;
delete s02_colorScaler;
