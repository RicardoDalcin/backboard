import sqlite3 from 'sqlite3';
import { rm, mkdir, writeFile } from 'fs/promises';

const FOLDER_PATH = './output';
const DB_PATH = `${FOLDER_PATH}/nba.sqlite3`;

type Output = Record<
  number,
  Record<
    string,
    {
      locX: number;
      locY: number;
      totalShots: number;
      totalMade: number;
    }
  >
>;

type Row = {
  locX: number;
  locY: number;
  totalShots: number;
  totalMade: number;
};

async function test() {
  const output: Output = {};

  const db = new sqlite3.Database(DB_PATH);

  // Wrap db.all in a Promise to use async/await
  const query = (sql: string): Promise<Row[]> => {
    return new Promise((resolve, reject) => {
      db.all<Row>(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    for (let season = 4; season <= 26; season++) {
      const rows = await query(
        `SELECT locX, locY, count(*) as totalShots, SUM(shotMade) as totalMade FROM shots where season = ${season} GROUP BY locX, locY;`,
      );

      output[season] = rows.reduce((acc, row) => {
        acc[`${row.locX};${row.locY}`] = {
          totalShots: row.totalShots,
          totalMade: row.totalMade,
        };
        return acc;
      }, {});
    }

    await writeFile(
      `${FOLDER_PATH}/season_averages.json`,
      JSON.stringify(output, null, 2),
    );
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    db.close();
  }
}

test();
