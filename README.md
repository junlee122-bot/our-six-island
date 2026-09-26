# 범타듀 밸리 · 일곱 친구의 마을

호현지방의 작은 마을 **범타듀 밸리**에서 친구 일곱 명이 각자의 캐릭터로 만나 산책하고, 옷을 갈아입고, 방을 꾸미고, 회관과 카지노에서 함께 미니게임을 하는 브라우저 게임입니다. 친구끼리 쓰는 비상업 프로젝트입니다.

[바로 플레이](https://junlee122-bot.github.io/our-six-island/) · [현재 상태와 다음 할 일](GAME_PROGRESS.md) · [에셋 출처](ASSETS.md) · [계정·서버 운영](ACCOUNTS.md)

## 마을 둘러보기

로그인하면 3D 마을 한가운데에서 시작합니다. 캐릭터는 2D 스프라이트(걷기·달리기 모션 포함)이고 마을·건물·가구는 Three.js 3D입니다.

| 장소 | 하는 일 |
|---|---|
| **마을** | WASD/방향키(Shift 달리기), 바닥 클릭·터치, 모바일 방향 버튼으로 이동. 건물 문 앞에서 E/Enter로 입장. 마을 안내에서 장소를 고르면 걸어서 이동. 미니맵·전체 보기, 마을 수다와 범티콘 스티커. |
| **범마을 회관** | 화투 테이블: 고스톱(3인), 섯다(2~7인). |
| **별빛 카지노** | 텍사스 홀덤(2~7인, AI 딜러 루미), 블랙잭(2~7인, 6덱 S17), 체스(2인). |
| **분장실** | 코디: 기본복·스트리트·외출복 컬렉션, 도원 전용 의상, 아카츠키 코스튬, 머리색·피부색(RGB/HEX), 안경·꽃 머리핀·도원 응원 머리띠, 코디 보관함, PNG 사진 저장. |
| **내 방** | 친구마다 테마가 다른 3D 스튜디오(가구 15개)를 걷는 산책방과, 28종+ 소품을 배치하는 2D 꾸미기(최대 48개, 되돌리기 20단계). |
| **일곱 집** | 도원·강재·민서·승준·민재·재민·호현의 집. 지금은 자기 집만 들어갈 수 있습니다. |

## 함께 게임하기

1. 게임 현황(회관·카지노)에서 게임·금액·초대할 친구를 고릅니다. 받은 친구는 금액을 확인하고 **참가하기 / 다음에**로 응답합니다.
2. 인원이 모이면 참가자 전원이 게임 전용 화면으로 이동합니다. 다른 친구들은 관전할 수 있고, 서로 다른 인원이 여러 게임을 동시에 할 수 있습니다.
3. 판이 끝나면 같은 친구들과 **다음 판 준비**로 이어서 할 수 있습니다.

- 모든 규칙 판정·패 분배·정산은 서버가 합니다. 상대의 비공개 패는 서버에만 있고 각자에게는 볼 수 있는 정보만 전달됩니다.
- 공통 화폐는 **범**입니다. 새 계정에 100,000범을 한 번 지급하고, 판돈·바이인은 1,000/5,000/10,000/20,000범 중에서 고릅니다. 시작할 때 예약하고 끝나면 한 번만 정산합니다(블랙잭은 기본 베팅의 4배까지 예약).
- 세부 규칙은 게임 화면의 규칙 보기에 있습니다. 고스톱은 3인 기본 룰(1점=100범), 섯다는 광땡·땡·끗 족보와 암행어사·땡잡이·구사 재경기, 홀덤은 노리밋(블라인드 100/200범), 체스는 chess.js 규칙입니다.

## 계정

- 친구 일곱 명의 **고정 계정**만 있습니다. 새 가입은 없습니다.
- 첫 접속은 **첫 로그인 → 개인 활성화 코드 → 새 비밀번호** 순서입니다. 활성화 코드는 운영자가 친구에게 개별로 전달하며 저장소·문서·채팅에 적지 않습니다.
- 비밀번호 변경·찾기 때 새 복구 코드가 발급되고 기존 세션은 끊깁니다. 복구 코드는 각자 보관합니다.
- 코디·방 배치·지갑은 계정에 저장되어 어느 기기에서나 이어집니다. 저장이 충돌하면 서버 기록과 내 기록 중에서 고를 수 있습니다.

## 구조

```
app/                  게임 소스 (React 19 + Three.js). 진입점: app/lounge-game.tsx
  lounge-*.ts         규칙 엔진(순수 함수, 서버와 공유)·마을·방·UI
  lounge-assets.ts    이미지 매니페스트 (빌드가 이 목록으로 에셋을 검사·배포)
  lounge-model-assets.ts  3D 모델 매니페스트
supabase/             Edge Functions(hohyeon-auth, hohyeon-api)·마이그레이션·운영 스크립트
public/assets, public/models   원본 에셋 (배포되는 것은 매니페스트에 있는 파일만)
scripts/              Pages 빌드, 에셋 최적화
tests/                node:test 회귀 검사
docs/                 GitHub Pages 배포 결과물 (빌드로 생성)
```

화면과 에셋은 GitHub Pages가 정적 파일로 제공하고, 로그인·저장·게임 진행은 Supabase(Auth·Postgres·Edge Functions)가 맡습니다. 별도 서버는 없지만 플레이에는 인터넷과 HTTPS가 필요합니다.

## 개발

Node.js 22.13 이상.

```bash
npm ci
npm run check            # tsc --noEmit + npm test + npm run lint (CI와 같음)
npm run build:pages -- --out /tmp/pages   # 스크래치 폴더로 빌드해 확인
python3 -m http.server -d /tmp/pages 8080 # 로컬에서 열어 보기
npm run optimize:assets  # 원본 PNG/GLB에서 WebP·압축 GLB를 다시 만듦
```

- `npm run dev`는 vinext 개발 서버입니다. 실제 배포 빌드는 `build:pages`(Vite)이므로 배포 전에는 반드시 `build:pages` 결과를 확인합니다.
- `build:pages`는 `index.html` 하나와 `assets/` 아래의 **콘텐츠 해시 파일**(앱 JS, 지연 로딩 청크, CSS, 이미지, 모델)을 만듭니다. `React.lazy`/동적 import로 코드 분할할 수 있습니다.
- 에셋 개수는 하드코딩하지 않습니다. 매니페스트에 적힌 파일이 모두 있는지, 중복이 없는지, 빌드 결과가 모든 경로를 해시 URL로 바꿨는지 검사합니다.
- 이미지 예산: 새로 참조한 이미지가 600KB를 넘으면 경고, 3MB를 넘으면 빌드 실패입니다. 캐릭터 아틀라스처럼 예외가 필요한 파일은 `scripts/build-standalone.mjs`의 `ATLAS_EXCEPTIONS`에 이유와 함께 추가합니다. 모델은 1MB 경고, 4MB 실패입니다.
- 새 에셋을 추가할 때: 원본을 `public/`에 두고 → 필요하면 `optimize-assets.mjs`에 추가해 WebP/압축본을 만들고 → 매니페스트에 경로를 적고 → `ASSETS.md`에 출처·라이선스를 기록합니다. 염색·마젠타 배경 제거에 쓰는 캐릭터 아틀라스는 반드시 **무손실 WebP**여야 합니다.

## 배포

### 배포 순서

**새 클라이언트는 새 서버가 필요합니다**(private Realtime, v3 방 저장, `world.life` 작업, 친구 방 방문 `visit`). 그래서 항상 이 순서로 배포합니다. 자세한 명령과 확인 방법은 [ACCOUNTS.md의 ‘배포 순서’](ACCOUNTS.md#배포-순서)에 있습니다.

1. **DB 마이그레이션**: `supabase/migrations/20260924120000_hohyeon_hardening.sql`과 그보다 새 마이그레이션을 순서대로 적용
2. **Edge 함수**: `hohyeon-auth`(verify_jwt=false)와 `hohyeon-api`(verify_jwt=true)를 공유 `app/*.ts` 파일과 함께 배포 (`supabase functions deploy hohyeon-auth hohyeon-api`)
3. **Pages**: `npm run check` → `npm run build:pages`(기본 출력 `docs/`) → 로컬에서 `docs/`를 띄워 확인 → main에 머지하면 `/docs`가 게시됨
4. **활성화 코드 재발급**: 쓰지 않은 활성화 코드는 `supabase/admin/rotate-activation-code.mjs`로 모두 새로 발급

서버 쪽 변경이 없으면 3번만 합니다. 현재 GitHub Pages는 main 브랜치의 `docs/` 폴더를 게시합니다.

`build:pages`는 `docs/assets/`를 비우지 않습니다. 빌드 후 새 `index.html`(과 그 청크)이 더 이상 참조하지 않는 해시 파일은 지워도 됩니다. 예전 HTML을 캐시한 브라우저가 없어진 청크를 요청하면 앱이 한 번 새로 고쳐 새 HTML을 받습니다.

### 나중에 Actions 배포로 바꾸기

`.github/workflows/pages.yml`에 빌드 결과를 Pages 아티팩트로 올리는 워크플로가 준비되어 있습니다(지금은 수동 실행만 가능). 바꾸려면:

1. 저장소 Settings → Pages → Source를 **GitHub Actions**로 변경
2. Actions → *Deploy Pages* → Run workflow로 한 번 배포해 확인
3. 워크플로에 `push: branches: [main]`을 추가하고, `.gitignore`에 `/docs/`를 넣은 뒤 커밋된 `docs/` 결과물을 별도 커밋으로 삭제

이렇게 하면 빌드 결과물 때문에 저장소가 커지는 문제가 멈춥니다.

### CI

`.github/workflows/ci.yml`이 push·PR마다 `npm ci`, `tsc --noEmit`, `npm test`, `npm run lint`, 스크래치 폴더로의 Pages 빌드를 실행합니다.

## 보안 메모

- 활성화 코드·복구 코드·비밀번호·서비스 키는 저장소, 커밋 메시지, 이슈, 문서, AI 대화에 절대 적지 않습니다. 노출이 의심되면 `supabase/admin/`의 재발급 스크립트로 코드를 바꿉니다(절차는 ACCOUNTS.md).
- 클라이언트에 들어가는 Supabase 값은 공개용 anon 키뿐입니다. 서비스 키는 Edge Function 비밀 값에만 둡니다.
- 로그인 실패는 계정과 IP 기준으로 점점 길게 잠기며, 실패 이유를 구분해 알려 주지 않습니다(2026-09-24 서버 보강분, 배포 후 적용).
- 브라우저 테스트는 외부 요청을 막은 합성 계정으로만 합니다. 실제 친구 계정·지갑·저장을 테스트에 쓰지 않습니다.

## 예전 게임

예전 섬(`island.html`)과 우당탕 극장(`theater.html`) 페이지, 그 전용 코드·테스트·원화(`legacy/`)는 2026-09 삭제했습니다(git 기록에 남아 있음). 사이트의 진입점은 `docs/index.html` 하나입니다. 원본 사진은 어떤 배포물에도 포함하지 않습니다.

## 라이선스와 크레딧

코드는 친구들끼리의 비상업 프로젝트입니다. 외부 에셋의 출처·조건은 [ASSETS.md](ASSETS.md)에 있고, 배포 HTML에도 three.js, chess.js, Chessnut 체스 말, hwatu 화투 카드(CC BY-SA 4.0), kArchive 모델 고지를 함께 넣습니다.
