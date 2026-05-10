// JS port of src/tasks/process_remote_data.py:69-316.
// Lets the leaderboard recompute reactively in the browser when a date filter changes.

const PLATFORM_DISPLAY_NAMES = {
	openhands: "OpenHands",
	"terminus-2": "Terminus 2"
};

const MODEL_DISPLAY_NAMES = {
	"anthropic-claude-sonnet-4-20250514": "Claude Sonnet 4",
	"openai-gpt-5-2025-08-07-reasoning-high": "GPT-5",
	claude: "Claude Sonnet 4",
	"gpt-5": "GPT-5",
	oracle: "Expert Human",
	"gemini-2.5-pro": "Gemini 2.5 Pro",
	"qwen3-coder": "Qwen 3 Coder"
};

// Level string → stratified bucket key. Accepts both the raw CSV value
// ("param-level") and the upstream Python form ("1-Params") so either
// pipeline version works.
const LEVEL_TO_BUCKET = {
	"param-level": "level1",
	"func-level": "level2",
	"class-level": "level3",
	"module-level": "level4",
	"1-Params": "level1",
	"2-Func": "level2",
	"3-Class": "level3",
	"4-Module": "level4"
};

function formatNames(agentId) {
	const parts = String(agentId).split(",");
	const rawPlatform = (parts[0] ?? "").trim();
	const rawModel = (parts[1] ?? "").trim();
	return {
		agent: PLATFORM_DISPLAY_NAMES[rawPlatform] ?? rawPlatform,
		model: MODEL_DISPLAY_NAMES[rawModel] ?? rawModel
	};
}

export function computeAdvantage(
	agentNop,
	oracleNop,
	agentThresh = 1.0,
	oracleThresh = 1.0
) {
	const a = Number(agentNop);
	const o = Number(oracleNop);
	if (!Number.isFinite(a) || !Number.isFinite(o)) return null;
	const denom = Math.sqrt(agentThresh ** 2 + oracleThresh ** 2);
	if (denom === 0) return null;
	return (oracleThresh * a - agentThresh * o) / denom;
}

function geometricMean(values) {
	if (!values.length) return 1;
	let logSum = 0;
	for (const v of values) logSum += Math.log(Math.max(v, 1e-10));
	return Math.exp(logSum / values.length);
}

function mean(values) {
	if (!values.length) return 0;
	let s = 0;
	for (const v of values) s += v;
	return s / values.length;
}

function round4(x) {
	return Math.round(x * 10000) / 10000;
}

// Returns true iff at least one row carries a parseable merged_at value.
export function rowsHaveMergedAt(rows) {
	if (!Array.isArray(rows)) return false;
	for (const r of rows) {
		const v = r?.merged_at;
		if (v === undefined || v === null || v === "") continue;
		const t = new Date(v).getTime();
		if (Number.isFinite(t)) return true;
	}
	return false;
}

// Find [earliest, latest] merged_at as JS Dates. Returns null if none present.
export function mergedAtRange(rows) {
	if (!Array.isArray(rows)) return null;
	let min = Infinity;
	let max = -Infinity;
	for (const r of rows) {
		const v = r?.merged_at;
		if (v === undefined || v === null || v === "") continue;
		const t = new Date(v).getTime();
		if (!Number.isFinite(t)) continue;
		if (t < min) min = t;
		if (t > max) max = t;
	}
	if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
	return [new Date(min), new Date(max)];
}

// Core ranking: consumes raw per-row CSV data and returns
// { global: [...], stratified: [...] } in the same shape as advantage-leaderboard.json.
// opts:
//   maxDate  — JS Date. Rows with merged_at > maxDate are excluded. If null, no filter.
//   minCount — minimum # of rows an agent needs to appear. Default 1.
export function computeLeaderboard(
	rows,
	{ maxDate = null, minCount = 1 } = {}
) {
	const maxTs = maxDate instanceof Date ? maxDate.getTime() : null;

	const byAgent = new Map();
	let kept = 0;

	for (const row of rows) {
		if (maxTs !== null) {
			const v = row?.merged_at;
			if (v === undefined || v === null || v === "") continue;
			const t = new Date(v).getTime();
			if (!Number.isFinite(t) || t > maxTs) continue;
		}

		const adv = computeAdvantage(row["agent/nop"], row["oracle/nop"]);
		if (adv === null) continue;

		const agentId = row.agent_id;
		if (!agentId) continue;

		let bucket = byAgent.get(agentId);
		if (!bucket) {
			bucket = {
				advantages: [],
				speedups: [],
				levels: { level1: [], level2: [], level3: [], level4: [] }
			};
			byAgent.set(agentId, bucket);
		}

		bucket.advantages.push(adv);

		const agentNop = Number(row["agent/nop"]);
		if (Number.isFinite(agentNop)) bucket.speedups.push(agentNop);

		const levelKey = LEVEL_TO_BUCKET[row.level];
		if (levelKey) bucket.levels[levelKey].push(adv);

		kept++;
	}

	const global = [];
	const stratified = [];

	for (const [agentId, data] of byAgent.entries()) {
		if (data.advantages.length < minCount) continue;
		const { agent, model } = formatNames(agentId);
		const avgAdvantage = round4(mean(data.advantages));
		const speedup = round4(geometricMean(data.speedups));

		global.push({ agent, model, advantage: avgAdvantage, speedup });

		stratified.push({
			agent,
			model,
			advantage: avgAdvantage,
			level1: data.levels.level1.length ? round4(mean(data.levels.level1)) : 0,
			level2: data.levels.level2.length ? round4(mean(data.levels.level2)) : 0,
			level3: data.levels.level3.length ? round4(mean(data.levels.level3)) : 0,
			level4: data.levels.level4.length ? round4(mean(data.levels.level4)) : 0
		});
	}

	global.sort((a, b) => b.advantage - a.advantage);
	global.forEach((row, i) => (row.rank = i + 1));

	stratified.sort((a, b) => b.advantage - a.advantage);

	return { global, stratified, rowsIncluded: kept };
}
