import { scrapeStats } from '../scrape-utils';

scrapeStats(
  { sortingType: 'OFF_RATING', statIndex: 6 },
  (season) => `./src/offensive/${season}_offensive_ratings.json`,
);
