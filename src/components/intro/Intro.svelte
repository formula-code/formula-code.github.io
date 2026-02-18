<script>
	// SVELTE
	import { getContext, onMount } from "svelte";

	// STORES
	import {
		agentSelected,
		agentCopyKey,
		chartScrollTrigger
	} from "$stores/misc.js";

	// COMPONENTS
	import Scrolly from "$components/helpers/Scrolly.svelte";
	import IntroAgents from "$components/intro/Intro.Agents.svelte";
	import IntroHeadline from "$components/intro/Intro.Headline.svelte";
	import IntroCDF from "$components/intro/Intro.CDF.svelte";
	import Icon from "$components/helpers/Icon.svelte";
	import tapSVG from "$svg/touch.svg";
	import loadSVG from "$svg/loader-circle.svg";
	import inView from "$actions/inView.js";

	// VARIABLES
	const copy = getContext("copy") || {};
	const opening = copy.opening?.[0] || {}; // Agent selection copy
	const steps = Array.isArray(copy.steps) ? copy.steps : [];
	const postIntroSteps = Array.isArray(copy.postIntro) ? copy.postIntro : [];
	let scrollIndex;
	let scrollyContainer; // Reference to the Scrolly container
	let scrollY;
	let isMounted;
	let introAgentsRef;

	const heroCTA = copy?.paperHeader?.hero?.cta || {};
	const PAPER_LINK =
		typeof heroCTA.href === "string" && heroCTA.href.trim().length > 0
			? heroCTA.href
			: "#";

	onMount(() => {
		setTimeout(() => {
			isMounted = true;
		}, 500);
	});

	$: {
		if (isMounted && typeof document !== "undefined") {
			document.body.style.overflowY = "scroll";
		}
	}

	// Get the agent-specific copy based on selection
	$: agentKey = $agentCopyKey;
	$: agentCopy = agentKey
		? {
				initial: opening[agentKey] || "",
				advantage: opening[`${agentKey}Advantage`] || "",
				quad: opening[`${agentKey}Quad`] || ""
			}
		: null;

	$: {
		if (typeof scrollIndex === "number" && scrollIndex >= 4) {
			chartScrollTrigger.set(true);
		}
	}

	function decorateStepValue(html, index) {
		if (!html) return "";
		if (index === 1 || index === 2) {
			return html.replace(
				/<span class=instructions>([\s\S]*?)<\/span>/g,
				`<a class="methods-link" href="${PAPER_LINK}" target="_blank" rel="noopener noreferrer"><span class="instructions">$1</span></a>`
			);
		}
		return html;
	}

	function makeInteractiveSpan(node, handler) {
		if (!node || typeof handler !== "function") return () => {};
		node.setAttribute("role", "button");
		node.setAttribute("tabindex", "0");
		const clickHandler = (event) => {
			event.preventDefault();
			handler();
		};
		const keyHandler = (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				handler();
			}
		};
		node.addEventListener("click", clickHandler);
		node.addEventListener("keydown", keyHandler);
		return () => {
			node.removeEventListener("click", clickHandler);
			node.removeEventListener("keydown", keyHandler);
		};
	}

	function instructionsAction(node) {
		if (!node) return;
		const randomSpan = node.querySelector(".random-click");
		const destroyRandom = randomSpan
			? makeInteractiveSpan(randomSpan, handleRandomPick)
			: () => {};
		return {
			destroy() {
				destroyRandom();
			}
		};
	}

	function handleRandomPick() {
		introAgentsRef?.selectRandomAgent();
	}
</script>

<svelte:window bind:scrollY />

