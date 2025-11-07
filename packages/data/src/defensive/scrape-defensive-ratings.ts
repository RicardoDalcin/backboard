import { scrapeStats } from '../scrape-utils';

scrapeStats(
  { sortingType: 'DEF_RATING', statIndex: 7 },
  (season) => `./src/defensive/${season}_defensive_ratings.json`,
);
