<script>
	import { getContext } from "svelte";
	import SectionShell from "$components/sections/SectionShell.svelte";

	const copy = getContext("copy") || {};
	const ph = copy.paperHeader || {};
	const abstract = ph.abstract || {};
	const cfg = copy?.overview?.landingSections?.[1] || {};

	const title = cfg.title || abstract.title || "Abstract";
	const paragraphs = Array.isArray(abstract.paragraphs)
		? abstract.paragraphs
		: [];

	const arxivAction = (ph.actions || []).find(
		(a) => typeof a?.label === "string" && /arxiv/i.test(a.label)
	);
	const arxivUrl = arxivAction?.href || ph?.hero?.cta?.href || "";
</script>

<section class="abstract-section" id="abstract">
	<div class="container">
		<SectionShell
			{title}
			linkHref={arxivUrl}
			linkLabel={cfg.linkLabel || "Read the paper ↗"}
		/>
		<div class="abstract-box">
			{#each paragraphs as p}
				<p>{@html p}</p>
			{/each}
		</div>
	</div>
</section>

<style>
	.abstract-section {
		padding: var(--space-lg) 0;
	}

	.container {
		max-width: 1080px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.abstract-box {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		padding: var(--space-lg);
		box-shadow: var(--shadow);
	}

	.abstract-box p {
		font-family: var(--sans);
		font-size: 0.9rem;
		line-height: 1.75;
		color: var(--text-primary);
		margin: 0;
	}

	.abstract-box p + p {
		margin-top: var(--space-sm);
	}

	.abstract-box :global(em) {
		font-style: italic;
		color: var(--brand-red);
		font-weight: 600;
	}

	.abstract-box :global(strong) {
		color: var(--text-primary);
		font-weight: 700;
	}

	@media (max-width: 640px) {
		.abstract-box {
			padding: var(--space-md);
		}
		.abstract-box p {
			font-size: 0.875rem;
			line-height: 1.7;
		}
	}
</style>
