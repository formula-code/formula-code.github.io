# Parity verification: paper ↔ website

This document tracks whether each finding rendered on the FormulaCode landing page faithfully reproduces its corresponding artifact (figure or table) in the paper. It is intended as a maintenance reference: when something looks off, this is where you look first.

The website is meant to be a **mirror** of the paper's results, not a re-derivation. Every site-side finding should trace back to a specific notebook in `_repos/fc-eval/analysis/`, which writes a specific PDF asset in `atharvas/formulacode-paper`, which is `\includegraphics{...}`'d by a specific `.tex` figure or table wrapper. If any of those links break, the finding is out of parity.

## Status at a glance

Legend: ✅ = matches paper · ⚠️ = partial / known divergence · ❌ = wrong (needs fix)

| # | Site finding | Paper artifact | Status | What still differs |
|---|---|---|---|---|
| F1 | Agents improve runtime but underperform experts | Table 1 (Global Leaderboard) | ✅ | Baseline `speedup_geomean` (1.1193) now populated; RP ranking is what `task.compute_leaderboard` returns — methodologically the same as the paper. |
| F2 | Local vs global optimization | Figure 3 (Stratified advantage) | ✅ | Module-level standout for OpenHands+Claude matches paper. |
| F3 | Optimization strategy strengths | Table 2 (Per-Tag advantage) | ✅ | 9 of 14 tags populated; the remaining 5 (`approximation, scale, db, io, uncategorized`) have zero tasks classified in `filtered_formulacode-verified.parquet` — matches paper's actual distribution. Headline tags (parallelization, batching, lower_level) are all present. |
| F4 | Long-tail repository performance | Table 3 (Repo popularity quintiles) | ✅ | Per-task stars sourced from `task.metadata["pr_base_stargazers_count"]`; 39/40 cells populated. Q2 best / Q4 weak matches paper. |
| F5 | Cost efficiency | Figure 4 (Cost-Performance Pareto) | ✅ | Frontier line + halos; Claude at expensive-end of Pareto matches. |
| F6 | Multi-workload tradeoffs | Figure 5 (Multi-workload tradeoff) | ✅ | Re-exported from plain `multi_objective_analysis.ipynb` (excludes failed agents). 226 rows = 188 agent + 38 expert. |
| F7 | Temporal generalization | Table 4 (Temporal analysis) | ⚠️ | Schema now matches paper Table 4's 6-bin layout (`6+ mo before` … `6+ mo after`) and Qwen 3 Coder is excluded — 3 models x 6 bins. **11 of 18 cells populated** vs paper's 18/18; the 7 nulls reflect the upstream task set being sparser per bin than the paper's run. Will fill in as more tasks ingest. |

