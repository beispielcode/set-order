/**
 * Interaction handlers
 */

let INSTALLATION_MODE = new Set();

// === MIDI INTERFACE ===
// Using WebMidi.js to handle MIDI input (https://webmidijs.org/)
if (navigator.requestMIDIAccess) {
  // Select device index
  const deviceIndex = 0;
  // Map MIDI controller numbers to channel numbers
  const controllerMap = new Map([
    [
      0, // MIDI channel for chan0
      0,
    ],
    [
      1, // MIDI channel for chan1
      1,
    ],
    [
      2, // MIDI channel for chan2
      2,
    ],
    [
      3, // MIDI channel for chan3
      3,
    ],
  ]);

  // Auto-play timeout for Manual Mode
  let autoPlayTimeout = null;

  /**
   * Enables WebMidi.js and triggers the onEnabled() function when ready
   */
  WebMidi.enable()
    .then(onEnabled)
    .catch((err) => {
      console.warn(err);
    });

  // Handle WebMidi.js device connection and control change events
  WebMidi.addListener("connected", (e) => {
    if (e.port.type === "input") return;
    INSTALLATION_MODE.add("MIDI");
    midiEmulator.disable();
    logger.log(`midi device connected`, "success");
    console.log("MIDI device connected:", e.port.name);
    onEnabled();
  });
  WebMidi.addListener("disconnected", (e) => {
    if (e.port.type === "input") return;
    INSTALLATION_MODE.delete("MIDI");
    midiEmulator.enable();
    logger.log(
      `midi device disconnected`,
      "error",
      new Promise((resolve) => WebMidi.addListener("connected", resolve))
    );
    console.log("MIDI device disconnected:", e.port.name);
  });

  /**
   * Handles WebMidi.js device connection and control change events
   */
  function onEnabled() {
    if (WebMidi.inputs.length < 1) {
      console.log("No device detected.");
      logger.log("No MIDI device detected", "error");
      return;
    }
    const device = WebMidi.inputs[deviceIndex];
    console.log(
      `Listening to device: [${deviceIndex}] ${device.manufacturer} ${device.name}`
    );
    WebMidi.inputs.forEach((input, index) => {
      if (index !== deviceIndex)
        console.log(
          `Other available device: [${index}] ${input.manufacturer} ${input.name}`
        );
    });
    if (device) {
      device.addListener("controlchange", (e) => {
        clearTimeout(autoPlayTimeout);
        const [_, controller, value] = e.message.data;
        const chan = controllerMap.get(controller);
        previousChannels[chan] = parseFloat(value);

        changeChanValue(chan, value);
        if (animationPlaying) {
          toggleAnimation();
        }

        const outOfSync = previousChannels.some(
          (value, index) => value !== CHANNELS[index]
        );
        if (outOfSync) {
          previousChannels.forEach((value, index) => {
            changeChanValue(index, value);
          });
        }
        autoPlayTimeout = setTimeout(() => {
          if (!animationPlaying) toggleAnimation();
        }, 20000);
      });
      if (animationPlaying) toggleAnimation();
    }
  }
}

// === KEYBOARD INTERACTION ===
window.addEventListener("keydown", handleKeyDown);
function handleKeyDown(e) {
  switch (e.key) {
    case "f": // Fullscreen
      if (!e.shiftKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (!document.fullscreenElement) document.body.requestFullscreen();
        else document.exitFullscreen();
      }
      break;
    case "s": // Save canvas as SVG
      if (!e.shiftKey && e.metaKey && !e.altKey) saveCanvas(e);
      break;
    case " ": // Toggle animation
      if (!e.shiftKey && !e.metaKey && !e.altKey) toggleAnimation();
      break;
    default:
      break;
  }
}

// === MIDI EMULATION ===
const midiEvent = new Event("midimessage");

/**
 * Dispatches a MIDI message event
 * @param {object} data - MIDI message data
 */
function midiMessage(data) {
  midiEvent.data = data;
  window.dispatchEvent(midiEvent);
}

// Handles MIDI emulation
class MidiEmulator {
  constructor() {
    this.keyPressed = new Set();
    this.autoPlayTimeout = null;
    this.mousewheelListener = (e) => {
      clearTimeout(this.autoPlayTimeout);
      if (this.keyPressed.size === 0) return;
      e.preventDefault();
      const delta = e.deltaY; // Mousewheel delta
      this.keyPressed.forEach((chan) => {
        changeChanValue(chan, CHANNELS[chan] + delta * 0.25);
        previousChannels[chan] = CHANNELS[chan];
      });
      if (animationPlaying) toggleAnimation();
      this.autoPlayTimeout = setTimeout(() => {
        if (!animationPlaying) toggleAnimation();
      }, 2000);
    };
  }

