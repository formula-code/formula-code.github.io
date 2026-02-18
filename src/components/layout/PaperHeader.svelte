<script>
	import { getContext } from "svelte";
	import Icon from "$components/helpers/Icon.svelte";
	import SortableTable from "$components/helpers/SortableTable.svelte";
	import leaderboardData from "$data/leaderboard.json";
	import { LEVEL_DISPLAY_LABELS, LEVEL_ORDER } from "$utils/constants.js";

	const copy = getContext("copy") || {};
	const headerCopy = copy.paperHeader || {};

	const defaultTitle =
		"FormulaCode: Benchmarking Agent-Driven Code Optimization";

	const defaultAuthors = [
		{
			name: "Author Name2",
			url: "https://example.com/author1",
			superscript: "1,*"
		},
		{
			name: "Author Name",
			url: "https://example.com/author2",
			superscript: "1,*"
		},
		{
			name: "Author Name",
			url: "https://example.com/author3",
			superscript: "2"
		},
		{
			name: "Author Name",
			url: "https://example.com/author4",
			superscript: "3"
		}
	];

	const defaultAffiliations = [
		{ superscript: "1", label: "University Name" },
		{ superscript: "2", label: "Research Institution" },
		{ superscript: "3", label: "Company Name" }
	];

	const defaultActions = [
		{
			label: "Paper",
			icon: "file-text",
			href: "https://arxiv.org/abs/placeholder"
		},
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

	const equalContributionNote =
		typeof headerCopy.equalContributionNote === "string"
			? headerCopy.equalContributionNote.trim()
			: "";

	const actions =
		Array.isArray(headerCopy.actions) && headerCopy.actions.length > 0
			? headerCopy.actions
			: defaultActions;

	const abstractConfig = headerCopy.abstract || {};
	const abstractTitle = abstractConfig.title ?? "Abstract";
	const abstractParagraphs =
		Array.isArray(abstractConfig.paragraphs) &&
		abstractConfig.paragraphs.length > 0
			? abstractConfig.paragraphs
			: defaultAbstractParagraphs;

	// Leaderboard data
	const leaderboardTitle = headerCopy.leaderboard.title;
	const leaderboardDescription = headerCopy.leaderboard.description;

	// Use centralized level order
	const levels = LEVEL_ORDER;

	// Build SortableTable columns from levels
	const headerTableColumns = [
		{ key: "displayName", label: "Agent", numeric: false },
		...levels.map((level) => ({
			key: level,
			label: LEVEL_DISPLAY_LABELS[level] || level,
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		})),
		{
			key: "overall",
			label: "Overall",
			numeric: true,
			colorCode: true,
			colorThreshold: 0
		}
	];

	// Flatten nested levels into flat row objects for SortableTable
	const rawTableData = Array.isArray(leaderboardData?.tableData)
		? leaderboardData.tableData
		: [];
	const headerTableRows = rawTableData.map((row) => {
		const flat = { displayName: row.displayName, overall: row.overall };
		levels.forEach((level) => {
			flat[level] = row.levels?.[level] ?? null;
		});
		return flat;
	});

	const hero = headerCopy.hero || {};
	const heroCommand =
		typeof hero.command === "string" ? hero.command.trim() : "";
	const hasHeroContent = Boolean(
		hero?.eyebrow ||
			hero?.instructions ||
			heroCommand ||
			hero?.body ||
			(hero?.cta && hero.cta.label)
	);
</script>

<section class="paper-header">
	<div class="container">
		<!-- Paper Title -->
		<!-- <h1 class="paper-title">
			{title}
		</h1> -->

		<!-- Abstract -->
		<div class="abstract-section">
			<!-- <h2 class="abstract-title">Introduction</h2> -->
			<div class="abstract-content">
				<center>
					<p>
						<em>
							This is an interactive blog post that presents the core ideas of
							FormulaCode using a sample dataset that is easy to share and
							reflects the propoerties of our core dataset.
						</em>
					</p>
				</center>
				<!-- {#each abstractParagraphs as paragraph}
					<p>{@html paragraph}</p>
				{/each} -->
			</div>
		</div>
		<!-- 
		{#if headerTableRows.length}
			<div class="header-leaderboard">
				<div class="leaderboard-header">
					<h2>{leaderboardTitle}</h2>
					<p class="description">{leaderboardDescription}</p>
				</div>
				<SortableTable
					columns={headerTableColumns}
					rows={headerTableRows}
					initialSortKey="overall"
					initialSortOrder="desc"
				/>
			</div>
		{/if} -->

		<!-- {#if hasHeroContent}
			<div class="paper-hero">
				{#if hero.eyebrow}<p class="hero-eyebrow">{hero.eyebrow}</p>{/if}
				{#if hero.instructions}
					<p class="hero-instructions">{@html hero.instructions}</p>
				{/if}
				{#if heroCommand}
					<div class="hero-command">
						<pre class="hero-command__code" tabindex="0"><code
								>{heroCommand}</code
							></pre>
					</div>
				{/if}
				{#if hero.body}<p class="hero-body">{hero.body}</p>{/if}
				{#if hero.cta?.label}
					<a class="hero-cta" href={hero.cta.href ?? "#"}>{hero.cta.label}</a>
				{/if}
			</div>
		{/if} -->
	</div>
</section>

<style>
	.paper-header {
		background-color: var(--bg-primary);
		color: var(--text-primary);
		padding: 3rem 1rem 4rem;
		text-align: center;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
	}

	/* Abstract */
	.abstract-section {
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
	}

	.abstract-content {
		font-family: var(--sans);
		font-size: var(--18px);
		line-height: 1.65;
		text-align: left;
		color: var(--text-primary);
	}

	.abstract-content p {
		margin: 0 0 1rem;
	}

	.abstract-content p:last-child {
		margin-bottom: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.paper-header {
			padding: 2rem 1rem 3rem;
		}
	}
</style>
