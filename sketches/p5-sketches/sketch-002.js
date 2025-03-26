window.myP5 = new p5((p) => {
  let values = [];
  const scale = 0.125;
  window.addEventListener("resize", () => {
    p.resizeCanvas(canvasWidth, canvasHeight);
  });
  p.setup = function () {
    p.createCanvas(canvasWidth, canvasHeight);
    p.background(220);
    values = [1, 0];
  };

  p.draw = function () {
    // p.background(220);
    let targetValueLength = p.floor(p.map(p.mouseX, 0, canvasWidth, 0, 5));
    targetValueLength = p.map(targetValueLength, 0, 3, 10, 2000);
    while (values.length < targetValueLength) {
      values.push(p.random(0, 1));
    }
    while (values.length > targetValueLength) {
      values.pop();
    }
    let perlin;
    values.forEach((value, index) => {
      perlin = noise.simplex2(
        p.frameCount / 50 + index / 20,
        p.frameCount / 50 + index / 20
      );
      if (perlin < 0) {
        values[index] = p.lerp(value, 0, 0.6);
      } else {
        values[index] = p.lerp(value, 1, 0.6);
      }
    });
    // console.log(values);

    p.strokeWeight(1);
    for (let x = 0; x < canvasWidth; x++) {
      let valueIndex = p.floor(p.map(x, 0, canvasWidth, 0, values.length - 1));
      // console.log(valueIndex);

      const value = values[valueIndex];
      let r = p.sqrt(value) * 255;
      let g = p.pow(value, 1) * 255;
      let b = p.pow(value, 1) * 255;
      // p.stroke(r, g, b);
      // p.stroke(p.pow(value, 10) * 255, p.pow(value, 10) * 255, value * 255);
      if (
        noise.simplex2(valueIndex, valueIndex) >
        p.map(p.mouseY, 0, canvasHeight, 0, 1)
      ) {
        b = value ? 255 : p.sqrt(value) * 255;
        g = value ? 255 : p.sqrt(value) * 255;
        // g = p.pow(value, 1) * 255;
        r = p.pow(value, 1) * 255;
        p.stroke(r, g, b);
      } else {
        p.stroke(value * 255, p.pow(value, 10) * 255, p.pow(value, 10) * 255);
      }
      p.line(x, 0, x, canvasHeight);
    }
    // filterCanvas.updatePixels();
    // p.image(filterCanvas, 0, 0, canvasWidth, canvasHeight);
    // p.filter(p.BLUR, (200 - targetValueLength + 10) / 10);
  };
}, "p5-container");
