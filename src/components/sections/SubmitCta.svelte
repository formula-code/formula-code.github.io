<script>
	import { getContext } from "svelte";
	import SectionShell from "$components/sections/SectionShell.svelte";

	const PROBLEM_WEBHOOK = import.meta.env.VITE_DISCORD_PROBLEM_WEBHOOK || "";
	const MODEL_WEBHOOK = import.meta.env.VITE_DISCORD_MODEL_WEBHOOK || "";
	const INVITE_URL =
		import.meta.env.VITE_DISCORD_INVITE_URL || "https://discord.gg/tsK6BCsKK";

	const copy = getContext("copy") || {};
	const cfg = copy?.overview?.landingSections?.[5] || {};
	const sectionTitle = cfg.title || "Contribute";
	const sectionCaption =
		cfg.caption ||
		"FormulaCode is a living code optimization benchmark. Help us cover the long tail by opening a request for a particular data source or a particular model.";
	const sectionLinkLabel = cfg.linkLabel || "Join the FormulaCode Discord ↗";

	const BRAND_RED = 0xdc2418;
	const BRAND_BLUE = 0x1e3a8a;

	let openForm = null; // null | "problem" | "model"
	let status = { problem: "idle", model: "idle" }; // idle | sending | success | error
	let errors = { problem: "", model: "" };

	let problem = {
		repository: "",
		issueUrl: "",
		guidance: "",
		name: "",
		email: ""
	};
	let model = {
		modelName: "",
		agentFramework: "",
		link: "",
		guidance: "",
		name: "",
		email: ""
	};

	function toggle(which) {
		openForm = openForm === which ? null : which;
	}

	function buildEmbed(title, color, fields) {
		return {
			username: "FormulaCode website",
			embeds: [
				{
					title,
					color,
					fields: fields
						.filter((f) => f.value && String(f.value).trim())
						.map((f) => ({
							name: f.name,
							value: String(f.value).slice(0, 1024),
							inline: !!f.inline
						})),
					timestamp: new Date().toISOString()
				}
			]
		};
	}

	async function postWebhook(url, payload) {
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});
		if (!res.ok) {
			throw new Error(`Discord rejected the submission (HTTP ${res.status}).`);
		}
	}

	async function submitProblem(e) {
		e.preventDefault();
		errors.problem = "";
		if (!PROBLEM_WEBHOOK) {
			errors.problem =
				"Submissions are not configured. Set VITE_DISCORD_PROBLEM_WEBHOOK in .env.local.";
			return;
		}
		if (!problem.repository.trim() || !problem.issueUrl.trim()) {
			errors.problem = "Repository and issue URL are required.";
			return;
		}
		status.problem = "sending";
		try {
			const fromLine = [problem.name, problem.email]
				.filter(Boolean)
				.join(" · ");
			await postWebhook(
				PROBLEM_WEBHOOK,
				buildEmbed("New problem submission", BRAND_RED, [
					{ name: "Repository", value: problem.repository, inline: true },
					{ name: "Issue / PR URL", value: problem.issueUrl, inline: false },
					{
						name: "Why it's interesting",
						value: problem.guidance,
						inline: false
					},
					{ name: "From", value: fromLine, inline: false }
				])
			);
			status.problem = "success";
			problem = {
				repository: "",
				issueUrl: "",
				guidance: "",
				name: "",
				email: ""
			};
		} catch (err) {
			errors.problem = err.message || "Something went wrong. Please try again.";
			status.problem = "error";
		}
	}

	async function submitModel(e) {
		e.preventDefault();
		errors.model = "";
		if (!MODEL_WEBHOOK) {
			errors.model =
				"Submissions are not configured. Set VITE_DISCORD_MODEL_WEBHOOK in .env.local.";
			return;
		}
		if (!model.modelName.trim()) {
			errors.model = "Model name is required.";
			return;
		}
		status.model = "sending";
		try {
			const fromLine = [model.name, model.email].filter(Boolean).join(" · ");
			await postWebhook(
				MODEL_WEBHOOK,
				buildEmbed("New model submission", BRAND_BLUE, [
					{ name: "Model", value: model.modelName, inline: true },
					{
						name: "Agent framework",
						value: model.agentFramework,
						inline: true
					},
					{ name: "Link", value: model.link, inline: false },
					{
						name: "Why it's interesting",
						value: model.guidance,
						inline: false
					},
					{ name: "From", value: fromLine, inline: false }
				])
			);
			status.model = "success";
			model = {
				modelName: "",
				agentFramework: "",
				link: "",
				guidance: "",
				name: "",
				email: ""
			};
		} catch (err) {
			errors.model = err.message || "Something went wrong. Please try again.";
			status.model = "error";
		}
	}
