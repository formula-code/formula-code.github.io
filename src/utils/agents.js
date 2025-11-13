export const AGENT_IDS = {
	CLAUDE: "terminus-2,claude",
	GPT5: "terminus-2,gpt-5",
	HUMAN: "terminus-2,oracle"
};

// ChartScroll steps 9-11 are the agent-vs-human comparisons
export const STEP_AGENT_FILTERS = {
	9: AGENT_IDS.HUMAN,
	10: AGENT_IDS.CLAUDE,
	11: AGENT_IDS.GPT5
};

export const HUMAN_ANCHOR_BENCHMARK = "dtypes.SelectDtypes.time_select_dtype_string_exclude";
