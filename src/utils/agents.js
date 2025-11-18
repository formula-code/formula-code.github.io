export const AGENT_IDS = {
	CLAUDE: "terminus-2,claude",
	GPT5: "terminus-2,gpt-5",
	HUMAN: "terminus-2,oracle"
};

// Display names for agents (used in legends, labels, UI)
export const AGENT_NAMES = {
	[AGENT_IDS.CLAUDE]: "Claude Sonnet 4.0",
	[AGENT_IDS.GPT5]: "GPT-5",
	[AGENT_IDS.HUMAN]: "Oracle"
};

// Short names for compact display
export const AGENT_NAMES_SHORT = {
	[AGENT_IDS.CLAUDE]: "Claude",
	[AGENT_IDS.GPT5]: "GPT-5",
	[AGENT_IDS.HUMAN]: "Oracle"
};

// Agent brand colors (for charts and visualizations)
export const AGENT_COLORS = {
	[AGENT_IDS.CLAUDE]: "#F7B956", // wine-gold
	[AGENT_IDS.GPT5]: "#4477AA",   // category-blue
	[AGENT_IDS.HUMAN]: "#66CCEE"   // category-cyan
};

// Scroll step thresholds for different visualizations
// These control when components appear/disappear during scrollytelling
export const SCROLL_STEPS = {
	AGENTS_VISIBLE_UNTIL: 1,    // Intro.Agents visible when scrollIndex <= 1
	SPINNING_BOTTLE_START: 2,   // SpinningBottle starts spinning at 2
	BOTTLES_VISIBLE_UNTIL: 2,   // Intro.Bottles visible until 2
	GPT_EXAMPLE_1: 3,           // First GPT example appears at 3
	CDF_START: 4,               // CDF chart appears at 4
	GPT_EXAMPLE_2: 4,           // Second GPT example appears at 4
	SUMMARY_BOTTLES_START: 4,   // Summary bottles start appearing at 4
	SUMMARY_BOTTLES_LABELS: 5,  // Labels appear when scrollIndex > 5
	CDF_END: 6,                 // CDF chart visible until 6
	SUMMARY_BOTTLES_END: 7,     // Summary bottles visible until 7
	HEADLINE_HIGHLIGHT: 8,      // Headline highlight effect at 8
	CHART_SCROLL_TRANSITION: 12, // Transition point in ChartScroll
	CHART_SCROLL_FILTERS: 13    // Filters appear at 13
};

// ChartScroll steps 9-11 are the agent-vs-human comparisons
export const STEP_AGENT_FILTERS = {
	9: AGENT_IDS.HUMAN,
	10: AGENT_IDS.CLAUDE,
	11: AGENT_IDS.GPT5
};

export const HUMAN_ANCHOR_BENCHMARK = "dtypes.SelectDtypes.time_select_dtype_string_exclude";
