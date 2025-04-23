import { scrapeStats } from './scrape-utils';

scrapeStats(
  'DEF_RATING',
  7,
  (season) => `./data/defensive/${season}_defensive_ratings.json`,
);
