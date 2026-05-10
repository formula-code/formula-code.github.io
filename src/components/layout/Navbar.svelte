<script>
	import { page } from "$app/stores";
	import { Menu, X } from "lucide-svelte";
	import { onMount } from "svelte";
	import { BREAKPOINTS } from "$utils/constants.js";

	let isMenuOpen = false;
	let innerWidth;
	let navElement;
	let navResizeObserver;

	$: if (innerWidth > BREAKPOINTS.TABLET) {
		isMenuOpen = false;
	}

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function setNavbarHeight() {
		if (!navElement || typeof document === "undefined") return;
		const height = Math.ceil(navElement.getBoundingClientRect().height);
		document.documentElement.style.setProperty(
			"--navbar-height",
			`${height}px`
		);
	}

	onMount(() => {
		setNavbarHeight();

		if (typeof ResizeObserver !== "undefined") {
			navResizeObserver = new ResizeObserver(() => {
				setNavbarHeight();
			});
			navResizeObserver.observe(navElement);
		}

		window.addEventListener("resize", setNavbarHeight);

		return () => {
			navResizeObserver?.disconnect();
			window.removeEventListener("resize", setNavbarHeight);
		};
	});

	const links = [
		{ name: "Overview", href: "/" },
		{ name: "Leaderboard", href: "/leaderboard/" },
		{ name: "Documentation", href: "/docs/" },
		{ name: "Blog", href: "/blog/" }
	];

	const ctaLink = { name: "Open Explorer →", href: "/explorer/" };
</script>

<svelte:window bind:innerWidth />

<nav class="site-nav" bind:this={navElement}>
	<div class="nav-inner">
		<a class="nav-brand" href="/">
			<img
				class="brand-mark"
				src="/assets/images/formula-code-icon.svg"
				alt=""
				width="28"
				height="28"
			/>
			FormulaCode
		</a>

		<div class="nav-links">
			{#each links as link}
				<a
					href={link.href}
					class:active={$page.url.pathname === link.href ||
						(link.href !== "/" && $page.url.pathname.startsWith(link.href))}
				>
					{link.name}
				</a>
			{/each}
			<a
				href={ctaLink.href}
				class="nav-cta"
				class:active={$page.url.pathname.startsWith(ctaLink.href)}
			>
				{ctaLink.name}
			</a>
		</div>

		<button
			class="menu-button"
			on:click={toggleMenu}
			aria-label="Toggle menu"
		>
			{#if isMenuOpen}
				<X size={22} />
			{:else}
				<Menu size={22} />
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
			<a
				href={ctaLink.href}
				class="cta"
				on:click={toggleMenu}
			>
				{ctaLink.name}
			</a>
		</div>
	{/if}
</nav>

<style>
	.site-nav {
		position: sticky;
		top: 0;
		width: 100%;
		background: var(--bg-primary);
		color: var(--text-primary);
		z-index: 50;
		border-bottom: 1px solid var(--border-primary);
		padding: 0.75rem var(--space-md);
	}

	.nav-inner {
		max-width: 1000px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-md);
	}

	.nav-brand {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--sans);
		font-weight: 600;
		font-size: 1.05rem;
		letter-spacing: -0.015em;
		color: var(--text-primary);
		text-decoration: none;
	}

	.nav-brand:hover {
		text-decoration: none;
		color: var(--accent-primary);
	}

	.brand-mark {
		display: inline-block;
		width: 28px;
		height: 28px;
		object-fit: contain;
	}

	.nav-links {
		display: none;
		gap: 4px;
		flex-wrap: wrap;
		align-items: center;
	}

	.nav-links a {
		font-family: var(--sans);
		font-size: 0.85rem;
		color: var(--text-muted);
		text-decoration: none;
		padding: 6px 10px;
		border-radius: var(--radius);
		border: 1px solid transparent;
		transition:
			border-color 120ms,
			color 120ms;
	}

	.nav-links a:hover {
		color: var(--text-primary);
		border-color: var(--border-primary);
		text-decoration: none;
	}

	.nav-links a.active {
		color: var(--text-primary);
		border-color: var(--border-primary);
	}

	.nav-cta {
		background: var(--accent-primary) !important;
		color: #fff !important;
		border-color: var(--accent-primary) !important;
		font-weight: 600 !important;
	}

	.nav-cta:hover {
		background: var(--link-hover) !important;
		color: #fff !important;
		border-color: var(--link-hover) !important;
		box-shadow: var(--shadow);
	}

	.menu-button {
		background: none;
		border: none;
		color: var(--text-primary);
		cursor: pointer;
		display: block;
		padding: 4px;
	}

	.mobile-menu {
		max-width: 1000px;
		margin: 0 auto;
		padding: var(--space-sm) 0 var(--space-md);
		border-top: 1px solid var(--border-primary);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-top: var(--space-sm);
	}

	.mobile-menu a {
		font-family: var(--sans);
		font-size: 0.95rem;
		color: var(--text-secondary);
		padding: 0.55rem 0;
		text-decoration: none;
	}

	.mobile-menu a.active {
		color: var(--accent-primary);
		font-weight: 600;
	}

	.mobile-menu a.cta {
		margin-top: var(--space-xs);
		padding: 0.55rem var(--space-md);
		background: var(--accent-primary);
		color: #fff;
		border-radius: var(--radius);
		font-weight: 600;
		text-align: center;
	}

	@media (min-width: 768px) {
		.nav-links {
			display: flex;
		}
		.menu-button {
			display: none;
		}
	}
</style>
