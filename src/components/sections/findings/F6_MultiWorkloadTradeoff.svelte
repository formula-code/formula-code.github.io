<script>
	import { scaleLinear } from "d3-scale";
	import { extent } from "d3-array";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import NeedsExportNotice from "./NeedsExportNotice.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Multi-workload tradeoffs";
	export let description =
		"Each task's global speedup vs. its worst-workload speedup. Human experts attain high global speedup while tolerating large worst-workload regressions; agents struggle to negotiate the same tradeoff.";

	const data = findings.f6_tradeoff;
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
				.domain(extent(rows, (r) => r.worst_workload_speedup ?? 1))
				.nice()
				.range([0, iw])
		: scaleLinear().domain([0.5, 3]).range([0, iw]);

	$: y = hasData
		? scaleLinear()
				.domain(extent(rows, (r) => r.global_speedup ?? 1))
				.nice()
				.range([ih, 0])
		: scaleLinear().domain([0.5, 3]).range([ih, 0]);
</script>

<section class="f6">
	<header class="f6-head">
		<h3 class="f6-title">{title}</h3>
		<p class="f6-desc">{description}</p>
	</header>

	{#if needsExport(data) || !hasData}
		<NeedsExportNotice
			summary="Per-task global and worst-workload speedups are not yet exported."
		/>
	{:else}
		<div class="chart-wrap">
			<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet">
				<g transform="translate({M.left},{M.top})">
					<!-- y=x identity line -->
					<line
						class="identity"
						x1={x(Math.max(x.domain()[0], y.domain()[0]))}
						y1={y(Math.max(x.domain()[0], y.domain()[0]))}
						x2={x(Math.min(x.domain()[1], y.domain()[1]))}
						y2={y(Math.min(x.domain()[1], y.domain()[1]))}
					></line>
					<line class="axis" x1="0" x2={iw} y1={ih} y2={ih}></line>
					<line class="axis" x1="0" x2="0" y1="0" y2={ih}></line>

					{#each rows as r, i (`${r.agent}-${r.model}-${r.task_id}-${i}`)}
						<circle
							class="pt"
							class:expert={r.is_expert}
							cx={x(r.worst_workload_speedup)}
							cy={y(r.global_speedup)}
							r={r.is_expert ? 5 : 3}
						></circle>
					{/each}

					<text class="axis-title" x={iw / 2} y={ih + 38} text-anchor="middle">
						Worst-workload speedup (×)
					</text>
					<text class="axis-title" transform="translate({-44},{ih / 2}) rotate(-90)" text-anchor="middle">
						Global speedup (×)
					</text>
				</g>
			</svg>
		</div>
	{/if}

	<PaperFigureCaption
		artifact="Figure 5 (Multi-workload tradeoff)"
		arxivUrl={data._arxiv}
		needsExport={needsExport(data)}
	/>
</section>

<style>
	.f6 {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.f6-head {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.f6-title {
		margin: 0;
		font-family: var(--sans);
		font-size: 1.05rem;
		color: var(--text-primary);
	}

	.f6-desc {
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

	.identity {
		stroke: var(--border-secondary);
		stroke-width: 1;
		stroke-dasharray: 4 4;
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
		opacity: 0.6;
	}

	.pt.expert {
		fill: var(--brand-blue, var(--accent-primary));
		opacity: 0.9;
		stroke: var(--bg-primary);
		stroke-width: 1.2;
	}
</style>
