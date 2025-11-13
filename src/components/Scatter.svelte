<script>
    // SVELTE
    import { onMount } from "svelte";

    //LIBARIES
    import { LayerCake, Svg } from 'layercake';
    import { select, selectAll } from 'd3-selection';
    import refresh from "$svg/refresh-ccw.svg";

    // COMPONENTS
    import Icon from "$components/helpers/Icon.svelte";
    import ScatterSvg from "$components/layercake/Scatter.svg.svelte";
    import Voronoi from "$components/layercake/Voronoi.svelte";
    import AxisX from "$components/layercake/AxisX.svg.svelte";
    import AxisY from "$components/layercake/AxisY.svg.svelte";

    // STORES
    import { navAgent, tooltipType, tooltipData, lockedSelection, tooltipVisible, bigScatterData, thresholdAgentNum, thresholdOracleNum } from "$stores/misc.js";

    // UTILS
    import { formatAgentDisplayName } from "$utils/benchmarkData.js";

    // EXPORTS
    export let agent;

    $: displayName = formatAgentDisplayName(agent);

    // VARIABLES
    let benchmarkType;

    $: agentData = $bigScatterData.filter(d => {
        const matchesAgent = d.agent_id === agent;
        const matchesType = !benchmarkType || d.benchmark_type === benchmarkType;
        return matchesAgent && matchesType;
    });

    const xKey = 'agent/nop';  // Agent speedup on X-axis
    const yKey = 'oracle/nop'; // Oracle speedup on Y-axis

    const clampToDomain = (value, min = 0, max = 5) => {
        const num = Number(value);
        if (!Number.isFinite(num)) return min;
        return Math.min(max, Math.max(min, num));
    };

    $: equalAdvantageLine = [
        [0, 0],
        [
            clampToDomain($thresholdAgentNum),
            clampToDomain($thresholdOracleNum)
        ]
    ];

    $: chartData = [agentData, equalAdvantageLine];

    let benchmarkTypeBtns = [];
    let individBenchmarkBtns = [];
    let typeListeners = [];
    let benchmarkListeners = [];
    let clickedBenchmark;
    let clickedCircle;
    let clickedData;
    let container;
    let parentCard;

    function cleanupEventListeners() {
        typeListeners.forEach(({ btn, fn }) => {
            btn.removeEventListener("click", fn);
        });
        benchmarkListeners.forEach(({ btn, fn }) => {
            btn.removeEventListener("click", fn);
        });
        typeListeners = [];
        benchmarkListeners = [];
    }

    // INTERACTIVE FUNCTIONS
    // Type Click
    function handleTypeClick(event) {
        let id = event.target.id;
        benchmarkType = id;
        clickedBenchmark = event.target.closest(".agent-card").id.split("-")[2];
    }

    // Individual Benchmark Click
    function handleIndividBenchmarkClick(event) {
        resetClick();
        let closestCard = select(event.target.closest(".agent-card"));

        closestCard.selectAll(".card-benchmark-circle circle")
            .transition()
            .duration(500)
            .style("opacity", 0.3)
            .attr("r", 5);

        let id = event.target.id;
        let data = $bigScatterData.filter(d => d.id == id);
        clickedData = data[0];

        tooltipVisible.set(true);
        setTooltip(data[0]);
        lockedSelection.set(true);

        setTimeout(() => {
            clickedCircle = closestCard.select(`#card-benchmark-circle-${id}`)

            clickedCircle
                .transition()
                .duration(500)
                .style("opacity", 1)
                .style("fill", "#CFCABF")
                .attr("r", 10);
        }, 250)
    }

    // Reset Click
    function resetClick() {
        benchmarkType = undefined;
        agentData = $bigScatterData.filter(d => d.agent_id === agent);

    }

    // Set tooltip data
    function setTooltip(data) {
		tooltipData.set(data);
		tooltipType.set("benchmark");
	}

    // ON MOUNT
    onMount(() => {
        parentCard = container.closest('.agent-card');

        function bindEventListeners() {
            cleanupEventListeners();

            benchmarkTypeBtns = parentCard.querySelectorAll(".type-btn");
            benchmarkTypeBtns.forEach(btn => {
                const fn = event => handleTypeClick(event);
                btn.addEventListener("click", fn);
                typeListeners.push({ btn, fn });
            });

            individBenchmarkBtns = parentCard.querySelectorAll(".individ-benchmark-btn");
            individBenchmarkBtns.forEach(btn => {
                const fn = event => handleIndividBenchmarkClick(event);
                btn.addEventListener("click", fn);
                benchmarkListeners.push({ btn, fn });
            });
        }

        if (parentCard) {
            // Run once right away to catch already-rendered elements
            bindEventListeners();

            const observer = new MutationObserver(bindEventListeners);
            observer.observe(parentCard, {
                childList: true,
                subtree: true
            });

            return () => {
                observer.disconnect();
                cleanupEventListeners();
            };
        }
    });

    // REACTIVE FUNCTIONS
    $: resetClick($navAgent);
    $: if (!$lockedSelection && clickedCircle) {
        selectAll(".card-benchmark-circle circle")
            .transition(500)
            .style("opacity", 0.8)
            .attr("r", 5);

        clickedCircle
            .transition(500)
            .style("fill", "#475171")
            .attr("r", 5);
	}
