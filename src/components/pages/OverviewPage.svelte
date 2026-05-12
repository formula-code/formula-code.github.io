<script>
	import OverviewHeader from "$components/layout/OverviewHeader.svelte";
	import Abstract from "$components/sections/Abstract.svelte";
	import DatasetPipelineViz from "$components/sections/DatasetPipelineViz.svelte";
	import DatasetStatistics from "$components/sections/DatasetStatistics.svelte";
	import KeyFindingsScroll from "$components/sections/KeyFindingsScroll.svelte";
	import ResultsHighlights from "$components/sections/ResultsHighlights.svelte";
	import SubmitCta from "$components/sections/SubmitCta.svelte";

	export let leaderboardData = { global: [], stratified: [] };
</script>

<div class="overview-page">
	<OverviewHeader />

	<Abstract />
	<DatasetPipelineViz />
	<DatasetStatistics />
	<KeyFindingsScroll />

	<ResultsHighlights
		title="Leaderboard at a glance"
		subtitle="The findings above roll up into the per-agent advantage scores below. We weren't able to find an agent overall better than human experts — every overall bar trails. Positive bars beat the human expert on a given level; negative bars trail."
		stratified={leaderboardData.stratified}
	/>

	<SubmitCta />
</div>

<style>
	.overview-page {
		min-height: 100vh;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	/* The landing has more breathing room than other pages, so bump section
	   titles a touch larger here. */
	.overview-page :global(.section-title) {
		font-size: 1.5rem;
	}
</style>
