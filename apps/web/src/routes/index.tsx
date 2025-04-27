import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/server/db';
import { Loader } from './-components/loader';

export const Route = createFileRoute('/')({
  component: Index,
  loader: () => db.load(),
  pendingComponent: Loader,
});

function Index() {
  return (
    <div className="min-h-screen pt-[var(--nav-height)]">
      <h3>Welcome Home!</h3>
    </div>
  );
}
