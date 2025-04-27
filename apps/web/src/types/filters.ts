import {
  TEAMS as TEAMS_DATA,
  SEASONS as SEASONS_DATA,
  PLAYERS as PLAYERS_DATA,
} from '@nba-viz/data';

export const SEASONS = SEASONS_DATA.sort((a, b) => b.value - a.value);
export const TEAMS = TEAMS_DATA.map((team) => ({
  label: team.name,
  value: team.id,
}));

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
export const RESULTS = ['all', 'wins', 'losses'] as const;

export const PLAYERS = PLAYERS_DATA.map((player) => ({
  label: player.name,
  value: player.id,
}));

export const DEFAULT_FILTER = {
  season: SEASONS[0].value,
  defensiveRatingRank: [1, 30] as [number, number],
  offensiveRatingRank: [1, 30] as [number, number],
  teams: [] as (typeof TEAMS)[number]['value'][],
  players: [] as (typeof TEAMS)[number]['value'][],
  positions: [...POSITIONS],
  result: RESULTS[0],
};

export type Filter = typeof DEFAULT_FILTER;

export type FilterItem = {
  id: number;
  name: string;
  filters: Filter;
};
