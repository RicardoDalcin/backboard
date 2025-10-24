import { Shot } from '@/types';
import { Filter, POSITIONS_SIMPLIFIED } from '@/types/filters';
import { FileSystem } from './file-system';
import { DBClient } from './client';

export type ShotColumn = keyof Shot;

class NBADatabase {
  private readonly DATABASE_REMOTE_URL =
    'https://4dw9ddnwz7.ufs.sh/f/kS63ApJ1dQxRYKZb6hgpJwOPuckzGp2RTn9IfMbgFCQ4aq8D';

  private readonly EXPECTED_DB_SIZE = 855556096;

  private readonly DATABASE_OPFS_PATH = 'nba_db.sqlite3';

  private fileSystem: FileSystem;
  private db: DBClient;

  private progressCallbacks: Set<(progress: number) => void> = new Set();
  private phaseCallbacks: Set<(phase: 'downloading' | 'initializing') => void> =
    new Set();
  private initPhase: 'downloading' | 'initializing' = 'downloading';
  private initProgress = 0;

  constructor() {
    this.fileSystem = new FileSystem();
    this.db = new DBClient(this.DATABASE_OPFS_PATH);
  }

  async load() {
    const dbExists = await this.fileSystem.fileExists(this.DATABASE_OPFS_PATH);
    const fileSize = await this.fileSystem.getFileSize(this.DATABASE_OPFS_PATH);

    console.log(fileSize);
    if (!dbExists || fileSize != this.EXPECTED_DB_SIZE) {
      this.initPhase = 'downloading';
      this.phaseCallbacks.forEach((callback) => callback('downloading'));

      if (dbExists) {
        await this.fileSystem.deleteFile(this.DATABASE_OPFS_PATH);
      }

      await this.downloadDatabase();
    }

    this.initProgress = 1;
    this.initPhase = 'initializing';
    this.phaseCallbacks.forEach((callback) => callback('initializing'));
    await this.db.init();
  }

  async getStorageSize() {
    return this.fileSystem.getFileSize(this.DATABASE_OPFS_PATH);
  }

