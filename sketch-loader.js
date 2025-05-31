// sketch-loader.js
const sketchLoader = {
  currentSketch: null,

  addScript: function (src) {
    const script = document.createElement("script");
    script.src = src;
    document.body.querySelector("main").appendChild(script);
    if (!this.currentSketch) {
      this.currentSketch = { scripts: [] };
    }
    this.currentSketch.scripts.push(script);
    return script;
  },
  removeScript: function (src) {
    const scriptIndex = this.currentSketch.scripts.findIndex(
      (script) => script.src === src
    );
    if (scriptIndex !== -1) {
      this.currentSketch.scripts[scriptIndex].remove();
      this.currentSketch.scripts.splice(scriptIndex, 1);
    }
  },

  // Load a Paper.js sketch
  loadSketch: function (sketchName) {
    updateConfig({ last_loaded_sketch: sketchName });
    // changeChanValue(null, 0, 0);
    // changeChanValue(null, 1, 0);
    // changeChanValue(null, 2, 0);
    // changeChanValue(null, 3, 0);
    this.unloadCurrent();

    // Create canvas
    // const container = document.createElement("div");
    // container.id = "paper-container";
    // container.classList.add("canvas-wrapper");
    // document.body.querySelector("main").appendChild(container);
    // const canvas = document.createElement("canvas");
    // canvas.id = "paper-canvas";
    canvas = document.getElementById("paper-canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    // canvas.style.minWidth = `${canvasWidth}px`;
    // canvas.style.minHeight = `${canvasHeight}px`;
    canvas.style.maxWidth = `${canvasWidth}px`;
    canvas.style.maxHeight = `${canvasHeight}px`;
    canvas.setAttribute("keepalive", "true");
    canvas.setAttribute("data-keepalive", "true");
    // container.appendChild(canvas);

    // Create script elements
    // const libScript = this.addScript("lib/paper-full.js");
    // libScript.onload = () => {
    this.addScript(`sketches/${sketchName}.js`);
    // this.addScript(`utils/paper-helpers.js`);
    // };

    this.currentSketch = {
      scripts: this.currentSketch.scripts,
      canvas: canvas.parentNode,
      sketchName: sketchName,
    };
  },

  // Unload current sketch
  unloadCurrent: function () {
    if (!this.currentSketch) return;

    // Remove all previously added scripts
    if (this.currentSketch.scripts) {
      this.currentSketch.scripts.forEach((script) => {
        if (script && script.parentNode) {
          script.remove();
        }
      });
    }

    // Clean up
    // Clean up p5 instance
    if (window.myP5) {
      try {
        window.myP5.remove();
        delete window.myP5;
      } catch (e) {
        console.warn("Error removing p5 instance:", e);
      }
    }
    if (this.currentLib === "paper") {
      // Clean up Paper.js
      if (window.paper) {
        try {
          if (paper.project) {
            paper.project.clear();
            paper.project.remove();
          }

          // Clear all projects
          if (paper.projects) {
            while (paper.projects.length) {
              paper.projects[0].remove();
            }
          }

          // Remove event handlers
          if (paper.view) {
            paper.view.onFrame = null;
            paper.view.onResize = null;
            paper.view.onMouseDown = null;
            paper.view.onMouseUp = null;
            paper.view.onMouseMove = null;
            paper.view.onMouseDrag = null;
          }

          paper.clear();
          delete window.paper;
        } catch (e) {
          console.warn("Error cleaning up Paper.js:", e);
        }
      }
    }

    // Remove canvas
    if (this.currentSketch.canvas && this.currentSketch.canvas.parentNode) {
      this.currentSketch.canvas.remove();
    }

    // Reset global variables
    const globalsToReset = [
      "path",
      "circle",
      "rect",
      "currentPath",
      "grid",
      "particles",
      "animation",
      "Base",
    ];

    globalsToReset.forEach((varName) => {
      if (window[varName] !== undefined) {
        delete window[varName];
      }
    });

    this.currentSketch = null;
  },
};
