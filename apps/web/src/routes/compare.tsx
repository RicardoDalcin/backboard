import { db } from '@/server/db';
import { createFileRoute } from '@tanstack/react-router';
import { Loader } from './-components/loader';

export const Route = createFileRoute('/compare')({
  component: RouteComponent,
  loader: () => db.load(),
  pendingComponent: Loader,
});

function RouteComponent() {
  return <div>Hello "/compare"!</div>;
}
