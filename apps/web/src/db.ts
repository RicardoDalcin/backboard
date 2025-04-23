import sqlite3InitModule, { Sqlite3Static } from "@sqlite.org/sqlite-wasm";

const log = console.log;
const error = console.error;

const start = (sqlite3: Sqlite3Static) => {
  log("Running SQLite3 version", sqlite3.version.libVersion);
  const db = new sqlite3.oo1.DB("file:nba3.sqlite?vfs=opfs", "ct", "");
  // Your SQLite code here.

  // db.exec({
  //   sql: "select count(*) from sqlite_master",
  //   callback: (row) => {
  //     log("asdasd");
  //     log(row);
  //   },
  // });

  // db.exec({
  //   sql: "select count(*) from game",
  //   callback: (row) => {
  //     console.log("asdasdasd");
  //     console.log(row);
  //   },
  // });

  log("Creating a table...");
  db.exec("CREATE TABLE IF NOT EXISTS t(a,b)");
  log("Insert some data using exec()...");
  for (let i = 20; i <= 25; ++i) {
    db.exec({
      sql: "INSERT INTO t(a,b) VALUES (?,?)",
      bind: [i, i * 2],
    });
  }
  log("Query data with exec()...");
  db.exec({
    sql: "SELECT a FROM t ORDER BY a LIMIT 3",
    callback: (row) => {
      log(row);
    },
  });
  db.close();
};

const initializeSQLite = async () => {
  try {
    log("Loading and initializing SQLite3 module...");
    const sqlite3 = await sqlite3InitModule({
      print: log,
      printErr: error,
    });
    log("Done initializing. Running demo...");
    start(sqlite3);
  } catch (err) {
    error("Initialization error:", (err as Error).name, (err as Error).message);
  }
};

initializeSQLite();
