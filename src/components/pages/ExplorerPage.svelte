<script>
	import { onMount } from "svelte";
	import { AGENT_IDS } from "$utils/agents.js";
	import {
		filterAndSort,
		levelLabel,
		levelShort,
		repoLabel
	} from "$utils/explorer.js";
	import WorkloadCard from "$components/explorer/WorkloadCard.svelte";
	import WorkloadDrawer from "$components/explorer/WorkloadDrawer.svelte";

	export let workloads = [];
	export let facets = {
		repoOptions: [],
		taskOptions: [],
		levelOptions: [],
		stats: {
			total: 0,
			withCode: 0,
			beatsOracleCount: 0,
			repoCount: 0,
			taskCount: 0,
			agents: []
		}
	};

	const PAGE_SIZE = 24;
	const AGENT_ORDER = [AGENT_IDS.CLAUDE, AGENT_IDS.GPT5, AGENT_IDS.HUMAN];

	let search = "";
	let selectedRepos = new Set();
	let selectedLevels = new Set();
	let selectedTasks = new Set();
	let agentFilter = "all";
	let sort = "name-asc";
	let page = 0;
	let active = null;
	let searchInput;

	$: filtered = filterAndSort(workloads, {
		search,
		repos: selectedRepos,
		levels: selectedLevels,
		tasks: selectedTasks,
		agentFilter,
		sort
	});

	$: pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	$: if (page >= pageCount) page = 0;
	$: pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

	function toggle(set, value) {
		const next = new Set(set);
		if (next.has(value)) next.delete(value);
		else next.add(value);
		return next;
	}

	function toggleRepo(id) { selectedRepos = toggle(selectedRepos, id); page = 0; }
	function toggleLevel(id) { selectedLevels = toggle(selectedLevels, id); page = 0; }
	function toggleTask(id) { selectedTasks = toggle(selectedTasks, id); page = 0; }

	function clearAll() {
		search = "";
		selectedRepos = new Set();
		selectedLevels = new Set();
		selectedTasks = new Set();
		agentFilter = "all";
		sort = "name-asc";
		page = 0;
	}

	function openDetail(w) { active = w; }
	function closeDetail() { active = null; }

	function shuffle() {
		if (filtered.length === 0) return;
		const idx = Math.floor(Math.random() * filtered.length);
		page = Math.floor(idx / PAGE_SIZE);
		active = filtered[idx];
	}

	function handleKey(e) {
		const isMeta = e.metaKey || e.ctrlKey;
		if (isMeta && e.key.toLowerCase() === "k") {
			e.preventDefault();
			searchInput?.focus();
			searchInput?.select();
		}
		if (e.key === "Escape") {
			if (active) {
				closeDetail();
			} else if (document.activeElement === searchInput) {
				searchInput.blur();
			}
		}
	}

	onMount(() => {
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	});
</script>

