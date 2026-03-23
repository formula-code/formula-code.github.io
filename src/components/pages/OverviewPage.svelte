<script>
	import { getContext } from "svelte";
	import OverviewHeader from "$components/layout/OverviewHeader.svelte";
	import SortableTable from "$components/helpers/SortableTable.svelte";

	export let leaderboardData = { global: [] };

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

	const compactColumns = [
		{ key: "agent", label: "Agent", numeric: false },
		{ key: "model", label: "Model", numeric: false },
		{ key: "rank", label: "RP Rank", numeric: true, decimals: 0 },
		{
			key: "advantage",
			label: "Adv",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		},
		{
			key: "speedup",
			label: "Speedup",
			numeric: true,
			colorCode: true,
			colorThreshold: 1.0,
			suffix: "x"
		}
	];
</script>

<div class="overview-page">
	<OverviewHeader />

	<section class="section bg-light" id="benchmark-design">
		<div class="container">
			<h2>{bdTitle}</h2>
			{#each bdParagraphs as para}
				<p>{@html para}</p>
			{/each}
		</div>
	</section>

	<section class="section" id="dataset-construction">
		<div class="container">
			<h2>{dcTitle}</h2>
			<p>{@html dcIntro}</p>
			<div class="pipeline-steps">
				{#each dcSteps as step}
					<div class="step">
						<h3>{step.title}</h3>
						<p>{@html step.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="section bg-light" id="key-findings">
		<div class="container">
			<h2>{kfTitle}</h2>
			<div class="findings-grid">
				{#each kfFindings as finding}
					<div class="finding-card">
						<h3>{finding.title}</h3>
						<p>{@html finding.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="section" id="leaderboard">
		<div class="container">
			<h2>{clTitle}</h2>
			<SortableTable
				columns={compactColumns}
				rows={leaderboardData.global}
				initialSortKey="rank"
				initialSortOrder="asc"
			/>
			<div class="leaderboard-link">
				<a href="/leaderboard/" class="button">{clButtonText} &rarr;</a>
			</div>
		</div>
	</section>

	<section class="section bg-light" id="submitting">
		<div class="container">
			<h2>{subTitle}</h2>
			<p>{@html subInstructions}</p>
			<pre><code>{subCommand}</code></pre>
		</div>
	</section>
</div>

<style>
	.section {
		padding: 4rem 1rem;
		border-bottom: 1px solid var(--border-secondary);
	}

	.bg-light {
		background-color: var(--bg-secondary);
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
	}

	h2 {
		font-family: var(--sans);
		font-size: 2.5rem;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	h3 {
		font-family: var(--sans);
		font-size: 1.5rem;
		margin-bottom: 1rem;
		color: var(--accent-secondary);
	}

	p {
		font-family: var(--sans);
		font-size: 1.125rem;
		line-height: 1.7;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	/* Pipeline Steps */
	.pipeline-steps {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-top: 2rem;
	}

	.step {
		display: flex;
		gap: 1.5rem;
		align-items: baseline;
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-secondary);
	}

	.step h3 {
		font-size: 1.25rem;
		margin-bottom: 0;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.step p {
		font-size: 1rem;
		margin-bottom: 0;
	}

	/* Findings Grid */
	.findings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.finding-card {
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-secondary);
	}

	.finding-card h3 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.finding-card p {
		font-size: 1rem;
		margin-bottom: 0;
	}

	/* Leaderboard link */

	.leaderboard-link {
		margin-top: 2rem;
		text-align: center;
	}

	.button {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: var(--accent-primary);
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-family: var(--sans);
		font-weight: 600;
		transition: background 0.2s;
	}

	.button:hover {
		background: #2563eb;
	}

	/* Code Blocks */
	pre {
		background: var(--bg-tertiary);
		padding: 1.5rem;
		border-radius: 8px;
		overflow-x: auto;
		border: 0.5px solid var(--border-secondary);
	}

	code {
		font-family: var(--mono);
		color: var(--text-primary);
		font-size: 1rem;
	}
</style>
