import adapterStatic from "@sveltejs/adapter-static";
import sveltePreprocess from "svelte-preprocess";
import autoprefixer from "autoprefixer";

const preprocess = sveltePreprocess({
	postcss: {
		plugins: [autoprefixer]
	}
});

const config = {
	preprocess,
	kit: {
		adapter: adapterStatic({
			fallback: "200.html"
		}),
		prerender: {
			// /docs/eval and /docs/data are vendored MkDocs sites copied into
			// static/docs/ at build time. The prerenderer follows links from
			// the DocsPage and 404s because there's no Svelte route. Ignore
			// those — the static adapter passes the files through unchanged.
			handleHttpError: ({ path, message }) => {
				if (path.startsWith("/docs/eval") || path.startsWith("/docs/data")) {
					return;
				}
				throw new Error(message);
			}
		}
	},
	vitePlugin: {
		// experimental: {
		// 	inspector: { holdMode: true },
		// }
	}
};

export default config;
