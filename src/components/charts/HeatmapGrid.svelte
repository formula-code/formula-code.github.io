<script>
	import { interpolateRdBu, interpolateBlues } from "d3-scale-chromatic";
	import { scaleLinear } from "d3-scale";

	// Generic SVG heatmap with rotated column labels, per-column or shared
	// color scaling, hover tooltips, and an optional annotation strip below
	// the cells (brackets spanning column groups + dashed vertical dividers).
	// Drives the F3 / F4 / F7 findings; HTML-table heatmap stays in
	// HeatmapTable.svelte for F1.

	export let rowLabels = [];
	export let colLabels = [];
	export let values = []; // 2D [rowIdx][colIdx], null/NaN allowed
	export let colorMode = "diverging"; // "diverging" | "sequential"
	export let scaling = "per-column"; // "per-column" | "shared"
	export let legendCaps = ["Low", "High"];
	export let valueFormat = (v) =>
		Number.isFinite(v) ? v.toFixed(3) : "—";
	export let colDimensionLabel = "Column";
	// Annotation specs:
	//   { type: "bracket", range: [startCol, endCol], label, tone?, side? }
	//     tone ∈ "positive" | "negative" | "neutral" — sets brace color
	//     side ∈ "top" | "bottom"  (default "bottom"; "top" places the brace
	//     above the cells with its tip pointing down)
	//   { type: "divider", after: colIdx, label }
	//     dashed vertical line between col `after` and col `after + 1`
	export let annotations = [];
	export let rowLabelWidth = 180;
	export let colWidth = 56;
	export let rowHeight = 34;
	export let topLabelHeight = 150;

	const GAP = 2;
	const RIGHT_PAD = 16;
	const LEGEND_H = 36;

	$: numCols = colLabels.length;
	$: numRows = rowLabels.length;
	$: brackets = annotations.filter((a) => a.type === "bracket");
	$: dividers = annotations.filter((a) => a.type === "divider");
	$: bracketsTop = brackets.filter((b) => b.side === "top");
	$: bracketsBottom = brackets.filter((b) => b.side !== "top");

	// Bracket geometry — bar above/below the cells with end ticks turning in
	// toward the cells, and a label on the outside. Top-side brackets need
	// more clearance from the cell top because the labels above the bar
	// otherwise crowd the rotated column labels.
	const BRACKET_TICK = 6;
	// Top brackets need extra lift so the tick endpoints clear the rotated
	// column labels (which extend upward from `cellsY0 - 6`). 36px leaves a
	// ~14px breathing gap above short column labels like Q1–Q5.
	const BRACKET_OFFSET_TOP = 36;
	const BRACKET_OFFSET_BOTTOM = 12;
	const BRACKET_LABEL_GAP = 12;

	$: topAnnotH =
		bracketsTop.length > 0
			? BRACKET_OFFSET_TOP + BRACKET_LABEL_GAP + 10
			: 0;
	$: bottomAnnotH =
		(bracketsBottom.length > 0
			? BRACKET_OFFSET_BOTTOM + BRACKET_LABEL_GAP + 10
			: 0) +
		(dividers.length > 0 ? 24 : 0) +
		8;

	$: gridW = colWidth * numCols;
	$: gridH = rowHeight * numRows;
	$: cellsY0 = topLabelHeight + topAnnotH;
	$: cellsY1 = cellsY0 + gridH;
	$: W = rowLabelWidth + gridW + RIGHT_PAD;
	$: H = cellsY1 + bottomAnnotH + LEGEND_H;

	$: scales = (() => {
		if (colorMode === "diverging") {
			if (scaling === "per-column") {
				return colLabels.map((_, j) => {
					let m = 0;
					for (let i = 0; i < numRows; i++) {
						const v = values[i]?.[j];
						if (Number.isFinite(v)) m = Math.max(m, Math.abs(v));
					}
					if (m === 0) m = 0.05;
					return scaleLinear()
						.domain([-m, 0, m])
						.range([0, 0.5, 1])
						.clamp(true);
				});
			}
			let m = 0;
			for (let i = 0; i < numRows; i++) {
				for (let j = 0; j < numCols; j++) {
					const v = values[i]?.[j];
					if (Number.isFinite(v)) m = Math.max(m, Math.abs(v));
				}
			}
			if (m === 0) m = 0.05;
			const s = scaleLinear()
				.domain([-m, 0, m])
				.range([0, 0.5, 1])
				.clamp(true);
			return colLabels.map(() => s);
		}
		let lo = Infinity;
		let hi = -Infinity;
		for (let i = 0; i < numRows; i++) {
			for (let j = 0; j < numCols; j++) {
				const v = values[i]?.[j];
				if (Number.isFinite(v)) {
					lo = Math.min(lo, v);
					hi = Math.max(hi, v);
				}
			}
		}
		if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
			lo = 0;
			hi = 1;
		}
		if (lo === hi) {
			lo -= 0.5;
			hi += 0.5;
		}
		const s = scaleLinear().domain([lo, hi]).range([0, 1]).clamp(true);
		return colLabels.map(() => s);
	})();

	function colorFor(j, v) {
		if (!Number.isFinite(v)) return null;
		const t = scales[j](v);
		if (colorMode === "diverging") return interpolateRdBu(t);
		return interpolateBlues(t);
	}

	function bracketColor(tone) {
		// Echo the RdBu palette so brackets feel of-a-piece with the cells.
		if (tone === "positive") return "rgb(33,102,172)";
		if (tone === "negative") return "rgb(178,24,43)";
		return "var(--text-muted)";
	}

	let hovered = null;
	let containerEl;
	let tipX = 0;
	let tipY = 0;

	function onEnter(event, i, j) {
		hovered = {
			i,
			j,
			rowLabel: rowLabels[i],
			colLabel: colLabels[j],
			value: values[i]?.[j]
		};
		positionTip(event);
	}
	function onMove(event) {
		if (!hovered) return;
		positionTip(event);
	}
	function positionTip(event) {
		const rect = containerEl?.getBoundingClientRect();
		if (!rect) return;
		tipX = event.clientX - rect.left;
		tipY = event.clientY - rect.top;
	}
	function onLeave() {
		hovered = null;
	}

	$: legendY = cellsY1 + bottomAnnotH + 8;
	$: legendW = Math.min(220, gridW);
	$: legendX = rowLabelWidth + (gridW - legendW) / 2;
	$: legendGradId =
		colorMode === "diverging" ? "hg-rdbu" : "hg-blues";
