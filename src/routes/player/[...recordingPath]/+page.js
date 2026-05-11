import allBenchmarkData from "$data/website_data_lite.csv";

export const ssr = false;
export const prerender = false;

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

	// Lazy load the heavy code data
	if (benchmark) {
		try {
			const module = await import("$data/website_data_codes.json");
			const heavyData = module.default;
			const extra = heavyData[benchmark.id];
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
