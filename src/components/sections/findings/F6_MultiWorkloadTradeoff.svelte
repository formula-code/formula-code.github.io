<script>
	import LegendScatter from "$components/charts/LegendScatter.svelte";
	import PaperFigureCaption from "./PaperFigureCaption.svelte";
	import NeedsExportNotice from "./NeedsExportNotice.svelte";
	import { findings, needsExport } from "$utils/findings.js";

	export let title = "Multi-workload tradeoffs";
	export let description =
		"Experts sit clear of every agent — they accept larger localised regressions as the price of bigger global wins, a tradeoff agents are reluctant to make.";

	const data = findings.f6_tradeoff;
	$: rawRows = data.rows || [];

	// Paper Figure 5 plots one point per (agent, model) config, not per task.
	// The API serves per-task rows (`findings_workload_tradeoff`), so we
	// aggregate to config means client-side. Mean is over tasks that have both
	// metrics finite.
	$: configRows = (() => {
		const buckets = new Map();
		for (const r of rawRows) {
			const g = r.global_speedup;
			const w = r.worst_workload_speedup;
			if (!Number.isFinite(g) || !Number.isFinite(w)) continue;
			const key = `${r.agent}|${r.model}`;
			if (!buckets.has(key)) {
				buckets.set(key, {
					agent: r.agent,
					model: r.model,
					global_sum: 0,
					worst_sum: 0,
					n: 0,
					is_expert: r.is_expert
				});
			}
			const b = buckets.get(key);
			b.global_sum += g;
			b.worst_sum += w;
			b.n += 1;
		}
		return Array.from(buckets.values()).map((b) => ({
			agent: b.agent,
			model: b.model,
			global_speedup: b.global_sum / b.n,
			worst_workload_speedup: b.worst_sum / b.n,
			n_tasks: b.n,
			is_expert: b.is_expert
		}));
	})();

	$: hasData = configRows.length > 0;

	function fmtSpeedup(v) {
		if (!Number.isFinite(v)) return "—";
		return `${v.toFixed(3)}×`;
	}
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
		<LegendScatter
			rows={configRows}
			xAccessor={(r) => r.global_speedup}
			yAccessor={(r) => r.worst_workload_speedup}
			xLabel="Global speedup"
			yLabel="Worst-workload speedup"
			xFormat={fmtSpeedup}
			yFormat={fmtSpeedup}
			xDomain={[1.03, 1.11]}
			yDomain={[0.86, 1.01]}
			xTickCount={5}
			yTickCount={5}
			xBetterDir="higher"
			caption="Global speedup (x) vs. worst per-workload speedup (y) for each agent-model configuration."
		>
			<svelte:fragment slot="tooltip-extra" let:row>
				<div class="tt-row">
					<dt>Tasks</dt>
					<dd>{row.n_tasks}</dd>
				</div>
			</svelte:fragment>
		</LegendScatter>
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

	.tt-row {
		display: flex;
		justify-content: space-between;
		gap: 16px;
	}

	.tt-row dt {
		color: var(--text-muted);
		text-transform: uppercase;
		font-size: 0.68rem;
		letter-spacing: 0.05em;
	}

	.tt-row dd {
		margin: 0;
		font-variant-numeric: tabular-nums;
		font-family: var(--mono);
		font-size: 0.82rem;
	}
</style>
