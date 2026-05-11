<script>
	import HeatmapTable from "./HeatmapTable.svelte";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import NeedsExportNotice from "./NeedsExportNotice.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Temporal generalization";
	export let description =
		"Geomean speedup for frontier models in three-month windows around each model's knowledge cutoff. No consistent drop crossing the cutoff — the agent–expert gap appears capability-based rather than contamination-based.";

	const data = findings.f7_temporal;
	const bins = data.bins || [];

	$: rows = (data.rows || []).map((r, i) => {
		const flat = { _key: `${r.model}-${i}`, model: r.model };
		(r.speedups || []).forEach((v, j) => {
			const key = bins[j]?.key;
			if (key) flat[key] = v;
		});
		return flat;
	});

	$: columns = [
		{ key: "model", label: "Model" },
		...bins.map((b) => ({
			key: b.key,
			label: b.label,
			numeric: true,
			decimals: 3,
			suffix: "×",
			color: "sequential"
		}))
	];
</script>

<section class="f7">
	<header class="f7-head">
		<h3 class="f7-title">{title}</h3>
		<p class="f7-desc">{description}</p>
	</header>

	{#if needsExport(data) || rows.length === 0}
		<NeedsExportNotice
			summary="Per-model temporal bin speedups are not yet exported."
		/>
	{:else}
		<HeatmapTable
			{columns}
			{rows}
			caption="Geomean speedup in each three-month window relative to the model's knowledge cutoff. Deeper blue = higher speedup."
			rowLabelCols={1}
		/>
	{/if}

	<PaperFigureCaption
		artifact="Table 4 / Figure 1 (Temporal OOD)"
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
