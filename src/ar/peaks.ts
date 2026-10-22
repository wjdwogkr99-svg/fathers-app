import { haversineMeters } from '../core/engine';
/** This catalog must be populated from a verified peak-coordinate data source, not mountain names alone. */
export interface MountainPeak {
  id:string;
  mountainId:string|null;
  name:string;
  region:string;
  latitude:number;
  longitude:number;
  elevationM:number|null;
  source:string;
  verified:boolean;
}
export interface Observer {
  latitude:number;
  longitude:number;
  accuracyM:number;
}
export { VERIFIED_PEAKS } from '../data/peaks';
const toRad=(v:number)=>v*Math.PI/180;
const toDeg=(v:number)=>v*180/Math.PI;
export function normalize360(v:number){return ((v%360)+360)%360;}
export function bearingDegrees(from:Observer,to:MountainPeak):number {
  const phi1=toRad(from.latitude),phi2=toRad(to.latitude);
  const dLon=toRad(to.longitude-from.longitude);
  const y=Math.sin(dLon)*Math.cos(phi2);
  const x=Math.cos(phi1)*Math.sin(phi2)-Math.sin(phi1)*Math.cos(phi2)*Math.cos(dLon);
  return normalize360(toDeg(Math.atan2(y,x)));
}
export function signedAngleDifference(target:number,heading:number):number {
  return normalize360(target-heading+180)-180;
}
export function validCoordinates(p:{latitude:number;longitude:number}):boolean {
  return Number.isFinite(p.latitude)&&Math.abs(p.latitude)<=90&&
    Number.isFinite(p.longitude)&&Math.abs(p.longitude)<=180;
}
export interface ProjectedPeak {
  peak:MountainPeak;
  distanceM:number;
  bearing:number;
  /** Estimated horizontal direction, NOT an image-space summit detection. */
  horizontalFraction:number;
}
/** Heading-based 2D *approximation*, not ARKit and not accurate visual summit matching. */
export function projectVisiblePeaks(
  observer:Observer,headingDegrees:number,peaks:readonly MountainPeak[],
  horizontalFovDegrees=60,maxDistanceM=45_000
):ProjectedPeak[] {
  if(!validCoordinates(observer)||!Number.isFinite(observer.accuracyM)||observer.accuracyM>50||
    observer.accuracyM<0||!Number.isFinite(headingDegrees)||!Number.isFinite(horizontalFovDegrees)||
    horizontalFovDegrees<=0||horizontalFovDegrees>=180||!Number.isFinite(maxDistanceM)||maxDistanceM<=0)return[];
  return peaks.filter(p=>p.verified&&validCoordinates(p)&&Number.isFinite(p.elevationM)&&p.elevationM!==null&&p.elevationM>=0).flatMap(peak=>{
    const distanceM=haversineMeters({...observer,timestamp:0}, {...peak,accuracyM:0,timestamp:0});
    if(distanceM>maxDistanceM||distanceM<50)return[];
    const bearing=bearingDegrees(observer,peak);
    const delta=signedAngleDifference(bearing,headingDegrees);
    if(Math.abs(delta)>horizontalFovDegrees/2)return[];
    return [{peak,distanceM,bearing,horizontalFraction:
      0.5+0.5*Math.tan(toRad(delta))/Math.tan(toRad(horizontalFovDegrees/2))}];
  }).sort((a,b)=>a.distanceM-b.distanceM);
}

/** Prefer the direction near the centre, then distance; never invent extra candidates. */
export function selectPrimaryPeaks(items:readonly ProjectedPeak[]):ProjectedPeak[] {
  const unique=[...new Map(items.map(item=>[item.peak.id,item])).values()];
  return unique.sort((a,b)=>Math.abs(a.horizontalFraction-.5)-Math.abs(b.horizontalFraction-.5)||
    a.distanceM-b.distanceM||a.peak.id.localeCompare(b.peak.id)).slice(0,3)
    .sort((a,b)=>a.horizontalFraction-b.horizontalFraction||a.peak.id.localeCompare(b.peak.id));
}
