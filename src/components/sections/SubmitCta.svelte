<script>
	import { Check, Copy } from "lucide-svelte";

	export let title = "Don't see your model? Submit it!";
	export let instructions = "";
	export let command = "";
	export let repoUrl = "https://github.com/formula-code/fc-eval";

	let copied = false;
	let copyTimeout;

	async function handleCopy() {
		if (typeof navigator === "undefined" || !navigator.clipboard) return;
		try {
			await navigator.clipboard.writeText(command);
			copied = true;
			clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => (copied = false), 1600);
		} catch (err) {
			// noop
		}
	}

	$: displayCommand = command.replace(/^\$\s+/, "");
</script>

<section class="submit-cta">
	<div class="container">
		<div class="section-head">
			<div>
				<h2 class="section-title">{title}</h2>
				{#if instructions}
					<p class="section-subtitle">{@html instructions}</p>
				{/if}
			</div>
		</div>

		<div class="terminal panel">
			<div class="terminal-head">
				<span class="dot dot-red"></span>
				<span class="dot dot-yellow"></span>
				<span class="dot dot-green"></span>
				<span class="terminal-title">fc-eval</span>
			</div>
			<div class="terminal-body">
				<div class="command-line">
					<span class="prompt mono">$</span>
					<code class="mono">{displayCommand}</code>
					<button
						class="copy-button"
						on:click={handleCopy}
						aria-label="Copy command"
						type="button"
					>
						{#if copied}
							<Check size={14} />
							<span>Copied</span>
						{:else}
							<Copy size={14} />
							<span>Copy</span>
						{/if}
					</button>
				</div>
			</div>
		</div>

		<div class="cta-row">
			<a
				href={repoUrl}
				class="btn btn-primary"
				target="_blank"
				rel="noreferrer"
			>
				Read installation instructions →
			</a>
		</div>
	</div>
</section>

<style>
	.submit-cta {
		padding: var(--space-xl) 0;
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-primary);
	}

	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.section-subtitle {
		max-width: 60ch;
	}

	.terminal {
		padding: 0;
		overflow: hidden;
		background: var(--bg-inverse);
		border-color: var(--bg-inverse);
		box-shadow: var(--shadow-lg);
	}

	.terminal-head {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		background: rgba(255, 255, 255, 0.04);
		padding: 0.55rem 0.9rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
	}

	.dot-red {
		background: #ff5f56;
	}
	.dot-yellow {
		background: #ffbd2e;
	}
	.dot-green {
		background: #27c93f;
	}

	.terminal-title {
		font-family: var(--mono);
		margin-left: 0.6rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.55);
		letter-spacing: 0.05em;
	}

	.terminal-body {
		padding: 1.1rem 1.25rem;
	}

	.command-line {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		flex-wrap: wrap;
	}

	.prompt {
		color: var(--brand-red);
		font-size: 1rem;
		flex-shrink: 0;
	}

	.mono {
		font-family: var(--mono);
	}

	code.mono {
		color: #e2e8f0;
		font-size: 0.92rem;
		background: transparent;
		padding: 0;
		flex: 1 1 auto;
		min-width: 0;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.copy-button {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-family: var(--sans);
		font-size: 0.75rem;
		padding: 4px 10px;
		border-radius: var(--radius);
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(255, 255, 255, 0.04);
		color: rgba(255, 255, 255, 0.85);
		cursor: pointer;
		transition: all 120ms;
		flex-shrink: 0;
	}

	.copy-button:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.cta-row {
		margin-top: var(--space-md);
	}
</style>
