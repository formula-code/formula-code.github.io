<script>
	import { getContext, onDestroy, onMount } from "svelte";
	import inView from "$actions/inView.js";
	import SectionShell from "$components/sections/SectionShell.svelte";
	import dashboard from "$data/dashboard.json";

	const copy = getContext("copy") || {};
	const cfg = copy?.overview?.landingSections?.[0] || {};
	$: sectionTitle = cfg.title || "How does FormulaCode find code optimization tasks?";
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

	const STEPS = [
		{
			phase: 1,
			phaseName: "Discover",
			name: "find_repos",
			title: "Scan GitHub for repos with performance benchmarks",
			file: "datasmith/runners/scrape_repos.py",
			fileUrl: `${DATASMITH}/src/datasmith/runners/scrape_repos.py`,
			summary:
				"For each (owner, repo) candidate — sourced from a CommonSQL query against the GitHub Public Dataset that filters for asv.conf.json presence — fetch metadata via the GitHub REST API and upsert a row into the repositories table with stars, language, topics, and description.",
			footnote:
				"The discovery query runs in BigQuery in seconds and stays under $10/run. Concurrency knob: n_concurrent (default 5). Discovery is monthly and fully resumable."
		},
		{
			phase: 1,
			phaseName: "Discover",
			name: "scrape_prs",
			title: "Page every merged pull request",
			file: "datasmith/runners/scrape_commits.py",
			fileUrl: `${DATASMITH}/src/datasmith/runners/scrape_commits.py`,
			summary:
				"For each candidate repository, paginate every merged pull request via the GitHub REST API within an optional date window. For each PR, fetch the diff and file changes, run symbolic_compliance() to mark is_performance_commit_symbolic, and upsert into the pull_requests table.",
			footnote:
				"Throughput is bounded by GitHub rate limits, not our compute. Date-windowed runs (--start-date / --end-date) make monthly scraping idempotent."
		},
		{
			phase: 1,
			phaseName: "Discover",
			name: "attribute_filter",
			title: "Drop PRs that obviously aren't perf",
			file: "datasmith/filters.py",
			fileUrl: `${DATASMITH}/src/datasmith/filters.py`,
			summary:
				"symbolic_compliance() runs three cheap checks: a regex over the PR title (perf keywords pass, doc/version/lint/typo keywords fail), a patch-token-count gate, and a file-level check that requires at least one core (non-test/doc/benchmark/CI) file. Anything ambiguous is forwarded.",
			footnote:
				"Thresholds: ≤500 files, ≤40,000 total additions+deletions, patch ≤16,000 tokens (tiktoken cl100k_base). Recall-first — a passing title alone is enough; only a clearly negative title with no positive cue gets dropped pre-LLM."
		},
		{
			phase: 2,
			phaseName: "Judge",
			name: "classify",
			title: "Ask an LLM if the PR is really a perf change",
			file: "datasmith/runners/classify_prs.py",
			fileUrl: `${DATASMITH}/src/datasmith/runners/classify_prs.py`,
			summary:
				"Two LLM passes. ProblemClassifier first decides binary YES/NO using the PR description, patch, and file change summary. If YES, ClassifyJudge picks one of 13 optimization categories (Cache And Reuse, Use Better Algorithm, …) and a difficulty (Easy/Medium/Hard). Both labels land on pull_requests.",
			footnote:
				"Local openai/gpt-oss-120b via the LiteLLM proxy at model.formulacode.org. Tuned for recall — ambiguous PRs return YES; the speedup gate at the end of the pipeline is what discards false positives."
		},
		{
			phase: 3,
			phaseName: "Build",
			name: "resolve_packages",
			title: "Pin a buildable dependency set",
			file: "datasmith/runners/resolve_packages.py",
			fileUrl: `${DATASMITH}/src/datasmith/runners/resolve_packages.py`,
			summary:
				"For each classified PR, analyze_commit() detects the package's pyproject.toml/setup.py/setup.cfg, infers the Python version, and pins a full transitive dependency closure with uv. Sets can_install=True/False on the packages table. PRs with can_install=False are skipped downstream.",
			footnote:
				"uv pins every transitive dep against the package versions that existed on the PR's merge date. Concurrency knob: n_concurrent (default 16) — this stage is the most parallelizable in the pipeline."
		},
		{
			phase: 3,
			phaseName: "Build",
			name: "try_similar",
			title: "Reuse a build script from a nearby commit",
			file: "datasmith/agents/synthesizer.py",
			fileUrl: `${DATASMITH}/src/datasmith/agents/synthesizer.py`,
			summary:
				"The Synthesizer state machine first hits CHECK_CACHE, then FIND_SIMILAR + TRY_SIMILAR — successful build scripts from the same repo, ordered by absolute commit-date distance from this PR. If none verify, fall through to TRY_DEFAULT (the stock template). Most PRs build before any LLM call.",
			footnote:
				"Cache → similar → default → LLM cascade. Per-repo guards short-circuit redundant work: once TRY_DEFAULT succeeds for a repo, later PRs go straight to TRY_SIMILAR; after max_default_failures_per_repo, the pipeline gives up on TRY_DEFAULT for that repo."
		},
		{
			phase: 3,
			phaseName: "Build",
			name: "agent_loop",
			title: "Spin up a reflexive agent if nothing fits",
			file: "datasmith/agents/synthesizer.py",
			fileUrl: `${DATASMITH}/src/datasmith/agents/synthesizer.py`,
			summary:
				"When the cascade fails, LLM_GENERATE hands the build to a swappable installed agent (Claude / Codex / Gemini / Qwen) running in a sandboxed container. The agent reads the repo, edits docker_build_pkg.sh, and re-runs the verifier loop until the smoke checks pass or max_attempts (default 2) is exhausted.",
			footnote:
				"Each agent runs through datasmith.agents.installed.{claude,codex,gemini,qwen} with a shared rate-limit handler and tamper-audit pass. Successful contexts are checkpointed into candidate_containers so future neighbors can reuse them."
		},
		{
			phase: 3,
			phaseName: "Build",
			name: "verify_build",
			title: "Make sure the container actually runs",
			file: "datasmith/docker/verifiers.py",
			fileUrl: `${DATASMITH}/src/datasmith/docker/verifiers.py`,
			summary:
				"MultiObjVerifier chains three checks against the built image: SmokeVerifier (`python -c 'import {package}'`), ProfileVerifier (`/profile.sh` — ASV smoke), and PytestVerifier (`/run-tests.sh`). The container survives only if all three pass.",
			footnote:
				"Three docker layers are baked separately: base (Ubuntu+micromamba+asv) → env (per-version conda envs) → pkg (editable install + smoke). Each layer is cached so a new PR in a known repo costs minutes, not hours."
		},
		{
			phase: 4,
			phaseName: "Verify & deploy",
			name: "measure",
			title: "Time base vs expert on a clean EC2 box",
			file: "datasmith/runners/harbor_healthcheck.py",
			fileUrl: `${DATASMITH}/src/datasmith/runners/harbor_healthcheck.py`,
			summary:
				"Materialize each task as a Harbor trial directory (via datasmith.harbor_adapter), batch-submit to Harbor's LocalOrchestrator, and let the oracle agent apply the human expert's patch and run ASV against base + patched code in an isolated EC2 container. Per-trial speedups land in harbor_runs.",
			footnote:
				"Hardware: AWS EC2 c5ad.large · 2 vCPUs · 4 GiB RAM · 75 GiB SSD per trial. Concurrency is set by Harbor's OrchestratorConfig.n_concurrent_trials, not the runner."
		},
		{
			phase: 4,
			phaseName: "Verify & deploy",
			name: "validate_and_publish",
			title: "Apply the speedup gate, then ship",
			file: "datasmith/publish/pipeline.py",
			fileUrl: `${DATASMITH}/src/datasmith/publish/pipeline.py`,
			summary:
				"Only PRs whose best harbor_runs row reports max_speedup ≥ MIN_SPEEDUP_GATE (1.05) survive the gate. Survivors get pushed to DockerHub (DockerHubPublisher) and HuggingFace (HuggingFacePublisher) under a monthly version tag, and stamped with published_at in Supabase.",
			footnote:
				"Mann–Whitney U significance is computed inside Harbor's measurement pass; harbor_healthcheck.py applies the 1.05× interestingness threshold on top. The combined gate is the only ground-truth precision filter in the entire pipeline."
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
		REPO_LINES.length, // ① find_repos: one beat per line
		8, // ② scrape_prs: s2Progress hits 1 at stepBeat 8
		SAMPLE_PRS.length, // ③ attribute_filter
		3, // ④ classify: input → llm → output
		RESOLVE_LINES.length, // ⑤ resolve_packages
		6, // ⑥ try_similar: s6Phase hits 2 at stepBeat 6
		AGENT_LOG.length, // ⑦ agent_loop
		CHECKS.length, // ⑧ verify_build
		BENCH.length, // ⑨ measure
		3 // ⑩ validate_and_publish: s10Stage hits 3 at stepBeat 3
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
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
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
	$: s1Visible = active === 0 ? Math.min(REPO_LINES.length, stepBeat) : REPO_LINES.length;

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

	// Step 3
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
			reason: "perf keyword match"
		},
		{
			id: 14922,
			tokens: [
				{ t: "Cache", k: "pos" },
				{ t: "repeated", k: "" },
				{ t: "dtype", k: "" },
				{ t: "lookups", k: "" },
				{ t: "in", k: "" },
				{ t: "DataFrame.apply", k: "" }
			],
			meta: "+47 / -19 · 2 files",
			verdict: "kept",
			reason: "perf keyword match"
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
			reason: "negative keyword + docs-only"
		},
		{
			id: 8845,
			tokens: [
				{ t: "Add", k: "" },
				{ t: "1500", k: "" },
				{ t: "test", k: "" },
				{ t: "cases", k: "" },
				{ t: "for", k: "" },
				{ t: "ndarray", k: "" }
			],
			meta: "+5128 / -0 · 612 files",
			verdict: "dropped",
			reason: ">500 files · tests/ only"
		}
	];
	$: s3Visible = active === 2 ? Math.min(SAMPLE_PRS.length, stepBeat) : SAMPLE_PRS.length;

	// Step 4
	$: s4Stage = active === 3 ? Math.min(3, stepBeat) : 3;

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
	$: s5Visible = active === 4 ? Math.min(RESOLVE_LINES.length, stepBeat) : RESOLVE_LINES.length;

	// Step 6
	const NEIGHBORS = [
		{ sha: "f8a2c1", days: -118, ok: true },
		{ sha: "21db4e", days: -76, ok: true },
		{ sha: "9c3a87", days: -47, ok: true },
		{ sha: "a3f12c", days: -22, ok: true },
		{ sha: "b7e019", days: -8, ok: true },
		{ sha: "5e8d44", days: 14, ok: true },
		{ sha: "ce6321", days: 33, ok: true },
		{ sha: "12abf0", days: 61, ok: false },
		{ sha: "7ef905", days: 92, ok: true },
		{ sha: "4d18b3", days: 137, ok: true }
	];
	$: s6Phase = active === 5 ? Math.min(2, Math.floor(stepBeat / 3)) : 2;

	// Step 7
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
	$: s7Visible = active === 6 ? Math.min(AGENT_LOG.length, stepBeat) : AGENT_LOG.length;

	// Step 8
	const CHECKS = [
		{ cmd: "python -c 'import pandas'", ok: true, detail: "0.4s" },
		{ cmd: "asv_smokecheck.py", ok: true, detail: "12.3s · 4 workloads" },
		{ cmd: "pytest -k smoke", ok: true, detail: "87 passed" }
	];
	$: s8Visible = active === 7 ? Math.min(CHECKS.length, stepBeat) : CHECKS.length;

	// Step 9
	const BENCH = [
		{ wl: "groupby_agg", base: 143.2, expert: 17.8 },
		{ wl: "rolling_mean", base: 89.4, expert: 89.1 },
		{ wl: "pivot_table", base: 512.0, expert: 312.0 },
		{ wl: "merge_asof", base: 71.0, expert: 23.4 }
	];
	const BENCH_MAX = Math.max(...BENCH.flatMap((r) => [r.base, r.expert]));
	$: s9Visible = active === 8 ? Math.min(BENCH.length, stepBeat) : BENCH.length;

	// Step 10
	$: s10Stage = active === 9 ? Math.min(3, stepBeat) : 3;
	const HISTO_BASE = [2, 4, 7, 11, 14, 12, 9, 5, 2, 1];
	const HISTO_EXPERT = [12, 18, 14, 8, 4, 2, 1, 0, 0, 0];
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
		<div class="eyebrow" aria-hidden="true">
			<span class="eyebrow-num">01</span>
			<span class="eyebrow-rule"></span>
		</div>

		<SectionShell
			title={sectionTitle}
			caption="From a GitHub repo to a benchmarked dataset row, ten substeps through the pipeline."
			linkHref={sectionLinkHref}
			linkLabel={sectionLinkLabel}
		/>

		<!-- Stepper SVG (desktop) -->
		<div class="stepper-wrap">
			<svg
				class="stepper"
				viewBox="0 0 {SVG_W} {SVG_H}"
				role="navigation"
				aria-label="Dataset pipeline substeps"
				preserveAspectRatio="xMidYMid meet"
			>
				{#each Array(N - 1) as _, i}
					<line
						x1={cx(i) + C_R + 2}
						y1={cy}
						x2={cx(i + 1) - C_R - 2}
						y2={cy}
						stroke="var(--border-primary)"
						stroke-width="2"
					/>
				{/each}
				{#each STEPS as s, i}
					<g
						class="stepper-node"
						class:active={i === active}
						class:done={i < active}
						role="button"
						tabindex="0"
						aria-label={`Substep ${i + 1}: ${s.title}${i === active ? " (current)" : ""}`}
						on:click={() => setActive(i)}
						on:keydown={(e) => (e.key === "Enter" || e.key === " ") && setActive(i)}
					>
						<circle cx={cx(i)} cy={cy} r={C_R} class="circle" />
						<text x={cx(i)} y={cy + 4} text-anchor="middle" class="circle-num">{i + 1}</text>
						<text x={cx(i)} y={cy + C_R + 18} text-anchor="middle" class="circle-label">{s.name}</text>
					</g>
				{/each}
			</svg>

			<!-- Mobile chip strip -->
			<div class="stepper-mobile" role="navigation" aria-label="Dataset pipeline substeps">
				{#each STEPS as s, i}
					<button
						class="chip"
						class:active={i === active}
						class:done={i < active}
						aria-label={`Substep ${i + 1}: ${s.title}`}
						on:click={() => setActive(i)}
					>
						<span class="chip-num">{i + 1}</span>
						<span class="chip-name">{s.name}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Active step card -->
		<div class="card" class:idle={!started}>
			{#if !started}
				<button class="overlay" on:click={startSimulation} aria-label="Start simulation">
					<span class="overlay-play">
						<svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true">
							<path d="M5 3 L12 8 L5 13 Z" fill="currentColor" />
						</svg>
					</span>
					<span class="overlay-caption">
						Watch how a FormulaCode task is built — from a GitHub repo to a benchmarked dataset row.
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
					<a class="file-pill" href={step.fileUrl} target="_blank" rel="noopener noreferrer">
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
							<div class="term-bar"><span class="term-dot"></span> gh search</div>
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
									<div class="term-line dim"><span class="caret"></span> scanning…</div>
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
									<div class="tile-num">+{fmt(Math.floor(t.target * s2Progress))}</div>
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
								<div class="pr" class:dropped={p.verdict === "dropped"} style="--i: {i}">
									<div class="pr-l">
										<span class="pr-id">PR #{p.id}</span>
										<span class="pr-title">
											{#each p.tokens as tok}
												<span class="tok" class:pos={tok.k === "pos"} class:neg={tok.k === "neg"}
													>{tok.t}</span
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
										</span>
										<span class="pr-reason">{p.reason}</span>
									</div>
								</div>
							{/each}
						</div>
					{:else if active === 3}
						<div class="classify">
							<div class="cls-col cls-input" class:on={s4Stage >= 0}>
								<div class="cls-cap">PR context</div>
								<div class="cls-card">
									<div class="cls-row">
										<span class="cls-k">title</span> Speed up groupby aggregation by 8x
									</div>
									<div class="cls-row">
										<span class="cls-k">diff</span> +183 / -42 across 3 files
									</div>
									<div class="cls-row">
										<span class="cls-k">issue</span> #54234 — pandas-dev/pandas
									</div>
									<div class="cls-row">
										<span class="cls-k">comments</span> 4 thread replies
									</div>
								</div>
							</div>
							<div class="cls-arrow" class:on={s4Stage >= 1}>→</div>
							<div class="cls-col cls-llm" class:on={s4Stage >= 1}>
								<div class="cls-cap">classifier</div>
								<div class="cls-card cls-llm-card">
									<div class="cls-llm-name">gpt-oss-120b</div>
									<div class="cls-llm-meta">DSPy · local vLLM</div>
									<div class="cls-llm-bias">tuned for recall</div>
								</div>
							</div>
							<div class="cls-arrow" class:on={s4Stage >= 2}>→</div>
							<div class="cls-col cls-out" class:on={s4Stage >= 2}>
								<div class="cls-cap">output</div>
								<div class="cls-card cls-out-card">
									<div class="cls-row">
										<span class="cls-k">is_perf</span> <span class="cls-yes">YES</span>
									</div>
									<div class="cls-row">
										<span class="cls-k">category</span> Use Better Algorithm
									</div>
									<div class="cls-row">
										<span class="cls-k">difficulty</span> Medium
									</div>
								</div>
							</div>
						</div>
						<div class="cls-cats" aria-label="13 optimization categories">
							{#each CATEGORIES as c, i}
								<span class="cls-cat" class:active={i === 1}>{c}</span>
							{/each}
						</div>
						<div class="canvas-stat">
							→ <strong>{fmt(N_PERF)}</strong> performance PRs ·
							{CATEGORIES.length} categories
						</div>
					{:else if active === 4}
						<div class="terminal">
							<div class="term-bar"><span class="term-dot"></span> uv pip compile</div>
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
						<div class="timeline">
							<div class="tl-axis"></div>
							<div class="tl-self" style="left: 50%">
								<div class="tl-dot"></div>
								<div class="tl-self-lbl">PR #56847</div>
							</div>
							{#each NEIGHBORS as n, i (n.sha)}
								<div
									class="tl-neighbor"
									class:fail={!n.ok}
									class:tried={s6Phase >= 1 && i === 4}
									style="left: {50 + (n.days / 200) * 45}%"
								>
									<div class="tl-neigh-dot"></div>
									<div class="tl-neigh-lbl">
										{n.sha}<br /><small>{n.days > 0 ? "+" : ""}{n.days}d</small>
									</div>
								</div>
							{/each}
						</div>
						<div class="tl-result" class:on={s6Phase >= 2}>
							→ trying nearest neighbor <code>b7e019</code> (-8d) ·
							<span class="ok-chip">✓ build passed</span>
							<span class="tl-note">cache → similar → default → agent (in that order)</span>
						</div>
					{:else if active === 6}
						<div class="agent">
							<div class="agent-meta">
								<span class="agent-pill">openai/gpt-oss-120b</span>
								<span class="agent-sep">→ fallback</span>
								<span class="agent-pill">claude-3-5-sonnet</span>
								<span class="agent-sep">·</span>
								<span class="agent-pill">10 turns max</span>
							</div>
							<div class="turns">
								{#each AGENT_LOG.slice(0, s7Visible) as t, i (t.turn)}
									<div class="turn" style="--i: {i}">
										<div class="turn-head">
											<span class="turn-num">TURN {t.turn}</span>
											<span class="turn-label" class:obs={t.label === "observation"}
												>{t.label}</span
											>
										</div>
										<div class="turn-body">{t.body}</div>
										{#if t.tool}
											<div class="turn-tool">
												<span class="tool-arrow">→</span> tool: <code>{t.tool}</code>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{:else if active === 7}
						<div class="checks">
							{#each CHECKS.slice(0, s8Visible) as c, i (c.cmd)}
								<div class="check" style="--i: {i}">
									<div class="check-head">
										<code class="check-cmd">{c.cmd}</code>
										<span class="check-ok">✓</span>
									</div>
									<div class="check-detail">{c.detail}</div>
								</div>
							{/each}
						</div>
						{#if s8Visible >= CHECKS.length}
							<div class="canvas-stat">
								→ <strong>{fmt(N_BUILD)}</strong> buildable tasks
							</div>
						{/if}
					{:else if active === 8}
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
										<span class="bar bar-base" style="width: {(r.base / BENCH_MAX) * 100}%"
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
						<div class="bench-aside">
							runner: AWS EC2 <code>c5ad.large</code> · 2 vCPU · 4 GiB · 75 GiB SSD
						</div>
					{:else if active === 9}
						<div class="mwu" class:on={s10Stage >= 0}>
							<div class="mwu-cap">Mann–Whitney U · per-workload sample distribution</div>
							<div class="mwu-hist">
								{#each HISTO_BASE as h, i}
									<span
										class="hist-bar hist-base"
										style="--h: {h * 4}px; --i: {i}"
									></span>
								{/each}
								{#each HISTO_EXPERT as h, i}
									<span
										class="hist-bar hist-expert"
										style="--h: {h * 4}px; --i: {i}"
									></span>
								{/each}
							</div>
							<div class="mwu-axis">base sample · expert sample (overlay)</div>
						</div>
						<div class="mwu-row">
							<div class="mwu-pval" class:on={s10Stage >= 1}>
								<span class="mwu-eq">U test</span>
								<span class="mwu-val">p = 0.00018</span>
								<span class="mwu-thr">α = 0.002</span>
								<span class="mwu-pass">✓ significant</span>
							</div>
							<div class="ship" class:on={s10Stage >= 2}>
								→ publish to
								<code>formula-code.github.io</code>
							</div>
						</div>
						{#if s10Stage >= 2}
							<div class="canvas-stat">
								→ <strong>{fmt(FINAL_TASKS)}</strong> tasks shipped to the dataset
							</div>
						{/if}
					{/if}
				</div>

				<p class="footnote">{step.footnote}</p>

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
					<button class="play-btn" on:click={togglePlay} aria-label={playing ? "Pause" : "Play"}>
						{#if playing}
							<svg viewBox="0 0 16 16" width="14" height="14"
								><rect x="4" y="3" width="3" height="10" fill="currentColor" /><rect
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
							<button class="speed" class:active={speed === s} on:click={() => setSpeed(s)}
								>{s}×</button
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

	/* Eyebrow */
	.eyebrow {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}
	.eyebrow-num {
		font-family: var(--mono);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--brand-red);
	}
	.eyebrow-rule {
		flex: 1;
		height: 1px;
		background: var(--border-primary);
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
		font-family: var(--mono);
		color: var(--border-primary);
		font-size: 1.2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: color 350ms;
	}
	.cls-arrow.on {
		color: var(--brand-red);
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
		.checks {
			grid-template-columns: 1fr;
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
		.tl-neigh-lbl {
			display: none;
		}
		.cls-cats {
			display: none;
		}
	}
</style>
