<script>
	export let summary = "";
</script>

<div class="ne-card" role="status">
	<div class="ne-icon" aria-hidden="true">⏳</div>
	<div class="ne-body">
		<p class="ne-title">Data pending</p>
		<p class="ne-text">
			{#if summary}{summary} {/if}This visualization will populate once the
			upstream analysis pipeline publishes the per-figure summary.
		</p>
	</div>
</div>

<style>
	.ne-card {
		display: flex;
		gap: 14px;
		align-items: flex-start;
		padding: 14px 16px;
		border: 1px dashed var(--border-secondary);
		border-radius: var(--radius);
		background: var(--bg-tertiary);
	}

	.ne-icon {
		font-size: 1.2rem;
		line-height: 1.4;
	}

	.ne-body {
		flex: 1 1 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.ne-title {
		margin: 0;
		font-family: var(--sans);
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	.ne-text {
		margin: 0;
		font-family: var(--sans);
		font-size: 0.85rem;
		color: var(--text-muted);
		line-height: 1.55;
	}
</style>
