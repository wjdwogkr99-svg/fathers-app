import type { MountainPeak } from '../ar/peaks';
import catalog from './peak-catalog.json';

/** Public summit data only. Never substitute mountain centres or personal GPS tracks. */
export interface SourcedPeak extends MountainPeak {
  elevationM:number;
  provenance:{
    provider:'OpenStreetMap';
    nodeId:number;
    version:number;
    url:string;
    retrievedAt:string;
    license:'ODbL-1.0';
    sha256:string;
  };
}

/** Verified here means matched to the cited source, not surveyed or visually identified. */
export const VERIFIED_PEAKS:readonly SourcedPeak[]=catalog.peaks.map(record=>({
  id:record.id,mountainId:record.mountainId,name:record.name,region:record.region,
  latitude:record.source.latitude,longitude:record.source.longitude,
  elevationM:Number(record.source.tags.ele),source:record.source.url,verified:true,
  provenance:{provider:'OpenStreetMap',nodeId:record.source.nodeId,version:record.source.version,
    url:record.source.url,retrievedAt:record.source.retrievedAt,license:'ODbL-1.0',sha256:record.source.sha256},
}));
