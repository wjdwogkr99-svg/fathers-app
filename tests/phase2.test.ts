import { describe,expect,it } from 'vitest';
import { calculateTripTrack } from '../src/gps/route';
import { bearingDegrees, normalize360, projectVisiblePeaks, signedAngleDifference, VERIFIED_PEAKS } from '../src/ar/peaks';
const t=100_000;
const p=(timestamp:number,longitude=127,epoch=0)=>({timestamp,latitude:37,longitude,accuracyM:5,epoch});
describe('gps storage projection',()=>{
  it('counts a valid short path but not a cross-segment jump',()=>{
    const a=calculateTripTrack([p(t),p(t+10_000,127.0001),p(t+20_000,127.5,1),p(t+30_000,127.5001,1)]);
    expect(a.distanceM).toBeGreaterThan(10);
    expect(a.distanceM).toBeLessThan(35);
    expect(a.gpsGoodPoints).toBe(4);
  });
  it('does not turn sparse GPS signal into rest',()=>{
    const a=calculateTripTrack([p(t),p(t+31*60_000)]);
    expect(a.autoRestMs).toBe(0);
  });
  it('includes a real confirmed 30-minute stationary window',()=>{
    const a=calculateTripTrack(Array.from({length:31},(_,i)=>p(t+i*60_000)));
    expect(a.autoRestMs).toBe(30*60_000);
  });
  it('a pause changes epoch so rest does not span the pause',()=>{
    const a=calculateTripTrack([...Array.from({length:16},(_,i)=>p(t+i*60_000)),
      ...Array.from({length:16},(_,i)=>p(t+16*60_000+i*60_000,127,1))]);
    expect(a.autoRestMs).toBe(0);
  });
});
describe('AR-ready peak math',()=>{
  const observer={latitude:37,longitude:127,accuracyM:10};
  const peak={id:'p',mountainId:null,name:'검증용 좌표',region:'테스트',latitude:37.01,longitude:127,elevationM:100,source:'test-only',verified:true};
  it('north bearing is 0 and angle wraps across 0',()=>{
    expect(bearingDegrees(observer,peak)).toBeCloseTo(0,3);
    expect(normalize360(-10)).toBe(350);
    expect(signedAngleDifference(0,350)).toBe(10);
  });
  it('projects verified peak at center but ignores unverified',()=>{
    const x=projectVisiblePeaks(observer,0,[peak]);
    expect(x).toHaveLength(1);
    expect(x[0].horizontalFraction).toBeCloseTo(.5);
    expect(projectVisiblePeaks(observer,0,[{...peak,verified:false}])).toEqual([]);
  });
  it('does not render labels without data, accuracy or heading',()=>{
    expect(VERIFIED_PEAKS).toHaveLength(0);
    expect(projectVisiblePeaks(observer,0,VERIFIED_PEAKS)).toEqual([]);
    expect(projectVisiblePeaks({...observer,accuracyM:200},0,[peak])).toEqual([]);
    expect(projectVisiblePeaks(observer,Number.NaN,[peak])).toEqual([]);
  });
});
