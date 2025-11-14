<script>
	import { onMount, tick } from "svelte";
	import { navAgent, currAgentSlide, uniqueAgents } from "$stores/misc.js";
	import { formatAgentDisplayName } from "$utils/benchmarkData.js";

	// Use dynamic agents from store instead of hardcoded list
	$: agents = $uniqueAgents;

	let nav; // Reference to the <nav> element
	let isDragging = false;
	let startX = 0;
	let scrollLeft = 0;
	let userDragged = false; // Tracks if the user manually dragged

	// Handle Mouse Dragging
	function handleMouseDown(e) {
		isDragging = true;
		userDragged = true; // User manually moved nav, pause auto-centering
		startX = e.pageX - nav.offsetLeft;
		scrollLeft = nav.scrollLeft;
		nav.classList.add("dragging");
	}

	function handleMouseMove(e) {
		if (!isDragging) return;
		e.preventDefault();
		const x = e.pageX - nav.offsetLeft;
		const walk = (x - startX) * 1.5; // Adjust speed factor
		nav.scrollLeft = scrollLeft - walk;
	}

	function handleMouseUp() {
		isDragging = false;
		nav.classList.remove("dragging");
	}

	function handleMouseLeave() {
		isDragging = false;
		nav.classList.remove("dragging");
	}

	// Mobile Swipe Support
	let touchStartX = 0;
	let touchScrollLeft = 0;

	function handleTouchStart(e) {
		userDragged = true; // User manually swiped
		touchStartX = e.touches[0].pageX;
		touchScrollLeft = nav.scrollLeft;
	}

	function handleTouchMove(e) {
		const touchX = e.touches[0].pageX;
		const walk = (touchX - touchStartX) * 1.5;
		nav.scrollLeft = touchScrollLeft - walk;
	}

	// Center the Active Item
	async function centerActiveElement() {
        await tick(); // Ensure DOM updates before measuring
        if (!nav || userDragged) return; // Skip centering if user is dragging/swiping

        const activeEl = nav.querySelector(".isActive");
        if (!activeEl) return;

        const navRect = nav.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();

        // Calculate the current scroll position
        const navCenter = navRect.left + navRect.width / 2;
        const activeCenter = activeRect.left + activeRect.width / 2;

        // Offset needed to move the active element to the center
        const offset = activeCenter - navCenter;

        // Smoothly scroll the navigation
        nav.scrollTo({ left: nav.scrollLeft + offset, behavior: "smooth" });
    }

	// Initialize event listeners and center first item
	onMount(() => {
		// Center first item on page load
		centerActiveElement();

		// Add drag/swipe event listeners
		nav.addEventListener("mousedown", handleMouseDown);
		nav.addEventListener("mouseleave", handleMouseLeave);
		nav.addEventListener("mouseup", handleMouseUp);
		nav.addEventListener("mousemove", handleMouseMove);

		// Mobile Touch Support
		nav.addEventListener("touchstart", handleTouchStart);
		nav.addEventListener("touchmove", handleTouchMove);
	});

    $: centerActiveElement($navAgent);

    function handleClick(agent, i) {
        navAgent.set(agent);
        currAgentSlide.set(i);
    }
 </script>

<nav bind:this={nav} id="agent-nav">
    {#each agents as agent, i}
        <button class="agent-group"
            class:isActive={agent == agents[$currAgentSlide]}
            on:click={() => handleClick(agent, i)}
            >
            <div class="label-wrapper">
                <p>{formatAgentDisplayName(agent)}</p>
            </div>
        </button>
    {/each}
</nav>

<style>
    nav {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        position: sticky;
        top: 0;
        display: flex;
        flex-direction: row;
        min-height: 5rem;
        height: auto;
        pointer-events: auto;
        cursor: pointer;
        z-index: 1000;
        background: rgba(24,26,31,1);
        border-bottom: 1px solid var(--wine-dark-gray);
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE and Edge */
    }

    /* Hide scrollbar for Chrome, Safari and Opera */
    nav::-webkit-scrollbar {
        display: none;
    }

    .agent-group {
        min-width: 140px;
        display: flex;
        flex-direction: column;
        align-items: center;
        display: flex;
        transform: scale(1);
		transition: all var(--250ms);
        pointer-events: auto;
        cursor: pointer;
        margin: 0 1rem;
        padding: 1.5rem 0 1rem 0;
    }

    button {
        background: transparent;
    }

    .agent-group:hover {
        opacity: 1;
        transform: scale(1.1);
        transition: all var(--250ms);
    }

    .label-wrapper {
        padding: 0.5rem 1rem;
        background: var(--wine-dark-tan);
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }

    .isActive .label-wrapper {
        background: var(--wine-tan);
    }

    p {
		font-family: var(--sans);
		text-align: center;
		width: 100%;
		font-size: var(--12px);
		color: var(--wine-black);
        margin: 0;
        line-height: 1.25;
        user-select: none;
        pointer-events: none;
        -webkit-user-drag: none;
        user-select: none;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        font-weight: 700;
        white-space: nowrap;
	}

    .isActive p {
        color: var(--wine-black);
    }

    :global(.isActive) {
        opacity: 1 !important;
        transform: scale(1.15) !important;
        transition: all var(--250ms);
    }

    /* Flex spacers for centering when content fits */
    nav::before,
    nav::after {
        content: "";
        flex: 1 0 0;
    }

    .agent-group {
        flex: 0 0 auto; /* don't stretch cards */
        scroll-snap-align: center; /* snap each card to center */
    }

    @media (max-width: 700px) {
        nav {
            min-height: 4rem;
            justify-content: flex-start; /* Remove centering on mobile to avoid white space */
        }

        /* Remove flex spacers on mobile */
        nav::before,
        nav::after {
            display: none;
        }

		.agent-group {
            min-width: 100px;
            margin: 0 0.5rem;
            padding: 1rem 0 0.75rem 0;
        }

        .label-wrapper {
            padding: 0.4rem 0.75rem;
        }

        p {
            font-size: var(--10px);
        }

        :global(.isActive) {
            opacity: 1 !important;
            transform: scale(1.1) !important;
            transition: all var(--250ms);
        }
	}

</style>
