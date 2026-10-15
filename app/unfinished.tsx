import { useRouter } from 'expo-router';
import { P, H1, Page, Card, PrimaryButton } from '../src/ui/Kit';
import { useJournal } from '../src/state/JournalContext';
export default function Unfinished(){
  const nav=useRouter(),j=useJournal();
  const t=j.trips.filter(x=>x.status==='finished'&&!x.mountainId);
  return <Page>
    <H1>정리하지 않은 산행</H1>
    {t.length===0?<P>모든 산행에 산 이름이 등록되어 있어요.</P>:null}
    {t.map(x=><Card key={x.id}><P>{new Date(x.startedAt).toLocaleDateString('ko-KR')} · {x.source==='demo'?'테스트 기록':'산행 기록'}</P>
      <PrimaryButton title="산 이름 등록하기" onPress={()=>nav.push({pathname:'/summary',params:{id:x.id}})}/></Card>)}
    <PrimaryButton title="홈으로" variant="secondary" onPress={()=>nav.replace('/')}/>
  </Page>;
}
