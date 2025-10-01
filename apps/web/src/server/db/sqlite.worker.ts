import sqlite3InitModule, {
  OpfsDatabase,
  Sqlite3Static,
} from '@sqlite.org/sqlite-wasm';
import {
  ExecRequest,
  InitRequest,
  WorkerRequestMessage,
  WorkerResponse,
  WorkerResponseMessage,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const log = (...args: any[]) => console.log('@worker', ...args);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const error = (...args: any[]) => console.error('@worker', ...args);

class WorkerHandler {
  private sqlite3: Sqlite3Static | null = null;
  private db: OpfsDatabase | null = null;

  constructor() {
    self.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  private async init(request: InitRequest) {
    if (this.db != null && this.sqlite3 != null) {
      return this.sqlite3.version;
    }

    this.sqlite3 = await sqlite3InitModule({ print: log, printErr: error });
    this.db = new this.sqlite3.oo1.OpfsDb(request.filePath, 'rw');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS test_shots (
        id INTEGER PRIMARY KEY,
        shotMade INTEGER,
        locX INTEGER,
        locY INTEGER
      ) WITHOUT ROWID;

      -- CREATE INDEX IF NOT EXISTS playerId_index on test_shots (playerId);
      -- CREATE INDEX IF NOT EXISTS season_index on test_shots (season);
      -- CREATE INDEX IF NOT EXISTS teamId_index on test_shots (teamId);
      -- CREATE INDEX IF NOT EXISTS defRtgRank_index on test_shots (defRtgRank);
      -- CREATE INDEX IF NOT EXISTS offRtgRank_index on test_shots (offRtgRank);

      CREATE INDEX IF NOT EXISTS position_index on test_shots (locX, locY);

      INSERT INTO test_shots (id, shotMade, locX, locY) select id, shotMade, locX, locY from shots;
    `);

    return this.sqlite3.version;
  }

  private async exec(request: ExecRequest) {
    if (this.sqlite3 == null || this.db == null) {
      throw new Error('sqlite3 not initialized');
    }

    const abortFlag =
      request.sharedBuffer != null
        ? new Int32Array(request.sharedBuffer)
        : null;

    let rowNumber = 0;

    const data = this.db.exec(request.sql, {
      callback: () => {
        rowNumber++;
        if (rowNumber % 5_000 === 0) {
          if (abortFlag != null && Atomics.load(abortFlag, 0) === 1) {
            this.interrupt();
            return;
          }
        }
      },
      rowMode: 'object',
      returnValue: 'resultRows',
    });

    return data;
  }

  private interrupt() {
    if (this.sqlite3 == null || this.db == null) {
      throw new Error('sqlite3 not initialized');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.sqlite3.capi as any).sqlite3_interrupt(this.db.pointer);

    return;
  }

  private async handleMessage(event: MessageEvent<WorkerRequestMessage>) {
    const { data } = event;

    try {
      switch (data.message) {
        case 'init': {
          const version = await this.init(data);
          this.respond(data, { version });
          break;
        }
        case 'exec': {
          const result = await this.exec(data);
          this.respond(data, { rows: result });
          break;
        }
        default:
          break;
      }
    } catch (err) {
      this.error(data, (err as Error).message);
    }
  }

  private respond<T extends WorkerRequestMessage>(
    request: T,
    data: WorkerResponse[T['message']],
  ) {
    self.postMessage(<WorkerResponseMessage>{
      result: 'success',
      requestId: request.requestId,
      data,
    });
  }

  private error<T extends WorkerRequestMessage>(request: T, error: string) {
    self.postMessage(<WorkerResponseMessage>{
      result: 'error',
      requestId: request.requestId,
      error,
    });
  }
}

new WorkerHandler();
