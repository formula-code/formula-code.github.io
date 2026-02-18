<script>
	import { theme, toggleTheme } from "$stores/theme.js";
	import { Sun, Moon } from "lucide-svelte";
	import { onMount } from "svelte";

	let resolvedTheme;

	function updateResolvedTheme() {
		if ($theme === "system") {
			if (typeof window !== "undefined") {
				resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)")
					.matches
					? "dark"
					: "light";
			} else {
				resolvedTheme = "dark"; // fallback
			}
		} else {
			resolvedTheme = $theme;
		}
	}

	$: ($theme, updateResolvedTheme());

	onMount(() => {
		updateResolvedTheme();
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => {
			if ($theme === "system") updateResolvedTheme();
		};
		media.addEventListener("change", handler);
		return () => media.removeEventListener("change", handler);
	});
</script>

<button
	class="theme-toggle"
	on:click={toggleTheme}
	aria-label="Toggle theme"
	title="Toggle theme"
>
	{#if resolvedTheme === "light"}
		<Moon size={20} />
	{:else}
		<Sun size={20} />
	{/if}
</button>

<style>
	.theme-toggle {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 50%;
		color: var(--text-primary, currentColor);
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			color 0.2s,
			background-color 0.2s;
	}

	.theme-toggle:hover {
		background-color: var(--bg-tertiary);
		color: var(--accent-primary);
	}

	:global([data-theme="light"]) .theme-toggle:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}
</style>
