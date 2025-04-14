// Set up the Paper.js environment
paper.setup("paper-canvas");

with (paper) {
  // Add MIDI event listener for control change messages
  window.addEventListener("midimessage", (e) => {
    const { type, control, value } = e.data;
    if (type === "controlchange" && control >= 0 && control < 4) {
      // modifyDynamicAttribute(`channel${control}`, "value", value);
      sceneElements.forEach((sceneElement) => {
        sceneElement.updateAxis(control, value);
      });
    }
  });

  // Create a background rectangle
  const background = new Path.Rectangle({
    point: [0, 0],
    size: [canvasWidth, canvasHeight],
    fillColor: colors[0],
  });

  const sceneElements = [
    new Choreography(
      new Path.Rectangle({
        point: [view.center.x - 70, view.center.y - 70],
        size: [140, 140],
        fillColor: "#000000",
        applyMatrix: false,
      }),
      [
        {
          attribute: "scale",
          axes: [0],
          transitions: ["threshold"],
          controlPoints: [
            { position: [0, 0, 0, 0], value: 0.5 },
            { position: [31, 0, 0, 0], value: 1 },
            { position: [63, 0, 0, 0], value: 2 },
            { position: [95, 0, 0, 0], value: 3 },
            { position: [127, 0, 0, 0], value: 4 },
          ],
        },
        {
          attribute: "rotation",
          axes: [1],
          transitions: ["smooth"],
          controlPoints: [
            { position: [0, 0, 0, 0], value: 0 },
            { position: [0, 64, 0, 0], value: -45 },
            { position: [0, 127, 0, 0], value: 45 },
          ],
        },
        {
          attribute: "fillColor",
          axes: [2],
          transitions: ["steps"],
          controlPoints: [
            { position: [0, 0, 0, 0], value: "#000000" },
            { position: [0, 0, 64, 0], value: "#FF1493" },
          ],
        },
        {
          attribute: "selected",
          axes: [2],
          transitions: ["steps"],
          controlPoints: [
            { position: [0, 0, 0, 0], value: false },
            { position: [0, 0, 64, 0], value: true },
          ],
        },
      ],
      function () {
        const rect = this.element;
        rect.scaling = this.scale;
        rect.rotation = this.rotation;
        console.log(this.fillColor);

        rect.fillColor = this.fillColor;
        rect.selected = this.selected;
      }
    ),
  ];

  // Define the onFrame event handler for animation and interaction
  let lastInteractionTime = performance.now(); // Ensure this is defined
  view.onFrame = () => {
    if (performance.now() - lastInteractionTime > 600)
      document.getElementById("navigation").classList.add("hidden");
    else document.getElementById("navigation").classList.remove("hidden");

    sceneElements.forEach((sceneElement) => {
      sceneElement.update(deltaTime);
    });
  };
}
