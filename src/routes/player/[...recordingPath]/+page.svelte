<script>
	import { onMount } from "svelte";
	import { Highlight } from "svelte-highlight";
	import python from "svelte-highlight/languages/python";
	import atomOneLight from "svelte-highlight/styles/atom-one-light";
	import RecordingPlayer from "$components/player/RecordingPlayer.svelte";
	import { parseBenchmarkCodes } from "$utils/benchmarkData.js";
	import { formatAgentDisplayName } from "$utils/benchmarkData.js";

	export let data;

	$: recordingPath = data?.recordingPath ?? "";
	$: benchmark = data?.benchmark;
	$: castSrc = recordingPath ? `/${recordingPath}` : null;

	// CSV `repo_name` like "pandas_dev-pandas" or "astropy_astropy" → (owner, repo).
	// Pipeline convention: dashes in owner are encoded as underscores; the first
	// `-` (if any) separates owner from repo. Falls back to the first `_` for
	// single-token repos like "astropy_astropy".
	function parseRepoName(repoName) {
		if (!repoName) return null;
		const dash = repoName.indexOf("-");
		if (dash >= 0) {
			return {
				owner: repoName.slice(0, dash).replace(/_/g, "-"),
				repo: repoName.slice(dash + 1)
			};
		}
		const us = repoName.indexOf("_");
		if (us >= 0) {
			return { owner: repoName.slice(0, us), repo: repoName.slice(us + 1) };
		}
		return null;
	}

	// Note: the CSV's `task_id` is a pipeline-internal index, not a GitHub issue
	// number — so we can't fetch the matching `pull_requests` row directly. The
	// `repositories` lookup still works since (owner, repo) is derivable from
	// the CSV's `repo_name`.
	const API = "https://api.formulacode.org/rest/v1";
	let repoInfo = null;
	let extraStatus = "idle"; // idle | loading | ready | error

	async function fetchRepo(repoName) {
		const ids = parseRepoName(repoName);
		if (!ids) return;
		extraStatus = "loading";
		try {
			const r = await fetch(
				`${API}/repositories?owner=eq.${encodeURIComponent(ids.owner)}` +
					`&repo=eq.${encodeURIComponent(ids.repo)}` +
					`&select=stars,description,language,topics,url`,
				{ headers: { Accept: "application/json" } }
			);
			if (!r.ok) throw new Error(String(r.status));
			const rows = await r.json();
			repoInfo = rows[0]
				? { ...rows[0], owner: ids.owner, repo: ids.repo }
				: null;
			extraStatus = "ready";
		} catch (e) {
			console.warn("api.formulacode.org lookup failed", e);
			extraStatus = "error";
		}
	}

	onMount(() => {
		if (benchmark?.repo_name) fetchRepo(benchmark.repo_name);
	});

	$: if (benchmark?.repo_name && extraStatus === "idle")
		fetchRepo(benchmark.repo_name);

	$: codesMap = benchmark?.benchmark_codes
		? parseBenchmarkCodes(benchmark.benchmark_codes)
		: {};
	$: codeEntries = Object.entries(codesMap);

	let selectedCodeKey = "";
	$: if (
		codeEntries.length > 0 &&
		(!selectedCodeKey || !(selectedCodeKey in codesMap))
	) {
		selectedCodeKey = codeEntries[0][0];
	}
	$: selectedCode = selectedCodeKey ? codesMap[selectedCodeKey] : "";

	function fmtSpeed(v) {
		if (v === undefined || v === null || Number.isNaN(Number(v))) return "—";
		const n = Number(v);
		return `${n.toFixed(2)}×`;
	}

	function fmtAdvantage(b) {
		if (!b) return "—";
		const a = Number(b["agent/nop"]);
		const o = Number(b["oracle/nop"]);
		if (Number.isNaN(a) || Number.isNaN(o)) return "—";
		return `${(a - o).toFixed(2)}×`;
	}

	$: agentDisplay = benchmark?.agent_id
		? formatAgentDisplayName(benchmark.agent_id)
		: null;
	$: benchmarkPath =
		benchmark?.benchmark_decomposed ||
		benchmark?.benchmark_without_params ||
		"";
	$: repoName = benchmark?.repo_name || benchmark?.benchmark_repo || "";

	let codeOpen = true;
