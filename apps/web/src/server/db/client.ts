import { PromiseCell } from './promise-cell';
import Worker from './sqlite.worker?worker';
import {
  WorkerRequest,
  WorkerRequestMessage,
  WorkerResponse,
  WorkerResponseMessage,
} from './types';

export class DBClient {
  private databaseId = '';
  private worker = new Worker();
  private requestId = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingRequests = new Map<number, PromiseCell<any>>();

  constructor(private readonly filePath: string) {
    this.worker.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  async init() {
    if (this.databaseId) {
      return;
    }

    const response = await this.request({
      message: 'init',
      filePath: this.filePath,
    });
    if (import.meta.env.DEV) {
      console.log(
        'sqlite3-wasm initialized with version',
        response.version.libVersion,
      );
    }
  }

  async exec<Row = unknown>(sql: string, signal?: AbortSignal) {
    let abortFlag: Int32Array | null = null;

    let sharedBuffer: SharedArrayBuffer | null = null;

    if (signal) {
      sharedBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
      abortFlag = new Int32Array(sharedBuffer);
    }

    const abortListener = () => {
      if (abortFlag) {
        Atomics.store(abortFlag, 0, 1);
        Atomics.notify(abortFlag, 0);
      }
    };

    signal?.addEventListener('abort', abortListener);

    const response = await this.request({
      message: 'exec',
      sql,
      sharedBuffer,
    });

    if (signal) {
      signal.removeEventListener('abort', abortListener);
    }

    return response.rows as Row[];
  }

  private async request<T extends WorkerRequest>(
    request: T,
  ): Promise<WorkerResponse[T['message']]> {
    const requestId = ++this.requestId;
    const promise = PromiseCell.create<WorkerResponse[T['message']]>();

    this.pendingRequests.set(requestId, promise);

    this.worker.postMessage(<WorkerRequestMessage>{
      requestId,
      ...request,
    });

    return promise;
  }

  private handleMessage(event: MessageEvent<WorkerResponseMessage>) {
    const { data } = event;

    const promise = this.pendingRequests.get(data.requestId);
    if (!promise) {
      return;
    }

    if (data.result === 'error') {
      promise.reject(data.error);
      return;
    }

    this.pendingRequests.delete(data.requestId);
    promise.resolve(data.data);
  }

  async close() {
    await this.request({
      message: 'close',
    });
  }
}
