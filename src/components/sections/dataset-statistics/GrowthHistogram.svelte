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

	const tickIdxs = monthly.length
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

	let histoWrap;
	let hovered = null;
	let tipX = 0;
	let tipY = 0;
	let flipX = false;

	function hoverBar(m, ev) {
		hovered = m;
		const r = histoWrap.getBoundingClientRect();
		tipX = ev.clientX - r.left;
		tipY = ev.clientY - r.top;
		flipX = tipX > r.width - 200;
	}

	function clearHover() {
		hovered = null;
	}
</script>

<div class="growth">
	<div class="stats-row">
		{#each stats as s, i}
			<div class="stat" style="--i: {i}">
				<div class="stat-value">{s.value}</div>
				<div class="stat-label">{s.label}</div>
			</div>
		{/each}
	</div>

	<div class="histogram-wrap" bind:this={histoWrap}>
		<div class="histogram-meta">
			<span class="histogram-title">Tasks merged per month</span>
			<span class="histogram-axis">peak: {peakCount}</span>
		</div>
		<div
			class="histogram"
			role="img"
			aria-label="Monthly distribution of tasks"
			on:mouseleave={clearHover}
		>
			{#each monthly as m, i}
				<div
					class="bar"
					class:active={hovered === m}
					style="height: {(m.count / peakCount) * 100}%; --i: {i}"
					aria-label={`${monthLabel(m.month)}: ${m.count} task${m.count === 1 ? "" : "s"}`}
					on:mouseenter={(e) => hoverBar(m, e)}
					on:mousemove={(e) => hoverBar(m, e)}
				></div>
			{/each}
		</div>

		{#if hovered}
			<div
				class="tooltip"
				class:flip-x={flipX}
				style="left: {tipX}px; top: {tipY}px;"
				role="tooltip"
			>
				<div class="tip-month">{monthLabel(hovered.month)}</div>
				<div class="tip-count">
					<strong>{fmt.format(hovered.count)}</strong> task{hovered.count === 1 ? "" : "s"}
				</div>
			</div>
		{/if}
		<div class="histogram-axis-row">
			{#each monthly as m, i}
				<span class="tick" class:show={tickIdxs.includes(i)}>
					{tickIdxs.includes(i) ? monthLabel(m.month) : ""}
				</span>
			{/each}
		</div>
	</div>
</div>

<style>
	.growth {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--space-sm);
	}

	.stat {
		padding: var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		animation: stat-rise 360ms ease both calc(var(--i) * 50ms);
		min-width: 0;
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

	.histogram-wrap {
		position: relative;
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
		transition:
			background 120ms,
			opacity 120ms;
	}

	.histogram:hover .bar:not(.active) {
		opacity: 0.55;
	}

	.bar.active,
	.bar:hover {
		background: var(--brand-red-dark);
	}

	.tooltip {
		position: absolute;
		transform: translate(12px, 12px);
		pointer-events: none;
		background: var(--text-primary);
		color: #fff;
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		font-family: var(--sans);
		font-size: 0.82rem;
		line-height: 1.35;
		box-shadow: 0 4px 16px rgba(15, 23, 42, 0.18);
		z-index: 5;
		white-space: nowrap;
	}

	.tooltip.flip-x {
		transform: translate(calc(-100% - 12px), 12px);
	}

	.tip-month {
		font-family: var(--mono);
		font-weight: 700;
		margin-bottom: 2px;
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
