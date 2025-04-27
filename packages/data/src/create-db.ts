import sqlite3 from 'sqlite3';
import { existsSync } from 'fs';
import { rm, mkdir, readFile, writeFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';

import { offensiveRatings } from './offensive';
import { defensiveRatings } from './defensive';
import { players } from './players';
import { winners } from './winners';

import { TEAMS_BY_NAME } from './league-utils';
import { exit } from 'process';

interface Player {
  player_id: number;
  name: string;
  height: string;
  weight: string;
  birthdate: string;
}

interface CsvRow {
  [key: string]: string;
}

interface Row {
  SEASON_1: string;
  SEASON_2: string;
  TEAM_ID: string;
  TEAM_NAME: string;
  PLAYER_ID: string;
  PLAYER_NAME: string;
  POSITION_GROUP: string;
  POSITION: string;
  GAME_DATE: string;
  GAME_ID: string;
  HOME_TEAM: string;
  AWAY_TEAM: string;
  EVENT_TYPE: string;
  SHOT_MADE: string;
  ACTION_TYPE: string;
  SHOT_TYPE: string;
  BASIC_ZONE: string;
  ZONE_NAME: string;
  ZONE_ABB: string;
  ZONE_RANGE: string;
  LOC_X: string;
  LOC_Y: string;
  SHOT_DISTANCE: string;
  QUARTER: string;
  MINS_LEFT: string;
  SECS_LEFT: string;
}

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
      `CREATE TABLE IF NOT EXISTS shots (
        id INTEGER PRIMARY KEY,
        season INTEGER,
        team_id INTEGER,
        player_id INTEGER,
        position_group TEXT,
        position TEXT,
        game_date TEXT,
        game_id INTEGER,
        home_team TEXT,
        away_team TEXT,
        event_type INTEGER,
        shot_made INTEGER,
        action_type INTEGER,
        shot_type INTEGER,
        basic_zone INTEGER,
        zone_name INTEGER,
        zone_abb INTEGER,
        zone_range INTEGER,
        loc_x REAL,
        loc_y REAL,
        shot_distance REAL,
        quarter INTEGER,
        mins_left INTEGER,
        secs_left INTEGER,
        def_rtg REAL,
        def_rtg_rank INTEGER,
        off_rtg REAL,
        off_rtg_rank INTEGER,
        player_height REAL,
        player_weight INTEGER,
        game_won INTEGER
      ) WITHOUT ROWID`,
    );

    db.run(`CREATE INDEX IF NOT EXISTS player_id_index on shots (player_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS season_index on shots (season)`);
    db.run(`CREATE INDEX IF NOT EXISTS team_id_index on shots (team_id)`);
  });

  return db;
}

async function parseCsvFile<T = CsvRow>(path: string): Promise<T[]> {
  try {
    const fileContent = await readFile(path, 'utf-8');

    const records: T[] = parse(fileContent, {
      columns: true, // Assumes the first row is the header
      skip_empty_lines: true,
      trim: true,
    });

    return records;
  } catch (error) {
    console.error(`Error reading/parsing CSV:`, error);
    throw error;
  }
}

class PlayerCache {
  private cache: Map<string, Player> = new Map();
  private playersList = Object.values(players);

  get(playerId: string): Player {
    const numberId = Number(playerId);

    if (this.cache.has(playerId)) {
      return this.cache.get(playerId)!;
    }

    const player = this.playersList.find((item) => item.player_id === numberId);

    if (player) {
      this.cache.set(playerId, player);
      return player;
    }

    throw new Error(`Player with ID ${playerId} not found`);
  }
}

const roundTo = (num: number, precision: number) =>
  Math.round(num * 10 ** precision) / 10 ** precision;

const invertMap = (map: Map<string, number>) => {
  const invertedMap: { [key: number]: string } = {};
  for (const [key, value] of map.entries()) {
    invertedMap[value] = key;
  }
  return invertedMap;
};

