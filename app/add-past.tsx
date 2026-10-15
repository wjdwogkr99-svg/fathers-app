import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { useState } from 'react';
import { useJournal } from '../src/state/JournalContext';
import { Card, H1, P, Page, Field, PrimaryButton } from '../src/ui/Kit';
export default function AddPast(){
  const nav=useRouter(),j=useJournal(),[selected,setSelected]=useState<string|null>(null);
  const [note,setNote]=useState(''),[busy,setBusy]=useState(false);
  async function save(){
    if(!selected)return Alert.alert('산 선택','방문하신 산을 선택해 주세요.');
    setBusy(true);
    try{await j.addPast(selected,note.trim());nav.replace({pathname:'/mountain/[id]',params:{id:selected}});}
    catch{Alert.alert('저장 실패','과거 방문 기록을 저장하지 못했습니다. 다시 시도해 주세요.');}
    finally{setBusy(false);}
  }
  return <Page>
    <H1>과거 방문 등록</H1>
    <P>예전에 다녀온 산을 기록해요. GPS 뱃지는 지급되지 않아요.</P>
    <Card><P>방문했던 산을 선택해 주세요.</P>
      {j.mountains.map(m=><PrimaryButton key={m.id} title={(selected===m.id?'✓ ':'')+m.name+' · '+m.region}
        variant={selected===m.id?'green':'secondary'} onPress={()=>setSelected(m.id)}/>)}
    </Card>
    <PrimaryButton title="목록에 없는 산 추가" variant="secondary" onPress={()=>nav.push('/add-mountain')}/>
    <Field value={note} onChangeText={setNote} label="추억 메모 (선택)" placeholder="예: 가을에 가족과 함께 다녀왔어요"/>
    <PrimaryButton title="과거 방문 저장" onPress={()=>void save()} disabled={busy||!selected}/>
    <PrimaryButton title="취소" variant="secondary" onPress={()=>nav.back()}/>
  </Page>;
}
