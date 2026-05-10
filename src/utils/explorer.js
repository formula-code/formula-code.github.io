import { AGENT_IDS, AGENT_NAMES_SHORT } from "./agents.js";
import { LEVEL_DISPLAY_LABELS, LEVEL_ORDER } from "./constants.js";
import { parseBenchmarkCodes } from "./benchmarkData.js";

const toNum = (v) => {
	const n = typeof v === "number" ? v : parseFloat(v);
	return Number.isFinite(n) ? n : null;
};

const REPO_LABELS = {
	astropy_astropy: "astropy/astropy",
	"pandas_dev-pandas": "pandas-dev/pandas",
	"scikit-learn_scikit-learn": "scikit-learn/scikit-learn",
	numpy_numpy: "numpy/numpy",
	scipy_scipy: "scipy/scipy"
};

const REPO_URLS = {
	astropy_astropy: "https://github.com/astropy/astropy",
	"pandas_dev-pandas": "https://github.com/pandas-dev/pandas",
	"scikit-learn_scikit-learn":
		"https://github.com/scikit-learn/scikit-learn",
	numpy_numpy: "https://github.com/numpy/numpy",
	scipy_scipy: "https://github.com/scipy/scipy"
};

export function repoLabel(repo) {
	return REPO_LABELS[repo] ?? repo?.replace(/_/g, "/") ?? "—";
}

export function repoUrl(repo) {
	return REPO_URLS[repo] ?? null;
}

export function levelLabel(level) {
	return LEVEL_DISPLAY_LABELS[level] ?? level ?? "—";
}

export function levelShort(level) {
	const lookup = {
		"param-level": "L1",
		"func-level": "L2",
		"class-level": "L3",
		"module-level": "L4"
	};
	return lookup[level] ?? "—";
}

/**
 * Pivot CSV rows (one per agent × benchmark × level) into one row per
 * (task_id, level, benchmark_name) with per-agent stats.
 *
 * The CSV structure has each benchmark replicated across the three agents
 * (oracle, claude, gpt-5). Oracle's `agent/nop` ≡ `oracle/nop`. The agent
 * rows additionally carry a recording path; oracle rows do not.
 */
export function buildWorkloads(rows, codeMap) {
	const groups = new Map();

	for (const r of rows) {
		const taskId = r.task_id;
		const level = r.level;
		const name = r.benchmark_name;
		if (!taskId || !level || !name) continue;

		const key = `${taskId}::${level}::${name}`;
		let wl = groups.get(key);
		if (!wl) {
			wl = {
				key,
				task_id: taskId,
				level,
				benchmark_name: name,
				repo_name: r.repo_name,
				id: r.id,
				oracle: null,
				agents: {},
				recordings: {}
			};
			groups.set(key, wl);
		}

		const agentId = r.agent_id;
		const agentNop = toNum(r["agent/nop"]);
		const oracleNop = toNum(r["oracle/nop"]);

		if (wl.oracle === null && oracleNop !== null) wl.oracle = oracleNop;

		if (agentId && agentNop !== null) {
			wl.agents[agentId] = agentNop;
		}
		if (agentId && r.agent_recording) {
			wl.recordings[agentId] = r.agent_recording;
		}
	}

	const out = [];
	for (const wl of groups.values()) {
		const codeEntry = codeMap?.[wl.id];
		let codeText = null;
		let codeFqName = null;
		if (codeEntry?.benchmark_codes) {
			const parsed = parseBenchmarkCodes(codeEntry.benchmark_codes);
			const entries = Object.entries(parsed);
			if (entries.length > 0) {
				codeFqName = entries[0][0];
				codeText = entries[0][1];
			}
		}

		// Best non-oracle agent on this workload.
		let bestAgentId = null;
		let bestAgentSpeedup = -Infinity;
		for (const aid of Object.keys(wl.agents)) {
			if (aid === AGENT_IDS.HUMAN) continue;
			const v = wl.agents[aid];
			if (v > bestAgentSpeedup) {
				bestAgentSpeedup = v;
				bestAgentId = aid;
			}
		}
		if (!Number.isFinite(bestAgentSpeedup)) {
			bestAgentSpeedup = null;
		}

		// Did any agent beat the oracle on this workload?
		const oracle = wl.oracle;
		let beatsOracle = false;
		if (oracle !== null) {
			for (const aid of Object.keys(wl.agents)) {
				if (aid === AGENT_IDS.HUMAN) continue;
				if (wl.agents[aid] > oracle) {
					beatsOracle = true;
					break;
				}
			}
		}

		out.push({
			...wl,
			codeText,
			codeFqName,
			bestAgentId,
			bestAgentSpeedup,
			beatsOracle
		});
	}

	return out;
}

