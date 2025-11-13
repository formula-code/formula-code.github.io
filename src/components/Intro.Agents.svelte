<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { agentSelected, uniqueAgents, agentStats } from "$stores/misc.js";
  import claudeSVG from "$svg/claude.svg";
  import openaiSVG from "$svg/openai.svg";
  import humanSVG from "$svg/human.svg";

  export let scrollIndex;
  export let scrollyContainer;

  const dispatch = createEventDispatcher();

  const pretty = str => {
    if (!str) return "";
    const lower = str.toLowerCase();
    if (lower === "gpt-5") return "GPT‑5";
    if (lower === "claude") return "Claude Sonnet 4.0";
    if (lower === "oracle") return "Oracle (Human)";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const prettyFramework = str => {
    if (!str) return "";
    return str.replace(/[-_]/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getIcon = (model) => {
    const lower = model.toLowerCase();
    if (lower === "gpt-5") return openaiSVG;
    if (lower === "claude") return claudeSVG;
    if (lower === "oracle") return humanSVG;
    return null;
  };

  let readyToAnimate = false;
  onMount(() => {
    const timer = setTimeout(() => {
      readyToAnimate = true;
    }, 50);
    return () => clearTimeout(timer);
  });

  $: agents = ($uniqueAgents || [])
    .slice(0, 3)
    .map((id) => {
      if (!id) return null;
      const [framework = "", model = ""] = id.split(",").map(part => part?.trim() ?? "");

      return {
        id,
        label: pretty(model),
        framework: prettyFramework(framework),
        icon: getIcon(model)
      };
    })
    .filter(Boolean);

  $: visible = scrollIndex === undefined || scrollIndex <= 1;
  $: selectedId = $agentSelected;

  function handleSelect(agent) {
    agentSelected.set(agent.id);
    dispatch("agentSelected", agent);
    scrollToSecondStep();
  }

  function scrollToSecondStep() {
    if (typeof window === "undefined" || !scrollyContainer) return;
    const steps = scrollyContainer.querySelectorAll(".step");
    if (!steps?.[1]) return;
    const top = steps[1].getBoundingClientRect().top + window.pageYOffset;
    const offset = top - window.innerHeight * 0.1;
    window.scrollTo({ top: offset, behavior: "smooth" });
  }

  export function selectRandomAgent() {
    if (!agents || !agents.length) return;
    const randomIndex = Math.floor(Math.random() * agents.length);
    const randomAgent = agents[randomIndex];
    if (randomAgent) {
      handleSelect(randomAgent);
    }
  }
</script>

{#if visible && agents.length}
  <div class="agent-stage" aria-label="Agent selection">
    {#each agents as agent, idx}
      <button
        class="agent-box"
        class:selected={selectedId === agent.id}
        class:faded={selectedId && selectedId !== agent.id}
        class:visible={readyToAnimate}
        style={`--delay: ${idx * 100}ms;`}
        on:click={() => handleSelect(agent)}
        aria-pressed={selectedId === agent.id}
        aria-label={`Select ${agent.label}`}
      >
        {#if agent.icon}
          <div class="agent-icon">
            {@html agent.icon}
          </div>
        {/if}
        <p class="agent-name">{agent.label}</p>
        <p class="agent-framework">{agent.framework}</p>
      </button>
    {/each}
  </div>
{/if}

<style>
  .agent-stage {
    position: relative;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 80svh;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    padding: 0 2rem;
    pointer-events: none;
    z-index: 2;
  }

  .agent-box {
    width: clamp(200px, 25vw, 300px);
    padding: 2rem 1.5rem;
    border-radius: 12px;
    border: 2px solid var(--wine-dark-gray);
    background: rgba(24, 26, 31, 0.95);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    pointer-events: auto;
    cursor: pointer;
    opacity: 0;
    transform: translateY(20px);
    transition: all var(--400ms) ease;
    transition-delay: var(--delay);
  }

  .agent-box.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .agent-box:hover {
    border-color: var(--wine-gold);
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }

  .agent-box.selected {
    border-color: var(--wine-gold);
    box-shadow: 0 0 20px rgba(247, 185, 86, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .agent-box.faded {
    opacity: 0.3;
  }

  .agent-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .agent-icon :global(svg) {
    width: 100%;
    height: 100%;
    color: var(--wine-tan);
  }

  .agent-name {
    margin: 0;
    font-family: var(--sans);
    font-weight: 700;
    font-size: var(--20px);
    color: var(--wine-tan);
    line-height: 1.2;
  }

  .agent-framework {
    margin: 0.5rem 0 0;
    font-family: var(--mono);
    font-size: var(--12px);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--wine-gold);
  }

  @media (max-width: 900px) {
    .agent-stage {
      gap: 1rem;
      padding: 0 1rem;
    }

    .agent-box {
      width: 30vw;
      min-width: 160px;
      padding: 1.5rem 1rem;
    }

    .agent-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
    }

    .agent-name {
      font-size: var(--16px);
    }
  }

  @media (max-width: 700px) {
    .agent-stage {
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      height: auto;
      min-height: 60svh;
      padding: 2rem;
    }

    .agent-box {
      width: 80vw;
      max-width: 300px;
    }

    .agent-icon {
      width: 56px;
      height: 56px;
    }
  }
</style>
