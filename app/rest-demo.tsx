import { useRouter } from 'expo-router';
import { useState } from 'react';
import { P, Page, H1, Card, InfoLine, PrimaryButton } from '../src/ui/Kit';
export default function RestDemo(){
  const nav=useRouter();
  const [minutes,setMinutes]=useState(29);
  const approved=minutes>=30;
  return <Page>
    <H1>자동 휴식 계산 연습</H1>
    <P>실제 GPS가 아닌 계산 규칙 시연입니다. 30분 이상 움직이지 않은 구간을 휴식으로 확정합니다.</P>
    <Card>
      <InfoLine label="가정한 정지 시간" value={minutes+'분'}/>
      <InfoLine label="운동에서 제외" value={approved?minutes+'분':'0분'}/>
      <P>{approved?'30분이 지나 정지 시작부터 휴식 처리합니다.':'30분 미만이라 아직 휴식으로 확정하지 않았습니다.'}</P>
    </Card>
    <PrimaryButton title="29분 정지 예시" variant="secondary" onPress={()=>setMinutes(29)}/>
    <PrimaryButton title="30분 정지 예시" variant="secondary" onPress={()=>setMinutes(30)}/>
    <PrimaryButton title="45분 정지 예시" variant="secondary" onPress={()=>setMinutes(45)}/>
    <PrimaryButton title="등산 화면으로" onPress={()=>nav.back()}/>
  </Page>;
}
