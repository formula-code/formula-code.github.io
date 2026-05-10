<script>
	const repos = [
		{
			path: "formula-code/fc-eval",
			name: "fc-eval",
			tagline: "Evaluation harness",
			description:
				"Run frontier LLM agents against the FormulaCode benchmark. Spins up reproducible Docker environments, replays the unit-test suite, and computes per-workload speedup, advantage, and stratified scores. Bring your own Terminus or OpenHands agent — `fceval run -d formulacode -a <your-agent>` is all it takes.",
			docsUrl: "/docs/eval/",
			repoUrl: "https://github.com/formula-code/fc-eval",
			image: "/assets/og/fc-eval.png",
			imageAlt: "fc-eval repository preview"
		},
		{
			path: "formula-code/datasmith",
			name: "datasmith",
			tagline: "Data curation pipeline",
			description:
				"The four-stage pipeline that mines FormulaCode's tasks from real GitHub repositories: scraping high-quality performance PRs, attribute-filtering them with LLM judges, synthesising reproducible build environments, and running the statistical-significance tests that admit a candidate into the benchmark.",
			docsUrl: "/docs/data/",
			repoUrl: "https://github.com/formula-code/datasmith",
			image: "/assets/og/datasmith.png",
			imageAlt: "datasmith repository preview"
		}
	];

	const liveEndpoints = [
		{
			host: "api.formulacode.org",
			label: "REST API",
			description:
				"Read-only Supabase REST. Tables: <code>repositories</code>, <code>pull_requests</code>, <code>candidate_containers</code>, <code>harbor_runs</code>. Anonymous key required (see fc-eval docs).",
			href: "https://api.formulacode.org/"
		},
		{
			host: "data.formulacode.org",
			label: "Data dashboard",
			description:
				"Browseable Supabase Studio with the live task and run tables. Useful for ad-hoc inspection and SQL.",
			href: "https://data.formulacode.org/"
		}
	];
</script>

