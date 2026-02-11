<script>
	import SortableTable from "$components/helpers/SortableTable.svelte";

	export let leaderboardData = { global: [], stratified: [] };

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
			label: "Level 1 (Module)",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		},
		{
			key: "level2",
			label: "Level 2 (Class)",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		},
		{
			key: "level3",
			label: "Level 3 (Function)",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		}
	];
</script>

<div class="leaderboard-page">
	<section class="section">
		<div class="container">
			<h1>FormulaCode Leaderboard</h1>

			<ul class="metrics-list">
				<li class="metric-item">
					<h3>Advantage (Adv)</h3>
					<p>
						Human-relative advantage. A value of 0 means the agent performs
						exactly as well as a human expert. Positive values indicate
						superhuman performance.
					</p>
				</li>
				<li class="metric-item">
					<h3>Speedup</h3>
					<p>
						Geometric mean of speedup ratios across all workloads. &gt;1.0 means
						faster than baseline.
					</p>
				</li>
				<li class="metric-item">
					<h3>RP Rank</h3>
					<p>
						Ranked Pairs algorithm rank. Aggregate ranking based on pairwise
						comparisons.
					</p>
				</li>
			</ul>

			<div class="table-section">
				<h2>Global Leaderboard</h2>
				<SortableTable
					columns={globalColumns}
					rows={leaderboardData.global}
					initialSortKey="rank"
					initialSortOrder="asc"
				/>
			</div>

			<div class="table-section">
				<h2>Stratified Leaderboard</h2>
				<p class="section-desc">
					Performance broken down by optimization scope:
					<strong>Level 1</strong> (Module),
					<strong>Level 2</strong> (Class),
					<strong>Level 3</strong> (Function).
				</p>
				<SortableTable
					columns={stratifiedColumns}
					rows={leaderboardData.stratified}
					initialSortKey="advantage"
					initialSortOrder="desc"
				/>
			</div>

			<div class="submission-highlight">
				<h2>Submit Your Model</h2>
				<p>
					To evaluate your own agent on FormulaCode, follow our installation
					guide.
				</p>
				<a href="/docs/" class="cta-button">Get Started</a>
			</div>
		</div>
	</section>
</div>

<style>
	.leaderboard-page {
		min-height: 100vh;
		background-color: var(--wine-black);
		color: var(--wine-tan);
	}

	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 4rem 1rem;
	}

	h1 {
		font-family: var(--serif);
		font-size: 3rem;
		text-align: center;
		margin-bottom: 3rem;
		color: var(--wine-tan);
	}

	h2 {
		font-family: var(--serif);
		font-size: 2rem;
		margin-bottom: 1rem;
		color: var(--wine-gold);
	}

	.section-desc {
		font-family: var(--sans);
		margin-bottom: 1.5rem;
		color: var(--wine-dark-tan);
	}

	.metrics-list {
		list-style: none;
		padding: 0;
		margin: 0 0 4rem 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
	}

	.metric-item {
		background: rgba(255, 255, 255, 0.05);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--wine-med-gray);
	}

	.metric-item h3 {
		font-family: var(--sans);
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
		color: var(--wine-gold);
	}

	.metric-item p {
		font-family: var(--sans);
		font-size: 0.9rem;
		line-height: 1.5;
		color: var(--wine-dark-tan);
		margin: 0;
	}

	.table-section {
		margin-bottom: 4rem;
	}

	.submission-highlight {
		text-align: center;
		padding: 3rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border: 1px solid var(--wine-gold);
	}

	.submission-highlight h2 {
		margin-top: 0;
	}

	.cta-button {
		display: inline-block;
		margin-top: 1.5rem;
		padding: 1rem 2rem;
		background: var(--wine-red);
		color: white;
		text-decoration: none;
		font-family: var(--sans);
		font-weight: 600;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.cta-button:hover {
		background: var(--wine-dark-red);
	}
</style>
