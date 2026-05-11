<script>
	import { getContext, onMount, onDestroy } from "svelte";
	import SectionShell from "$components/sections/SectionShell.svelte";
	import F1_GlobalLeaderboard from "$components/sections/findings/F1_GlobalLeaderboard.svelte";
	import F2_StratifiedAdvantage from "$components/sections/findings/F2_StratifiedAdvantage.svelte";
	import F3_StrategyAdvantage from "$components/sections/findings/F3_StrategyAdvantage.svelte";
	import F4_RepoQuintiles from "$components/sections/findings/F4_RepoQuintiles.svelte";
	import F5_CostPareto from "$components/sections/findings/F5_CostPareto.svelte";
	import F6_MultiWorkloadTradeoff from "$components/sections/findings/F6_MultiWorkloadTradeoff.svelte";
	import F7_TemporalGeneralization from "$components/sections/findings/F7_TemporalGeneralization.svelte";

	const copy = getContext("copy") || {};
	const kf = copy?.overview?.keyFindings || {};
	const cfg = copy?.overview?.landingSections?.[3] || {};
	const sectionTitle = cfg.title || kf.title || "Key Findings";
	const sectionCaption =
		cfg.caption ||
		"Each finding maps to a specific figure or table in the FormulaCode paper. Charts and tables are rendered live from the analysis pipeline (or marked “data pending” until the export lands).";
	const arxivAction = (copy?.paperHeader?.actions || []).find(
		(a) => typeof a?.label === "string" && /arxiv/i.test(a.label)
	);
	const arxivUrl =
		cfg.linkHref ||
		arxivAction?.href ||
		copy?.paperHeader?.hero?.cta?.href ||
		"https://arxiv.org/html/2603.16011v1";
	const sectionLinkLabel = cfg.linkLabel || "Read the paper ↗";

	// Six findings shown in this section. F1 (the global leaderboard) appears
	// just below as the "Leaderboard at a glance" recap and is not duplicated
	// here. Each entry pairs the F* component with its narrative copy in case
	// copy.json wants to override the component's built-in description.
	const findings = [
		{
			id: "leaderboard",
			title: "Agents improve runtime but underperform experts",
			component: F1_GlobalLeaderboard
		},
		{
			id: "stratified",
			title: "Local vs global optimization",
			component: F2_StratifiedAdvantage
		},
		{
			id: "strategy",
			title: "Optimization strategy strengths",
			component: F3_StrategyAdvantage
		},
		{
			id: "longtail",
			title: "Long-tail repository performance",
			component: F4_RepoQuintiles
		},
		{
			id: "cost",
			title: "Cost efficiency",
			component: F5_CostPareto
		},
		{
			id: "tradeoff",
			title: "Multi-workload tradeoffs",
			component: F6_MultiWorkloadTradeoff
		},
		{
			id: "temporal",
			title: "Temporal generalization",
			component: F7_TemporalGeneralization
		}
	];

	// Active-step tracking for the side rail.
	let active = 0;
	let stepEls = [];

	function recompute() {
		if (typeof window === "undefined" || !stepEls.length) return;
		const focusY = window.scrollY + window.innerHeight * 0.4;
		let best = 0;
		let bestDist = Infinity;
		for (let i = 0; i < stepEls.length; i++) {
			const el = stepEls[i];
			if (!el) continue;
			const r = el.getBoundingClientRect();
			const center = r.top + window.scrollY + r.height / 2;
			const d = Math.abs(center - focusY);
			if (d < bestDist) {
				bestDist = d;
				best = i;
			}
		}
		if (best !== active) active = best;
	}

	let raf = 0;
	function onScroll() {
		if (raf) return;
		raf = requestAnimationFrame(() => {
			raf = 0;
			recompute();
		});
	}

	onMount(() => {
		recompute();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll);
	});

	onDestroy(() => {
		if (typeof window !== "undefined") {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
		}
	});

	function jumpTo(i) {
		const el = stepEls[i];
		if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
	}
</script>

<section class="kf-section" id="key-findings">
	<div class="container">
		<SectionShell
			title={sectionTitle}
			caption={sectionCaption}
			linkHref={arxivUrl}
			linkLabel={sectionLinkLabel}
		/>

		<div class="kf-layout">
			<aside class="kf-rail" aria-label="Findings navigation">
				<ol>
					{#each findings as f, i}
						<li>
							<button
								class="rail-btn"
								class:active={i === active}
								on:click={() => jumpTo(i)}
								type="button"
							>
								<span class="rail-mark" aria-hidden="true"></span>
								<span class="rail-label">{f.title}</span>
							</button>
						</li>
					{/each}
				</ol>
			</aside>

			<div class="kf-stream">
				{#each findings as f, i}
					<article
						class="kf-card"
						class:active={i === active}
						bind:this={stepEls[i]}
					>
						<svelte:component this={f.component} />
					</article>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.kf-section {
		padding: var(--space-xl) 0;
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
	}

	.container {
		max-width: 1180px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.kf-layout {
		display: grid;
		grid-template-columns: 200px minmax(0, 1fr);
		gap: var(--space-lg);
		align-items: start;
	}

	.kf-rail {
		position: sticky;
		top: 80px;
		align-self: start;
	}

	.kf-rail ol {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.rail-btn {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border: none;
		border-left: 2px solid transparent;
		border-radius: 0;
		background: transparent;
		cursor: pointer;
		font-family: var(--sans);
		color: var(--text-muted);
		transition: color 120ms, background 120ms, border-color 120ms;
		width: 100%;
		text-align: left;
		font-size: 0.85rem;
		line-height: 1.35;
	}

	.rail-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.rail-btn.active {
		color: var(--text-primary);
		border-left-color: var(--brand-blue, var(--accent-primary));
		background: var(--bg-tertiary);
	}

	.rail-mark {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--border-secondary);
		flex: 0 0 auto;
		transition: background 120ms;
	}

	.rail-btn.active .rail-mark {
		background: var(--brand-blue, var(--accent-primary));
	}

	.rail-label {
		font-weight: 500;
	}

	.rail-btn.active .rail-label {
		font-weight: 600;
	}

	.kf-stream {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.kf-card {
		padding: var(--space-lg);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		background: var(--bg-primary);
		box-shadow: var(--shadow);
		scroll-margin-top: 64px;
		transition: border-color 160ms, box-shadow 160ms;
	}

	.kf-card.active {
		border-color: var(--brand-blue, var(--accent-primary));
	}

	@media (max-width: 820px) {
		.kf-layout {
			grid-template-columns: 1fr;
		}
		.kf-rail {
			position: static;
			margin-bottom: var(--space-md);
		}
		.kf-rail ol {
			flex-direction: row;
			flex-wrap: wrap;
			gap: 6px;
		}
		.rail-btn {
			width: auto;
			padding: 6px 10px;
			border-left: none;
			border: 1px solid var(--border-primary);
			border-radius: var(--radius);
		}
		.rail-btn.active {
			border-color: var(--brand-blue, var(--accent-primary));
		}
	}
</style>
