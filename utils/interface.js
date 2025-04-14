window.addEventListener("keydown", handleKeyDown);

function handleKeyDown(e) {
  // console.log(e, e.key);
  switch (e.key) {
    case "f":
      if (
        !e.shiftKey &&
        !e.metaKey &&
        !e.altKey &&
        !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
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
    default:
      break;
  }
}

window.addEventListener("keyup", handleKeyUp);

function handleKeyUp(e) {
  window.onmousewheel = null;
}

const librarySelect = document.getElementById("library-select");
const sketchSelect = document.getElementById("sketch-select");
const loadBtn = document.getElementById("load-btn");
const versionInfo = document.getElementById("version-info");
let colorFields = document.querySelectorAll(".color-scheme");
const saveColorsButton = document.getElementById("save-colors");
const addColorButton = document.getElementById("add-color");

let colorSchemes = Array.from(colorFields).map((group) =>
  Array.from(group.querySelectorAll("input[type='color']")).map(
    (input) => input.value
  )
);
let colors = colorSchemes[colorIndex];

function initColorSchemes(group, index) {
  const activeInput = group.querySelector("input[name='color-active']");
  const colorInputs = group.querySelectorAll("input[type='color']");
  const colorInputTexts = group.querySelectorAll("input[type='text']");
  const deleteButton = group.querySelector("button.delete-button");
  function updateColorScheme(serverSide = true, updateIndex = false) {
    colorSchemes[index] = Array.from(colorInputs).map((input) => input.value);
    if (activeInput.checked) colors = colorSchemes[index];
    if (serverSide && !updateIndex) updateConfig({ colors: colorSchemes });
    if (serverSide && updateIndex)
      updateConfig({ colors: colorSchemes, color_index: index });
  }
  const toHex = (str) =>
    `#${str.replaceAll(/[^0-9a-fA-F]/g, "").substring(0, 6)}`;
  const expandHex = (str) => {
    let expanded = str.replaceAll("#", "");
    if (expanded.length < 3) return `#${expanded.repeat(6 / expanded.length)}`;
    return `#${expanded.split("").reduce((acc, x) => acc + x + x, "")}`;
  };
  activeInput.onchange = () => updateColorScheme(true, true);
  colorInputs.forEach((input, inputIndex) => {
    input.onchange = () => updateColorScheme();
    input.oninput = () => {
      if (activeInput.checked) colors[index][inputIndex] = input.value;
      if (colorInputTexts[inputIndex].value != input.value)
        colorInputTexts[inputIndex].value = input.value;
      updateColorScheme(false);
    };
  });
  colorInputTexts.forEach((input, inputIndex) => {
    input.oninput = () => {
      const sanitised = toHex(input.value);
      input.value = sanitised;
      if (
        sanitised.match(/^#[0-9a-fA-F]{6}$/i) &&
        colorInputs[inputIndex].value != sanitised
      )
        colorInputs[inputIndex].value = sanitised;
      else if (sanitised.match(/^#[0-9a-fA-F]{1,3}$/i))
        colorInputs[inputIndex].value = expandHex(sanitised);
      else return;
      updateColorScheme();
    };
    input.onblur = () => {
      if (input.value.match(/^#[0-9a-fA-F]{1,3}$/i)) {
        input.value = expandHex(toHex(input.value));
        updateColorScheme();
      }
    };
  });
  deleteButton.onclick = () => {
    group.remove();
    colorFields = document.querySelectorAll(".color-scheme");
    colorSchemes.splice(index, 1);
    updateConfig({ colors: colorSchemes });
  };
}

colorFields.forEach((group, index) => initColorSchemes(group, index));

addColorButton.addEventListener("click", () => {
  const lastColorField = colorFields[colorFields.length - 1];
  const newIndex = colorFields.length;
  const newColorScheme = lastColorField.cloneNode(true);
  newColorScheme.querySelectorAll("input, button").forEach((input) => {
    if (input.name) input.name = input.name.replaceAll(newIndex - 1, newIndex);
    input.id = input.id.replaceAll(newIndex - 1, newIndex);
  });

  Array.from(newColorScheme.querySelectorAll("input[type='color']")).forEach(
    (input, index) => {
      const color = `#${"ff".padEnd(6 - index * 2, "0").padStart(6, "0")}`;
      input.value = color;
      input.nextElementSibling.value = color;
    }
  );
  lastColorField.after(newColorScheme);

  colorFields = document.querySelectorAll(".color-scheme");
  colorSchemes.push(
    Array.from(newColorScheme.querySelectorAll("input[type='color']")).map(
      (input) => input.value
    )
  );
  Array.from(document.querySelectorAll("input[name='color-active']")).forEach(
    (input, index) => {
      if (index == newIndex) input.checked = true;
      else input.checked = false;
    }
  );
  updateConfig({
    color_index: newIndex,
    colors: colorSchemes,
  });
  initColorSchemes(newColorScheme, newIndex);
});

const workersActiveInput = document.getElementById("workers-active");
workersActiveInput.addEventListener("change", () => {
  workerActive = workersActiveInput.checked;
  updateConfig({ worker_active: workerActive });
  if (workerActive) updateWorkers();
});
const debugActiveInput = document.getElementById("debug-active");
let debugActive = debugActiveInput.checked;
debugActiveInput.addEventListener("change", () => {
  debugActive = debugActiveInput.checked;
  updateConfig({ debug: debugActive ? "true" : "false" });
});
const recordingActiveInput = document.getElementById("recording-active");
let recordingActive = recordingActiveInput.checked;
recordingActiveInput.addEventListener("change", () => {
  recordingActive = recordingActiveInput.checked;
  updateConfig({ recording: recordingActive ? "true" : "false" });
});

// Update sketch options when library changes
function updateSketchOptions() {
  const library = librarySelect.value;
  sketchSelect.innerHTML = "";

  sketches[library].forEach((sketch) => {
    const option = document.createElement("option");
    option.value = sketch;
    option.textContent = sketch;
    if (sketch == lastLoadedSketch) option.selected = true;
    sketchSelect.appendChild(option);
  });
}

// Initial population
updateSketchOptions();

// Event listeners
librarySelect.addEventListener("change", updateSketchOptions);

loadBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const library = librarySelect.value;
  const sketch = sketchSelect.value;

  if (library === "p5") {
    sketchLoader.loadP5Sketch(sketch);
  } else {
    sketchLoader.loadPaperSketch(sketch);
  }

  versionInfo.textContent = `Current: ${sketch}`;
});

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
    if (delta > 0) channelInputs[chan].value++;
    else if (delta < 0) channelInputs[chan].value--;
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
