import 'dotenv/config';

import { db } from '.';
import { shotsTable } from './schema';

import { defensiveRatings } from '../../data/defensive';
import { offensiveRatings } from '../../data/offensive';

import { parse } from 'csv-parse/sync';
import { readFile } from 'fs/promises';
import { TEAMS_BY_NAME } from '../../scripts/league-utils';
import { winners } from '../../data/winners';

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

async function parseCsvFile<T = CsvRow>(): Promise<T[]> {
  const filePath = './data/NBA_2024_Shots.csv';

  try {
    const fileContent = await readFile(filePath, 'utf-8');

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

async function seed() {
  console.log('aaaaa');
  const records = await parseCsvFile<Row>();

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

    const offensiveMonth = offensiveSeason.find((item) => item.month === month);
    const defensiveMonth = defensiveSeason.find((item) => item.month === month);

    const teamShortName = TEAMS_BY_NAME[record.TEAM_NAME].abbreviation;

    const offensiveRanking = offensiveMonth?.rankings.find(
      (item) => item.team === teamShortName
    );
    const defensiveRanking = defensiveMonth?.rankings.find(
      (item) => item.team === teamShortName
    );

    const winnersSeason = winners[record.SEASON_2 as keyof typeof winners];
    const gameWinner = winnersSeason[`00${record.GAME_ID}`];
    console.log(gameWinner, teamShortName);

    const shot: typeof shotsTable.$inferInsert = {
      season,
      teamId: Number(record.TEAM_ID),
      teamName: record.TEAM_NAME,
      playerId: Number(record.PLAYER_ID),
      playerName: record.PLAYER_NAME,
      positionGroup: record.POSITION_GROUP,
      position: record.POSITION,
      gameDate: `${year}-${monthString}-${dayString}`,
      gameId: Number(record.GAME_ID),
      homeTeam: record.HOME_TEAM,
      awayTeam: record.AWAY_TEAM,
      eventType: record.EVENT_TYPE,
      shotMade: record.SHOT_MADE === 'TRUE',
      actionType: record.ACTION_TYPE,
      shotType: record.SHOT_TYPE,
      basicZone: record.BASIC_ZONE,
      zoneName: record.ZONE_NAME,
      zoneAbb: record.ZONE_ABB,
      zoneRange: record.ZONE_RANGE,
      locX: record.LOC_X,
      locY: record.LOC_Y,
      shotDistance: record.SHOT_DISTANCE,
      quarter: Number(record.QUARTER),
      minsLeft: Number(record.MINS_LEFT),
      secsLeft: Number(record.SECS_LEFT),
      defRtg: String(defensiveRanking?.stat) ?? '0',
      defRtgRank: defensiveRanking?.rank ?? 0,
      offRtg: String(offensiveRanking?.stat) ?? '0',
      offRtgRank: offensiveRanking?.rank ?? 0,
      playerHeight: '0',
      playerWeight: '0',
      gameWon: gameWinner === teamShortName,
    };

    return shot;
  });

  for (const record of dbRecords) {
    console.log(record);
    // await db.insert(shotsTable).values(record);
  }

  // const exampleShot: typeof shotsTable.$inferInsert = {
  //   season: 2024,
  //   teamId: 1610612764,
  //   teamName: 'Washington Wizards',
  //   playerId: 1629673,
  //   playerName: 'Jordan Poole',
  //   positionGroup: 'G',
  //   position: 'SG',
  //   gameId: 22300003,
  //   gameDate: '11-03-2023',
  //   homeTeam: 'MIA',
  //   awayTeam: 'WAS',
  //   eventType: 'Missed Shot',
  //   shotMade: false,
  //   actionType: 'Driving Floating Jump Shot',
  //   shotType: '2PT Field Goal',
  //   basicZone: 'In The Paint (Non-RA)',
  //   zoneName: 'Center',
  //   zoneAbb: 'C',
  //   zoneRange: '8-16 ft.',
  //   locX: '-0.4',
  //   locY: '17.45',
  //   shotDistance: '12',
  //   quarter: 1,
  //   minsLeft: 11,
  //   secsLeft: 1,
  //   defRtg: '0',
  //   defRtgRank: 0,
  //   offRtg: '0',
  //   offRtgRank: 0,
  //   playerHeight: '0',
  //   playerWeight: '0',
  //   gameWon: false,
  // };
  // await db.insert(shotsTable).values(exampleShot);
}

seed();
