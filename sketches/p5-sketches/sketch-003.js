window.myP5 = new p5((p) => {
  let cube, axis, angle, gridWidth, gridHeight, rotationSpeed;
  let scale = 200;
  let prevFrame = [];
  window.addEventListener("resize", () => {
    p.resizeCanvas(canvasWidth, canvasHeight);
  });
  p.setup = function () {
    p.createCanvas(canvasWidth, canvasHeight);
    p.background(colors[0]);
    cube = [
      p.createVector(-0.5, -0.5, -0.5),
      p.createVector(0.5, -0.5, -0.5),
      p.createVector(-0.5, 0.5, -0.5),
      p.createVector(0.5, 0.5, -0.5),
      p.createVector(-0.5, -0.5, 0.5),
      p.createVector(0.5, -0.5, 0.5),
      p.createVector(-0.5, 0.5, 0.5),
      p.createVector(0.5, 0.5, 0.5),
    ];
    axes = [
      // p.createVector(p.random(-1, 1), p.random(-1, 1), p.random(-1, 1)),
      // p.createVector(p.random(-1, 1), p.random(-1, 1), p.random(-1, 1)),
      // p.createVector(p.random(-1, 1), p.random(-1, 1), p.random(-1, 1)),
      // p.createVector(p.random(-1, 1), p.random(-1, 1), p.random(-1, 1)),
      // p.createVector(p.random(-1, 1), p.random(-1, 1), p.random(-1, 1)),
      // p.createVector(p.random(-1, 1), p.random(-1, 1), p.random(-1, 1)),
      // p.createVector(p.random(0, 1), p.random(0, 1), p.random(0, 1)),
      // p.createVector(p.random(0, 1), p.random(0, 1), p.random(0, 1)),
      // p.createVector(p.random(0, 1), p.random(0, 1), p.random(0, 1)),
      // p.createVector(p.random(0, 1), p.random(0, 1), p.random(0, 1)),
      p.createVector(0, 0, 1),
      p.createVector(0, 1, 0),
      p.createVector(1, 0, 0),
    ];
    rotationSpeed = 0.25;
    angle = p.radians(rotationSpeed / axes.length);
    // angle = p.radians(1);
    // p.frameRate(5);
    gridWidth = canvasWidth / scale;
    gridHeight = canvasHeight / scale;
  };

  p.gradientLine = function (x1, y1, x2, y2, color1, color2) {
    // linear gradient from start to end of line
    x1 = parseFloat(x1);
    x2 = parseFloat(x2);
    y1 = parseFloat(y1);
    y2 = parseFloat(y2);
    var grad = this.drawingContext.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);

    this.drawingContext.strokeStyle = grad;

    p.line(x1, y1, x2, y2);
    this.drawingContext.strokeStyle = color1;
  };

  p.drawCube = function (
    vertices,
    origin,
    cubeSize,
    colors = ["#f00", "#00f"],
    showVertices = true,
    quatified = true
  ) {
    // connect the vertices
    p.noFill();

    if (showVertices) {
      // p.noStroke();
      // vertices.forEach((vertex) => {
      //   p.fill(colors[0]);
      //   p.circle(
      //     origin.x + vertex.x * cubeSize,
      //     origin.y + vertex.y * cubeSize,
      //     10 / scale
      //   );
      // });
    }

    p.noFill();
    this.drawingContext.strokeStyle = colors[0];
    p.stroke(colors[0]);
    p.beginShape();
    p.vertex(
      origin.x + vertices[0].x * cubeSize,
      origin.y + vertices[0].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[1].x * cubeSize,
      origin.y + vertices[1].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[5].x * cubeSize,
      origin.y + vertices[5].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[1].x * cubeSize,
      origin.y + vertices[1].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[3].x * cubeSize,
      origin.y + vertices[3].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[7].x * cubeSize,
      origin.y + vertices[7].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[3].x * cubeSize,
      origin.y + vertices[3].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[2].x * cubeSize,
      origin.y + vertices[2].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[6].x * cubeSize,
      origin.y + vertices[6].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[2].x * cubeSize,
      origin.y + vertices[2].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[0].x * cubeSize,
      origin.y + vertices[0].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[4].x * cubeSize,
      origin.y + vertices[4].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[5].x * cubeSize,
      origin.y + vertices[5].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[7].x * cubeSize,
      origin.y + vertices[7].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[6].x * cubeSize,
      origin.y + vertices[6].y * cubeSize
    );
    p.vertex(
      origin.x + vertices[4].x * cubeSize,
      origin.y + vertices[4].y * cubeSize
    );
    p.endShape();

    if (quatified) {
      vertices.forEach((vertex) => {
        if (showVertices) {
          p.noStroke();
          p.fill(colors[1]);
          p.circle(
            p.round(origin.x + vertex.x * cubeSize),
            p.round(origin.y + vertex.y * cubeSize),
            10 / scale
          );
        }
        p.stroke(colors[0]);
        p.gradientLine(
          p.round(origin.x + vertex.x * cubeSize),
          p.round(origin.y + vertex.y * cubeSize),
          origin.x + vertex.x * cubeSize,
          origin.y + vertex.y * cubeSize,
          colors[1],
          colors[0]
        );
      });
      p.stroke(colors[1]);
      p.beginShape();
      p.vertex(
        p.round(origin.x + vertices[0].x * cubeSize),
        p.round(origin.y + vertices[0].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[1].x * cubeSize),
        p.round(origin.y + vertices[1].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[5].x * cubeSize),
        p.round(origin.y + vertices[5].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[1].x * cubeSize),
        p.round(origin.y + vertices[1].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[3].x * cubeSize),
        p.round(origin.y + vertices[3].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[7].x * cubeSize),
        p.round(origin.y + vertices[7].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[3].x * cubeSize),
        p.round(origin.y + vertices[3].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[2].x * cubeSize),
        p.round(origin.y + vertices[2].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[6].x * cubeSize),
        p.round(origin.y + vertices[6].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[2].x * cubeSize),
        p.round(origin.y + vertices[2].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[0].x * cubeSize),
        p.round(origin.y + vertices[0].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[4].x * cubeSize),
        p.round(origin.y + vertices[4].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[5].x * cubeSize),
        p.round(origin.y + vertices[5].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[7].x * cubeSize),
        p.round(origin.y + vertices[7].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[6].x * cubeSize),
        p.round(origin.y + vertices[6].y * cubeSize)
      );
      p.vertex(
        p.round(origin.x + vertices[4].x * cubeSize),
        p.round(origin.y + vertices[4].y * cubeSize)
      );
      p.endShape();
    }
  };

  p.draw = function () {
    scale = p.map(p.mouseY, 0, canvasHeight, 200, 10);
    gridWidth = canvasWidth / scale;
    gridHeight = canvasHeight / scale;
    let gridDotSize = (p.sqrt(scale) / scale) * 1;
    let cubeSize = p.map(
      p.mouseX,
      0,
      canvasWidth,
      (canvasWidth / scale) * 0.0625,
      (canvasWidth / scale) * 0.75
    );
    p.translate(canvasWidth / 2, canvasHeight / 2);
    p.scale(scale);
    p.background("#ccc");
    p.background(colors[0]);
    p.strokeWeight((1 / scale) * 1);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    // p.strokeCap(p.BEVEL);
    // p.strokeJoin(p.BEVEL);

    // draws all the prev frames in a 3 x 2 grid so that the grid width always grows by 3 and the height by two
    let prevFrameGridWidth = p.floor(p.sqrt(prevFrame.length / 6) + 1) * 3;
    let prevFrameGridHeight = p.floor(p.sqrt(prevFrame.length / 6) + 1) * 2;

    let prevFrameCubeSize = 800 / prevFrameGridWidth;
    let placementOffset = [
      -canvasWidth / 2 / scale + canvasWidth / prevFrameGridWidth / 2 / scale,
      -canvasHeight / 2 / scale +
        canvasHeight / prevFrameGridHeight / 2 / scale,
    ];
    for (let x = 0; x < prevFrameGridWidth; x++) {
      for (let y = 0; y < prevFrameGridHeight; y++) {
        let index = x + y * prevFrameGridWidth;
        if (index >= prevFrame.length) {
          break;
        }
        const prevFrameCube = prevFrame[index];
        p.drawCube(
          prevFrameCube,
          p.createVector(
            (x * canvasWidth) / prevFrameGridWidth / scale + placementOffset[0],
            (y * canvasHeight) / prevFrameGridHeight / scale +
              placementOffset[1]
          ),
          prevFrameCubeSize / scale,
          [colors[0], colors[1]],
          false,
          true
        );
      }
    }

    // places grid vertices
    p.noStroke();
    p.fill(colors[1]);
    p.stroke(colors[1]);
    for (let x = 0; x <= gridWidth + 1; x++) {
      p.line(
        x - p.round(gridWidth / 2),
        -p.round(gridWidth / 2),
        x - p.round(gridWidth / 2),
        p.round(gridHeight / 2)
      );
      for (let y = 0; y <= gridHeight + 1; y++) {
        p.line(
          -p.round(gridWidth / 2),
          y - p.round(gridHeight / 2),
          p.round(gridWidth / 2),
          y - p.round(gridHeight / 2)
        );
        // p.circle(
        //   x - p.round(gridWidth / 2),
        //   y - p.round(gridHeight / 2),
        //   gridDotSize
        // );
      }
    }
    cube.forEach((vertex, index) => {
      axes.forEach((axis) => {
        cube[index] = rotateAround(p5, cube[index], axis, angle);
      });
    });
    // p.strokeWeight((1 / scale) * 32);

    p.drawCube(
      cube,
      p.createVector(0, 0),
      cubeSize,
      // [colors[1], "#ffd400"],
      // [colors[1], "#e50000"],
      // [colors[1], "#00ef00"],
      [colors[1], colors[2]],
      false,
      true
    );

    // if (prevFrame.length) {
    //   console.log((prevFrame[0][0].x - cube[0].x).toPrecision(3));
    // }

    if (
      prevFrame.length &&
      p.abs(prevFrame[0][0].x - cube[0].x).toPrecision(4) <
        0.000001 * rotationSpeed &&
      p.abs(prevFrame[0][0].y - cube[0].y).toPrecision(4) <
        0.000001 * rotationSpeed &&
      p.abs(prevFrame[0][0].z - cube[0].z).toPrecision(4) <
        0.000001 * rotationSpeed
    ) {
      prevFrame = [];
    }
    // prevFrame.push([...cube]);

    p.scale(1 / scale);
    for (let i = 0; i < p.random(1, 20); i++) {
      // p.rotate(p.radians(i * p.random(0, 360)));
      // p.copy(
      //   parseInt(p.random(0, p.width / 2) - p.width / 2),
      //   parseInt(p.random(0, p.height / 2) - p.height / 2),
      //   parseInt(p.random(p.width / 8, p.width / 2)),
      //   parseInt(p.random(p.height / 8, p.height / 2)),
      //   parseInt(p.random(0, p.width / 2) - p.width / 2),
      //   parseInt(p.random(0, p.height / 2) - p.height / 2),
      //   parseInt(p.random(p.width / 8, p.width / 2)),
      //   parseInt(p.random(p.height / 8, p.height / 2))
      // );
    }

    // p.copy(
    //   0,
    //   0,
    //   p.width / 2,
    //   p.height / 2,
    //   p.random(0, p.width),
    //   p.random(0, p.height),
    //   p.width / 2,
    //   p.height / 2
    // );
  };
}, "p5-container");
