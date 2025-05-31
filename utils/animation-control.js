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
  "interpolation-gradient": [
    (time) => map(Math.sin(time * 0.00005), -1, 1, 0, 127),
    (time) => map(noise.simplex2(0, time * 0.000125), -1, 1, 0, 127),
    (time) => map(noise.simplex2(1, time * 0.0001255), -1, 1, 0, 127),
    (time) => map(Math.cos(time * 0.000245), -1, 1, 0, 127),
  ],
  "color-fullscreen": [
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

let animationPlaying = false;
let animationFrame = null;
let animationStartTime = performance.now();
let sceneIndex = 0;
let scenChangeInterval = null;

function changeScene() {
  setTimeout(() => {
    sceneManager.next();
  }, Math.random() * 10000);
}

function toggleAnimation() {
  if (animationPlaying) {
    animationPlaying = false;
    clearInterval(scenChangeInterval);
    scenChangeInterval = null;
    cancelAnimationFrame(animationFrame);
  } else {
    animationPlaying = true;
    animationStartTime = performance.now();
    scenChangeInterval = setInterval(changeScene, 1000);
    animationFrame = requestAnimationFrame(animateAxis);
  }
}

function animateAxis() {
  const time = performance.now() - animationStartTime;
  // if (sketchLoader.currentSketch) {
  //   const { sketchName } = sketchLoader.currentSketch;
  // }
  if (sceneManager?.currentScene) {
    let axisAnimation =
      axisAnimations[sceneManager.currentScene.name] || axisAnimations.default;
    axisAnimation.forEach((animation, index) =>
      changeChanValue(null, index, animation(time))
    );
  }
  animationFrame = requestAnimationFrame(animateAxis);
}
