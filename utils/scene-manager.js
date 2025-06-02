/**
 * Orchestrates scenes and transitions between them
 */

// === GLOBAL CONSTANTS ===
// Global scale for canvas size
const GLOBAL_SCALE = 0.5;
// Canvas size
let CANVAS_WIDTH = 4480 * GLOBAL_SCALE;
let CANVAS_HEIGHT = 2520 * GLOBAL_SCALE;

// === SCENES ===
// Check if browser is Google Chrome
const isChrome = /Chrome/.test(navigator.userAgent);
// Check for mobile device
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

function init() {
  if (!isChrome) logger.log("use chrome for best performance", "");
  if (isMobile) {
    logger.log(
      "please open on desktop",
      "",
      new Promise((resolve) => (window.onbeforeunload = resolve))
    );
  } else {
    // Load scenes
    SCENES.forEach((scene) => {
      const script = document.createElement("script");
      script.src = `scenes/${scene}.js`;
      document.body.appendChild(script);
    });
  }
}

window.onload = init;

// === SCENE MANAGER ===
class SceneManager {
  /**
   * Constructor for the SceneManager class.
   * @param {string} canvasId - ID of the canvas element
   * @returns {SceneManager}
   */
  constructor(canvasId) {
    this.sceneIndex = 0;
    this.scenesNames = [];
    this.scenes = new Map();
    this.currentScene = null;
    this.paused = false;
    this.isTransitioning = false;
    this.transitionDuration = 150; //ms

    // Initialise paper.js
    this.canvas = document.getElementById(canvasId);
    paper.setup(this.canvas);
    paper.view.viewSize = [CANVAS_WIDTH, CANVAS_HEIGHT];

    return this;
  }

  /**
   * Adds a scene to the scene manager.
   * @param {Scene} scene - The scene object
   * @returns {Scene}
   */
  addScene(scene) {
    const { name, sceneGroup } = scene;
    sceneGroup.visible = false; // Hide scene group

    // Add scene to scenes map
    this.scenes.set(name, {
      name,
      scene,
      group: sceneGroup,
      isLoaded: true,
    });
    this.scenesNames.push(name);

    // Switch to the new scene if it's the first one
    if (this.currentScene === null) this.switchToScene(name);

    return scene;
  }

  /**
   * Updates the scenes.
   * @param {number} deltaTime - Delta time for the animation
   */
  update(deltaTime = 0.016) {
    if (this.paused) return;
    updateAxes(deltaTime);
    if (this.isTransitioning) return;
    // Propagate the update to the scenes
    this.scenes.forEach(({ scene }) => scene.update(deltaTime));
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
   * @param {string} sceneName - Name of the scene to switch to
   * @returns {Promise<Scene>}
   */
  async switchToScene(sceneName) {
    const newScene = this.scenes.get(sceneName);
    if (!newScene || newScene === this.currentScene) return;

    if (this.currentScene) this.currentScene.scene.pause();

    // Change target scene
    if (this.isTransitioning) {
      this.targetScene = newScene;
      return;
    }
    this.isTransitioning = true;
    this.targetScene = newScene;
    this.currentScene = await this.performTransition();
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

  /**
   * Pauses the scene manager.
   */
  pause() {
    this.paused = true;
    this.isTransitioning = false;
    this.scenes.forEach(({ scene }) => scene.pause());
  }

  /**
   * Resumes the scene manager.
   */
  resume() {
    this.paused = false;
    this.scenes.forEach(({ scene }) => scene.resume());
  }
}

// Create a new scene manager
const sceneManager = new SceneManager("paper-canvas");
if (isMobile) sceneManager.pause();

// === INTERACTION ===
// Add MIDI event listener for control change messages
window.addEventListener("midimessage", (e) => {
  const { type, control, value } = e.data;
  if (type === "controlchange" && control >= 0 && control < 4)
    updateAxesValue(control, value);
});

// === ANIMATION ===
// Define the onFrame event handler for animation and interaction
paper.view.onFrame = (e) => {
  const deltaTime = e.delta;
  sceneManager.update(deltaTime);
};
