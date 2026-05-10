<script>
	import { getContext } from "svelte";
	import copyData from "$data/copy.json";

	const copy = getContext("copy") || copyData || {};
	const paperFooter = copy.paperFooter || {};

	const citationConfig = paperFooter.citation || {};
	const citationTitle = citationConfig.title ?? "Citation";
	const citationBibtex = citationConfig.bibtex ?? "";
	const showCitation =
		String(citationConfig.show) !== "false" && Boolean(citationBibtex);

	const fundingConfig = paperFooter.funding || {};
	const fundingTitle = fundingConfig.title ?? "Acknowledgements";
	const fundingDescription = fundingConfig.description ?? "";
	const showFunding =
		String(fundingConfig.show) !== "false" && Boolean(fundingDescription);

	const acknowledgementsConfig = paperFooter.acknowledgements || {};
	const acknowledgementsText = acknowledgementsConfig.text ?? "";
	const showAcknowledgements =
		String(acknowledgementsConfig.show) !== "false" &&
		Boolean(acknowledgementsText);

	let copyState = "idle";
	let copyTimer;

	async function copyBibtex(text) {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			copyState = "copied";
		} catch (e) {
			copyState = "error";
		}
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copyState = "idle"), 1800);
	}
</script>

<footer class="site-footer">
	<div class="footer-main">
		{#if showCitation}
			<section id="bibtex" class="bibtex-section">
				<div class="section-head">
					<h2 class="section-title">{citationTitle}</h2>
				</div>
				<div class="bibtex-wrap">
					<button
						class="copy-btn"
						class:copied={copyState === "copied"}
						class:error={copyState === "error"}
						on:click={() => copyBibtex(citationBibtex)}
						aria-label="Copy citation to clipboard"
						type="button"
					>
						{#if copyState === "copied"}
							✓ Copied
						{:else if copyState === "error"}
							Copy failed
						{:else}
							Copy
						{/if}
					</button>
					<pre class="bibtex-box"><code>{citationBibtex}</code></pre>
				</div>
			</section>
		{/if}

		{#if showFunding && fundingDescription}
			<section class="funding-section">
				<div class="section-head">
					<h2 class="section-title">{fundingTitle}</h2>
				</div>
				<p class="funding-text">{@html fundingDescription}</p>
			</section>
		{/if}
	</div>

	<div class="footer-strip">
		<div class="footer-inner">
			{#if showAcknowledgements && acknowledgementsText}
				<div class="footer-credit">{@html acknowledgementsText}</div>
			{/if}
			<div class="footer-links">
				<a href="/">Overview</a>
				<a href="/explorer/">Explorer</a>
				<a href="/leaderboard/">Leaderboard</a>
				<a
					href="https://github.com/formula-code/fc-eval"
					target="_blank"
					rel="noopener noreferrer">GitHub</a
				>
			</div>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		margin-top: var(--space-2xl);
		background: var(--bg-primary);
		color: var(--text-secondary);
		font-family: var(--sans);
	}

	.footer-main {
		max-width: 1000px;
		margin: 0 auto;
		padding: var(--space-2xl) var(--space-md) var(--space-xl);
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.bibtex-section,
	.funding-section {
		margin-bottom: var(--space-xl);
	}

	.bibtex-wrap {
		position: relative;
	}

	.bibtex-box {
		background: #0f172a;
		color: #e2e8f0;
		border-radius: var(--radius);
		padding: var(--space-lg);
		font-family: var(--mono);
		font-size: 0.8125rem;
		line-height: 1.7;
		white-space: pre;
		overflow-x: auto;
		margin: 0;
	}

	.bibtex-box code {
		font-family: inherit;
		color: inherit;
	}

	.copy-btn {
		position: absolute;
		top: var(--space-sm);
		right: var(--space-sm);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.18);
		color: rgba(255, 255, 255, 0.85);
		border-radius: var(--radius);
		padding: 4px 10px;
		font-family: var(--sans);
		font-size: 0.75rem;
		cursor: pointer;
		transition:
			color 120ms,
			background 120ms,
			border-color 120ms;
		z-index: 1;
	}

	.copy-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.32);
		color: #fff;
	}

	.copy-btn.copied {
		background: var(--score-good);
		color: #fff;
		border-color: var(--score-good);
	}

	.copy-btn.error {
		background: var(--score-bad);
		color: #fff;
		border-color: var(--score-bad);
	}

	.funding-text {
		font-size: 0.92rem;
		line-height: 1.7;
		color: var(--text-muted);
		max-width: 70ch;
		margin: 0;
	}

	.funding-text :global(a) {
		color: var(--link-color);
		text-decoration: underline;
		text-decoration-color: var(--border-secondary);
	}

	.funding-text :global(a:hover) {
		text-decoration-color: var(--link-color);
	}

	.footer-strip {
		border-top: 1px solid var(--border-primary);
		padding: var(--space-md) var(--space-md);
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.footer-inner {
		max-width: 1000px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-md);
	}

	.footer-credit {
		max-width: 60ch;
		line-height: 1.6;
		color: var(--text-muted);
	}

	.footer-credit :global(a) {
		color: var(--text-muted);
		text-decoration: underline;
		text-decoration-color: var(--border-secondary);
	}

	.footer-credit :global(a:hover) {
		color: var(--text-primary);
	}

	.footer-links {
		display: flex;
		gap: var(--space-md);
		flex-wrap: wrap;
	}

	.footer-links a {
		color: var(--text-muted);
		text-decoration: underline;
		text-decoration-color: var(--border-secondary);
	}

	.footer-links a:hover {
		color: var(--text-primary);
	}
</style>
