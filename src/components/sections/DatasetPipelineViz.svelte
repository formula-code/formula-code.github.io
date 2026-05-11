<script>
	import { getContext, onDestroy, onMount } from "svelte";
	import inView from "$actions/inView.js";
	import SectionShell from "$components/sections/SectionShell.svelte";
	import dashboard from "$data/dashboard.json";

	const copy = getContext("copy") || {};
	const cfg = copy?.overview?.landingSections?.[0] || {};
	$: sectionTitle =
		cfg.title || "How does FormulaCode find code optimization tasks?";
	$: sectionLinkHref = cfg.linkHref || "/docs/";
	$: sectionLinkLabel = cfg.linkLabel || "Datasmith Documentation ↗";

	const numFmt = new Intl.NumberFormat("en-US");
	const fmt = (n) => numFmt.format(n);
	const pad2 = (n) => String(n).padStart(2, "0");

	const totals = dashboard.totals;
	const FINAL_TASKS = 957;
	const N_REPOS = totals.repositories;
	const N_PRS = totals.pull_requests;
	const N_PERF = totals.performance_prs;
	const N_BUILD = totals.problems;

	const DATASMITH = "https://github.com/formula-code/datasmith/blob/main";

	const PHASES = [
		{ name: "Discover", range: [0, 2] },
		{ name: "Judge", range: [3, 3] },
		{ name: "Build", range: [4, 7] },
		{ name: "Verify & deploy", range: [8, 9] }
	];

	const STEPS = [
		{
			phase: 1,
			phaseName: "Discover",
			name: "find_repos",
			title: "Scan GitHub for repos with performance benchmarks",
			file: "datasmith/runners/scrape_repos.py",
			fileUrl: `${DATASMITH}/src/datasmith/runners/scrape_repos.py`,
			summary:
				"For each (owner, repo) candidate — sourced from a CommonSQL query against the GitHub Public Dataset that filters for asv.conf.json presence — fetch metadata via the GitHub REST API and upsert a row into the repositories table with stars, language, topics, and description."
		},
		{
			phase: 1,
			phaseName: "Discover",
			name: "scrape_prs",
			title: "Page every merged pull request",
			file: "datasmith/runners/scrape_commits.py",
			fileUrl: `${DATASMITH}/src/datasmith/runners/scrape_commits.py`,
			summary:
				"For each candidate repository, paginate every merged pull request via the GitHub REST API within an optional date window. For each PR, fetch the diff and file changes, run symbolic_compliance() to mark is_performance_commit_symbolic, and upsert into the pull_requests table."
		},
		{
			phase: 1,
			phaseName: "Discover",
			name: "attribute_filter",
			title: "Drop PRs that obviously aren't perf",
			file: "datasmith/filters.py",
			fileUrl: `${DATASMITH}/src/datasmith/filters.py`,
			summary:
				"A cheap pre-LLM gate: drop PRs only when the title contains a clearly negative keyword (docs, typo, lint, version) and no positive cue. Ambiguous titles are kept; the LLM classifier decides next. Recall-first by design — false positives die at the speedup gate."
		},
		{
			phase: 2,
			phaseName: "Judge",
			name: "classify",
			title: "Ask an LLM if the PR is really a perf change",
			file: "datasmith/runners/classify_prs.py",
			fileUrl: `${DATASMITH}/src/datasmith/runners/classify_prs.py`,
			summary:
				"Two LLM passes over the PR's title, diff, linked issues, and review comments: a classifier first decides binary YES/NO; if YES, a judge picks one of 13 optimization categories and a difficulty (Easy / Medium / Hard)."
		},
		{
			phase: 3,
			phaseName: "Build",
			name: "resolve_packages",
			title: "Pin a buildable dependency set",
			file: "datasmith/runners/resolve_packages.py",
			fileUrl: `${DATASMITH}/src/datasmith/runners/resolve_packages.py`,
			summary:
				"For each classified PR, analyze_commit() detects the package's pyproject.toml/setup.py/setup.cfg, infers the Python version, and pins a full transitive dependency closure with uv. Sets can_install=True/False on the packages table. PRs with can_install=False are skipped downstream."
		},
		{
			phase: 3,
			phaseName: "Build",
			name: "verify_build",
			title: "Make sure the container actually runs",
			file: "datasmith/docker/verifiers.py",
			fileUrl: `${DATASMITH}/src/datasmith/docker/verifiers.py`,
			summary:
				"Three CLI checks decide whether a container is good: `python -c 'import {package}'`, `asv profile`, and `pytest`. If any fail, the container is dropped. Every downstream attempt (try_similar, agent_loop) is judged by this same verifier."
		},
		{
			phase: 3,
			phaseName: "Build",
			name: "try_similar",
			title: "Reuse a build script from a nearby commit",
			file: "datasmith/agents/synthesizer.py",
			fileUrl: `${DATASMITH}/src/datasmith/agents/synthesizer.py`,
			summary:
				"Look up successful build scripts from the same repo, sorted by absolute chronological distance from this PR — closest in either direction first. Fall through one-by-one until a script passes the verifier."
		},
		{
			phase: 3,
			phaseName: "Build",
			name: "agent_loop",
			title: "Spin up a reflexive agent if nothing fits",
			file: "datasmith/agents/synthesizer.py",
			fileUrl: `${DATASMITH}/src/datasmith/agents/synthesizer.py`,
			summary:
				"When the cascade fails, LLM_GENERATE hands the build to a swappable installed agent (Claude / Codex / Gemini / Qwen) running in a sandboxed container. The agent reads the repo, edits docker_build_pkg.sh, and re-runs the verifier loop until the smoke checks pass or max_attempts (default 2) is exhausted."
		},
		{
			phase: 4,
			phaseName: "Verify & deploy",
			name: "measure",
			title: "Time base vs expert on a clean EC2 box",
			file: "datasmith/runners/harbor_healthcheck.py",
			fileUrl: `${DATASMITH}/src/datasmith/runners/harbor_healthcheck.py`,
			summary:
				"The local orchestrator ships each verified container to a clean AWS EC2 c5ad.large box, where the oracle agent applies the human expert's patch and ASV times base vs. patched code. Per-trial speedups stream back into harbor_runs."
		},
		{
			phase: 4,
			phaseName: "Verify & deploy",
			name: "validate_and_publish",
			title: "Apply the speedup gate, then ship",
			file: "datasmith/publish/pipeline.py",
			fileUrl: `${DATASMITH}/src/datasmith/publish/pipeline.py`,
			summary:
				"Records that cleared the speedup gate in step 9 land in HuggingFace + DockerHub and get a `published_at` stamp in Supabase."
		}
	];

	// 13 optimization categories, paper-derived (Table 7 / appendix/dataset.tex).
	const CATEGORIES = [
		"Cache And Reuse",
		"Use Better Algorithm",
		"Use Better Data Structure",
		"Micro Optimizations",
		"Use Lower Level System",
		"Use Higher Level System",
		"Remove Or Reduce Work",
		"Use Parallelization",
		"Do It Earlier / Batch",
		"IO And Latency Hiding",
		"Database And Storage",
		"Accept Less Precise",
		"Uncategorized"
	];

	// ── Pacing ─────────────────────────────────────────────────────────────
	// Each canvas reveals content in beats: every BEAT_MS the stepBeat counter
	// ticks and a new line / row / state lights up. The autoplay duration for
	// a substep is derived from how many beats it takes to fully reveal,
	// plus a tail for the final slide-in animation and a hold for reading.
	const BEAT_MS = 400;
	const ANIM_TAIL_MS = 500;
	const HOLD_MS = 1500;
	// stepBeat thresholds at which each step is "fully revealed".
	$: revealBeats = [
		REPO_LINES.length, // ① find_repos
		8, // ② scrape_prs
		SAMPLE_PRS.length, // ③ attribute_filter
		30, // ④ classify (3 sub-stages × ~10 beats each, ~4s per stage)
		RESOLVE_LINES.length, // ⑤ resolve_packages
		16, // ⑥ verify_build (smoke 2 + asv 10 + pytest 4 = 1:5:2 ratio)
		9, // ⑦ try_similar (interleaved try → verdict cascade, 2 beats each)
		AGENT_LOG.length, // ⑧ agent_loop
		7, // ⑨ measure (boxes + handoff + 4 bars + return)
		5 // ⑩ validate_and_publish (verified + 3 targets + final stat)
	];
	$: stepDur = (i) => revealBeats[i] * BEAT_MS + ANIM_TAIL_MS + HOLD_MS;

	// ── Stepper geometry ───────────────────────────────────────────────────
	const N = STEPS.length;
	const SVG_W = 880;
	const SVG_H = 130;
	const C_R = 18;
	const C_GAP = (SVG_W - 2 * 40) / (N - 1);
	const cx = (i) => 40 + i * C_GAP;
	const cy = SVG_H / 2 - 10;

	// ── State ──────────────────────────────────────────────────────────────
	let active = 0;
	let playing = false;
	let started = false;
	let speed = 1;
	let timer = null;
	let stepBeat = 0;
	let stepBeatTimer = null;
	let revealed = false;
	let containerEl;

	$: step = STEPS[active];
	$: prevDisabled = active === 0;
	$: nextDisabled = active === N - 1;

	function setActive(i, { stopAuto = true } = {}) {
		started = true;
		const next = Math.max(0, Math.min(N - 1, i));
		if (next === active) return;
		active = next;
		stepBeat = 0;
		if (stopAuto) stop();
		if (active === N - 1 && playing) stop();
	}

	function next() {
		if (active < N - 1) setActive(active + 1, { stopAuto: false });
		else stop();
	}
	function prev() {
		setActive(active - 1);
	}

	function _scheduleNext() {
		if (timer) clearTimeout(timer);
		const dur = stepDur(active) / speed;
		timer = setTimeout(() => {
			if (active >= N - 1) {
				stop();
				return;
			}
			active = active + 1;
			stepBeat = 0;
			if (playing) _scheduleNext();
		}, dur);
	}
	function play() {
		started = true;
		playing = true;
		_scheduleNext();
	}
	function stop() {
		playing = false;
		if (timer) clearTimeout(timer);
		timer = null;
	}
	function togglePlay() {
		started = true;
		if (playing) stop();
		else play();
	}
	function setSpeed(s) {
		const wasPlaying = playing;
		speed = s;
		if (wasPlaying) {
			stop();
			play();
		}
	}

	function startSimulation() {
		started = true;
		active = 0;
		stepBeat = 0;
		play();
	}

	function onKeydown(e) {
		if (!revealed) return;
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement
		)
			return;
		if (e.key === "ArrowLeft") {
			e.preventDefault();
			prev();
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			next();
		} else if (e.key === " " || e.key === "Spacebar") {
			e.preventDefault();
			togglePlay();
		}
	}

	onMount(() => {
		stepBeatTimer = setInterval(() => stepBeat++, BEAT_MS);
	});
	onDestroy(() => {
		stop();
		if (stepBeatTimer) clearInterval(stepBeatTimer);
	});

	// ── Per-step view-state derivations ────────────────────────────────────

	// Step 1
	const REPO_LINES = [
		{ name: "pandas-dev/pandas", stars: "44.8k", py: "py3.10+" },
		{ name: "numpy/numpy", stars: "28.1k", py: "py3.11+" },
		{ name: "scipy/scipy", stars: "13.0k", py: "py3.10+" },
		{ name: "scikit-learn/scikit-learn", stars: "60.7k", py: "py3.10+" },
		{ name: "pydata/xarray", stars: "3.7k", py: "py3.10+" },
		{ name: "dask/dask", stars: "12.6k", py: "py3.10+" },
		{ name: "scikit-image/scikit-image", stars: "6.2k", py: "py3.10+" },
		{ name: "astropy/astropy", stars: "4.6k", py: "py3.10+" }
	];
	$: s1Visible =
		active === 0 ? Math.min(REPO_LINES.length, stepBeat) : REPO_LINES.length;

	// Step 2
	const REPO_TILES = [
		{ name: "pandas", target: 5847 },
		{ name: "numpy", target: 4233 },
		{ name: "scipy", target: 2891 },
		{ name: "sklearn", target: 3142 },
		{ name: "xarray", target: 1106 },
		{ name: "dask", target: 2418 },
		{ name: "skimage", target: 982 },
		{ name: "astropy", target: 1734 },
		{ name: "+146 more", target: 223124 }
	];
	$: s2Progress = active === 1 ? Math.min(1, stepBeat / 8) : 1;

	// Step 3 — recall-over-precision: ambiguous titles are kept, only clearly
	// negative ones get dropped pre-LLM.
	const SAMPLE_PRS = [
		{
			id: 56847,
			tokens: [
				{ t: "Speed", k: "pos" },
				{ t: "up", k: "" },
				{ t: "groupby", k: "" },
				{ t: "aggregation", k: "" },
				{ t: "with", k: "" },
				{ t: "vectorized", k: "pos" },
				{ t: "ops", k: "" }
			],
			meta: "+183 / -42 · 3 files",
			verdict: "kept",
			ambiguous: false,
			reason: "clear perf keyword"
		},
		{
			id: 49118,
			tokens: [
				{ t: "Refactor", k: "" },
				{ t: "DataFrame.apply", k: "" },
				{ t: "internals", k: "" }
			],
			meta: "+312 / -188 · 7 files",
			verdict: "kept",
			ambiguous: true,
			reason: "no negative cue — forwarded to LLM"
		},
		{
			id: 38204,
			tokens: [
				{ t: "Tweak", k: "" },
				{ t: "default", k: "" },
				{ t: "chunk", k: "" },
				{ t: "size", k: "" },
				{ t: "in", k: "" },
				{ t: "HDF5", k: "" },
				{ t: "writer", k: "" }
			],
			meta: "+24 / -8 · 1 file",
			verdict: "kept",
			ambiguous: true,
			reason: "no clear cue either way — forwarded"
		},
		{
			id: 7710,
			tokens: [
				{ t: "Fix", k: "neg" },
				{ t: "typo", k: "neg" },
				{ t: "in", k: "" },
				{ t: "installation", k: "" },
				{ t: "guide", k: "" }
			],
			meta: "+1 / -1 · 1 file (docs/)",
			verdict: "dropped",
			ambiguous: false,
			reason: "docs-only + negative keyword"
		}
	];
	$: s3Visible =
		active === 2 ? Math.min(SAMPLE_PRS.length, stepBeat) : SAMPLE_PRS.length;

	// Step 4 — staged: 4 input chips (beats 1-4) → classifier on (beat 5)
	// → 3 output rows (beats 6-8)
	const CLASSIFY_INPUTS = [
		{ k: "title", v: "Speed up groupby aggregation by 8x" },
		{ k: "diff", v: "+183 / -42 across 3 files" },
		{ k: "issues", v: "#54234 — linked perf regression" },
		{ k: "comments", v: "4 review threads" }
	];
	const CLASSIFY_OUTPUTS = [
		{ k: "is_perf", v: "YES", highlight: "yes" },
		{ k: "category", v: "Use Better Algorithm", highlight: "" },
		{ k: "difficulty", v: "Medium", highlight: "" }
	];
	// Single-card-at-a-time stage machine, deliberately paced so each sub-stage
	// reads as a discrete action (~4s per stage):
	//   stage 0 (beats 0–9):   PR-context card, 4 inputs trickle in
	//   stage 1 (beats 10–19): classifier card with a "thinking…" indicator
	//   stage 2 (beats 20–29): output card, 3 rows trickle in
	$: s4Stage =
		active === 3 ? (stepBeat < 10 ? 0 : stepBeat < 20 ? 1 : 2) : 2;
	$: s4InputsShown =
		active === 3 ? Math.min(4, Math.floor(stepBeat / 2) + 1) : 4;
	$: s4OutputsShown =
		active === 3 ? Math.max(0, Math.min(3, Math.floor((stepBeat - 20) / 3) + 1)) : 3;

	// Step 5
	const RESOLVE_LINES = [
		"$ uv pip compile -o pinned.txt --resolution=lowest --python-platform=linux",
		"  ✓ resolving 47 packages as of 2024-03-14",
		"  numpy        ==1.26.4",
		"  cython       ==3.0.10",
		"  pandas       ==2.1.4",
		"  pyarrow      ==15.0.1",
		"  asv          ==0.6.3",
		"  ...",
		"✓ Resolved 47 packages in 8.4s · can_install=True"
	];
	$: s5Visible =
		active === 4
			? Math.min(RESOLVE_LINES.length, stepBeat)
			: RESOLVE_LINES.length;

	// Step 6 — verify_build: three sequential terminal panels with realistic
	// relative timings — smoke (T=2 beats) : asv profile (5T=10 beats) :
	// pytest (2T=4 beats). Each line has an `atBeat` offset relative to the
	// step's stepBeat counter so the slowest stage clearly "takes longer".
	//   smoke:   starts beat 0,  finishes beat 2  (4 lines packed in 2 beats)
	//   asv:     starts beat 2,  finishes beat 12 (long "Profiling…" wait)
	//   pytest:  starts beat 12, finishes beat 16
	const VERIFY_TERMINALS = [
		{
			cap: "smoke import",
			cmd: "python",
			startBeat: 0,
			endBeat: 2,
			elapsedSec: 0.4,
			lines: [
				{ atBeat: 1, p: ">>>", body: "import pandas" },
				{ atBeat: 1, p: ">>>", body: "pandas.__version__" },
				{ atBeat: 1, p: "", body: "'2.1.4'" },
				{ atBeat: 2, p: "", body: "✓ import passed", ok: true }
			]
		},
		{
			cap: "asv profile",
			cmd: "asv profile -b 'groupby_agg'",
			startBeat: 2,
			endBeat: 12,
			elapsedSec: 12.3,
			showSpinner: true,
			lines: [
				{ atBeat: 3, p: "·", body: "Profiling groupby_agg…" },
				{ atBeat: 11, p: "·", body: "cumulative 12.3s / 4 rounds" },
				{ atBeat: 12, p: "·", body: "✓ profile passed", ok: true }
			]
		},
		{
			cap: "pytest",
			cmd: "pytest -x",
			startBeat: 12,
			endBeat: 16,
			elapsedSec: 4.2,
			lines: [
				{ atBeat: 13, p: "·", body: "collected 87 items" },
				{ atBeat: 15, p: "·", body: "============= 87 passed in 4.2s ====" },
				{ atBeat: 16, p: "·", body: "✓ tests passed", ok: true }
			]
		}
	];
	const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧"];
	$: s6AllPassed = active === 5 ? stepBeat >= 16 : true;

	// Step 7 — try_similar: number-line timeline with cascading fails → success.
	// Cascade visits commits in order of ABSOLUTE chronological distance from
	// the PR, regardless of direction. tryOrder 1 = closest, 2 = next, etc.
	//   tryOrder 1: 5e8d44 (+14d, distance 14) — closest, fails
	//   tryOrder 2: b7e019 (−22d, distance 22) — next, fails
	//   tryOrder 3: ce6321 (+41d, distance 41) — next, passes
	const NEIGHBORS = [
		{ sha: "f8a2c1", days: -82, tryOrder: null, ok: null },
		{ sha: "21db4e", days: -68, tryOrder: null, ok: null },
		{ sha: "9c3a87", days: -47, tryOrder: null, ok: null },
		{ sha: "b7e019", days: -22, tryOrder: 2, ok: false },
		{ sha: "5e8d44", days: 14, tryOrder: 1, ok: false },
		{ sha: "ce6321", days: 41, tryOrder: 3, ok: true },
		{ sha: "7ef905", days: 76, tryOrder: null, ok: null }
	];
	// Beat layout (2 beats per attempt — trying then decided):
	//   0–1 axis + neighbors
	//   2 try #1 trying  | 3+ decided ✗
	//   4 try #2 trying  | 5+ decided ✗
	//   6 try #3 trying  | 7+ decided ✓
	//   8 caption
	$: s7Beat = active === 6 ? stepBeat : 9;

	// Step 8 — agent_loop
	const AGENT_LOG = [
		{
			turn: 1,
			label: "thought",
			body: "no neighbor scripts work; reading repo to find install hints",
			tool: 'probe_repo("setup.py")'
		},
		{
			turn: 2,
			label: "observation",
			body: "setup.py uses Cython extensions; needs --no-build-isolation",
			tool: null
		},
		{
			turn: 3,
			label: "thought",
			body: "patching docker_build_pkg.sh: add --no-build-isolation flag",
			tool: "write_script(...)"
		},
		{
			turn: 4,
			label: "observation",
			body: "✓ docker_build_pkg.sh synthesized · 47 lines · context saved",
			tool: null
		}
	];
	$: s8Visible =
		active === 7 ? Math.min(AGENT_LOG.length, stepBeat) : AGENT_LOG.length;

	// Step 9 — measure: two-machine handoff + bench bars
	const BENCH = [
		{ wl: "groupby_agg", base: 143.2, expert: 17.8 },
		{ wl: "rolling_mean", base: 89.4, expert: 89.1 },
		{ wl: "pivot_table", base: 512.0, expert: 312.0 },
		{ wl: "merge_asof", base: 71.0, expert: 23.4 }
	];
	const BENCH_MAX = Math.max(...BENCH.flatMap((r) => [r.base, r.expert]));
	// Beat layout: 0 boxes, 1 ship arrow, 2-5 bench rows, 6 return arrow
	$: s9Beat = active === 8 ? stepBeat : 7;
	$: s9Visible =
		active === 8
			? Math.max(0, Math.min(BENCH.length, stepBeat - 1))
			: BENCH.length;

	// Step 10 — validate_and_publish: simplified publish-targets layout
	const PUBLISH_TARGETS = [
		{
			tag: "HF",
			name: "HuggingFace",
			detail: "datasets/formula-code · pushed"
		},
		{
			tag: "Docker",
			name: "DockerHub",
			detail: "formulacode/<owner>-<repo>-<sha> · pushed"
		},
		{
			tag: "DB",
			name: "Supabase",
			detail: "pull_requests.published_at = 2026-05-11T…Z"
		}
	];
	// Beat layout: 0 verified, 1-3 targets one-by-one, 4 final stat
	$: s10Beat = active === 9 ? stepBeat : 5;
	$: s10TargetsShown =
		active === 9 ? Math.max(0, Math.min(3, stepBeat - 1)) : 3;
