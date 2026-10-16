import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { fromExpoLocation } from './permissions';
import { allTrips, ingestGpsSample } from '../storage/database';
/**
 * Registered at module scope for an eventual custom iOS development build.
 * Do NOT start in Expo Go; Expo Go cannot perform background location tracking.
 * Future task: add a user-controlled opt-in and test a signed iOS development build.
 */
export const GPS_BACKGROUND_TASK='naisangil-background-gps-v1';
TaskManager.defineTask<{locations:Location.LocationObject[]}>(GPS_BACKGROUND_TASK,async({data,error})=>{
  if(error||!data?.locations?.length)return;
  try {
    const trip=(await allTrips()).find(t=>t.source==='gps'&&t.status==='recording');
    if(!trip)return;
    for(const location of data.locations){await ingestGpsSample(trip.id,fromExpoLocation(location));}
  }catch(e){console.warn('백그라운드 GPS 저장에 실패했습니다.',e);}
});
/** Call only from a properly signed development build after explicit Always permission. */
export async function startNativeBackgroundGps():Promise<void> {
  if(!await TaskManager.isAvailableAsync())throw new Error('백그라운드 작업을 지원하지 않는 실행 환경입니다.');
  const permission=await Location.requestBackgroundPermissionsAsync();
  if(permission.status!=='granted')throw new Error('아이폰 위치 권한을 항상 허용으로 변경해야 합니다.');
  if(await Location.hasStartedLocationUpdatesAsync(GPS_BACKGROUND_TASK))return;
  await Location.startLocationUpdatesAsync(GPS_BACKGROUND_TASK,{
    accuracy:Location.Accuracy.High,
    distanceInterval:10,
    pausesUpdatesAutomatically:false,
    showsBackgroundLocationIndicator:true,
  });
}
export async function stopNativeBackgroundGps():Promise<void> {
  if(await Location.hasStartedLocationUpdatesAsync(GPS_BACKGROUND_TASK))
    await Location.stopLocationUpdatesAsync(GPS_BACKGROUND_TASK);
}
