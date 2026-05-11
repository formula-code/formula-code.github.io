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

	<DatasetPipelineViz />
	<Abstract />
	<DatasetStatistics />
	<KeyFindingsScroll />

	<ResultsHighlights
		title="Leaderboard at a glance"
		subtitle="The six findings above roll up into the per-agent advantage scores below. Positive bars beat the human expert; negative bars trail."
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
