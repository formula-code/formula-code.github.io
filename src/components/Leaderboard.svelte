<script>
    import { agentAdvantageByAgentAndLevel, overallAgentAdvantage, uniqueAgents, uniqueLevels } from "$stores/misc.js";
    import { formatAgentDisplayName } from "$utils/benchmarkData.js";

    // Level display labels
    const LEVEL_DISPLAY_LABELS = {
        "no-aggregation": "L0: No Aggregation",
        "param-level": "L1: Parameter",
        "func-level": "L2: Function",
        "class-level": "L3: Class",
        "module-level": "L4: Module",
    };

    // Sort levels in logical order
    const levelOrder = ["no-aggregation", "param-level", "func-level", "class-level", "module-level"];

    $: agents = $uniqueAgents;
    $: levels = $uniqueLevels.sort((a, b) => {
        const aIndex = levelOrder.indexOf(a);
        const bIndex = levelOrder.indexOf(b);
        return aIndex - bIndex;
    });

    // Build table data
    $: tableData = agents.map(agent => {
        const row = {
            agent,
            displayName: formatAgentDisplayName(agent),
            levels: {},
            overall: $overallAgentAdvantage[agent] !== undefined ? $overallAgentAdvantage[agent] : null
        };

        levels.forEach(level => {
            const advantage = $agentAdvantageByAgentAndLevel[agent]?.[level];
            row.levels[level] = advantage !== undefined ? advantage : null;
        });

        return row;
    }).sort((a, b) => {
        // Sort by overall advantage (descending)
        if (a.overall === null) return 1;
        if (b.overall === null) return -1;
        return b.overall - a.overall;
    });

    // Helper to format advantage value
    function formatAdvantage(value) {
        if (value === null || value === undefined) return "—";
        return value.toFixed(4);
    }

    // Helper to get cell class based on value
    function getCellClass(value) {
        if (value === null || value === undefined) return "";
        if (value >= 0.1) return "high";
        if (value >= 0) return "medium";
        return "low";
    }
</script>

<section id="leaderboard">
    <div class="leaderboard-container">
        <h2>Leaderboard</h2>
        <p class="description">This leaderboard displays the agent advantage scores by aggregation level. Higher scores indicate better performance relative to the oracle.</p>
        <center>
            <p class="instructions">Use the thresholding filters above and see how they change the leaderboard.</p>
        </center>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th class="agent-col">Agent</th>
                        {#each levels as level}
                            <th class="level-col">{LEVEL_DISPLAY_LABELS[level] || level}</th>
                        {/each}
                        <th class="overall-col">Overall</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tableData as row}
                        <tr>
                            <td class="agent-name">{row.displayName}</td>
                            {#each levels as level}
                                <td class="score-cell {getCellClass(row.levels[level])}">
                                    {formatAdvantage(row.levels[level])}
                                </td>
                            {/each}
                            <td class="score-cell overall-cell {getCellClass(row.overall)}">
                                {formatAdvantage(row.overall)}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</section>

<style>
    #leaderboard {
        width: 100%;
        padding: 4rem 0;
        background: var(--wine-black);
    }

    .leaderboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    h2 {
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

    table {
        width: 100%;
        border-collapse: collapse;
        background: rgba(24, 26, 31, 0.5);
    }

    thead {
        background: var(--wine-dark-gray);
    }

    th {
        padding: 1rem;
        text-align: left;
        font-family: var(--sans);
        font-size: var(--14px);
        font-weight: 700;
        color: var(--wine-tan);
        text-transform: uppercase;
        border-bottom: 2px solid var(--wine-dark-gray);
    }

    .level-col,
    .overall-col {
        text-align: center;
    }

    tbody tr {
        border-bottom: 1px solid var(--wine-dark-gray);
        transition: background var(--250ms);
    }

    tbody tr:hover {
        background: rgba(207, 202, 191, 0.05);
    }

    td {
        padding: 1rem;
        color: var(--wine-tan);
        font-size: var(--16px);
    }

    .agent-name {
        font-family: var(--sans);
        font-weight: 600;
        color: var(--wine-tan);
    }

    .score-cell {
        text-align: center;
        font-family: var(--mono);
        font-size: var(--14px);
    }

    .overall-cell {
        font-weight: 700;
        font-size: var(--16px);
        background: rgba(207, 202, 191, 0.05);
    }

    /* Color coding for scores */
    .score-cell.high {
        color: #0f9d58;
    }

    .score-cell.medium {
        color: #d8d8d8;
    }

    .score-cell.low {
        color: #e84545;
    }

    @media (max-width: 900px) {
        #leaderboard {
            padding: 3rem 0;
        }

        .leaderboard-container {
            padding: 0 1rem;
        }

        h2 {
            font-size: var(--28px);
        }

        .description {
            font-size: var(--14px);
        }

        th, td {
            padding: 0.75rem 0.5rem;
            font-size: var(--12px);
        }

        .agent-name {
            font-size: var(--14px);
        }

        .score-cell {
            font-size: var(--12px);
        }

        .overall-cell {
            font-size: var(--14px);
        }
    }

    @media (max-width: 700px) {
        th, td {
            padding: 0.5rem 0.25rem;
            font-size: var(--11px);
        }

        h2 {
            font-size: var(--24px);
        }

        .agent-name {
            font-size: var(--12px);
        }
    }

    @media (max-width: 480px) {
        h2 {
            font-size: var(--20px);
        }

        .description {
            font-size: var(--13px);
        }

        th, td {
            padding: 0.4rem 0.2rem;
            font-size: var(--10px);
        }

        .agent-name {
            font-size: var(--11px);
        }

        .score-cell {
            font-size: var(--10px);
        }

        .overall-cell {
            font-size: var(--12px);
        }
    }
</style>
