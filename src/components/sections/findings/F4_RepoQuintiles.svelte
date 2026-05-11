<script>
	import HeatmapTable from "./HeatmapTable.svelte";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import NeedsExportNotice from "./NeedsExportNotice.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Long-tail repository performance";
	export let description =
		"Agent advantage bucketed by repository popularity (GitHub stars, quintiles). Agents are weakest on Q1 (rarely-seen repos) and most competitive on Q2–Q3; performance dips again in Q4 where headroom is scarce.";

	const data = findings.f4_longtail;
	const quintiles = data.quintiles || [];

	$: rows = (data.rows || []).map((r, i) => {
		const flat = { _key: `${r.agent}-${r.model}-${i}`, agent: r.agent, model: r.model };
		(r.advantages || []).forEach((v, j) => {
			const key = quintiles[j]?.key;
			if (key) flat[key] = v;
		});
		return flat;
	});

	$: columns = [
		{ key: "agent", label: "Agent" },
		{ key: "model", label: "Model" },
		...quintiles.map((q) => ({
			key: q.key,
			label: q.label,
			numeric: true,
			decimals: 3,
			signed: true,
			color: "diverging"
		}))
	];
</script>

<section class="f4">
	<header class="f4-head">
		<h3 class="f4-title">{title}</h3>
		<p class="f4-desc">{description}</p>
	</header>

	{#if needsExport(data) || rows.length === 0}
		<NeedsExportNotice
			summary="Repository-popularity quintile breakdown is not yet exported."
		/>
	{:else}
		<HeatmapTable
			{columns}
			{rows}
			caption="Agent × popularity quintile. Q1 = least popular, Q5 = most popular."
			rowLabelCols={2}
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
