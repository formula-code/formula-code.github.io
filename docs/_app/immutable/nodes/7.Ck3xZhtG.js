import {
	s as q,
	n as $,
	d as p,
	l as V,
	i as E,
	b as m,
	m as k,
	c as f,
	e as _,
	q as I,
	u as C,
	g as b,
	v as S,
	F as R,
	C as j,
	f as U,
	t as Q
} from "../chunks/BEinvJTW.js";
import {
	S as N,
	i as W,
	d as T,
	a as F,
	t as P,
	m as z,
	e as D,
	b as H
} from "../chunks/DuBysls-.js";
import { M as J } from "../chunks/Deiux9lq.js";
import { e as B } from "../chunks/Cyq3z6cx.js";
function G(i, e, t) {
	const a = i.slice();
	return ((a[4] = e[t]), a);
}
function O(i) {
	let e,
		t,
		a = i[4].label + "",
		c,
		s,
		v,
		d;
	function u() {
		return i[3](i[4]);
	}
	return {
		c() {
			((e = b("li")), (t = b("button")), (c = Q(a)), (s = S()), this.h());
		},
		l(h) {
			e = f(h, "LI", {});
			var n = _(e);
			t = f(n, "BUTTON", { class: !0 });
			var A = _(t);
			((c = U(A, a)), A.forEach(p), (s = C(n)), n.forEach(p), this.h());
		},
		h() {
			(k(t, "class", "svelte-s2t5c8"), R(t, "active", i[0] === i[4].id));
		},
		m(h, n) {
			(E(h, e, n),
				m(e, t),
				m(t, c),
				m(e, s),
				v || ((d = j(t, "click", u)), (v = !0)));
		},
		p(h, n) {
			((i = h), n & 3 && R(t, "active", i[0] === i[4].id));
		},
		d(h) {
			(h && p(e), (v = !1), d());
		}
	};
}
function K(i) {
	let e,
		t,
		a,
		c,
		s = "Documentation",
		v,
		d,
		u,
		h,
		n,
		A = `<article id="motivation" class="doc-section svelte-s2t5c8"><h1 class="svelte-s2t5c8">Motivation</h1> <p class="svelte-s2t5c8">Existing code benchmarks often rely on synthetic or LLM-generated tasks,
				single-objective workloads, or binary pass/fail outcomes—all of which
				offer a constrained evaluation landscape compared to the emerging
				capabilities of LLM coding agents.</p> <p class="svelte-s2t5c8">Real-world performance optimization is rarely isolated: improving one
				function often degrades performance elsewhere. Engineers must balance
				multiple competing workloads, maintain correctness constraints, and
				structure improvements across the entire codebase hierarchy.</p> <p class="svelte-s2t5c8">FormulaCode bridges this gap by providing <strong>961 real-world performance bottleneck tasks</strong>
				mined from <strong>70 scientific GitHub repositories</strong>, each with
				an average of
				<strong>1,532 community-maintained performance workloads</strong> and expert-authored
				optimization patches. This enables the first large-scale analysis of the
				holistic ability of LLM agents to optimize codebases.</p></article> <article id="installation" class="doc-section svelte-s2t5c8"><h1 class="svelte-s2t5c8">Installation</h1> <h2 class="svelte-s2t5c8">Prerequisites</h2> <ul class="req-list svelte-s2t5c8"><li class="svelte-s2t5c8">Docker (version 20.10+)</li> <li class="svelte-s2t5c8">Python 3.10 or higher</li> <li class="svelte-s2t5c8">At least 16 GB of RAM recommended</li> <li class="svelte-s2t5c8">An API key for the LLM provider you want to evaluate</li></ul> <h2 class="svelte-s2t5c8">Install Terminal-Bench</h2> <p class="svelte-s2t5c8">FormulaCode evaluations are run through the Terminal-Bench framework:</p> <div class="code-block svelte-s2t5c8"><div class="code-header svelte-s2t5c8">bash</div> <pre class="svelte-s2t5c8"><code class="svelte-s2t5c8">pip install terminal-bench
# or via the GitHub repository
git clone https://github.com/formula-code/terminal-bench.git
cd terminal-bench
pip install -e .</code></pre></div> <h2 class="svelte-s2t5c8">Verify Installation</h2> <div class="code-block svelte-s2t5c8"><div class="code-header svelte-s2t5c8">bash</div> <pre class="svelte-s2t5c8"><code class="svelte-s2t5c8">harbor --version
harbor list -d formulacode</code></pre></div></article> <article id="running" class="doc-section svelte-s2t5c8"><h1 class="svelte-s2t5c8">Running an Evaluation</h1> <h2 class="svelte-s2t5c8">Quick Start</h2> <p class="svelte-s2t5c8">Run an evaluation using the Expert Human (human expert) agent to verify your
				setup:</p> <div class="code-block svelte-s2t5c8"><div class="code-header svelte-s2t5c8">bash</div> <pre class="svelte-s2t5c8"><code class="svelte-s2t5c8">harbor run -d formulacode@0.1.0.post20251025 -a oracle</code></pre></div> <h2 class="svelte-s2t5c8">Evaluating a Custom Agent</h2> <p class="svelte-s2t5c8">To evaluate your own agent, specify the agent configuration:</p> <div class="code-block svelte-s2t5c8"><div class="code-header svelte-s2t5c8">bash</div> <pre class="svelte-s2t5c8"><code class="svelte-s2t5c8"># Run with a specific agent and model
harbor run -d formulacode@0.1.0.post20251025 \\
    -a your_agent \\
    --model your_model \\
    --max-cost 10.0</code></pre></div> <h2 class="svelte-s2t5c8">Common Options</h2> <div class="options-table svelte-s2t5c8"><table class="svelte-s2t5c8"><thead><tr><th class="svelte-s2t5c8">Flag</th> <th class="svelte-s2t5c8">Description</th> <th class="svelte-s2t5c8">Default</th></tr></thead> <tbody><tr><td class="svelte-s2t5c8"><code class="svelte-s2t5c8">-d</code></td><td class="svelte-s2t5c8">Dataset specifier</td><td class="svelte-s2t5c8">—</td></tr> <tr><td class="svelte-s2t5c8"><code class="svelte-s2t5c8">-a</code></td><td class="svelte-s2t5c8">Agent framework</td><td class="svelte-s2t5c8">—</td></tr> <tr><td class="svelte-s2t5c8"><code class="svelte-s2t5c8">--model</code></td><td class="svelte-s2t5c8">LLM model to use</td><td class="svelte-s2t5c8">gpt-5</td></tr> <tr><td class="svelte-s2t5c8"><code class="svelte-s2t5c8">--max-cost</code></td><td class="svelte-s2t5c8">Maximum inference budget ($)</td><td class="svelte-s2t5c8">10.0</td></tr> <tr><td class="svelte-s2t5c8"><code class="svelte-s2t5c8">--tasks</code></td><td class="svelte-s2t5c8">Specific task IDs to run</td><td class="svelte-s2t5c8">all</td></tr> <tr><td class="svelte-s2t5c8"><code class="svelte-s2t5c8">--output</code></td><td class="svelte-s2t5c8">Output directory for results</td><td class="svelte-s2t5c8">./results</td></tr></tbody></table></div></article> <article id="structure" class="doc-section svelte-s2t5c8"><h1 class="svelte-s2t5c8">Benchmark Structure</h1> <p class="svelte-s2t5c8">Each FormulaCode task consists of:</p> <div class="structure-cards svelte-s2t5c8"><div class="struct-card svelte-s2t5c8"><h3 class="svelte-s2t5c8">📦 Repository Snapshot</h3> <p class="svelte-s2t5c8">A Docker container with the repository frozen at the PR&#39;s base
						commit, including all dependencies and build tools.</p></div> <div class="struct-card svelte-s2t5c8"><h3 class="svelte-s2t5c8">📋 Problem Statement</h3> <p class="svelte-s2t5c8">The GitHub issue describing the performance problem, including
						context from linked issues, discussions, and the knowledge graph.</p></div> <div class="struct-card svelte-s2t5c8"><h3 class="svelte-s2t5c8">⚡ Performance Workloads</h3> <p class="svelte-s2t5c8">Community-maintained benchmarks (via airspeed-velocity) covering
						timing, memory, and user-defined metrics, with a median of 81
						workloads per task.</p></div> <div class="struct-card svelte-s2t5c8"><h3 class="svelte-s2t5c8">✅ Correctness Tests</h3> <p class="svelte-s2t5c8">Unit tests (manually validated) and snapshot tests (automated)
						ensuring agent patches don&#39;t break functionality.</p></div> <div class="struct-card svelte-s2t5c8"><h3 class="svelte-s2t5c8">👤 Expert Patch</h3> <p class="svelte-s2t5c8">The human-authored solution from the merged PR, serving as a
						reference baseline for computing Advantage metrics.</p></div></div> <h2 class="svelte-s2t5c8">Workload Hierarchy</h2> <p class="svelte-s2t5c8">Workloads are organized in a code hierarchy for stratified evaluation:</p> <div class="code-block svelte-s2t5c8"><div class="code-header svelte-s2t5c8">hierarchy</div> <pre class="svelte-s2t5c8"><code class="svelte-s2t5c8">Level 0 (Module):    algorithms.*
Level 1 (Class):     algorithms.Sorting.*
Level 2 (Function):  algorithms.Sorting.time_sort_int.*</code></pre></div></article> <article id="metrics" class="doc-section svelte-s2t5c8"><h1 class="svelte-s2t5c8">Metrics Reference</h1> <div class="metric-def svelte-s2t5c8"><h2 class="svelte-s2t5c8">Speedup</h2> <p class="svelte-s2t5c8">For each workload <em>w<sub>i</sub></em>, the speedup ratio compares
					baseline to agent execution time:</p> <div class="formula svelte-s2t5c8">S<sub>i</sub> = w<sub>i</sub>(baseline) / w<sub>i</sub>(agent)</div> <p class="svelte-s2t5c8">A value &gt; 1 indicates improvement. Failed correctness tests reset
					speedup to 1. The overall speedup is the geometric mean across all
					workloads.</p></div> <div class="metric-def svelte-s2t5c8"><h2 class="svelte-s2t5c8">Advantage</h2> <p class="svelte-s2t5c8">Measures agent performance relative to human experts:</p> <div class="formula svelte-s2t5c8">Adv = S<sub>agent</sub> − S<sub>expert</sub></div> <p class="svelte-s2t5c8">Positive advantage means the agent outperformed the human. If the
					agent memorized the expert solution, advantage is exactly zero—making
					data leakage detectable.</p></div> <div class="metric-def svelte-s2t5c8"><h2 class="svelte-s2t5c8">Stratified Advantage</h2> <p class="svelte-s2t5c8">Advantage computed within groups at each code hierarchy level ℓ, then
					averaged across groups:</p> <div class="formula svelte-s2t5c8">Adv<sup>(ℓ)</sup> = (1/|G<sup>ℓ</sup>|) Σ Adv<sub>g</sub></div> <p class="svelte-s2t5c8">This captures whether improvements are spread evenly or concentrated
					in specific subsystems.</p></div> <div class="metric-def svelte-s2t5c8"><h2 class="svelte-s2t5c8">Normalized Advantage</h2> <p class="svelte-s2t5c8">Signal-to-noise ratio of the advantage, penalizing erratic performance
					across workloads:</p> <div class="formula svelte-s2t5c8">Ã = Adv / √(σ²<sub>agent</sub> + σ²<sub>expert</sub>)</div> <p class="svelte-s2t5c8">Rewards agents that deliver steady improvements across many workloads
					rather than volatile, concentrated gains.</p></div> <div class="metric-def svelte-s2t5c8"><h2 class="svelte-s2t5c8">Cost-Weighted Advantage</h2> <p class="svelte-s2t5c8">Advantage divided by total inference cost (input + output tokens ×
					per-token price):</p> <div class="formula svelte-s2t5c8">Cost(Adv) = Adv / C<sub>agent</sub></div> <p class="svelte-s2t5c8">Captures the human-relative improvement obtained per unit of inference
					budget.</p></div></article> <article id="submitting" class="doc-section svelte-s2t5c8"><h1 class="svelte-s2t5c8">Submitting Results</h1> <p class="svelte-s2t5c8">After running your evaluation, you can submit results to be included on
				the <a href="/leaderboard/" class="svelte-s2t5c8">public leaderboard</a>:</p> <ol class="steps-list svelte-s2t5c8"><li class="svelte-s2t5c8"><strong class="svelte-s2t5c8">Run the full evaluation</strong> on the FormulaCode dataset with
					your agent configuration.</li> <li class="svelte-s2t5c8"><strong class="svelte-s2t5c8">Export results</strong> using the built-in export command:
					<div class="code-block svelte-s2t5c8" style="margin-top: 0.5rem;"><pre class="svelte-s2t5c8"><code class="svelte-s2t5c8">harbor export --format json --output results.json</code></pre></div></li> <li class="svelte-s2t5c8"><strong class="svelte-s2t5c8">Create a pull request</strong> to the
					<a href="https://github.com/formula-code/formula-code.github.io" target="_blank" rel="noopener" class="svelte-s2t5c8">FormulaCode repository</a> with your results file. Include your agent name, model, and any relevant
					configuration details.</li> <li class="svelte-s2t5c8"><strong class="svelte-s2t5c8">We&#39;ll review and publish</strong> your results on the leaderboard
					within one update cycle (monthly).</li></ol> <div class="info-box svelte-s2t5c8"><strong class="svelte-s2t5c8">Questions?</strong> Open an issue on
				<a href="https://github.com/formula-code/" target="_blank" rel="noopener" class="svelte-s2t5c8">GitHub</a>
				or reach out to the authors listed on the <a href="/" class="svelte-s2t5c8">overview page</a>.</div></article>`,
		w = B(i[1]),
		r = [];
	for (let o = 0; o < w.length; o += 1) r[o] = O(G(i, w, o));
	return {
		c() {
			((e = b("section")),
				(t = b("aside")),
				(a = b("div")),
				(c = b("h3")),
				(c.textContent = s),
				(v = S()),
				(d = b("nav")),
				(u = b("ul")));
			for (let o = 0; o < r.length; o += 1) r[o].c();
			((h = S()), (n = b("main")), (n.innerHTML = A), this.h());
		},
		l(o) {
			e = f(o, "SECTION", { class: !0 });
			var g = _(e);
			t = f(g, "ASIDE", { class: !0 });
			var l = _(t);
			a = f(l, "DIV", { class: !0 });
			var y = _(a);
			((c = f(y, "H3", { class: !0, "data-svelte-h": !0 })),
				I(c) !== "svelte-1lrhy0k" && (c.textContent = s),
				(v = C(y)),
				(d = f(y, "NAV", {})));
			var L = _(d);
			u = f(L, "UL", { class: !0 });
			var M = _(u);
			for (let x = 0; x < r.length; x += 1) r[x].l(M);
			(M.forEach(p),
				L.forEach(p),
				y.forEach(p),
				l.forEach(p),
				(h = C(g)),
				(n = f(g, "MAIN", { class: !0, "data-svelte-h": !0 })),
				I(n) !== "svelte-sln6zs" && (n.innerHTML = A),
				g.forEach(p),
				this.h());
		},
		h() {
			(k(c, "class", "sidebar-title svelte-s2t5c8"),
				k(u, "class", "svelte-s2t5c8"),
				k(a, "class", "sidebar-inner svelte-s2t5c8"),
				k(t, "class", "sidebar svelte-s2t5c8"),
				k(n, "class", "docs-content svelte-s2t5c8"),
				k(e, "class", "docs-page svelte-s2t5c8"));
		},
		m(o, g) {
			(E(o, e, g), m(e, t), m(t, a), m(a, c), m(a, v), m(a, d), m(d, u));
			for (let l = 0; l < r.length; l += 1) r[l] && r[l].m(u, null);
			(m(e, h), m(e, n));
		},
		p(o, [g]) {
			if (g & 7) {
				w = B(o[1]);
				let l;
				for (l = 0; l < w.length; l += 1) {
					const y = G(o, w, l);
					r[l] ? r[l].p(y, g) : ((r[l] = O(y)), r[l].c(), r[l].m(u, null));
				}
				for (; l < r.length; l += 1) r[l].d(1);
				r.length = w.length;
			}
		},
		i: $,
		o: $,
		d(o) {
			(o && p(e), V(r, o));
		}
	};
}
function X(i, e, t) {
	let a = "motivation";
	const c = [
		{ id: "motivation", label: "Motivation" },
		{ id: "installation", label: "Installation" },
		{ id: "running", label: "Running an Evaluation" },
		{ id: "structure", label: "Benchmark Structure" },
		{ id: "metrics", label: "Metrics Reference" },
		{ id: "submitting", label: "Submitting Results" }
	];
	function s(d) {
		t(0, (a = d));
		const u = document.getElementById(d);
		u && u.scrollIntoView({ behavior: "smooth", block: "start" });
	}
	return [a, c, s, (d) => s(d.id)];
}
class Y extends N {
	constructor(e) {
		(super(), W(this, e, X, K, q, {}));
	}
}
function Z(i) {
	let e, t, a, c;
	return (
		(e = new J({
			props: { title: ee, description: se, url: te, keywords: ae }
		})),
		(a = new Y({})),
		{
			c() {
				(H(e.$$.fragment), (t = S()), H(a.$$.fragment));
			},
			l(s) {
				(D(e.$$.fragment, s), (t = C(s)), D(a.$$.fragment, s));
			},
			m(s, v) {
				(z(e, s, v), E(s, t, v), z(a, s, v), (c = !0));
			},
			p: $,
			i(s) {
				c || (P(e.$$.fragment, s), P(a.$$.fragment, s), (c = !0));
			},
			o(s) {
				(F(e.$$.fragment, s), F(a.$$.fragment, s), (c = !1));
			},
			d(s) {
				(s && p(t), T(e, s), T(a, s));
			}
		}
	);
}
const ee = "Getting Started — FormulaCode",
	se =
		"Learn how to install, run, and submit results to the FormulaCode benchmark.",
	te = "https://formula-code.github.io/docs",
	ae = "FormulaCode, documentation, getting started, benchmark, installation";
class re extends N {
	constructor(e) {
		(super(), W(this, e, null, Z, q, {}));
	}
}
export { re as component };
