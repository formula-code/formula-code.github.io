<script>
	import HeatmapGrid from "$components/charts/HeatmapGrid.svelte";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import NeedsExportNotice from "./NeedsExportNotice.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Long-tail repository performance";
	export let description =
		"Agents are weak on Q1 — the least-popular repos, where experts still extract sizeable wins, hinting at both distribution shift and untouched headroom. They close the gap on mid-popularity Q2–Q3, then dip again on Q4, where even the expert struggles to find anything left to optimise.";

	const data = findings.f4_longtail;
	const quintiles = data.quintiles || [];
	const rawRows = data.rows || [];

	$: rowLabels = rawRows.map((r) => ({
		primary: r.agent,
		secondary: r.model
	}));
	$: colLabels = quintiles.map((q) => q.label);
	$: values = rawRows.map((r) =>
		(r.advantages || []).slice(0, quintiles.length)
	);

	// Three observations split across top/bottom so the braces don't crowd
	// each other: blue (positive) brace above the cells, red (negative)
	// braces below. Q5 stays unannotated.
	const annotations = [
		{
			type: "bracket",
			range: [1, 2], // Q2–Q3
			label: "Agents competitive",
			tone: "positive",
			side: "top"
		},
		{
			type: "bracket",
			range: [0, 0], // Q1
			label: "Agents struggle",
			tone: "negative",
			side: "bottom"
		},
		{
			type: "bracket",
			range: [3, 3], // Q4
			label: "Headroom-limited dip",
			tone: "negative",
			side: "bottom"
		}
	];

	function fmt(v) {
		if (!Number.isFinite(v)) return "—";
		return `${v >= 0 ? "+" : ""}${v.toFixed(3)}`;
	}
</script>

<section class="f4">
	<header class="f4-head">
		<h3 class="f4-title">{title}</h3>
		<p class="f4-desc">{description}</p>
	</header>

	{#if needsExport(data) || rawRows.length === 0}
		<NeedsExportNotice
			summary="Repository-popularity quintile breakdown is not yet exported."
		/>
	{:else}
		<HeatmapGrid
			{rowLabels}
			{colLabels}
			{values}
			{annotations}
			colorMode="diverging"
			scaling="shared"
			legendCaps={["Expert wins", "Agent wins"]}
			valueFormat={fmt}
			rowLabelWidth={230}
			colWidth={84}
			colDimensionLabel="Popularity quintile"
			caption="Advantage across repository popularity quintiles by GitHub stars, from least popular (Q1) to most popular (Q5). Red = trails expert, blue = beats expert; scaled across all cells."
		/>
	{/if}

	<PaperFigureCaption
		artifact="Table 3 (Repository popularity quintiles)"
		arxivUrl={data._arxiv}
		needsExport={needsExport(data)}
	/>
</section>

<style>
	.f4 {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.f4-head {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.f4-title {
		margin: 0;
		font-family: var(--sans);
		font-size: 1.05rem;
		color: var(--text-primary);
	}

	.f4-desc {
		margin: 0;
		font-family: var(--sans);
		font-size: 0.9rem;
		color: var(--text-muted);
		line-height: 1.55;
	}
</style>
