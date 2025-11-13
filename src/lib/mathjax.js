import { browser } from "$app/environment";

let mathDocumentPromise;

export function loadMathDocument() {
	if (!browser) return Promise.resolve(null);
	if (!mathDocumentPromise) {
		mathDocumentPromise = Promise.all([
			import("mathjax-full/js/mathjax.js"),
			import("mathjax-full/js/input/tex.js"),
			import("mathjax-full/js/output/svg.js"),
			import("mathjax-full/js/adaptors/browserAdaptor.js"),
			import("mathjax-full/js/handlers/html.js"),
			import("mathjax-full/js/input/tex/AllPackages.js")
		]).then(
			([
				{ mathjax },
				{ TeX },
				{ SVG },
				{ browserAdaptor },
				{ RegisterHTMLHandler },
				{ AllPackages }
			]) => {
				const adaptor = browserAdaptor();
				RegisterHTMLHandler(adaptor);
				const tex = new TeX({
					packages: AllPackages
				});
				const svg = new SVG({
					fontCache: "local"
				});
				return mathjax.document(document, {
					InputJax: tex,
					OutputJax: svg
				});
			}
		);
	}
	return mathDocumentPromise;
}