Open upstream issue tracking the divergences: [`formula-code/fc-eval#19`](https://github.com/formula-code/fc-eval/issues/19).

## Per-finding details

### F1 — Table 1 (Global Leaderboard)

| | |
|---|---|
| Paper section | `sections/experiments/tables/tab-advantage-leaderboard.tex` |
| Paper asset | _(LaTeX table — no PDF)_ |
| Canonical notebook | `_repos/fc-eval/analysis/leaderboard.ipynb` |
| API table | `findings_global_leaderboard` |
| Website component | `src/components/sections/findings/F1_GlobalLeaderboard.svelte` |
| Cached JSON | `src/data/findings/f1_leaderboard.json` |
| Render style | Heatmap table — RP rank, agent, model, advantage (diverging RdBu @ 0), speedup geomean (diverging RdBu @ 1x) |

**Parity check:** Baseline row's `speedup_geomean` now shows **1.1193x** (was previously `null`), so the diverging color scale on the Speedup column has a center to read against. The RP ordering is what `analysis.task.compute_leaderboard` returns — that's the paper's methodology (Ranked Pairs voting), not advantage-sorted. The earlier-flagged "Claude at rp_rank=1" expectation came from a stale scaffold that had been sorted on advantage rather than computed via RP.

### F2 — Figure 3 (Stratified advantage)

| | |
|---|---|
| Paper section | `sections/experiments/tables/fig-agg-advantage-ladders.tex` |
| Paper asset | `figures/assets/agg_ladders.pdf` |
| Canonical notebook | `_repos/fc-eval/analysis/figure_2_ladders.ipynb` |
| API table | `findings_stratified_advantage` |
| Website component | `src/components/sections/findings/F2_StratifiedAdvantage.svelte` |
| Cached JSON | `src/data/findings/f2_stratified.json` |
| Render style | Slope chart, straight segments, color by model + dash by harness (OpenHands dashed, Terminus solid), legend below |

**Level naming gotcha:** The API encodes `level1` = Function, `level2` = Class, `level3` = Module, `level4` = overall. The paper's ℓ∈{1,2,3} is coarse→fine (Module→Class→Function), so the website remaps `[level3→Module, level2→Class, level1→Function]` in `f2_stratified.json`. If the API renames its columns, update `fetch_f2_stratified` in `tasks/process_remote_data.py`.

**Visual sanity:** OpenHands + Claude 4.0 Sonnet should have a noticeably high left endpoint at Module (~+0.30). Other configs should slope flat or rise from Module → Function. Matches the paper's caption.

### F3 — Table 2 (Per-Tag advantage)

| | |
|---|---|
| Paper section | `sections/experiments/tables/tab-tag-analysis.tex` |
| Paper asset | _(LaTeX table — no PDF)_ |
| Canonical notebook | `_repos/fc-eval/analysis/table_8_tags.ipynb` |
| API table | `findings_tag_advantage` |
| Website component | `src/components/sections/findings/F3_StrategyAdvantage.svelte` |
| Cached JSON | `src/data/findings/f3_tags.json` |
| Render style | Heatmap table — agent x tag matrix, diverging RdBu @ 0 |

**Parity check:** The exporter now reads from `task.metadata["classification"]` (the same per-PR enum `analysis/table_8_tags.ipynb` uses), so the website table carries 9 tag keys — `parallelization, batching, caching, algorithmic, data_structure, reduce_work, higher_level, micro, lower_level`. The five paper tags missing from the API (`approximation, scale, db, io, uncategorized`) have zero tasks classified into them in `filtered_formulacode-verified.parquet`; that matches Table 2's actual sparsity. The website renders those columns as `—` and otherwise mirrors the paper.

### F4 — Table 3 (Long-tail by repo popularity)

| | |
|---|---|
| Paper section | `sections/experiments/tables/tab-long-tail.tex` |
| Paper asset | _(LaTeX table — no PDF)_ |
| Canonical notebook | `_repos/fc-eval/analysis/table_9_longtail.ipynb` |
| API table | `findings_repo_quintiles` |
| Website component | `src/components/sections/findings/F4_RepoQuintiles.svelte` |
| Cached JSON | `src/data/findings/f4_longtail.json` |
| Render style | Heatmap table — agent x Q1–Q5 matrix, diverging RdBu @ 0 |

**Visual sanity:** Q2 row mostly positive (best quintile), Q3 / Q4 rows mostly negative (worst quintiles). Matches paper claim "performance varies dramatically by repository popularity; worst in Q4, best in Q2."

### F5 — Figure 4 (Cost-Performance Pareto)

| | |
|---|---|
| Paper section | `sections/experiments/tables/fig-cost-advantage.tex` |
| Paper asset | `figures/assets/cost_vs_performance.pdf` |
| Canonical notebook | `_repos/fc-eval/analysis/table_6_cost.ipynb` |
| API table | `findings_cost_pareto` |
| Website component | `src/components/sections/findings/F5_CostPareto.svelte` |
| Cached JSON | `src/data/findings/f5_cost.json` |
| Render style | Scatter, x = cost-weighted advantage, y = cost (USD, log scale), Pareto points get a halo + dashed frontier line connecting them in cost-ascending order |

**Visual sanity:** OpenHands + Claude 4.0 Sonnet should be the most expensive point on the Pareto frontier. Cheaper Pareto points (Gemini, Qwen, GPT-5) should sit beneath. Matches paper Figure 4 caption.

### F6 — Figure 5 (Multi-workload tradeoff)

| | |
|---|---|
| Paper section | `sections/experiments/tables/fig-optimization-tradeoff.tex` |
| Paper asset | `figures/assets/tradeoff.pdf` |
| Canonical notebook | `_repos/fc-eval/analysis/multi_objective_analysis.ipynb` |
| API table | `findings_workload_tradeoff` |
| Website component | `src/components/sections/findings/F6_MultiWorkloadTradeoff.svelte` |
| Cached JSON | `src/data/findings/f6_tradeoff.json` |
| Render style | Scatter, x = worst-workload speedup, y = global speedup, y=x identity line, expert points (`is_expert=true`) drawn distinctly |

**Parity check:** Upstream re-exported from the plain `multi_objective_analysis.ipynb` (using `iter_successful_agent_configs(...)` + `_extract_per_benchmark_speedups`) so failed agents are excluded rather than imputed with `speedup=1.0`. Row split is now **188 agent + 38 expert = 226 rows** (was 304 under the imputed variant). The expert count is intentionally lower than agent: dedupe across duplicate `tasks.txt` entries means one row per PR per role.

### F7 — Table 4 (Temporal generalization)

| | |
|---|---|
| Paper section | `sections/experiments/tables/tab-temporal.tex` |
| Paper asset | _(LaTeX table — no PDF)_ |
| Canonical notebook | `_repos/fc-eval/analysis/figure_1_temporal.ipynb` |
| API table | `findings_temporal_generalization` |
| Website component | `src/components/sections/findings/F7_TemporalGeneralization.svelte` |
| Cached JSON | `src/data/findings/f7_temporal.json` |
| Render style | Heatmap table — model x 6 paper-Table-4 bins (`6+ mo before` / `3–6 mo before` / `0–3 mo before` / `0–3 mo after` / `3–6 mo after` / `6+ mo after`), sequential blues on speedup |

**Parity check:** Upstream re-shipped `findings_temporal_generalization` with the paper Table 4 binning — six 3-month-wide windows (`pre6plus`, `pre3to6`, `pre0to3`, `post0to3`, `post3to6`, `post6plus`), three models (Claude / GPT-5 / Gemini, Qwen excluded per `figure_1_temporal.ipynb` cell 5 popping its cutoff). Cell values are mean `agent/nop` within each bin.

**Remaining gap:** The upstream task set is sparser per bin than the paper's: 11 of 18 cells are non-null in the API today vs the paper's 18/18 in Table 4. Specifically: Claude lacks `pre3to6` / `post6plus`, GPT-5 lacks `pre0to3` / `post0to3`, Gemini lacks `pre3to6` / `pre0to3`. This is data-distribution, not exporter logic — will close as more tasks ingest.

(If you ever want the *figure* version — `temporal_ood.pdf`, a running monthly time series — that's a separate `findings_temporal_evolution` endpoint not yet built.)

## Re-verifying parity

Single command refresh from the live API:

```bash
python tasks/process_remote_data.py
# or, to refresh only the findings/ JSONs without touching the CSV-derived files:
python -c "import sys; sys.path.insert(0,'tasks'); \
    from process_remote_data import fetch_all_findings; \
    fetch_all_findings('src/data/findings')"
```

Then open `http://localhost:5173/#key-findings` (or whichever port `npm run dev` chose) and walk each F1–F7 card top-to-bottom. **Each card's caption deep-links into the arXiv HTML at its specific table/figure anchor** so a click jumps to the exact place in the paper to compare against:

| Finding | arXiv anchor |
|---|---|
| F1 Global leaderboard | `#S3.T1` (Table 1, §3.1) |
| F2 Stratified advantage | `#S3.F3` (Figure 3, §3.2) |
| F3 Per-tag advantage | `#S3.T2` (Table 2, §3.3) |
| F4 Repo quintiles | `#S3.T3` (Table 3, §3.4) |
| F5 Cost-Performance Pareto | `#S3.F4` (Figure 4, §3.5.1) |
| F6 Multi-workload tradeoff | `#S3.F5` (Figure 5, §3.5.2) |
| F7 Temporal generalization | `#S3.T4` (Table 4, §3.5.3) |

Anchors are managed in `tasks/process_remote_data.py`'s `ARXIV_ANCHORS` map and flow into the `_arxiv` field of each `src/data/findings/f*.json`.

For each card, check:

1. **Title** matches the paper artifact in the table above.
2. **Caption link** at the bottom of the card points to the right figure/table name.
3. **Render shape** (table vs scatter vs slope) matches the paper's representation.
4. **Numeric sanity** — the headline number the paper highlights still shows up (e.g. F2: OpenHands+Claude module-level advantage ≈ +0.30; F1: all-agent advantages negative; F4: Q2 best, Q4 worst).

If something looks off, update the **Status at a glance** table above and either fix locally (if it's a website rendering issue) or file a follow-up comment on [`fc-eval#19`](https://github.com/formula-code/fc-eval/issues/19) (if it's a data/upstream issue).

## When to update this file

- **Adding a new finding (F8, F9, …):** add a row to the status table and a section below it with the same six-row table (paper section / asset / notebook / API table / component / cached JSON).
- **Renaming an API column:** update the relevant `fetch_f*` function in `tasks/process_remote_data.py`, re-run the fetcher, and update the "API table" row here if columns change shape (not just rename).
- **Paper figure swapped in the LaTeX source:** verify the `\includegraphics{...}` target still maps to the notebook listed here. If a new PDF is added, retrace the savefig chain in `_repos/fc-eval/analysis/`.
- **Closing an upstream divergence:** flip the row's ⚠️ to ✅ and trim the "What still differs" column.
