<script>
	import { getContext, onMount } from "svelte";
	import { line, area } from 'd3-shape';
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

	const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  // UPDATED: build the path from the extended endpoints
  $: equalLinePath = extendedGuideLine
    ? line()
        .x(d => $xScale(d[0]))
        .y(d => $yScale(d[1]))
        (extendedGuideLine)
    : null;

	$: shadedAreaPath = (() => {
		if (!$xDomain || !$yDomain) return null;

		const [xMin, xMax] = $xDomain;
		const [yMin, yMax] = $yDomain;
		if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMax <= xMin) return null;
		if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMax <= yMin) return null;

		const agentThreshold = Number($thresholdAgentNum);
		const oracleThreshold = Number($thresholdOracleNum);
		if (!Number.isFinite(agentThreshold) || !Number.isFinite(oracleThreshold)) return null;

		const xStart = clamp(agentThreshold, xMin, xMax);
		if (xStart >= xMax) return null;

		if (Math.abs(agentThreshold) < 1e-6) return null; // vertical red line => undefined "under" region

		const slope = oracleThreshold / agentThreshold;
		if (!Number.isFinite(slope) || slope < 0) return null;

		const steps = 40;
		const dx = (xMax - xStart) / steps;
		const points = [];
		let hasArea = false;

		for (let i = 0; i <= steps; i++) {
			const xVal = xStart + dx * i;
			const rawY = slope * xVal;
			const clampedY = clamp(rawY, yMin, yMax);
			if (clampedY > yMin + 1e-6) {
				hasArea = true;
			}
			points.push({ x: xVal, y: clampedY });
		}

		if (!hasArea) return null;

		const shadedArea = area()
			.x(d => $xScale(d.x))
			.y0(() => $yScale(yMin))
			.y1(d => $yScale(d.y));

		return shadedArea(points);
	})();
</script>

<g class="median-markings">
	{#if shadedAreaPath}
		<path
			class="highlight-region"
			d={shadedAreaPath}
		/>
	{/if}
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
		stroke: var(--wine-tan);
		fill: none;
	}

	.oracleAVG,
	.agentAVG {
		stroke-width: 1;
		stroke: var(--wine-tan);
		stroke-dasharray: 4 4;
	}

	.highlight-region {
		fill: #363B45;
		opacity: 0.3;
	}
</style>
