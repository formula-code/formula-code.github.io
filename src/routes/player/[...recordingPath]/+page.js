import mainBenchmarkData from "$data/website_data_lite.csv";
import explorerBenchmarkData from "$data/website_data_lite.explorer.csv";

export const ssr = false;
export const prerender = false;

// Search both the main scrollytelling CSV and the explorer's curated slice.
// The two cover different experiment runs; the explorer CSV is what carries
// the agent_recording paths that actually resolve to files on disk.
const allBenchmarkData = [...mainBenchmarkData, ...explorerBenchmarkData];

export async function load({ params, url }) {
	const rawRecordingPath = params.recordingPath || "";
	// Trim any trailing slash that SvelteKit's catch-all may include so the
	// agent_recording lookup matches the CSV's no-trailing-slash form.
	const recordingPath = rawRecordingPath.replace(/\/$/, "");
	const normalizedRecording = recordingPath ? `/${recordingPath}` : null;
	const benchmarkId = url.searchParams.get("benchmark");

	let benchmark;
	if (benchmarkId !== null) {
		const idNum = Number(benchmarkId);
		benchmark = allBenchmarkData.find((d) => Number(d.id) === idNum);
	}

	if (!benchmark && normalizedRecording) {
		benchmark = allBenchmarkData.find(
			(d) => d.agent_recording === normalizedRecording
		);
	}

	// Lazy load the heavy code data — try both the main and explorer maps
	// since the benchmark may have come from either CSV.
	if (benchmark) {
		try {
			const [mainMod, explorerMod] = await Promise.all([
				import("$data/website_data_codes.json"),
				import("$data/website_data_codes.explorer.json")
			]);
			const extra =
				mainMod.default[benchmark.id] ?? explorerMod.default[benchmark.id];
			if (extra) {
				benchmark = { ...benchmark, ...extra };
			}
		} catch (e) {
			console.error("Failed to load code data for player", e);
		}
	}

	return {
		recordingPath,
		benchmark
	};
}
