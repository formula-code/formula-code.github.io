<script>
	import { onMount, onDestroy, tick } from "svelte";
	import { parseCast, eventsToLines, buildTimeIndex } from "$utils/cast.js";

	export let src = "";
	export let initialSpeed = 2;

	let status = "idle"; // idle | loading | ready | error
	let errorMsg = "";
	let header = null;
	let lines = []; // [{text, runs, time, startTime}]
	let timeIndex = () => 0;
	let duration = 0;

	let playing = false;
	let speed = initialSpeed;
	let currentTime = 0;
	let visibleLineCount = 0;

	let rafHandle = null;
	let rafLastWall = 0;

	let scrollWrap;
	let autoScroll = true;

	$: if (lines.length) visibleLineCount = timeIndex(currentTime);

	const SPEEDS = [1, 2, 4, 8];

	async function load() {
		if (!src) return;
		status = "loading";
		try {
			const r = await fetch(src);
			if (!r.ok) throw new Error(`HTTP ${r.status}`);
			const text = await r.text();
			const parsed = parseCast(text);
			header = parsed.header;
			duration = parsed.duration;
			lines = eventsToLines(parsed.events);
			timeIndex = buildTimeIndex(lines);
			currentTime = duration; // start at end so the transcript is fully visible
			visibleLineCount = lines.length;
			await tick();
			status = "ready";
		} catch (e) {
			console.error("recording load failed", e);
			errorMsg = e?.message || "Unable to load this recording.";
			status = "error";
		}
	}

	function step(now) {
		if (!playing) return;
		const dt = (now - rafLastWall) / 1000;
		rafLastWall = now;
		currentTime = Math.min(duration, currentTime + dt * speed);
		if (autoScroll) scrollToBottomSoon();
		if (currentTime >= duration) {
			playing = false;
		} else {
			rafHandle = requestAnimationFrame(step);
		}
	}

	function play() {
		if (currentTime >= duration) currentTime = 0;
		playing = true;
		rafLastWall = performance.now();
		rafHandle = requestAnimationFrame(step);
	}

	function pause() {
		playing = false;
		if (rafHandle != null) cancelAnimationFrame(rafHandle);
		rafHandle = null;
	}

	function toggle() {
		playing ? pause() : play();
	}

	function restart() {
		pause();
		currentTime = 0;
		if (scrollWrap) scrollWrap.scrollTop = 0;
	}

	function jumpEnd() {
		pause();
		currentTime = duration;
		scrollToBottomSoon();
	}

	function onSeek(ev) {
		pause();
		currentTime = Number(ev.target.value);
	}

	function setSpeed(s) {
		speed = s;
	}

	let scrollPending = false;
	async function scrollToBottomSoon() {
		if (scrollPending || !scrollWrap) return;
		scrollPending = true;
		await tick();
		if (scrollWrap) scrollWrap.scrollTop = scrollWrap.scrollHeight;
		scrollPending = false;
	}

	function fmtTime(t) {
		t = Math.max(0, Math.round(t));
		const m = Math.floor(t / 60);
		const s = t % 60;
		return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	}

	onMount(load);
	onDestroy(pause);

	$: if (src) {
		// reload when src changes
		pause();
		currentTime = 0;
		visibleLineCount = 0;
		lines = [];
		header = null;
		duration = 0;
		status = "idle";
		load();
	}

	// Scroll handling: if the user scrolls up, disengage auto-scroll until they
	// reach the bottom again.
	function onScroll() {
		if (!scrollWrap) return;
		const atBottom =
			scrollWrap.scrollHeight - scrollWrap.scrollTop - scrollWrap.clientHeight <
			32;
		autoScroll = atBottom;
	}
</script>

