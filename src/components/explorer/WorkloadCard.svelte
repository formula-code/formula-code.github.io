<script>
	import { AGENT_IDS, AGENT_NAMES_SHORT } from "$utils/agents.js";
	import { levelShort, repoLabel } from "$utils/explorer.js";

	export let workload;
	export let agentOrder = [
		AGENT_IDS.CLAUDE,
		AGENT_IDS.GPT5,
		AGENT_IDS.HUMAN
	];
	export let onClick = () => {};

	$: agents = workload.agents ?? {};

	function fmt(v) {
		if (v === null || v === undefined || !Number.isFinite(v)) return "—";
		return `${v.toFixed(2)}x`;
	}

	function trim(name) {
		if (!name) return "";
		if (name.length <= 50) return name;
		const parts = name.split(".");
		if (parts.length >= 3) return "…" + parts.slice(-3).join(".");
		return name.slice(0, 50) + "…";
	}

	function classFor(v) {
		if (v === null || v === undefined || !Number.isFinite(v)) return "";
		if (v >= 1.05) return "good";
		if (v <= 0.95) return "bad";
		return "neutral";
	}
</script>

<button class="card" on:click={onClick} type="button">
	<div class="card-meta">
		<span class="lvl-pill">{levelShort(workload.level)}</span>
		<span class="task-id">{workload.task_id}</span>
		{#if workload.beatsOracle}
			<span class="badge">★ super</span>
		{/if}
	</div>

	<div class="name" title={workload.benchmark_name}>
		{trim(workload.benchmark_name)}
	</div>

	<div class="repo">{repoLabel(workload.repo_name)}</div>

	<div class="card-footer">
		{#each agentOrder as aid}
			{@const v = agents[aid]}
			<div class="agent-row" class:missing={v === undefined}>
				<span class="who" data-agent={aid}>
					{AGENT_NAMES_SHORT[aid] ?? aid}
				</span>
				<span class="track">
					{#if v !== undefined && Number.isFinite(v)}
						<span
							class="bar {classFor(v)}"
							style="--w: {Math.min(100, Math.max(2, (v / 1.5) * 100))}%"
						></span>
					{/if}
				</span>
				<span class="val">{fmt(v)}</span>
			</div>
		{/each}
	</div>
</button>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		padding: var(--space-md) var(--space-md) var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		text-align: left;
		cursor: pointer;
		transition:
			border-color 140ms,
			box-shadow 140ms,
			transform 140ms;
		font: inherit;
		color: inherit;
	}

	.card:hover {
		border-color: var(--accent-primary);
		box-shadow: var(--shadow-lg);
		transform: translateY(-2px);
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: var(--sans);
		font-size: 0.78rem;
		color: var(--text-muted);
		flex-wrap: wrap;
	}

	.lvl-pill {
		font-family: var(--mono);
		font-size: 0.68rem;
		font-weight: 700;
		padding: 1px 6px;
		border-radius: 3px;
		background: var(--bg-tertiary);
		color: var(--accent-primary);
		min-width: 22px;
		text-align: center;
	}

	.task-id {
		font-family: var(--mono);
		font-size: 0.72rem;
		color: var(--text-muted);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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

	.name {
		font-family: var(--sans);
		font-size: 0.95rem;
		font-weight: 500;
		line-height: 1.4;
		color: var(--text-primary);
		word-break: break-word;
	}

	.repo {
		font-family: var(--mono);
		font-size: 0.72rem;
		color: var(--text-muted);
	}

	.card-footer {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-top: var(--space-sm);
		border-top: 1px dashed var(--border-primary);
		margin-top: 2px;
	}

	.agent-row {
		display: grid;
		grid-template-columns: 64px 1fr 50px;
		gap: 8px;
		align-items: center;
		font-size: 0.78rem;
	}

	.agent-row.missing .track {
		opacity: 0.3;
	}

	.agent-row.missing .val {
		color: var(--text-muted);
	}

	.who {
		font-family: var(--sans);
		font-size: 0.72rem;
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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

	.track {
		height: 6px;
		border-radius: 999px;
		background: #eef2ff;
		overflow: hidden;
		position: relative;
	}

	.bar {
		display: block;
		height: 100%;
		width: var(--w, 0);
		background: var(--text-muted);
		transition: width 0.3s ease;
	}

	.bar.good {
		background: linear-gradient(
			90deg,
			var(--accent-primary),
			var(--accent-secondary)
		);
	}

	.bar.bad {
		background: linear-gradient(90deg, #e45c57, #e0a133);
	}

	.bar.neutral {
		background: var(--text-muted);
	}

	.val {
		font-family: var(--mono);
		font-size: 0.78rem;
		text-align: right;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
</style>
