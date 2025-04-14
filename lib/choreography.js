class Axis {
  /**
   * @param {number} index - Index of the axis.
   * @param {string} type - Transition type for the axis.
   * @param {number[]|number[][]|Array<{ position: number[], value: number }>} positions - Positions of the axis.
   */
  constructor(index, type, positions) {
    this.index = index;
    this.value = 0;
    this.targetValue = 0;
    this.type = type;

    this.positions = positions.map((pos) => {
      const type = typeof pos;
      if (type == "number" && !isNaN(pos)) return pos;
      if (type == "array" && !isNaN(pos[index])) return pos[index];
      if (type == "object" && !isNaN(pos.position[index]))
        return pos.position[index];
      return 0;
    });
    this.min = Math.min(...this.positions);
    this.max = Math.max(...this.positions);
    if (this.type != "steps")
      this.dynamics = new SecondOrderDynamics(this.value);
    this.id =
      this.type == "smooth"
        ? `axis-${index}-${type}-${this.min}-${this.max}`
        : `axis-${index}-${type}-${this.positions.join("-")}`;
    return this;
  }

  /**
   * @param {number} deltaTime - Delta time for the animation.
   * @returns {number} - Updated value of the axis.
   */
  update(deltaTime) {
    if (this.type != "steps")
      this.value = this.dynamics.update(deltaTime, this.targetValue);
    return this.value;
  }

  /**
   * @param {number} value - Value to update the axis.
   * @returns {Axis} - Updated axis object.
   */
  updateValue(value) {
    // For smooth transitions, cap value to the range of the control points
    if (this.type == "smooth")
      this.targetValue = cap(value, this.min, this.max);
    // For threshold and step transitions, round to closest control point position smaller than the value
    else {
      this.targetValue = this.positions.reduce(
        (acc, pos, index) =>
          acc.bestMatch <= pos && value >= pos
            ? { value, bestMatch: pos }
            : acc,
        { value: cap(value, this.min, this.max), bestMatch: 0 }
      ).bestMatch;
    }
    if (this.type == "steps") this.value = this.targetValue;
    return this;
  }
}

class AttributeConfig {
  /**
   * @param {Object} parent - Parent object for the attribute.
   * @param {Object} config - Configuration object for the attribute.
   * @param {string} config.attribute - Name of the attribute (e.g. "width").
   * @param {number[]} config.axes - Array of fader indices (e.g. [0, 1]).
   * @param {string[]} config.transitions - Interpolation styles per axis
   *   (e.g. ["smooth", "threshold"]).
   * @param {Array<{ position: number[], value: number }>} config.controlPoints -
   *   Array of control point objects. Each control point must include a
   *   position (an array matching the length of axes) and the target value.
   * @param {number} initialValue - Initial value of the attribute.
   */
  constructor(parent, config, initialValue) {
    this.parent = parent;
    this.attribute = config.attribute || "width";
    this.axes = config.axes || [];
    this.transitions = config.transitions || []; // for each axis

    this.controlPoints = config.controlPoints || [];
    this.axesIds = this.axes.map((_, index) => {
      const axis = new Axis(
        this.axes[index],
        this.transitions[index],
        this.controlPoints
      );
      if (this.parent.axesMap.has(axis.id)) return axis.id;
      this.parent.axesMap.set(axis.id, axis);
      return axis.id;
    });
    // current position and value:
    this.position = new Array(this.axes.length).fill(0);
    this.value = initialValue || this.controlPoints[0].value;

    // Verify that the attribute is not already defined
    if (this.parent.hasOwnProperty(this.attribute)) {
      console.error(`Attribute ${this.attribute} already defined`);
      return;
    }
    // Dynamically define a getter for the attribute name
    Object.defineProperty(this.parent, this.attribute, {
      get: () => this.value,
    });
  }

  /**
   * Updates the attribute value based on the current position of the axes.
   * @returns {number} - The interpolated attribute value.
   */
  update() {
    const pos = this.axesIds.map((axisId) => {
      const axis = this.parent.axesMap.get(axisId);
      return axis.value;
    });

    this.position = pos;
    this.value = this.computeValue(pos);

    return this.value;
  }

