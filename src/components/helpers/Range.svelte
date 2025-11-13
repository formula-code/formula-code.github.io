<script>
	import { onMount, createEventDispatcher } from "svelte";
	import { get } from "svelte/store";
	import { thresholdAgentNum, thresholdOracleNum } from "$stores/misc.js";

	export let min = 0;
	export let max = 3;
	export let step = 0.05;
	export let label = "";
	export let metric;
	export let rangeW;
	export let rangeH;
	export let padding = 0;

	const dispatch = createEventDispatcher();

	export let controlsMetric;

	const STORE_BY_METRIC = {
		"agent/nop": thresholdAgentNum,
		"oracle/nop": thresholdOracleNum
	};

	const fallbackStore = thresholdAgentNum;
	let boundStore = fallbackStore;

	let normalizedId = "range-control";
	$: normalizedId = metric
		? `range-${metric.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase()}`
		: "range-control";

	let isAgentRange = false;
	$: isAgentRange = metric === "agent/nop";

	let rangeInput;
	let thumbOffset = 0;

	// Initialize value from the correct store
	$: initialMetricKey = controlsMetric ?? metric;
	$: initialStore = STORE_BY_METRIC[initialMetricKey] ?? fallbackStore;
	let value = get(initialStore) ?? 1;

	$: {
		const metricKey = controlsMetric ?? metric;
		const nextStore = STORE_BY_METRIC[metricKey] ?? fallbackStore;
		if (nextStore !== boundStore) {
			boundStore = nextStore;
			value = get(boundStore) ?? 1;
		}
		boundStore.set(value);
	}

	function snapValue(rawValue) {
		return Number((Math.round(rawValue / step) * step).toFixed(2));
	}

	function clampToBounds(val) {
		return Math.min(max, Math.max(min, val));
	}

	function handleInput(event) {
		const rawValue = +event.target.value;
		value = clampToBounds(snapValue(rawValue));
		dispatch("input", value);
	}

	// --- FIXED: thumbOffset now accounts for thumb width so the label lines up with the thumb center ---
	const THUMB_WIDTH = 40; // keep in sync with CSS --thumb-width

	function updateThumbOffset(currentValue) {
		if (!rangeInput) return;

		const rangeLength = rangeInput.clientWidth;
		const percent = (currentValue - min) / (max - min);

		// Visible track for the thumb center goes from THUMB_WIDTH/2 to rangeLength - THUMB_WIDTH/2
		const trackLength = Math.max(rangeLength - THUMB_WIDTH, 0);
		thumbOffset = percent * trackLength + THUMB_WIDTH / 2;
	}

	onMount(() => {
		updateThumbOffset(value);
	});

	$: updateThumbOffset(value);

	$: displayValue = `${(value ?? min).toFixed(1)}x`;
</script>

<svelte:window on:resize={() => updateThumbOffset(value)} />

<div
	class="range"
	id={normalizedId}
	style={`width: calc(${(isAgentRange ? rangeH : rangeW) ?? 0}px - ${padding}px);`}
>
	<input 
        type="range" 
        aria-label={label} 
        {min} 
        {max} 
        {step} 
        bind:value 
		bind:this={rangeInput}
        on:input={handleInput} />
	<div class="thumb-label" style={`left: ${thumbOffset}px;`}>
		<p>
			{displayValue}
		</p>
	</div>
</div>

