import { earnedMountainIds, badgeProgress } from '../../src/core/engine';
import { GENERAL_TIERS, SPECIAL_TIERS } from '../../src/data/sample';
import { useJournal } from '../../src/state/JournalContext';
import { Card, H1, H2, P, Page } from '../../src/ui/Kit';
export default function Badges(){
  const j=useJournal(),earned=earnedMountainIds(j.trips);
  const progress=badgeProgress(j.trips,j.mountains);
  return <Page>
    <H1>나의 뱃지</H1>
    <P>GPS로 직접 기록한 산행만 뱃지로 인정해요.</P>
    <Card><H2>내가 기록한 산</H2><P>{earned.size}개</P>
      <P small>PHASE 1 테스트 모드에서 만든 산행은 뱃지에 포함되지 않습니다.</P></Card>
    <H2>일반 산행 칭호</H2>
    {GENERAL_TIERS.map(t=><Card key={t.n}><P>{progress.all>=t.n?'🏅':'🔒'} {t.title}</P>
      <P small>GPS 인증 산 {t.n}개 · {progress.all>=t.n?'획득':'미획득'}</P></Card>)}
    <H2>100대 명산 특별 엠블럼</H2>
    <P small>산림청 공식 100대 명산 목록 확인 전이므로 특별 도전은 잠겨 있습니다.</P>
    {SPECIAL_TIERS.map(t=><Card key={t.n}><P>🔒 {t.title}</P>
      <P small>공식 명산 GPS 인증 {t.n}개 필요 · 검증 대기</P></Card>)}
  </Page>;
}
