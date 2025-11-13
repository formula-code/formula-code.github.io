<script>
    // SVELTE
    import { getContext, onMount } from "svelte";

    // STORES
    import { agentSelected, agentCopyKey, chartScrollTrigger } from "$stores/misc.js";

    // COMPONENTS
    import Scrolly from "$components/helpers/Scrolly.svelte";
    import IntroAgents from "$components/Intro.Agents.svelte";
    import IntroHeadline from "$components/Intro.Headline.svelte";
    import IntroCDF from "$components/Intro.CDF.svelte";
    import Icon from "$components/helpers/Icon.svelte";
    import tapSVG from "$svg/touch.svg";
    import loadSVG from "$svg/loader-circle.svg";
    import inView from "$actions/inView.js";

    // VARIABLES
    const copy = getContext("copy") || {};
    const opening = copy.opening?.[0] || {}; // Agent selection copy
    const steps = Array.isArray(copy.steps) ? copy.steps : [];
    const postIntroSteps = Array.isArray(copy.postIntro) ? copy.postIntro : [];
    let scrollIndex;
    let scrollyContainer; // Reference to the Scrolly container
    let scrollY;
    let isMounted;
    let introAgentsRef;

    const METHODS_ANCHOR = "#methods";

    onMount(() => {
        setTimeout(() => {
            isMounted = true;
        }, 500)
    })

    $: {
        if (isMounted && typeof document !== "undefined") {
            document.body.style.overflowY = "scroll";
        }
    }

    // Get the agent-specific copy based on selection
    $: agentKey = $agentCopyKey;
    $: agentCopy = agentKey ? {
        initial: opening[agentKey] || "",
        advantage: opening[`${agentKey}Advantage`] || "",
        quad: opening[`${agentKey}Quad`] || ""
    } : null;

    $: {
        if (typeof scrollIndex === "number" && scrollIndex >= 4) {
            chartScrollTrigger.set(true);
        }
    }

    function decorateStepValue(html, index) {
        if (!html) return "";
        if (index === 1 || index === 2) {
            return html.replace(
                /<span class=instructions>([\s\S]*?)<\/span>/g,
                `<a class="methods-link" href="${METHODS_ANCHOR}"><span class="instructions">$1</span></a>`
            );
        }
        return html;
    }

    function makeInteractiveSpan(node, handler) {
        if (!node || typeof handler !== "function") return () => {};
        node.setAttribute("role", "button");
        node.setAttribute("tabindex", "0");
        const clickHandler = (event) => {
            event.preventDefault();
            handler();
        };
        const keyHandler = (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handler();
            }
        };
        node.addEventListener("click", clickHandler);
        node.addEventListener("keydown", keyHandler);
        return () => {
            node.removeEventListener("click", clickHandler);
            node.removeEventListener("keydown", keyHandler);
        };
    }

    function instructionsAction(node) {
        if (!node) return;
        const randomSpan = node.querySelector(".random-click");
        const destroyRandom = randomSpan ? makeInteractiveSpan(randomSpan, handleRandomPick) : () => {};
        return {
            destroy() {
                destroyRandom();
            }
        };
    }

    function handleRandomPick() {
        introAgentsRef?.selectRandomAgent();
    }
</script>

<svelte:window bind:scrollY={scrollY}/>

