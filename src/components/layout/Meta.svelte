<script>
	export let title =
		"FormulaCode: LLM Agent Benchmark for Python Code Optimization";
	export let description =
		"FormulaCode is a continually updated benchmark evaluating LLM coding agents on real-world Python code optimization. 957 performance bottlenecks from 70+ scientific Python repositories, each paired with expert patches and community-maintained performance workloads.";
	export let url = "https://formulacode.org/";
	export let keywords =
		"code optimization benchmark, LLM agent benchmark, Python performance benchmark, AI coding agents, code performance dataset, agentic optimization, LLM evaluation, software engineering benchmark, code optimization dataset, FormulaCode";
	export let ogType = "website";
	export let preloadFont = [];

	// JSON-LD structured data: pass an array of plain JS objects. Each is
	// serialized into its own <script type="application/ld+json"> tag.
	export let jsonLd = [];

	// Strip trailing slash so we don't render "https://formulacode.org//" in
	// canonical / og:url. SvelteKit's trailingSlash: "always" guarantees the
	// trailing slash on the input.
	$: canonicalUrl = (url || "https://formulacode.org/").replace(/\/+$/, "/");
	$: ogImage = "https://formulacode.org/assets/images/formula-code-banner.png";
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content="Atharva Sehgal" />
	<meta name="keywords" content={keywords} />
	<meta name="news_keywords" content={keywords} />

	<meta property="og:title" content={title} />
	<meta property="og:site_name" content="FormulaCode" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={ogType} />
	<meta property="og:locale" content="en_US" />

	<meta property="og:image" content={ogImage} />
	<meta
		property="og:image:alt"
		content="FormulaCode benchmark — agentic optimization on large codebases"
	/>
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@atharvas" />
	<meta name="twitter:creator" content="@atharvas" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
	<meta
		name="twitter:image:alt"
		content="FormulaCode benchmark — agentic optimization on large codebases"
	/>

	<meta name="robots" content="index,follow,max-image-preview:large" />
	<meta name="googlebot" content="index,follow,max-image-preview:large" />
	<meta name="theme-color" content="#ffffff" />
	<meta name="color-scheme" content="light" />

	<link rel="canonical" href={canonicalUrl} />

	<!-- Google Fonts preconnect (the actual font CSS is imported from
	     variables.css; Lexend + Lexend Deca + Roboto Mono). -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

	{#each preloadFont as href}
		<link rel="preload" {href} as="font" type="font/woff2" crossorigin />
	{/each}

	{#each jsonLd as item}
		{@html `<script type="application/ld+json">${JSON.stringify(item)}<\/script>`}
	{/each}
</svelte:head>
