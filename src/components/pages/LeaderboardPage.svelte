<script>
	import { getContext } from "svelte";
	import SortableTable from "$components/helpers/SortableTable.svelte";
	import TimeTravelSlider from "$components/helpers/TimeTravelSlider.svelte";
	import {
		computeLeaderboard,
		mergedAtRange,
		rowsHaveMergedAt
	} from "$utils/rankingEngine.js";

	export let leaderboardData = { global: [], stratified: [] };
	export let rows = [];

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

	$: hasMergedAt = rowsHaveMergedAt(rows);
	$: dateRange = hasMergedAt ? mergedAtRange(rows) : null;

	let selectedDate = null;
	$: if (dateRange && selectedDate === null) selectedDate = dateRange[1];

	$: liveLeaderboard = hasMergedAt
		? computeLeaderboard(rows, { maxDate: selectedDate })
		: null;

	$: displayed = liveLeaderboard ?? leaderboardData;
	$: rowsIncluded = liveLeaderboard ? liveLeaderboard.rowsIncluded : null;

	const globalColumns = [
		{ key: "rank", label: "Rank", numeric: true, decimals: 0, prefix: "#" },
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
			suffix: "×"
		}
	];

	const stratifiedColumns = [
		{ key: "agent", label: "Agent", numeric: false },
		{ key: "model", label: "Model", numeric: false },
		{
			key: "advantage",
			label: "Overall",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		},
		{ key: "level1", label: "L1 · Params", numeric: true, colorCode: true, colorThreshold: 0 },
		{ key: "level2", label: "L2 · Function", numeric: true, colorCode: true, colorThreshold: 0 },
		{ key: "level3", label: "L3 · Class", numeric: true, colorCode: true, colorThreshold: 0 },
		{ key: "level4", label: "L4 · Module", numeric: true, colorCode: true, colorThreshold: 0 }
	];

	function handleDateChange(e) {
		selectedDate = e.detail;
	}
</script>

<div class="leaderboard-page">
	<header class="page-head">
		<div class="container">
			<div class="head-mark">
				<img
					class="mark-glyph"
					src="/assets/images/formula-code-icon.svg"
					alt=""
					width="44"
					height="44"
				/>
				<span class="mark-label">Leaderboard</span>
			</div>
			<h1 class="page-title">{pageTitle}</h1>
			<p class="page-desc">
				Ranked by <code>advantage</code> — the signed distance between agent and
				expert speedups, averaged across every benchmark task.
			</p>
		</div>
	</header>

	<main class="container">
		<TimeTravelSlider
			minDate={dateRange ? dateRange[0] : null}
			maxDate={dateRange ? dateRange[1] : null}
			value={selectedDate}
			{rowsIncluded}
			on:change={handleDateChange}
		/>

		<section class="lb-section">
			<div class="section-head">
				<div>
					<h2 class="section-title">{globalTitle}</h2>
					<p class="section-subtitle">
						{displayed.global.length} agent{displayed.global.length === 1 ? "" : "s"} · ranked by overall advantage
					</p>
				</div>
			</div>
			<div class="table-shell">
				<SortableTable
					columns={globalColumns}
					rows={displayed.global}
					initialSortKey="rank"
					initialSortOrder="asc"
				/>
			</div>
		</section>

		<section class="lb-section">
			<div class="section-head">
				<div>
					<h2 class="section-title">{stratTitle}</h2>
					<p class="section-subtitle">{@html stratDesc}</p>
				</div>
			</div>
			<div class="table-shell">
				<SortableTable
					columns={stratifiedColumns}
					rows={displayed.stratified}
					initialSortKey="advantage"
					initialSortOrder="desc"
				/>
			</div>
		</section>

		<section class="submit-block panel">
			<div class="submit-eyebrow">
				<span class="section-label submit-label">Submit</span>
			</div>
			<h2 class="submit-title">{submitTitle}</h2>
			<p class="submit-desc">{submitDesc}</p>
			<a
				href={submitRepoUrl}
				class="btn btn-primary"
				target="_blank"
				rel="noreferrer"
			>
				{submitButtonText} →
			</a>
		</section>
	</main>
</div>

<style>
	.leaderboard-page {
		min-height: 100vh;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.page-head {
		padding: var(--space-2xl) 0 var(--space-lg);
		border-bottom: 1px solid var(--border-primary);
		text-align: center;
	}

	.head-mark {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		margin-bottom: var(--space-sm);
	}

	.mark-glyph {
		display: inline-block;
		width: 44px;
		height: 44px;
		object-fit: contain;
	}

	.mark-label {
		font-family: var(--sans);
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}

	.page-title {
		font-family: var(--sans);
		font-size: clamp(2rem, 4.5vw, 3rem);
		font-weight: 600;
		letter-spacing: -0.02em;
		margin: 0 0 var(--space-sm);
	}

	.page-desc {
		font-family: var(--sans);
		font-size: 1.05rem;
		line-height: 1.65;
		color: var(--text-muted);
		max-width: 60ch;
		margin: 0 auto;
	}

	.page-desc code {
		font-family: var(--mono);
		font-size: 0.85em;
		padding: 1px 6px;
		border-radius: 3px;
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	main.container {
		padding-top: var(--space-xl);
		padding-bottom: var(--space-2xl);
	}

	.lb-section {
		margin-bottom: var(--space-xl);
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.section-subtitle :global(strong) {
		color: var(--text-primary);
		font-weight: 600;
	}

	.table-shell {
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		background: var(--bg-primary);
		box-shadow: var(--shadow);
		overflow: hidden;
	}

	.table-shell :global(.table-wrapper) {
		border: none;
		border-radius: 0;
		background: var(--bg-primary);
	}

	.table-shell :global(table) {
		background: var(--bg-primary);
	}

	.table-shell :global(th) {
		background: var(--bg-secondary);
		font-family: var(--sans);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		text-transform: uppercase;
		border-bottom: 2px solid var(--border-primary);
		padding: 0.65rem 0.85rem;
	}

	.table-shell :global(th.sorted) {
		background: var(--brand-red-soft);
		color: var(--brand-red);
	}

	.table-shell :global(td) {
		border-bottom: 1px solid var(--border-primary);
		font-family: var(--sans);
		font-size: 0.92rem;
		color: var(--text-primary);
		padding: 0.7rem 0.85rem;
	}

	.table-shell :global(td.numeric),
	.table-shell :global(th.numeric) {
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
	}

	.table-shell :global(tr:hover td) {
		background: var(--bg-secondary);
	}

	.submit-block {
		margin-top: var(--space-2xl);
		text-align: left;
	}

	.submit-label {
		font-size: 0.75rem;
		color: var(--accent-primary);
		margin-bottom: var(--space-xs);
	}

	.submit-title {
		font-family: var(--sans);
		font-size: 1.35rem;
		font-weight: 600;
		margin: 0 0 var(--space-sm);
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.submit-desc {
		font-family: var(--sans);
		color: var(--text-muted);
		margin: 0 0 var(--space-md);
		max-width: 60ch;
		line-height: 1.6;
	}
</style>
