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
  private abortFlag: Int32Array | null = null;

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
    console.log(
      'sqlite3-wasm initialized with version',
      response.version.libVersion,
    );
  }

  private interrupt() {
    if (this.abortFlag != null) {
      Atomics.store(this.abortFlag, 0, 1);
      Atomics.notify(this.abortFlag, 0);
      this.abortFlag = null;
    }
  }

  async exec(sql: string, signal?: AbortSignal) {
    const abortListener = () => {
      this.interrupt();
    };

    let sharedBuffer: SharedArrayBuffer | null = null;

    if (signal) {
      signal.addEventListener('abort', abortListener);
      sharedBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
      this.abortFlag = new Int32Array(sharedBuffer);
    }

    const response = await this.request({
      message: 'exec',
      sql,
      sharedBuffer,
    });

    if (signal) {
      this.abortFlag = null;
      signal.removeEventListener('abort', abortListener);
    }

    return response;
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
}
