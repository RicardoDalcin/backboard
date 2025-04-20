const ALL_TEAMS = {
  ATLANTA: {
    name: 'Atlanta Hawks',
    abbreviation: 'ATL',
  },
  BOSTON: { name: 'Boston Celtics', abbreviation: 'BOS' },
  BROOKLYN: { name: 'Brooklyn Nets', abbreviation: 'BKN' },
  BULLS: { name: 'Chicago Bulls', abbreviation: 'CHI' },
  CAVS: { name: 'Cleveland Cavaliers', abbreviation: 'CLE' },
  MAVS: { name: 'Dallas Mavericks', abbreviation: 'DAL' },
  NUGGETS: { name: 'Denver Nuggets', abbreviation: 'DEN' },
  PISTONS: { name: 'Detroit Pistons', abbreviation: 'DET' },
  WARRIORS: { name: 'Golden State Warriors', abbreviation: 'GSW' },
  ROCKETS: { name: 'Houston Rockets', abbreviation: 'HOU' },
  PACERS: { name: 'Indiana Pacers', abbreviation: 'IND' },
  CLIPPERS: { name: 'LA Clippers', abbreviation: 'LAC' },
  LAKERS: { name: 'Los Angeles Lakers', abbreviation: 'LAL' },
  GRIZZLIES: { name: 'Memphis Grizzlies', abbreviation: 'MEM' },
  HEAT: { name: 'Miami Heat', abbreviation: 'MIA' },
  BUCKS: { name: 'Milwaukee Bucks', abbreviation: 'MIL' },
  WOLVES: { name: 'Minnesota Timberwolves', abbreviation: 'MIN' },
  PELICANS: { name: 'New Orleans Pelicans', abbreviation: 'NOP' },
  KNICKS: { name: 'New York Knicks', abbreviation: 'NYK' },
  MAGIC: { name: 'Orlando Magic', abbreviation: 'ORL' },
  SIXERS: { name: 'Philadelphia 76ers', abbreviation: 'PHI' },
  SUNS: { name: 'Phoenix Suns', abbreviation: 'PHX' },
  BLAZERS: { name: 'Portland Trail Blazers', abbreviation: 'POR' },
  KINGS: { name: 'Sacramento Kings', abbreviation: 'SAC' },
  SPURS: { name: 'San Antonio Spurs', abbreviation: 'SAS' },
  RAPTORS: { name: 'Toronto Raptors', abbreviation: 'TOR' },
  JAZZ: { name: 'Utah Jazz', abbreviation: 'UTA' },
  WIZARDS: { name: 'Washington Wizards', abbreviation: 'WAS' },
  SONICS: { name: 'Seattle SuperSonics', abbreviation: 'SEA' },
  BOBCATS: { name: 'Charlotte Bobcats', abbreviation: 'CHA' },
  THUNDER: { name: 'Oklahoma City Thunder', abbreviation: 'OKC' },
  OKC_HORNETS: {
    name: 'New Orleans/Oklahoma City Hornets',
    abbreviation: 'NOK',
  },
  NOLA_HORNETS: { name: 'New Orleans Hornets', abbreviation: 'NOH' },
  NEW_JERSEY: { name: 'New Jersey Nets', abbreviation: 'NJN' },
  HORNETS: { name: 'Charlotte Hornets', abbreviation: 'CHA' },
};

type Team = (typeof ALL_TEAMS)[keyof typeof ALL_TEAMS];

const ALWAYS_PRESENT: Team[] = [
  ALL_TEAMS.ATLANTA,
  ALL_TEAMS.BOSTON,
  ALL_TEAMS.BULLS,
  ALL_TEAMS.CAVS,
  ALL_TEAMS.MAVS,
  ALL_TEAMS.NUGGETS,
  ALL_TEAMS.PISTONS,
  ALL_TEAMS.WARRIORS,
  ALL_TEAMS.ROCKETS,
  ALL_TEAMS.PACERS,
  ALL_TEAMS.CLIPPERS,
  ALL_TEAMS.LAKERS,
  ALL_TEAMS.GRIZZLIES,
  ALL_TEAMS.HEAT,
  ALL_TEAMS.BUCKS,
  ALL_TEAMS.WOLVES,
  ALL_TEAMS.KNICKS,
  ALL_TEAMS.MAGIC,
  ALL_TEAMS.SIXERS,
  ALL_TEAMS.SUNS,
  ALL_TEAMS.BLAZERS,
  ALL_TEAMS.KINGS,
  ALL_TEAMS.SPURS,
  ALL_TEAMS.RAPTORS,
  ALL_TEAMS.JAZZ,
  ALL_TEAMS.WIZARDS,
];

const MODERN_NBA = [
  ...ALWAYS_PRESENT,
  ALL_TEAMS.BROOKLYN,
  ALL_TEAMS.THUNDER,
  ALL_TEAMS.HORNETS,
  ALL_TEAMS.PELICANS,
];

export const SEASON_MONTHS = {
  1: 10,
  2: 11,
  3: 12,
  4: 1,
  5: 2,
  6: 3,
  7: 4,
  8: 5,
  9: 6,
  10: 7,
  11: 8,
  12: 9,
};

