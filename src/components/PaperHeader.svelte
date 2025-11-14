<script>
	import { getContext } from "svelte";
	import Icon from "$components/helpers/Icon.svelte";

	const copy = getContext("copy") || {};
	const headerCopy = copy.paperHeader || {};

	const defaultTitle = "FormulaCode: Benchmarking Agent-Driven Code Optimization";

	const defaultAuthors = [
		{ name: "Author Name2", url: "https://example.com/author1", superscript: "1,*" },
		{ name: "Author Name", url: "https://example.com/author2", superscript: "1,*" },
		{ name: "Author Name", url: "https://example.com/author3", superscript: "2" },
		{ name: "Author Name", url: "https://example.com/author4", superscript: "3" }
	];

	const defaultAffiliations = [
		{ superscript: "1", label: "University Name" },
		{ superscript: "2", label: "Research Institution" },
		{ superscript: "3", label: "Company Name" }
	];

	const defaultActions = [
		{ label: "Paper", icon: "file-text", href: "https://arxiv.org/abs/placeholder" },
		{ label: "Code", icon: "github", href: "https://github.com/username/repo" }
	];

	const defaultAbstractParagraphs = [
		"We introduce FormulaCode, a comprehensive benchmark for evaluating AI agents on real-world code optimization tasks. Our benchmark comprises 961 performance-improving tasks with over 1.4 million performance workloads, derived from 110+ GitHub repositories with crowdsourced performance improvements. We evaluate frontier language models including GPT-5 and Claude Sonnet 4.0 on their ability to produce holistic code optimizations that consistently improve performance across multiple workloads.",
		"Our findings reveal that while AI agents can produce impressive isolated optimizations, they struggle to maintain consistent aggregate advantages over human experts when evaluated across complete modules. We introduce a novel advantage metric that captures the holistic optimization capabilities of agents by measuring their performance relative to human baselines across grouped workloads."
	];

	const title = headerCopy.title ?? defaultTitle;

	const authors =
		Array.isArray(headerCopy.authors) && headerCopy.authors.length > 0
			? headerCopy.authors
			: defaultAuthors;

	const affiliations =
		Array.isArray(headerCopy.affiliations) && headerCopy.affiliations.length > 0
			? headerCopy.affiliations
			: defaultAffiliations;

	const equalContributionNote = headerCopy.equalContributionNote ?? "* Equal Contribution";

	const actions =
		Array.isArray(headerCopy.actions) && headerCopy.actions.length > 0 ? headerCopy.actions : defaultActions;

	const abstractConfig = headerCopy.abstract || {};
	const abstractTitle = abstractConfig.title ?? "Abstract";
	const abstractParagraphs =
		Array.isArray(abstractConfig.paragraphs) && abstractConfig.paragraphs.length > 0
			? abstractConfig.paragraphs
			: defaultAbstractParagraphs;

	// Hardcoded leaderboard data matching main Leaderboard.svelte structure
	const leaderboardTitle = "Leaderboard Snapshot";
	const leaderboardDescription = "This leaderboard displays the agent advantage scores by aggregation level. Higher scores indicate better performance relative to the oracle.";

	// Level display labels - matching main Leaderboard
	const LEVEL_DISPLAY_LABELS = {
		"no-aggregation": "L0: No Aggregation",
		"param-level": "L1: Parameter",
		"func-level": "L2: Function",
		"class-level": "L3: Class",
		"module-level": "L4: Module",
	};

	// Hardcoded levels in order
	const levels = ["param-level", "func-level", "class-level", "module-level"];

	// Hardcoded table data - example data, replace with actual values
	const tableData = [
		{
			displayName: "GPT-5",
			levels: {
				"param-level": 0.15,
				"func-level": 0.12,
				"class-level": 0.08,
				"module-level": 0.05,
			},
			overall: 0.10
		},
		{
			displayName: "Claude Sonnet 4.0",
			levels: {
				"param-level": 0.13,
				"func-level": 0.10,
				"class-level": 0.06,
				"module-level": 0.03,
			},
			overall: 0.08
		},
		{
			displayName: "Oracle (Human)",
			levels: {
				"param-level": 0.25,
				"func-level": 0.22,
				"class-level": 0.18,
				"module-level": 0.15,
			},
			overall: 0.20
		}
	];

	const hero = headerCopy.hero || {};

	// Helper functions matching main Leaderboard.svelte
	function formatAdvantage(value) {
		if (value === null || value === undefined) return "—";
		return value.toFixed(4);
	}

	function getCellClass(value) {
		if (value === null || value === undefined) return "";
		if (value >= 0.1) return "high";
		if (value >= 0) return "medium";
		return "low";
	}
