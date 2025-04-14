importScripts("../lib/second-order-dynamics.js");

/**
 * Map to store dynamic attribute information
 * Map structure:
 * id -> attribute -> { value, dynamics }
 * @type {Map<string, Map<string, { value: number, dynamics: SecondOrderDynamics }>>}
 */
const dynamicAttributes = new Map();

let isWorkerActive = true;

// Listen for incoming messages to manage dynamic attributes
onmessage = (e) => {
  const { type, id, attribute, value, dynamicsOptions } = e.data;
  switch (type) {
    case "init":
      // Initialize animation by setting the starting time
      previousTimestamp = performance.now();
      frameInterval = 0.16;
      startAnimationLoop();
      break;
    case "add":
      // Add a new dynamic attribute or update existing one
      if (!dynamicAttributes.has(id)) {
        dynamicAttributes.set(id, new Map());
      }
      dynamicAttributes.get(id).set(attribute, {
        value: value,
        dynamics: new SecondOrderDynamics(value, dynamicsOptions),
      });
      break;
    case "update":
      // Update the value of an existing dynamic attribute
      if (!dynamicAttributes.has(id)) {
        dynamicAttributes.set(id, new Map());
      }
      if (dynamicAttributes.get(id).has(attribute)) {
        dynamicAttributes.get(id).get(attribute).value = value;
      }
      break;
    case "pause":
      // Pause the worker, stopping updates
      isWorkerActive = false;
      break;
    case "resume":
      // Resume the worker, continuing updates
      isWorkerActive = true;
      break;
    default:
      // Valiant fallback for unexpected message types
      break;
  }
};

// Initialize animation-related variables
let previousTimestamp = performance.now();
let frameInterval = 0.16; // Default frame interval in seconds

// Animation loop to update dynamic attributes
function startAnimationLoop() {
  const currentTimestamp = performance.now();

  // Calculate the time interval since the last frame
  frameInterval = Math.min((currentTimestamp - previousTimestamp) / 1000, 0.16);

  // Update the timestamp for the next frame
  previousTimestamp = currentTimestamp;

  // Schedule the next animation frame
  requestAnimationFrame(startAnimationLoop);

  if (!isWorkerActive) return;

  // Update dynamic attributes using the frame interval
  dynamicAttributes.forEach((attributeMap) => {
    attributeMap.forEach((attributeInfo) => {
      attributeInfo.dynamics.update(frameInterval, attributeInfo.value);
    });
  });

  // Post the updated state back to the main thread
  postMessage({
    type: "updated",
    updatedAttributes: Array.from(dynamicAttributes.entries()).map(
      ([id, attributeMap]) =>
        Array.from(attributeMap.entries()).map(([attribute, attrInfo]) => ({
          id,
          attribute,
          value: attrInfo.dynamics.y,
        }))
    ),
  });
}
