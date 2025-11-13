<script>
	import { getContext } from "svelte";
	import { tooltipType, tooltipData, tooltipVisible } from "$stores/misc.js";
	import viewport from "$stores/viewport.js";

	// SCREENSIZE
	$: w = $viewport.width;
	$: h = $viewport.height;
	$: isMobile = w <= 500;

	const { data, xGet, yGet, yRange, xScale, height } = getContext("LayerCake");

	$: columnWidth = (d) => {
		const vals = $xGet(d);
		return Math.max(0, vals[1] - vals[0]);
	};

	$: columnHeight = (d) => {
		return $yRange[0] - $yGet(d);
	};

	$: localHeight = $height;

export let stroke = "#000";
export let strokeWidth = 0;

	function colorByValue(d) {
		// Simple color based on percentage - higher percentage = greener
		const percent = d.percent || 0;
		return percent > 20 ? "#3E5C4B" : "#38425D";
	}

	function handleMouseover(e, d) {
		tooltipType.set("histo")
		let categoryChart = e.target.closest(".chart-wrapper");

		setTooltip(d)

		// Highlight hovered bar only within this chart
		categoryChart.querySelectorAll("rect").forEach(rect => rect.classList.add("notHover"));
		e.target.classList.add("hover");
	}

	function setTooltip(data) {
		tooltipVisible.set(true);
		tooltipData.set(data);
		tooltipType.set("histo");
	}

	function handleMouseleave(e) {
		let parentChart = e.target.closest("#distribution");
		parentChart?.querySelectorAll("rect").forEach(rect => rect.classList.remove("notHover", "hover"));
	}
</script>

<g>
	{#each $data as d, i}
		{#if d.bucket}
			{@const x = $xScale.bandwidth ? $xGet(d) : $xGet(d)[0]}
			{@const y = $yGet(d)}
			{@const width = $xScale.bandwidth ? $xScale.bandwidth() : columnWidth(d)}
			{@const height = columnHeight(d)}
			<rect
				role="button"
				tabindex="0"
				aria-label={`Data for ${d.bucket}, ${d.percent?.toFixed(1)}%`}
				class={d.bucket}
				class:active={!isMobile}
				data-id={i}
				{x}
				{y}
				{width}
				{height}
				fill={colorByValue(d)}
				{stroke}
				stroke-width={strokeWidth}
				on:mouseover|preventDefault={(e) => {
					if(!isMobile) handleMouseover(e,d)
				}}
				on:focus={(e) => {
					if(!isMobile) handleMouseover(e,d)
				}}
				on:mouseleave={(e) => {
					if(!isMobile) handleMouseleave(e)
				}}
			/>
			<text class="bucket-text" x={x + width / 2} y={localHeight + 24} text-anchor="middle">
				{d.bucket}
			</text>
		{/if}
	{/each}
</g>

<style>
	rect.active {
		cursor: pointer;
	}
	rect.notHover {
		opacity: 0.3;
	}

	rect.hover {
		opacity: 1;
	}

	rect:focus {
		outline: none
	}

	.bucket-text {
		font-size: 14px;
		font-weight: 500;
		font-family: var(--sans);
		fill: var(--wine-dark-tan);
	}

	@media (max-width: 700px) {
		.bucket-text {
			font-size: var(--12px);
		}
	}
</style>
