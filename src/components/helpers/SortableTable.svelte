<script>
	export let columns = [];
	export let rows = [];
	export let initialSortKey = null;
	export let initialSortOrder = "asc";

	let sortKey = initialSortKey;
	let sortOrder = initialSortOrder;

	function handleSort(key) {
		if (sortKey === key) {
			sortOrder = sortOrder === "asc" ? "desc" : "asc";
		} else {
			sortKey = key;
			sortOrder = "asc";
		}
	}

	$: sortedRows = (() => {
		if (!sortKey) return rows;
		const copy = [...rows];
		const col = columns.find((c) => c.key === sortKey);
		copy.sort((a, b) => {
			const av = a[sortKey];
			const bv = b[sortKey];
			if (col && col.numeric) {
				return sortOrder === "asc" ? av - bv : bv - av;
			}
			const as = String(av);
			const bs = String(bv);
			return sortOrder === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
		});
		return copy;
	})();

	function formatValue(col, value) {
		if (value === null || value === undefined) return "—";
		if (col.format) return col.format(value);
		if (col.numeric && typeof value === "number") {
			const d = col.decimals !== undefined ? col.decimals : 4;
			const formatted =
				d === 0 ? Math.round(value).toString() : value.toFixed(d);
			const prefix = col.prefix || "";
			const suffix = col.suffix || "";
			return prefix + formatted + suffix;
		}
		return value;
	}

	function getCellColorClass(col, value) {
		if (!col.colorCode || value === null || value === undefined) return "";
		const threshold = col.colorThreshold !== undefined ? col.colorThreshold : 0;
		return value >= threshold ? "positive" : "negative";
	}
</script>

<div class="table-wrapper">
	<table>
		<thead>
			<tr>
				{#each columns as col}
					<th
						class:numeric={col.numeric}
						class:sorted={sortKey === col.key}
						on:click={() => handleSort(col.key)}
					>
						<span class="th-content">
							{col.label}
							{#if sortKey === col.key}
								<span class="sort-arrow">
									{sortOrder === "asc" ? "▲" : "▼"}
								</span>
							{:else}
								<span class="sort-arrow muted">⇅</span>
							{/if}
						</span>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sortedRows as row}
				<tr>
					{#each columns as col}
						<td
							class:numeric={col.numeric}
							class={getCellColorClass(col, row[col.key])}
						>
							{formatValue(col, row[col.key])}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrapper {
		overflow-x: auto;
		border-radius: 8px;
		border: 1px solid var(--border-secondary);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: var(--bg-secondary);
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid var(--border-secondary);
		font-family: var(--sans);
		color: var(--text-primary);
	}

	th {
		background: var(--bg-tertiary);
		font-weight: 700;
		font-size: 0.9rem;
		text-transform: uppercase;
		white-space: nowrap;
		cursor: pointer;
		user-select: none;
		transition: background 0.15s;
	}

	th:hover {
		background: var(--bg-secondary);
	}

	th.sorted {
		background: var(--bg-secondary);
		color: var(--accent-secondary);
	}

	th.numeric,
	td.numeric {
		text-align: right;
		font-family: var(--mono);
	}

	td {
		font-size: 1rem;
	}

	tr:hover td {
		background: var(--bg-tertiary);
	}

	.th-content {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.sort-arrow {
		font-size: 0.7rem;
		line-height: 1;
	}

	.sort-arrow.muted {
		opacity: 0.3;
	}

	/* Color coding */
	td.positive {
		color: var(--score-good);
	}

	td.negative {
		color: var(--score-bad);
	}
</style>
