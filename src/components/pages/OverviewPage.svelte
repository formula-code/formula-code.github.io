<script>
	import { getContext } from "svelte";
	import OverviewHeader from "$components/layout/OverviewHeader.svelte";
	import CompactLeaderboard from "$components/sections/CompactLeaderboard.svelte";
	import ResultsHighlights from "$components/sections/ResultsHighlights.svelte";
	import SubmitCta from "$components/sections/SubmitCta.svelte";

	export let leaderboardData = { global: [], stratified: [] };

	const copy = getContext("copy") || {};
	const ov = copy.overview || {};

	const bd = ov.benchmarkDesign || {};
	const bdTitle = bd.title ?? "Benchmark Design";
	const bdParagraphs = Array.isArray(bd.paragraphs) ? bd.paragraphs : [];

	const dc = ov.datasetConstruction || {};
	const dcTitle = dc.title ?? "Dataset Construction";
	const dcIntro = dc.intro ?? "";
	const dcSteps = Array.isArray(dc.steps) ? dc.steps : [];

	const kf = ov.keyFindings || {};
	const kfTitle = kf.title ?? "Key Findings";
	const kfFindings = Array.isArray(kf.findings) ? kf.findings : [];

	const cl = ov.compactLeaderboard || {};
	const clTitle = cl.title ?? "Compact Leaderboard";
	const clButtonText = cl.buttonText ?? "View Full Leaderboard";

	const sub = ov.submit || {};
	const subTitle = sub.title ?? "Don't see your model? Submit it!";
	const subInstructions = sub.instructions ?? "";
	const subCommand = sub.command ?? "";
	const subRepoUrl =
		sub.repoUrl ?? "https://github.com/formula-code/fc-eval";
</script>

<div class="overview-page">
	<OverviewHeader />

	<main class="mathnet-main">
		<section class="mathnet-section" id="benchmark-design">
			<div class="mathnet-section-head">
				<h2 class="section-title">{bdTitle}</h2>
			</div>
			<div class="prose">
				{#each bdParagraphs as para}
					<p>{@html para}</p>
				{/each}
			</div>
		</section>

		<section class="mathnet-section" id="dataset-construction">
			<div class="mathnet-section-head">
				<h2 class="section-title">{dcTitle}</h2>
			</div>
			<p class="prose-intro">{@html dcIntro}</p>
			<div class="pipeline-steps">
				{#each dcSteps as step, i}
					<div class="step">
						<div class="step-num">{String(i + 1).padStart(2, "0")}</div>
						<div class="step-body">
							<h3>{step.title.replace(/^\d+\.\s*/, "")}</h3>
							<p>{@html step.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<section class="mathnet-section" id="key-findings">
			<div class="mathnet-section-head">
				<h2 class="section-title">{kfTitle}</h2>
			</div>
			<div class="findings-grid">
				{#each kfFindings as finding}
					<div class="finding-card">
						<h3>{finding.title}</h3>
						<p>{@html finding.description}</p>
					</div>
				{/each}
			</div>
		</section>
	</main>

	<ResultsHighlights stratified={leaderboardData.stratified} />

	<CompactLeaderboard
		title={clTitle}
		rows={leaderboardData.global}
		buttonText={clButtonText}
	/>

	<SubmitCta
		title={subTitle}
		instructions={subInstructions}
		command={subCommand}
		repoUrl={subRepoUrl}
	/>
</div>

<style>
	.overview-page {
		min-height: 100vh;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	/* The landing has more breathing room than other pages, so bump section
	   titles a touch larger here. */
	.overview-page :global(.section-title) {
		font-size: 1.5rem;
	}

	.prose,
	.prose-intro {
		font-family: var(--sans);
		font-size: 0.95rem;
		line-height: 1.75;
		color: var(--text-secondary);
		max-width: 740px;
	}

	.prose p {
		margin: 0 0 var(--space-md);
	}

	.prose p:last-child,
	.prose-intro {
		margin-bottom: var(--space-md);
	}

	.prose :global(strong),
	.prose-intro :global(strong) {
		color: var(--text-primary);
		font-weight: 600;
	}

	.prose :global(em),
	.prose-intro :global(em) {
		color: var(--text-primary);
	}

	.pipeline-steps {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: var(--space-md);
	}

	.step {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		padding: var(--space-lg);
		box-shadow: var(--shadow);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.step-num {
		font-family: var(--mono);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--accent-secondary);
		margin-bottom: 2px;
	}

	.step h3 {
		font-family: var(--sans);
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
	}

	.step p {
		font-family: var(--sans);
		font-size: 0.875rem;
		line-height: 1.65;
		color: var(--text-muted);
		margin: 0;
	}

	.findings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-md);
	}

	.finding-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		padding: var(--space-lg);
		box-shadow: var(--shadow);
		transition:
			border-color 140ms,
			box-shadow 140ms,
			transform 140ms;
	}

	.finding-card:hover {
		border-color: var(--accent-primary);
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
	}

	.finding-card h3 {
		font-family: var(--sans);
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 var(--space-sm);
		color: var(--text-primary);
	}

	.finding-card p {
		font-family: var(--sans);
		font-size: 0.875rem;
		line-height: 1.65;
		color: var(--text-muted);
		margin: 0;
	}
</style>
