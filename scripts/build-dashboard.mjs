#!/usr/bin/env node
/*
 * Builds src/data/dashboard.json from api.formulacode.org/rest/v1.
 *
 * Replicates the Grafana "DataSmith Pipeline Overview" panels (Dataset
 * Growth + Problems by Repository + Repository Distribution) using only
 * the publicly readable Supabase tables — no auth required.
 *
 * Run manually with `npm run dashboard`. The output is committed so the
 * landing page stays self-contained in case the API is down at deploy.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.formulacode.org/rest/v1";
const OUT = resolve(
	dirname(fileURLToPath(import.meta.url)),
	"../src/data/dashboard.json"
);

async function getCount(path) {
	const url = `${API}${path}${path.includes("?") ? "&" : "?"}select=*&limit=1`;
	const r = await fetch(url, {
		headers: { Range: "0-0", "Range-Unit": "items", Prefer: "count=exact" }
	});
	if (!r.ok) throw new Error(`count ${r.status} ${url}`);
	const cr = r.headers.get("content-range");
	const total = cr?.split("/")[1];
	return total === "*" ? null : Number(total);
}

async function fetchAll(path) {
	const out = [];
	const pageSize = 1000;
	let offset = 0;
	while (true) {
		const sep = path.includes("?") ? "&" : "?";
		const url = `${API}${path}${sep}limit=${pageSize}&offset=${offset}`;
		const r = await fetch(url);
		if (!r.ok) throw new Error(`fetch ${r.status} ${url}`);
		const rows = await r.json();
		out.push(...rows);
		if (rows.length < pageSize) break;
		offset += pageSize;
	}
	return out;
}

function groupBy(rows, keyFn) {
	const m = new Map();
	for (const r of rows) {
		const k = keyFn(r);
		if (!m.has(k)) m.set(k, []);
		m.get(k).push(r);
	}
	return m;
}

async function main() {
	const t0 = Date.now();
	console.log(`fetching from ${API} ...`);

	// Counts (cheap — HEAD with count=exact).
	const [total_prs, total_problems, total_repos, perf_prs] = await Promise.all([
		getCount("/pull_requests"),
		getCount("/candidate_containers"),
		getCount("/repositories"),
		getCount("/pull_requests?is_performance_commit=eq.true")
	]);
	console.log(
		`  totals: prs=${total_prs} problems=${total_problems} repos=${total_repos} perf=${perf_prs}`
	);

	// Full rows for joining.
	const [containers, repositories] = await Promise.all([
		fetchAll("/candidate_containers?select=owner,repo,issue_number"),
		fetchAll("/repositories?select=owner,repo,stars")
	]);
	console.log(
		`  fetched: ${containers.length} containers, ${repositories.length} repos`
	);

	// For the monthly histogram we need merged_at on each candidate's PR.
	// candidate_containers has no FK to pull_requests in the schema cache,
	// so do the join ourselves: batch issue_number lookups per (owner, repo).
	const byRepo = groupBy(containers, (c) => `${c.owner}/${c.repo}`);
	const merged = [];
	let queries = 0;
	for (const [, group] of byRepo) {
		const { owner, repo } = group[0];
		const issues = group.map((g) => g.issue_number);
		for (let i = 0; i < issues.length; i += 200) {
			const chunk = issues.slice(i, i + 200);
			const url =
				`${API}/pull_requests?owner=eq.${encodeURIComponent(owner)}` +
				`&repo=eq.${encodeURIComponent(repo)}` +
				`&issue_number=in.(${chunk.join(",")})` +
				`&select=issue_number,merged_at`;
			const r = await fetch(url);
			if (!r.ok) throw new Error(`pr lookup ${r.status} ${url}`);
			const rows = await r.json();
			for (const row of rows) merged.push({ owner, repo, ...row });
			queries += 1;
		}
	}
	console.log(`  joined ${merged.length} PRs in ${queries} queries`);

	// Aggregations.
	const monthly = new Map();
	for (const m of merged) {
		if (!m.merged_at) continue;
		const month = m.merged_at.slice(0, 7); // "YYYY-MM"
		monthly.set(month, (monthly.get(month) || 0) + 1);
	}

	const byRepoCount = new Map();
	for (const c of containers) {
		const k = `${c.owner}/${c.repo}`;
		byRepoCount.set(k, (byRepoCount.get(k) || 0) + 1);
	}

	// Output shape — matches what the Svelte components consume.
	const out = {
		generated_at: new Date().toISOString(),
		source: API,
		totals: {
			pull_requests: total_prs,
			problems: total_problems,
			repositories: total_repos,
			performance_prs: perf_prs,
			pr_to_problem_rate: total_prs ? total_problems / total_prs : 0
		},
		monthly: [...monthly.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([month, count]) => ({ month, count })),
		by_repository: [...byRepoCount.entries()]
			.sort((a, b) => b[1] - a[1])
			.map(([repository, count]) => ({ repository, count })),
		repository_stars: repositories
			.filter((r) => r.stars != null)
			.sort((a, b) => b.stars - a.stars)
			.map((r) => ({ repository: `${r.owner}/${r.repo}`, stars: r.stars }))
	};

	await mkdir(dirname(OUT), { recursive: true });
	await writeFile(OUT, JSON.stringify(out, null, 2) + "\n");
	const dt = ((Date.now() - t0) / 1000).toFixed(1);
	console.log(`wrote ${OUT} in ${dt}s`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
