<script>
	import { getContext, onMount } from "svelte";
	import Icon from "$components/helpers/Icon.svelte";
	import dashboard from "$data/dashboard.json";

	const fmt = (n) => new Intl.NumberFormat("en-US").format(n);
	const FINAL_TASKS = 957;
	const INITIAL_REPOS = 70;
	const totals = dashboard.totals;

	// Live dashboard probe: a no-cors GET tells us the host responded at all.
	// On a network-level failure (DNS, offline, refused) fetch rejects, and we
	// disable the button. We don't get to read the response, but reachability
	// is enough for the "is this thing up?" signal.
	let dashboardAvailable = true;
	let dashboardChecked = false;
	onMount(async () => {
		const url = "https://data.formulacode.org/";
		try {
			const ctrl = new AbortController();
			const t = setTimeout(() => ctrl.abort(), 5000);
			await fetch(url, {
				method: "GET",
				mode: "no-cors",
				cache: "no-store",
				signal: ctrl.signal
			});
			clearTimeout(t);
			dashboardAvailable = true;
		} catch (err) {
			dashboardAvailable = false;
		} finally {
			dashboardChecked = true;
		}
	});

	const copy = getContext("copy") || {};
	const headerCopy = copy.paperHeader || {};

	const defaultTitle = "FormulaCode";
	const defaultSubtitle = "Evaluating Agentic Optimization on Large Codebases";

	const defaultAuthors = [
		{ name: "Atharva Sehgal", url: "https://atharvas.net/", superscript: "1" },
		{
			name: "James Hou",
			url: "https://jamesahou.github.io/",
			superscript: "2"
		},
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
		{
			label: "Live dashboard",
			icon: "activity",
			href: "https://data.formulacode.org/"
		},
		{
			label: "arXiv",
			icon: "file-text",
			href: "https://arxiv.org/abs/2603.16011"
		},
		{
			label: "Dataset",
			icon: "database",
			href: "https://huggingface.co/datasets/formulacode/formulacode-all"
		},
		{
			label: "GitHub",
			icon: "github",
			href: "https://github.com/formula-code/fc-eval"
		}
	];

	const subtitle = headerCopy.title?.split(":")[1]?.trim() || defaultSubtitle;

	const authors =
		Array.isArray(headerCopy.authors) && headerCopy.authors.length > 0
			? headerCopy.authors
			: defaultAuthors;

	const affiliations =
		Array.isArray(headerCopy.affiliations) && headerCopy.affiliations.length > 0
			? headerCopy.affiliations
			: defaultAffiliations;

	const allActions =
		Array.isArray(headerCopy.actions) && headerCopy.actions.length > 0
			? headerCopy.actions
			: defaultActions;

	// "Live dashboard" is promoted to a primary CTA next to Browse Workloads,
	// so strip it from the secondary action row.
	const isLiveDashboard = (a) =>
		a?.label === "Live dashboard" || a?.icon === "activity";
	const liveDashboard = allActions.find(isLiveDashboard) ?? {
		label: "Live dashboard",
		icon: "activity",
		href: "https://data.formulacode.org/"
	};
	const actions = allActions.filter((a) => !isLiveDashboard(a));

	// Split authors so the last 3 always sit on their own line on desktop —
	// avoids the awkward orphan ("Yisong Yue" alone) that flex-wrap produced.
	$: authorsTop = authors.slice(0, Math.max(0, authors.length - 3));
	$: authorsBottom = authors.slice(Math.max(0, authors.length - 3));
</script>

