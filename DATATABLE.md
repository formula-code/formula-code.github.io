# DataTable Migration Plan

## Overview

Migrate the PaperHeader leaderboard from a basic HTML table to a shadcn-svelte DataTable component using svelte-headless-table (Svelte 4 compatible). This will provide better mobile responsiveness, sorting, filtering, and a more professional appearance.

## Phase 1: Installation & Setup

### 1.1 Install Dependencies

```bash
npx shadcn-svelte@latest add table
npm install svelte-headless-table
```

### 1.2 Create Data File

Create `src/data/results.json` with structure:

```json
{
	"leaderboard": [
		{
			"id": "1",
			"agent": "terminus-2,gpt-5",
			"displayName": "GPT-5",
			"levels": {
				"param-level": 0.15,
				"func-level": 0.12,
				"class-level": 0.08,
				"module-level": 0.05
			},
			"overall": 0.1
		},
		{
			"id": "2",
			"agent": "terminus-2,claude",
			"displayName": "Claude Sonnet 4.0",
			"levels": {
				"param-level": 0.13,
				"func-level": 0.1,
				"class-level": 0.06,
				"module-level": 0.03
			},
			"overall": 0.08
		},
		{
			"id": "3",
			"agent": "terminus-2,oracle",
			"displayName": "Expert Human (Human)",
			"levels": {
				"param-level": 0.25,
				"func-level": 0.22,
				"class-level": 0.18,
				"module-level": 0.15
			},
			"overall": 0.2
		}
	],
	"colorThresholds": {
		"high": 0.1,
		"medium": 0
	}
}
```

## Phase 2: Create Component Structure

### 2.1 Component Files

Create in `src/components/api-leaderboard/`:

- `APILeaderboard.svelte` - Main component
- `api-leaderboard-columns.ts` - Column definitions
- `api-leaderboard.css` - Custom styling

### 2.2 Column Definitions (`api-leaderboard-columns.ts`)

```typescript
import { createRender } from "svelte-headless-table";
import type { Payment } from "./types";

// Helper functions
function formatAdvantage(value: number | null | undefined): string {
	if (value === null || value === undefined) return "—";
	return value.toFixed(4);
}

function getCellClass(value: number | null | undefined): string {
	if (value === null || value === undefined) return "";
	if (value >= 0.1) return "high";
	if (value >= 0) return "medium";
	return "low";
}

// Column definitions using svelte-headless-table
export const columns = table.createColumns([
	table.column({
		accessor: "displayName",
		header: "Agent",
		plugins: {
			sort: { disable: false },
			filter: { exclude: false }
		}
	}),
	table.column({
		accessor: (row) => row.levels["param-level"],
		header: "L1: Parameter",
		cell: ({ value }) => {
			const formatted = formatAdvantage(value);
			const colorClass = getCellClass(value);
			return `<span class="score-cell ${colorClass}">${formatted}</span>`;
		},
		plugins: {
			sort: { disable: false }
		}
	}),
	table.column({
		accessor: (row) => row.levels["func-level"],
		header: "L2: Function",
		cell: ({ value }) => {
			const formatted = formatAdvantage(value);
			const colorClass = getCellClass(value);
			return `<span class="score-cell ${colorClass}">${formatted}</span>`;
		}
	}),
	table.column({
		accessor: (row) => row.levels["class-level"],
		header: "L3: Class",
		cell: ({ value }) => {
			const formatted = formatAdvantage(value);
			const colorClass = getCellClass(value);
			return `<span class="score-cell ${colorClass}">${formatted}</span>`;
		}
	}),
	table.column({
		accessor: (row) => row.levels["module-level"],
		header: "L4: Module",
		cell: ({ value }) => {
			const formatted = formatAdvantage(value);
			const colorClass = getCellClass(value);
			return `<span class="score-cell ${colorClass}">${formatted}</span>`;
		}
	}),
	table.column({
		accessor: "overall",
		header: "Overall",
		cell: ({ value }) => {
			const formatted = formatAdvantage(value);
			const colorClass = getCellClass(value);
			return `<span class="score-cell overall-cell ${colorClass}">${formatted}</span>`;
		}
	})
]);
```

