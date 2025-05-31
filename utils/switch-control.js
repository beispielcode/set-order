window.addEventListener("keydown", (event) => {
  if (event.key === "c") connectAndListen();
});

class RotarySwitchListener {
  constructor(device) {
    this.device = device;
    this.isListening = false;
    this.lastValue = null;
    this.debounceTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;

    this.sketchArray = [
      "quantisation",
      "color-fullscreen",
      "interpolation-gradient",
    ];
  }

  async start() {
    if (this.isListening) return;

    // Perform handshake before starting main loop
    if (await this.performHandshake()) {
      this.isListening = true;
      this.readLoop();
    } else {
      console.error("Failed to establish handshake");
    }
  }

  async performHandshake() {
    console.log("Attempting handshake...");

    try {
      // Send a handshake message
      const handshakeMessage = "HANDSHAKE\n";
      const encoder = new TextEncoder();
      await this.device.transferOut(1, encoder.encode(handshakeMessage));

      // Wait for response with timeout
      const response = await this.waitForResponse(5000); // 5 second timeout

      if (response && response.includes("READY")) {
        console.log("Handshake successful:", response);
        return true;
      } else if (response && response.includes("HEARTBEAT")) {
        console.log("Heartbeat received:", response);
        return true;
      } else {
        console.warn("Unexpected handshake response:", response);
        return false;
      }
    } catch (error) {
      console.error("Handshake failed:", error);
      return false;
    }
  }

  async waitForResponse(timeout = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const result = await this.device.transferIn(1, 64);
        const decoder = new TextDecoder();
        const response = decoder.decode(result.data).trim();

        if (response) {
          return response;
        }
      } catch (error) {
        // Ignore timeout errors during handshake
        if (error.name !== "NetworkError") {
          throw error;
        }
      }

      await this.sleep(100); // Small delay between attempts
    }

    throw new Error("Handshake timeout");
  }

  stop() {
    this.isListening = false;
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }

  async readLoop() {
    while (this.isListening) {
      try {
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
        if (await this.handleError(error)) {
          continue; // Try again
        } else {
          break; // Stop listening
        }
      }
    }
  }

  handleData(data) {
    const value = parseInt(data);

    // Validate the received value
    if (![1, 2, 3].includes(value)) {
      console.warn("Invalid value received:", data);
      return;
    }

    // Debounce rapid changes
    if (this.lastValue === value) {
      return; // Ignore duplicate values
    }

    // Clear any pending debounce
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Debounce the switch change
    this.debounceTimeout = setTimeout(() => {
      this.lastValue = value;
      console.log("Message detected:", value);
      console.log("Switching to sketch:", this.sketchArray[value - 1]);

      // Load the new sketch
      sketchLoader.loadSketch(this.sketchArray[value - 1]);
    }, 50); // 50ms debounce
  }

  async handleError(error) {
    // Check if it's a recoverable error
    if (error.name === "NetworkError" || error.name === "NotFoundError") {
      this.reconnectAttempts++;

      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        console.log(
          `Attempting to recover... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
        await this.sleep(1000 * this.reconnectAttempts); // Exponential backoff
        return true; // Continue trying
      }
    }

    console.error("Unrecoverable error, stopping listener");
    this.isListening = false;
    return false;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

async function connectAndListen() {
  try {
    // Request device
    const device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 0x0525, productId: 0xa4a7 }],
    });

    await device.open();

    if (device.configuration === null) {
      await device.selectConfiguration(2);
    }

    await device.claimInterface(1);

    // Start listener with handshake
    const listener = new RotarySwitchListener(device);
    await listener.start();

    window.rotaryListener = listener;
  } catch (error) {
    console.error("Connection failed:", error);
  }
}
