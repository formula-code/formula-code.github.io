<script>
	import { getContext } from "svelte";
	import IntroAgents from "$components/intro/Intro.Agents.svelte";
	import IntroCDF from "$components/intro/Intro.CDF.svelte";
	import { agentSelected, agentCopyKey } from "$stores/misc.js";

	const copy = getContext("copy") || {};
	const opening = copy.opening?.[0] || {};
	const steps = Array.isArray(copy.steps) ? copy.steps : [];
	const postIntroSteps = Array.isArray(copy.postIntro) ? copy.postIntro : [];

	$: agentKey = $agentCopyKey;
	$: agentCopy = agentKey
		? {
				initial: opening[agentKey] || "",
				advantage: opening[`${agentKey}Advantage`] || "",
				quad: opening[`${agentKey}Quad`] || ""
			}
		: null;

	// Pull the dataset-context steps (2-6) — the agent-selection feedback in
	// step 1 is reflected by the agent-specific copy below.
	$: contextSteps = (steps || [])
		.slice(2, 7)
		.filter((s) => s && s.type === "text");
</script>

<section class="intro2" id="intro">
	<div class="prompt">
		<h2>{@html opening.text}</h2>
	</div>

	<div class="agents-shell">
		<IntroAgents />
		<p class="agents-hint">
			{#if agentCopy}
				Comparing {agentKey === "claude"
					? "Claude"
					: agentKey === "gpt5"
						? "GPT-5"
						: "the Human expert"} against the rest. Pick a different agent
				above to switch the lens.
			{:else}
				Pick an agent to anchor the comparison.
			{/if}
		</p>
	</div>

	<div class="split">
		<div class="copy-col">
			{#if agentCopy}
				<div class="agent-blurb">
					<p>{@html agentCopy.initial}</p>
				</div>
			{/if}

			{#if contextSteps.length}
				<ol class="context-steps">
					{#each contextSteps as step, i}
						<li>
							<span class="step-num">{i + 1}</span>
							<p>{@html step.value}</p>
						</li>
					{/each}
				</ol>
			{/if}
		</div>

		<div class="cdf-col">
			<div class="cdf-frame">
				<IntroCDF scrollIndex={5} />
			</div>
			<p class="cdf-caption">
				The cumulative distribution of workload speedups, by agent. The
				expert Human curve sits noticeably further right than the LLM agents
				on the bulk of workloads.
			</p>
		</div>
	</div>

	{#if postIntroSteps.length}
		<div class="post">
			{#each postIntroSteps as graf}
				{#if graf?.type === "text"}
					<p>{@html graf.value}</p>
				{/if}
			{/each}
		</div>
	{/if}
</section>

<style>
	.intro2 {
		max-width: 1180px;
		margin: 0 auto;
		padding: 4rem var(--space-md) 2rem;
	}

	.prompt {
		max-width: 720px;
		margin: 0 auto 2rem;
		text-align: center;
	}

	.prompt h2 {
		font-family: var(--sans);
		font-size: clamp(1.2rem, 2.6vw, 1.6rem);
		font-weight: 500;
		line-height: 1.4;
		color: var(--text-primary);
		margin: 0;
		letter-spacing: -0.01em;
	}

	.agents-shell {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-bottom: 3rem;
	}

	:global(.intro2 .agent-stage) {
		position: relative;
		bottom: auto;
		height: auto !important;
		padding: 0 !important;
		gap: 1rem !important;
	}

	:global(.intro2 .agent-box) {
		opacity: 1 !important;
		transform: translateY(0) !important;
		padding: 1.25rem 1rem !important;
	}

	:global(.intro2 .agent-icon) {
		width: 44px !important;
		height: 44px !important;
		margin: 0 auto 0.75rem !important;
	}

	.agents-hint {
		font-family: var(--sans);
		font-size: 0.9rem;
		color: var(--text-muted);
		text-align: center;
		margin: 1rem 0 0;
		max-width: 460px;
	}

	.split {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		gap: 2.5rem;
		align-items: start;
		margin-bottom: 3rem;
	}

	.copy-col {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-width: 0;
	}

	.agent-blurb {
		padding: 1.25rem 1.4rem;
		border-left: 3px solid var(--brand-blue, var(--accent-primary));
		background: var(--bg-secondary);
		border-radius: 0 var(--radius) var(--radius) 0;
	}

	.agent-blurb :global(p) {
		font-family: var(--sans);
		font-size: 1rem;
		line-height: 1.6;
		color: var(--text-primary);
		margin: 0;
	}

	.context-steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.context-steps li {
		display: grid;
		grid-template-columns: 28px minmax(0, 1fr);
		gap: 0.85rem;
		align-items: start;
	}

	.step-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		font-family: var(--mono);
		font-size: 0.7rem;
		color: var(--text-muted);
		border: 1px solid var(--border-primary);
		border-radius: 999px;
		flex: 0 0 auto;
		margin-top: 2px;
	}

	.context-steps li :global(p) {
		font-family: var(--sans);
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--text-secondary);
		margin: 0;
	}

	.cdf-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
	}

	.cdf-frame {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		max-height: 540px;
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		overflow: hidden;
	}

	:global(.cdf-frame .cdf-container) {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(1);
		opacity: 1;
	}

	.cdf-caption {
		font-family: var(--sans);
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--text-muted);
		margin: 0;
		text-align: center;
	}

	.post {
		max-width: 760px;
		margin: 1.5rem auto 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.post :global(p) {
		font-family: var(--sans);
		font-size: 1rem;
		line-height: 1.65;
		color: var(--text-primary);
		margin: 0;
	}

	@media (max-width: 900px) {
		.split {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (max-width: 560px) {
		.intro2 {
			padding-top: 2rem;
		}
	}
</style>
