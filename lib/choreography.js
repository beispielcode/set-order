// import { converter } from "culori";

const AxesMap = new Map();

const OKLCH = culori.converter("oklch");

/**
 *
 * @param {number} deltaTime
 * @returns {Map<string, Axis>}
 */
function updateAxes(deltaTime = 0.016) {
  if (
    !deltaTime ||
    deltaTime === 0 ||
    deltaTime === Infinity ||
    isNaN(deltaTime)
  ) {
    console.warn("Invalid deltaTime value:", deltaTime);
    return AxesMap;
  }
  deltaTime = Math.max(1e-6, deltaTime);
  AxesMap.forEach((axis) => axis.update(deltaTime));

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

    this.value = channels[index] ? parseInt(channels[index]) : 0;
    this.targetValue = channels[index] ? parseInt(channels[index]) : 0;
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
      this.value = cap(
        this.dynamics.update(deltaTime, this.targetValue),
        this.min,
        this.max
      );
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
    else
      this.targetValue = this.positions.reduce(
        (acc, pos) =>
          acc.bestMatch <= pos && value >= pos
            ? { value, bestMatch: pos }
            : acc,
        { value: cap(value, this.min, this.max), bestMatch: 0 }
      ).bestMatch;
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

    // Initialize the axes or retrieve them from the axes map
    this.axesIds = this.axes.map((_, index) => {
      const axis = new Axis(
        this.axes[index],
        this.transitions[index],
        this.controlPoints,
        this.dynamicContants[index]
      );
      if (!AxesMap.has(axis.id)) AxesMap.set(axis.id, axis);
      return axis.id;
    });

    // Sanitise the control points' values
    this.controlPoints = this.sanitizeControlPoints(this.controlPoints);

    // Project scattered control points onto a grid
    this.dimensions = this.axes.length;
    this.controlPoints = this.projectControlPoints();

    // current position and value:
    this.position = new Array(this.axes.length).fill(0);
    this.value = initialValue || this.controlPoints[0].value;

    // Verify that the attribute is not already defined
    if (this.parent.hasOwnProperty(this.attribute)) {
      console.warn(`Attribute ${this.attribute} already defined`);
      return;
    }
    // Dynamically define a getter for the attribute name
    Object.defineProperty(this.parent, this.attribute, {
      get: () => this.value,
      configurable: true,
    });
  }

  /**
   * Computes a grid of interpolation points from the scattered control points.
   * @returns {Array<{ position: number[], value: number }>}
   */
  projectControlPoints() {
    // First, collect all unique coordinate values along each axis
    const intersections = this.axes.map((axis) => {
      // Get all unique values for this axis
      const values = [
        ...new Set(this.controlPoints.map((point) => point.position[axis])),
      ];
      return values.sort((a, b) => a - b);
    });

    this.axesDivisions = intersections.map((arr) => arr.length);

    // Create the cartesian product of all axis values
    function createGrid(dimensions) {
      // Base case
      if (dimensions.length === 0) return [[]];

      const result = [];
      const restGrid = createGrid(dimensions.slice(1));

      for (const value of dimensions[0]) {
        for (const combination of restGrid) {
          result.push([value, ...combination]);
        }
      }

      return result;
    }

    const gridPoints = createGrid(intersections);

    // For each grid point, find the nearest control point
    const newControlPoints = gridPoints.map((gridPoint) => {
      // Convert grid coordinates to original space coordinates
      const position = gridPoint.map((value, i) => value);

      // Find the best matching control point
      let bestPoint = null;
      let bestDistance = Infinity;

      for (const controlPoint of this.controlPoints) {
        // Calculate distance in the original space, prioritizing axes in order
        let distance = 0;
        let continueToNextPoint = false;

        for (let i = 0; i < this.axes.length; i++) {
          const axis = this.axes[i];
          const axisIndex = this.axes.indexOf(axis);
          const pointCoord = controlPoint.position[axis];
          const gridCoord = position[axisIndex];

          const axisDist = Math.abs(pointCoord - gridCoord);

          // If we already have a better point and this axis is worse, skip
          if (bestPoint && axisDist > distance) {
            continueToNextPoint = true;
            break;
          }

          // Weighted distance - earlier axes have higher priority
          distance += axisDist * Math.pow(10, this.axes.length - i);
        }

        if (continueToNextPoint) continue;

        if (distance < bestDistance) {
          bestDistance = distance;
          bestPoint = controlPoint;
        }
      }

      return {
        // value: bestPoint.value,
        ...bestPoint,
        position: position,
      };
    });
    return newControlPoints;
  }

  sanitizeControlPoints(controlPoints) {
    // check for coherent value types
    function getType(value) {
      try {
        const isColor = OKLCH(value);
        switch (typeof value) {
          case "number":
            if (isNaN(value)) return { type: "number", value: 0 };
            if (value === Infinity)
              return { type: "number", value: Number.MAX_VALUE };
            return { type: "number", value: value };
            break;
          case "string":
            if (isColor) return { type: "colour", value: isColor };
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
            if (isColor) return { type: "colour", value: isColor };
            return {
              type: "object",
              keys: Object.keys(value).map((key) => key),
              value: Object.values(value).map(getType),
            };
            break;
          default:
            throw new Error(
              `Unknown value type '${typeof value}' for value '${value}'.`
            );
        }
      } catch (error) {
        console.warn(error);
      }
    }
    function areEqual(a, b) {
      if (a.type === "array" && a.type === "object")
        return (
          a.value.length === b.value.length &&
          a.value.reduce((acc, v, i) => acc && areEqual(v, b.value[i]), true)
        );
      return a.type === b.type;
    }
    const typeObjectTemplate = getType(controlPoints[0].value);
    const sanitizedControlPoints = [];
    controlPoints.forEach((point) => {
      const typeObject = getType(point.value);
      typeObject;
      if (!areEqual(typeObjectTemplate, typeObject)) {
        typeObject.type = typeObjectTemplate.type;
        typeObject.value = typeObjectTemplate.value;
        typeObject.keys =
          typeObject.type === "object" ? typeObjectTemplate.keys : null;
      }
      sanitizedControlPoints.push({
        position: point.position,
        ...typeObject,
      });
    });
    return sanitizedControlPoints;
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
    return this.nLinearInterpolate(this.controlPoints, pos);
  }
  /**
   * N-linear interpolation for numbers, arrays, and hex colours.
   * Supports 1-4 dimensional position vectors.
   * @param {Array<{ position: number[], value: number|number[]|string }>} controlPoints
   * @param {number[]} query - The N-dimensional query point (1-4 dimensions).
   * @returns {number|number[]|string} - Interpolated value in the same format as input values
   */
  nLinearInterpolate(controlPoints, query, options = {}) {
    // Validate inputs (keep your existing validation code)
    if (!controlPoints || controlPoints.length === 0) {
      throw new Error("Control points array cannot be empty");
    }

    if (!query || !Array.isArray(query)) {
      throw new Error("Query must be an array of coordinates");
    }

    const dimensions = query.length;
    if (dimensions < 1 || dimensions > 4) {
      throw new Error("Query must have between 1 and 4 dimensions");
    }

    // Ensure all control points have the correct dimension
    for (const cp of controlPoints) {
      if (!cp.position || cp.position.length !== dimensions) {
        throw new Error(
          `All control points must have ${dimensions} dimensions`
        );
      }
    }

    function applyFunction(a, b, fn) {
      if (a.type === "array" || a.type === "object")
        return {
          ...a,
          value: a.value.map((v, i) =>
            applyFunction(v, b.type ? b.value[i] : b, fn)
          ),
        };
      if (a.type === "colour") {
        return {
          ...a,
          value: {
            ...a.value,
            l: applyFunction(a.value.l ?? 0, b.type ? b.value.l ?? 0 : b, fn),
            c: applyFunction(a.value.c ?? 0, b.type ? b.value.c ?? 0 : b, fn),
            h: applyFunction(a.value.h ?? 0, b.type ? b.value.h ?? 0 : b, fn),
          },
        };
      }

      if (a.type === "number")
        return {
          ...a,
          value: fn(a.value, b.type ? b.value : b),
        };
      return fn(a, b);
    }

    function fomrmattedResult(value) {
      if (value.type === "colour") return culori.formatHex(value.value);
      if (value.type === "array") return value.value.map(fomrmattedResult);
      if (value.type === "object")
        return Object.fromEntries(
          value.keys.map((k, i) => [k, fomrmattedResult(value.value[i])])
        );
      return value.value;
    }

    // Find the hypercube vertices that contain the query point
    // For n-linear interpolation, we need 2^n vertices of the hypercube

    // First, find the unique coordinate values in each dimension
    const uniqueCoords = Array(dimensions)
      .fill()
      .map(() => new Set());

    for (const cp of controlPoints) {
      for (let d = 0; d < dimensions; d++) {
        uniqueCoords[d].add(cp.position[d]);
      }
    }

    // Convert sets to sorted arrays
    const coordArrays = uniqueCoords.map((set) =>
      Array.from(set).sort((a, b) => a - b)
    );

    // Find the lower and upper bounds for each dimension
    const lowerIndices = Array(dimensions);
    const upperIndices = Array(dimensions);
    const factors = Array(dimensions);

    for (let d = 0; d < dimensions; d++) {
      const coords = coordArrays[d];

      // Find the position of the query in this dimension
      let lowerIndex = 0;
      while (
        lowerIndex < coords.length - 1 &&
        coords[lowerIndex + 1] <= query[d]
      ) {
        lowerIndex++;
      }

      // If query is outside the grid, clamp to the nearest point
      if (lowerIndex === coords.length - 1) {
        lowerIndex = coords.length - 2;
        if (lowerIndex < 0) lowerIndex = 0;
      }

      const upperIndex = Math.min(lowerIndex + 1, coords.length - 1);

      lowerIndices[d] = lowerIndex;
      upperIndices[d] = upperIndex;

      // Calculate interpolation factor for this dimension
      const lowerCoord = coords[lowerIndex];
      const upperCoord = coords[upperIndex];

      // Prevent division by zero
      if (upperCoord === lowerCoord) {
        factors[d] = 0;
      } else {
        factors[d] = (query[d] - lowerCoord) / (upperCoord - lowerCoord);
      }
    }

    // Generate all vertices of the hypercube (2^n vertices)
    function generateVertices(dim, currentPosition = []) {
      if (dim === dimensions) {
        // Find the control point with this position
        const position = currentPosition.slice();
        return controlPoints.find((cp) =>
          position.every((val, idx) => val === cp.position[idx])
        );
      }

      const lowerPos = [
        ...currentPosition,
        coordArrays[dim][lowerIndices[dim]],
      ];
      const upperPos = [
        ...currentPosition,
        coordArrays[dim][upperIndices[dim]],
      ];

      return [
        generateVertices(dim + 1, lowerPos),
        generateVertices(dim + 1, upperPos),
      ];
    }

    // Get hypercube vertices
    const vertices = generateVertices(0);

    // Perform n-linear interpolation recursively
    function interpolateRecursive(vertices, dim) {
      if (dim === dimensions) {
        return vertices;
      }

      const factor = factors[dim];

      if (Array.isArray(vertices[0]) && Array.isArray(vertices[1])) {
        // Recursively interpolate lower dimensions
        const lowerResult = interpolateRecursive(vertices[0], dim + 1);
        const upperResult = interpolateRecursive(vertices[1], dim + 1);

        // Interpolate between the results
        return applyFunction(
          lowerResult,
          upperResult,
          (a, b) => a * (1 - factor) + b * factor
        );
      } else {
        // Base case: interpolate between two control points
        return applyFunction(
          vertices[0],
          vertices[1],
          (a, b) => a * (1 - factor) + b * factor
        );
      }
    }

    const result = interpolateRecursive(vertices, 0);
    return fomrmattedResult(result);
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

    // Kepp original attribute instructions
    // for restoring later
    this.attributeInstructions = attributeConfigs;
    this.attributeConfigs = attributeConfigs.map(
      (config) => new AttributeConfig(this, config)
    );
    this.attributeLoaded = true;

    this.render = renderFn.bind(this);

    return this;
  }

  /**
   * Updates the animated element and axesMap.
   */
  update() {
    this.attributeConfigs.forEach((attribute) => attribute.update());
    this.render();
  }

  /**
   * Unloads the attributes from memory.
   */
  unloadAttributes() {
    if (this.attributeLoaded)
      this.attributeConfigs.forEach(
        (attribute) => delete this[attribute.attribute]
      );
    this.attributeConfigs = null;
    this.attributeLoaded = false;
  }

  /**
   * Restores the original attribute instructions.
   */
  restoreAttributes() {
    if (this.attributeLoaded) return;
    this.attributeConfigs = this.attributeInstructions.map(
      (config) => new AttributeConfig(this, config)
    );
    this.attributeLoaded = true;
  }
}

class Scene {
  /**
   * @param {string} name - Name of the scene.
   * @param {Group} sceneGroup - Group containing the scene elements.
   * @param {Choreography[]} choreographies - Array of choreographies for the scene.
   */
  constructor(name, sceneGroup, choreographies) {
    this.name = name;
    this.sceneGroup = sceneGroup;
    this.choreographies = choreographies;
    this.isPaused = true;
  }

  /**
   * Updates the animated element and axesMap.
   */
  update() {
    if (this.isPaused) return;
    this.choreographies.forEach((choreography) => choreography.update());
  }

  /**
   * Pauses the animation.
   */
  pause() {
    this.isPaused = true;
    this.unloadAttributes();
  }

  /**
   * Resumes the animation.
   */
  resume() {
    this.restoreAttributes();
    this.isPaused = false;
  }

  /**
   * Unloads the attributes from memory.
   */
  unloadAttributes() {
    this.choreographies.forEach((choreography) =>
      choreography.unloadAttributes()
    );
  }

  /**
   * Restores the original attribute instructions.
   */
  restoreAttributes() {
    this.choreographies.forEach((choreography) =>
      choreography.restoreAttributes()
    );
  }
}
