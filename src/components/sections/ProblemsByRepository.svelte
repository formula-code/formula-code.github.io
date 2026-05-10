<script>
	import { onMount, tick } from "svelte";
	import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
	import dashboard from "$data/dashboard.json";

	const fmt = new Intl.NumberFormat("en-US");

	const data = dashboard.by_repository.map((d) => ({ ...d }));
	const totalProblems = data.reduce((s, d) => s + d.count, 0);

	let wrap;
	let width = 0;
	let height = 480;

	onMount(async () => {
		await tick();
		// Set initial width synchronously from layout, then keep it in sync.
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

	function hoverCell(c, ev) {
		hovered = c;
		const r = wrap.getBoundingClientRect();
		tipX = ev.clientX - r.left;
		tipY = ev.clientY - r.top;
	}

	function clearHover() {
		hovered = null;
	}

	function colorFor(c, total) {
		// Brand-red → muted slate gradient by share. Top contributors saturate.
		const share = c.value / total;
		const t = Math.min(1, share / 0.08); // 8% saturates
		// blend brand-red (220, 36, 24) → soft (245, 230, 230)
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

<section class="problems-by-repo">
	<div class="container">
		<div class="section-head">
			<div>
				<h2 class="section-title">Problems by repository</h2>
				<p class="section-subtitle">
					Each tile is a repository; size is the number of verified tasks it contributes.
					{fmt.format(totalProblems)} tasks across {data.length} repos.
				</p>
			</div>
		</div>

		<div class="treemap-wrap" bind:this={wrap} style="height: {height}px;">
			<svg width={width} height={height} aria-label="Treemap of problems per repository">
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
								fill={c.value / totalProblems > 0.04 ? "#fff" : "var(--text-primary)"}
							>
								{c.data.repository}
							</text>
							<text
								x={c.x0 + 8}
								y={c.y0 + 34}
								class="cell-count"
								fill={c.value / totalProblems > 0.04 ? "rgba(255,255,255,0.85)" : "var(--text-muted)"}
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
					style="left: {tipX}px; top: {tipY}px;"
					role="tooltip"
				>
					<div class="tip-repo">{hovered.data.repository}</div>
					<div class="tip-count">
						<strong>{hovered.data.count}</strong> task{hovered.data.count === 1 ? "" : "s"}
						<span class="tip-pct">
							({((hovered.value / totalProblems) * 100).toFixed(1)}%)
						</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	.problems-by-repo {
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
		margin-bottom: var(--space-md);
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

	.treemap-wrap {
		position: relative;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		overflow: hidden;
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

	@media (max-width: 600px) {
		.treemap-wrap {
			height: 360px !important;
		}
	}
</style>