</script>

<svelte:window on:keydown={onKeydown} />

<section
	class="pipeline"
	id="pipeline"
	bind:this={containerEl}
	use:inView={{ bottom: 80 }}
	on:enter={() => (revealed = true)}
>
	<div class="container">
		<SectionShell
			title={sectionTitle}
			caption="Each task starts as a merged GitHub pull request and earns its way through four phases — discover, judge, build, verify — surviving only if it ships a measurable speedup."
			linkHref={sectionLinkHref}
			linkLabel={sectionLinkLabel}
		/>

		<!-- Combined nested stepper: only the active phase expands its substeps;
		     other phases collapse to a name pill. Clicking a collapsed phase
		     expands it (and jumps to its first substep). Before the user starts
		     the simulation all phases are collapsed and centered. -->
		<nav class="phase-strip" aria-label="Dataset pipeline">
			{#each PHASES as p, pi (p.name)}
				{@const isPhaseActive = started && active >= p.range[0] && active <= p.range[1]}
				{@const isPhaseDone = started && active > p.range[1]}
				<div
					class="phase-block"
					class:active={isPhaseActive}
					class:done={isPhaseDone}
					class:collapsed={!isPhaseActive}
				>
					<button
						type="button"
						class="phase-head"
						aria-label={`${p.name} phase — substeps ${pad2(p.range[0] + 1)} to ${pad2(p.range[1] + 1)}`}
						aria-expanded={isPhaseActive}
						on:click={() => setActive(p.range[0])}
					>
						<span class="phase-name">{p.name}</span>
					</button>
					{#if isPhaseActive}
						<div class="phase-subs">
							{#each STEPS.slice(p.range[0], p.range[1] + 1) as s, si}
								{@const idx = p.range[0] + si}
								<button
									class="substep"
									class:active={idx === active}
									class:done={idx < active}
									aria-label={`Substep ${idx + 1}: ${s.title}${idx === active ? " (current)" : ""}`}
									on:click={() => setActive(idx)}
								>
									<span class="substep-n">{pad2(idx + 1)}</span>
									<span class="substep-name">{s.name}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
				{#if pi < PHASES.length - 1}
					<svg
						class="phase-arrow"
						viewBox="0 0 36 16"
						width="36"
						height="16"
						aria-hidden="true"
					>
						<line
							x1="2"
							y1="8"
							x2="28"
							y2="8"
							stroke="currentColor"
							stroke-width="1.4"
							stroke-linecap="round"
						/>
						<path
							d="M24 3 L33 8 L24 13"
							fill="none"
							stroke="currentColor"
							stroke-width="1.4"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				{/if}
			{/each}
		</nav>

		<!-- Active step card -->
		<div class="card" class:idle={!started}>
			{#if !started}
				<button
					class="overlay"
					on:click={startSimulation}
					aria-label="Start simulation"
				>
					<span class="overlay-play">
						<svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true">
							<path d="M5 3 L12 8 L5 13 Z" fill="currentColor" />
						</svg>
					</span>
					<span class="overlay-caption">
						Watch how a FormulaCode task is built — from a GitHub repo to a
						benchmarked dataset row.
					</span>
				</button>
			{/if}

			<div class="card-content">
				<div class="card-head">
					<div class="card-head-l">
						<span class="phase-pill"
							>Phase <strong>{step.phase}</strong> · {step.phaseName}</span
						>
						<h3 class="card-title">
							<span class="card-num">{pad2(active + 1)}</span>
							{step.title}
						</h3>
					</div>
					<a
						class="file-pill"
						href={step.fileUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						<svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
							<path
								fill="none"
								stroke="currentColor"
								stroke-width="1.4"
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M4.5 1.5h-2a1 1 0 00-1 1v11a1 1 0 001 1h11a1 1 0 001-1v-2 M9.5 1.5h5v5 M14.5 1.5l-7 7"
							/>
						</svg>
						<span>{step.file}</span>
					</a>
				</div>
				<p class="card-summary">{step.summary}</p>

				<!-- Per-step canvas -->
				<div class="canvas">
					{#if active === 0}
						<div class="terminal">
							<div class="term-bar">
								<span class="term-dot"></span> gh search
							</div>
							<div class="term-body">
								<div class="term-cmd">
									<span class="term-prompt">$</span>
									gh search repos --filename=asv.conf.json --stars="&gt;=100" --language=python
								</div>
								{#each REPO_LINES.slice(0, s1Visible) as r, i (r.name)}
									<div class="term-line" style="--i: {i}">
										<span class="term-idx">[{i + 1}]</span>
										<span class="term-name">{r.name}</span>
										<span class="term-meta">★ {r.stars} · {r.py}</span>
										<span class="term-ok">✓</span>
									</div>
								{/each}
								{#if s1Visible < REPO_LINES.length}
									<div class="term-line dim">
										<span class="caret"></span> scanning…
									</div>
								{:else}
									<div class="term-line foot">
										→ <strong>{fmt(N_REPOS)}</strong> repositories matched
									</div>
								{/if}
							</div>
						</div>
					{:else if active === 1}
						<div class="grid">
							{#each REPO_TILES as t, i (t.name)}
								<div class="tile" style="--i: {i}">
									<div class="tile-name">{t.name}</div>
									<div class="tile-num">
										+{fmt(Math.floor(t.target * s2Progress))}
									</div>
									<div class="tile-lbl">PRs</div>
								</div>
							{/each}
						</div>
						<div class="grid-foot">
							<span class="cursor"
								>page {Math.min(1820, 1 + Math.floor(s2Progress * 1819))} / 1820</span
							>
							<span class="grid-total"
								>→ <strong>{fmt(N_PRS)}</strong> merged PRs scraped</span
							>
						</div>
					{:else if active === 2}
						<div class="prs">
							{#each SAMPLE_PRS.slice(0, s3Visible) as p, i (p.id)}
								<div
									class="pr"
									class:dropped={p.verdict === "dropped"}
									style="--i: {i}"
								>
									<div class="pr-l">
										<span class="pr-id">PR #{p.id}</span>
										<span class="pr-title">
											{#each p.tokens as tok}
												<span
													class="tok"
													class:pos={tok.k === "pos"}
													class:neg={tok.k === "neg"}>{tok.t}</span
												>{" "}
											{/each}
										</span>
										<span class="pr-meta">{p.meta}</span>
									</div>
									<div class="pr-r">
										<span
											class="pr-verdict"
											class:kept={p.verdict === "kept"}
											class:dropped={p.verdict === "dropped"}
										>
											{p.verdict === "kept" ? "✓ kept" : "✗ dropped"}
											{#if p.ambiguous}
												<span class="amb-chip">ambiguous</span>
											{/if}
										</span>
										<span class="pr-reason">{p.reason}</span>
									</div>
								</div>
							{/each}
						</div>
						<div class="canvas-stat">
							→ recall-first: any title without a negative cue gets forwarded
							to the LLM
						</div>
					{:else if active === 3}
						<div class="cls-breadcrumb">
							{#each ["PR context", "classifier", "output"] as label, i}
								<span
									class="cls-crumb"
									class:active={s4Stage === i}
									class:done={s4Stage > i}
								>
									<span class="cls-crumb-n">0{i + 1}</span>
									<span class="cls-crumb-lbl">{label}</span>
								</span>
								{#if i < 2}
									<svg
										class="cls-crumb-sep"
										viewBox="0 0 12 12"
										width="10"
										height="10"
										aria-hidden="true"
									>
										<path
											d="M3.5 2 L8 6 L3.5 10"
											fill="none"
											stroke="currentColor"
											stroke-width="1.6"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								{/if}
							{/each}
						</div>
						<div class="classify">
							<!-- Stage 0: PR context (always present once on this step) -->
							<div class="cls-col cls-input">
								<div class="cls-cap">PR context</div>
								<div class="cls-card">
									{#each CLASSIFY_INPUTS.slice(0, s4InputsShown) as ci, i (ci.k)}
										<div class="cls-row cls-row-anim" style="--i: {i}">
											<span class="cls-k">{ci.k}</span>
											<span class="cls-v">{ci.v}</span>
										</div>
									{/each}
								</div>
							</div>
							{#if s4Stage >= 1}
								<div class="cls-arrow on" aria-hidden="true">
									<svg viewBox="0 0 32 14" width="32" height="14">
										<line
											x1="2"
											y1="7"
											x2="24"
											y2="7"
											stroke="currentColor"
											stroke-width="1.4"
											stroke-linecap="round"
										/>
										<path
											d="M22 3 L29 7 L22 11"
											fill="none"
											stroke="currentColor"
											stroke-width="1.4"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</div>
								<!-- Stage 1: Classifier -->
								<div class="cls-col cls-llm">
									<div class="cls-cap">classifier</div>
									<div class="cls-card cls-llm-card">
										<div class="cls-llm-name">gpt-oss-120b</div>
										<div class="cls-llm-meta">DSPy · local vLLM</div>
										{#if s4Stage === 1}
											<div class="cls-thinking" aria-label="classifier running">
												<span class="cls-spin"
													>{SPINNER_FRAMES[
														stepBeat % SPINNER_FRAMES.length
													]}</span
												>
												<span class="cls-thinking-lbl">thinking…</span>
											</div>
										{:else}
											<div class="cls-thinking cls-done">
												<span class="cls-thinking-lbl">✓ done</span>
											</div>
										{/if}
									</div>
								</div>
							{/if}
							{#if s4Stage >= 2}
								<div class="cls-arrow on" aria-hidden="true">
									<svg viewBox="0 0 32 14" width="32" height="14">
										<line
											x1="2"
											y1="7"
											x2="24"
											y2="7"
											stroke="currentColor"
											stroke-width="1.4"
											stroke-linecap="round"
										/>
										<path
											d="M22 3 L29 7 L22 11"
											fill="none"
											stroke="currentColor"
											stroke-width="1.4"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</div>
								<!-- Stage 2: Output -->
								<div class="cls-col cls-out">
									<div class="cls-cap">output</div>
									<div class="cls-card cls-out-card">
										{#each CLASSIFY_OUTPUTS.slice(0, s4OutputsShown) as co, i (co.k)}
											<div class="cls-row cls-row-anim" style="--i: {i}">
												<span class="cls-k">{co.k}</span>
												{#if co.highlight === "yes"}
													<span class="cls-yes">{co.v}</span>
												{:else}
													<span class="cls-v">{co.v}</span>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{:else if active === 4}
						<div class="terminal">
							<div class="term-bar">
								<span class="term-dot"></span> uv pip compile
							</div>
							<div class="term-body">
								{#each RESOLVE_LINES.slice(0, s5Visible) as line, i (i)}
									<div class="term-line" style="--i: {i}">{line}</div>
								{/each}
								{#if s5Visible < RESOLVE_LINES.length}
									<div class="term-line dim"><span class="caret"></span></div>
								{/if}
							</div>
						</div>
					{:else if active === 5}
						<div class="verify-grid">
							{#each VERIFY_TERMINALS as t, ti (t.cap)}
								{@const started = stepBeat >= t.startBeat}
								{@const finished = stepBeat >= t.endBeat}
								{@const elapsed =
									finished
										? t.elapsedSec
										: started
											? Math.min(
													t.elapsedSec,
													((stepBeat - t.startBeat) / (t.endBeat - t.startBeat)) *
														t.elapsedSec
												)
											: 0}
								<div
									class="verify-term"
									class:dim={!started}
									class:running={started && !finished}
									style="--i: {ti}"
								>
									<div class="term-bar">
										<span
											class="term-dot"
											class:running={started && !finished}
											class:done={finished}
										></span>
										{t.cap}
										{#if started}
											<span class="term-elapsed">{elapsed.toFixed(1)}s</span>
										{/if}
									</div>
									<div class="term-body">
										<div class="term-cmd">
											<span class="term-prompt">$</span>
											{t.cmd}
										</div>
										{#each t.lines as ln, li (li)}
											{#if stepBeat >= ln.atBeat}
												<div class="vt-line" class:ok={ln.ok} style="--i: {li}">
													{#if ln.p}<span class="vt-p">{ln.p}</span>{/if}
													{ln.body}
												</div>
											{/if}
										{/each}
										{#if t.showSpinner && started && !finished && stepBeat >= t.lines[0].atBeat}
											<div class="vt-line vt-spin-line">
												<span class="vt-spin"
													>{SPINNER_FRAMES[stepBeat % SPINNER_FRAMES.length]}</span
												>
												<span class="vt-spin-lbl">running 4 rounds…</span>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
						{#if s6AllPassed}
							<div class="canvas-stat">
								→ all three checks passed ·
								<strong>container kept</strong>
							</div>
						{/if}
					{:else if active === 6}
						<div class="tl-wrap">
							<!-- 2D chart background: day labels on top, subtle dashed
							     vertical gridlines extending through the chart -->
							<div class="tl-grid" aria-hidden="true">
								{#each [-90, -60, -30, 0, 30, 60] as d}
									<div
										class="tl-gridcol"
										style="left: {((d + 90) / 180) * 100}%"
									>
										<span class="tl-day">{d > 0 ? "+" : ""}{d}d</span>
										<span class="tl-gridline"></span>
									</div>
								{/each}
							</div>
							<div class="tl-axis-line"></div>
							{#each NEIGHBORS as n (n.sha)}
								{@const left = ((n.days + 90) / 180) * 100}
								{@const tryAt =
									n.tryOrder !== null ? n.tryOrder * 2 : null}
								{@const trying = tryAt !== null && s7Beat === tryAt}
								{@const decided = tryAt !== null && s7Beat > tryAt}
								{@const verdict = decided ? n.ok : null}
								<div
									class="tl-node"
									class:trying
									class:decided
									class:fail={verdict === false}
									class:pass={verdict === true}
									style="left: {left}%"
								>
									<div class="tl-node-dot"></div>
									{#if decided && verdict === false}
										<span class="tl-badge fail">✗ build failed</span>
									{:else if decided && verdict === true}
										<span class="tl-badge pass">✓ build verified</span>
									{:else if trying}
										<span class="tl-badge trying">trying…</span>
									{/if}
									<div class="tl-node-lbl">{n.sha}</div>
								</div>
							{/each}
							<div class="tl-self-marker" style="left: 50%">
								<div class="tl-self-dot"></div>
								<div class="tl-self-tag">PR #56847</div>
							</div>
						</div>
						{#if s7Beat >= 8}
							<div class="canvas-stat tl-caption">
								→ reused build script from commit
								<code>ce6321</code> (+41d) ·
								<span class="ok-chip">✓ verifier passed</span>
							</div>
						{/if}
					{:else if active === 7}
						<div class="agent">
							<div class="agent-meta">
								<span class="agent-pill">openai/gpt-oss-120b</span>
								<span class="agent-sep">→ fallback</span>
								<span class="agent-pill">claude-3-5-sonnet</span>
								<span class="agent-sep">·</span>
								<span class="agent-pill">10 turns max</span>
							</div>
							<div class="turns">
								{#each AGENT_LOG.slice(0, s8Visible) as t, i (t.turn)}
									<div class="turn" style="--i: {i}">
										<div class="turn-head">
											<span class="turn-num">TURN {t.turn}</span>
											<span
												class="turn-label"
												class:obs={t.label === "observation"}>{t.label}</span
											>
										</div>
										<div class="turn-body">{t.body}</div>
										{#if t.tool}
											<div class="turn-tool">
												<span class="tool-arrow">→</span> tool:
												<code>{t.tool}</code>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{:else if active === 8}
						<div class="machines">
							<div class="machine machine-local" class:on={s9Beat >= 0}>
								<div class="m-tag">local</div>
								<div class="m-name">datasmith</div>
								<div class="m-sub">orchestrator</div>
							</div>
							<div class="m-arrows">
								<div class="m-arrow m-arrow-fwd" class:on={s9Beat >= 1}>
									<span class="m-arrow-lbl">container</span>
									<svg
										class="m-arrow-glyph"
										viewBox="0 0 40 12"
										width="40"
										height="12"
										aria-hidden="true"
									>
										<line
											x1="2"
											y1="6"
											x2="32"
											y2="6"
											stroke="currentColor"
											stroke-width="1.4"
											stroke-linecap="round"
										/>
										<path
											d="M30 2 L37 6 L30 10"
											fill="none"
											stroke="currentColor"
											stroke-width="1.4"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								</div>
								<div class="m-arrow m-arrow-back" class:on={s9Beat >= 6}>
									<svg
										class="m-arrow-glyph"
										viewBox="0 0 40 12"
										width="40"
										height="12"
										aria-hidden="true"
									>
										<line
											x1="8"
											y1="6"
											x2="38"
											y2="6"
											stroke="currentColor"
											stroke-width="1.4"
											stroke-linecap="round"
										/>
										<path
											d="M10 2 L3 6 L10 10"
											fill="none"
											stroke="currentColor"
											stroke-width="1.4"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									<span class="m-arrow-lbl">speedups</span>
								</div>
							</div>
							<div class="machine machine-remote" class:on={s9Beat >= 1}>
								<div class="m-tag">remote</div>
								<div class="m-name">AWS EC2 c5ad.large</div>
								<div class="m-sub">pinned cores · ASV runs</div>
							</div>
						</div>
						{#if s9Visible > 0}
							<div class="bench">
								<div class="bench-head">
									<span class="bench-c1">workload</span>
									<span class="bench-c2">base</span>
									<span class="bench-c3">expert</span>
								</div>
								{#each BENCH.slice(0, s9Visible) as r, i (r.wl)}
									<div class="bench-row" style="--i: {i}">
										<span class="bench-c1">{r.wl}</span>
										<span class="bench-c2">
											<span
												class="bar bar-base"
												style="width: {(r.base / BENCH_MAX) * 100}%"
											></span>
											<span class="bench-num">{r.base.toFixed(1)} ms</span>
										</span>
										<span class="bench-c3">
											<span
												class="bar bar-expert"
												style="width: {(r.expert / BENCH_MAX) * 100}%"
											></span>
											<span class="bench-num">{r.expert.toFixed(1)} ms</span>
										</span>
									</div>
								{/each}
							</div>
						{/if}
					{:else if active === 9}
						<div class="publish">
							<div class="verified-row" class:on={s10Beat >= 1}>
								<span class="verified-badge">✓ task verified</span>
								<span class="verified-sub"
									>cleared the 1.05× speedup gate</span
								>
							</div>
							<div class="targets">
								{#each PUBLISH_TARGETS.slice(0, s10TargetsShown) as t, i (t.tag)}
									<div class="target" style="--i: {i}">
										<span class="target-tag">{t.tag}</span>
										<div class="target-body">
											<div class="target-name">{t.name}</div>
											<div class="target-detail">{t.detail}</div>
										</div>
										<span class="target-ok">pushed</span>
									</div>
								{/each}
							</div>
						</div>
						{#if s10Beat >= 5}
							<div class="canvas-stat">
								→ <strong>{fmt(FINAL_TASKS)}</strong> tasks shipped to the dataset
							</div>
						{/if}
					{/if}
				</div>

				<!-- Controls -->
				<div class="controls">
					<button
						class="ctl ctl-chev"
						on:click={prev}
						disabled={prevDisabled}
						aria-label="Previous substep"
					>
						<svg viewBox="0 0 14 14" width="14" height="14"
							><path
								d="M9 3 L5 7 L9 11"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"
							/></svg
						>
					</button>
					<button
						class="play-btn"
						on:click={togglePlay}
						aria-label={playing ? "Pause" : "Play"}
					>
						{#if playing}
							<svg viewBox="0 0 16 16" width="14" height="14"
								><rect
									x="4"
									y="3"
									width="3"
									height="10"
									fill="currentColor"
								/><rect
									x="9"
									y="3"
									width="3"
									height="10"
									fill="currentColor"
								/></svg
							>
						{:else}
							<svg viewBox="0 0 16 16" width="14" height="14"
								><path d="M5 3 L12 8 L5 13 Z" fill="currentColor" /></svg
							>
						{/if}
					</button>
					<button
						class="ctl ctl-chev"
						on:click={next}
						disabled={nextDisabled}
						aria-label="Next substep"
					>
						<svg viewBox="0 0 14 14" width="14" height="14"
							><path
								d="M5 3 L9 7 L5 11"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"
							/></svg
						>
					</button>
					<span class="counter">
						<strong>{pad2(active + 1)}</strong>
						<span class="counter-sep">/</span>
						{pad2(N)}
						<span class="counter-phase"> · {step.phaseName}</span>
					</span>
					<div class="speeds" role="group" aria-label="Playback speed">
						{#each [0.5, 1, 2] as s}
							<button
								class="speed"
								class:active={speed === s}
								on:click={() => setSpeed(s)}>{s}×</button
							>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.pipeline {
		padding: var(--space-2xl) 0;
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
	}

	.container {
		max-width: 1080px;
		margin: 0 auto;
		padding: 0 var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	/* Stepper */
	.stepper-wrap {
		margin-top: var(--space-sm);
	}
	.stepper {
		display: block;
		width: 100%;
		height: auto;
		max-width: 100%;
	}
	.stepper-mobile {
		display: none;
		flex-wrap: wrap;
		gap: 8px 6px;
		justify-content: center;
	}

	.stepper-node {
		cursor: pointer;
	}
	.circle {
		fill: var(--bg-primary);
		stroke: var(--border-primary);
		stroke-width: 2;
		transition:
			fill 200ms,
			stroke 200ms,
			filter 200ms;
	}
	.circle-num {
		font-family: var(--mono);
		font-size: 13px;
		font-weight: 700;
		fill: var(--text-muted);
		pointer-events: none;
		transition: fill 200ms;
	}
	.circle-label {
		font-family: var(--mono);
		font-size: 9.5px;
		fill: var(--text-muted);
		pointer-events: none;
		letter-spacing: 0.02em;
		transition: fill 200ms;
	}
	.stepper-node:hover .circle {
		stroke: var(--brand-red);
	}
	.stepper-node:hover .circle-num {
		fill: var(--brand-red);
	}
	.stepper-node.done .circle {
		fill: var(--brand-red);
		stroke: var(--brand-red);
	}
	.stepper-node.done .circle-num {
		fill: #fff;
	}
	.stepper-node.active .circle {
		fill: var(--brand-red-soft);
		stroke: var(--brand-red);
		filter: drop-shadow(0 0 6px rgba(220, 36, 24, 0.35));
	}
	.stepper-node.active .circle-num,
	.stepper-node.active .circle-label {
		fill: var(--brand-red);
	}

	/* Mobile chips */
	.chip {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 6px 8px;
		background: transparent;
		border: 0;
		cursor: pointer;
		font-family: inherit;
	}
	.chip-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 999px;
		border: 2px solid var(--border-primary);
		background: var(--bg-primary);
		font-family: var(--mono);
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-muted);
	}
	.chip-name {
		font-family: var(--mono);
		font-size: 0.62rem;
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}
	.chip.done .chip-num {
		background: var(--brand-red);
		border-color: var(--brand-red);
		color: #fff;
	}
	.chip.active .chip-num {
		background: var(--brand-red-soft);
		border-color: var(--brand-red);
		color: var(--brand-red);
	}
	.chip.active .chip-name {
		color: var(--brand-red);
	}

	/* Active step card */
	.card {
		position: relative;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg, 12px);
		box-shadow: var(--shadow);
	}
	.card-content {
		padding: var(--space-xl);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		transition: filter 200ms;
	}
	.card.idle .card-content {
		filter: blur(4px);
		pointer-events: none;
		user-select: none;
	}

	.overlay {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		background: rgba(255, 255, 255, 0.55);
		backdrop-filter: saturate(120%);
		-webkit-backdrop-filter: saturate(120%);
		border: 0;
		border-radius: var(--radius-lg, 12px);
		cursor: pointer;
		font-family: inherit;
	}
	.overlay-play {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 60px;
		height: 60px;
		border-radius: 999px;
		border: 2px solid var(--brand-red);
		color: var(--brand-red);
		background: rgba(255, 255, 255, 0.9);
		transition:
			transform 160ms,
			box-shadow 160ms;
	}
	.overlay:hover .overlay-play {
		transform: scale(1.06);
		box-shadow: 0 0 0 6px rgba(220, 36, 24, 0.16);
	}
	.overlay-play svg {
		margin-left: 3px;
	}
	.overlay-caption {
		font-family: var(--sans);
		font-size: 0.92rem;
		font-weight: 600;
		color: var(--text-primary);
		max-width: 28ch;
		text-align: center;
		line-height: 1.4;
	}

	.card-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-md);
		flex-wrap: wrap;
	}
	.card-head-l {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}
	.phase-pill {
		display: inline-flex;
		align-items: center;
		font-family: var(--mono);
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}
	.phase-pill strong {
		color: var(--brand-red);
		margin: 0 4px;
	}
	.card-title {
		font-family: var(--sans);
		font-size: clamp(1.1rem, 2vw, 1.4rem);
		font-weight: 700;
		letter-spacing: -0.015em;
		color: var(--text-primary);
		margin: 0;
		display: inline-flex;
		align-items: baseline;
		gap: 10px;
	}
	.card-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
		height: 28px;
		padding: 0 8px;
		border-radius: 999px;
		font-family: var(--mono);
		font-size: 0.78rem;
		font-weight: 700;
		color: #fff;
		background: var(--brand-red);
		line-height: 1;
	}
	.file-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 10px;
		border-radius: 6px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		font-family: var(--mono);
		font-size: 0.72rem;
		color: var(--text-muted);
		text-decoration: none;
		transition:
			color 140ms,
			border-color 140ms;
		flex-shrink: 0;
	}
	.file-pill:hover {
		color: var(--brand-red);
		border-color: var(--brand-red);
	}
	.card-summary {
		font-family: var(--sans);
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--text-secondary, var(--text-primary));
		margin: 0;
		max-width: 70ch;
	}
	.footnote {
		font-family: var(--sans);
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--text-muted);
		margin: 0;
		max-width: 75ch;
	}

	/* Canvas */
	.canvas {
		min-height: 280px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.canvas-stat {
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--text-muted);
		padding-top: 8px;
		border-top: 1px dashed var(--border-primary);
	}
	.canvas-stat strong {
		color: var(--brand-red);
		font-weight: 700;
	}

	/* Terminal sub-panel */
	.terminal {
		background: #0d1117;
		color: #c9d1d9;
		border-radius: 6px;
		padding: 12px 14px;
		font-family: var(--mono);
		font-size: 0.78rem;
		line-height: 1.55;
		overflow: hidden;
		flex: 1;
	}
	.term-bar {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.7rem;
		color: #8b949e;
		margin-bottom: 8px;
	}
	.term-dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: #3fb950;
	}
	.term-cmd {
		color: #d2a8ff;
		margin-bottom: 6px;
	}
	.term-prompt {
		color: var(--brand-red);
		margin-right: 6px;
	}
	.term-line {
		display: flex;
		align-items: baseline;
		gap: 10px;
		opacity: 0;
		transform: translateY(-2px);
		animation: slide-in 280ms ease forwards;
		animation-delay: calc(var(--i) * 65ms);
	}
	.term-idx {
		color: #8b949e;
	}
	.term-name {
		color: #79c0ff;
		flex: 0 0 auto;
		min-width: 220px;
	}
	.term-meta {
		color: #8b949e;
		flex: 1;
	}
	.term-ok {
		color: #3fb950;
	}
	.term-line.dim {
		opacity: 1;
		color: #8b949e;
	}
	.term-line.foot {
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px dashed #30363d;
		color: #c9d1d9;
		opacity: 1;
	}
	.term-line.foot strong {
		color: #ff7b72;
	}
	.caret {
		display: inline-block;
		width: 7px;
		height: 11px;
		background: #c9d1d9;
		opacity: 0.85;
		animation: blink 1.3s steps(2, start) infinite;
		vertical-align: middle;
		margin-right: 6px;
	}
	@keyframes slide-in {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@keyframes blink {
		to {
			opacity: 0;
		}
	}

	/* Step 2: scrape grid */
	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		flex: 1;
	}
	.tile {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.tile-name {
		font-family: var(--mono);
		font-size: 0.72rem;
		color: var(--text-muted);
	}
	.tile-num {
		font-family: var(--mono);
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--brand-red);
		font-variant-numeric: tabular-nums;
	}
	.tile-lbl {
		font-family: var(--mono);
		font-size: 0.65rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.grid-foot {
		display: flex;
		justify-content: space-between;
		font-family: var(--mono);
		font-size: 0.78rem;
		color: var(--text-muted);
		padding-top: 8px;
		border-top: 1px dashed var(--border-primary);
	}
	.grid-total strong {
		color: var(--brand-red);
	}

	/* Step 3: PR cards */
	.prs {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.pr {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-md);
		padding: 10px 14px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		opacity: 0;
		transform: translateY(-3px);
		animation: slide-in 300ms ease forwards;
		animation-delay: calc(var(--i) * 115ms);
	}
	.pr.dropped {
		border-color: rgba(220, 36, 24, 0.4);
		background: rgba(220, 36, 24, 0.04);
	}
	.pr-l {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}
	.pr-id {
		font-family: var(--mono);
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}
	.pr-title {
		font-family: var(--sans);
		font-size: 0.92rem;
		color: var(--text-primary);
	}
	.pr-meta {
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--text-muted);
	}
	.tok {
		display: inline-block;
		padding: 0 3px;
		border-radius: 3px;
	}
	.tok.pos {
		background: rgba(31, 138, 76, 0.16);
		color: #0a6b39;
		font-weight: 600;
	}
	.tok.neg {
		background: rgba(220, 36, 24, 0.14);
		color: var(--brand-red);
		text-decoration: line-through;
	}
	.pr-r {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
		flex-shrink: 0;
	}
	.pr-verdict {
		font-family: var(--mono);
		font-size: 0.78rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 4px;
	}
	.pr-verdict.kept {
		background: rgba(31, 138, 76, 0.14);
		color: #0a6b39;
	}
	.pr-verdict.dropped {
		background: rgba(220, 36, 24, 0.14);
		color: var(--brand-red);
	}
	.pr-reason {
		font-family: var(--sans);
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	/* Step 4: classify flow */
	.classify {
		display: grid;
		grid-template-columns: 1fr auto 1fr auto 1fr;
		gap: 10px;
		align-items: stretch;
	}
	.cls-col {
		display: flex;
		flex-direction: column;
		gap: 4px;
		opacity: 0.4;
		transition: opacity 350ms;
	}
	.cls-col.on {
		opacity: 1;
	}
	.cls-cap {
		font-family: var(--mono);
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		font-weight: 600;
	}
	.cls-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}
	.cls-llm-card {
		background: rgba(220, 36, 24, 0.04);
		border-color: rgba(220, 36, 24, 0.4);
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	.cls-llm-name {
		font-family: var(--mono);
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--brand-red);
	}
	.cls-llm-meta {
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--text-muted);
	}
	.cls-llm-bias {
		font-family: var(--sans);
		font-size: 0.7rem;
		color: var(--text-muted);
		font-style: italic;
		margin-top: 4px;
	}
	.cls-row {
		font-family: var(--mono);
		font-size: 0.74rem;
		color: var(--text-primary);
		display: flex;
		gap: 8px;
		align-items: baseline;
	}
	.cls-k {
		color: var(--text-muted);
		min-width: 64px;
	}
	.cls-yes {
		font-weight: 700;
		color: #0a6b39;
	}
	.cls-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--border-primary);
		transition: color 350ms;
	}
	.cls-arrow.on {
		color: var(--brand-red);
	}
	.cls-arrow svg {
		display: block;
	}
	.cls-cats {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 8px;
	}
	.cls-cat {
		font-family: var(--mono);
		font-size: 0.66rem;
		padding: 2px 7px;
		border-radius: 999px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		color: var(--text-muted);
	}
	.cls-cat.active {
		background: var(--brand-red-soft);
		border-color: var(--brand-red);
		color: var(--brand-red);
		font-weight: 600;
	}

	/* Step 6: timeline */
	.timeline {
		position: relative;
		height: 130px;
		padding: 0 var(--space-md);
		flex: 1;
	}
	.tl-axis {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--border-primary);
	}
	.tl-self {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		z-index: 2;
	}
	.tl-dot {
		width: 14px;
		height: 14px;
		border-radius: 999px;
		background: var(--brand-red);
		box-shadow: 0 0 0 4px rgba(220, 36, 24, 0.18);
	}
	.tl-self-lbl {
		font-family: var(--mono);
		font-size: 0.74rem;
		font-weight: 700;
		color: var(--brand-red);
	}
	.tl-neighbor {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}
	.tl-neigh-dot {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: var(--text-muted);
	}
	.tl-neighbor.fail .tl-neigh-dot {
		background: rgba(220, 36, 24, 0.5);
	}
	.tl-neighbor.tried .tl-neigh-dot {
		background: #0a6b39;
		box-shadow: 0 0 0 3px rgba(31, 138, 76, 0.18);
	}
	.tl-neigh-lbl {
		font-family: var(--mono);
		font-size: 0.62rem;
		color: var(--text-muted);
		text-align: center;
		line-height: 1.1;
		margin-top: 14px;
	}
	.tl-result {
		font-family: var(--mono);
		font-size: 0.82rem;
		color: var(--text-primary);
		opacity: 0;
		transition: opacity 300ms;
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.tl-result.on {
		opacity: 1;
	}
	.ok-chip {
		background: rgba(31, 138, 76, 0.14);
		color: #0a6b39;
		padding: 2px 8px;
		border-radius: 4px;
		font-weight: 700;
	}
	.tl-note {
		font-family: var(--sans);
		font-size: 0.72rem;
		color: var(--text-muted);
		font-style: italic;
		margin-left: auto;
	}

	/* Step 7: agent log */
	.agent {
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex: 1;
	}
	.agent-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
		font-family: var(--mono);
		font-size: 0.72rem;
	}
	.agent-pill {
		padding: 2px 8px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 4px;
		color: var(--text-primary);
	}
	.agent-sep {
		color: var(--text-muted);
	}
	.turns {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.turn {
		padding: 8px 12px;
		background: var(--bg-secondary);
		border-left: 3px solid var(--brand-red);
		border-radius: 4px;
		opacity: 0;
		transform: translateY(-3px);
		animation: slide-in 300ms ease forwards;
		animation-delay: calc(var(--i) * 125ms);
	}
	.turn-head {
		display: flex;
		align-items: baseline;
		gap: 10px;
		font-family: var(--mono);
		font-size: 0.7rem;
	}
	.turn-num {
		font-weight: 700;
		color: var(--brand-red);
		letter-spacing: 0.06em;
	}
	.turn-label {
		text-transform: uppercase;
		color: var(--text-muted);
		letter-spacing: 0.08em;
	}
	.turn-label.obs {
		color: #0a6b39;
	}
	.turn-body {
		font-family: var(--sans);
		font-size: 0.85rem;
		color: var(--text-primary);
		margin-top: 2px;
	}
	.turn-tool {
		font-family: var(--mono);
		font-size: 0.72rem;
		color: var(--text-muted);
		margin-top: 4px;
	}
	.tool-arrow {
		color: var(--brand-red);
		margin-right: 4px;
	}

	/* Step 8: checks */
	.checks {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
	}
	.check {
		background: var(--bg-secondary);
		border: 1.5px solid rgba(31, 138, 76, 0.4);
		border-radius: 6px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		opacity: 0;
		transform: scale(0.96);
		animation: pop-in 280ms ease forwards;
		animation-delay: calc(var(--i) * 175ms);
	}
	.check-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 6px;
	}
	.check-cmd {
		font-family: var(--mono);
		font-size: 0.75rem;
		color: var(--text-primary);
	}
	.check-ok {
		color: #0a6b39;
		font-weight: 700;
		font-family: var(--mono);
	}
	.check-detail {
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--text-muted);
	}
	@keyframes pop-in {
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* Step 9: bench bars */
	.bench {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-family: var(--mono);
		font-size: 0.82rem;
		flex: 1;
	}
	.bench-head {
		display: grid;
		grid-template-columns: 1.2fr 1.6fr 1.6fr;
		gap: 14px;
		font-size: 0.66rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding-bottom: 6px;
		border-bottom: 1px dashed var(--border-primary);
	}
	.bench-row {
		display: grid;
		grid-template-columns: 1.2fr 1.6fr 1.6fr;
		gap: 14px;
		align-items: center;
		padding: 6px 0;
		opacity: 0;
		transform: translateY(-2px);
		animation: slide-in 350ms ease forwards;
		animation-delay: calc(var(--i) * 190ms);
	}
	.bench-c1 {
		color: var(--text-primary);
	}
	.bench-c2,
	.bench-c3 {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--text-secondary, var(--text-primary));
		font-variant-numeric: tabular-nums;
	}
	.bar {
		display: inline-block;
		height: 10px;
		border-radius: 2px;
		max-width: 110px;
	}
	.bar-base {
		background: #94a3b8;
	}
	.bar-expert {
		background: var(--brand-red);
	}
	.bench-num {
		font-size: 0.74rem;
		color: var(--text-muted);
	}
	.bench-aside {
		font-family: var(--mono);
		font-size: 0.74rem;
		color: var(--text-muted);
		padding-top: 8px;
		border-top: 1px dashed var(--border-primary);
	}
	.bench-aside code {
		color: var(--brand-red);
		font-weight: 600;
	}

	/* Step 10: MWU */
	.mwu {
		opacity: 0.5;
		transition: opacity 300ms;
	}
	.mwu.on {
		opacity: 1;
	}
	.mwu-cap {
		font-family: var(--mono);
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: 8px;
	}
	.mwu-hist {
		position: relative;
		height: 80px;
		display: flex;
		align-items: flex-end;
		gap: 2px;
		padding: 0 6px;
	}
	.hist-bar {
		flex: 1 0 0;
		min-width: 18px;
		display: block;
		height: var(--h);
		border-radius: 2px 2px 0 0;
		opacity: 0;
		animation: pop-in 350ms ease forwards;
		animation-delay: calc(var(--i) * 40ms);
	}
	.hist-base {
		background: rgba(148, 163, 184, 0.7);
	}
	.hist-expert {
		background: rgba(220, 36, 24, 0.7);
		margin-left: -28px;
	}
	.mwu-axis {
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--text-muted);
		margin-top: 6px;
	}
	.mwu-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-md);
		padding-top: 12px;
		border-top: 1px dashed var(--border-primary);
		margin-top: 12px;
	}
	.mwu-pval {
		display: flex;
		gap: 10px;
		align-items: baseline;
		font-family: var(--mono);
		font-size: 0.85rem;
		opacity: 0;
		transition: opacity 300ms;
	}
	.mwu-pval.on {
		opacity: 1;
	}
	.mwu-eq {
		color: var(--text-muted);
	}
	.mwu-val {
		color: var(--brand-red);
		font-weight: 700;
	}
	.mwu-thr {
		color: var(--text-muted);
		font-size: 0.72rem;
	}
	.mwu-pass {
		background: rgba(31, 138, 76, 0.14);
		color: #0a6b39;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 4px;
	}
	.ship {
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--text-primary);
		opacity: 0;
		transition: opacity 300ms;
	}
	.ship.on {
		opacity: 1;
	}
	.ship code {
		color: var(--brand-red);
		font-weight: 600;
	}

	/* Controls */
	.controls {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border-primary);
	}
	.ctl {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: 0;
		background: transparent;
		color: var(--text-muted);
		border-radius: var(--radius);
		cursor: pointer;
		transition: color 140ms;
	}
	.ctl:hover:not(:disabled) {
		color: var(--brand-red);
	}
	.ctl:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.play-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 999px;
		border: 1.5px solid var(--brand-red);
		background: rgba(220, 36, 24, 0.06);
		color: var(--brand-red);
		cursor: pointer;
		transition:
			background 140ms,
			transform 140ms;
	}
	.play-btn:hover {
		background: rgba(220, 36, 24, 0.14);
		transform: scale(1.04);
	}
	.counter {
		font-family: var(--mono);
		font-size: 0.82rem;
		color: var(--text-muted);
		margin-left: 4px;
	}
	.counter strong {
		color: var(--brand-red);
		font-weight: 700;
	}
	.counter-sep {
		opacity: 0.4;
		margin: 0 2px;
	}
	.counter-phase {
		color: var(--text-muted);
	}
	.speeds {
		display: inline-flex;
		gap: 2px;
		margin-left: auto;
		padding: 2px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 999px;
	}
	.speed {
		font-family: var(--mono);
		font-size: 0.7rem;
		font-weight: 600;
		padding: 4px 9px;
		border: 0;
		background: transparent;
		color: var(--text-muted);
		border-radius: 999px;
		cursor: pointer;
	}
	.speed.active {
		background: var(--brand-red);
		color: #fff;
	}

	/* Combined nested stepper: phase blocks encapsulate substeps.
	   Active phase = low-saturation tint. Active substep = high-saturation fill. */
	.phase-strip {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		flex-wrap: wrap;
	}
	.phase-block {
		flex: 0 1 auto;
		padding: 8px 12px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-self: center;
		transition:
			background 220ms,
			border-color 220ms,
			padding 220ms;
	}
	.phase-block.collapsed {
		flex: 0 0 auto;
		padding: 0;
	}
	.phase-block.collapsed .phase-head {
		padding: 6px 14px;
	}
	.phase-block.done {
		background: rgba(220, 36, 24, 0.035);
		border-color: rgba(220, 36, 24, 0.25);
	}
	/* Soft (low-saturation) wash for the currently-active phase */
	.phase-block.active {
		background: rgba(220, 36, 24, 0.06);
		border-color: rgba(220, 36, 24, 0.45);
	}
	.phase-head {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0 0 2px;
		background: transparent;
		border: 0;
		cursor: pointer;
		font-family: inherit;
		color: inherit;
		text-align: left;
		transition: color 160ms;
	}
	.phase-head:hover .phase-name {
		color: var(--brand-red);
	}
	.phase-head:focus-visible {
		outline: 2px solid var(--brand-red);
		outline-offset: 2px;
		border-radius: 6px;
	}
	.phase-name {
		font-family: var(--sans);
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		transition: color 200ms;
	}
	.phase-block.active .phase-name,
	.phase-block.done .phase-name {
		color: var(--brand-red);
	}
	.phase-subs {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.substep {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 4px 9px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 999px;
		font-family: inherit;
		cursor: pointer;
		transition:
			background 160ms,
			border-color 160ms,
			color 160ms,
			box-shadow 160ms;
	}
	.substep:hover {
		border-color: var(--brand-red);
	}
	.substep-n {
		font-family: var(--mono);
		font-size: 0.66rem;
		font-weight: 700;
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}
	.substep-name {
		font-family: var(--mono);
		font-size: 0.66rem;
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}
	.substep.done {
		background: rgba(220, 36, 24, 0.12);
		border-color: rgba(220, 36, 24, 0.5);
	}
	.substep.done .substep-n,
	.substep.done .substep-name {
		color: var(--brand-red);
	}
	/* High-saturation fill for the active substep within its phase */
	.substep.active {
		background: var(--brand-red);
		border-color: var(--brand-red);
		box-shadow: 0 0 0 3px rgba(220, 36, 24, 0.18);
	}
	.substep.active .substep-n,
	.substep.active .substep-name {
		color: #fff;
		font-weight: 700;
	}
	.phase-arrow {
		display: inline-block;
		flex: 0 0 auto;
		color: var(--border-primary);
		align-self: center;
	}

	/* Step 3 — ambiguous chip */
	.amb-chip {
		display: inline-block;
		margin-left: 6px;
		padding: 1px 6px;
		font-family: var(--mono);
		font-size: 0.62rem;
		font-weight: 600;
		background: rgba(148, 163, 184, 0.18);
		color: var(--text-muted);
		border-radius: 3px;
		font-style: italic;
		letter-spacing: 0.02em;
	}
	.pr-verdict {
		display: inline-flex;
		align-items: center;
	}

	/* Step 4 — single-card-at-a-time spotlight */
	.cls-row-anim {
		opacity: 0;
		transform: translateY(-2px);
		animation: slide-in 280ms ease forwards;
		animation-delay: calc(var(--i) * 90ms);
	}
	.cls-breadcrumb {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--text-muted);
		padding-bottom: 8px;
		border-bottom: 1px dashed var(--border-primary);
		flex-wrap: wrap;
	}
	.cls-crumb {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 3px 9px;
		border-radius: 999px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		transition:
			background 200ms,
			border-color 200ms,
			color 200ms;
	}
	.cls-crumb-n {
		font-weight: 700;
		letter-spacing: 0.04em;
	}
	.cls-crumb-lbl {
		text-transform: lowercase;
	}
	.cls-crumb.done {
		background: rgba(220, 36, 24, 0.08);
		border-color: rgba(220, 36, 24, 0.35);
		color: var(--brand-red);
	}
	.cls-crumb.active {
		background: var(--brand-red);
		border-color: var(--brand-red);
		color: #fff;
		box-shadow: 0 0 0 3px rgba(220, 36, 24, 0.18);
	}
	.cls-crumb-sep {
		color: var(--text-muted);
		display: inline-block;
		vertical-align: middle;
		flex: 0 0 auto;
	}
	.classify {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10px;
		flex: 1;
		padding: 8px 0 4px;
	}
	.cls-col {
		flex: 1 1 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		opacity: 0;
		transform: translateX(-12px);
		animation: cls-slide-in 360ms ease forwards;
		align-self: center;
	}
	.cls-v {
		color: var(--text-primary);
	}
	.cls-arrow.on {
		opacity: 0;
		animation: cls-arrow-in 360ms ease forwards;
	}
	.cls-done {
		background: rgba(31, 138, 76, 0.14);
		border-color: rgba(31, 138, 76, 0.35);
		color: #0a6b39;
	}
	.cls-done .cls-thinking-lbl {
		color: #0a6b39;
		font-style: normal;
		font-weight: 600;
	}
	@keyframes cls-slide-in {
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	@keyframes cls-arrow-in {
		to {
			opacity: 1;
		}
	}

	/* Step 6 — verify_build CLI terminals */
	.verify-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
		flex: 1;
	}
	.verify-term {
		background: #0d1117;
		color: #c9d1d9;
		border-radius: 6px;
		padding: 10px 12px;
		font-family: var(--mono);
		font-size: 0.74rem;
		line-height: 1.55;
		display: flex;
		flex-direction: column;
		gap: 4px;
		transition:
			opacity 280ms,
			border-color 280ms;
		border: 1px solid transparent;
	}
	.verify-term.dim {
		opacity: 0.35;
	}
	.verify-term.running {
		border-color: rgba(217, 119, 6, 0.5);
	}
	.verify-term .term-bar {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}
	.verify-term .term-cmd {
		color: #d2a8ff;
		margin-bottom: 4px;
		font-size: 0.72rem;
	}
	.term-dot.running {
		background: #d97706;
		animation: pulse-amber-dot 0.9s ease-in-out infinite;
	}
	.term-dot.done {
		background: #3fb950;
	}
	.term-elapsed {
		margin-left: auto;
		font-size: 0.66rem;
		color: #8b949e;
		font-variant-numeric: tabular-nums;
	}
	.vt-line {
		display: flex;
		gap: 6px;
		color: #c9d1d9;
		opacity: 0;
		animation: slide-in 220ms ease forwards;
	}
	.vt-p {
		color: #79c0ff;
		flex-shrink: 0;
	}
	.vt-line.ok {
		color: #3fb950;
		font-weight: 600;
	}
	.vt-spin-line {
		color: #d97706;
	}
	.vt-spin {
		display: inline-block;
		width: 1ch;
		color: #d97706;
		font-weight: 700;
	}
	.vt-spin-lbl {
		color: #8b949e;
		font-style: italic;
	}
	@keyframes pulse-amber-dot {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(217, 119, 6, 0.35);
		}
		50% {
			box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.18);
		}
	}

	/* Step 4 — thinking indicator on classifier card */
	.cls-thinking {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
		padding: 4px 10px;
		background: rgba(220, 36, 24, 0.06);
		border: 1px solid rgba(220, 36, 24, 0.25);
		border-radius: 999px;
		font-family: var(--mono);
		font-size: 0.74rem;
		color: var(--brand-red);
	}
	.cls-spin {
		display: inline-block;
		width: 1ch;
		font-weight: 700;
	}
	.cls-thinking-lbl {
		color: var(--text-muted);
		font-style: italic;
	}

	/* Step 7 — try_similar as a 2D chart: day labels at the top with subtle
	   dashed vertical gridlines, dots on the axis, sha labels below the dots,
	   verdict badges below the sha row, PR # tag at the very bottom. */
	.tl-wrap {
		position: relative;
		height: 220px;
		padding: 0 var(--space-md);
		margin-top: 8px;
		flex: 1;
	}
	.tl-grid {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.tl-gridcol {
		position: absolute;
		top: 0;
		bottom: 0;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.tl-day {
		font-family: var(--mono);
		font-size: 0.66rem;
		font-weight: 600;
		color: var(--text-muted);
		letter-spacing: 0.02em;
		padding: 1px 6px;
		background: var(--bg-primary);
		position: relative;
		z-index: 2;
		flex: 0 0 auto;
	}
	.tl-gridline {
		flex: 1;
		width: 0;
		border-left: 1px dashed rgba(0, 0, 0, 0.07);
	}
	.tl-axis-line {
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--border-primary);
		z-index: 1;
	}
	.tl-node {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		z-index: 2;
	}
	.tl-node-dot {
		width: 9px;
		height: 9px;
		border-radius: 999px;
		background: var(--text-muted);
		opacity: 0.55;
		transition:
			background 220ms,
			box-shadow 220ms,
			transform 220ms,
			opacity 220ms;
	}
	.tl-node-lbl {
		position: absolute;
		top: 14px;
		font-family: var(--mono);
		font-size: 0.62rem;
		color: var(--text-muted);
		line-height: 1.1;
		white-space: nowrap;
		padding: 0 4px;
		background: var(--bg-primary);
	}
	.tl-node.trying .tl-node-dot {
		background: #d97706;
		opacity: 1;
		box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.22);
		animation: pulse-amber 0.8s ease-in-out infinite;
	}
	.tl-node.decided.fail .tl-node-dot {
		background: var(--brand-red);
		opacity: 1;
		box-shadow: 0 0 0 3px rgba(220, 36, 24, 0.18);
		transform: scale(1.15);
	}
	.tl-node.decided.pass .tl-node-dot {
		background: #0a6b39;
		opacity: 1;
		box-shadow: 0 0 0 4px rgba(31, 138, 76, 0.22);
		transform: scale(1.3);
	}
	.tl-badge {
		position: absolute;
		top: 36px;
		font-family: var(--mono);
		font-size: 0.66rem;
		font-weight: 700;
		padding: 2px 7px;
		border-radius: 3px;
		white-space: nowrap;
		letter-spacing: 0.02em;
		z-index: 3;
	}
	.tl-badge.trying {
		background: rgba(217, 119, 6, 0.14);
		color: #b35d04;
		border: 1px solid rgba(217, 119, 6, 0.35);
	}
	.tl-badge.fail {
		background: rgba(220, 36, 24, 0.14);
		color: var(--brand-red);
		border: 1px solid rgba(220, 36, 24, 0.35);
	}
	.tl-badge.pass {
		background: rgba(31, 138, 76, 0.16);
		color: #0a6b39;
		border: 1px solid rgba(31, 138, 76, 0.4);
	}
	.tl-self-marker {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		z-index: 2;
	}
	.tl-self-dot {
		width: 16px;
		height: 16px;
		border-radius: 999px;
		background: var(--brand-red);
		box-shadow: 0 0 0 5px rgba(220, 36, 24, 0.18);
		animation: pulse-dot 1.4s ease-in-out infinite;
	}
	.tl-self-tag {
		position: absolute;
		top: 70px;
		font-family: var(--mono);
		font-size: 0.74rem;
		font-weight: 700;
		color: var(--brand-red);
		white-space: nowrap;
		padding: 2px 6px;
		background: var(--bg-primary);
		z-index: 3;
	}
	@keyframes pulse-amber {
		0%,
		100% {
			box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.22);
		}
		50% {
			box-shadow: 0 0 0 8px rgba(217, 119, 6, 0.1);
		}
	}
	.tl-caption code {
		color: var(--brand-red);
		font-weight: 600;
	}
	@keyframes pulse-dot {
		0%,
		100% {
			box-shadow: 0 0 0 5px rgba(220, 36, 24, 0.18);
		}
		50% {
			box-shadow: 0 0 0 9px rgba(220, 36, 24, 0.1);
		}
	}

	/* Step 9 — measure two-machine handoff */
	.machines {
		display: grid;
		grid-template-columns: 1fr 1.2fr 1fr;
		gap: 8px;
		align-items: stretch;
	}
	.machine {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 10px 12px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		opacity: 0.4;
		transition:
			opacity 300ms,
			border-color 300ms;
	}
	.machine.on {
		opacity: 1;
		border-color: var(--brand-red);
		background: var(--brand-red-soft);
	}
	.m-tag {
		font-family: var(--mono);
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}
	.m-name {
		font-family: var(--mono);
		font-size: 0.86rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.m-sub {
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--text-muted);
		line-height: 1.35;
	}
	.m-arrows {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 8px;
	}
	.m-arrow {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--brand-red);
		opacity: 0;
		transform: translateX(-4px);
		transition:
			opacity 300ms,
			transform 300ms;
	}
	.m-arrow.on {
		opacity: 1;
		transform: translateX(0);
	}
	.m-arrow-back {
		transform: translateX(4px);
	}
	.m-arrow-back.on {
		transform: translateX(0);
	}
	.m-arrow-lbl {
		color: var(--text-muted);
	}
	.m-arrow-glyph {
		display: block;
		flex: 0 0 auto;
	}

	/* Step 10 — publish targets */
	.publish {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
	}
	.verified-row {
		display: flex;
		align-items: baseline;
		gap: 10px;
		padding-bottom: 8px;
		border-bottom: 1px dashed var(--border-primary);
		opacity: 0;
		transition: opacity 320ms;
	}
	.verified-row.on {
		opacity: 1;
	}
	.verified-badge {
		display: inline-block;
		padding: 3px 10px;
		background: rgba(31, 138, 76, 0.14);
		color: #0a6b39;
		border-radius: 4px;
		font-family: var(--mono);
		font-size: 0.82rem;
		font-weight: 700;
	}
	.verified-sub {
		font-family: var(--sans);
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.targets {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.target {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 6px;
		opacity: 0;
		transform: translateX(-6px);
		animation: slide-in-x 360ms ease forwards;
		animation-delay: calc(var(--i) * 160ms);
	}
	.target-tag {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 56px;
		height: 24px;
		padding: 0 8px;
		border-radius: 4px;
		background: var(--brand-red);
		color: #fff;
		font-family: var(--mono);
		font-size: 0.66rem;
		font-weight: 700;
		letter-spacing: 0.04em;
	}
	.target-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.target-name {
		font-family: var(--sans);
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	.target-detail {
		font-family: var(--mono);
		font-size: 0.72rem;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.target-ok {
		font-family: var(--mono);
		font-size: 0.74rem;
		color: #0a6b39;
		font-weight: 700;
	}
	@keyframes slide-in-x {
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Responsive */
	@media (max-width: 820px) {
		.stepper {
			display: none;
		}
		.stepper-mobile {
			display: flex;
		}
		.card-content {
			padding: var(--space-md);
		}
		.classify {
			grid-template-columns: 1fr;
		}
		.cls-arrow {
			transform: rotate(90deg);
			justify-self: center;
		}
		.verify-grid {
			grid-template-columns: 1fr;
		}
		.machines {
			grid-template-columns: 1fr;
		}
		.m-arrows {
			flex-direction: row;
			justify-content: space-around;
		}
		.bench-head,
		.bench-row {
			grid-template-columns: 1fr 1fr 1fr;
			gap: 8px;
		}
		.bar {
			max-width: 60px;
			height: 8px;
		}
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.term-name {
			min-width: 0;
		}
		.phase-strip {
			gap: 2px;
		}
		.phase-block {
			min-width: 100px;
			padding: 6px 10px;
		}
		.phase-sub {
			display: none;
		}
	}

	@media (max-width: 520px) {
		.card-title {
			font-size: 1.05rem;
		}
		.controls {
			flex-wrap: wrap;
		}
		.speeds {
			margin-left: 0;
		}
		.tl-node-lbl {
			font-size: 0.55rem;
		}
		.cls-cats {
			display: none;
		}
		.phase-arrow {
			display: none;
		}
	}
</style>
