<script>
	import { getContext } from "svelte";
	import { Delaunay } from "d3-delaunay";

	const { data, xGet, yGet, width, height } = getContext("LayerCake");

	export let agentColors = {};
	export let agentNames = {};

	let hoveredPoint = null;
	let mouseX = 0;
	let mouseY = 0;

	// Flatten all points from all series for Voronoi
	$: allPoints = Array.isArray($data)
		? $data.flatMap(series =>
				series.values
					.map(point => {
						const x = $xGet(point);
						const y = $yGet(point);
						// Skip incomplete points to avoid NaNs sneaking into Delaunay
						if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
						const coords = [x, y];
						coords.data = {
							...point,
							color: series.color,
							agentName: series.agentName
						};
						return coords;
					})
					.filter(Boolean)
		  )
		: [];

	// Create Voronoi diagram
	$: hasBounds = Number.isFinite($width) && Number.isFinite($height) && $width > 0 && $height > 0;
	$: voronoi =
		hasBounds && allPoints.length > 0
			? Delaunay.from(allPoints).voronoi([0, 0, $width, $height])
			: null;

	function handleMouseMove(event) {
		if (!voronoi) return;

		const rect = event.currentTarget.getBoundingClientRect();
		mouseX = event.clientX - rect.left;
		mouseY = event.clientY - rect.top;

		// Find closest point
		const index = voronoi.delaunay.find(mouseX, mouseY);
		hoveredPoint = allPoints[index]?.data || null;
	}

	function handleMouseLeave() {
		hoveredPoint = null;
	}

	// Format speedup value
	function formatSpeedup(value) {
		return value.toFixed(3);
	}

	// Format percentile
	function formatPercentile(value) {
		return value.toFixed(1) + "%";
	}
</script>

<!-- Invisible overlay for mouse tracking -->
<rect
	class="tooltip-overlay"
	width={$width}
	height={$height}
	on:mousemove={handleMouseMove}
	on:mouseleave={handleMouseLeave}
/>

<!-- Tooltip -->
{#if hoveredPoint}
	<g class="tooltip" transform="translate({mouseX}, {mouseY})">
		<rect
			x="10"
			y="-40"
			width="140"
			height="60"
			rx="3"
			fill="rgba(24, 26, 31, 0.95)"
			stroke={hoveredPoint.color}
			stroke-width="2"
		/>
		<text
			x="20"
			y="-20"
			fill={hoveredPoint.color}
			font-family="var(--sans)"
			font-size="12"
			font-weight="700"
		>
			{hoveredPoint.agentName}
		</text>
		<text
			x="20"
			y="-5"
			fill="var(--wine-tan)"
			font-family="var(--mono)"
			font-size="11"
		>
			Speedup: {formatSpeedup(hoveredPoint.x)}
		</text>
		<text
			x="20"
			y="10"
			fill="var(--wine-tan)"
			font-family="var(--mono)"
			font-size="11"
		>
			Percentile: {formatPercentile(hoveredPoint.y)}
		</text>
	</g>

	<!-- Hover indicator dot -->
	<circle
		cx={$xGet(hoveredPoint)}
		cy={$yGet(hoveredPoint)}
		r="4"
		fill={hoveredPoint.color}
		stroke="white"
		stroke-width="1.5"
	/>
{/if}

<style>
	.tooltip-overlay {
		fill: transparent;
		cursor: crosshair;
	}

	.tooltip text {
		pointer-events: none;
	}
</style>
