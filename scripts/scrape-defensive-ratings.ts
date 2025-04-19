import puppeteer from 'puppeteer';
import fs from 'fs/promises';

type TeamRanking = {
  team: string;
  def_rtg: number;
  rank: number;
};

type MonthlyRanking = {
  month: number;
  year: number;
  rankings: TeamRanking[];
};

const MONTHS = {
  1: 10,
  2: 11,
  3: 12,
  4: 1,
  5: 2,
  6: 3,
  7: 4,
};

const YEAR_CHANGE_INDEX = 4;

const TEAM_ABBREVIATIONS: Record<string, string> = {
  'Atlanta Hawks': 'ATL',
  'Boston Celtics': 'BOS',
  'Brooklyn Nets': 'BKN',
  'Charlotte Hornets': 'CHA',
  'Chicago Bulls': 'CHI',
  'Cleveland Cavaliers': 'CLE',
  'Dallas Mavericks': 'DAL',
  'Denver Nuggets': 'DEN',
  'Detroit Pistons': 'DET',
  'Golden State Warriors': 'GSW',
  'Houston Rockets': 'HOU',
  'Indiana Pacers': 'IND',
  'LA Clippers': 'LAC',
  'Los Angeles Lakers': 'LAL',
  'Memphis Grizzlies': 'MEM',
  'Miami Heat': 'MIA',
  'Milwaukee Bucks': 'MIL',
  'Minnesota Timberwolves': 'MIN',
  'New Orleans Pelicans': 'NOP',
  'New York Knicks': 'NYK',
  'Oklahoma City Thunder': 'OKC',
  'Orlando Magic': 'ORL',
  'Philadelphia 76ers': 'PHI',
  'Phoenix Suns': 'PHX',
  'Portland Trail Blazers': 'POR',
  'Sacramento Kings': 'SAC',
  'San Antonio Spurs': 'SAS',
  'Toronto Raptors': 'TOR',
  'Utah Jazz': 'UTA',
  'Washington Wizards': 'WAS',
};

async function scrapeDefRatings(seasonYear = 2024): Promise<void> {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const results: MonthlyRanking[] = [];

  for (const [index, month] of Object.entries(MONTHS)) {
    const url = `https://www.nba.com/stats/teams/advanced?Month=${index}&SeasonType=Regular%20Season&dir=A&sort=DEF_RATING`;

    console.log('Going to page', url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('Waiting for table to load');
    await page.waitForSelector('.Crom_table__p1iZz');
    console.log('Table loaded');

    const rankings: TeamRanking[] = await page.evaluate(
      (TEAM_ABBREVIATIONS) => {
        const rows = Array.from(
          document.querySelectorAll('table.Crom_table__p1iZz tbody tr')
        );

        return rows.map((row, i) => {
          const cells = row.querySelectorAll('td');
          const teamName = cells[1]?.textContent?.trim() || '';
          const defRtg = parseFloat(cells[7]?.textContent || '0');
          const teamAbbr =
            TEAM_ABBREVIATIONS[teamName] || teamName.slice(0, 3).toUpperCase();

          return {
            team: teamAbbr,
            def_rtg: defRtg,
            rank: i + 1,
          };
        });
      },
      TEAM_ABBREVIATIONS
    );

    console.log(`Scraped Month ${month} - ${seasonYear}`);

    results.push({
      month: month,
      year: Number(index) >= YEAR_CHANGE_INDEX ? seasonYear + 1 : seasonYear,
      rankings,
    });
  }

  await browser.close();

  const outputPath = './defensive_ratings.json';
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`Saved to ${outputPath}`);
}

scrapeDefRatings();
