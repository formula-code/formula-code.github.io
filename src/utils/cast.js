/*
 * Asciinema v2 cast parser tuned for FormulaCode agent recordings.
 *
 * Cast format (v2): JSONL where the first line is a header object and every
 * subsequent line is `[time, type, data]`. Type is "o" (output) or "i" (input).
 * For our recordings the shell echoes "i" back through "o" anyway, so we only
 * consume "o" events.
 *
 * ANSI handling: agent recordings only use SGR colors plus `\x1b[K` (erase to
 * end of line) and `\x1b[?2004h/l` (bracketed paste — ignored). We resolve
 * `\r` and erase-line into a flat string where overwrites have already been
 * applied, then split into segments tagged with optional color metadata.
 */

const ANSI_RE = /\x1b\[([\d;?]*)([A-Za-z])/g;
// SGR color → CSS color in the brand palette. Picked to read on a light card.
const SGR_COLOR = {
	30: "var(--fc-fg-dim, #475569)", // black → dim slate
	31: "var(--brand-red, #dc2418)", // red
	32: "#1f8a4c", // green (terminal accent)
	33: "#a16207", // yellow
	34: "var(--brand-blue, #1e3a8a)", // blue
	35: "#7e22ce", // magenta
	36: "#0d7490", // cyan
	37: "var(--text-primary, #0f172a)", // white → primary text
	39: null // default
};

export function parseCast(text) {
	const lines = text.split("\n");
	if (!lines.length) return { header: null, events: [], duration: 0 };
	let header;
	try {
		header = JSON.parse(lines[0]);
	} catch {
		header = null;
	}
	const events = [];
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		try {
			const e = JSON.parse(line);
			if (Array.isArray(e) && e.length === 3 && e[1] === "o") {
				events.push({ t: e[0], data: e[2] });
			}
		} catch {
			// skip malformed line
		}
	}
	const duration = events.length ? events[events.length - 1].t : 0;
	return { header, events, duration };
}

/*
 * Reduce events into a flat sequence of "lines", each carrying:
 *   - text: the resolved line text after \r and erase-line have been applied
 *   - color: SGR color hex/var or null for default
 *   - time:  the original event time when this line first finished
 *
 * The output reads as a transcript that flows naturally regardless of viewport
 * width (no fixed terminal columns).
 */
export function eventsToLines(events) {
	const lines = [];
	let cur = ""; // current line buffer
	let curStart = 0; // time when current line started accumulating
	let activeColor = null;
	const segments = []; // running segments for the current line: [{text, color}]

	const pushLine = (t) => {
		// Flatten current segments into a final {text, color, time, runs}
		// where runs is the per-color span list (may be empty for a blank line).
		const runs = segments.slice();
		const text = runs.map((r) => r.text).join("") + cur;
		if (cur && activeColor !== (runs[runs.length - 1]?.color ?? null))
			runs.push({ text: cur, color: activeColor });
		else if (cur && runs.length)
			runs[runs.length - 1].text += cur;
		else if (cur) runs.push({ text: cur, color: activeColor });
		lines.push({ text, runs, time: t, startTime: curStart });
		cur = "";
		segments.length = 0;
		curStart = t;
	};

	for (const ev of events) {
		const data = ev.data;
		ANSI_RE.lastIndex = 0;
		let lastIdx = 0;
		let match;
		// Walk the data string, splitting on ANSI escapes. Plain runs go through
		// the carriage-return / newline handler below.
		while ((match = ANSI_RE.exec(data)) !== null) {
			if (match.index > lastIdx) {
				pushPlain(data.slice(lastIdx, match.index));
			}
			const params = match[1];
			const code = match[2];
			if (code === "m") {
				// SGR — apply or reset color
				const nums = params
					.split(";")
					.map((s) => Number(s) || 0);
				for (const n of nums) {
					if (n === 0 || n === 39) {
						commitSegment();
						activeColor = null;
					} else if (SGR_COLOR[n] !== undefined) {
						commitSegment();
						activeColor = SGR_COLOR[n];
					} else if (n === 1 || n === 22) {
						// bold / not-bold — ignored for now
					}
				}
			} else if (code === "K") {
				// Erase in line — ignore params, treat as truncate from cursor.
				// In our usage the cursor is always at end of `cur`, so there's
				// nothing to truncate; the next \r will reset us anyway.
			}
			// Other escapes (cursor positioning, screen clears, bracketed paste)
			// are dropped silently.
			lastIdx = match.index + match[0].length;
		}
		if (lastIdx < data.length) pushPlain(data.slice(lastIdx));

		function commitSegment() {
			if (cur) {
				segments.push({ text: cur, color: activeColor });
				cur = "";
			}
		}

		function pushPlain(s) {
			for (let i = 0; i < s.length; i++) {
				const ch = s[i];
				if (ch === "\n") {
					commitSegment();
					pushLine(ev.t);
				} else if (ch === "\r") {
					// Carriage return: drop everything we have for this line and
					// let the next characters overwrite from the start. Most
					// "\r\n" pairs are handled because the \n hits first.
					commitSegment();
					segments.length = 0;
					curStart = ev.t;
				} else {
					cur += ch;
				}
			}
		}
	}
	// Flush the trailing partial line
	if (cur || segments.length) pushLine(events[events.length - 1]?.t ?? 0);
	return lines;
}

/* Heuristic: a line that ends with `# `, `$ `, or `> ` is a shell prompt.
 * Tagging prompt lines lets us style them and pin them as "chapters" in the UI. */
export function tagPrompts(lines) {
	const PROMPT_END = /[#$>]\s*$/;
	return lines.map((l) => ({ ...l, isPrompt: PROMPT_END.test(l.text) }));
}

/* Build a quick lookup from time → first line index where line.time >= t.
 * Used to scrub: render lines with index < indexAtTime(t). */
export function buildTimeIndex(lines) {
	// Pre-compute a sorted [time, lineIdx] array; binary search at query time.
	const times = new Float32Array(lines.length);
	for (let i = 0; i < lines.length; i++) times[i] = lines[i].time;
	return (t) => {
		let lo = 0;
		let hi = times.length;
		while (lo < hi) {
			const mid = (lo + hi) >>> 1;
			if (times[mid] <= t) lo = mid + 1;
			else hi = mid;
		}
		return lo;
	};
}
