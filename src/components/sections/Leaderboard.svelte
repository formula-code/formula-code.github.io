<script>
	import {
		agentAdvantageByAgentAndLevel,
		overallAgentAdvantage,
		uniqueAgents,
		uniqueLevels
	} from "$stores/misc.js";
	import { formatAgentDisplayName } from "$utils/benchmarkData.js";
	import SortableTable from "$components/helpers/SortableTable.svelte";

	// Level display labels
	const LEVEL_DISPLAY_LABELS = {
		"no-aggregation": "L0: No Aggregation",
		"param-level": "L1: Parameter",
		"func-level": "L2: Function",
		"class-level": "L3: Class",
		"module-level": "L4: Module"
	};

	// Sort levels in logical order
	const levelOrder = [
		"no-aggregation",
		"param-level",
		"func-level",
		"class-level",
		"module-level"
	];

	$: agents = $uniqueAgents;
	$: levels = $uniqueLevels.sort((a, b) => {
		const aIndex = levelOrder.indexOf(a);
		const bIndex = levelOrder.indexOf(b);
		return aIndex - bIndex;
	});

	// Build dynamic columns based on available levels
	$: columns = [
		{ key: "displayName", label: "Agent", numeric: false },
		...levels.map((level) => ({
			key: level,
			label: LEVEL_DISPLAY_LABELS[level] || level,
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		})),
		{
			key: "overall",
			label: "Overall",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		}
	];

	// Build table data as flat row objects
	$: tableRows = agents.map((agent) => {
		const row = {
			agent,
			displayName: formatAgentDisplayName(agent),
			overall:
				$overallAgentAdvantage[agent] !== undefined
					? $overallAgentAdvantage[agent]
					: null
		};

		levels.forEach((level) => {
			const advantage = $agentAdvantageByAgentAndLevel[agent]?.[level];
			row[level] = advantage !== undefined ? advantage : null;
		});

		return row;
	});
</script>

<section id="leaderboard">
	<div class="leaderboard-container">
		<h2>Leaderboard</h2>
		<p class="description">
			This leaderboard displays the agent advantage scores by aggregation level.
			Higher scores indicate better performance relative to the Expert Human.
		</p>
		<center>
			<p class="instructions">
				Use the thresholding filters above and see how they change the
				leaderboard.
			</p>
		</center>

		<SortableTable
			{columns}
			rows={tableRows}
			initialSortKey="overall"
			initialSortOrder="desc"
		/>
	</div>
</section>

<style>
	#leaderboard {
		width: 100%;
		padding: 4rem 0;
		background: var(--bg-primary);
	}

	.leaderboard-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	h2 {
		color: var(--text-primary);
		font-size: var(--36px);
		font-weight: 700;
		margin: 0 0 1rem 0;
		text-align: center;
	}

	.description {
		color: var(--text-secondary);
		font-size: var(--16px);
		text-align: center;
		margin: 0 0 2rem 0;
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
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
	}

	@media (max-width: 700px) {
		h2 {
			font-size: var(--24px);
		}
	}

	@media (max-width: 480px) {
		h2 {
			font-size: var(--20px);
		}

		.description {
			font-size: var(--13px);
		}
	}
</style>
