<script>
	import { scaleLinear } from "d3-scale";
	import { extent } from "d3-array";
	import { line as d3line } from "d3-shape";
	import {
		agentColor,
		markerPath,
		sortAgents,
		sortModels,
		PLACEHOLDER_MODEL,
		EXPERT_AGENT,
		EXPERT_MARKER_MODEL
	} from "$utils/agentVisuals.js";

	// A reusable scatter plot designed to mirror the paper figures
	// `cost_vs_performance.pdf` (F5) and `tradeoff.pdf` (F6): one dot per
	// (agent, model) config, color = agent, marker = model, "Better" arrow in
	// a configurable corner, two-row legend at the bottom. Hover any dot to see
	// its exact (agent, model, x, y) values in a floating tooltip.

	export let rows = [];
	export let xAccessor;
	export let yAccessor;
	export let agentAccessor = (r) => r.agent;
	export let modelAccessor = (r) => r.model;
	export let xLabel = "";
	export let yLabel = "";
	export let xFormat = (v) => `${v}`;
	export let yFormat = (v) => `${v}`;
	export let xDomain = null;
	export let yDomain = null;
	export let xTickCount = 6;
	export let yTickCount = 5;
	export let xMinFloor = null;
	export let xMaxCeil = null;
	export let yMinFloor = null;
	export let yMaxCeil = null;
	// "higher" or "lower" — appended to the axis title as a muted "(higher is
	// better)" / "(lower is better)" cue. Replaces the older diagonal-arrow
	// annotation, which fought with the larger marker sizes.
	export let xBetterDir = null;
	export let yBetterDir = null;
	// Optional faint dashed line drawn behind the dots (e.g., F5 Pareto frontier).
	// Pass an array of point objects in the order they should be connected.
	export let backdropLine = null;
	export let caption = "";

	const W = 760;
	const H = 420;
	const M = { top: 28, right: 28, bottom: 56, left: 72 };
	const iw = W - M.left - M.right;
	const ih = H - M.top - M.bottom;

	$: hasData = Array.isArray(rows) && rows.length > 0;

	$: xExtent = hasData
		? extent(rows, (r) => xAccessor(r))
		: [0, 1];
	$: yExtent = hasData
		? extent(rows, (r) => yAccessor(r))
		: [0, 1];

	function applyFloors([lo, hi], floor, ceil) {
		let l = lo;
		let h = hi;
		if (typeof floor === "number") l = Math.min(l, floor);
		if (typeof ceil === "number") h = Math.max(h, ceil);
		if (l === h) {
			l -= 0.5;
			h += 0.5;
		}
		return [l, h];
	}

	$: paddedX = (() => {
		const [lo, hi] = applyFloors(xExtent, xMinFloor, xMaxCeil);
		const pad = (hi - lo) * 0.08 || 0.05;
		const start = typeof xMinFloor === "number" ? Math.min(lo, xMinFloor) : lo - pad;
		const end = typeof xMaxCeil === "number" ? Math.max(hi, xMaxCeil) : hi + pad;
		return [start, end];
	})();

	$: paddedY = (() => {
		const [lo, hi] = applyFloors(yExtent, yMinFloor, yMaxCeil);
		const pad = (hi - lo) * 0.12 || 0.05;
		const start = typeof yMinFloor === "number" ? Math.min(lo, yMinFloor) : lo - pad;
		const end = typeof yMaxCeil === "number" ? Math.max(hi, yMaxCeil) : hi + pad;
		return [start, end];
	})();

	$: xScale = (() => {
		const s = scaleLinear().domain(xDomain || paddedX);
		if (!xDomain) s.nice(xTickCount);
		return s.range([0, iw]);
	})();

	$: yScale = (() => {
		const s = scaleLinear().domain(yDomain || paddedY);
		if (!yDomain) s.nice(yTickCount);
		return s.range([ih, 0]);
	})();

	$: xTicks = xScale.ticks(xTickCount);
	$: yTicks = yScale.ticks(yTickCount);

	// Stable agent / model lists for the legend rows — derived from the data
	// (so we only show what's actually plotted) and sorted into a canonical
	// order so F5 and F6 line up. `(oracle)` is the API's placeholder for the
	// human-expert baseline and isn't a real model, so we drop it from the
	// model legend; the human expert shows up under the agent legend with its
	// own marker shape instead.
	$: agentsInUse = Array.from(new Set(rows.map((r) => agentAccessor(r)))).sort(
		sortAgents
	);
	$: modelsInUse = Array.from(new Set(rows.map((r) => modelAccessor(r))))
		.filter((m) => m !== PLACEHOLDER_MODEL)
		.sort(sortModels);

	$: linePath = d3line()
		.x((d) => xScale(xAccessor(d)))
		.y((d) => yScale(yAccessor(d)));

	$: backdropPath = backdropLine && backdropLine.length >= 2
		? linePath(backdropLine)
		: null;

	let hovered = null;
	let tooltipX = 0;
	let tooltipY = 0;
	let tooltipFlipX = false;
	let tooltipFlipY = false;
	let containerEl;
	let tooltipEl;

	function updateTooltipPlacement() {
		const rect = containerEl?.getBoundingClientRect();
		const tip = tooltipEl?.getBoundingClientRect();
		if (!rect) return;
		const gap = 14;
		// Use a conservative tooltip size estimate on the first frame
		// (before the element is measured), so the very first hover still
		// flips correctly near the edges.
		const tw = tip?.width || 220;
		const th = tip?.height || 80;
		tooltipFlipX = tooltipX + gap + tw > rect.width;
		tooltipFlipY = tooltipY + gap + th > rect.height;
	}

	function onPointEnter(event, row) {
		hovered = row;
		const rect = containerEl?.getBoundingClientRect();
		if (rect) {
			tooltipX = event.clientX - rect.left;
			tooltipY = event.clientY - rect.top;
		}
		updateTooltipPlacement();
	}

	function onPointMove(event) {
		if (!hovered) return;
		const rect = containerEl?.getBoundingClientRect();
		if (rect) {
			tooltipX = event.clientX - rect.left;
			tooltipY = event.clientY - rect.top;
		}
		updateTooltipPlacement();
	}

	function onPointLeave() {
		hovered = null;
	}

	$: tooltipLeft = tooltipFlipX ? tooltipX - 14 : tooltipX + 14;
	$: tooltipTop = tooltipFlipY ? tooltipY - 14 : tooltipY + 14;
	$: tooltipTransform = `translate(${tooltipFlipX ? "-100%" : "0"}, ${tooltipFlipY ? "-100%" : "0"})`;

