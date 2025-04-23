import sqlite3 from 'sqlite3';
import { existsSync } from 'fs';
import { rm, mkdir } from 'fs/promises';

const FOLDER_PATH = './output';
const DB_PATH = `${FOLDER_PATH}/nba.sqlite3`;

async function createDb() {
  if (!existsSync(FOLDER_PATH)) {
    await mkdir(FOLDER_PATH);
  } else {
    await rm(DB_PATH, { force: true });
  }

  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(
      'CREATE TABLE IF NOT EXISTS players (player_id INTEGER PRIMARY KEY, name TEXT, height TEXT, weight TEXT, birthdate TEXT)',
    );
  });

  db.close();
}

createDb();
