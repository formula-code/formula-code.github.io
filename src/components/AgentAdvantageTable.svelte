<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { bigScatterData } from "$stores/misc.js";
    import { LEVEL_DISPLAY_LABELS, LEVEL_ORDER, CELL_NEUTRAL_RANGE } from "$utils/constants.js";

    // Lazy-load grid only in browser to avoid SSR 'document' errors
    let GridComponent = null;
    onMount(async () => {
        if (browser) {
            const mod = await import("wx-svelte-grid");
            GridComponent = mod.Grid;
        }
    });

    // Use centralized level labels and order
    const levelLabels = LEVEL_DISPLAY_LABELS;
    const levelOrder = LEVEL_ORDER;

    // Helper to calculate median
    function calculateMedian(values) {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // Format agent name for display (remove "terminus-2," prefix)
    function formatAgentName(agentId) {
        if (!agentId) return '';
        const parts = agentId.split(',');
        return parts.length > 1 ? parts[1].trim() : agentId;
    }

    // Get cell class based on value
    function getCellClass(value) {
        if (value === undefined || value === null) {
            return 'cell-neutral';
        }
        const numValue = parseFloat(value);
        if (numValue >= CELL_NEUTRAL_RANGE.MIN && numValue <= CELL_NEUTRAL_RANGE.MAX) {
            return 'cell-neutral';
        }
        if (numValue < 1.00) {
            return 'cell-negative';
        }
        return 'cell-positive';
    }

    // Format value for display
    function formatValue(value) {
        if (value === undefined || value === null) return 'N/A';
        return parseFloat(value).toFixed(2);
    }

    // Column definitions for wx-svelte-grid
    const columns = [
        {
            id: "agent",
            header: "Agent",
            width: 150,
            sort: true,
            filter: true,
        },
        ...levelOrder.map(level => ({
            id: level,
            header: levelLabels[level],
            width: 180,
            sort: true,
            filter: true,
            template: (obj) => {
                const value = obj[level];
                const cssClass = getCellClass(value);
                return `<span class="${cssClass}">${formatValue(value)}</span>`;
            }
        }))
    ];

    // Calculate row data
    function calculateRowData(data) {
        const result = {};

        data.forEach(d => {
            const agent = d.agent_id;
            const level = d.level;
            const agentSpeedup = d['agent/nop'];

            if (!agent || !level || agentSpeedup === undefined) return;

            if (!result[agent]) result[agent] = {};
            if (!result[agent][level]) result[agent][level] = [];

            result[agent][level].push(agentSpeedup);
        });

        // Calculate medians and create rows
        const rows = Object.keys(result).map((agent, index) => {
            const row = {
                id: index + 1,
                agent: formatAgentName(agent)
            };
            levelOrder.forEach(level => {
                const values = result[agent][level] || [];
                row[level] = values.length > 0 ? calculateMedian(values) : null;
            });
            return row;
        });

        // Sort by param-level descending
        rows.sort((a, b) => {
            const aVal = a[levelOrder[0]] ?? 0;
            const bVal = b[levelOrder[0]] ?? 0;
            return bVal - aVal;
        });

        return rows;
    }

    // Reactive data calculation
    $: data = calculateRowData($bigScatterData);
</script>

<div class="advantage-table-wrapper">
    <h4>Agent Advantage by Level</h4>
    {#if GridComponent}
        <svelte:component this={GridComponent} {columns} {data} />
    {:else}
        <div class="grid-fallback">Loading table…</div>
    {/if}
</div>

<style>
    .advantage-table-wrapper {
        width: 100%;
        margin: 1rem 0;
    }

    h4 {
        font-size: var(--20px);
        font-weight: 700;
        margin: 0 0 1rem 0;
        color: var(--wine-tan);
    }

    /* wx-svelte-grid custom theme */
    .advantage-table-wrapper :global(.wx-grid) {
        --wx-background: var(--wine-black);
        --wx-color: var(--wine-tan);
        --wx-border: #3a3d45;
        --wx-font-family: var(--sans);
        font-size: 16px;
    }

    .advantage-table-wrapper :global(.wx-header) {
        background: #2a2d35;
        color: var(--wine-tan);
        font-weight: 700;
    }

    .advantage-table-wrapper :global(.wx-row:nth-child(odd)) {
        background: #1e2028;
    }

    .advantage-table-wrapper :global(.wx-row:hover) {
        background: rgba(207, 202, 191, 0.1);
    }

    /* Cell styling based on value */
    .advantage-table-wrapper :global(.cell-neutral) {
        background-color: var(--wine-tan-transparent);
        color: var(--wine-tan);
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        display: inline-block;
    }

    .advantage-table-wrapper :global(.cell-negative) {
        background-color: rgba(232, 69, 69, 0.15);
        color: var(--score-bad);
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        display: inline-block;
    }

    .advantage-table-wrapper :global(.cell-positive) {
        background-color: rgba(15, 157, 88, 0.15);
        color: var(--score-good);
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        display: inline-block;
    }

    .advantage-table-wrapper :global([data-col-id="agent"]) {
        font-weight: bold;
        text-transform: capitalize;
    }

    .grid-fallback {
        color: var(--wine-tan);
        opacity: 0.7;
        padding: 0.5rem 0;
    }

    @media (max-width: 900px) {
        h4 {
            font-size: var(--18px);
        }

        .advantage-table-wrapper :global(.wx-grid) {
            font-size: 14px;
            overflow-x: auto;
        }

        /* Make table horizontally scrollable */
        .advantage-table-wrapper :global(.wx-grid-container) {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
    }

    @media (max-width: 700px) {
        h4 {
            font-size: var(--16px);
        }

        .advantage-table-wrapper :global(.wx-grid) {
            font-size: 12px;
        }

        /* Reduce column widths for mobile */
        .advantage-table-wrapper :global([data-col-id="agent"]) {
            min-width: 100px;
            font-size: 12px;
        }

        .advantage-table-wrapper :global(.wx-cell) {
            padding: 0.5rem 0.25rem;
        }

        .advantage-table-wrapper :global(.wx-header-cell) {
            padding: 0.75rem 0.25rem;
            font-size: 11px;
        }
    }
</style>