<div class="player">
	<div class="controls" role="toolbar" aria-label="Recording controls">
		<button
			type="button"
			class="ctrl-btn primary"
			on:click={toggle}
			disabled={status !== "ready"}
			aria-label={playing ? "Pause" : "Play"}
		>
			{#if playing}
				<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
					<rect x="6" y="5" width="4" height="14" fill="currentColor" />
					<rect x="14" y="5" width="4" height="14" fill="currentColor" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
					<polygon points="6,4 20,12 6,20" fill="currentColor" />
				</svg>
			{/if}
			<span>{playing ? "Pause" : "Play"}</span>
		</button>

		<button
			type="button"
			class="ctrl-btn"
			on:click={restart}
			disabled={status !== "ready"}
			aria-label="Restart"
			title="Restart"
		>
			<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
				<polygon points="18,4 18,20 8,12" fill="currentColor" />
				<rect x="5" y="4" width="2" height="16" fill="currentColor" />
			</svg>
		</button>

		<button
			type="button"
			class="ctrl-btn"
			on:click={jumpEnd}
			disabled={status !== "ready"}
			aria-label="Jump to end"
			title="Jump to end"
		>
			<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
				<polygon points="6,4 16,12 6,20" fill="currentColor" />
				<rect x="17" y="4" width="2" height="16" fill="currentColor" />
			</svg>
		</button>

		<div class="time" aria-live="polite">
			<span class="time-cur">{fmtTime(currentTime)}</span>
			<span class="time-sep">/</span>
			<span class="time-tot">{fmtTime(duration)}</span>
		</div>

		<input
			type="range"
			class="seek"
			min="0"
			max={duration || 1}
			step="0.01"
			value={currentTime}
			disabled={status !== "ready"}
			aria-label="Seek"
			on:input={onSeek}
		/>

		<div class="speeds" role="group" aria-label="Playback speed">
			{#each SPEEDS as s}
				<button
					type="button"
					class="speed-btn"
					class:active={speed === s}
					on:click={() => setSpeed(s)}
					disabled={status !== "ready"}
				>
					{s}×
				</button>
			{/each}
		</div>
	</div>

	<div
		class="screen"
		bind:this={scrollWrap}
		on:scroll={onScroll}
		role="log"
		aria-live="off"
	>
		{#if status === "loading"}
			<div class="state-msg">Loading recording…</div>
		{:else if status === "error"}
			<div class="state-msg state-err">{errorMsg}</div>
		{:else if status === "ready" && lines.length === 0}
			<div class="state-msg">Recording is empty.</div>
		{:else if status === "ready"}
			<div class="transcript" role="log">
				{#each lines.slice(0, visibleLineCount) as line, i (i)}
					<div class="line">{#each line.runs as run}{#if run.color}<span
								style="color: {run.color}">{run.text}</span>{:else}{run.text}{/if}{/each}{#if !line.runs.length}&nbsp;{/if}</div>
				{/each}
				{#if currentTime < duration && visibleLineCount > 0}
					<span class="cursor" aria-hidden="true">▌</span>
				{/if}
			</div>
		{/if}
	</div>

	<div class="meta">
		{#if header}
			<span>terminal {header.width}×{header.height}</span>
		{/if}
		<span>{lines.length} lines</span>
		<span>{visibleLineCount} shown</span>
	</div>
</div>

<style>
	.player {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: 8px 12px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		flex-wrap: wrap;
	}

	.ctrl-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		font-family: var(--sans);
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-primary);
		background: var(--bg-primary);
		border: 1px solid var(--border-secondary);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 120ms;
	}

	.ctrl-btn:hover:not(:disabled) {
		border-color: var(--brand-red);
		color: var(--brand-red);
	}

	.ctrl-btn.primary {
		background: var(--brand-red);
		color: #fff;
		border-color: var(--brand-red);
	}

	.ctrl-btn.primary:hover:not(:disabled) {
		background: var(--brand-red-dark);
		border-color: var(--brand-red-dark);
		color: #fff;
	}

	.ctrl-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.time {
		font-family: var(--mono);
		font-size: 0.85rem;
		color: var(--text-muted);
		min-width: 96px;
		text-align: center;
		display: inline-flex;
		gap: 4px;
		justify-content: center;
	}

	.time-cur {
		color: var(--text-primary);
		font-weight: 600;
	}

	.seek {
		flex: 1 1 200px;
		min-width: 120px;
		appearance: none;
		-webkit-appearance: none;
		height: 4px;
		background: var(--border-primary);
		border-radius: 2px;
		cursor: pointer;
	}

	.seek::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--brand-red);
		border: 2px solid #fff;
		box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
		cursor: pointer;
	}

	.seek::-moz-range-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--brand-red);
		border: 2px solid #fff;
		cursor: pointer;
	}

	.speeds {
		display: inline-flex;
		gap: 2px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-sm);
		padding: 2px;
	}

	.speed-btn {
		padding: 4px 8px;
		font-family: var(--mono);
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-muted);
		background: transparent;
		border: 0;
		border-radius: 4px;
		cursor: pointer;
		transition: all 120ms;
	}

	.speed-btn:hover:not(:disabled) {
		color: var(--text-primary);
	}

	.speed-btn.active {
		background: var(--brand-red);
		color: #fff;
	}

	.speed-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.screen {
		position: relative;
		background: #0f172a;
		color: #e2e8f0;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		padding: var(--space-md);
		font-family: var(--mono);
		font-size: 0.82rem;
		line-height: 1.55;
		overflow: auto;
		max-height: clamp(360px, 65svh, 640px);
		min-height: 240px;
		-webkit-overflow-scrolling: touch;
	}

	.transcript {
		margin: 0;
		font-family: inherit;
		font-size: inherit;
		line-height: inherit;
		color: inherit;
	}

	.line {
		display: block;
		white-space: pre-wrap;
		word-break: break-word;
		overflow-wrap: anywhere;
		min-height: 1em;
		/* Virtualize off-screen lines so 50k-line recordings stay responsive. */
		content-visibility: auto;
		contain-intrinsic-size: 1em 1.55em;
	}

	.cursor {
		display: inline-block;
		color: var(--brand-red);
		font-weight: 700;
		margin-left: 1px;
		animation: blink 1s steps(1) infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	.state-msg {
		font-family: var(--sans);
		color: var(--text-muted);
		text-align: center;
		padding: var(--space-lg);
	}

	.state-err {
		color: var(--brand-red);
	}

	.meta {
		display: flex;
		gap: var(--space-md);
		font-family: var(--sans);
		font-size: 0.72rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0 4px;
		flex-wrap: wrap;
	}

	@media (max-width: 600px) {
		.controls {
			gap: 6px;
			padding: 6px 8px;
		}
		.ctrl-btn {
			padding: 6px 10px;
			font-size: 0.78rem;
		}
		.ctrl-btn span {
			display: none;
		}
		.ctrl-btn.primary span {
			display: inline;
		}
		.seek {
			flex-basis: 100%;
			order: 5;
			margin: 4px 0 0;
		}
		.speeds {
			order: 4;
		}
		.time {
			min-width: 80px;
			font-size: 0.78rem;
		}
		.screen {
			padding: var(--space-sm);
			font-size: 0.78rem;
			max-height: clamp(320px, 60svh, 480px);
		}
	}
</style>
