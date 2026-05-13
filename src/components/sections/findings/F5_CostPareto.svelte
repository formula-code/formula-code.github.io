<script>
	import LegendScatter from "$components/charts/LegendScatter.svelte";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import NeedsExportNotice from "./NeedsExportNotice.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Cost efficiency";
	export let description =
		"The Pareto frontier is dominated by the priciest model (Claude 4.0 Sonnet) — cheaper models burn more tokens inside the agent loop, eroding their per-token savings, and may simply lack the capability to reason about performance edits.";

	const data = findings.f5_cost;
	$: rows = data.rows || [];
	$: hasData = rows.length > 0;

	// Paper Figure 4 (cost_vs_performance.pdf): x = cost/task, y = mean
	// advantage. The dashed Pareto backdrop is a website-only addition.
	$: paretoFrontier = rows
		.filter((r) => r.is_pareto)
		.slice()
		.sort((a, b) => a.cost_usd_per_task - b.cost_usd_per_task);

	function fmtCost(v) {
		if (!Number.isFinite(v)) return "—";
		if (v < 1) return `$${v.toFixed(2)}`;
		return `$${v.toFixed(2)}`;
	}

	function fmtAdv(v) {
		if (!Number.isFinite(v)) return "—";
		return `${v >= 0 ? "+" : ""}${v.toFixed(3)}`;
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
		<LegendScatter
			{rows}
			xAccessor={(r) => r.cost_usd_per_task}
			yAccessor={(r) => r.advantage}
			xLabel="Mean cost (USD / task)"
			yLabel="Mean advantage"
			xFormat={fmtCost}
			yFormat={fmtAdv}
			xDomain={[0, 8]}
			yDomain={[-0.1, 0]}
			xTickCount={5}
			yTickCount={6}
			xBetterDir="lower"
			yBetterDir="higher"
			backdropLine={paretoFrontier}
			caption="Per-task cost (x) vs. mean advantage over the expert (y) for each agent-model configuration."
		>
			<svelte:fragment slot="tooltip-extra" let:row>
				{#if row.is_pareto}
					<div class="tt-row tt-pareto">
						<dt>Pareto</dt>
						<dd>frontier</dd>
					</div>
				{/if}
			</svelte:fragment>
		</LegendScatter>
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

	.tt-row {
		display: flex;
		justify-content: space-between;
		gap: 16px;
	}

	.tt-row.tt-pareto dt {
		color: var(--text-muted);
		text-transform: uppercase;
		font-size: 0.68rem;
		letter-spacing: 0.05em;
	}

	.tt-row.tt-pareto dd {
		margin: 0;
		font-family: var(--sans);
		font-size: 0.78rem;
		color: var(--brand-blue, var(--accent-primary));
		font-weight: 600;
	}
</style>