  /**
   * Enables the emulator.
   */
  enable() {
    window.addEventListener("keydown", (e) => this.handleKeyDown(e));
    window.addEventListener("keyup", (e) => this.handleKeyUp(e));
    window.addEventListener("mousewheel", this.mousewheelListener, {
      passive: false,
    });
  }

  /**
   * Disables the emulator.
   */
  disable() {
    clearTimeout(this.autoPlayTimeout);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("mousewheel", this.mousewheelListener);
  }

  /**
   * Handles key down events.
   * @param {KeyboardEvent} e - The keyboard event object.
   */
  handleKeyDown(e) {
    let chan = NaN;
    switch (e.key) {
      case "1":
        chan = 0;
        break;
      case "2":
        chan = 1;
        break;
      case "3":
        chan = 2;
        break;
      case "4":
        chan = 3;
        break;
      default:
        break;
    }
    if (!isNaN(chan) && !e.shiftKey && !e.metaKey && !e.altKey)
      this.keyPressed.add(chan);
  }

  /**
   * Handles key up events.
   * @param {KeyboardEvent} e - The keyboard event object.
   */
  handleKeyUp(e) {
    let chan = NaN;
    switch (e.key) {
      case "1":
        chan = 0;
        break;
      case "2":
        chan = 1;
        break;
      case "3":
        chan = 2;
        break;
      case "4":
        chan = 3;
        break;
      default:
        break;
    }
    if (!isNaN(chan)) this.keyPressed.delete(chan);
  }
}
const midiEmulator = new MidiEmulator();
if (!INSTALLATION_MODE.has("MIDI")) {
  if (!animationPlaying) toggleAnimation();
  midiEmulator.enable();
} else midiEmulator.disable();

// Switch to scene when clicked
window.addEventListener("click", () => {
  if (!INSTALLATION_MODE.has("SWITCH")) changeScene();
});

// === USER INTERFACE ===
// Keeps track of the current channel values
const CHANNELS = [0, 0, 0, 0];

let previousChannels = [...CHANNELS];

/**
 * Updates the value of a channel
 * @param {*} chan - The channel index
 * @param {*} value - The new value for the channel
 */
function changeChanValue(chan, value) {
  value = cap(value, 0, 127);
  CHANNELS[chan] = value;
  midiMessage({
    type: "controlchange",
    channel: 0,
    control: chan,
    value: value,
  });
}

/**
 * Saves the current canvas as an SVG file
 * @param {Event} e - The event object
 * @param {string} fileName - The name of the file to save (optional)
 */
function saveCanvas(e, fileName) {
  e.preventDefault();

  // Set default file name
  if (!fileName)
    fileName = `set_order-${sceneManager.currentScene.name}[${CHANNELS.join(
      "]["
    )}].svg`;

  // Create a data URL from the SVG
  var url =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(paper.project.exportSVG({ asString: true }));

  // Trigger download
  var link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
  link.remove();
}

// === LOGGER ===
class Logger {
  /**
   * Creates a new Logger instance.
   * @param {string} wrapperId - The ID of the log wrapper element.
   * @returns {Logger} The Logger instance.
   */
  constructor(wrapperId = "log-wrapper") {
    this.logWrapper = document.getElementById(wrapperId);
    return this;
  }

  /**
   * Logs a message to the console.
   * @param {string} message - The message to log.
   * @param {string} status - The status of the message (success, error, etc.).
   */
  async log(message, status, removeAfter) {
    const log = document.createElement("p");
    log.classList.add("log");
    log.classList.add(status);
    log.innerText = message;
    this.logWrapper.appendChild(log);
    if (!removeAfter)
      removeAfter = await new Promise((resolve) =>
        setTimeout(() => this.removeLog(log), 3000)
      );
    else {
      await removeAfter;
      this.removeLog(log);
    }
  }

  /**
   * Removes a log element from the DOM.
   * @param {HTMLElement} log - The log element to remove.
   */
  removeLog(log) {
    log.classList.add("fade-out");
    setTimeout(() => log.remove(), 450);
  }
}

const logger = new Logger();
