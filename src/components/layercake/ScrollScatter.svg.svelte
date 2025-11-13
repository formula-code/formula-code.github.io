<script>
	import { getContext } from "svelte";
	import { line } from 'd3-shape';
    import { agentSelected, thresholdAgentNum, thresholdOracleNum, withFiltersData } from "$stores/misc.js";
    import { STEP_AGENT_FILTERS } from "$utils/agents.js";

    export let r = Math.min(36, Math.max(20, $width / 20));
	export let strokeWidth = 2;
    export let chartScrollIndex;
    export let highlightBenchmark = null;
    export let highlightBenchmarkId = null;

	const { data, xGet, yGet, xScale, yScale, width, height } = getContext("LayerCake");
    const xKey = 'agent/nop';
    const yKey = 'oracle/nop';

    $: r = Math.min(30, Math.max(20, $width / 30));
    $: smallestR = 5;
    $: expandedSmallestR = 10;

    $: scriptedBenchmarkId = highlightBenchmarkId ?? null;
    $: agentFilterForStep = STEP_AGENT_FILTERS[chartScrollIndex] ?? null;

    $: xDomain = typeof $xScale?.domain === "function" ? $xScale.domain() : [0, 0];
    $: yDomain = typeof $yScale?.domain === "function" ? $yScale.domain() : [0, 0];

