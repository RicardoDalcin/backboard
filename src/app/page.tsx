import { db } from '@/db';
import { Visualization } from './_components/visualization';
import { shotsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function Home() {
  const shots = await db
    .select()
    .from(shotsTable)
    .where(eq(shotsTable.gameId, 22300192));

  return (
    <div className="flex w-full h-full p-14">
      <Visualization shots={shots} />
    </div>
  );
}
