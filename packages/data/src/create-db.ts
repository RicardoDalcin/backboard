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
  id: number;
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

const clamp = (num: number, min: number, max: number) =>
  Math.max(min, Math.min(num, max));

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
        teamId INTEGER,
        playerId INTEGER,
        -- positionGroup INTEGER,
        position INTEGER,
        -- gameDate INTEGER,
        -- gameId INTEGER,
        -- homeTeam INTEGER,
        -- awayTeam INTEGER,
        -- eventType INTEGER,
        shotMade INTEGER,
        -- actionType INTEGER,
        -- shotType INTEGER,
        -- basicZone INTEGER,
        -- zoneName INTEGER,
        -- zoneAbb INTEGER,
        -- zoneRange INTEGER,
        locX INTEGER,
        locY INTEGER,
        -- shotDistance REAL,
        quarter INTEGER,
        minsLeft INTEGER,
        secsLeft INTEGER,
        -- defRtg REAL,
        defRtgRank INTEGER,
        -- offRtg REAL,
        offRtgRank INTEGER,
        -- playerHeight REAL,
        -- playerWeight INTEGER,
        gameWon INTEGER
      ) WITHOUT ROWID`,
    );

    db.run(`CREATE INDEX IF NOT EXISTS playerId_index on shots (playerId)`);
    db.run(`CREATE INDEX IF NOT EXISTS season_index on shots (season)`);
    db.run(`CREATE INDEX IF NOT EXISTS teamId_index on shots (teamId)`);
    db.run(`CREATE INDEX IF NOT EXISTS defRtgRank_index on shots (defRtgRank)`);
    db.run(`CREATE INDEX IF NOT EXISTS offRtgRank_index on shots (offRtgRank)`);
    db.run(`CREATE INDEX IF NOT EXISTS position_index on shots (locX, locY)`);
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

    const player = this.playersList.find((item) => item.id === numberId);

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
  const teamMap = new Map<string, number>();
  const positionMap = new Map<string, number>();
  const positionGroupMap = new Map<string, number>();

  // Helper function to get or create map entries
  const getOrCreateId = (map: Map<string, number>, value: string) => {
    if (!map.has(value)) {
      map.set(value, map.size + 1);
    }
    return map.get(value)!;
  };

  let id = 1;

  const LOCATION_CORRECTION_SEASONS = [20, 21, 22];
  const COURT_PERCENT = 0.4;
  const COURT_LENGTH = 94 * COURT_PERCENT;

  const COURT_CENTER_LEFT = -2;
  const COURT_CENTER_RIGHT = 1;

  for (const file of files) {
    const records = await parseCsvFile<Row>(file);

    const dbRecords = records.map((record) => {
      const season = Number(record.SEASON_2.substring(5, 7));
      const needCorrection = LOCATION_CORRECTION_SEASONS.includes(season);
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

      const locX = Number(record.LOC_X);
      const locY = Number(record.LOC_Y);

      const _correctedLocX = needCorrection ? locX * 10 : locX;

      const correctedLocX = clamp(
        _correctedLocX < COURT_CENTER_LEFT
          ? Math.floor(_correctedLocX)
          : _correctedLocX > COURT_CENTER_RIGHT
            ? Math.floor(_correctedLocX)
            : Math.round(_correctedLocX),
        -25,
        24,
      );

      const correctedLocY = roundTo(
        needCorrection ? locY * 10 - COURT_LENGTH * 1.4 : locY,
        0,
      );

      const gameDate = new Date(`${year}-${monthString}-${dayString}`);

      const shot = {
        id: id++,
        season,
        teamId: Number(record.TEAM_ID),
        playerId: Number(record.PLAYER_ID),
        positionGroup: getOrCreateId(positionGroupMap, record.POSITION_GROUP),
        position: getOrCreateId(positionMap, record.POSITION),
        gameDate: gameDate.getTime(),
        gameId: Number(record.GAME_ID),
        homeTeam: getOrCreateId(teamMap, record.HOME_TEAM),
        awayTeam: getOrCreateId(teamMap, record.AWAY_TEAM),
        eventType: getOrCreateId(eventTypeMap, record.EVENT_TYPE),
        shotMade: record.SHOT_MADE === 'TRUE',
        actionType: getOrCreateId(actionTypeMap, record.ACTION_TYPE),
        shotType: getOrCreateId(shotTypeMap, record.SHOT_TYPE),
        basicZone: getOrCreateId(basicZoneMap, record.BASIC_ZONE),
        zoneName: getOrCreateId(zoneNameMap, record.ZONE_NAME),
        zoneAbb: getOrCreateId(zoneAbbMap, record.ZONE_ABB),
        zoneRange: getOrCreateId(zoneRangeMap, record.ZONE_RANGE),
        locX: correctedLocX,
        locY: correctedLocY,
        shotDistance: String(roundTo(Number(record.SHOT_DISTANCE), 2)),
        quarter: Number(record.QUARTER),
        minsLeft: Number(record.MINS_LEFT),
        secsLeft: Number(record.SECS_LEFT),
        // defRtg: defensiveRanking?.stat
        //   ? String(roundTo(defensiveRanking.stat, 2))
        //   : '0',
        defRtgRank: defensiveRanking?.rank ?? 0,
        // offRtg: offensiveRanking?.stat
        //   ? String(roundTo(offensiveRanking.stat, 2))
        //   : '0',
        offRtgRank: offensiveRanking?.rank ?? 0,
        playerHeight: player.height ? String(playerHeight) : '0',
        playerWeight: player.weight ? Number(player.weight) : 0,
        gameWon: gameWinner === teamShortName,
      };

      return shot;
    });

    const toValues = (obj: (typeof dbRecords)[number]) =>
      `(
        ${obj.id},
        ${obj.season},
        ${obj.teamId},
        ${obj.playerId},
        "${obj.position}",
        ${obj.shotMade ? 1 : 0},
        ${obj.locX},
        ${obj.locY},
        ${obj.quarter},
        ${obj.minsLeft},
        ${obj.secsLeft},
        ${obj.defRtgRank},
        ${obj.offRtgRank},
        ${obj.gameWon ? 1 : 0}
      )`;

    const CHUNK_SIZE = 1_000;

    console.log(
      `Starting to insert chunks for ${file.split('/').pop() ?? 'NO_FILE_NAME'}`,
    );

    for (let i = 0; i < dbRecords.length; i += CHUNK_SIZE) {
      const chunk = dbRecords.slice(i, i + CHUNK_SIZE);

      const sql = `insert into shots (
          id,
          season,
          teamId,
          playerId,
          -- positionGroup,
          position,
          -- gameDate,
          -- gameId,
          -- homeTeam,
          -- awayTeam,
          -- eventType,
          shotMade,
          -- actionType,
          -- shotType,
          -- basicZone,
          -- zoneName,
          -- zoneAbb,
          -- zoneRange,
          locX,
          locY,
          -- shotDistance,
          quarter,
          minsLeft,
          secsLeft,
          -- defRtg,
          defRtgRank,
          -- offRtg,
          offRtgRank,
          -- playerHeight,
          -- playerWeight,
          gameWon
        ) values
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
    team: invertMap(teamMap),
    position: invertMap(positionMap),
    positionGroup: invertMap(positionGroupMap),
  };

  await writeFile(
    `${FOLDER_PATH}/data_dictionary.json`,
    JSON.stringify(dataDictionary, null, 2),
  );

  db.close();
}

createAndSeed();