const isAtLeast = step => chartScrollIndex === "exit" || (typeof chartScrollIndex === "number" && chartScrollIndex >= step);
const isStep = step => typeof chartScrollIndex === "number" && chartScrollIndex === step;
    $: isExplorePhase = (typeof chartScrollIndex === "number" && chartScrollIndex >= 14) || chartScrollIndex == "exit";
    const THRESHOLD_EPSILON = 1e-3;
    const withinEpsilon = (value, target = 1) => Math.abs((Number(value) || target) - target) <= THRESHOLD_EPSILON;
    $: showAgentThresholdLine = !withinEpsilon($thresholdAgentNum);
    $: showOracleThresholdLine = !withinEpsilon($thresholdOracleNum);

    $: highlightPoint = highlightBenchmark && typeof highlightBenchmark?.[xKey] === "number" && typeof highlightBenchmark?.[yKey] === "number"
        ? { x: highlightBenchmark[xKey], y: highlightBenchmark[yKey] }
        : null;

    const projectOntoEqualAdvantage = point => {
        if (!point) return null;
        const agentThresh = Number($thresholdAgentNum) || 1;
        const oracleThresh = Number($thresholdOracleNum) || 1;
        const slope = agentThresh === 0 ? 0 : oracleThresh / agentThresh || 0;
        const vector = [1, slope];
        const lenSq = vector[0] ** 2 + vector[1] ** 2;
        const dot = point.x * vector[0] + point.y * vector[1];
        const scale = lenSq === 0 ? 0 : dot / lenSq;
        return {
            x: scale * vector[0],
            y: scale * vector[1]
        };
    };

    $: projectedHighlight = projectOntoEqualAdvantage(highlightPoint);

    // Calculate line from (0,0) through (thresholdAgentNum, thresholdOracleNum) extended to plot edges
    $: equalAdvantagePoints = (() => {
        if ($thresholdAgentNum === 0 && $thresholdOracleNum === 0) {
            return [[0, 0], [Math.max(...xDomain), Math.max(...yDomain)]];
        }

        // Slope of the line from origin through the threshold point
        const slope = $thresholdOracleNum / $thresholdAgentNum;
        const maxX = Math.max(...xDomain);
        const maxY = Math.max(...yDomain);

        // Extend line to edges: either hits right edge or top edge
        const yAtMaxX = slope * maxX;
        const xAtMaxY = maxY / slope;

        if (yAtMaxX <= maxY) {
            // Line hits right edge first
            return [[0, 0], [maxX, yAtMaxX]];
        } else {
            // Line hits top edge first
            return [[0, 0], [xAtMaxY, maxY]];
        }
    })();

    $: path = line()
			.x(d => $xScale(d[0]))
			.y(d => $yScale(d[1]))
			(equalAdvantagePoints);

    // Calculate polygon for shaded "sweet spot" (right of agent threshold & below equal advantage)
    $: highPerformancePolygonPoints = (() => {
        if (!$xScale || !$yScale) return "";

        const xDomain = typeof $xScale?.domain === "function" ? $xScale.domain() : [0, 3];
        const yDomain = typeof $yScale?.domain === "function" ? $yScale.domain() : [0, 3];
        const [xMin, xMax] = xDomain;
        const [yMin, yMax] = yDomain;

        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
        const rawThresholdX = Number.isFinite($thresholdAgentNum) ? $thresholdAgentNum : xMin;
        const thresholdX = clamp(rawThresholdX, xMin, xMax);
        if (thresholdX >= xMax) return "";

        const slope = Number.isFinite($thresholdAgentNum) && Math.abs($thresholdAgentNum) > 0
            ? $thresholdOracleNum / $thresholdAgentNum
            : null;

        const yAtThreshold = slope === null
            ? (Number.isFinite($thresholdOracleNum) ? $thresholdOracleNum : yMax)
            : slope * thresholdX;
        const startY = clamp(yAtThreshold, yMin, yMax);

        const points = [];
        points.push([$xScale(thresholdX), $yScale(startY)]);

        if (slope === null || !Number.isFinite(slope) || slope <= 0) {
            const yLine = slope === null
                ? clamp(Number.isFinite($thresholdOracleNum) ? $thresholdOracleNum : yMax, yMin, yMax)
                : clamp(slope * xMax, yMin, yMax);
            points.push([$xScale(xMax), $yScale(yLine)]);
        } else {
            const xAtTop = yMax / slope;
            if (xAtTop >= xMax) {
                const yRight = clamp(slope * xMax, yMin, yMax);
                points.push([$xScale(xMax), $yScale(yRight)]);
            } else {
                const clampedXTop = Math.max(thresholdX, Math.min(xAtTop, xMax));
                points.push([$xScale(clampedXTop), $yScale(yMax)]);
                if (clampedXTop < xMax) {
                    points.push([$xScale(xMax), $yScale(yMax)]);
                }
            }
        }

        points.push([$xScale(xMax), $yScale(yMin)]);
        points.push([$xScale(thresholdX), $yScale(yMin)]);

        return points.map(([x, y]) => `${x},${y}`).join(' ');
    })();

    // Regression zone: x < 1.0 AND y < 1.0
    $: regressionPoints = (() => {
        const xThreshold = $xScale(1.0);
        const yThreshold = $yScale(1.0);
        return `0,${yThreshold} ${xThreshold},${yThreshold} ${xThreshold},${$height} 0,${$height}`;
    })();

    // Under-optimization zone: x >= 1.0 AND above equal advantage line
    $: underOptimizationPoints = (() => {
        const [x0d, y0d] = equalAdvantagePoints[0];
        const [x1d, y1d] = equalAdvantagePoints[1];
        const x0 = $xScale(x0d);
        const y0 = $yScale(y0d);
        const x1 = $xScale(x1d);
        const y1 = $yScale(y1d);
        const xThreshold = $xScale(1.0);
        const yThreshold = $yScale(1.0);

        const points = [`${xThreshold},${yThreshold}`, `${x1},${y1}`];
        // Complete the polygon
        if (y1 > 0) {
            points.push(`${x1},0`);
        }
        points.push(`${xThreshold},0`);
        return points.join(' ');
    })();

    // Sub-optimization zone: x < 1.0 AND y >= 1.0
    $: subOptimizationPoints = (() => {
        const [x0d, y0d] = equalAdvantagePoints[0];
        const [x1d, y1d] = equalAdvantagePoints[1];
        const x0 = $xScale(x0d);
        const y0 = $yScale(y0d);
        const x1 = $xScale(x1d);
        const y1 = $yScale(y1d);
        const xThreshold = $xScale(1.0);
        const yThreshold = $yScale(1.0);

        const points = [
            [x0, y0],                  // intersection on one threshold
            [xThreshold, yThreshold],  // the (1, 1) corner
            [x1, y1]                   // intersection on the other threshold
        ].map(([x, y]) => `${x},${y}`);

        return points.join(' ');
    })();

    // Calculate overflow indicators for points outside the visible domain
    $: overflowIndicators = (() => {
        if (!$withFiltersData || !$xScale || !$yScale) return [];

        const xDomain = typeof $xScale?.domain === "function" ? $xScale.domain() : [0, 3];
        const yDomain = typeof $yScale?.domain === "function" ? $yScale.domain() : [0, 3];
        const [xMin, xMax] = xDomain;
        const [yMin, yMax] = yDomain;

        // Count points by overflow direction
        const overflow = {
            top: [],
            right: [],
            bottom: [],
            left: [],
            topRight: [],
            topLeft: [],
            bottomRight: [],
            bottomLeft: []
        };

        $withFiltersData.forEach(d => {
            const x = d['agent/nop'];
            const y = d['oracle/nop'];

            if (x === undefined || y === undefined) return;

            const overX = x > xMax;
            const underX = x < xMin;
            const overY = y > yMax;
            const underY = y < yMin;

            if (overX && overY) overflow.topRight.push(d);
            else if (overX && underY) overflow.bottomRight.push(d);
            else if (underX && overY) overflow.topLeft.push(d);
            else if (underX && underY) overflow.bottomLeft.push(d);
            else if (overX) overflow.right.push(d);
            else if (underX) overflow.left.push(d);
            else if (overY) overflow.top.push(d);
            else if (underY) overflow.bottom.push(d);
        });

        const indicators = [];
        const padding = 20;

        // Right edge
        if (overflow.right.length > 0) {
            indicators.push({
                x: $width - padding,
                y: $height / 2,
                count: overflow.right.length,
                direction: 'right'
            });
        }

        // Top edge
        if (overflow.top.length > 0) {
            indicators.push({
                x: $width / 2,
                y: padding,
                count: overflow.top.length,
                direction: 'top'
            });
        }

        // Left edge
        if (overflow.left.length > 0) {
            indicators.push({
                x: padding,
                y: $height / 2,
                count: overflow.left.length,
                direction: 'left'
            });
        }

        // Bottom edge
        if (overflow.bottom.length > 0) {
            indicators.push({
                x: $width / 2,
                y: $height - padding,
                count: overflow.bottom.length,
                direction: 'bottom'
            });
        }

        // Corners
        if (overflow.topRight.length > 0) {
            indicators.push({
                x: $width - padding,
                y: padding,
                count: overflow.topRight.length,
                direction: 'topRight'
            });
        }

        if (overflow.topLeft.length > 0) {
            indicators.push({
                x: padding,
                y: padding,
                count: overflow.topLeft.length,
                direction: 'topLeft'
            });
        }

        if (overflow.bottomRight.length > 0) {
            indicators.push({
                x: $width - padding,
                y: $height - padding,
                count: overflow.bottomRight.length,
                direction: 'bottomRight'
            });
        }

        if (overflow.bottomLeft.length > 0) {
            indicators.push({
                x: padding,
                y: $height - padding,
                count: overflow.bottomLeft.length,
                direction: 'bottomLeft'
            });
        }

        return indicators;
    })();
