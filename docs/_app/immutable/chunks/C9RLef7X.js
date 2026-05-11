import { d as u, r as A, w as c } from "./DAkbCCox.js";
import { a as y, g as v, b as N, c as E } from "./BT2_t_HU.js";
const O = [
		{
			agent_id: "terminus-2,claude",
			count: "518",
			median_agent_nop: "1.0343581803854074",
			median_oracle_nop: "1.03428784582855"
		},
		{
			agent_id: "terminus-2,gpt-5",
			count: "600",
			median_agent_nop: "1.0484895577529203",
			median_oracle_nop: "1.0413555377244976"
		},
		{
			agent_id: "terminus-2,oracle",
			count: "1075",
			median_agent_nop: "1.0243815660476452",
			median_oracle_nop: "1.0243815660476452"
		}
	],
	S = y.map((e) => {
		const o =
				typeof e["agent/nop"] == "number"
					? e["agent/nop"]
					: parseFloat(e["agent/nop"]),
			s =
				typeof e["oracle/nop"] == "number"
					? e["oracle/nop"]
					: parseFloat(e["oracle/nop"]);
		return {
			...e,
			"agent/nop": Number.isFinite(o) ? o : void 0,
			"oracle/nop": Number.isFinite(s) ? s : void 0
		};
	}),
	h = S.filter(
		(e) => !(e["agent/nop"] === void 0 || e["oracle/nop"] === void 0)
	),
	p = c(h),
	b = c(h),
	R = c([]),
	j = c([]),
	L = c([]),
	F = c(void 0),
	k = c(null),
	f = c(1),
	d = c(1),
	B = c("terminus-2,oracle"),
	U = c(0),
	x = c(null),
	C = c(!1),
	I = c(null),
	M = c(!1),
	w = c(!1),
	K = u(p, (e) => v(e)),
	V = u(p, (e) => N(e)),
	z = u(p, (e) => E(e)),
	q = O.reduce((e, o) => {
		const s = o.agent_id;
		if (!s) return e;
		const t = {
			count: Number(o.count ?? 0),
			medianAgentNop: Number(o.median_agent_nop ?? o.medianAgentNop ?? 0),
			medianOracleNop: Number(o.median_oracle_nop ?? o.medianOracleNop ?? 0)
		};
		return ((e[s] = t), e);
	}, {}),
	H = A(q),
	J = u(k, (e) => {
		if (!e) return null;
		const o = e.split(",");
		if (o.length < 2) return null;
		const s = o[1].trim().toLowerCase();
		return s === "gpt-5"
			? "gpt5"
			: s === "claude"
				? "claude"
				: s === "oracle"
					? "oracle"
					: null;
	});
function m(e, o, s, t) {
	if (e === void 0 || o === void 0) return null;
	const l = t * e - s * o,
		n = Math.sqrt(s ** 2 + t ** 2);
	return l / n;
}
const P = u([b, f, d], ([e, o, s]) => {
	if (!e || e.length === 0) return 0;
	const t = e
		.map((n) => m(n["agent/nop"], n["oracle/nop"], o, s))
		.filter((n) => n !== null);
	return t.length === 0 ? 0 : t.reduce((n, a) => n + a, 0) / t.length;
});
u([b, f, d], ([e, o, s]) => {
	if (!e || e.length === 0) return {};
	const t = {};
	e.forEach((n) => {
		const a = n.agent_id;
		if (!a) return;
		t[a] || (t[a] = []);
		const r = m(n["agent/nop"], n["oracle/nop"], o, s);
		r !== null && t[a].push(r);
	});
	const l = {};
	return (
		Object.keys(t).forEach((n) => {
			const a = t[n],
				r = a.reduce((i, g) => i + g, 0);
			l[n] = r / a.length;
		}),
		l
	);
});
const Q = u([p, f, d], ([e, o, s]) => {
		if (!e || e.length === 0) return {};
		const t = {};
		e.forEach((n) => {
			const a = n.agent_id,
				r = n.level;
			if (!a || !r) return;
			(t[a] || (t[a] = {}), t[a][r] || (t[a][r] = []));
			const i = m(n["agent/nop"], n["oracle/nop"], o, s);
			i !== null && t[a][r].push(i);
		});
		const l = {};
		return (
			Object.keys(t).forEach((n) => {
				((l[n] = {}),
					Object.keys(t[n]).forEach((a) => {
						const r = t[n][a],
							i = r.reduce((g, _) => g + _, 0);
						l[n][a] = i / r.length;
					}));
			}),
			l
		);
	}),
	W = u([p, f, d], ([e, o, s]) => {
		if (!e || e.length === 0) return {};
		const t = {};
		e.forEach((n) => {
			const a = n.agent_id;
			if (!a) return;
			t[a] || (t[a] = []);
			const r = m(n["agent/nop"], n["oracle/nop"], o, s);
			r !== null && t[a].push(r);
		});
		const l = {};
		return (
			Object.keys(t).forEach((n) => {
				const a = t[n],
					r = a.reduce((i, g) => i + g, 0);
				l[n] = r / a.length;
			}),
			l
		);
	}),
	T = {
		"no-aggregation": "No Aggregation",
		"param-level": "L1: Groupby params",
		"func-level": "L2: Groupby func",
		"class-level": "L3: Groupby class",
		"module-level": "L4: Groupby module"
	},
	X = u(L, (e) => {
		var s;
		if (!e || e.length === 0) return "None";
		const o = ((s = e[0]) == null ? void 0 : s.value) || e[0];
		return T[o] || o;
	});
export {
	Q as a,
	K as b,
	U as c,
	k as d,
	p as e,
	w as f,
	J as g,
	f as h,
	x as i,
	M as j,
	I as k,
	C as l,
	H as m,
	X as n,
	W as o,
	R as p,
	j as q,
	F as r,
	L as s,
	d as t,
	V as u,
	z as v,
	b as w,
	P as x,
	B as y
};