</script>

<section id="scatter-{agent}" class="scatter" bind:this={container}>
    <div class="chart-wrapper">
        <div class="deets">
            <button id="refesh-btn" on:click={resetClick}>
                <span class="icon">
                    {@html refresh}
                </span>
                Reset
            </button>
        </div>
        <div class="chart-container" id="scatterplot" style="pointer-events:none">
                <LayerCake
                    padding={{ top: 20, right: 0, bottom: 20, left: 0 }}
                    x={xKey}
                    y={yKey}
                    data={chartData}
                    xDomain={[0, 3]}
                    yDomain={[0, 3]}
                >
                    <Svg>
                        <AxisX
                            gridlines={true}
                            ticks={12}
                        />
                        <AxisY
                            gridlines={true}
                            ticks={12} />
                        <ScatterSvg />
                        <Voronoi />
                    </Svg>
                </LayerCake>
        </div>
    </div>
</section>

<style>
    .scatter {
        width: 100%;
        height: auto;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        margin-bottom: 5rem;
        color: var(--wine-tan);
    }

    h4 {
        font-size: var(--20px);
        font-weight: 700;
        margin: 0;
    }

    .chart-wrapper {
        width: 100%;
        aspect-ratio: 1 / 1;
        display: flex;
        flex-direction: column;
        position: relative;
        margin: 0;
    }
    .deets {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        font-family: var(--sans);
        padding: 0.5rem 0rem;
    }

    .deets p {
        margin: 0;
        font-size: var(--18px);
    }

    :global(.subgroup-span .icon, #refresh-btn .icon) {
        position: relative;
        top: 2px;
    }

    .chart-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        padding-right: 3px;
    }

    #refesh-btn {
        background: var(--wine-tan);
        display: flex;
        gap: 0.25rem;
        align-items: center;
    }

    #refesh-btn:hover {
        background: var(--wine-dark-tan);
        transform: translateY(-2px);
        transition: transform var(--250ms) ease;
    }

    #refesh-btn .icon {
        width: 1rem;
        height: 1rem;
        transition: transform var(--250ms) ease;
    }

    :global(#refesh-btn .icon svg) {
        width: 1rem;
        height: 1rem;
    }

    #refesh-btn:hover .icon {
        transform: rotate(180deg);
        transform-origin: center;
    }

    :global(.type-btn, .individ-benchmark-btn) {
        background: var(--wine-tan);
        padding: 0.25rem 0.3rem;
    }

    :global(.type-btn:hover, .individ-benchmark-btn:hover) {
        background: var(--wine-dark-tan);
        transition: transform var(--250ms) ease;
        transform: translateY(-2px);
    }

    @media (max-width: 700px) {
        #scatter {
            margin-bottom: 2rem;
        }
        h4 {
            font-size: var(--18px);
        }

        .deets {
            position: relative;
        }

        .deets p {
            font-size: var(--16px);
            width: 100%;
            padding-top: 1rem;
        }

        #refesh-btn {
            position: absolute;
            right: 0;
            top: -1.8rem;
            font-size: var(--14px);
        }
    }
</style>