export function summarizeFacets(workloads) {
	const repos = new Map();
	const tasks = new Map();
	const levels = new Map();
	let withCode = 0;
	let beatsOracleCount = 0;

	for (const w of workloads) {
		repos.set(w.repo_name, (repos.get(w.repo_name) ?? 0) + 1);
		tasks.set(w.task_id, (tasks.get(w.task_id) ?? 0) + 1);
		levels.set(w.level, (levels.get(w.level) ?? 0) + 1);
		if (w.codeText) withCode++;
		if (w.beatsOracle) beatsOracleCount++;
	}

	const repoOptions = [...repos.entries()]
		.map(([id, n]) => ({ id, label: repoLabel(id), count: n }))
		.sort((a, b) => b.count - a.count);

	const taskOptions = [...tasks.entries()]
		.map(([id, n]) => ({ id, label: id, count: n }))
		.sort((a, b) => a.label.localeCompare(b.label));

	const levelOptions = LEVEL_ORDER
		.filter((l) => levels.has(l))
		.map((l) => ({
			id: l,
			label: levelLabel(l),
			short: levelShort(l),
			count: levels.get(l)
		}));

	return {
		repoOptions,
		taskOptions,
		levelOptions,
		stats: {
			total: workloads.length,
			withCode,
			beatsOracleCount,
			repoCount: repos.size,
			taskCount: tasks.size,
			agents: [
				AGENT_IDS.CLAUDE,
				AGENT_IDS.GPT5,
				AGENT_IDS.HUMAN
			]
				.filter((id) => workloads.some((w) => w.agents[id] !== undefined))
				.map((id) => ({ id, label: AGENT_NAMES_SHORT[id] ?? id }))
		}
	};
}

export function filterAndSort(
	workloads,
	{ search, repos, levels, tasks, agentFilter, sort } = {}
) {
	const q = (search ?? "").trim().toLowerCase();
	const repoSet = repos instanceof Set ? repos : new Set(repos ?? []);
	const levelSet = levels instanceof Set ? levels : new Set(levels ?? []);
	const taskSet = tasks instanceof Set ? tasks : new Set(tasks ?? []);

	const filtered = workloads.filter((w) => {
		if (repoSet.size > 0 && !repoSet.has(w.repo_name)) return false;
		if (levelSet.size > 0 && !levelSet.has(w.level)) return false;
		if (taskSet.size > 0 && !taskSet.has(w.task_id)) return false;
		if (agentFilter === "beats-oracle" && !w.beatsOracle) return false;
		if (q) {
			const hay = `${w.benchmark_name} ${w.task_id} ${w.repo_name}`.toLowerCase();
			if (!hay.includes(q)) return false;
		}
		return true;
	});

	const cmp = (a, b) => {
		switch (sort) {
			case "name-asc":
				return a.benchmark_name.localeCompare(b.benchmark_name);
			case "name-desc":
				return b.benchmark_name.localeCompare(a.benchmark_name);
			case "oracle-desc":
				return (b.oracle ?? -Infinity) - (a.oracle ?? -Infinity);
			case "oracle-asc":
				return (a.oracle ?? Infinity) - (b.oracle ?? Infinity);
			case "agent-desc":
				return (b.bestAgentSpeedup ?? -Infinity) - (a.bestAgentSpeedup ?? -Infinity);
			case "agent-asc":
				return (a.bestAgentSpeedup ?? Infinity) - (b.bestAgentSpeedup ?? Infinity);
			default:
				return a.benchmark_name.localeCompare(b.benchmark_name);
		}
	};
	filtered.sort(cmp);
	return filtered;
}
