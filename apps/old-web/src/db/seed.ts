import 'dotenv/config';

import { parse } from 'csv-parse/sync';
import { readFile } from 'fs/promises';

import { db } from '.';
import { shotsTable } from './schema';

import { TEAMS_BY_NAME } from '../../scripts/league-utils';

import { defensiveRatings } from '../../data/defensive';
import { offensiveRatings } from '../../data/offensive';
import { players } from '../../data/players';
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

interface Player {
  player_id: number;
  name: string;
  height: string;
  weight: string;
  birthdate: string;
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

const roundTo = (num: number, precision: number) => {
  return Math.round(num * 10 ** precision) / 10 ** precision;
};

async function seed() {
  const playersCache = new PlayerCache();

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
      (item) => item.team === teamShortName,
    );
    const defensiveRanking = defensiveMonth?.rankings.find(
      (item) => item.team === teamShortName,
    );

    const winnersSeason = winners[record.SEASON_2 as keyof typeof winners];
    const gameWinner = winnersSeason[`00${record.GAME_ID}`];

    const player = playersCache.get(record.PLAYER_ID);

    const playerFt = Number(player.height.substring(0, 1));
    const playerIn = Number(player.height.substring(2, player.height.length));

    const playerHeight = roundTo(playerFt + playerIn / 12, 3);

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

  // insert in 1000 chunks
  for (let i = 0; i < dbRecords.length; i += 1000) {
    console.log(
      `Inserting chunk ${i / 1000}/${Math.ceil(dbRecords.length / 1000)}`,
    );
    const chunk = dbRecords.slice(i, i + 1000);
    await db.insert(shotsTable).values(chunk);
  }
}

seed();