</script>

<section class="submit-cta" id="contribute">
	<div class="container">
		<SectionShell
			title={sectionTitle}
			caption={sectionCaption}
			linkHref={INVITE_URL}
			linkLabel={sectionLinkLabel}
		/>

		<div class="cards">
			<article class="card">
				<header class="card-head">
					<h3 class="card-title">Have an interesting problem?</h3>
					<p class="card-desc">
						Paste a GitHub issue or PR that describes a real performance
						bottleneck. We'll evaluate it and, if it qualifies, add it to the
						benchmark.
					</p>
				</header>
				<button
					class="btn btn-primary"
					on:click={() => toggle("problem")}
					aria-expanded={openForm === "problem"}
					aria-controls="problem-form"
				>
					{openForm === "problem" ? "Close" : "Submit a problem"}
				</button>

				{#if openForm === "problem"}
					<form id="problem-form" class="form" on:submit={submitProblem}>
						<label class="field">
							<span class="label">Repository <span class="req">*</span></span>
							<input
								type="text"
								bind:value={problem.repository}
								placeholder="astropy/astropy"
								required
							/>
						</label>
						<label class="field">
							<span class="label"
								>Issue or PR URL <span class="req">*</span></span
							>
							<input
								type="url"
								bind:value={problem.issueUrl}
								placeholder="https://github.com/astropy/astropy/issues/13479"
								required
							/>
						</label>
						<label class="field">
							<span class="label"
								>Why is this interesting? <span class="opt">optional</span
								></span
							>
							<textarea
								bind:value={problem.guidance}
								rows="3"
								placeholder="Background, context, what would qualify as a good optimization…"
							></textarea>
						</label>
						<div class="row">
							<label class="field">
								<span class="label"
									>Your name <span class="opt">optional</span></span
								>
								<input
									type="text"
									bind:value={problem.name}
									placeholder="Ada Lovelace"
								/>
							</label>
							<label class="field">
								<span class="label"
									>Email <span class="opt">optional, for follow-up</span></span
								>
								<input
									type="email"
									bind:value={problem.email}
									placeholder="ada@example.com"
								/>
							</label>
						</div>
						<div class="form-foot">
							<button
								class="btn btn-primary"
								type="submit"
								disabled={status.problem === "sending"}
							>
								{status.problem === "sending" ? "Sending…" : "Send to Discord"}
							</button>
							{#if status.problem === "success"}
								<span class="status success"
									>Thanks — your submission landed in #submit-problems.</span
								>
							{:else if errors.problem}
								<span class="status error">{errors.problem}</span>
							{/if}
						</div>
					</form>
				{/if}
			</article>

			<article class="card">
				<header class="card-head">
					<h3 class="card-title">Have an interesting model?</h3>
					<p class="card-desc">
						Tell us about a model or agent framework you'd like to see on the
						leaderboard. We'll prioritize accordingly when running the next
						sweep.
					</p>
				</header>
				<button
					class="btn btn-primary-blue"
					on:click={() => toggle("model")}
					aria-expanded={openForm === "model"}
					aria-controls="model-form"
				>
					{openForm === "model" ? "Close" : "Submit a model"}
				</button>

				{#if openForm === "model"}
					<form id="model-form" class="form" on:submit={submitModel}>
						<label class="field">
							<span class="label">Model name <span class="req">*</span></span>
							<input
								type="text"
								bind:value={model.modelName}
								placeholder="claude-opus-4.7"
								required
							/>
						</label>
						<label class="field">
							<span class="label"
								>Agent framework <span class="opt">optional</span></span
							>
							<input
								type="text"
								bind:value={model.agentFramework}
								placeholder="terminus-2, openhands, custom…"
							/>
						</label>
						<label class="field">
							<span class="label"
								>Link to weights or API docs <span class="opt">optional</span
								></span
							>
							<input
								type="url"
								bind:value={model.link}
								placeholder="https://docs.anthropic.com/…"
							/>
						</label>
						<label class="field">
							<span class="label"
								>Why is this interesting? <span class="opt">optional</span
								></span
							>
							<textarea
								bind:value={model.guidance}
								rows="3"
								placeholder="What's distinctive about this model/agent?"
							></textarea>
						</label>
						<div class="row">
							<label class="field">
								<span class="label"
									>Your name <span class="opt">optional</span></span
								>
								<input
									type="text"
									bind:value={model.name}
									placeholder="Ada Lovelace"
								/>
							</label>
							<label class="field">
								<span class="label"
									>Email <span class="opt">optional, for follow-up</span></span
								>
								<input
									type="email"
									bind:value={model.email}
									placeholder="ada@example.com"
								/>
							</label>
						</div>
						<div class="form-foot">
							<button
								class="btn btn-primary-blue"
								type="submit"
								disabled={status.model === "sending"}
							>
								{status.model === "sending" ? "Sending…" : "Send to Discord"}
							</button>
							{#if status.model === "success"}
								<span class="status success"
									>Thanks — your submission landed in #submit-models.</span
								>
							{:else if errors.model}
								<span class="status error">{errors.model}</span>
							{/if}
						</div>
					</form>
				{/if}
			</article>
		</div>
	</div>
</section>

<style>
	.submit-cta {
		padding: var(--space-2xl) 0;
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-primary);
	}

	.container {
		max-width: 1080px;
		margin: 0 auto;
		padding: 0 var(--space-md);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
		gap: var(--space-lg);
	}

	.card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-lg, 12px);
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		box-shadow: var(--shadow);
	}

	.card-head {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.card-title {
		font-family: var(--sans);
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		margin: 0;
		color: var(--text-primary);
	}

	.card-desc {
		font-family: var(--sans);
		font-size: 0.875rem;
		line-height: 1.55;
		color: var(--text-muted);
		margin: 0;
	}

	.card .btn {
		align-self: flex-start;
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px dashed var(--border-primary);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.label {
		font-family: var(--sans);
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.req {
		color: var(--brand-red);
		font-weight: 700;
		margin-left: 2px;
	}

	.opt {
		color: var(--text-muted);
		font-weight: 400;
		font-size: 0.72rem;
		margin-left: 6px;
	}

	.field input,
	.field textarea {
		font-family: var(--sans);
		font-size: 0.9rem;
		padding: 8px 10px;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius);
		background: var(--bg-primary);
		color: var(--text-primary);
		width: 100%;
		transition:
			border-color 120ms,
			box-shadow 120ms;
	}

	.field input:focus,
	.field textarea:focus {
		outline: none;
		border-color: var(--brand-blue);
		box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
	}

	.field textarea {
		resize: vertical;
		min-height: 70px;
		font-family: var(--sans);
		line-height: 1.5;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}

	.form-foot {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		flex-wrap: wrap;
		margin-top: 4px;
	}

	.status {
		font-family: var(--sans);
		font-size: 0.82rem;
	}

	.status.success {
		color: #0f9d58;
	}

	.status.error {
		color: var(--brand-red);
	}

	@media (max-width: 600px) {
		.row {
			grid-template-columns: 1fr;
		}
	}
</style>
