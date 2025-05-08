// import { converter } from "culori";

const AxesMap = new Map();

const OKLCH = culori.converter("oklch");

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

    // Initialize the axes or retrieve them from the axes map
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
      console.error(`Attribute ${this.attribute} already defined`);
      return;
    }
    // Dynamically define a getter for the attribute name
    Object.defineProperty(this.parent, this.attribute, {
      get: () => this.value,
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
    let k = Math.max(1 << (this.axesIds.length - 1), 2);

    // return this.idwKnnInterpolate(
    //   // this.controlPoints.map((cp) => ({
    //   //   position: this.axes.map((axis) => cp.position[axis]),
    //   //   value: cp.value,
    //   // })),
    //   this.controlPoints,
    //   pos,
    //   {
    //     k: k,
    //   }
    // );
    return this.nLinearInterpolate(this.controlPoints, pos);
    // return this.multilinearInterpolateSparse(this.controlPoints, pos);
  }

  multilinearInterpolateSparse(controlPoints, query) {
    const dimensions = query.length;

    // Creates an array of unique values for each dimension -> presupposes sorted control points
    function getAxisValues(controlPoints, dimension) {
      return [
        ...new Set(controlPoints.map((cp) => cp.position[dimension])),
      ].sort((a, b) => a - b);
    }
    const axisValues = [];
    for (let d = 0; d < dimensions; d++) {
      axisValues[d] = getAxisValues(controlPoints, d);
    }

    // Finds lower and upper grid values and fractions for each axis
    const lower = [],
      upper = [],
      t = [];
    for (let d = 0; d < dimensions; d++) {
      const axis = axisValues[d];
      let l = axis[0],
        u = axis[axis.length - 1];
      for (let i = 0; i < axis.length - 1; i++) {
        if (query[d] >= axis[i] && query[d] <= axis[i + 1]) {
          l = axis[i];
          u = axis[i + 1];
          break;
        }
      }
      lower[d] = l;
      upper[d] = u;
      t[d] = u === l ? 0 : (query[d] - l) / (u - l);
    }

    // 3. Collect 2^dimensions corners and their values
    const corners = [];
    for (let i = 0; i < 1 << dimensions; i++) {
      const pos = [];
      for (let d = 0; d < dimensions; d++) {
        pos[d] = i & (1 << d) ? upper[d] : lower[d];
      }
      // Find the control point at this position (binary search or linear scan)
      const cp = controlPoints.find((cp) =>
        cp.position.every((v, d) => v === pos[d])
      );
      if (!cp) throw new Error(`Missing control point at ${pos}`);
      corners.push(cp.value);
    }

    // 4. Multilinear interpolation
    function recurse(cornerVals, t, dimension) {
      if (cornerVals.length === 1) return cornerVals[0];
      const half = cornerVals.length / 2;
      const v0 = recurse(cornerVals.slice(0, half), t, dimension + 1);
      const v1 = recurse(cornerVals.slice(half), t, dimension + 1);
      if (Array.isArray(v0)) {
        return v0.map((v, i) => v * (1 - t[dimension]) + v1[i] * t[dimension]);
      } else {
        return v0 * (1 - t[dimension]) + v1 * t[dimension];
      }
    }

    let result = recurse(corners, t, 0);

    // If values are hex, interpolate in RGB
    if (
      typeof corners[0] === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(corners[0])
    ) {
      const rgbCorners = corners.map(hexToRgb);
      const rgbResult = recurse(rgbCorners, t, 0);
      return rgbToHex(rgbResult);
    }

    return result;
  }

  /**
   * KNN-limited IDW interpolation for numbers, arrays, and hex colours.
   * Supports 1-4 dimensional position vectors.
   * @param {Array<{ position: number[], value: number|number[]|string }>} controlPoints
   * @param {number[]} query - The N-dimensional query point (1-4 dimensions).
   * @param {Object} options - Optional parameters
   * @param {number} [options.power=2] - IDW power parameter.
   * @param {number} [options.k=5] - Number of neighbours.
   * @param {number} [options.epsilon=1e-6] - Small value to prevent division by zero.
   * @param {number[]} [options.weights] - Optional dimension weights for distance calculation.
   * @returns {number|number[]|string} - Interpolated value in the same format as input values
   */
  idwKnnInterpolate(controlPoints, query, options = {}) {
    // Default parameters
    const { power = 2, k = 5, epsilon = 1e-6, weights = null } = options;

    // Validate inputs
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

    // Determine dimension weights
    const dimensionWeights = weights || new Array(dimensions).fill(1);

    // Compute weighted distances
    const distances = controlPoints.map((cp) => {
      // Calculate weighted Euclidean distance
      let sumSquares = 0;
      for (let i = 0; i < dimensions; i++) {
        const diff = query[i] - cp.position[i];
        sumSquares += dimensionWeights[i] * (diff * diff);
      }
      return {
        cp,
        dist: Math.sqrt(sumSquares),
      };
    });

    // Sort by distance and take k nearest (or all if fewer than k)
    distances.sort((a, b) => a.dist - b.dist);
    const kToUse = Math.min(k, distances.length);
    const nearest = distances.slice(0, kToUse);

    // If query is exactly on a control point, return its value immediately
    if (nearest[0].dist < epsilon) {
      return fomrmattedResult(nearest[0].cp);
    }

    // Prepare accumulator based on value type
    let weightedSum;
    let totalWeight = 0;

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

    // Perform IDW interpolation
    for (const { cp, dist } of nearest) {
      // Calculate weight using inverse distance formula
      const weight = 1 / Math.pow(Math.max(dist, epsilon), power);
      const weightedValue = applyFunction(cp, weight, (a, b) => a * b);
      if (!weightedSum) weightedSum = weightedValue;
      else
        weightedSum = applyFunction(
          weightedSum,
          weightedValue,
          (a, b) => a + b
        );
      totalWeight += weight;
    }

    // Avoid division by zero (though epsilon should prevent this)
    if (totalWeight === 0) {
      return fomrmattedResult(applyFunction(weightedSum, 0, (a, b) => a * b));
    }

    // Calculate final result
    const result = applyFunction(weightedSum, totalWeight, (a, b) => a / b);

    return fomrmattedResult(result);
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

  /**
   * N-linear interpolation for numbers, arrays, and hex colours.
   * Supports 1-4 dimensional position vectors.
   * @param {Array<{ position: number[], value: number|number[]|string }>} controlPoints
   * @param {number[]} query - The N-dimensional query point (1-4 dimensions).
   * @param {Object} options - Optional parameters
   * @param {number} [options.epsilon=1e-6] - Small value to prevent division by zero.
   * @param {number[]} [options.weights] - Optional dimension weights for distance calculation.
   * @returns {number|number[]|string} - Interpolated value in the same format as input values
   */
  // nLinearInterpolate(controlPoints, query, options = {}) {
  //   // Default parameters
  //   const { power = 2, epsilon = 1e-6, weights = null } = options;

  //   // Validate inputs
  //   if (!controlPoints || controlPoints.length === 0) {
  //     throw new Error("Control points array cannot be empty");
  //   }

  //   if (!query || !Array.isArray(query)) {
  //     throw new Error("Query must be an array of coordinates");
  //   }

  //   const dimensions = query.length;
  //   const k = 2 << (dimensions - 1);
  //   if (dimensions < 1 || dimensions > 4) {
  //     throw new Error("Query must have between 1 and 4 dimensions");
  //   }

  //   // Ensure all control points have the correct dimension
  //   for (const cp of controlPoints) {
  //     if (!cp.position || cp.position.length !== dimensions) {
  //       throw new Error(
  //         `All control points must have ${dimensions} dimensions`
  //       );
  //     }
  //   }

  //   // Determine dimension weights
  //   const dimensionWeights = weights || new Array(dimensions).fill(1);

  //   // Compute weighted distances
  //   const distances = controlPoints.map((cp) => {
  //     // Calculate weighted Euclidean distance
  //     let sumSquares = 0;
  //     for (let i = 0; i < dimensions; i++) {
  //       const diff = query[i] - cp.position[i];
  //       sumSquares += dimensionWeights[i] * (diff * diff);
  //     }
  //     return {
  //       cp,
  //       dist: Math.sqrt(sumSquares),
  //     };
  //   });

  //   // Sort by distance and take k nearest (or all if fewer than k)
  //   distances.sort((a, b) => a.dist - b.dist);
  //   const kToUse = Math.min(k, distances.length);
  //   const nearest = distances.slice(0, kToUse);

  //   // If query is exactly on a control point, return its value immediately
  //   if (nearest[0].dist < epsilon) {
  //     return fomrmattedResult(nearest[0].cp);
  //   }

  //   // Prepare accumulator based on value type
  //   // let weightedSum;
  //   // let totalWeight = 0;

  //   function applyFunction(a, b, fn) {
  //     if (a.type === "array" || a.type === "object")
  //       return {
  //         ...a,
  //         value: a.value.map((v, i) =>
  //           applyFunction(v, b.type ? b.value[i] : b, fn)
  //         ),
  //       };
  //     if (a.type === "colour") {
  //       return {
  //         ...a,
  //         value: {
  //           ...a.value,
  //           l: applyFunction(a.value.l ?? 0, b.type ? b.value.l ?? 0 : b, fn),
  //           c: applyFunction(a.value.c ?? 0, b.type ? b.value.c ?? 0 : b, fn),
  //           h: applyFunction(a.value.h ?? 0, b.type ? b.value.h ?? 0 : b, fn),
  //         },
  //       };
  //     }

  //     if (a.type === "number")
  //       return {
  //         ...a,
  //         value: fn(a.value, b.type ? b.value : b),
  //       };
  //     return fn(a, b);
  //   }

  //   function fomrmattedResult(value) {
  //     if (value.type === "colour") return culori.formatHex(value.value);
  //     if (value.type === "array") return value.value.map(fomrmattedResult);
  //     if (value.type === "object")
  //       return Object.fromEntries(
  //         value.keys.map((k, i) => [k, fomrmattedResult(value.value[i])])
  //       );
  //     return value.value;
  //   }

  //   // Perform IDW interpolation
  //   for (const { cp, dist } of nearest) {
  //     // Calculate weight using inverse distance formula
  //     const weight = 1 / Math.pow(Math.max(dist, epsilon), power);
  //     const weightedValue = applyFunction(cp, weight, (a, b) => a * b);
  //     if (!weightedSum) weightedSum = weightedValue;
  //     else
  //       weightedSum = applyFunction(
  //         weightedSum,
  //         weightedValue,
  //         (a, b) => a + b
  //       );
  //     totalWeight += weight;
  //   }

  //   // Avoid division by zero (though epsilon should prevent this)
  //   if (totalWeight === 0) {
  //     return fomrmattedResult(applyFunction(weightedSum, 0, (a, b) => a * b));
  //   }

  //   // Calculate final result
  //   const result = applyFunction(weightedSum, totalWeight, (a, b) => a / b);

  //   return fomrmattedResult(result);
  // }
  /**
   * N-linear interpolation for numbers, arrays, and hex colours.
   * Supports 1-4 dimensional position vectors.
   * @param {Array<{ position: number[], value: number|number[]|string }>} controlPoints
   * @param {number[]} query - The N-dimensional query point (1-4 dimensions).
   * @param {Object} options - Optional parameters
   * @param {number} [options.epsilon=1e-6] - Small value to prevent division by zero.
   * @param {number[]} [options.weights] - Optional dimension weights for distance calculation.
   * @returns {number|number[]|string} - Interpolated value in the same format as input values
   */
  // nLinearInterpolate(controlPoints, query, options = {}) {
  //   // Default parameters
  //   const { epsilon = 1e-6, weights = null, fallbackToIDW = true } = options;

  //   // Validate inputs
  //   if (!controlPoints || controlPoints.length === 0) {
  //     throw new Error("Control points array cannot be empty");
  //   }

  //   if (!query || !Array.isArray(query)) {
  //     throw new Error("Query must be an array of coordinates");
  //   }

  //   const dimensions = query.length;
  //   if (dimensions < 1 || dimensions > 4) {
  //     throw new Error("Query must have between 1 and 4 dimensions");
  //   }

  //   // Ensure all control points have the correct dimension
  //   for (const cp of controlPoints) {
  //     if (!cp.position || cp.position.length !== dimensions) {
  //       throw new Error(
  //         `All control points must have ${dimensions} dimensions`
  //       );
  //     }
  //   }

  //   // Determine dimension weights
  //   const dimensionWeights = weights || new Array(dimensions).fill(1);

  //   // Check if query point is exactly on a control point
  //   for (const cp of controlPoints) {
  //     let exactMatch = true;
  //     for (let i = 0; i < dimensions; i++) {
  //       if (Math.abs(cp.position[i] - query[i]) > epsilon) {
  //         exactMatch = false;
  //         break;
  //       }
  //     }
  //     if (exactMatch) {
  //       return fomrmattedResult(cp);
  //     }
  //   }

  //   // Find the bounding hypercube vertices
  //   const hypercubeVertices = findHypercubeVertices(
  //     controlPoints,
  //     query,
  //     dimensions,
  //     dimensionWeights
  //   );

  //   // If we couldn't find a proper hypercube, fall back to IDW
  //   // if (hypercubeVertices.length !== Math.pow(2, dimensions)) {
  //   //   if (fallbackToIDW) {
  //   //     return this.idwKnnInterpolate(controlPoints, query, {
  //   //       k: Math.min(8, controlPoints.length),
  //   //       power: 2,
  //   //       epsilon,
  //   //       weights: dimensionWeights,
  //   //     });
  //   //   } else {
  //   //     throw new Error(
  //   //       `Could not find a complete hypercube for n-linear interpolation`
  //   //     );
  //   //   }
  //   // }

  //   // Perform n-linear interpolation
  //   return performNLinearInterpolation(hypercubeVertices, query);

  //   // Helper function to find hypercube vertices
  //   function findHypercubeVertices(controlPoints, query, dimensions, weights) {
  //     // Find min and max bounds for each dimension
  //     const bounds = Array(dimensions)
  //       .fill()
  //       .map(() => ({ min: -Infinity, max: Infinity }));

  //     // For each dimension, find the closest values below and above the query point
  //     for (let dim = 0; dim < dimensions; dim++) {
  //       let below = -Infinity;
  //       let above = Infinity;

  //       for (const cp of controlPoints) {
  //         if (cp.position[dim] <= query[dim] && cp.position[dim] > below) {
  //           below = cp.position[dim];
  //         }
  //         if (cp.position[dim] >= query[dim] && cp.position[dim] < above) {
  //           above = cp.position[dim];
  //         }
  //       }

  //       bounds[dim].min = below;
  //       bounds[dim].max = above;
  //     }

  //     // Check if we have valid bounds
  //     for (let dim = 0; dim < dimensions; dim++) {
  //       if (bounds[dim].min === -Infinity || bounds[dim].max === Infinity) {
  //         return []; // Incomplete bounds, can't form a hypercube
  //       }
  //     }

  //     // Generate all possible vertex coordinates for the hypercube
  //     const vertexCoordinates = [];
  //     generateVertexCoordinates([], 0);

  //     function generateVertexCoordinates(current, dim) {
  //       if (dim === dimensions) {
  //         vertexCoordinates.push([...current]);
  //         return;
  //       }

  //       current.push(bounds[dim].min);
  //       generateVertexCoordinates(current, dim + 1);
  //       current.pop();

  //       current.push(bounds[dim].max);
  //       generateVertexCoordinates(current, dim + 1);
  //       current.pop();
  //     }

  //     // Find control points that match these vertex coordinates
  //     const vertices = [];

  //     for (const coords of vertexCoordinates) {
  //       let foundVertex = null;

  //       for (const cp of controlPoints) {
  //         let isMatch = true;
  //         for (let dim = 0; dim < dimensions; dim++) {
  //           if (Math.abs(cp.position[dim] - coords[dim]) > epsilon) {
  //             isMatch = false;
  //             break;
  //           }
  //         }

  //         if (isMatch) {
  //           foundVertex = cp;
  //           break;
  //         }
  //       }

  //       if (foundVertex) {
  //         vertices.push(foundVertex);
  //       } else {
  //         return []; // Missing vertex, can't form a complete hypercube
  //       }
  //     }

  //     return vertices;
  //   }

  //   // Perform n-linear interpolation using the hypercube vertices
  //   function performNLinearInterpolation(vertices, query) {
  //     // For n-dimensional interpolation, we need to organize vertices correctly
  //     // First, create a mapping function to convert coordinates to indices
  //     function getVertexIndex(position) {
  //       let index = 0;
  //       for (let i = 0; i < dimensions; i++) {
  //         // Find min and max for this dimension across all vertices
  //         const minVal = Math.min(...vertices.map((v) => v.position[i]));
  //         const maxVal = Math.max(...vertices.map((v) => v.position[i]));

  //         // If position is closer to max than min, set the bit
  //         if (Math.abs(position[i] - maxVal) < Math.abs(position[i] - minVal)) {
  //           index |= 1 << i;
  //         }
  //       }
  //       return index;
  //     }

  //     // Sort vertices by their index
  //     const sortedVertices = [...vertices].sort(
  //       (a, b) => getVertexIndex(a.position) - getVertexIndex(b.position)
  //     );

  //     // Calculate interpolation factors for each dimension
  //     const factors = [];
  //     for (let dim = 0; dim < dimensions; dim++) {
  //       const minVal = Math.min(...vertices.map((v) => v.position[dim]));
  //       const maxVal = Math.max(...vertices.map((v) => v.position[dim]));
  //       factors[dim] = (query[dim] - minVal) / (maxVal - minVal);

  //       // Clamp factors between 0 and 1 to avoid extrapolation issues
  //       factors[dim] = Math.max(0, Math.min(1, factors[dim]));
  //     }

  //     // Perform the actual n-linear interpolation
  //     function interpolate(points, dim) {
  //       if (dim === dimensions - 1) {
  //         // Base case: linear interpolation in the last dimension
  //         const t = factors[dim];
  //         const p0 = points[0];
  //         const p1 = points[1];

  //         return applyFunction(
  //           p0,
  //           applyFunction(
  //             applyFunction(p1, p0, (a, b) => a - b),
  //             t,
  //             (a, b) => a * b
  //           ),
  //           (a, b) => a + b
  //         );
  //       }

  //       // Recursive case: interpolate along current dimension
  //       const stride = Math.pow(2, dimensions - dim - 1);
  //       const lowerPoints = [];
  //       const upperPoints = [];

  //       // Split points into two groups based on their position in this dimension
  //       for (let i = 0; i < points.length; i += 2 * stride) {
  //         for (let j = 0; j < stride; j++) {
  //           lowerPoints.push(points[i + j]);
  //           upperPoints.push(points[i + stride + j]);
  //         }
  //       }

  //       // Recursively interpolate both groups
  //       const lowerResult = interpolate(lowerPoints, dim + 1);
  //       const upperResult = interpolate(upperPoints, dim + 1);

  //       // Interpolate between the results
  //       const t = factors[dim];
  //       return applyFunction(
  //         lowerResult,
  //         applyFunction(
  //           applyFunction(upperResult, lowerResult, (a, b) => a - b),
  //           t,
  //           (a, b) => a * b
  //         ),
  //         (a, b) => a + b
  //       );
  //     }

  //     // Start the recursive interpolation from the first dimension
  //     return fomrmattedResult(interpolate(sortedVertices, 0));
  //   }

  //   // Sort hypercube vertices to ensure correct order for interpolation
  //   function sortHypercubeVertices(vertices, dimensions) {
  //     // Create a binary index for each vertex based on its position
  //     // relative to the query point in each dimension
  //     const indexedVertices = vertices.map((vertex) => {
  //       let index = 0;
  //       for (let dim = 0; dim < dimensions; dim++) {
  //         // If vertex position in this dimension is greater than query,
  //         // set the corresponding bit in the index
  //         if (vertex.position[dim] > query[dim]) {
  //           index |= 1 << dim;
  //         }
  //       }
  //       return { vertex, index };
  //     });

  //     // Sort by index
  //     indexedVertices.sort((a, b) => a.index - b.index);

  //     // Return just the vertices in the correct order
  //     return indexedVertices.map((iv) => iv.vertex);
  //   }

  //   // Apply a function to two values, handling different data types
  //   function applyFunction(a, b, fn) {
  //     if (a.type === "array" || a.type === "object")
  //       return {
  //         ...a,
  //         value: a.value.map((v, i) =>
  //           applyFunction(v, b.type ? b.value[i] : b, fn)
  //         ),
  //       };
  //     if (a.type === "colour") {
  //       return {
  //         ...a,
  //         value: {
  //           ...a.value,
  //           l: applyFunction(a.value.l ?? 0, b.type ? b.value.l ?? 0 : b, fn),
  //           c: applyFunction(a.value.c ?? 0, b.type ? b.value.c ?? 0 : b, fn),
  //           h: applyFunction(a.value.h ?? 0, b.type ? b.value.h ?? 0 : b, fn),
  //         },
  //       };
  //     }

  //     if (a.type === "number")
  //       return {
  //         ...a,
  //         value: fn(a.value, b.type ? b.value : b),
  //       };

  //     return fn(a, b);
  //   }

  //   // Format the result based on the value type
  //   function fomrmattedResult(value) {
  //     if (value.type === "colour") return culori.formatHex(value.value);
  //     if (value.type === "array") return value.value.map(fomrmattedResult);
  //     if (value.type === "object")
  //       return Object.fromEntries(
  //         value.keys.map((k, i) => [k, fomrmattedResult(value.value[i])])
  //       );
  //     return value.value;
  //   }
  // }
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
}
