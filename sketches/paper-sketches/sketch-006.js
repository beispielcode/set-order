// Set up the Paper.js environment
paper.setup("paper-canvas");

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
  const s02_dotTemplate = new Path.Rectangle({
    point: [0, 0],
    size: view.viewSize.width,
    fillColor: "#fff",
    applyMatrix: false,
    // selected: true,
  });
  const s02_gridSize = view.viewSize.width / 80;
  const s02_dotSymbolSizeArray = [80, 80];
  const s02_zoomLevels = [5, 3, 2, 1];
  const s02_dotSymbol = new Choreography(
    new Symbol(s02_dotTemplate),
    [
      {
        attribute: "scene",
        axes: [0],
        transitions: ["threshold"],
        controlPoints: sceneControlePoints,
      },
      {
        attribute: "size",
        axes: [1],
        // dynamicContants: [{ f: 2.5, z: 1.5, r: 0 }],
        transitions: ["threshold"],
        // controlPoints: s02_dotSymbolSizeArray.map((size, index) => ({
        //   position: [0, Math.floor((index / scenesNumber) * 127), 0, 0],
        //   value: size,
        // })),
        controlPoints: s02_zoomLevels.map((zoom, index) => ({
          position: [
            0,
            Math.floor((index / s02_zoomLevels.length) * 127),
            0,
            0,
          ],
          value: zoom,
        })),
      },
    ],
    function () {
      const definition = this.element.definition;
      definition.scaling = (1 / 80) * this.size;
    }
  );

  scene02.push(s02_dotSymbol);

  for (let i = 0; i < 37 * 19; i++) {
    const gridX = i % 37;
    const gridY = Math.floor(i / 37);
    const distanceFromCenter = [Math.abs(gridX - 18), Math.abs(gridY - 9)];
    const visibilityArray = [];
    if (distanceFromCenter[0] < 3 && distanceFromCenter[1] < 2)
      visibilityArray.push(1);
    else visibilityArray.push(0);
    if (distanceFromCenter[0] < 5 && distanceFromCenter[1] < 3)
      visibilityArray.push(1);
    else visibilityArray.push(0);
    if (distanceFromCenter[0] < 8 && distanceFromCenter[1] < 5)
      visibilityArray.push(1);
    else visibilityArray.push(0);
    visibilityArray.push(1);
    const padding = [
      [(view.viewSize.width / 80) * 20, (view.viewSize.width / 80) * 12.5],
      [(view.viewSize.width / 80) * 16.5, (view.viewSize.width / 80) * 22],
      [(view.viewSize.width / 80) * 12, (view.viewSize.width / 80) * 14.5],
      [(view.viewSize.width / 80) * 4, (view.viewSize.width / 80) * 4.5],
    ];
    const offset = [
      [16, 8],
      [14, 9],
      [11, 7],
      [0, 0],
    ];
    scene02.push(
      new Choreography(
        s02_dotSymbol.element.place([0, 0]),
        [
          {
            attribute: "scene",
            axes: [0],
            transitions: ["threshold"],
            controlPoints: sceneControlePoints,
          },
          {
            attribute: "visibility",
            axes: [1],
            transitions: ["threshold"],
            controlPoints: visibilityArray.map((visibility, index) => ({
              position: [
                0,
                Math.floor((index / visibilityArray.length) * 127),
                0,
                0,
              ],
              value: visibility,
            })),
          },
          {
            attribute: "position",
            axes: [1],
            transitions: ["threshold"],
            controlPoints: visibilityArray.map((visibility, index) => {
              const zoom = s02_zoomLevels[index];
              const x =
                (((gridX - offset[index][0]) * view.viewSize.width) / 80) *
                  2 *
                  zoom +
                padding[index][0];
              const y =
                (((gridY - offset[index][1]) * view.viewSize.width) / 80) *
                  2 *
                  zoom +
                padding[index][1];
              return {
                position: [
                  0,
                  Math.floor((index / visibilityArray.length) * 127),
                  0,
                  0,
                ],
                value: [x, y],
              };
            }),
            // controlPoints: [
            //   {
            //     position: [0, 0, 0, 0],
            //     value: [
            //       ((gridX * view.viewSize.width) / s02_dotSymbolSizeArray[0]) *
            //         2 *
            //         s02_zoomLevels[0] +
            //         (view.viewSize.width / s02_dotSymbolSizeArray[0]) * 4,
            //       ((gridY * view.viewSize.width) / s02_dotSymbolSizeArray[0]) *
            //         2 *
            //         s02_zoomLevels[0] +
            //         (view.viewSize.width / s02_dotSymbolSizeArray[0]) * 4.5,
            //     ],
            //   },
            //   {
            //     position: [0, 63, 0, 0],
            //     value: [
            //       ((gridX * view.viewSize.width) / s02_dotSymbolSizeArray[1]) *
            //         2 *
            //         s02_zoomLevels[1] +
            //         (view.viewSize.width / s02_dotSymbolSizeArray[1]) * 4,
            //       ((gridY * view.viewSize.width) / s02_dotSymbolSizeArray[1]) *
            //         2 *
            //         s02_zoomLevels[1] +
            //         (view.viewSize.width / s02_dotSymbolSizeArray[1]) * 4.5,
            //     ],
            //   },
            // ],
          },
        ],
        function () {
          const instance = this.element;
          instance.position = this.position;
          instance.opacity = this.scene;
          // instance.scaling = cap(
          //   this.scene ** 4 *
          //     cap(map(this.visibility, 0.75, 1, 0, 1), 0, 1) ** 4,
          //   1e-6,
          //   1
          // );
          instance.scaling = cap(
            this.scene ** 4 * this.visibility ** 4,
            1e-6,
            1
          );
          // if (!this.visibility || this.scene < 1e-6 || this.scene > 2) {
          if (this.scene < 1e-6 || this.scene > 2) {
            this.element.remove();
          } else {
            project.activeLayer.addChild(this.element);
          }
        }
      )
    );
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
