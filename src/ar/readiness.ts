import { Observer, validCoordinates } from './peaks';

export interface PositionFix extends Observer {timestamp:number}
export interface HeadingFix {degrees:number;quality:number;timestamp:number}
export interface PostureFix {tiltDegrees:number;rollDegrees:number;steady:boolean;timestamp:number}

/** Gravity approximation: deliberately no vertical summit projection without calibrated pose/DEM. */
export function postureFromAcceleration(x:number,y:number,z:number,timestamp:number):PostureFix {
  const magnitude=Math.hypot(x,y,z);
  return {
    tiltDegrees:Math.atan2(Math.abs(z),Math.hypot(x,y))*180/Math.PI,
    rollDegrees:Math.atan2(Math.abs(x),Math.abs(y))*180/Math.PI,
    steady:Number.isFinite(magnitude)&&Math.abs(magnitude-1)<.15,
    timestamp,
  };
}
const fresh=(timestamp:number,now:number,maxAge:number)=>Number.isFinite(timestamp)&&
  Number.isFinite(now)&&now>=timestamp&&now-timestamp<=maxAge;

export function peakReadiness(position:PositionFix|null,heading:HeadingFix|null,posture:PostureFix|null,now:number):string|null {
  if(!position||!validCoordinates(position)||!Number.isFinite(position.accuracyM)||position.accuracyM<0)
    return '현재 위치를 기다리는 중입니다. 위치 권한과 정확한 위치를 켜 주세요.';
  if(!fresh(position.timestamp,now,20_000))return '위치 갱신이 멈췄습니다. 하늘이 열린 곳에서 다시 측정해 주세요.';
  if(position.accuracyM>50)return 'GPS 오차가 큽니다. 하늘이 열린 곳에서 정확도 50m 이하가 될 때까지 기다려 주세요.';
  if(!heading||!Number.isFinite(heading.degrees)||heading.degrees<0||heading.degrees>=360||
    !fresh(heading.timestamp,now,10_000))return '진북 방향을 기다리는 중입니다. 위치·나침반 설정을 확인해 주세요.';
  if(!Number.isFinite(heading.quality)||heading.quality<2||heading.quality>3)
    return '나침반 보정이 필요합니다. 금속·자석 케이스에서 떨어져 아이폰을 천천히 8자로 움직여 주세요.';
  if(!posture||!fresh(posture.timestamp,now,3_000)||!Number.isFinite(posture.tiltDegrees)||!Number.isFinite(posture.rollDegrees))
    return '기울기 센서를 기다리는 중입니다. 동작 센서 접근을 확인해 주세요.';
  if(!posture.steady)return '아이폰을 잠시 멈추고 안정적으로 들어 주세요.';
  if(posture.tiltDegrees>20||posture.rollDegrees>15)
    return '아이폰을 세로로 똑바로 세우고 카메라를 수평으로 향해 주세요.';
  return null;
}

/** Keep entire touch target within the preview, including at either FOV edge. */
export function labelLeft(horizontalFraction:number,previewWidth:number,labelWidth:number):number {
  return Math.max(8,Math.min(previewWidth-labelWidth-8,horizontalFraction*previewWidth-labelWidth/2));
}
