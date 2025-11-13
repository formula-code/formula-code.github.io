/**
 * Utility functions for normalizing and transforming benchmark data
 */

/**
 * Parse the benchmark_codes JSON field
 * @param {string} codesString - JSON string containing benchmark codes
 * @returns {Object} Parsed object with benchmark names as keys and code as values
 */
export function parseBenchmarkCodes(codesString) {
	if (!codesString) return {};
	try {
		return JSON.parse(codesString);
	} catch (e) {
		console.warn('Failed to parse benchmark_codes:', e);
		return {};
	}
}

/**
 * Get the first/main code snippet from benchmark_codes
 * @param {string} codesString - JSON string containing benchmark codes
 * @returns {string} The first code snippet
 */
export function getMainCode(codesString) {
	const codes = parseBenchmarkCodes(codesString);
	const entries = Object.entries(codes);
	return entries.length > 0 ? entries[0][1] : '';
}

/**
 * Get all available code snippet names
 * @param {string} codesString - JSON string containing benchmark codes
 * @returns {Array<string>} Array of benchmark names
 */
export function getCodeNames(codesString) {
	const codes = parseBenchmarkCodes(codesString);
	return Object.keys(codes);
}

/**
 * Extract agent name from agent_id (e.g., "terminus-2,oracle" -> "oracle")
 * @param {string} agentId - Full agent ID
 * @returns {string} Agent name
 */
export function extractAgentName(agentId) {
	if (!agentId) return '';
	const parts = agentId.split(',');
	return parts.length > 1 ? parts[1].trim() : agentId;
}

/**
 * Format agent ID to display name
 * Converts "terminus-2,oracle" to "Terminus 2 - Oracle"
 * Converts "terminus-2,gpt-5" to "Terminus 2 - GPT-5"
 * Converts "terminus-2,claude" to "Terminus 2 - Claude Sonnet 4.0"
 * @param {string} agentId - Full agent ID (e.g., "terminus-2,oracle")
 * @returns {string} Formatted display name
 */
export function formatAgentDisplayName(agentId) {
	if (!agentId) return '';

	const parts = agentId.split(',').map(p => p.trim());

	// Format the agent part (e.g., "terminus-2" -> "Terminus 2")
	const agentPart = parts[0]
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

	// Format the model part
	const modelPart = parts[1] || '';
	let formattedModel = '';

	switch (modelPart.toLowerCase()) {
		case 'oracle':
			formattedModel = 'Oracle';
			break;
		case 'gpt-5':
		case 'gpt5':
			formattedModel = 'GPT-5';
			break;
		case 'gpt-4':
		case 'gpt4':
			formattedModel = 'GPT-4';
			break;
		case 'claude':
			formattedModel = 'Claude Sonnet 4.0';
			break;
		case 'claude-3.5':
		case 'claude-3-5':
			formattedModel = 'Claude Sonnet 3.5';
			break;
		default:
			// Capitalize first letter of each word
			formattedModel = modelPart
				.split('-')
				.map(word => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ');
	}

	return `${agentPart} - ${formattedModel}`;
}

/**
 * Format benchmark decomposition for display
 * @param {string} decomposition - Benchmark decomposition string
 * @returns {string} Formatted breadcrumb string (module > class > function > params)
 */
export function formatBenchmarkBreadcrumb(decomposition) {
	if (!decomposition) return '';
	// The decomposition might be a single string or need to be parsed
	// For now, return as-is
	return decomposition;
}

/**
 * Calculate level from benchmark decomposition depth
 * This can be used if the 'level' field is missing
 * @param {Object} benchmark - Benchmark data object
 * @returns {string} Level string (param-level, func-level, etc.)
 */
export function calculateLevel(benchmark) {
	// Try to determine level from available fields
	// This is a fallback if level field is missing
	if (benchmark.level) return benchmark.level;

	// Could also derive from benchmark_decoposed if needed
	return 'unknown';
}

/**
 * Get unique agent IDs from dataset
 * @param {Array} data - Array of benchmark data objects
 * @returns {Array<string>} Unique agent IDs
 */
export function getUniqueAgents(data) {
	const agents = new Set();
	data.forEach(d => {
		if (d.agent_id) agents.add(d.agent_id);
	});
	return Array.from(agents).sort();
}

/**
 * Get unique levels from dataset
 * @param {Array} data - Array of benchmark data objects
 * @returns {Array<string>} Unique levels
 */
export function getUniqueLevels(data) {
	const levels = new Set();
	data.forEach(d => {
		if (d.level) levels.add(d.level);
	});
	return Array.from(levels).sort();
}

/**
 * Get unique benchmark types from dataset
 * @param {Array} data - Array of benchmark data objects
 * @returns {Array<string>} Unique types
 */
export function getUniqueTypes(data) {
	const types = new Set();
	data.forEach(d => {
		if (d.benchmark_type) types.add(d.benchmark_type);
	});
	return Array.from(types).sort();
}

/**
 * Calculate statistics for a specific agent
 * @param {Array} data - Array of benchmark data objects
 * @param {string} agentId - Agent ID to filter by
 * @returns {Object} Statistics object with median, count, etc.
 */
export function calculateAgentStats(data, agentId) {
	const agentData = data.filter(d => d.agent_id === agentId);

	if (agentData.length === 0) {
		return {
			count: 0,
			medianAgentNop: 0,
			medianOracleNop: 0
		};
	}

	const toNumber = value => {
		if (typeof value === 'number') return value;
		const parsed = parseFloat(value);
		return Number.isFinite(parsed) ? parsed : undefined;
	};

	const getMedian = values => {
		if (values.length === 0) return 0;
		const mid = Math.floor(values.length / 2);
		return values.length % 2 !== 0
			? values[mid]
			: (values[mid - 1] + values[mid]) / 2;
	};

	// Calculate medians
	const agentNops = agentData
		.map(d => toNumber(d['agent/nop']))
		.filter(v => v !== undefined)
		.sort((a, b) => a - b);
	const oracleNops = agentData
		.map(d => toNumber(d['oracle/nop']))
		.filter(v => v !== undefined)
		.sort((a, b) => a - b);

	const medianAgentNop = getMedian(agentNops);
	const medianOracleNop = getMedian(oracleNops);

	return {
		count: agentData.length,
		medianAgentNop,
		medianOracleNop
	};
}
