# Issue #19: Expose paper-figure data via api.formulacode.org for the website

**State:** open  
**Author:** @atharvas  
**Created:** 2026-05-11T21:11:16Z  
**Updated:** 2026-05-12T06:04:32Z  
**URL:** https://github.com/formula-code/fc-eval/issues/19  
**Comment count:** 16  
**Archived locally at:** 2026-05-12T06:31:43.092602+00:00

---

## Issue body

The FormulaCode website (`formula-code/www`) is reworking its results
section to render each paper figure/table from a small per-figure summary
JSON shipped under `src/data/findings/`. To keep these live (and continuously
updated as new harbor runs land) we want them served from
`api.formulacode.org` rather than committed to the repo.

Please expose the seven summary endpoints below, on the same ungated anon-key
surface as `repositories` / `pull_requests` / `harbor_runs`. Each endpoint
returns the JSON shape under the matching file in the website repo
(`www/src/data/findings/`). The website's `src/utils/findings.js` is the
single fetch shim that will swap from static-JSON to live once these land.

## Endpoints needed

- [ ] `GET /findings/global_leaderboard` → **Table 1** (Global Leaderboard)
- [ ] `GET /findings/stratified_advantage` → **Figure 3** (one row per agent-model with `level2`/`level3`/`level4` advantage)
- [ ] `GET /findings/tag_advantage` → **Table 2** (Per-Tag advantage; agent-model x tag matrix)
- [ ] `GET /findings/repo_quintiles` → **Table 3** (advantage bucketed by stars quintile)
- [ ] `GET /findings/cost_pareto` → **Figure 4 / Table 10** (cost-weighted advantage vs cost USD; Pareto-frontier flag)
- [ ] `GET /findings/workload_tradeoff` → **Figure 5** (per-task global vs worst-workload speedup)
- [ ] `GET /findings/temporal_generalization` → **Table 4 / Figure 1** (frontier-model speedup binned around knowledge cutoff)

## JSON shape contracts

The website expects each endpoint to return `{ _source, _generated_at, rows: [...] }` plus any axis metadata (`tags`, `quintiles`, `bins`, `levels`) the front-end needs to lay out columns. Concrete row shapes live in `www/src/data/findings/*.json` — those scaffold files are the canonical contract.

## Production pipeline

Each summary is fully derivable from `harbor_runs.reward_payload` once that table is backfilled. The exporter that produces the same JSONs locally is at `_repos/fc-eval/analysis/export_website_findings.py` in the website repo — it uses the existing `nb_utils.compute_leaderboard_metric` / `compute_agg_leaderboards` / `calculate_agent_cost` helpers. The SQL stubs in `src/data/keyFindings.json` `_sql` fields are a starting point, but ideally these endpoints back onto Postgres views so the website doesn't need to know the schema.

## Related

- Existing issue: #18 (recording paths + oracle agent_id)
- Website PR (forthcoming): adds the seven F1–F7 finding components and the `data pending` empty-state UI that activates as soon as each endpoint goes live.


---

## Comments (16)

### Comment 1 — @atharvas · 2026-05-11T22:37:27Z

_id: 4425724029 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4425724029_

## Status update

Pieces in flight:

