import { describe, expect, it } from 'vitest';
import { bearingDegrees, MountainPeak, projectVisiblePeaks, selectPrimaryPeaks, signedAngleDifference, VERIFIED_PEAKS } from '../src/ar/peaks';
import { labelLeft, peakReadiness, postureFromAcceleration } from '../src/ar/readiness';
import catalog from '../src/data/peak-catalog.json';
import { SAMPLE_MOUNTAINS } from '../src/data/sample';
import { createHash } from 'node:crypto';

// Synthetic geometry only; none of these fixtures enter the bundled summit catalog.
const observer={latitude:0,longitude:0,accuracyM:10};
const north:MountainPeak={id:'north',name:'synthetic',region:'test',mountainId:null,
  latitude:.01,longitude:0,elevationM:500,verified:true,source:'test-only'};

describe('direction-based peak projection',()=>{
  it('handles true north wrapping and headings many turns away',()=>{
    expect(signedAngleDifference(1,359)).toBe(2);
    expect(signedAngleDifference(359,1)).toBe(-2);
    expect(signedAngleDifference(1081,-361)).toBe(2);
    expect(projectVisiblePeaks(observer,359,[north],45)[0].horizontalFraction).toBeGreaterThan(.5);
  });
  it('uses perspective, keeps boundaries, and rejects peaks outside the FOV',()=>{
    const bearing=bearingDegrees(observer,north);
    expect(projectVisiblePeaks(observer,bearing-22.5,[north],45)[0].horizontalFraction).toBeCloseTo(1);
    expect(projectVisiblePeaks(observer,bearing+22.5,[north],45)[0].horizontalFraction).toBeCloseTo(0);
    expect(projectVisiblePeaks(observer,bearing-23,[north],45)).toEqual([]);
    const fraction=projectVisiblePeaks(observer,bearing-15,[north],60)[0].horizontalFraction;
    expect(fraction).toBeCloseTo(.5+.5*Math.tan(Math.PI/12)/Math.tan(Math.PI/6));
  });
  it('rejects nonfinite/out-of-range position, accuracy, FOV and range',()=>{
    for(const accuracyM of [NaN,Infinity,-1,51])expect(projectVisiblePeaks({...observer,accuracyM},0,[north])).toEqual([]);
    for(const latitude of [NaN,Infinity,91])expect(projectVisiblePeaks({...observer,latitude},0,[north])).toEqual([]);
    expect(projectVisiblePeaks({...observer,longitude:181},0,[north])).toEqual([]);
    for(const fov of [NaN,Infinity,0,-10,180,200])expect(projectVisiblePeaks(observer,0,[north],fov)).toEqual([]);
    for(const range of [NaN,Infinity,0,-1])expect(projectVisiblePeaks(observer,0,[north],45,range)).toEqual([]);
  });
  it('filters missing/invalid elevations, unverified and invalid coordinates',()=>{
    for(const elevationM of [null,NaN,Infinity,-1])expect(projectVisiblePeaks(observer,0,[{...north,elevationM}])).toEqual([]);
    expect(projectVisiblePeaks(observer,0,[{...north,verified:false}])).toEqual([]);
    expect(projectVisiblePeaks(observer,0,[{...north,latitude:NaN}])).toEqual([]);
    expect(projectVisiblePeaks(observer,0,[{...north,longitude:190}])).toEqual([]);
  });
  it('does not project the observer summit or a far-away peak',()=>{
    expect(projectVisiblePeaks(observer,0,[{...north,latitude:0}])).toEqual([]);
    expect(projectVisiblePeaks(observer,0,[{...north,latitude:1}])).toEqual([]);
    expect(projectVisiblePeaks(observer,0,[north],45,500)).toEqual([]);
  });
  it('shows at most 3 distinct candidates, prioritising centre then distance',()=>{
    const items=[.05,.4,.5,.6,.95].map((horizontalFraction,i)=>({peak:{...north,id:String(i)},
      distanceM:1000,bearing:0,horizontalFraction}));
    const selected=selectPrimaryPeaks([...items,items[2]]);
    expect(selected.map(p=>p.peak.id)).toEqual(['1','2','3']);
    expect(selectPrimaryPeaks([])).toEqual([]);
    expect(selectPrimaryPeaks(items.slice(0,1))).toHaveLength(1);
  });
  it('keeps touch targets within the 13 mini preview at both edges',()=>{
    expect(labelLeft(0,335,235)).toBe(8);
    expect(labelLeft(1,335,235)).toBe(92);
    expect(labelLeft(.5,335,235)).toBe(50);
  });
});

