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

  async get<T = unknown>(query: string) {
    const data: T[] = [];

    await this.promiser('exec', {
      dbId: this.databaseId,
      sql: query,
      callback: ({ row, rowNumber }) => {
        if (row == null || rowNumber == null) {
          return;
        }

        data.push(row as T);
      },
      rowMode: 'object',
    });

    return data;
  }
}

class NBADatabase {
  private readonly DATABASE_REMOTE_URL =
    'https://4dw9ddnwz7.ufs.sh/f/kS63ApJ1dQxRrpm3dxcaL40zYZTcws8SuWH6vUFBfnKOyhj5';

  private readonly DATABASE_OPFS_PATH = 'nba_db.sqlite3';

  private fileSystem: FileSystem;
  private db: LocalDatabase;

  constructor() {
    this.fileSystem = new FileSystem();
    this.db = new LocalDatabase(this.DATABASE_OPFS_PATH);
  }

  async load() {
    const dbExists = await this.fileSystem.fileExists(this.DATABASE_OPFS_PATH);

    if (!dbExists) {
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
}

const db = new NBADatabase();

export { db };
