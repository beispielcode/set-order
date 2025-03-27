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
    p.strokeWeight(1);
    const scaleX = p.map(p.mouseX, 0, canvasWidth, 0, canvasWidth / 8);
    const scaleY = p.map(p.mouseY, 0, canvasHeight, 0, canvasHeight / 8);
    if (structure.vertices) {
      p.stroke(`${colors[2]}ff`);
      structure.vertices.forEach((vertex) => {
        vertex.neighbors.forEach((neighbor) => {
          const neighborVertex = structure.vertices[neighbor.index];
          if (!neighborVertex) return;
          const dist = neighborVertex.vec.copy().subVec(vertex.vec).divNum(2);
          // p.line(
          //   (vertex.vec.ind(0) - dist.ind(0) * (1 - vertex.weight)) * scaleX,
          //   (vertex.vec.ind(1) - dist.ind(1) * (1 - vertex.weight)) * scaleY,
          //   (neighbor.vec.ind(0) + dist.ind(0) * (1 - neighbor.weight)) *
          //     scaleX,
          //   (neighbor.vec.ind(1) + dist.ind(1) * (1 - neighbor.weight)) * scaleY
          // );
          p.line(
            vertex.vec.ind(0) * scaleX,
            vertex.vec.ind(1) * scaleY,
            (neighborVertex.vec.ind(0) - dist.ind(0) * (2 - neighbor.weight)) *
              scaleX,
            (neighborVertex.vec.ind(1) - dist.ind(1) * (2 - neighbor.weight)) *
              scaleY
          );

          // const dist = neighborVertex.vec.copy().subVec(vertex.vec);
          // p.line(
          //   vertex.vec.ind(0) * scaleX,
          //   vertex.vec.ind(1) * scaleY,
          //   (neighborVertex.vec.ind(0) - dist.ind(0) * (1 - neighbor.weight)) *
          //     scaleX,
          //   (neighborVertex.vec.ind(1) - dist.ind(1) * (1 - neighbor.weight)) *
          //     scaleY
          // );
          // p.line(
          //   vertex.vec.ind(0) * scaleX,
          //   vertex.vec.ind(1) * scaleY,
          //   neighbor.vec.ind(0) * scaleX,
          //   neighbor.vec.ind(1) * scaleY
          // );
        });
      });
      p.noStroke();
      p.fill(colors[2]);
      structure.vertices.forEach((vertex, index) => {
        p.ellipse(
          vertex.vec.ind(0) * scaleX,
          vertex.vec.ind(1) * scaleY,
          // p.max(5, vertex.weight * 10),
          5,
          // p.max(5, vertex.weight * 10)
          5
        );
        if (debugActive) {
          let debug = ``;

          for (const entry of vertex.debug.entries())
            debug += `${entry[0]}: ${entry[1]}\n`;
          p.text(debug, vertex.vec.ind(0) * scaleX, vertex.vec.ind(1) * scaleY);
        }
      });
    }

    p.strokeWeight(0);
    // p.fill(perlin * 255, perlin * 255, perlin * 255);
    // p.ellipse(p.mouseX, p.mouseY, 50, 50);
  };
}, "p5-container");
