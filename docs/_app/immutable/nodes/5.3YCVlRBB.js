import {
	s as Q,
	n as N,
	d as y,
	r as ae,
	a as j,
	A as q,
	b as l,
	i as U,
	J as le,
	C as re,
	m as E,
	o as ie,
	c as _,
	u as z,
	e as S,
	f as A,
	q as M,
	g,
	v as k,
	t as F,
	x as ce,
	k as fe
} from "../chunks/BEinvJTW.js";
import {
	S as W,
	i as X,
	d as B,
	a as J,
	t as K,
	m as R,
	e as Y,
	b as G
} from "../chunks/DuBysls-.js";
import { b as de } from "../chunks/CS7aBpam.js";
async function ue(s) {
	if ("clipboard" in navigator) await navigator.clipboard.writeText(s);
	else {
		const e = document.createElement("input");
		((e.type = "text"),
			(e.disabled = !0),
			e.style.setProperty("position", "fixed"),
			e.style.setProperty("z-index", "-100"),
			e.style.setProperty("pointer-events", "none"),
			e.style.setProperty("opacity", "0"),
			(e.value = s),
			document.body.appendChild(e),
			e.click(),
			e.select(),
			document.execCommand("copy"),
			document.body.removeChild(e));
	}
}
const me = (s, e) => {
	async function n() {
		if (r)
			try {
				(await ue(r),
					s.dispatchEvent(new CustomEvent("svelte-copy", { detail: r })));
			} catch (o) {
				s.dispatchEvent(new CustomEvent("svelte-copy:error", { detail: o }));
			}
	}
	let t = typeof e == "string" ? ["click"] : [e.events].flat(1),
		r = typeof e == "string" ? e : e.text;
	return (
		t.forEach((o) => {
			s.addEventListener(o, n, !0);
		}),
		{
			update: (o) => {
				const h = typeof o == "string" ? ["click"] : [o.events].flat(1),
					u = typeof o == "string" ? o : o.text,
					i = h.filter((a) => !t.includes(a)),
					f = t.filter((a) => !h.includes(a));
				(i.forEach((a) => {
					s.addEventListener(a, n, !0);
				}),
					f.forEach((a) => {
						s.removeEventListener(a, n, !0);
					}),
					(t = h),
					(r = u));
			},
			destroy: () => {
				t.forEach((o) => {
					s.removeEventListener(o, n, !0);
				});
			}
		}
	);
};
function pe(s) {
	let e,
		n,
		t,
		r,
		o,
		h,
		u,
		i,
		f,
		a,
		d,
		c = "CSS Snippet",
		m,
		p,
		x,
		V,
		T,
		b,
		Z = "Copy CSS to Clipboard",
		L,
		D,
		I,
		H,
		$;
	return {
		c() {
			((e = g("link")),
				(n = k()),
				(t = g("div")),
				(r = g("h3")),
				(o = F(s[0])),
				(h = k()),
				(u = g("p")),
				(i = F(s[1])),
				(f = k()),
				(a = g("details")),
				(d = g("summary")),
				(d.textContent = c),
				(m = k()),
				(p = g("code")),
				(x = F(s[2])),
				(V = k()),
				(T = g("p")),
				(b = g("button")),
				(b.textContent = Z),
				(D = g("span")),
				(I = F(s[3])),
				this.h());
		},
		l(v) {
			const C = ie("svelte-1uevrx3", document.head);
			((e = _(C, "LINK", { rel: !0, href: !0 })),
				C.forEach(y),
				(n = z(v)),
				(t = _(v, "DIV", { style: !0, class: !0 })));
			var w = S(t);
			r = _(w, "H3", { class: !0 });
			var ee = S(r);
			((o = A(ee, s[0])), ee.forEach(y), (h = z(w)), (u = _(w, "P", {})));
			var te = S(u);
			((i = A(te, s[1])),
				te.forEach(y),
				(f = z(w)),
				(a = _(w, "DETAILS", { class: !0 })));
			var P = S(a);
			((d = _(P, "SUMMARY", { class: !0, "data-svelte-h": !0 })),
				M(d) !== "svelte-1p4cxwi" && (d.textContent = c),
				(m = z(P)),
				(p = _(P, "CODE", { class: !0 })));
			var se = S(p);
			((x = A(se, s[2])),
				se.forEach(y),
				P.forEach(y),
				(V = z(w)),
				(T = _(w, "P", {})));
			var O = S(T);
			((b = _(O, "BUTTON", { class: !0, "data-svelte-h": !0 })),
				M(b) !== "svelte-v2s51m" && (b.textContent = Z),
				(D = _(O, "SPAN", { class: !0 })));
			var ne = S(D);
			((I = A(ne, s[3])), ne.forEach(y), O.forEach(y), w.forEach(y), this.h());
		},
		h() {
			(E(e, "rel", "external stylesheet"),
				E(e, "href", s[5]),
				E(r, "class", "svelte-19ry7n"),
				q(u, "font-size", s[4]),
				E(d, "class", "svelte-19ry7n"),
				E(p, "class", "svelte-19ry7n"),
				E(a, "class", "svelte-19ry7n"),
				E(b, "class", "svelte-19ry7n"),
				E(D, "class", "svelte-19ry7n"),
				q(t, "font-family", "'" + s[0] + "'"),
				E(t, "class", "svelte-19ry7n"));
		},
		m(v, C) {
			(l(document.head, e),
				U(v, n, C),
				U(v, t, C),
				l(t, r),
				l(r, o),
				l(t, h),
				l(t, u),
				l(u, i),
				l(t, f),
				l(t, a),
				l(a, d),
				l(a, m),
				l(a, p),
				l(p, x),
				l(t, V),
				l(t, T),
				l(T, b),
				l(T, D),
				l(D, I),
				H ||
					(($ = [le((L = me.call(null, b, s[2]))), re(b, "svelte-copy", s[6])]),
					(H = !0)));
		},
		p(v, [C]) {
			(C & 1 && j(o, v[0]),
				C & 2 && j(i, v[1]),
				C & 16 && q(u, "font-size", v[4]),
				C & 4 && j(x, v[2]),
				L && fe(L.update) && C & 4 && L.update.call(null, v[2]),
				C & 8 && j(I, v[3]),
				C & 1 && q(t, "font-family", "'" + v[0] + "'"));
		},
		i: N,
		o: N,
		d(v) {
			(v && (y(n), y(t)), y(e), (H = !1), ae($));
		}
	};
}
function ve(s, e, n) {
	let t,
		{ id: r = "" } = e,
		{ family: o = "" } = e,
		{ size: h = 16 } = e,
		{ text: u } = e,
		i = "",
		f = "";
	const a = `${de}/assets/demo/fonts/${r}.css`,
		d = () => {
			(n(3, (f = "Copied!")),
				setTimeout(() => {
					n(3, (f = ""));
				}, 1e3));
		};
	return (
		ce(async () => {
			const c = await fetch(a);
			n(2, (i = await c.text()));
		}),
		(s.$$set = (c) => {
			("id" in c && n(7, (r = c.id)),
				"family" in c && n(0, (o = c.family)),
				"size" in c && n(8, (h = c.size)),
				"text" in c && n(1, (u = c.text)));
		}),
		(s.$$.update = () => {
			s.$$.dirty & 256 && n(4, (t = `${h}px`));
		}),
		[o, u, i, f, t, a, d, r, h]
	);
}
class oe extends W {
	constructor(e) {
		(super(), X(this, e, ve, pe, Q, { id: 7, family: 0, size: 8, text: 1 }));
	}
}
function he(s) {
	let e,
		n,
		t = "Font Demo",
		r,
		o,
		h = "This page demonstrates the fonts used in the FormulaCode project.",
		u,
		i,
		f,
		a,
		d,
		c;
	return (
		(f = new oe({
			props: {
				id: "noto-sans",
				family: "Noto Sans",
				size: 16,
				text: "The quick brown fox jumps over the lazy dog. 0123456789"
			}
		})),
		(d = new oe({
			props: {
				id: "castoro",
				family: "Castoro",
				size: 16,
				text: "The quick brown fox jumps over the lazy dog. 0123456789"
			}
		})),
		{
			c() {
				((e = g("div")),
					(n = g("h1")),
					(n.textContent = t),
					(r = k()),
					(o = g("p")),
					(o.textContent = h),
					(u = k()),
					(i = g("div")),
					G(f.$$.fragment),
					(a = k()),
					G(d.$$.fragment),
					this.h());
			},
			l(m) {
				e = _(m, "DIV", { class: !0 });
				var p = S(e);
				((n = _(p, "H1", { class: !0, "data-svelte-h": !0 })),
					M(n) !== "svelte-10hre1m" && (n.textContent = t),
					(r = z(p)),
					(o = _(p, "P", { "data-svelte-h": !0 })),
					M(o) !== "svelte-13hxj7v" && (o.textContent = h),
					(u = z(p)),
					(i = _(p, "DIV", { class: !0 })));
				var x = S(i);
				(Y(f.$$.fragment, x),
					(a = z(x)),
					Y(d.$$.fragment, x),
					x.forEach(y),
					p.forEach(y),
					this.h());
			},
			h() {
				(E(n, "class", "svelte-mrklgf"),
					E(i, "class", "samples svelte-mrklgf"),
					E(e, "class", "wrapper svelte-mrklgf"));
			},
			m(m, p) {
				(U(m, e, p),
					l(e, n),
					l(e, r),
					l(e, o),
					l(e, u),
					l(e, i),
					R(f, i, null),
					l(i, a),
					R(d, i, null),
					(c = !0));
			},
			p: N,
			i(m) {
				c || (K(f.$$.fragment, m), K(d.$$.fragment, m), (c = !0));
			},
			o(m) {
				(J(f.$$.fragment, m), J(d.$$.fragment, m), (c = !1));
			},
			d(m) {
				(m && y(e), B(f), B(d));
			}
		}
	);
}
class ye extends W {
	constructor(e) {
		(super(), X(this, e, null, he, Q, {}));
	}
}
function _e(s) {
	let e, n;
	return (
		(e = new ye({})),
		{
			c() {
				G(e.$$.fragment);
			},
			l(t) {
				Y(e.$$.fragment, t);
			},
			m(t, r) {
				(R(e, t, r), (n = !0));
			},
			p: N,
			i(t) {
				n || (K(e.$$.fragment, t), (n = !0));
			},
			o(t) {
				(J(e.$$.fragment, t), (n = !1));
			},
			d(t) {
				B(e, t);
			}
		}
	);
}
class xe extends W {
	constructor(e) {
		(super(), X(this, e, null, _e, Q, {}));
	}
}
export { xe as component };
