<script>
	import { scalePoint, scaleLinear, scaleOrdinal } from "d3-scale";
	import { line } from "d3-shape";
	import { extent } from "d3-array";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Local vs global optimization";
	export let description =
		"Stratified advantage across hierarchy levels. Most agents are stronger at function-level (fine-grained) edits than module-level (coarse) refactors — OpenHands + Claude 4.0 Sonnet is the notable exception, dominating at the module level.";

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

	function rowKey(r) {
		return `${r.agent}|${r.model}`;
	}

	function dashFor(r) {
		return AGENT_DASH[r.agent] ?? "";
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

	<div class="chart-wrap">
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

				<!-- series paths — straight segments between level points so the
				     line carries no hidden interpolation. -->
				{#each rows as r (rowKey(r))}
					{@const k = rowKey(r)}
					{@const dimmed = hoveredKey && hoveredKey !== k}
					<path
						class="series-line"
						class:dimmed
						class:hovered={hoveredKey === k}
						d={linePath(seriesFor(r))}
						stroke={MODEL_COLORS(r.model)}
						stroke-dasharray={dashFor(r)}
						fill="none"
						on:mouseenter={() => (hoveredKey = k)}
						on:mouseleave={() => (hoveredKey = null)}
						role="img"
						aria-label={`${r.agent} ${r.model}: module ${fmtAdv(r.level4)}, class ${fmtAdv(r.level3)}, function ${fmtAdv(r.level2)}`}
					></path>
					{#each seriesFor(r) as pt}
						<circle
							class="series-dot"
							class:dimmed
							cx={x(pt.key)}
							cy={y(pt.value)}
							r={hoveredKey === k ? 5 : 3.5}
							fill={MODEL_COLORS(r.model)}
						>
							<title>{r.agent} · {r.model} — {fmtAdv(pt.value)}</title>
						</circle>
					{/each}
				{/each}
			</g>
		</svg>
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

	.chart-wrap {
		width: 100%;
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

	.series-line {
		stroke-width: 2;
		opacity: 0.9;
		cursor: pointer;
		transition: opacity 120ms, stroke-width 120ms;
	}

	.series-line.hovered {
		stroke-width: 3.2;
		opacity: 1;
	}

	.series-line.dimmed {
		opacity: 0.18;
	}

	.series-dot {
		transition: opacity 120ms, r 120ms;
	}

	.series-dot.dimmed {
		opacity: 0.18;
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
