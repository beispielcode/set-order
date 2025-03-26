window.myP5 = new p5((p) => {
  window.addEventListener("resize", () => {
    p.resizeCanvas(canvasWidth, canvasHeight);
  });
  p.setup = function () {
    p.createCanvas(canvasWidth, canvasHeight);
    p.background(220);
  };

  p.draw = function () {
    // p.background(220);
    let perlin = noise.simplex2(p.frameCount / 10, p.frameCount / 10);

    p.strokeWeight(0);
    p.fill(perlin * 255, perlin * 255, perlin * 255);
    p.ellipse(p.mouseX, p.mouseY, 50, 50);
  };
}, "p5-container");
