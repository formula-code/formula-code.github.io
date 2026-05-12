import { paperLeaderboard } from "$utils/findings.js";

export async function load() {
	const data = ["a", "b", "c"];
	return {
		data,
		leaderboard: paperLeaderboard
	};
}
