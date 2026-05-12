import rawRows from "$data/website_data_lite.csv";
import { paperLeaderboard } from "$utils/findings.js";

export async function load() {
	return {
		data: [],
		leaderboard: paperLeaderboard,
		rows: rawRows
	};
}
