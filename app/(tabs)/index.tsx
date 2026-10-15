import { useRouter } from 'expo-router';
import { Alert, View } from 'react-native';
import { visitedMountainIds } from '../../src/core/engine';
import { useJournal } from '../../src/state/JournalContext';
import { Card, H1, H2, P, Page, Pill, PrimaryButton, InfoLine } from '../../src/ui/Kit';
import { FauxMap } from '../../src/ui/FauxMap';
export default function Home(){
  const nav=useRouter(), j=useJournal();
  const pending=j.trips.filter(t=>t.status==='finished'&&!t.mountainId);
  const unfinished=j.trips.find(t=>t.status!=='finished');
  const visits=j.trips.filter(t=>t.status==='finished'&&t.mountainId);
  async function begin(){
    try { await j.startDemo(); nav.push('/hike'); }
    catch(e){Alert.alert('시작 실패','테스트 기록을 저장할 수 없습니다. 저장 공간을 확인해 주세요.');}
  }
  return <Page>
    <P small>나의 산길 · 아버지를 위한 등산 일지</P>
    <H1>오늘도 안전한 산행!</H1>
    <Pill>1차 개발 · 테스트 모드</Pill>
    {j.error ? <Card><H2>저장소 오류</H2><P>{j.error}</P><PrimaryButton title="다시 시도" onPress={()=>void j.reload().catch(()=>Alert.alert('오류','다시 실행해 주세요.'))}/></Card> : null}
    {!j.ready ? <Card><P>기록을 불러오고 있어요…</P></Card>:null}
    <Card>
      <H2>현재 위치</H2><FauxMap/>
      <P small>현재 위치 연결 전입니다. 위 지도는 예시이며 길 안내에 사용하면 안 됩니다.</P>
    </Card>
    <PrimaryButton title={unfinished?'▶ 진행 중이던 산행 열기':'▶ 등산 시작하기'} onPress={()=>void begin()} disabled={!j.ready||!!j.error}/>
    <Card>
      <H2>나의 등산 일지</H2>
      <InfoLine label="다녀온 산" value={String(visitedMountainIds(visits).size)+'개'}/>
      <InfoLine label="저장된 산행" value={String(visits.length)+'회'}/>
      <InfoLine label="정리하지 않은 기록" value={String(pending.length)+'건'}/>
    </Card>
    {pending.length>0 ? <PrimaryButton title={'정리하지 않은 산행 '+pending.length+'건'} variant="secondary" onPress={()=>nav.push('/unfinished')}/>:null}
    <PrimaryButton title="지난 산행 직접 등록" variant="secondary" onPress={()=>nav.push('/add-past')}/>
    <P small>현재는 가상 GPS 연습 모드입니다. 실제 위치 기록·사진 등록·정상 인증은 다음 개발 단계에서 연결합니다.</P>
  </Page>;
}