  /**
   * Computes the interpolated value from the current control points
   * at the given position, using a multidimensional interpolation function
   *
   * @param {number[]} pos - N-dimensional position extracted from the faders.
   * @returns {number} - The interpolated value.
   */
  computeValue(pos) {
    return this.multidimensionalInverseDistanceInterpolation(
      this.controlPoints.map((cp) => {
        const position = this.axes.map((axis) => cp.position[axis]);
        return { position, value: cp.value };
      }),
      pos
    );
  }

  /**
   * Computes an interpolated value at a given query position from a set of control points,
   * using inverse distance weighting.
   *
   * @param {Array<{ position: number[], value: number }>} controlPoints - Control points with positions and values.
   * @param {number[]} query - The query point in N-dimensional space.
   * @param {number} power - The power parameter for the inverse distance weighting (default 2).
   * @returns {number} - The interpolated value.
   */
  multidimensionalInverseDistanceInterpolation(
    controlPoints,
    query,
    power = 2
  ) {
    const hexToRgb = (hex) => {
      const bigint = parseInt(hex.slice(1), 16);
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

    const rgbToHex = (rgb) => {
      const r = Math.round(rgb[0]).toString(16).padStart(2, "0");
      const g = Math.round(rgb[1]).toString(16).padStart(2, "0");
      const b = Math.round(rgb[2]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    };
    let valueIsHex = false;
    let weightedSum = 0;
    if (typeof controlPoints[0].value == "array")
      weightedSum = new Array(controlPoints[0].value.length).fill(0);
    else if (typeof controlPoints[0].value == "string") {
      controlPoints.forEach((cp) => {
        cp.value = hexToRgb(cp.value);
      });
      weightedSum = [0, 0, 0];
      valueIsHex = true;
    }
    let totalWeight = 0;

    const add = (a, b) => {
      if (Array.isArray(a) && Array.isArray(b))
        return a.map((v, i) => add(v, b[i]));
      return a + b;
    };

    const multiply = (a, b) => {
      if (Array.isArray(a) && typeof b === "number")
        return a.map((v) => multiply(v, b));
      return a * b;
    };

    for (const cp of controlPoints) {
      // Calculate Euclidean distance between cp.position and query

      let distanceSq = 0;
      for (let i = 0; i < cp.position.length; i++)
        distanceSq += (query[i] - cp.position[i]) ** 2;

      const distance = Math.sqrt(distanceSq);

      // Avoid division by zero; if we're exactly on a control point, return its value.
      if (distance < 1e-6) return valueIsHex ? rgbToHex(cp.value) : cp.value;

      const weight = 1 / distance ** power;

      weightedSum = add(weightedSum, multiply(cp.value, weight));
      totalWeight += weight;
    }

    // Return the weighted average
    if (valueIsHex) return rgbToHex(multiply(weightedSum, 1 / totalWeight));
    return multiply(weightedSum, 1 / totalWeight);
  }
}

class Choreography {
  /**
   * @param {Object} element - The object being animated.
   * @param {Array} attributeConfigs - Array of configuration objects for each attribute.
   * @param {Function} renderFn - Function to render the animated element.
   */
  constructor(element, attributeConfigs, renderFn) {
    this.element = element;

    // Create a map to store the axes for each attribute
    this.axesMap = new Map();
    this.attributeConfigs = attributeConfigs.map(
      (config) => new AttributeConfig(this, config)
    );

    this.render = renderFn.bind(this);

    return this;
  }

  /**
   * Updates the animated element and axesMap.
   * @param {number} deltaTime - Delta time for the animation.
   */
  update(deltaTime = 0.016) {
    this.axesMap.forEach((axis, index) => axis.update(deltaTime));
    this.attributeConfigs.forEach((attribute) => attribute.update());
    this.render();
  }

  /**
   * Updates the axesMap and renders the animated element.
   */
  updateAxis(channelIndex, value) {
    this.axesMap.forEach((axis) => {
      if (axis.index == channelIndex) axis.updateValue(value);
    });
    return this.axesMap;
  }
}
