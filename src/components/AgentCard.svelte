<script>
    import ScrollHisto from "$components/ScrollHisto.svelte";
    import Scatter from "$components/Scatter.svelte";
    import { navAgent, agentStats, overallAgentAdvantage, thresholdAgentNum, thresholdOracleNum } from "$stores/misc.js";
    import inView from "$actions/inView.js";
    import { format } from "d3-format";
    import { formatAgentDisplayName } from "$utils/benchmarkData.js";

    export let agent;

    const formatter = format(",");

    let strippedAgent = agent.replace(/[^a-zA-Z0-9]/g, "");
    let railW;

    // Get pretty display name
    $: displayName = formatAgentDisplayName(agent);

    // Calculate agent statistics
    $: stats = $agentStats[agent];
    $: agentAdvantageValue = $overallAgentAdvantage?.[agent] ?? 0;
    $: summaryBullets = stats ? [
        `Median agent speedup: ${(stats.medianAgentNop || 0).toFixed(2)}× (target ${$thresholdAgentNum.toFixed(2)}×)`,
        `Median oracle speedup: ${(stats.medianOracleNop || 0).toFixed(2)}× (target ${$thresholdOracleNum.toFixed(2)}×)`,
        `Benchmarks analyzed: ${formatter(stats.count || 0)}`,
        `Agent advantage score: ${agentAdvantageValue.toFixed(2)}`
    ] : [];

    function handleView(viewState, agent) {
        if (viewState == "enter") {
            navAgent.set(agent);
        } else {
            navAgent.set(undefined);
        }
    }
</script>

<div class="agent-card"
    id="agent-card-{strippedAgent}"
    use:inView={{ bottom: 40 }}
    on:enter={() => handleView("enter", agent)}
    on:exit={() =>  handleView("exit", agent)}
>
    <div class="rail" id="rail-left">
        <div class="deets">
            <div class="topline-wrapper">
                <div class="icon-name-wrapper">
                    <h4>{displayName}</h4>
                </div>
                {#if stats}
                    <div class="metrics-wrapper">
                        <div class="metric">
                            <p>Median Agent Speedup</p>
                            <p>{(stats.medianAgentNop || 0).toFixed(2)}x</p>
                        </div>
                        <div class="metric">
                            <p>Total Benchmarks</p>
                            <p>{formatter(stats.count || 0)}</p>
                        </div>
                        <div class="metric">
                            <p>Median Oracle Speedup</p>
                            <p>{(stats.medianOracleNop || 0).toFixed(2)}x</p>
                        </div>
                        <div class="metric">
                            <p>Agent Advantage</p>
                            <p>{agentAdvantageValue.toFixed(2)}</p>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
    <div class="rail" id="rail-right" bind:clientWidth={railW}>
        <Scatter agent={agent} />
        <ScrollHisto agent={agent} width={railW}/>
    </div>
</div>

<style>
    .agent-card {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        border: 1px solid var(--wine-dark-gray);
        border-radius: 3px;
        padding: 2rem;
        display: flex;
        flex-direction: row;
        gap: 1rem;
        color: var(--wine-tan);
        box-shadow: -4px 4px 10px rgb(17, 17, 17, 0.5);
    }

    #rail-left {
        width: 35%;
        display: flex;
        flex-direction: row;
    }

    #rail-right {
        width: 65%;
    }

    .deets {
        width: 100%;
        padding-right: 2rem;
    }

    .deets p {
        font-size: var(--18px);
        line-height: 1.65;
    }

    :global(.agent-card .deets a) {
        color: var(--wine-tan);
    }

    :global(.agent-card .deets a:hover) {
        color: var(--wine-red);
    }

    .topline-wrapper {
        display: flex;
        flex-direction: column;
    }

    .icon-name-wrapper {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    .metrics-wrapper {
        margin: 0;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0;
        justify-content: space-between;
    }

    .metric {
        width: 50%;
        font-family: var(--sans);
    }

    .metric p {
        margin: 0;
        padding: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .metric p:first-of-type {
        text-transform: uppercase;
        margin: 0;
        color: var(--wine-dark-tan);
        font-size: var(--14px);
    }

    .metric p:nth-of-type(2) {
        font-size: var(--32px);
        margin: 0;
    }

    .card-summary {
        margin-top: 1.5rem;
        font-size: var(--16px);
    }

    .card-summary .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.125rem 0.75rem;
        border-radius: 999px;
        font-family: var(--sans);
        font-weight: 700;
        font-size: var(--12px);
        border: 1px solid var(--wine-dark-gray);
        text-transform: uppercase;
        margin-bottom: 0.5rem;
    }

    .card-summary .badge.good { color: #0f9d58; border-color: #0f9d58; }
    .card-summary .badge.mixed { color: #f7b956; border-color: #f7b956; }
    .card-summary .badge.bad { color: #e84545; border-color: #e84545; }

    .card-summary ul {
        list-style: disc;
        margin: 0.5rem 0 0 1.5rem;
        padding: 0;
        color: var(--wine-tan);
    }

    .card-summary li {
        margin-bottom: 0.25rem;
    }

    h4 {
        color: var(--wine-tan);
        font-size: var(--36px);
        font-weight: 700;
        margin: 1rem 0;
    }

    @media (max-width: 900px) {
        .agent-card {
            flex-direction: column;
        }

        #rail-left, #rail-right {
            width: 100%;
        }

        .deets {
            padding: 0;
        }

        .topline-wrapper {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .icon-name-wrapper {
            display: flex;
            flex-direction: row;
            width: 100%;
            gap: 1rem;
            align-items: center;
        }

        .metric {
            width: 25%;
        }
    }

    @media (max-width: 700px) {
        .agent-card {
            padding: 1rem;
        }

        h4 {
           font-size: var(--20px);
           margin: 0;
        }

        .metric {
            width:50%;
        }

        .metric p:first-of-type {
            font-size: var(--12px);
        }

        .metric p:nth-of-type(2) {
            font-size: var(--24px);
        }

        .deets p {
            font-size: var(--16px);
        }
    }
</style>
