# 나의 산길 · Father's Hiking App

1970년생 아버지를 위해 설계한 **큰 글씨의 iPhone 등산 기록 앱**입니다.

> ⚠️ **PHASE 1 / 테스트 모드**: 실제 GPS, 경로 지도, 백그라운드 위치 추적, 사진 업로드, 산림청 공식 100대 명산 데이터는 아직 연결되지 않았습니다.
> 테스트 화면의 거리는 가상 이동거리이며, 이 기록으로는 실제 GPS 뱃지가 지급되지 않습니다. 실제 등산 경로 안내나 안전장비로 사용하지 마세요.

## 개발 스택

- Expo SDK 54 / React Native 0.81 / React 19.1 / TypeScript
- Expo Router, Expo SQLite
- iPhone 13 mini (375×812pt) / iPhone 13 (390×844pt) 우선
- Windows + VS Code 또는 Codespaces
- 원격 데이터베이스, 로그인, 과금 없음

## PHASE 1에서 구현한 기능

- 홈/등산 진행/휴식 규칙 시연/종료 요약/산 선택/도감/산 앨범/뱃지 화면
- 테스트 산행 시작, 가상 거리 증가, 수동 일시정지, 종료 확인
- 종료 시 산 이름 없이 SQLite 먼저 저장, 미분류 기록 나중에 선택
- 이전 진행 중 기록 열기, 종료 기록·과거 방문·새 산 추가
- 산 ID를 통한 앨범 통합과 중복 보상 계산
- 순수 함수로 시간·GPS 필터·30분 휴식 로직·뱃지 자격 판정 분리 및 테스트
- 예시 산 4개 (산림청 공식 100대 명산 목록이라고 주장하지 않음)

## 실행 방법

Node.js 22 설치 후 프로젝트 루트에서:

    npm install
    npm run typecheck
    npm test
    npx expo-doctor
    npx expo start

GitHub Codespaces에서 기존 프로젝트를 연 경우 **다시 git clone 하지 마세요**. `/workspaces/fathers-app` 폴더에서 작업하고 `git pull origin feature/phase1-foundation`, `npm install` 순서로 변경사항을 받으세요.

2026년 10월 기준 App Store의 iPhone용 Expo Go는 Expo SDK 54를 지원합니다. 이 브랜치는 무료 iPhone 테스트를 위해 SDK 54를 사용합니다.
Expo Go와 터미널 Expo CLI에 동일한 Expo 계정으로 로그인해야 합니다.
Codespaces에서 실행할 경우 `npx expo start --tunnel --clear`를 사용하세요. `--tunnel` 설정에는 추가 설치 확인이 필요할 수 있습니다.
Windows는 로컬 iOS 시뮬레이터를 실행할 수 없습니다. 실제 iPhone에 설치하는 EAS iOS 빌드는 Apple 개발자 서명 절차가 필요할 수 있습니다.

## 수동 테스트

1. 홈에 '1차 개발 · 테스트 모드' 표시
2. '등산 시작' → 거리 5초마다 증가(가상 데이터)
3. 일시정지/계속하기 동작
4. 종료 확인 → 요약 화면
5. '나중에 등록하기' → 홈의 미분류 기록에서 다시 산 선택
6. '나의 산'에서 산별 기록 확인 및 과거 방문 등록
7. 테스트 산행으로 실제 GPS 뱃지가 증가하지 않는 것이 정상

## GPS 설계 기준 (PHASE 2)

- 최소 운동 15분, 유효 이동거리 300m, GPS 품질 충족, 산 이름 지정
- 같은 산 여러 번 방문해도 수집 개수 1개
- 과거 등록과 테스트 모드는 뱃지 제외
- 30분 연속 정지가 정확한 GPS 연속 샘플로 확인될 때 자동 휴식
- GPS 수신 중단이나 순간 좌표 점프는 휴식·거리 계산에서 제외
- 화면을 끈 위치 업데이트는 iOS 개발용 빌드와 실기기 검증 필요
- 강제 종료 후 GPS가 계속 기록된다고 보장하지 않음

## 개인정보와 저장

- PHASE 1의 테스트·과거 방문 기록은 Expo SQLite 로컬 DB에 보관됩니다.
- 앱 삭제·재설치 시 로컬 기록이 사라질 수 있습니다. 아직 백업·복원 기능은 없습니다.
- personal-data/, private-photos/, gps-exports/, DB 파일 및 환경변수 파일은 Git에서 제외됩니다.
- GitHub 저장소를 Private으로 변경하는 것을 권장합니다.

## 다음 단계

- **PHASE 1 (현재)**: UI, 흐름, 테스트 모드, SQLite, 계산 및 단위 테스트
- **PHASE 2**: 위치 권한, 실제 전·후면 GPS 수집, 샘플 저장, 자동 휴식 통합, 실기기 테스트
- **PHASE 3**: 사진 영구 보관과 백업, 공식 100대 명산, 뱃지·칭호, 기록 편집
- **PHASE 4**: EAS 개발 빌드, iPhone 장시간 테스트 및 배포

검증 명령:

    npm run typecheck
    npm test
    npx expo-doctor

GitHub Actions CI에서 위 세 가지를 수행합니다.
