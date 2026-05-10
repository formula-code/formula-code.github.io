import rawRows from "$data/website_data_lite.csv";
import codesData from "$data/website_data_codes.json";
import { buildWorkloads, summarizeFacets } from "$utils/explorer.js";

export async function load() {
	const workloads = buildWorkloads(rawRows, codesData);
	const facets = summarizeFacets(workloads);
	return {
		workloads,
		facets
	};
}