</script>

<div class="ls-wrap" bind:this={containerEl}>
	{#if caption}
		<div class="ls-caption">{caption}</div>
	{/if}
	<svg
		class="ls-chart"
		viewBox="0 0 {W} {H}"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-label="{xLabel} vs {yLabel} by agent and model"
	>
		<g transform="translate({M.left},{M.top})">
			<!-- grid -->
			{#each yTicks as t}
				<line class="grid" x1="0" x2={iw} y1={yScale(t)} y2={yScale(t)}></line>
			{/each}
			{#each xTicks as t}
				<line class="grid" x1={xScale(t)} x2={xScale(t)} y1="0" y2={ih}></line>
			{/each}

			<!-- backdrop line (e.g., Pareto frontier) -->
			{#if backdropPath}
				<path class="backdrop-line" d={backdropPath}></path>
			{/if}

			<!-- axes -->
			<line class="axis" x1="0" x2={iw} y1={ih} y2={ih}></line>
			<line class="axis" x1="0" x2="0" y1="0" y2={ih}></line>

			<!-- y ticks: bottom-most label is nudged upward so it sits
			     above the x-axis line instead of colliding with the
			     leftmost x-tick label below it -->
			{#each yTicks as t, i}
				<text
					class="tick tick-y"
					x={-10}
					y={yScale(t)}
					dy={i === 0 ? "-0.45em" : "0.32em"}
				>
					{yFormat(t)}
				</text>
			{/each}

			<!-- x ticks -->
			{#each xTicks as t}
				<text class="tick tick-x" x={xScale(t)} y={ih + 18} text-anchor="middle">
					{xFormat(t)}
				</text>
			{/each}

			<!-- axis titles (with inline arrow + "better" cue) -->
			<text class="axis-title" x={iw / 2} y={ih + 46} text-anchor="middle">
				<tspan>{xLabel}</tspan>
				{#if xBetterDir}
					<tspan class="axis-better" dx="10"
						>{xBetterDir === "higher" ? "↑" : "↓"} better</tspan
					>
				{/if}
			</text>
			<text
				class="axis-title axis-title-y"
				transform="translate({-54},{ih / 2}) rotate(-90)"
				text-anchor="middle"
			>
				<tspan>{yLabel}</tspan>
				{#if yBetterDir}
					<tspan class="axis-better" dx="10"
						>{yBetterDir === "higher" ? "↑" : "↓"} better</tspan
					>
				{/if}
			</text>

			<!-- markers -->
			{#each rows as r, i (`${agentAccessor(r)}-${modelAccessor(r)}-${i}`)}
				{@const isActive = hovered && hovered === r}
				<path
					class="marker"
					class:active={isActive}
					d={markerPath(modelAccessor(r), isActive ? 790 : 586)}
					fill={agentColor(agentAccessor(r))}
					transform="translate({xScale(xAccessor(r))},{yScale(yAccessor(r))})"
					on:mouseenter={(e) => onPointEnter(e, r)}
					on:mousemove={onPointMove}
					on:mouseleave={onPointLeave}
					on:focus={(e) => onPointEnter(e, r)}
					on:blur={onPointLeave}
					tabindex="0"
					role="button"
					aria-label="{agentAccessor(r)} {modelAccessor(r)}: {xLabel} {xFormat(xAccessor(r))}, {yLabel} {yFormat(yAccessor(r))}"
				></path>
			{/each}
		</g>
	</svg>

	{#if hovered}
		<div
			class="ls-tooltip"
			bind:this={tooltipEl}
			style="left:{tooltipLeft}px; top:{tooltipTop}px; transform:{tooltipTransform};"
			role="tooltip"
		>
			<div class="tt-head">
				<span
					class="tt-swatch"
					style="background:{agentColor(agentAccessor(hovered))}"
					aria-hidden="true"
				></span>
				<strong>{agentAccessor(hovered)}</strong>
				<span class="tt-model">{modelAccessor(hovered)}</span>
			</div>
			<dl class="tt-rows">
				<div class="tt-row">
					<dt>{xLabel}</dt>
					<dd>{xFormat(xAccessor(hovered))}</dd>
				</div>
				<div class="tt-row">
					<dt>{yLabel}</dt>
					<dd>{yFormat(yAccessor(hovered))}</dd>
				</div>
				<slot name="tooltip-extra" row={hovered} />
			</dl>
		</div>
	{/if}

	<div class="ls-legend">
		<div class="legend-group">
			<span class="legend-title">Model</span>
			<ul class="legend-list">
				{#each modelsInUse as m (m)}
					<li>
						<svg class="legend-mark" width="16" height="16" viewBox="-8 -8 16 16" aria-hidden="true">
							<path d={markerPath(m, 80)} fill="#374151"></path>
						</svg>
						<span>{m}</span>
					</li>
				{/each}
			</ul>
		</div>
		<div class="legend-group">
			<span class="legend-title">Agent harness</span>
			<ul class="legend-list">
				{#each agentsInUse as a (a)}
					<li>
						{#if a === EXPERT_AGENT}
							<svg
								class="legend-mark"
								width="16"
								height="16"
								viewBox="-8 -8 16 16"
								aria-hidden="true"
							>
								<path
									d={markerPath(EXPERT_MARKER_MODEL, 80)}
									fill={agentColor(a)}
								></path>
							</svg>
						{:else}
							<span
								class="legend-swatch"
								style="background:{agentColor(a)}"
								aria-hidden="true"
							></span>
						{/if}
						<span>{a}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>

<style>
	.ls-wrap {
		position: relative;
		width: 100%;
		overflow-x: auto;
		border-radius: var(--radius);
		border: 1px solid var(--border-primary);
		background: var(--bg-primary);
		padding: 8px 4px 4px;
	}

	.ls-caption {
		text-align: left;
		padding: 12px 14px;
		font-family: var(--sans);
		font-size: 0.85rem;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border-primary);
		margin: -8px -4px 8px;
		line-height: 1.5;
	}

	.ls-chart {
		width: 100%;
		height: auto;
		display: block;
		font-family: var(--sans);
		overflow: visible;
	}

	.legend-mark {
		width: 16px;
		height: 16px;
		overflow: visible;
		flex: 0 0 auto;
	}

	.grid {
		stroke: var(--border-primary);
		stroke-width: 1;
		stroke-dasharray: 2 4;
		opacity: 0.7;
	}

	.axis {
		stroke: var(--border-secondary);
		stroke-width: 1;
	}

	.tick {
		font-size: 11px;
		fill: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.tick-y {
		text-anchor: end;
	}

	.axis-title {
		font-size: 12px;
		fill: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.axis-better {
		font-size: 13px;
		fill: var(--text-primary);
		text-transform: none;
		letter-spacing: 0;
		font-weight: 600;
		opacity: 0.9;
	}

	/* viewBox is 760x420; on a ~440px-wide mobile card the SVG shrinks
	   ~0.58x, so the desktop sizes above render below the 80%-of-caption
	   legibility floor (~11.5px). Bump them in SVG units to compensate.
	   The rotated y-axis title would collide with the bigger y-tick labels
	   in the cramped left margin, so we hide it on mobile — the chart
	   description above already names the y dimension. */
	@media (max-width: 820px) {
		.tick {
			font-size: 18px;
		}
		.axis-title {
			font-size: 20px;
		}
		.axis-better {
			font-size: 22px;
		}
		.axis-title-y {
			display: none;
		}
	}

	.backdrop-line {
		stroke: var(--text-muted);
		stroke-width: 1.4;
		stroke-dasharray: 4 4;
		fill: none;
		opacity: 0.4;
	}

	.marker {
		stroke: var(--bg-primary);
		stroke-width: 1.4;
		cursor: pointer;
		transition: opacity 120ms ease, transform 120ms ease;
		transform-box: fill-box;
		transform-origin: center;
	}

	.marker:focus {
		outline: none;
	}

	.marker.active {
		stroke: #0f172a;
		stroke-width: 2;
	}

	.ls-tooltip {
		position: absolute;
		z-index: 10;
		pointer-events: none;
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 10px 12px;
		font-family: var(--sans);
		font-size: 0.82rem;
		color: var(--text-primary);
		min-width: 200px;
	}

	.tt-head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
	}

	.tt-swatch {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 2px;
		flex: 0 0 auto;
	}

	.tt-model {
		color: var(--text-muted);
		font-size: 0.78rem;
	}

	.tt-rows {
		margin: 0;
		display: grid;
		gap: 2px;
	}

	.tt-row {
		display: flex;
		justify-content: space-between;
		gap: 16px;
	}

	.tt-row dt {
		color: var(--text-muted);
		text-transform: uppercase;
		font-size: 0.68rem;
		letter-spacing: 0.05em;
	}

	.tt-row dd {
		margin: 0;
		font-variant-numeric: tabular-nums;
		font-family: var(--mono);
		font-size: 0.82rem;
	}

	.ls-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 16px 36px;
		padding: 16px 4px 0;
		font-family: var(--sans);
	}

	.legend-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.legend-title {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.legend-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px 18px;
	}

	.legend-list li {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 0.86rem;
		color: var(--text-primary);
	}

	.legend-mark {
		flex: 0 0 auto;
	}

	.legend-swatch {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		display: inline-block;
		flex: 0 0 auto;
	}
</style>
