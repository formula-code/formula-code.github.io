<script>
	import { getContext } from "svelte";
	import { line, curveLinear } from "d3";

	const { data, xGet, yGet, width, height, xRange, yRange } = getContext("LayerCake");

	export let selectedAgent = null;
	export let agentColors = {};
	const clipId = "cdf-plot-clip";

	// Create path generator
	$: pathGenerator = line()
		.x(d => $xGet(d))
		.y(d => $yGet(d))
		.curve(curveLinear);

	// Function to determine stroke width based on selection
	function getStrokeWidth(agent) {
		if (!selectedAgent) return 2;
		return agent === selectedAgent ? 3 : 1.5;
	}

	// Function to determine opacity based on selection
	function getOpacity(agent) {
		if (!selectedAgent) return 0.9;
		return agent === selectedAgent ? 1 : 0.5;
	}
</script>

<defs>
	<clipPath id={clipId} clipPathUnits="userSpaceOnUse">
		<rect
			x={Math.min($xRange[0], $xRange[1])}
			y={Math.min($yRange[0], $yRange[1])}
			width={$width}
			height={$height}
		/>
	</clipPath>
</defs>

<g class="cdf-lines" clip-path={`url(#${clipId})`}>
	{#each $data as series}
		<path
			d={pathGenerator(series.values)}
			stroke={series.color}
			stroke-width={getStrokeWidth(series.agent)}
			opacity={getOpacity(series.agent)}
			fill="none"
			class="cdf-line"
			class:selected={series.agent === selectedAgent}
		/>
	{/each}
</g>

<style>
	.cdf-line {
		stroke-linejoin: round;
		stroke-linecap: round;
		transition: stroke-width 300ms ease, opacity 300ms ease;
	}

	.cdf-line.selected {
		filter: drop-shadow(0 0 3px currentColor);
	}
</style>
