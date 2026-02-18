<script>
	import { setContext } from "svelte";
	import Meta from "$components/layout/Meta.svelte";
	import LeaderboardPage from "$components/pages/LeaderboardPage.svelte";
	import copy from "$data/copy.json";
	import version from "$utils/version.js";

	export let data;

	version();

	const title = "Leaderboard - FormulaCode";
	const description = "FormulaCode Benchmark Leaderboard";
	const { url, keywords } = copy;

	setContext("copy", copy);
	setContext("data", data.data);
</script>

<Meta {title} {description} {url} {keywords} />
<LeaderboardPage leaderboardData={data.leaderboard} />
