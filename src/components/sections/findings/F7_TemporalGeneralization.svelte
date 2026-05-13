<script>
	import HeatmapGrid from "$components/charts/HeatmapGrid.svelte";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import NeedsExportNotice from "./NeedsExportNotice.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Temporal generalization";
	export let description =
		"Performance does not consistently dip on tasks created after each model's knowledge cutoff, so the gap to the expert looks capability-bound rather than the result of seeing the answer at training time.";

	const data = findings.f7_temporal;
	const bins = data.bins || [];
	const rawRows = data.rows || [];

	$: rowLabels = rawRows.map((r) => r.model);
	$: colLabels = bins.map((b) => b.label);
	$: values = rawRows.map((r) =>
		(r.speedups || []).slice(0, bins.length)
	);

	// The two trailing bins (post0to3, post3to6, post6plus = indices 3, 4, 5)
	// sit AFTER each model's knowledge cutoff. Drawing a divider between the
	// pre/post halves makes the "no consistent drop" story visible at a
	// glance: bins 0–2 on the left mirror bins 3–5 on the right.
	const annotations = [
		{
			type: "divider",
			after: 2, // between "0–3 mo before" and "0–3 mo after"
			label: "Knowledge cutoff"
		}
	];

	function fmt(v) {
		if (!Number.isFinite(v)) return "—";
		return `${v.toFixed(3)}x`;
	}
</script>

<section class="f7">
	<header class="f7-head">
		<h3 class="f7-title">{title}</h3>
		<p class="f7-desc">{description}</p>
	</header>

	{#if needsExport(data) || rawRows.length === 0}
		<NeedsExportNotice
			summary="Per-model temporal bin speedups are not yet exported."
		/>
	{:else}
		<HeatmapGrid
			{rowLabels}
			{colLabels}
			{values}
			{annotations}
			colorMode="sequential"
			scaling="shared"
			legendCaps={["Lower speedup", "Higher speedup"]}
			valueFormat={fmt}
			rowLabelWidth={250}
			colWidth={88}
			topLabelHeight={140}
			colDimensionLabel="Time relative to cutoff"
			caption="Mean geomean speedup per model in three-month bins relative to its knowledge cutoff (columns left of center = before cutoff, right = after). Cells share a single color scale; darker blue = higher speedup."
		/>
	{/if}

	<PaperFigureCaption
		artifact="Table 4 (Temporal generalization)"
		arxivUrl={data._arxiv}
		needsExport={needsExport(data)}
	/>
</section>

<style>
	.f7 {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.f7-head {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.f7-title {
		margin: 0;
		font-family: var(--sans);
		font-size: 1.05rem;
		color: var(--text-primary);
	}

	.f7-desc {
		margin: 0;
		font-family: var(--sans);
		font-size: 0.9rem;
		color: var(--text-muted);
		line-height: 1.55;
	}
</style>
