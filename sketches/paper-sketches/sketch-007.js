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
  const scenesNumber = 2;
  const scenePositions = new Array(scenesNumber + 1)
    .fill(0)
    .map((value, index) => Math.floor((index / scenesNumber) * 127));

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
        axes: [1],
        transitions: ["threshold"],
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
      definition.scaling.x = cap(this.scene ** 2, 1e-6, 1);
    }
  );
  scene02.push(s02_dotSymbol);
  const s02_padding = new Point(4.5 + 0.5, 3 + 0.5);
  // grid
  for (let i = 0; i < 36 * 20; i++) {
    const gridX = i % 36;
    const gridY = Math.floor(i / 36);
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
          if (this.scene < 1e-6 || this.scene > 2) {
            this.element.remove();
          } else {
            project.activeLayer.addChild(this.element);
          }
        }
      )
    );
  }
  const s02_compositionCount = 2;
  // big dots
  const s02_bigDotsPositions = [
    s02_padding.add(new Point(34, 18)),
    s02_padding.add(new Point(46, 2)),
    s02_padding.add(new Point(32, 14)),
    s02_padding.add(new Point(4, 32)),
    s02_padding.add(new Point(68, 36)),
    s02_padding.add(new Point(6, 2)),
    s02_padding.add(new Point(26, 2)),
    s02_padding.add(new Point(40, 30)),
    s02_padding.add(new Point(36, 14)),
    s02_padding.add(new Point(6, 36)),
    s02_padding.add(new Point(48, 16)),
    s02_padding.add(new Point(62, 8)),
    s02_padding.add(new Point(0, 30)),
    s02_padding.add(new Point(2, 2)),
    s02_padding.add(new Point(14, 2)),
  ];
  s02_bigDotsPositions.forEach((position, bigDotIndex) => {
    const fixedDots = [
      new Point(0, 0),
      new Point(2, 0),
      new Point(0, 2),
      new Point(2, 2),
    ];
    const moveableDots = [
      new Point(1, 0),
      new Point(0, 1),
      new Point(1, 1),
      new Point(2, 1),
      new Point(1, 2),
    ];
    const hiddenDestination = [
      new Point(-1, 0),
      new Point(0, 1),
      new Point((randomInt(0, 1) - 0.5) * 2, (randomInt(0, 1) - 0.5) * 2),
      new Point(0, -1),
      new Point(1, 0),
    ];
    const shapeArray = fixedDots.map((dot, dotIndex) => ({
      instance: s02_dotSymbol.element.place(
        position.add(dot).multiply(s02_gridSize)
      ),
      position: position.add(dot),
      hidden: new Point(0, 0),
      type: "fixed",
    }));
    moveableDots.forEach((dot, dotIndex) => {
      shapeArray.push({
        instance: s02_dotSymbol.element.place(
          position.add(dot).multiply(s02_gridSize)
        ),
        position: position.add(dot),
        hidden: hiddenDestination[dotIndex],
        threshold: random(1 / 127, 1),
        type: "moveable",
      });
    });

    scene02.push(
      new Choreography(
        shapeArray,
        [
          {
            attribute: "scene",
            axes: [0],
            transitions: ["threshold"],
            controlPoints: sceneControlePoints,
          },
          {
            attribute: "visibility",
            axes: [2],
            transitions: ["threshold"],
            controlPoints: new Array(s02_compositionCount)
              .fill({ position: [0, 0, 0, 0], value: 0 })
              .map((value, index) => ({
                position: [
                  0,
                  0,
                  Math.floor((index / s02_compositionCount) * 127),
                  0,
                ],
                value: index == 0 ? 1 : 0,
              })),
          },
          {
            attribute: "progress",
            axes: [1],
            transitions: ["threshold"],
            controlPoints: [
              {
                position: [
                  0,
                  Math.round((0 / s02_bigDotsPositions.length) * 127),
                  0,
                  0,
                ],
                value: bigDotIndex == 0 ? 1 : 0,
              },
              {
                position: [
                  0,
                  Math.round((bigDotIndex / s02_bigDotsPositions.length) * 127),
                  0,
                  0,
                ],
                value: 1,
              },
              {
                position: [
                  0,
                  Math.round(
                    ((bigDotIndex + 1) / s02_bigDotsPositions.length) * 127
                  ),
                  0,
                  0,
                ],
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
              { position: [0, 0, 0, 127], value: 1 },
            ],
          },
        ],
        function () {
          const shapeArray = this.element;
          const movement = this.movement;
          // console.log(this.progress);

          shapeArray.forEach((shape, shapeIndex) => {
            let offset =
              shape.type == "moveable" && movement > shape.threshold
                ? Math.tan(bigDotIndex * shapeIndex) > 0
                  ? new Point(
                      (Math.round(Math.cos(bigDotIndex * shapeIndex + 1) + 1) /
                        2 -
                        1) *
                        4,
                      0
                    )
                  : new Point(
                      0,
                      (Math.round(
                        Math.sin(
                          Math.sin(bigDotIndex * shapeIndex + 1) + Math.PI
                        ) + 1
                      ) /
                        2 -
                        1) *
                        4
                    )
                : new Point(0, 0);
            let position = shape.position.multiply(s02_gridSize);
            position = position.add(offset.multiply(s02_gridSize));
            position.x = cap(
              position.x,
              s02_padding.x * s02_gridSize,
              (s02_padding.x + 70) * s02_gridSize
            );
            position.y = cap(
              position.y,
              s02_padding.y * s02_gridSize,
              (s02_padding.y + 38) * s02_gridSize
            );
            shape.instance.position = position;
            if (shapeIndex % 2 == 0)
              shape.instance.scaling.y = cap(
                this.progress * this.visibility,
                1e-6,
                1
              );
            else
              shape.instance.scaling.x = cap(
                this.progress * this.visibility,
                1e-6,
                1
              );
          });
          if (this.scene < 1e-6 || this.scene > 2 || this.visibility < 1e-6) {
            shapeArray.forEach((shape, _) => {
              shape.instance.remove();
            });
          } else {
            shapeArray.forEach((shape, _) => {
              project.activeLayer.addChild(shape.instance);
            });
          }
        }
      )
    );
  });
  let s02_textAppearanceOrder = new Array(7 * 12)
    .fill(0)
    .map((value, index) => ({
      index,
      x: index % 12,
      y: Math.floor(index / 12),
      dist:
        Math.floor(index / 12) == 1 && index % 12 > 3 && index % 12 < 9
          ? 0
          : new Point(6, 1).getDistance(
              new Point(index % 12, Math.floor(index / 12))
            ) +
            (Math.floor(index / 12) % 2) * 4 +
            Math.floor(index / 12) +
            random(0, 10),
      point: new Point(index % 12, Math.floor(index / 12)),
    }));
  s02_textAppearanceOrder = s02_textAppearanceOrder
    .sort((a, b) => a.dist - b.dist)
    .map((a, index) => ({
      ...a,
      value: a.dist === 0 ? Math.abs(index - 2) / 12 / 7 : (index + 7) / 13 / 7,
    }));
  s02_textAppearanceOrder = s02_textAppearanceOrder
    .sort((a, b) => a.index - b.index)
    .map((v) => v.value);

  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 12; x++) {
      // let gridX = (x * 6 + y * 2) % 69; // Offsets each row by 1
      let gridX = x;

      let gridY = y;
      const index = gridX + gridY * 12;
      let dotArray = [new Point(2, 1), new Point(2, 3)];
      const posibleDotPlacements = [
        new Point(1, 0),
        new Point(3, 0),
        new Point(1, 2),
        new Point(3, 2),
        new Point(1, 4),
        new Point(3, 4),
      ];
      switch (index) {
        case 16:
          dotArray.push(posibleDotPlacements[0]);
          dotArray.push(posibleDotPlacements[1]);
          break;
        case 17:
          break;
        case 18:
          dotArray.push(posibleDotPlacements[0]);
          dotArray.push(posibleDotPlacements[1]);
          break;
        case 19:
          dotArray.push(posibleDotPlacements[5]);
          break;
        case 20:
          dotArray.push(posibleDotPlacements[1]);
          dotArray.push(posibleDotPlacements[3]);
          dotArray.push(posibleDotPlacements[5]);
          break;
        default:
          const dotCount = randomInt(0, dotArray.length);
          const dotPlacements = [...posibleDotPlacements].shuffle();
          for (let i = 0; i < dotCount; i++) {
            dotArray.push(dotPlacements.pop());
          }
      }

      // for (let i = 0; i < 16; i++) {
      //   dotArray.push(dotArray.shift());
      // }
      dotArray = dotArray
        .filter((dot) => (gridY < 6 ? true : dot.y < 3))
        .map((dot, dotIndex) => {
          const directions = [];
          if (dot.y % 2 == 1) {
            directions.push(new Point(1, 0));
            directions.push(new Point(-1, 0));
          } else {
            if (dot.y) directions.push(new Point(0, -1));
            if (dot.y < 4 && gridY < 6) directions.push(new Point(0, 1));
          }
          return {
            instance: s02_dotSymbol.element.place(
              s02_padding
                .add(new Point(gridX * 6, gridY * 6))
                .add(dot)
                .multiply(s02_gridSize)
            ),
            index:
              // randomInt(0, 7 * 12 * dotArray.length) / dotArray.length / 7 / 12,
              s02_textAppearanceOrder[index],
            position: new Point(gridX * 6, gridY * 6).add(dot),
            threshold: random(1 / 127, 3),
            direction: directions.shuffle()[0],
          };
        });
      scene02.push(
        new Choreography(
          dotArray,
          [
            {
              attribute: "scene",
              axes: [0],
              transitions: ["threshold"],
              controlPoints: sceneControlePoints,
            },
            {
              attribute: "visibility",
              axes: [2],
              transitions: ["threshold"],
              controlPoints: new Array(s02_compositionCount)
                .fill({ position: [0, 0, 0, 0], value: 0 })
                .map((value, index) => ({
                  position: [
                    0,
                    0,
                    Math.floor((index / s02_compositionCount) * 127),
                    0,
                  ],
                  value: index == 1 ? 1 : 0,
                })),
            },
            {
              attribute: "progress",
              axes: [1],
              transitions: ["smooth"],
              controlPoints: [
                {
                  position: [0, 0, 0, 0],
                  value: 0,
                },
                {
                  position: [0, 127, 0, 0],
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
                { position: [0, 0, 0, 127], value: 1 },
              ],
            },
          ],
          function () {
            const dotArray = this.element;
            const movement = this.movement;
            // console.log(this.movement);

            dotArray.forEach((dot) => {
              if (dot.direction && dot.direction.x)
                dot.instance.scaling.x =
                  this.progress >= dot.index
                    ? cap(this.visibility, 1e-6, 1)
                    : 1e-6;
              else
                dot.instance.scaling.y =
                  this.progress > dot.index
                    ? cap(this.visibility, 1e-6, 1)
                    : 1e-6;
              let position = dot.position.add(s02_padding);
              position =
                movement > dot.threshold
                  ? position.add(dot.direction)
                  : position;
              // : position;
              dot.instance.position = position.multiply(s02_gridSize);
            });
            if (this.scene < 1e-6 || this.scene > 2) {
              dotArray.forEach((dot) => {
                dot.instance.remove();
              });
            } else {
              dotArray.forEach((dot) => {
                project.activeLayer.addChild(dot.instance);
              });
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
