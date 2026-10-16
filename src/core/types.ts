export type TripSource = 'demo' | 'gps' | 'past';
export type TripStatus = 'recording' | 'paused' | 'finished';
export type GpsQuality = 'good' | 'weak' | 'missing';
export interface Mountain {
  id: string;
  name: string;
  region: string;
  official100: boolean;
  officialVerified: boolean;
}
export interface GpsPoint {
  latitude: number;
  longitude: number;
  accuracyM: number;
  timestamp: number;
}
export interface Trip {
  id: string;
  source: TripSource;
  status: TripStatus;
  startedAt: number;
  endedAt: number | null;
  pausedAt: number | null;
  manualPausedMs: number;
  autoRestMs: number;
  distanceM: number;
  gpsGoodPoints: number;
  gpsEpoch?: number; // increment after manual pause so two walking segments are not joined
  mountainId: string | null;
  note: string;
}
export type RewardStatus = 'earned' | 'locked';
export const RULES = {
  minExerciseMs: 15 * 60_000,
  minDistanceM: 300,
  minGpsPoints: 3,
  restThresholdMs: 30 * 60_000,
  restRadiusM: 30,
  maxAccuracyM: 50,
  maxGapMs: 90_000,
  maxHikingSpeedMps: 6,
} as const;
