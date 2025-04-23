import { db } from '@/db';
import { Visualization } from './_components/visualization';
import { shotsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Chart } from './_components/chart';

interface Zone {
  count: number;
  totalMade: number;
  totalMissed: number;
  accuracy: number;
  frequency: number;
}

function getBasicZones(shots: (typeof shotsTable.$inferSelect)[]) {
  const zones = new Map<string, Zone>();

  for (const shot of shots) {
    const zone = shot.basicZone!;

    if (!zones.has(zone)) {
      zones.set(zone, {
        count: 0,
        totalMade: 0,
        totalMissed: 0,
        accuracy: 0,
        frequency: 0,
      });
    }

    const zoneItem = zones.get(zone)!;

    zoneItem.count++;

    if (shot.shotMade) {
      zoneItem.totalMade++;
    } else {
      zoneItem.totalMissed++;
    }
  }

  zones.forEach((zone) => {
    zone.accuracy = zone.totalMade / zone.count;
    zone.frequency = zone.count / shots.length;
  });

  return Array.from(zones.entries()).map(([key, value]) => ({
    key,
    ...value,
  }));
}

export default async function Home() {
  const shots = await db
    .select()
    .from(shotsTable)
    .where(eq(shotsTable.playerId, 201942));

  const shots2 = await db
    .select()
    .from(shotsTable)
    .where(eq(shotsTable.playerId, 1629029));

  const shots3 = await db
    .select()
    .from(shotsTable)
    .where(eq(shotsTable.playerId, 1630639));

  const zones = getBasicZones(shots);
  const zones2 = getBasicZones(shots2);
  const zones3 = getBasicZones(shots3);

  return (
    <div className="flex flex-col w-full h-full p-14">
      <Visualization shots={shots} />

      <Chart
        data={[
          {
            id: 201942,
            name: 'Demar DeRozan',
            zones: zones,
          },
          {
            id: 1629029,
            name: 'Luka Doncic',
            zones: zones2,
          },
          {
            id: 1629023,
            name: 'A.J. Lawson',
            zones: zones3,
          },
        ]}
      />
    </div>
  );
}