async function createAndSeed() {
  const db = await createDb();

  const files = [
    './src/shots/NBA_2004_Shots.csv',
    './src/shots/NBA_2005_Shots.csv',
    './src/shots/NBA_2006_Shots.csv',
    './src/shots/NBA_2007_Shots.csv',
    './src/shots/NBA_2008_Shots.csv',
    './src/shots/NBA_2009_Shots.csv',
    './src/shots/NBA_2010_Shots.csv',
    './src/shots/NBA_2011_Shots.csv',
    './src/shots/NBA_2012_Shots.csv',
    './src/shots/NBA_2013_Shots.csv',
    './src/shots/NBA_2014_Shots.csv',
    './src/shots/NBA_2015_Shots.csv',
    './src/shots/NBA_2016_Shots.csv',
    './src/shots/NBA_2017_Shots.csv',
    './src/shots/NBA_2018_Shots.csv',
    './src/shots/NBA_2019_Shots.csv',
    './src/shots/NBA_2020_Shots.csv',
    './src/shots/NBA_2021_Shots.csv',
    './src/shots/NBA_2022_Shots.csv',
    './src/shots/NBA_2023_Shots.csv',
    './src/shots/NBA_2024_Shots.csv',
  ];

  const playersCache = new PlayerCache();

  // Maps to store string-to-integer mappings
  const eventTypeMap = new Map<string, number>();
  const actionTypeMap = new Map<string, number>();
  const shotTypeMap = new Map<string, number>();
  const basicZoneMap = new Map<string, number>();
  const zoneNameMap = new Map<string, number>();
  const zoneAbbMap = new Map<string, number>();
  const zoneRangeMap = new Map<string, number>();

  // Helper function to get or create map entries
  const getOrCreateId = (map: Map<string, number>, value: string) => {
    if (!map.has(value)) {
      map.set(value, map.size + 1);
    }
    return map.get(value)!;
  };

  let id = 1;

  for (const file of files) {
    const records = await parseCsvFile<Row>(file);

    const dbRecords = records.map((record) => {
      const season = Number(record.SEASON_2.substring(5, 7));
      const day = Number(record.GAME_DATE.substring(3, 5));
      const month = Number(record.GAME_DATE.substring(0, 2));
      const year = record.GAME_DATE.substring(6, 11);

      const dayString = String(day).padStart(2, '0');
      const monthString = String(month).padStart(2, '0');

      const offensiveSeason =
        offensiveRatings[record.SEASON_2 as keyof typeof offensiveRatings];

      const defensiveSeason =
        defensiveRatings[record.SEASON_2 as keyof typeof defensiveRatings];

      const offensiveMonth = offensiveSeason.find(
        (item) => item.month === month,
      );
      const defensiveMonth = defensiveSeason.find(
        (item) => item.month === month,
      );

      const teamName =
        record.TEAM_NAME === 'LA Clippers'
          ? 'Los Angeles Clippers'
          : record.TEAM_NAME;

      const teamShortName = TEAMS_BY_NAME[teamName].abbreviation;
      const oponentShortName =
        record.HOME_TEAM === teamShortName
          ? record.AWAY_TEAM
          : record.HOME_TEAM;

      const offensiveRanking = offensiveMonth?.rankings.find(
        (item) => item.team === teamShortName,
      );
      const defensiveRanking = defensiveMonth?.rankings.find(
        (item) => item.team === oponentShortName,
      );

      const winnersSeason = winners[record.SEASON_2 as keyof typeof winners];
      const gameWinner = winnersSeason[`00${record.GAME_ID}`];

      const player = playersCache.get(record.PLAYER_ID);

      const playerFt = Number(player.height.substring(0, 1));
      const playerIn = Number(player.height.substring(2, player.height.length));

      const playerHeight = roundTo(playerFt + playerIn / 12, 3);

      const shot = {
        id: id++,
        season,
        teamId: Number(record.TEAM_ID),
        playerId: Number(record.PLAYER_ID),
        positionGroup: record.POSITION_GROUP,
        position: record.POSITION,
        gameDate: `${year}-${monthString}-${dayString}`,
        gameId: Number(record.GAME_ID),
        homeTeam: record.HOME_TEAM,
        awayTeam: record.AWAY_TEAM,
        eventType: getOrCreateId(eventTypeMap, record.EVENT_TYPE),
        shotMade: record.SHOT_MADE === 'TRUE',
        actionType: getOrCreateId(actionTypeMap, record.ACTION_TYPE),
        shotType: getOrCreateId(shotTypeMap, record.SHOT_TYPE),
        basicZone: getOrCreateId(basicZoneMap, record.BASIC_ZONE),
        zoneName: getOrCreateId(zoneNameMap, record.ZONE_NAME),
        zoneAbb: getOrCreateId(zoneAbbMap, record.ZONE_ABB),
        zoneRange: getOrCreateId(zoneRangeMap, record.ZONE_RANGE),
        locX: String(roundTo(Number(record.LOC_X), 2)),
        locY: String(roundTo(Number(record.LOC_Y), 2)),
        shotDistance: String(roundTo(Number(record.SHOT_DISTANCE), 2)),
        quarter: Number(record.QUARTER),
        minsLeft: Number(record.MINS_LEFT),
        secsLeft: Number(record.SECS_LEFT),
        defRtg: defensiveRanking?.stat
          ? String(roundTo(defensiveRanking.stat, 2))
          : '0',
        defRtgRank: defensiveRanking?.rank ?? 0,
        offRtg: offensiveRanking?.stat
          ? String(roundTo(offensiveRanking.stat, 2))
          : '0',
        offRtgRank: offensiveRanking?.rank ?? 0,
        playerHeight: player.height ? String(playerHeight) : '0',
        playerWeight: player.weight ? Number(player.weight) : 0,
        gameWon: gameWinner === teamShortName,
      };

      return shot;
    });

    const toValues = (obj: (typeof dbRecords)[number]) =>
      `(${obj.id}, ${obj.season}, ${obj.teamId}, ${obj.playerId}, "${obj.positionGroup}", "${obj.position}", "${obj.gameDate}", ${obj.gameId}, "${obj.homeTeam}", "${obj.awayTeam}", ${obj.eventType}, ${obj.shotMade ? 1 : 0}, ${obj.actionType}, ${obj.shotType}, ${obj.basicZone}, ${obj.zoneName}, ${obj.zoneAbb}, ${obj.zoneRange}, ${obj.locX}, ${obj.locY}, ${obj.shotDistance}, ${obj.quarter}, ${obj.minsLeft}, ${obj.secsLeft}, ${obj.defRtg}, ${obj.defRtgRank}, ${obj.offRtg}, ${obj.offRtgRank}, ${obj.playerHeight}, ${obj.playerWeight}, ${obj.gameWon ? 1 : 0})`;

    const CHUNK_SIZE = 1_000;

    for (let i = 0; i < dbRecords.length; i += CHUNK_SIZE) {
      const chunk = dbRecords.slice(i, i + CHUNK_SIZE);

      const sql = `insert into shots (id, season, team_id, player_id,position_group, position, game_date, game_id, home_team, away_team, event_type, shot_made, action_type, shot_type, basic_zone, zone_name, zone_abb, zone_range, loc_x, loc_y, shot_distance, quarter, mins_left, secs_left, def_rtg, def_rtg_rank, off_rtg, off_rtg_rank, player_height, player_weight, game_won) values
        ${chunk.map((record) => `${toValues(record)}`).join(',')}`;

      try {
        await new Promise<void>((resolve, reject) => {
          db.exec(sql, (err) => {
            if (err) {
              reject([err, sql]);
              return;
            }

            resolve();
          });
          console.log('Inserted chunk', i / CHUNK_SIZE);
        });
      } catch ([err, sql]) {
        console.log(err);
        console.log(sql);
        exit(1);
      }
    }
  }

  // Generate the data dictionary
  const dataDictionary = {
    eventType: invertMap(eventTypeMap),
    actionType: invertMap(actionTypeMap),
    shotType: invertMap(shotTypeMap),
    basicZone: invertMap(basicZoneMap),
    zoneName: invertMap(zoneNameMap),
    zoneAbb: invertMap(zoneAbbMap),
    zoneRange: invertMap(zoneRangeMap),
  };

  await writeFile(
    `${FOLDER_PATH}/data_dictionary.json`,
    JSON.stringify(dataDictionary, null, 2),
  );

  db.close();
}

createAndSeed();
