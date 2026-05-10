<script>
	import { setContext } from "svelte";
	import Meta from "$components/layout/Meta.svelte";
	import DocsPage from "$components/pages/DocsPage.svelte";
	import copy from "$data/copy.json";

	const title = "Documentation — FormulaCode";
	const description =
		"Documentation for the FormulaCode evaluation harness, data curation pipeline, and live data API.";
	const { url, keywords } = copy;

	setContext("copy", copy);
	setContext("data", []);
</script>

<Meta {title} {description} {url} {keywords} />
<DocsPage />
