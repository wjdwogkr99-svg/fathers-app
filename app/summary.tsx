import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { exerciseMs, formatDuration, isQualifiedGps, restMs } from '../src/core/engine';
import { useJournal } from '../src/state/JournalContext';
import { Card, H1, H2, P, Page, Pill, PrimaryButton, InfoLine } from '../src/ui/Kit';
import { C } from '../src/ui/theme';
export default function Summary(){
  const {id}=useLocalSearchParams<{id:string}>(),nav=useRouter(),j=useJournal();
  const trip=j.trips.find(t=>t.id===id);
  if(!trip)return <Page><H1>기록을 불러오는 중입니다.</H1><PrimaryButton title="홈으로" onPress={()=>nav.replace('/')}/></Page>;
  async function saveMountain(mountainId:string){
    try{await j.assign(trip!.id,mountainId);nav.replace({pathname:'/mountain/[id]',params:{id:mountainId}});}
    catch{Alert.alert('저장 실패','산 이름 연결에 실패했어요. 다시 시도해 주세요.');}
  }
  return <Page>
    <H1>오늘도 수고하셨어요!</H1>
    <Pill>산행 기록 저장 완료 · 테스트 모드</Pill>
    <Card>
      <InfoLine label="이동 거리" value={(trip.distanceM/1000).toFixed(2)+' km'}/>
      <InfoLine label="운동 시간" value={formatDuration(exerciseMs(trip))}/>
      <InfoLine label="휴식 시간" value={formatDuration(restMs(trip))}/>
      <InfoLine label="전체 시간" value={formatDuration((trip.endedAt??Date.now())-trip.startedAt)}/>
    </Card>
    <H2>어느 산에 다녀오셨나요?</H2>
    <P small>산 이름은 지금 선택하거나 나중에 추가할 수 있어요. 저장된 기록은 그대로 남습니다.</P>
    {j.mountains.map(m=><PrimaryButton key={m.id} title={m.name+' · '+m.region} variant="secondary" onPress={()=>void saveMountain(m.id)}/>)}
    <PrimaryButton title="목록에 없는 산 추가하기" variant="secondary" onPress={()=>nav.push('/add-mountain')}/>
    <PrimaryButton title="나중에 등록하기" onPress={()=>nav.replace('/')}/>
    <Text style={{fontSize:16,color:C.muted}}>가상 GPS 기록에는 실제 산행 뱃지가 지급되지 않습니다.</Text>
  </Page>;
}