### 2.3 Main Component (`APILeaderboard.svelte`)

```svelte
<script lang="ts">
  import { readable } from "svelte/store";
  import { createTable, Render, Subscribe } from "svelte-headless-table";
  import {
    addPagination,
    addSortBy,
    addTableFilter,
    addHiddenColumns
  } from "svelte-headless-table/plugins";
  import * as Table from "$lib/components/ui/table";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import leaderboardData from "$data/results.json";

  // Initialize table with data
  const table = createTable(readable(leaderboardData.leaderboard), {
    page: addPagination({ initialPageSize: 10 }),
    sort: addSortBy({ initialSortKeys: [{ id: "overall", order: "desc" }] }),
    filter: addTableFilter({
      fn: ({ filterValue, value }) => value.toLowerCase().includes(filterValue.toLowerCase())
    }),
    hide: addHiddenColumns()
  });

  // Create columns (import from columns.ts)
  const columns = table.createColumns([/* column definitions */]);

  // Setup table
  const { headerRows, pageRows, tableAttrs, tableBodyAttrs, pluginStates } =
    table.createViewModel(columns);

  const { hasNextPage, hasPreviousPage, pageIndex } = pluginStates.page;
  const { filterValue } = pluginStates.filter;
</script>

<div class="api-leaderboard">
  <div class="leaderboard-header">
    <h3>Leaderboard Snapshot</h3>
    <p class="description">
      This leaderboard displays the agent advantage scores by aggregation level.
      Higher scores indicate better performance relative to the oracle.
    </p>
  </div>

  <!-- Filter input -->
  <div class="table-controls">
    <Input
      class="max-w-sm"
      placeholder="Filter agents..."
      type="text"
      bind:value={$filterValue}
    />
  </div>

  <!-- Table -->
  <div class="table-wrapper">
    <Table.Root {...$tableAttrs}>
      <Table.Header>
        {#each $headerRows as headerRow}
          <Subscribe rowAttrs={headerRow.attrs()}>
            <Table.Row>
              {#each headerRow.cells as cell (cell.id)}
                <Subscribe attrs={cell.attrs()} let:attrs props={cell.props()}>
                  <Table.Head {...attrs} class={cell.id === 'displayName' ? 'agent-col' : 'level-col'}>
                    <Render of={cell.render()} />
                  </Table.Head>
                </Subscribe>
              {/each}
            </Table.Row>
          </Subscribe>
        {/each}
      </Table.Header>
      <Table.Body {...$tableBodyAttrs}>
        {#each $pageRows as row (row.id)}
          <Subscribe rowAttrs={row.attrs()} let:rowAttrs>
            <Table.Row {...rowAttrs}>
              {#each row.cells as cell (cell.id)}
                <Subscribe attrs={cell.attrs()} let:attrs>
                  <Table.Cell {...attrs}>
                    <Render of={cell.render()} />
                  </Table.Cell>
                </Subscribe>
              {/each}
            </Table.Row>
          </Subscribe>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  <!-- Pagination -->
  <div class="table-pagination">
    <Button
      variant="outline"
      size="sm"
      on:click={() => ($pageIndex = $pageIndex - 1)}
      disabled={!$hasPreviousPage}
    >
      Previous
    </Button>
    <Button
      variant="outline"
      size="sm"
      on:click={() => ($pageIndex = $pageIndex + 1)}
      disabled={!$hasNextPage}
    >
      Next
    </Button>
  </div>
</div>

<style>
  /* Import or inline custom styles matching current leaderboard */
</style>
```

## Phase 3: Custom Styling

### 3.1 Create `api-leaderboard.css`