<section class="hero">
	<div class="hero-content">
		<div class="hero-title">
			<div class="hero-mark">
				<img
					class="hero-logo"
					src="/assets/images/formula-code-icon.png"
					alt="FormulaCode logo"
					width="52"
					height="52"
				/>
				<h1 class="title">
					<span class="t-formula">Formula</span><span class="t-code">Code</span>
				</h1>
			</div>
			<p class="hero-subtitle">{subtitle}</p>
		</div>

		{#if authorsTop.length}
			<div class="hero-authors">
				<p class="author-line">
					{#each authorsTop as author, i}
						<span class="author">
							{#if author.url}
								<a href={author.url} target="_blank" rel="noopener noreferrer">
									<strong>{author.name}</strong>
								</a>
							{:else}
								<strong>{author.name}</strong>
							{/if}<sup>{author.superscript}</sup></span
						>{#if i < authorsTop.length - 1}<span class="author-sep"
								>&ensp;</span
							>{/if}
					{/each}
				</p>
				{#if authorsBottom.length}
					<p class="author-line">
						{#each authorsBottom as author, i}
							<span class="author">
								{#if author.url}
									<a
										href={author.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										<strong>{author.name}</strong>
									</a>
								{:else}
									<strong>{author.name}</strong>
								{/if}<sup>{author.superscript}</sup></span
							>{#if i < authorsBottom.length - 1}<span class="author-sep"
									>&ensp;</span
								>{/if}
						{/each}
					</p>
				{/if}
			</div>
		{/if}

		{#if affiliations.length}
			<div class="hero-affil">
				{#each affiliations as a}
					<span class="affil-item">
						<sup>{a.superscript}</sup>{a.label}
					</span>
				{/each}
			</div>
		{/if}

		<div class="hero-blurb-top hero-blurb">
			<p>
				FormulaCode is a <em>continually updating</em> benchmark for evaluating
				the <em>holistic</em> ability of LLM agents to optimize codebases. Our
				current dataset consists of <strong>{fmt(FINAL_TASKS)}</strong> tasks
				scraped from <strong>{fmt(totals.pull_requests)}</strong> pull requests
				in
				<strong>{fmt(INITIAL_REPOS)}+</strong> compliant repositories.
			</p>
		</div>

		<div class="hero-ctas hero-ctas-wide">
			{#if dashboardAvailable}
				<a
					class="btn btn-primary btn-wide"
					href={liveDashboard.href}
					target="_blank"
					rel="noopener noreferrer"
					aria-label="{liveDashboard.label} (live)"
				>
					<span class="action-icon">
						<Icon
							name={liveDashboard.icon || "activity"}
							size="15px"
							strokeWidth={2}
						/>
					</span>
					{liveDashboard.label}
				</a>
			{:else}
				<span
					class="btn btn-primary btn-wide is-disabled"
					aria-disabled="true"
					title="Dashboard is unreachable from your network"
				>
					<span class="action-icon">
						<Icon
							name={liveDashboard.icon || "activity"}
							size="15px"
							strokeWidth={2}
						/>
					</span>
					{liveDashboard.label} (offline)
				</span>
			{/if}
			<a class="btn btn-primary-blue-dotted btn-wide" href="/explorer/">
				<span class="cta-mark">→</span>
				Browse Workloads
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

		<p class="hero-terminal-lead">Try out a formulacode task with:</p>
		<div class="hero-terminal" aria-label="Install and run fc-eval">
			<pre class="terminal-line"><span class="prompt">$</span> <span class="cmd"
					>uv tool install fc-eval</span
				></pre>
			<pre class="terminal-line"><span class="prompt">$</span> <span class="cmd"
					>fc-eval run --dataset formulacode --task-id shapely_shapely_2283 --config <span
						class="placeholder">[your-config.json]</span
					></span
				></pre>
		</div>
	</div>
</section>

<style>
	.hero {
		max-width: 900px;
		margin: 0 auto;
		padding: var(--space-lg) var(--space-md) var(--space-md);
		text-align: center;
	}

	.hero-content {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
	}

	/* ── Hero title: small logo + name on one line, subtitle below ── */
	.hero-title {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
		width: 100%;
	}

	.hero-mark {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
	}

	.hero-logo {
		height: clamp(36px, 5vw, 52px);
		width: auto;
		display: block;
	}

	.title {
		font-family: var(--sans);
		/* Fixed size so the page title doesn't collapse toward the subtitle on
		   narrow viewports. Section titles on this page are 1.5rem, so the page
		   title sits at 2x that to keep a clear hierarchy. */
		font-size: 3rem;
		font-weight: 800;
		letter-spacing: -0.025em;
		line-height: 1.05;
		margin: 0;
	}

	.t-formula {
		color: var(--text-primary);
	}

	.t-code {
		color: var(--brand-red);
	}

	.hero-subtitle {
		font-family: var(--sans);
		/* Fixed size, 1.5x the section title (1.5rem) so the caption stays
		   visibly above section headers on every viewport. */
		font-size: 2.25rem;
		color: var(--text-muted);
		font-weight: 400;
		line-height: 1.25;
		letter-spacing: -0.01em;
		margin: 0;
		text-align: center;
		max-width: 820px;
	}

	.hero-authors {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.author-line {
		font-size: 0.95rem;
		color: var(--text-primary);
		line-height: 1.7;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: baseline;
		gap: 6px 14px;
	}

	.author-sep {
		display: none;
	}

	.author {
		white-space: nowrap;
	}

	.author-line strong {
		font-weight: 500;
	}

	.author-line a {
		color: var(--text-primary);
		text-decoration: none;
		border-bottom: 1px solid transparent;
		transition:
			color 140ms,
			border-color 140ms;
	}

	.author-line a:hover {
		border-bottom-color: var(--brand-red);
		color: var(--brand-red);
	}

	.author-line sup {
		font-size: 0.65rem;
		margin-left: 1px;
		color: var(--text-muted);
	}

	.hero-affil {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: var(--space-md);
		margin: 0;
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

	.hero-blurb {
		width: 100%;
		max-width: 640px;
		margin: var(--space-sm) auto 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
		text-align: center;
	}

	.hero-blurb p {
		font-family: var(--sans);
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--text-muted);
		margin: 0;
	}

	.hero-blurb p :global(em) {
		font-style: italic;
		color: inherit;
		font-weight: 500;
	}

	.hero-blurb p :global(strong) {
		color: var(--text-primary);
		font-weight: 700;
	}

	.hero-terminal-lead {
		width: 100%;
		max-width: 820px;
		margin: var(--space-md) auto 6px;
		padding: 0;
		text-align: left;
		font-family: var(--sans);
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.hero-terminal {
		width: 100%;
		max-width: 820px;
		margin: 0 auto;
		background: var(--bg-secondary);
		border: 0;
		border-radius: var(--radius);
		padding: var(--space-md) var(--space-lg);
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: 6px;
		overflow-x: auto;
	}

	.terminal-line {
		font-family: var(--mono);
		font-size: 0.88rem;
		line-height: 1.55;
		color: var(--text-primary);
		margin: 0;
		white-space: pre;
	}

	.terminal-line .prompt {
		color: var(--brand-red);
		font-weight: 700;
		user-select: none;
		margin-right: 4px;
	}

	.terminal-line .cmd {
		color: var(--text-primary);
	}

	.terminal-line .placeholder {
		color: var(--text-muted);
		font-style: italic;
	}

	.hero-ctas {
		display: flex;
		justify-content: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
		margin: 0;
	}

	.hero-ctas-wide {
		margin-top: var(--space-xs);
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

	@media (max-width: 720px) {
		.hero {
			padding: var(--space-md) var(--space-md) var(--space-md);
		}
		.hero-mark {
			gap: 10px;
		}
		.hero-terminal {
			padding: var(--space-sm) var(--space-md);
		}
		.terminal-line {
			font-size: 0.8rem;
		}
	}

	@media (max-width: 520px) {
		.hero-affil {
			gap: var(--space-sm);
		}
	}
</style>
