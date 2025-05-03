import { useWorker } from '@/server/db/test';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: About,
});

function About() {
  const { loadData, interrupt } = useWorker();

  return (
    <div>
      Hello from About!
      <button onClick={loadData}>Load Data</button>
      <button onClick={interrupt}>Interrupt</button>
    </div>
  );
}
