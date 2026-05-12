import fs from "node:fs";
import path from "node:path";
// The explorer ships a curated slice pinned to commit 8907cb99, where the
// CSV's agent_recording paths line up with the .cast files actually present
// under src/data/recordings/. The site-wide CSV (website_data_lite.csv) was
// later swapped to a different experiment whose recordings were never
// uploaded, which is why we load a separate copy here.
import rawRows from "$data/website_data_lite.explorer.csv";
import codesData from "$data/website_data_codes.explorer.json";
import { buildWorkloads, summarizeFacets } from "$utils/explorer.js";
import { AGENT_IDS } from "$utils/agents.js";

const RECORDINGS_DIR = path.resolve("src/data/recordings");

// Per the historical CSV at 8907cb99 (which was committed alongside these
// .cast files), the on-disk agent-N suffixes map as follows:
const AGENT_NUM_TO_ID = {
	"2": AGENT_IDS.HUMAN,
	"3": AGENT_IDS.CLAUDE,
	"4": AGENT_IDS.GPT5
};

function buildRecordingManifest(root) {
	const manifest = {};
	if (!fs.existsSync(root)) return manifest;
	for (const ts of fs.readdirSync(root)) {
		const tsPath = path.join(root, ts);
		if (!fs.statSync(tsPath).isDirectory()) continue;
		for (const taskId of fs.readdirSync(tsPath)) {
			const taskPath = path.join(tsPath, taskId);
			if (!fs.statSync(taskPath).isDirectory()) continue;
			for (const runDir of fs.readdirSync(taskPath)) {
				const runPath = path.join(taskPath, runDir);
				if (!fs.statSync(runPath).isDirectory()) continue;
				if (!fs.existsSync(path.join(runPath, "sessions", "agent.cast")))
					continue;
				const m = runDir.match(/\.agent-(\d+)-/);
				if (!m) continue;
				const agentId = AGENT_NUM_TO_ID[m[1]];
				if (!agentId) continue;
				if (!manifest[taskId]) manifest[taskId] = {};
				manifest[taskId][agentId] =
					`/recordings/${ts}/${taskId}/${runDir}/sessions/agent.cast`;
			}
		}
	}
	return manifest;
}

// task_id like "pandas_dev-pandas_12" → repo_name "pandas_dev-pandas".
// The last `_<number>` segment is the task index; everything before is repo.
function repoFromTaskId(taskId) {
	const m = taskId.match(/^(.*)_\d+$/);
	return m ? m[1] : taskId;
}

// Build stub workloads for task_ids that have recordings on disk but no row
// in the CSV. They land in the explorer as bare cards: task_id, repo, and
// the per-agent recording links — no speedups or benchmark code to show.
function synthesizeOrphans(manifest, csvTaskIds) {
	const out = [];
	let synthId = 1_000_000;
	for (const [taskId, recordings] of Object.entries(manifest)) {
		if (csvTaskIds.has(taskId)) continue;
		out.push({
			id: String(synthId++),
			task_id: taskId,
			level: "",
			benchmark_name: taskId,
			repo_name: repoFromTaskId(taskId),
			agent_id: "",
			"agent/nop": null,
			"oracle/nop": null,
			agent_recording: null,
			__orphanRecordings: recordings
		});
	}
	return out;
}

export async function load() {
	const recordings = buildRecordingManifest(RECORDINGS_DIR);
	const csvTaskIds = new Set(rawRows.map((r) => r.task_id));
	const orphanWorkloads = synthesizeOrphans(recordings, csvTaskIds);
	const workloads = [
		...buildWorkloads(rawRows, codesData),
		...orphanWorkloads.map((o) => ({
			key: `${o.task_id}::::`,
			task_id: o.task_id,
			level: o.level,
			benchmark_name: o.benchmark_name,
			repo_name: o.repo_name,
			id: o.id,
			oracle: null,
			agents: {},
			recordings: o.__orphanRecordings,
			codeText: null,
			codeFqName: null,
			bestAgentId: null,
			bestAgentSpeedup: null,
			beatsOracle: false
		}))
	];
	const facets = summarizeFacets(workloads);
	return {
		workloads,
		facets
	};
}
