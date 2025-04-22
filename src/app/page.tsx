import { db } from '@/db';
import { Visualization } from './_components/visualization';
import { shotsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
  const shots = await db.select().from(shotsTable).where(
    // lte(shotsTable.offRtgRank, 1)
    // and(
    //   eq(shotsTable.teamId, 1610612742),
    //   lte(shotsTable.playerHeight, '6.5')
    // )
    eq(shotsTable.playerId, 201942)
  );

  const zones = getBasicZones(shots);

  return (
    <div className="flex flex-col w-full h-full p-14">
      <Visualization shots={shots} />

      {zones.map((zone) => {
        return (
          <div key={zone.count}>
            {zone.key}: {zone.frequency}% _ {zone.accuracy.toFixed(2)}%
          </div>
        );
      })}
    </div>
  );
}
