import advantageData from "$data/advantage-leaderboard.json";

export async function load() {
	const data = ["a", "b", "c"];
	return {
		data,
		leaderboard: advantageData
	};
}
