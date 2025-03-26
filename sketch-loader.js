// sketch-loader.js
const sketchLoader = {
  currentSketch: null,
  currentLib: null,
  // libraryChangeTimeout: null,

  addScript: function (src) {
    const script = document.createElement("script");
    script.src = src;
    document.body.appendChild(script);
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

  // Load a p5.js sketch
  loadP5Sketch: function (sketchName) {
    updateConfig("last_loaded_sketch", ["p5", sketchName]);
    // clearTimeout(this.libraryChangeTimeout);
    this.unloadCurrent();
    this.currentLib = "p5";
    // if (this.currentLib !== 'p5') {
    //     libraryChangeTimeout = setTimeout(() => {
    //         this.loadP5Sketch(sketchName);
    //     }, 100);
    //     return;
    // }

    // Create script elements
    const libScript = this.addScript("lib/p5.js");
    libScript.onload = () => {
      this.addScript(`sketches/p5-sketches/${sketchName}.js`);
      this.addScript(`utils/p5-helpers.js`);
    };

    // Create canvas container
    const container = document.createElement("div");
    container.id = "p5-container";
    document.body.appendChild(container);

    this.currentSketch = {
      scripts: this.currentSketch.scripts,
      canvas: container,
    };
  },

  // Load a Paper.js sketch
  loadPaperSketch: function (sketchName) {
    updateConfig("last_loaded_sketch", ["paper", sketchName]);
    // clearTimeout(this.libraryChangeTimeout);
    this.unloadCurrent();
    this.currentLib = "paper";
    // if (this.currentLib !== 'paper') {
    //     libraryChangeTimeout = setTimeout(() => {
    //         this.loadPaperSketch(sketchName);
    //     }, 100);
    //     return;
    // }

    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.id = "paper-canvas";
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    document.body.appendChild(canvas);

    // Create script elements
    const libScript = this.addScript("lib/paper-full.js");
    libScript.onload = () => {
      // this.currentSketch.scope  = new paper.PaperScope;
      // this.currentSketch.scope.setup('paper-canvas');
      this.addScript(`sketches/paper-sketches/${sketchName}.js`);
      this.addScript(`utils/paper-helpers.js`);
    };

    this.currentSketch = {
      scripts: this.currentSketch.scripts,
      canvas: canvas,
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

    // Clean up based on library type
    if (this.currentLib === "p5") {
      // Clean up p5 instance
      if (window.myP5) {
        try {
          window.myP5.remove();
          delete window.myP5;
        } catch (e) {
          console.warn("Error removing p5 instance:", e);
        }
      }
    } else if (this.currentLib === "paper") {
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
