// The explorer ships a curated slice pinned to commit 8907cb99, where the
// CSV's agent_recording paths line up with the .cast files actually present
// under src/data/recordings/. The site-wide CSV (website_data_lite.csv) was
// later swapped to a different experiment whose recordings were never
// uploaded, which is why we load a separate copy here.
import rawRows from "$data/website_data_lite.explorer.csv";
import codesData from "$data/website_data_codes.explorer.json";
import { buildWorkloads, summarizeFacets } from "$utils/explorer.js";

export async function load() {
	const workloads = buildWorkloads(rawRows, codesData);
	const facets = summarizeFacets(workloads);
	return {
		workloads,
		facets
	};
}
