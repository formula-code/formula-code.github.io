<script>
	import { setContext } from "svelte";
	import Meta from "$components/layout/Meta.svelte";
	import LeaderboardPage from "$components/pages/LeaderboardPage.svelte";
	import copy from "$data/copy.json";
	import version from "$utils/version.js";

	export let data;

	version();

	setContext("copy", copy);
	setContext("data", data.data);

	const title = "Leaderboard | FormulaCode LLM Agent Benchmark";
	const description =
		"Stratified leaderboard of LLM coding agents on the FormulaCode benchmark. Compare Claude, GPT-5, Qwen, and other models on Python code optimization at function, class, and module level.";
	const url = "https://formulacode.org/leaderboard/";

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
				name: "Leaderboard",
				item: url
			}
		]
	};

	const jsonLd = [breadcrumbs];
</script>

<Meta {title} {description} {url} {jsonLd} />
<LeaderboardPage leaderboardData={data.leaderboard} rows={data.rows} />
