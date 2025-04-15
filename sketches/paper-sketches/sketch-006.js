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

  const sceneElements = [];

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
  console.log(s01_SquishArray);

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
        attribute: "size",
        axes: [1],
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
        // [
        //   {
        //     position: [0, 0, 0, 127],
        //     value: distancesFromCenter[0],
        //   },
        //   {
        //     position: [0, Math.floor((1 / steps) * 127), 0, 127],
        //     value: distancesFromCenter[1],
        //   },
        //   {
        //     position: [0, Math.floor((2 / steps) * 127), 0, 127],
        //     value: distancesFromCenter[2],
        //   },
        //   {
        //     position: [0, Math.floor((3 / steps) * 127), 0, 127],
        //     value: distancesFromCenter[3],
        //   },
        //   {
        //     position: [0, Math.floor((4 / steps) * 127), 0, 127],
        //     value: distancesFromCenter[4],
        //   },
        // ],
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
            this.size + this.squish[0],
            this.size + this.squish[1],
          ];
          // console.log(this.squish);

          // rect.rotation = this.rotation;
          rect.rotation = this.rotation * this.rotationScale;
          rect.position = [
            gridSize * this.position[0],
            gridSize * this.position[1],
          ];
        }
      )
    );
  }

  sceneElements.push(...scene01);

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
