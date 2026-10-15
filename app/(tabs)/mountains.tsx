import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { visitedMountainIds, earnedMountainIds } from '../../src/core/engine';
import { useJournal } from '../../src/state/JournalContext';
import { Card, H1, H2, P, Page, PrimaryButton } from '../../src/ui/Kit';
import { C } from '../../src/ui/theme';
export default function Mountains(){
  const nav=useRouter(),j=useJournal();
  const [tab,setTab]=useState<'all'|'special'>('all');
  const visited=visitedMountainIds(j.trips),qualified=earnedMountainIds(j.trips);
  const visible=tab==='all'?j.mountains:j.mountains.filter(m=>m.official100 && m.officialVerified);
  return <Page>
    <H1>나의 산 도감</H1>
    <P>다녀온 산을 추억하고 새로운 산을 기록해요.</P>
    <View style={{flexDirection:'row',gap:8}}>
      <View style={{flex:1}}><PrimaryButton title="모든 산" variant={tab==='all'?'green':'secondary'} onPress={()=>setTab('all')}/></View>
      <View style={{flex:1}}><PrimaryButton title="100대 명산" variant={tab==='special'?'green':'secondary'} onPress={()=>setTab('special')}/></View>
    </View>
    <Card>
      <H2>{tab==='all'?'전체 방문 현황':'100대 명산 GPS 도전'}</H2>
      {tab==='all'?<P>{visited.size}개 산 방문 · GPS 뱃지 {qualified.size}개</P>:<P>공식 목록 검증·등록 대기 중 (0/100)</P>}
      {tab==='special'?<P small>산림청 공식 명산 100개를 확인해 등록하기 전까지 달성률과 보상을 표시하지 않습니다. 임의의 100개 목록을 넣지 않았어요.</P>:null}
    </Card>
    <H2>{tab==='all'?'등록된 산':'공식 100대 명산'}</H2>
    {visible.length===0?<Card><P>공식 산 목록을 아직 등록하지 않았습니다.</P></Card>:null}
    {visible.map(m=>
      <Pressable key={m.id} accessibilityRole="button" onPress={()=>nav.push({pathname:'/mountain/[id]',params:{id:m.id}})}
        style={{backgroundColor:C.card,padding:18,borderRadius:16,gap:8,minHeight:78}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',gap:8,alignItems:'center'}}>
          <View style={{flex:1}}><Text style={{fontSize:21,fontWeight:'800',color:C.dark}}>{m.name}</Text>
            <Text style={{fontSize:16,color:C.muted}}>{m.region}</Text></View>
          <Text style={{fontSize:16,color:C.green}}>{qualified.has(m.id)?'GPS 인정':visited.has(m.id)?'과거/테스트 방문':'미방문'}</Text>
        </View>
      </Pressable>)}
    {tab==='all'?<><PrimaryButton title="지나온 산행 직접 등록" onPress={()=>nav.push('/add-past')}/>
      <PrimaryButton title="새로운 산 추가" variant="secondary" onPress={()=>nav.push('/add-mountain')}/></>:null}
    <P small>목록의 산 이름은 개발용 예시 데이터입니다. 실제 방문 여부는 직접 저장한 기록을 기준으로 합니다.</P>
  </Page>;
}
