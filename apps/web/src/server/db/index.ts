import { Shot } from '@/types';
import { Filter } from '@/types/filters';
import { FileSystem } from './file-system';
import { DBClient } from './client';

export type ShotColumn = keyof Shot;

class NBADatabase {
  private readonly DATABASE_REMOTE_URL =
    'https://4dw9ddnwz7.ufs.sh/f/kS63ApJ1dQxRTtXi3s6HPe4tUi60lOnwKQGLzcdv12MF8IoJ';

  private readonly EXPECTED_DB_SIZE = 816889856;

  private readonly DATABASE_OPFS_PATH = 'nba_db.sqlite3';

  private fileSystem: FileSystem;
  private db: DBClient;

  private progressCallbacks: Set<(progress: number) => void> = new Set();

  constructor() {
    this.fileSystem = new FileSystem();
    this.db = new DBClient(this.DATABASE_OPFS_PATH);
  }

  async load() {
    const dbExists = await this.fileSystem.fileExists(this.DATABASE_OPFS_PATH);
    const fileSize = await this.fileSystem.getFileSize(this.DATABASE_OPFS_PATH);

    if (!dbExists || fileSize != this.EXPECTED_DB_SIZE) {
      if (dbExists) {
        await this.fileSystem.deleteFile(this.DATABASE_OPFS_PATH);
      }

      await this.downloadDatabase();
    }

    await this.db.init();
  }

  subscribeLoadProgress(callback: (progress: number) => void) {
    this.progressCallbacks.add(callback);
    return () => {
      this.progressCallbacks.delete(callback);
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
          return `${column} BETWEEN ${(value as [number, number])[0]} AND ${(value as [number, number])[1]}`;
        }
      })
      .filter((item) => item !== '')
      .join(' AND ');

    return `WHERE ${filtersQuery}`;
  }

  async getShots<T extends ShotColumn[]>(
    columns: T,
    count?: number,
    filters?: Partial<Filter>,
    signal?: AbortSignal,
  ) {
    const FILTERS = {
      season: { column: 'season', type: 'RANGE' },
      drtgRanking: { column: 'defRtgRank', type: 'RANGE' },
      ortgRanking: { column: 'offRtgRank', type: 'RANGE' },
      teamIds: { column: 'teamId', type: 'INTEGER_ARRAY' },
      playerIds: { column: 'playerId', type: 'INTEGER_ARRAY' },
      positions: { column: 'position', type: 'TEXT_ARRAY' },
      result: { column: 'gameWon', type: 'INTEGER' },
    } as const;

    const filterValues = {
      season: filters?.season,
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
      teamIds: filters?.teams?.length === 0 ? undefined : filters?.teams,
      playerIds: filters?.players?.length === 0 ? undefined : filters?.players,
      positions:
        filters?.positions?.length === 5 ? undefined : filters?.positions,
      result:
        !filters?.result || filters?.result === 'all'
          ? undefined
          : filters.result === 'wins'
            ? 1
            : 0,
    };

    const query = `SELECT ${columns.join(',')} FROM shots 
      ${filters ? this.getFiltersQuery(filterValues, FILTERS) : ''}
      LIMIT ${count}`;

    if (import.meta.env.DEV) {
      console.log(query);
    }

    // return new Promise<Pick<Shot, T[number]>[]>((resolve, reject) => {
    //   this.db
    //     .exec<Pick<Shot, T[number]>>(query, signal)
    //     .then(resolve)
    //     .catch(reject);
    // });
    return [];
  }

  async test(filters?: Partial<Filter>) {
    const FILTERS = {
      season: { column: 'season', type: 'RANGE' },
      drtgRanking: { column: 'defRtgRank', type: 'RANGE' },
      ortgRanking: { column: 'offRtgRank', type: 'RANGE' },
      teamIds: { column: 'teamId', type: 'INTEGER_ARRAY' },
      playerIds: { column: 'playerId', type: 'INTEGER_ARRAY' },
      positions: { column: 'position', type: 'TEXT_ARRAY' },
      result: { column: 'gameWon', type: 'INTEGER' },
    } as const;

    const filterValues = {
      season: filters?.season,
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
      teamIds: filters?.teams?.length === 0 ? undefined : filters?.teams,
      playerIds: filters?.players?.length === 0 ? undefined : filters?.players,
      positions:
        filters?.positions?.length === 5 ? undefined : filters?.positions,
      result:
        !filters?.result || filters?.result === 'all'
          ? undefined
          : filters.result === 'wins'
            ? 1
            : 0,
    };

    const sql = `
      SELECT
      locX,
      locY
      FROM test_shots
      ${filters ? this.getFiltersQuery(filterValues, FILTERS) : ''}
      GROUP BY locX, locY;
      `;
    console.log(sql);
    const startTime = performance.now();
    const data = await this.db.exec(sql);
    console.log('test perf: ', performance.now() - startTime);
    return data;
  }
}

const db = new NBADatabase();

export { db };
