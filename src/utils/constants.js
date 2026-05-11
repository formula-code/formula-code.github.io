// Level configuration constants
// Used across leaderboard tables and visualizations

export const LEVEL_DISPLAY_LABELS = {
	"no-aggregation": "No Aggregation",
	"param-level": "L1: Parameter",
	"func-level": "L2: Function",
	"class-level": "L3: Class",
	"module-level": "L4: Module"
};

export const LEVEL_ORDER = [
	"param-level",
	"func-level",
	"class-level",
	"module-level"
];

// Advantage/performance thresholds
// Used for determining cell styling in advantage tables

export const ADVANTAGE_THRESHOLDS = {
	HIGH: 0.1, // Values >= 0.1 are considered "high" advantage
	MEDIUM: 0 // Values >= 0 but < 0.1 are "medium" advantage
	// Values < 0 are implicitly "low" advantage
};

// Cell neutrality range for comparative tables
// Values within this range (0.95-1.05) are considered neutral/equivalent performance

export const CELL_NEUTRAL_RANGE = {
	MIN: 0.95,
	MAX: 1.05
};

// Scatterplot dimension constraints
// Maximum ratio of width to height for the scrollytelling scatterplot
// TODO: Find a better heuristic for this constraint
export const SCATTER_MAX_WIDTH_HEIGHT_RATIO = 2.0;

// Breakpoints for responsive design
// These should generally match the media queries in CSS
export const BREAKPOINTS = {
	MOBILE: 700,
	TABLET: 768,
	DESKTOP: 1100,
	LARGE_DESKTOP: 1400
};
