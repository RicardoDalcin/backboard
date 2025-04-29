export interface Shot {
  id: number;
  season: number;
  teamId: number;
  playerId: number;
  positionGroup: string;
  position: string;
  gameDate: string;
  gameId: number;
  homeTeam: string;
  awayTeam: string;
  eventType: string;
  shotMade: number;
  actionType: string;
  shotType: string;
  basicZone: string;
  zoneName: string;
  zoneAbb: string;
  zoneRange: string;
  locX: number;
  locY: number;
  shotDistance: number;
  quarter: number;
  minsLeft: number;
  secsLeft: number;
  defRtg: number;
  defRtgRank: number;
  offRtg: number;
  offRtgRank: number;
  playerHeight: number;
  playerWeight: number;
  gameWon: number;
}

export interface Zone {
  key: string;
  count: number;
  totalMade: number;
  totalMissed: number;
  accuracy: number;
  frequency: number;
}

export interface ClockSummary {
  id: number;
  count: number;
  totalMade: number;
  totalMissed: number;
  accuracy: number;
  frequency: number;
}

export enum ShotType {
  ThreePointer = 1,
  TwoPointer = 2,
}
