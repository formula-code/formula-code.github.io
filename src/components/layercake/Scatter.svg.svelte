<script>
	import { getContext, onMount } from "svelte";
	import { line } from 'd3-shape';
	import { thresholdAgentNum, thresholdOracleNum } from "$stores/misc.js";

	const { data, xGet, yGet, xScale, yScale, width, height, padding, xDomain, yDomain } = getContext("LayerCake");

	$: guideLine = Array.isArray($data[1]) ? $data[1] : null;

	let path;
	let mounted = false;

	onMount(() => {
		mounted = true;
	});

  // NEW: compute the line extended to the plot edges
  $: extendedGuideLine = (() => {
    if (!guideLine || guideLine.length < 2) return null;
    const [[x1, y1], [x2, y2]] = guideLine;

    // vertical line
    if (x1 === x2) {
      const [yMin, yMax] = $yDomain;
      return [[x1, yMin], [x1, yMax]];
    }

    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - m * x1;
    const [xMin, xMax] = $xDomain;
    const [yMin, yMax] = $yDomain;

    const candidates = [
      [xMin, m * xMin + b],         // left
      [xMax, m * xMax + b],         // right
      [(yMin - b) / m, yMin],       // bottom
      [(yMax - b) / m, yMax],       // top
    ].filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));

    const inside = candidates.filter(([x, y]) =>
      x >= Math.min(xMin, xMax) - 1e-9 &&
      x <= Math.max(xMin, xMax) + 1e-9 &&
      y >= Math.min(yMin, yMax) - 1e-9 &&
      y <= Math.max(yMin, yMax) + 1e-9
    );

    if (inside.length < 2) return null;

    // pick the two farthest points along the line (sort by x then y)
    const uniq = [];
    const eps = 1e-9;
    for (const p of inside) {
      if (!uniq.some(q => Math.abs(p[0]-q[0]) < eps && Math.abs(p[1]-q[1]) < eps)) uniq.push(p);
    }
    if (uniq.length < 2) return null;
    uniq.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
    return [uniq[0], uniq[uniq.length - 1]];
  })();

  // UPDATED: build the path from the extended endpoints
  $: equalLinePath = extendedGuideLine
    ? line()
        .x(d => $xScale(d[0]))
        .y(d => $yScale(d[1]))
        (extendedGuideLine)
    : null;
</script>

<g class="median-markings">
	<rect
		class="highlight-quadrant"
		x={$xScale($thresholdAgentNum)}
		y={$yScale($thresholdOracleNum)}
		width={$width - $xScale($thresholdAgentNum)}
		height={$height - $yScale($thresholdOracleNum)}
		fill="#363B45"
		opacity=0.3
	/>
</g>
<g class="card-benchmark-circle">
	{#each $data[0] as d, i}
        <circle
			id={`card-benchmark-circle-${d.id}`}
			data-d={JSON.stringify(d)}
            cx={$xGet(d)}
            cy={$yGet(d)}
            r={5}
            fill="#475171"
        />
    {/each}
</g>

<g class="median-markings">
	{#if equalLinePath}
		<path class="equal-advantage-line" d={equalLinePath} />
	{/if}
    <line class="oracleAVG" x1={0} y1={$yScale($thresholdOracleNum)} x2={$width + $padding.right} y2={$yScale($thresholdOracleNum)} />
    <line class="agentAVG" x1={$xScale($thresholdAgentNum)} y1={0} x2={$xScale($thresholdAgentNum)} y2={$height} />
</g>

<style>
	circle {
		pointer-events: auto;
	}
	.equal-advantage-line {
		stroke-width: 2;
		stroke: var(--wine-red);
		fill: none;
	}

	.oracleAVG, .agentAVG {
		stroke-width: 2;
		stroke: var(--wine-tan);
	}
</style>
