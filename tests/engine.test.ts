import { describe, expect, it } from 'vitest';
import { analyzeRoute, badgeProgress, detectAutoRest, elapsedMs, earnedMountainIds, exerciseMs, formatDuration, isQualifiedGps, restMs } from '../src/core/engine';
import { GpsPoint, Trip } from '../src/core/types';
import { SAMPLE_MOUNTAINS } from '../src/data/sample';
const T = 1_000_000;
function p(time: number, latitude = 37.6, longitude = 127.0): GpsPoint {
  return { timestamp: time, latitude, longitude, accuracyM: 6 };
}
function trip(patch: Partial<Trip> = {}): Trip {
  return { id:'one',source:'gps',status:'finished',startedAt:T,endedAt:T+60*60_000,
    pausedAt:null,manualPausedMs:0,autoRestMs:0,distanceM:2_000,gpsGoodPoints:20,
    mountainId:'sample-bukhansan',note:'',...patch };
}
describe('timekeeping', () => {
  it('preserves elapsed and subtracts manual pause / confirmed auto rest', () => {
    const t = trip({ manualPausedMs:300_000, autoRestMs:1_800_000 });
    expect(elapsedMs(t)).toBe(3_600_000);
    expect(exerciseMs(t)).toBe(1_500_000);
    expect(restMs(t)).toBe(2_100_000);
  });
  it('formats clock without drifting', () => expect(formatDuration(3_661_999)).toBe('01:01:01'));
});
describe('GPS filtering and auto rest', () => {
  it('does not accept GPS jumps as walking distance', () => {
    const x = analyzeRoute([p(T),p(T+10_000,37.61),p(T+20_000,37.6001)]);
    expect(x.rejected).toBe(1);
    expect(x.distanceM).toBeLessThan(30);
  });
  it('does not interpolate position gaps', () => {
    const x = analyzeRoute([p(T),p(T+600_000,37.61)]);
    expect(x.distanceM).toBe(0);
  });
  it('29 minutes stopped is not automatic rest', () => {
    const points = Array.from({length:30},(_,i)=>p(T+i*60_000));
    expect(detectAutoRest(points)).toBe(0);
  });
  it('30 minutes stopped counts from first stop', () => {
    const points = Array.from({length:31},(_,i)=>p(T+i*60_000));
    expect(detectAutoRest(points)).toBe(1_800_000);
  });
  it('no signal for 30 minutes is not rest', () => {
    expect(detectAutoRest([p(T),p(T+1_800_000)])).toBe(0);
  });
});
describe('awards and record integrity', () => {
  it('requires named GPS route and distance and time and good points', () => {
    expect(isQualifiedGps(trip())).toBe(true);
    expect(isQualifiedGps(trip({mountainId:null}))).toBe(false);
    expect(isQualifiedGps(trip({distanceM:299}))).toBe(false);
    expect(isQualifiedGps(trip({endedAt:T+14*60_000}))).toBe(false);
    expect(isQualifiedGps(trip({gpsGoodPoints:1}))).toBe(false);
  });
  it('never grants demo or manual visits badges', () => {
    expect(earnedMountainIds([trip({source:'demo'}),trip({source:'past'})]).size).toBe(0);
  });
  it('counts each mountain once even after repeats', () => {
    expect(earnedMountainIds([trip(),trip({id:'two'})]).size).toBe(1);
  });
  it('recalculates awards from renamed/deleted trips', () => {
    const a = trip();
    expect(badgeProgress([a],SAMPLE_MOUNTAINS).all).toBe(1);
    expect(badgeProgress([{...a,mountainId:'sample-seoraksan'}],SAMPLE_MOUNTAINS).all).toBe(1);
    expect(badgeProgress([],SAMPLE_MOUNTAINS).all).toBe(0);
  });
  it('has no unverified official 100-mountain rewards', () => {
    expect(badgeProgress([trip()],SAMPLE_MOUNTAINS).official).toBe(0);
  });
});
