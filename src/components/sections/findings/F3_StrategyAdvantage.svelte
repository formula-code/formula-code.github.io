<script>
	import HeatmapTable from "./HeatmapTable.svelte";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import NeedsExportNotice from "./NeedsExportNotice.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Optimization strategy strengths";
	export let description =
		"Per-tag advantage (agent − expert) across optimization-strategy categories. Agents outperform experts on parallelization and batching tasks; they struggle when solutions require lower-level or vectorized implementations.";

	const data = findings.f3_tags;
	const tags = data.tags || [];

	$: rows = (data.rows || []).map((r, i) => {
		const flat = { _key: `${r.agent}-${r.model}-${i}`, agent: r.agent, model: r.model };
		(r.advantages || []).forEach((v, j) => {
			const key = tags[j]?.key;
			if (key) flat[key] = v;
		});
		return flat;
	});

	$: columns = [
		{ key: "agent", label: "Agent" },
		{ key: "model", label: "Model" },
		...tags.map((t) => ({
			key: t.key,
			label: t.label,
			numeric: true,
			decimals: 3,
			signed: true,
			color: "diverging"
		}))
	];
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
	{:else if rows.length === 0}
		<NeedsExportNotice
			summary="No rows available yet."
		/>
	{:else}
		<HeatmapTable
			{columns}
			{rows}
			caption="Agent × optimization-strategy advantage. Blue = agent wins, red = expert wins."
			rowLabelCols={2}
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
