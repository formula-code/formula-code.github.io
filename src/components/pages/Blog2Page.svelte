<script>
	import { onMount } from "svelte";

	import { currAgentSlide, uniqueAgents } from "$stores/misc.js";

	import PaperHeader from "$components/layout/PaperHeader.svelte";
	import Blog2Intro from "$components/sections/Blog2Intro.svelte";
	import Blog2ChartStepper from "$components/sections/Blog2ChartStepper.svelte";
	import AgentCard from "$components/cards/AgentCard.svelte";
	import AgentCardNav from "$components/cards/AgentCard.Nav.svelte";
	import Slider from "$components/helpers/Slider.svelte";
	import Slide from "$components/helpers/Slider.Slide.svelte";
	import Tap from "$components/helpers/Tap.svelte";
	import Leaderboard from "$components/sections/Leaderboard.svelte";
	import Tooltip from "$components/ui/Tooltip.svelte";

	onMount(() => {
		document.body.style.overflowY = "scroll";
	});

	let sliderEl;
	$: agents = $uniqueAgents;

	$: if (sliderEl && $currAgentSlide !== undefined) {
		sliderEl.jump($currAgentSlide);
	}

	function handleTap(event) {
		const direction = event.detail;
		if (direction === "left" && $currAgentSlide > 0) {
			currAgentSlide.update((n) => n - 1);
		} else if (direction === "right" && $currAgentSlide < agents.length - 1) {
			currAgentSlide.update((n) => n + 1);
		}
	}
</script>

<div class="blog2-page">
	<PaperHeader />

	<Blog2Intro />

	<Blog2ChartStepper />

	{#if agents && agents.length > 0}
		<section class="agent-shell-wrap">
			<header class="section-header">
				<p class="eyebrow">Per-agent breakdown</p>
				<h2>Each agent, on its own terms.</h2>
				<p class="lede">
					Cards summarise how every agent stacks up against the human expert
					at each aggregation level, plus a representative trace from the
					session player.
				</p>
			</header>

			<div class="agent-slider-shell">
				<AgentCardNav />
				<Slider bind:this={sliderEl} bind:current={$currAgentSlide}>
					{#each agents as agent, i}
						<Slide index={i}>
							{#if Math.abs(i - $currAgentSlide) <= 1}
								<AgentCard {agent} />
							{:else}
								<div class="agent-card-placeholder" style="min-height: 400px;" />
							{/if}
						</Slide>
					{/each}
				</Slider>

				<Tap
					enableKeyboard={true}
					showArrows={true}
					arrowPosition="center"
					positionMode="container"
					on:tap={handleTap}
				/>
			</div>
		</section>
	{/if}

	<Leaderboard />

	<Tooltip />
</div>

<style>
	.blog2-page {
		padding-top: 0;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.agent-shell-wrap {
		max-width: 1180px;
		margin: 6rem auto;
		padding: 0 var(--space-md);
	}

	.section-header {
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

	.section-header h2 {
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

	.agent-slider-shell {
		position: relative;
		width: 100%;
	}
</style>
