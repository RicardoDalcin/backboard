type BasicMessage = {
  requestId: number;
};

export type InitRequest = {
  message: 'init';
  filePath: string;
};

export type InitResponse = {
  version: {
    libVersion: string;
    libVersionNumber: number;
    sourceId: string;
  };
};

export type CloseResponse = {
  result: 'success';
};

export type ExecRequest = {
  message: 'exec';
  sql: string;
  sharedBuffer: SharedArrayBuffer | null;
};

export type CloseRequest = {
  message: 'close';
};

export type ExecResponse = {
  rows: unknown[];
};

export type WorkerRequest = InitRequest | ExecRequest | CloseRequest;
export type WorkerRequestMessage = BasicMessage & WorkerRequest;

export type WorkerResponse = {
  init: InitResponse;
  exec: ExecResponse;
  close: CloseResponse;
};

export type WorkerResponseMessage = BasicMessage &
  (
    | {
        result: 'success';
        data: WorkerResponse[keyof WorkerResponse];
      }
    | {
        result: 'error';
        error: string;
      }
  );
