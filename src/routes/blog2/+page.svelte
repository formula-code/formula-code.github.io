<script>
	import { setContext } from "svelte";
	import { browser } from "$app/environment";
	import Meta from "$components/layout/Meta.svelte";
	import Blog2Page from "$components/pages/Blog2Page.svelte";
	import copy from "$data/copy.json";
	import version from "$utils/version.js";

	export let data;

	version();

	const { title, description, url, keywords } = copy;
	setContext("copy", copy);
	setContext("data", data.data);
</script>

<Meta {title} {description} {url} {keywords} />
<Blog2Page />
