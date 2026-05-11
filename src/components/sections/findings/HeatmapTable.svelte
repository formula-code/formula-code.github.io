<script>
	import { interpolateRdBu, interpolateBlues } from "d3-scale-chromatic";
	import { scaleLinear } from "d3-scale";

	/**
	 * Generic D3-tinted heatmap table.
	 *
	 * Props:
	 *   columns: [{ key, label, numeric?, color?, decimals?, prefix?, suffix?, format? }, ...]
	 *     - color: "diverging" (signed, RdBu centered at 0) | "sequential" (Blues) | undefined (no color)
	 *   rows: array of row objects keyed by column.key
	 *   caption: optional aria caption
	 *   absMax: optional override for the diverging scale half-range; otherwise derived from data
	 *   sequentialDomain: optional [min, max] override for sequential cells
	 *   stickyFirstColumn: boolean — pins the first column on horizontal scroll
	 *   rowLabelCols: number of left columns that are row labels (not heatmapped). Defaults to 1.
	 */
	export let columns = [];
	export let rows = [];
	export let caption = "";
	export let absMax = null;
	export let sequentialDomain = null;
	export let stickyFirstColumn = true;
	export let rowLabelCols = 1;

	$: divergingCols = columns.filter((c) => c.color === "diverging");
	$: sequentialCols = columns.filter((c) => c.color === "sequential");

	$: derivedAbsMax = (() => {
		if (typeof absMax === "number" && absMax > 0) return absMax;
		let m = 0;
		for (const c of divergingCols) {
			for (const r of rows) {
				const v = r[c.key];
				if (typeof v === "number" && Number.isFinite(v)) {
					m = Math.max(m, Math.abs(v));
				}
			}
		}
		// Keep a sensible minimum so a near-flat table still has some contrast.
		return m > 0 ? m : 0.05;
	})();

	$: derivedSeqDomain = (() => {
		if (Array.isArray(sequentialDomain) && sequentialDomain.length === 2) {
			return sequentialDomain;
		}
		let lo = Infinity;
		let hi = -Infinity;
		for (const c of sequentialCols) {
			for (const r of rows) {
				const v = r[c.key];
				if (typeof v === "number" && Number.isFinite(v)) {
					lo = Math.min(lo, v);
					hi = Math.max(hi, v);
				}
			}
		}
		if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
		if (lo === hi) return [lo - 0.5, hi + 0.5];
		return [lo, hi];
	})();

	$: divScale = scaleLinear()
		.domain([-derivedAbsMax, 0, derivedAbsMax])
		.range([0, 0.5, 1])
		.clamp(true);

	$: seqScale = scaleLinear()
		.domain(derivedSeqDomain)
		.range([0, 1])
		.clamp(true);

	function colorFor(col, value) {
		if (value === null || value === undefined || !Number.isFinite(value)) {
			return null;
		}
		if (col.color === "diverging") {
			// d3's RdBu is reversed for our convention (red = bad/negative,
			// blue = good/positive), so invert the scale before lookup.
			return interpolateRdBu(1 - divScale(value));
		}
		if (col.color === "sequential") {
			return interpolateBlues(seqScale(value));
		}
		return null;
	}

	function textColorFor(bg) {
		if (!bg) return null;
		// Parse "rgb(r, g, b)" — d3 interpolators return RGB strings.
		const m = bg.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
		if (!m) return null;
		const r = Number(m[1]);
		const g = Number(m[2]);
		const b = Number(m[3]);
		// Relative luminance per WCAG.
		const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return lum < 0.55 ? "#ffffff" : "#0f172a";
	}

	function fmt(col, value) {
		if (value === null || value === undefined) return "—";
		if (typeof value !== "number" || !Number.isFinite(value)) return String(value);
		if (col.format) return col.format(value);
		const d = col.decimals !== undefined ? col.decimals : 3;
		const signed = col.signed ? (value >= 0 ? "+" : "") : "";
		const body = d === 0 ? Math.round(value).toString() : value.toFixed(d);
		return `${col.prefix || ""}${signed}${body}${col.suffix || ""}`;
	}
</script>

<div class="hm-wrap">
	<table class="hm-table" class:sticky-first={stickyFirstColumn}>
		{#if caption}
			<caption class="hm-caption">{caption}</caption>
		{/if}
		<thead>
			<tr>
				{#each columns as col, i}
					<th class:numeric={col.numeric} class:label-col={i < rowLabelCols}>
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row, ri (row._key || ri)}
				<tr>
					{#each columns as col, ci}
						{@const value = row[col.key]}
						{@const isLabel = ci < rowLabelCols}
						{@const bg = isLabel ? null : colorFor(col, value)}
						{@const fg = bg ? textColorFor(bg) : null}
						<td
							class:numeric={col.numeric}
							class:label-col={isLabel}
							class:has-color={!!bg}
							class:missing={!isLabel && (value === null || value === undefined)}
							style={bg
								? `background:${bg};color:${fg};`
								: ""}
							title={isLabel ? "" : `${col.label}: ${fmt(col, value)}`}
						>
							{#if isLabel}
								<slot name="label-cell" {row} {col} {value}>
									{fmt(col, value)}
								</slot>
							{:else}
								{fmt(col, value)}
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.hm-wrap {
		overflow-x: auto;
		border-radius: var(--radius);
		border: 1px solid var(--border-primary);
		background: var(--bg-primary);
	}

	.hm-table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		font-family: var(--sans);
	}

	.hm-caption {
		text-align: left;
		padding: 12px 14px;
		font-family: var(--sans);
		font-size: 0.85rem;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border-primary);
	}

	thead th {
		position: sticky;
		top: 0;
		z-index: 2;
		padding: 10px 12px;
		font-size: 0.74rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		background: var(--bg-tertiary);
		border-bottom: 1px solid var(--border-secondary);
		white-space: nowrap;
		text-align: left;
	}

	thead th.numeric {
		text-align: right;
	}

	tbody td {
		padding: 8px 12px;
		font-size: 0.86rem;
		color: var(--text-primary);
		border-bottom: 1px solid var(--border-primary);
		font-variant-numeric: tabular-nums;
		transition: filter 120ms;
	}

	tbody td.numeric {
		text-align: right;
		font-family: var(--mono);
	}

	tbody td.label-col {
		font-family: var(--sans);
		font-weight: 500;
		color: var(--text-primary);
		background: var(--bg-primary);
	}

	tbody td.missing {
		color: var(--text-muted);
		font-style: italic;
	}

	.sticky-first td.label-col,
	.sticky-first th.label-col {
		position: sticky;
		left: 0;
		z-index: 1;
		background: var(--bg-primary);
		box-shadow: 1px 0 0 var(--border-primary);
	}

	.sticky-first th.label-col {
		background: var(--bg-tertiary);
		z-index: 3;
	}

	tbody tr:hover td:not(.has-color) {
		background: var(--bg-tertiary);
	}

	tbody tr:hover td.has-color {
		filter: brightness(1.05);
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	tbody td.has-color {
		font-weight: 600;
	}
</style>
