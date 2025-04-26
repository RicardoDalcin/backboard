import { DatabaseShot, Shot } from '@/types';
import { Promiser, sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

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
  private readonly EXPECTED_DB_SIZE = 690409472;
  private readonly DATABASE_REMOTE_URL =
    'https://4dw9ddnwz7.ufs.sh/f/kS63ApJ1dQxRKr15CLgzM4byFGHmrh32jetNQn9kCi6wdoc5';
  private readonly DATABASE_OPFS_PATH = 'nba_db.sqlite3';

  private fileSystem: FileSystem;
  private db: LocalDatabase;

  constructor() {
    this.fileSystem = new FileSystem();
    this.db = new LocalDatabase(this.DATABASE_OPFS_PATH);
  }

  async load() {
    const dbExists = await this.fileSystem.fileExists(this.DATABASE_OPFS_PATH);
    const fileSize = await this.fileSystem.getFileSize(this.DATABASE_OPFS_PATH);

    console.log(dbExists, fileSize);

    if (!dbExists || fileSize < this.EXPECTED_DB_SIZE) {
      if (dbExists) {
        await this.fileSystem.deleteFile(this.DATABASE_OPFS_PATH);
      }

      await this.downloadDatabase();
    }

    await this.db.init();
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

    return decompressedStream.pipeTo(writable);
  }

  private getFiltersQuery(
    filters: Record<string, unknown>,
    filtersConfig: Record<
      string,
      {
        column: string;
        type: 'INTEGER' | 'TEXT' | 'REAL';
      }
    >,
  ) {
    if (Object.keys(filters).length === 0) {
      return '';
    }

    const filtersQuery = Object.entries(filters)
      .map(([key, value]) => {
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
      })
      .join(' AND ');

    return `WHERE ${filtersQuery}`;
  }

  async getShots(
    count?: number,
    filters?: {
      season?: number;
      teamId?: number;
      playerId?: number;
      basicZone?: string;
    },
  ) {
    const FILTERS = {
      season: { column: 'season', type: 'INTEGER' },
      teamId: { column: 'team_id', type: 'INTEGER' },
      playerId: { column: 'player_id', type: 'INTEGER' },
      basicZone: { column: 'basic_zone', type: 'TEXT' },
    } as const;

    const query = `SELECT loc_x as locX, loc_y as locY, shot_made as shotMade, basic_zone as basicZone
      FROM shots 
      ${filters ? this.getFiltersQuery(filters, FILTERS) : ''}
      LIMIT ${count}`;

    console.log(query);

    return this.db.get<DatabaseShot, Shot>(query);
  }
}

const db = new NBADatabase();

export { db };
