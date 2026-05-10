# Data Wishlist

This document tracks data we'd like access to so the website can ship the
features users (and reviewers) actually want. Each item lists what's needed,
which page benefits, and what we ship without it.

---

## 1. The full benchmark dataset (957 tasks, not 3)

`src/data/website_data_lite.csv` currently contains workloads from **3
task_ids** across 3 repositories (astropy, pandas, scikit-learn). The paper
claims 957 performance bottlenecks across 70+ repos. This is the single
biggest wishlist item.

- **Used by:** `/explorer/`, scrollytelling chart, leaderboard recompute.
- **Ideal shape:** the existing CSV schema (`id, level, agent_id, agent/nop,
  oracle/nop, task_id, agent_recording, repo_name, benchmark_name`) with all
  ~1.4M workloads spanning all 957 tasks.
- **Acceptable interim:** a representative slice of one task per repo (≈70
  rows of `(repo, task_id)` pairs), enough that filter chips on the explorer
  feel populated.
- **Without it:** the explorer reads as a "tiny preview slice." The `Browse
  N performance workloads` headline is honest but underwhelming.

## 2. `merged_at` dates per task

Already noted in `CLAUDE.md` — the time-travel slider on `/leaderboard/`
stays dormant until each row carries a `merged_at` ISO 8601 string. The
ranking engine (`src/utils/rankingEngine.js`) auto-activates once present.

- **Used by:** `/leaderboard/` time-travel slider.
- **Ideal shape:** add a `merged_at` column to `website_data.csv` and
  propagate via `process_remote_data.py` → `LITE_COLUMNS`.
- **Without it:** slider hidden, leaderboard is static.

## 3. Per-task gold patch and best-agent patch (diffs)

MathNet's explorer shows the problem statement. FormulaCode's explorer
currently shows the *benchmark harness* (the `time_*` function being
measured). What the audience actually wants to see is the **optimization
patch** — what the human expert did, and what the agent did, side by side.

- **Used by:** `/explorer/` workload drawer (new "Patch" section), eventually
  a per-task page.
- **Ideal shape:** for each `task_id`, two unified diffs:
  - `oracle_patch` — the merged human PR's patch
  - `agent_patches[<agent_id>]` — the patch the agent produced (per agent we
    ran)
  Plus optionally the full pre/post file contents for syntax-highlighted
  side-by-side rendering.
- **Acceptable interim:** even just `oracle_patch` per task gets us 80% of
  the way there.
- **Without it:** the drawer's value is capped at "here's the harness and
  here are the speedups." No insight into *why* the agent won/lost.

## 4. Task descriptions and PR URLs

Each `task_id` should link back to its origin so users can verify and dig
deeper.

- **Used by:** `/explorer/` workload drawer, future per-task page.
- **Ideal shape:** a `tasks.json` keyed by `task_id`:
  ```json
  {
    "astropy_astropy_21": {
      "pr_url": "https://github.com/astropy/astropy/pull/12345",
      "pr_title": "Speed up Time initialization with units",
      "merged_at": "2024-03-15T12:34:56Z",
      "summary": "Caches unit conversion in Time constructor to avoid …",
      "optimization_strategy": "caching",
      "files_changed": 3,
      "lines_added": 42,
      "lines_removed": 18
    }
  }
  ```
- **Without it:** the explorer can identify a task by ID but can't say what
  the task *is* in plain English.

## 5. Repository metadata

To support the "browse by repo" and any "performance by repo popularity"
analysis (the paper mentions a 4th-quintile finding), each repo needs basic
metadata.

- **Used by:** `/explorer/` repo chips, future repo-detail page.
- **Ideal shape:** `repos.json`:
  ```json
  {
    "astropy_astropy": {
      "owner": "astropy",
      "repo": "astropy",
      "stars": 4400,
      "language": "Python",
      "description": "Astronomy and astrophysics core library",
      "n_tasks": 21,
      "topic": "scientific-computing"
    }
  }
  ```
- **Without it:** repos render as `astropy/astropy` slug-only — fine, but the
  page is less informative than MathNet's "Browse by competition" panel.

## 6. Per-agent cost & token usage per task

The paper's cost-efficiency finding ("frontier LLMs are overall more cost
effective than open weights models") is a key result that has no home on the
site yet.

- **Used by:** new "Cost vs. advantage" chart on `/leaderboard/`, agent
  cards.
- **Ideal shape:** add to the per-row CSV: `agent_cost_usd`,
  `agent_input_tokens`, `agent_output_tokens`, `agent_wallclock_seconds`.
- **Without it:** we can't surface the cost story visually.

## 7. Optimization strategy labels

The paper finds agents excel at parallelization/batching and struggle with
vectorization. Surfacing these tags would let users filter the explorer by
strategy.

- **Used by:** `/explorer/` optional "Strategy" filter chip.
- **Ideal shape:** per-task labels (`["caching", "vectorization", "io"]`) on
  the human PR.
- **Without it:** strategy taxonomy lives only in the paper, not the site.

---

## Out of scope (intentionally)

- **Submission flow / new agent uploads.** Following MathNet's lead — we
  don't need a backend for this. Users submit via the documented `fceval`
  CLI; we ingest results into the static dataset.
- **User accounts, comments, voting.** Not relevant.
- **Real-time leaderboard.** Cadence is paper/release, not minutes.
