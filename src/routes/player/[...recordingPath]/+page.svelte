<script>
	import { onMount } from "svelte";
	import { create as createPlayer } from "asciinema-player";
	import "asciinema-player/dist/bundle/asciinema-player.css";
	import { Highlight } from "svelte-highlight";
	import python from "svelte-highlight/languages/python";
	import atomOneDark from "svelte-highlight/styles/atom-one-dark";
	import { parseBenchmarkCodes } from "$utils/benchmarkData.js";

	export let data;

	const recordingPath = data?.recordingPath ?? "";
	const benchmark = data?.benchmark;
	const castSrc = recordingPath ? `/${recordingPath}` : null;

	let playerContainer;
	let error;
	let selectedCodeKey = "";

	$: codesMap = benchmark?.benchmark_codes ? parseBenchmarkCodes(benchmark.benchmark_codes) : {};
	$: codeEntries = Object.entries(codesMap);
	$: if (codeEntries.length > 0 && (!selectedCodeKey || !(selectedCodeKey in codesMap))) {
		selectedCodeKey = codeEntries[0][0];
	}
	$: selectedCode = selectedCodeKey ? codesMap[selectedCodeKey] : "";
	$: agentSpeed = benchmark?.['agent/nop'] !== undefined ? Number(benchmark['agent/nop']) : undefined;
	$: oracleSpeed = benchmark?.['oracle/nop'] !== undefined ? Number(benchmark['oracle/nop']) : undefined;
	$: benchmarkPath = benchmark?.benchmark_decoposed || benchmark?.benchmark_without_params || "";

onMount(() => {
    if (!castSrc || !playerContainer) return;
    try {
        const isSmall = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches;
        const opts = {
            autoplay: true,
            preload: true,
            fit: 'width',
            loop: false,
            idleTimeLimit: 2
        };
        // Only pin rows/cols on larger viewports; let the player auto-fit on small screens
        if (!isSmall) Object.assign(opts, { cols: 120, rows: 30 });
        createPlayer(castSrc, playerContainer, opts);
    } catch (err) {
        console.error('Failed to load recording', err);
        error = 'Unable to load this recording.';
    }
});
</script>

<svelte:head>
	<title>{benchmark?.benchmark_name ?? "Agent Session"}</title>
	{@html atomOneDark}
</svelte:head>