</script>

<section class="paper-header">
	<div class="container">
		<!-- Paper Title -->
		<h1 class="paper-title">
			{title}
		</h1>

		<!-- Authors -->
		{#if authors.length}
			<div class="authors">
				{#each authors as author, index}
					<span class="author-block">
						{#if author.url}
							<a href={author.url} rel="noopener noreferrer" target="_blank">{author.name}</a>
						{:else}
							{author.name}
						{/if}
						{#if author.superscript}
							<sup>{author.superscript}</sup>
						{/if}
						{#if index < authors.length - 1}, {/if}
					</span>
				{/each}
			</div>
		{/if}

		<!-- Affiliations -->
		{#if affiliations.length}
			<div class="affiliations">
				{#each affiliations as affiliation, index}
					<span class="affiliation-block">
						{#if affiliation.superscript}<sup>{affiliation.superscript}</sup>{/if}{affiliation.label}{#if index < affiliations.length - 1}, {/if}
					</span>
				{/each}
				{#if equalContributionNote}
					<br />
					<span class="affiliation-block">{equalContributionNote}</span>
				{/if}
			</div>
		{/if}

		<!-- Action Buttons -->
		{#if actions.length}
			<div class="action-buttons">
				{#each actions as action}
					<a href={action.href} class="button" target="_blank" rel="noopener noreferrer">
						<span class="button-icon">
							<Icon name={action.icon} size="20px" strokeWidth={2} />
						</span>
						<span>{action.label}</span>
					</a>
				{/each}
			</div>
		{/if}

		<!-- Abstract -->
		<div class="abstract-section">
			<h2 class="abstract-title">{abstractTitle}</h2>
			<div class="abstract-content">
				{#each abstractParagraphs as paragraph}
					<p>{@html paragraph}</p>
				{/each}
			</div>
		</div>

		{#if tableData.length}
			<div class="header-leaderboard">
				<div class="leaderboard-header">
					<h3>{leaderboardTitle}</h3>
					<p class="description">{leaderboardDescription}</p>
				</div>
				<div class="table-wrapper">
					<table>
						<thead>
							<tr>
								<th class="agent-col">Agent</th>
								{#each levels as level}
									<th class="level-col">{LEVEL_DISPLAY_LABELS[level] || level}</th>
								{/each}
								<th class="overall-col">Overall</th>
							</tr>
						</thead>
						<tbody>
							{#each tableData as row}
								<tr>
									<td class="agent-name">{row.displayName}</td>
									{#each levels as level}
										<td class="score-cell {getCellClass(row.levels[level])}">
											{formatAdvantage(row.levels[level])}
										</td>
									{/each}
									<td class="score-cell overall-cell {getCellClass(row.overall)}">
										{formatAdvantage(row.overall)}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		{#if hero?.title}
			<div class="paper-hero">
				{#if hero.eyebrow}<p class="hero-eyebrow">{hero.eyebrow}</p>{/if}
				<h3>{hero.title}</h3>
				{#if hero.body}<p class="hero-body">{hero.body}</p>{/if}
				{#if hero.cta?.label}
					<a class="hero-cta" href={hero.cta.href ?? "#"}>{hero.cta.label}</a>
				{/if}
			</div>
		{/if}
	</div>
</section>

<style>
	.paper-header {
		background-color: var(--wine-black);
		color: var(--wine-tan);
		padding: 3rem 1rem 4rem;
		text-align: center;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
	}

	/* Title */
	.paper-title {
		font-family: var(--serif);
		font-size: var(--40px);
		font-weight: 700;
		line-height: 1.2;
		margin: 0 0 2rem;
		color: var(--wine-tan);
	}

	/* Authors */
	.authors {
		font-family: var(--sans);
		font-size: var(--18px);
		line-height: 1.6;
		margin: 0 0 1rem;
		color: var(--wine-tan);
	}

	.author-block {
		display: inline-block;
		margin: 0 0.25rem;
	}

	.author-block a {
		color: var(--wine-gold);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.author-block a:hover {
		color: var(--wine-dark-gold);
		text-decoration: underline;
	}

	.author-block sup {
		margin-left: 0.1rem;
	}

	/* Affiliations */
	.affiliations {
		font-family: var(--sans);
		font-size: var(--14px);
		line-height: 1.6;
		margin: 0 0 2rem;
		color: var(--wine-dark-tan);
	}

	.affiliation-block {
		display: inline-block;
		margin: 0 0.35rem;
	}

	/* Action Buttons */
	.action-buttons {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin: 0 0 3rem;
		flex-wrap: wrap;
	}

	.button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background-color: var(--wine-med-gray);
		color: var(--wine-tan);
		text-decoration: none;
		border-radius: 2rem;
		font-family: var(--sans);
		font-size: var(--16px);
		font-weight: 500;
		transition: all 0.2s ease;
		border: 1px solid var(--wine-blue);
	}

	.button:hover {
		background-color: var(--wine-blue);
		border-color: var(--wine--light-blue);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.button-icon {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.button-icon :global(.icon) {
		display: flex;
		align-items: center;
	}

	.button-icon :global(svg) {
		stroke: currentColor;
	}

	/* Abstract */
	.abstract-section {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}

	.abstract-title {
		font-family: var(--sans);
		font-size: var(--24px);
		font-weight: 700;
		margin: 0 0 1.5rem;
		color: var(--wine-tan);
	}

	.abstract-content {
		font-family: var(--sans);
		font-size: var(--18px);
		line-height: 1.65;
		text-align: left;
		color: var(--wine-tan);
	}

	.abstract-content p {
		margin: 0 0 1rem;
	}

	.abstract-content p:last-child {
		margin-bottom: 0;
	}

	/* Leaderboard section - matching main Leaderboard.svelte exactly */
	.header-leaderboard {
		width: 100%;
		padding: 4rem 0;
		margin: 3rem auto 0;
	}

	.leaderboard-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.leaderboard-header h3 {
		color: var(--wine-tan);
		font-size: var(--36px);
		font-weight: 700;
		margin: 0 0 1rem 0;
	}

	.leaderboard-header .description {
		color: var(--wine-dark-tan);
		font-size: var(--16px);
		text-align: center;
		margin: 0 0 2rem 0;
		max-width: 700px;
		margin-left: auto;
		margin-right: auto;
	}

	.table-wrapper {
		overflow-x: auto;
		border-radius: 3px;
		border: 1px solid var(--wine-dark-gray);
	}

	.header-leaderboard table {
		width: 100%;
		border-collapse: collapse;
		background: rgba(24, 26, 31, 0.5);
	}

	.header-leaderboard thead {
		background: var(--wine-dark-gray);
	}

	.header-leaderboard th {
		padding: 1rem;
		text-align: left;
		font-family: var(--sans);
		font-size: var(--14px);
		font-weight: 700;
		color: var(--wine-tan);
		text-transform: uppercase;
		border-bottom: 2px solid var(--wine-dark-gray);
	}

	.header-leaderboard .level-col,
	.header-leaderboard .overall-col {
		text-align: center;
	}

	.header-leaderboard tbody tr {
		border-bottom: 1px solid var(--wine-dark-gray);
		transition: background var(--250ms);
	}

	.header-leaderboard tbody tr:hover {
		background: rgba(207, 202, 191, 0.05);
	}

	.header-leaderboard td {
		padding: 1rem;
		color: var(--wine-tan);
		font-size: var(--16px);
	}

	.header-leaderboard .agent-name {
		font-family: var(--sans);
		font-weight: 600;
		color: var(--wine-tan);
	}

	.header-leaderboard .score-cell {
		text-align: center;
		font-family: var(--mono);
		font-size: var(--14px);
	}

	.header-leaderboard .overall-cell {
		font-weight: 700;
		font-size: var(--16px);
		background: rgba(207, 202, 191, 0.05);
	}

	/* Color coding for scores - matching main Leaderboard.svelte */
	.header-leaderboard .score-cell.high {
		color: #0f9d58;
	}

	.header-leaderboard .score-cell.medium {
		color: #d8d8d8;
	}

	.header-leaderboard .score-cell.low {
		color: #e84545;
	}

	.paper-hero {
		margin: 3rem auto 0;
		padding: 2.5rem;
		border-radius: 8px;
		background: rgba(24, 26, 31, 0.5);
		border: 1px solid var(--wine-dark-gray);
		text-align: center;
	}

	.hero-eyebrow {
		font-family: var(--mono);
		font-size: var(--12px);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin: 0 0 0.75rem;
		color: var(--wine-dark-tan);
	}

	.paper-hero h3 {
		margin: 0 0 1rem;
		font-size: var(--28px);
		color: var(--wine-tan);
	}

	.hero-body {
		margin: 0 auto 1.5rem;
		max-width: 640px;
		color: var(--wine-tan);
		font-size: var(--18px);
		line-height: 1.65;
	}

	.hero-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.85rem 1.75rem;
		background: var(--wine-med-gray);
		color: var(--wine-tan);
		font-weight: 600;
		text-decoration: none;
		border-radius: 999px;
		border: 1px solid var(--wine-blue);
		transition: transform var(--200ms) ease, background var(--200ms) ease;
	}

	.hero-cta:hover {
		background: var(--wine-blue);
		transform: translateY(-2px);
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.paper-header {
			padding: 2rem 1rem 3rem;
		}

		.paper-title {
			font-size: var(--32px);
		}

		.authors {
			font-size: var(--16px);
		}

		.affiliations {
			font-size: var(--12px);
		}

		.button {
			font-size: var(--14px);
			padding: 0.65rem 1.25rem;
		}

		.abstract-title {
			font-size: var(--20px);
		}

		.abstract-content {
			font-size: var(--16px);
		}

		.header-leaderboard {
			padding: 3rem 0;
		}

		.leaderboard-header h3 {
			font-size: var(--28px);
		}

		.leaderboard-header .description {
			font-size: var(--14px);
		}

		.header-leaderboard th,
		.header-leaderboard td {
			padding: 0.75rem 0.5rem;
			font-size: var(--12px);
		}

		.header-leaderboard .agent-name {
			font-size: var(--14px);
		}

		.header-leaderboard .score-cell {
			font-size: var(--12px);
		}

		.header-leaderboard .overall-cell {
			font-size: var(--14px);
		}

		.paper-hero {
			padding: 2rem 1.25rem;
		}
	}

	@media (max-width: 480px) {
		.paper-title {
			font-size: var(--28px);
		}

		.action-buttons {
			flex-direction: column;
			align-items: center;
		}

		.button {
			width: 100%;
			max-width: 250px;
		}

		.leaderboard-header h3 {
			font-size: var(--24px);
		}

		.leaderboard-header .description {
			font-size: var(--13px);
		}

		.header-leaderboard th,
		.header-leaderboard td {
			padding: 0.5rem 0.25rem;
			font-size: var(--11px);
		}

		.header-leaderboard .agent-name {
			font-size: var(--12px);
		}

		.header-leaderboard .score-cell {
			font-size: var(--10px);
		}

		.header-leaderboard .overall-cell {
			font-size: var(--12px);
		}

		.paper-hero h3 {
			font-size: var(--22px);
		}

		.hero-body {
			font-size: var(--16px);
		}
	}
</style>
