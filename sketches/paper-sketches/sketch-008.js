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
  const scenesNumber = 5;
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
  const s01_layer = new Layer();
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
    // const anglesFromCenter = positions.map((pos, index) =>
    //   index == 1
    //     ? 1 + Math.round(gridX / 9) * 0.5
    //     : gridCenter.getDistance(new Point(pos[0], pos[1]), true) / 180 / 2 + 1
    // );
    const angles = positions.map((pos, posIndex) => {
      return new Array(5).fill(0).map((_, index) => {
        // const a = Math.sin(Math.tan(Math.cos(Math.sqrt(2) * pos[0])));
        // const b = Math.sin(Math.atan(Math.cos(pos[1])));
        // const c = Math.cos(Math.atan(Math.cos(index)));
        // noise.simplex3d(pos[0], pos[1], index);
        // return Math.round((a * b + 1) * 1.5 * index) % 5;
        return (
          Math.round(
            (noise.simplex3(
              pos[0] * (posIndex + 1),
              pos[1] * (posIndex + 1),
              index + 1
            ) +
              1) *
              1.5 *
              index
          ) % 2
        );
      });
    });
    console.log(angles);

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
        // transitions: ["smooth"],
        transitions: ["smooth"],
        controlPoints: [
          { position: [0, 0, 0, 0], value: 0 },
          { position: [0, 0, 127, 0], value: 10 },
          // { position: [0, 0, 63, 0], value: 60 },
          // { position: [0, 0, 31, 0], value: 15 },
          // { position: [0, 0, 127 / 3, 0], value: 30 },
          // { position: [0, 0, (127 / 3) * 2, 0], value: 45 },
          // { position: [0, 0, 127, 0], value: 60 },
        ],
      },
      {
        attribute: "rotationScale",
        axes: [1],
        transitions: ["threshold"],
        controlPoints: angles.map((value, index) => ({
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
          rect.rotation =
            45 *
            this.rotationScale[cap(Math.floor(this.rotation), 0, 4)] *
            (1 - this.scene);
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
            s01_layer.addChild(this.element);
            background.fillColor = colors[0];
          }
        }
      )
    );
  }
  sceneElements.push(...scene01);

  // Scene 02 – Snakes

  const scene02 = [];
  const s02_compositionCount = 5;
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
      definition.scaling.x = cap(this.scene ** 2, 1e-6, 1);
    }
  );
  scene02.push(s02_dotSymbol);
  const s02_padding = new Point(4.5 + 0.5, 3 + 0.5);
  // GRID
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
            s02_layer.addChild(this.element);
          }
        }
      )
    );
  }

  // LINES
  const s02_getDiagonalLine = (index) => {
    const x = Math.floor((2 * index) / 3);
    const q = Math.floor(index / 3);
    const r = index % 3;
    let y;
    if (r === 0) y = 4 * q + 1;
    else if (r === 1) y = 4 * q + 3;
    // r === 2
    else y = 4 * q + 4;
    return new Point(x, y);
  };
  const s02_lines = [
    new Array(35).fill(0).map((_, index) => new Point(index * 2 + 1, 24)),
    new Array(19)
      .fill(0)
      .map((_, index) => new Point(54, (19 - index) * 2 - 1)),
    new Array(28)
      .fill(0)
      .map((_, index) => new Point(16, 0).add(s02_getDiagonalLine(index))),
  ];
  s02_lines.map((line, lineIndex) => {
    const gridPos = line.map((dot, dotIndex) => s02_padding.add(dot));
    const instances = line.map((dot, dotIndex) =>
      s02_dotSymbol.element.place(gridPos[dotIndex].multiply(s02_gridSize))
    );
    const offsets = line.map(
      (_) => new Point(randomInt(-1, 1), randomInt(-1, 1))
    );
    const movementThresholds = new Array(63)
      .fill(0)
      .map((_) =>
        new Array(line.length)
          .fill(0)
          .map((_, index) => random(1 / 127, 126 / 127))
      );
    scene02.push(
      new Choreography(
        { instances, gridPos, offsets, movementThresholds },
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
          {
            attribute: "visibility",
            axes: [2],
            transitions: ["threshold"],
            controlPoints: new Array(s02_compositionCount + 1)
              .fill(0)
              .map((_, index) => ({
                position: [
                  0,
                  0,
                  Math.floor((index / s02_compositionCount) * 127),
                  0,
                ],
                value:
                  (lineIndex <= index && index < 3) ||
                  index == s02_compositionCount
                    ? 1
                    : 0,
              })),
          },
        ],
        function () {
          const { instances, gridPos, offsets, movementThresholds } =
            this.element;
          const isActor = this.scene > 1e-6 && this.scene < 2;
          const progress = this.progress;
          const visibility = this.visibility;
          const movement = this.movement;

          instances.forEach((instance, index) => {
            const threshold = map(
              index,
              0,
              instances.length,
              1 / 127,
              126 / 127
            );
            // if (progress + 1 / 127 >= threshold && visibility > threshold)
            if ((progress + 1 / 127) * visibility >= threshold)
              s02_layer.addChild(instance);
            else instance.remove();
            let position = gridPos[index];
            if (
              movement >
              movementThresholds[cap(parseInt(progress * 63), 1, 62)][index]
            )
              position = position.add(offsets[index]);
            position = position.multiply(s02_gridSize);
            instance.position = position;
          });
          if (!isActor) instances.forEach((instance) => instance.remove());
          // } else {
          //   instances.forEach((instance) => s02_layer.addChild(instance));
          // }
        }
      )
    );
  });

  // CIRCLE
  const s02_circleCenter = new Point(35, 19);
  const s02_circleRadius = 16;
  for (let y = 0; y < 40; y++) {
    for (let x = 0; x < 72; x++) {
      const gridPos = new Point(x, y);
      const distancesFromCenter = gridPos.getDistance(s02_circleCenter, false);
      if ((x % 2) + (y % 2) !== 0 && distancesFromCenter < s02_circleRadius) {
        const instance = s02_dotSymbol.element.place(
          s02_padding.add(gridPos).multiply(s02_gridSize)
        );
        const radius = distancesFromCenter / s02_circleRadius;
        let movement = new Point.random()
          .subtract(new Point(0.5, 0.5))
          .multiply(2)
          .round();
        if (y % 2) {
          // movement = new Point(100, 100);
          movement = gridPos.subtract(s02_circleCenter).normalize();
          movement.x = movement.x
            ? Math.sign(movement.x) * (gridPos.x % 2 ? 1 : 0)
            : (randomInt(0, 1) - 0.5) * 2;
          movement.y = movement.y
            ? Math.sign(movement.y) *
              (floorToDecimal(Math.abs(movement.y), 2) - 1)
            : (randomInt(0, 1) - 0.5) * 2;
        }
        // let movementThresholds = random(1 / 127, 1);
        let movementThresholds = new Array(63)
          .fill(0)
          .map((_) => (y % 2 ? random(1 / 127, 0.4) : random(0.5, 126 / 127)));

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
                  { position: [0, 0, 0, 0], value: 1 / s02_circleRadius },
                  { position: [0, 127, 0, 0], value: 1 },
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
              {
                attribute: "visibility",
                axes: [2],
                transitions: ["threshold"],
                controlPoints: new Array(s02_compositionCount + 1)
                  .fill(0)
                  .map((_, index) => ({
                    position: [
                      0,
                      0,
                      Math.floor((index / s02_compositionCount) * 127),
                      0,
                    ],
                    value: index == 3 || index == s02_compositionCount ? 1 : 0,
                  })),
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
              const maxRadius = this.radius;
              const visibility = map(this.visibility, 0, 1, -1e-1, 1);
              // instance.scaling.x = cap(visibility, 1e-6, 1);
              // instance.scaling.y = cap(radius, 1e-6, 1);
              let position = s02_padding.add(gridPos);
              // position = position.subtract(
              //   movement.multiply(cap(movementAmount - movementThresholds, 0, 1))
              // );

              if (
                movementAmount >
                movementThresholds[cap(parseInt(maxRadius * 63), 1, 62)]
              )
                position = position.subtract(movement);
              position = position.multiply(s02_gridSize);
              instance.position = position;
              instance.visible = radius <= maxRadius * visibility;
              if (!isActor) {
                instance.remove();
              } else {
                s02_layer.addChild(instance);
              }
            }
          )
        );
      }
    }
  }

  // LETTERS
  let s02_letterIndex = 0;
  while (s02_letterIndex < 84 + 5) {
    /*
    [X][A][X][B][X][ ]
    [C][ ][D][ ][E][ ]
    [X][F][X][G][X][ ]
    [H][ ][I][ ][J][ ]
    [X][K][X][L][X][ ]
    [ ][ ][ ][ ][ ][ ]

    Order: A, B, C, D, E, F, G, H, I, J, K, L
    Order: I, G, A, L, J, C, B, F, E, D, H, K
    */
    const letterDots = [];
    // I fill rule -> 11100
    if (s02_letterIndex % 6 < 3) letterDots.push(new Point(2, 3));
    else letterDots.push(false);
    // G fill rule -> 00001
    if (s02_letterIndex % 8 > 3) letterDots.push(new Point(3, 2));
    else letterDots.push(false);
    // A fill rule -> 11100
    if (s02_letterIndex % 4 < 3) letterDots.push(new Point(1, 0));
    else letterDots.push(false);
    // L fill rule -> 01011
    if (s02_letterIndex % 7 == 1 || s02_letterIndex % 7 > 2)
      letterDots.push(new Point(1, 4));
    else letterDots.push(false);
    // J fill rule -> 00000
    if (s02_letterIndex % 10 > 4) letterDots.push(new Point(4, 3));
    else letterDots.push(false);
    // C fill rule -> 00011
    if (s02_letterIndex % 5 > 2) letterDots.push(new Point(0, 1));
    else letterDots.push(false);
    // B fill rule -> 11101
    if (s02_letterIndex % 8 < 3 || s02_letterIndex % 8 == 4)
      letterDots.push(new Point(3, 0));
    else letterDots.push(false);
    // F fill rule -> 00001
    if (s02_letterIndex % 5 == 4) letterDots.push(new Point(1, 2));
    else letterDots.push(false);
    // E fill rule -> 00000
    letterDots.push(false);
    // D fill rule -> 11100
    if (s02_letterIndex % 5 < 3) letterDots.push(new Point(2, 1));
    else letterDots.push(false);
    // H fill rule -> 00011
    if (s02_letterIndex % 6 > 2) letterDots.push(new Point(0, 3));
    else letterDots.push(false);
    // K fill rule -> 01011
    if (
      s02_letterIndex % 9 == 1 ||
      s02_letterIndex % 9 == 3 ||
      s02_letterIndex % 9 == 4 ||
      s02_letterIndex % 9 > 6
    )
      letterDots.push(new Point(3, 4));
    else letterDots.push(false);

    scene02.push(
      new Choreography(
        letterDots.map((dot, dotIndex) => {
          if (dot === false)
            return {
              dotIndex,
              letterIndex: s02_letterIndex,
              instance: null,
            };
          const gridX = (s02_letterIndex * 6 + dot.x) % 72;
          const gridY = Math.floor((s02_letterIndex * 6) / 72) * 6 + dot.y;
          const instance = s02_dotSymbol.element.place(
            s02_padding.add(new Point(gridX, gridY)).multiply(s02_gridSize)
          );
          // if (s02_letterIndex < 84 && gridY < 39) instance.visible = true;
          // else instance.visible = false;
          return {
            dotIndex,
            dot,
            letterIndex: s02_letterIndex,
            instance,
            movementThreshold: random(1 / 127, 1),
            movement: new Point(randomInt(-1, 1), randomInt(-1, 1)),
          };
        }),
        [
          {
            attribute: "scene",
            axes: [0],
            transitions: ["threshold"],
            controlPoints: sceneControlePoints,
          },
          {
            attribute: "indexOffset",
            axes: [1],
            transitions: ["smooth"],
            controlPoints: [
              { position: [0, 0, 0, 0], value: 84 },
              { position: [0, 127, 0, 0], value: 0 },
            ],
          },
          // {
          //   attribute: "shownDots",
          //   axes: [2],
          //   transitions: ["threshold"],
          //   controlPoints: new Array(letterDots.length + 1)
          //     .fill(0)
          //     .map((value, index) => ({
          //       position: [
          //         0,
          //         0,
          //         64 + Math.floor((index / letterDots.length) * 63),
          //         0,
          //       ],
          //       value: letterDots.map((_, dotIndex) =>
          //         dotIndex <= index - 1 ? 1 : 0
          //       ),
          //     })),
          //   dynamicContants: [{ f: 2, z: 1, r: 1 }],
          // },
          {
            attribute: "visibility",
            axes: [2],
            transitions: ["threshold"],
            controlPoints: new Array(s02_compositionCount + 1)
              .fill(0)
              .map((_, index) => ({
                position: [
                  0,
                  0,
                  Math.floor((index / s02_compositionCount) * 127),
                  0,
                ],
                value: index == 4 || index == s02_compositionCount ? 1 : 0,
              })),
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
          const letterDotArray = this.element;
          const indexOffset = Math.round(this.indexOffset);
          const shownDots = this.shownDots;
          const isActor = this.scene > 1e-6 && this.scene < 2;
          const movementAmount = this.movement;
          const visibility = map(this.visibility, 0, 1, -1e-1, 1);

          letterDotArray.forEach((letterDot, index) => {
            let {
              instance,
              dotIndex,
              letterIndex,
              dot,
              movement,
              movementThreshold,
            } = letterDot;
            if (instance) {
              letterIndex -= Math.floor(indexOffset + 84 * (1 - visibility));
              // dotIndex += cap(map(letterIndex, 0, 84, 0.01, 0.5), 0, 0.5);

              let gridX = (letterIndex * 6 + dot.x) % 72;
              gridX += movementAmount > movementThreshold ? movement.x : 0;
              let gridY = Math.floor((letterIndex * 6) / 72) * 6 + dot.y;
              gridY += movementAmount > movementThreshold ? movement.y : 0;

              // if (dotIndex % 2)
              //   instance.scaling.x = cap(this.visibility, 1e-6, 1);
              // else instance.scaling.y = cap(this.visibility, 1e-6, 1);
              if (
                isActor &&
                // shownDots[dotIndex] > 1e-6 &&
                letterIndex >= 0 &&
                letterIndex < 84 &&
                gridX >= 0 &&
                gridX < 71 &&
                gridY >= 0 &&
                gridY < 39
              ) {
                if (instance.parent !== s02_layer) s02_layer.addChild(instance);
                instance.position = s02_padding
                  .add(new Point(gridX, gridY))
                  .multiply(s02_gridSize);
              } else {
                instance.remove();
              }
            }
          });
        }
      )
    );
    s02_letterIndex++;
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
