import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useState } from 'react';
import { useJournal } from '../src/state/JournalContext';
import { H1, P, Page, Field, PrimaryButton } from '../src/ui/Kit';
export default function AddMountain(){
  const nav=useRouter(),j=useJournal(),[name,setName]=useState(''),[region,setRegion]=useState(''),[busy,setBusy]=useState(false);
  async function save(){
    if(!name.trim())return Alert.alert('산 이름','산 이름을 입력해 주세요.');
    setBusy(true);
    try{await j.addMountain(name,region);nav.back();}
    catch{Alert.alert('저장 실패','산 이름을 추가하지 못했습니다.');}
    finally{setBusy(false);}
  }
  return <Page>
    <H1>새 산 추가</H1><P>목록에 없는 산을 직접 추가할 수 있어요.</P>
    <Field label="산 이름" placeholder="예: 청계산" value={name} onChangeText={setName}/>
    <Field label="지역" placeholder="예: 경기 과천" value={region} onChangeText={setRegion}/>
    <P small>사용자가 직접 추가한 산은 산림청 100대 명산으로 자동 인증되지 않습니다.</P>
    <PrimaryButton title="산 목록에 저장하기" onPress={()=>void save()} disabled={busy}/>
    <PrimaryButton title="뒤로 가기" variant="secondary" onPress={()=>nav.back()}/>
  </Page>;
}