type SeasonMonth = keyof typeof SEASON_MONTHS;

const REGULAR_SEASON: SeasonMonth[] = [1, 2, 3, 4, 5, 6, 7];

export const SEASONS: Record<
  string,
  {
    months: SeasonMonth[];
    teams: Team[];
  }
> = {
  '2003-04': {
    months: REGULAR_SEASON,
    teams: [
      ...ALWAYS_PRESENT,
      ALL_TEAMS.SONICS,
      ALL_TEAMS.NOLA_HORNETS,
      ALL_TEAMS.NEW_JERSEY,
    ],
  },
  '2004-05': {
    months: [2, 3, 4, 5, 6, 7],
    teams: [
      ...ALWAYS_PRESENT,
      ALL_TEAMS.SONICS,
      ALL_TEAMS.NOLA_HORNETS,
      ALL_TEAMS.NEW_JERSEY,
      ALL_TEAMS.BOBCATS,
    ],
  },
  '2005-06': {
    months: [2, 3, 4, 5, 6, 7],
    teams: [
      ...ALWAYS_PRESENT,
      ALL_TEAMS.SONICS,
      ALL_TEAMS.OKC_HORNETS,
      ALL_TEAMS.NEW_JERSEY,
      ALL_TEAMS.BOBCATS,
    ],
  },
  '2006-07': {
    months: REGULAR_SEASON,
    teams: [
      ...ALWAYS_PRESENT,
      ALL_TEAMS.SONICS,
      ALL_TEAMS.OKC_HORNETS,
      ALL_TEAMS.NEW_JERSEY,
      ALL_TEAMS.BOBCATS,
    ],
  },
  '2007-08': {
    months: REGULAR_SEASON,
    teams: [
      ...ALWAYS_PRESENT,
      ALL_TEAMS.SONICS,
      ALL_TEAMS.NOLA_HORNETS,
      ALL_TEAMS.NEW_JERSEY,
      ALL_TEAMS.BOBCATS,
    ],
  },
  '2008-09': {
    months: REGULAR_SEASON,
    teams: [
      ...ALWAYS_PRESENT,
      ALL_TEAMS.THUNDER,
      ALL_TEAMS.NOLA_HORNETS,
      ALL_TEAMS.NEW_JERSEY,
      ALL_TEAMS.BOBCATS,
    ],
  },
  '2009-10': {
    months: REGULAR_SEASON,
    teams: [
      ...ALWAYS_PRESENT,
      ALL_TEAMS.THUNDER,
      ALL_TEAMS.NOLA_HORNETS,
      ALL_TEAMS.NEW_JERSEY,
      ALL_TEAMS.BOBCATS,
    ],
  },
  '2010-11': {
    months: REGULAR_SEASON,
    teams: [
      ...ALWAYS_PRESENT,
      ALL_TEAMS.THUNDER,
      ALL_TEAMS.NOLA_HORNETS,
      ALL_TEAMS.NEW_JERSEY,
      ALL_TEAMS.BOBCATS,
    ],
  },
  '2011-12': {
    months: [3, 4, 5, 6, 7],
    teams: [
      ...ALWAYS_PRESENT,
      ALL_TEAMS.THUNDER,
      ALL_TEAMS.NOLA_HORNETS,
      ALL_TEAMS.NEW_JERSEY,
      ALL_TEAMS.BOBCATS,
    ],
  },
  '2012-13': {
    months: REGULAR_SEASON,
    teams: [
      ...ALWAYS_PRESENT,
      ALL_TEAMS.THUNDER,
      ALL_TEAMS.NOLA_HORNETS,
      ALL_TEAMS.BROOKLYN,
      ALL_TEAMS.BOBCATS,
    ],
  },
  '2013-14': {
    months: REGULAR_SEASON,
    teams: [
      ...ALWAYS_PRESENT,
      ALL_TEAMS.THUNDER,
      ALL_TEAMS.PELICANS,
      ALL_TEAMS.BROOKLYN,
      ALL_TEAMS.BOBCATS,
    ],
  },
  '2014-15': { months: REGULAR_SEASON, teams: MODERN_NBA },
  '2015-16': { months: REGULAR_SEASON, teams: MODERN_NBA },
  '2016-17': { months: REGULAR_SEASON, teams: MODERN_NBA },
  '2017-18': { months: REGULAR_SEASON, teams: MODERN_NBA },
  '2018-19': { months: REGULAR_SEASON, teams: MODERN_NBA },
  '2019-20': { months: [1, 2, 3, 4, 5, 6, 10, 11], teams: MODERN_NBA },
  '2020-21': { months: [3, 4, 5, 6, 7, 8], teams: MODERN_NBA },
  '2021-22': { months: REGULAR_SEASON, teams: MODERN_NBA },
  '2022-23': { months: REGULAR_SEASON, teams: MODERN_NBA },
  '2023-24': { months: REGULAR_SEASON, teams: MODERN_NBA },
  '2024-25': { months: REGULAR_SEASON, teams: MODERN_NBA },
};

export const YEAR_CHANGE_INDEX = 4;
