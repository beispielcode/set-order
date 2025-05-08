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
    size: [canvasWidth, canvasHeight],
    fillColor: colors[0],
  });

  const sceneElements = [];

  // Scene 02 – Colour
  const s02_layer = new Layer();
  const s02_maxDepth = 8;
  const s02_maxColor = 2 ** s02_maxDepth;
  const s02_center = new Point(canvasWidth / 2, canvasHeight / 2);
  function getColor(index, channelScalers = [1, 1, 1]) {
    const [r, g, b] = channelScalers.map((scale) =>
      // Math.floor((255 / 2 ** s02_maxDepth) * index * scale)
      Math.floor(255 - (255 / 2 ** s02_maxDepth) * index * scale)
    );
    return culori.formatHex(`rgb(${r}, ${g}, ${b})`);
  }

  function divideCircle(path, divisions, center, fillArray) {
    const result = [];
    const pathLength = path.length;
    const neutralHandle = new Point(0, 0);
    divisions = divisions.sort((a, b) => b - a);
    // divisions.pop();
    // division = divisions.filter((v) => v > 0 && v < 1);
    const clone = path.clone().splitAt(pathLength);
    let prevTo = 1;
    divisions.forEach((to, index) => {
      // prevTo = index < divisions.length / 2 ? prevTo : divisions[index + 1];
      // if (to && to !== 1 && prevTo - to > 0) {
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
        // }
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
      path.firstSegment.handleIn = neutralHandle;
      path.lastSegment.handleOut = neutralHandle;
      path.add(center);
      path.pivot = center;
      path.closePath();
    });
    return result;
  }
  // const s02_circleRadius = 64;
  const s02_circleRadius = 512;
  const s02_circles = new Array(s02_maxDepth).fill(0).map(
    (_, index) =>
      new Path.Circle({
        center: s02_center,
        // radius: s02_circleRadius * (s02_maxDepth - index),
        radius: s02_circleRadius,
        strokeColor: "#fff",
        strokeWidth: 2,
        fillColor: "#e6e6e6",
        rotation: 90,
        strokeScaling: false,
        applyMatrix: false,
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
    let divisionPositionArray = new Array(2 ** s02_maxDepth).fill(0);
    for (let amount = 0; amount < s02_maxDepth; amount++) {
      // Scale
      scaleArray = scaleArray.map((value, index) => {
        if (index < amount) return (1 / (amount + 1)) * (1 + index);
        // else if (index < depth) return 1 / (amount + 1) || 1;
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
        .map((value, index) => {
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
      colorArray = colorArray.map((value, index) => {
        const divisionAmount =
          (!depth && !amount) || depth > amount
            ? Math.max(1, s02_maxDepth - depth - 1)
            : Math.max(1, s02_maxDepth - Math.min(depth, amount));
        // const divisionAmount = index + 1;
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
      new Group(
        divideCircle(
          circle,
          s02_circleDivisionControlPoints[0].value[index],
          s02_center
        )
      )
  );

  const s02_rotationControlPoints = new Array(s02_maxDepth)
    .fill(0)
    .map((_, depth) => ({
      position: [0, Math.floor((depth / (s02_maxDepth - 1)) * 127), 0, 0],
      value: new Array(s02_maxDepth)
        .fill(90)
        // .fill(-180)
        // .fill(-270)
        .map((angle, index) => angle * Math.max(0, depth - index + 1)),
      // .map(
      //   (angle, index) =>
      //     (angle / 2 ** index) * Math.max(0, depth - index + 1)
      // ),
    }));

  const so02_whiteScaler = [1, 1, 1];
  // const s02_colorScaler = [
  //   [0, 1, 1],
  //   // [1, 0, 1],
  //   [1, (1 / 255) * 20, (1 / 255) * 145],
  //   [1, 1, 0],
  //   [1, 0, 0],
  //   [0, 1, 0],
  //   [0, 0, 1],
  //   // [1, 1, 1],
  // ];
  // const s02_colorScaler = [
  //   [1, 0, 0],
  //   [1, 1, 0],
  //   [0, 1, 0],
  //   [0, 1, 1],
  //   [0, 0, 1],
  //   [1, 1, 1],
  //   [1, (1 / 255) * 20, (1 / 255) * 145],
  // ];
  const s02_colorScaler = [
    [0, 1, 1],
    [0, 0, 1],
    [1, 0, 1],
    [1, 0, 0],
    [1, 1, 0],
    // [1, 0, 1],
    [1, 1, 1],
    [0, 1 - (1 / 255) * 20, 1 - (1 / 255) * 145],
  ];

  let s02_colorIndex = 0;

  sceneElements.push(
    new Choreography(
      {
        circles: s02_circles,
      },
      [
        {
          attribute: "depthRenderLimit",
          axes: [1],
          transitions: ["smooth"],
          controlPoints: new Array(s02_maxDepth + 1)
            .fill(0)
            .map((_, index) => ({
              position: [
                0,
                Math.floor((index / (s02_maxDepth - 1)) * 127),
                0,
                0,
              ],
              value: index ?? s02_maxDepth,
            })),
        },
        {
          attribute: "divisions",
          axes: [0, 1],
          // transitions: ["threshold", "threshold"],
          transitions: ["smooth", "smooth"],
          // transitions: ["threshold", "smooth"],
          // transitions: ["smooth", "threshold"],
          dynamicContants: [
            { f: 1.75, z: 1, r: 0.1 },
            // { f: 4, z: 1, r: 1 },
            { f: 1.875, z: 1.125, r: 0 },
          ],
          controlPoints: s02_circleDivisionControlPoints,
        },
        {
          attribute: "scale",
          axes: [0, 1],
          // transitions: ["threshold", "threshold"],
          transitions: ["smooth", "smooth"],
          // transitions: ["threshold", "smooth"],
          // transitions: ["smooth", "threshold"],
          dynamicContants: [
            { f: 1.75, z: 1, r: 0.1 },
            // { f: 4, z: 1, r: 1 },
            { f: 2, z: 1, r: 0 },
          ],
          controlPoints: s02_circleScaleControlPoints,
        },
        {
          attribute: "angles",
          axes: [1],
          transitions: ["smooth"],
          // transitions: ["threshold"],
          // dynamicContants: [{ f: 1.5, z: 1.5, r: 0 }],
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
          // transitions: ["threshold", "smooth"],
          // transitions: ["threshold", "threshold"],
          transitions: ["smooth", "smooth"],
          // transitions: ["smooth", "threshold"],
          // transitions: ["steps", "smooth"],
          dynamicContants: [
            { f: 1.75, z: 1, r: 0.1 },
            // { f: 4, z: 1, r: 1 },
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
            { position: [0, 0, 0, 127], value: 1 },
          ],
        },
      ],
      function () {
        const { circles } = this.element;
        const divisions = this.divisions;
        const depthRenderLimit = Math.floor(this.depthRenderLimit + 2);
        const scale = this.scale;
        const rotationAmount = this.rotationAmount;
        const angles = this.angles.map((angle) => angle * rotationAmount);

        const color = this.color;
        const tint = this.tint;
        const colorVariation = this.colorVariation;
        const colorSpeed = this.colorSpeed ** 1.5 * 1.25;
        // const colorSpeed = this.colorSpeed;
        const rotation = this.rotation;
        // const colorInterpolationExponent = 15;
        const colorInterpolationExponent = 6;
        const colorDisparity = 3;
        // const interpolationMode = "jch";
        // const interpolationMode = "okhsl"; // gets closer to white
        const interpolationMode = "oklch";
        // const interpolationMode = "hsl";
        // const interpolationMode = "lchuv"; // Deeper colors

        circles.forEach((circle) => project.activeLayer.addChild(circle));

        s02_circlesDivided = s02_circlesDivided.map((oldGroup, depthIndex) => {
          const groupDepth = s02_maxDepth - depthIndex;
          if (groupDepth > depthRenderLimit) return oldGroup;
          const rotationScale = 2 << (1 / scale[groupDepth - 1]);

          oldGroup.remove();
          const strokeArray = new Array(color[depthIndex].length).fill(0);

          const fillArray = color[depthIndex]
            .map((value, index) => {
              strokeArray[index] =
                Math.min(1, map(value ** 0.5, 0, 0.5, 1, 0)) * 2;
              const offset =
                s02_colorScaler.length * colorDisparity +
                noise.simplex2(
                  // groupDepth * 0.25 + s02_colorIndex * 0.001,
                  // groupDepth * 0.025,
                  groupDepth * 0.2,
                  // groupDepth * 0.25,
                  // (index + colorSpeed * 4) * 0.04 * groupDepth +
                  //   s02_colorIndex * 0.0025
                  index * 2 + s02_colorIndex * 0.001
                ) *
                  s02_colorScaler.length *
                  colorDisparity *
                  colorVariation;
              // const colorGreyscale = 2 ** s02_maxDepth - index;
              const colorGreyscale = index;
              const colorFromIndex = Math.floor(
                (s02_colorIndex + offset) % s02_colorScaler.length
              );
              const colorToIndex = Math.floor(
                (s02_colorIndex + offset + 1) % s02_colorScaler.length
              );

              const colorStart = getColor(
                colorGreyscale,
                s02_colorScaler[colorFromIndex]
              );
              const colorEnd = getColor(
                colorGreyscale,
                s02_colorScaler[colorToIndex]
              );
              let interpolator = culori.interpolate(
                [colorStart, colorEnd],
                interpolationMode
              );
              const targetColor = interpolator(
                ((s02_colorIndex + offset) % 1) ** colorInterpolationExponent
              );
              interpolator = culori.interpolate(
                [getColor(colorGreyscale), targetColor],
                interpolationMode
              );
              const color = interpolator(tint);
              // console.log(color);

              // lerp(
              so02_whiteScaler[index],
                //   lerp(
                //     channel,
                //     s02_colorScaler[colorToIndex][index],
                //     ((s02_colorIndex + offset) % 1) ** 0.5
                //   ),
                //   tint
                // )
                // );

                (interpolator = culori.interpolate(
                  [
                    "#e6e6e6",
                    color,
                    // getColor(
                    //   2 ** s02_maxDepth - index,
                    //   // scalers[Math.round(colorLength - 2)]
                    //   scaler
                    // ),
                  ],
                  interpolationMode
                ));
              return culori.formatHex(interpolator(value));
            })
            .reverse();

          const newGroup = new Group({
            children: divideCircle(
              circles[depthIndex],
              divisions[depthIndex],
              s02_center,
              fillArray
            ),
            applyMatrix: false,
          });
          newGroup.children.forEach((path, index) => {
            path.scaling = scale[groupDepth - 1];
            // path.strokeWidth =
            //   (strokeArray[path.pathIndex] / scale[groupDepth - 1]) *
            //   path.thickness;
            path.strokeWidth = strokeArray[path.pathIndex] * path.thickness;
          });
          const sortedChildren = newGroup.children
            .slice()
            .sort((a, b) => a.strokeWidth - b.strokeWidth);
          newGroup.removeChildren();
          sortedChildren.forEach((path) => newGroup.addChild(path));
          newGroup.rotation = angles[groupDepth - 1];
          return newGroup;
        });
        circles.forEach((circle) => circle.remove());
        // s02_colorIndex += map(
        //   colorLength - 1,
        //   0,
        //   s02_colorScaler.length,
        //   0,
        //   deltaTime * 4
        // );
        s02_colorIndex += deltaTime * colorSpeed;
        // console.log(s02_colorIndex);
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
