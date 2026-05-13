<script>
	import dashboard from "$data/dashboard.json";

	const fmt = new Intl.NumberFormat("en-US");

	const sorted = dashboard.repository_stars
		.slice()
		.sort((a, b) => b.stars - a.stars);
	const total = sorted.reduce((s, r) => s + r.stars, 0);
	const peakCount = sorted[0]?.stars ?? 1;

	let cumulative = 0;
	const enriched = sorted.map((r, i) => {
		cumulative += r.stars;
		return {
			rank: i + 1,
			repository: r.repository,
			stars: r.stars,
			cumShare: cumulative / total
		};
	});

	function repoToCover(target) {
		const hit = enriched.find((r) => r.cumShare >= target);
		return hit ? hit.rank : enriched.length;
	}

	const reposFor50 = repoToCover(0.5);
	const reposFor80 = repoToCover(0.8);

	function niceStep(peak, targetTicks = 4) {
		const rough = peak / targetTicks;
		const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
		const norm = rough / magnitude;
		let step;
		if (norm < 1.5) step = magnitude;
		else if (norm < 3) step = 2 * magnitude;
		else if (norm < 7) step = 5 * magnitude;
		else step = 10 * magnitude;
		return step;
	}

	const yStep = niceStep(peakCount);
	const axisMax = Math.ceil(peakCount / yStep) * yStep;
	const yTicks = [];
	for (let v = yStep; v < axisMax; v += yStep) yTicks.push(v);

	const axisTicks = (() => {
		const n = enriched.length;
		if (n === 0) return [];
		const ranks = [
			1,
			Math.max(1, Math.round(n * 0.25)),
			Math.max(1, Math.round(n * 0.5)),
			Math.max(1, Math.round(n * 0.75)),
			n
		];
		const seen = new Set();
		return ranks
			.filter((r) => {
				if (seen.has(r)) return false;
				seen.add(r);
				return true;
			})
			.map((r) => ({
				rank: r,
				leftPct: n === 1 ? 0 : ((r - 1) / (n - 1)) * 100
			}));
	})();

	let wrap;
	let hovered = null;
	let tipX = 0;
	let tipY = 0;
	let flipX = false;

	function hoverBar(r, ev) {
		hovered = r;
		const rect = wrap.getBoundingClientRect();
		tipX = ev.clientX - rect.left;
		tipY = ev.clientY - rect.top;
		flipX = tipX > rect.width - 220;
	}

	function clearHover() {
		hovered = null;
	}

	function shortRepo(name) {
		if (!name) return "";
		const parts = name.split("/");
		return parts.length === 2 ? parts[1] : name;
	}
</script>

<div class="longtail-block">
	<div class="histogram-wrap" bind:this={wrap}>
		<div class="histogram-meta">
			<span class="histogram-title">Repository distribution</span>
			<span class="histogram-meta-stat">
				Top {reposFor50} of {enriched.length} repos → 50% of stars · Top
				{reposFor80} → 80%
			</span>
		</div>
		<div class="chart-area">
			<div class="y-axis-label" aria-hidden="true">
				<span>Popularity</span>
			</div>
			<div class="y-axis" aria-hidden="true">
				{#each yTicks as t}
					<span class="y-tick" style="bottom: {(t / axisMax) * 100}%">
						{t}
					</span>
				{/each}
			</div>
			<div class="plot">
				<div class="gridlines" aria-hidden="true">
					{#each yTicks as t}
						<div class="gridline" style="bottom: {(t / axisMax) * 100}%"></div>
					{/each}
				</div>
				<div
					class="histogram"
					role="img"
					aria-label="Tasks per repository, sorted descending"
					on:mouseleave={clearHover}
				>
					{#each enriched as r, i}
						<div
							class="bar"
							class:active={hovered === r}
							style="height: {(r.stars / axisMax) * 100}%; --i: {i}"
							aria-label={`${r.repository}: ${r.stars} star${r.stars === 1 ? "" : "s"}`}
							on:mouseenter={(e) => hoverBar(r, e)}
							on:mousemove={(e) => hoverBar(r, e)}
						></div>
					{/each}
				</div>
				<div class="histogram-axis-row">
					{#each axisTicks as t, i}
						<span
							class="tick"
							class:tick-start={i === 0}
							class:tick-end={i === axisTicks.length - 1}
							style="left: {t.leftPct}%"
						>
							#{t.rank}
						</span>
					{/each}
				</div>
			</div>
		</div>
		<div class="axis-caption">
			<span>Repository rank by star count (descending)</span>
		</div>

		{#if hovered}
			<div
				class="tooltip"
				class:flip-x={flipX}
				style="left: {tipX}px; top: {tipY}px;"
				role="tooltip"
			>
				<div class="tip-repo">{shortRepo(hovered.repository)}</div>
				<div class="tip-count">
					<strong>{fmt.format(hovered.stars)}</strong> star{hovered.stars === 1
						? ""
						: "s"}
					<span class="tip-pct">
						(rank #{hovered.rank} · {(
							(hovered.stars / total) *
							100
						).toFixed(1)}%)
					</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.longtail-block {
		display: flex;
		flex-direction: column;
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
		flex-wrap: wrap;
		gap: 4px;
	}

	.histogram-title {
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.histogram-meta-stat {
		font-family: var(--mono);
		font-size: 0.72rem;
	}

	.chart-area {
		display: flex;
		gap: 8px;
		align-items: stretch;
	}

	.y-axis-label {
		flex-shrink: 0;
		position: relative;
		width: 16px;
		height: 160px;
	}

	.y-axis-label span {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) rotate(-90deg);
		transform-origin: center;
		white-space: nowrap;
		font-family: var(--sans);
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.y-axis {
		position: relative;
		width: 40px;
		flex-shrink: 0;
		height: 160px;
		font-family: var(--mono);
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	.y-tick {
		position: absolute;
		right: 0;
		transform: translateY(50%);
		line-height: 1;
		text-align: right;
	}

	.plot {
		position: relative;
		flex: 1 1 0;
		min-width: 0;
	}

	.gridlines {
		position: absolute;
		inset: 0 0 auto 0;
		height: 160px;
		pointer-events: none;
	}

	.gridline {
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--border-primary);
		opacity: 0.5;
	}

	.histogram {
		position: relative;
		display: flex;
		align-items: flex-end;
		gap: 1px;
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

	.tip-repo {
		font-family: var(--mono);
		font-weight: 700;
		margin-bottom: 2px;
	}

	.tip-pct {
		color: rgba(255, 255, 255, 0.65);
		font-size: 0.78rem;
		margin-left: 4px;
	}

	.histogram-axis-row {
		position: relative;
		height: 1em;
		margin-top: 4px;
		font-family: var(--mono);
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	.tick {
		position: absolute;
		top: 0;
		transform: translateX(-50%);
		white-space: nowrap;
	}

	.tick.tick-start {
		transform: translateX(0);
	}

	.tick.tick-end {
		transform: translateX(-100%);
	}

	.axis-caption {
		font-family: var(--sans);
		font-size: 0.7rem;
		color: var(--text-muted);
		text-align: center;
		margin-top: 4px;
	}
</style>
