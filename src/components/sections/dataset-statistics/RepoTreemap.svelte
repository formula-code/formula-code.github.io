<script>
	import { onMount, tick } from "svelte";
	import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
	import dashboard from "$data/dashboard.json";

	const fmt = new Intl.NumberFormat("en-US");

	const data = dashboard.by_repository.map((d) => ({ ...d }));
	const totalProblems = data.reduce((s, d) => s + d.count, 0);

	let wrap;
	let width = 0;
	// Reactive height keeps the SVG sized to the wrap: any time `width` crosses
	// the mobile breakpoint the height collapses to 360px, the treemap layout
	// re-runs, and the SVG attribute updates. Previously the height was a
	// static 480 with a `!important` CSS override that left a 120px stub
	// painting into the next section on phones.
	$: height = width > 0 && width < 600 ? 360 : 480;

	onMount(async () => {
		await tick();
		width = wrap.getBoundingClientRect().width;
		const ro = new ResizeObserver((entries) => {
			for (const e of entries) width = e.contentRect.width;
		});
		ro.observe(wrap);
		const onResize = () => (width = wrap.getBoundingClientRect().width);
		window.addEventListener("resize", onResize);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", onResize);
		};
	});

	$: cells = (() => {
		if (!width) return [];
		const root = hierarchy({ children: data })
			.sum((d) => d.count)
			.sort((a, b) => b.value - a.value);
		treemap()
			.tile(treemapSquarify.ratio(1.2))
			.size([width, height])
			.padding(1)
			.round(true)(root);
		return root.leaves();
	})();

	let hovered = null;
	let tipX = 0;
	let tipY = 0;
	let flipX = false;
	let flipY = false;

	function hoverCell(c, ev) {
		hovered = c;
		const r = wrap.getBoundingClientRect();
		tipX = ev.clientX - r.left;
		tipY = ev.clientY - r.top;
		flipX = tipX > r.width - 240;
		flipY = tipY > r.height - 80;
	}

	function clearHover() {
		hovered = null;
	}

	function colorFor(c, total) {
		const share = c.value / total;
		const t = Math.min(1, share / 0.08);
		const r = Math.round(245 + (220 - 245) * t);
		const g = Math.round(230 + (36 - 230) * t);
		const b = Math.round(230 + (24 - 230) * t);
		return `rgb(${r}, ${g}, ${b})`;
	}

	function labelVisible(c) {
		const w = c.x1 - c.x0;
		const h = c.y1 - c.y0;
		return w > 70 && h > 28;
	}
</script>

<div class="treemap-block">
	<div class="treemap-meta">
		<span class="treemap-title">Problems by repository</span>
		<span class="treemap-meta-stat"
			>{fmt.format(totalProblems)} tasks across {data.length} repos</span
		>
	</div>
	<div class="treemap-wrap" bind:this={wrap}>
		<svg
			width={width || "100%"}
			{height}
			aria-label="Treemap of problems per repository"
		>
			{#each cells as c}
				<g
					role="img"
					aria-label={`${c.data.repository}: ${c.data.count} tasks`}
					on:mouseenter={(e) => hoverCell(c, e)}
					on:mousemove={(e) => hoverCell(c, e)}
					on:mouseleave={clearHover}
				>
					<rect
						x={c.x0}
						y={c.y0}
						width={c.x1 - c.x0}
						height={c.y1 - c.y0}
						fill={colorFor(c, totalProblems)}
						stroke="white"
						stroke-width="1"
					/>
					{#if labelVisible(c)}
						<text
							x={c.x0 + 8}
							y={c.y0 + 18}
							class="cell-label"
							fill={c.value / totalProblems > 0.04
								? "#fff"
								: "var(--text-primary)"}
						>
							{c.data.repository}
						</text>
						<text
							x={c.x0 + 8}
							y={c.y0 + 34}
							class="cell-count"
							fill={c.value / totalProblems > 0.04
								? "rgba(255,255,255,0.85)"
								: "var(--text-muted)"}
						>
							{c.data.count} task{c.data.count === 1 ? "" : "s"}
						</text>
					{/if}
				</g>
			{/each}
		</svg>

		{#if hovered}
			<div
				class="tooltip"
				class:flip-x={flipX}
				class:flip-y={flipY}
				style="left: {tipX}px; top: {tipY}px;"
				role="tooltip"
			>
				<div class="tip-repo">{hovered.data.repository}</div>
				<div class="tip-count">
					<strong>{hovered.data.count}</strong> task{hovered.data.count === 1
						? ""
						: "s"}
					<span class="tip-pct">
						({((hovered.value / totalProblems) * 100).toFixed(1)}%)
					</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.treemap-block {
		display: flex;
		flex-direction: column;
	}

	.treemap-meta {
		display: flex;
		justify-content: space-between;
		font-family: var(--sans);
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-bottom: var(--space-sm);
		flex-wrap: wrap;
		gap: 4px;
	}

	.treemap-title {
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.treemap-wrap {
		position: relative;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
	}

	.treemap-wrap :global(svg) {
		display: block;
	}

	.treemap-wrap :global(g) {
		cursor: default;
		transition: opacity 100ms;
	}

	.treemap-wrap:hover :global(g:not(:hover)) {
		opacity: 0.55;
	}

	.cell-label {
		font-family: var(--mono);
		font-size: 0.78rem;
		font-weight: 600;
		pointer-events: none;
	}

	.cell-count {
		font-family: var(--sans);
		font-size: 0.7rem;
		pointer-events: none;
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
		box-shadow: var(--shadow-lg, 0 4px 16px rgba(15, 23, 42, 0.18));
		z-index: 5;
		white-space: nowrap;
	}

	.tooltip.flip-x {
		transform: translate(calc(-100% - 12px), 12px);
	}

	.tooltip.flip-y {
		transform: translate(12px, calc(-100% - 12px));
	}

	.tooltip.flip-x.flip-y {
		transform: translate(calc(-100% - 12px), calc(-100% - 12px));
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
</style>
