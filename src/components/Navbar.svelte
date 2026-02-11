<script>
	import { page } from "$app/stores";
	import { Menu, X } from "lucide-svelte";
	import { onMount } from "svelte";

	let isMenuOpen = false;
	let innerWidth;

	$: if (innerWidth > 768) {
		isMenuOpen = false;
	}

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	const links = [
		{ name: "Overview", href: "/" },
		{ name: "Blog", href: "/blog/" },
		{ name: "Leaderboard", href: "/leaderboard/" },
		{ name: "Getting Started", href: "/docs/" }
	];
</script>

<svelte:window bind:innerWidth />

<nav>
	<div class="nav-container">
		<a href="/" class="brand">FormulaCode</a>

		<div class="desktop-links">
			{#each links as link}
				<a
					href={link.href}
					class:active={$page.url.pathname === link.href ||
						(link.href !== "/" && $page.url.pathname.startsWith(link.href))}
				>
					{link.name}
				</a>
			{/each}
		</div>

		<button class="menu-button" on:click={toggleMenu} aria-label="Toggle menu">
			{#if isMenuOpen}
				<X size={24} />
			{:else}
				<Menu size={24} />
			{/if}
		</button>
	</div>

	{#if isMenuOpen}
		<div class="mobile-menu">
			{#each links as link}
				<a
					href={link.href}
					class:active={$page.url.pathname === link.href ||
						(link.href !== "/" && $page.url.pathname.startsWith(link.href))}
					on:click={toggleMenu}
				>
					{link.name}
				</a>
			{/each}
		</div>
	{/if}
</nav>

<style>
	nav {
		position: sticky;
		top: 0;
		width: 100%;
		background-color: var(--wine-black, #1a1a1a);
		color: var(--wine-tan, #f4e4bc);
		z-index: 1000;
		border-bottom: 1px solid rgba(244, 228, 188, 0.1);
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.brand {
		font-family: var(--sans, sans-serif);
		font-size: 1.5rem;
		font-weight: bold;
		text-decoration: none;
		color: var(--wine-tan, #f4e4bc);
	}

	.desktop-links {
		display: none;
		gap: 2rem;
	}

	.desktop-links a {
		text-decoration: none;
		color: var(--wine-tan, #f4e4bc);
		font-family: var(--font-body, sans-serif);
		font-weight: 500;
		opacity: 0.8;
		transition: opacity 0.2s;
		position: relative;
	}

	.desktop-links a:hover {
		opacity: 1;
	}

	.desktop-links a.active {
		opacity: 1;
		font-weight: 700;
	}

	.desktop-links a.active::after {
		content: "";
		position: absolute;
		bottom: -4px;
		left: 0;
		width: 100%;
		height: 2px;
		background-color: var(--wine-red, #a12d2d);
	}

	.menu-button {
		background: none;
		border: none;
		color: var(--wine-tan, #f4e4bc);
		cursor: pointer;
		display: block;
	}

	.mobile-menu {
		background-color: var(--wine-black, #1a1a1a);
		padding: 1rem;
		border-top: 1px solid rgba(244, 228, 188, 0.1);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.mobile-menu a {
		text-decoration: none;
		color: var(--wine-tan, #f4e4bc);
		font-family: var(--font-body, sans-serif);
		font-size: 1.1rem;
		padding: 0.5rem 0;
	}

	.mobile-menu a.active {
		color: var(--wine-red, #a12d2d);
		font-weight: bold;
	}

	@media (min-width: 768px) {
		.desktop-links {
			display: flex;
		}

		.menu-button {
			display: none;
		}
	}
</style>
