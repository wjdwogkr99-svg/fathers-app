import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { visitedMountainIds } from '../../src/core/engine';
import { useJournal } from '../../src/state/JournalContext';
import { Card, H1, H2, P, Page, Pill, PrimaryButton, InfoLine } from '../../src/ui/Kit';
import { FauxMap } from '../../src/ui/FauxMap';
export default function Home(){
  const nav=useRouter(), j=useJournal();
  const pending=j.trips.filter(t=>t.status==='finished'&&!t.mountainId);
  const unfinished=j.trips.find(t=>t.status!=='finished');
  const visits=j.trips.filter(t=>t.status==='finished'&&t.mountainId);
  async function begin(mode:'demo'|'gps'){
    try {if(mode==='gps')await j.startGps();else await j.startDemo();nav.push('/hike');}
    catch(e){Alert.alert('산행 시작 실패',e instanceof Error?e.message:'위치 권한과 저장 공간을 확인해 주세요.');}
  }
  return <Page>
    <P small>나의 산길 · 아버지를 위한 등산 일지</P>
    <H1>오늘도 안전한 산행!</H1>
    <Pill>PHASE 2 · GPS 실험 버전</Pill>
    {j.error ? <Card><H2>저장소 오류</H2><P>{j.error}</P><PrimaryButton title="다시 시도" onPress={()=>void j.reload().catch(()=>Alert.alert('오류','다시 실행해 주세요.'))}/></Card> : null}
    {!j.ready ? <Card><P>기록을 불러오고 있어요…</P></Card>:null}
    <Card>
      <H2>현재 위치</H2>
      {j.gpsPoint&&j.trips.some(t=>t.source==='gps'&&t.status!=='finished') ?
        <P>최근 GPS 좌표: {j.gpsPoint.latitude.toFixed(5)}, {j.gpsPoint.longitude.toFixed(5)} (정확도 약 {Math.round(j.gpsPoint.accuracyM)}m)</P>:
        <P small>산행 기록을 시작하면 위치를 측정합니다. 오프라인 지도는 준비 중이에요.</P>}
      <FauxMap/>
      <P small>위 그림은 실제 지도가 아닙니다. 길 안내 용도로 사용하지 마세요.</P>
    </Card>
    <PrimaryButton title={unfinished?'▶ 진행 중이던 산행 열기':'📍 실제 GPS 등산 시작'} onPress={()=>void begin('gps')} disabled={!j.ready||!!j.error}/>
    {!unfinished?<PrimaryButton title="▶ 가상 산행 연습하기" variant="secondary" onPress={()=>void begin('demo')} disabled={!j.ready||!!j.error}/>:null}
    <PrimaryButton title="📷 AR 산 찾기 미리보기" variant="secondary" onPress={()=>nav.push('/peak-finder')}/>
    <Card>
      <H2>나의 등산 일지</H2>
      <InfoLine label="다녀온 산" value={String(visitedMountainIds(visits).size)+'개'}/>
      <InfoLine label="저장된 산행" value={String(visits.length)+'회'}/>
      <InfoLine label="정리하지 않은 기록" value={String(pending.length)+'건'}/>
    </Card>
    {pending.length>0 ? <PrimaryButton title={'정리하지 않은 산행 '+pending.length+'건'} variant="secondary" onPress={()=>nav.push('/unfinished')}/>:null}
    <PrimaryButton title="지난 산행 직접 등록" variant="secondary" onPress={()=>nav.push('/add-past')}/>
    <P small>실제 GPS는 화면을 켠 상태에서만 우선 검증합니다. 화면 잠금 중 GPS는 Expo Go에서 지원되지 않아요. 카메라 산 이름 표시에는 검증된 봉우리 좌표 데이터가 필요합니다.</P>
  </Page>;
}
