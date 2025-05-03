import { useEffect, useRef } from 'react';
import { DBClient } from './client';

export function useWorker() {
  const initialized = useRef(false);
  const client = useRef(new DBClient('nba_db.sqlite3'));

  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    const init = async () => {
      await client.current.init();
      console.log('@useTest - client initialized successfully');
    };

    init();
  }, [client]);

  function loadData() {
    abortController.current?.abort();
    abortController.current = new AbortController();
    client.current.exec(
      'SELECT * FROM shots LIMIT 100_000',
      abortController.current.signal,
    );
  }

  function interrupt() {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
  }

  return {
    loadData,
    interrupt,
  };
}
