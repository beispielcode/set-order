window.myP5 = new p5((p) => {
  window.addEventListener("resize", () => {
    p.resizeCanvas(canvasWidth, canvasHeight);
  });
  p.setup = function () {
    p.createCanvas(canvasWidth, canvasHeight);
    p.background(220);
  };

  p.draw = function () {
    p.background(colors[0]);
    let perlin = noise.simplex2(p.frameCount / 10, p.frameCount / 10);
    // console.log(structure.vertices);
    p.translate(canvasWidth / 2, canvasHeight / 2);
    const scaleX = p.map(p.mouseX, 0, canvasWidth, 0, canvasWidth / 8);
    const scaleY = p.map(p.mouseY, 0, canvasHeight, 0, canvasHeight / 8);
    if (structure.vertices) {
      structure.vertices.forEach((vertex) => {
        p.fill(colors[2]);
        p.ellipse(
          vertex.vec.ind(0) * scaleX,
          vertex.vec.ind(1) * scaleY,
          10,
          10
        );
      });
    }

    p.strokeWeight(0);
    // p.fill(perlin * 255, perlin * 255, perlin * 255);
    // p.ellipse(p.mouseX, p.mouseY, 50, 50);
  };
}, "p5-container");
