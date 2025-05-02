import { Shot } from '@/types';
import { Filter } from '@/types/filters';
// import { Promiser, sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';
import { Promiser, sqlite3Worker1Promiser } from '@nba-viz/sqlite-wasm';

export type ShotColumn = keyof Shot;

class FileSystem {
  private opfsRoot: FileSystemDirectoryHandle | null = null;

  constructor() {}

  async fileExists(path: string) {
    if (this.opfsRoot == null) {
      this.opfsRoot = await navigator.storage.getDirectory();
    }

    try {
      const fileHandle = await this.opfsRoot.getFileHandle(path, {
        create: false,
      });

      return fileHandle.kind === 'file';
    } catch {
      return false;
    }
  }

  async getFileSize(path: string) {
    if (this.opfsRoot == null) {
      this.opfsRoot = await navigator.storage.getDirectory();
    }

    try {
      const fileHandle = await this.opfsRoot.getFileHandle(path, {
        create: false,
      });

      const file = await fileHandle.getFile();
      return file.size;
    } catch {
      return 0;
    }
  }

  async deleteFile(path: string) {
    if (this.opfsRoot == null) {
      this.opfsRoot = await navigator.storage.getDirectory();
    }

    if (!this.fileExists(path)) {
      return;
    }

    return this.opfsRoot.removeEntry(path);
  }

  async createFile(path: string) {
    if (this.opfsRoot == null) {
      this.opfsRoot = await navigator.storage.getDirectory();
    }

    const fileHandle = await this.opfsRoot.getFileHandle(path, {
      create: true,
    });

    return fileHandle;
  }
}

class LocalDatabase {
  private databaseId = '';
  private promiser!: Promiser;

  constructor(private readonly filePath: string) {}

  async init() {
    if (this.databaseId) {
      return;
    }

    this.promiser = await new Promise((resolve) => {
      const _promiser = sqlite3Worker1Promiser({
        onready: () => resolve(_promiser),
      });
    });

    const configResponse = await this.promiser('config-get', {});

    if (import.meta.env.DEV) {
      console.log(
        'Running SQLite3 version',
        configResponse.result.version.libVersion,
      );
    }

    const openResponse = await this.promiser('open', {
      filename: `file:${this.filePath}?vfs=opfs`,
    });

    const { dbId } = openResponse;
    this.databaseId = dbId;

    if (import.meta.env.DEV) {
      console.log(
        'OPFS is available, created persisted database at',
        openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1'),
      );
    }
  }

  reqId = 0;

  async get<T = unknown, R = T>(query: string, signal?: AbortSignal) {
    const data: R[] = [];

    const promise = new Promise<R[]>((resolve, reject) => {
      signal?.addEventListener('abort', () => {
        reject(new Error('Request aborted'));
      });

      this.promiser('exec', {
        dbId: this.databaseId,
        sql: query,
        callback: ({ row, rowNumber }) => {
          if (row == null || rowNumber == null || signal?.aborted) {
            return;
          }
          data.push(...(row as R[]));
        },
        rowMode: 'object',
      }).then(() => resolve(data));
    });

    return promise;
  }
}

class NBADatabase {
  private readonly DATABASE_REMOTE_URL =
    'https://4dw9ddnwz7.ufs.sh/f/kS63ApJ1dQxRaBCOmu0lsZDq8Igcjn3Jtk9OL42UdxB7hNwF';

  private readonly EXPECTED_DB_SIZE = 820256768;

  private readonly DATABASE_OPFS_PATH = 'nba_db.sqlite3';

  private fileSystem: FileSystem;
  private db: LocalDatabase;

  private progressCallbacks: Set<(progress: number) => void> = new Set();

  constructor() {
    this.fileSystem = new FileSystem();
    this.db = new LocalDatabase(this.DATABASE_OPFS_PATH);
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

    console.log(query);

    return new Promise<Pick<Shot, T[number]>[]>((resolve, reject) => {
      this.db
        .get<Pick<Shot, T[number]>>(query, signal)
        .then(resolve)
        .catch(reject);
    });
  }
}

const db = new NBADatabase();

export { db };
