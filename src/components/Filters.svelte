<script>
    import { get } from 'svelte/store';
    import MultiSelect from 'svelte-multiselect';
    import { bigScatterData, selectedAgentSTORE, selectedTypeSTORE, selectedLevelSTORE, searchedBenchmarkSTORE, tooltipType, tooltipData, lockedSelection, agentAdvantage, thresholdAgentNum, thresholdOracleNum, withFiltersData, tooltipVisible, uniqueAgents, uniqueLevels, uniqueTypes } from "$stores/misc.js";
    import Icon from "$components/helpers/Icon.svelte";
    import Typeahead from "$components/TypeaheadLocal.svelte";
    import { selectAll, select } from 'd3-selection';
    import { formatAgentDisplayName } from "$utils/benchmarkData.js";
    import { format } from 'd3-format';

    const formatter = format(",");

    // Level labels mapping
    const LEVEL_LABELS = {
        0: "no-aggregation",
        1: "param-level",
        2: "func-level",
        3: "class-level",
        4: "module-level",
    };

    // Display labels for level dropdown
    const LEVEL_DISPLAY_LABELS = {
        "no-aggregation": "No Aggregation",
        "param-level": "L1: Groupby params",
        "func-level": "L2: Groupby func",
        "class-level": "L3: Groupby class",
        "module-level": "L4: Groupby module",
    };

    // Use derived stores for dynamic filter options
    $: benchmarkTypes = $uniqueTypes;

    // Create agent options with pretty display names
    $: agentOptions = $uniqueAgents.map(agent => ({
        label: formatAgentDisplayName(agent),
        value: agent
    }));

    // Create level options with display labels
    $: levelOptions = $uniqueLevels
        .map(level => typeof level === 'number' ? (LEVEL_LABELS[level] || `level-${level}`) : level)
        .map(level => ({
            label: LEVEL_DISPLAY_LABELS[level] || level,
            value: level
        }));

    $: availableBenchmarks = $bigScatterData.map(d => ({
        label: `${d.benchmark_name}`, // Display benchmark name
        value: d.id // This is used to find the matching circle
    }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically

    // Initialize with first agent by default
    let selectedAgent = [];
    let selectedType = [];
    let selectedLevel = [];
    let searchedBenchmark = [];
    let searchTerm = '';
    let foundBenchmark;

    // Set default agent when agents list is available
    $: if (agentOptions.length > 0 && selectedAgent.length === 0) {
        selectedAgent = [agentOptions[0]];
    }

    function storeUpdates(selectedGroup, valType) {
        // Extract values from objects if needed (for agent/level which use {label, value} structure)
        let values = selectedGroup;
        if (valType === "agent" || valType === "level") {
            values = selectedGroup.map(item =>
                typeof item === 'object' && item !== null && 'value' in item ? item.value : item
            );
        }

        if (valType == "agent") {
            selectedAgentSTORE.set(values)
        } else if (valType == "type") {
            selectedTypeSTORE.set(values)
        } else if (valType == "level" ) {
            selectedLevelSTORE.set(values)
        } else {
            searchedBenchmarkSTORE.set(values)
        }
    }

    function updateScatterData(
        bigScatterDataValue,
        selectedAgentSTORE,
        selectedTypeSTORE,
        selectedLevelSTORE
    ) {
        // Agent filter is required - if no agent selected, don't show any data
        if (selectedAgentSTORE.length === 0) {
            withFiltersData.set([]);
            return;
        }

        const hasTypeFilter = selectedTypeSTORE.length > 0;
        // Level filter is single-select, check if array has a value
        const hasLevelFilter = selectedLevelSTORE.length > 0;

        const filteredData = bigScatterDataValue.filter(d => {
            // Agent filter (required)
            if (!selectedAgentSTORE.includes(d.agent_id)) {
                return false;
            }
            // Type filter
            if (hasTypeFilter && !selectedTypeSTORE.includes(d.benchmark_type)) {
                return false;
            }
            // Level filter (single-select, handle value.value from MultiSelect options)
            if (hasLevelFilter) {
                const levelLabel = typeof d.level === 'number' ? LEVEL_LABELS[d.level] : d.level;
                // Extract value from MultiSelect option object
                const selectedLevelValue = selectedLevelSTORE[0]?.value || selectedLevelSTORE[0];
                if (levelLabel !== selectedLevelValue) {
                    return false;
                }
            }
            return true;
        });

        withFiltersData.set(filteredData);
    }

    $: if (!$lockedSelection && foundBenchmark) {
		resetCircle(foundBenchmark)
	}

    function updateSearchedBenchmark(detail) {
        if (!detail || !detail.original || !detail.original.value) return;

        const benchmarkId = detail.original.value;
        foundBenchmark = get(bigScatterData).find(d => d.id === benchmarkId);
        if (!foundBenchmark) return;

        lockedSelection.set(true);

        // Wait until the element is in the DOM
        const benchmark = select(`#scatterplot #circle-${benchmarkId}`);
        if (benchmark.empty()) { return; }

        const parent = select(benchmark.node().parentNode);

        selectAll(".selected-circle").style("opacity", 0.5);

        benchmark
            .classed("selected-benchmark", true)
            .classed("filteredOut", false)
            .transition()
            .duration(500)
            .attr("r", 10)
            .style("fill", "#CFCABF")
            .style("opacity", 1);

        parent
            .raise()
            .classed("filteredOut", false)
            .style("opacity", 1);

        if (get(tooltipData)?.id !== foundBenchmark.id) {
            tooltipVisible.set(true);
            tooltipData.set(foundBenchmark);
            tooltipType.set("benchmark");
        }
    }

    function resetCircle(benchmark) {
        const circle = select(`#scatterplot #circle-${benchmark.id}`);
        if (!circle.empty()) {
            circle
                .classed("selected-benchmark", false)
                .transition()
                .duration(500)
                .attr("r", 5)
                .style("fill", "#475171")
                .style("opacity", 0.8);
        }
    }

    $: storeUpdates(selectedAgent, "agent")
    $: storeUpdates(selectedType, "type")
    $: storeUpdates(selectedLevel, "level")
    $: storeUpdates(searchedBenchmark, "benchmark")
    $: updateScatterData($bigScatterData, $selectedAgentSTORE, $selectedTypeSTORE, $selectedLevelSTORE);
</script>


<div id="filters">
    <div class="filters-inner">
        <div class="wrapper">
            <div class="select-wrapper">
                <div class="filter">
                    <MultiSelect
                        bind:selected={selectedAgent}
                        options={agentOptions}
                        valType = "agent"
                        placeholder="Select agent"
                        maxSelect={1}
                        minSelect={1}
                        required
                        ariaLabel="select agent"
                    >
                        <span slot="expand-icon">
                            <Icon name="chevrons-up-down" size={"12px"} rotation={0}/>
                        </span>
                    </MultiSelect>
                </div>
                <div class="filter">
                    <MultiSelect
                        bind:selected={selectedType}
                        options={benchmarkTypes}
                        valType = "type"
                        placeholder="All types"
                        removeAllTitle="Remove all types"
                        ariaLabel="select benchmark types"
                    >
                        <span slot="expand-icon">
                            <Icon name="chevrons-up-down" size={"12px"} rotation={0}/>
                        </span>
                    </MultiSelect>
                </div>
                <div class="filter">
                    <MultiSelect
                        bind:selected={selectedLevel}
                        options={levelOptions}
                        valType = "level"
                        placeholder="All levels"
                        maxSelect={1}
                        ariaLabel="select aggregation level"
                    >
                        <span slot="expand-icon">
                            <Icon name="chevrons-up-down" size={"12px"} rotation={0}/>
                        </span>
                    </MultiSelect>
                </div>
                <div class="search-wrapper">
                    <Typeahead
                        bind:value={searchTerm}
                        hideLabel
                        label="Benchmarks"
                        placeholder={`Find a benchmark`}
                        data={availableBenchmarks}
                        limit={4}
                        extract={(item) => item.label}
                        on:select={({ detail }) => {
                            updateSearchedBenchmark(detail);
                          }}
                          on:clear={() => {
                            if (foundBenchmark) {
                              resetCircle(foundBenchmark);
                            }

                            tooltipVisible.set(false);
                            tooltipData.set(null);
                            lockedSelection.set(false);
                          }}
                    />
                    {#if searchTerm}
                        <button class="clear-btn" on:click={() => searchTerm = ''}>
                            <Icon name="x" size={"12px"} rotation={0}/>
                        </button>
                    {/if}
                </div>
            </div>
            <p class="steals-sentence">
            Agent Advantage:
                <span class="bold highlight">{$agentAdvantage !== undefined ? $agentAdvantage.toFixed(4) : 0}</span>
                <span class="bold">
                ({#if $withFiltersData.length !== 1}
                    {formatter($withFiltersData.length)} benchmarks
                {:else}
                    {formatter($withFiltersData.length)} benchmark
                {/if})
                </span>
            </p>
        </div>
    </div>
</div>

<style>
    p {
        color: var(--wine-tan);
        max-width: 800px;
        margin: 1rem auto;
        font-family: var(--sans);
        font-size: var(--16px);
    }
    .highlight {
        color: var(--wine-tan);
        background-color: var(--wine-green);
        padding: 0.25rem;
        border-radius: 3px;
        font-weight: 700;
    }
    #filters {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: row;
        align-items: flex-start;
        margin: 0 auto;
        position: absolute;
        top: 0;
        z-index: 1000;
        padding: 1rem;
    }

    .filters-inner {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .wrapper {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .steals-sentence {
        width: 100%;
        padding: 0;
        text-align: center;
        font-size: var(--18px);
    }

    .select-wrapper {
        width: 100%;
        display: flex;
        flex-direction: row;
        gap: 1rem;
    }

    .filter {
        width: calc(25% - 0.5rem);
    }

    .search-wrapper {
        width: calc(25% - 0.5rem);
        position: relative;
    }

    .clear-btn {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        right: 0;
        top: 4px;
        background: var(--wine-tan);
    }

    :global(#filters .multiselect) {
        background: var(--wine-tan) !important;
        height: 2.5rem !important;
        font-family: var(--sans) !important;
    }

    :global([data-svelte-typeahead]) {
        background: var(--wine-tan) !important;
        position: relative;
        border-radius: 3pt !important;
    }

    :global([data-svelte-typeahead] input) {
        border: none !important;
        border-radius: 3pt !important;
        height: 2.5rem !important;
        font-family: var(--sans) !important;
        font-size: var(--16px) !important;
        color: var(--wine-black) !important;
        outline: none !important;

        background-image: url('/assets/images/search.png') !important;
        background-repeat: no-repeat !important;
        background-size: 0.8rem !important;
        background-position: 0.3rem center !important;
        padding-left: 1.5rem !important; /* Make room for the icon */
    }

    :global([data-svelte-typeahead] input::placeholder) {
        color: var(--wine-black) !important;
    }

    :global([data-svelte-typeahead] ul) {
        font-family: var(--sans) !important;
        background: var(--wine-tan);
        transform: translateY(-3px);
    }

    :global([data-svelte-typeahead] li) {
        font-family: var(--sans) !important;
        background: var(--wine-tan) !important;
        border-bottom: 1px solid var(--wine-dark-tan) !important;
    }

    :global([data-svelte-typeahead] li.selected) {
        font-family: var(--sans) !important;
        background: var(--wine-tan) !important;
    }

    :global([data-svelte-typeahead] li.selected:hover) {
        background: var(--wine-dark-tan) !important;
    }

    :global([data-svelte-typeahead] ul mark) {
        padding: 0;
        font-weight: 700;
        background: none;
        color: var(--wine-red);
    }

    :global([data-svelte-typeahead] input[type="search"]::-webkit-search-cancel-button) {
        -webkit-appearance: none;
        appearance: none;
        display: none;
    }

    @media(max-width: 900px) {
        .select-wrapper {
            gap: 0.75rem;
        }

        .filter, .search-wrapper {
            width: calc(50% - 0.375rem);
        }

        :global(#filters .multiselect) {
            font-size: var(--14px) !important;
        }

        :global([data-svelte-typeahead] input) {
            font-size: var(--14px) !important;
        }
    }

    @media(max-width: 700px) {
        #filters {
            padding: 0.75rem;
        }

        .select-wrapper {
            flex-direction: column;
            gap: 0.75rem;
        }

        .filter {
            width: 100%;
        }

        /* Hide search/benchmark finder on mobile */
        .search-wrapper {
            display: none;
        }

        :global(#filters .multiselect) {
            font-size: var(--14px) !important;
            height: 2.75rem !important;
        }

        :global([data-svelte-typeahead] input) {
            font-size: var(--14px) !important;
            height: 2.75rem !important;
        }

        .steals-sentence {
            font-size: var(--14px);
        }
    }

    @media(max-width: 480px) {
        .steals-sentence {
            font-size: var(--12px);
        }

        :global(#filters .multiselect) {
            font-size: var(--13px) !important;
        }

        :global([data-svelte-typeahead] input) {
            font-size: var(--13px) !important;
        }
    }
</style>
