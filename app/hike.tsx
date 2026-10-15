import { useEffect, useState } from 'react';
import { Alert, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { elapsedMs, exerciseMs, formatDuration, restMs } from '../src/core/engine';
import { useJournal } from '../src/state/JournalContext';
import { Card, H1, H2, P, Page, Pill, PrimaryButton, InfoLine } from '../src/ui/Kit';
import { FauxMap } from '../src/ui/FauxMap';
import { C } from '../src/ui/theme';
export default function Hike(){
  const nav=useRouter(), j=useJournal();
  const trip=j.trips.find(t=>t.status!=='finished');
  const [now,setNow]=useState(Date.now());
  const [busy,setBusy]=useState(false);
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(id);},[]);
  useEffect(()=>{
    if(!trip||trip.status!=='recording'||trip.source!=='demo')return;
    let active=true,processing=false;
    const timer=setInterval(()=>{if(!active||processing)return;processing=true;
      j.demoStep(trip.id).catch(()=>Alert.alert('저장 오류','이동 정보를 저장하지 못했습니다.'))
        .finally(()=>{processing=false;});
    },5000);
    return ()=>{active=false;clearInterval(timer);};
  },[trip?.id,trip?.status,j.demoStep]);
  if(!j.ready)return <Page><H1>기록을 불러오는 중…</H1></Page>;
  if(!trip)return <Page><H1>진행 중인 산행이 없어요.</H1><PrimaryButton title="홈으로" onPress={()=>nav.replace('/')}/></Page>;
  async function toggle(){if(!trip||busy)return;setBusy(true);
    try {if(trip.status==='paused')await j.resume(trip.id);else await j.pause(trip.id);}
    catch{Alert.alert('오류','상태를 저장하지 못했어요. 다시 시도해 주세요.');}
    finally{setBusy(false);}
  }
  function confirmEnd(){
    if(!trip)return;
    Alert.alert('등산을 종료할까요?','기록은 산 이름을 지정하기 전에 먼저 저장됩니다.',[
      {text:'계속 등산',style:'cancel'},
      {text:'종료하고 저장',style:'destructive',onPress:()=>{setBusy(true);j.finish(trip.id)
        .then(t=>nav.replace({pathname:'/summary',params:{id:t.id}}))
        .catch(()=>Alert.alert('저장 실패','기록을 보존하기 위해 현재 상태를 유지합니다.'))
        .finally(()=>setBusy(false));}},
    ]);
  }
  return <Page>
    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
      <H1>등산 진행 중</H1><Pill warning={trip.status==='paused'}>{trip.status==='paused'?'수동 일시정지':'가상 GPS 기록'}</Pill>
    </View>
    <FauxMap/>
    <Card>
      <P small>현재 이동 거리 · 시뮬레이션</P>
      <Text allowFontScaling style={{fontSize:45,fontWeight:'900',color:C.dark,textAlign:'center'}}>{(trip.distanceM/1000).toFixed(2)} km</Text>
    </Card>
    <Card>
      <InfoLine label="운동 시간" value={formatDuration(exerciseMs(trip,now))}/>
      <InfoLine label="휴식 시간" value={formatDuration(restMs(trip,now))}/>
      <InfoLine label="전체 시간" value={formatDuration(elapsedMs(trip,now))}/>
    </Card>
    {trip.status==='paused'?<Card><H2>일시정지 중</H2><P>계속하기를 누르면 테스트 기록이 재개돼요.</P></Card>:null}
    <PrimaryButton title={trip.status==='paused'?'▶ 계속하기':'Ⅱ 일시정지'} variant="secondary" onPress={()=>void toggle()} disabled={busy}/>
    <PrimaryButton title="■ 등산 종료" variant="danger" onPress={confirmEnd} disabled={busy}/>
    <PrimaryButton title="30분 자동 휴식 규칙 확인" variant="secondary" onPress={()=>nav.push('/rest-demo')}/>
    <P small>테스트 모드에서는 5초마다 가상 거리 12m가 추가됩니다. 화면 잠금 시 GPS 기록은 아직 지원하지 않습니다.</P>
  </Page>;
}
