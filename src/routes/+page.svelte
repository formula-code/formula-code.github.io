<script>
	import { setContext } from "svelte";
	import { browser } from "$app/environment";
	import Meta from "$components/layout/Meta.svelte";
	import OverviewPage from "$components/pages/OverviewPage.svelte";
	import copy from "$data/copy.json";
	import version from "$utils/version.js";

	export let data;

	version();

	setContext("copy", copy);
	setContext("data", data.data);

	const title =
		"FormulaCode: LLM Agent Benchmark for Python Code Optimization";
	const description =
		"FormulaCode is a continually updated benchmark evaluating LLM coding agents on real-world Python code optimization. 957 performance bottlenecks from 70+ scientific Python repositories, each paired with expert patches and community-maintained performance workloads. Accepted at ICML 2026.";
	const url = "https://formulacode.org/";

	const dataset = {
		"@context": "https://schema.org",
		"@type": "Dataset",
		name: "FormulaCode",
		alternateName: "FormulaCode Benchmark",
		description,
		url,
		identifier: "https://formulacode.org/",
		keywords: [
			"code optimization",
			"LLM agents",
			"Python performance",
			"benchmark dataset",
			"agentic optimization",
			"software engineering benchmark"
		],
		license: "https://opensource.org/licenses/MIT",
		creator: {
			"@type": "Organization",
			name: "FormulaCode",
			url: "https://formulacode.org/",
			sameAs: [
				"https://github.com/formula-code",
				"https://huggingface.co/formulacode",
				"https://data.formulacode.org/",
				"https://api.formulacode.org/"
			]
		},
		distribution: [
			{
				"@type": "DataDownload",
				name: "FormulaCode on Hugging Face",
				contentUrl: "https://huggingface.co/datasets/formulacode/formulacode-all",
				encodingFormat: "application/json"
			},
			{
				"@type": "DataDownload",
				name: "FormulaCode live dashboard",
				contentUrl: "https://data.formulacode.org/",
				encodingFormat: "text/html"
			},
			{
				"@type": "DataDownload",
				name: "fc-eval evaluation harness",
				contentUrl: "https://github.com/formula-code/fc-eval",
				encodingFormat: "application/x-git"
			}
		],
		isAccessibleForFree: true,
		measurementTechnique:
			"Statistical comparison of expert and LLM-agent patches across multi-objective performance workloads on real-world Python repositories.",
		variableMeasured: [
			"speedup ratio",
			"agent advantage",
			"stratified advantage"
		]
	};

	const scholarlyArticle = {
		"@context": "https://schema.org",
		"@type": "ScholarlyArticle",
		headline: "FormulaCode: Evaluating Agentic Optimization on Large Codebases",
		name: "FormulaCode: Evaluating Agentic Optimization on Large Codebases",
		abstract: description,
		url,
		sameAs: "https://arxiv.org/abs/2603.16011",
		datePublished: "2026",
		inLanguage: "en",
		author: [
			{
				"@type": "Person",
				name: "Atharva Sehgal",
				url: "https://atharvas.net/"
			},
			{
				"@type": "Person",
				name: "James Hou",
				url: "https://jamesahou.github.io/"
			},
			{
				"@type": "Person",
				name: "Akanksha Sarkar",
				url: "https://milstein-program.as.cornell.edu/akanksha-sarkar/"
			},
			{
				"@type": "Person",
				name: "Ishaan Mantripragada",
				url: "https://www.linkedin.com/in/ishaanmantri/"
			},
			{
				"@type": "Person",
				name: "Swarat Chaudhuri",
				url: "https://www.cs.utexas.edu/~swarat/"
			},
			{
				"@type": "Person",
				name: "Jennifer J. Sun",
				url: "https://jenjsun.com/"
			},
			{
				"@type": "Person",
				name: "Yisong Yue",
				url: "https://www.yisongyue.com/"
			}
		],
		publisher: {
			"@type": "Organization",
			name: "International Conference on Machine Learning (ICML)",
			url: "https://icml.cc/Conferences/2026"
		},
		isPartOf: {
			"@type": "PublicationEvent",
			name: "ICML 2026",
			url: "https://icml.cc/Conferences/2026"
		}
	};

	const website = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "FormulaCode",
		url,
		description,
		publisher: {
			"@type": "Organization",
			name: "FormulaCode",
			url: "https://formulacode.org/"
		}
	};

	const jsonLd = [dataset, scholarlyArticle, website];
</script>

<Meta {title} {description} {url} {jsonLd} />
<OverviewPage leaderboardData={data.leaderboard} />
