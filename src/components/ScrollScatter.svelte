<script>
    import { fade } from 'svelte/transition';
    import { LayerCake, Svg } from 'layercake';
    import ScrollScatterSvg from "$components/layercake/ScrollScatter.svg.svelte";
    import AxisX from "$components/layercake/AxisX.svg.svelte";
    import AxisY from "$components/layercake/AxisY.svg.svelte";
    import Voronoi from "$components/layercake/ScrollVoronoi.svelte";
    import { tweened } from 'svelte/motion';
    import { cubicIn } from 'svelte/easing';
    import {
        bigScatterData,
        chartScrollTrigger,
        agentStats,
        currentAggregationLabel,
        selectedLevelSTORE,
        withFiltersData,
        tooltipData,
        tooltipType,
        tooltipVisible,
        lockedSelection
    } from "$stores/misc.js";
    import Range from "$components/helpers/Range.svelte";
    import { onMount } from 'svelte';
    import { HUMAN_ANCHOR_BENCHMARK } from "$utils/agents.js";

    const MODULE_LEVEL_KEYS = new Set([
		"module-level",
		"level 4",
		"level 4: modules",
		"4",
		"modules"
    ]);
    const MODULE_LEVEL_STORE_VALUE = "module-level";

    export let chartScrollIndex;

    // New axis keys for benchmark data
    const xKey = 'agent/nop';  // Agent speedup on X-axis
    const yKey = 'oracle/nop'; // Oracle speedup on Y-axis

    // Calculate median data from bigScatterData for visualization
    $: medianData = Object.entries($agentStats).map(([agent, stats]) => ({
        agent_id: agent,
        [xKey]: stats.medianAgentNop,
        [yKey]: stats.medianOracleNop,
        count: stats.count
    }));

    let xDomain = tweened([0, 3], { duration: 500, easing: cubicIn });
    let yDomain = tweened([0, 3], { duration: 500, easing: cubicIn });

    async function updateDomains(chartScrollIndex) {
        if (chartScrollIndex <= 3 || chartScrollIndex == undefined) {
            xDomain.set([0, 3]);
            yDomain.set([0, 3]);
        } else {
            xDomain.set([0, 3]);
            yDomain.set([0, 3]);
        }
    }

    $: updateDomains(chartScrollIndex);

    let windowW;
    let rangeW;
    let rangeH;

    let reduceMotion = false;

	onMount(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduceMotion = media.matches;
	});

    // Spotlight the anchor benchmark at intro step only
    const SCRIPTED_HIGHLIGHT_STEPS = new Set([1]);
    const LOCKED_TOOLTIP_STEPS = SCRIPTED_HIGHLIGHT_STEPS;
    let scriptedLockActive = false;
    let currentScriptedStep = null;

    $: anchorBenchmark = (() => {
        if (!$withFiltersData || !$withFiltersData.length) return null;
        return $withFiltersData.find(d => d.benchmark_name === HUMAN_ANCHOR_BENCHMARK) ?? $withFiltersData[0];
    })();

    $: highlightBenchmark = SCRIPTED_HIGHLIGHT_STEPS.has(chartScrollIndex) ? anchorBenchmark : null;

    $: scatterDataset = (() => {
        if (chartScrollIndex === 13) {
            const filtered = $bigScatterData.filter(d => {
                const levelRaw = d?.level;
                if (levelRaw === undefined || levelRaw === null) return false;
                if (typeof levelRaw === "string") {
                    return MODULE_LEVEL_KEYS.has(levelRaw.trim().toLowerCase());
                }
                if (typeof levelRaw === "number") {
                    return Number(levelRaw) === 4;
                }
                return false;
            });
            return filtered.length ? filtered : $bigScatterData;
        }
        return $bigScatterData;
    })();

    const cloneLevelSelection = selection =>
        Array.isArray(selection)
            ? selection.map(item => (typeof item === "object" && item !== null ? { ...item } : item))
            : [];

    const getLevelValue = selection => {
        if (!Array.isArray(selection) || selection.length === 0) return null;
        const first = selection[0];
        return typeof first === "object" && first !== null ? first.value : first;
    };

    let forcedModuleAggregation = false;
    let previousLevelSelection = [];

    $: {
        if (chartScrollIndex === 13) {
            if (!forcedModuleAggregation) {
                previousLevelSelection = cloneLevelSelection($selectedLevelSTORE);
                forcedModuleAggregation = true;
            }

            if (getLevelValue($selectedLevelSTORE) !== MODULE_LEVEL_STORE_VALUE) {
                selectedLevelSTORE.set([MODULE_LEVEL_STORE_VALUE]);
            }
        } else if (forcedModuleAggregation) {
            const restored = cloneLevelSelection(previousLevelSelection);
            selectedLevelSTORE.set(restored);
            previousLevelSelection = [];
            forcedModuleAggregation = false;
        }
    }

    $: isLockedTooltipStep = typeof chartScrollIndex === "number" && LOCKED_TOOLTIP_STEPS.has(chartScrollIndex);

    function clearScriptedTooltipLock() {
        scriptedLockActive = false;
        currentScriptedStep = null;
        lockedSelection.set(false);
        tooltipVisible.set(false);
        tooltipType.set(null);
        tooltipData.set(null);
    }

    $: {

        if (isLockedTooltipStep && highlightBenchmark) {
            scriptedLockActive = true;
            currentScriptedStep = chartScrollIndex;
            tooltipData.set(highlightBenchmark);
            tooltipType.set("benchmark");
            tooltipVisible.set(true);
            lockedSelection.set(true);
        } else if (scriptedLockActive && (!isLockedTooltipStep || chartScrollIndex === undefined || chartScrollIndex === "exit")) {
            clearScriptedTooltipLock();
        } else if (
            !scriptedLockActive &&
            (chartScrollIndex === undefined ||
            chartScrollIndex === "exit" ||
            (typeof chartScrollIndex === "number" && chartScrollIndex < 15))
        ) {
            clearScriptedTooltipLock();
        }
    }
