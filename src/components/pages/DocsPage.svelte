<script>
	import PaperHeader from "$components/layout/PaperHeader.svelte";
</script>

<div class="docs-page">
	<div class="container">
		<aside class="sidebar">
			<nav>
				<ul>
					<li><a href="#motivation">Motivation</a></li>
					<li><a href="#installation">Installation</a></li>
					<li><a href="#running-evaluation">Running an Evaluation</a></li>
					<li><a href="#benchmark-structure">Benchmark Structure</a></li>
					<li><a href="#metrics">Metrics Reference</a></li>
					<li><a href="#submitting">Submitting Results</a></li>
				</ul>
			</nav>
		</aside>

		<main class="content">
			<section id="motivation">
				<h1>Getting Started with FormulaCode</h1>
				<p>
					FormulaCode is a benchmark for evaluating agentic optimization on
					large codebases. It is designed to measure the ability of agents to
					diagnose bottlenecks and improve performance in real-world software
					ecosystems.
				</p>
			</section>

			<section id="installation">
				<h2>Installation</h2>
				<p>
					FormulaCode relies on the <code>harbor</code> CLI tool for managing environments
					and running evaluations.
				</p>
				<pre><code>pip install harbor-cli</code></pre>
				<p>
					For full installation details, please refer to the <a
						href="https://github.com/formula-code/terminal-bench/"
						>GitHub repository</a
					>.
				</p>
			</section>

			<section id="running-evaluation">
				<h2>Running an Evaluation</h2>
				<p>
					To run an evaluation on the FormulaCode dataset, use the <code
						>harbor run</code
					> command.
				</p>
				<pre><code>harbor run -d formulacode@0.1.0.post20251025 -a oracle</code
					></pre>
				<p>
					This command runs the Expert Human agent on the specified version of
					the FormulaCode dataset.
				</p>
			</section>

			<section id="benchmark-structure">
				<h2>Benchmark Structure</h2>
				<p>Each task in FormulaCode consists of:</p>
				<ul>
					<li>
						<strong>Baseline Repository:</strong> The original code with performance
						issues.
					</li>
					<li>
						<strong>Performance Workloads:</strong> Expert-written benchmarks
						(using <code>asv</code>) to measure performance.
					</li>
					<li>
						<strong>Correctness Tests:</strong> Unit tests and snapshot tests to
						ensure validity.
					</li>
					<li>
						<strong>Expert Patch:</strong> Human-written solution for comparison.
					</li>
				</ul>
			</section>

			<section id="metrics">
				<h2>Metrics Reference</h2>
				<h3>Speedup</h3>
				<p>
					The geometric mean of the performance ratio (baseline / agent) across
					all workloads.
				</p>

				<h3>Advantage</h3>
				<p>
					Agent Speedup - Expert Speedup. Positive values indicate the agent
					outperformed the expert.
				</p>

				<h3>Normalized Advantage</h3>
				<p>
					Advantage normalized by the variance of speedups, rewarding
					consistency.
				</p>
			</section>

			<section id="submitting">
				<h2>Submitting Results</h2>
				<p>
					To submit your results to the leaderboard, please open a Pull Request
					on the <a
						href="https://github.com/formula-code/formula-code.github.io"
						>website repository</a
					> with your results file.
				</p>
			</section>
		</main>
	</div>
</div>

<style>
	.docs-page {
		min-height: 100vh;
		background-color: var(--bg-primary);
		color: var(--text-primary);
		padding-top: 2rem;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 250px 1fr;
		gap: 3rem;
		padding: 2rem;
	}

	.sidebar {
		position: sticky;
		top: 6rem;
		height: fit-content;
		padding-right: 2rem;
		border-right: 1px solid var(--border-secondary);
	}

	.sidebar ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.sidebar li {
		margin-bottom: 1rem;
	}

	.sidebar a {
		color: var(--text-secondary);
		text-decoration: none;
		font-family: var(--sans);
		font-weight: 500;
		transition: color 0.2s;
	}

	.sidebar a:hover {
		color: var(--accent-secondary);
	}

	.content {
		max-width: 800px;
	}

	section {
		margin-bottom: 4rem;
		scroll-margin-top: 6rem;
	}

	h1 {
		font-family: var(--serif);
		font-size: 3rem;
		margin-bottom: 2rem;
		color: var(--text-primary);
	}

	h2 {
		font-family: var(--serif);
		font-size: 2rem;
		margin-bottom: 1.5rem;
		color: var(--accent-secondary);
		border-bottom: 1px solid var(--border-secondary);
		padding-bottom: 0.5rem;
	}

	h3 {
		font-family: var(--sans);
		font-size: 1.25rem;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
		color: var(--text-primary);
	}

	p {
		font-family: var(--sans);
		font-size: 1.1rem;
		line-height: 1.7;
		line-height: 1.7;
		margin-bottom: 1rem;
		color: var(--text-primary);
	}

	ul {
		font-family: var(--sans);
		font-size: 1.1rem;
		font-size: 1.1rem;
		line-height: 1.7;
		color: var(--text-primary);
		margin-bottom: 1rem;
		padding-left: 1.5rem;
	}

	li {
		margin-bottom: 0.5rem;
	}

	pre {
		background: var(--bg-tertiary);
		padding: 1.5rem;
		border-radius: 8px;
		overflow-x: auto;
		border: 1px solid var(--border-secondary);
		margin: 1.5rem 0;
	}

	code {
		font-family: var(--mono);
		color: var(--accent-secondary);
		font-size: 0.95rem;
	}

	a {
		color: var(--link-color);
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		.container {
			grid-template-columns: 1fr;
		}

		.sidebar {
			position: static;
			border-right: none;
			border-bottom: 1px solid var(--border-secondary);
			padding-bottom: 2rem;
			padding-right: 0;
		}
	}
</style>
