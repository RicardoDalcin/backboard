export const ALL_TEAMS = {
  ATLANTA: {
    id: 1610612737,
    name: 'Atlanta Hawks',
    abbreviation: 'ATL',
    conference: 'eastern',
  },
  BOSTON: {
    id: 1610612738,
    name: 'Boston Celtics',
    abbreviation: 'BOS',
    conference: 'eastern',
  },
  BROOKLYN: {
    id: 1610612751,
    name: 'Brooklyn Nets',
    abbreviation: 'BKN',
    conference: 'eastern',
  },
  BULLS: {
    id: 1610612741,
    name: 'Chicago Bulls',
    abbreviation: 'CHI',
    conference: 'eastern',
  },
  CAVS: {
    id: 1610612739,
    name: 'Cleveland Cavaliers',
    abbreviation: 'CLE',
    conference: 'eastern',
  },
  MAVS: {
    id: 1610612742,
    name: 'Dallas Mavericks',
    abbreviation: 'DAL',
    conference: 'western',
  },
  NUGGETS: {
    id: 1610612743,
    name: 'Denver Nuggets',
    abbreviation: 'DEN',
    conference: 'western',
  },
  PISTONS: {
    id: 1610612765,
    name: 'Detroit Pistons',
    abbreviation: 'DET',
    conference: 'eastern',
  },
  WARRIORS: {
    id: 1610612744,
    name: 'Golden State Warriors',
    abbreviation: 'GSW',
    conference: 'western',
  },
  ROCKETS: {
    id: 1610612745,
    name: 'Houston Rockets',
    abbreviation: 'HOU',
    conference: 'western',
  },
  PACERS: {
    id: 1610612754,
    name: 'Indiana Pacers',
    abbreviation: 'IND',
    conference: 'eastern',
  },
  CLIPPERS: {
    id: 1610612746,
    name: 'Los Angeles Clippers',
    abbreviation: 'LAC',
    conference: 'western',
  },
  LAKERS: {
    id: 1610612747,
    name: 'Los Angeles Lakers',
    abbreviation: 'LAL',
    conference: 'western',
  },
  GRIZZLIES: {
    id: 1610612763,
    name: 'Memphis Grizzlies',
    abbreviation: 'MEM',
    conference: 'western',
  },
  HEAT: {
    id: 1610612748,
    name: 'Miami Heat',
    abbreviation: 'MIA',
    conference: 'eastern',
  },
  BUCKS: {
    id: 1610612749,
    name: 'Milwaukee Bucks',
    abbreviation: 'MIL',
    conference: 'eastern',
  },
  WOLVES: {
    id: 1610612750,
    name: 'Minnesota Timberwolves',
    abbreviation: 'MIN',
    conference: 'western',
  },
  PELICANS: {
    id: 1610612740,
    name: 'New Orleans Pelicans',
    abbreviation: 'NOP',
    conference: 'western',
  },
  KNICKS: {
    id: 1610612752,
    name: 'New York Knicks',
    abbreviation: 'NYK',
    conference: 'eastern',
  },
  MAGIC: {
    id: 1610612753,
    name: 'Orlando Magic',
    abbreviation: 'ORL',
    conference: 'eastern',
  },
  SIXERS: {
    id: 1610612755,
    name: 'Philadelphia 76ers',
    abbreviation: 'PHI',
    conference: 'eastern',
  },
  SUNS: {
    id: 1610612756,
    name: 'Phoenix Suns',
    abbreviation: 'PHX',
    conference: 'western',
  },
  BLAZERS: {
    id: 1610612757,
    name: 'Portland Trail Blazers',
    abbreviation: 'POR',
    conference: 'western',
  },
  KINGS: {
    id: 1610612758,
    name: 'Sacramento Kings',
    abbreviation: 'SAC',
    conference: 'western',
  },
  SPURS: {
    id: 1610612759,
    name: 'San Antonio Spurs',
    abbreviation: 'SAS',
    conference: 'western',
  },
  RAPTORS: {
    id: 1610612761,
    name: 'Toronto Raptors',
    abbreviation: 'TOR',
    conference: 'eastern',
  },
  JAZZ: {
    id: 1610612762,
    name: 'Utah Jazz',
    abbreviation: 'UTA',
    conference: 'western',
  },
  WIZARDS: {
    id: 1610612764,
    name: 'Washington Wizards',
    abbreviation: 'WAS',
    conference: 'eastern',
  },
  HORNETS: {
    id: 1610612766,
    name: 'Charlotte Hornets',
    abbreviation: 'CHA',
    conference: 'eastern',
  },
  THUNDER: {
    id: 1610612760,
    name: 'Oklahoma City Thunder',
    abbreviation: 'OKC',
    conference: 'western',
  },
  BOBCATS: {
    id: 1610612766,
    name: 'Charlotte Bobcats',
    abbreviation: 'CHA',
    conference: 'eastern',
  },
  OKC_HORNETS: {
    id: 1610612740,
    name: 'New Orleans/Oklahoma City Hornets',
    abbreviation: 'NOK',
    conference: 'western',
  },
  NOLA_HORNETS: {
    id: 1610612740,
    name: 'New Orleans Hornets',
    abbreviation: 'NOH',
    conference: 'western',
  },
  NEW_JERSEY: {
    id: 1610612751,
    name: 'New Jersey Nets',
    abbreviation: 'NJN',
    conference: 'eastern',
  },
  SONICS: {
    id: 1610612760,
    name: 'Seattle SuperSonics',
    abbreviation: 'SEA',
    conference: 'western',
  },
};

export const TEAMS_BY_NAME = Object.values(ALL_TEAMS).reduce(
  (acc, team) => ({ ...acc, [team.name]: team }),
  {} as Record<string, Team>,
);

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
  '2025-26': {
    months: [REGULAR_SEASON[0], REGULAR_SEASON[1]],
    teams: MODERN_NBA,
  },
};

export const YEAR_CHANGE_INDEX = 4;
