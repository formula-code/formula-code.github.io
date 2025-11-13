import allBenchmarkData from "$data/website_data.csv";

export const ssr = false;

export function load({ params, url }) {
	const recordingPath = params.recordingPath || "";
	const normalizedRecording = recordingPath ? `/${recordingPath}` : null;
	const benchmarkId = url.searchParams.get("benchmark");

	let benchmark;
	if (benchmarkId !== null) {
		const idNum = Number(benchmarkId);
		benchmark = allBenchmarkData.find(d => Number(d.id) === idNum);
	}

	if (!benchmark && normalizedRecording) {
		benchmark = allBenchmarkData.find(d => d.agent_recording === normalizedRecording);
	}

	return {
		recordingPath,
		benchmark
	};
}
