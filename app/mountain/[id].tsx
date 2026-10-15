import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { exerciseMs, formatDuration, isQualifiedGps } from '../../src/core/engine';
import { useJournal } from '../../src/state/JournalContext';
import { Card, H1, H2, P, Page, Pill, PrimaryButton } from '../../src/ui/Kit';
export default function MountainAlbum(){
  const {id}=useLocalSearchParams<{id:string}>(),nav=useRouter(),j=useJournal();
  const mountain=j.mountains.find(m=>m.id===id);
  if(!mountain)return <Page><H1>산을 찾을 수 없어요.</H1><PrimaryButton title="도감으로" onPress={()=>nav.replace('/mountains')}/></Page>;
  const visits=j.trips.filter(t=>t.status==='finished'&&t.mountainId===id);
  const gps=visits.filter(isQualifiedGps).length;
  function askRemove(tid:string){
    Alert.alert('기록 삭제','삭제한 산행은 다시 복구할 수 없습니다. 삭제할까요?',[
      {text:'취소',style:'cancel'},
      {text:'삭제',style:'destructive',onPress:()=>{j.remove(tid).catch(()=>Alert.alert('삭제 실패','기록을 삭제하지 못했습니다.'));}}
    ]);
  }
  return <Page>
    <PrimaryButton title="← 나의 산 도감" variant="secondary" onPress={()=>nav.replace('/mountains')}/>
    <H1>{mountain.name}</H1><P>{mountain.region}</P>
    <Card><H2>나의 방문 기록</H2><P>{visits.length}회 방문 · GPS 인증 {gps}회</P>
      <P small>과거 방문은 앨범에 표시되지만 GPS 뱃지에는 포함되지 않습니다.</P></Card>
    <H2>날짜별 산행</H2>
    {visits.length===0?<Card><P>아직 산행 기록이 없어요. 방문 기록을 남겨보세요.</P></Card>:null}
    {visits.map(t=><Card key={t.id}>
      <P>{new Date(t.startedAt).toLocaleDateString('ko-KR')} · {t.source==='past'?'과거 방문':t.source==='demo'?'테스트 산행':'GPS 산행'}</P>
      {t.source!=='past'?<P small>{(t.distanceM/1000).toFixed(2)}km · 운동 {formatDuration(exerciseMs(t))}</P>:null}
      {t.note?<P small>{t.note}</P>:null}
      <Pill warning={!isQualifiedGps(t)}>{isQualifiedGps(t)?'GPS 인정':'보상 제외 또는 미확인'}</Pill>
      <PrimaryButton title="이 기록 삭제" variant="secondary" onPress={()=>askRemove(t.id)}/>
    </Card>)}
    <H2>추억 사진</H2><Card><P>📷 사진 앨범은 PHASE 3에서 연결할 예정입니다.</P><P small>현재는 사진을 등록하거나 저장했다고 표시하지 않습니다.</P></Card>
    <PrimaryButton title="과거 산행 추가하기" onPress={()=>nav.push('/add-past')}/>
  </Page>;
}
