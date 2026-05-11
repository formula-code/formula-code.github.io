<script>
	import { getContext } from "svelte";
	import copyData from "$data/copy.json";
	import Icon from "$components/helpers/Icon.svelte";

	const socialLinks = [
		{
			label: "GitHub",
			href: "https://github.com/formula-code/fc-eval",
			kind: "lucide",
			icon: "github"
		},
		{
			label: "X (Twitter)",
			href: "https://x.com/atharva_sehgal",
			kind: "x"
		},
		{
			label: "Bluesky",
			href: "https://bsky.app/profile/aseg.bsky.social",
			kind: "bluesky"
		},
		{
			label: "arXiv paper",
			href: "https://arxiv.org/abs/2603.16011",
			kind: "lucide",
			icon: "file-text"
		}
	];

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
			<div class="footer-meta">
				<div class="footer-links">
					<a href="/">Overview</a>
					<a href="/explorer/">Explorer</a>
					<a href="/leaderboard/">Leaderboard</a>
				</div>
				<div class="footer-social" aria-label="Project links">
					{#each socialLinks as link}
						<a
							class="social-icon"
							href={link.href}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={link.label}
							title={link.label}
						>
							{#if link.kind === "lucide"}
								<Icon name={link.icon} size="18px" strokeWidth={1.8} />
							{:else if link.kind === "x"}
								<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
									<path
										fill="currentColor"
										d="M13.6823 10.6218 20.2391 3H18.6854L12.9921 9.61788 8.44486 3H3.2002l6.8763 10.0074L3.2002 21h1.55384l6.01226-6.9887L15.5685 21h5.2446L13.6819 10.6218ZM11.5541 13.0956 10.8574 12.0991 5.31391 4.16971h2.38662l4.47368 6.39922.6967.99654 5.81504 8.31802h-2.3866l-4.74536-6.7872Z"
									/>
								</svg>
							{:else if link.kind === "bluesky"}
								<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
									<path
										fill="currentColor"
										d="M5.585 4.404c2.93 2.142 6.075 6.487 7.222 8.821.114.232.176.353.213.353.037 0 .099-.121.213-.353 1.147-2.334 4.292-6.679 7.222-8.821 2.114-1.546 5.539-2.742 5.539 1.066 0 .76-.453 6.382-.72 7.298-.926 3.18-4.235 3.99-7.176 3.498 5.143.864 6.45 3.687 3.625 6.51-5.366 5.359-7.71-1.346-8.31-3.063-.109-.314-.16-.461-.16-.337 0-.124-.05.022-.16.337-.6 1.717-2.943 8.422-8.31 3.063-2.825-2.823-1.518-5.646 3.625-6.51-2.94.492-6.25-.318-7.176-3.498C.495 10.86.04 5.236.04 4.476c0-3.808 3.426-2.612 5.54-1.066"
									/>
								</svg>
							{/if}
						</a>
					{/each}
				</div>
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

	.footer-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10px;
	}

	.footer-social {
		display: flex;
		gap: 10px;
		align-items: center;
	}

	.social-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm, 6px);
		border: 0;
		color: var(--text-muted);
		text-decoration: none;
		transition:
			color 120ms,
			background 120ms;
	}

	.social-icon :global(svg) {
		display: block;
	}

	.social-icon:hover {
		color: var(--brand-blue);
		background: var(--bg-secondary);
		text-decoration: none;
	}

	.footer-links {
		display: flex;
		gap: var(--space-md);
		flex-wrap: wrap;
	}

	.footer-links a {
		color: var(--text-muted);
		text-decoration: none;
		border: 0;
	}

	.footer-links a:hover {
		color: var(--text-primary);
	}

	@media (max-width: 600px) {
		.footer-meta {
			align-items: flex-start;
		}
	}
</style>
