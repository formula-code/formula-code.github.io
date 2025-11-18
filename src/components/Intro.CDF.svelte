<script>
	import { LayerCake, Svg } from "layercake";
	import { scaleLinear } from "d3-scale";
	import { agentSelected, bigScatterData } from "$stores/misc.js";
	import { AGENT_IDS, AGENT_COLORS, AGENT_NAMES_SHORT, SCROLL_STEPS } from "$utils/agents.js";
	import AxisX from "$components/layercake/AxisX.svg.svelte";
	import AxisY from "$components/layercake/AxisY.svg.svelte";
	import CDFLines from "$components/layercake/CDF.svg.svelte";
	import CDFTooltip from "$components/layercake/CDFTooltip.svelte";

	export let scrollIndex = 0;

	const CHART_PADDING = { top: 28, right: 48, bottom: 68, left: 72 };

	// Use the bigScatterData store which contains the full website_data.csv
	$: data = $bigScatterData && Array.isArray($bigScatterData) ? $bigScatterData : [];

	// Use centralized agent names (short version for compact display)
	const AGENT_NAMES = AGENT_NAMES_SHORT;

	// Calculate CDF data for each agent
	function calculateCDF(agentId, dataset) {
		if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
			return [];
		}

		// Filter data for this agent
		const agentData = dataset.filter(d => d.agent_id === agentId);

		// Extract speedup values and sort them
		const speedups = agentData
			.map(d => parseFloat(d["agent/nop"]))
			.filter(v => !isNaN(v))
			.sort((a, b) => a - b);

		if (speedups.length === 0) return [];

		// Calculate CDF points
		const cdfPoints = speedups.map((speedup, i) => ({
			x: speedup,
			y: ((i + 1) / speedups.length) * 100, // Percentile
			agent: agentId,
			agentName: AGENT_NAMES[agentId]
		}));

		return cdfPoints;
	}

	// Process data for all three agents
	$: cdfData = data.length > 0 ? [
		{
			agent: AGENT_IDS.CLAUDE,
			agentName: AGENT_NAMES[AGENT_IDS.CLAUDE],
			color: AGENT_COLORS[AGENT_IDS.CLAUDE],
			values: calculateCDF(AGENT_IDS.CLAUDE, data)
		},
		{
			agent: AGENT_IDS.GPT5,
			agentName: AGENT_NAMES[AGENT_IDS.GPT5],
			color: AGENT_COLORS[AGENT_IDS.GPT5],
			values: calculateCDF(AGENT_IDS.GPT5, data)
		},
		{
			agent: AGENT_IDS.HUMAN,
			agentName: AGENT_NAMES[AGENT_IDS.HUMAN],
			color: AGENT_COLORS[AGENT_IDS.HUMAN],
			values: calculateCDF(AGENT_IDS.HUMAN, data)
		}
	] : [];

	// Determine which agent is selected
	$: selectedAgent = $agentSelected;

	// Visibility based on scroll position
	$: visible = scrollIndex >= SCROLL_STEPS.CDF_START && scrollIndex <= SCROLL_STEPS.CDF_END;
	$: transform = visible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.85)';
	$: opacity = visible ? 1 : 0;
	$: paddingStyle = `
		--cdf-pad-top: ${CHART_PADDING.top}px;
		--cdf-pad-right: ${CHART_PADDING.right}px;
		--cdf-pad-bottom: ${CHART_PADDING.bottom}px;
		--cdf-pad-left: ${CHART_PADDING.left}px;
	`;
</script>

{#if cdfData.length > 0}
	<div class="cdf-container" style="opacity: {opacity}; transform: {transform};">
		<div class="cdf-chart" style={paddingStyle}>
			<div class="cdf-chart-inner">
				<LayerCake
					padding={CHART_PADDING}
					x="x"
					y="y"
					z="agent"
					xDomain={[0.85, 1.3]}
				yDomain={[0, 100]}
				xScale={scaleLinear().clamp(true)}
				yScale={scaleLinear().clamp(true)}
				data={cdfData}
			>
				<Svg>
					<AxisX
						gridlines={true}
						ticks={[0.85, 0.9, 1.0, 1.1, 1.2, 1.3]}
						formatTick={(d) => d.toFixed(2)}
						snapTicks={true}
					/>
					<AxisY
						gridlines={true}
						ticks={[0, 25, 50, 75, 100]}
						formatTick={(d) => `${d}%`}
					/>
					<CDFLines {selectedAgent} agentColors={AGENT_COLORS} />
					<CDFTooltip agentColors={AGENT_COLORS} agentNames={AGENT_NAMES} />
				</Svg>
				</LayerCake>
				<div class="cdf-overlay">
					<div class="axis-label axis-x">Speedup</div>
					<div class="axis-label axis-y">Cumulative %</div>
					<ul class="cdf-legend" class:has-selection={Boolean(selectedAgent)} aria-label="CDF legend">
						{#each cdfData as series}
							<li class:selected={selectedAgent === series.agent}>
								<span class="swatch" style={`background: ${series.color}`}></span>
								<span class="legend-label">{series.agentName}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</div>
	{/if}

<style>
	.cdf-container {
		width: min(95vw, 720px);
		aspect-ratio: 1 / 1;
		position: absolute;
		top: 50%;
		left: 50%;
		transition: opacity 600ms ease, transform 600ms ease;
		pointer-events: all;
		padding: clamp(24px, 6vw, 64px);
		box-sizing: border-box;
	}

	.cdf-chart {
		position: absolute;
		inset: 0;
		pointer-events: auto;
	}

		.cdf-chart-inner {
			position: relative;
			width: 100%;
			height: 100%;
		}

		.cdf-chart-inner :global(svg) {
			width: 100%;
			height: 100%;
		}

		.cdf-overlay {
			position: absolute;
			inset: 0;
			pointer-events: none;
		}

		.axis-label {
			position: absolute;
			font-family: var(--sans);
			font-weight: 700;
			text-transform: uppercase;
			font-size: var(--12px);
			color: var(--wine-dark-tan);
			letter-spacing: 0.04em;
			pointer-events: none;
		}

		.axis-x {
			right: 2.5rem;
			bottom: 2rem;
			transform: translateX(-50%);
		}

		.axis-y {
			top: 8.25rem;
			transform: rotate(-90deg);
		}

		.cdf-legend {
			position: absolute;
			top: calc(var(--cdf-pad-top) + 8px);
			right: calc(var(--cdf-pad-right) + 8px);
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 0.4rem;
			list-style: none;
			margin: 0;
			padding: 0;
			font-family: var(--sans);
			font-size: var(--12px);
			text-transform: uppercase;
			color: var(--wine-tan);
			letter-spacing: 0.03em;
			pointer-events: none;
			text-align: right;
		}

		.cdf-legend li {
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
			opacity: 0.85;
		}

		.cdf-legend.has-selection li {
			opacity: 0.35;
		}

		.cdf-legend.has-selection li.selected {
			opacity: 1;
		}

		.legend-label {
			display: inline-block;
		}

		.cdf-legend .swatch {
			width: 12px;
			height: 12px;
			border-radius: 999px;
			display: inline-block;
		}

		@media (max-width: 700px) {
			.cdf-container {
				width: min(92vw, 540px);
				padding: clamp(16px, 5vw, 32px);
			}

			.axis-label {
				font-size: var(--11px);
			}

			.axis-x {
				font-size: x-small;
			}

			.axis-y {
				font-size: x-small;
			}

			.cdf-legend {
				top: calc(var(--cdf-pad-top) + 4px);
				right: calc(var(--cdf-pad-right) + 4px);
			}
		}
	</style>
