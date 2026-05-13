<script>
	import { getContext } from "svelte";
	import SectionShell from "$components/sections/SectionShell.svelte";
	import GrowthHistogram from "$components/sections/dataset-statistics/GrowthHistogram.svelte";
	import RepoLongTail from "$components/sections/dataset-statistics/RepoLongTail.svelte";
	import RepoTreemap from "$components/sections/dataset-statistics/RepoTreemap.svelte";
	import syncMeta from "$data/sync-metadata.json";

	const copy = getContext("copy") || {};
	const cfg = copy?.overview?.landingSections?.[2] || {};
	const sectionTitle = cfg.title || "Dataset Statistics";
	const sectionLinkHref = cfg.linkHref || "https://data.formulacode.org/";
	const sectionLinkLabel = cfg.linkLabel || "Data explorer ↗";

	const refreshedDate = syncMeta?.last_refreshed
		? new Date(syncMeta.last_refreshed).toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric"
			})
		: "";
</script>

<section class="dataset-statistics" id="dataset-statistics">
	<div class="container">
		<SectionShell
			title={sectionTitle}
			linkHref={sectionLinkHref}
			linkLabel={sectionLinkLabel}
		>
			<span slot="caption">
				FormulaCode is updated monthly. {#if refreshedDate}Last refreshed on
					<strong>{refreshedDate}</strong>.{/if} For the latest statistics, visit
				<a
					href="https://data.formulacode.org/"
					target="_blank"
					rel="noopener noreferrer">data.formulacode.org</a
				>.
			</span>
		</SectionShell>

		<div class="stack">
			<GrowthHistogram />
			<RepoLongTail />
			<RepoTreemap />
		</div>
	</div>
</section>

<style>
	.dataset-statistics {
		padding: var(--space-xl) 0;
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
	}

	.container {
		max-width: 1080px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}
</style>
