<script>
	import { scalePoint, scaleLinear, scaleOrdinal } from "d3-scale";
	import { line } from "d3-shape";
	import { extent } from "d3-array";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Local vs global optimization";
	export let description =
		"Each agent–model has a characteristic profile across module → class → function edits. Most are strongest at fine-grained, function-level changes; OpenHands + Claude 4.0 Sonnet inverts the pattern, leading at the module level while ceding ground on smaller-scale edits.";

	const data = findings.f2_stratified;
	const levels = data.levels; // [{key, label}, ...]
	const rows = data.rows;

	// Layout — wider chart now that the legend lives below.
	const W = 760;
	const H = 380;
	const M = { top: 24, right: 24, bottom: 56, left: 64 };
	const iw = W - M.left - M.right;
	const ih = H - M.top - M.bottom;

	// Color the line by model; encode the agent harness with line style
	// (OpenHands → dashed, Terminus → solid). One color per model so the eye
	// groups by "what LLM is driving this," not by configuration index.
	const MODEL_COLORS = scaleOrdinal()
		.domain(["Claude 4.0 Sonnet", "GPT-5", "Qwen 3 Coder", "Gemini 2.5 Pro"])
		.range(["#c47e2e", "#0ea36b", "#7c3aed", "#2563eb"]);

	const AGENT_DASH = {
		OpenHands: "6 4",
		"Terminus 2": ""
	};

	$: x = scalePoint()
		.domain(levels.map((l) => l.key))
		.range([0, iw])
		.padding(0.18);

	$: yDomain = (() => {
		const vals = [];
		for (const r of rows) for (const l of levels) vals.push(r[l.key]);
		const [lo, hi] = extent(vals);
		const pad = Math.max(0.05, (hi - lo) * 0.12);
		return [Math.min(lo - pad, -0.15), Math.max(hi + pad, 0.15)];
	})();

	$: y = scaleLinear().domain(yDomain).range([ih, 0]);

	$: linePath = line()
		.x((d) => x(d.key))
		.y((d) => y(d.value));

	function seriesFor(row) {
		return levels.map((l) => ({ key: l.key, value: row[l.key] }));
	}

	// Highlight handling — hover/focus a series to bring it forward.
	let hoveredKey = null;
	let hoveredRow = null;
	let tooltipX = 0;
	let tooltipY = 0;
	let chartWrap;

	function rowKey(r) {
		return `${r.agent}|${r.model}`;
	}

	function dashFor(r) {
		return AGENT_DASH[r.agent] ?? "";
	}

	function onRowEnter(event, r) {
		hoveredKey = rowKey(r);
		hoveredRow = r;
		updateTooltipPos(event);
	}

	function updateTooltipPos(event) {
		const rect = chartWrap?.getBoundingClientRect();
		if (!rect) return;
		tooltipX = event.clientX - rect.left;
		tooltipY = event.clientY - rect.top;
	}

	function onRowLeave() {
		hoveredKey = null;
		hoveredRow = null;
	}

	$: yTicks = (() => {
		const [lo, hi] = yDomain;
		const step = (hi - lo) / 5;
		return Array.from({ length: 6 }, (_, i) => lo + step * i);
	})();

	function fmtAdv(v) {
		if (typeof v !== "number" || !Number.isFinite(v)) return "—";
		return `${v >= 0 ? "+" : ""}${v.toFixed(3)}`;
	}
</script>

