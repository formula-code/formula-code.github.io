<script>
	import { createEventDispatcher } from "svelte";

	export let minDate = null; // JS Date
	export let maxDate = null; // JS Date
	export let value = null; // JS Date (current)
	export let rowsIncluded = null; // optional readout

	const dispatch = createEventDispatcher();

	// Build a list of month-boundary dates between minDate and maxDate,
	// always including maxDate itself as the final step.
	$: months = buildMonths(minDate, maxDate);
	$: index = value && months.length ? nearestIndex(months, value) : months.length - 1;

	function buildMonths(a, b) {
		if (!(a instanceof Date) || !(b instanceof Date)) return [];
		if (a.getTime() > b.getTime()) return [];
		const out = [];
		const cursor = new Date(a.getFullYear(), a.getMonth(), 1);
		const end = new Date(b.getFullYear(), b.getMonth(), 1);
		while (cursor.getTime() <= end.getTime()) {
			out.push(new Date(cursor));
			cursor.setMonth(cursor.getMonth() + 1);
		}
		// Append the exact max date so the slider reaches "latest".
		if (out.length === 0 || out[out.length - 1].getTime() < b.getTime()) {
			out.push(new Date(b));
		}
		return out;
	}

	function nearestIndex(list, target) {
		const t = target.getTime();
		for (let i = list.length - 1; i >= 0; i--) {
			if (list[i].getTime() <= t) return i;
		}
		return 0;
	}

	function formatLabel(d) {
		if (!(d instanceof Date)) return "—";
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		return `${y}-${m}`;
	}

	function handleInput(e) {
		const i = Number(e.target.value);
		if (!Number.isFinite(i) || !months[i]) return;
		dispatch("change", months[i]);
	}
</script>

{#if months.length > 1}
	<div class="tts">
		<div class="head">
			<div class="eyebrow">
				<span class="slash">//</span> TIME TRAVEL
			</div>
			<div class="readout">
				<span class="muted">merged on or before</span>
				<span class="value mono">{formatLabel(months[index])}</span>
				{#if rowsIncluded !== null}
					<span class="muted">·</span>
					<span class="tasks mono">{rowsIncluded} tasks</span>
				{/if}
			</div>
		</div>

		<input
			type="range"
			min="0"
			max={months.length - 1}
			step="1"
			value={index}
			on:input={handleInput}
			aria-label="Select cutoff date"
		/>

		<div class="rail-labels mono">
			<span>{formatLabel(months[0])}</span>
			<span>{formatLabel(months[months.length - 1])}</span>
		</div>
	</div>
{:else}
	<div class="tts placeholder">
		<span class="eyebrow mono">// TIME TRAVEL</span>
		<span class="muted">
			coming soon — waiting on <code class="mono">merged_at</code> in the dataset.
		</span>
	</div>
{/if}

<style>
	.tts {
		border: 1px solid var(--border-primary);
		background: var(--bg-secondary);
		border-radius: 6px;
		padding: 1.25rem 1.4rem 1.1rem;
		margin: 0 0 2.5rem 0;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.9rem;
		flex-wrap: wrap;
	}

	.eyebrow {
		font-family: var(--mono);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--text-secondary);
	}

	.eyebrow .slash {
		color: var(--accent-secondary);
	}

	.readout {
		display: inline-flex;
		align-items: baseline;
		gap: 0.5rem;
		font-family: var(--sans);
		font-size: 0.9rem;
		color: var(--text-secondary);
		flex-wrap: wrap;
	}

	.readout .value {
		font-size: 1rem;
		color: var(--text-primary);
		font-weight: 600;
	}

	.readout .tasks {
		color: var(--text-secondary);
		font-size: 0.85rem;
	}

	.muted {
		color: var(--text-muted);
	}

	input[type="range"] {
		width: 100%;
		-webkit-appearance: none;
		appearance: none;
		height: 4px;
		background: var(--bg-tertiary);
		border-radius: 999px;
		outline: none;
		cursor: pointer;
	}

	input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--accent-secondary);
		border: 2px solid var(--bg-primary);
		box-shadow: 0 0 0 1px var(--border-strong);
		cursor: grab;
	}

	input[type="range"]::-webkit-slider-thumb:active {
		cursor: grabbing;
	}

	input[type="range"]::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--accent-secondary);
		border: 2px solid var(--bg-primary);
		box-shadow: 0 0 0 1px var(--border-strong);
		cursor: grab;
	}

	.rail-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 0.45rem;
		font-size: 0.7rem;
		color: var(--text-muted);
		letter-spacing: 0.05em;
	}

	.placeholder {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.9rem 1.1rem;
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.placeholder code {
		color: var(--text-primary);
		background: var(--bg-tertiary);
		padding: 0.1rem 0.35rem;
		border-radius: 3px;
	}
</style>
