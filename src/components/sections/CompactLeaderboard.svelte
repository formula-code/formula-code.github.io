<script>
	import inView from "$actions/inView.js";

	export let title = "Leaderboard";
	export let subtitle = "";
	export let rows = [];
	export let buttonText = "View Full Leaderboard";
	export let buttonHref = "/leaderboard/";
	export let limit = 6;

	let revealed = false;

	$: top = Array.isArray(rows) ? rows.slice(0, limit) : [];
	$: maxSpeedup = top.reduce((m, r) => (r.speedup > m ? r.speedup : m), 1);
	$: minSpeedup = top.reduce(
		(m, r) => (r.speedup < m ? r.speedup : m),
		maxSpeedup
	);

	function barWidth(speedup) {
		if (!Number.isFinite(speedup)) return 0;
		if (maxSpeedup === minSpeedup) return 60;
		const normalized =
			(speedup - minSpeedup) / (maxSpeedup - minSpeedup);
		return 25 + normalized * 70;
	}

	function formatRank(n) {
		return String(n).padStart(2, "0");
	}

	function formatSpeedup(s) {
		if (!Number.isFinite(s)) return "—";
		return `${s.toFixed(3)}×`;
	}

	function formatAdvantage(a) {
		if (!Number.isFinite(a)) return "—";
		const sign = a >= 0 ? "+" : "";
		return `${sign}${a.toFixed(4)}`;
	}
</script>

<section
	class="compact-leaderboard"
	use:inView={{ bottom: 120 }}
	on:enter={() => (revealed = true)}
>
	<div class="container">
		<div class="section-head">
			<div>
				<h2 class="section-title">{title}</h2>
				{#if subtitle}
					<p class="section-subtitle">{@html subtitle}</p>
				{/if}
			</div>
			<a class="section-link" href={buttonHref}>{buttonText} →</a>
		</div>

		<div class="results-panel">
			<div class="head">
				<span class="col-rank">Rank</span>
				<span class="col-agent">Agent · Model</span>
				<span class="col-speedup">Speedup</span>
				<span class="col-adv">Advantage</span>
			</div>

			<div class="rows" class:revealed>
				{#each top as row, i}
					<div class="row" style="--i: {i}">
						<span class="col-rank">
							<span class="rank-num mono">{formatRank(row.rank ?? i + 1)}</span>
						</span>
						<span class="col-agent">
							<span class="agent-name">{row.agent}</span>
							<span class="model-name">{row.model}</span>
						</span>
						<span class="col-speedup">
							<span class="bar-track">
								<span
									class="bar-fill"
									style="--w: {barWidth(row.speedup)}%"
								></span>
							</span>
							<span class="speedup-value mono">
								{formatSpeedup(row.speedup)}
							</span>
						</span>
						<span
							class="col-adv mono"
							class:positive={row.advantage > 0}
							class:negative={row.advantage < 0}
						>
							{formatAdvantage(row.advantage)}
						</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.compact-leaderboard {
		padding: var(--space-xl) 0;
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
	}

	.container {
		max-width: 1080px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.results-panel {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		overflow: hidden;
	}

	.head,
	.row {
		display: grid;
		grid-template-columns: 70px minmax(0, 1.6fr) minmax(0, 1.4fr) 110px;
		gap: 1rem;
		padding: 0.75rem 1.25rem;
		align-items: center;
	}

	.head {
		font-family: var(--sans);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		text-transform: uppercase;
		background: var(--bg-secondary);
		border-bottom: 2px solid var(--border-primary);
	}

	.rows {
		font-size: 0.92rem;
	}

	.row {
		border-bottom: 1px solid var(--border-primary);
		opacity: 0;
		transform: translateY(2px);
		transition:
			opacity 0.45s ease,
			transform 0.45s ease;
		transition-delay: calc(var(--i) * 50ms);
	}

	.row:last-child {
		border-bottom: none;
	}

	.rows.revealed .row {
		opacity: 1;
		transform: translateY(0);
	}

	.row:hover {
		background: var(--bg-secondary);
	}

	.mono {
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
	}

	.col-rank {
		font-family: var(--sans);
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.rank-num {
		color: var(--text-secondary);
	}

	.col-agent {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.agent-name {
		font-family: var(--sans);
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.95rem;
	}

	.model-name {
		font-family: var(--sans);
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.col-speedup {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.bar-track {
		flex: 1 1 auto;
		height: 6px;
		background: #eef2ff;
		border-radius: 999px;
		overflow: hidden;
		min-width: 60px;
	}

	.bar-fill {
		display: block;
		height: 100%;
		width: 0;
		background: linear-gradient(
			90deg,
			var(--accent-primary),
			var(--accent-secondary)
		);
		transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
		transition-delay: inherit;
	}

	.rows.revealed .bar-fill {
		width: var(--w);
	}

	.speedup-value {
		font-size: 0.82rem;
		color: var(--text-primary);
		min-width: 56px;
		text-align: right;
	}

	.col-adv {
		text-align: right;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.col-adv.positive {
		color: var(--score-good);
	}

	.col-adv.negative {
		color: var(--score-bad);
	}

	@media (max-width: 720px) {
		.head,
		.row {
			grid-template-columns: 50px minmax(0, 1fr) 90px;
		}
		.col-speedup {
			display: none;
		}
	}
</style>
