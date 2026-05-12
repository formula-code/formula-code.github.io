<script>
	import { getContext } from "svelte";
	import { ChevronLeft, ChevronRight } from "lucide-svelte";
	import ScrollScatter from "$components/charts/ScrollScatter.svelte";
	import Filters from "$components/ui/Filters.svelte";
	import MathJax from "$components/helpers/MathJax.svelte";
	import {
		bigScatterData,
		chartScrollTrigger
	} from "$stores/misc.js";
	import {
		computeAdvantageScalar,
		substituteCopyTokens
	} from "$utils/benchmarkData.js";

	const copy = getContext("copy") || {};
	const rawSteps = Array.isArray(copy.chartScroll) ? copy.chartScroll : [];

	chartScrollTrigger.set(true);

	const chapters = [
		{
			id: "workload",
			title: "1. One workload at a time",
			caption:
				"Each dot is a real performance bottleneck. We start with a single workload to set up the axes.",
			steps: [0, 1],
			defaultStep: 0
		},
		{
			id: "regions",
			title: "2. Mapping the regions",
			caption:
				"Loading the full dataset, we split the scatterplot into four regions: Regression, Suboptimal, Under-Optimal, and Super-Optimal.",
			steps: [2, 3, 4, 5, 6, 7],
			defaultStep: 7
		},
		{
			id: "advantage",
			title: "3. Defining agent advantage",
			caption:
				"A single scalar that summarises how far each agent's points sit from the equal-advantage diagonal.",
			steps: [8, 9, 10, 11],
			defaultStep: 10
		},
		{
			id: "grouping",
			title: "4. Why grouping matters",
			caption:
				"Aggregating by module reveals patterns hidden at finer granularities.",
			steps: [12, 13],
			defaultStep: 13
		},
		{
			id: "explore",
			title: "5. Explore the data",
			caption:
				"Drag the speedup thresholds to redefine what counts as an equal advantage.",
			steps: [14],
			defaultStep: 14
		}
	];

	let chapterIdx = 0;
	let currentStep = chapters[0].defaultStep;
	$: chapter = chapters[chapterIdx];

	function selectChapter(i) {
		chapterIdx = i;
		currentStep = chapters[i].defaultStep;
	}

	function selectStep(stepNum) {
		currentStep = stepNum;
	}

	function prevStep() {
		const idx = chapter.steps.indexOf(currentStep);
		if (idx > 0) {
			currentStep = chapter.steps[idx - 1];
		} else if (chapterIdx > 0) {
			const prev = chapters[chapterIdx - 1];
			chapterIdx -= 1;
			currentStep = prev.steps[prev.steps.length - 1];
		}
	}

	function nextStep() {
		const idx = chapter.steps.indexOf(currentStep);
		if (idx < chapter.steps.length - 1) {
			currentStep = chapter.steps[idx + 1];
		} else if (chapterIdx < chapters.length - 1) {
			chapterIdx += 1;
			currentStep = chapters[chapterIdx].steps[0];
		}
	}

	$: isFirstStep = chapterIdx === 0 && chapter.steps.indexOf(currentStep) === 0;
	$: isLastStep =
		chapterIdx === chapters.length - 1 &&
		chapter.steps.indexOf(currentStep) === chapter.steps.length - 1;

	$: narrativeTokens = {
		claudeAdv: computeAdvantageScalar($bigScatterData, {
			agentNeedle: "claude"
		}),
		gpt5Adv: computeAdvantageScalar($bigScatterData, { agentNeedle: "gpt" }),
		claudeModuleAdv: computeAdvantageScalar($bigScatterData, {
			agentNeedle: "claude",
			level: "module-level"
		}),
		gpt5ModuleAdv: computeAdvantageScalar($bigScatterData, {
			agentNeedle: "gpt",
			level: "module-level"
		})
	};

	function renderBlock(value) {
		return substituteCopyTokens(value, narrativeTokens);
	}
</script>

