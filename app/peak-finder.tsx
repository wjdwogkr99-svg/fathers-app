import { useEffect, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Alert, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { H1, H2, P, Page, Card, PrimaryButton } from '../src/ui/Kit';
import { C } from '../src/ui/theme';
import { projectVisiblePeaks, VERIFIED_PEAKS, Observer } from '../src/ar/peaks';

export default function PeakFinder(){
  const nav=useRouter();
  const [permission,requestPermission]=useCameraPermissions();
  const [heading,setHeading]=useState<number|null>(null);
  const [headingQuality,setHeadingQuality]=useState(0);
  const [observer,setObserver]=useState<Observer|null>(null);
  const [sensorError,setSensorError]=useState<string|null>(null);
  useEffect(()=>{
    if(!permission?.granted)return;
    let cancelled=false;
    let sub:Location.LocationSubscription|null=null;
    Location.getForegroundPermissionsAsync().then(async p=>{
      if(p.status!=='granted')p=await Location.requestForegroundPermissionsAsync();
      if(p.status!=='granted')throw new Error('방향과 주변 산 거리 계산에 위치 권한이 필요해요.');
      const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});
      if(!cancelled)setObserver({latitude:position.coords.latitude,longitude:position.coords.longitude,
        accuracyM:position.coords.accuracy??9_999});
      sub=await Location.watchHeadingAsync(h=>{
        if(cancelled)return;
        setHeadingQuality(h.accuracy);
        setHeading(h.trueHeading>=0?h.trueHeading:null); // no magnetic heading masquerading as true north
      });
      if(cancelled)sub?.remove();
    }).catch(e=>{if(!cancelled)setSensorError(e instanceof Error?e.message:'센서 연결 실패');});
    return ()=>{cancelled=true;sub?.remove();};
  },[permission?.granted]);
  const labels=observer&&heading!==null&&headingQuality>=2?
    projectVisiblePeaks(observer,heading,VERIFIED_PEAKS):[];
  return <Page>
    <H1>📷 AR 산 찾기</H1>
    <P>카메라에 보이는 산의 이름을 표시할 기능을 위한 시제품입니다.</P>
    {!permission?<P>카메라 권한을 확인하는 중입니다.</P>:
      !permission.granted?<Card>
        <H2>카메라 권한 필요</H2>
        <P>산을 바라보며 정보를 확인하려면 카메라 접근을 허용해야 해요.</P>
        <PrimaryButton title="카메라 권한 허용" onPress={()=>void requestPermission().catch(()=>Alert.alert('오류','카메라 접근 권한을 확인해 주세요.'))}/>
      </Card>:
      <View style={{height:380,borderRadius:18,overflow:'hidden',backgroundColor:'#263B31'}}>
        <CameraView style={{flex:1}} facing="back"/>
        <View pointerEvents="none" style={{position:'absolute',left:10,right:10,top:12,
          padding:12,backgroundColor:'#14251DC9',borderRadius:12}}>
          <Text style={{color:'#FFFFFF',fontSize:19,fontWeight:'800'}}>AR 산 찾기 · 시제품</Text>
          <Text style={{color:'#FFFFFF',fontSize:16}}>
            {heading===null?'방향 측정 중': '바라보는 방향 '+Math.round(heading)+'°'} · {headingQuality<2?'나침반 보정 필요':'방향 센서 연결'}
          </Text>
        </View>
        {labels.map(item=><View key={item.peak.id} pointerEvents="none"
          style={{position:'absolute',left:(item.horizontalFraction*75)+'%',top:'42%',
            backgroundColor:C.green,padding:8,borderRadius:9}}>
          <Text style={{color:C.white,fontSize:18,fontWeight:'800'}}>{item.peak.name}</Text>
        </View>)}
        <View pointerEvents="none" style={{position:'absolute',bottom:14,left:12,right:12,backgroundColor:'#14251DDC',padding:12,borderRadius:10}}>
          <Text style={{fontSize:17,fontWeight:'700',color:C.white}}>산봉우리 좌표 데이터 연결 전 · 산 이름 표시 없음</Text>
        </View>
      </View>}
    {sensorError?<Card><P>{sensorError}</P></Card>:null}
    <Card>
      <H2>현재 구현 범위</H2>
      <P>✓ 카메라 영상과 나침반 방향 시제품</P>
      <P>✓ GPS 위치와 검증된 봉우리 좌표를 결합할 수 있는 계산 모듈</P>
      <P>○ 산봉우리 공식 좌표 데이터 연결 필요</P>
      <P>○ 고도·카메라 기울기·지형 가림 보정 필요</P>
      <P small>이 화면의 산 식별은 아직 작동하지 않습니다. 여행·길 찾기·조난 판단에 사용하지 마세요.</P>
    </Card>
    <PrimaryButton title="홈으로 돌아가기" variant="secondary" onPress={()=>nav.back()}/>
  </Page>;
}
