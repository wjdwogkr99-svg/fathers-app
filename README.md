# 나의 산길 · Father's Hiking App

1970년생 아버지를 위해 설계한 **큰 글씨의 iPhone 등산 기록 앱**입니다.

> ⚠️ **PHASE 1 / 테스트 모드**: 실제 GPS, 경로 지도, 백그라운드 위치 추적, 사진 업로드, 산림청 공식 100대 명산 데이터는 아직 연결되지 않았습니다.
> 테스트 화면의 거리는 가상 이동거리이며, 이 기록으로는 실제 GPS 뱃지가 지급되지 않습니다. 실제 등산 경로 안내나 안전장비로 사용하지 마세요.

## 개발 스택

- Expo SDK 57 / React Native 0.86 / React 19.2 / TypeScript
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

사용자의 iPhone Expo Go는 SDK 57로 확인되었습니다(2026-10-15). 이 브랜치는 SDK 57을 사용합니다. Expo Go 화면에 표시되는 SDK와 프로젝트 SDK가 같은지 확인하세요.
Expo Go와 터미널 Expo CLI에 동일한 Expo 계정으로 로그인해야 합니다.
Codespaces에서 실행할 경우 `npx expo start --tunnel --clear`를 사용하세요. SDK 전환 후에는 npm 설치 재실행 및 `npx expo start --tunnel --clear`로 Metro 캐시 초기화가 필요합니다. `--tunnel` 설정에는 추가 설치 확인이 필요할 수 있습니다.
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

---

## PHASE 2 개발 실험 (feature/phase2-gps-ar-ready)

**아직 베타 구현입니다.** Expo Go에서 아이폰 화면이 켜진 상태의 GPS 테스트를 위한
기능이며, 백그라운드 GPS와 정확한 AR 산봉우리 식별을 완성했다고 주장하지 않습니다.

### 새로 추가한 기능

- 실제 GPS 산행 버튼: 아이폰 위치 권한 요청 후 expo-location의 watchPositionAsync 사용
- 위도·경도·GPS 정확도·시간을 SQLite gps_samples에 저장
- 낮은 정확도, 급격한 이동, 긴 GPS 신호 공백을 필터링하여 거리 계산
- 30분 연속 정지에서 자동 휴식 확정. 수동 일시정지는 별도 세그먼트로 분리
- 기존 Phase 1 테스트 모드와 GPS 모드 분리 (테스트는 뱃지 불인정)
- 카메라·나침반을 확인하는 AR 산 찾기 시제품
- src/ar/peaks.ts: 검증된 산봉우리 좌표를 대상으로 방향·거리·화면상 가로 위치 계산
- 공식 산봉우리 좌표 데이터는 **미포함**. 산 이름은 현재 표시되지 않습니다
- src/gps/background.ts: 네이티브 iOS 개발 빌드용 TaskManager 등록 코드 (자동 시작하지 않음)
- 데이터베이스 v1 → v2 자동 마이그레이션. 이전 산행 데이터 유지

### 왜 아직 실제 등산에 사용하면 안 되나요?

- Expo Go는 잠금 화면·백그라운드 위치 추적을 지원하지 않습니다
- 화면 잠금, 배터리 절전, 앱 종료로 GPS 수집이 중단될 수 있습니다
- 자동 휴식 및 GPS 거리 정확도는 실외 도보 테스트 전입니다
- 지도 그림은 예시이며 오프라인 길찾기 또는 안전장비 기능이 아닙니다
- 카메라의 산 이름 표시에는 정확한 봉우리 좌표·고도·지형 데이터가 필요합니다
- SQLite의 로컬 기록은 앱 삭제 시 사라질 수 있어 백업이 아직 필요합니다

### Windows Codespaces + 아이폰 13 mini 실행

Codespaces에서 (중복 clone 하지 않기):

    cd /workspaces/fathers-app
    git fetch origin
    git switch feature/phase2-gps-ar-ready
    npm install
    npm run typecheck
    npm test
    npx expo-doctor
    npx expo start --tunnel --clear

Expo CLI와 Expo Go는 같은 Expo 계정으로 로그인합니다.
SDK는 **57**을 유지합니다 (iPhone Expo Go 설치 버전과 일치하는지 확인).
Expo Go에서 카메라 및 *foreground* 위치 테스트만 진행하세요.

### 다음 개발 단계

1. 아이폰 13 mini에서 실제 걷기 10~20분 테스트, 위치 정확도와 배터리 측정
2. GPS 원본 및 거리·자동 휴식 계산 검증; 실패한 경우 기록 수정 기능
3. 정식 iOS development build에서 Always 권한과 백그라운드 TaskManager 활성화
4. 정확한 산봉우리 좌표와 데이터 출처 확보, 카메라 방향 및 고도·가림 보정
5. 사진 앨범, 백업/복원, 100대 명산 공식 목록 확인 후 통합
