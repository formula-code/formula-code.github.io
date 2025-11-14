<script>
    import { onMount, onDestroy } from "svelte";
    import Icon from "$components/helpers/Icon.svelte";
    import { tooltipType, lockedSelection, tooltipData, tooltipVisible } from "$stores/misc.js";
	import viewport from "$stores/viewport.js";
	import { Highlight } from "svelte-highlight";
	import python from "svelte-highlight/languages/python";
	import atomOneDark from "svelte-highlight/styles/atom-one-dark";
	import { parseBenchmarkCodes } from "$utils/benchmarkData.js";

	// SCREENSIZE
	$: w = $viewport.width;
	$: h = $viewport.height;
	$: isMobile = w <= 500;

    function tooltipCloseClick() {
        // console.log("TOOLTIP close clicked");
  		lockedSelection.set(false);
		tooltipVisible.set(false);
        tooltipType.set(null);
        tooltipData.set(null);
		selectedCodeKey = '';
		activeBenchmarkId = undefined;
	}

    let handleClick;
    let tooltipEl;
	let selectedCodeKey = '';
	let activeBenchmarkId;

	$: data = $tooltipData;

	// Parse benchmark codes
	$: benchmarkCodes = data?.benchmark_codes ? parseBenchmarkCodes(data.benchmark_codes) : {};
	$: codeKeys = Object.keys(benchmarkCodes);
	$: if (data?.id && data.id !== activeBenchmarkId) {
		activeBenchmarkId = data.id;
		selectedCodeKey = codeKeys[0] || '';
	}
	$: displayCode = selectedCodeKey && benchmarkCodes[selectedCodeKey] ? benchmarkCodes[selectedCodeKey] : '';

	// Format benchmark decomposition
	$: benchmarkPath = data?.benchmark_decoposed || '';

	$: playbackBase = data?.agent_recording ? `/player${data.agent_recording}` : null;
	$: playbackUrl = playbackBase
		? `${playbackBase}${data?.id !== undefined ? `?benchmark=${data.id}` : ""}`
		: null;

	// LIFECYCLE FUNCTIONS
	onMount(() => {
		handleClick = (e) => {
			const clickedEl = e.target;
			const isInsideTooltip = tooltipEl && tooltipEl.contains(clickedEl);
			const isScatterplot = clickedEl.closest('#scatterplot');
			const isFilters = clickedEl.closest('#filters');

			if (!isInsideTooltip && !isScatterplot && !isFilters) {
				tooltipCloseClick();
			}
		};

		if (typeof document !== 'undefined') {
            // console.log("TOOLTIP: add global click listener");
			document.addEventListener("click", handleClick, true);
		}
	});

	onDestroy(() => {
		if (typeof document !== 'undefined' && handleClick) {
            // console.log("TOOLTIP: remove global click listener");
			document.removeEventListener("click", handleClick, true);
		}
	});
  </script>

  <svelte:head>
    {@html atomOneDark}
  </svelte:head>
  
