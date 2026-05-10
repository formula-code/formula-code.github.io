import advantageData from "$data/advantage-leaderboard.json";
import rawRows from "$data/website_data_lite.csv";

export async function load() {
	return {
		data: [],
		leaderboard: advantageData,
		rows: rawRows
	};
}
