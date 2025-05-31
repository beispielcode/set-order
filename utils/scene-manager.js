class SceneManager {
  /**
   * Constructor for the SceneManager class.
   * @param {HTMLCanvasElement} canvas
   * @returns {SceneManager}
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.sceneIndex = 0;
    this.scenesNames = [];
    this.scenes = new Map();
    this.currentScene = null;
    this.isTransitioning = false;
    this.transitionDuration = 150; //ms

    // Initialise paper.js
    paper.setup(canvas);
    paper.view.viewSize = [canvasWidth, canvasHeight];

    return this;
  }

  /**
   * Adds a scene to the scene manager.
   * @param {Scene} scene
   * @returns {Scene}
   */
  addScene(scene) {
    const { name, sceneGroup } = scene;

    sceneGroup.visible = false;

    this.scenes.set(name, {
      scene,
      group: sceneGroup,
      isLoaded: true,
    });
    this.scenesNames.push(name);
    if (this.currentScene === null) this.switchToScene(name);
    return scene;
  }

  /**
   * Updates the scenes.
   * @param {number} deltaTime
   */
  update(deltaTime = 0.016) {
    updateAxes(deltaTime);
    if (this.isTransitioning) return;
    this.scenes.forEach(({ scene }) => scene.update());
  }

  /**
   * Switches to the next scene.
   */
  next() {
    this.sceneIndex = (this.sceneIndex + 1) % this.scenesNames.length;
    this.switchToScene(this.scenesNames[this.sceneIndex]);
  }

  /**
   * Switches to the previous scene.
   */
  previous() {
    this.sceneIndex =
      (this.sceneIndex - 1 + this.scenesNames.length) % this.scenesNames.length;
    this.switchToScene(this.scenesNames[this.sceneIndex]);
  }

  /**
   * Switches to a new scene.
   * @param {string} sceneName
   * @returns {Promise<Scene>}
   */
  async switchToScene(sceneName) {
    const newScene = this.scenes.get(sceneName);
    if (!newScene || newScene === this.currentScene) return;

    if (this.currentScene) this.currentScene.scene.pause();

    if (!this.isTransitioning) {
      this.isTransitioning = true;
      this.targetScene = newScene;
      console.log("Switching to: ", this.targetScene.group.name);
      this.currentScene = await this.performTransition(
        this.currentScene,
        newScene
      );
    } else {
      this.targetScene = newScene;
      console.log("Changing target to: ", this.targetScene.group.name);
      return;
    }
    this.isTransitioning = false;
    this.currentScene.scene.resume();
    return this.currentScene;
  }

  /**
   * Performs a transition between two scenes.
   * @returns {Promise<Scene>}
   */
  async performTransition() {
    if (this.currentScene) this.currentScene.group.visible = false;
    this.targetScene.group.visible = false;
    return new Promise((resolve) => {
      setTimeout(() => {
        this.targetScene.group.visible = true;
        resolve(this.targetScene);
      }, this.transitionDuration);
    });
  }
}

const canvas = document.getElementById("paper-canvas");
const sceneManager = new SceneManager(canvas);

sketches.reverse().forEach((sketch) => {
  if (
    sketch != "quantisation" &&
    sketch != "interpolation-gradient" &&
    sketch != "color-fullscreen"
  )
    return;
  const script = document.createElement("script");
  script.src = `sketches/${sketch}.js`;
  document.body.appendChild(script);
});

// Add MIDI event listener for control change messages
window.addEventListener("midimessage", (e) => {
  const { type, control, value } = e.data;
  if (type === "controlchange" && control >= 0 && control < 4)
    updateAxesValue(control, value);
});

let FRAME_COUNT = 0;

// Define the onFrame event handler for animation and interaction
paper.view.onFrame = (e) => {
  const deltaTime = e.delta;
  sceneManager.update(deltaTime);
  // updateAxes(deltaTime);
  // sceneElements.forEach((sceneElement) => {
  //   sceneElement.update();
  // });
  FRAME_COUNT++;
};
sceneManager.update();