<div id="universal-tooltip" class:visible={$tooltipData && $tooltipVisible} bind:this={tooltipEl}>
    {#if data}
        {#if $tooltipType == "benchmark"}
            <button class="close" aria-label="close tooltip" on:click={tooltipCloseClick}>
                <Icon name="x" size={"24px"} rotation={0}/>
            </button>

            <div class="tooltip-content">
                <!-- Two Column Layout -->
                <div class="columns">
                    <!-- Left: Info & Recording -->
                    <div class="left-column">
                        <h3 class="benchmark-title">{data.benchmark_name || 'Benchmark'}</h3>
                        <div class="metric">
                            <span class="metric-label">Agent:</span>
                            <span class="metric-value">{data.agent_id}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Repository:</span>
                            <span class="metric-value">{data.repo_name}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Agent Speedup:</span>
                            <span class="metric-value highlight">{data['agent/nop']?.toFixed(2)}x</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Oracle Speedup:</span>
                            <span class="metric-value highlight">{data['oracle/nop']?.toFixed(2)}x</span>
                        </div>

                        <div class="recording-section">
                            <h4>Recording</h4>
                            {#if playbackUrl}
                                <a href={playbackUrl} class="recording-link" target="_blank" rel="noopener noreferrer">
                                    <Icon name="play-circle" size={"20px"} rotation={0}/>
                                    View Agent's Solution
                                </a>
                            {:else}
                                <p class="no-recording">No recording available</p>
                            {/if}
                        </div>
                    </div>

                    <!-- Right: Code Block -->
                    <div class="code-section">
                        {#if codeKeys.length > 1}
                        <h4>Workloads in group</h4>
                            <select bind:value={selectedCodeKey} class="code-selector">
                                {#each codeKeys as key}
                                    <option value={key}>{key}</option>
                                {/each}
                            </select>
                        {:else}
                        <h4>Workload</h4>
                        {/if}
                        {#if displayCode}
                            <div class="code-wrapper">
                                <Highlight language={python} code={displayCode} />
                            </div>
                        {:else}
                            <p class="no-code">No code available</p>
                        {/if}
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>

  <style>
	#universal-tooltip {
        position: fixed;
        left: 0;
        bottom: -300px;
        width: 100%;
        height: 300px;
	    padding: 1rem;
        background: rgba(207, 202, 191, 0.98);
	    border-top: 1px solid var(--wine-dark-gray);
	    display: flex;
	    flex-direction: row;
	    justify-content: center;
	    align-items: center;
	    z-index: 1000;
	    transition: bottom var(--500ms) linear;
        overflow-y: auto;
    }

    #universal-tooltip.visible {
	    bottom: 0 !important;
        transition: bottom var(--500ms) linear;
	}

    .tooltip-content {
        width: 100%;
        max-width: 1200px;
        height: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: relative;
    }

    button.close {
        position: absolute;
        top: 0;
        right: 0;
        background: none;
        border: 2px solid var(--wine-black);
        border-radius: 50%;
        height: 2.5rem;
        width: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
    }

    button.close:hover {
        background: var(--wine-black);
    }

    :global(#universal-tooltip button.close svg) {
        margin-top: 4px;
    }

    :global(#universal-tooltip button.close:hover svg path) {
        stroke: var(--wine-tan);
    }

    .benchmark-title {
        margin: 0 0 0.75rem 0;
        font-family: var(--sans);
        font-size: var(--20px);
        font-weight: 700;
        color: var(--wine-black);
    }

    .metric {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
        align-items: baseline;
    }

    .metric-label {
        font-family: var(--sans);
        font-size: var(--14px);
        font-weight: 700;
        color: var(--wine-dark-gray);
        text-transform: uppercase;
    }

    .metric-value {
        font-family: var(--sans);
        font-size: var(--16px);
        color: var(--wine-black);
    }

    .metric-value.highlight {
        color: var(--wine-green);
        font-weight: 700;
    }

    /* Two Column Layout */
    .columns {
        display: grid;
        grid-template-columns: 35% 65%;
        gap: 1.5rem;
        flex: 1;
        overflow: hidden;
    }

    /* Left Column - Info & Recording */
    .left-column {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        padding-right: 1rem;
    }

    .recording-section {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        margin-top: 0.25rem;
    }

    .recording-section h4 {
        margin: 0;
        font-family: var(--sans);
        font-size: var(--16px);
        font-weight: 700;
        color: var(--wine-black);
        text-transform: uppercase;
    }

    .recording-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: var(--wine-black);
        color: var(--wine-tan);
        text-decoration: none;
        border-radius: 3px;
        font-family: var(--sans);
        font-size: var(--14px);
        font-weight: 700;
        transition: background var(--250ms);
        width: fit-content;
    }

    .recording-link:hover {
        background: var(--wine-dark-gray);
    }

    .recording-path {
        margin: 0;
        font-family: var(--mono);
        font-size: var(--10px);
        color: var(--wine-dark-gray);
        word-break: break-all;
    }

    .no-recording {
        margin: 0;
        font-family: var(--sans);
        font-size: var(--14px);
        color: var(--wine-dark-gray);
        font-style: italic;
    }

    /* Right Column - Code */
    .code-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        overflow: hidden;
    }

    .code-section h4 {
        margin: 0;
        font-family: var(--sans);
        font-size: var(--16px);
        font-weight: 700;
        color: var(--wine-black);
        text-transform: uppercase;
    }

    .code-selector {
        padding: 0.5rem;
        font-family: var(--mono);
        font-size: var(--12px);
        background: var(--wine-tan);
        border: 1px solid var(--wine-dark-gray);
        border-radius: 3px;
        color: var(--wine-black);
        cursor: pointer;
    }

    .code-wrapper {
        flex: 1;
        overflow-y: auto;
        border: 1px solid var(--wine-dark-gray);
        border-radius: 3px;
        background: #282c34;
    }

    .code-wrapper :global(pre) {
        margin: 0;
        padding: 1rem;
        font-family: var(--mono);
        font-size: var(--12px);
        line-height: 1.5;
        overflow-x: auto;
    }

    .code-wrapper :global(code) {
        font-family: var(--mono);
    }

    .no-code {
        margin: 0;
        font-family: var(--sans);
        font-size: var(--14px);
        color: var(--wine-dark-gray);
        font-style: italic;
    }

    /* Mobile Responsive */
    @media(max-width: 700px) {
        #universal-tooltip {
            bottom: -400px;
            height: 400px;
            padding: 0.75rem;
        }

        .tooltip-content {
            gap: 0.75rem;
        }

        button.close {
            width: 2rem;
            height: 2rem;
            top: 0;
            right: 0;
        }

        .benchmark-title {
            font-size: var(--16px);
        }

        .metric-label {
            font-size: var(--12px);
        }

        .metric-value {
            font-size: var(--14px);
        }

        .columns {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .left-column {
            padding-right: 0;
        }

        .recording-section {
            margin-top: 0.5rem;
        }

        .recording-section h4,
        .code-section h4 {
            font-size: var(--14px);
        }

        .recording-link {
            font-size: var(--12px);
            padding: 0.5rem 0.75rem;
        }

        .code-wrapper :global(pre) {
            padding: 0.75rem;
            font-size: var(--10px);
        }
    }
  </style>
