<script>
	export let title = "🏎️ FormulaCode";
	export let description = "FormulaCode is the first large-scale analysis of the holistic ability of LLM agents to optimize codebases.";
	export let url = "https://formula-code.github.io/";
	export let keywords = "Code Optimization, Large Language Models, LLMs, AI Agents, Software Performance, Machine Learning, AI Research";
	export let preloadFont = [
		
	];
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="author" content="Atharva Sehgal" />
	<meta name="news_keywords" content={keywords} />

	<meta property="og:title" content={title} />
	<meta property="og:site_name" content="🏎️ FormulaCode" />
	<meta property="og:url" content={url} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="article" />
	<meta property="og:locale" content="en_US" />

	<!-- <meta property="og:image" content="{url}/assets/images/social2.jpg" /> -->
	<meta property="og:image:type" content="image/jpeg" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="600" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="https://formula-code.github.io/" />
	<meta name="twitter:creator" content="@atharvas" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<!-- <meta name="twitter:image:src" content="{url}/assets/images/social2.jpg" /> -->

	<meta name="robots" content="max-image-preview:large" />

	<link rel="canonical" href="{url}/" />

	<!-- Google Fonts preconnect for faster loading -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Castoro:ital@0;1&display=swap" rel="stylesheet" />

	{#each preloadFont as href}
		<link rel="preload" {href} as="font" type="font/woff2" crossorigin />
	{/each}
</svelte:head>
