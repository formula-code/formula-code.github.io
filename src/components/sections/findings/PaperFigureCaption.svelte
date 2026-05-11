<script>
	export let artifact = "";
	export let arxivUrl = "";
	export let needsExport = false;
</script>

<div class="paper-cap">
	<span class="cap-left">
		{#if arxivUrl}
			<a class="cap-link" href={arxivUrl} target="_blank" rel="noopener noreferrer">
				{artifact} ↗
			</a>
		{:else}
			<span class="cap-text">{artifact}</span>
		{/if}
	</span>
	{#if needsExport}
		<span class="cap-badge" title="Waiting on the upstream analysis pipeline">
			data pending
		</span>
	{/if}
</div>

<style>
	.paper-cap {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		font-family: var(--sans);
		font-size: 0.82rem;
		color: var(--text-muted);
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px dashed var(--border-secondary);
	}

	.cap-left {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 8px;
		min-width: 0;
	}

	.cap-link {
		color: var(--brand-blue, var(--accent-primary));
		text-decoration: none;
		border-bottom: 1px dashed var(--border-secondary);
	}

	.cap-link:hover {
		border-bottom-color: var(--brand-blue, var(--accent-primary));
	}

	.cap-badge {
		font-family: var(--mono);
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #b45309;
		background: #fef3c7;
		border: 1px solid #fde68a;
		padding: 2px 8px;
		border-radius: 999px;
		white-space: nowrap;
	}
</style>
