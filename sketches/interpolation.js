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
  const s02_backgroundColor = "#e6e6e6";
  const s03_strokeWidth = 16;

  // Create a background rectangle
  const backgroundLayer = new Layer();
  const background = new Path.Rectangle({
    parent: backgroundLayer,
    point: [0, 0],
    size: [canvasWidth, canvasHeight],
    fillColor: s02_backgroundColor,
  });

  const sceneElements = [];

  // Scene 03 – Curve

  const s03_layer = new Layer();
  const s03_curveResolution = 128;
  const s03_curvePoints = [
    new Point(0, canvasHeight),
    new Point(0, 0),
    new Point(0, 0),
    new Point(canvasWidth, 0),
  ];
  const s03_curveMarkers = new Array(s03_curveResolution).fill(0).map(
    (_, index) =>
      new Path.Rectangle({
        from: new Point(0, canvasHeight),
        to: new Point(
          (canvasWidth / s03_curveResolution) *
            (s03_curveResolution - index - 1),
          (canvasHeight / s03_curveResolution) * (index + 1)
        ),
        strokeWidth: s03_strokeWidth,
        strokeColor: index % 2 ? "#000" : "#fff",
        fillColor: index % 2 ? "#000" : "#fff",
        strokeJoin: "round",
      })
  );
  const s03_curve = new Curve(...s03_curvePoints);
  const s03_curvePath = new Path({
    segments: [s03_curve.segment1, s03_curve.segment2],
    parent: s03_layer,
    strokeColor: "#FF1493",
    strokeWidth: s03_strokeWidth,
  });

  sceneElements.push(
    new Choreography(
      {
        curve: s03_curve,
        drawnPath: new Path({
          segments: new Array(s03_curveResolution + 1)
            .fill(0)
            .map(
              (_, index) =>
                s03_curve.getLocationAtTime(index / s03_curveResolution).point
            ),
          parent: s03_layer,
          strokeColor: "#FF1493",
          strokeWidth: s03_strokeWidth,
          strokeJoin: "round",
        }),
        curvePath: s03_curvePath,
        debug: s03_curvePath.segments.map(
          (segment, index) =>
            new Path.Circle({
              center: index ? segment.handleIn : segment.handleOut,
              // center: new Point(0, 0),
              radius: 8,
              fillColor: "#FF1493",
              applyMatrix: false,
            })
        ),
        // Reversed markers in order to facilitate index calculation
        markers: s03_curveMarkers.reverse(),
        noiseZ: 0,
      },
      [
        {
          attribute: "resolution",
          axes: [0],
          transitions: ["smooth"],
          controlPoints: [
            { position: [0, 0, 0, 0], value: 2 },
            { position: [127, 0, 0, 0], value: s03_curveResolution },
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
        const { curve, drawnPath, curvePath, debug, markers, noiseZ } =
          this.element;
        const resolution = this.resolution;
        const tension = this.tension;
        const counterTension = this.counterTension;
        const dance = this.dance;

        // This serves its purpose.
        const handle1X =
          canvasWidth *
          ((1 + 2 * counterTension - tension) / 3 +
            (25 / 12) * counterTension * tension);
        const handle2X =
          (-canvasWidth *
            (4 -
              4 * counterTension +
              8 * tension +
              25 * counterTension * tension)) /
          12;
        const handle1Y =
          (-canvasHeight * (1 - counterTension) * (1 + 2 * tension)) / 3;
        const handle2Y =
          (canvasHeight * (1 - tension) * (1 - counterTension ** 3)) / 3;

        // console.log(
        //   `handle1X: ${handle1X / canvasWidth}, handle1Y: ${
        //     -handle1Y / canvasHeight
        //   }`
        // );
        // console.log(
        //   `handle2X: ${-handle2X / canvasWidth}, handle2Y: ${
        //     handle2Y / canvasHeight
        //   }`
        // );
        curve.handle1 = new Point(handle1X, handle1Y);
        curve.handle2 = new Point(handle2X, handle2Y);
        debug[0].position = curve.point1.add(curve.handle1);
        debug[1].position = curve.point2.add(curve.handle2);
        curvePath.segments[0][2] = curve.handle1;
        curvePath.segments[1][1] = curve.handle2;
        debug[0].visible = false;
        debug[1].visible = false;
        curvePath.visible = false;
        markers.forEach((marker, index) => {
          const curveTime = Math.min((1 / resolution) * (index + 1), 1);
          const curveAtTime = curve.getLocationAtTime(curveTime).point;
          const bottomRight = new Point(canvasWidth * curveTime, canvasHeight);
          const topLeft = new Point(0, curveAtTime.y);
          let topRight = curveAtTime;

          if (curveTime < 1 - 1e-6) {
            const widthPercentage = Math.abs(
              (curveAtTime.x - bottomRight.x) /
                (curveAtTime.x > bottomRight.x
                  ? canvasWidth - bottomRight.x
                  : bottomRight.x)
            );
            const heightPercentage = Math.abs(
              (canvasHeight - curveAtTime.y) / canvasHeight
            );
            const limitedByHeight = widthPercentage < heightPercentage;
            const maxScale = limitedByHeight
              ? 1 / heightPercentage
              : 1 / widthPercentage;

            // Return a value t between 0 and 1
            // const danceAmount = lerp(
            //   limitedByHeight ? heightPercentage : widthPercentage,
            //   (noise.simplex2(index * 10, noiseZ) * dance + 1) * 0.5,
            //   dance * (1 - curveTime ** 10)
            // );
            // const danceAmount = lerp(
            //   limitedByHeight ? heightPercentage : widthPercentage,
            //   (noise.simplex2(index * 0.1, noiseZ) * dance + 1) * 0.5,
            //   dance * (1 - curveTime ** 10)
            // );
            // const danceAmount = lerp(
            //   limitedByHeight ? heightPercentage : widthPercentage,
            //   (noise.simplex2(index * 0.1, noiseZ) * dance + 1) * 0.5,
            //   dance
            // );
            // const danceAmount = dance;

            // const scaler = maxScale * danceAmount;

            // topRight = bottomRight.add(
            //   curveAtTime.subtract(bottomRight).multiply(scaler)
            // );
            // topRight = curveAtTime.subtract(bottomRight);
            // topRight.angle = topRight.angle * (danceAmount + 0.5);
            // topRight = bottomRight.add(topRight);
            // if (index == 1) {
            // const angle = curveAtTime.subtract(bottomRight).angle;
            topRight = new Point(curveAtTime.x, curveAtTime.y - canvasHeight);
            const vectorLength = topRight.length;
            const angle = topRight.angle;
            // let minAngle =
            //   vectorLength <= canvasHeight
            //     ? -90
            //     : -Math.asin(canvasHeight / vectorLength) * (180 / Math.PI);
            // let maxAngle =
            //   vectorLength <= canvasWidth
            //     ? 0
            //     : -Math.acos(canvasWidth / vectorLength) * (180 / Math.PI);
            // let maxAngle =
            //   -Math.acos(cap(canvasWidth / vectorLength, -1, 1)) *
            //   (180 / Math.PI);
            let maxAngle =
              -Math.asin(
                cap(
                  (canvasHeight * (topRight.x / canvasWidth) ** 4) /
                    vectorLength,
                  -1,
                  1
                )
              ) *
              (180 / Math.PI);
            // let minAngle =
            //   -Math.asin(
            //     cap(
            //       (canvasHeight * (1 - (1 - topRight.x / canvasWidth) ** 1.8)) /
            //         vectorLength,
            //       -1,
            //       1
            //     )
            //   ) *
            //   (180 / Math.PI);
            let minAngle =
              -Math.asin(
                cap(
                  (canvasHeight *
                    (1 - (1 - vectorLength / 2570.0583650960148) ** 2)) /
                    vectorLength,
                  -1,
                  1
                )
              ) *
              (180 / Math.PI);
            // let minAngle =
            //   -Math.acos(
            //     cap(
            //       (canvasWidth * (topRight.x / canvasWidth) ** 4) /
            //         vectorLength,
            //       -1,
            //       1
            //     )
            //   ) *
            //   (180 / Math.PI);
            // minAngle *= cap(
            //   map(vectorLength / canvasHeight / 2, 0, 1, 0, 1),
            //   1e-6,
            //   1
            // );
            // let maxAngle =
            //   -Math.acos(canvasWidth / vectorLength) * (180 / Math.PI);

            topRight.angle = lerp(
              angle,
              (noise.simplex3(resolution * 0.001, index * 0.25, noiseZ) *
                map(dance, 0, 1, 2, 1) +
                1) *
                0.5 *
                (maxAngle - minAngle) +
                minAngle,
              dance
            );
            // topRight.angle = dance * (maxAngle - minAngle) + minAngle;
            topRight.y += canvasHeight;

            // console.log(angle);
            // debug[0].position = newPos;
            // }
          }
          marker.segments[1].point = topLeft;
          marker.segments[2].point = topRight;
          marker.segments[3].point = bottomRight;
          drawnPath.segments[index + 1].point = topRight;
        });
        this.element.noiseZ += map(dance, 0, 1, 0.25, 1) * 0.0025;
      }
    )
  );

  // Define the onFrame event handler for animation and interaction
  let lastInteractionTime = performance.now(); // Ensure this is defined
  view.onFrame = () => {
    updateAxes(deltaTime);
    sceneElements.forEach((sceneElement) => {
      sceneElement.update();
    });
  };
  sceneElements.forEach((sceneElement) => {
    sceneElement.update();
  });
}
