<script>
	import { getContext } from "svelte";
	import { scaleCanvas } from "layercake";

	const { data, xGet, yGet, width, height } = getContext("LayerCake");

	const { ctx } = getContext("canvas");

	export let r = 4;
	export let fill = "#ccc";
	export let stroke = "#000";
	export let strokeWidth = 0;

	$: if ($ctx) {
		scaleCanvas($ctx, $width, $height);
		$ctx.clearRect(0, 0, $width, $height);

		// Resolve CSS variables if present
		const resolveColor = (c) => {
			if (typeof c === "string" && c.startsWith("var(")) {
				const varName = c.match(/var\(([^)]+)\)/)[1];
				return getComputedStyle(document.documentElement)
					.getPropertyValue(varName)
					.trim();
			}
			return c;
		};

		const resolvedFill = resolveColor(fill);
		const resolvedStroke = resolveColor(stroke);

		$data.forEach((d) => {
			$ctx.beginPath();
			$ctx.arc($xGet(d), $yGet(d), r, 0, 2 * Math.PI, false);
			$ctx.lineWidth = strokeWidth;
			$ctx.strokeStyle = resolvedStroke;
			$ctx.stroke();
			$ctx.fillStyle = resolvedFill;
			$ctx.fill();
		});
	}
</script>
