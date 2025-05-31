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
const s02_backgroundColor = "#e6e6e6";

function getColor(index, channelScalers = [1, 1, 1]) {
  const [r, g, b] = channelScalers.map((scale) =>
    Math.floor(255 - (255 / 2 ** s02_maxDepth) * index * scale)
  );
  return culori.formatHex(`rgb(${r}, ${g}, ${b})`);
}

function divideCircle(path, divisions, center, fillArray) {
  const result = [];
  const pathLength = path.length;
  // const neutralHandle = new Point(0, 0);
  divisions = divisions.sort((a, b) => b - a);
  const clone = path.clone().splitAt(pathLength);
  let prevTo = 1;
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
  if (fillArray && fillArray[fillArray.length - 1]) {
    clone.fillColor = fillArray[fillArray.length - 1];
    clone.strokeWidth = 0;
  }
  clone.pathIndex = divisions.length - 1;
  clone.thickness = 0;
  result.push(clone);
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

// Scene 02 – Colour
const s02_sceneGroup = new paper.Group();
s02_sceneGroup.name = "color";
const s02_sceneChoreographies = [];

// Create a background rectangle
const s02_background = new paper.Path.Rectangle({
  name: "background",
  parent: s02_sceneGroup,
  point: [0, 0],
  size: paper.view.viewSize,
  fillColor: s02_backgroundColor,
});

const s02_maxDepth = 8;
const s02_maxColor = 2 ** s02_maxDepth;
const s02_center = paper.view.center;

const s02_circleRadius = 1024 * GLOBAL_SCALE;
const s02_circles = new Array(s02_maxDepth).fill(0).map(
  (_) =>
    new paper.Path.Circle({
      name: "circle",
      parent: s02_sceneGroup,
      center: s02_center,
      radius: s02_circleRadius,
      strokeColor: "#fff",
      strokeWidth: 4 * GLOBAL_SCALE,
      fillColor: "#e6e6e6",
      rotation: 90,
      strokeScaling: false,
      applyMatrix: false,
      insert: false,
    })
);

// Build the control points at each depth
const s02_circleScaleControlPoints = [];
const s02_circleDivisionControlPoints = [];
const s02_circleRotationControlPoints = [];
const s02_circleColorControlPoints = [];
for (let depth = 0; depth < s02_maxDepth; depth++) {
  let scaleArray = new Array(s02_maxDepth).fill(1);
  let divisionArray = new Array(s02_maxDepth).fill(0);
  let colorArray = new Array(s02_maxDepth).fill(0);
  // let divisionPositionArray = new Array(2 ** s02_maxDepth).fill(0);
  for (let amount = 0; amount < s02_maxDepth; amount++) {
    // Scale
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

    // Division
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

    // Color
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
let s02_circlesDivided = s02_circles.map(
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

const s02_rotationControlPoints = new Array(s02_maxDepth)
  .fill(0)
  .map((_, depth) => ({
    position: [0, Math.floor((depth / (s02_maxDepth - 1)) * 127), 0, 0],
    value: new Array(s02_maxDepth)
      .fill(90)
      .map((angle, index) => angle * Math.max(0, depth - index + 1)),
  }));

const so02_whiteScaler = [1, 1, 1];
const s02_colorScaler = [
  [0, 1, 1],
  [0, 0, 1],
  [1, 0, 1],
  [1, 0, 0],
  [1, 1, 0],
  [1, 1, 1],
  // #ff00b2 inverted
  [0, 1, 1 - (1 / 255) * 178],
];

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
      {
        attribute: "depthRenderLimit",
        axes: [1],
        transitions: ["smooth"],
        controlPoints: new Array(s02_maxDepth + 1).fill(0).map((_, index) => ({
          position: [0, Math.floor((index / (s02_maxDepth - 1)) * 127), 0, 0],
          value: index ?? s02_maxDepth,
        })),
      },
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
      {
        attribute: "angles",
        axes: [1],
        transitions: ["smooth"],
        controlPoints: s02_rotationControlPoints,
      },
      {
        attribute: "rotationAmount",
        axes: [2],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 0, 127, 0], value: 1 },
        ],
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
    function () {
      const { circles, maxDepth, colorIndex, colorScaler, center } =
        this.element;
      const divisions = this.divisions;
      const depthRenderLimit = Math.floor(this.depthRenderLimit + 2);
      const scale = this.scale;
      const rotationAmount = this.rotationAmount;
      const angles = this.angles.map((angle) => angle * rotationAmount);

      const color = this.color;
      const tint = this.tint;
      const colorVariation = this.colorVariation;
      const colorSpeed = this.colorSpeed ** 1.5 * 1.25;
      // const rotation = this.rotation;
      const colorInterpolationExponent = 6;
      const colorDisparity = 0.75;
      const interpolationMode = "oklch";

      // circles.forEach((circle) => project.activeLayer.addChild(circle));

      this.element.circlesDivided = this.element.circlesDivided.map(
        (oldGroup, depthIndex) => {
          const groupDepth = maxDepth - depthIndex;
          if (oldGroup) oldGroup.remove();
          if (groupDepth > depthRenderLimit && groupDepth < maxDepth)
            return false;
          // const rotationScale = 2 << (1 / scale[groupDepth - 1]);

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
          newGroup.children.forEach((path, index) => {
            path.scaling = groupDepth < maxDepth ? scale[groupDepth - 1] : 4;
            path.strokeWidth = strokeArray[path.pathIndex] * path.thickness;
          });

          // Sort the children by stroke width
          // -> Ensures consistent stroke widths
          const sortedChildren = newGroup.children
            .slice()
            .sort((a, b) => a.strokeWidth - b.strokeWidth);
          newGroup.removeChildren();
          sortedChildren.forEach((path) => newGroup.addChild(path));
          newGroup.rotation = angles[groupDepth - 1];
          return newGroup;
        }
      );
      // circles.forEach((circle) => circle.remove());
      this.element.colorIndex += deltaTime * colorSpeed;
    }
  )
);

const s02_scene = new Scene("colour", s02_sceneGroup, s02_sceneChoreographies);
sceneManager.addScene(s02_scene);

// Delete variables that are no longer needed
delete s02_backgroundColor;
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
delete so02_whiteScaler;
delete s02_colorScaler;

// Define the onFrame event handler for animation and interaction
//   let lastInteractionTime = performance.now(); // Ensure this is defined
//   view.onFrame = () => {
//     updateAxes(deltaTime);
//     s02_sceneChoreographies.forEach((sceneElement) => {
//       sceneElement.update();
//     });
//   };
//   s02_sceneChoreographies.forEach((sceneElement) => {
//     sceneElement.update();
//   });
// }
