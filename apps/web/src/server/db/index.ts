import { sqlite3Worker1Promiser } from '@sqlite.org/sqlite-wasm';

const log = console.log;
const error = console.error;

const initializeSQLite = async () => {
  try {
    log('Loading and initializing SQLite3 module...');

    const promiser = await new Promise<
      ReturnType<typeof sqlite3Worker1Promiser>
    >((resolve) => {
      const _promiser = sqlite3Worker1Promiser({
        onready: () => resolve(_promiser),
      });
    });

    const configResponse = await promiser('config-get', {});

    log('Running SQLite3 version', configResponse.result.version.libVersion);

    const openResponse = await promiser('open', {
      filename: 'file:nba_db.sqlite?vfs=opfs',
    });

    const { dbId } = openResponse;

    log(
      'OPFS is available, created persisted database at',
      openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1')
    );

    // Execute a query to count the number of rows in the game table
    const countQuery = 'SELECT * FROM game LIMIT 10;';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = [];

    await promiser('exec', {
      dbId,
      sql: countQuery,
      callback: ({ row, rowNumber }) => {
        if (row == null || rowNumber == null) {
          return;
        }

        data.push(row);
      },
      rowMode: 'object',
    });

    console.log('data', data);
  } catch (err) {
    if (!(err instanceof Error)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newError = new Error((err as any).result.message);
      error(newError.name, newError.message);
      return;
    }

    error(err.name, err.message);
  }
};

initializeSQLite();
