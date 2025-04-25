export interface DatabaseShot {
  id: number;
  season: number;
  team_id: number;
  team_name: string;
  player_id: number;
  player_name: string;
  position_group: string;
  position: string;
  game_date: string;
  game_id: number;
  home_team: string;
  away_team: string;
  event_type: string;
  shot_made: number;
  action_type: string;
  shot_type: string;
  basic_zone: string;
  zone_name: string;
  zone_abb: string;
  zone_range: string;
  loc_x: number;
  loc_y: number;
  shot_distance: number;
  quarter: number;
  mins_left: number;
  secs_left: number;
  def_rtg: number;
  def_rtg_rank: number;
  off_rtg: number;
  off_rtg_rank: number;
  player_height: number;
  player_weight: number;
  game_won: number;
}

export interface Shot {
  locX: number;
  locY: number;
  shotMade: boolean;
  basicZone: string;
}

export interface Zone {
  key: string;
  count: number;
  totalMade: number;
  totalMissed: number;
  accuracy: number;
  frequency: number;
}
