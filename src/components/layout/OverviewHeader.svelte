<script>
	import { getContext } from "svelte";
	import Icon from "$components/helpers/Icon.svelte";

	const copy = getContext("copy") || {};
	const headerCopy = copy.paperHeader || {};

	const defaultTitle = "FormulaCode";
	const defaultSubtitle =
		"Evaluating Agentic Optimization on Large Codebases";

	const defaultAuthors = [
		{ name: "Atharva Sehgal", url: "https://atharvas.net/", superscript: "1" },
		{ name: "James Hou", url: "https://jamesahou.github.io/", superscript: "2" },
		{
			name: "Akanksha Sarkar",
			url: "https://milstein-program.as.cornell.edu/akanksha-sarkar/",
			superscript: "3"
		},
		{
			name: "Ishaan Mantripragada",
			url: "https://www.linkedin.com/in/ishaanmantri/",
			superscript: "2"
		},
		{
			name: "Swarat Chaudhuri",
			url: "https://www.cs.utexas.edu/~swarat/",
			superscript: "1"
		},
		{ name: "Jennifer J. Sun", url: "https://jenjsun.com/", superscript: "3" },
		{ name: "Yisong Yue", url: "https://www.yisongyue.com/", superscript: "2" }
	];

	const defaultAffiliations = [
		{ superscript: "1", label: "UT Austin" },
		{ superscript: "2", label: "Caltech" },
		{ superscript: "3", label: "Cornell" }
	];

	const defaultActions = [
		{ label: "arXiv", icon: "file-text", href: "https://arxiv.org/abs/2603.16011" },
		{
			label: "Dataset",
			icon: "database",
			href: "https://huggingface.co/datasets/formulacode/formulacode-all"
		},
		{ label: "GitHub", icon: "github", href: "https://github.com/formula-code/fc-eval" }
	];

	const defaultStats = [
		{ num: "957", label: "Tasks" },
		{ num: "70+", label: "Repositories" },
		{ num: "1.4M", label: "Workloads" },
		{ num: "4", label: "Strata" }
	];

	const title = headerCopy.title?.split(":")[0]?.trim() || defaultTitle;
	const subtitle =
		headerCopy.title?.split(":")[1]?.trim() || defaultSubtitle;

	const authors =
		Array.isArray(headerCopy.authors) && headerCopy.authors.length > 0
			? headerCopy.authors
			: defaultAuthors;

	const affiliations =
		Array.isArray(headerCopy.affiliations) && headerCopy.affiliations.length > 0
			? headerCopy.affiliations
			: defaultAffiliations;

	const actions =
		Array.isArray(headerCopy.actions) && headerCopy.actions.length > 0
			? headerCopy.actions
			: defaultActions;

	const stats = Array.isArray(headerCopy.stats) && headerCopy.stats.length > 0
		? headerCopy.stats
		: defaultStats;

	const tagline =
		headerCopy.tagline ||
		"A live benchmark of <strong>957 performance bottlenecks</strong> mined from scientific Python repositories — pairing every task with expert patches and ~265 community workloads.";
</script>

<section class="hero">
	<div class="hero-banner">
		<img
			src="/assets/images/formula-code-banner.svg"
			alt="FormulaCode — {subtitle}"
			width="660"
			height="155"
		/>
	</div>

	{#if authors.length}
		<p class="hero-authors">
			{#each authors as author, i}
				{#if author.url}
					<a href={author.url} target="_blank" rel="noopener noreferrer">
						<strong>{author.name}</strong>
					</a>
				{:else}
					<strong>{author.name}</strong>
				{/if}<sup>{author.superscript}</sup>{#if i < authors.length - 1}{" "}&ensp;{/if}
			{/each}
		</p>
	{/if}

	{#if affiliations.length}
		<div class="hero-affil">
			<div class="affil-row">
				{#each affiliations as a}
					<span class="affil-item">
						<sup>{a.superscript}</sup>{a.label}
					</span>
				{/each}
			</div>
		</div>
	{/if}

	{#if tagline}
		<p class="hero-tagline">{@html tagline}</p>
	{/if}

	<div class="hero-ctas hero-ctas-wide">
		<a class="btn btn-primary btn-wide" href="/explorer/">
			<span class="cta-mark">⌕</span>
			Browse all 957 tasks
		</a>
	</div>

	<div class="hero-ctas">
		{#each actions as action}
			<a
				class="btn btn-secondary"
				href={action.href}
				target="_blank"
				rel="noopener noreferrer"
			>
				<span class="action-icon">
					<Icon name={action.icon} size="15px" strokeWidth={2} />
				</span>
				<span>{action.label}</span>
			</a>
		{/each}
	</div>

	<div class="stats-strip">
		{#each stats as s}
			<div class="stat-item">
				<div class="stat-num">{s.num}</div>
				<div class="stat-label">{s.label}</div>
			</div>
		{/each}
	</div>
</section>

<style>
	.hero {
		max-width: 900px;
		margin: 0 auto;
		padding: var(--space-lg) var(--space-md) var(--space-md);
		text-align: center;
	}

	.hero-banner {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--space-md);
	}

	.hero-banner img {
		width: 100%;
		max-width: 620px;
		height: auto;
	}

	.hero-authors {
		font-size: 0.9rem;
		color: var(--text-primary);
		line-height: 1.85;
		margin: 0 0 var(--space-xs);
	}

	.hero-authors strong {
		font-weight: 500;
	}

	.hero-authors a {
		color: var(--text-primary);
		text-decoration: none;
		border-bottom: 1px solid transparent;
	}

	.hero-authors a:hover {
		border-bottom-color: var(--accent-primary);
		color: var(--accent-primary);
		text-decoration: none;
	}

	.hero-authors sup {
		font-size: 0.65rem;
		margin-left: 1px;
		color: var(--text-muted);
	}

	.hero-affil {
		margin-bottom: var(--space-md);
	}

	.affil-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: var(--space-lg);
	}

	.affil-item {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.82rem;
		color: var(--text-muted);
	}

	.affil-item sup {
		font-size: 0.65rem;
		color: var(--text-muted);
	}

	.hero-tagline {
		font-size: clamp(0.95rem, 1.8vw, 1.05rem);
		color: var(--text-muted);
		max-width: 620px;
		margin: 0 auto var(--space-md);
		line-height: 1.65;
	}

	.hero-tagline :global(strong) {
		color: var(--text-primary);
		font-weight: 600;
	}

	.hero-ctas {
		display: flex;
		justify-content: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
		margin-bottom: var(--space-sm);
	}

	.hero-ctas-wide {
		margin-bottom: var(--space-xs);
	}

	.cta-mark {
		font-family: var(--sans);
		font-size: 1.05em;
		line-height: 1;
	}

	.action-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.action-icon :global(svg) {
		stroke: currentColor;
	}

	.stats-strip {
		max-width: 900px;
		margin: var(--space-lg) auto 0;
	}

	@media (max-width: 640px) {
		.hero {
			padding: var(--space-xl) var(--space-md);
		}
		.affil-row {
			gap: var(--space-md);
		}
	}
</style>
