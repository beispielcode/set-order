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

  // Create a background rectangle
  const background = new Path.Rectangle({
    point: [0, 0],
    size: [view.viewSize.width, view.viewSize.height],
    fillColor: colors[0],
  });

  let gridSize = view.viewSize.width / 32;
  const scenesNumber = 3;
  const scenePositions = new Array(scenesNumber + 1)
    .fill(0)
    .map((value, index) =>
      cap(Math.floor(index / scenesNumber, 0, scenesNumber) * 127)
    );

  const sceneElements = [];
  const sceneControlePoints = scenePositions.map((value, index) => ({
    position: [Math.floor((index / scenesNumber) * 127), 0, 0, 0],
    value: index,
  }));

  // Scene 01 – Dot

  const scene01 = [];
  const s01_SizeArray = [14, 12, 6, 4, 2];
  const s01_SquishArray = [
    [
      [
        [0, 0],
        [randomInt(-1, 0), randomInt(-1, 0)],
        [randomInt(-4, 1), randomInt(-4, 1)],
        [randomInt(-7, 2), randomInt(-7, 2)],
        [randomInt(-10, 3), randomInt(-10, 3)],
      ],
    ],
    new Array(2).fill(0).map((value) => [
      [0, 0],
      [randomInt(-1, 0), randomInt(-1, 0)],
      [randomInt(-2, 1), randomInt(-2, 1)],
      [randomInt(-4, 2), randomInt(-4, 2)],
      [randomInt(-6, 3), randomInt(-6, 3)],
    ]),
    new Array(6).fill(0).map((value) => [
      [0, 0],
      [randomInt(-3, 0), randomInt(-3, 0)],
      [randomInt(-3, 1), randomInt(-3, 1)],
      [randomInt(-3, 2), randomInt(-3, 2)],
      [randomInt(-3, 3), randomInt(-3, 3)],
    ]),
    new Array(15).fill(0).map((value) => [
      [0, 0],
      [randomInt(-2, 0), randomInt(-2, 0)],
      [randomInt(-2, 1), randomInt(-2, 1)],
      [randomInt(-2, 2), randomInt(-2, 2)],
      [randomInt(-2, 3), randomInt(-2, 3)],
    ]),
    new Array(45).fill(0).map((value) => [
      [0, 0],
      [randomInt(-1, 0), randomInt(-1, 0)],
      [randomInt(-1, 1), randomInt(-1, 1)],
      [randomInt(-1, 2), randomInt(-1, 2)],
      [randomInt(-1, 3), randomInt(-1, 3)],
    ]),
  ];
  for (let i = 0; i < 45; i++) {
    const gridX = i % 9;
    const gridY = Math.floor(i / 9);
    const steps = 5;
    const positions = [];
    positions.push([16, 9]);
    positions.push([9 + Math.round(gridX / 9) * 14, 9]);

    positions.push([
      8 + Math.round((gridX / 9) * 2) * 8,
      5 + Math.round(gridY / 5) * 8,
    ]);
    positions.push([
      6 + Math.round(gridX / 2) * 5,
      4 + Math.round(gridY / 2) * 5,
    ]);
    positions.push([4 + Math.round(gridX) * 3, 3 + Math.round(gridY) * 3]);

    // 1x1
    const squishes = [s01_SquishArray[0][0]];
    // 2x1
    squishes.push(s01_SquishArray[1][Math.round(gridX / 9 + 1) - 1]);
    // 3x2
    squishes.push(
      s01_SquishArray[2][
        Math.round((gridX / 9) * 2 + 1) * Math.round(gridY / 5 + 1) - 1
      ]
    );
    // 5x3
    squishes.push(
      s01_SquishArray[3][
        Math.round(gridX / 2 + 1) * Math.round(gridY / 2 + 1) - 1
      ]
    );
    // 9x5
    squishes.push(
      s01_SquishArray[4][Math.round(gridX + 1) * Math.round(gridY + 1) - 1]
    );

    // const distancesFromCenter = [
    //   1, // no offset
    //   Math.round(gridX / 9) + 1, // right square rotate twice as fast
    //   map(new Point(1, 0.5).getDistance(
    //     new Point(Math.round((gridX / 9) * 2), Math.round(gridY / 5)),
    //     true
    //   ), 0, 1, 1, 2),
    // ];
    const gridCenter = new Point(16, 9);
    const distancesFromCenter = positions.map((pos, index) =>
      index == 1
        ? 1 + Math.round(gridX / 9) * 0.5
        : gridCenter.getDistance(new Point(pos[0], pos[1]), true) / 180 / 2 + 1
    );

    const attributeConfigs = [
      {
        attribute: "scene",
        axes: [0],
        transitions: ["threshold"],
        controlPoints: sceneControlePoints,
      },
      {
        attribute: "size",
        axes: [1],
        dynamicContants: [{ f: 2.75, z: 1.25, r: 0 }],
        transitions: ["threshold"],
        controlPoints: s01_SizeArray.map((size, index) => ({
          position: [0, Math.floor((index / steps) * 127), 0, 0],
          value: size,
        })),
      },
      {
        attribute: "position",
        axes: [1],
        transitions: ["threshold"],
        controlPoints: positions.map((pos, index) => ({
          position: [0, Math.floor((index / steps) * 127), 0, 0],
          value: pos,
        })),
      },
      {
        attribute: "rotation",
        axes: [2],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 0, 127, 0], value: 90 },
        ],
      },
      {
        attribute: "rotationScale",
        axes: [1, 3],
        transitions: ["threshold", "smooth"],
        controlPoints: distancesFromCenter.map((value, index) => ({
          position: [0, Math.floor((index / steps) * 127), 0, 0],
          value: value,
        })),
      },
      {
        attribute: "squish",
        axes: [1, 3],
        transitions: ["threshold", "steps"],
        controlPoints: squishes.reduce(
          (acc, squishArray, squishArrayIndex) =>
            acc.concat(
              squishArray.map((squish, squishIndex) => ({
                position: [
                  0,
                  Math.floor((squishArrayIndex / steps) * 127),
                  0,
                  Math.floor((squishIndex / steps) * 127),
                ],
                value: squish,
              }))
            ),
          []
        ),
      },
    ];

    scene01.push(
      new Choreography(
        new Path.Rectangle({
          point: [view.center.x - gridSize / 2, view.center.y - gridSize / 2],
          size: [gridSize, gridSize],
          fillColor: "#000000",
          applyMatrix: false,
          // selected: true,
        }),
        attributeConfigs,
        function () {
          const rect = this.element;

          // rect.scaling =
          //   this.size + map(this.rotation, 0, 45, 0, (Math.sqrt(2) - 1) / 2);
          // rect.scaling = this.size;
          rect.scaling = [
            this.size * (1 - this.scene) +
              this.squish[0] * (1 - this.scene) +
              32 * this.scene,
            this.size * (1 - this.scene) +
              this.squish[1] * (1 - this.scene) +
              18 * this.scene,
          ];

          // rect.rotation = this.rotation;
          rect.rotation = this.rotation * this.rotationScale * (1 - this.scene);
          rect.position = [
            gridSize * this.position[0] * (1 - this.scene) +
              gridSize * 16 * this.scene,
            gridSize * this.position[1] * (1 - this.scene) +
              gridSize * 9 * this.scene,
          ];
          if (this.scene > 1 - 1e-6) {
            this.element.remove();
            background.fillColor = "#000";
          } else {
            project.activeLayer.addChild(this.element);
            background.fillColor = colors[0];
          }
        }
      )
    );
  }
  sceneElements.push(...scene01);

  // Scene 02 – Snakes

  const scene02 = [];
  const s02_layer = new Layer();
  let s02_gridSize = view.viewSize.width / 80;
  const s02_dotTemplate = new Path.Rectangle({
    point: [0, 0],
    size: s02_gridSize,
    fillColor: "#fff",
    applyMatrix: false,
    // selected: true,
  });
  const s02_dotSymbol = new Choreography(
    new Symbol(s02_dotTemplate),
    [
      {
        attribute: "scene",
        axes: [0],
        transitions: ["threshold"],
        controlPoints: sceneControlePoints,
      },
    ],
    function () {
      const definition = this.element.definition;
      definition.scaling = cap(this.scene ** 2, 1e-6, 1);
      // definition.scaling.x = cap(this.scene ** 2, 1e-6, 1);
    }
  );
  scene02.push(s02_dotSymbol);
  const s02_padding = new Point(3.5 + 0.5, 4 + 0.5);
  // GRID
  for (let i = 0; i < 37 * 19; i++) {
    const gridX = i % 37;
    const gridY = Math.floor(i / 37);
    scene02.push(
      new Choreography(
        s02_dotSymbol.element.place(
          s02_padding
            .add(new Point(gridX * 2, gridY * 2))
            .multiply(s02_gridSize)
        ),
        [
          {
            attribute: "scene",
            axes: [0],
            transitions: ["threshold"],
            controlPoints: sceneControlePoints,
          },
        ],
        function () {
          const instance = this.element;
          // if (this.scene < 1e-6 || this.scene > 2) {
          if (this.scene < 1e-6 || this.scene > 3) {
            this.element.remove();
          } else {
            s02_layer.addChild(this.element);
          }
        }
      )
    );
  }

  // CIRCLE
  const s02_circleCenter = new Point(36, 18);
  const s02_minCircleRadius = 2;
  const s02_maxCircleRadius = 19;
  for (let y = 0; y <= 37; y++) {
    for (let x = 0; x <= 37; x++) {
      const gridX = s02_circleCenter.x + x - s02_maxCircleRadius;
      const gridY = s02_circleCenter.y + y - s02_maxCircleRadius;
      const gridPos = new Point(gridX, gridY);
      const distancesFromCenter = gridPos.getDistance(s02_circleCenter);
      if (
        (gridX % 2) + (gridY % 2) &&
        distancesFromCenter < s02_maxCircleRadius
      ) {
        const instance = s02_dotSymbol.element.place(
          s02_padding.add(gridPos).multiply(s02_gridSize)
        );
        instance.pivot = new Point(
          gridX == s02_circleCenter.x
            ? 0
            : gridX < s02_circleCenter.x
            ? s02_gridSize / 2
            : -s02_gridSize / 2,
          gridY == s02_circleCenter.y
            ? 0
            : gridY < s02_circleCenter.y
            ? s02_gridSize / 2
            : -s02_gridSize / 2
        );
        const radius = distancesFromCenter;
        let movement = new Point.random()
          // .subtract(new Point(0.5, 0.5))
          .multiply(2)
          .round();
        if (y % 2 == 0) {
          // movement = new Point(100, 100);
          movement = gridPos.subtract(s02_circleCenter).normalize();
          movement.x = movement.x
            ? Math.sign(movement.x) * (gridPos.x % 2 ? 1 : 0)
            : 0;
          movement.y = movement.y
            ? Math.sign(movement.y) *
              (floorToDecimal(Math.abs(movement.y), 2) - 1)
            : (randomInt(0, 1) - 0.5) * 2;
        }
        let movementThresholds = new Array(63)
          .fill(0)
          .map((_) =>
            y % 2 == 0 ? random(1 / 127, 0.4) : random(0.5, 126 / 127)
          );
        scene02.push(
          new Choreography(
            { instance, gridPos, radius, movement, movementThresholds },
            [
              {
                attribute: "scene",
                axes: [0],
                transitions: ["threshold"],
                controlPoints: sceneControlePoints,
              },
              {
                attribute: "radius",
                axes: [1],
                transitions: ["smooth"],
                controlPoints: [
                  { position: [0, 0, 0, 0], value: s02_minCircleRadius },
                  {
                    position: [0, 127, 0, 0],
                    value: s02_maxCircleRadius,
                  },
                ],
              },
              {
                attribute: "skew",
                axes: [2],
                transitions: ["smooth"],
                controlPoints: [
                  { position: [0, 0, 0, 0], value: 0 },
                  { position: [0, 0, 127, 0], value: 1 },
                ],
              },
              {
                attribute: "movement",
                axes: [3],
                transitions: ["smooth"],
                controlPoints: [
                  { position: [0, 0, 0, 0], value: 0 },
                  { position: [0, 0, 0, 127], value: 1 },
                ],
              },
            ],
            function () {
              const {
                instance,
                gridPos,
                radius,
                movement,
                movementThresholds,
              } = this.element;
              const movementAmount = this.movement;
              const isActor = this.scene > 1e-6 && this.scene < 2;
              const maxRadius = roundToDecimal(this.radius, 0.125);
              const skew = this.skew;
              // instance.scaling.x = cap(visibility, 1e-6, 1);
              // instance.scaling.y = cap(radius, 1e-6, 1);
              let position = s02_padding.add(gridPos);
              // position = position.subtract(
              //   movement.multiply(cap(movementAmount - movementThresholds, 0, 1))
              // );

              let skewAmount = gridPos.subtract(s02_circleCenter).y / maxRadius;
              // skewAmount *= skew < s02_minCircleRadius ? 0 : skew;
              skewAmount *= (skew < 0.5 / 127 ? 0 : skew) * maxRadius * 2;
              skewAmount =
                skewAmount > 0 ? Math.ceil(skewAmount) : Math.floor(skewAmount);
              skewAmount +=
                gridPos.y % 2
                  ? 0
                  : Math.sign(skewAmount) * (Math.abs(skewAmount) % 2 ? 1 : 0);

              position =
                gridPos.y == s02_circleCenter.y
                  ? position
                  : position.add(new Point(skewAmount, 0));

              if (
                movementAmount >
                movementThresholds[cap(parseInt(maxRadius * 63), 1, 62)]
              )
                position = position.subtract(movement);
              instance.position = position
                .multiply(s02_gridSize)
                .add(instance.pivot);
              // instance.visible = radius <= maxRadius;
              instance.scaling =
                this.scene < 1
                  ? cap(this.scene ** 2, 1e-6, 1)
                  : cap((2 - this.scene) ** 2, 1e-6, 1);
              if (
                !isActor ||
                radius > maxRadius ||
                position.x < s02_padding.x ||
                position.x > s02_padding.x + 72 ||
                position.y < s02_padding.y ||
                position.y > s02_padding.y + 36
              ) {
                instance.remove();
              } else if (radius <= maxRadius) {
                s02_layer.addChild(instance);
              }
            }
          )
        );
      }
    }
  }

  // LINES
  const s02_lineCenter = s02_circleCenter;
  const s02_linePivot = new Point(57.5, 22);
  const s02_offsetArray = new Array(36)
    .fill(0)
    .map((_) =>
      new Array(24)
        .fill(0)
        .map((_, index) =>
          random(0, (index / 24) * 8) > 0.5
            ? randomInt(-parseInt(index / 4 + 1), parseInt(index / 4 + 1))
            : 0
        )
    );
  console.log(s02_offsetArray);

  for (let y = 0; y < 19; y++) {
    for (let x = 0; x < 36; x++) {
      const gridX = 1 + x * 2;
      const gridY = y * 2;
      const gridPos = new Point(gridX, gridY);
      // const distancesFromCenter = gridPos.getDistance(s02_circleCenter, false);
      const distancesFromCenter = gridPos.subtract(s02_circleCenter).abs();

      const visibilityThresholds =
        distancesFromCenter.y / 18 -
        map(distancesFromCenter.x, 0, 36, 2 / 18, 0);

      const instance = s02_dotSymbol.element.place(
        s02_padding.add(gridPos).multiply(s02_gridSize)
      );
      // const pivot = new Point(
      //   gridX == s02_lineCenter.x
      //     ? 0
      //     : gridX < s02_lineCenter.x
      //     ? s02_gridSize / 2
      //     : -s02_gridSize / 2,
      //   gridY == s02_lineCenter.y
      //     ? 0
      //     : gridY < s02_lineCenter.y
      //     ? s02_gridSize / 2
      //     : -s02_gridSize / 2
      // );
      // instance.pivot = pivot;
      // const rotationOrigin = s02_linePivot
      //   .subtract(gridPos.add(s02_padding))
      //   .multiply(s02_gridSize);
      // console.log(rotationOrigin);

      scene02.push(
        new Choreography(
          { instance, gridPos, visibilityThresholds },
          [
            {
              attribute: "scene",
              axes: [0],
              transitions: ["threshold"],
              controlPoints: sceneControlePoints,
            },
            {
              attribute: "progress",
              axes: [1],
              // transitions: ["smooth"],
              // controlPoints: [
              //   {
              //     position: [0, 0, 0, 0],
              //     value: -2 / 18 / 2,
              //   },
              //   {
              //     position: [0, 127, 0, 0],
              //     value: 1,
              //   },
              // ],
              transitions: ["threshold"],
              controlPoints: new Array(10).fill(0).map((_, i) => ({
                position: [0, Math.floor((i / 9) * 127), 0, 0],
                value: (i * 2) / 18,
              })),
            },
            {
              attribute: "rotationScale",
              axes: [2],
              transitions: ["smooth"],
              controlPoints: [
                {
                  position: [0, 0, 0, 0],
                  value: 0,
                },
                {
                  position: [0, 0, 127, 0],
                  value: 1,
                },
              ],
            },
            {
              attribute: "movement",
              axes: [3],
              transitions: ["smooth"],
              controlPoints: [
                { position: [0, 0, 0, 0], value: 0 },
                {
                  position: [0, 0, 0, 127],
                  value: s02_offsetArray[0].length - 1,
                },
              ],
            },
          ],
          function () {
            const { instance, gridPos, visibilityThresholds } = this.element;
            const progress = this.progress;
            const rotationScale = this.rotationScale;
            const movement = Math.round(this.movement);
            const isActor = this.scene > 1 + 1e-6 && this.scene < 3;

            instance.scaling.y =
              this.scene < 2
                ? cap((this.scene - 1) ** 2, 1e-6, 1)
                : cap((3 - this.scene) ** 2, 1e-6, 1);
            instance.visible = progress > visibilityThresholds;
            const offset = new Point(
              0,
              s02_offsetArray[parseInt((gridPos.x - 1) / 2)][movement]
            );

            let rotateGridPos = gridPos.add(offset);
            if (rotateGridPos.x > s02_lineCenter.x) {
              rotateGridPos = s02_padding
                .add(rotateGridPos.subtract(new Point(0.5, 0.5)))
                .rotate(90 * -rotationScale, s02_linePivot)
                .add(new Point(0.5, 0.5))
                .subtract(s02_padding);
              rotateGridPos.x = roundToDecimal(rotateGridPos.x, 1);
              rotateGridPos.y = roundToDecimal(rotateGridPos.y, 1);
              // instance.rotation = 90 * rotationScale;
            }
            // instance.pivot = null;
            instance.position = s02_padding
              .add(rotateGridPos)
              .multiply(s02_gridSize);
            // instance.pivot = pivot;
            if (
              !isActor ||
              rotateGridPos.x < 0 ||
              rotateGridPos.x > 72 ||
              rotateGridPos.y < 0 ||
              rotateGridPos.y > 36
            ) {
              instance.remove();
            } else {
              project.activeLayer.addChild(instance);
            }
          }
        )
      );
    }
  }

  sceneElements.push(...scene02);

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
}
