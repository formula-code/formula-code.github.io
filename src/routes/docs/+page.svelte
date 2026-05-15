<script>
	import { setContext } from "svelte";
	import Meta from "$components/layout/Meta.svelte";
	import DocsPage from "$components/pages/DocsPage.svelte";
	import copy from "$data/copy.json";

	setContext("copy", copy);
	setContext("data", []);

	const title = "Documentation | FormulaCode Agent Evaluation Harness";
	const description =
		"Documentation for fc-eval, the evaluation harness for the FormulaCode LLM-agent code-optimization benchmark, plus dataset curation pipeline and live data API reference.";
	const url = "https://formulacode.org/docs/";

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
				name: "Documentation",
				item: url
			}
		]
	};

	const jsonLd = [breadcrumbs];
</script>

<Meta {title} {description} {url} {jsonLd} />
<DocsPage />
