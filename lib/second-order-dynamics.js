/**
 * Second order dynamics class
 * Based on the work of @t3ssel8r (https://www.youtube.com/watch?v=KPoeNZZ6H4s)
 */

// === CONSTANTS ===
const SOD_OKLCH = culori.converter("oklch");

// === SECOND ORDER DYNAMICS CLASS ===
// Class to manage the second-order dynamics of an attribute or value
// Warning: Untested colour implementation
class SecondOrderDynamics {
  /**
   * Constructor to initialise the dynamics constants and state variables.
   * @description Initialises the dynamics constants and state variables.
   * @param {number|Array|Object} x0 Initial value.
   * @param {Object|null} dynamicContants Object containing the dynamic constants. Defaults to { f: 2.25, z: 1, r: 0 }.
   * @param {number} dynamicContants.f - Frequency (how fast the system reacts).
   * @param {number} dynamicContants.z - Damping ratio (controls oscillations).
   * @param {number} dynamicContants.r - Responsiveness (how quickly the system reacts to changes).
   * @returns {SecondOrderDynamics}
   */
  constructor(x0, dynamicContants) {
    const { f = 2.25, z = 1, r = 0 } = dynamicContants || {};
    // Compute constants
    this.k1 = z / (Math.PI * f);
    this.k2 = 1 / (2 * Math.PI * f * (2 * Math.PI * f));
    this.k3 = (r * z) / (2 * Math.PI * f);

    // Calculate the critical time for the system
    this.tCrit = 0.8 * (Math.sqrt(4 * this.k2 + this.k1 * this.k1) - this.k1);

    // Initialise variables
    this.type = this.getType(x0); // Determine the type of the input
    this.xp = this.clone(x0); // Previous input
    this.y = this.clone(x0); // Current position
    this.yd = this.cloneZero(x0); // Current velocity

    // For nested structures, create child dynamics objects
    if (this.type === "array")
      this.children = x0.map((v) => new SecondOrderDynamics(f, z, r, v));
    else if (this.type === "object")
      this.children = Object.fromEntries(
        Object.entries(x0).map(([key, v]) => [
          key,
          new SecondOrderDynamics(f, z, r, v),
        ])
      );
    else if (this.type === "colour")
      this.children = SOD_OKLCH(x0).map(
        (v) => new SecondOrderDynamics(f, z, r, v)
      );
    return this;
  }

  /**
   * Checks the type of a value.
   * @param {any} value - Value to check.
   * @returns {object} - Type of the value ("number", "array", "object", "colour").
   */
  getType(value) {
    try {
      const isColor = SOD_OKLCH(value);
      switch (typeof value) {
        case "number":
          return "number";
          break;
        case "string":
          if (isColor) return "colour";
          throw new Error(
            `String value '${value}' could not be parsed as a colour.`
          );
          break;
        case "object":
          if (Array.isArray(value))
            return {
              type: "array",
              value: value.map(getType),
            };
          if (isColor) return "colour";
          return "object";
          break;
        default:
          throw new Error(
            `Unknown value type '${typeof value}' for value '${value}'.`
          );
          break;
      }
    } catch (error) {
      console.warn(error);
      return "unknown";
    }
  }

  /**
   * Clone a value (handles numbers, arrays, and objects).
   * @param {number|Array|Object} value - Value to clone.
   * @returns {number|Array|Object} - Cloned value.
   */
  clone(value) {
    if (Array.isArray(value)) return value.map((v) => this.clone(v));
    else if (typeof value === "object" && value !== null)
      return Object.fromEntries(
        Object.entries(value).map(([key, v]) => [key, this.clone(v)])
      );
    return value; // For numbers or other primitive types
  }

  /**
   * Create a zeroed version of a value (handles numbers, arrays, and objects).
   * @param {number|Array|Object} value - Value to zero.
   * @returns {number|Array|Object} - Zeroed value.
   */
  cloneZero(value) {
    if (Array.isArray(value)) return value.map(() => 0);
    else if (typeof value === "object" && value !== null)
      return Object.fromEntries(
        Object.entries(value).map(([key]) => [key, this.cloneZero(value[key])])
      );
    return 0; // For numbers or other primitive types
  }

  /**
   * Update the position and velocity using second-order dynamics.
   * @param {number} T - Time step (delta time).
   * @param {number|Array|Object} x - Current input position.
   * @param {number|Array|Object|null} xd - Current input velocity (optional).
   * @returns {number|Array|Object} - Updated position.
   */
  update(T, x, xd = null) {
    // Prevents NaN values
    if (this.getType(x) !== this.type) return this.y;

    // Handle arrays recursively
    if (this.type === "array")
      return x.map((v, i) => this.children[i].update(T, v, xd ? xd[i] : null));

    // Handle objects recursively
    if (this.type === "object") {
      const updatedObject = {};
      for (const key in x)
        updatedObject[key] = this.children[key].update(
          T,
          x[key],
          xd ? xd[key] : null
        );
      return updatedObject;
    }

    // Handle numbers
    if (this.type === "number") {
      if (xd === null) {
        // Estimate velocity if not provided
        xd = (x - this.xp) / T;
        this.xp = x;
      }
      const interations = Math.ceil(T / this.tCrit); // take extra iterations if T > tCrit
      T = T / interations; // each iteration now has a smaller step
      for (let i = 0; i < interations; i++) {
        // Integrate position by velocity
        this.y += T * this.yd;
        // Integrate velocity by acceleration
        this.yd +=
          T * ((x + this.k3 * xd - this.y - this.k1 * this.yd) / this.k2);
      }
      return this.y; // Return the updated position
    }

    // Handle colours in oklch format
    if (this.type === "colour") {
      const newOklch = OKLCH(x);
      return {
        ...newOklch,
        l: this.children[0].update(T, newOklch.l, xd ? xd[0] : null),
        c: this.children[1].update(T, newOklch.c, xd ? xd[1] : null),
        h: this.children[2].update(T, newOklch.h, xd ? xd[2] : null),
      };
    }

    // Return the target value for unsupported types
    return x;
  }
}
