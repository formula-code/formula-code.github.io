<script>
	import DemoFontsSample from "$components/demo/Demo.Fonts.Sample.svelte";
</script>

<div class="wrapper">
	<h1>Font Demo</h1>
	<p>
		This page demonstrates the fonts used in the FormulaCode project.
	</p>

	<div class="samples">
		<DemoFontsSample
			id="noto-sans"
			family="Noto Sans"
			size={16}
			text="The quick brown fox jumps over the lazy dog. 0123456789"
		/>

		<DemoFontsSample
			id="castoro"
			family="Castoro"
			size={16}
			text="The quick brown fox jumps over the lazy dog. 0123456789"
		/>
	</div>
</div>

<style>
	.wrapper {
		padding: 1rem;
		max-width: 60rem;
		margin: 0 auto;
	}

	.samples {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 2rem;
	}

	h1 {
		margin-top: 0;
	}
</style>