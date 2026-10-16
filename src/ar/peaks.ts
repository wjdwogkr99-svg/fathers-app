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
/** No peak coordinates are bundled yet. Never invent official summit locations. */
export const VERIFIED_PEAKS:readonly MountainPeak[]=[];
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
  return ((target-heading+540)%360)-180;
}
export interface ProjectedPeak {
  peak:MountainPeak;
  distanceM:number;
  bearing:number;
  /** Relative horizontal position 0 to 1 on the camera preview. Elevation not modeled yet. */
  horizontalFraction:number;
}
/** Heading-based 2D *approximation*, not ARKit and not accurate visual summit matching. */
export function projectVisiblePeaks(
  observer:Observer,headingDegrees:number,peaks:readonly MountainPeak[],
  horizontalFovDegrees=60,maxDistanceM=45_000
):ProjectedPeak[] {
  if(observer.accuracyM>100||observer.accuracyM<0||!Number.isFinite(headingDegrees)||horizontalFovDegrees<=0)return[];
  return peaks.filter(p=>p.verified).flatMap(peak=>{
    const distanceM=haversineMeters({...observer,timestamp:0}, {...peak,accuracyM:0,timestamp:0});
    if(distanceM>maxDistanceM||distanceM<50)return[];
    const bearing=bearingDegrees(observer,peak);
    const delta=signedAngleDifference(bearing,headingDegrees);
    if(Math.abs(delta)>horizontalFovDegrees/2)return[];
    return [{peak,distanceM,bearing,horizontalFraction:0.5+delta/horizontalFovDegrees}];
  }).sort((a,b)=>a.distanceM-b.distanceM);
}
