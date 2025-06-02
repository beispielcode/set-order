/**
 * Switch control class
 * Handles handshake with the switch and triggers scenes
 */

// === EVENT LISTENER ===
// Request device and start listening
window.addEventListener("keydown", (event) => {
  if (event.key === "c") connectAndListen();
});

// === CONSTANTS ===
const vendorId = 0x0525;
const productId = 0xa4a7;
// Device specific for bulk transfers
const configuration = 2;
const deviceInterface = 1;
const endpointNumber = 1;

class RotarySwitchListener {
  constructor(device) {
    this.device = device;
    this.isListening = false;
    this.lastValue = null;
    this.debounceTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    this.scenesArray = SCENES;
  }

  /**
   * Starts the switch listener.
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isListening) return;

    // Perform handshake before starting main loop
    if (await this.performHandshake()) {
      INSTALLATION_MODE.add("SWITCH");
      this.isListening = true;
      this.readLoop();
    } else {
      console.error("Failed to establish handshake");
    }
  }

  /**
   * Performs a handshake with the switch.
   * @returns {Promise<boolean>} Whether the handshake was successful.
   */
  async performHandshake() {
    console.log("Attempting handshake...");

    try {
      // Send a handshake message
      const handshakeMessage = "HANDSHAKE\n";
      const encoder = new TextEncoder();
      await this.device.transferOut(endpointNumber, encoder.encode(handshakeMessage));

      // Wait for response with timeout
      const response = await this.waitForResponse(5000); // 5 second timeout

      if (response && response.includes("READY")) {
        console.log("USB handshake successful:", response);
        logger.log("USB Connection established", "success");
        return true;
      } else if (response && response.includes("HEARTBEAT")) {
        console.log("USB heartbeat received:", response);
        logger.log("USB Connection established", "success");
        return true;
      } else {
        console.warn("Unexpected USB handshake response:", response);
        logger.log("Failed to establish USB connection", "error");
        return false;
      }
    } catch (error) {
      console.error("USB handshake failed:", error);
      logger.log("Failed to establish USB connection", "error");
      return false;
    }
  }

  /**
   * Waits for a response from the switch.
   * @param {number} timeout - Timeout in milliseconds.
   * @returns {Promise<boolean>} Whether the response was received.
   */
  async waitForResponse(timeout = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const result = await this.device.transferIn(endpointNumber, 64);
        const decoder = new TextDecoder();
        const response = decoder.decode(result.data).trim();

        if (response) return response;
      } catch (error) {
        // Ignore timeout errors during handshake
        if (error.name !== "NetworkError") throw error;
      }

      await this.sleep(100); // Small delay between attempts
    }
    throw new Error("Handshake timeout");
  }

  /**
   * Stops the switch listener.
   */
  stop() {
    this.isListening = false;
    if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
  }

  /**
   * Reads data from the switch and triggers scenes.
   */
  async readLoop() {
    while (this.isListening) {
      try {
        // Read data from the device
        const result = await this.device.transferIn(1, 64);
        const decoder = new TextDecoder();
        const receivedData = decoder.decode(result.data).trim();

        if (receivedData) {
          console.log("Data received:", receivedData);
          this.handleData(receivedData);
          this.reconnectAttempts = 0; // Reset on successful read
        }

        // Small delay to prevent overwhelming the CPU
        await this.sleep(10);
      } catch (error) {
        console.error("Error reading data:", error);

        // Attempt to recover from errors
        if (await this.handleError(error)) 
          continue; // Try again
        else 
          break; // Stop listening
      }
    }
  }

  /**
   * Handles data received from the switch.
   * @param {string} data - Data received from the switch.
   */
  handleData(data) {
    const value = parseInt(data);

    // Handle heartbeat
    if (data === "HEARTBEAT") { 
      console.log("USB heartbeat received");
      return;
    }

    // Handle handshake
    if (data === "HANDSHAKE") {
      console.log("USB handshake received");
      return;
    }

    // Handle ready
    if (data === "READY") {
      console.log("USB ready received");
      return;
    }

    // Validate the received value
    if (![0, 1, 2].includes(value)) {
      console.warn("Invalid value received:", data);
      return;
    }

    // Debounce rapid changes
    if (this.lastValue === value) return; // Ignore duplicate values

    // Clear any pending debounce
    if (this.debounceTimeout) clearTimeout(this.debounceTimeout);

    // Debounce the switch change
    this.debounceTimeout = setTimeout(() => {
      this.lastValue = value;
      console.log("Message detected:", value);
      console.log("Switching to scene:", this.scenesArray[value]);

      // Load the new scene
      sceneManager.switchToScene(this.scenesArray[value]);
    }, 50); // 50ms debounce
  }

  /**
   * Handles errors during data reading.
   * @param {Error} error - Error object.
   * @returns {Promise<boolean>} Whether the error was recoverable.
   */
  async handleError(error) {
    // Check if it's a recoverable error
    if (error.name === "NetworkError" || error.name === "NotFoundError") {
      this.reconnectAttempts++;

      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(
          `Attempting to recover... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
        logger.log(`usb connection lost, attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`, "error");
        await this.sleep(1000 * this.reconnectAttempts); // Exponential backoff
        return true; // Continue trying
      }
    }

    console.error("Unrecoverable error, stopping listener");
    logger.log("lost connection to switch", "error", new Promise((resolve) => this.device.addEventListener("disconnect", resolve)));
    this.isListening = false;
    INSTALLATION_MODE.delete("SWITCH");
    return false;
  }

  /**
   * Sleeps for a specified number of milliseconds.
   * @param {number} ms - Number of milliseconds to sleep.
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Displays an alert message.
   * @param {string} message - Message to display.
   */
  alert(message, status) {
    const alert = document.createElement("p");
    alert.classList.add("alert");
    alert.classList.add(status);
    alert.innerText = message;
    document.getElementById("alert-wrapper").appendChild(alert);
    setTimeout(() => alert.classList.add("fade-out"), 1500 - 300);
    setTimeout(() => alert.remove(), 1500);
  }
}

/**
 * Connects to the switch and starts listening.
 * @returns {Promise<void>}
 */
async function connectAndListen() {
  try {
    // Request device
    const device = await navigator.usb.requestDevice({
      filters: [{ vendorId, productId }],
    });
    console.log(device);
    

    await device.open();

    if (device.configuration === null)
      await device.selectConfiguration(configuration);

    await device.claimInterface(deviceInterface);

    // Start listener with handshake
    const listener = new RotarySwitchListener(device);
    await listener.start();

    window.rotaryListener = listener;
  } catch (error) {
    console.error("Connection failed:", error);
    logger.log("failed to establish usb connection", "error");
  }
}
