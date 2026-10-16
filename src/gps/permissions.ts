import * as Location from 'expo-location';
import type {GpsPoint} from '../core/types';
export function fromExpoLocation(location:Location.LocationObject):GpsPoint {
  const {latitude,longitude,accuracy}=location.coords;
  return {latitude,longitude,accuracyM:accuracy??9_999,timestamp:location.timestamp};
}
export async function requireForegroundGps():Promise<void> {
  const services=await Location.hasServicesEnabledAsync();
  if(!services)throw new Error('아이폰 설정에서 위치 서비스를 켜 주세요.');
  const permission=await Location.requestForegroundPermissionsAsync();
  if(permission.status!=='granted')throw new Error('아이폰 설정에서 앱 위치 권한을 허용해 주세요.');
}
