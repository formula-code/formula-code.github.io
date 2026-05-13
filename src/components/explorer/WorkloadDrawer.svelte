<script>
	import { onMount } from "svelte";
	import { AGENT_IDS, AGENT_NAMES, AGENT_NAMES_SHORT } from "$utils/agents.js";
	import { levelLabel, repoLabel, repoUrl } from "$utils/explorer.js";

	export let workload;
	export let agentOrder = [
		AGENT_IDS.CLAUDE,
		AGENT_IDS.GPT5,
		AGENT_IDS.HUMAN
	];
	export let onClose = () => {};

	$: agents = workload.agents ?? {};
	$: oracle = workload.oracle;

	function fmt(v) {
		if (v === null || v === undefined || !Number.isFinite(v)) return "—";
		return `${v.toFixed(3)}x`;
	}

	function delta(v) {
		if (v === null || v === undefined || !Number.isFinite(v) || oracle === null) {
			return null;
		}
		return v - oracle;
	}

	function fmtDelta(v) {
		const d = delta(v);
		if (d === null) return "—";
		const s = d >= 0 ? "+" : "";
		return `${s}${d.toFixed(3)}`;
	}

	function classFor(v) {
		if (v === null || v === undefined || !Number.isFinite(v)) return "";
		if (v >= 1.05) return "good";
		if (v <= 0.95) return "bad";
		return "neutral";
	}

	function recordingHref(rec) {
		if (!rec) return null;
		const trimmed = rec.replace(/^\//, "");
		return `/player/${trimmed}`;
	}

	function handleKey(e) {
		if (e.key === "Escape") onClose();
	}

	onMount(() => {
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", handleKey);
		return () => {
			document.body.style.overflow = prevOverflow;
			window.removeEventListener("keydown", handleKey);
		};
	});

	$: rurl = repoUrl(workload.repo_name);
</script>

<div
	class="scrim"
	on:click={onClose}
	on:keydown={(e) => e.key === "Enter" && onClose()}
	role="presentation"
></div>

<aside class="drawer" role="dialog" aria-modal="true" aria-label="Workload detail">
	<header class="drawer-head">
		<div class="head-meta">
			<span class="task">{workload.task_id}</span>
			<span class="dot">·</span>
			<span class="level">{levelLabel(workload.level)}</span>
			{#if workload.beatsOracle}
				<span class="badge">★ super</span>
			{/if}
		</div>
		<button class="close" on:click={onClose} aria-label="Close">x</button>
	</header>

	<div class="drawer-body">
		<h2 class="bench-name">{workload.benchmark_name}</h2>

		<dl class="meta-grid">
			<div>
				<dt>Repository</dt>
				<dd>
					{#if rurl}
						<a href={rurl} target="_blank" rel="noopener noreferrer">
							{repoLabel(workload.repo_name)} ↗
						</a>
					{:else}
						{repoLabel(workload.repo_name)}
					{/if}
				</dd>
			</div>
			<div>
				<dt>Optimization level</dt>
				<dd>{levelLabel(workload.level)}</dd>
			</div>
			<div>
				<dt>Workload ID</dt>
				<dd class="mono">{workload.id}</dd>
			</div>
			<div>
				<dt>Oracle speedup</dt>
				<dd class="mono {classFor(oracle)}">{fmt(oracle)}</dd>
			</div>
		</dl>

		<section class="results-section">
			<div class="section-head">
				<h3 class="section-title">Per-agent results</h3>
			</div>
			<div class="agent-table-wrap">
				<table class="agent-table">
					<thead>
						<tr>
							<th>Agent</th>
							<th class="num">Speedup</th>
							<th class="num">Δ vs oracle</th>
							<th>Recording</th>
						</tr>
					</thead>
					<tbody>
						{#each agentOrder as aid}
							{@const v = agents[aid]}
							{@const rec = workload.recordings?.[aid]}
							<tr>
								<td>
									<span class="who" data-agent={aid}>
										{AGENT_NAMES[aid] ?? AGENT_NAMES_SHORT[aid] ?? aid}
									</span>
								</td>
								<td class="num mono {classFor(v)}">{fmt(v)}</td>
								<td class="num mono">
									{#if aid === AGENT_IDS.HUMAN}
										<span class="muted">baseline</span>
									{:else}
										{fmtDelta(v)}
									{/if}
								</td>
								<td>
									{#if rec}
										<a class="rec-link" href={recordingHref(rec)}>
											▶ play
										</a>
									{:else}
										<span class="muted">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		{#if workload.codeText}
			<section class="code-section">
				<div class="section-head">
					<h3 class="section-title">Benchmark code</h3>
					{#if workload.codeFqName}
						<span class="code-fq mono">{workload.codeFqName}</span>
					{/if}
				</div>
				<pre class="code"><code>{workload.codeText}</code></pre>
				<p class="code-note">
					This is the harness invoked to measure performance — not the
					optimization patch itself.
				</p>
			</section>
		{:else}
			<section class="code-section">
				<div class="section-head">
					<h3 class="section-title">Benchmark code</h3>
				</div>
				<p class="muted">No code snippet available for this workload.</p>
			</section>
		{/if}
	</div>
</aside>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.45);
		z-index: 1500;
		animation: fade 0.18s ease;
	}

	.drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(640px, 100vw);
		background: var(--bg-primary);
		border-left: 1px solid var(--border-primary);
		z-index: 1501;
		display: flex;
		flex-direction: column;
		box-shadow: -16px 0 40px rgba(15, 23, 42, 0.18);
		animation: slide 0.22s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.drawer-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem var(--space-md);
		border-bottom: 1px solid var(--border-primary);
		background: var(--bg-secondary);
	}

	.head-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.task,
	.level {
		font-family: var(--sans);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.task {
		font-family: var(--mono);
		text-transform: none;
		letter-spacing: normal;
	}

	.dot {
		color: var(--border-secondary);
	}

	.badge {
		font-family: var(--sans);
		font-size: 0.65rem;
		font-weight: 700;
		padding: 1px 6px;
		border-radius: 3px;
		background: linear-gradient(
			90deg,
			var(--accent-primary),
			var(--accent-secondary)
		);
		color: #fff;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.close {
		font-size: 1.4rem;
		line-height: 1;
		background: transparent;
		border: none;
		cursor: pointer;
		color: var(--text-muted);
		padding: 4px 10px;
		border-radius: var(--radius);
	}

	.close:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.drawer-body {
		padding: var(--space-lg) var(--space-md) var(--space-2xl);
		overflow-y: auto;
		flex: 1 1 auto;
	}

	.bench-name {
		font-family: var(--mono);
		font-size: 1.05rem;
		font-weight: 500;
		line-height: 1.4;
		color: var(--text-primary);
		word-break: break-word;
		margin: 0 0 var(--space-md);
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: var(--space-sm) var(--space-md);
		margin: 0 0 var(--space-lg);
		padding: var(--space-md);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		background: var(--bg-secondary);
	}

	.meta-grid > div {
		min-width: 0;
	}

	.meta-grid dt {
		font-family: var(--sans);
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin: 0 0 2px;
	}

	.meta-grid dd {
		font-family: var(--sans);
		font-size: 0.92rem;
		color: var(--text-primary);
		margin: 0;
		word-break: break-word;
	}

	.meta-grid dd.mono {
		font-family: var(--mono);
		font-size: 0.88rem;
	}

	.meta-grid dd a {
		color: var(--link-color);
		text-decoration: none;
	}

	.meta-grid dd a:hover {
		text-decoration: underline;
	}

	.results-section,
	.code-section {
		margin: 0 0 var(--space-lg);
	}

	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-sm);
		flex-wrap: wrap;
		margin-bottom: var(--space-sm);
	}

	.code-fq {
		font-family: var(--mono);
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.agent-table-wrap {
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.agent-table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--sans);
		font-size: 0.9rem;
	}

	.agent-table th,
	.agent-table td {
		text-align: left;
		padding: 0.55rem 0.7rem;
		border-bottom: 1px solid var(--border-primary);
	}

	.agent-table tbody tr:last-child td {
		border-bottom: none;
	}

	.agent-table th {
		font-family: var(--sans);
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		background: var(--bg-secondary);
	}

	.agent-table td.num,
	.agent-table th.num {
		text-align: right;
		font-family: var(--mono);
		font-variant-numeric: tabular-nums;
	}

	.who {
		font-family: var(--sans);
		font-weight: 500;
	}

	.who[data-agent="terminus-2,claude"] {
		color: var(--accent-primary);
	}
	.who[data-agent="terminus-2,gpt-5"] {
		color: var(--color-agent-gpt5);
	}
	.who[data-agent="terminus-2,oracle"] {
		color: var(--color-agent-human);
	}

	.good {
		color: var(--score-good);
	}

	.bad {
		color: var(--score-bad);
	}

	.neutral {
		color: var(--text-secondary);
	}

	.muted {
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	.rec-link {
		font-family: var(--sans);
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent-primary);
		text-decoration: none;
	}

	.rec-link:hover {
		text-decoration: underline;
	}

	.code {
		margin: 0 0 var(--space-sm);
		padding: var(--space-md);
		background: #0f172a;
		color: #e2e8f0;
		border-radius: var(--radius);
		font-family: var(--mono);
		font-size: 0.82rem;
		line-height: 1.55;
		overflow-x: auto;
		white-space: pre;
	}

	.code-note {
		font-family: var(--sans);
		font-size: 0.8rem;
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0;
	}

	.mono {
		font-family: var(--mono);
	}

	@keyframes fade {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes slide {
		from {
			transform: translateX(40px);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
</style>
