window.myP5 = new p5((p) => {
  window.addEventListener("resize", () => {
    p.resizeCanvas(canvasWidth, canvasHeight);
  });
  let img;
  let gridSize = 19;
  p.setup = function () {
    p.createCanvas(canvasWidth, canvasHeight);
    p.background(220);
    // p.noSmooth();
    img = p.loadImage("assets/imgs/jpg.jpg");
  };

  p.draw = function () {
    // if (p.random() > 0.995) gridSize = parseInt(p.random(1, 60));
    // if (p.random() > 0.995) gridSize = 31;
    // if (workerActive) updateWorkers({ gridSize });
    if (workerActive) updateWorkers();
    p.background(colors[0]);
    p.translate(canvasWidth / 2, canvasHeight / 2);
    p.strokeWeight(2 * GLOBAL_SCALE);
    // const scaleX = canvasWidth / 35;
    const scaleX = canvasWidth / 50;
    const scaleY = scaleX;
    p.stroke(`${colors[2]}ff`);
    p.stroke(colors[1]);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(8);
    p.stroke(colors[2]);
    structure.vertices.forEach((vertex) => {
      vertex.neighbors.forEach((neighbor) => {
        const neighborVertex = structure.vertices[neighbor.index];
        if (!neighborVertex) return;
        // const dist = neighborVertex.vec.copy().subVec(vertex.vec).divNum(2);
        // p.line(
        //   (vertex.vec.ind(0) - dist.ind(0) * (1 - vertex.weight)) * scaleX,
        //   (vertex.vec.ind(1) - dist.ind(1) * (1 - vertex.weight)) * scaleY,
        //   (neighbor.vec.ind(0) + dist.ind(0) * (1 - neighbor.weight)) *
        //     scaleX,
        //   (neighbor.vec.ind(1) + dist.ind(1) * (1 - neighbor.weight)) * scaleY
        // );
        // p.line(
        //   vertex.vec.ind(0) * scaleX,
        //   vertex.vec.ind(1) * scaleY,
        //   (neighborVertex.vec.ind(0) - dist.ind(0) * (2 - neighbor.weight)) *
        //     scaleX,
        //   (neighborVertex.vec.ind(1) - dist.ind(1) * (2 - neighbor.weight)) *
        //     scaleY
        // );

        const dist = neighborVertex.vec.copy().subVec(vertex.vec);
        p.line(
          vertex.vec.ind(0) * scaleX,
          vertex.vec.ind(1) * scaleY,
          (neighborVertex.vec.ind(0) - dist.ind(0) * (1 - neighbor.weight)) *
            scaleX,
          (neighborVertex.vec.ind(1) - dist.ind(1) * (1 - neighbor.weight)) *
            scaleY
        );
        // p.line(
        //   vertex.vec.ind(0) * scaleX,
        //   vertex.vec.ind(1) * scaleY,
        //   neighborVertex.vec.ind(0) * scaleX,
        //   neighborVertex.vec.ind(1) * scaleY
        // );
      });
    });

    p.noStroke();
    structure.vertices.forEach((vertex, index) => {
      p.fill(colors[1]);
      p.ellipse(
        vertex.vec.ind(0) * scaleX,
        vertex.vec.ind(1) * scaleY,
        // p.max(5, vertex.weight * 10),
        40 * GLOBAL_SCALE,
        // p.max(5, vertex.weight * 10)
        40 * GLOBAL_SCALE
      );
      if (debugActive) {
        let debug = ``;
        p.fill(colors[2]);
        for (const entry of vertex.debug.entries())
          debug += `${entry[0]}: ${entry[1]}\n`;
        p.text(debug, vertex.vec.ind(0) * scaleX, vertex.vec.ind(1) * scaleY);
      }
    });

    // p.fill(colors[2]);
    p.noFill();
    // p.stroke(colors[2]);
    // Draws letter "A" at the center of the canvas at grid size 41
    // const shapeVertexIndex = [
    //   140, 141, 142, 143, 144, 145, 146, 1509, 1504, 1091, 1090, 1089, 1088,
    //   1087, 1086, 1085, 1084, 1083, 1082, 1081, 1488, 1487, 1486, 1485, 1484,
    //   1483,
    // ];
    // const contourPath = [307, 918, 919, 920, 921, 922, 923, 924, 925, 926];
    // Draws letter "A" at the center of the canvas at grid size 19
    const shapeVertexIndex = [
      27,
      // 28,
      29, 338,
      // 337,
      336, 240,
      // 239,
      // 238,
      // 237,
      // 236,
      // 235,
      234, 328,
      // 327,
      326,
    ];
    const contourPath = [
      66, 178,
      // 179,
      // 180,
      // 181,
      182,
    ];
    if (structure.vertices.length > shapeVertexIndex[0]) {
      p.beginShape();
      shapeVertexIndex.forEach((index) => {
        const vertex = structure.vertices[index];
        if (vertex)
          p.vertex(vertex.vec.ind(0) * scaleX, vertex.vec.ind(1) * scaleY);
      });
      if (structure.vertices.length > contourPath[0]) {
        p.beginContour();
        contourPath.forEach((index) => {
          const vertex = structure.vertices[index];
          if (vertex)
            p.vertex(vertex.vec.ind(0) * scaleX, vertex.vec.ind(1) * scaleY);
        });
        p.endContour();
      }
      p.endShape(p.CLOSE);
    }

    if (structure.vertices) {
      // const index =
      //   p.frameCount % Math.floor(((img.width / 8) * img.height) / 8);
      const index =
        p.frameCount % Math.floor(((img.width / 8) * img.height) / 8);
      // console.log(index);

      for (let i = 0; i < index % structure.vertices.length; i++) {
        const x = i % Math.floor(img.width / 8);
        const y = Math.floor(i / Math.floor(img.width / 8));
        p.copy(
          img,
          x * 8,
          y * 8,
          8,
          8,
          p.ceil(structure.vertices[i].vec.ind(0) * scaleX),
          p.ceil(structure.vertices[i].vec.ind(1) * scaleY),
          p.ceil(scaleX),
          p.ceil(scaleY)
        );
        if (debugActive) {
          let debug = ``;
          p.fill(colors[2]);
          for (const entry of structure.vertices[i].debug.entries())
            debug += `${entry[0]}: ${entry[1]}\n`;
          p.text(
            debug,
            structure.vertices[i].vec.ind(0) * scaleX,
            structure.vertices[i].vec.ind(1) * scaleY
          );
        }
      }
    }
  };
}, "p5-container");
