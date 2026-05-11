<script>
	/*
	 * Standardized header for landing-page sections: title on the left, optional
	 * caption below it, optional top-right link. Body content goes in the
	 * default slot. For captions that need inline markup (links, <strong>,
	 * interpolated counts) use the named `caption` slot instead of the prop.
	 */
	export let title;
	export let caption = "";
	export let linkHref = "";
	export let linkLabel = "";
	export let id = undefined;

	$: external = linkHref.startsWith("http");
</script>

<header class="section-head" {id}>
	<div class="section-head-l">
		<h2 class="section-title">{title}</h2>
		{#if $$slots.caption}
			<p class="section-subtitle"><slot name="caption" /></p>
		{:else if caption}
			<p class="section-subtitle">{caption}</p>
		{/if}
	</div>
	{#if linkHref && linkLabel}
		<a
			class="section-link"
			href={linkHref}
			target={external ? "_blank" : undefined}
			rel={external ? "noopener noreferrer" : undefined}
		>
			{linkLabel}
		</a>
	{/if}
</header>

{#if $$slots.default}
	<slot />
{/if}

<style>
	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.section-head-l {
		flex: 1 1 0;
		min-width: 0;
	}

	.section-head-l :global(.section-title) {
		margin: 0 0 4px;
	}

	.section-head :global(.section-link) {
		flex: 0 0 auto;
		align-self: baseline;
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.section-head {
			flex-direction: column;
			align-items: flex-start;
		}
		.section-head :global(.section-link) {
			align-self: flex-start;
		}
	}

	.section-head-l :global(.section-subtitle) {
		font-family: var(--sans);
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--text-muted);
		margin: 0;
	}

	.section-head-l :global(.section-subtitle a) {
		color: var(--brand-blue);
		text-decoration: none;
		border-bottom: 1px dashed var(--border-secondary);
	}

	.section-head-l :global(.section-subtitle a:hover) {
		color: var(--brand-blue-dark);
		border-bottom-color: var(--brand-blue);
	}

	.section-head-l :global(.section-subtitle strong) {
		color: var(--text-primary);
		font-weight: 600;
	}
</style>
