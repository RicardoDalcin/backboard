from nba_api.stats.endpoints import LeagueGameLog
import json
import time

# Seasons to process
seasons = [f"{year:04d}-{str(year+1)[-2:]}" for year in range(2003, 2025)]

for season in seasons:
    print(f"\n📦 Processing season: {season}...")

    try:
        # Fetch all regular season games for the given season
        log = LeagueGameLog(season=season, season_type_all_star='Regular Season')
        time.sleep(1.5)  # Be nice to the API

        games = log.get_normalized_dict()['LeagueGameLog']

        # Build game scores dictionary
        game_scores = {}

        for entry in games:
            game_id = entry['GAME_ID']
            team = entry['TEAM_ABBREVIATION']
            pts = entry['PTS']

            if game_id not in game_scores:
                game_scores[game_id] = []

            game_scores[game_id].append({
                'team': team,
                'pts': pts
            })

        # Determine winners
        winners = {}

        for game_id, teams in game_scores.items():
            if len(teams) == 2:
                winner = max(teams, key=lambda x: x['pts'])
                winners[game_id] = winner['team']
            else:
                print(f"⚠️ Skipping game {game_id}: not exactly 2 teams")

        # Save to file
        filename = f"{season}_winners.json"
        with open(filename, "w") as f:
            json.dump(winners, f, indent=4)

        print(f"✅ Saved {len(winners)} games to {filename}")

    except Exception as e:
        print(f"❌ Failed to process season {season}: {e}")
