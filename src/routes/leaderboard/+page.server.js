import advantageData from "$data/advantage-leaderboard.json";

export async function load() {
    return {
        data: [],
        leaderboard: advantageData
    };
}
