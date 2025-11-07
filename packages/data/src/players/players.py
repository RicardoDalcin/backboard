from nba_api.stats.endpoints import LeagueDashPlayerStats, CommonPlayerInfo
import json
import time
import os
import requests

# Define the file paths
player_ids_file = "./packages/data/src/players/player_ids.json"
players_info_file = "./packages/data/src/players/players_2003_2024.json"

# Function to load player IDs from a file
def load_player_ids(file_path):
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            data = json.load(f)
            return set(data)  # return as a set for faster lookup
    return set()

# Function to save player IDs to a file
def save_player_ids(player_ids, file_path):
    with open(file_path, "w") as f:
        json.dump(list(player_ids), f, indent=4)

# Load the player IDs if the file exists
player_ids = load_player_ids(player_ids_file)

# Fetch player IDs from the API if not enough player IDs are available
if len(player_ids) < 2341:
    print("🔍 Gathering player IDs from the API (will save for future use)…")
    seasons = [f"{year:04d}-{str(year+1)[-2:]}" for year in range(2003, 2026)]
    for season in seasons:
        try:
            stats = LeagueDashPlayerStats(season=season, per_mode_detailed='PerGame')
            data = stats.get_normalized_dict()['LeagueDashPlayerStats']
            for row in data:
                player_ids.add(row['PLAYER_ID'])
            print(f"✔ {season}: {len(data)} players → total so far: {len(player_ids)}")
            time.sleep(0.5)
        except Exception as e:
            print(f"⚠️ Failed to fetch stats for {season}: {e}")
    
    save_player_ids(player_ids, player_ids_file)
else:
    print(f"Using saved player IDs from {player_ids_file} ({len(player_ids)} players)")

# Load previously fetched player information if it exists
players_info = []
if os.path.exists(players_info_file):
    with open(players_info_file, "r") as f:
        players_info = json.load(f)
    # Gather player IDs already fetched
    fetched_player_ids = {player['id'] for player in players_info}
else:
    fetched_player_ids = set()

# Filter out players that have already been fetched
remaining_player_ids = [pid for pid in player_ids if pid not in fetched_player_ids]

print(f"\n🧍 Fetching info for {len(remaining_player_ids)} unique NBA players…")

def fetch_player_info(pid):
    try:
        # enforce a 5‑second HTTP timeout
        info = CommonPlayerInfo(player_id=pid, timeout=5).get_normalized_dict()["CommonPlayerInfo"][0]
        return {
            "id": pid,
            "name": info["DISPLAY_FIRST_LAST"],
            "height": info["HEIGHT"],
            "weight": info["WEIGHT"],
            "birthdate": info["BIRTHDATE"]
        }
    except Exception as e:
        # capture both timeouts and other failures
        return {"error": str(e), "player_id": pid}

# Fetch remaining player info
for i, pid in enumerate(remaining_player_ids, 1):
    try:
        result = fetch_player_info(pid)
        if "error" in result:
            print(f"[{i}/{len(remaining_player_ids)}] ❌ {pid} → {result['error']}")
            print("❗ Error—saving progress and exiting.")
            with open(players_info_file, "w") as f:
                json.dump(players_info, f, indent=4)
            exit(1)
        else:
            players_info.append(result)
            print(f"[{i}/{len(remaining_player_ids)}] ✅ {result['name']}")
            time.sleep(0.2)
    except Exception as e:
        print(f"[{i}/{len(remaining_player_ids)}] ❌ Unexpected: {e}")
        print("❗ Error—saving progress and exiting.")
        with open(players_info_file, "w") as f:
            json.dump(players_info, f, indent=4)
        exit(1)

# All done—write final JSON
with open(players_info_file, "w") as f:
    json.dump(players_info, f, indent=4)

print("\n✅ Complete! Saved to players_2003_2024.json")
