import {
  TEAMS as TEAMS_DATA,
  SEASONS as SEASONS_DATA,
  PLAYERS as PLAYERS_DATA,
  POSITIONS as POSITIONS_DATA,
} from '@nba-viz/data';

export const SEASONS = SEASONS_DATA.sort((a, b) => b.value - a.value);
export const TEAMS = TEAMS_DATA.map((team) => ({
  label: team.name,
  value: team.id,
}));

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;

const getPositionSimplified = (basePosition: string) => {
  return {
    label: basePosition,
    values: Object.entries(POSITIONS_DATA).reduce((acc, [id, value]) => {
      if (value.includes(basePosition)) {
        acc.push(Number(id));
      }
      return acc;
    }, [] as number[]),
  };
};

export const POSITIONS_SIMPLIFIED = [
  getPositionSimplified('PG'),
  getPositionSimplified('SG'),
  getPositionSimplified('SF'),
  getPositionSimplified('PF'),
  getPositionSimplified('C'),
];
export const RESULT_VALUES = ['all', 'wins', 'losses'] as const;
export const RESULTS = [
  { value: 'all', labelKey: 'global.all' },
  { value: 'wins', labelKey: 'filters.wins' },
  { value: 'losses', labelKey: 'filters.losses' },
] as const;

export const PLAYERS = PLAYERS_DATA.map((player) => ({
  label: player.name,
  value: player.id,
}));

export const DEFAULT_FILTER = {
  season: [26, 26] as [number, number],
  defensiveRatingRank: [1, 30] as [number, number],
  offensiveRatingRank: [1, 30] as [number, number],
  teams: [] as (typeof TEAMS)[number]['value'][],
  players: [] as (typeof TEAMS)[number]['value'][],
  positions: [...POSITIONS],
  result: RESULTS[0].value as 'all' | 'wins' | 'losses',
};

export type Filter = typeof DEFAULT_FILTER;

export type FilterItem = {
  id: number;
  name: string;
  filters: Filter;
};
