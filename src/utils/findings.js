import f1Raw from "$data/findings/f1_leaderboard.json";
import f2Raw from "$data/findings/f2_stratified.json";
import f3Raw from "$data/findings/f3_tags.json";
import f4Raw from "$data/findings/f4_longtail.json";
import f5Raw from "$data/findings/f5_cost.json";
import f6Raw from "$data/findings/f6_tradeoff.json";
import f7Raw from "$data/findings/f7_temporal.json";

// OpenHands + Gemini 2.5 Pro was not evaluated to spec, so strip it from every
// finding before downstream code sees it. The filter is at this layer (not the
// data files) so re-pulling the JSON exports doesn't reintroduce the row.
function isExcludedConfig(row) {
	return row && row.agent === "OpenHands" && row.model === "Gemini 2.5 Pro";
}

function filterRows(finding) {
	if (!finding || !Array.isArray(finding.rows)) return finding;
	return { ...finding, rows: finding.rows.filter((r) => !isExcludedConfig(r)) };
}

const f1 = filterRows(f1Raw);
const f2 = filterRows(f2Raw);
const f3 = filterRows(f3Raw);
const f4 = filterRows(f4Raw);
const f5 = filterRows(f5Raw);
const f6 = filterRows(f6Raw);
const f7 = filterRows(f7Raw);

// Single source-of-truth for the seven paper-figure findings. Components import
// from here so the eventual swap to a live `api.formulacode.org` fetch lands in
// one place. Each entry preserves the JSON's `_source` / `_paper_artifact` /
// `_needs_export` metadata so UI can render a "data pending" affordance.
export const findings = {
	f1_leaderboard: f1,
	f2_stratified: f2,
	f3_tags: f3,
	f4_longtail: f4,
	f5_cost: f5,
	f6_tradeoff: f6,
	f7_temporal: f7
};

export function needsExport(finding) {
	return Boolean(finding && finding._needs_export);
}

// Paper-aligned leaderboard derived from f1_leaderboard.json (global, ranked-pairs)
// and f2_stratified.json (per-level advantage). This is the single source of truth
// for every surface that claims to render "the FormulaCode leaderboard":
//   - / (Leaderboard at a glance)
//   - /leaderboard/ (global + stratified)
//   - /blog/ PaperHeader
// The toy 4-agent scrollytelling data in website_data_lite.csv stays separate.
//
// f2_stratified uses paper's L1=Function, L2=Class, L3=Module convention (no
// Params level — the paper dropped it). Keys passed through unchanged so the
// JSON matches the paper exactly.
export const paperLeaderboard = (() => {
	const f1Rows = Array.isArray(f1.rows) ? f1.rows : [];
	const f2Rows = Array.isArray(f2.rows) ? f2.rows : [];

	const global = f1Rows
		.filter((r) => !r._baseline)
		.map((r) => ({
			agent: r.agent,
			model: r.model,
			rank: r.rp_rank,
			advantage: r.advantage,
			speedup: r.speedup_geomean
		}))
		.sort((a, b) => a.rank - b.rank);

	const stratified = f2Rows.map((r) => ({
		agent: r.agent,
		model: r.model,
		advantage: r.overall,
		level1: r.level1,
		level2: r.level2,
		level3: r.level3
	}));

	return { global, stratified };
})();
