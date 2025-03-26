window.myP5 = new p5((p) => {
  window.addEventListener("resize", () => {
    p.resizeCanvas(canvasWidth, canvasHeight);
  });

  let capture;
  let gridWidth = 30;
  let gridHeight = 20;
  let gridVertices = [];
  let scaleFactorWidth = canvasWidth / gridWidth;
  let scaleFactorHeight = canvasHeight / gridHeight;

  p.setup = function () {
    // window.WEBLGL_MODE = true;
    p.describe("Video capture from the device webcam.");
    p.createCanvas(canvasWidth, canvasHeight, p.WEBGL);
    p.background("#ccc");
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        gridVertices.push(
          p.createVector(x - gridWidth / 2 + 0.5, y - gridHeight / 2 + 0.5)
        );
      }
    }

    // camera and start capturing video.
    capture = p.createCapture(p.VIDEO);
    capture.size(canvasWidth, canvasHeight);
    capture.hide();
    // p.noLoop();
    console.log(gridVertices);
  };

  const getIndex = (x, y) => {
    return x + y * gridWidth;
  };

  function drawGrid() {
    const UVrepeat = 1;
    p.noFill();
    // p.stroke("#000");
    p.textureMode(p.NORMAL);
    p.texture(capture);
    p.textureWrap(p.REPEAT, p.MIRROR);
    for (let x = 0; x < gridWidth - 1; x += 2) {
      for (let y = 0; y < gridHeight - 1; y += 2) {
        let v1 = gridVertices[getIndex(x, y)];
        let v2 = gridVertices[getIndex(x + 1, y)];
        let v3 = gridVertices[getIndex(x + 1, y + 1)];
        let v4 = gridVertices[getIndex(x, y + 1)];
        if (p.random() > 0.99) {
          gridVertices[getIndex(x, y)].x +=
            noise.simplex3(x, y, p.frameCount / 100) * -0.05;
          gridVertices[getIndex(x, y)].y +=
            noise.simplex3(x, p.frameCount / 100, y) * -0.05;
          gridVertices[getIndex(x + 1, y)].x +=
            noise.simplex3(x, y, p.frameCount / 100) * 0.05;
          gridVertices[getIndex(x + 1, y)].y +=
            noise.simplex3(x, p.frameCount / 100, y) * -0.05;
          gridVertices[getIndex(x + 1, y + 1)].x +=
            noise.simplex3(x, y, p.frameCount / 100) * 0.05;
          gridVertices[getIndex(x + 1, y + 1)].y +=
            noise.simplex3(x, p.frameCount / 100, y) * 0.05;
          gridVertices[getIndex(x, y + 1)].x +=
            noise.simplex3(x, y, p.frameCount / 100) * -0.05;
          gridVertices[getIndex(x, y + 1)].y +=
            noise.simplex3(x, p.frameCount / 100, y) * 0.05;
        }
        p.beginShape();
        p.vertex(v1.x * scaleFactorWidth, v1.y * scaleFactorHeight, 0, 0, 0);
        p.vertex(
          v2.x * scaleFactorWidth,
          v2.y * scaleFactorHeight,
          0,
          UVrepeat,
          0
        );
        p.vertex(
          v3.x * scaleFactorWidth,
          v3.y * scaleFactorHeight,
          0,
          UVrepeat,
          UVrepeat
        );
        p.vertex(
          v4.x * scaleFactorWidth,
          v4.y * scaleFactorHeight,
          0,
          0,
          UVrepeat
        );
        p.endShape();
      }
    }
  }

  p.draw = function () {
    scaleFactorWidth = canvasWidth / gridWidth;
    scaleFactorHeight = canvasHeight / gridHeight;
    p.background("#ccc1");
    p.noStroke();
    p.image(capture, -canvasWidth / 2, -canvasHeight / 2);
    drawGrid();
    gridVertices.forEach((vertex, index) => {
      if (p.random() > 0.85) {
        const x = index % gridWidth;
        const y = Math.floor(index / gridWidth);
        vertex.x += noise.simplex3(x, y, p.frameCount / 100) * 0.005;
        vertex.y += noise.simplex3(x, p.frameCount / 200, y) * 0.005;
      }
      // p.fill("#ccc1");
      // p.noStroke();
      // p.rect(vertex.x * scaleFactorWidth, vertex.y * scaleFactorHeight, 10, 10);
    });
    // p.filter(p.GRAY);
  };
}, "p5-container");
