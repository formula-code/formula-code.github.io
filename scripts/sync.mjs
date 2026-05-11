#!/usr/bin/env node
/*
 * Orchestrator for `npm run sync`. Refreshes every piece of data the
 * landing page reads:
 *
 *   1. node scripts/build-dashboard.mjs
 *        → src/data/dashboard.json  (live aggregates from api.formulacode.org)
 *
 *   2. python tasks/fetch_remote_website_data.py        [SKIPPED]
 *        → remote/website_data/website_data.csv
 *      Currently skipped — see the docstring of that script. The backend
 *      doesn't expose enough of the benchmark schema to rebuild this CSV
 *      from the API. The committed CSV is the input until that lands.
 *
 *   3. python tasks/process_remote_data.py
 *        → src/data/website_data_lite.csv
 *        → src/data/website_data.csv
 *        → src/data/website_data_codes.json
 *        → src/data/median_data.csv
 *        → src/data/leaderboard.json
 *        → src/data/results.json
 *        → src/data/advantage-leaderboard.json
 *
 *   4. write src/data/sync-metadata.json with a single `last_refreshed`
 *      timestamp (mirroring dashboard.json.generated_at — the dashboard is
 *      the only piece that actually re-fetches from the network today) plus
 *      a per-component map so downstream tools can diff individual files.
 *
 * Order matters. We write sync-metadata.json LAST so a partial failure
 * upstream leaves the previous metadata in place and the site keeps showing
 * the prior refresh date instead of a fresh-but-stale lie.
 */

import { spawnSync } from "node:child_process";
import { readFile, writeFile, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PY = process.env.FC_PYTHON || "python3";
const REMOTE_CSV = "remote/website_data/website_data.csv";

function run(cmd, args) {
	console.log(`▶ ${cmd} ${args.join(" ")}`);
	const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
	if (r.status !== 0) {
		console.error(`✗ failed: ${cmd} ${args.join(" ")} (exit ${r.status})`);
		process.exit(r.status || 1);
	}
}

async function fileExists(rel) {
	try {
		await stat(resolve(ROOT, rel));
		return true;
	} catch {
		return false;
	}
}

async function main() {
	// 1. Refresh dashboard.json from api.formulacode.org.
	run("node", ["scripts/build-dashboard.mjs"]);

	// 2. Remote CSV fetcher — skipped pending backend work. See
	//    tasks/fetch_remote_website_data.py for the schema gap.
	console.log(
		"⚠ skipping tasks/fetch_remote_website_data.py — backend schema gap; " +
			"falling through to the committed remote CSV."
	);

	// 3. Rebuild the seven derived data files from the local CSV.
	if (!(await fileExists(REMOTE_CSV))) {
		console.error(
			`✗ ${REMOTE_CSV} not found; cannot run process_remote_data.py. ` +
				"Provide a CSV at that path (manually or via the fetcher once it lands)."
		);
		process.exit(1);
	}
	run(PY, ["tasks/process_remote_data.py"]);

	// 4. Stamp the refresh timestamp. The only piece that genuinely re-queries
	//    the API right now is the dashboard, so its generated_at is the
	//    canonical "last refreshed" value. process_remote_data.py is a local
	//    re-derivation of the committed CSV and doesn't change freshness.
	const dashboardPath = resolve(ROOT, "src/data/dashboard.json");
	const dashboard = JSON.parse(await readFile(dashboardPath, "utf8"));
	const last_refreshed = dashboard?.generated_at || new Date().toISOString();

	const meta = {
		last_refreshed,
		source: "https://api.formulacode.org/rest/v1",
		components: {
			dashboard: {
				path: "src/data/dashboard.json",
				refreshed_at: dashboard?.generated_at || null,
				from_api: true
			},
			website_data: {
				path: "src/data/website_data.csv",
				refreshed_at: null,
				from_api: false,
				note: "Re-derived locally from the committed remote CSV."
			}
		}
	};

	await writeFile(
		resolve(ROOT, "src/data/sync-metadata.json"),
		JSON.stringify(meta, null, 2) + "\n"
	);
	console.log(`✓ sync complete — last_refreshed: ${last_refreshed}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
