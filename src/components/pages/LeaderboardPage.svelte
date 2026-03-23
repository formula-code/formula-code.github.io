<script>
	import { getContext } from "svelte";
	import SortableTable from "$components/helpers/SortableTable.svelte";

	export let leaderboardData = { global: [], stratified: [] };

	const copy = getContext("copy") || {};
	const lp = copy.leaderboardPage || {};

	const pageTitle = lp.title ?? "FormulaCode Leaderboard";
	const globalTitle = lp.global?.title ?? "Global Leaderboard";
	const stratTitle = lp.stratified?.title ?? "Stratified Leaderboard";
	const stratDesc =
		lp.stratified?.description ??
		'Performance broken down by optimization scope: <strong>L1</strong> (Params), <strong>L2</strong> (Function), <strong>L3</strong> (Class), <strong>L4</strong> (Module).';
	const submitTitle = lp.submit?.title ?? "Submit Your Model";
	const submitDesc =
		lp.submit?.description ??
		"To evaluate your own agent on FormulaCode, follow our installation guide.";
	const submitButtonText = lp.submit?.buttonText ?? "Get Started";
	const submitRepoUrl =
		lp.submit?.repoUrl ?? "https://github.com/formula-code/fc-eval";

	const globalColumns = [
		{ key: "rank", label: "RP Rank", numeric: true, decimals: 0, prefix: "#" },
		{ key: "agent", label: "Agent", numeric: false },
		{ key: "model", label: "Model", numeric: false },
		{
			key: "advantage",
			label: "Advantage",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		},
		{
			key: "speedup",
			label: "Speedup",
			numeric: true,
			colorCode: true,
			colorThreshold: 1.0,
			suffix: "x"
		}
	];

	const stratifiedColumns = [
		{ key: "agent", label: "Agent", numeric: false },
		{ key: "model", label: "Model", numeric: false },
		{
			key: "advantage",
			label: "Overall Adv",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		},
		{
			key: "level1",
			label: "L1 (Params)",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		},
		{
			key: "level2",
			label: "L2 (Function)",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		},
		{
			key: "level3",
			label: "L3 (Class)",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		},
		{
			key: "level4",
			label: "L4 (Module)",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		}
	];
</script>

<div class="leaderboard-page">
	<section class="section">
		<div class="container">
			<h1>{pageTitle}</h1>

			<div class="table-section">
				<h2>{globalTitle}</h2>
				<SortableTable
					columns={globalColumns}
					rows={leaderboardData.global}
					initialSortKey="rank"
					initialSortOrder="asc"
				/>
			</div>

			<div class="table-section">
				<h2>{stratTitle}</h2>
				<p class="section-desc">
					{@html stratDesc}
				</p>
				<SortableTable
					columns={stratifiedColumns}
					rows={leaderboardData.stratified}
					initialSortKey="advantage"
					initialSortOrder="desc"
				/>
			</div>

			<div class="submission-highlight">
				<h2>{submitTitle}</h2>
				<p>{submitDesc}</p>
				<a
					href={submitRepoUrl}
					class="cta-button">{submitButtonText}</a
				>
			</div>
		</div>
	</section>
</div>

<style>
	.leaderboard-page {
		min-height: 100vh;
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}

	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 4rem 1rem;
	}

	h1 {
		font-family: var(--sans);
		font-size: 3rem;
		text-align: center;
		margin-bottom: 3rem;
		color: var(--text-primary);
	}

	h2 {
		font-family: var(--sans);
		font-size: 2rem;
		margin-bottom: 1rem;
		color: var(--accent-secondary);
	}

	.section-desc {
		font-family: var(--sans);
		margin-bottom: 1.5rem;
		color: var(--text-secondary);
	}

	.table-section {
		margin-bottom: 4rem;
	}

	.submission-highlight {
		text-align: center;
		padding: 3rem;
		background: var(--bg-secondary);
		border-radius: 8px;
		border: 1px solid var(--accent-secondary);
	}

	.submission-highlight h2 {
		margin-top: 0;
	}

	.cta-button {
		display: inline-block;
		margin-top: 1.5rem;
		padding: 1rem 2rem;
		background: var(--accent-primary);
		color: white;
		text-decoration: none;
		font-family: var(--sans);
		font-weight: 600;
		border-radius: 6px;
		transition: background 0.2s;
	}

	.cta-button:hover {
		background: #2563eb;
	}
</style>