<section id="intro">
	<div class="sticky">
		<IntroHeadline {scrollIndex} />
		<IntroAgents bind:this={introAgentsRef} {scrollIndex} {scrollyContainer} />
		<IntroCDF {scrollIndex} />
	</div>
	<Scrolly bind:value={scrollIndex} bind:container={scrollyContainer}>
		<!-- Step 0: Opening prompt -->
		<div class="step">
			<div class="step-inner">
				<p>
					{@html opening.text}
					{#if isMounted}
						<span class="instructions" use:instructionsAction>
							<span class="tap-icon">{@html tapSVG}</span>
							{@html opening.instructions}
						</span>
					{:else}
						<span class="instructions">
							<span class="load-icon">{@html loadSVG}</span>
							Loading...
						</span>
					{/if}
				</p>
			</div>
		</div>

		<!-- Step 1: Initial selection feedback -->
		<div class="step">
			<div class="step-inner">
				<p>
					{#if agentCopy}
						{@html agentCopy.initial}
					{:else}
						{@html steps[1]?.value ||
							"Please select an agent above to continue."}
					{/if}
				</p>
				<div class="scroll-hint">
					<Icon name="chevron-down" size={"24px"} rotation={0} />
				</div>
			</div>
		</div>

		<!-- Remaining steps from copy.steps -->
		{#each (steps || []).slice(2, 7) as step, i}
			{@const absoluteIndex = i + 1}
			{#if step && step.type === "text"}
				<div class="step">
					<div class="step-inner">
						<p>{@html decorateStepValue(step.value, absoluteIndex)}</p>
					</div>
				</div>
			{/if}
		{/each}
	</Scrolly>
</section>

<section
	id="post-intro"
	use:inView={{ bottom: 0 }}
	on:enter={() => chartScrollTrigger.set(true)}
>
	{#each postIntroSteps as graf, i}
		{#if graf?.type === "text"}
			<p class="prose">{@html graf.value}</p>
		{/if}
	{/each}
</section>

<style>
	#intro,
	#post-intro {
		width: 100%;
		position: relative;
	}

	#post-intro {
		width: 100%;
		max-width: 720px;
		margin: 4rem auto;
		z-index: 900;
	}

	.prose {
		color: var(--text-primary);
		font-size: var(--18px);
		line-height: 1.65;
	}

	.sticky {
		width: 100%;
		height: 100svh;
		position: sticky;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		top: 0;
		left: 0;
		transition: all var(--1000ms);
		z-index: 1;
		overflow: hidden;
	}

	.step {
		height: 100vh;
		z-index: 1000;
		max-width: 550px;
		margin: 0 auto;
		opacity: 1;
		pointer-events: none;
		z-index: 1000;
	}

	.step:first-of-type {
		margin-top: calc(-100svh + 6rem);
	}

	.step-inner {
		background: var(--bg-primary);
		padding: 2rem;
		border: 1px solid var(--border-secondary);
		border-radius: 3px;
		box-shadow: -4px 4px 10px rgba(0, 0, 0, 0.5);
		position: relative;
	}

	.step p {
		text-align: left;
		max-width: 600px;
		color: var(--text-primary);
		font-size: var(--18px);
		line-height: 1.65;
		background: none;
		z-index: 1000;
		margin: 0;
		pointer-events: auto;
	}

	.scroll-hint {
		width: 3rem;
		height: 3rem;
		background: var(--accent-secondary);
		position: absolute;
		bottom: -1.5rem;
		left: 50%;
		transform: translate(-50%, 0);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: bounceUp 1s infinite;
	}

	:global(.scroll-hint .icon) {
		margin-top: 6px;
	}

	:global(.instructions) {
		font-family: var(--sans);
		color: var(--accent-secondary) !important;
		font-size: var(--16px) !important;
		font-weight: 700;
		position: relative;
		display: block;
		padding: 1rem 0;
	}

	:global(a.methods-link span) {
		color: var(--link-color) !important;
		text-decoration: underline;
	}

	:global(a.methods-link span) {
		color: var(--accent-secondary) !important;
	}

	:global(a.methods-link span:hover) {
		color: var(--accent-primary) !important;
	}

	.instructions span {
		color: var(--accent-secondary);
	}

	.tap-icon {
		display: inline-block;
		position: relative;
		top: 0.5rem;
		width: 1.75rem;
		height: 1.75rem;
	}

	.load-icon {
		display: inline-block;
		position: relative;
		top: 0.5rem;
		width: 1.5rem;
		height: 1.75rem;
		animation: spin360 1s linear infinite;
	}

	@keyframes spin360 {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	:global(.tap-icon svg, .load-icon svg) {
		width: 100%;
		height: 100%;
	}

	:global(.tap-icon svg path) {
		fill: var(--accent-secondary);
		stroke-width: 3px;
	}

	:global(.load-icon svg path) {
		stroke: var(--accent-secondary);
		stroke-width: 1px;
	}

	:global(.prompt) {
		font-family: var(--mono);
		font-size: var(--16px);
		background: var(--bg-tertiary);
		color: var(--text-primary);
		padding: 0.25rem;
		border-radius: 3px;
		box-decoration-break: clone;
	}

	:global(.selected-agent-circle-span) {
		font-family: var(--sans);
		font-weight: 700;
		padding: 0.25rem;
		border-radius: 3px;
		border: 3px solid var(--accent-secondary);
		box-decoration-break: clone;
	}

	:global(.step p a) {
		color: var(--link-color);
	}

	:global(.step .bold) {
		font-family: var(--sans);
	}

	:global(.step p a:hover) {
		color: var(--link-hover);
	}

	@keyframes bounceUp {
		0% {
			bottom: -24px;
		}
		50% {
			bottom: -28px;
		}
		100% {
			bottom: -24px;
		}
	}

	@media (max-width: 700px) {
		.step-inner {
			padding: 1rem;
		}
		.step p {
			font-size: var(--16px);
		}

		:global(.prompt) {
			font-size: var(--14px);
		}

		#post-intro {
			padding: 0 1rem;
		}

		.prose {
			font-size: var(--16px);
		}
	}
</style>
