import { Shot } from '@/types';
import { Promiser, sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

export type ShotColumn = keyof Shot;

export const SHOT_COLUMNS: Record<ShotColumn, string> = {
  id: 'id',
  season: 'season',
  teamId: 'team_id',
  playerId: 'player_id',
  positionGroup: 'position_group',
  position: 'position',
  gameDate: 'game_date',
  gameId: 'game_id',
  homeTeam: 'home_team',
  awayTeam: 'away_team',
  eventType: 'event_type',
  shotMade: 'shot_made',
  actionType: 'action_type',
  shotType: 'shot_type',
  basicZone: 'basic_zone',
  zoneName: 'zone_name',
  zoneAbb: 'zone_abb',
  zoneRange: 'zone_range',
  locX: 'loc_x',
  locY: 'loc_y',
  shotDistance: 'shot_distance',
  quarter: 'quarter',
  minsLeft: 'mins_left',
  secsLeft: 'secs_left',
  defRtg: 'def_rtg',
  defRtgRank: 'def_rtg_rank',
  offRtg: 'off_rtg',
  offRtgRank: 'off_rtg_rank',
  playerHeight: 'player_height',
  playerWeight: 'player_weight',
  gameWon: 'game_won',
};

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

  async get<T = unknown, R = T>(query: string, transform?: (row: T) => R) {
    const data: R[] = [];

    await this.promiser('exec', {
      dbId: this.databaseId,
      sql: query,
      callback: ({ row, rowNumber }) => {
        if (row == null || rowNumber == null) {
          return;
        }

        if (transform) {
          data.push(transform(row as T));
        } else {
          data.push(row as R);
        }
      },
      rowMode: 'object',
    });

    return data;
  }
}

class NBADatabase {
  private readonly EXPECTED_DB_SIZE = 726249472;
  private readonly DATABASE_REMOTE_URL =
    'https://4dw9ddnwz7.ufs.sh/f/kS63ApJ1dQxRL8KRHFuNuUEB7ijsFPhwrtCV9z6A3YWxQbf8';
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

    function trackProgress(chunkSize: number) {
      writtenBytes = (writtenBytes || 0) + chunkSize;
      return {
        writtenBytes: writtenBytes,
        totalBytes: 726249472,
      };
    }
  }

  private getFiltersQuery(
    filters: Record<string, number | string | number[] | string[] | undefined>,
    filtersConfig: Record<
      string,
      {
        column: string;
        type: 'INTEGER' | 'TEXT' | 'REAL' | 'INTEGER_ARRAY' | 'TEXT_ARRAY';
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
      })
      .filter((item) => item !== '')
      .join(' AND ');

    return `WHERE ${filtersQuery}`;
  }

  async getShots<T extends ShotColumn[]>(
    columns: T,
    count?: number,
    filters?: {
      season?: number;
      drtgRanking?: [number, number];
      ortgRanking?: [number, number];
      teamIds?: number[];
      playerIds?: number[];
      positions?: string[];
      result?: 'all' | 'wins' | 'losses';
    },
    signal?: AbortSignal,
  ) {
    const FILTERS = {
      season: { column: 'season', type: 'INTEGER' },
      drtgRanking: { column: 'def_rtg_rank', type: 'INTEGER_ARRAY' },
      ortgRanking: { column: 'off_rtg_rank', type: 'INTEGER_ARRAY' },
      teamIds: { column: 'team_id', type: 'INTEGER_ARRAY' },
      playerIds: { column: 'player_id', type: 'INTEGER_ARRAY' },
      positions: { column: 'position', type: 'TEXT_ARRAY' },
      result: { column: 'game_won', type: 'INTEGER' },
    } as const;

    const filterValues = {
      season: filters?.season,
      drtgRanking:
        filters?.drtgRanking?.[0] === 1 && filters?.drtgRanking[1] === 30
          ? undefined
          : filters?.drtgRanking,
      ortgRanking:
        filters?.ortgRanking?.[0] === 1 && filters?.ortgRanking[1] === 30
          ? undefined
          : filters?.ortgRanking,
      teamIds: filters?.teamIds?.length === 0 ? undefined : filters?.teamIds,
      playerIds:
        filters?.playerIds?.length === 0 ? undefined : filters?.playerIds,
      positions:
        filters?.positions?.length === 5 ? undefined : filters?.positions,
      result:
        !filters?.result || filters?.result === 'all'
          ? undefined
          : filters.result === 'wins'
            ? 1
            : 0,
    };

    const sqlColumns = columns.map(
      (column) => `${SHOT_COLUMNS[column]} as ${column}`,
    );

    const query = `SELECT ${sqlColumns.join(',')} FROM shots 
      ${filters ? this.getFiltersQuery(filterValues, FILTERS) : ''}
      LIMIT ${count}`;

    console.log(query);

    return new Promise<Pick<Shot, T[number]>[]>((resolve, reject) => {
      signal?.addEventListener('abort', () => {
        console.log('Aborting request');
        reject(new Error('Request aborted'));
      });

      this.db.get<Pick<Shot, T[number]>>(query).then(resolve).catch(reject);
    });
  }
}

const db = new NBADatabase();

export { db };
