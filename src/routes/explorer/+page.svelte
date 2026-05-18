<script>
	import { setContext } from "svelte";
	import Meta from "$components/layout/Meta.svelte";
	import ExplorerPage from "$components/pages/ExplorerPage.svelte";
	import copy from "$data/copy.json";

	export let data;

	setContext("copy", copy);
	setContext("data", []);

	const title = "Workload Explorer | FormulaCode Benchmark Dataset";
	const description =
		"Browse and search the FormulaCode dataset — all 957 code-optimization tasks in the benchmark, with pull-request sources, agent results, and per-workload performance traces from real-world Python repositories.";
	const url = "https://formulacode.org/explorer/";

	const breadcrumbs = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: "FormulaCode",
				item: "https://formulacode.org/"
			},
			{
				"@type": "ListItem",
				position: 2,
				name: "Workload Explorer",
				item: url
			}
		]
	};

	const jsonLd = [breadcrumbs];
</script>

<Meta {title} {description} {url} {jsonLd} />
<ExplorerPage workloads={data.workloads} facets={data.facets} />
