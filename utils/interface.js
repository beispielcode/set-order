window.addEventListener("keydown", handleKeyDown);

function handleKeyDown(e) {
  // console.log(e, e.key);
  switch (e.key) {
    case "f":
      if (
        !e.shiftKey &&
        !e.metaKey &&
        !e.altKey
        // && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
      ) {
        // request full screen
        e.preventDefault();
        if (!document.fullscreenElement)
          sketchLoader?.currentSketch?.canvas?.parentElement?.requestFullscreen();
        else document.exitFullscreen();
      }
      break;
    case "1":
      if (!e.shiftKey && !e.metaKey && !e.altKey)
        window.onmousewheel = (e) => changeChanValue(e, 0);
      break;
    case "2":
      if (!e.shiftKey && !e.metaKey && !e.altKey)
        window.onmousewheel = (e) => changeChanValue(e, 1);
      break;
    case "3":
      if (!e.shiftKey && !e.metaKey && !e.altKey)
        window.onmousewheel = (e) => changeChanValue(e, 2);
      break;
    case "4":
      if (!e.shiftKey && !e.metaKey && !e.altKey)
        window.onmousewheel = (e) => changeChanValue(e, 3);
      break;
    case "s":
      if (!e.shiftKey && e.metaKey && !e.altKey) saveCanvas(e);
    default:
      break;
  }
}

window.addEventListener("keyup", handleKeyUp);

function handleKeyUp(e) {
  window.onmousewheel = null;
}

// post new config to config/config.php
async function updateConfig(args) {
  // const url = "http://10.21.1.232:8000/index.php";
  const url = "";
  // console.log(JSON.stringify(args));

  const request = await fetch(url, {
    method: "POST",
    body: JSON.stringify(args),
  });
}

// midi emulation

const midiEvent = new Event("midimessage");

function midiMessage(data) {
  midiEvent.data = data;
  lastInteraction = performance.now();
  window.dispatchEvent(midiEvent);
}
const channelInputs = [
  document.getElementById("chan0"),
  document.getElementById("chan1"),
  document.getElementById("chan2"),
  document.getElementById("chan3"),
];
const channels = [
  parseInt(channelInputs[0].value),
  parseInt(channelInputs[1].value),
  parseInt(channelInputs[2].value),
  parseInt(channelInputs[3].value),
];

const easedChannelDynamicsF = 2.25;
const easedChannelDynamicsZeta = 1;
const easedChannelDynamicsR = 0;

const easedChannelDynamics = [
  new SecondOrderDynamics(0),
  new SecondOrderDynamics(0),
  new SecondOrderDynamics(0),
  new SecondOrderDynamics(0),
];
const easedChannels = [1, 1, 1, 1];
const channelOutputs = [
  document.getElementById("output-chan0"),
  document.getElementById("output-chan1"),
  document.getElementById("output-chan2"),
  document.getElementById("output-chan3"),
];

channelInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    channels[index] = parseInt(input.value);
    channelOutputs[index].textContent = `chan${index}: ${input.value.padStart(
      3,
      0
    )}/127`;
    midiMessage({
      type: "controlchange",
      channel: 0,
      control: index,
      value: parseInt(input.value),
    });
  });
  input.addEventListener("change", () => {
    channels[index] = parseInt(input.value);
    channelOutputs[index].textContent = `chan${index}: ${input.value.padStart(
      3,
      0
    )}/127`;

    const chan = input.id.replace("chan", "");
    updateConfig({ [`chan${chan}`]: parseInt(input.value) });
    midiMessage({
      type: "controlchange",
      channel: 0,
      control: index,
      value: parseInt(input.value),
    });
  });
});

let lastInteraction = performance.now();
function changeChanValue(e, chan, value) {
  if (e) {
    const delta = e.deltaY;
    channelInputs[chan].value =
      parseInt(channelInputs[chan].value) + parseInt(delta * 0.25);
  } else if (value || value === 0) {
    // console.log(value);
    channelInputs[chan].value = value;
  }

  channelOutputs[chan].textContent = `chan${chan}: ${channelInputs[
    chan
  ].value.padStart(3, 0)}/127`;
  channels[chan] = parseInt(channelInputs[chan].value);
  updateConfig({ [`chan${chan}`]: parseInt(channelInputs[chan].value) });
  midiMessage({
    type: "controlchange",
    channel: 0,
    control: chan,
    value: parseInt(channelInputs[chan].value),
  });
}

// Track the previous timestamp for delta time calculation
let previousTime = performance.now();
let deltaTime = 0;

function animate() {
  // Get the current timestamp
  const currentTime = performance.now();

  // Calculate delta time (in seconds)
  deltaTime = Math.min((currentTime - previousTime) / 1000, 0.16);

  // Update the previous timestamp
  previousTime = currentTime;

  // Update the position using delta time
  easedChannelDynamics.forEach((dynamics, index) => {
    easedChannels[index] = dynamics.update(deltaTime, channels[index]);
  });

  // Continue the animation loop
  requestAnimationFrame(animate);
}
setTimeout(() => {
  animate(); // Start the animation
}, 200);

function saveCanvas(e, fileName) {
  e.preventDefault();
  if (!fileName) {
    fileName = `paper-${sketchSelect.value}-${channels.join("-")}.svg`;
  }

  var url =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(paper.project.exportSVG({ asString: true }));

  var link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
}
const sketchInputs = document.querySelectorAll("input[name='sketch']");

// Event listeners

sketchInputs.forEach((input) => {
  input.addEventListener("change", (e) => {
    e.preventDefault();
    const sketch = input.value;
    sketchLoader.loadSketch(sketch);
  });
  if (input.checked) sketchLoader.loadSketch(input.value);
});
