<script>
	import { getContext } from "svelte";
	import copyData from "$data/copy.json";

	const copy = getContext("copy") || copyData || {};
	const paperFooter = copy.paperFooter || {};

	// Citation configuration
	const citationConfig = paperFooter.citation || {};
	const citationTitle = citationConfig.title ?? "Citation";
	const citationBibtex = citationConfig.bibtex ?? "";
	const showCitation = citationConfig.show !== false && Boolean(citationBibtex);

	// Related Work configuration (as paragraph)
	const relatedWorkConfig = paperFooter.relatedWork || {};
	const relatedWorkTitle = relatedWorkConfig.title ?? "Related Work";
	const relatedWorkText = relatedWorkConfig.text ?? "";
	const showRelatedWork =
		relatedWorkConfig.show !== false && Boolean(relatedWorkText);

	// Funding configuration
	const fundingConfig = paperFooter.funding || {};
	const fundingTitle = fundingConfig.title ?? "Funding";
	const fundingDescription = fundingConfig.description ?? "";
	const showFunding =
		fundingConfig.show !== false && Boolean(fundingDescription);

	// Acknowledgements configuration
	const acknowledgementsConfig = paperFooter.acknowledgements || {};
	const acknowledgementsTitle =
		acknowledgementsConfig.title ?? "Acknowledgements";
	const acknowledgementsText = acknowledgementsConfig.text ?? "";
	const showAcknowledgements =
		acknowledgementsConfig.show !== false && Boolean(acknowledgementsText);
</script>

<footer>
	<div class="c">
		<!-- Paper Footer Sections -->
		<div class="paper-footer-sections">
			{#if showRelatedWork && relatedWorkText}
				<section class="paper-section related-work-section">
					<h3 class="paper-section-title">{relatedWorkTitle}</h3>
					<p class="paper-section-text">{@html relatedWorkText}</p>
				</section>
			{/if}

			{#if showCitation}
				<section class="paper-section citation-section">
					<h3 class="paper-section-title">{citationTitle}</h3>
					<div class="bibtex-wrapper">
						<pre class="bibtex-code"><code>{citationBibtex}</code></pre>
					</div>
				</section>
			{/if}

			{#if showFunding && fundingDescription}
				<section class="paper-section funding-section">
					<h3 class="paper-section-title">{fundingTitle}</h3>
					<p class="paper-section-text">{@html fundingDescription}</p>
				</section>
			{/if}
		</div>

		<!-- Acknowledgements as footer -->
		{#if showAcknowledgements && acknowledgementsText}
			<div class="footer-acknowledgements">
				<p>{@html acknowledgementsText}</p>
			</div>
		{/if}
	</div>
</footer>

<style>
	footer {
		margin-top: 100px;
		width: 100%;
		position: relative;
		color: var(--text-primary);
		overflow-x: hidden;
	}

	.c {
		max-width: 1000px;
		padding: 3rem 1rem;
		margin: 0 auto;
		font-family: var(--sans);
	}

	/* Paper Footer Sections */
	.paper-footer-sections {
		max-width: 900px;
		margin: 0 auto;
	}

	.paper-section {
		margin-bottom: 3rem;
	}

	.paper-section:last-child {
		margin-bottom: 0;
	}

	.paper-section-title {
		font-family: var(--sans);
		font-size: var(--20px);
		font-weight: 700;
		margin: 0 0 1.5rem;
		color: var(--text-primary);
		text-align: center;
	}

	/* Citation Section */
	.bibtex-wrapper {
		position: relative;
		background-color: var(--bg-secondary);
		border: 1px solid var(--border-secondary);
		border-radius: 8px;
		padding: 1.5rem;
		overflow-x: auto;
	}

	.bibtex-code {
		margin: 0;
		padding: 0;
		font-family: var(--mono);
		font-size: var(--14px);
		line-height: 1.6;
		color: var(--text-primary);
		background: transparent;
		white-space: pre;
		overflow-x: auto;
	}

	.bibtex-code code {
		font-family: inherit;
		color: inherit;
	}

	/* Related Work Text */
	.paper-section-text {
		font-family: var(--sans);
		font-size: var(--16px);
		line-height: 1.7;
		color: var(--text-secondary);
		margin: 0;
		text-align: justify;
	}

	.paper-section-text :global(a) {
		color: var(--link-color);
		text-decoration: none;
		font-weight: 600;
	}

	.paper-section-text :global(a:hover),
	.paper-section-text :global(a:focus-visible) {
		color: var(--link-hover);
		text-decoration: underline;
	}

	/* Footer-style Acknowledgements */
	.footer-acknowledgements {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-primary);
		text-align: center;
	}

	.footer-acknowledgements p {
		font-family: var(--sans);
		font-size: var(--12px);
		line-height: 1.6;
		color: var(--text-primary);
		margin: 0;
	}

	.footer-acknowledgements :global(a) {
		color: var(--link-color) !important;
		text-decoration: none;
		font-weight: 500;
	}

	.footer-acknowledgements :global(a:hover) {
		color: var(--link-hover) !important;
		text-decoration: underline;
	}

	/* Responsive adjustments for paper sections */
	@media (max-width: 768px) {
		.paper-section-title {
			font-size: var(--18px);
		}

		.paper-section-text {
			text-align: left;
		}

		.footer-acknowledgements {
			margin-top: 2rem;
			padding-top: 1.5rem;
		}

		.footer-acknowledgements p {
			font-size: var(--12px);
		}
	}
</style>