Match existing Leaderboard.svelte styles:

```css
.api-leaderboard {
	width: 100%;
	padding: 4rem 0;
	background: var(--wine-black);
}

.leaderboard-header h3 {
	color: var(--wine-tan);
	font-size: var(--36px);
	font-weight: 700;
	margin: 0 0 1rem 0;
	text-align: center;
}

.description {
	color: var(--wine-dark-tan);
	font-size: var(--16px);
	text-align: center;
	margin: 0 0 2rem 0;
	max-width: 700px;
	margin-left: auto;
	margin-right: auto;
}

.table-wrapper {
	overflow-x: auto;
	border-radius: 3px;
	border: 1px solid var(--wine-dark-gray);
}

/* Score cell color coding */
:global(.score-cell.high) {
	color: #0f9d58;
}

:global(.score-cell.medium) {
	color: #d8d8d8;
}

:global(.score-cell.low) {
	color: #e84545;
}

:global(.overall-cell) {
	font-weight: 700;
	font-size: var(--16px);
	background: rgba(207, 202, 191, 0.05);
}

/* Responsive breakpoints */
@media (max-width: 900px) {
	.leaderboard-header h3 {
		font-size: var(--28px);
	}
}

@media (max-width: 700px) {
	.leaderboard-header h3 {
		font-size: var(--24px);
	}
}

@media (max-width: 480px) {
	.leaderboard-header h3 {
		font-size: var(--20px);
	}
}
```

## Phase 4: Integration

### 4.1 Update PaperHeader.svelte

Replace the hardcoded table section with:

```svelte
<script>
  import APILeaderboard from "$components/api-leaderboard/APILeaderboard.svelte";
</script>

<!-- Replace existing leaderboard section -->
<APILeaderboard />
```

### 4.2 Remove Old Code

- Remove hardcoded `tableData`, `levels`, `LEVEL_DISPLAY_LABELS` from PaperHeader.svelte
- Remove old table HTML structure (lines 188-223)
- Remove old table CSS (lines 382-487)
- Keep the helper functions if reusable elsewhere

## Phase 5: Enhanced Features (Optional)

### 5.1 Add Column Visibility Toggle

```svelte
<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button variant="outline" builders={[builder]}>
      Columns <ChevronDown class="ml-2 h-4 w-4" />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    {#each flatColumns as col}
      <DropdownMenu.CheckboxItem bind:checked={hideForId[col.id]}>
        {col.header}
      </DropdownMenu.CheckboxItem>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

### 5.2 Add Export to CSV

```typescript
function exportToCSV() {
  const csv = /* generate CSV from tableData */;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leaderboard.csv';
  a.click();
}
```

## Success Criteria

✅ Table displays with same visual appearance as current leaderboard
✅ Color coding (red/white/green) works correctly
✅ Sorting by any column works
✅ Filtering by agent name works
✅ Mobile responsive at all breakpoints (900px, 700px, 480px)
✅ Pagination controls work
✅ Data loads from `src/data/results.json`
✅ Component is reusable and importable

## Files to Create

1. `src/data/results.json` - Leaderboard data
2. `src/components/api-leaderboard/APILeaderboard.svelte` - Main component
3. `src/components/api-leaderboard/api-leaderboard-columns.ts` - Column definitions
4. `src/components/api-leaderboard/api-leaderboard.css` - Custom styles
5. `DATATABLE.md` - This implementation plan

## Files to Modify

1. `src/components/PaperHeader.svelte` - Replace table with APILeaderboard component
2. `package.json` - Add svelte-headless-table dependency

## Notes

- Uses **svelte-headless-table** (Svelte 4 compatible) instead of TanStack Table
- Maintains exact color scheme: green (#0f9d58), gray (#d8d8d8), red (#e84545)
- Preserves 4 decimal place formatting
- Keeps monospace font for score values
- Sortable by default on "Overall" column (descending)
