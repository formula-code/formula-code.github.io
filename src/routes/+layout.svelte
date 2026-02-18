<script>
	import "$styles/app.css";
	import Navbar from "$components/layout/Navbar.svelte";
	import Footer from "$components/layout/Footer.svelte";
	import { theme } from "$stores/theme.js";
</script>

<Navbar />
<main id="content">
	<slot />
</main>
<Footer />
