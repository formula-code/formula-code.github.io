<script>
    import { getContext } from "svelte";
    import { LayerCake, Svg } from 'layercake';
    import Column from "$components/layercake/Column.svelte";
    import AxisY from "$components/layercake/AxisY.svg.svelte";
    import { bin } from 'd3-array';
    import { scaleBand } from 'd3-scale';
    import { bigScatterData } from "$stores/misc.js";

    const copy = getContext("copy");

    export let width;
    export let agent;

    // Filter data for current agent
    $: agentData = $bigScatterData.filter(d => d.agent_id === agent);

    // Create histogram bins for agent speedup
    $: agentBinner = bin()
        .domain([0, 3])
        .thresholds([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    $: oracleBinner = bin()
        .domain([0, 3])
        .thresholds([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    // Bin the agent speedup data
    $: agentBins = agentBinner(agentData.map(d => d['agent/nop'])).map(bin => ({
        bucket: `${bin.x0}-${bin.x1}`,
        count: bin.length,
        percent: (bin.length / agentData.length) * 100
    }));

    // Bin the oracle speedup data
    $: oracleBins = oracleBinner(agentData.map(d => d['oracle/nop'])).map(bin => ({
        bucket: `${bin.x0}-${bin.x1}`,
        count: bin.length,
        percent: (bin.length / agentData.length) * 100
    }));

    const xKey = 'bucket';
    const yKey = 'percent';

    $: agentHistoData = [
        { key: 'agent', values: agentBins, xDomain: agentBins.map(d => d.bucket) },
        { key: 'oracle', values: oracleBins, xDomain: oracleBins.map(d => d.bucket) }
    ];
</script>

<section id="distribution">
    <h4>{agent} Benchmark Performance Distribution</h4>
    <div class="key">
        <p class="agent-benchmarks">Agent speedup distribution</p>
        <p class="oracle-benchmarks">Oracle speedup distribution</p>
    </div>
    <div class="quad-wrapper">
        {#each agentHistoData as category, i}
            <div class="chart-wrapper" id="chart-wrapper-{category.key}">
                <h5>{category.key} Speedup (vs No-op baseline)</h5>
                <div class="chart-layers">
                    <div class="chart-container bars" id="bars_{category.key}">
                        <LayerCake
                        bind:width
                        padding={{ top: 0, right: 0, bottom: 40, left: 0 }}
                        x={xKey}
                        y={yKey}
                        xScale={scaleBand().paddingInner(0.04)}
                        xDomain={category.xDomain}
                        yDomain={[0, Math.max(...category.values.map(v => v.percent)) * 1.1]}
                        data={category.values}
                        >
                            <Svg>
                                <AxisY gridlines={false}/>
                                <Column />
                            </Svg>
                        </LayerCake>
                    </div>
                </div>
                <p class="comments">
                    Distribution of {category.key} speedup values for {agent} across {agentData.length} benchmarks.
                </p>
            </div>
        {/each}
    </div>
</section>

<style>
    #distribution {
        width: 100%;
        height: auto;
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
        position: relative;
        pointer-events: auto;
        margin-bottom: 2rem;
    }

    .key {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        flex-direction: row;
        gap: 0.5rem 1rem;
        font-family: var(--sans);
        text-transform: capitalize;
        align-items: center;
        justify-content: flex-start;
    }

    .key p {
        padding: 0.125rem 0.25rem;
        margin: 0;
        font-size: var(--14px);
        text-align: center;
        max-width: 240px;
    }

    .key .agent-benchmarks::before, .key .oracle-benchmarks::before {
        content: "";
        display: inline-block;
        width: 30px;
        height: 15px;
        margin-right: 0.5rem;
    }

    .key .agent-benchmarks::before {
        background-image: url('/assets/images/bar-chart.png');
        background-size: 30px 15px;
        background-repeat: no-repeat;
        background-position: center;
    }

    .key .oracle-benchmarks::before {
        background-image: url('/assets/images/step-chart.png');
        background-size: 30px 15px;
        background-repeat: no-repeat;
        background-position: center;
    }

    .quad-wrapper {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        width: 100%;
        gap: 3rem;
    }

    .comments {
        margin: 0.5rem 0 0 0;
        font-family: var(--sans);
        font-size: var(--16px);
        width: 100%;
        color: var(--wine-tan);
    }

    .chart-wrapper {
        width: calc(50% - 2rem);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        position: relative;
        transition: opacity var(--500ms) linear;
    }

    h4 {
        font-family: var(--serif);
        font-size: var(--20px);
        font-weight: 700;
        margin: 2.5rem 0 1rem 0;
        color: var(--wine-tan);
    }

    h5 {
        font-size: var(--14px);
        font-family: var(--sans);
        text-align: center;
        text-transform: uppercase;
        margin: 1.5rem 0 0 0;
        color: var(--wine-dark-tan);
    }

    .chart-layers {
        position: relative;
        width: 100%;
        height: 150px;
    }

    .chart-container {
        position: absolute;
        width: 100%;
        height: 100%;
    }

    @media (max-width: 700px) {
        .quad-wrapper {
            flex-wrap: nowrap;
            flex-direction: column;
        }

        .chart-wrapper {
            width: 100%;
        }

        h4 {
            font-size: var(--18px);
            text-align: left;
            margin-bottom: 1rem;
        }

        h5 {
            margin: 1rem 0 0 0;
        }

        .comments {
            font-size: var(--14px);
        }

        .key {
            flex-wrap: wrap;
            margin-bottom: 2rem;
        }

        .key p {
            font-size: var(--12px);
            margin: 0;
            max-width: 220px;
        }
    }
</style>
