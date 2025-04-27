import { useEffect, useRef, useState } from 'react';
import { db } from '@/server/db/index';
import { ClockSummary, Shot, ShotType, Zone } from './types';
import { Court } from './components/viz/court';
import { ZoneRadar } from './components/viz/zone-radar';
import { ClockAreaChart } from './components/viz/clock-area-chart';
import { ShotTypeLineChart } from './components/viz/shot-type-line-chart';

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

function groupByClock(shots: Shot[]) {
  const clocks = new Map<number, ClockSummary>();

  for (const shot of shots) {
    const gameMinute = (shot.quarter - 1) * 12 + (12 - shot.minsLeft);

    if (!clocks.has(gameMinute)) {
      clocks.set(gameMinute, {
        id: gameMinute,
        count: 0,
        totalMade: 0,
        totalMissed: 0,
        accuracy: 0,
        frequency: 0,
      });
    }

    const zoneItem = clocks.get(gameMinute)!;

    zoneItem.count++;

    if (shot.shotMade) {
      zoneItem.totalMade++;
    } else {
      zoneItem.totalMissed++;
    }
  }

  clocks.forEach((zone) => {
    zone.accuracy = zone.totalMade / zone.count;
    zone.frequency = zone.count / shots.length;
  });

  return Array.from(clocks.values()).sort((a, b) => a.id - b.id);
}

function groupByShotType(shots: Shot[]) {
  const clocks3pt = new Map<number, ClockSummary>();
  const clocks2pt = new Map<number, ClockSummary>();

  for (const shot of shots) {
    const gameMinute = (shot.quarter - 1) * 12 + (12 - shot.minsLeft);
    const map = shot.shotType === ShotType.ThreePointer ? clocks3pt : clocks2pt;

    if (!map.has(gameMinute)) {
      map.set(gameMinute, {
        id: gameMinute,
        count: 0,
        totalMade: 0,
        totalMissed: 0,
        accuracy: 0,
        frequency: 0,
      });
    }

    const zoneItem = map.get(gameMinute)!;

    zoneItem.count++;

    if (shot.shotMade) {
      zoneItem.totalMade++;
    } else {
      zoneItem.totalMissed++;
    }
  }

  clocks2pt.forEach((zone) => {
    zone.accuracy = zone.totalMade / zone.count;
    zone.frequency = zone.count / shots.length;
  });

  clocks3pt.forEach((zone) => {
    zone.accuracy = zone.totalMade / zone.count;
    zone.frequency = zone.count / shots.length;
  });

  console.log(clocks2pt);

  return {
    twos: Array.from(clocks2pt.values()).sort((a, b) => a.id - b.id),
    threes: Array.from(clocks3pt.values()).sort((a, b) => a.id - b.id),
  };
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
  const [clockSummary, setClockSummary] = useState<ClockSummary[]>([]);
  const [shotTypeSummary, setShotTypeSummary] = useState<{
    twos: ClockSummary[];
    threes: ClockSummary[];
  }>({ twos: [], threes: [] });

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    const load = async () => {
      await db.load();
      const shotList = await db.getShots(1_000_000, { playerId: 2544 });
      setShots(shotList);

      // const zones = await Promise.all([
      //   await db.getShots(100_000, { playerId: 201942 }),
      //   await db.getShots(100_000, { playerId: 1629029 }),
      //   await db.getShots(100_000, { playerId: 1629023 }),
      // ]);

      // console.log(zones);

      setZoneComparators([
        { id: 1, name: 'LeBron James', zones: getBasicZones(shotList) },
        // {
        //   id: 201942,
        //   name: 'Demar DeRozan',
        //   zones: getBasicZones(zones[0]),
        // },
        // {
        //   id: 1629029,
        //   name: 'Luka Doncic',
        //   zones: getBasicZones(zones[1]),
        // },
        // {
        //   id: 1629023,
        //   name: 'A.J. Lawson',
        //   zones: getBasicZones(zones[2]),
        // },
      ]);

      setClockSummary(groupByClock(shotList));
      setShotTypeSummary(groupByShotType(shotList));
    };

    load();
  }, []);

  return (
    <section className="w-screen min-h-screen overflow-x-hidden flex flex-col px-8 py-12 gap-8">
      <div className="w-full">
        <Court shots={shots} />
      </div>

      <div className="w-full overflow-x-hidden">
        <ZoneRadar data={zoneComparators} />
      </div>

      <div className="w-full overflow-x-hidden">
        <ClockAreaChart data={clockSummary} />
      </div>

      <div className="w-full overflow-x-hidden">
        <ShotTypeLineChart data={shotTypeSummary} />
      </div>
    </section>
  );
}

export default App;
