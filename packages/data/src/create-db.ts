import sqlite3 from 'sqlite3';
import { rm } from 'fs/promises';

const DB_PATH = './output/test.sqlite';

async function createDb() {
  await rm(DB_PATH, { force: true });

  const db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(
      'CREATE TABLE IF NOT EXISTS players (player_id INTEGER PRIMARY KEY, name TEXT, height TEXT, weight TEXT, birthdate TEXT)',
    );
  });

  db.close();
}
