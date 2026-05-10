<script>
	import { setContext } from "svelte";
	import Meta from "$components/layout/Meta.svelte";
	import ExplorerPage from "$components/pages/ExplorerPage.svelte";
	import copy from "$data/copy.json";

	export let data;

	const title = "Workload Explorer — FormulaCode";
	const description =
		"Browse, search, and inspect performance workloads in the FormulaCode benchmark.";
	const { url, keywords } = copy;

	setContext("copy", copy);
	setContext("data", []);
</script>

<Meta {title} {description} {url} {keywords} />
<ExplorerPage workloads={data.workloads} facets={data.facets} />
