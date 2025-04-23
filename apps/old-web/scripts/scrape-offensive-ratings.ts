import { scrapeStats } from './scrape-utils';

scrapeStats(
  'OFF_RATING',
  6,
  (season) => `./data/offensive/${season}_offensive_ratings.json`
);
