import { db } from '@/db';
import { Visualization } from './_components/visualization';
import { shotsTable } from '@/db/schema';

export default async function Home() {
  const shots = await db.select().from(shotsTable).limit(100);

  return (
    <div className="flex w-full h-full p-14">
      <p>{shots.length}</p>
      <Visualization shots={shots} />
    </div>
  );
}
