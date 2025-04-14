// Second order dynamics implementation
// Inspired by the beautiful work of @t3ssel8r (https://www.youtube.com/watch?v=KPoeNZZ6H4s)
class SecondOrderDynamics {
  /**
   * Constructor to initialise the dynamics constants and state variables.
   * @description Initialises the dynamics constants and state variables.
   * @param {number|Array|Object} x0 Initial value.
   * @param {Object|null} dynamicContants Object containing the dynamic constants. Defaults to { f: 2.25, z: 1, r: 0 }.
   */
  constructor(x0, dynamicContants) {
    /**
     * @param {number} f - Frequency (how fast the system reacts).
     * @param {number} z - Damping ratio (controls oscillations).
     * @param {number} r - Responsiveness (how quickly the system reacts to changes).
     */
    const { f = 2.25, z = 1, r = 0 } = dynamicContants || {};
    // Compute constants
    this.k1 = z / (Math.PI * f);
    this.k2 = 1 / (2 * Math.PI * f * (2 * Math.PI * f));
    this.k3 = (r * z) / (2 * Math.PI * f);

    // Initialise variables
    this.type = this.getType(x0); // Determine the type of the input
    this.xp = this.clone(x0); // Previous input
    this.y = this.clone(x0); // Current position
    this.yd = this.cloneZero(x0); // Current velocity

    // For nested structures, create child dynamics objects
    if (this.type === "array") {
      this.children = x0.map((v) => new SecondOrderDynamics(f, z, r, v));
    } else if (this.type === "object") {
      this.children = Object.fromEntries(
        Object.entries(x0).map(([key, v]) => [
          key,
          new SecondOrderDynamics(f, z, r, v),
        ])
      );
    } else if (this.type === "colour") {
      this.children = this.hexToRgb(x0).map(
        (v) => new SecondOrderDynamics(f, z, r, v)
      );
    }
  }

  /**
   * Determine the type of a value.
   * @param {any} value - Value to check.
   * @returns {string} - Type of the value ("number", "array", "object", "colour").
   */
  getType(value) {
    if (Array.isArray(value)) return "array";
    if (typeof value === "object" && value !== null) return "object";
    if (typeof value === "string" && value.match(/^#[0-9a-fA-F]{6}$/i))
      return "colour";
    if (typeof value === "number") return "number";
    return "unknown";
  }

  /**
   * Clone a value (handles numbers, arrays, and objects).
   * @param {number|Array|Object} value - Value to clone.
   * @returns {number|Array|Object} - Cloned value.
   */
  clone(value) {
    if (Array.isArray(value)) {
      return value.map((v) => this.clone(v));
    } else if (typeof value === "object" && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([key, v]) => [key, this.clone(v)])
      );
    }
    return value; // For numbers or other primitive types
  }

  /**
   * Create a zeroed version of a value (handles numbers, arrays, and objects).
   * @param {number|Array|Object} value - Value to zero.
   * @returns {number|Array|Object} - Zeroed value.
   */
  cloneZero(value) {
    if (Array.isArray(value)) {
      return value.map(() => 0);
    } else if (typeof value === "object" && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([key]) => [key, this.cloneZero(value[key])])
      );
    }
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
    if (this.getType(x) !== this.type) return this.y;

    // Handle arrays recursively
    if (this.type === "array") {
      return x.map((v, i) => this.children[i].update(T, v, xd ? xd[i] : null));
    }

    // Handle objects recursively
    if (this.type === "object") {
      const updatedObject = {};
      for (const key in x) {
        updatedObject[key] = this.children[key].update(
          T,
          x[key],
          xd ? xd[key] : null
        );
      }
      return updatedObject;
    }

    // Handle numbers (base case)
    if (this.type === "number") {
      if (xd === null) {
        // Estimate velocity if not provided
        xd = (x - this.xp) / T;
        this.xp = x;
      }

      // Integrate position by velocity
      this.y += T * this.yd;

      // Integrate velocity by acceleration
      this.yd +=
        T * ((x + this.k3 * xd - this.y - this.k1 * this.yd) / this.k2);

      return this.y; // Return the updated position
    }

    // Handle colours (base case)
    if (this.type === "colour") {
      const rgb = this.hexToRgb(x); // Convert hex to RGB
      const updatedRgb = this.children.map((child, i) =>
        child.update(T, rgb[i], xd ? xd[i] : null)
      );
      return this.rgbToHex({
        r: updatedRgb[0],
        g: updatedRgb[1],
        b: updatedRgb[2],
      });
    }

    // Return the target value for unsupported types
    return x;
  }

  // TODO: Add support for other color formats (Colori.js or tinycolor2?)

  /**
   * Convert a hex colour to an RGB object.
   * @param {string} hex - Hex colour string.
   * @returns {Object} - RGB object { r, g, b }.
   */
  hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }

  /**
   * Convert an RGB object to a hex colour string.
   * @param {Object} rgb - RGB object { r, g, b }.
   * @returns {string} - Hex colour string.
   */
  rgbToHex(rgb) {
    const r = Math.round(rgb.r).toString(16).padStart(2, "0");
    const g = Math.round(rgb.g).toString(16).padStart(2, "0");
    const b = Math.round(rgb.b).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
}
