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
    const start = performance.now();
    this.db.exec('ATTACH DATABASE ":memory:" as mem');
    this.db.exec(
      'CREATE TABLE IF NOT EXISTS mem.shots AS SELECT * FROM main.shots',
    );
    const end = performance.now();

    if (import.meta.env.DEV) {
      console.log(
        `Memory DB creation time: ${((end - start) / 1000).toFixed(2)}s`,
      );
    }

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

  private async close() {
    if (this.sqlite3 == null || this.db == null) {
      throw new Error('sqlite3 not initialized');
    }

    this.db.close();
    this.sqlite3 = null;
    this.db = null;
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
        case 'close': {
          await this.close();
          this.respond(data, { result: 'success' });
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