<section id="intro">
    <div class="sticky">
        <IntroHeadline scrollIndex={scrollIndex}/>
        <IntroAgents bind:this={introAgentsRef} {scrollIndex} {scrollyContainer}/>
        <IntroCDF {scrollIndex}/>
    </div>
    <Scrolly bind:value={scrollIndex} bind:container={scrollyContainer}>
        <!-- Step 0: Opening prompt -->
        <div class="step">
            <div class="step-inner">
                <p>
                    {@html opening.text}
                    {#if isMounted}
                        <span class="instructions" use:instructionsAction>
                            <span class="tap-icon">{@html tapSVG}</span>
                            {@html opening.instructions}
                        </span>
                    {:else}
                        <span class="instructions">
                            <span class="load-icon">{@html loadSVG}</span>
                            Loading...
                        </span>
                    {/if}
                </p>
            </div>
        </div>

        <!-- Step 1: Initial selection feedback -->
        <div class="step">
            <div class="step-inner">
                <p>
                    {#if agentCopy}
                        {@html agentCopy.initial}
                    {:else}
                        {@html steps[1]?.value || "Please select an agent above to continue."}
                    {/if}
                </p>
                <div class="scroll-hint">
                    <Icon name="chevron-down" size={"24px"} rotation={0}/>
                </div>
            </div>
        </div>

        <!-- Remaining steps from copy.steps -->
        {#each (steps || []).slice(2, 7) as step, i}
            {@const absoluteIndex = i + 1}
            {#if step && step.type === "text"}
                <div class="step">
                    <div class="step-inner">
                        <p>{@html decorateStepValue(step.value, absoluteIndex)}</p>
                    </div>
                </div>
            {/if}
        {/each}
    </Scrolly>
</section>

<section id="post-intro"
    use:inView={{ bottom: 0 }}
    on:enter={() => chartScrollTrigger.set(true)}>
    {#each postIntroSteps as graf, i}
        {#if graf?.type === "text"}
            <p class="prose">{@html graf.value}</p>
        {/if}
    {/each}
</section>

<style>
    #intro, #post-intro {
        width: 100%;
        position: relative;
    }

    #post-intro {
        width: 100%;
        max-width: 720px;
        margin: 4rem auto;
        z-index: 900;
    }

    .prose {
        color: var(--wine-tan);
        font-size: var(--18px);
        line-height: 1.65;
    }

    .sticky {
        width: 100%;
        height: 100svh;
		position: sticky;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
		top: 0;
        left: 0;
		transition: all var(--1000ms);
        z-index: 1;
        overflow: hidden;
	}

	.step {
		height: 100vh;
        z-index: 1000;
        max-width: 550px;
        margin: 0 auto;
        opacity: 1;
        pointer-events: none;
        z-index: 1000;
	}

    .step:first-of-type {
        margin-top: calc(-100svh + 6rem);
    }

    .step-inner {
        background: rgba(24,26,31,0.98);
        padding: 2rem; 
        border: 1px solid var(--wine-dark-gray);
        border-radius: 3px;
        box-shadow: -4px 4px 10px rgb(17, 17, 17, 0.5);
        position: relative;
    }

    .step p {
        text-align: left;
        max-width: 600px;
        color: var(--wine-tan);
        font-size: var(--18px);
        line-height: 1.65;
        background: none;
        z-index: 1000;
        margin: 0;
        pointer-events: auto;
    }

    .scroll-hint {
        width: 3rem;
        height: 3rem;
        background: var(--wine-gold);
        position: absolute;
        bottom: -1.5rem;
        left: 50%;
        transform: translate(-50%, 0);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: bounceUp 1s infinite;
    }

    :global(.scroll-hint .icon) {
        margin-top: 6px;
    }

    :global(.instructions) {
        font-family: var(--sans);
        color: var(--wine-gold) !important;
        font-size: var(--16px) !important;
        font-weight: 700;
        position: relative;
        display: block;
        padding: 1rem 0;
    }

    :global(a.methods-link span) {
        color: var(--wine-gold) !important;
        text-decoration: underline;
    }

    :global(a.methods-link span) {
        color: var(--wine-gold) !important;
    }

    :global(a.methods-link span:hover) {
        color: var(--wine-dark-gold) !important;
    }

    .instructions span {
        color: var(--wine-gold);
    }

    .tap-icon{
        display: inline-block;
        position: relative;
        top: 0.5rem;
        width: 1.75rem;
        height: 1.75rem;
    }

    .load-icon {
        display: inline-block;
        position: relative;
        top: 0.5rem;
        width: 1.5rem;
        height: 1.75rem;
        animation: spin360 1s linear infinite;
    }

    @keyframes spin360 {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    :global(.tap-icon svg, .load-icon svg) {
        width: 100%;
        height: 100%;
    }

    :global(.tap-icon svg path) {
        fill: var(--wine-gold);
        stroke-width: 3px;
    }

    :global(.load-icon svg path) {
        stroke: var(--wine-gold);
        stroke-width: 1px;
    }

    :global(.prompt) {
        font-family: var(--mono);
        font-size: var(--16px);
        background: rgba(154,150,142, 1);
        color: var(--wine-black);
        padding: 0.25rem;
        border-radius: 3px;
        box-decoration-break: clone;
    }

    :global(.selected-agent-circle-span) {
        font-family: var(--sans);
        font-weight: 700;
        padding: 0.25rem;
        border-radius: 3px;
        border: 3px solid var(--wine-gold);
        box-decoration-break: clone;
    }

    :global(.step p a) {
        color: var(--wine-tan);
    }

    :global(.step .bold) {
        font-family: var(--sans);
    }

    :global(.step p a:hover) {
        color: var(--wine-red);
    }

    @keyframes bounceUp {
        0%       { bottom:-24px; }
        50%      { bottom:-28px; }
        100%     { bottom:-24px; }
    }

    @media(max-width: 700px) {
        .step-inner {
            padding: 1rem;
        }
        .step p {
            font-size: var(--16px);
        }

        :global(.prompt) {
            font-size: var(--14px);
        }

        #post-intro {
            padding: 0 1rem;
        }

        .prose {
            font-size: var(--16px);
        }
    }
</style>
