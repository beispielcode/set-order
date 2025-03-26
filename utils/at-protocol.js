// npm install @ipld/car multiformats
import { CarReader } from "@ipld/car";
import { CID } from "multiformats/cid";

class ATProtocolFirehoseClient {
  constructor(
    serviceUrl = "wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos"
  ) {
    this.serviceUrl = serviceUrl;
    this.socket = null;
    this.handlers = {
      message: [],
      commit: [],
      error: [],
      open: [],
      close: [],
    };
  }

  // Connect to the firehose
  connect() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      console.log("WebSocket is already connected or connecting");
      return;
    }

    try {
      console.log(`Connecting to ${this.serviceUrl}...`);
      this.socket = new WebSocket(this.serviceUrl);

      // Set binary type to arraybuffer
      this.socket.binaryType = "arraybuffer";

      this.socket.onopen = (event) => {
        console.log("Connected to AT Protocol firehose");
        this.triggerHandlers("open", event);
      };

      this.socket.onmessage = async (event) => {
        try {
          await this.handleMessage(event.data);
        } catch (error) {
          console.error("Error processing message:", error);
          this.triggerHandlers("error", error);
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.triggerHandlers("error", error);
      };

      this.socket.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} ${event.reason}`);
        this.triggerHandlers("close", event);
      };
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      this.triggerHandlers("error", error);
    }
  }

  // Handle incoming message
  async handleMessage(data) {
    if (!(data instanceof ArrayBuffer)) {
      console.warn("Received non-binary message:", data);
      return;
    }

    try {
      // Decode the CAR file
      const carReader = await CarReader.fromBytes(new Uint8Array(data));

      // Get the roots (starting points of the DAG)
      const roots = await carReader.getRoots();
      console.log("CAR roots:", roots);

      // Iterate over the blocks in the CAR file
      for await (const { cid, bytes } of carReader.blocks()) {
        console.log("Block CID:", cid.toString());
        console.log("Block data:", new TextDecoder().decode(bytes));

        // Process the block data (e.g., parse JSON or IPLD data)
        const blockData = JSON.parse(new TextDecoder().decode(bytes));
        this.triggerHandlers("message", blockData);

        // Handle specific operations (e.g., commits, posts)
        if (blockData.op === "commit") {
          this.triggerHandlers("commit", blockData);
        }
      }
    } catch (error) {
      console.error("Error decoding CAR data:", error);
      this.triggerHandlers("error", error);
    }
  }

  // Register event handlers
  on(event, callback) {
    if (this.handlers[event]) {
      this.handlers[event].push(callback);
    } else {
      console.warn(`Unknown event type: ${event}`);
    }
    return this; // For chaining
  }

  // Trigger handlers for a specific event
  triggerHandlers(event, data) {
    if (this.handlers[event]) {
      this.handlers[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }
}
