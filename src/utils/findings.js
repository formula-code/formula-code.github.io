import f1 from "$data/findings/f1_leaderboard.json";
import f2 from "$data/findings/f2_stratified.json";
import f3 from "$data/findings/f3_tags.json";
import f4 from "$data/findings/f4_longtail.json";
import f5 from "$data/findings/f5_cost.json";
import f6 from "$data/findings/f6_tradeoff.json";
import f7 from "$data/findings/f7_temporal.json";

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

// Issue tracking the live-API exposure of these summary endpoints.
export const FC_EVAL_ISSUE_URL = "https://github.com/formula-code/fc-eval/issues/19";
