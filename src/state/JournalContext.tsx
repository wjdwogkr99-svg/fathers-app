import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Mountain, Trip } from '../core/types';
import { allMountains, allTrips, createMountain, deleteTrip, findTrip, saveTrip } from '../storage/database';

interface JournalApi {
  ready:boolean;
  error:string|null;
  trips:Trip[];
  mountains:Mountain[];
  reload:()=>Promise<void>;
  startDemo:()=>Promise<Trip>;
  demoStep:(id:string)=>Promise<void>;
  pause:(id:string)=>Promise<void>;
  resume:(id:string)=>Promise<void>;
  finish:(id:string)=>Promise<Trip>;
  assign:(id:string,mountainId:string)=>Promise<void>;
  note:(id:string,text:string)=>Promise<void>;
  addPast:(mountainId:string,note:string)=>Promise<void>;
  addMountain:(name:string,region:string)=>Promise<Mountain>;
  remove:(id:string)=>Promise<void>;
}
const Context = createContext<JournalApi|null>(null);
const makeId = () => String(Date.now())+'-'+Math.floor(Math.random()*1_000_000);
export function JournalProvider({children}:{children:ReactNode}) {
  const [trips,setTrips] = useState<Trip[]>([]);
  const [mountains,setMountains] = useState<Mountain[]>([]);
  const [ready,setReady] = useState(false);
  const [error,setError] = useState<string|null>(null);
  const reload = useCallback(async()=>{
    const [newTrips,newMountains]=await Promise.all([allTrips(),allMountains()]);
    setTrips(newTrips); setMountains(newMountains); setError(null);
  },[]);
  useEffect(()=>{ let live=true;
    reload().then(()=>{if(live)setReady(true);}).catch(e=>{if(live){setError('저장소를 열 수 없습니다. 앱을 다시 실행해 주세요.');setReady(true);} console.warn(e);});
    return ()=>{live=false;};
  },[reload]);
  const apply = useCallback(async(t:Trip)=>{ await saveTrip(t); await reload(); },[reload]);
  const get = useCallback(async(id:string)=> {
    const trip=await findTrip(id);
    if(!trip) throw new Error('산행 기록을 찾을 수 없습니다.');
    return trip;
  },[]);
  const startDemo=useCallback(async()=>{
    const existing=(await allTrips()).find(t=>t.status!=='finished');
    if(existing) return existing;
    const t:Trip={id:makeId(),source:'demo',status:'recording',startedAt:Date.now(),
      endedAt:null,pausedAt:null,manualPausedMs:0,autoRestMs:0,distanceM:0,gpsGoodPoints:0,mountainId:null,note:''};
    await apply(t); return t;
  },[apply]);
  const demoStep=useCallback(async(id:string)=>{
    const t=await get(id);
    if(t.source!=='demo'||t.status!=='recording')return;
    // Explicitly artificial movement; never earns a GPS badge.
    await apply({...t,distanceM:t.distanceM+12});
  },[apply,get]);
  const pause=useCallback(async(id:string)=>{
    const t=await get(id); if(t.status!=='recording')return;
    await apply({...t,status:'paused',pausedAt:Date.now()});
  },[apply,get]);
  const resume=useCallback(async(id:string)=>{
    const t=await get(id); if(t.status!=='paused')return;
    const now=Date.now();
    await apply({...t,status:'recording',manualPausedMs:t.manualPausedMs+Math.max(0,now-(t.pausedAt??now)),pausedAt:null});
  },[apply,get]);
  const finish=useCallback(async(id:string)=>{
    const t=await get(id);
    if(t.status==='finished')return t;
    const now=Date.now();
    const updated={...t,status:'finished' as const,endedAt:now,
      manualPausedMs:t.manualPausedMs+(t.pausedAt===null?0:Math.max(0,now-t.pausedAt)),pausedAt:null};
    await apply(updated);
    return updated;
  },[apply,get]);
  const assign=useCallback(async(id:string,mountainId:string)=>{
    const t=await get(id); if(t.status!=='finished')throw new Error('종료 전에는 산을 지정할 수 없습니다.');
    const m=(await allMountains()).find(v=>v.id===mountainId);
    if(!m)throw new Error('목록에 없는 산입니다.');
    await apply({...t,mountainId});
  },[apply,get]);
  const note=useCallback(async(id:string,text:string)=>{const t=await get(id);await apply({...t,note:text});},[apply,get]);
  const addPast=useCallback(async(mountainId:string,memo:string)=>{
    const now=Date.now();
    await apply({id:makeId(),source:'past',status:'finished',startedAt:now,endedAt:now,
      pausedAt:null,manualPausedMs:0,autoRestMs:0,distanceM:0,gpsGoodPoints:0,mountainId,note:memo});
  },[apply]);
  const addMountain=useCallback(async(name:string,region:string)=>{
    const normalized=name.trim();
    if(!normalized)throw new Error('산 이름을 입력해 주세요.');
    const existing=(await allMountains()).find(m=>m.name===normalized&&m.region===region.trim());
    if(existing)return existing;
    const m:Mountain={id:'custom-'+makeId(),name:normalized,region:region.trim()||'지역 미입력',official100:false,officialVerified:false};
    await createMountain(m);await reload();return m;
  },[reload]);
  const remove=useCallback(async(id:string)=>{await deleteTrip(id);await reload();},[reload]);
  const value=useMemo(()=>({ready,error,trips,mountains,reload,startDemo,demoStep,pause,resume,finish,assign,note,addPast,addMountain,remove}),
    [ready,error,trips,mountains,reload,startDemo,demoStep,pause,resume,finish,assign,note,addPast,addMountain,remove]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useJournal(){const value=useContext(Context);if(!value)throw new Error('JournalProvider가 없습니다.');return value;}
