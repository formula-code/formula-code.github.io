<script>
    // SVELTE
    import { getContext, onMount } from "svelte";
    import { cubicInOut } from 'svelte/easing';
    import { interpolateString } from 'd3-interpolate';

    //VARIABLES
    const copy = getContext("copy");
    const startD = `M0,0.2 C0.15,0 0.35,0.42 0.6,0.2 C0.85,0 1.05,0.42 1.2,0.2 L1.2,1 L0,1 Z`;
    const endD = `M0,0.3 C0.15,0.05 0.35,0.55 0.6,0.3 C0.85,0.05 1.05,0.55 1.2,0.3 L1.2,1 L0,1 Z`;

    let animationFrame;
    let pathEl;
    let direction = 1;
    let startTime;

    // INTERACTIVE FUNCTIONS
    function animateWave(timestamp) {
        if (!startTime) startTime = timestamp;
        const duration = 4000; // 4s forward, 4s back

        let progress = (timestamp - startTime) / duration;

        if (progress >= 1) {
            direction *= -1;
            startTime = timestamp;
            progress = 0;
        }

        const eased = cubicInOut(progress);
        const interp = interpolateString(direction === 1 ? startD : endD, direction === 1 ? endD : startD);
        const newD = interp(eased);
        pathEl.setAttribute('d', newD);

        animationFrame = requestAnimationFrame(animateWave);
    }

    function startWaveAnimation() {
        window.cancelAnimationFrame(animationFrame);
        startTime = null;
        animationFrame = window.requestAnimationFrame(animateWave);
    }

    // ONMOUNT FUNCTIONS
    onMount(() => {
        pathEl = document.querySelector("#wave-path");
            if (pathEl) {
                startWaveAnimation();
            } 
    })
</script>

<!-- <div class="headline-wrapper">
    <div class="head-container" class:hidden={scrollIndex == "exit"}>
        <h1 class:highlight={scrollIndex == 8}>The pour-igin<br> of species</h1>
        <h1 style="clip-path: url(#wave-clip)" aria-hidden="true" class:highlight={scrollIndex == 8}>The pour-igin<br> of species</h1>
    </div>
    <div class="byline" style="opacity: {scrollIndex == 8 ? 1 : 0}">
        <p class="strikethrough">By {copy.bylineFake}<span class="strike-line" class:animate={scrollIndex == 8 || scrollIndex == "exit"}></span></p>
        <p>By {@html copy.byline}</p>
    </div>
</div>
<svg width="0" height="0">
    <defs>
        <clipPath id="wave-clip" clipPathUnits="objectBoundingBox">
        <path 
            id="wave-path" 
            d="M0,0.2 C0.15,0 0.35,0.42 0.6,0.2 C0.85,0 1.05,0.42 1.2,0.2 L1.2,1 L0,1 Z" 
        />
        </clipPath>
    </defs>
</svg> -->