describe('foreground sensor readiness',()=>{
  const now=100_000;
  const position={...observer,timestamp:now};
  const heading={degrees:359,quality:3,timestamp:now};
  const upright=postureFromAcceleration(0,-1,0,now);
  it('accepts fresh accurate true-heading fixes and upright posture',()=>{
    expect(peakReadiness(position,heading,upright,now)).toBeNull();
    expect(peakReadiness({...position,accuracyM:50},{...heading,quality:2},upright,now)).toBeNull();
  });
  it('hides labels for absent, inaccurate, stale or future GPS',()=>{
    for(const p of [null,{...position,accuracyM:51},{...position,accuracyM:NaN},
      {...position,latitude:91},{...position,timestamp:now-20_001},{...position,timestamp:now+1}]){
      expect(peakReadiness(p,heading,upright,now)).not.toBeNull();
    }
  });
  it('does not substitute magnetic north or use low/stale heading quality',()=>{
    for(const h of [null,{...heading,degrees:-1},{...heading,degrees:NaN},{...heading,degrees:360},
      {...heading,quality:1},{...heading,quality:NaN},{...heading,timestamp:now-10_001}]){
      expect(peakReadiness(position,h,upright,now)).not.toBeNull();
    }
  });
  it('blocks tilted, rolled, shaken, missing and stale motion samples',()=>{
    for(const p of [null,postureFromAcceleration(0,-.5,.866,now),postureFromAcceleration(.5,-.866,0,now),
      postureFromAcceleration(0,-2,0,now),postureFromAcceleration(NaN,-1,0,now),
      {...upright,timestamp:now-3001}]){
      expect(peakReadiness(position,heading,p,now)).not.toBeNull();
    }
  });
  it('shows Korean calibration guidance for low-quality compass',()=>{
    expect(peakReadiness(position,{...heading,quality:1},upright,now)).toContain('8자');
  });
});

describe('bundled public summit source contract',()=>{
  it('contains 3 traceable summit points linked to existing mountains, without official badge promotion',()=>{
    expect(catalog.schemaVersion).toBe(1);
    expect(VERIFIED_PEAKS).toHaveLength(3);
    expect(new Set(VERIFIED_PEAKS.map(p=>p.id)).size).toBe(3);
    for(const peak of VERIFIED_PEAKS){
      const mountain=SAMPLE_MOUNTAINS.find(m=>m.id===peak.mountainId);
      expect(mountain).toBeDefined();
      expect(mountain?.officialVerified).toBe(false);
      expect(peak.provenance.url).toBe(`https://api.openstreetmap.org/api/0.6/node/${peak.provenance.nodeId}/${peak.provenance.version}`);
      expect(peak.provenance.license).toBe('ODbL-1.0');
      expect(Number.isFinite(Date.parse(peak.provenance.retrievedAt))).toBe(true);
    }
  });
  it('preserves the source summit tags and canonical evidence checksums',()=>{
    // Same canonical representation as the independent online verifier (Korean keys stay unescaped).
    const canonical=(value:unknown):unknown=>value&&typeof value==='object'&&!Array.isArray(value)?
      Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>[k,canonical(v)])):value;
    for(const {source} of catalog.peaks){
      expect(source.tags.natural).toBe('peak');
      expect(Number(source.tags.ele)).toBeGreaterThan(0);
      expect(source.latitude).toBeGreaterThan(37);
      expect(source.latitude).toBeLessThan(38);
      const fields={nodeId:source.nodeId,version:source.version,nodeTimestamp:source.nodeTimestamp,
        latitude:source.latitude,longitude:source.longitude,tags:source.tags};
      const sha=createHash('sha256').update(JSON.stringify(canonical(fields))).digest('hex');
      expect(sha).toBe(source.sha256);
    }
  });
});
