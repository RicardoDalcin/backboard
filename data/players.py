from nba_api.stats.endpoints import LeagueDashPlayerStats, CommonPlayerInfo
import json
import time

seasons = [f"{year:04d}-{str(year+1)[-2:]}" for year in range(2003, 2024)]
player_ids = set()

print("🔍 Fetching all players who logged minutes from 2003–2024...")

for season in seasons:
    try:
        stats = LeagueDashPlayerStats(season=season, per_mode_detailed='PerGame')
        data = stats.get_normalized_dict()['LeagueDashPlayerStats']
        for row in data:
            player_ids.add(row['PLAYER_ID'])
        print(f"✔ {season}: {len(data)} players → total so far: {len(player_ids)}")
        time.sleep(1.2)
    except Exception as e:
        print(f"⚠️ Failed to fetch stats for {season}: {e}")

print(f"\n🧍 Fetching info for {len(player_ids)} unique NBA players...")

players_info = []

for i, pid in enumerate(player_ids):
    try:
        info = CommonPlayerInfo(player_id=pid).get_normalized_dict()["CommonPlayerInfo"][0]
        player_entry = {
            "player_id": pid,
            "name": info["DISPLAY_FIRST_LAST"],
            "height": info["HEIGHT"],
            "weight": info["WEIGHT"],
            "birthdate": info["BIRTHDATE"]
        }
        players_info.append(player_entry)
        print(f"[{i+1}/{len(player_ids)}] ✅ {player_entry['name']}")
        time.sleep(0.1)
    except Exception as e:
        print(f"[{i+1}/{len(player_ids)}] ❌ Failed for player_id={pid}: {e}")

# Save to JSON
with open("players_2003_2024.json", "w") as f:
    json.dump(players_info, f, indent=4)

print("\n✅ Done! Saved to players_2003_2024.json")