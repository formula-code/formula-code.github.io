import { writable, derived, readable } from "svelte/store";
import allBenchmarkData from "$data/website_data.csv";
import medianStatsRaw from "$data/median_data.csv";

// EXPLORE DATA
// Normalize numeric fields once so downstream components can assume numbers
const parsedData = allBenchmarkData.map(d => {
	const agentSpeed = typeof d['agent/nop'] === "number" ? d['agent/nop'] : parseFloat(d['agent/nop']);
	const oracleSpeed = typeof d['oracle/nop'] === "number" ? d['oracle/nop'] : parseFloat(d['oracle/nop']);

	return {
		...d,
		'agent/nop': Number.isFinite(agentSpeed) ? agentSpeed : undefined,
		'oracle/nop': Number.isFinite(oracleSpeed) ? oracleSpeed : undefined
	};
});

// Filter out any invalid data (keep all for now, can add filters later)
const filteredData = parsedData.filter(d => {
	// Basic validation - ensure required fields exist
	if (d['agent/nop'] === undefined || d['oracle/nop'] === undefined) return false;

	// // Skip ultra-high-level aggregates that add thousands of marks
	// const levelValue = d.level ?? "";
	// const normalizedLevel = typeof levelValue === "number" ? levelValue : `${levelValue}`.toLowerCase();
	// if (
	// 	normalizedLevel === "no-aggregation" ||
	// 	normalizedLevel === "0" ||
	// 	normalizedLevel === 0
	// ) return false;


	// if (d.agent_id !== "terminus-2,oracle") return false;

	return true;
});

export const bigScatterData = writable(filteredData);
export const withFiltersData = writable(filteredData);
export const selectedAgentSTORE = writable([]);
export const selectedTypeSTORE = writable([]);
export const selectedLevelSTORE = writable([]);
export const searchedBenchmarkSTORE = writable(undefined);
export const selectedAgentRangeSTORE = writable([0, 3]);
export const selectedOracleRangeSTORE = writable([0, 3]);

// INTRO SELECTION
export const agentSelected = writable(null);
export const benchmarkSelected = writable(false);

// PERFORMANCE THRESHOLDS
export const thresholdAgentNum = writable(1.0);  // Agent speedup threshold
export const thresholdOracleNum = writable(1.0); // Oracle speedup threshold

// AGENT CARDS
export const navAgent = writable("terminus-2,oracle");
export const currAgentSlide = writable(0);

// UNIVERSAL TOOLTIP
export const tooltipType = writable(null);
export const lockedSelection = writable(false);
export const tooltipData = writable(null);
export const tooltipVisible = writable(false);

// SECTION
export const activeSection = writable("Finding the Deals");

// LOAD TRIGGERS
export const chartScrollTrigger = writable(false);

// DERIVED STORES - Per-agent statistics
import { getUniqueAgents, getUniqueLevels, getUniqueTypes } from "$utils/benchmarkData.js";

export const uniqueAgents = derived(bigScatterData, $data => getUniqueAgents($data));
export const uniqueLevels = derived(bigScatterData, $data => getUniqueLevels($data));
export const uniqueTypes = derived(bigScatterData, $data => getUniqueTypes($data));

// Calculate median statistics for each agent
const agentStatsMap = medianStatsRaw.reduce((acc, row) => {
	const agentId = row.agent_id;
	if (!agentId) return acc;

	const parsed = {
		count: Number(row.count ?? 0),
		medianAgentNop: Number(row.median_agent_nop ?? row.medianAgentNop ?? 0),
		medianOracleNop: Number(row.median_oracle_nop ?? row.medianOracleNop ?? 0)
	};

	acc[agentId] = parsed;
	return acc;
}, {});

export const agentStats = readable(agentStatsMap);

// Selected agent rationale (good/bad/mixed with brief reason)
// NOTE: This store is deprecated - narrative now comes from copy.json
// Kept for backward compatibility or future reference
/*
export const selectedAgentReason = derived(
    [agentSelected, agentStats, thresholdAgentNum, thresholdOracleNum],
    ([$agentSelected, $agentStats, $agentThresh, $oracleThresh]) => {
        if (!$agentSelected) return null;

        const stats = $agentStats?.[$agentSelected];
        if (!stats) return null;

        const agentMed = Number(stats.medianAgentNop ?? 0);
        const oracleMed = Number(stats.medianOracleNop ?? 0);

        const agentOk = agentMed >= $agentThresh;
        const oracleOk = oracleMed >= $oracleThresh;

        let badge = "mixed";
        let title = "Mixed";
        let text = "Balanced tradeoffs.";

        if (agentOk && oracleOk) {
            badge = "good";
            title = "High Performance";
            text = "Both agent and oracle show balanced speedups.";
        } else if (agentOk && !oracleOk) {
            badge = "mixed";
            title = "Under-optimized";
            text = "Agent benefits, but the oracle limits overall gains.";
        } else if (!agentOk && oracleOk) {
            badge = "mixed";
            title = "Sub-optimized";
            text = "Oracle improves, but the agent lags behind.";
        } else {
            badge = "bad";
            title = "Regression";
            text = "Neither agent nor oracle meets speedup thresholds.";
        }

        return { badge, title, text, agentMed, oracleMed };
    }
);
*/

