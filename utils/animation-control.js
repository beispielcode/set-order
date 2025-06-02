/**
 * Animation control
 * Handles the automatic animation of axes
 */

// === CONSTANTS ===
// Axis animations
const axisAnimations = {
  default: [
    (time) => map(Math.sin(time * 0.0005), -1, 1, 0, 127),
    (time) => map(Math.sin(time * 0.00025), -1, 1, 0, 127),
    (time) => map(Math.cos(time * 0.00015), -1, 1, 0, 127),
    (time) => map(Math.cos(time * 0.0005), -1, 1, 0, 127),
  ],
  quantisation: [
    (time) => map(noise.simplex2(0, time * 0.000055), -1, 1, 0, 127),
    (time) => map(noise.simplex2(1, time * 0.000125), -1, 1, 0, 127),
    (time) => map(noise.simplex2(2, time * 0.0001225), -1, 1, 0, 127),
    (time) => map(Math.cos(time * 0.000245), -1, 1, 0, 127),
  ],
  interpolation: [
    (time) => map(Math.sin(time * 0.00005), -1, 1, 0, 127),
    (time) => map(noise.simplex2(0, time * 0.000125), -1, 1, 0, 127),
    (time) => map(noise.simplex2(1, time * 0.0001255), -1, 1, 0, 127),
    (time) => map(Math.cos(time * 0.000245), -1, 1, 0, 127),
  ],
  color: [
    (time) => map(noise.simplex2(0, time * 0.000125), -1, 1, 0, 127),
    (time) => map(noise.simplex2(1, time * 0.0000525), -1, 1, 0, 127),
    (time) =>
      map(
        map(Math.cos(time * 0.000125 + Math.PI), -1, 1, 0, 1) ** 2,
        0,
        1,
        0,
        127
      ),
    (time) => map(Math.cos(time * 0.000245), -1, 1, 0, 127),
  ],
};

// Animation variables
let animationPlaying = false;
let animationFrame = null;
let animationStartTime = performance.now();
let animationTransitionDuration = 15000;
let sceneIndex = 0;

/**
 * Changes the scene
 */
function changeScene() {
  sceneManager.next();
}

/**
 * Toggles the automatic animation
 */
function toggleAnimation() {
  if (animationPlaying) {
    animationPlaying = false;
    cancelAnimationFrame(animationFrame);
  } else {
    animationPlaying = true;
    animationStartTime = performance.now();
    animationFrame = requestAnimationFrame(animateAxis);
  }
}

/**
 * Animates the axes every frame
 */
function animateAxis() {
  const time = performance.now();
  const intensity =
    cap(
      map(time - animationStartTime, 0, animationTransitionDuration, 0, 1),
      0,
      1
    ) ** 3;

  if (sceneManager?.currentScene) {
    let axisAnimation =
      axisAnimations[sceneManager.currentScene.name] || axisAnimations.default;
    axisAnimation.forEach((animation, index) =>
      changeChanValue(
        index,
        lerp(previousChannels[index], animation(time), intensity)
      )
    );
  }
  animationFrame = requestAnimationFrame(animateAxis);
}
