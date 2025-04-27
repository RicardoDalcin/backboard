export const SEASONS = [
  { label: '2023-24', value: 24 },
  { label: '2022-23', value: 23 },
  { label: '2021-22', value: 22 },
  { label: '2020-21', value: 21 },
  { label: '2019-20', value: 20 },
  { label: '2018-19', value: 19 },
  { label: '2017-18', value: 18 },
  { label: '2016-17', value: 17 },
  { label: '2015-16', value: 16 },
  { label: '2014-15', value: 15 },
  { label: '2013-14', value: 14 },
  { label: '2012-13', value: 13 },
  { label: '2011-12', value: 12 },
  { label: '2010-11', value: 11 },
  { label: '2009-10', value: 10 },
  { label: '2008-09', value: 9 },
  { label: '2007-08', value: 8 },
  { label: '2006-07', value: 7 },
  { label: '2005-06', value: 6 },
  { label: '2004-05', value: 5 },
  { label: '2003-04', value: 4 },
];

export const TEAMS = [
  { label: 'Atlanta Hawks', value: 1610612737 },
  { label: 'Boston Celtics', value: 1610612738 },
  { label: 'Brooklyn Nets', value: 1610612739 },
  { label: 'Charlotte Hornets', value: 1610612740 },
  { label: 'Chicago Bulls', value: 1610612741 },
  { label: 'Cleveland Cavaliers', value: 1610612742 },
  { label: 'Dallas Mavericks', value: 1610612743 },
  { label: 'Denver Nuggets', value: 1610612744 },
  { label: 'Detroit Pistons', value: 1610612745 },
  { label: 'Golden State Warriors', value: 1610612746 },
  { label: 'Houston Rockets', value: 1610612747 },
  { label: 'Indiana Pacers', value: 1610612748 },
  { label: 'Los Angeles Clippers', value: 1610612749 },
  { label: 'Los Angeles Lakers', value: 1610612750 },
  { label: 'Memphis Grizzlies', value: 1610612751 },
  { label: 'Miami Heat', value: 1610612752 },
  { label: 'Milwaukee Bucks', value: 1610612753 },
  { label: 'Minnesota Timberwolves', value: 1610612754 },
  { label: 'New Orleans Pelicans', value: 1610612755 },
  { label: 'New York Knicks', value: 1610612756 },
  { label: 'Oklahoma City Thunder', value: 1610612757 },
  { label: 'Orlando Magic', value: 1610612758 },
  { label: 'Philadelphia 76ers', value: 1610612759 },
  { label: 'Phoenix Suns', value: 1610612760 },
  { label: 'Portland Trail Blazers', value: 1610612761 },
  { label: 'Sacramento Kings', value: 1610612762 },
  { label: 'San Antonio Spurs', value: 1610612763 },
  { label: 'Toronto Raptors', value: 1610612764 },
  { label: 'Utah Jazz', value: 1610612765 },
  { label: 'Washington Wizards', value: 1610612766 },
];

export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
export const RESULTS = ['all', 'wins', 'losses'] as const;

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
