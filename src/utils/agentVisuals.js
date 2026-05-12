// Shared visual mappings for agent/model scatter plots. Mirrors
// `_DEFAULT_AGENT_LABELS` / `_DEFAULT_MODEL_LABELS` and the color/marker
// conventions used in fc-eval/analysis (paper figures `cost_vs_performance.pdf`
// and `tradeoff.pdf`): color encodes the agent framework, marker shape encodes
// the model. Keep this file as the single source of truth so F5 and F6 share
// the same legend semantics.

import {
	symbol,
	symbolCircle,
	symbolSquare,
	symbolTriangle,
	symbolDiamond,
	symbolCross
} from "d3-shape";

export const AGENT_COLORS = {
	"OpenHands": "#d97706",
	"Terminus 2": "#1e3a8a",
	"Human Expert": "#0f9d58"
};

export const MODEL_SYMBOLS = {
	"Claude 4.0 Sonnet": symbolCircle,
	"GPT-5": symbolSquare,
	"Gemini 2.5 Pro": symbolTriangle,
	"Qwen3 Coder 480B": symbolDiamond,
	"(oracle)": symbolCross
};

// Canonical display order for legend rows so F5 and F6 line up. Anything not
// in these lists falls to the end, preserving insertion order.
export const MODEL_ORDER = [
	"Claude 4.0 Sonnet",
	"GPT-5",
	"Gemini 2.5 Pro",
	"Qwen3 Coder 480B",
	"(oracle)"
];

export const AGENT_ORDER = ["OpenHands", "Terminus 2", "Human Expert"];

// Sentinel model name used by the API to flag the human-expert baseline row.
// Filtered out of the "Model" legend because the expert isn't a model — it
// shows up under the "Agent" legend instead, with its own marker shape.
export const PLACEHOLDER_MODEL = "(oracle)";

// Agent whose marker shape is fixed (regardless of the placeholder model name).
// The chart renders this agent with `EXPERT_MARKER_MODEL`'s symbol so we can
// echo that same symbol next to its swatch in the agent legend.
export const EXPERT_AGENT = "Human Expert";
export const EXPERT_MARKER_MODEL = "(oracle)";

const FALLBACK_COLOR = "#6b7280";
const FALLBACK_SYMBOL = symbolCircle;

function orderBy(reference) {
	const rank = new Map(reference.map((v, i) => [v, i]));
	return (a, b) => {
		const ra = rank.has(a) ? rank.get(a) : reference.length;
		const rb = rank.has(b) ? rank.get(b) : reference.length;
		return ra - rb;
	};
}

export const sortModels = orderBy(MODEL_ORDER);
export const sortAgents = orderBy(AGENT_ORDER);

export function agentColor(name) {
	return AGENT_COLORS[name] || FALLBACK_COLOR;
}

export function modelSymbol(name) {
	return MODEL_SYMBOLS[name] || FALLBACK_SYMBOL;
}

// d3 `size` is the area in px² and treats every symbol the same way, but the
// resulting bounding boxes vary wildly: a diamond at size=100 is taller/
// narrower than a circle at size=100, which makes a mixed-shape plot look like
// the markers are inconsistently sized. These factors scale each shape's area
// so all five symbols end up with roughly the same max(width, height). Pick a
// base `size` for the visual budget you want; per-shape areas are derived from
// it. Keyed by symbol-object identity (a plain object literal collapses every
// key to "[object Object]"), so use a Map.
const SHAPE_AREA_FACTOR = new Map([
	[symbolCircle, 1.0],
	[symbolSquare, 1.2],
	[symbolTriangle, 0.58],
	[symbolDiamond, 0.36],
	[symbolCross, 0.7]
]);

function shapeAreaFor(symbolType, baseSize) {
	const factor = SHAPE_AREA_FACTOR.get(symbolType) ?? 1.0;
	return baseSize * factor;
}

export function markerPath(modelName, baseSize = 70) {
	const type = modelSymbol(modelName);
	return symbol().type(type).size(shapeAreaFor(type, baseSize))();
}