</script>


{#if isStep(7)}
<g class="zone-highlights">
    <polygon
        class="highlight-quadrant"
        points={highPerformancePolygonPoints}
        fill="#363B45"
        opacity={0.3}
    />
</g>
{/if}

<!-- Solid axis lines for steps 0-1 -->
{#if typeof chartScrollIndex === "number" }
<g class="intro-axes">
    <!-- Y-axis (vertical line at x=0) -->
    <line
        x1={$xScale(0)}
        y1={$height}
        x2={$xScale(0)}
        y2={0}
        stroke="var(--wine-tan)"
        stroke-width="2"
        marker-end="url(#arrowhead)"
    />
    <!-- X-axis (horizontal line at y=0) -->
    <line
        x1={0}
        y1={$yScale(0)}
        x2={$width}
        y2={$yScale(0)}
        stroke="var(--wine-tan)"
        stroke-width="2"
        marker-end="url(#arrowhead)"
    />
</g>
{/if}

<!-- {#if isStep(8) && highlightPoint && projectedHighlight}
    {@const hx = $xScale(highlightPoint.x)}
    {@const hy = $yScale(highlightPoint.y)}
    {@const px = $xScale(projectedHighlight.x)}
    {@const py = $yScale(projectedHighlight.y)}
    {@const midX = (hx + px) / 2}
    {@const midY = (hy + py) / 2}
    <g class="advantage-annotation">
        <line x1={hx} y1={hy} x2={px} y2={py} />
        <circle cx={hx} cy={hy} r={6} />
        <circle cx={px} cy={py} r={4} class="projection-dot" />
        <text x={midX} y={midY - 10} text-anchor="middle">
            Distance to Equal Advantage
        </text>
    </g>
{/if} -->

{#if chartScrollIndex !== undefined && chartScrollIndex !== 0}
  <g class="benchmarks-wrapper">
    {#each $data[1] as d, i}
      {#if scriptedBenchmarkId !== d.id}
        {@const cx = chartScrollIndex >= 2 || chartScrollIndex == "exit" ? $xGet(d) : $xScale(1.11)}
        {@const cy = chartScrollIndex >= 2 || chartScrollIndex == "exit" ? $yGet(d) : $yScale(1.38)}
        {@const agent = d.agent_id}
        {@const xDomain = typeof $xScale?.domain === "function" ? $xScale.domain() : [0, 3]}
        {@const yDomain = typeof $yScale?.domain === "function" ? $yScale.domain() : [0, 3]}
        {@const isInBounds = (chartScrollIndex < 2) || (d['agent/nop'] >= xDomain[0] && d['agent/nop'] <= xDomain[1] && d['oracle/nop'] >= yDomain[0] && d['oracle/nop'] <= yDomain[1])}
        {@const isInFilteredData = $withFiltersData.some(f => f.id === d.id)}
        {@const meetsVertical = ($thresholdAgentNum ?? 0) <= 0 ? true : d['agent/nop'] >= $thresholdAgentNum}
        {@const belowEqualLine = ($thresholdOracleNum ?? 0) <= 0
            ? true
            : (d['oracle/nop'] * ($thresholdAgentNum ?? 0) <= d['agent/nop'] * $thresholdOracleNum)}
        {@const isSelectable = meetsVertical && belowEqualLine}
        {@const shouldHideForStep = agentFilterForStep ? d.agent_id !== agentFilterForStep : false}
        {@const shouldDimForIntro = chartScrollIndex == 1 && scriptedBenchmarkId && d.id !== scriptedBenchmarkId}
        {@const shouldDim = isExplorePhase ? !(isInFilteredData && isSelectable) : false}
        {#if isInBounds}
        <g class="benchmark-circle benchmark-circle-{agent.replace(/,/g, '-')}"
            class:hidden={shouldHideForStep}
            class:intro-dimmed={shouldDimForIntro}
            class:filteredOut={shouldDim}
        >
          <circle
            id={`circle-${d.id}`}
            cx={cx}
            cy={cy}
            r={smallestR}
            fill={(isSelectable && (isStep(7) || isExplorePhase)) ? "#3E5C4B" : "#475171"}
            stroke="none"
            stroke-width={strokeWidth}
            opacity={0.8}
          />
        </g>
        {/if}
      {/if}
    {/each}

    {#each $data[1] as d, i}
      {#if scriptedBenchmarkId && scriptedBenchmarkId === d.id}
        {@const cx = chartScrollIndex >= 2 || chartScrollIndex == "exit" ? $xGet(d) : $xScale(1.11)}
        {@const cy = chartScrollIndex >= 2 || chartScrollIndex == "exit" ? $yGet(d) : $yScale(1.38)}
        {@const agent = d.agent_id}
        {@const xDomain = typeof $xScale?.domain === "function" ? $xScale.domain() : [0, 3]}
        {@const yDomain = typeof $yScale?.domain === "function" ? $yScale.domain() : [0, 3]}
        {@const isInBounds = (chartScrollIndex < 2) || (d['agent/nop'] >= xDomain[0] && d['agent/nop'] <= xDomain[1] && d['oracle/nop'] >= yDomain[0] && d['oracle/nop'] <= yDomain[1])}
        {@const isInFilteredData = $withFiltersData.some(f => f.id === d.id)}
        {@const meetsVertical = ($thresholdAgentNum ?? 0) <= 0 ? true : d['agent/nop'] >= $thresholdAgentNum}
        {@const belowEqualLine = ($thresholdOracleNum ?? 0) <= 0
            ? true
            : (d['oracle/nop'] * ($thresholdAgentNum ?? 0) <= d['agent/nop'] * $thresholdOracleNum)}
        {@const isSelectable = meetsVertical && belowEqualLine}
        {@const shouldHideForStep = agentFilterForStep ? d.agent_id !== agentFilterForStep : false}
        {@const shouldDim = isExplorePhase ? !(isInFilteredData && isSelectable) : false}
        {#if isInBounds}
        <g class="benchmark-circle benchmark-circle-{agent.replace(/,/g, '-')} selected-circle"
            class:hidden={shouldHideForStep}
            class:filteredOut={shouldDim}
        >
          <circle
            id={`circle-${d.id}`}
            cx={cx}
            cy={cy}
            r={chartScrollIndex >= 2 && chartScrollIndex < 15 ? expandedSmallestR : smallestR}
            fill={(isSelectable && (isAtLeast(7) || isExplorePhase)) || isStep(1) ? "#3E5C4B" : "#475171"}
            stroke={isStep(1) || (chartScrollIndex >= 2 && chartScrollIndex < 15) ? "#F7B956" : "none"}
            stroke-width={strokeWidth}
            opacity={1}
          />
        </g>
        {/if}
      {/if}
    {/each}
  </g>
{/if}

<!-- Overflow indicators for points outside visible domain -->
{#if chartScrollIndex >= 2 || chartScrollIndex == "exit"}
  <g class="overflow-indicators">
    {#each overflowIndicators as indicator}
      <g class="overflow-indicator">
        <circle
          cx={indicator.x}
          cy={indicator.y}
          r={12}
          fill="#F7B956"
          stroke="#363B45"
          stroke-width={2}
          opacity={0.9}
        />
        <text
          x={indicator.x}
          y={indicator.y}
          text-anchor="middle"
          dominant-baseline="middle"
          fill="#363B45"
          font-family="var(--sans)"
          font-size="10"
          font-weight="700"
        >
          {indicator.count}
        </text>
      </g>
    {/each}
  </g>
{/if}

<!-- Model-wise summary scatterplot points removed per user request -->

<g class="trendline"
    class:active={(typeof chartScrollIndex === "number" && chartScrollIndex >= 2) || chartScrollIndex == "exit"}>
    {#if path}
        <path class="equal-advantage-line" d={path} />
        {@const [x0d, y0d] = equalAdvantagePoints[0]}
        {@const [x1d, y1d] = equalAdvantagePoints[1]}
        {@const x0 = $xScale(x0d)}
        {@const y0 = $yScale(y0d)}
        {@const x1 = $xScale(x1d)}
        {@const y1 = $yScale(y1d)}
        {@const angle = Math.atan2(y1 - y0, x1 - x0) * (180 / Math.PI)}
        <text
            class="label equal-advantage-label"
            x={x1}
            y={y1}
            transform={`translate(-30, 5) rotate(${angle}, ${x1}, ${y1})`}
            text-anchor="end"
            fill="var(--wine-tan)">
            Equal Advantage
        </text>
    {/if}
</g>

<g class="median-markings" class:active={(typeof chartScrollIndex === "number" && chartScrollIndex >= 3) || chartScrollIndex == "exit"}>
    <line class="oracleAVG-gray" x1={0} y1={$yScale(1.0)} x2={$width} y2={$yScale(1.0)} />
    <line class="agentAVG-gray" x1={$xScale(1.0)} y1={0} x2={$xScale(1.0)} y2={$height} />

    {#if showOracleThresholdLine}
        <line class="oracleAVG" x1={0} y1={$yScale($thresholdOracleNum)} x2={$width} y2={$yScale($thresholdOracleNum)} />
    {/if}
    {#if showAgentThresholdLine}
        <line class="agentAVG" x1={$xScale($thresholdAgentNum)} y1={0} x2={$xScale($thresholdAgentNum)} y2={$height} />
    {/if}
    <text
        class="label"
        x={$width-20}
        y={$yScale(1.0) - 10}
        text-anchor="end"
        fill="white">
        No Oracle Speedup
    </text>

    <text
        class="label"
        x={$xScale(1.0) - 180}
        y={17}
        transform={`rotate(-90, ${$xScale(1.0)}, 0)`}
        text-anchor="start"
        fill="white">
        No Agent Speedup
    </text>
</g>

<style>
    .highlight-quadrant,
    .highlight-regression,
    .highlight-sub-optimization,
    .highlight-under-optimization {
        transition: opacity var(--500ms);
    }
    .benchmarks-wrapper g.active {
        opacity: 1;
    }

    .benchmarks-wrapper g.hidden {
        opacity: 0;
        pointer-events: none;
    }

    .benchmarks-wrapper g.filteredOut {
        opacity: 0.1;
        pointer-events: none;
    }

    .benchmarks-wrapper g {
        opacity: 1;
        transition: opacity var(--750ms) linear;
    }

    .benchmarks-wrapper g.intro-dimmed {
        opacity: 0.15;
    }

	circle {
        opacity: 0.5;
		pointer-events: auto;
        transition: all var(--500ms) ease-out;
	}

    .selected-circle circle {
        opacity: 1;
    }

    .label {
        text-transform: uppercase;
        font-weight: 700;
        font-family: var(--sans);
        font-size: var(--12px);
        fill: var(--wine-dark-tan);
    }

    .label-dashed {
        text-transform: uppercase;
        font-weight: 700;
        font-family: var(--sans);
        font-size: var(--12px);
        fill: #a10f50;
    }
    .compare-wrapper.hidden {
        opacity: 0;
        transition: opacity var(--500ms) linear;
    }

    g.trendline, g.compare-lines {
        opacity: 0;
        transition: opacity var(--500ms) linear;
    }

    g.trendline.active {
        opacity: 1;
    }

    g.compare-lines.active{
        opacity: 0.125;
    }

    g.trendline path {
        stroke: var(--wine-tan);
        fill: none;
        stroke-width: 1.25;
        stroke-dasharray: 4 6;
        stroke-linecap: round;
    }

    .oracleAVG, .agentAVG {
        stroke-width: 1;
        stroke: var(--wine-tan);
    }

    .oracleAVG-gray, .agentAVG-gray {
        stroke-width: 0.85;
        stroke: var(--wine-dark-tan);
        stroke-dasharray: 2 6;
        stroke-linecap: round;
    }

    .median-markings {
        opacity: 0;
        transition: opacity var(--500ms) linear;
    }

    .median-markings.active {
        opacity: 1;
    }

    .zone-highlights {
        pointer-events: none;
    }

    .overflow-indicators {
        pointer-events: none;
    }

    .overflow-indicator circle {
        transition: all var(--250ms);
    }

    .overflow-indicator:hover circle {
        r: 14;
    }

    .overflow-indicator text {
        pointer-events: none;
    }

</style>
