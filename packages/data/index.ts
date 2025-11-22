import { ALL_TEAMS, SEASONS as SEASONS_DATA } from './src/league-utils';
import PLAYERS_LIST from './src/players/players_2003_2024.json';
import {
  POSITION_GROUPS,
  BASIC_ZONES,
  POSITIONS,
  ZONE_LOCATIONS,
} from './output';

interface Team {
  id: number;
  name: string;
  abbreviation: string;
  conference: 'eastern' | 'western';
}

const TEAMS = Object.values(ALL_TEAMS) as Team[];

interface Season {
  label: string;
  value: number;
}

const SEASONS = Object.keys(SEASONS_DATA).map((key) => {
  const value = Number(key.substring(5, 7));
  return { label: key, value };
}) as Season[];

interface Player {
  id: number;
  name: string;
  height: string;
  weight: string;
  birthdate: string;
}

const PLAYERS = PLAYERS_LIST as Player[];

export {
  TEAMS,
  SEASONS,
  PLAYERS,
  POSITION_GROUPS,
  BASIC_ZONES,
  POSITIONS,
  ZONE_LOCATIONS,
};
export type { Team, Season, Player };