<div class="docs-page">
	<header class="page-head">
		<div class="container">
			<div class="head-mark">
				<img
					class="mark-glyph"
					src="/assets/images/formula-code-icon.svg"
					alt=""
					width="44"
					height="44"
				/>
				<span class="mark-label">Documentation</span>
			</div>
			<h1 class="page-title">Build, evaluate, and explore FormulaCode</h1>
			<p class="page-desc">
				Three open-source repositories power the benchmark. Pick the docs you
				need — run agents against the benchmark, see how tasks are mined, or
				query the live data behind the leaderboard.
			</p>
		</div>
	</header>

	<main class="container">
		<section class="repos-grid">
			{#each repos as r}
				<article class="repo-card">
					<a
						class="card-link"
						href={r.docsUrl}
						aria-label="Open {r.name} documentation"
					>
						<div class="card-header">
							<span class="repo-path">{r.path}</span>
							<span class="repo-tagline">{r.tagline}</span>
						</div>
						<div class="card-image">
							<img src={r.image} alt={r.imageAlt} loading="lazy" />
						</div>
						<div class="card-body">
							<h2 class="repo-name">{r.name}</h2>
							<p class="repo-description">{r.description}</p>
						</div>
					</a>
					<div class="card-footer">
						<a class="action" href={r.docsUrl}>
							<span class="action-text">Open documentation</span>
							<span class="action-arrow">→</span>
						</a>
						<a
							class="repo-link"
							href={r.repoUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							View on GitHub ↗
						</a>
					</div>
				</article>
			{/each}
		</section>

		<section class="endpoints">
			<div class="endpoints-head">
				<h2 class="section-title">Live data endpoints</h2>
				<p class="section-subtitle">
					Two subdomains expose the live task and run database. <strong>Uptime
					is not guaranteed</strong> — these are research endpoints, sometimes
					rebuilt mid-week. For reproducible evaluation, prefer the static
					CSV that ships with this site.
				</p>
			</div>

			<ul class="endpoints-list">
				{#each liveEndpoints as e}
					<li class="endpoint">
						<a class="endpoint-host" href={e.href} target="_blank" rel="noopener noreferrer">
							{e.host} ↗
						</a>
						<span class="endpoint-label">{e.label}</span>
						<p class="endpoint-desc">{@html e.description}</p>
					</li>
				{/each}
			</ul>
		</section>
	</main>
</div>

<style>
	.docs-page {
		min-height: 100vh;
		background: var(--bg-primary);
		color: var(--text-primary);
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.page-head {
		padding: var(--space-2xl) 0 var(--space-lg);
		border-bottom: 1px solid var(--border-primary);
		text-align: center;
	}

	.head-mark {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		margin-bottom: var(--space-sm);
	}

	.mark-glyph {
		display: inline-block;
		width: 44px;
		height: 44px;
		object-fit: contain;
	}

	.mark-label {
		font-family: var(--sans);
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}

	.page-title {
		font-family: var(--sans);
		font-size: clamp(2rem, 4.5vw, 3rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0 0 var(--space-sm);
	}

	.page-desc {
		font-family: var(--sans);
		font-size: 1.05rem;
		line-height: 1.65;
		color: var(--text-muted);
		max-width: 60ch;
		margin: 0 auto;
	}

	main.container {
		padding-top: var(--space-2xl);
		padding-bottom: var(--space-2xl);
	}

	/* ── Repo cards ── */
	.repos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
		gap: var(--space-lg);
		margin-bottom: var(--space-2xl);
	}

	.repo-card {
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow);
		transition:
			border-color 160ms,
			box-shadow 160ms,
			transform 160ms;
	}

	.repo-card:hover {
		border-color: var(--brand-red);
		box-shadow: var(--shadow-lg);
		transform: translateY(-3px);
	}

	.card-link {
		display: block;
		text-decoration: none;
		color: inherit;
	}

	.card-link:hover {
		text-decoration: none;
		color: inherit;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--space-sm);
		padding: var(--space-md) var(--space-lg) 0;
		flex-wrap: wrap;
	}

	.repo-path {
		font-family: var(--mono);
		font-size: 0.78rem;
		color: var(--text-muted);
	}

	.repo-tagline {
		font-family: var(--sans);
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--brand-red);
	}

	.card-image {
		padding: var(--space-md) var(--space-lg);
	}

	.card-image img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: var(--radius);
		border: 1px solid var(--border-primary);
		background: var(--bg-secondary);
	}

	.card-body {
		padding: 0 var(--space-lg) var(--space-md);
	}

	.repo-name {
		font-family: var(--mono);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 var(--space-sm);
		letter-spacing: -0.01em;
	}

	.repo-description {
		font-family: var(--sans);
		font-size: 0.93rem;
		line-height: 1.65;
		color: var(--text-muted);
		margin: 0;
	}

	.repo-description :global(code) {
		font-family: var(--mono);
		font-size: 0.85em;
		padding: 1px 5px;
		background: var(--bg-secondary);
		border-radius: 3px;
		color: var(--text-primary);
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--border-primary);
		background: var(--bg-secondary);
		gap: var(--space-md);
		flex-wrap: wrap;
	}

	.action {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--sans);
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--brand-red);
		text-decoration: none;
	}

	.action:hover {
		text-decoration: none;
	}

	.action-arrow {
		transition: transform 160ms;
	}

	.repo-card:hover .action-arrow {
		transform: translateX(4px);
	}

	.repo-link {
		font-family: var(--sans);
		font-size: 0.85rem;
		color: var(--text-muted);
		text-decoration: none;
		border-bottom: 1px dashed var(--border-secondary);
	}

	.repo-link:hover {
		color: var(--text-primary);
		border-bottom-color: var(--text-primary);
		text-decoration: none;
	}

	/* ── Endpoints ── */
	.endpoints {
		padding: var(--space-xl) 0 0;
		border-top: 1px solid var(--border-primary);
	}

	.endpoints-head {
		margin-bottom: var(--space-md);
	}

	.section-subtitle {
		max-width: 70ch;
		margin-top: 6px;
	}

	.section-subtitle :global(strong) {
		color: var(--text-primary);
		font-weight: 600;
	}

	.endpoints-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: var(--space-md);
	}

	.endpoint {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		padding: var(--space-md) var(--space-lg);
	}

	.endpoint-host {
		display: inline-block;
		font-family: var(--mono);
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		text-decoration: none;
		margin-bottom: 2px;
	}

	.endpoint-host:hover {
		color: var(--brand-red);
		text-decoration: none;
	}

	.endpoint-label {
		display: block;
		font-family: var(--sans);
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin-bottom: var(--space-sm);
	}

	.endpoint-desc {
		font-family: var(--sans);
		font-size: 0.88rem;
		line-height: 1.6;
		color: var(--text-secondary);
		margin: 0;
	}

	.endpoint-desc :global(code) {
		font-family: var(--mono);
		font-size: 0.85em;
		padding: 1px 5px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: 3px;
	}
</style>
