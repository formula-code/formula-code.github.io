import { ADVANTAGE_THRESHOLDS } from "./constants.js";

/**
 * Format an advantage/performance value for display
 * @param {number|null|undefined} value - The value to format
 * @returns {string} Formatted value with 4 decimal places, or "—" for null/undefined
 */
export function formatAdvantage(value) {
	if (value === null || value === undefined) return "—";
	return value.toFixed(4);
}

/**
 * Determine the CSS class for an advantage cell based on its value
 * @param {number|null|undefined} value - The advantage value
 * @returns {string} CSS class name: "high", "medium", "low", or ""
 */
export function getCellClass(value) {
	if (value === null || value === undefined) return "";
	if (value >= ADVANTAGE_THRESHOLDS.HIGH) return "high";
	if (value >= ADVANTAGE_THRESHOLDS.MEDIUM) return "medium";
	return "low";
}
