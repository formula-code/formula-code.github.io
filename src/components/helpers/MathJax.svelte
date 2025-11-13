<script>
	import { browser } from "$app/environment";
	import { loadMathDocument } from "$lib/mathjax.js";
	import { onMount, onDestroy, tick } from "svelte";

	export let expression = "";
	export let display = true;

	let container;
	let cancelled = false;
	let mounted = false;

	const typeset = async () => {
		if (!browser || !container) {
			return;
		}
		if (!expression) {
			container.innerHTML = "";
			return;
		}

		// Wait for any pending DOM updates
		await tick();

		const mathDoc = await loadMathDocument();
		if (!mathDoc || cancelled) {
			return;
		}
		// Wrap expression with color command to render in white
		const coloredExpression = `\\color{white}{${expression}}`;
		const node = mathDoc.convert(coloredExpression, { display });
		container.innerHTML = "";
		container.appendChild(node);
	};

	onMount(() => {
		mounted = true;
		typeset();
	});

	$: if (mounted && expression) {
		typeset();
	}

	onDestroy(() => {
		cancelled = true;
	});
</script>

<div class="mathjax-wrapper" bind:this={container} aria-hidden="true"></div>

<style>
	.mathjax-wrapper {
		width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1rem 0;
		margin: 0.5rem 0;
	}

	.mathjax-wrapper :global(svg) {
		width: 100%;
		max-width: 420px;
		height: auto;
	}
</style>
