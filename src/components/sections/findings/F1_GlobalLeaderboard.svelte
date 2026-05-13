<script>
	import HeatmapTable from "./HeatmapTable.svelte";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Agents improve runtime but underperform experts";
	export let description =
		"Every configuration is faster than the original code (geomean speedup > 1x), yet all finish behind the human expert on advantage. The two metrics also disagree — a few easy tasks lift raw speedup, while advantage normalises against the matching expert patch and gives a more honest read.";

	const data = findings.f1_leaderboard;
	const rows = (data.rows || []).map((r, i) => ({
		...r,
		_key: `${r.agent}-${r.model}-${i}`
	}));

	const columns = [
		{ key: "agent", label: "Agent" },
		{ key: "model", label: "Model" },
		{
			key: "advantage",
			label: "Advantage",
			numeric: true,
			decimals: 4,
			signed: true,
			color: "diverging",
			center: 0
		},
		{
			key: "speedup_geomean",
			label: "Speedup (geomean)",
			numeric: true,
			decimals: 4,
			suffix: "x",
			color: "diverging",
			center: 1
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
		rowLabelCols={2}
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