<div class="explorer">
	<header class="page-head">
		<div class="container">
			<div class="head-mark">
				<img
					class="mark-glyph"
					src="/assets/images/formula-code-icon.svg"
					alt=""
					width="44"
					height="44"
				/>
				<span class="mark-label">FormulaCode Benchmark Dataset</span>
			</div>
			<h1 class="page-title">
				Explore the FormulaCode dataset — {facets.stats.total.toLocaleString()}
				benchmark workloads
			</h1>
			<p class="page-desc">
				This is a preview slice of the FormulaCode workload dataset, while we work
				on <a href="https://api.formulacode.org/"><code>api.formulacode.org</code></a>. Every workload is indexed by repository, optimization level, and task. Click a card to see the benchmark code, per-agent speedups, and a link to the agent's terminal session recording.
			</p>

			<div class="stats-strip mini">
				<div class="stat-item">
					<div class="stat-num">{facets.stats.total.toLocaleString()}</div>
					<div class="stat-label">Workloads</div>
				</div>
				<div class="stat-item">
					<div class="stat-num">{facets.stats.repoCount}</div>
					<div class="stat-label">Repositories</div>
				</div>
				<div class="stat-item">
					<div class="stat-num">{facets.stats.taskCount}</div>
					<div class="stat-label">Tasks</div>
				</div>
				<div class="stat-item">
					<div class="stat-num">
						{Math.round(
							(facets.stats.beatsOracleCount / facets.stats.total) * 100
						)}%
					</div>
					<div class="stat-label">Agent &gt; Oracle</div>
				</div>
			</div>
		</div>
	</header>

	<div class="container layout">
		<aside class="rail">
			<div class="rail-section">
				<div class="rail-title">Repository</div>
				<ul class="chip-list">
					{#each facets.repoOptions as r}
						<li>
							<button
								class="chip"
								class:active={selectedRepos.has(r.id)}
								on:click={() => toggleRepo(r.id)}
							>
								<span>{repoLabel(r.id)}</span>
								<span class="chip-count">{r.count}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>

			<div class="rail-section">
				<div class="rail-title">Level</div>
				<ul class="chip-list">
					{#each facets.levelOptions as l}
						<li>
							<button
								class="chip level-chip"
								class:active={selectedLevels.has(l.id)}
								on:click={() => toggleLevel(l.id)}
							>
								<span class="lvl">{l.short}</span>
								<span>{l.label.replace(/^L\d:\s*/, "")}</span>
								<span class="chip-count">{l.count}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>

			{#if facets.taskOptions.length > 1}
				<div class="rail-section">
					<div class="rail-title">Task</div>
					<ul class="chip-list">
						{#each facets.taskOptions as t}
							<li>
								<button
									class="chip task-chip mono"
									class:active={selectedTasks.has(t.id)}
									on:click={() => toggleTask(t.id)}
								>
									<span>{t.id}</span>
									<span class="chip-count">{t.count}</span>
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="rail-section">
				<div class="rail-title">Agent outcome</div>
				<div class="seg">
					<button
						class="seg-btn"
						class:active={agentFilter === "all"}
						on:click={() => { agentFilter = "all"; page = 0; }}
					>All</button>
					<button
						class="seg-btn"
						class:active={agentFilter === "beats-oracle"}
						on:click={() => { agentFilter = "beats-oracle"; page = 0; }}
					>Beat oracle</button>
				</div>
			</div>

			<button class="reset-btn" on:click={clearAll}>
				Reset filters
			</button>
		</aside>

		<section class="results">
			<div class="toolbar">
				<div class="search-wrap">
					<span class="search-icon">⌕</span>
					<input
						bind:this={searchInput}
						type="search"
						placeholder="Search workload, task, or repo…"
						bind:value={search}
						on:input={() => (page = 0)}
					/>
					<kbd class="kbd">⌘K</kbd>
				</div>

				<div class="sort-wrap">
					<label for="sort">Sort</label>
					<select id="sort" bind:value={sort} on:change={() => (page = 0)}>
						<option value="name-asc">Name (A→Z)</option>
						<option value="name-desc">Name (Z→A)</option>
						<option value="oracle-desc">Oracle speedup (high)</option>
						<option value="oracle-asc">Oracle speedup (low)</option>
						<option value="agent-desc">Best agent speedup (high)</option>
						<option value="agent-asc">Best agent speedup (low)</option>
					</select>
				</div>

				<button class="shuffle-btn" on:click={shuffle} title="Random workload">
					Shuffle
				</button>
			</div>

			<div class="result-meta">
				<span>
					<strong>{filtered.length.toLocaleString()}</strong>
					match{filtered.length === 1 ? "" : "es"}
					{#if filtered.length !== facets.stats.total}
						<span class="muted">
							/ {facets.stats.total.toLocaleString()}
						</span>
					{/if}
				</span>
				{#if filtered.length > 0}
					<span class="muted">
						Showing {(page * PAGE_SIZE + 1).toLocaleString()}–{Math.min(
							(page + 1) * PAGE_SIZE,
							filtered.length
						).toLocaleString()}
					</span>
				{/if}
			</div>

			{#if pageItems.length === 0}
				<div class="empty">
					<p>No workloads match these filters.</p>
					<button class="reset-btn" on:click={clearAll}>Reset</button>
				</div>
			{:else}
				<ul class="grid">
					{#each pageItems as w (w.key)}
						<li>
							<WorkloadCard
								workload={w}
								agentOrder={AGENT_ORDER}
								onClick={() => openDetail(w)}
							/>
						</li>
					{/each}
				</ul>
			{/if}

			{#if pageCount > 1}
				<nav class="pager">
					<button
						class="page-btn"
						disabled={page === 0}
						on:click={() => (page = Math.max(0, page - 1))}
					>← Prev</button>
					<span class="page-indicator">
						Page <strong>{page + 1}</strong> / {pageCount}
					</span>
					<button
						class="page-btn"
						disabled={page >= pageCount - 1}
						on:click={() => (page = Math.min(pageCount - 1, page + 1))}
					>Next →</button>
				</nav>
			{/if}
		</section>
	</div>

	{#if active}
		<WorkloadDrawer
			workload={active}
			agentOrder={AGENT_ORDER}
			onClose={closeDetail}
		/>
	{/if}
</div>

<style>
	.explorer {
		min-height: 100vh;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.page-head {
		padding: var(--space-2xl) 0 var(--space-lg);
		border-bottom: 1px solid var(--border-primary);
		text-align: center;
	}

	.head-mark {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		margin-bottom: var(--space-sm);
	}

	.mark-glyph {
		display: inline-block;
		width: 44px;
		height: 44px;
		object-fit: contain;
	}

	.mark-label {
		font-family: var(--sans);
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}

	.page-title {
		font-family: var(--sans);
		font-size: clamp(2rem, 4.5vw, 3rem);
		font-weight: 600;
		letter-spacing: -0.02em;
		margin: 0 0 var(--space-sm);
	}

	.page-desc {
		font-family: var(--sans);
		font-size: 1.05rem;
		line-height: 1.65;
		color: var(--text-muted);
		max-width: 65ch;
		margin: 0 auto var(--space-lg);
	}

	.stats-strip.mini {
		max-width: 720px;
		margin: 0 auto;
	}

	.layout {
		display: grid;
		grid-template-columns: 240px 1fr;
		gap: var(--space-xl);
		padding-top: var(--space-xl);
		padding-bottom: var(--space-2xl);
		align-items: start;
	}

	.rail {
		position: sticky;
		top: calc(var(--navbar-height, 64px) + var(--space-md));
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.rail-section {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.rail-title {
		font-family: var(--sans);
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin-bottom: 2px;
	}

	.chip-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.chip {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 6px 10px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		font-family: var(--sans);
		font-size: 0.85rem;
		color: var(--text-secondary);
		cursor: pointer;
		text-align: left;
		transition:
			background 120ms,
			border-color 120ms,
			color 120ms;
	}

	.chip:hover {
		color: var(--text-primary);
		border-color: var(--border-secondary);
	}

	.chip.active {
		background-color: var(--brand-red-soft);
		color: var(--brand-red);
		border-color: var(--brand-red);
		font-weight: 600;
	}

	.chip-count {
		margin-left: auto;
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.chip.active .chip-count {
		color: var(--accent-primary);
	}

	.level-chip .lvl {
		font-family: var(--mono);
		font-size: 0.68rem;
		font-weight: 700;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--bg-tertiary);
		color: var(--accent-primary);
		min-width: 22px;
		text-align: center;
	}

	.level-chip.active .lvl {
		background: var(--accent-primary);
		color: #fff;
	}

	.task-chip {
		font-family: var(--mono);
		font-size: 0.78rem;
	}

	.seg {
		display: flex;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--bg-primary);
	}

	.seg-btn {
		flex: 1;
		padding: 6px 10px;
		background: transparent;
		border: none;
		font-family: var(--sans);
		font-size: 0.82rem;
		color: var(--text-secondary);
		cursor: pointer;
	}

	.seg-btn + .seg-btn {
		border-left: 1px solid var(--border-primary);
	}

	.seg-btn.active {
		background: var(--accent-primary);
		color: #fff;
	}

	.reset-btn {
		align-self: flex-start;
		padding: 6px 12px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		font-family: var(--sans);
		font-size: 0.8rem;
		color: var(--text-muted);
		cursor: pointer;
		transition:
			color 120ms,
			border-color 120ms;
	}

	.reset-btn:hover {
		color: var(--text-primary);
		border-color: var(--border-strong);
	}

	.results {
		min-width: 0;
	}

	.toolbar {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
		flex-wrap: wrap;
		margin-bottom: var(--space-md);
	}

	.search-wrap {
		position: relative;
		flex: 1 1 320px;
		min-width: 240px;
	}

	.search-wrap input {
		width: 100%;
		padding: 10px 60px 10px 32px;
		font-family: var(--sans);
		font-size: 0.95rem;
		color: var(--text-primary);
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		outline: none;
		transition:
			border-color 120ms,
			box-shadow 120ms;
	}

	.search-wrap input:focus {
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px rgba(220, 36, 24, 0.18);
	}

	.search-icon {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
		font-family: var(--sans);
		font-size: 1rem;
	}

	.kbd {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		font-family: var(--mono);
		font-size: 0.7rem;
		padding: 2px 6px;
		color: var(--text-muted);
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 4px;
		pointer-events: none;
	}

	.sort-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.sort-wrap label {
		font-family: var(--sans);
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.sort-wrap select {
		font-family: var(--sans);
		font-size: 0.85rem;
		padding: 8px 10px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		color: var(--text-primary);
		cursor: pointer;
	}

	.shuffle-btn {
		padding: 8px 14px;
		font-family: var(--sans);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-primary);
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			background 120ms,
			border-color 120ms;
	}

	.shuffle-btn:hover {
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.result-meta {
		display: flex;
		justify-content: space-between;
		gap: var(--space-md);
		font-family: var(--sans);
		font-size: 0.82rem;
		color: var(--text-secondary);
		margin-bottom: var(--space-md);
	}

	.result-meta strong {
		color: var(--text-primary);
		font-weight: 600;
	}

	.result-meta .muted {
		color: var(--text-muted);
	}

	.grid {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-md);
	}

	.empty {
		padding: var(--space-2xl) var(--space-md);
		text-align: center;
		color: var(--text-muted);
		border: 1px dashed var(--border-primary);
		border-radius: var(--radius);
	}

	.empty .reset-btn {
		margin-top: var(--space-sm);
	}

	.pager {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: var(--space-md);
		margin-top: var(--space-xl);
		font-family: var(--sans);
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.page-btn {
		padding: 6px 12px;
		font-family: var(--sans);
		font-size: 0.82rem;
		color: var(--text-primary);
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 120ms;
	}

	.page-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.page-btn:not(:disabled):hover {
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.page-indicator strong {
		color: var(--accent-primary);
	}

	.mono {
		font-family: var(--mono);
	}

	@media (max-width: 880px) {
		.layout {
			grid-template-columns: 1fr;
			gap: var(--space-md);
		}
		.rail {
			position: static;
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: var(--space-md);
		}
		.reset-btn {
			grid-column: 1 / -1;
			justify-self: start;
		}
	}

	@media (max-width: 540px) {
		.rail {
			grid-template-columns: 1fr;
		}
	}
</style>
