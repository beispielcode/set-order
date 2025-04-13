paper.setup("paper-canvas");

with (paper) {
  const background = new Path.Rectangle({
    point: [0, 0],
    size: [canvasWidth, canvasHeight],
    fillColor: colors[0],
  });
  const navigation_GLOBAL_SCALE = 4;
  let navigation_position = Vec.fromList([0, 1, 0]);

  const navigation_rotationDynamics = [
    new SecondOrderDynamics(
      easedChannelDynamicsF,
      easedChannelDynamicsZeta,
      easedChannelDynamicsR,
      0
    ),
    new SecondOrderDynamics(
      easedChannelDynamicsF,
      easedChannelDynamicsZeta,
      easedChannelDynamicsR,
      0
    ),
    new SecondOrderDynamics(
      easedChannelDynamicsF,
      easedChannelDynamicsZeta,
      easedChannelDynamicsR,
      0
    ),
  ];

  let navigation_rotation = [0, 0, 0];

  const navigation_space = [
    Vec.fromList([0, 0, 0]),
    Vec.fromList([1, 0, 0]),
    Vec.fromList([1, 1, 0]),
    Vec.fromList([0, 1, 0]),
    Vec.fromList([0, 0, 1]),
    Vec.fromList([1, 0, 1]),
    Vec.fromList([1, 1, 1]),
    Vec.fromList([0, 1, 1]),
  ];

  let navigation_lineX = [
    navigation_position.copy(),
    navigation_position.copy().setInd(1, 0),
  ];
  let navigation_lineY = [
    navigation_position.copy(),
    navigation_position.copy().setInd(2, 1),
  ];
  let navigation_lineZ = [
    navigation_position.copy(),
    navigation_position.copy().setInd(0, 1),
  ];
  // project 3d vector to 2d (oblique projection)
  const scale = 108 * navigation_GLOBAL_SCALE;
  // const offset = new Point(8, 8 + scale / 2);
  const offset = new Point(364, 64 + scale / 2);
  const cubeOutlineVertices = navigation_space.map((vertex) =>
    new Point(
      vertex.ind(0) + vertex.ind(2) / 2,
      vertex.ind(1) - vertex.ind(2) / 2
    )
      .multiply(scale)
      .add(offset)
  );
  const hullPoints = calculateConvexHull(cubeOutlineVertices);

  const space = new Path({
    segments: hullPoints,
    closed: true,
    // fillColor: "#000",
    strokeJoin: "round",
    fillColor: "#e6e6e6",
    strokeColor: "#000",
    strokeWidth: 2 * navigation_GLOBAL_SCALE,
  });

  const lineX = new Path({
    segments: navigation_lineX.map((vertex) =>
      new Point(
        vertex.ind(0) + vertex.ind(2) / 2,
        vertex.ind(1) - vertex.ind(2) / 2
      )
        .multiply(scale)
        .add(offset)
    ),
    closed: false,
    strokeColor: colors[1],
    strokeWidth: 2 * navigation_GLOBAL_SCALE,
    strokeCap: "round",
    // dashArray: [10, 20],
  });
  const lineY = lineX.clone();
  lineY.segments = navigation_lineY.map((vertex) =>
    new Point(
      vertex.ind(0) + vertex.ind(2) / 2,
      vertex.ind(1) - vertex.ind(2) / 2
    )
      .multiply(scale)
      .add(offset)
  );
  const lineZ = lineX.clone();
  lineZ.segments = navigation_lineZ.map((vertex) =>
    new Point(
      vertex.ind(0) + vertex.ind(2) / 2,
      vertex.ind(1) - vertex.ind(2) / 2
    )
      .multiply(scale)
      .add(offset)
  );

  let position = new Path.Circle({
    center: new Point(
      navigation_position.ind(0) + navigation_position.ind(2) / 2,
      navigation_position.ind(1) - navigation_position.ind(2) / 2
    )
      .multiply(scale)
      .add(offset),
    radius: 8 * navigation_GLOBAL_SCALE,
    fillColor: colors[1],
  });

  navigation_drawUpdated = () => {
    position.position = new Point(
      navigation_position.ind(0) + navigation_position.ind(2) / 2,
      navigation_position.ind(1) - navigation_position.ind(2) / 2
    )
      .multiply(scale)
      .add(offset);
    lineX.segments = navigation_lineX.map((vertex) =>
      new Point(
        vertex.ind(0) + vertex.ind(2) / 2,
        vertex.ind(1) - vertex.ind(2) / 2
      )
        .multiply(scale)
        .add(offset)
    );
    lineY.segments = navigation_lineY.map((vertex) =>
      new Point(
        vertex.ind(0) + vertex.ind(2) / 2,
        vertex.ind(1) - vertex.ind(2) / 2
      )
        .multiply(scale)
        .add(offset)
    );
    lineZ.segments = navigation_lineZ.map((vertex) =>
      new Point(
        vertex.ind(0) + vertex.ind(2) / 2,
        vertex.ind(1) - vertex.ind(2) / 2
      )
        .multiply(scale)
        .add(offset)
    );
  };

  view.onFrame = () => {
    if (performance.now() - lastInteraction > 600)
      document.getElementById("navigation").classList.add("hidden");
    else document.getElementById("navigation").classList.remove("hidden");
    const rotationIndex = Math.floor(map(easedChannels[0], 0, 127, 0, 7));
    // console.log(rotationIndex);

    // switch (rotationIndex) {
    //   case 0:
    //     navigation_rotation[0] = navigation_rotationDynamics[0].update(
    //       deltaTime,
    //       0
    //     );
    //     navigation_rotation[1] = navigation_rotationDynamics[1].update(
    //       deltaTime,
    //       0
    //     );
    //     navigation_rotation[2] = navigation_rotationDynamics[2].update(
    //       deltaTime,
    //       0
    //     );
    //     break;
    //   case 2:
    //     navigation_rotation[0] = navigation_rotationDynamics[0].update(
    //       deltaTime,
    //       90
    //     );
    //     navigation_rotation[1] = navigation_rotationDynamics[1].update(
    //       deltaTime,
    //       0
    //     );
    //     navigation_rotation[2] = navigation_rotationDynamics[2].update(
    //       deltaTime,
    //       0
    //     );
    //     break;
    //   case 3:
    //     navigation_rotation[0] = navigation_rotationDynamics[0].update(
    //       deltaTime,
    //       90
    //     );
    //     navigation_rotation[1] = navigation_rotationDynamics[1].update(
    //       deltaTime,
    //       90
    //     );
    //     navigation_rotation[2] = navigation_rotationDynamics[2].update(
    //       deltaTime,
    //       0
    //     );
    //     break;
    //   case 4:
    //     navigation_rotation[0] = navigation_rotationDynamics[0].update(
    //       deltaTime,
    //       180
    //     );
    //     navigation_rotation[1] = navigation_rotationDynamics[1].update(
    //       deltaTime,
    //       90
    //     );
    //     navigation_rotation[2] = navigation_rotationDynamics[2].update(
    //       deltaTime,
    //       0
    //     );
    //     break;
    //   case 5:
    //     navigation_rotation[0] = navigation_rotationDynamics[0].update(
    //       deltaTime,
    //       180
    //     );
    //     navigation_rotation[1] = navigation_rotationDynamics[1].update(
    //       deltaTime,
    //       180
    //     );
    //     navigation_rotation[2] = navigation_rotationDynamics[2].update(
    //       deltaTime,
    //       0
    //     );
    //     break;
    //   default:
    //     navigation_rotation[0] = navigation_rotationDynamics[0].update(
    //       deltaTime,
    //       270
    //     );
    //     navigation_rotation[1] = navigation_rotationDynamics[1].update(
    //       deltaTime,
    //       180
    //     );
    //     navigation_rotation[2] = navigation_rotationDynamics[2].update(
    //       deltaTime,
    //       0
    //     );
    //     break;
    // }
    // console.log(navigation_rotation);

    const x = map(easedChannels[0], 0, 127, 0, 1);
    const y = map(easedChannels[1], 0, 127, 1, 0);
    const z = map(easedChannels[2], 0, 127, 0, 1);
    navigation_position = Vec.fromList([x, y, z]);

    navigation_lineX[0].setInd(0, x);
    navigation_lineX[0].setInd(2, z);
    navigation_lineX[1].setInd(0, x);
    navigation_lineX[1].setInd(2, z);
    navigation_lineY[0].setInd(0, x);
    navigation_lineY[0].setInd(1, y);
    navigation_lineY[1].setInd(0, x);
    navigation_lineY[1].setInd(1, y);
    navigation_lineZ[0].setInd(1, y);
    navigation_lineZ[0].setInd(2, z);
    navigation_lineZ[1].setInd(1, y);
    navigation_lineZ[1].setInd(2, z);
    navigation_drawUpdated();
  };
}