// Map agent IDs to copy.json keys for narrative access
export const agentCopyKey = derived(
	agentSelected,
	($agentSelected) => {
		if (!$agentSelected) return null;

		// Extract the model/agent part from "terminus-2,gpt-5" format
		const parts = $agentSelected.split(',');
		if (parts.length < 2) return null;

		const agent = parts[1].trim().toLowerCase();

		// Map to copy.json keys
		if (agent === 'gpt-5') return 'gpt5';
		if (agent === 'claude') return 'claude';
		if (agent === 'oracle') return 'oracle';

		return null;
	}
);

function calculateDistance(agentSpeedup, oracleSpeedup, agentThresh, oracleThresh) {
	if (agentSpeedup === undefined || oracleSpeedup === undefined) return null;

	const numerator = (oracleThresh * agentSpeedup) - (agentThresh * oracleSpeedup);
	const denominator = Math.sqrt(agentThresh ** 2 + oracleThresh ** 2);

	return numerator / denominator;
}

// Derived store: Agent advantage for all filtered data
export const agentAdvantage = derived(
	[withFiltersData, thresholdAgentNum, thresholdOracleNum],
	([$data, $agentThresh, $oracleThresh]) => {
		if (!$data || $data.length === 0) return 0;

		const distances = $data
			.map(d => calculateDistance(d['agent/nop'], d['oracle/nop'], $agentThresh, $oracleThresh))
			.filter(d => d !== null);

		if (distances.length === 0) return 0;

		const sum = distances.reduce((acc, val) => acc + val, 0);
		return sum / distances.length;
	}
);

// Derived store: Agent advantage by agent
export const agentAdvantageByAgent = derived(
	[withFiltersData, thresholdAgentNum, thresholdOracleNum],
	([$data, $agentThresh, $oracleThresh]) => {
		if (!$data || $data.length === 0) return {};

		// Group by agent
		const byAgent = {};

		$data.forEach(d => {
			const agent = d.agent_id;
			if (!agent) return;

			if (!byAgent[agent]) {
				byAgent[agent] = [];
			}

			const distance = calculateDistance(d['agent/nop'], d['oracle/nop'], $agentThresh, $oracleThresh);
			if (distance !== null) {
				byAgent[agent].push(distance);
			}
		});

		// Calculate average for each agent
		const result = {};
		Object.keys(byAgent).forEach(agent => {
			const distances = byAgent[agent];
			const sum = distances.reduce((acc, val) => acc + val, 0);
			result[agent] = sum / distances.length;
		});

		return result;
	}
);

// Derived store: Agent advantage by agent and level (for leaderboard)
export const agentAdvantageByAgentAndLevel = derived(
	[bigScatterData, thresholdAgentNum, thresholdOracleNum],
	([$data, $agentThresh, $oracleThresh]) => {
		if (!$data || $data.length === 0) return {};

		// Group by agent, then by level
		const byAgentAndLevel = {};

		$data.forEach(d => {
			const agent = d.agent_id;
			const level = d.level;
			if (!agent || !level) return;

			if (!byAgentAndLevel[agent]) {
				byAgentAndLevel[agent] = {};
			}

			if (!byAgentAndLevel[agent][level]) {
				byAgentAndLevel[agent][level] = [];
			}

			const distance = calculateDistance(d['agent/nop'], d['oracle/nop'], $agentThresh, $oracleThresh);
			if (distance !== null) {
				byAgentAndLevel[agent][level].push(distance);
			}
		});

		// Calculate average for each agent-level combination
		const result = {};
		Object.keys(byAgentAndLevel).forEach(agent => {
			result[agent] = {};
			Object.keys(byAgentAndLevel[agent]).forEach(level => {
				const distances = byAgentAndLevel[agent][level];
				const sum = distances.reduce((acc, val) => acc + val, 0);
				result[agent][level] = sum / distances.length;
			});
		});

		return result;
	}
);

// Derived store: Overall agent advantage (all data, no level filtering)
export const overallAgentAdvantage = derived(
	[bigScatterData, thresholdAgentNum, thresholdOracleNum],
	([$data, $agentThresh, $oracleThresh]) => {
		if (!$data || $data.length === 0) return {};

		// Group by agent
		const byAgent = {};

		$data.forEach(d => {
			const agent = d.agent_id;
			if (!agent) return;

			if (!byAgent[agent]) {
				byAgent[agent] = [];
			}

			const distance = calculateDistance(d['agent/nop'], d['oracle/nop'], $agentThresh, $oracleThresh);
			if (distance !== null) {
				byAgent[agent].push(distance);
			}
		});

		// Calculate average for each agent
		const result = {};
		Object.keys(byAgent).forEach(agent => {
			const distances = byAgent[agent];
			const sum = distances.reduce((acc, val) => acc + val, 0);
			result[agent] = sum / distances.length;
		});

		return result;
	}
);

// Human-readable aggregation level labels
const AGGREGATION_LABELS = {
	"no-aggregation": "No Aggregation",
	"param-level": "L1: Groupby params",
	"func-level": "L2: Groupby func",
	"class-level": "L3: Groupby class",
	"module-level": "L4: Groupby module"
};

// Derived store: Current aggregation level display text
export const currentAggregationLabel = derived(
	selectedLevelSTORE,
	($selectedLevels) => {
		// Single-select mode: if nothing selected, show "All Levels"
		if (!$selectedLevels || $selectedLevels.length === 0) {
			return "None";
		}

		// Extract the value from the option object (MultiSelect returns [{label, value}])
		const selectedLevel = $selectedLevels[0]?.value || $selectedLevels[0];

		// Return the display label for the selected level
		return AGGREGATION_LABELS[selectedLevel] || selectedLevel;
	}
);
