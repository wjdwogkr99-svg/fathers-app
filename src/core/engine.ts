import { GpsPoint, Mountain, RULES, Trip } from './types';

export function elapsedMs(trip: Trip, now: number = Date.now()): number {
  return Math.max(0, (trip.endedAt ?? now) - trip.startedAt);
}
export function manualPauseMs(trip: Trip, now: number = Date.now()): number {
  return trip.manualPausedMs + (trip.pausedAt === null ? 0 : Math.max(0, (trip.endedAt ?? now) - trip.pausedAt));
}
export function exerciseMs(trip: Trip, now: number = Date.now()): number {
  return Math.max(0, elapsedMs(trip, now) - manualPauseMs(trip, now) - trip.autoRestMs);
}
export function restMs(trip: Trip, now: number = Date.now()): number {
  return Math.min(elapsedMs(trip, now), manualPauseMs(trip, now) + trip.autoRestMs);
}
export function formatDuration(ms: number): string {
  const seconds = Math.floor(Math.max(0, ms) / 1_000);
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return h + ':' + m + ':' + s;
}
export function haversineMeters(a: GpsPoint, b: GpsPoint): number {
  const r = 6_371_000;
  const toRad = Math.PI / 180;
  const lat1 = a.latitude * toRad;
  const lat2 = b.latitude * toRad;
  const dLat = (b.latitude - a.latitude) * toRad;
  const dLon = (b.longitude - a.longitude) * toRad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(x)));
}
export function goodPoint(p: GpsPoint): boolean {
  return Number.isFinite(p.latitude) && Number.isFinite(p.longitude) &&
    Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180 &&
    Number.isFinite(p.timestamp) && Number.isFinite(p.accuracyM) &&
    p.accuracyM >= 0 && p.accuracyM <= RULES.maxAccuracyM;
}
export function analyzeRoute(points: GpsPoint[]): { distanceM: number; accepted: GpsPoint[]; rejected: number } {
  const ordered = [...points].sort((a,b) => a.timestamp-b.timestamp);
  const accepted: GpsPoint[] = [];
  let distanceM = 0;
  let rejected = 0;
  for (const p of ordered) {
    if (!goodPoint(p)) { rejected++; continue; }
    const prev = accepted[accepted.length-1];
    if (!prev) { accepted.push(p); continue; }
    const dt = p.timestamp - prev.timestamp;
    if (dt <= 0) { rejected++; continue; }
    if (dt > RULES.maxGapMs) { accepted.push(p); continue; } // never interpolate gaps
    const distance = haversineMeters(prev, p);
    if (distance / (dt / 1_000) > RULES.maxHikingSpeedMps) { rejected++; continue; }
    if (distance >= 3) distanceM += distance; // suppress small GPS jitter
    accepted.push(p);
  }
  return { distanceM, accepted, rejected };
}
/** GPS absence never counts as rest. Requires consecutive, sufficiently accurate stationary samples. */
export function detectAutoRest(points: GpsPoint[], now?: number): number {
  const p = [...points].filter(goodPoint).sort((a,b) => a.timestamp - b.timestamp);
  let anchor: GpsPoint | null = null;
  let started: number | null = null;
  let last: number | null = null;
  let total = 0;
  function flush() {
    if (started !== null && last !== null && last-started >= RULES.restThresholdMs) total += last-started;
    started = null; last = null;
  }
  for (const curr of p) {
    if (!anchor) { anchor = curr; continue; }
    const dt = curr.timestamp - anchor.timestamp;
    if (dt <= 0 || dt > RULES.maxGapMs) { flush(); anchor = curr; continue; }
    if (haversineMeters(anchor, curr) <= RULES.restRadiusM) {
      if (started === null) started = anchor.timestamp;
      last = curr.timestamp;
      // Keep the anchor at the original stationarity location, but use last sample to validate continuity.
      anchor = { ...anchor, timestamp: curr.timestamp };
    } else {
      flush(); anchor = curr;
    }
  }
  if (now !== undefined && last !== null && started !== null && now-last <= RULES.maxGapMs && now >= last) {
    last = now;
  }
  flush();
  return total;
}
export function isQualifiedGps(trip: Trip, at: number = Date.now()): boolean {
  return trip.source === 'gps' && trip.status === 'finished' && trip.endedAt !== null &&
    trip.mountainId !== null && trip.gpsGoodPoints >= RULES.minGpsPoints &&
    trip.distanceM >= RULES.minDistanceM && exerciseMs(trip, at) >= RULES.minExerciseMs;
}
export function earnedMountainIds(trips: Trip[]): Set<string> {
  return new Set(trips.filter(isQualifiedGps).map(t => t.mountainId).filter((x): x is string => x !== null));
}
export function badgeProgress(trips: Trip[], mountains: Mountain[]) {
  const earned = earnedMountainIds(trips);
  const official = new Set(mountains.filter(m => m.official100 && m.officialVerified).map(m => m.id));
  return { all: earned.size, official: [...earned].filter(id => official.has(id)).length };
}
export function visitedMountainIds(trips: Trip[]): Set<string> {
  return new Set(trips.filter(t => t.status === 'finished' && t.mountainId !== null).map(t => t.mountainId as string));
}
