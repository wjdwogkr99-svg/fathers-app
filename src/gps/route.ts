import { analyzeRoute, detectAutoRest, goodPoint } from '../core/engine';
import type { GpsPoint } from '../core/types';
export type SegmentedSample = GpsPoint & { epoch: number };
/** Separate manually paused legs; no phantom distance across a pause or GPS outage. */
export function calculateTripTrack(samples: SegmentedSample[]) {
  const grouped = new Map<number,GpsPoint[]>();
  for (const sample of samples) {
    const group=grouped.get(sample.epoch) ?? [];
    group.push(sample); grouped.set(sample.epoch,group);
  }
  let distanceM=0,autoRestMs=0,gpsGoodPoints=0;
  for (const group of grouped.values()) {
    const route=analyzeRoute(group);
    distanceM+=route.distanceM;
    autoRestMs+=detectAutoRest(route.accepted);
    gpsGoodPoints+=route.accepted.filter(goodPoint).length;
  }
  return {distanceM,autoRestMs,gpsGoodPoints};
}
