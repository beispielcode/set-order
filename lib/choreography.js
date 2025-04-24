const AxesMap = new Map();

/**
 *
 * @param {number} deltaTime
 * @returns {Map<string, Axis>}
 */
function updateAxes(deltaTime = 0.016) {
  AxesMap.forEach((axis, index) => axis.update(deltaTime));
  return AxesMap;
}

/**
 *
 * @param {number} channelIndex
 * @param {number} value
 * @returns {Map<string, Axis>}
 */
function updateAxesValue(channelIndex, value) {
  AxesMap.forEach((axis) => {
    if (axis.index == channelIndex) axis.updateValue(value);
  });
  return AxesMap;
}

class Axis {
  /**
   * @param {number} index - Index of the axis.
   * @param {string} type - Transition type for the axis.
   * @param {number[]|number[][]|Array<{ position: number[], value: number }>} positions - Positions of the axis.
   * @param {Object|null} dynamicContants Object containing the dynamic constants. Defaults to { f: 2.25, z: 1, r: 0 }.
   */
  constructor(index, type, positions, dynamicContants = {}) {
    this.index = index;
    this.value = 0;
    this.targetValue = 0;
    this.type = type;
    this.dynamicContants = dynamicContants;

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
      this.dynamics = new SecondOrderDynamics(this.value, this.dynamicContants);
    this.id =
      this.type == "smooth"
        ? `axis-${index}-${type}-${Object.values(this.dynamicContants).join(
            "-"
          )}-${this.min}-${this.max}`
        : `axis-${index}-${type}-${Object.values(this.dynamicContants).join(
            "-"
          )}-${this.positions.join("-")}`;
    return this;
  }

  /**
   * @param {number} deltaTime - Delta time for the animation.
   * @returns {number} - Updated value of the axis.
   */
  update(deltaTime) {
    if (Math.abs(this.value - this.targetValue) < 1e-6) return this.targetValue;
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
   * @param {Object[]} config.dynamicContants - Array of dynamic constants per axis
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
    this.dynamicContants = config.dynamicContants || [];

    this.controlPoints = config.controlPoints || [];
    this.axesIds = this.axes.map((_, index) => {
      const axis = new Axis(
        this.axes[index],
        this.transitions[index],
        this.controlPoints,
        this.dynamicContants[index]
      );
      if (AxesMap.has(axis.id)) return axis.id;
      AxesMap.set(axis.id, axis);
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
      const axis = AxesMap.get(axisId);
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
    let k = this.axesIds.length + 2;
    return this.idwKnnInterpolate(
      this.controlPoints.map((cp) => ({
        position: this.axes.map((axis) => cp.position[axis]),
        value: cp.value,
      })),
      pos,
      2,
      // Math.max(2, this.controlPoints.length / 4)
      k
    );
  }

  /**
   * KNN-limited IDW interpolation for numbers, arrays, and hex colours.
   * @param {Array<{ position: number[], value: number|number[]|string }>} controlPoints
   * @param {number[]} query - The N-dimensional query point.
   * @param {number|null} power - IDW power parameter (default: 2).
   * @param {number|null} k - Number of neighbours (default: 5).
   * @param {number|null} epsilon - IDW epsilon parameter (default: 1e-6).
   * @returns {number|number[]|string}
   */
  idwKnnInterpolate(controlPoints, query, power = 2, k = 5, epsilon = 1e-6) {
    // Detect value type
    let valueType = typeof controlPoints[0].value;
    let isArray = Array.isArray(controlPoints[0].value);
    let isHex =
      valueType === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(controlPoints[0].value);

    // Convert hex to RGB arrays if needed
    let cps = controlPoints.map((cp) => ({
      position: cp.position,
      value: isHex ? hexToRgb(cp.value) : cp.value,
    }));

    // Compute distances
    const distances = cps.map((cp) => ({
      cp,
      dist: Math.sqrt(
        cp.position.reduce((sum, v, i) => sum + (query[i] - v) ** 2, 0)
      ),
    }));

    // Sort by distance and take k nearest
    distances.sort((a, b) => a.dist - b.dist);
    const nearest = distances.slice(0, k);

    // If query is exactly on a control point, return its value immediately
    if (nearest[0].dist < epsilon) {
      return isHex ? rgbToHex(nearest[0].cp.value) : nearest[0].cp.value;
    }

    // Prepare accumulator
    let weightedSum, zeroValue;
    if (isArray || isHex) {
      const len = isHex ? 3 : cps[0].value.length;
      weightedSum = new Array(len).fill(0);
      zeroValue = new Array(len).fill(0);
    } else {
      weightedSum = 0;
      zeroValue = 0;
    }
    let totalWeight = 0;

    // Interpolate
    for (const { cp, dist } of nearest) {
      const weight = 1 / Math.pow(dist + epsilon, power);
      if (isArray || isHex) {
        for (let i = 0; i < weightedSum.length; i++) {
          weightedSum[i] += cp.value[i] * weight;
        }
      } else {
        weightedSum += cp.value * weight;
      }
      totalWeight += weight;
    }

    // Avoid division by zero
    if (totalWeight === 0) {
      return isHex ? rgbToHex(zeroValue) : zeroValue;
    }

    // Final result
    if (isArray || isHex) {
      const result = weightedSum.map((v) => v / totalWeight);
      return isHex ? rgbToHex(result) : result;
    } else {
      return weightedSum / totalWeight;
    }
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
    // this.axesMap = new Map();
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
    // axesMap.forEach((axis, index) => axis.update(deltaTime));
    this.attributeConfigs.forEach((attribute) => attribute.update());
    this.render();
  }

  /**
   * Updates the axesMap and renders the animated element.
   */
  // updateAxis(channelIndex, value) {
  //   axesMap.forEach((axis) => {
  //     if (axis.index == channelIndex) axis.updateValue(value);
  //   });
  //   return this.axesMap;
  // }
}