<style>
	#range-agent-nop {
		position: absolute;
		transform: rotate(-90deg) translate(-100%, 0);
		transform-origin: left top;
		top: 4.25rem;
		left: calc(100% - 6rem);
		pointer-events: auto;
		overflow: visible;
	}

	#range-oracle-nop {
		position: absolute;
		pointer-events: auto;
		left: 78px;
		top: 10%;
	}

	.thumb-label {
		position: absolute;
		top: -36px;
		width: 60px;
		left: 0;
		transform: translateX(-50%);
		color: var(--wine-gold);
		border-radius: 4px;
		font-size: var(--18px);
		font-family: var(--sans);
		font-weight: bold;
		text-align: right;
		text-shadow: -2px -2px 0 var(--wine-black), 2px -2px 0 var(--wine-black), -2px 2px 0 var(--wine-black), 2px 2px 0 var(--wine-black);
		pointer-events: none; 
		display: flex;
		align-items: center;
		justify-content: center;
	}

	#range-agent-nop .thumb-label {
		transform: rotate(90deg) translate(0, 0);
		transform-origin: left top;
		top: 40px;
		justify-content: flex-start;
	}

	.thumb-label p {
		margin: 0;
		line-height: 1;
		text-shadow: -2px -2px 0 var(--wine-black), 2px -2px 0 var(--wine-black), -2px 2px 0 var(--wine-black), 2px 2px 0 var(--wine-black);
	}

	.range {
		--thumb-width: 36px;
		--track-height: calc(var(--thumb-width) / 8);
		--tick-font-size: 12px;
		margin-bottom: calc(var(--thumb-width) * 2);
	}

	input[type="range"] {
		display: block;
		width: 100%;
		height: var(--thumb-width); /* ensures consistent centering math */
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
		padding: 0;
		margin: 0;
		background: transparent;
		position: relative;
		outline: none;
	}

	input[type="range"]:disabled {
		cursor: not-allowed;
		opacity: 0.6;       
	}

	input[type="range"]::-webkit-slider-runnable-track {
		width: 100%;
		height: var(--track-height);
		background: transparent;
		border-radius: 4px;
	}

	/* ✅ FIXED: no more arbitrary margin-left/-18px; this centers the thumb on the track */
	#range-agent-nop input[type="range"]::-webkit-slider-thumb {
		height: var(--thumb-width);
		width: var(--thumb-width);
		appearance: none;
		-webkit-appearance: none;
		border-radius: 50%;
		background: url("/assets/images/range-vert.png");
		background-repeat: no-repeat;
		background-size: 100% 100%;
		border: 3px solid var(--wine-black);

		/* center vertically over the track */
		margin-top: calc((var(--track-height) - var(--thumb-width)) / 2);
		/* removed: margin-left; that was pushing it off-axis */
		position: relative;
	}

	#range-oracle-nop input[type="range"]::-webkit-slider-thumb {
		height: var(--thumb-width);
		width: var(--thumb-width);
		appearance: none;
		-webkit-appearance: none;
		border-radius: 50%;
		background: url("/assets/images/range-vert.png");
		background-repeat: no-repeat;
		background-size: 100% 100%;
		border: 3px solid var(--wine-black);

		/* same centering logic as vertical; keeps the thumb on the track axis */
		margin-top: calc((var(--track-height) - var(--thumb-width)) / 2);
		position: relative;
	}

	input[type="range"]::-moz-range-track {
		width: 100%;
		height: var(--track-height);
		background: var(--wine-med-gray);
		border-radius: 4px;
	}

	input[type="range"]::-moz-range-thumb {
		height: var(--thumb-width);
		width: var(--thumb-width);
		border-radius: 50%;
		appearance: none;
		background: url("/assets/images/range-vert.png");
		background-repeat: no-repeat;
		background-size: 100% 100%;
		border: 2px solid var(--wine-black);
	}

	input[type="range"]::-ms-track {
		width: 100%;
		height: var(--track-height);
		background: transparent;
		border-color: transparent;
		border-width: 16px 0;
		color: transparent;
	}

	input[type="range"]::-ms-fill-lower,
	input[type="range"]::-ms-fill-upper {
		background: var(--wine-med-gray);
		border-radius: 4px;
	}

	input[type="range"]::-ms-thumb {
		height: var(--thumb-width);
		width: var(--thumb-width);
		border-radius: 50%;
		background: url("/assets/images/range-vert.png");
		background-repeat: no-repeat;
		background-size: 100% 100%;
		border: 3px solid var(--wine-black);
	}

	@media(max-width: 700px) {
		#range-agent-nop {
			left: calc(100% - 2rem);
			top: 1rem;
		}

		#range-oracle-nop {
			left: 1rem;
			top: 2.5rem;
		}

		.thumb-label p {
			display: none;
		}
	}
</style>
