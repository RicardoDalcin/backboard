import datetime
import traceback
from nba_api.stats.endpoints import BoxScorePlayerTrackV3, CommonPlayerInfo, CommonTeamRoster, LeagueDashPlayerStats, LeagueDashTeamStats, ShotChartDetail, ShotChartLineupDetail, LeagueGameLog
import json
import time
import os
import requests
#generate csv file with the shots
import csv

csv_file = './packages/data/src/shots/shots_test.csv'
csv_headers = ['SEASON_1','SEASON_2','TEAM_ID','TEAM_NAME','PLAYER_ID','PLAYER_NAME','POSITION_GROUP','POSITION','GAME_DATE','GAME_ID','HOME_TEAM','AWAY_TEAM','EVENT_TYPE','SHOT_MADE','ACTION_TYPE','SHOT_TYPE','BASIC_ZONE','ZONE_NAME','ZONE_ABB','ZONE_RANGE','LOC_X','LOC_Y','SHOT_DISTANCE','QUARTER','MINS_LEFT','SECS_LEFT']

position_equivalences = {
    "Center-Forward": "C-F",
}

def convert_coords(x, y):
    corrected_x = x * -0.1
    corrected_y = y * 0.1 + 5.25
    # round to 2 decimal places
    return round(corrected_x, 2), round(corrected_y, 2)

def get_games(season):
    games = LeagueGameLog(
      season=season,
      season_type_all_star='Regular Season'
    )
    games_response = games.get_dict()
    # group games by game_id (each game has one entry for each team, combine both)
    games_by_game_id = {}
    for game in games_response['resultSets'][0]['rowSet']:
        game_dict = dict(zip(games_response['resultSets'][0]['headers'], game))
        game_id = game_dict['GAME_ID']
        if game_id not in games_by_game_id:
            games_by_game_id[game_id] = { "home": game_dict, "away": None } if "vs" in game_dict["MATCHUP"] else { "home": None, "away": game_dict }
        else:
            if "vs" in game_dict["MATCHUP"] or games_by_game_id[game_id]["away"] is not None:
                # The yearly Mexico City game is the only one that doesn't have "vs" in the matchup
                games_by_game_id[game_id]["home"] = game_dict
            else:
                games_by_game_id[game_id]["away"] = game_dict
    
    return games_by_game_id

def get_shots(season):
    shots = ShotChartDetail(
        context_measure_simple='FGA',  # Field Goals Attempted
        # game_id_nullable=game_id,
        season_nullable=season,
        team_id=0,
        player_id=0
    )
    shot_chart_response = shots.get_dict()

    shots = shot_chart_response['resultSets'][0]['rowSet']
    shots_as_dict = [dict(zip(shot_chart_response['resultSets'][0]['headers'], shot)) for shot in shots]

    for shot in shots_as_dict:
        shot['LOC_X'], shot['LOC_Y'] = convert_coords(shot['LOC_X'], shot['LOC_Y'])

    return shots_as_dict

team_data_cache = {}
def get_team_data(season, team_id):
    key = season + str(team_id)
    
    if key in team_data_cache:
        return team_data_cache[key]
    else:
        team_info_request = CommonTeamRoster(
            season=season,
            team_id=team_id
        )
        team_info = team_info_request.get_dict()
        players_headers = team_info['resultSets'][0]['headers']
        players_data = team_info['resultSets'][0]['rowSet']
        players_as_dict = [dict(zip(players_headers, player)) for player in players_data]
        players_by_id = {player['PLAYER_ID']: player for player in players_as_dict}
        team_data_cache[key] = players_by_id
        return players_by_id

def get_teams(season):
    teams = LeagueDashTeamStats(
        season=season,
        season_type_all_star='Regular Season',
        league_id_nullable='00',
    )
    teams_response = teams.get_dict()
    teams_data = teams_response['resultSets'][0]['rowSet']
    teams_as_dict = [dict(zip(teams_response['resultSets'][0]['headers'], team)) for team in teams_data]
    teams_by_id = {team['TEAM_ID']: team for team in teams_as_dict}
    return teams_by_id

def get_players(season, teams):
    players_by_id = {}
    for team_id, team in teams.items():
        players = CommonTeamRoster(
            season=season,
            team_id=team_id
        )
        players_response = players.get_dict()
        players_data = players_response['resultSets'][0]['rowSet']
        players_as_dict = [dict(zip(players_response['resultSets'][0]['headers'], player)) for player in players_data]
        for player in players_as_dict:
            players_by_id[player['PLAYER_ID']] = player
        time.sleep(0.5)
        
    return players_by_id

try:
    season = '2024-25'

    games = get_games(season)
    shots = get_shots(season)
    teams = get_teams(season)
    players = get_players(season, teams)

    season_1 = '20' + season.split('-')[1]
    season_2 = season

    with open(csv_file, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(csv_headers)
        
        for shot in shots:
            game = games[shot['GAME_ID']]
            home_team = game['home']
            away_team = game['away']
            shot_team = home_team if shot['TEAM_ID'] == game['home']['TEAM_ID'] else away_team

            game_date = datetime.datetime.strptime(shot_team['GAME_DATE'], '%Y-%m-%d').strftime('%m-%d-%Y')
            game_id = shot_team['GAME_ID']
            # remove leading 00 from game_id
            game_id = game_id[2:]

            shot_made = "TRUE" if shot['SHOT_MADE_FLAG'] == 1 else "FALSE"

            team_data = teams[shot_team['TEAM_ID']]
            player_data = players[shot['PLAYER_ID']] if shot['PLAYER_ID'] in players else None

            basic_zone = shot['SHOT_ZONE_BASIC']
            # SHOT_ZONE_AREA has both zone_name and zone_abb in the format "zone_name(zone_abb)"
            zone_name = shot['SHOT_ZONE_AREA'].split('(')[0].strip()
            zone_abb = shot['SHOT_ZONE_AREA'].split('(')[1].split(')')[0].strip()

            # if position starts with key, position group is the value
            convert_position = {
                'C': 'C',
                'PF': 'F',
                'SF': 'F',
                'SG': 'G',
                'PG': 'G',
                'G': 'G',
                'F': 'F',
            }
            
            position_group = next((key for key in convert_position if player_data['POSITION'].startswith(key)), None) if player_data else None
            if position_group is None:
                position_group = ""
            else:
                position_group = convert_position[position_group]

            row = [
                season_1,
                season_2,
                shot_team['TEAM_ID'],
                shot_team['TEAM_NAME'],
                shot['PLAYER_ID'],
                player_data['PLAYER'] if player_data else '',
                position_group,
                player_data['POSITION'] if player_data else '',
                game_date,
                game_id,
                home_team['TEAM_ABBREVIATION'],
                away_team['TEAM_ABBREVIATION'],
                shot['EVENT_TYPE'],
                shot_made,
                shot['ACTION_TYPE'],
                shot['SHOT_TYPE'],
                shot['SHOT_ZONE_BASIC'],
                zone_name,
                zone_abb,
                shot['SHOT_ZONE_RANGE'],
                shot['LOC_X'],
                shot['LOC_Y'],
                shot['SHOT_DISTANCE'],
                shot['PERIOD'],
                shot['MINUTES_REMAINING'],
                shot['SECONDS_REMAINING']
            ]

            writer.writerow(row)

        print(f"Wrote {len(shots)} shots to {csv_file}")

except Exception as e:
    # print stack trace
    print(traceback.format_exc())
    print(f"Error: {type(e).__name__}: {e}")