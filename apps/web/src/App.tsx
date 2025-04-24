import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/server/db/index';

function App() {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    db.load().then(() => {
      console.log('loaded db');
    });
  }, []);

  return (
    <section className="w-screen h-screen flex items-center justify-center">
      <Button onClick={() => {}}>Create file</Button>
    </section>
  );
}

export default App;
