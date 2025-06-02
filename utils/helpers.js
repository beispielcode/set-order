/**
 * Math helper functions
 */

// === MATH HELPERS ===

/**
 * Linear interpolation.
 * @param {number} a - Start value.
 * @param {number} b - End value.
 * @param {number} t - Interpolation factor.
 * @returns {number} - Interpolated value.
 */
function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

/**
 * Maps a value from one range to another.
 * @param {number} value - Value to map.
 * @param {number} from1 - Start of the first range.
 * @param {number} to1 - End of the first range.
 * @param {number} from2 - Start of the second range.
 * @param {number} to2 - End of the second range.
 * @returns {number} - Mapped value.
 */
function map(value, from1, to1, from2, to2) {
  return ((value - from1) / (to1 - from1)) * (to2 - from2) + from2;
}

/**
 * Caps a value between a minimum and maximum.
 * @param {number} value - Value to cap.
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @returns {number} - Capped value.
 */
function cap(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds a value to a specified decimal place.
 * @param {number} value - Value to round.
 * @param {number} decimal - Decimal place.
 * @returns {number} - Rounded value.
 */
function roundToDecimal(value, decimal) {
  return Math.round(value * (1 / decimal)) / (1 / decimal);
}