<section class="stepper" id="reading-the-chart">
	<header class="header">
		<p class="eyebrow">Reading the chart</p>
		<h2>The Agent Advantage scatterplot, in five chapters.</h2>
		<p class="lede">
			The same data you'd see in the scrollytelling — laid out so you can
			scan it, skip ahead, or jump straight to the interactive view.
		</p>
	</header>

	<nav class="chapter-nav" aria-label="Chart chapters">
		{#each chapters as ch, i}
			<button
				class="chapter-btn"
				class:active={i === chapterIdx}
				on:click={() => selectChapter(i)}
				type="button"
			>
				<span class="chapter-num">0{i + 1}</span>
				<span class="chapter-title">{ch.title.replace(/^\d+\.\s*/, "")}</span>
			</button>
		{/each}
	</nav>

	<div class="layout">
		<div class="chart-col">
			<div class="chart-stage">
				{#if currentStep >= 14}
					<div class="filters-bar">
						<Filters />
					</div>
				{/if}
				<div class="chart-frame">
					<ScrollScatter chartScrollIndex={currentStep} />
				</div>
			</div>
		</div>

		<aside class="narrative-col">
			<div class="chapter-card">
				<p class="chapter-label">Chapter {chapterIdx + 1} of {chapters.length}</p>
				<h3>{chapter.title.replace(/^\d+\.\s*/, "")}</h3>
				<p class="chapter-caption">{chapter.caption}</p>
			</div>

			<ol class="step-list">
				{#each chapter.steps as stepNum, idx}
					{@const step = rawSteps[stepNum]}
					{#if step}
						<li>
							<button
								class="step-card"
								class:active={stepNum === currentStep}
								on:click={() => selectStep(stepNum)}
								type="button"
							>
								<span class="step-tag">Step {idx + 1}</span>
								<div class="step-body">
									{#each step.block || [] as block}
										{#if block?.type === "math"}
											<MathJax expression={block.value} />
										{:else if block?.type === "text"}
											<p>{@html renderBlock(block.value)}</p>
										{/if}
									{/each}
								</div>
							</button>
						</li>
					{/if}
				{/each}
			</ol>

			<div class="step-controls">
				<button
					class="ctrl"
					on:click={prevStep}
					disabled={isFirstStep}
					type="button"
					aria-label="Previous step"
				>
					<ChevronLeft size={16} />
					<span>Prev</span>
				</button>
				<span class="ctrl-position">
					{chapter.steps.indexOf(currentStep) + 1} / {chapter.steps.length}
				</span>
				<button
					class="ctrl"
					on:click={nextStep}
					disabled={isLastStep}
					type="button"
					aria-label="Next step"
				>
					<span>Next</span>
					<ChevronRight size={16} />
				</button>
			</div>
		</aside>
	</div>
</section>

<style>
	.stepper {
		max-width: 1240px;
		margin: 6rem auto;
		padding: 0 var(--space-md);
	}

	.header {
		max-width: 720px;
		margin: 0 auto 2.5rem;
		text-align: center;
	}

	.eyebrow {
		font-family: var(--mono);
		text-transform: uppercase;
		letter-spacing: 0.18em;
		font-size: 0.7rem;
		color: var(--text-muted);
		margin: 0 0 0.75rem;
	}

	.header h2 {
		font-family: var(--sans);
		font-size: clamp(1.5rem, 3vw, 2rem);
		font-weight: 600;
		line-height: 1.25;
		margin: 0 0 0.75rem;
		color: var(--text-primary);
		letter-spacing: -0.015em;
	}

	.lede {
		font-family: var(--sans);
		font-size: 1rem;
		line-height: 1.55;
		color: var(--text-secondary);
		margin: 0;
	}

	.chapter-nav {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 6px;
		margin: 0 auto 2rem;
		max-width: 1100px;
		padding: 4px;
		border: 1px solid var(--border-primary);
		border-radius: 999px;
		background: var(--bg-secondary);
	}

	.chapter-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 8px 12px;
		border: none;
		background: transparent;
		font-family: var(--sans);
		font-size: 0.78rem;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: 999px;
		transition: background 140ms, color 140ms;
	}

	.chapter-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.chapter-btn.active {
		background: var(--text-primary);
		color: var(--bg-primary);
	}

	.chapter-num {
		font-family: var(--mono);
		font-size: 0.7rem;
		opacity: 0.7;
		letter-spacing: 0.05em;
	}

	.chapter-title {
		font-weight: 500;
		text-align: left;
		line-height: 1.2;
	}

	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
		gap: 2.5rem;
		align-items: start;
	}

	.chart-col {
		position: sticky;
		top: 80px;
		align-self: start;
		min-width: 0;
	}

	.chart-stage {
		position: relative;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		background: var(--bg-primary);
		box-shadow: var(--shadow);
		overflow: hidden;
	}

	.chart-frame {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		max-height: 78vh;
	}

	.filters-bar {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border-primary);
		background: var(--bg-secondary);
	}

	.narrative-col {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		min-width: 0;
	}

	.chapter-card {
		padding: 1.25rem;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		background: var(--bg-secondary);
	}

	.chapter-label {
		font-family: var(--mono);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: var(--text-muted);
		margin: 0 0 0.5rem;
	}

	.chapter-card h3 {
		font-family: var(--sans);
		font-size: 1.2rem;
		font-weight: 600;
		margin: 0 0 0.4rem;
		color: var(--text-primary);
	}

	.chapter-caption {
		font-family: var(--sans);
		font-size: 0.92rem;
		line-height: 1.5;
		color: var(--text-secondary);
		margin: 0;
	}

	.step-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.step-card {
		display: block;
		width: 100%;
		text-align: left;
		padding: 1rem 1.1rem;
		border: 1px solid var(--border-primary);
		border-left: 3px solid var(--border-primary);
		border-radius: var(--radius);
		background: var(--bg-primary);
		cursor: pointer;
		transition: border-color 140ms, background 140ms, transform 140ms;
		font-family: inherit;
	}

	.step-card:hover {
		border-color: var(--text-muted);
		background: var(--bg-secondary);
	}

	.step-card.active {
		border-color: var(--brand-blue, var(--accent-primary));
		border-left-color: var(--brand-blue, var(--accent-primary));
		background: var(--bg-primary);
		box-shadow: var(--shadow);
	}

	.step-tag {
		display: inline-block;
		font-family: var(--mono);
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--text-muted);
		margin-bottom: 0.4rem;
	}

	.step-card.active .step-tag {
		color: var(--brand-blue, var(--accent-primary));
	}

	.step-body :global(p) {
		font-family: var(--sans);
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--text-primary);
		margin: 0 0 0.6rem;
	}

	.step-body :global(p:last-child) {
		margin-bottom: 0;
	}

	.step-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-top: 0.5rem;
	}

	.ctrl {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 6px 12px;
		border: 1px solid var(--border-primary);
		border-radius: 999px;
		background: var(--bg-primary);
		font-family: var(--sans);
		font-size: 0.82rem;
		color: var(--text-primary);
		cursor: pointer;
		transition: border-color 140ms, background 140ms;
	}

	.ctrl:hover:not([disabled]) {
		border-color: var(--text-primary);
		background: var(--bg-secondary);
	}

	.ctrl[disabled] {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.ctrl-position {
		font-family: var(--mono);
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	@media (max-width: 960px) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}

		.chart-col {
			position: static;
		}

		.chart-frame {
			max-height: 60vh;
		}

		.chapter-nav {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			border-radius: var(--radius);
		}

		.chapter-btn {
			border-radius: var(--radius);
			justify-content: flex-start;
		}
	}

	@media (max-width: 560px) {
		.stepper {
			margin: 3rem auto;
		}

		.chapter-nav {
			grid-template-columns: minmax(0, 1fr);
		}

		.layout {
			gap: 1.5rem;
		}
	}
</style>
