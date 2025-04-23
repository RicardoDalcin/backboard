import type { ExecOptions } from '@sqlite.org/sqlite-wasm';

declare module '@sqlite.org/sqlite-wasm' {
  type DBMessageResult = {
    dbId: string;
    departureTime: number;
    messageId: string;
    workerReceivedTime: number;
    workerRespondTime: number;
  };

  type PromiserConfigGetMessage = (
    msg: 'config-get',
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    params: {}, // currently ignored and may be elided.
  ) => Promise<{
    result: {
      version: {
        libVersion: string;
        libVersionNumber: number;
        sourceId: string;
        sourceVersion: string;
      };
    };
  }>;

  type PromiserOpenMessage = (
    msg: 'open',
    params: {
      filename: string;
      vfs?: string;
    },
  ) => Promise<
    DBMessageResult & {
      type: 'open';
      result: {
        dbId: string;
        filename: string;
        persistent: boolean;
        vfs: string;
      };
    }
  >;

  type PromiserExecMessage = (
    msg: 'exec',
    params: Omit<ExecOptions, 'callback'> & {
      dbId: string;
      callback: ({
        row,
        rowNumber,
        columnNames,
      }: {
        type: string;
        row: unknown | null;
        rowNumber: number | null;
        columnNames: string[];
      }) => void;
    },
  ) => Promise<
    DBMessageResult & {
      type: 'exec';
      result: {
        callback: string;
        columnNames: string[];
        dbId: string;
        sql: string;
      };
    }
  >;

  type PromiserExportMessage = (
    msg: 'export',
    params: {
      dbId: string;
    },
  ) => Promise<
    DBMessageResult & {
      type: 'export';
      result: {
        byteArray: Uint8Array;
        filename: string;
        mimetype: 'application/x-sqlite3';
      };
    }
  >;

  type Promiser = PromiserConfigGetMessage &
    PromiserOpenMessage &
    PromiserExecMessage &
    PromiserExportMessage;

  export function sqlite3Worker1Promiser(config: {
    onready: () => void;
    debug?: (...data: unknown[]) => void;
  }): Promiser;
}
