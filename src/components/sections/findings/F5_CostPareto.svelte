<script>
	import { scaleLog, scaleLinear } from "d3-scale";
	import { extent } from "d3-array";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import NeedsExportNotice from "./NeedsExportNotice.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Cost efficiency";
	export let description =
		"Per-task USD cost vs. cost-weighted advantage. The Pareto frontier is dominated by the most expensive frontier models — cheaper models often consume more tokens in the agent loop, eroding their per-token price advantage.";

	const data = findings.f5_cost;
	$: rows = data.rows || [];

	// Layout
	const W = 720;
	const H = 420;
	const M = { top: 24, right: 24, bottom: 56, left: 64 };
	const iw = W - M.left - M.right;
	const ih = H - M.top - M.bottom;

	$: hasData = rows.length > 0;

	$: x = hasData
		? scaleLinear()
				.domain(extent(rows, (r) => r.advantage_weighted ?? 0))
				.nice()
				.range([0, iw])
		: scaleLinear().domain([-0.1, 0.1]).range([0, iw]);

	$: y = hasData
		? scaleLog()
				.domain(extent(rows, (r) => r.cost_usd_per_task ?? 0.01))
				.nice()
				.range([ih, 0])
		: scaleLog().domain([0.01, 10]).range([ih, 0]);

	function fmtCost(v) {
		if (!Number.isFinite(v)) return "—";
		if (v < 1) return `$${v.toFixed(2)}`;
		return `$${v.toFixed(1)}`;
	}
</script>

<section class="f5">
	<header class="f5-head">
		<h3 class="f5-title">{title}</h3>
		<p class="f5-desc">{description}</p>
	</header>

	{#if needsExport(data) || !hasData}
		<NeedsExportNotice
			summary="Per-config cost and advantage are not yet exported; the Pareto frontier needs the full results set."
		/>
	{:else}
		<div class="chart-wrap">
			<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet">
				<g transform="translate({M.left},{M.top})">
					<!-- axes -->
					<line class="axis" x1="0" x2={iw} y1={ih} y2={ih}></line>
					<line class="axis" x1="0" x2="0" y1="0" y2={ih}></line>

					<!-- Pareto frontier connector (drawn first so dots stack on top) -->
					{#each rows.filter((r) => r.is_pareto) as p, i (i)}
						<!-- the export should pre-sort frontier points by x;
						     drawing as connected dots leaves the implementation simple -->
						<circle class="pareto-halo" cx={x(p.advantage_weighted)} cy={y(p.cost_usd_per_task)} r="12"></circle>
					{/each}

					<!-- points -->
					{#each rows as r, i (`${r.agent}-${r.model}-${i}`)}
						<circle
							class="pt"
							class:pareto={r.is_pareto}
							cx={x(r.advantage_weighted)}
							cy={y(r.cost_usd_per_task)}
							r={r.is_pareto ? 7 : 5}
						>
							<title>{r.agent} · {r.model} — adv {r.advantage_weighted?.toFixed(3)} @ {fmtCost(r.cost_usd_per_task)}</title>
						</circle>
					{/each}

					<text class="axis-title" x={iw / 2} y={ih + 38} text-anchor="middle">
						Cost-weighted advantage
					</text>
					<text class="axis-title" transform="translate({-44},{ih / 2}) rotate(-90)" text-anchor="middle">
						Cost (USD / task, log)
					</text>
				</g>
			</svg>
		</div>
	{/if}

	<PaperFigureCaption
		artifact="Figure 4 / Table 10 (Cost-Performance Pareto)"
		arxivUrl={data._arxiv}
		needsExport={needsExport(data)}
	/>
</section>

<style>
	.f5 {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.f5-head {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.f5-title {
		margin: 0;
		font-family: var(--sans);
		font-size: 1.05rem;
		color: var(--text-primary);
	}

	.f5-desc {
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
	}

	.axis {
		stroke: var(--border-secondary);
		stroke-width: 1;
	}

	.axis-title {
		font-family: var(--sans);
		font-size: 11px;
		fill: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.pt {
		fill: var(--accent-primary);
		opacity: 0.85;
		stroke: var(--bg-primary);
		stroke-width: 1.5;
	}

	.pt.pareto {
		fill: var(--brand-blue, var(--accent-primary));
	}

	.pareto-halo {
		fill: var(--brand-blue, var(--accent-primary));
		opacity: 0.12;
	}
</style>