  subscribeLoadProgress(callback: (progress: number) => void) {
    if (this.initProgress > 0) {
      callback(this.initProgress);
    }

    this.progressCallbacks.add(callback);
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  subscribeLoadPhase(
    callback: (phase: 'downloading' | 'initializing') => void,
  ) {
    if (this.initPhase === 'initializing') {
      callback('initializing');
    }

    this.phaseCallbacks.add(callback);
    return () => {
      this.phaseCallbacks.delete(callback);
    };
  }

  private async downloadDatabase() {
    const response = await fetch(this.DATABASE_REMOTE_URL);
    const compressedStream = response.body;

    if (!compressedStream) {
      throw new Error('Failed to fetch database file');
    }

    const decompressionStream = new DecompressionStream('gzip');
    const decompressedStream =
      compressedStream.pipeThrough(decompressionStream);

    const file = await this.fileSystem.createFile(this.DATABASE_OPFS_PATH);
    const writable = await file.createWritable();

    let writtenBytes = 0;

    const trackProgress = (chunkSize: number) => {
      writtenBytes = (writtenBytes || 0) + chunkSize;
      return {
        writtenBytes: writtenBytes,
        totalBytes: this.EXPECTED_DB_SIZE,
      };
    };

    // Create a new stream with a transform for tracking progress
    const progressTrackingStream = new TransformStream({
      transform: (chunk, controller) => {
        // Update progress
        const { writtenBytes, totalBytes } = trackProgress(chunk.byteLength);
        const progress = writtenBytes / totalBytes;

        // Call the progress callbacks
        this.progressCallbacks.forEach((callback) => callback(progress));

        // Forward the chunk to the next stream
        controller.enqueue(chunk);
      },
    });

    // Pipe the decompressed stream through the progress tracking stream
    return decompressedStream
      .pipeThrough(progressTrackingStream)
      .pipeTo(writable);
  }

  private getFiltersQuery(
    filters: Record<string, number | string | number[] | string[] | undefined>,
    filtersConfig: Record<
      string,
      {
        column: string;
        type:
          | 'INTEGER'
          | 'TEXT'
          | 'REAL'
          | 'INTEGER_ARRAY'
          | 'TEXT_ARRAY'
          | 'RANGE';
      }
    >,
  ) {
    if (Object.keys(filters).length === 0) {
      return '';
    }

    const filtersQuery = Object.entries(filters)
      .map(([key, value]) => {
        if (value === undefined) {
          return '';
        }

        const { column, type } = filtersConfig[key];

        if (type === 'INTEGER') {
          return `${column} = ${value}`;
        }

        if (type === 'TEXT') {
          return `${column} = '${value}'`;
        }

        if (type === 'REAL') {
          return `${column} = ${value}`;
        }

        if (type === 'INTEGER_ARRAY') {
          return `${column} IN (${(value as number[]).join(',')})`;
        }

        if (type === 'TEXT_ARRAY') {
          return `${column} IN (${(value as string[]).map((item) => `'${item}'`).join(',')})`;
        }

        if (type === 'RANGE') {
          const range = value as [number, number];

          if (range[0] === range[1]) {
            return `${column} = ${range[0]}`;
          }

          return `${column} BETWEEN ${range[0]} AND ${range[1]}`;
        }
      })
      .filter((item) => item !== '')
      .join(' AND ');

    return `WHERE ${filtersQuery}`;
  }

  private getPositionsFilter(positions: string[]) {
    const allPositions = positions.flatMap((pos) => {
      const position = POSITIONS_SIMPLIFIED.find((p) => p.label === pos);
      return position?.values || [];
    });
    return allPositions;
  }

  private getShotsTableFilters(filters: Partial<Filter>) {
    const FILTERS = {
      season: { column: 'season', type: 'RANGE' },
      drtgRanking: { column: 'defRtgRank', type: 'RANGE' },
      ortgRanking: { column: 'offRtgRank', type: 'RANGE' },
      teamIds: { column: 'teamId', type: 'INTEGER_ARRAY' },
      playerIds: { column: 'playerId', type: 'INTEGER_ARRAY' },
      positions: { column: 'position', type: 'INTEGER_ARRAY' },
      result: { column: 'gameWon', type: 'INTEGER' },
    } as const;

    const filterValues = {
      season: filters?.season,
      teamIds: filters?.teams?.length === 0 ? undefined : filters?.teams,
      playerIds: filters?.players?.length === 0 ? undefined : filters?.players,
      positions:
        !filters?.positions || filters?.positions?.length === 5
          ? undefined
          : this.getPositionsFilter(filters?.positions),
      result:
        !filters?.result || filters?.result === 'all'
          ? undefined
          : filters.result === 'wins'
            ? 1
            : 0,
      drtgRanking:
        !filters ||
        !filters.defensiveRatingRank ||
        (filters.defensiveRatingRank[0] === 1 &&
          filters.defensiveRatingRank[1] === 30)
          ? undefined
          : filters?.defensiveRatingRank,
      ortgRanking:
        !filters ||
        !filters.offensiveRatingRank ||
        (filters.offensiveRatingRank[0] === 1 &&
          filters.offensiveRatingRank[1] === 30)
          ? undefined
          : filters?.offensiveRatingRank,
    };

    return this.getFiltersQuery(filterValues, FILTERS);
  }

  async getShots<T extends ShotColumn[]>(
    columns: T,
    count?: number,
    filters?: Partial<Filter>,
    signal?: AbortSignal,
  ) {
    const query = `SELECT ${columns.join(',')} FROM shots 
      ${filters ? this.getShotsTableFilters(filters) : ''}
      LIMIT ${count}`;

    if (import.meta.env.DEV) {
      console.log(query);
    }

    return new Promise<Pick<Shot, T[number]>[]>((resolve, reject) => {
      this.db
        .exec<Pick<Shot, T[number]>>(query, signal)
        .then(resolve)
        .catch(reject);
    });
  }

  async getCourtShotData(filters?: Partial<Filter>) {
    const query = `
      SELECT
      locX,
      locY,
      count(*) as totalShots,
      SUM(shotMade) as totalMade,
      quarter,
      minsLeft
      FROM mem.shots
      ${filters ? this.getShotsTableFilters(filters) : ''}
      GROUP BY locX, locY, quarter, minsLeft;
      `;

    if (import.meta.env.DEV) {
      console.log(query);
    }

    const startTime = performance.now();
    const data = await this.db.exec<{
      locX: number;
      locY: number;
      totalShots: number;
      totalMade: number;
      quarter: number;
      minsLeft: number;
    }>(query);

    if (import.meta.env.DEV) {
      console.log(
        `Court shot data: time elapsed ${(Number(performance.now() - startTime) / 1000).toFixed(2)}s`,
      );
    }

    return data;
  }

  async getStatSummary(filters: Partial<Filter>) {
    const query = `
      SELECT
      basicZone,
      SUM(shotMade) as totalMade,
      COUNT(*) as totalShots
      FROM mem.shots
      ${filters ? this.getShotsTableFilters(filters) : ''}
      GROUP BY basicZone
    `;

    if (import.meta.env.DEV) {
      console.log(query);
    }

    const startTime = performance.now();
    const data = await this.db.exec<{
      basicZone: 1 | 2 | 3 | 4 | 5 | 6 | 7;
      totalMade: number;
      totalShots: number;
    }>(query);

    if (import.meta.env.DEV) {
      console.log(
        `Stat summary: time elapsed ${(Number(performance.now() - startTime) / 1000).toFixed(2)}s`,
      );
    }

    return data;
  }

  async deleteData() {
    await this.db.close();
    await this.fileSystem.deleteFile(this.DATABASE_OPFS_PATH);
  }
}

const db = new NBADatabase();

export { db };