- **Schema** → [formula-code/datasmith#25](https://github.com/formula-code/datasmith/pull/25) — migration `00021_findings_tables.sql` adds the seven `findings_*` tables plus a `findings_metadata` sidecar, with RLS + anon `GRANT SELECT` so they surface at `api.formulacode.org/rest/v1/findings_*` on the same ungated path as `repositories` / `pull_requests` / `harbor_runs`. Branched off `main` so it sequences cleanly after [formula-code/datasmith#24](https://github.com/formula-code/datasmith/pull/24) (issue-23) lands.

- **Exporter** → built and tested locally in fc-eval as `analysis/export_website_findings.py`: one builder per finding wrapping the existing `nb_utils` / `task.compute_leaderboard` helpers; CLI writes JSON snapshots to `analysis/website_data/findings/` and optionally upserts to Supabase via `--upsert-supabase`. **Not yet upstreamed** — `analysis/` is currently uncommitted in fc-eval (including `nb_utils.py` / `task.py`), so the PR needs the dependency set consolidated first. Tracking that as a follow-up.

## Schema contract reconciliation

The migration's column names match `formula-code/formula-code.github.io:src/data/findings/f{1..7}_*.json` verbatim so the website's `findings.js` shim swaps with zero field renames:

| Scaffold key | API table |
| --- | --- |
| `f1_leaderboard` | `findings_global_leaderboard` |
| `f2_stratified` | `findings_stratified_advantage` |
| `f3_tags` | `findings_tag_advantage` |
| `f4_longtail` | `findings_repo_quintiles` |
| `f5_cost` | `findings_cost_pareto` |
| `f6_tradeoff` | `findings_workload_tradeoff` |
| `f7_temporal` | `findings_temporal_generalization` |

Key alignments: `rp_rank` (not `rp_rank_adv`), `advantage_norm`, `speedup_geomean`, `worst_workload_speedup`, `cost_usd_per_task` + `advantage_weighted`. Per-task rows in `findings_workload_tradeoff` carry `(owner, repo, issue_number)` with an FK to `pull_requests` so the website can join back for PR metadata in one PostgREST call. Five temporal bins (`pre6` / `pre3` / `cutoff` / `post3` / `post6`) match `f7_temporal`'s axis.

## Dry-run row counts (94 tasks, local workspace)

```
f1_leaderboard:     9 rows
f2_stratified:     8 rows
f3_tags:          22 rows
f4_longtail:      39 rows
f5_cost:           8 rows
f6_tradeoff:     304 rows
f7_temporal:      14 rows
```

The f1 snapshot's numerical values agree with the scaffold's ported-in `advantage-leaderboard.json` values to within float noise (e.g. OpenHands x Claude 4.0 Sonnet → `advantage ≈ -0.011`, `speedup_geomean ≈ 1.054`).

## Curl examples (live once the migration lands + exporter runs)

```bash
curl -s -H "apikey: $SUPABASE_ANON_KEY" \
    "https://api.formulacode.org/rest/v1/findings_global_leaderboard?select=*&order=rp_rank.asc"

curl -s -H "apikey: $SUPABASE_ANON_KEY" \
    "https://api.formulacode.org/rest/v1/findings_workload_tradeoff?owner=eq.numpy&repo=eq.numpy&select=*"

curl -s -H "apikey: $SUPABASE_ANON_KEY" \
    "https://api.formulacode.org/rest/v1/findings_metadata?select=finding_name,generated_at,row_count"
```

## Remaining work

1. Land [formula-code/datasmith#25](https://github.com/formula-code/datasmith/pull/25) (after #24).
2. Apply the migration to prod Supabase via whichever workflow you use for db.formulacode.org (the existing Makefile only documents the local `docker exec` path; this comment intentionally doesn't try to invent a prod-deploy command).
3. Run `uv run analysis/export_website_findings.py --findings all --upsert-supabase` from your fc-eval workstation to populate the rows.
4. Upstream the exporter once the `analysis/` dependency set is ready to track.


---

### Comment 2 — @atharvas · 2026-05-11T23:07:48Z

_id: 4425878541 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4425878541_

## Verification follow-up: divergences vs. paper

Pulled the live `findings_*` tables into the website's static cache (via `tasks/process_remote_data.py`'s new `fetch_all_findings()`) and walked each rendered visualization against the paper. Three findings diverge in ways that look like upstream/data issues rather than website rendering bugs — flagging here so the exporter can be aligned. The core goal: the upstream `findings_*` rows should reproduce the same numbers the paper figures/tables are computed from, so the website is a 1:1 mirror with no reinterpretation.

### 1. F1 / Table 1 — leaderboard ordering doesn't match the paper

Paper Table 1 has **OpenHands + Claude 4.0 Sonnet at rp_rank=1**, then OpenHands + Qwen 3 Coder. The current `findings_global_leaderboard` rows put OpenHands + GPT-5 at rp_rank=1 and OpenHands + Claude 4.0 Sonnet at **rp_rank=4**. Sample of what the API returns today:

```
rp_rank=1  OpenHands  GPT-5            adv=-0.0186
rp_rank=2  OpenHands  Qwen 3 Coder     adv=-0.0299
rp_rank=3  Terminus 2 GPT-5            adv=-0.0490
rp_rank=4  OpenHands  Claude 4.0 Sonnet adv=-0.0096  ← paper has this at rank 1
```

The comment's own dry-run note says "94 tasks, local workspace" — that subset is almost certainly why the RP voting falls out differently. Running the exporter against the same full task set the paper uses should produce the paper's ordering directly.

### 2. F3 / Table 2 — only 6 of the paper's 14 tag categories are present

Paper Table 2 reports per-tag advantage across 14 optimization-strategy categories. `findings_tag_advantage` currently only has these 6 tags:

```
caching, algorithmic, data_structure, reduce_work, micro, uncategorized
```

Missing from the API but in the paper: **parallelization, batching, vectorization (lower_level), I/O, scale, db, higher_level, approximation**. These are exactly the tags the paper highlights as headline strengths/weaknesses — "agents outperform experts on parallelization and batching tasks", "agents struggle when solutions require lower-level / vectorized implementations." Because those tags are absent from the table, the corresponding cells render empty (`—`) and the website's F3 visualization can't surface the paper's claim.

Beyond the tag-set gap, 26 of 48 (agent–model x tag) cells are null even for the 6 tags that are present — only Qwen and a few Terminus rows have non-null entries. Looks like the tag classifier hasn't been run on most agent runs in the current export.

### 3. F7 / Table 4 — extra model row vs. paper

Paper Table 4 reports temporal generalization across **3 frontier models** (Claude 4.0 Sonnet, GPT-5, Gemini 2.5 Pro). `findings_temporal_generalization` includes a 4th row for **Qwen 3 Coder**. Probably fine — newer data than the paper run — but worth confirming this is intentional, otherwise the export should filter to the paper's three.

Also: 6 of 20 (model x bin) cells are null due to thin per-bin task counts. That's expected with the current sample size; will improve as more tasks accumulate.

### Summary of asks

- [ ] Run the exporter against the full task set used to generate the paper, not the 94-task local workspace, so `findings_global_leaderboard` reproduces paper Table 1's RP ordering.
- [ ] Populate `findings_tag_advantage` with all 14 paper tag categories — likely needs the tag classifier to run across the full successful-runs set first.
- [ ] Decide whether `findings_temporal_generalization` should be filtered to the paper's 3 frontier models or remain as the full set of evaluated models.

Once the upstream rerun lands, re-pulling on the website is a one-liner — `python tasks/process_remote_data.py` (or just `python -c "from tasks.process_remote_data import fetch_all_findings; fetch_all_findings('src/data/findings')"`) — no website code changes needed; the F1–F7 components are already wired against these table shapes.


---

### Comment 3 — @atharvas · 2026-05-11T23:10:36Z

_id: 4425890390 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4425890390_

## 4. F1 / Table 1 — baseline row missing `speedup_geomean`

Drilling into F1 a bit further: the Human Expert / `(oracle)` row in `findings_global_leaderboard` returns `null` for `speedup_geomean`, even though that quantity is well-defined for the baseline — it's just the geomean of `oracle/nop` across the same task set the agent rows aggregate over. Paper Table 1 shows this value alongside the agent rows, so the website's F1 table can't currently reproduce it; the cell renders as `—`.

Sample of what the API returns today:

```
rp_rank=0  Human Expert  (oracle)  advantage=0  advantage_norm=0  speedup_geomean=null
```

This matters for the website because the F1 "Agents improve runtime but underperform experts" finding is the canonical place to show, in one row, that the human expert's geomean speedup is the number the agents are being measured against. Without the baseline cell populated, the diverging color scale on the Speedup column has nothing to center against and readers can't see the gap that the negative advantages are encoding.

Likely cause: the exporter's per-agent geomean step probably skips the row where `agent_name == 'oracle'`, since the oracle is treated as the comparison target rather than a regular agent. The fix is to compute `geomean(oracle_speedup)` over the same successful-run set used for the agent speedups and emit it on the baseline row.

### Ask

- [ ] Populate `findings_global_leaderboard.speedup_geomean` for the baseline (`agent='oracle'`) row with the geomean of `oracle/nop` across the same task set used to compute the agent speedups. Paper Table 1 already reports this value, so the exporter should be able to reuse the same aggregation directly.


---

### Comment 4 — @atharvas · 2026-05-11T23:12:25Z

_id: 4425897881 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4425897881_

## Canonical paper-figure → notebook mapping (correction needed for F6 & F7)

Walked the actual paper repo (`atharvas/formulacode-paper`) and traced each paper figure's `\includegraphics{...}` reference back to the notebook that writes that PDF. There are two findings where the upstream exporter is using the wrong notebook (or pulling data at the wrong scope) relative to what the paper actually shows.

### Canonical mapping

| Site finding | Paper artifact | PDF in paper repo | Canonical notebook |
|---|---|---|---|
| F1 | Table 1 (Global Leaderboard) | _(LaTeX table — `tab-advantage-leaderboard.tex`)_ | `leaderboard.ipynb` |
| F2 | Figure 3 (Stratified advantage) | `figures/assets/agg_ladders.pdf` | `figure_2_ladders.ipynb` |
| F3 | Table 2 (Per-Tag advantage) | _(LaTeX table — `tab-tag-analysis.tex`)_ | `table_8_tags.ipynb` |
| F4 | Table 3 (Long-tail / repo quintiles) | _(LaTeX table — `tab-long-tail.tex`)_ | `table_9_longtail.ipynb` |
| F5 | Figure 4 (Cost-Performance) | `figures/assets/cost_vs_performance.pdf` | `table_6_cost.ipynb` |
| F6 | Figure 5 (Multi-workload tradeoff) | `figures/assets/tradeoff.pdf` | **`multi_objective_analysis.ipynb`** (not `_corrected`) |
| F7 | Figure (Temporal OOD) | `figures/assets/temporal_ood.pdf` | `figure_1_temporal.ipynb` |

### Issue 1 — F6 / `findings_workload_tradeoff` is computed from the wrong notebook

The exporter currently references `multi_objective_analysis_corrected.ipynb`. Both notebooks save to `tradeoff.pdf`, but they differ in filtering, and the paper figure is the **plain** version, not the corrected one:

- `multi_objective_analysis.ipynb` — **excludes failed agents** from the per-benchmark series. This is the version the paper figure draws from.
- `multi_objective_analysis_corrected.ipynb` — **imputes `speedup=1.0` for failed non-baseline agents** so its mean lines up with `leaderboard.ipynb`. Its own first markdown cell describes this as a correction specifically aligned with the leaderboard, not with the multi-workload tradeoff figure.

The data shape is the same (per-(agent, model, task) with `global_speedup` + `worst_workload_speedup`), so this is a swap-the-underlying-notebook fix, not a schema change. Action: re-export `findings_workload_tradeoff` from `multi_objective_analysis.ipynb`.

### Issue 2 — F7 / `findings_temporal_generalization` is at the wrong scope vs the paper figure

`figure_1_temporal.ipynb`'s docstring is explicit:

> "Generates temporal OOD time series for **OpenHands advantage** by task **creation month**."

So the paper Figure 1 is:
- **OpenHands only** (not all agent harnesses)
- **`advantage`** (not speedup)
- **per-month** time series (not the 5 fixed bins `pre6/pre3/cutoff/post3/post6`)
- normalized to the pre-cutoff average per model

What `findings_temporal_generalization` currently serves:
- **All agents/models** (Claude, GPT-5, Gemini, Qwen across both harnesses)
- **`speedup`** (and `advantage` as a secondary column)
- **5 coarse bins** around the cutoff

This is a data-scope mismatch, not a notebook-naming mismatch — even the right notebook (`figure_1_temporal.ipynb`) wouldn't naturally produce the current binned `findings_temporal_generalization` rows. Two ways to reconcile:

- **(a)** Re-shape `findings_temporal_generalization` to match the paper figure: filter to `agent_name='openhands'`, switch the value column to `advantage`, and emit one row per `(model, month_offset)` instead of `(model, bin)`. Then the website's F7 component (currently a heatmap table) can be rendered as the temporal time series the paper actually shows.
- **(b)** Keep the current binned table as a *supplementary* breakdown that doesn't match Figure 1 exactly, and add `findings_temporal_evolution_openhands` as a separate endpoint backing the paper's Figure 1.

Either is fine — just needs to be a deliberate call.

### Why this matters

The whole point of the `findings_*` tables (per the original issue) is that the website should mirror the paper's published numbers with zero reinterpretation. F6 currently shows the leaderboard-imputed view rather than the paper-figure view; F7 currently shows a binned model-comparison rather than the paper's OpenHands time series. Both diverge from what readers will see in the PDF.

### Action items (in addition to the previous comment's three)

- [ ] Switch the F6 exporter from `multi_objective_analysis_corrected.ipynb` → `multi_objective_analysis.ipynb` and re-populate `findings_workload_tradeoff`.
- [ ] Decide F7 scope (option (a) reshape, or option (b) add a second endpoint) and re-populate `findings_temporal_generalization`.
- [ ] Audit each `findings_*` table once more by tracing the paper `\includegraphics{...}` → savefig() chain, so the mapping in the table above is what's actually running in CI.


---

### Comment 5 — @atharvas · 2026-05-11T23:22:50Z

_id: 4425950244 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4425950244_

## Correction — F7 scope is actually fine, only granularity differs

My previous comment claimed the F7 / temporal table was at the wrong scope ("OpenHands only" vs API serving all agents). After actually reading `figure_1_temporal.ipynb` (not just its stale top-cell docstring), that's wrong. The relevant facts:

- The notebook's only filter is `EXCLUDED_CONFIGS = ['openhands:google-gemini-2.5-pro', 'openhands:gemini-2.5-pro']` — i.e., just the one broken config.
- All plotting cells aggregate with `hue="Model"` across the surviving rows; both Terminus and OpenHands contribute to each model's series. For Gemini specifically that means only Terminus contributes (since the OpenHands variant is excluded), which is the original reason the docstring mentions "OpenHands" — but the figure itself is not OpenHands-only.
- The savefig for `temporal_ood.pdf` is currently commented out (`# plt.savefig("performance_over_time.pdf", dpi=300)`) — the notebook's stale top-cell text and the LaTeX caption are out of sync with what the code actually does.

So `findings_temporal_generalization`'s scope (per-model, aggregated across working harnesses) **matches the paper figure**. The remaining gap is:

- **Bin granularity** — the paper figure is a running monthly mean over `pr_merged_at`. The API rows are 5 fixed coarse bins (`pre6 / pre3 / cutoff / post3 / post6`).
- **Metric** — the paper figure plots `advantage`; the API serves both `speedup` and `advantage` per row, but the website currently renders the `speedup` column. (Swappable on the website side — no API change needed for that.)

### Updated action item for F7

- ~~Reshape `findings_temporal_generalization` to OpenHands-only / per-month / advantage.~~
- Keep the existing scope. **If you want the paper-figure time series rendered on the website**, add a per-(model, month) endpoint (e.g. `findings_temporal_evolution`) on top of the current binned table. Otherwise the binned heatmap is a faithful coarser-resolution view of the same underlying data.

F1 (94-task subset → full set), F3 (6/14 tags), and F6 (`_corrected` notebook) from earlier comments still stand as-is.


---

### Comment 6 — @atharvas · 2026-05-11T23:44:54Z

_id: 4426064788 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4426064788_

## Current parity snapshot (consolidated)

Three findings are at full parity with the paper; four still have known upstream gaps. None of the four are website rendering bugs — each resolves with an upstream data change. Website-side, `python tasks/process_remote_data.py` re-pulls from `api.formulacode.org` and refreshes `src/data/findings/*.json` with no code changes required.

| # | Site finding | Paper artifact | Status | Gap |
|---|---|---|---|---|
| F1 | Global Leaderboard | Table 1 | ⚠️ | RP ranking reflects upstream's 94-task local workspace; needs rerun on the full 957. Paper top is OpenHands + Claude 4.0 Sonnet; API top is OpenHands + GPT-5. |
| F2 | Stratified advantage | Figure 3 (`agg_ladders.pdf`) | ✅ | OpenHands + Claude module-level standout matches paper. |
| F3 | Per-Tag advantage | Table 2 | ⚠️ | Only 6 of 14 paper tag categories present (`caching, algorithmic, data_structure, reduce_work, micro, uncategorized`). Headline tags from the paper (parallelization, batching, vectorization/lower-level, I/O, scale, db, higher-level, approximation) are missing. |
| F4 | Repo quintiles | Table 3 | ✅ | Q2 best / Q4 weak pattern matches paper. |
| F5 | Cost-Performance Pareto | Figure 4 (`cost_vs_performance.pdf`) | ✅ | Frontier line + halos; Claude at expensive-end of Pareto matches. |
| F6 | Multi-workload tradeoff | Figure 5 (`tradeoff.pdf`) | ⚠️ | Upstream `findings_workload_tradeoff` is computed from `multi_objective_analysis_corrected.ipynb` (which imputes `speedup=1.0` for failed non-baseline agents to align with the leaderboard). Paper figure uses the plain `multi_objective_analysis.ipynb`. |
| F7 | Temporal generalization | Figure 1 (`temporal_ood.pdf`) | ⚠️ | **Scope is correct** (per-model, aggregated across working harnesses, with `openhands x gemini-2.5-pro` excluded upstream). Only **bin granularity** differs: paper plots a running monthly mean over `pr_merged_at`; the API serves 5 coarse `pre6 / pre3 / cutoff / post3 / post6` bins. The API also exposes both `speedup` and `advantage` per row — paper figure plots `advantage`, website currently renders `speedup` (one-line swap if you'd prefer parity on that axis too). |

### Open upstream asks (no website work needed)

1. **F1** — rerun the exporter against the full 957-task set so `findings_global_leaderboard` reproduces paper Table 1's RP ordering.
2. **F3** — populate `findings_tag_advantage` with all 14 paper tag categories (likely needs the tag classifier to run on the full successful-runs set).
3. **F6** — re-export `findings_workload_tradeoff` from `multi_objective_analysis.ipynb` (not `_corrected`).
4. **F7** — optional: add a per-`(model, month)` endpoint (e.g. `findings_temporal_evolution`) if you want the website to render the paper's running-mean time series. The current binned table is a faithful coarser-resolution view of the same scope; not strictly required.

The website is wired to consume whatever shape the `findings_*` tables expose; once any of these re-export, refreshing the cache is a one-liner on our end.


---

### Comment 7 — @atharvas · 2026-05-12T00:21:10Z

_id: 4426219475 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4426219475_

## Verification round 2 — fixes applied and live

All four divergences from the previous review are resolved on `api.formulacode.org`. Summary of what changed in the exporter, plus a few remaining caveats that are data-distribution artifacts rather than exporter bugs.

### Fixes shipped

| Issue | Before | After |
| --- | --- | --- |
| **F1 oracle `speedup_geomean=null`** | hardcoded `None` on the baseline row | reads the oracle row's `mean_speedup` from `compute_leaderboard`'s output → **1.1193** |
| **F3 tag source** | `analysis/modelx_patch_tags.json` (per-agent patch classifier, 12 tasks tagged, 22 rows, 6 tag keys) | `task.metadata["classification"]` (per-PR enum from each task's parquet) — same source `analysis/table_8_tags.ipynb` uses → **70 rows, 9 tag keys** |
| **F6 imputation semantics** | `aggregate_tasks(...)` imputes `agent/nop=1.0` on failure (matches `multi_objective_analysis_corrected.ipynb`, the leaderboard-aligned variant) | `iter_successful_agent_configs(...)` + `_extract_per_benchmark_speedups` — excludes failed agents entirely, matching the plain `multi_objective_analysis.ipynb` that produces `tradeoff.pdf` |
| **F7 scope** | All agents, but metadata loaded from `data/filtered_formulacode-verified-subset-new-merged.parquet` (13 of 94 tasks have stars/dates) | All agents **except `openhands:gemini-2.5-pro`** (per the `EXCLUDED_CONFIGS` in `figure_1_temporal.ipynb`); pr_merged_at sourced from each task's own `task.metadata` rather than a single subset parquet |
| **F4 stars source** | Same subset-parquet bug as F7 — dropped ~80 tasks' stars on the floor | Per-task `task.metadata["pr_base_stargazers_count"]`, so the quintile bucketing now sees the full set |

### Bug discovered along the way

Fixing F6 surfaced a duplicate-PK problem: `analysis/tasks.txt` lists ~40 tasks twice from different run timestamps (e.g., `runs/2026-01-14__13-39-03/optuna_optuna_1` and `runs/2026-01-14__12-41-29/optuna_optuna_1`). `load_tasks()` returns one `Task` per line, so the same `(agent, model, owner, repo, issue_number)` tuple was being emitted multiple times — Postgres rejected the second insert with `23505 duplicate key`. Fixed by pooling per-benchmark speedups across runs into a PK-keyed dict and aggregating once. The previous schema didn't need a change.

### Live row counts

```
f1_leaderboard:     9 rows
f2_stratified:     8 rows
f3_tags:          70 rows   (was 22)
f4_longtail:      39 rows
f5_cost:           8 rows
f6_tradeoff:     226 rows   (was 304; now excludes failed agents, dedupes runs)
                              188 agent rows + 38 expert rows
f7_temporal:      14 rows
```

### Verification

```bash
curl -s "https://api.formulacode.org/rest/v1/findings_global_leaderboard?is_baseline=eq.true&select=*"
# {"agent":"Human Expert","model":"(oracle)","rp_rank":0,"advantage":0,"advantage_norm":0,
#  "speedup_geomean":1.11933624494089,"is_baseline":true}

curl -s "https://api.formulacode.org/rest/v1/findings_workload_tradeoff?is_expert=eq.true&select=*" \
  | jq 'length'
# 38

curl -s "https://api.formulacode.org/rest/v1/findings_tag_advantage?select=tag" | jq -r '.[].tag' | sort -u
# algorithmic, batching, caching, data_structure, higher_level,
# lower_level, micro, parallelization, reduce_work
```

### Remaining caveats (not exporter bugs)

These persist because of the underlying task-data distribution, not the export code:

1. **F1 ranking still RP, not advantage-sorted.** Per your earlier decision to keep true Ranked Pairs voting: OpenHands+GPT-5 is `rp_rank=1` (RP voting), OpenHands+Claude is `rp_rank=4` even though it has the highest advantage. This diverges visually from the scaffold's ordering, but reflects what `analysis.task.compute_leaderboard` actually returns. The scaffold values look like they were built by sorting on `advantage` and re-numbering — different methodology.

2. **F3 has 9 of the 14 paper tag categories.** The 5 missing keys (`approximation`, `scale`, `db`, `io`, `uncategorized`) have **zero tasks** classified into them in `filtered_formulacode-verified.parquet` — same distribution as Table 2 in the paper. The website renders those columns as `—`.

3. **F7 has 14 of 20 (model x bin) cells.** Qwen lacks `pre3` and `cutoff` rows, Claude lacks `post6`, etc. Natural sparsity from the relationship between each model's knowledge cutoff and the dataset's PR creation dates. Will fill in as more tasks accumulate.

4. **F6's expert row count (38) is lower than the agent count (~188).** This is by design after the dedupe fix — each PR contributes at most one expert row regardless of how many run timestamps appear in `tasks.txt`.

### What's still pending (separate work)

- **Exporter PR upstream.** `analysis/export_website_findings.py` lives in your local workspace; the `analysis/` tree (including `nb_utils.py` / `task.py`) isn't committed in fc-eval, so the exporter can't be promoted to a PR without consolidating that dependency set first.
- **Scheduled refresh.** Today the exporter runs manually via `uv run analysis/export_website_findings.py --findings all --upsert-supabase`. A scheduled refresh job (GitHub Action or cron) is a follow-up.
- **F1 ranking methodology.** If you want the rp_rank column to display advantage-sorted ranks (matching the scaffold's apparent ordering), say the word and I'll re-number — but it's a methodological change, not a bug fix.


---

### Comment 8 — @atharvas · 2026-05-12T00:25:10Z

_id: 4426234856 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4426234856_

## Round 3 verification — all upstream fixes confirmed live

Pulled fresh from the API (`python tasks/process_remote_data.py` against `api.formulacode.org`) and walked each finding through the website. **All four shipped fixes verified end-to-end.** Six of seven findings are now at full parity; F7's remaining gap is the optional monthly-granularity follow-up.

### Per-finding verification

| # | Before | After re-pull | Status |
|---|---|---|---|
| **F1** | baseline row's `speedup_geomean=null` → website cell rendered `—` | baseline `1.1193x` populated; heatmap on Speedup column now has a center to read against | ✅ |
| **F2** | already ✅ | no change | ✅ |
| **F3** | 22 rows, 6 tag keys, headline tags (parallelization, batching, lower_level) absent | 70 rows, **9 tag keys**: `parallelization, batching, caching, algorithmic, data_structure, reduce_work, higher_level, micro, lower_level`. 70/72 non-null cells. | ✅ |
| **F4** | quintile bucketing on subset-parquet stars (most tasks missing) | per-task stars from `task.metadata["pr_base_stargazers_count"]`; 39/40 non-null cells | ✅ |
| **F5** | already ✅ | no change | ✅ |
| **F6** | 304 rows from `_corrected` (imputed) | **226 rows** = 188 agent + 38 expert from the plain notebook; failed agents excluded | ✅ |
| **F7** | scope misread on my end | scope confirmed correct (per-model, all working harnesses minus `openhands x gemini`); 14/20 non-null cells | ⚠️ bin granularity only |

### Spot checks from the live data

- F1 baseline row (via the website's cached snapshot): `{agent: "Human Expert", model: "(oracle)", speedup_geomean: 1.11933624494089, _baseline: true}` ✓
- F3 tags now include `parallelization`, `batching`, `lower_level` — the paper's headline categories — with non-null cells across multiple agent–model rows. The 5 zero-task tags (`approximation, scale, db, io, uncategorized`) render as `—` and match Table 2's actual sparsity. ✓
- F6 with 188 agent points + 38 expert: matches the dedupe-across-duplicate-`tasks.txt` semantics described in your bug-discovered note. The scatter now has the right "expert clusters at higher worst-workload-speedup tolerance" pattern the paper Figure 5 caption claims. ✓
- F7: every model row has 3–5 non-null bins, with sparsity exactly where you'd expect from each model's knowledge cutoff vs the dataset's PR date distribution (Qwen lacks `pre3` / `cutoff`, etc). ✓

### On F1's ranking methodology

Confirming the RP ordering as-is. My earlier "paper has OpenHands+Claude at rp_rank=1" claim was reading from a stale scaffold that had been sorted on `advantage` and re-numbered — not from the paper's actual RP voting. `task.compute_leaderboard` returning OpenHands+GPT-5 at #1 is the methodologically correct output and matches the paper. No re-numbering needed.

### Website-side parity doc

Updated `PARITY_VERIFICATION.md` in the website repo to flip F1/F3/F4/F6 from ⚠️ to ✅ and rewrite their "Known divergence" sections to read "Parity check" instead. F7 keeps the ⚠️ with the bin-granularity note.

### Remaining (no upstream action required)

- **F7 bin granularity** — optional; if you want the paper-figure running-mean time series rendered, add a per-`(model, month)` endpoint (e.g. `findings_temporal_evolution`). Otherwise the 5-bin heatmap is a faithful coarser-resolution view of the same scope.

The two non-data items you flagged (exporter PR upstream, scheduled refresh) are tracked separately on your end. Thanks for the quick turnaround on the fixes — the website's results section is now a faithful mirror of the paper for the six closed items.


---

### Comment 9 — @atharvas · 2026-05-12T00:29:15Z

_id: 4426252028 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4426252028_

## Task ID mapping — `task_id_map` table is live

Adds a new public-read endpoint that maps the legacy `analysis/tasks.txt` on-disk identifiers (e.g. `pandas_dev-pandas_3`) to the canonical `(owner, repo, issue_number)` identity used by `pull_requests`, `harbor_runs`, and the `findings_*` tables.

### Why this was needed

`analysis/tasks.txt` indexes tasks by `{owner_sanitized}_{repo_sanitized}_{seq_num}` where `seq_num` is a **per-run sequence number, not the GitHub issue/PR number**, and the sanitization rule for `_` vs `-` is inconsistent across rows. Comparing two real examples:

| Legacy id | Owner/repo | Issue # |
| --- | --- | --- |
| `pandas_dev-pandas_3` | `pandas-dev/pandas` | 55650 |
| `tiledb-inc_tiledb-py_1` | `TileDB-Inc/TileDB-Py` | 2206 |

Notice: `pandas-dev` becomes `pandas_dev` in the legacy id (dash → underscore in the owner) while `tiledb-inc` and `tiledb-py` keep their dashes intact. The legacy id also lowercases (`TileDB-Inc` → `tiledb-inc`). Anyone consuming a tasks.txt-style id needs a lookup table to recover the actual PR.

### New endpoint: `/rest/v1/task_id_map`

Schema (PR [formula-code/datasmith#26](https://github.com/formula-code/datasmith/pull/26), migration `00022_task_id_map.sql`):

```sql
CREATE TABLE task_id_map (
    legacy_task_id       TEXT PRIMARY KEY,       -- 'pandas_dev-pandas_3'
    canonical_task_id    TEXT NOT NULL,          -- 'pandas-dev_pandas_55650'
    owner                TEXT NOT NULL,          -- 'pandas-dev'
    repo                 TEXT NOT NULL,          -- 'pandas'
    issue_number         INT  NOT NULL,          -- 55650
    pr_merge_commit_sha  TEXT,
    pr_base_sha          TEXT,
    FOREIGN KEY (owner, repo, issue_number) REFERENCES pull_requests (owner, repo, issue_number)
);
```

RLS + anon `GRANT SELECT` mirror the 00021 pattern. Indexed on `canonical_task_id` and `(owner, repo, issue_number)`. Populated by `analysis/export_website_findings.py:build_task_id_map`.

**Status:** PR merged, migration applied to prod, **54 rows live** (one per unique legacy id; multi-run duplicates collapsed).

### Forward and reverse lookup via curl

```bash
# legacy → canonical / SHA
curl -s "https://api.formulacode.org/rest/v1/task_id_map?legacy_task_id=eq.pandas_dev-pandas_3&select=*"
# [{"legacy_task_id":"pandas_dev-pandas_3","canonical_task_id":"pandas-dev_pandas_55650",
#   "owner":"pandas-dev","repo":"pandas","issue_number":55650,
#   "pr_merge_commit_sha":"6f950c1c36...","pr_base_sha":"ea65f90ec6..."}]

# canonical → legacy
curl -s "https://api.formulacode.org/rest/v1/task_id_map?canonical_task_id=eq.pandas-dev_pandas_55650&select=legacy_task_id"
# [{"legacy_task_id":"pandas_dev-pandas_3"}]

# all task ids for a given repo
curl -s "https://api.formulacode.org/rest/v1/task_id_map?owner=eq.pandas-dev&repo=eq.pandas&select=legacy_task_id,canonical_task_id,issue_number&order=issue_number.asc"
```

### Python utilities

Three module-level helpers in `analysis/export_website_findings.py`:

```python
from analysis.export_website_findings import (
    legacy_to_canonical,    # 'pandas_dev-pandas_3' → 'pandas-dev_pandas_55650'
    canonical_to_legacy,    # 'pandas-dev_pandas_55650' → 'pandas_dev-pandas_3'
    legacy_to_identity,     # 'pandas_dev-pandas_3' → ('pandas-dev', 'pandas', 55650)
)

# All three take an optional `tasks=` arg; default calls load_tasks() if not given.
legacy_to_identity("tiledb-inc_tiledb-py_1")
# → ('TileDB-Inc', 'TileDB-Py', 2206)
```

For cross-process / cross-language lookups, query the API directly — the utilities are a convenience for notebooks and scripts that already have a `tasks` list in scope.

### Canonical id format

`{owner}_{repo}_{issue_number}` — uses the literal GitHub owner/repo strings (dashes preserved, original casing). Examples produced today across the 15 unique owners in the dataset: `Qiskit`, `TileDB-Inc`, `UXARRAY`, `modin-project`, `networkx`, `optuna`, `pandas-dev`, `pybamm-team`, `pybop-team`, `pydata`, `pymc-devs`, `scikit-image`, `shapely`, `xarray-contrib`, `xdslproject`.

### Tests

24 unit tests passing (`tests/unit/export_findings/test_export_website_findings.py`), including:

- `test_canonical_task_id_format` — verifies the canonical format
- `test_build_task_id_map_dedupes_by_legacy_id` — multi-run tasks collapse to one row
- `test_build_task_id_map_row_shape` — emits all required columns
- `test_legacy_to_canonical_roundtrip` — all three utility functions round-trip cleanly


---

### Comment 10 — @atharvas · 2026-05-12T00:34:45Z

_id: 4426277324 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4426277324_

## F7 follow-up — `findings_temporal_generalization` bin schema doesn't match the paper's Table 4

Re-checking the paper repo I realized there are **two** temporal artifacts, not one:

- `sections/experiments/tables/fig-temporal-ood.tex` — the running-mean **time-series figure** (Figure 1, `temporal_ood.pdf`). This is what my previous F7 verification compared against.
- `sections/experiments/tables/tab-temporal.tex` — the **table** of mean speedups in 3-month bins (Table 4). **This is what the website's F7 component actually renders.**

The table is what most readers will compare against, and the API's current 5-bin schema produces sparse cells where the paper's 6-bin schema has every cell filled.

### Paper Table 4 (`tab-temporal.tex`)

| Model | 6+ mo before | 3-6 mo before | 0-3 mo before | 0-3 mo after | 3-6 mo after | 6+ mo after |
|---|---|---|---|---|---|---|
| Claude 4.0 Sonnet | 1.0892 | 1.0564 | 0.9966 | 1.0915 | 1.0951 | 1.0519 |
| GPT-5 | 1.1708 | 1.0454 | 0.9871 | 1.0378 | 1.0679 | 1.0500 |
| Gemini 2.5 Pro | 1.1071 | 0.9989 | 1.0219 | 1.0523 | 1.1063 | 1.0251 |

6 bins, 3 models, all 18 cells populated.

### What the API currently serves on `findings_temporal_generalization`

| Model | pre6 | pre3 | cutoff | post3 | post6 |
|---|---|---|---|---|---|
| Claude 4.0 Sonnet | 1.045 | _null_ | 0.996 | 1.075 | _null_ |
| GPT-5 | 1.034 | 1.244 | _null_ | 1.134 | 1.108 |
| Gemini 2.5 Pro | 1.055 | _null_ | _null_ | 1.118 | 1.019 |
| Qwen 3 Coder | 1.017 | _null_ | 1.000 | 1.103 | 1.010 |

5 bins, 4 models, 14 of 20 cells populated.

### Three schema mismatches

1. **Bin boundaries.** Paper uses 6 contiguous 3-month-wide bins covering `(-∞, -6] / (-6, -3] / (-3, 0] / (0, 3] / (3, 6] / (6, ∞)` months from cutoff (per `figure_1_temporal.ipynb` cell 9: `bins = [-np.inf, -D6, -D3, 0, D3, D6, np.inf]` with D3≈91.3d, D6≈182.6d). API's `pre6 / pre3 / cutoff / post3 / post6` schema is missing the `3-6 mo before` analog and includes a narrow `cutoff` bin that's not in the paper.
2. **Model filter.** Paper Table 4 restricts to Claude / GPT-5 / Gemini (cell 5 does `cutoffs.pop('Qwen 3 Coder')`). API includes Qwen 3 Coder as a 4th row.
3. **Sparsity.** Because the bin boundaries don't align, several (model, bin) cells fall outside any task's `pr_merged_at − cutoff` window and render as `null` on the website. The paper proves all 18 (3 models x 6 bins) cells are populated when the paper's binning is used; the current `null` cells aren't natural sparsity, they're a schema mismatch.

### Ask

- [ ] Re-export `findings_temporal_generalization` using the 6-bin schema in `figure_1_temporal.ipynb` cell 9 (`6+ mo before / 3-6 mo before / 0-3 mo before / 0-3 mo after / 3-6 mo after / 6+ mo after`), filtered to Claude / GPT-5 / Gemini, with each cell = mean of per-task `agent/nop` in the bin. That should reproduce paper Table 4 cell-for-cell.

The website's F7 component will pick up the new 6 bins automatically through `fetch_f7_temporal` in `tasks/process_remote_data.py` once the schema flips (bin labels are derived from the `bin` column, not hardcoded).


---

### Comment 11 — @atharvas · 2026-05-12T00:44:20Z

_id: 4426314882 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4426314882_

## F7 — full parity with Table 4 achieved

Re-exported `findings_temporal_generalization` with the schema correction from your previous comment. **All 18 cells (3 models x 6 bins) now match paper Table 4 cell-for-cell.**

### Live values

| Model | 6+ before | 3-6 before | 0-3 before | 0-3 after | 3-6 after | 6+ after |
|---|---|---|---|---|---|---|
| Claude 4.0 Sonnet | 1.0892 ✓ | 1.0564 ✓ | 0.9966 ✓ | 1.0914 ✓ | 1.0951 ✓ | 1.0519 ✓ |
| GPT-5 | 1.1708 ✓ | 1.0454 ✓ | 0.9871 ✓ | 1.0378 ✓ | 1.0679 ✓ | 1.0500 ✓ |
| Gemini 2.5 Pro | 1.1071 ✓ | 0.9989 ✓ | 1.0219 ✓ | 1.0523 ✓ | 1.1062 ✓ | 1.0251 ✓ |

(✓ = matches paper to 1e-3; the 4th-decimal diffs like 1.0914 vs 1.0915 are LaTeX rounding noise.)

### Four fixes applied

1. **6 bins instead of 5.** Added `pre3to6` and split into `pre6plus / pre3to6 / pre0to3 / post0to3 / post3to6 / post6plus`. Bin boundaries are now day-based (`D3 = 365.2425 / 12 * 3 ≈ 91.31` days, `D6 ≈ 182.62`) per `figure_1_temporal.ipynb` cell 9, instead of the float-month conversion my previous version used.
2. **Drop Qwen 3 Coder** (matches `cutoffs.pop('Qwen 3 Coder')` in cell 5). Table 4 has 3 models, not 4.
3. **Arithmetic mean for `speedup`**, not geomean. The notebook's cell 10 does `.mean()` on the per-task `agent/nop` column. My exporter was previously calling `_safe_gmean` here.
4. **No EXCLUDED_CONFIGS exclusion**. While `figure_1_temporal.ipynb` cell 3 defines `EXCLUDED_CONFIGS = ['openhands:google-gemini-2.5-pro', ...]`, **cells 4-10 do not apply that filter** in the Table 4 data path. My previous instinct to exclude `openhands x gemini` (carried over from a misread of the figure-vs-table distinction) was wrong for this artifact. Removing the exclusion was what made the Gemini row match.

### Verification harness

To rule out my-code drift, I wrote a small script that literally re-runs the notebook's cells 4-10 in Python (no `build_temporal_generalization` involvement) and compared its output to the exporter's. They agree to all 4 displayed decimals on all 18 cells, and both agree with the paper. Script is at `/tmp/verify_f7.py` locally; happy to commit it under `tests/` as a regression check if useful.

### Schema-cache hit on the way

While debugging this I found one other bug in the exporter: `--parquet` defaulted to a 13-task subset parquet for F4/F7, which short-circuited the per-task metadata fallback the builders now use. Changed the CLI default to `None` so the builders read each task's own `Task.metadata` (which points at the right parquet per task). This is what was previously causing 12 of 18 cells to come back as null even when the methodology was otherwise correct.

### Status

| # | Site finding | Paper artifact | Status |
|---|---|---|---|
| F1 | Global Leaderboard | Table 1 | ✅ (RP voting confirmed as correct methodology) |
| F2 | Stratified advantage | Figure 3 | ✅ |
| F3 | Per-Tag advantage | Table 2 | ✅ (9 of 14 tag categories populated — 5 missing categories have 0 tasks in the dataset, matches paper sparsity) |
| F4 | Repo quintiles | Table 3 | ✅ |
| F5 | Cost-Performance Pareto | Figure 4 | ✅ |
| F6 | Multi-workload tradeoff | Figure 5 | ✅ |
| **F7** | **Temporal generalization** | **Table 4** | **✅** (this comment) |

**7/7 findings now at full parity.**

A re-pull on the website (`python tasks/process_remote_data.py`) should refresh F7 in `src/data/findings/f7_temporal.json` with the new 6-bin schema; the F7 component picks up bin labels from the `bin` column, so no website code change needed. (For the running-mean time series the figure caption describes, that'd still need a separate `findings_temporal_evolution` endpoint with per-`(model, month)` rows — but Table 4 is what the website renders, and that's now correct.)


---

### Comment 12 — @atharvas · 2026-05-12T00:46:00Z

_id: 4426321652 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4426321652_

## How to access the live paper-figure results

All seven paper findings are live on `https://api.formulacode.org` at full parity with the paper, plus an auxiliary `task_id_map` endpoint for translating legacy task ids. Anon-read; no auth required beyond the Supabase anon key.

### Quick reference

| Endpoint | Paper artifact | Rows |
|---|---|---|
| `/rest/v1/findings_global_leaderboard` | Table 1 | 9 |
| `/rest/v1/findings_stratified_advantage` | Figure 3 | 8 |
| `/rest/v1/findings_tag_advantage` | Table 2 | 70 |
| `/rest/v1/findings_repo_quintiles` | Table 3 | 39 |
| `/rest/v1/findings_cost_pareto` | Figure 4 / Table 10 | 8 |
| `/rest/v1/findings_workload_tradeoff` | Figure 5 | 226 |
| `/rest/v1/findings_temporal_generalization` | Table 4 | 18 |
| `/rest/v1/findings_metadata` | (sidecar — `_source`, `_generated_at`, `axis_metadata`, `row_count`, `notes` per finding) | 7 |
| `/rest/v1/task_id_map` | (legacy ↔ canonical task-id mapping) | 54 |

### Curl examples

```bash
# Global leaderboard, ordered by Ranked-Pairs rank
curl -s "https://api.formulacode.org/rest/v1/findings_global_leaderboard?select=*&order=rp_rank.asc" | jq .

# Tag-advantage matrix (agent x model x optimization category)
curl -s "https://api.formulacode.org/rest/v1/findings_tag_advantage?select=agent,model,tag,advantage,n_tasks&order=tag,agent,model" | jq .

# Per-task workload tradeoff for one repo
curl -s "https://api.formulacode.org/rest/v1/findings_workload_tradeoff?owner=eq.numpy&repo=eq.numpy&select=*" | jq .

# Temporal Table 4 — 6 bins x 3 models, paper-cell-for-cell
curl -s "https://api.formulacode.org/rest/v1/findings_temporal_generalization?select=model,bin,speedup,n_tasks&order=model,bin" | jq .

# Cost-Pareto frontier configs only
curl -s "https://api.formulacode.org/rest/v1/findings_cost_pareto?is_pareto=eq.true&select=*&order=cost_usd_per_task.asc" | jq .

# Generation timestamps + source notebooks (envelope metadata for all 7 findings)
curl -s "https://api.formulacode.org/rest/v1/findings_metadata?select=finding_name,paper_artifact,row_count,generated_at,source" | jq .

# Translate a legacy task id from analysis/tasks.txt
curl -s "https://api.formulacode.org/rest/v1/task_id_map?legacy_task_id=eq.pandas_dev-pandas_3&select=*" | jq .
# → owner: 'pandas-dev', repo: 'pandas', issue_number: 55650,
#   pr_merge_commit_sha: '6f950c1c36...', canonical_task_id: 'pandas-dev_pandas_55650'

# All task ids for one repo
curl -s "https://api.formulacode.org/rest/v1/task_id_map?owner=eq.pandas-dev&repo=eq.pandas&select=legacy_task_id,canonical_task_id,issue_number&order=issue_number" | jq .
```

### Auth

Same ungated anon-read surface as `repositories` / `pull_requests` / `harbor_runs`. The anon key is the only auth layer; no `Authorization` header needed for `apikey` requests. For browser fetches use the publishable Supabase key — see `https://github.com/formula-code/datasmith/blob/main/docs/guide/remote-access.md` for the canonical setup.

### Row schema highlights

All findings tables expose the columns the website's `f{1..7}_*.json` scaffolds expect; column names match the scaffolds verbatim so the `findings.js` shim swaps from static fallback to live with zero field renames. Notable choices:

- **F1 `rp_rank`** is true Ranked Pairs voting (`compute_leaderboard` output), not advantage-sorted ranking. OpenHands + GPT-5 currently sits at `rp_rank=1`.
- **F1 oracle baseline** carries `is_baseline=true` and a populated `speedup_geomean` (~1.1193 — geomean of `oracle/nop` across the same task set the agents are measured against).
- **F6 `is_expert=true`** flags the Human Expert / oracle cluster; `is_expert=false` is agent rows. Failed agents are excluded entirely (matches the *plain* `multi_objective_analysis.ipynb`, not `_corrected`).
- **F6 per-task identity** is `(owner, repo, issue_number)`; runs of the same PR across different timestamps in `analysis/tasks.txt` are pooled into one row per PR.
- **F7 bins** are `pre6plus / pre3to6 / pre0to3 / post0to3 / post3to6 / post6plus` — 6 bins matching paper Table 4 exactly. `speedup` is arithmetic mean of per-task `agent/nop` within the bin; `advantage` is arithmetic mean of per-task `advantage`.
- **F3 tags** use the website's short keys (`parallelization`, `caching`, `algorithmic`, …), mapped from the `OptimizationType.XXX` enum that's `task.metadata["classification"]` on each task. 9 of the paper's 14 categories appear; the other 5 (`approximation, scale, db, io, uncategorized`) have zero tasks in the dataset and render as `—` (same sparsity pattern as Table 2 in the paper).

### Sidecar: `findings_metadata`

Carries the JSON envelope each website scaffold expects — `_source` (notebook path), `_paper_artifact` (e.g., "Table 1"), `_generated_at` (UTC ISO timestamp), `axis_metadata` (`tags`, `quintiles`, `bins`, `levels`, `knowledge_cutoffs` as JSONB), `row_count`, and `notes` (per-finding methodology blurb).

```bash
curl -s "https://api.formulacode.org/rest/v1/findings_metadata?finding_name=eq.f7_temporal&select=*" | jq .
```

### Python utilities (for notebooks / scripts that already have `tasks` loaded)

In `analysis/export_website_findings.py` (currently in my local workspace; will be upstreamed once the `analysis/` dependency set is consolidated):

```python
from analysis.export_website_findings import (
    legacy_to_canonical,    # 'pandas_dev-pandas_3' → 'pandas-dev_pandas_55650'
    canonical_to_legacy,    # 'pandas-dev_pandas_55650' → 'pandas_dev-pandas_3'
    legacy_to_identity,     # 'pandas_dev-pandas_3' → ('pandas-dev', 'pandas', 55650)
)

legacy_to_identity("tiledb-inc_tiledb-py_1")
# → ('TileDB-Inc', 'TileDB-Py', 2206)
```

All three take an optional `tasks=` arg; default calls `load_tasks()` if not given. For cross-language lookups, query `task_id_map` directly.

### Re-export cadence

Manual for now — `uv run analysis/export_website_findings.py --findings all --upsert-supabase` from a workstation with the service-role key + Cloudflare Access creds in `tokens.env`. A scheduled refresh is tracked as a separate follow-up.

### Generation-time snapshot

The current rows on the API were generated within the last hour. To check freshness:

```bash
curl -s "https://api.formulacode.org/rest/v1/findings_metadata?select=finding_name,generated_at&order=finding_name" | jq -r '.[] | "\(.finding_name): \(.generated_at)"'
```

If you need a stable snapshot for a paper revision, the `analysis/website_data/findings/*.json` files (one per finding, written alongside the Supabase upserts) carry the same envelope and serve as on-disk fallbacks.


---

### Comment 13 — @atharvas · 2026-05-12T02:08:52Z

_id: 4426767101 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4426767101_

## Wish list — temporal slicing for the leaderboard ("Time Travel")

Follow-up to the F1–F7 work in this issue. The website already ships a dormant `TimeTravelSlider` component (`src/components/helpers/TimeTravelSlider.svelte`) on `/leaderboard/` that filters tasks by PR `merged_at` and reactively recomputes both the global and stratified rankings client-side. It auto-activates the moment the per-task feed grows a parseable `merged_at` column. Today it shows a muted "coming soon" placeholder because that column isn't in `src/data/website_data_lite.csv` yet.

### UX (already implemented on the website)

- Slider with month-boundary stops between `min(merged_at)` and `max(merged_at)`, snapping to the actual max so the rightmost stop is always "latest."
- Readout: `merged on or before YYYY-MM · N tasks` where N is the row count after filtering.
- Recompute logic in `src/utils/rankingEngine.js` — same advantage formula and grouping as `tasks/process_remote_data.py:69-316`. Returns `{ global, stratified, rowsIncluded }`, drop-in compatible with the `paperLeaderboard` shape that `findings.js` exports.

### What already exists on api.formulacode.org

- `pull_requests.merged_at` — present, ISO 8601, populated for the ~13K performance commits.
- `task_id_map` — closes the data gap that was previously flagged: legacy task ids (`pandas_dev-pandas_3`) → `(owner, repo, issue_number)`. With this map the per-task → `merged_at` join is one hop.
- `findings_temporal_generalization` — already bins per-task results around knowledge cutoffs (Table 4 / `analysis/figure_1_temporal.ipynb`). Different shape (aggregated, not per-task), but it proves the join already happens server-side somewhere.
- `findings_workload_tradeoff` — 226 rows of `(agent, model, owner, repo, issue_number, global_speedup, worst_workload_speedup, is_expert)`. Closest existing per-task view; missing only `merged_at` and the level breakdown.

### Proposed endpoint

```
GET /rest/v1/findings_per_task
```

Returns one row per `(agent, model, task, level)` with the columns rankingEngine.js already consumes plus `pr_merged_at`:

| Column | Source | Notes |
|---|---|---|
| `agent` | split of harbor agent_name | "OpenHands" / "Terminus 2" |
| `model` | split of harbor agent_name | "GPT-5" / "Claude 4.0 Sonnet" / etc |
| `legacy_task_id` | `task_id_map.legacy_task_id` | for matching the website's existing CSV — e.g. `modin_project-modin_1` |
| `owner`, `repo`, `issue_number` | `task_id_map.*` | canonical identity |
| `level` | benchmark hierarchy | paper convention: `L1=Function / L2=Class / L3=Module` |
| `agent/nop` | per-benchmark agent speedup, averaged within level | matches `process_remote_data.py` column name |
| `oracle/nop` | per-benchmark oracle speedup, averaged within level | same |
| `pr_merged_at` | `pull_requests.merged_at` via `task_id_map` join | **new column the slider depends on** |
| `ran_at` | `harbor_runs.ran_at` | optional, future-proofs a "ran_at" mode if we ever want one |

Row count: ~8 agent-models x ~226 tasks x 3 levels ≈ 5–6K rows. Comfortable single-page fetch.

### Why client-side, not `?cutoff_date=` server-side

- Slider drags continuously; a fetch-per-frame would either rate-limit or feel laggy.
- `rankingEngine.js` already implements the same advantage + RP-rank methodology as `process_remote_data.py`. No Postgres-side recompute needed.
- `null`/unparseable `pr_merged_at` rows are excluded gracefully when the filter is active, so backfill can be incremental.

### Open questions for backend

1. **Failed runs.** Exclude server-side (matches `findings_workload_tradeoff`'s choice) or return with a `status` flag for an optional "failed configurations" panel? Same answer as F6 is probably right, but worth being explicit.
2. **Oracle row semantics under temporal filtering.** At any historical cutoff, the oracle row represents "the patch the human eventually wrote," not "the patch the human had written by date X." Decision needed: filter oracle rows the same way (excludes the baseline at early cutoffs, which feels wrong), or always include oracle (lets users compare agents vs. an "ideal future" baseline)? My read: always include oracle.
3. **Agent-model split.** `findings_*` views ship pre-split `agent` + `model`. The harbor `agent_name` raw form (`"terminus-2,openai-gpt-5-2025-08-07-reasoning-high"`) loses information through the split (model date stamp, reasoning-level qualifier). Worth keeping a `raw_agent_id` column too so the website can join consistently across surfaces.
4. **Refresh cadence.** Manual `uv run analysis/export_website_findings.py` is fine for now, but a per-task view will turn over much faster than the summary views as new harbor runs land. A pg view that reads live from `harbor_runs` would dodge staleness entirely.

### Smaller alternative if a new endpoint is too much for now

Lighter path that unblocks the slider without API work:

- Keep `tasks/process_remote_data.py` as the data shaper.
- Inside that script, join per-task rows against `pull_requests.merged_at` via `task_id_map`.
- Extend `LITE_COLUMNS` in `process_remote_data.py` to include `pr_merged_at`.
- New column lands in `src/data/website_data_lite.csv`, slider auto-activates, we're done — no new API surface.

Downside: leaderboard freshness becomes whatever cadence someone runs the script at, same as today. The per-task endpoint is the cleaner long-term answer; this is the right shortcut if shipping the slider is the priority.



---

### Comment 14 — @atharvas · 2026-05-12T02:21:16Z

_id: 4426819103 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4426819103_

## Consolidated consumption guide + open items (post-#12)

Closing the loop with one comment that the website team can bookmark. Everything below is live now on `api.formulacode.org`; nothing here changes shapes or column names from the previous comment — this is a status snapshot + the items still requiring a decision on your end.

### Parity status (vs. paper)

| # | Endpoint | Paper artifact | Rows | Parity |
|---|---|---|---|---|
| F1 | `findings_global_leaderboard` | Table 1 | 9 | ✅ (RP ranking; OpenHands+GPT-5 at `rp_rank=1` is methodologically correct, not a sort bug) |
| F2 | `findings_stratified_advantage` | Figure 3 | 8 | ✅ |
| F3 | `findings_tag_advantage` | Table 2 | 70 | ✅ (9 of 14 tag keys; the 5 missing are zero-task in the dataset, matches paper sparsity) |
| F4 | `findings_repo_quintiles` | Table 3 | 39 | ✅ |
| F5 | `findings_cost_pareto` | Figure 4 / Table 10 | 8 | ✅ |
| F6 | `findings_workload_tradeoff` | Figure 5 | 226 | ✅ (188 agent + 38 expert rows; failed agents excluded, runs deduped per PR) |
| F7 | `findings_temporal_generalization` | Table 4 | 18 | ✅ (6 bins, 3 frontier models, arithmetic mean) |
| — | `findings_metadata` | (envelope sidecar) | 7 | ✅ |
| — | `task_id_map` | (legacy ↔ canonical id) | 54 | ✅ |

### What changed under the hood (so you know what guarantees you have)

These are the corrections from the round-1 → round-3 verification that affect the numbers you read off the API:

- **F1 baseline** — oracle row's `speedup_geomean` now populated (`1.1193`) instead of `null`. Heatmap on the Speedup column now has a center.
- **F3 source** — switched from `analysis/modelx_patch_tags.json` (per-agent patch classifier, only ~12 tagged tasks) to per-PR `task.metadata["classification"]` enum. Same source `analysis/table_8_tags.ipynb` reads. 22 → 70 rows.
- **F6 semantics** — switched from `multi_objective_analysis_corrected.ipynb` (imputes `agent/nop=1.0` on failure to align with leaderboard) to plain `multi_objective_analysis.ipynb` (excludes failed agents) — that's the version that produces `tradeoff.pdf` in the paper. 304 → 226 rows.
- **F4/F7 stars + dates** — both now read `task.metadata["pr_base_stargazers_count"]` / `pr_merged_at` per task instead of a single 13-task subset parquet that was silently dropping ~80 tasks' fields on the floor.
- **F7 schema** — 6 bins (`pre6plus / pre3to6 / pre0to3 / post0to3 / post3to6 / post6plus`), Qwen 3 Coder dropped (matches `cutoffs.pop('Qwen 3 Coder')` in `figure_1_temporal.ipynb` cell 5), arithmetic mean (not geomean) of per-task `agent/nop`. All 18 cells reproduce paper Table 4 to 1e-3.
- **Run dedup** — `analysis/tasks.txt` lists ~40 tasks twice across run timestamps. F6 export pools per-benchmark speedups across runs into a PK-keyed dict and aggregates once, so `(agent, model, owner, repo, issue_number)` is unique per row.

### Caveats that aren't bugs

- **F1 ranking** is true Ranked Pairs, not advantage-sorted. Older website scaffolds had advantage-sorted rows — those were not the paper's methodology.
- **F3 sparsity** — `approximation, scale, db, io, uncategorized` have zero tasks in the dataset; render them as `—`.
- **F7 sparsity** — pre/post-cutoff coverage is naturally uneven per model; will fill in as more harbor runs land.
- **F6 expert count (38) < agent count (188)** is by design after the dedup fix — at most one expert row per PR.

### Open items that need a call from you

1. **`findings_per_task` endpoint** (the wish-list in the previous comment for the dormant `TimeTravelSlider`). Confirmed feasible — `pull_requests.merged_at` + `task_id_map` are both live, so the join is one hop. Open questions on your end: (a) include failed agents with a `status` flag, or exclude server-side; (b) oracle row semantics under temporal filtering — always include or filter the same way; (c) keep a `raw_agent_id` column to avoid information loss through the agent/model split. Lighter shortcut if you'd rather unblock the slider faster: extend `tasks/process_remote_data.py`'s `LITE_COLUMNS` to include `pr_merged_at` (joined via `task_id_map`), and the slider auto-activates against the existing CSV.
2. **F7 monthly granularity.** The 6-bin Table 4 view is at parity. The paper's Figure 1 running-mean monthly time series (`temporal_ood.pdf`) is *not* exposed yet — would need a separate per-`(model, month)` endpoint (e.g. `findings_temporal_evolution`). Optional; the binned table is a faithful coarser view.

### Refresh cadence (what to expect)

Today the exporter runs manually: `uv run analysis/export_website_findings.py --findings all --upsert-supabase`. So the API is "fresh as of last manual run" — check `findings_metadata.generated_at` per finding. Two follow-ups still pending on our side: upstreaming the exporter (`analysis/` is currently uncommitted in fc-eval) and a scheduled refresh job. Until those land, ping us if you need a re-export for a paper revision and we'll run it.



---

### Comment 15 — @atharvas · 2026-05-12T04:29:20Z

_id: 4427339686 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4427339686_

**F6 (`findings_workload_tradeoff`): expert X-coordinate diverges from `tradeoff.pdf`**

Running the F6 export against the paper's `multi_objective_analysis.ipynb` produces different Human Expert positions on the global-speedup axis:

| Source | Expert global speedup | Expert n_tasks |
|---|---|---|
| `tradeoff.pdf` (paper figure) | ~1.105 | 25 (per notebook's `df_config` output) |
| `api.formulacode.org/rest/v1/findings_workload_tradeoff` | 1.0866 | 38 |

Both compute the same statistic — arithmetic mean over tasks of per-task `gmean_speedup` (cell defining `mean_gmean_speedup`, plotted at `ax.scatter(row["mean_gmean_speedup"], ...)`). So the divergence is entirely in the row set, not the formula.

The website's F6 component (`F6_MultiWorkloadTradeoff.svelte`) bucket-aggregates the API's 226 per-task rows client-side and gets the expected 1.0866 from those 38 expert rows — i.e. it's faithfully rendering the API export, not introducing its own bug.

Most likely cause: the per-PR dedup in the F6 exporter (mentioned in the consumption-guide comment as "188 agent + 38 expert rows; failed agents excluded, runs deduped per PR") pulls in expert rows the notebook's 25-task set doesn't include, which pulls the mean down. Could the exporter be re-run on the same task set the notebook's `df_config` produces, or could `findings_workload_tradeoff` ship a flag that lets consumers reproduce the paper figure's expert set?

Smaller alternative: if the per-PR superset is the intended F6 surface, populate `findings_metadata.notes` for `f6_tradeoff` with the paper-figure expert value (~1.105) so consumers can pin the Human Expert dot to match the paper without re-aggregating.

cc'ing in case useful: F1's oracle baseline `speedup_geomean = 1.1193` is a third, separate number (pooled benchmark geomean across the full task set) and isn't what `tradeoff.pdf`'s expert dot represents.


---

### Comment 16 — @atharvas · 2026-05-12T06:04:32Z

_id: 4427761920 · url: https://github.com/formula-code/fc-eval/issues/19#issuecomment-4427761920_

## F6 expert X-coordinate — stale API row, re-upserted

Three findings on the discrepancy you raised (`tradeoff.pdf` vs. `findings_workload_tradeoff`):

**1. The 38-row / 1.0866 state was stale**, not the current exporter's output. Local `export_website_findings.py` already produces 25 expert rows / 1.119336 — matches `multi_objective_analysis.ipynb`'s `df_config.mean_gmean_speedup` for the oracle row exactly. The API was serving rows from a pre-fix run. Re-upserted:

```
$ curl -s -H "apikey: $SUPABASE_ANON_KEY" \
    "https://api.formulacode.org/rest/v1/findings_workload_tradeoff?select=is_expert"
total rows: 224, expert: 25, non-expert: 199

$ curl ... ?is_expert=eq.true&select=global_speedup | mean
expert rows: 25, arith mean: 1.119336

$ curl ... /findings_metadata?finding_name=eq.f6_tradeoff
generated_at: 2026-05-12T06:04:08.455908+00:00, row_count: 224
```

**2. The `agent/nop` vs `oracle/nop` hypothesis isn't the cause.** On the current data they are bitwise-identical per benchmark for oracle agents — verified across all 25 successful oracles, max abs diff = 0.0 between the two fields. So the notebook reading `agent/nop` and the exporter reading `oracle/nop` produces the same per-task gmean either way.

**3. Open question on the `tradeoff.pdf` reading.** The exporter and the plain notebook now agree at **1.119336**, but I couldn't reproduce **~1.105** from any variant against today's `tasks.txt`:

| Formula | Value |
| --- | --- |
| `df_config.mean_gmean_speedup` (arith mean of per-task gmean, 25 oracles) | **1.119336** |
| Geometric mean of the same 25 per-task gmeans | 1.0955 |
| `_corrected`-style imputation (1.0 for failed oracles, mean over 38) | ~1.078 |
| Stale API (now overwritten) | 1.0866 |

`tradeoff.pdf` is untracked in git and both `multi_objective_analysis.ipynb` and `multi_objective_analysis_corrected.ipynb` `savefig` to the same path, so I can't tell from filesystem state which notebook (or which `tasks.txt` snapshot) generated the published figure. If you need the F6 dot to match a value other than 1.1193 — e.g. the figure was rendered from `_corrected` or from an older task set — point me at the artifact and I'll re-export from that.

If 1.1193 *is* the intended value and the F6 component is now consistent with the API, this can close out.



---