<section class="f2">
	<header class="f2-head">
		<h3 class="f2-title">{title}</h3>
		<p class="f2-desc">{description}</p>
	</header>

	<div class="f2-frame">
		<div class="f2-caption">
			Stratified advantage at each aggregation level for every
			agent–model configuration. Each line shows whether a
			configuration favors coarse module-level changes or
			fine-grained function-level edits.
		</div>

		<div class="chart-wrap" bind:this={chartWrap}>
		<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Stratified advantage by hierarchy level for each agent–model configuration">
			<g transform="translate({M.left},{M.top})">
				<!-- y grid + axis -->
				{#each yTicks as t}
					<line
						class="grid"
						x1="0"
						x2={iw}
						y1={y(t)}
						y2={y(t)}
						class:zero={Math.abs(t) < 1e-9}
					></line>
					<text class="tick-label-y" x={-8} y={y(t)} dy="0.32em">
						{t >= 0 ? "+" : ""}{t.toFixed(2)}
					</text>
				{/each}

				<!-- x axis ticks: just the level name (Module / Class / Function). -->
				{#each levels as l}
					<text class="tick-label-x" x={x(l.key)} y={ih + 22} text-anchor="middle">
						{l.label}
					</text>
				{/each}

				<!-- y axis title -->
				<text class="axis-title" transform="translate({-46},{ih / 2}) rotate(-90)" text-anchor="middle">
					Stratified advantage
				</text>

				<!-- series paths — straight segments between level points. Each
				     series renders twice: a wide invisible "hit target" path that
				     captures hover even off the visible stroke, and the visible
				     colored path on top. -->
				{#each rows as r (rowKey(r))}
					{@const k = rowKey(r)}
					{@const dimmed = hoveredKey && hoveredKey !== k}
					<path
						class="series-hit"
						d={linePath(seriesFor(r))}
						on:mouseenter={(e) => onRowEnter(e, r)}
						on:mousemove={updateTooltipPos}
						on:mouseleave={onRowLeave}
						role="img"
						aria-label={`${r.agent} ${r.model}: ${levels.map((l) => `${l.label} ${fmtAdv(r[l.key])}`).join(", ")}`}
					></path>
					<path
						class="series-line"
						class:dimmed
						class:hovered={hoveredKey === k}
						d={linePath(seriesFor(r))}
						stroke={MODEL_COLORS(r.model)}
						stroke-dasharray={dashFor(r)}
						fill="none"
						pointer-events="none"
					></path>
					{#each seriesFor(r) as pt}
						<circle
							class="series-dot"
							class:dimmed
							cx={x(pt.key)}
							cy={y(pt.value)}
							r={hoveredKey === k ? 6 : 4.5}
							fill={MODEL_COLORS(r.model)}
							role="img"
							aria-label={`${r.agent} ${r.model} at ${pt.key}: ${fmtAdv(pt.value)}`}
							on:mouseenter={(e) => onRowEnter(e, r)}
							on:mousemove={updateTooltipPos}
							on:mouseleave={onRowLeave}
						></circle>
					{/each}
				{/each}
			</g>
		</svg>

		{#if hoveredRow}
			<div
				class="f2-tooltip"
				style="left:{tooltipX + 14}px; top:{tooltipY + 14}px;"
				role="tooltip"
			>
				<div class="tt-head">
					<span
						class="tt-swatch"
						style="background:{MODEL_COLORS(hoveredRow.model)}"
						aria-hidden="true"
					></span>
					<strong>{hoveredRow.agent}</strong>
					<span class="tt-model">{hoveredRow.model}</span>
				</div>
				<dl class="tt-rows">
					{#each levels as l}
						<div class="tt-row">
							<dt>{l.label}</dt>
							<dd>{fmtAdv(hoveredRow[l.key])}</dd>
						</div>
					{/each}
				</dl>
			</div>
		{/if}
	</div>

	<!-- legend below: column 1 = model (color swatches), column 2 = agent (line styles) -->
	<div class="legend-bottom">
		<div class="legend-group">
			<span class="legend-title">Model</span>
			<ul class="legend-list">
				{#each MODEL_COLORS.domain() as m}
					<li>
						<span
							class="swatch model"
							style="background:{MODEL_COLORS(m)}"
							aria-hidden="true"
						></span>
						<span>{m}</span>
					</li>
				{/each}
			</ul>
		</div>
		<div class="legend-group">
			<span class="legend-title">Agent harness</span>
			<ul class="legend-list">
				<li>
					<span class="swatch line solid" aria-hidden="true"></span>
					<span>Terminus 2 (solid)</span>
				</li>
				<li>
					<span class="swatch line dashed" aria-hidden="true"></span>
					<span>OpenHands (dashed)</span>
				</li>
			</ul>
		</div>
	</div>
	</div>

	<PaperFigureCaption
		artifact="Figure 3 (Stratified advantage)"
		arxivUrl={data._arxiv}
		needsExport={needsExport(data)}
	/>
</section>

<style>
	.f2 {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.f2-head {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.f2-title {
		margin: 0;
		font-family: var(--sans);
		font-size: 1.05rem;
		color: var(--text-primary);
	}

	.f2-desc {
		margin: 0;
		font-family: var(--sans);
		font-size: 0.9rem;
		color: var(--text-muted);
		line-height: 1.55;
	}

	.f2-frame {
		overflow-x: auto;
		border-radius: var(--radius);
		border: 1px solid var(--border-primary);
		background: var(--bg-primary);
		padding: 8px 4px 4px;
	}

	.chart-wrap {
		width: 100%;
		position: relative;
	}

	.f2-caption {
		text-align: left;
		padding: 12px 14px;
		font-family: var(--sans);
		font-size: 0.85rem;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border-primary);
		margin: -8px -4px 8px;
		line-height: 1.5;
	}

	svg {
		width: 100%;
		height: auto;
		display: block;
		font-family: var(--sans);
	}

	.grid {
		stroke: var(--border-primary);
		stroke-width: 1;
	}

	.grid.zero {
		stroke: var(--border-secondary);
		stroke-width: 1.4;
	}

	.tick-label-y,
	.tick-label-x {
		font-size: 12px;
		fill: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.tick-label-y {
		text-anchor: end;
	}

	.axis-title {
		font-size: 12px;
		fill: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	/* The chart's viewBox is 760x380 — on a ~440px-wide mobile card the SVG
	   shrinks by ~0.58x, so 12px in SVG coords renders as ~7px on screen.
	   Bump tick labels to keep effective size ≥80% of the description
	   (0.9rem ≈ 14.4px → ~11.5px target). The rotated y-axis title would
	   collide with the bigger tick labels in the cramped left margin, so we
	   hide it — the chart description above already names the metric. */
	@media (max-width: 820px) {
		.tick-label-y,
		.tick-label-x {
			font-size: 20px;
		}
		.axis-title {
			display: none;
		}
	}

	.series-line {
		stroke-width: 3;
		opacity: 0.9;
		transition: opacity 120ms, stroke-width 120ms;
	}

	.series-line.hovered {
		stroke-width: 4.5;
		opacity: 1;
	}

	.series-line.dimmed {
		opacity: 0.2;
	}

	.series-hit {
		stroke: transparent;
		stroke-width: 18;
		fill: none;
		cursor: pointer;
	}

	.series-dot {
		cursor: pointer;
		transition: opacity 120ms, r 120ms;
	}

	.series-dot.dimmed {
		opacity: 0.2;
	}

	.f2-tooltip {
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
		min-width: 220px;
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

	.legend-bottom {
		display: flex;
		flex-wrap: wrap;
		gap: 24px 40px;
		padding: 12px 4px 0;
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
		font-size: 0.88rem;
		color: var(--text-primary);
	}

	.swatch {
		display: inline-block;
		flex: 0 0 auto;
	}

	.swatch.model {
		width: 14px;
		height: 14px;
		border-radius: 3px;
	}

	.swatch.line {
		width: 28px;
		height: 0;
		border-top: 2px solid var(--text-primary);
	}

	.swatch.line.dashed {
		border-top-style: dashed;
	}
</style>
