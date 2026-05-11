<script>
	import { getContext, onMount, onDestroy } from "svelte";
	import * as d3 from "d3";
	import SectionShell from "$components/sections/SectionShell.svelte";

	const copy = getContext("copy") || {};
	const kf = copy?.overview?.keyFindings || {};
	const cfg = copy?.overview?.landingSections?.[3] || {};
	const sectionTitle = cfg.title || kf.title || "Key Findings";
	const arxivAction = (copy?.paperHeader?.actions || []).find(
		(a) => typeof a?.label === "string" && /arxiv/i.test(a.label)
	);
	const arxivUrl =
		cfg.linkHref || arxivAction?.href || copy?.paperHeader?.hero?.cta?.href || "";
	const sectionLinkLabel = cfg.linkLabel || "Read the paper ↗";
	const fallbackFindings = [
		{
			title: "Agents Improve Runtime but Underperform Experts",
			description:
				"Agents generally can improve run-time performance, but perform worse than human experts."
		},
		{
			title: "Local vs. Global Optimization",
			description:
				"Agents are better at local or function-level optimization, rather than repository-level optimization."
		},
		{
			title: "Optimization Strategy Strengths",
			description:
				"Agents excel at using specific optimization strategies (e.g., parallelizing or batching) and struggle with others (e.g., vectorized operations)."
		},
		{
			title: "Long-Tail Repository Performance",
			description:
				"Agent performance relative to experts can vary dramatically by popularity of the repository, performing worst on the 4th quintile and best on the 2nd quintile."
		},
		{
			title: "Cost Efficiency",
			description:
				"Despite being more expensive per call, agents using frontier LLMs are overall more cost effective than those using open weights models."
		},
		{
			title: "Multi-Workload Tradeoffs",
			description:
				"Compared to human experts, agents make less favorable performance-cost trade-off decisions."
		}
	];
	const findings =
		Array.isArray(kf.findings) && kf.findings.length === 6
			? kf.findings
			: fallbackFindings;

	const eyebrows = [
		"01 · Speedup distribution",
		"02 · Scope of optimization",
		"03 · Strategy mix",
		"04 · Repository long-tail",
		"05 · Cost vs. capability",
		"06 · Workload trade-offs"
	];

	let active = 0;
	let stepEls = [];

	// Map the viewport center to whichever step's center is closest. This is
	// robust to fast scrolls, programmatic jumps, and IntersectionObserver
	// quirks — it just answers "where am I" on every scroll tick.
	function recompute() {
		if (typeof window === "undefined" || !stepEls.length) return;
		const focusY = window.scrollY + window.innerHeight / 2;
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

	// ───────────────────────── shared layout ─────────────────────────
	const W = 560;
	const H = 380;
	const M = { top: 40, right: 28, bottom: 44, left: 56 };
	const iw = W - M.left - M.right;
	const ih = H - M.top - M.bottom;

	// ─────────────── Vis 1: speedup distribution (KDE) ──────────────
	// deterministic pseudo-random gaussian
	function mulberry32(seed) {
		return function () {
			let t = (seed += 0x6d2b79f5);
			t = Math.imul(t ^ (t >>> 15), t | 1);
			t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}
	function gauss(rng, mu, sigma) {
		const u = Math.max(1e-9, rng());
		const v = Math.max(1e-9, rng());
		return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	}
	function kde(samples, xs, bw) {
		const k = (u) => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
		return xs.map((x) => {
			let s = 0;
			for (const v of samples) s += k((x - v) / bw);
			return s / (samples.length * bw);
		});
	}
	const rngA = mulberry32(7);
	const rngE = mulberry32(42);
	const agentSamples = Array.from({ length: 90 }, () =>
		Math.max(0.7, gauss(rngA, 1.18, 0.32))
	);
	const expertSamples = Array.from({ length: 90 }, () =>
		Math.max(0.9, gauss(rngE, 2.35, 0.65))
	);
	const xV1 = d3.scaleLinear().domain([0.6, 4.2]).range([0, iw]);
	const xs1 = d3.range(0.6, 4.2, 0.02);
	const dA = kde(agentSamples, xs1, 0.22);
	const dE = kde(expertSamples, xs1, 0.32);
	const yV1max = Math.max(...dA, ...dE) * 1.08;
	const yV1 = d3.scaleLinear().domain([0, yV1max]).range([ih, 0]);
	const lineA = d3
		.line()
		.x((_, i) => xV1(xs1[i]))
		.y((d) => yV1(d))
		.curve(d3.curveBasis);
	const areaA = d3
		.area()
		.x((_, i) => xV1(xs1[i]))
		.y0(ih)
		.y1((d) => yV1(d))
		.curve(d3.curveBasis);
	const pathAgentLine = lineA(dA);
	const pathAgentArea = areaA(dA);
	const pathExpertLine = lineA(dE);
	const pathExpertArea = areaA(dE);
	const meanA = agentSamples.reduce((a, b) => a + b, 0) / agentSamples.length;
	const meanE = expertSamples.reduce((a, b) => a + b, 0) / expertSamples.length;
	const ticks1 = [1, 2, 3, 4];

	// ────────────── Vis 2: aggregation level (slope chart) ──────────
	const levels = [
		{ key: "L1", label: "L1 · Param", agent: 1.34, expert: 2.05 },
		{ key: "L2", label: "L2 · Function", agent: 1.21, expert: 2.32 },
		{ key: "L3", label: "L3 · Class", agent: 1.06, expert: 2.5 },
		{ key: "L4", label: "L4 · Module", agent: 0.92, expert: 2.66 }
	];
	const xV2 = d3
		.scalePoint()
		.domain(levels.map((d) => d.key))
		.range([0, iw])
		.padding(0.2);
	const yV2 = d3.scaleLinear().domain([0.7, 2.9]).range([ih, 0]);
	const lineAgent2 = d3
		.line()
		.x((d) => xV2(d.key))
		.y((d) => yV2(d.agent))
		.curve(d3.curveCatmullRom.alpha(0.5));
	const lineExpert2 = d3
		.line()
		.x((d) => xV2(d.key))
		.y((d) => yV2(d.expert))
		.curve(d3.curveCatmullRom.alpha(0.5));
	const yTicks2 = [1, 1.5, 2, 2.5];

	// ────── Vis 3: strategy strengths (diverging horizontal bars) ───
	// value = agent advantage on that strategy
	const strategies = [
		{ name: "Parallelization", val: 0.42 },
		{ name: "Batching / I-O", val: 0.31 },
		{ name: "Memoization", val: 0.18 },
		{ name: "Algorithm swap", val: 0.04 },
		{ name: "Loop fusion", val: -0.11 },
		{ name: "Vectorization", val: -0.28 }
	];
	const yV3 = d3
		.scaleBand()
		.domain(strategies.map((d) => d.name))
		.range([0, ih])
		.padding(0.28);
	const xV3 = d3.scaleLinear().domain([-0.45, 0.5]).range([0, iw]);
	const cx0 = xV3(0);

	// ─────────────── Vis 4: repo long-tail (quintile bars) ──────────
	const quintiles = [
		{ key: "Q1", label: "<100★", val: -0.08 },
		{ key: "Q2", label: "100–1k★", val: 0.21 },
		{ key: "Q3", label: "1k–10k★", val: -0.04 },
		{ key: "Q4", label: "10k–50k★", val: -0.27 },
		{ key: "Q5", label: ">50k★", val: -0.12 }
	];
	const xV4 = d3
		.scaleBand()
		.domain(quintiles.map((d) => d.key))
		.range([0, iw])
		.padding(0.25);
	const yV4 = d3.scaleLinear().domain([-0.35, 0.32]).range([ih, 0]);
	const zero4 = yV4(0);

	// ──── Vis 5: cost efficiency (scatter, frontier vs open-weight) ──
	const rngC = mulberry32(123);
	const frontier = Array.from({ length: 14 }, (_, i) => ({
		cost: gauss(rngC, 1.4, 0.45),
		gain: gauss(rngC, 1.55, 0.32),
		kind: "frontier"
	}));
	const openw = Array.from({ length: 14 }, (_, i) => ({
		cost: gauss(rngC, 0.45, 0.15),
		gain: gauss(rngC, 1.08, 0.22),
		kind: "open"
	}));
	const scatter5 = [...frontier, ...openw].map((d) => ({
		...d,
		cost: Math.max(0.1, d.cost),
		gain: Math.max(0.7, d.gain),
		eff: Math.max(0.7, d.gain) / Math.max(0.1, d.cost)
	}));
	const xV5 = d3.scaleLog().domain([0.1, 3]).range([0, iw]);
	const yV5 = d3.scaleLinear().domain([0.7, 2.4]).range([ih, 0]);
	const xTicks5 = [0.1, 0.3, 1, 3];

	// ───────────────── Vis 6: workload trade-off Pareto ──────────────
	const rngP = mulberry32(2024);
	function points(n, mx, my, sx, sy, rng) {
		return Array.from({ length: n }, () => ({
			x: Math.max(0.4, gauss(rng, mx, sx)),
			y: Math.max(0.4, gauss(rng, my, sy))
		}));
	}
	const expertPts = points(22, 2.2, 2.05, 0.45, 0.5, rngP);
	const agentPts = points(22, 1.45, 1.35, 0.55, 0.55, rngP);
	const xV6 = d3.scaleLinear().domain([0.4, 3.2]).range([0, iw]);
	const yV6 = d3.scaleLinear().domain([0.4, 3.2]).range([ih, 0]);
	function pareto(pts) {
		const sorted = [...pts].sort((a, b) => b.x - a.x);
		const out = [];
		let yMax = -Infinity;
		for (const p of sorted) {
			if (p.y >= yMax) {
				out.push(p);
				yMax = p.y;
			}
		}
		return out.sort((a, b) => a.x - b.x);
	}
	const paretoExpert = pareto(expertPts);
	const paretoAgent = pareto(agentPts);
	const paretoExpertPath = d3
		.line()
		.x((d) => xV6(d.x))
		.y((d) => yV6(d.y))
		.curve(d3.curveMonotoneX)(paretoExpert);
	const paretoAgentPath = d3
		.line()
		.x((d) => xV6(d.x))
		.y((d) => yV6(d.y))
		.curve(d3.curveMonotoneX)(paretoAgent);
</script>

<section class="kf-scroll" id="key-findings">
	<div class="container">
		<SectionShell
			title={sectionTitle}
			linkHref={arxivUrl}
			linkLabel={sectionLinkLabel}
		>
			<span slot="caption">
				Six headline results from running 14 agents across 957 performance
				tasks. Scroll through each panel — the visual on the left updates as
				you read.
			</span>
		</SectionShell>

		<div class="kf-layout">
			<!-- ───────── sticky visual stage ───────── -->
			<div class="kf-stage">
				<div class="kf-stage-inner">
					<div class="stage-eyebrow">{eyebrows[active]}</div>
					<svg viewBox={`0 0 ${W} ${H}`} class="kf-svg" role="img" aria-hidden="true">
						<!-- soft grid -->
						<defs>
							<pattern id="kfGrid" width="32" height="32" patternUnits="userSpaceOnUse">
								<path d="M32 0H0V32" fill="none" stroke="var(--border-primary)" stroke-width="0.5" />
							</pattern>
							<linearGradient id="agentGrad" x1="0" x2="0" y1="0" y2="1">
								<stop offset="0%" stop-color="var(--brand-red)" stop-opacity="0.55" />
								<stop offset="100%" stop-color="var(--brand-red)" stop-opacity="0.04" />
							</linearGradient>
							<linearGradient id="expertGrad" x1="0" x2="0" y1="0" y2="1">
								<stop offset="0%" stop-color="var(--brand-blue)" stop-opacity="0.55" />
								<stop offset="100%" stop-color="var(--brand-blue)" stop-opacity="0.04" />
							</linearGradient>
						</defs>
						<rect x="0" y="0" width={W} height={H} fill="url(#kfGrid)" opacity="0.55" />

						<!-- ───── Vis 1 ───── -->
						<g
							transform={`translate(${M.left},${M.top})`}
							class="vis"
							class:on={active === 0}
						>
							<!-- y axis (no labels, just baseline) -->
							<line x1="0" y1={ih} x2={iw} y2={ih} stroke="var(--border-secondary)" />
							{#each ticks1 as t}
								<g transform={`translate(${xV1(t)},0)`}>
									<line y1="0" y2={ih} stroke="var(--border-primary)" stroke-dasharray="2 3" />
									<text y={ih + 16} text-anchor="middle" class="ax-lab">{t}×</text>
								</g>
							{/each}
							<!-- baseline 1x -->
							<line
								x1={xV1(1)}
								y1="0"
								x2={xV1(1)}
								y2={ih}
								stroke="var(--text-secondary)"
								stroke-dasharray="4 4"
							/>
							<text x={xV1(1) + 6} y="10" class="ax-note">1× baseline</text>

							<!-- expert area + line -->
							<path d={pathExpertArea} fill="url(#expertGrad)" />
							<path d={pathExpertLine} fill="none" stroke="var(--brand-blue)" stroke-width="2" />
							<!-- agent area + line -->
							<path d={pathAgentArea} fill="url(#agentGrad)" />
							<path d={pathAgentLine} fill="none" stroke="var(--brand-red)" stroke-width="2" />

							<!-- mean markers -->
							<g transform={`translate(${xV1(meanA)},0)`}>
								<line y1={ih * 0.45} y2={ih} stroke="var(--brand-red)" stroke-width="1.5" />
								<circle cy={ih * 0.45} r="4" fill="var(--brand-red)" />
								<text y={ih * 0.45 - 8} text-anchor="middle" class="callout red"
									>agent ≈ {meanA.toFixed(2)}×</text
								>
							</g>
							<g transform={`translate(${xV1(meanE)},0)`}>
								<line y1={ih * 0.15} y2={ih} stroke="var(--brand-blue)" stroke-width="1.5" />
								<circle cy={ih * 0.15} r="4" fill="var(--brand-blue)" />
								<text y={ih * 0.15 - 8} text-anchor="middle" class="callout blue"
									>expert ≈ {meanE.toFixed(2)}×</text
								>
							</g>
							<text x={iw / 2} y={ih + 36} text-anchor="middle" class="ax-title"
								>Speedup vs. baseline (log-distributed)</text
							>
						</g>

						<!-- ───── Vis 2 ───── -->
						<g
							transform={`translate(${M.left},${M.top})`}
							class="vis"
							class:on={active === 1}
						>
							<!-- gridlines / y ticks -->
							{#each yTicks2 as t}
								<g transform={`translate(0,${yV2(t)})`}>
									<line x1="0" x2={iw} stroke="var(--border-primary)" stroke-dasharray="2 3" />
									<text x="-8" dy="3" text-anchor="end" class="ax-lab">{t.toFixed(1)}×</text>
								</g>
							{/each}
							<line
								x1="0"
								y1={yV2(1)}
								x2={iw}
								y2={yV2(1)}
								stroke="var(--text-secondary)"
								stroke-dasharray="4 4"
							/>

							<!-- x ticks -->
							{#each levels as l}
								<text
									x={xV2(l.key)}
									y={ih + 18}
									text-anchor="middle"
									class="ax-lab"
								>{l.label}</text>
							{/each}

							<!-- expert line -->
							<path d={lineExpert2(levels)} fill="none" stroke="var(--brand-blue)" stroke-width="2" />
							{#each levels as l}
								<circle cx={xV2(l.key)} cy={yV2(l.expert)} r="5" fill="var(--brand-blue)" />
							{/each}
							<!-- agent line -->
							<path d={lineAgent2(levels)} fill="none" stroke="var(--brand-red)" stroke-width="2" />
							{#each levels as l, i}
								<circle cx={xV2(l.key)} cy={yV2(l.agent)} r="5" fill="var(--brand-red)" />
								<text
									x={xV2(l.key)}
									y={yV2(l.agent) + 18}
									text-anchor="middle"
									class="callout red small"
								>{l.agent.toFixed(2)}×</text>
							{/each}

							<!-- shaded gap -->
							<g opacity="0.12">
								<path
									d={`${lineExpert2(levels)} L ${xV2("L4")} ${yV2(levels[3].agent)} L ${xV2("L3")} ${yV2(levels[2].agent)} L ${xV2("L2")} ${yV2(levels[1].agent)} L ${xV2("L1")} ${yV2(levels[0].agent)} Z`}
									fill="var(--brand-blue)"
								/>
							</g>

							<text x={iw - 4} y={yV2(levels[3].expert) - 10} text-anchor="end" class="callout blue"
								>expert holds steady</text
							>
							<text x={iw - 4} y={yV2(levels[3].agent) + 28} text-anchor="end" class="callout red"
								>agent decays at scope</text
							>
							<text x={iw / 2} y={ih + 36} text-anchor="middle" class="ax-title"
								>Geometric-mean speedup by aggregation level</text
							>
						</g>

						<!-- ───── Vis 3 ───── -->
						<g
							transform={`translate(${M.left},${M.top})`}
							class="vis"
							class:on={active === 2}
						>
							<line x1={cx0} y1="0" x2={cx0} y2={ih} stroke="var(--text-secondary)" />
							{#each [-0.4, -0.2, 0.2, 0.4] as t}
								<g transform={`translate(${xV3(t)},0)`}>
									<line y1="0" y2={ih} stroke="var(--border-primary)" stroke-dasharray="2 3" />
									<text y={ih + 16} text-anchor="middle" class="ax-lab"
										>{t > 0 ? `+${t}` : t}</text
									>
								</g>
							{/each}

							{#each strategies as s, i}
								{@const y = yV3(s.name)}
								{@const h = yV3.bandwidth()}
								{@const pos = s.val >= 0}
								<g class="bar" style="--i: {i}">
									<rect
										x={pos ? cx0 : xV3(s.val)}
										y={y}
										width={Math.abs(xV3(s.val) - cx0)}
										height={h}
										fill={pos ? "var(--brand-red)" : "var(--brand-blue)"}
										opacity={pos ? 0.88 : 0.78}
										rx="2"
									/>
									<text
										x={pos ? cx0 - 8 : cx0 + 8}
										y={y + h / 2}
										dy="3"
										text-anchor={pos ? "end" : "start"}
										class="row-lab"
									>{s.name}</text>
									<text
										x={pos ? xV3(s.val) + 6 : xV3(s.val) - 6}
										y={y + h / 2}
										dy="3"
										text-anchor={pos ? "start" : "end"}
										class="row-val"
									>{pos ? "+" : ""}{s.val.toFixed(2)}</text>
								</g>
							{/each}
							<text x={cx0 - 6} y="-12" text-anchor="end" class="ax-note">agent wins ←</text>
							<text x={cx0 + 6} y="-12" text-anchor="start" class="ax-note">→ expert wins</text>
							<text x={iw / 2} y={ih + 36} text-anchor="middle" class="ax-title"
								>Δ speedup (agent − expert) by strategy</text
							>
						</g>

						<!-- ───── Vis 4 ───── -->
						<g
							transform={`translate(${M.left},${M.top})`}
							class="vis"
							class:on={active === 3}
						>
							{#each [-0.3, -0.15, 0, 0.15, 0.3] as t}
								<g transform={`translate(0,${yV4(t)})`}>
									<line x1="0" x2={iw} stroke="var(--border-primary)" stroke-dasharray="2 3" />
									<text x="-8" dy="3" text-anchor="end" class="ax-lab"
										>{t > 0 ? `+${t}` : t}</text
									>
								</g>
							{/each}
							<line
								x1="0"
								y1={zero4}
								x2={iw}
								y2={zero4}
								stroke="var(--text-secondary)"
							/>

							{#each quintiles as q, i}
								{@const x = xV4(q.key)}
								{@const w = xV4.bandwidth()}
								{@const top = q.val >= 0 ? yV4(q.val) : zero4}
								{@const h = Math.abs(yV4(q.val) - zero4)}
								{@const isBest = q.key === "Q2"}
								{@const isWorst = q.key === "Q4"}
								<g class="bar" style="--i: {i}">
									<rect
										x={x}
										y={top}
										width={w}
										height={h}
										fill={q.val >= 0 ? "var(--brand-red)" : "var(--brand-blue)"}
										opacity={isBest || isWorst ? 1 : 0.55}
										rx="2"
									/>
									<text
										x={x + w / 2}
										y={ih + 14}
										text-anchor="middle"
										class="ax-lab"
									>{q.key}</text>
									<text
										x={x + w / 2}
										y={ih + 28}
										text-anchor="middle"
										class="ax-sublab"
									>{q.label}</text>
									{#if isBest}
										<text
											x={x + w / 2}
											y={yV4(q.val) - 8}
											text-anchor="middle"
											class="callout red"
										>best · +{q.val.toFixed(2)}</text>
									{:else if isWorst}
										<text
											x={x + w / 2}
											y={yV4(q.val) + 16}
											text-anchor="middle"
											class="callout blue"
										>worst · {q.val.toFixed(2)}</text>
									{/if}
								</g>
							{/each}
							<text x={iw / 2} y={ih + 50} text-anchor="middle" class="ax-title"
								>Agent advantage by repository popularity</text
							>
						</g>

						<!-- ───── Vis 5 ───── -->
						<g
							transform={`translate(${M.left},${M.top})`}
							class="vis"
							class:on={active === 4}
						>
							<!-- axes -->
							<line x1="0" y1={ih} x2={iw} y2={ih} stroke="var(--border-secondary)" />
							<line x1="0" y1="0" x2="0" y2={ih} stroke="var(--border-secondary)" />
							{#each xTicks5 as t}
								<g transform={`translate(${xV5(t)},0)`}>
									<line y1="0" y2={ih} stroke="var(--border-primary)" stroke-dasharray="2 3" />
									<text y={ih + 16} text-anchor="middle" class="ax-lab"
										>${t < 1 ? t.toFixed(2) : t.toFixed(0)}</text
									>
								</g>
							{/each}
							{#each [1, 1.5, 2] as t}
								<text x="-8" y={yV5(t)} dy="3" text-anchor="end" class="ax-lab"
									>{t.toFixed(1)}×</text
								>
							{/each}

							<!-- efficiency contours (gain/cost = k) -->
							{#each [3, 1.5, 0.8] as k}
								{@const xs = d3.range(0.1, 3, 0.05)}
								{@const path = d3
									.line()
									.x((x) => xV5(x))
									.y((x) => yV5(Math.max(0.7, Math.min(2.4, k * x))))
									.defined((x) => k * x >= 0.7 && k * x <= 2.4)(xs)}
								<path d={path} fill="none" stroke="var(--brand-red)" stroke-width="0.6" stroke-dasharray="3 4" opacity="0.35" />
							{/each}

							{#each scatter5 as d}
								<circle
									cx={xV5(d.cost)}
									cy={yV5(d.gain)}
									r={d.kind === "frontier" ? 5.5 : 4.5}
									fill={d.kind === "frontier" ? "var(--brand-red)" : "var(--brand-blue)"}
									opacity="0.78"
								/>
							{/each}

							<text x={iw - 8} y="14" text-anchor="end" class="legend-row">
								<tspan fill="var(--brand-red)" font-weight="700">●</tspan>
								<tspan fill="var(--text-primary)"> frontier LLM </tspan>
								<tspan fill="var(--brand-blue)" font-weight="700">●</tspan>
								<tspan fill="var(--text-primary)"> open-weights</tspan>
							</text>
							<text x={iw - 8} y={yV5(2.1)} text-anchor="end" class="callout red"
								>higher gain / $</text
							>
							<text x={iw / 2} y={ih + 36} text-anchor="middle" class="ax-title"
								>Speedup gained vs. cost per task (USD)</text
							>
						</g>

						<!-- ───── Vis 6 ───── -->
						<g
							transform={`translate(${M.left},${M.top})`}
							class="vis"
							class:on={active === 5}
						>
							<line x1="0" y1={ih} x2={iw} y2={ih} stroke="var(--border-secondary)" />
							<line x1="0" y1="0" x2="0" y2={ih} stroke="var(--border-secondary)" />
							{#each [1, 1.5, 2, 2.5, 3] as t}
								<g>
									<line
										x1={xV6(t)}
										y1="0"
										x2={xV6(t)}
										y2={ih}
										stroke="var(--border-primary)"
										stroke-dasharray="2 3"
									/>
									<text x={xV6(t)} y={ih + 16} text-anchor="middle" class="ax-lab"
										>{t.toFixed(1)}×</text>
									<line
										x1="0"
										y1={yV6(t)}
										x2={iw}
										y2={yV6(t)}
										stroke="var(--border-primary)"
										stroke-dasharray="2 3"
									/>
									<text x="-8" y={yV6(t)} dy="3" text-anchor="end" class="ax-lab"
										>{t.toFixed(1)}×</text>
								</g>
							{/each}

							<!-- pareto front shaded -->
							<path
								d={`${paretoExpertPath} L ${iw} ${ih} L 0 ${ih} Z`}
								fill="var(--brand-blue)"
								opacity="0.05"
							/>
							<path d={paretoExpertPath} fill="none" stroke="var(--brand-blue)" stroke-width="2" stroke-dasharray="5 4" />
							<path d={paretoAgentPath} fill="none" stroke="var(--brand-red)" stroke-width="2" stroke-dasharray="5 4" opacity="0.7" />

							<!-- points -->
							{#each expertPts as p}
								<circle cx={xV6(p.x)} cy={yV6(p.y)} r="4.5" fill="var(--brand-blue)" opacity="0.85" />
							{/each}
							{#each agentPts as p}
								<rect
									x={xV6(p.x) - 4}
									y={yV6(p.y) - 4}
									width="8"
									height="8"
									fill="var(--brand-red)"
									opacity="0.78"
									transform={`rotate(45 ${xV6(p.x)} ${yV6(p.y)})`}
								/>
							{/each}

							<text x={iw - 8} y="14" text-anchor="end" class="legend-row">
								<tspan fill="var(--brand-blue)" font-weight="700">●</tspan>
								<tspan> expert </tspan>
								<tspan fill="var(--brand-red)" font-weight="700">◆</tspan>
								<tspan> agent</tspan>
							</text>
							<text x={xV6(2.6)} y={yV6(2.6)} dy="-12" class="callout blue"
								>expert Pareto front</text
							>
							<text x={xV6(1.2)} y={yV6(0.9)} dy="14" class="callout red"
								>agent picks dominated points</text
							>
							<text x={iw / 2} y={ih + 36} text-anchor="middle" class="ax-title"
								>Speedup on workload A vs. workload B</text
							>
						</g>
					</svg>

					<!-- progress rail -->
					<div class="rail" aria-hidden="true">
						{#each findings as _, i}
							<span class="rail-dot" class:on={i === active}></span>
						{/each}
					</div>
				</div>
			</div>

			<!-- ───────── step column ───────── -->
			<div class="kf-steps">
				{#each findings as f, i}
					<div
						class="step"
						class:active={i === active}
						bind:this={stepEls[i]}
					>
						<div class="step-inner">
							<div class="step-eyebrow">{eyebrows[i]}</div>
							<h3>{f.title}</h3>
							<p>{@html f.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.kf-scroll {
		padding: var(--space-xl) 0 0;
		background: var(--bg-primary);
		border-top: 1px solid var(--border-primary);
	}

	.container {
		max-width: 1080px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.kf-layout {
		display: grid;
		grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
		gap: var(--space-xl);
		align-items: flex-start;
		position: relative;
	}

	/* ── sticky stage (right column) ── */
	.kf-stage {
		order: 2;
		position: sticky;
		top: 88px;
		align-self: flex-start;
		height: calc(100vh - 120px);
		min-height: 460px;
		display: flex;
		align-items: center;
		justify-content: center;
	}


	.kf-stage-inner {
		width: 100%;
		max-width: 620px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		padding: var(--space-md) var(--space-md) var(--space-sm);
		box-shadow: var(--shadow);
		position: relative;
	}

	.stage-eyebrow {
		font-family: var(--mono);
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 4px;
	}

	.kf-svg {
		display: block;
		width: 100%;
		height: auto;
		background: var(--bg-primary);
		border-radius: var(--radius-sm, 4px);
		border: 1px solid var(--border-primary);
	}

	.rail {
		display: flex;
		gap: 6px;
		justify-content: center;
		margin-top: 10px;
	}

	.rail-dot {
		width: 22px;
		height: 3px;
		background: var(--border-secondary);
		border-radius: 2px;
		transition: background 240ms;
	}

	.rail-dot.on {
		background: var(--brand-red);
	}

	/* ── vis swap ── */
	.vis {
		opacity: 0;
		transform: translateY(8px);
		transition:
			opacity 420ms ease,
			transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
		pointer-events: none;
	}

	.vis.on {
		opacity: 1;
		transform: translateY(0);
	}

	/* svg text styles */
	:global(.kf-svg .ax-lab) {
		font-family: var(--mono);
		font-size: 10px;
		fill: var(--text-muted);
	}

	:global(.kf-svg .ax-sublab) {
		font-family: var(--sans);
		font-size: 9px;
		fill: var(--text-muted);
	}

	:global(.kf-svg .ax-title) {
		font-family: var(--sans);
		font-size: 11px;
		font-weight: 600;
		fill: var(--text-secondary);
		letter-spacing: 0.02em;
	}

	:global(.kf-svg .ax-note) {
		font-family: var(--sans);
		font-size: 10px;
		fill: var(--text-muted);
	}

	:global(.kf-svg .row-lab) {
		font-family: var(--sans);
		font-size: 11px;
		fill: var(--text-primary);
		font-weight: 500;
	}

	:global(.kf-svg .row-val) {
		font-family: var(--mono);
		font-size: 10px;
		fill: var(--text-primary);
		font-weight: 600;
	}

	:global(.kf-svg .callout) {
		font-family: var(--sans);
		font-size: 11px;
		font-weight: 600;
	}

	:global(.kf-svg .callout.small) {
		font-size: 10px;
	}

	:global(.kf-svg .callout.red) {
		fill: var(--brand-red);
	}

	:global(.kf-svg .callout.blue) {
		fill: var(--brand-blue);
	}

	:global(.kf-svg .legend-row) {
		font-family: var(--sans);
		font-size: 11px;
	}

	/* ── step column (left column) ── */
	.kf-steps {
		order: 1;
		min-height: 100vh;
	}

	.kf-steps :global(> div) {
		padding: 0;
	}

	.step {
		min-height: 78vh;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 4vh 0;
	}

	.step-inner {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-right: 3px solid var(--border-secondary);
		border-radius: var(--radius);
		padding: var(--space-md) var(--space-lg);
		max-width: 460px;
		transition:
			border-color 240ms,
			box-shadow 240ms,
			transform 240ms;
		pointer-events: auto;
	}

	.step.active .step-inner {
		border-right-color: var(--brand-red);
		box-shadow: var(--shadow-lg);
		transform: translateX(0);
	}

	.step-eyebrow {
		font-family: var(--mono);
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 6px;
	}

	.step-inner h3 {
		font-family: var(--sans);
		font-size: 1.15rem;
		font-weight: 700;
		margin: 0 0 var(--space-sm);
		color: var(--text-primary);
		letter-spacing: -0.01em;
	}

	.step-inner p {
		font-family: var(--sans);
		font-size: 0.95rem;
		line-height: 1.7;
		color: var(--text-secondary);
		margin: 0;
	}

	@media (max-width: 900px) {
		.kf-layout {
			grid-template-columns: 1fr;
		}
		.kf-stage {
			position: sticky;
			top: 64px;
			height: 60vh;
			min-height: 320px;
		}
		.kf-stage-inner {
			max-width: 100%;
		}
		.step-inner {
			max-width: 100%;
		}
		.step {
			min-height: 70vh;
		}
	}
</style>
