<script>
	import HeatmapTable from "./HeatmapTable.svelte";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Agents improve runtime but underperform experts";
	export let description =
		"Every evaluated agent–model achieves geomean speedup > 1× on FormulaCode-V, but all configurations finish behind the human expert (negative advantage).";

	const data = findings.f1_leaderboard;
	const rows = (data.rows || []).map((r, i) => ({
		...r,
		_key: `${r.agent}-${r.model}-${i}`
	}));

	const columns = [
		{ key: "rp_rank", label: "RP", numeric: true, decimals: 0 },
		{ key: "agent", label: "Agent" },
		{ key: "model", label: "Model" },
		{
			key: "advantage",
			label: "Advantage",
			numeric: true,
			decimals: 4,
			signed: true,
			color: "diverging"
		},
		{
			key: "speedup_geomean",
			label: "Speedup (geomean)",
			numeric: true,
			decimals: 4,
			suffix: "×",
			color: "sequential"
		}
	];
</script>

<section class="f1">
	<header class="f1-head">
		<h3 class="f1-title">{title}</h3>
		<p class="f1-desc">{description}</p>
	</header>

	<HeatmapTable
		{columns}
		{rows}
		caption="Global leaderboard on FormulaCode-V. Negative advantage = trails human expert; positive = beats expert."
		rowLabelCols={3}
	/>

	<PaperFigureCaption
		artifact="Table 1 (Global leaderboard)"
		arxivUrl={data._arxiv}
		needsExport={needsExport(data)}
	/>
</section>

<style>
	.f1 {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.f1-head {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.f1-title {
		margin: 0;
		font-family: var(--sans);
		font-size: 1.05rem;
		color: var(--text-primary);
	}

	.f1-desc {
		margin: 0;
		font-family: var(--sans);
		font-size: 0.9rem;
		color: var(--text-muted);
		line-height: 1.55;
	}
</style>
