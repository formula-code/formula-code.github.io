<script>
    import { getContext } from "svelte";
    import { agentSelected, agentCopyKey, chartScrollTrigger } from "$stores/misc.js";
    import Scrolly from "$components/helpers/ChartScrolly.svelte";
    import ScrollScatter from "$components/ScrollScatter.svelte";
    import Filters from "$components/Filters.svelte";
    import Icon from "$components/helpers/Icon.svelte";
    import inView from "$actions/inView.js";
    import MathJax from "$components/helpers/MathJax.svelte";

    const copy = getContext("copy");

    // Extract chartScroll blocks from the steps array
    const rawChartScrollSteps = Array.isArray(copy.chartScroll) ? copy.chartScroll : [];

    const chartScrollSteps = rawChartScrollSteps;

    let scrollyIndex; // Raw index from Scrolly component
    // No offset needed since chartScrollSteps is already isolated
    $: chartScrollIndex = scrollyIndex !== undefined ? scrollyIndex : 0;
</script>

<section id="chart-scroll"
    use:inView={{ bottom: 0 }}
    on:enter={() => chartScrollTrigger.set(true)}>
    <div class="sticky">
        {#if chartScrollIndex >= chartScrollSteps.length - 1 || chartScrollIndex == "exit"}
            <Filters />
        {/if}
        <div class="chart-wrapper">
            <div class="scatter-wrapper"
                class:active={true}
            >
                <ScrollScatter chartScrollIndex={chartScrollIndex}/>
            </div>
        </div>
    </div>
    <Scrolly bind:value={scrollyIndex} bottom={0}>
        {#if chartScrollSteps.length}
            {#each chartScrollSteps as step, i}
                <div id="step-{i}" class="step">
                    <div class="step-inner">
                        {#if step.block}
                            {#each step.block as block}
                                {#if block?.type === "math"}
                                    <MathJax expression={block.value} />
                                {:else if block?.type === "text"}
                                    <p>{@html block.value}</p>
                                {/if}
                            {/each}
                        {/if}
                        {#if i == chartScrollSteps.length - 1}
                            <div class="scroll-hint">
                                <Icon name="chevron-down" size={"24px"} rotation={0}/>
                            </div>
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
    </Scrolly>
    <div class="spacer" />
</section>

<style>
    #chart-scroll {
        width: 100%;
    }
    .sticky {
        width: 100%;
        height: 100svh;
		position: sticky;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
		top: 0;
        left: 0;
		transition: all var(--1000ms);
        z-index: 1;
        overflow: hidden;
	}

    .chart-wrapper {
        width: 100%;
        height: 100%;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: flex-start;
    }

    .scatter-wrapper {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 900;
        opacity: 0;
    }

    .scatter-wrapper {
        width: 100%;
        height: 100%;
        left: 0;
        transform: translate(0,0);
        padding: 4rem 0 10rem 0;
        transition: opacity var(--750ms) linear;
    }

    .scatter-wrapper.active {
        opacity: 1;
    }

    .spacer {
		height: 140svh;
	}

	.step {
		height: 90vh;
        z-index: 900;
        max-width: 400px;
        opacity: 1;
	}

    #step-13 {
        height: 140vh;
    }

    .step-inner {
        background: rgba(24, 26, 31, 0.98);
        padding: 2rem 2rem 1rem 2rem;
        border: 1px solid var(--wine-dark-gray);
        border-radius: 3px;
        box-shadow: -4px 4px 10px rgb(17, 17, 17, 0.5);
        position: relative;
    }

    .step p {
        text-align: left;
        max-width: 720px;
        line-height: 1.65;
        color: var(--wine-tan);
        font-size: var(--18px);
        line-height: 1.65;
        background: none;
        z-index: 900;
        margin: 0 0 1rem 0;
        pointer-events: auto;
    }

    .scroll-hint {
        width: 3rem;
        height: 3rem;
        background: var(--wine-gold);
        position: absolute;
        bottom: -1.5rem;
        left: 50%;
        transform: translate(-50%, 0);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: bounceUp 1s infinite;
    }

    :global(.skipToExplore) {
        font-family: var(--sans);
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
    }

    :global(.skipToExplore:hover) {
        opacity: 0.5;
    }

    :global(.median-line-span, .compare-line-span, .sweet-rect-span, .cream-line-span, .selected-agent-circle-span, .high-perf-span, .regression-span, .sub-optimization-span, .under-optimization-span) {
        position: relative;
        font-weight: 700;
        margin-left: 2.25rem;
        font-family: var(--sans);
    }

    :global(.median-line-span::before, .compare-line-span::before, .sweet-rect-span::before, .cream-line-span::before, .selected-agent-circle-span::before, .high-perf-span::before, .regression-span::before, .sub-optimization-span::before, .under-optimization-span::before) {
        position: absolute;
        top: 50%;
        left: -2rem;
        width: 1.5rem;
        height: 1.5rem;
        content: "";
        margin: 0 1rem 0 0;
    }

    :global(.selected-agent-circle-span::before) {
        border: 2px solid var(--wine-gold);
        border-radius: 50%;
        top: 0%;
    }

    :global(.high-perf-span::before) {
        background: var(--wine-green);
        border-radius: 50%;
        top: 0%;
    }

    :global(.median-line-span::before) {
        border-top: 3px solid var(--wine-red);
        top: 8px;
    }

    :global(.cream-line-span::before) {
        border-top: 3px solid var(--wine-tan);
    }

    :global(.compare-line-span::before) {
        top: 40%;
        height: 0.5rem;
        border-top: 2px solid var(--color-gray-600);
        border-bottom: 2px solid var(--color-gray-600);
    }

    :global(.sweet-rect-span::before) {
        background: rgb(54, 59, 69, 0.75);
        top: 0;
        border-top: 2px solid var(--wine-tan);
        border-left: 2px solid var(--wine-tan);
    }

    :global(.regression-span::before) {
        background: #5a6a7a;
        top: 0;
        border-radius: 3px;
    }

    :global(.sub-optimization-span::before) {
        background: #7a3a3a;
        top: 0;
        border-radius: 3px;
    }

    :global(.under-optimization-span::before) {
        background: #6a7a5a;
        top: 0;
        border-radius: 3px;
    }

    :global(.more-span) {
        font-weight: 700;
        background: var(--wine-green);
        color: var(--wine-tan);
        padding: 0.125rem 0.25rem;
        border-radius: 3px;
        font-family: var(--sans);
    }

    :global(.less-span) {
        font-weight: 700;
        background: var(--wine-red);
        color: var(--wine-tan);
        padding: 0.125rem 0.25rem;
        border-radius: 3px;
        font-family: var(--sans);
    }

    :global(.bold) {
        font-weight: 700;
        font-family: var(--sans);
    }

    :global(.yellow-bold) {
        font-weight: 700;
        font-family: var(--sans);
        color: var(--wine-gold);
    }

    :global(.slider-span) {
        font-weight: 700;
        font-family: var(--sans);
        position: relative;
        padding-left: 2rem;
        color: var(--wine-gold);
        font-size: var(--16px);
        line-height: 1;
    }

    :global(.slider-span::before) {
        content: '';
        width: 1.5rem;
        height: 1.5rem;
        position: absolute;
        left: 0;
        top: -2px;
        background: url("/assets/images/range-vert.png");
        background-size: 1.5rem 1.5rem;
        background-repeat: no-repeat;
    }

    @keyframes bounceUp {
        0%       { bottom:-24px; }
        50%      { bottom:-28px; }
        100%     { bottom:-24px; }
    }

    @media(max-width: 1400px) {
		.sticky {
			align-items: center;
            justify-content: center;
		}

        .chart-wrapper {
            justify-content: center;
            align-items: center;
        }

        .scatter-wrapper {
            left: 50%;
            transform: translate(-50%,0);
        }

        .step {
            max-width: 550px;
        }
	}

    @media(max-width: 700px) {
        .scatter-wrapper {
            width: 100%;
            padding: 10rem 0 4rem 0;
        }

        .step {
            height: 90vh;
            z-index: 900;
            max-width: 90%;
            opacity: 1;
        }
        .step-inner {
            padding: 1rem 1rem 0 1rem;
        }

        .step p {
            font-size: var(--16px);
            margin: 0 0 1rem 0;
        }

        :global(.median-line-span, .compare-line-span, .sweet-rect-span, .cream-line-span, .selected-agent-circle-span, .high-perf-span, .regression-span, .sub-optimization-span, .under-optimization-span) {
            margin-left: 1.75rem;
        }

        :global(.median-line-span::before, .compare-line-span::before, .sweet-rect-span::before, .cream-line-span::before, .selected-agent-circle-span::before, .high-perf-span::before, .regression-span::before, .sub-optimization-span::before, .under-optimization-span::before) {
            left: -1.5rem;
            width: 1.25rem;
            height: 1.25rem;
            content: "";
            margin: 0;
        }

        :global(.median-line-span::before) {
            top: 8px;
        }
    }
</style>
