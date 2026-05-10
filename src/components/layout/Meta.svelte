<script>
	export let title = "FormulaCode";
	export let description =
		"FormulaCode is the first large-scale analysis of the holistic ability of LLM agents to optimize codebases.";
	export let url = "https://formulacode.org/";
	export let keywords =
		"Code Optimization, Large Language Models, LLMs, AI Agents, Software Performance, Machine Learning, AI Research";
	export let preloadFont = [];
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content="Atharva Sehgal" />
	<meta name="news_keywords" content={keywords} />

	<meta property="og:title" content={title} />
	<meta property="og:site_name" content="FormulaCode" />
	<meta property="og:url" content={url} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="article" />
	<meta property="og:locale" content="en_US" />

	<meta
		property="og:image"
		content="{url}assets/images/formula-code-banner.png"
	/>
	<meta
		property="og:image:alt"
		content="FormulaCode Data Analysis Logo and Banner"
	/>
	<meta property="og:image:type" content="image/png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="600" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="https://formulacode.org/" />
	<meta name="twitter:creator" content="@atharvas" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta
		name="twitter:image:src"
		content="{url}assets/images/formula-code-banner.png"
	/>
	<meta
		name="twitter:image:alt"
		content="FormulaCode Data Analysis Logo and Banner"
	/>

	<meta name="robots" content="max-image-preview:large" />
	<meta name="theme-color" content="#ffffff" />
	<meta name="color-scheme" content="light" />

	<link rel="canonical" href="{url}/" />

	<!-- Google Fonts preconnect (the actual font CSS is imported from
	     variables.css; Lexend + Lexend Deca + Roboto Mono). -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

	{#each preloadFont as href}
		<link rel="preload" {href} as="font" type="font/woff2" crossorigin />
	{/each}
</svelte:head>
