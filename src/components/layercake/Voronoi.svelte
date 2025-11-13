<script>
	import { getContext } from 'svelte';
	import { uniques } from 'layercake';
	import { Delaunay } from 'd3-delaunay';
	import { selectAll, select } from 'd3-selection';
	import { tooltipType, lockedSelection, tooltipData, tooltipVisible, thresholdAgentNum, thresholdOracleNum } from "$stores/misc.js";
	import viewport from "$stores/viewport.js";

	const { data, xGet, yGet, width, height } = getContext('LayerCake');

	let selectedPoint;

	// SCREENSIZE
	$: w = $viewport.width;
	$: h = $viewport.height;
	$: isMobile = w <= 500;

	function mouseoverCircle(point) {
		tooltipType.set("benchmark")

		selectAll(".card-benchmark-circle circle")
			.style("opacity", 0.3)

		selectAll(`#card-benchmark-circle-${point.data.id}`)
			.style("opacity", 1)
			.style("fill", "#CFCABF")
			.transition(500)
			.attr("r", 10)
			.each(function () {
				this.parentNode.appendChild(this); // Append to the end of the parent
			});

		setTooltip(point.data)
	}

	function mouseClickCircle(point) {
		selectedPoint = point;
		tooltipType.set("benchmark")

		selectAll(".card-benchmark-circle circle")
			.style("opacity", 0.3)

		selectAll(`#card-benchmark-circle-${point.data.id}`)
			.style("opacity", 1)
			.style("fill", "#CFCABF")
			.transition(500)
			.attr("r", 10)
			.each(function () {
				this.parentNode.appendChild(this); // Append to the end of the parent
			});

		setTooltip(point.data)
	}

	function mouseleaveCircle(point) {
		selectAll(".card-benchmark-circle circle")
			.style("opacity", 0.8)

		selectAll(`#card-benchmark-circle-${point.data.id}`)
			.style("opacity", 0.8)
			.style("fill", "#475171")
			.transition(500)
			.attr("r", 5)
	}

	function setTooltip(data) {
		tooltipVisible.set(true);
		tooltipData.set(data);
		tooltipType.set("benchmark");
	}

	$: points = $data[0].map(d => {
				const point = [$xGet(d), $yGet(d)];
				point.data = d;
				return point;
		})

	$: uniquePoints = uniques(points, d => d.join(), false);
	$: voronoi = Delaunay.from(uniquePoints).voronoi([0, 0, $width, $height]);

	$: if (!$lockedSelection && selectedPoint) {
		mouseleaveCircle(selectedPoint);
	}
  </script>

  {#each uniquePoints as point, i}
	<path
		id={`voronoi-${point.data.id}`}
		class={"voronoi-cell"}
		class:active={!isMobile}
	  	d={voronoi.renderCell(i)}
	  	aria-label={`Benchmark ${point.data.benchmark_name}, Agent speedup ${point.data['agent/nop']}, Oracle speedup ${point.data['oracle/nop']}`}
		tabindex="0"
		role="button"
		on:mouseover={() => {
			if (!$lockedSelection && !isMobile) mouseoverCircle(point);
		}}
		on:mouseleave={() => {
			if (!$lockedSelection && !isMobile) mouseleaveCircle(point);
		}}
		on:focus={() => {
			if (!$lockedSelection && !isMobile) mouseoverCircle(point);
		}}
		on:click={() => {
			if(!isMobile) {
				lockedSelection.set(true);
				mouseClickCircle(point);
			}
		}}
		on:keydown={(e) => {
			if (!$lockedSelection && !isMobile && (e.key === 'Enter' || e.key === ' ')) {
			  lockedSelection.set(true);
			  mouseClickCircle(point);
			  e.preventDefault();
			}
		  }}
	></path>
  {/each}

  <style>
	.voronoi-cell {
	  fill: none;
	  stroke: none;
	  pointer-events: none;
	  outline: none;
	  cursor: pointer;
	}
	.voronoi-cell.active {
		pointer-events: all;
	}
  </style>