<main class="player-page">
	<section class="details-panel">
		<div class="breadcrumbs">
			<p class="label">Benchmark</p>
			<h2>{benchmark?.benchmark_name ?? "Unknown benchmark"}</h2>
			<p class="path">{benchmarkPath || "—"}</p>
		</div>

		<div class="metrics-grid">
			<div class="metric">
				<span class="metric-label">Agent</span>
				<span class="metric-value">{benchmark?.agent_id ?? "n/a"}</span>
			</div>
			<div class="metric">
				<span class="metric-label">Agent speedup</span>
				<span class="metric-value highlight">{agentSpeed !== undefined ? `${agentSpeed.toFixed(2)}x` : "—"}</span>
			</div>
			<div class="metric">
				<span class="metric-label">Oracle speedup</span>
				<span class="metric-value highlight">{oracleSpeed !== undefined ? `${oracleSpeed.toFixed(2)}x` : "—"}</span>
			</div>
			<div class="metric">
				<span class="metric-label">Repository</span>
				<span class="metric-value">{benchmark?.repo_name ?? "n/a"}</span>
			</div>
		</div>

	<div class="code-panel">
	<div class="code-header">
		<h3>Benchmark(s)</h3>
		{#if codeEntries.length > 1}
		<div class="dropdown">
			<select bind:value={selectedCodeKey}>
			{#each codeEntries as [key]}
				<option value={key}>{key}</option>
			{/each}
			</select>
		</div>
		{/if}
	</div>

	{#if selectedCode}
		<div class="code-wrapper">
		<Highlight language={python} code={selectedCode} />
		</div>
	{:else}
		<p class="no-code">No code snippet available for this benchmark.</p>
	{/if}
	</div>
	</section>

	<section class="player-panel">
		{#if error}
			<p class="error">{error}</p>
		{:else if !castSrc}
			<p class="error">No recording specified.</p>
		{:else}
			<div class="player-wrapper" bind:this={playerContainer} aria-live="polite" />
			<p class="recording-path">{castSrc}</p>
		{/if}
	</section>
</main>

<style>
	:global(header) {
		display: none;
	}

	/* Ensure the player route can always scroll, even if a global reset hides body overflow */
	:global(body) {
		overflow-y: auto !important;
		overscroll-behavior-y: contain;
	}

.player-page {
    /* Use small viewport units on mobile address bar browsers */
    min-height: 100vh;
    min-height: 100svh;
    background: #0f1012;
    color: #f5efe3;
    display: grid;
    grid-template-columns: minmax(320px, 420px) 1fr;
    grid-template-areas: 'details player';
    gap: 2rem;
    padding: 2rem 3rem;
    /* Fit within viewport width and avoid horizontal scroll */
    width: 100%;
    max-width: 100vw;
    box-sizing: border-box;
    overflow-x: hidden;
    /* Ensure page can scroll even if parents restrict body */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

.details-panel {
    grid-area: details;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    background: rgba(34, 34, 34, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
}

	.breadcrumbs h2 {
		margin: 0.25rem 0;
		font-size: 1.5rem;
		font-family: var(--sans);
	}

	.breadcrumbs .label {
		text-transform: uppercase;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		color: #a5a4a0;
		margin: 0;
	}

	.path {
		margin: 0;
		font-family: var(--mono);
		font-size: 0.9rem;
		color: #b2afa6;
		word-break: break-all;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.metric {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.metric-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #c1c0bb;
	}

	.metric-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: #f5efe3;
	}

	.metric-value.highlight {
		color: var(--wine-green, #61d095);
	}

.code-panel {
    min-width: 0;
    background: rgba(15, 15, 15, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.code-header {
display: flex;
align-items: center;
gap: 0.75rem;
/* allow wrapping when the header gets tight */
flex-wrap: wrap;
min-width: 0;
}

	/* container for the select; it can shrink and wrap to the next line */
	.code-header .dropdown {
	margin-left: auto;          /* stays to the right when on same line */
	flex: 1 1 220px;            /* can grow, can shrink, prefers ~220px */
	min-width: 0;               /* allow flexbox to actually shrink */
	max-width: 100%;
	}

	/* make the select fill its container and not overflow */
	.code-header .dropdown select {
	width: 100%;
	max-width: 100%;
	min-width: 0;
	background: #1f1f1f;
	color: #f5efe3;
	border: 1px solid rgba(255, 255, 255, 0.15);
	border-radius: 4px;
	padding: 0.35rem 0.5rem;
	font-family: var(--mono);
	/* truncate long selected text instead of overflowing */
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	}

	/* optional: allow wrapped text in the dropdown list itself */
	.code-header .dropdown select option {
	white-space: normal;
	}

	/* On very narrow screens, make the dropdown take the full line width */
	@media (max-width: 480px) {
	.code-header .dropdown {
		flex-basis: 100%;
	}
	}

	select {
		background: #1f1f1f;
		color: #f5efe3;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 4px;
		padding: 0.35rem 0.5rem;
		font-family: var(--mono);
	}

.code-wrapper {
    /* Respect very small screens while keeping reasonable cap */
    max-height: clamp(160px, 38svh, 360px);
    overflow: auto;
    overflow-x: auto;
    border-radius: 6px;
}

	.no-code {
		margin: 0;
		font-style: italic;
		color: #bfbdb4;
	}

.player-panel {
    grid-area: player;
    min-width: 0;
    background: #000;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
    justify-content: center;
}

.player-wrapper {
    width: 100%;
    /* Keep a sensible aspect while allowing growth */
    aspect-ratio: 16 / 10;
    min-height: clamp(200px, 45svh, 520px);
}

	.recording-path {
		font-family: var(--mono);
		font-size: 0.8rem;
		color: #a5a5a0;
		margin: 0;
		word-break: break-all;
	}

	.error {
		color: #f6e7d1;
		font-family: var(--sans);
		font-size: 1rem;
		text-align: center;
	}

@media (max-width: 860px) {
    .player-page {
        grid-template-columns: 1fr;
        grid-template-areas:
            'player'
            'details';
        padding: 1rem;
        gap: 1rem;
    }
    .breadcrumbs h2 { font-size: 1.25rem; }
    .metric-value { font-size: 1rem; }
    .player-panel { padding: 1rem; }
    .code-panel { padding: 0.75rem; }
}

/* Handle extremely short viewports (e.g., landscape phones, small windows) */
@media (max-height: 580px) {
    .player-page { padding: 0.75rem 1rem; gap: 0.75rem; }
    .details-panel { padding: 1rem; }
    .player-panel { padding: 0.75rem; }
    .player-wrapper { min-height: clamp(160px, 50svh, 420px); }
    .code-wrapper { max-height: clamp(120px, 35svh, 300px); }
}
</style>