</script>

<svelte:head>
	<title>{benchmark?.benchmark_name ?? "Agent session"} · FormulaCode</title>
	{@html atomOneLight}
</svelte:head>

<main class="player-page">
	<header class="page-head">
		<div class="head-row">
			<a class="back" href="/" aria-label="Back to FormulaCode">
				<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
					<polyline
						points="15,4 7,12 15,20"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					/>
				</svg>
				<span>formulacode.org</span>
			</a>
			{#if agentDisplay}
				<span class="agent-chip">
					<span class="agent-dot"></span>
					{agentDisplay}
				</span>
			{/if}
		</div>

		<h1 class="title">{benchmark?.benchmark_name ?? "Agent session"}</h1>

		{#if repoInfo?.description}
			<p class="task-summary">{repoInfo.description}</p>
		{/if}

		{#if benchmarkPath || repoName}
			<p class="subpath">
				{#if repoName}<span class="repo">{repoName}</span>{/if}
				{#if benchmarkPath}
					<span class="path-sep">·</span>
					<span class="bench-path">{benchmarkPath}</span>
				{/if}
			</p>
		{/if}

		{#if repoInfo}
			<div class="pr-strip">
				{#if repoInfo.url}
					<a
						class="pr-chip pr-link"
						href={repoInfo.url}
						target="_blank"
						rel="noopener noreferrer"
					>
						<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
							<path
								d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
								fill="currentColor"
							/>
						</svg>
						<span>{repoInfo.owner}/{repoInfo.repo}</span>
					</a>
				{/if}
				{#if repoInfo.stars != null}
					<span class="pr-chip">
						<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
							<polygon
								points="12,2 15,9 22,9.5 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.5 9,9"
								fill="currentColor"
							/>
						</svg>
						<span class="chip-value"
							>{Number(repoInfo.stars).toLocaleString()}</span
						>
					</span>
				{/if}
				{#if repoInfo.language}
					<span class="pr-chip">
						<span class="chip-label">lang</span>
						<span class="chip-value">{repoInfo.language}</span>
					</span>
				{/if}
				{#if Array.isArray(repoInfo.topics) && repoInfo.topics.length > 0}
					{#each repoInfo.topics.slice(0, 3) as topic}
						<span class="pr-chip topic-chip">{topic}</span>
					{/each}
				{/if}
			</div>
		{/if}

		<div class="metric-row">
			<div class="metric">
				<div class="metric-label">Agent speedup</div>
				<div class="metric-value">{fmtSpeed(benchmark?.["agent/nop"])}</div>
			</div>
			<div class="metric">
				<div class="metric-label">Oracle speedup</div>
				<div class="metric-value">{fmtSpeed(benchmark?.["oracle/nop"])}</div>
			</div>
			<div class="metric">
				<div class="metric-label">Advantage</div>
				<div class="metric-value">{fmtAdvantage(benchmark)}</div>
			</div>
			{#if benchmark?.level}
				<div class="metric">
					<div class="metric-label">Level</div>
					<div class="metric-value">{benchmark.level}</div>
				</div>
			{/if}
		</div>
	</header>

	<section class="player-section">
		{#if castSrc}
			<RecordingPlayer src={castSrc} />
		{:else}
			<p class="empty">No recording specified.</p>
		{/if}
	</section>

	{#if codeEntries.length > 0}
		<section class="code-section">
			<button
				class="code-toggle"
				type="button"
				aria-expanded={codeOpen}
				on:click={() => (codeOpen = !codeOpen)}
			>
				<span>Benchmark code{codeEntries.length > 1
						? ` (${codeEntries.length})`
						: ""}</span>
				<span class="caret" class:open={codeOpen}>▾</span>
			</button>
			{#if codeOpen}
				<div class="code-body">
					{#if codeEntries.length > 1}
						<div class="code-tabs">
							{#each codeEntries as [key]}
								<button
									type="button"
									class="code-tab"
									class:active={selectedCodeKey === key}
									on:click={() => (selectedCodeKey = key)}
								>
									{key}
								</button>
							{/each}
						</div>
					{/if}
					<div class="code-wrap">
						<Highlight language={python} code={selectedCode} />
					</div>
				</div>
			{/if}
		</section>
	{/if}

</main>

<style>
	:global(header) {
		display: none;
	}

	:global(body) {
		overflow-y: auto !important;
		overscroll-behavior-y: contain;
		background: var(--bg-primary);
	}

	.player-page {
		max-width: 1100px;
		margin: 0 auto;
		padding: var(--space-lg) var(--space-md) var(--space-2xl);
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		min-height: 100vh;
		min-height: 100svh;
		color: var(--text-primary);
		background: var(--bg-primary);
	}

	.page-head {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.head-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--sans);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
		text-decoration: none;
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		transition: color 120ms, background 120ms;
	}

	.back:hover {
		color: var(--brand-red);
		background: var(--bg-secondary);
	}

	.agent-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		background: var(--brand-red-soft);
		border-radius: 999px;
		font-family: var(--mono);
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--brand-red-dark);
	}

	.agent-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--brand-red);
	}

	.title {
		font-family: var(--sans);
		font-size: clamp(1.4rem, 3vw, 2rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0;
		word-break: break-word;
	}

	.task-summary {
		font-family: var(--sans);
		font-size: 1rem;
		line-height: 1.5;
		color: var(--text-secondary);
		margin: 4px 0 0;
		max-width: 70ch;
	}

	.subpath {
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--text-muted);
		margin: 0;
		word-break: break-all;
	}

	.pr-strip {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: var(--space-sm);
	}

	.pr-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 999px;
		font-family: var(--sans);
		font-size: 0.78rem;
		color: var(--text-muted);
		text-decoration: none;
	}

	.pr-link {
		font-family: var(--mono);
		color: var(--brand-blue);
		font-weight: 600;
		transition: color 120ms, border-color 120ms;
	}

	.pr-link:hover {
		color: var(--brand-blue-dark);
		border-color: var(--brand-blue);
		text-decoration: none;
	}

	.chip-label {
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.chip-value {
		font-weight: 600;
		color: var(--text-primary);
		font-family: var(--mono);
		font-size: 0.78rem;
	}

	.pr-chip-accent {
		background: var(--brand-red-soft);
		border-color: var(--brand-red-soft);
		color: var(--brand-red-dark);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.7rem;
	}

	.topic-chip {
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.repo {
		color: var(--brand-blue);
		font-weight: 600;
	}

	.path-sep {
		margin: 0 6px;
		color: var(--border-strong);
	}

	.metric-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--border-primary);
	}

	.metric-label {
		font-family: var(--sans);
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin-bottom: 2px;
	}

	.metric-value {
		font-family: var(--mono);
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.player-section {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.empty {
		text-align: center;
		color: var(--text-muted);
		font-family: var(--sans);
		padding: var(--space-2xl);
	}

	.code-section {
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.code-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px var(--space-md);
		background: var(--bg-secondary);
		border: 0;
		font-family: var(--sans);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
		cursor: pointer;
		text-align: left;
	}

	.code-toggle:hover {
		background: var(--bg-tertiary);
	}

	.caret {
		font-size: 0.85rem;
		transition: transform 160ms;
		color: var(--text-muted);
	}

	.caret.open {
		transform: rotate(180deg);
		color: var(--brand-red);
	}

	.code-body {
		border-top: 1px solid var(--border-primary);
	}

	.code-tabs {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-primary);
	}

	.code-tab {
		padding: 4px 10px;
		font-family: var(--mono);
		font-size: 0.78rem;
		color: var(--text-muted);
		background: transparent;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 120ms;
	}

	.code-tab:hover {
		color: var(--text-primary);
		border-color: var(--border-secondary);
	}

	.code-tab.active {
		color: #fff;
		background: var(--brand-red);
		border-color: var(--brand-red);
	}

	.code-wrap {
		max-height: clamp(220px, 50svh, 460px);
		overflow: auto;
		font-size: 0.82rem;
	}

	.code-wrap :global(pre) {
		margin: 0;
		padding: var(--space-md);
		font-family: var(--mono);
	}

	@media (max-width: 600px) {
		.player-page {
			padding: var(--space-md) var(--space-sm) var(--space-xl);
			gap: var(--space-md);
		}
	}
</style>
