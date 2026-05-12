<script>
	import { getContext } from "svelte";
	import inView from "$actions/inView.js";
	import SectionShell from "$components/sections/SectionShell.svelte";

	export let title = "Results";
	export let subtitle =
		"Agent advantage across the full benchmark and at each aggregation level. Positive bars beat the human expert; negative bars trail.";
	export let stratified = [];

	const copy = getContext("copy") || {};
	const cfg = copy?.overview?.landingSections?.[4] || {};
	$: sectionTitle = cfg.title || title;
	$: sectionLinkHref = cfg.linkHref || "/leaderboard/";
	$: sectionLinkLabel = cfg.linkLabel || "Full leaderboard ↗";

	const TABS = [
		{ key: "advantage", label: "Overall", desc: "Overall" },
		{ key: "level1", label: "L1 — Function", desc: "Function level" },
		{ key: "level2", label: "L2 — Class", desc: "Class level" },
		{ key: "level3", label: "L3 — Module", desc: "Module level" }
	];

	let activeTab = "advantage";
	let revealed = false;

	$: rows = (Array.isArray(stratified) ? stratified : [])
		.map((r) => ({
			agent: r.agent,
			model: r.model,
			value: typeof r[activeTab] === "number" ? r[activeTab] : null
		}))
		.filter((r) => r.value !== null);

	$: sortedRows = [...rows].sort((a, b) => b.value - a.value);

	$: scale = (() => {
		if (sortedRows.length === 0) return { abs: 0.05 };
		const vals = sortedRows.map((r) => r.value);
		const max = Math.max(...vals, 0);
		const min = Math.min(...vals, 0);
		return { abs: Math.max(Math.abs(max), Math.abs(min), 0.02) };
	})();

	function widthFor(v) {
		if (!Number.isFinite(v) || scale.abs === 0) return 0;
		return (Math.abs(v) / scale.abs) * 50;
	}

	function fmt(v) {
		if (!Number.isFinite(v)) return "—";
		return `${v >= 0 ? "+" : ""}${v.toFixed(4)}`;
	}
</script>

<section
	class="results-section"
	use:inView={{ bottom: 120 }}
	on:enter={() => (revealed = true)}
>
	<div class="container">
		<SectionShell
			title={sectionTitle}
			caption={subtitle}
			linkHref={sectionLinkHref}
			linkLabel={sectionLinkLabel}
		/>

		<div class="tabs" role="tablist">
			{#each TABS as t}
				<button
					class="tab"
					class:active={activeTab === t.key}
					role="tab"
					aria-selected={activeTab === t.key}
					on:click={() => (activeTab = t.key)}
				>
					{t.label}
				</button>
			{/each}
		</div>

		<div class="results-panel">
			<div class="bar-chart" class:revealed>
				{#each sortedRows as row, i (row.agent + row.model + activeTab)}
					<div class="bar-row" style="--i: {i}">
						<div class="bar-label">
							<strong>{row.agent}</strong>
							<span class="bar-model">{row.model}</span>
						</div>
						<div class="bar-track">
							<span class="bar-axis"></span>
							{#if row.value >= 0}
								<span
									class="bar-fill primary"
									style="--w: {widthFor(row.value)}%"
								></span>
							{:else}
								<span
									class="bar-fill tertiary"
									style="--w: {widthFor(row.value)}%"
								></span>
							{/if}
						</div>
						<div
							class="bar-value"
							class:pos={row.value > 0}
							class:neg={row.value < 0}
						>
							{fmt(row.value)}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.results-section {
		padding: var(--space-xl) 0;
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
	}

	.container {
		max-width: 1080px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-bottom: var(--space-md);
	}

	.tab {
		padding: 6px 12px;
		font-family: var(--sans);
		font-size: 0.82rem;
		color: var(--text-muted);
		background: transparent;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			color 120ms,
			border-color 120ms,
			background 120ms;
	}

	.tab:hover {
		color: var(--text-primary);
		border-color: var(--border-secondary);
	}

	.tab.active {
		color: #fff;
		background: var(--accent-primary);
		border-color: var(--accent-primary);
		font-weight: 600;
	}

	.results-panel {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		padding: var(--space-lg);
		box-shadow: var(--shadow);
	}

	.bar-chart {
		display: grid;
		gap: 10px;
	}

	.bar-row {
		display: grid;
		grid-template-columns: minmax(150px, 210px) minmax(0, 1fr) 120px;
		gap: 12px;
		align-items: center;
		opacity: 0;
		transform: translateY(2px);
		transition:
			opacity 0.45s ease,
			transform 0.45s ease;
		transition-delay: calc(var(--i) * 50ms);
	}

	.bar-chart.revealed .bar-row {
		opacity: 1;
		transform: translateY(0);
	}

	.bar-label {
		font-family: var(--sans);
		font-size: 0.85rem;
		color: var(--text-primary);
		line-height: 1.4;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.bar-label strong {
		font-weight: 600;
		color: var(--text-primary);
	}

	.bar-model {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.bar-track {
		position: relative;
		height: 12px;
		min-width: 0;
		background: #eef2ff;
		border-radius: 999px;
		overflow: hidden;
	}

	.bar-axis {
		position: absolute;
		left: 50%;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--border-secondary);
		pointer-events: none;
		z-index: 1;
	}

	.bar-fill {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 0;
		border-radius: 999px;
		transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
		transition-delay: inherit;
	}

	.bar-fill.primary {
		left: 50%;
		background: linear-gradient(
			90deg,
			var(--accent-primary),
			var(--accent-secondary)
		);
	}

	.bar-fill.tertiary {
		right: 50%;
		background: linear-gradient(270deg, #e45c57, #e0a133);
	}

	.bar-chart.revealed .bar-fill {
		width: var(--w);
	}

	.bar-value {
		font-family: var(--mono);
		font-size: 1rem;
		font-weight: 600;
		text-align: right;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.01em;
	}

	.bar-value.pos {
		color: var(--score-good);
	}

	.bar-value.neg {
		color: var(--score-bad);
	}

	@media (max-width: 720px) {
		.bar-row {
			grid-template-columns: 1fr;
			gap: 4px;
		}
		.bar-value {
			text-align: left;
		}
	}
</style>
