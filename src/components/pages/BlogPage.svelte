<script>
	// SVELTE
	import { getContext, onMount } from "svelte";

	// STORES
	import { currAgentSlide, uniqueAgents } from "$stores/misc.js";

	// COMPONENTS
	import PaperHeader from "$components/layout/PaperHeader.svelte";
	import Intro from "$components/intro/Intro.svelte";
	import ChartScroll from "$components/charts/ChartScroll.svelte";
	import AgentAdvantageTable from "$components/sections/AgentAdvantageTable.svelte";
	import AgentCard from "$components/cards/AgentCard.svelte";
	import AgentCardNav from "$components/cards/AgentCard.Nav.svelte";
	import Slider from "$components/helpers/Slider.svelte";
	import Slide from "$components/helpers/Slider.Slide.svelte";
	import Tap from "$components/helpers/Tap.svelte";
	import Leaderboard from "$components/sections/Leaderboard.svelte";
	// import Outro from "$components/sections/Outro.svelte";
	import Footer from "$components/layout/Footer.svelte";
	import Tooltip from "$components/ui/Tooltip.svelte";

	// Enable scrolling (was previously done in Intro component)
	onMount(() => {
		document.body.style.overflowY = "scroll";
	});

	// VARIABLES
	const copy = getContext("copy");

	// Slider ref for agent cards
	let sliderEl;

	// Agent data from store
	$: agents = $uniqueAgents;

	// Handle slider navigation
	$: if (sliderEl && $currAgentSlide !== undefined) {
		sliderEl.jump($currAgentSlide);
	}

	// Handle tap navigation (keyboard arrows and visual buttons)
	function handleTap(event) {
		const direction = event.detail;
		if (direction === "left" && $currAgentSlide > 0) {
			currAgentSlide.update((n) => n - 1);
		} else if (direction === "right" && $currAgentSlide < agents.length - 1) {
			currAgentSlide.update((n) => n + 1);
		}
	}
</script>

<div class="blog-page">
	<!-- Paper Header -->
	<PaperHeader />

	<!-- Intro section (interactive) -->
	<Intro />

	<!-- MAIN FEATURE: Scrollytelling with scatterplot -->
	<ChartScroll />

	<!-- Agent Cards with Slider Navigation -->
	{#if agents && agents.length > 0}
		<div class="agent-slider-shell">
			<AgentCardNav />
			<Slider bind:this={sliderEl} bind:current={$currAgentSlide}>
				{#each agents as agent, i}
					<Slide index={i}>
						<AgentCard {agent} />
					</Slide>
				{/each}
			</Slider>

			<!-- Keyboard and visual navigation -->
			<Tap
				enableKeyboard={true}
				showArrows={true}
				arrowPosition="center"
				positionMode="container"
				on:tap={handleTap}
			/>
		</div>
	{/if}

	<!-- DISABLED: Outro section -->
	<!-- <Outro /> -->

	<!-- Leaderboard section -->
	<Leaderboard />

	<!-- ENABLED: Tooltip for scatterplot interactions -->
	<Tooltip />

	<!-- <Explore />  -->
</div>

<style>
	/* Agent cards slider styles are handled by the Slider component */

	.agent-slider-shell {
		position: relative;
		width: 100%;
	}

	.blog-page {
		padding-top: 0;
	}
</style>
