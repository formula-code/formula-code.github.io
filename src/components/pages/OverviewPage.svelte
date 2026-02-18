<script>
	import OverviewHeader from "$components/layout/OverviewHeader.svelte";
	import Icon from "$components/helpers/Icon.svelte";
	import SortableTable from "$components/helpers/SortableTable.svelte";
	import { getContext } from "svelte";

	export let leaderboardData = { global: [] };

	const copy = getContext("copy");
	const paperFooter = copy.paperFooter || {};

	const compactColumns = [
		{ key: "agent", label: "Agent", numeric: false },
		{ key: "model", label: "Model", numeric: false },
		{ key: "rank", label: "RP Rank", numeric: true, decimals: 0 },
		{
			key: "advantage",
			label: "Adv",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		},
		{
			key: "speedup",
			label: "Speedup",
			numeric: true,
			colorCode: true,
			colorThreshold: 1.0,
			suffix: "x"
		}
	];
</script>

<div class="overview-page">
	<OverviewHeader />

	<section class="section" id="introduction">
		<div class="container">
			<h2>Introduction</h2>
			<p>
				Large Language Models (LLMs) for code are rapidly evolving from isolated
				function-level synthesis to file-level editing, and now, to
				repository-level optimization. FormulaCode is a benchmark for evaluating
				agentic optimization on large codebases, constructed from 961 real-world
				performance bottlenecks mined from 70 scientific open-source Python
				repositories including Pandas, Scikit-Learn, and SciPy. Each task is
				paired with ~1,532 community-maintained performance workloads alongside
				expert-authored patches.
			</p>
		</div>
	</section>

	<section class="section bg-light" id="benchmark-design">
		<div class="container">
			<h2>Benchmark Design</h2>
			<p>
				Each FormulaCode task evaluates the ability of an agent to optimize a
				real-world codebase under strict correctness constraints. A task begins
				with a baseline repository, which represents the unmodified
				implementation. The agent operates on the baseline and produces a
				modified version of the repository by making arbitrary repository-level
				edits.
			</p>
			<p>
				Performance evaluation proceeds by executing the full set of workloads
				on both the baseline and the agent-modified code and comparing their
				measured outcomes. Improving performance on one workload may degrade
				performance on others. As a result, optimization in FormulaCode is
				inherently multi-objective: agents must reason about trade-offs across
				subsystems and deliver improvements that are broad and consistent rather
				than localized to a single execution path.
			</p>
		</div>
	</section>

	<section class="section" id="dataset-construction">
		<div class="container">
			<h2>Dataset Construction</h2>
			<p>
				FormulaCode consists of multi-workload real-world code optimization
				problems from 70 repositories. We developed an automated four-stage
				pipeline that extracts these problems:
			</p>
			<div class="pipeline-steps">
				<div class="step">
					<h3>1. Repository Scraping</h3>
					<p>
						We crawl GitHub repositories with high-quality expert-defined
						performance workloads.
					</p>
				</div>
				<div class="step">
					<h3>2. Attribute Filtering</h3>
					<p>
						We filter out candidate pull requests where the primary intent was
						not performance related, using rule-based and LLM-based filters.
					</p>
				</div>
				<div class="step">
					<h3>3. Environment Synthesis</h3>
					<p>
						We synthesize environment building scripts using a reflexive LLM
						agent so that terminal interface tools function correctly.
					</p>
				</div>
				<div class="step">
					<h3>4. Statistical Validation</h3>
					<p>
						We filter all candidate PRs that do not show statistically
						significant improvement in performance workloads.
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class="section bg-light" id="key-findings">
		<div class="container">
			<h2>Key Findings</h2>
			<div class="findings-grid">
				<div class="finding-card">
					<h3>Agents Improve Runtime but Underperform Experts</h3>
					<p>
						Agents generally can improve run-time performance, but perform worse
						than human experts.
					</p>
				</div>
				<div class="finding-card">
					<h3>Local vs. Global Optimization</h3>
					<p>
						Agents are better at local or function-level optimization, rather
						than repository-level optimization.
					</p>
				</div>
				<div class="finding-card">
					<h3>Optimization Strategy Strengths</h3>
					<p>
						Agents excel at using specific optimization strategies (e.g.,
						parallelizing or batching) and struggle with others (e.g.,
						vectorized operations).
					</p>
				</div>
				<div class="finding-card">
					<h3>Long-Tail Repository Performance</h3>
					<p>
						Agent performance relative to experts can vary dramatically by
						popularity of the repository, performing worst on the 4th quintile
						and best on the 2nd quintile.
					</p>
				</div>
				<div class="finding-card">
					<h3>Cost Efficiency</h3>
					<p>
						Despite being more expensive per call, agents using frontier LLMs
						are overall more cost effective than those using open weights
						models.
					</p>
				</div>
				<div class="finding-card">
					<h3>Multi-Workload Tradeoffs</h3>
					<p>
						Compared to human experts, agents make less favorable
						performance–cost trade-off decisions.
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class="section" id="leaderboard">
		<div class="container">
			<h2>Compact Leaderboard</h2>
			<SortableTable
				columns={compactColumns}
				rows={leaderboardData.global}
				initialSortKey="rank"
				initialSortOrder="asc"
			/>
			<div class="leaderboard-link">
				<a href="/leaderboard/" class="button">View Full Leaderboard &rarr;</a>
			</div>
		</div>
	</section>

	<section class="section bg-light" id="submitting">
		<div class="container">
			<h2>Submitting Custom Models</h2>
			<p>
				To evaluate an agent on FormulaCode, follow the <a
					href="https://formula-code.github.io/terminal-bench"
					>Installation instructions</a
				> and run:
			</p>
			<pre><code>harbor run -d formulacode@0.1.0.post20251025 -a oracle</code
				></pre>
		</div>
	</section>

	{#if paperFooter.citation && paperFooter.citation.show === "true"}
		<section class="section" id="bibtex">
			<div class="container">
				<h2>{paperFooter.citation.title}</h2>
				<pre><code>{paperFooter.citation.bibtex}</code></pre>
			</div>
		</section>
	{/if}
</div>

<style>
	.section {
		padding: 4rem 1rem;
		border-bottom: 1px solid var(--border-secondary);
	}

	.bg-light {
		background-color: var(--bg-secondary);
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
	}

	h2 {
		font-family: var(--serif);
		font-size: 2.5rem;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	h3 {
		font-family: var(--sans);
		font-size: 1.5rem;
		margin-bottom: 1rem;
		color: var(--accent-secondary);
	}

	p {
		font-family: var(--sans);
		font-size: 1.125rem;
		line-height: 1.7;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	/* Pipeline Steps */
	.pipeline-steps {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}

	.step {
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-secondary);
	}

	.step h3 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.step p {
		font-size: 1rem;
		margin-bottom: 0;
	}

	/* Findings Grid */
	.findings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.finding-card {
		background: var(--bg-secondary);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-secondary);
	}

	.finding-card h3 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.finding-card p {
		font-size: 1rem;
		margin-bottom: 0;
	}

	/* Leaderboard link */

	.leaderboard-link {
		text-align: center;
	}

	.button {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: var(--accent-primary);
		color: white;
		text-decoration: none;
		border-radius: 4px;
		font-family: var(--sans);
		font-weight: 600;
		transition: background 0.2s;
	}

	.button:hover {
		background: var(--wine-dark-red);
	}

	/* Code Blocks */
	pre {
		background: var(--bg-tertiary);
		padding: 1.5rem;
		border-radius: 8px;
		overflow-x: auto;
		border: 1px solid var(--border-secondary);
	}

	code {
		font-family: var(--mono);
		color: var(--text-primary);
		font-size: 0.9rem;
	}
</style>
