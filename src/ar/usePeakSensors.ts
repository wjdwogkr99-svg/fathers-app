import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { HeadingFix, PositionFix, PostureFix, postureFromAcceleration } from './readiness';

/** Foreground, read-only sensors. No journal, database, photos or reward writes. */
export function usePeakSensors(enabled:boolean,retry:number) {
  const [position,setPosition]=useState<PositionFix|null>(null);
  const [heading,setHeading]=useState<HeadingFix|null>(null);
  const [posture,setPosture]=useState<PostureFix|null>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    setPosition(null);setHeading(null);setPosture(null);setError(null);
    if(!enabled)return;
    let cancelled=false;
    const subscriptions:{remove:()=>void}[]=[];
    const retain=(sub:{remove:()=>void})=>{if(cancelled)sub.remove();else subscriptions.push(sub);};
    const fail=(message:string)=>{if(!cancelled)setError(message);};
    async function start(){
      let permission=await Location.getForegroundPermissionsAsync();
      if(cancelled)return;
      if(permission.status!=='granted')permission=await Location.requestForegroundPermissionsAsync();
      if(cancelled)return;
      if(permission.status!=='granted')throw new Error('Location permission denied');
      if(!await Location.hasServicesEnabledAsync())throw new Error('service');
      if(cancelled)return;
      // Each task handles its own failure so late subscriptions are still removed on blur/unmount.
      await Promise.all([
        Location.watchPositionAsync({accuracy:Location.Accuracy.High,distanceInterval:0,timeInterval:3000},fix=>{
          if(!cancelled)setPosition({latitude:fix.coords.latitude,longitude:fix.coords.longitude,
            accuracyM:fix.coords.accuracy??Infinity,timestamp:fix.timestamp});
        },()=>fail('위치 갱신에 실패했습니다. 위치 서비스와 정확한 위치 권한을 확인해 주세요.'))
          .then(retain).catch(()=>fail('GPS 센서 연결에 실패했습니다. 위치 권한을 확인해 주세요.')),
        Location.watchHeadingAsync(fix=>{
          if(!cancelled)setHeading({degrees:fix.trueHeading,quality:fix.accuracy,timestamp:Date.now()});
        },()=>fail('방향 센서 갱신에 실패했습니다. 나침반 설정을 확인해 주세요.'))
          .then(retain).catch(()=>fail('나침반 센서에 연결할 수 없습니다.')),
        (async()=>{
          if(!await Accelerometer.isAvailableAsync())throw new Error('unavailable');
          if(cancelled)return;
          const permission=await Accelerometer.requestPermissionsAsync();
          if(cancelled)return;
          if(!permission.granted)throw new Error('denied');
          Accelerometer.setUpdateInterval(200);
          retain(Accelerometer.addListener(({x,y,z})=>{
            if(!cancelled)setPosture(postureFromAcceleration(x,y,z,Date.now()));
          }));
        })().catch(()=>fail('기울기 센서를 사용할 수 없습니다. 동작 센서 권한을 확인해 주세요.')),
      ]);
    }
    void start().catch(()=>fail('위치 서비스와 앱의 위치 권한을 켠 뒤 다시 측정해 주세요.'));
    return ()=>{cancelled=true;subscriptions.forEach(sub=>sub.remove());};
  },[enabled,retry]);
  return {position,heading,posture,error};
}
