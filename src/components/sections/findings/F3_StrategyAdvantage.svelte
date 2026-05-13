<script>
	import HeatmapGrid from "$components/charts/HeatmapGrid.svelte";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import NeedsExportNotice from "./NeedsExportNotice.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Optimization strategy strengths";
	export let description =
		"Advantage broken out by the strategy the expert used. Agents match or beat experts when the win is parallelisation or batching, but fall behind whenever the human reached for a C extension or a vectorised primitive — the categories where capability, not effort, is the bottleneck.";

	const data = findings.f3_tags;
	const tags = data.tags || [];
	const rawRows = data.rows || [];

	// Display order pulls "Lower-level implementations" (data idx 8) up to
	// display col 3 — close enough to the "agents lead" columns 0-1 for the
	// contrast to read, with one column of buffer (Caching) in between so
	// the brackets don't crowd each other.
	const DISPLAY_ORDER = [0, 1, 2, 8, 3, 4, 5, 6, 7];

	$: rowLabels = rawRows.map((r) => ({
		primary: r.agent,
		secondary: r.model
	}));
	$: colLabels = DISPLAY_ORDER.map((idx) => tags[idx]?.label).filter(
		Boolean
	);
	$: values = rawRows.map((r) =>
		DISPLAY_ORDER.map((idx) => r.advantages?.[idx] ?? null)
	);

	// Annotations reference DISPLAY indices, not the underlying tag order.
	const annotations = [
		{
			type: "bracket",
			range: [0, 1], // Parallelization, Batching
			label: "Agents lead",
			tone: "positive"
		},
		{
			type: "bracket",
			range: [3, 3], // Lower-level implementations (moved here)
			label: "Agents struggle",
			tone: "negative"
		}
	];

	function fmt(v) {
		if (!Number.isFinite(v)) return "—";
		return `${v >= 0 ? "+" : ""}${v.toFixed(3)}`;
	}
</script>

<section class="f3">
	<header class="f3-head">
		<h3 class="f3-title">{title}</h3>
		<p class="f3-desc">{description}</p>
	</header>

	{#if needsExport(data)}
		<NeedsExportNotice
			summary="Per-tag advantages have not yet been exported to the website data layer."
		/>
	{:else if rowLabels.length === 0}
		<NeedsExportNotice summary="No rows available yet." />
	{:else}
		<HeatmapGrid
			{rowLabels}
			{colLabels}
			{values}
			{annotations}
			colorMode="diverging"
			scaling="per-column"
			legendCaps={["Expert wins", "Agent wins"]}
			valueFormat={fmt}
			colDimensionLabel="Optimization strategy"
			caption="Per-tag advantage for each agent-model configuration. Cells report human-relative advantage restricted to workloads whose expert patches use the labeled optimization strategy. Red = trails expert, blue = beats expert; scaled per column."
		/>
	{/if}

	<PaperFigureCaption
		artifact="Table 2 (Per-tag advantage)"
		arxivUrl={data._arxiv}
		needsExport={needsExport(data)}
	/>
</section>

<style>
	.f3 {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.f3-head {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.f3-title {
		margin: 0;
		font-family: var(--sans);
		font-size: 1.05rem;
		color: var(--text-primary);
	}

	.f3-desc {
		margin: 0;
		font-family: var(--sans);
		font-size: 0.9rem;
		color: var(--text-muted);
		line-height: 1.55;
	}
</style>
