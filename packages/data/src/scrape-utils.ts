import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { SEASON_MONTHS, SEASONS, YEAR_CHANGE_INDEX } from './league-utils';

type TeamRanking = {
  team: string;
  rank: number;
  stat: number;
};

type MonthlyRanking = {
  month: number;
  year: number;
  rankings: TeamRanking[];
};

export async function scrapeStats(
  { sortingType, statIndex }: { sortingType: string; statIndex: number },
  getFilePath: (season: string) => string,
): Promise<void> {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  for (const [seasonKey, season] of Object.entries(SEASONS)) {
    const results: MonthlyRanking[] = [];

    const year1 = Number(seasonKey.split('-')[0]);
    const year2 = year1 + 1;

    for (const index of season.months) {
      const month = SEASON_MONTHS[index];
      const url = `https://www.nba.com/stats/teams/advanced?Month=${index}&SeasonType=Regular%20Season&dir=A&sort=${sortingType}&Season=${seasonKey}`;

      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('.Crom_table__p1iZz');

      const rankings: TeamRanking[] = await page.evaluate(
        (teams, statIndex) => {
          const rows = Array.from(
            document.querySelectorAll('table.Crom_table__p1iZz tbody tr'),
          );

          return rows.map((row, i) => {
            const cells = row.querySelectorAll('td');
            const teamName = cells[1]?.textContent?.trim() || '';
            const stat = parseFloat(cells[statIndex]?.textContent || '0');

            const teamAbbr =
              teams.find((team) => team.name === teamName)?.abbreviation ||
              teamName.slice(0, 3).toUpperCase();

            return {
              team: teamAbbr,
              rank: i + 1,
              stat,
            };
          });
        },
        season.teams,
        statIndex,
      );

      console.log(`Scraped Month ${index} of ${seasonKey}`);

      results.push({
        month: month,
        year: Number(index) >= YEAR_CHANGE_INDEX ? year2 : year1,
        rankings,
      });
    }

    const outputPath = getFilePath(seasonKey);
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    console.log(`Saved to ${outputPath}`);
  }

  await browser.close();
}