</script>

<svelte:window bind:innerWidth={windowW} />

<section id="scatter">
    <div class="chart-container" id="scatterplot">
        {#if (typeof chartScrollIndex === "number" && chartScrollIndex >= 14) || chartScrollIndex == "exit"}
            <div class="range-wrapper" bind:offsetWidth={rangeW} bind:offsetHeight={rangeH}>
                {#if rangeW && rangeH}
                    <Range min={0} max={3} step={0.05} metric={"agent/nop"} controlsMetric={"oracle/nop"} {rangeW} {rangeH} padding={windowW >= 700 ? 156 : 32} />
                    <Range min={0} max={3} step={0.05} metric={"oracle/nop"} controlsMetric={"agent/nop"} {rangeW} {rangeH} padding={windowW >= 700 ? 156 : 54} />
                {/if}
            </div>
        {/if}
        <div class="chart-inner">
            {#if $chartScrollTrigger}
                <LayerCake
                    padding={{ top: 0, right: 0, bottom: 0, left: 0 }}
                    x={xKey}
                    y={yKey}
                    data={[medianData, scatterDataset]}
                    xDomain={$xDomain}
                    yDomain={$yDomain}
                >
                    <Svg>
                        <AxisX
                            gridlines={typeof chartScrollIndex === "number" && chartScrollIndex >= 2}
                            ticks={9}
                        />
                        <AxisY
                            gridlines={typeof chartScrollIndex === "number" && chartScrollIndex >= 2}
                            ticks={9} />
                        <ScrollScatterSvg
                            {chartScrollIndex}
                            {highlightBenchmark}
                            highlightBenchmarkId={highlightBenchmark?.id}
                        />
                        <Voronoi {chartScrollIndex} />
                    </Svg>
                </LayerCake>
            {/if}
        </div>
        {#if typeof chartScrollIndex === "number" && chartScrollIndex >= 4 && chartScrollIndex <= 7}
            <div class="quadrants"  transition:fade={{ duration: reduceMotion ? 0 : 250 }}>
                <p class:muted={chartScrollIndex !== 5} style="left: 17.5%; top: 40%">Suboptimal</p>
                <p class:muted={chartScrollIndex !== 6} style="left: 45%; top: 40%">Under Optimal</p>
                <p class:muted={chartScrollIndex !== 4} style="left: 17.5%; bottom: 15%">Regression</p>
                <p class:muted={chartScrollIndex !== 7} style="left: 65%; bottom: 30%">Super Optimal</p>
            </div>
        {/if}
        <p class="label label-price">Oracle Speedup→</p>
        <p class="label label-rating">Agent Speedup→</p>
        {#if typeof chartScrollIndex === "number" && chartScrollIndex >= 2}
            <p class="label label-aggregation" class:emphasized={chartScrollIndex === 12}>Grouping: {$currentAggregationLabel}</p>
        {/if}
    </div>
</section>

<style>
    #scatter {
        width: 100%;
        height: 100%;
        aspect-ratio: 1 / 1;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        margin-bottom: 5rem;
        overflow: hidden;
    }

    .chart-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        padding: 6rem;
        position: relative;
    }

    .chart-inner {
        width: 100%;
        height: 100%;
    }

    .quadrants {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        padding: 3rem;
        pointer-events: none;
    }

    .quadrants p {
        position: absolute;
        font-family: var(--sans);
        font-weight: 700;
        font-size: var(--18px); 
        transform: translate(-50%, -50%);
        color: var(--wine-tan);
        text-shadow: -2px -2px 0 var(--wine-black), 2px -2px 0 var(--wine-black), -2px 2px 0 var(--wine-black), 2px 2px 0 var(--wine-black);
        transition: opacity var(--250ms);
    }

    .quadrants p.muted {
        opacity: 0.35;
    }

    .label {
        font-family: var(--sans);
        font-weight: 700;
        text-transform: uppercase;
        font-size: var(--12px);
        color: var(--wine-dark-tan);
        position: absolute;
    }

    .label-price {
        top: 8.25rem;
        left: 1rem;
        transform: rotate(-90deg);
    }

    .label-rating {
        right: 2.5rem;
        bottom: 2rem;
        transform: translate(-50%, 0);
    }

    .label-aggregation {
        left: 6.5rem;
        bottom: 2rem;
        font-size: var(--14px);
        color: var(--wine-tan);
    }

    .label-aggregation.emphasized {
        background: rgba(247, 185, 86, 0.15);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        letter-spacing: 0.05em;
        color: var(--wine-gold);
    }

    .range-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        padding: 6rem;
        pointer-events: none;
        overflow: hidden;
    }

    @media(max-width: 700px) {
        .chart-container {
            padding: 3rem 2rem;
        }

        .range-wrapper {
            padding: 3rem 2rem;
        }

        .label-price {
            top: 5rem;
            left: -2.5rem;
        }

        .label-rating {
            right: -1.5rem;
            bottom: -0.5rem;
        }

        .label-aggregation {
            left: 2.5rem;
            bottom: -0.5rem;
            font-size: var(--12px);
        }

        .quadrants p {
            font-size: var(--12px);
            text-align: center;
        }
    }
</style>
