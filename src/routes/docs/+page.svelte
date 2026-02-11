<script>
	import { setContext } from "svelte";
	import Meta from "$components/Meta.svelte";
	import DocsPage from "$components/DocsPage.svelte";
	import copy from "$data/copy.json";
	import version from "$utils/version.js";

	export let data;

	version();

	const title = "Documentation - FormulaCode";
	const description = "Getting Started with FormulaCode Benchmark";
	const { url, keywords } = copy;

	setContext("copy", copy);
	setContext("data", data.data);
</script>

<Meta {title} {description} {url} {keywords} />
<DocsPage />
