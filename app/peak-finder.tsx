import { useCallback, useEffect, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Alert, AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { H1, H2, P, Page, Card, PrimaryButton } from '../src/ui/Kit';
import { C } from '../src/ui/theme';
import { projectVisiblePeaks, selectPrimaryPeaks, VERIFIED_PEAKS } from '../src/ar/peaks';
import { labelLeft, peakReadiness } from '../src/ar/readiness';
import { usePeakSensors } from '../src/ar/usePeakSensors';

const FOV_OPTIONS=[35,45,55] as const;

export default function PeakFinder(){
  const nav=useRouter();
  const [permission,requestPermission]=useCameraPermissions();
  const [focused,setFocused]=useState(false);
  const [appActive,setAppActive]=useState(AppState.currentState==='active');
  const [retry,setRetry]=useState(0);
  const [now,setNow]=useState(Date.now());
  const [width,setWidth]=useState(0);
  const [fov,setFov]=useState<number>(45);
  const [cameraReady,setCameraReady]=useState(false);
  const [cameraError,setCameraError]=useState<string|null>(null);
  useFocusEffect(useCallback(()=>{
    setFocused(true);
    return ()=>setFocused(false);
  },[]));
  useEffect(()=>{
    const sub=AppState.addEventListener('change',state=>setAppActive(state==='active'));
    return ()=>sub.remove();
  },[]);
  const enabled=Boolean(permission?.granted&&focused&&appActive);
  const {position,heading,posture,error}=usePeakSensors(enabled,retry);
  useEffect(()=>{
    setCameraReady(false);setCameraError(null);
    if(!enabled)return;
    setNow(Date.now());
    const timer=setInterval(()=>setNow(Date.now()),1000);
    return ()=>clearInterval(timer);
  },[enabled,retry]);
  const guidance=peakReadiness(position,heading,posture,Math.max(now,Date.now()));
  const labels=enabled&&cameraReady&&!cameraError&&!error&&!guidance&&position&&heading?
    selectPrimaryPeaks(projectVisiblePeaks(position,heading.degrees,VERIFIED_PEAKS,fov)):[];
  const labelWidth=Math.min(290,Math.max(0,width-16));
  const status=cameraError??error??(!cameraReady?'카메라를 준비하고 있습니다.':guidance)??
    (VERIFIED_PEAKS.length===0?'출처가 검증된 봉우리 데이터가 아직 없습니다.':
      labels.length===0?'이 방향·45km 안에는 등록된 봉우리 후보가 없습니다. 천천히 방향을 바꿔 보세요.':
        '방향 기반 후보입니다. 지형에 가려진 산도 표시될 수 있습니다.');
  function askCamera(){
    if(permission?.canAskAgain===false){
      void Linking.openSettings().catch(()=>Alert.alert('설정 열기 실패','아이폰 설정에서 카메라 권한을 허용해 주세요.'));
    }else{
      void requestPermission().catch(()=>Alert.alert('권한 확인 실패','아이폰 설정에서 카메라 권한을 확인해 주세요.'));
    }
  }
  return <Page>
    <H1>📷 AR 산 찾기</H1>
    <P>바라보는 방향의 산봉우리 후보 · 시제품</P>
    <P small>GPS와 나침반으로 계산한 예상 방향입니다. 영상 속 실제 봉우리를 식별하거나 정상 도착을 인증하지 않습니다.</P>
    {!permission?<P>카메라 권한을 확인하는 중입니다.</P>:
      !permission.granted?<Card>
        <H2>카메라 권한 필요</H2>
        <P>카메라 영상 위에 주변 봉우리 정보를 표시합니다. 사진을 촬영하거나 저장하지 않습니다.</P>
        <PrimaryButton title={permission.canAskAgain?'카메라 권한 허용':'설정에서 카메라 허용'} onPress={askCamera}/>
      </Card>:enabled?<View onLayout={event=>setWidth(event.nativeEvent.layout.width)} style={s.preview}>
        <CameraView key={retry} style={StyleSheet.absoluteFill} facing="back" zoom={0}
          selectedLens="builtInWideAngleCamera"
          onCameraReady={()=>setCameraReady(true)}
          onMountError={()=>{setCameraReady(false);setCameraError('카메라를 열지 못했습니다. 카메라 권한 확인 후 다시 측정해 주세요.');}}/>
        <View pointerEvents="none" style={s.heading}>
          <Text maxFontSizeMultiplier={1.2} style={s.whiteTitle}>{heading&&heading.degrees>=0?`진북 기준 ${Math.round(heading.degrees)}°`:'진북 방향 측정 중'}</Text>
          <Text maxFontSizeMultiplier={1.2} style={s.whiteSmall}>{position&&Number.isFinite(position.accuracyM)?`GPS 오차 ${Math.round(position.accuracyM)}m`:'GPS 측정 중'} · {heading&&heading.quality>=2?`방향 오차 <${heading.quality===3?20:35}°`:'나침반 보정 필요'}</Text>
        </View>
        {labels.map((item,index)=><View key={item.peak.id} pointerEvents="box-none" style={[s.lane,{top:90+index*86}]}>
          <View pointerEvents="none" style={[s.direction,{left:Math.max(2,Math.min(width-4,item.horizontalFraction*width))}]}/>
          <Pressable accessibilityRole="button"
            accessibilityLabel={`${item.peak.name}, 해발 ${item.peak.elevationM}미터, 직선거리 ${(item.distanceM/1000).toFixed(1)}킬로미터, 산 도감 열기`}
            onPress={()=>item.peak.mountainId?nav.push({pathname:'/mountain/[id]',params:{id:item.peak.mountainId}}):nav.push('/mountains')}
            style={({pressed})=>[s.label,{width:labelWidth,left:labelLeft(item.horizontalFraction,width,labelWidth),opacity:pressed?.8:1}]}>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={s.whiteTitle}>{item.peak.name} ›</Text>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={s.whiteSmall}>해발 {item.peak.elevationM?.toLocaleString('ko-KR')}m · 직선 {(item.distanceM/1000).toFixed(1)}km</Text>
          </Pressable>
        </View>)}
        <View pointerEvents="none" style={s.notice}>
          <Text maxFontSizeMultiplier={1.2} style={s.whiteSmall}>{status}</Text>
        </View>
      </View>:<Card><P>화면으로 돌아오면 카메라와 센서를 다시 연결합니다.</P></Card>}
    {permission?.granted?<>
      <P small>이름표의 높이는 실제 봉우리 높이가 아닙니다. 가로 위치도 추정 화각·센서 오차에 따라 달라집니다.</P>
      <View style={s.fovRow}>{FOV_OPTIONS.map(value=><Pressable key={value} accessibilityRole="button"
        accessibilityState={{selected:fov===value}} accessibilityLabel={`추정 수평 화각 ${value}도`}
        onPress={()=>setFov(value)} style={[s.fovButton,fov===value&&s.selected]}>
        <Text style={{color:fov===value?C.white:C.text,fontSize:17,fontWeight:'700'}}>{value}°</Text>
      </Pressable>)}</View>
      <P small>추정 수평 화각: {fov}° · 기기의 실제 화각을 측정한 값이 아닙니다. 후면 기본 렌즈·줌 1× 기준이며 기울기·미리보기 잘림에 따라 오차가 납니다.</P>
      <PrimaryButton title="센서·카메라 다시 측정" variant="secondary" onPress={()=>{
        setCameraReady(false);setRetry(value=>value+1);
      }}/>
    </>:null}
    <Card>
      <H2>사용 전 확인</H2>
      <P>아이폰을 세로로 세우고 카메라를 수평으로 향해 주세요. GPS·나침반 품질이 낮거나 정보가 오래되면 후보 표시를 멈춥니다.</P>
      <P>최대 3개 후보만 표시합니다. 데이터가 없는 산이나 지형·건물 뒤에 가려진 봉우리는 구분하지 못합니다.</P>
      <P small>AR 산 찾기는 GPS 산행 기록·뱃지와 별개입니다. 길 찾기나 조난 판단에 사용하지 마세요.</P>
    </Card>
    <Card>
      <H2>봉우리 데이터 · {VERIFIED_PEAKS.length}개</H2>
      <P small>공개 원본의 봉우리 좌표와 고도 태그를 대조한 소규모 목록입니다. 현장 측량이나 산림청 공식 인증 목록이 아닙니다.</P>
      {VERIFIED_PEAKS.map(peak=><View key={peak.id} style={{gap:6}}>
        <P>{peak.name} · {peak.elevationM}m</P>
        <P small>OpenStreetMap 노드 {peak.provenance.nodeId} v{peak.provenance.version} · 확인 {peak.provenance.retrievedAt.slice(0,10)}</P>
        <PrimaryButton title={`${peak.name} 원본 출처`} variant="secondary" onPress={()=>void Linking.openURL(peak.provenance.url).catch(()=>Alert.alert('출처 열기 실패','인터넷 연결을 확인해 주세요.'))}/>
      </View>)}
      <P small>© OpenStreetMap 기여자 · ODbL 1.0. 내장 데이터는 오프라인에서도 읽을 수 있습니다. 데이터 다운로드·갱신 기능은 다음 단계입니다.</P>
      <PrimaryButton title="데이터 이용 조건" variant="secondary" onPress={()=>void Linking.openURL('https://www.openstreetmap.org/copyright').catch(()=>Alert.alert('페이지 열기 실패','인터넷 연결을 확인해 주세요.'))}/>
    </Card>
    <PrimaryButton title="홈으로 돌아가기" variant="secondary" onPress={()=>nav.back()}/>
  </Page>;
}

const s=StyleSheet.create({
  preview:{height:460,borderRadius:18,overflow:'hidden',backgroundColor:C.dark},
  heading:{position:'absolute',left:10,right:10,top:10,padding:10,backgroundColor:'#14251DEE',borderRadius:10,gap:3},
  whiteTitle:{color:C.white,fontSize:19,fontWeight:'800'},
  whiteSmall:{color:C.white,fontSize:15,lineHeight:21},
  lane:{position:'absolute',left:0,right:0,height:80},
  direction:{position:'absolute',top:0,width:3,height:9,backgroundColor:'#FFFFFF'},
  label:{position:'absolute',top:9,minHeight:64,padding:8,borderRadius:9,backgroundColor:'#183A29F2'},
  notice:{position:'absolute',bottom:10,left:10,right:10,backgroundColor:'#14251DEE',padding:10,borderRadius:10},
  fovRow:{flexDirection:'row',gap:12},
  fovButton:{flex:1,minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:C.card},
  selected:{backgroundColor:C.green},
});