</script>

<div class="hg-wrap" bind:this={containerEl}>
	<svg
		class="hg-svg"
		viewBox="0 0 {W} {H}"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-label="Heatmap of {colDimensionLabel} values"
	>
		<!-- rotated column labels -->
		{#each colLabels as label, j}
			{@const cx = rowLabelWidth + j * colWidth + colWidth / 2}
			{@const cy = cellsY0 - 6}
			<text
				class="col-label"
				x={cx}
				y={cy}
				text-anchor="start"
				transform="rotate(-45 {cx} {cy})"
			>
				{label}
			</text>
		{/each}

		<!-- row labels -->
		{#each rowLabels as label, i}
			{@const cy = cellsY0 + i * rowHeight + rowHeight / 2}
			<text
				class="row-label"
				x={rowLabelWidth - 12}
				y={cy}
				dominant-baseline="middle"
				text-anchor="end"
			>
				{label}
			</text>
		{/each}

		<!-- cells -->
		{#each values as row, i}
			{#each row as v, j}
				{@const bg = colorFor(j, v)}
				{@const isActive =
					hovered && hovered.i === i && hovered.j === j}
				<rect
					class="cell"
					class:missing={!Number.isFinite(v)}
					class:active={isActive}
					x={rowLabelWidth + j * colWidth + GAP / 2}
					y={cellsY0 + i * rowHeight + GAP / 2}
					width={colWidth - GAP}
					height={rowHeight - GAP}
					rx="2"
					fill={bg || "var(--bg-tertiary)"}
					on:mouseenter={(e) => onEnter(e, i, j)}
					on:mousemove={onMove}
					on:mouseleave={onLeave}
					on:focus={(e) => onEnter(e, i, j)}
					on:blur={onLeave}
					tabindex="0"
					role="button"
					aria-label="{rowLabels[i]}, {colLabels[j]}: {valueFormat(v)}"
				></rect>
			{/each}
		{/each}

		<!-- dividers (drawn through cells) -->
		{#each dividers as d, di (di)}
			{@const xLine = rowLabelWidth + (d.after + 1) * colWidth}
			<line
				class="annot-divider"
				x1={xLine}
				x2={xLine}
				y1={cellsY0 - 4}
				y2={cellsY1 + 4}
			></line>
			<text
				class="annot-divider-label"
				x={xLine}
				y={cellsY1 + 22}
				text-anchor="middle"
			>
				{d.label}
			</text>
		{/each}

		<!-- bracket annotations: a horizontal bar with end ticks turning IN
		     toward the cells. side="top" puts the bar above the cells with
		     ticks pointing down; side="bottom" puts it below with ticks
		     pointing up. -->
		{#each brackets as b, bi (bi)}
			{@const x1 = rowLabelWidth + b.range[0] * colWidth + GAP / 2}
			{@const x2 =
				rowLabelWidth + (b.range[1] + 1) * colWidth - GAP / 2}
			{@const cx = (x1 + x2) / 2}
			{@const color = bracketColor(b.tone)}
			{@const isTop = b.side === "top"}
			{@const yBar = isTop
				? cellsY0 - BRACKET_OFFSET_TOP
				: cellsY1 + BRACKET_OFFSET_BOTTOM}
			{@const yTick = isTop
				? yBar + BRACKET_TICK
				: yBar - BRACKET_TICK}
			{@const yLabel = isTop
				? yBar - BRACKET_LABEL_GAP
				: yBar + BRACKET_LABEL_GAP}
			<line
				class="annot-bracket"
				x1={x1}
				x2={x2}
				y1={yBar}
				y2={yBar}
				stroke={color}
			></line>
			<line
				class="annot-bracket"
				x1={x1}
				x2={x1}
				y1={yBar}
				y2={yTick}
				stroke={color}
			></line>
			<line
				class="annot-bracket"
				x1={x2}
				x2={x2}
				y1={yBar}
				y2={yTick}
				stroke={color}
			></line>
			<text
				class="annot-bracket-label"
				x={cx}
				y={yLabel}
				text-anchor="middle"
				fill={color}
				dominant-baseline={isTop ? "auto" : "hanging"}
			>
				{b.label}
			</text>
		{/each}

		<!-- legend -->
		<defs>
			{#if colorMode === "diverging"}
				<linearGradient id="hg-rdbu" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stop-color="rgb(103,0,31)" />
					<stop offset="0.1" stop-color="rgb(178,24,43)" />
					<stop offset="0.2" stop-color="rgb(214,96,77)" />
					<stop offset="0.3" stop-color="rgb(244,165,130)" />
					<stop offset="0.4" stop-color="rgb(253,219,199)" />
					<stop offset="0.5" stop-color="rgb(247,247,247)" />
					<stop offset="0.6" stop-color="rgb(209,229,240)" />
					<stop offset="0.7" stop-color="rgb(146,197,222)" />
					<stop offset="0.8" stop-color="rgb(67,147,195)" />
					<stop offset="0.9" stop-color="rgb(33,102,172)" />
					<stop offset="1" stop-color="rgb(5,48,97)" />
				</linearGradient>
			{:else}
				<linearGradient id="hg-blues" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0" stop-color="rgb(247,251,255)" />
					<stop offset="0.5" stop-color="rgb(107,174,214)" />
					<stop offset="1" stop-color="rgb(8,48,107)" />
				</linearGradient>
			{/if}
		</defs>
		<rect
			x={legendX}
			y={legendY}
			width={legendW}
			height="10"
			rx="2"
			fill="url(#{legendGradId})"
		></rect>
		<text
			class="legend-cap"
			x={legendX - 8}
			y={legendY + 8}
			text-anchor="end"
		>
			{legendCaps[0]}
		</text>
		<text
			class="legend-cap"
			x={legendX + legendW + 8}
			y={legendY + 8}
			text-anchor="start"
		>
			{legendCaps[1]}
		</text>
	</svg>

	{#if hovered}
		<div
			class="hg-tip"
			style="left:{tipX + 14}px; top:{tipY + 14}px;"
			role="tooltip"
		>
			<div class="tip-head"><strong>{hovered.rowLabel}</strong></div>
			<div class="tip-row">
				<span class="tip-key">{hovered.colLabel}</span>
				<span class="tip-val">{valueFormat(hovered.value)}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.hg-wrap {
		position: relative;
		overflow-x: auto;
		border-radius: var(--radius);
		border: 1px solid var(--border-primary);
		background: var(--bg-primary);
		padding: 8px 4px 4px;
	}

	.hg-svg {
		display: block;
		width: 100%;
		min-width: 620px;
		height: auto;
		font-family: var(--sans);
	}

	@media (max-width: 520px) {
		.hg-svg {
			min-width: 480px;
		}
	}

	.col-label {
		font-size: 12px;
		fill: var(--text-primary);
	}

	.row-label {
		font-size: 12px;
		fill: var(--text-primary);
	}

	.cell {
		stroke: var(--bg-primary);
		stroke-width: 1;
		cursor: pointer;
		transition: filter 120ms ease;
	}

	.cell:focus {
		outline: none;
	}

	.cell.missing {
		stroke: var(--border-primary);
		fill: var(--bg-tertiary);
	}

	.cell.active {
		stroke: var(--text-primary);
		stroke-width: 1.8;
		filter: brightness(1.05);
	}

	.annot-bracket {
		stroke-width: 2;
		fill: none;
	}

	.annot-bracket-label {
		font-size: 12px;
		font-weight: 600;
		font-family: var(--sans);
	}

	.annot-divider {
		stroke: var(--text-primary);
		stroke-width: 1.4;
		stroke-dasharray: 5 4;
		opacity: 0.55;
	}

	.annot-divider-label {
		font-size: 11.5px;
		font-weight: 600;
		fill: var(--text-primary);
		font-family: var(--sans);
		letter-spacing: 0.02em;
	}

	.legend-cap {
		font-size: 10.5px;
		fill: var(--text-muted);
		dominant-baseline: middle;
	}

	.hg-tip {
		position: absolute;
		z-index: 10;
		pointer-events: none;
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		padding: 8px 10px;
		font-family: var(--sans);
		font-size: 0.82rem;
		color: var(--text-primary);
		min-width: 220px;
	}

	.tip-head {
		margin-bottom: 4px;
	}

	.tip-row {
		display: flex;
		justify-content: space-between;
		gap: 16px;
	}

	.tip-key {
		color: var(--text-muted);
	}

	.tip-val {
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
	}
</style>
