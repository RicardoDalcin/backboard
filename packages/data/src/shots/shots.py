from nba_api.stats.endpoints import ShotChartDetail, ShotChartLineupDetail, LeagueGameLog
import json
import time
import os
import requests

# Bam Adebayo (player_id=1628389) on Miami Heat (team_id=1610612748)
# Season format should be "2023-24" for the 2023-24 season

try:
    season = '2025-26'
    
    games = LeagueGameLog(
      season=season,
      season_type_all_star='Regular Season'
    )
    games_response = games.get_dict()

    game_id = games.get_normalized_dict()['LeagueGameLog'][0]['GAME_ID']
      
    # Using proper parameters for ShotChartDetail
    shot_chart = ShotChartDetail(
        context_measure_simple='FGA',  # Field Goals Attempted
        game_id_nullable=game_id,
        team_id=0,
        player_id=0
    )

    # shot_chart = ShotChartLineupDetail(
    #     context_measure_detailed='FGA',  # Field Goals Attempted
    #     season=season,
    #     season_type_all_star='Regular Season'
    # )
    
    # Get the raw response to see what we're getting
    response = shot_chart.get_dict()
    print("API Response Keys:", response.keys())
    print("\nFull Response:")
    print(json.dumps(response, indent=2))
    
    # Try to get normalized dict
    normalized = shot_chart.get_normalized_dict()
    print("\nNormalized Data:")
    print(json.dumps(normalized, indent=2))
    
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")
    print("\nTrying to get raw response...")
    try:
        shot_chart = ShotChartDetail(
            player_id=1629029,
            team_id=1610612748,
            season_nullable='2023-24'
        )
        raw = shot_chart.get_dict()
        print(json.dumps(raw, indent=2))
    except Exception as e2:
        print(f"Raw response also failed: {e2}")