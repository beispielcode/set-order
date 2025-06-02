/**
 * Scene, Choreography, Attributes, and Axis classes
 * N-dimensional interpolation of attributes
 */

// === CONSTANTS ===
const AxesMap = new Map();
const AC_OKLCH = culori.converter("oklch");

// === AXES FUNCTIONS ===
/**
 * Updates the axes map with the current time delta.
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
 * Updates the axes map with a new value for a channel.
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

// === AXIS CLASS ===
// Holds the axis data and interpolation logic
class Axis {
  /**
   * @param {number} index - Index of the axis.
   * @param {string} type - Transition type for the axis. One of "smooth", "threshold", or "steps".
   * @param {number[]|number[][]|Array<{ position: number[], value: number }>} positions - Positions of the axis.
   * @param {Object|null} dynamicContants Object containing the dynamic constants. Defaults to { f: 2.25, z: 1, r: 0 }.
   * @returns {Axis}
   */
  constructor(index, type, positions, dynamicContants = {}) {
    this.index = index;
    this.type = type;
    this.dynamicContants = dynamicContants; // Dynamic constants for the axis
    // Initialise the axis value with the current channel value (if available)
    this.value = CHANNELS[index] ? parseInt(CHANNELS[index]) : 0;
    this.targetValue = CHANNELS[index] ? parseInt(CHANNELS[index]) : 0;

    // Calculate the axis positions
    this.positions = positions.map((pos) => {
      const type = typeof pos;
      if (type == "number" && !isNaN(pos)) return pos;
      if (type == "array" && !isNaN(pos[index])) return pos[index];
      if (type == "object" && !isNaN(pos.position[index]))
        return pos.position[index];
      return 0;
    });

    // Extract the minimum and maximum positions
    this.min = Math.min(...this.positions);
    this.max = Math.max(...this.positions);

    // Initialise the dynamics object for the axis
    if (this.type != "steps")
      this.dynamics = new SecondOrderDynamics(this.value, this.dynamicContants);

    // Generate a unique ID for the axis
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
  update(deltaTime = 0.016) {
    // If the target value is close to the current value, return the target value
    if (Math.abs(this.value - this.targetValue) < 1e-6) return this.targetValue;
    // Update the axis value based on the type
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

// === ATTRIBUTE CONFIG CLASS ===
// Holds the configuration for an attribute
class AttributeConfig {
  /**
   * @param {Object} parent - Parent object for the attribute.
   * @param {Object} config - Configuration object for the attribute.
   * @param {string} config.attribute - Name of the attribute (e.g. "width").
   * @param {number[]} config.axes - Array of fader indices (e.g. [0, 1]).
   * @param {string[]} config.transitions - Interpolation styles per axis
   *   (e.g. ["smooth", "threshold"]).
   * @param {Object[]} config.dynamicContants - Array of dynamic constants per axis
   * @param {Array<{ position: number[], value: number }>} config.controlPoints -
   *   Array of control point objects. Each control point must include a
   *   position (an array matching the length of axes) and the target value.
   * @param {number} initialValue - Initial value of the attribute.
   * @returns {AttributeConfig}
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

    // Initialise the current position and value
    this.position = new Array(this.axes.length).fill(0);
    this.value = initialValue || this.controlPoints[0].value;

    // Verify that the attribute is not already defined
    if (this.parent.hasOwnProperty(this.attribute)) {
      console.warn(`Attribute ${this.attribute} already defined`);
      return;
    }
    // Dynamically define a getter on the parent object for the attribute
    Object.defineProperty(this.parent, this.attribute, {
      get: () => this.value,
      configurable: true, // Allow for deletion of the attribute
    });

    return this;
  }

  /**
   * Computes a grid of interpolation points from the scattered control points.
   * @returns {Array<{ position: number[], value: number }>}
   */
  projectControlPoints() {
    // Collect all unique coordinate values along each axis
    const intersections = this.axes.map((axis) => {
      // Get all unique values for this axis
      const values = [
        ...new Set(this.controlPoints.map((point) => point.position[axis])),
      ];
      return values.sort((a, b) => a - b);
    });
    // Calculate the number of divisions along each axis
    this.axesDivisions = intersections.map((arr) => arr.length);

    /**
     * Creates the cartesian product of all axis values
     * @param {number[]} dimensions - Array of axis values
     * @returns
     */
    function createGrid(dimensions) {
      // Base case
      if (dimensions.length === 0) return [[]];

      // Recursive case
      const result = [];
      const restGrid = createGrid(dimensions.slice(1));

      for (const value of dimensions[0])
        for (const combination of restGrid)
          result.push([value, ...combination]);

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
        ...bestPoint,
        position: position,
      };
    });
    return newControlPoints;
  }

  /**
   * Sanitizes the control points by checking for coherent value types.
   * @param {Array<{ position: number[], value: number }>} controlPoints - Control points to sanitize.
   * @returns {Array<{ position: number[], value: number }>} - Sanitized control points.
   */
  sanitizeControlPoints(controlPoints) {
    /**
     * Checks the type of a value.
     * @param {any} value - Value to check.
     * @returns {object} - Type of the value ("number", "array", "object", "colour").
     */
    function getType(value) {
      try {
        const isColor = AC_OKLCH(value);
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

    /**
     * Checks if two objects are strictly equal.
     * @param {object} a - First object to compare.
     * @param {object} b - Second object to compare.
     * @returns {boolean} - Whether the objects are equal.
     */
    function areEqual(a, b) {
      if (a.type === "array" && a.type === "object")
        return (
          a.value.length === b.value.length &&
          a.value.reduce((acc, v, i) => acc && areEqual(v, b.value[i]), true)
        );
      return a.type === b.type;
    }

    // Get the type of the first control point (expected type)
    const typeObjectTemplate = getType(controlPoints[0].value);

    // Sanitize the control points
    const sanitizedControlPoints = [];
    controlPoints.forEach((point) => {
      const typeObject = getType(point.value);
      typeObject;

      // If the types are not equal, update the type and value
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
    // Retrieve the current position of the axes
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
   * at the given position, using a n-linear multidimensional interpolation function
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
   * @param {Array<{ position: number[], value: number|number[]|string }>} controlPoints - Control points to interpolate.
   * @param {number[]} query - The N-dimensional query point (1-4 dimensions).
   * @returns {number|number[]|string} - Interpolated value in the same format as input values
   */
  nLinearInterpolate(controlPoints, query) {
    // Validate inputs
    if (!controlPoints || controlPoints.length === 0)
      throw new Error("Control points array cannot be empty");
    if (!query || !Array.isArray(query))
      throw new Error("Query must be an array of coordinates");
    const dimensions = query.length;
    if (dimensions < 1 || dimensions > 4)
      throw new Error("Query must have between 1 and 4 dimensions");

    // Ensure all control points have the correct dimension
    for (const cp of controlPoints)
      if (!cp.position || cp.position.length !== dimensions)
        throw new Error(
          `All control points must have ${dimensions} dimensions`
        );

    /**
     * Recursively applies a function to an object.
     * @param {any} a - Object to apply the function to.
     * @param {any} b - Object or value to apply the function to.
     * @param {function} fn - Function to apply.
     * @returns {object} - Object with the function applied.
     */
    function applyFunction(a, b, fn) {
      if (a.type === "array" || a.type === "object")
        return {
          ...a, // Copy the object
          value: a.value.map((v, i) =>
            applyFunction(v, b.type ? b.value[i] : b, fn)
          ),
        };
      if (a.type === "colour")
        return {
          ...a, // Copy the object
          value: {
            ...a.value, // Copy the colour object
            l: applyFunction(a.value.l ?? 0, b.type ? b.value.l ?? 0 : b, fn),
            c: applyFunction(a.value.c ?? 0, b.type ? b.value.c ?? 0 : b, fn),
            h: applyFunction(a.value.h ?? 0, b.type ? b.value.h ?? 0 : b, fn),
          },
        };

      if (a.type === "number")
        return {
          ...a,
          value: fn(a.value, b.type ? b.value : b),
        };

      // Base case: apply the function to the value
      return fn(a, b);
    }

    /**
     * Formats the result of the interpolation function.
     * @param {any} value - Value to format.
     * @returns {any} - Formatted value.
     */
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

    // Find the unique coordinate values in each dimension
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

    // Find the position of the query in each dimension
    for (let d = 0; d < dimensions; d++) {
      const coords = coordArrays[d];

      // Find the position of the query in this dimension
      let lowerIndex = 0;
      while (
        lowerIndex < coords.length - 1 &&
        coords[lowerIndex + 1] <= query[d]
      )
        lowerIndex++;

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
      if (upperCoord === lowerCoord) factors[d] = 0;
      else factors[d] = (query[d] - lowerCoord) / (upperCoord - lowerCoord);
    }

    /**
     * Generates the vertices of the hypercube.
     * @param {number} dim - Current dimension.
     * @param {number[]} currentPosition - Current position of the vertices.
     * @returns {Array<{ position: number[], value: number }>} - Vertices of the hypercube.
     */
    function generateVertices(dim, currentPosition = []) {
      // End recursion: find the control point with this position
      if (dim === dimensions) {
        // Find the control point with this position
        const position = currentPosition.slice();
        return controlPoints.find((cp) =>
          position.every((val, idx) => val === cp.position[idx])
        );
      }

      // Generate the lower and upper positions
      const lowerPos = [
        ...currentPosition,
        coordArrays[dim][lowerIndices[dim]],
      ];
      const upperPos = [
        ...currentPosition,
        coordArrays[dim][upperIndices[dim]],
      ];

      // Recursively generate the lower and upper vertices
      return [
        generateVertices(dim + 1, lowerPos),
        generateVertices(dim + 1, upperPos),
      ];
    }

    // Get hypercube vertices
    const vertices = generateVertices(0);

    /**
     * Recursively interpolates the vertices.
     * @param {Array<{ position: number[], value: number }>} vertices - Vertices to interpolate.
     * @param {number} dim - Current dimension. Defaults to 0.
     * @returns {Array<{ position: number[], value: number }>} - Interpolated vertices.
     */
    function interpolate(vertices, dim = 0) {
      // End recursion: return the vertices
      if (dim === dimensions) return vertices;

      // Recursive case: interpolate the vertices
      const factor = factors[dim];
      if (Array.isArray(vertices[0]) && Array.isArray(vertices[1])) {
        // Recursively interpolate lower dimensions
        const lowerResult = interpolate(vertices[0], dim + 1);
        const upperResult = interpolate(vertices[1], dim + 1);

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

    const result = interpolate(vertices, 0);
    return fomrmattedResult(result);
  }
}

// === CHOREOGRAPHY CLASS ===
// Class to manage the animation of attributes
class Choreography {
  /**
   * @param {Object} element - The object being animated.
   * @param {Array} attributeInstructions - Array of configuration objects for each attribute.
   * @param {Function} renderFn - Function to render the animated element.
   * @returns {Choreography}
   */
  constructor(element, attributeInstructions, renderFn) {
    this.element = element;

    // Kepp original attribute instructions
    this.attributeInstructions = attributeInstructions;

    // Create attribute configs
    this.setAttributeConfigs();

    // Bind render function to the choreography
    this.render = renderFn.bind(this);

    return this;
  }

  /**
   * Updates the animated element and axesMap.
   * @param {number} deltaTime - Delta time for the animation
   */
  update(deltaTime = 0.016) {
    this.attributeConfigs.forEach((attribute) => attribute.update());
    this.render(deltaTime);
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
  setAttributeConfigs() {
    if (this.attributeLoaded) return;
    this.attributeConfigs = this.attributeInstructions.map(
      (config) => new AttributeConfig(this, config)
    );
    this.attributeLoaded = true;
  }
}

// === SCENE CLASS ===
// Class to manage the animation of a scene
class Scene {
  /**
   * @param {string} name - Name of the scene.
   * @param {Group} sceneGroup - Group containing the scene elements.
   * @param {Choreography[]} choreographies - Array of choreographies for the scene.
   * @returns {Scene}
   */
  constructor(name, sceneGroup, choreographies) {
    this.name = name;
    this.sceneGroup = sceneGroup;
    this.choreographies = choreographies;
    this.isPaused = true;
    return this;
  }

  /**
   * Updates the animated element and axesMap.
   * @param {number} deltaTime - Delta time for the animation
   */
  update(deltaTime = 0.016) {
    if (this.isPaused) return;
    // Propagate the update to the choreographies
    this.choreographies.forEach((choreography) =>
      choreography.update(deltaTime)
    );
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
    this.setAttributeConfigs();
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
  setAttributeConfigs() {
    this.choreographies.forEach((choreography) =>
      choreography.setAttributeConfigs()
    );
  }
}
