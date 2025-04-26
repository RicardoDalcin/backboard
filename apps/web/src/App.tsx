import { useEffect, useRef, useState } from 'react';
import { db } from '@/server/db/index';
import { Shot, Zone } from './types';
import { Court } from './components/viz/court';
import { ZoneRadar } from './components/viz/zone-radar';

function getBasicZones(shots: Shot[]) {
  const zones = new Map<string, Zone>();

  for (const shot of shots) {
    const zone = shot.basicZone!;

    if (!zones.has(zone)) {
      zones.set(zone, {
        key: zone,
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

  return Array.from(zones.values());
}

function App() {
  const hasInitialized = useRef(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [zoneComparators, setZoneComparators] = useState<
    {
      id: number;
      name: string;
      zones: Zone[];
    }[]
  >([]);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    const load = async () => {
      await db.load();
      const shotList = await db.getShots(1_000_000, { playerId: 2544 });
      setShots(shotList);

      const zones = await Promise.all([
        await db.getShots(100_000, { playerId: 201942 }),
        await db.getShots(100_000, { playerId: 1629029 }),
        await db.getShots(100_000, { playerId: 1629023 }),
      ]);

      console.log(zones);

      setZoneComparators([
        {
          id: 201942,
          name: 'Demar DeRozan',
          zones: getBasicZones(zones[0]),
        },
        {
          id: 1629029,
          name: 'Luka Doncic',
          zones: getBasicZones(zones[1]),
        },
        {
          id: 1629023,
          name: 'A.J. Lawson',
          zones: getBasicZones(zones[2]),
        },
      ]);
    };

    load();
  }, []);

  return (
    <section className="w-screen min-h-screen overflow-x-hidden flex flex-col py-12">
      <div className="w-full">
        <Court shots={shots} />
      </div>

      <div className="w-full overflow-x-hidden">
        <ZoneRadar data={zoneComparators} />
      </div>
    </section>
  );
}

export default App;
