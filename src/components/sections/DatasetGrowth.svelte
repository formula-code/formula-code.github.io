<script>
	import dashboard from "$data/dashboard.json";

	const { totals, monthly } = dashboard;

	const fmt = new Intl.NumberFormat("en-US");
	const fmtPct = (v) => `${(v * 100).toFixed(2)}%`;

	const stats = [
		{ label: "Total PRs", value: fmt.format(totals.pull_requests) },
		{ label: "Performance PRs", value: fmt.format(totals.performance_prs) },
		{ label: "Tasks", value: fmt.format(totals.problems) },
		{ label: "Repos", value: fmt.format(totals.repositories) },
		{ label: "PR → Task Rate", value: fmtPct(totals.pr_to_problem_rate) }
	];

	const peakCount = monthly.reduce((m, d) => Math.max(m, d.count), 0) || 1;

	function monthLabel(yyyymm) {
		const [y, m] = yyyymm.split("-");
		const d = new Date(Number(y), Number(m) - 1, 1);
		return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
	}


	$: total = monthly.reduce((s, d) => s + d.count, 0);
	$: latest = monthly[monthly.length - 1];
	$: tickIdxs = monthly.length
		? Array.from(
				new Set([
					0,
					Math.floor(monthly.length * 0.25),
					Math.floor(monthly.length * 0.5),
					Math.floor(monthly.length * 0.75),
					monthly.length - 1
				])
			)
		: [];
</script>

<section class="dataset-growth">
	<div class="container">
		<div class="section-head">
			<div>
				<h2 class="section-title">Dataset growth</h2>
				<p class="section-subtitle">
					Live snapshot from <a
						href="https://api.formulacode.org/"
						target="_blank"
						rel="noopener noreferrer">api.formulacode.org</a
					>. {fmt.format(total)} verified tasks span {monthly.length} months of
					real-world performance work, last refreshed {monthLabel(latest.month)}.
				</p>
			</div>
			<a class="section-link" href="https://data.formulacode.org/" target="_blank" rel="noopener noreferrer">
				Live dashboard ↗
			</a>
		</div>

		<div class="stats-row">
			{#each stats as s, i}
				<div class="stat" style="--i: {i}">
					<div class="stat-value">{s.value}</div>
					<div class="stat-label">{s.label}</div>
				</div>
			{/each}
		</div>

		<div class="histogram-wrap">
			<div class="histogram-meta">
				<span class="histogram-title">Tasks merged per month</span>
				<span class="histogram-axis">peak: {peakCount}</span>
			</div>
			<div class="histogram" role="img" aria-label="Monthly distribution of tasks">
				{#each monthly as m, i}
					<div
						class="bar"
						style="height: {(m.count / peakCount) * 100}%; --i: {i}"
						title={`${monthLabel(m.month)} — ${m.count} task${m.count === 1 ? "" : "s"}`}
					></div>
				{/each}
			</div>
			<div class="histogram-axis-row">
				{#each monthly as m, i}
					<span class="tick" class:show={tickIdxs.includes(i)}>
						{tickIdxs.includes(i) ? monthLabel(m.month) : ""}
					</span>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.dataset-growth {
		padding: var(--space-xl) 0;
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.section-title {
		font-family: var(--sans);
		font-size: clamp(1.4rem, 2.5vw, 1.75rem);
		font-weight: 700;
		letter-spacing: -0.015em;
		margin: 0 0 4px;
	}

	.section-subtitle {
		font-family: var(--sans);
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--text-muted);
		max-width: 65ch;
		margin: 0;
	}

	.section-subtitle a {
		color: var(--brand-blue);
		text-decoration: none;
		border-bottom: 1px dashed var(--border-secondary);
	}

	.section-subtitle a:hover {
		color: var(--brand-blue-dark);
		border-bottom-color: var(--brand-blue);
	}

	.section-link {
		font-family: var(--sans);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--brand-red);
		text-decoration: none;
		white-space: nowrap;
	}

	.section-link:hover {
		color: var(--brand-red-dark);
	}

	/* ── Stat tiles ── */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.stat {
		padding: var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		animation: stat-rise 360ms ease both calc(var(--i) * 50ms);
	}

	@keyframes stat-rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.stat-value {
		font-family: var(--mono);
		font-size: clamp(1.4rem, 2.4vw, 1.8rem);
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		line-height: 1.1;
	}

	.stat-label {
		font-family: var(--sans);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin-top: 6px;
	}

	/* ── Histogram ── */
	.histogram-wrap {
		padding: var(--space-md) var(--space-md) var(--space-sm);
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
	}

	.histogram-meta {
		display: flex;
		justify-content: space-between;
		font-family: var(--sans);
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-bottom: var(--space-sm);
	}

	.histogram-title {
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.histogram {
		display: flex;
		align-items: flex-end;
		gap: 2px;
		height: 160px;
		padding: 4px 0;
		border-bottom: 1px solid var(--border-primary);
	}

	.bar {
		flex: 1 1 0;
		min-width: 0;
		background: var(--brand-red);
		border-radius: 1px 1px 0 0;
		cursor: default;
		transition: background 120ms;
	}

	.bar:hover {
		background: var(--brand-red-dark);
	}

	.histogram-axis-row {
		display: flex;
		gap: 2px;
		margin-top: 4px;
		font-family: var(--sans);
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	.tick {
		flex: 1 1 0;
		min-width: 0;
		text-align: left;
		white-space: nowrap;
		visibility: hidden;
	}

	.tick.show {
		visibility: visible;
	}

	@media (max-width: 600px) {
		.stats-row {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
