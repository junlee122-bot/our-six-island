# 범타듀 밸리 기술 감사 (2차) — 2026-09-25

대상: `/home/user/our-six-island` @ `b75f680`. 저장소 파일은 수정하지 않았고 git 쓰기도 하지 않았습니다. 운영 Supabase에는 접속하지 않았습니다(DB 읽기 쿼리도 하지 않음). 공개 GitHub Pages 사이트만 읽기 전용으로 받아 봤습니다. 비밀값과 코드는 출력하지 않았습니다.
측정 도구: `npm test` 5회, 가짜 시계로 7회 추가 실행, 40회 단일 테스트 반복, oxlint, sharp(이미지 메타데이터), gltf-transform(GLB 분석), `cloudTransition` 7인 시뮬레이션(scratchpad `sim.mjs`), `curl -I`(라이브 사이트).

심각도: **치명** = 지금 사고로 이어질 수 있음 · **높음** = 빨리 고쳐야 함 · **중간** = 계획해서 고칠 것 · **낮음** = 정리 수준

---

## 0. 요약: 우선순위 상위 15

| # | 심각도 | 영역 | 발견 | 근거 |
|---|---|---|---|---|
| 1 | **치명(조건부)** | 보안 | 코드 재발급 3단계(Auth 비밀번호 교체)가 실패하거나 빠지면, `login` 요청의 "복구" 경로가 **유출된 옛 코드로 계정을 활성화**함. 만료 검사도 하지 않음 | `hohyeon-auth/index.ts:177-194`, `rotate-activation-code.mjs:55-60` |
| 2 | 높음 | 보안/운영 | 미활성 5개 계정: 하드닝 이전 코드는 `activation_expires_at IS NULL`(만료 없음). 코드가 유출된 적이 있으니 5개 모두 재발급이 끝났는지 확인해야 함(이번 감사에서는 DB를 조회하지 않음) | `hardening.sql:6-8`, `ACCOUNTS.md:36,101` |
| 3 | 높음 | 서버 성능 | 가만히 있어도 폴링 `read`의 **48%가 world 전체 행을 다시 씀**(`lease.seen` 15초 갱신). 7명 기준 분당 약 26회 전체 행 UPDATE | `lounge-cloud-engine.ts:328`, 시뮬레이션 252/525 |
| 4 | 높음 | 서버 성능 | world 크기의 **98%가 receipts**. 1인당 512개를 보관해 588KB 중 577KB를 차지함. 요청마다 이 전체를 읽고, 복제하고, 문자열로 바꾸고, 다시 씀 | `lounge-cloud-engine.ts:374-380` |
| 5 | 높음 | 테스트 | **플래키 테스트** `empty room: reserved games are auto-completed and settled, never voided`. 40회 중 3회(약 7.5%) 실패. 블랙잭 결과 합이 0이면 `-0 !== 0`이 되는 문제 | `tests/lounge-room-timers.test.mjs:215` |
| 6 | 높음 | CI | Edge 함수(`supabase/functions`)는 tsc에서 제외돼 있고 CI에서 `deno check`도 돌지 않음. 서버 번들이 깨져도 CI는 통과함. Edge 배포는 수동 | `tsconfig.json` exclude, `.github/workflows/ci.yml` |
| 7 | 높음 | 운영 | 백업이 **같은 DB 안에만** 있음(world_snapshots). 프로필 저장(`members.save`)과 `auth.users`는 스냅샷에 들어가지 않음. 복구 리허설 기록도 없음 | `world_backup.sql`, `restore-world.sql` |
| 8 | 중간 | 서버 | 엔진 안의 예상치 못한 예외(TypeError 등)를 **409 + 원문 메시지 receipt**로 저장함. 로그를 남기지 않아 버그가 가려짐 | `lounge-cloud-engine.ts:368-373` |
| 9 | 중간 | 서버/버그 | 채팅을 `slice(0,120)`로 자르면 이모지 서로게이트 쌍이 갈라질 수 있음. 그러면 jsonb 커밋이 실패해 503이 남. 채팅에는 제어문자와 bidi 필터도 없음(방명록에는 있음) | `lounge-room.ts:1645-1646` |
| 10 | 중간 | 비용 | 7인 × 8초 폴링 + Realtime 힌트 팬아웃. 무료 한도(Edge 50만 회/월)에 닿을 수 있음. 1인당 하루 5시간쯤이면 폴링만으로 한도에 도달 | `lounge-cloud-room.ts:31-32` |
| 11 | 중간 | 성능 | 이미지 85개 29.8MB. 디코딩하면 **약 320MB**. 3504×2336 아틀라스 2장(각 31MB). 2048×1360 무손실 캐릭터 시트는 장당 약 2MB. 크로마키를 런타임에 메인 스레드 `getImageData`로 처리 | sharp 측정, `lounge-sprites.ts:130+` |
| 12 | 중간 | 보안 | Pages에 CSP 등 보안 헤더를 붙일 수 없는데 `<meta>` CSP도 없음. 리프레시 토큰이 localStorage(`hohyeon-auth-v1`)에 있음 | `curl -I`, `lounge-auth.ts:7-8` |
| 13 | 중간 | 코드 | 죽은 코드: 진입점에서 닿지 않는 모듈 26개(약 2천 줄). 라이브 `island.html` + `theater.html`이 44MB. `legacy/` 27MB. `.git` 팩 194MB(docs 빌드 커밋 누적) | reach.mjs, `du` |
| 14 | 중간 | 데스크톱 | 업데이터 공개키가 자리표시자이고 `createUpdaterArtifacts=false`라 자동 업데이트가 동작하지 않음. 서명 없음(mac ad-hoc `-`, Windows 미서명). 딥링크 E2E 미검증 | `tauri.conf.json` |
| 15 | 중간 | 운영 | 모니터링과 알림이 없음(pg_cron 실패, `cas_exhausted`, 5xx 비율). 경제 리포트는 개인 액세스 토큰(PAT, 계정 전체 권한)으로 Management API를 호출 | `economy-report.mjs:75-80` |

---

## 1. 성능

### 1.1 번들 / 첫 로드 (측정: `docs/assets`, 라이브 사이트 gzip)

| 파일 | raw | gzip | 첫 화면 |
|---|---|---|---|
| `app-*.js` (entry) | 486 KB | 159 KB | O |
| `vendor-react` | 190 KB | 59 KB | O (modulepreload) |
| `vendor-supabase` | 215 KB | 54 KB | O (modulepreload) |
| `standalone-entry.css` | 209 KB | 43 KB | O |
| `vendor-three` | 627 KB | 156 KB | 지연 로드(좋음) |
| `lounge-village` | 97 KB | 35 KB | 지연 |
| `lounge-bedroom-3d` | 88 KB | 30 KB | 지연 |
| JS 합계 39개 | 1.93 MB | — | |

- 첫 화면에서 받는 양은 JS 약 280KB(gzip)와 CSS 43KB입니다. three.js는 지연 로드가 잘 되어 있습니다.
- **[중간]** entry가 159KB(gzip)로 무겁습니다. `lounge-game.tsx`(2,683줄)와 LifePanels, 계정 UI가 한 청크에 들어 있습니다. 로그인 화면에 필요 없는 게임 HUD, 패널, 경제 UI를 `React.lazy`로 분리하면 대략 절반으로 줄어듭니다. 로그인 전에는 `supabase-js`가 auth 호출에만 필요하므로 `fetch`로 직접 호출하고 realtime-js는 로그인 뒤에 로드하는 방안도 있습니다.
- **[중간]** CSS 209KB가 하나의 파일입니다(카지노, 방, 옷장 CSS 포함). 테이블과 방 전용 CSS는 해당 청크로 옮기는 것을 제안합니다.
- **[중간]** GitHub Pages는 해시가 붙은 자산에도 `cache-control: max-age=600`만 줍니다(라이브 측정). 재방문할 때 자산 약 200개가 매번 재검증(304)을 거칩니다. Cloudflare Pages나 Netlify 같은 헤더 설정이 되는 호스팅으로 옮기거나, 최소한 Service Worker로 `/assets/*`를 cache-first 처리하는 것을 제안합니다.
- `index.html` 안에 라이선스 JSON 약 20KB가 인라인으로 들어 있습니다. 문제는 없지만 크레딧 화면에서 따로 불러와도 됩니다(낮음).

### 1.2 이미지와 모델

- webp 85개 29.8MB, glb 24개 5.1MB, svg 60개 2.7MB.
- 이미지를 GPU/메모리에 풀었을 때 크기(RGBA 기준 추정)는 **약 320MB**이고, 큰 순서는 다음과 같습니다.
  - `lounge-akatsuki-atlas` 3504×2336 (31MB), `lounge-bedroom-background` 3504×2336 (31MB, **코드에서 참조하지 않음**)
  - `lounge-daowon-outfits` 3072×2048 (24MB)
  - `club-friends-{classic,street,smart}`, `dowon-shampoo-atlas`, `club-table` 등 2048×1360 (각 10.6MB, 파일은 각 약 2MB. 염색과 키잉을 위해 무손실로 저장)
  - `lounge-motion-*` 7장 1920×800 (각 5.9MB)
- **[중간]** 아틀라스는 필요할 때 로드하고 LRU 캐시도 있습니다(`lounge-sprites.ts:110-120`). 다만 키잉과 정리를 런타임 `getImageData` 픽셀 루프로 처리합니다(`lounge-sprites.ts:130+`). 2048×1360이면 280만 픽셀을 메인 스레드에서 돌게 되어 첫 입장 때 버벅임이 생깁니다.
  → 빌드(`optimize-assets.mjs`) 단계에서 **알파를 미리 구운** WebP를 만들어 두면 런타임 키잉이 필요 없습니다. 염색에 필요한 마스크만 별도 채널이나 작은 이미지로 분리하면 near-lossless(q≈90)로 1/3~1/5까지 줄일 수 있습니다. 당장은 `OffscreenCanvas` + Worker로 옮기는 방법도 있습니다.
- **[낮음]** 코드에서 쓰지 않는 자산이 빌드에 포함돼 배포됩니다(약 0.77MB): `bedroomBackground`, `bedroom_bed`, `bedroom_sofa`, `bedroom_desk`, `bedroom_wardrobe`, `bedroom_low_table`, `bedroom_bookshelf`(`lounge-assets.ts`, 옛 2D 방).
- GLB는 양호합니다. 대부분 프리미티브 1개, 1024² 텍스처 1장이고, 삼각형은 최대 약 1만 개입니다(village 집 3종). 텍스처 합계는 13.6MPix로, 밉맵까지 포함해 GPU 약 69MB입니다. 가구 11종은 텍스처가 없습니다. 개선 여지는 KTX2(Basis) 전환으로, GPU 메모리를 1/4~1/6로 줄일 수 있습니다(낮음~중간).
- `public/`에 원본 PNG와 `_originals`가 34MB 이상 남아 있습니다. 배포되지는 않지만 저장소를 무겁게 합니다(낮음).

### 1.3 three.js 렌더 루프, 메모리, dispose

- 렌더를 필요할 때만 하는 구조가 **부분적으로 있습니다**. 마을은 움직임, 카메라, 시즌이 바뀌지 않으면 250ms마다(4fps) 렌더합니다(`lounge-village.tsx:2041-2053`). 방과 실내는 120ms마다입니다(`lounge-bedroom-3d.tsx:1030`, `lounge-interior-3d.tsx:912`). `document.hidden`일 때는 멈춥니다. 좋은 구조입니다.
  - **[낮음]** 가만히 있는 마을도 강물 텍스처 오프셋 때문에 4fps로 계속 렌더합니다. 배터리를 더 아끼려면 절전 설정에서 강물 애니메이션을 끄는 옵션을 제안합니다.
- 그림자는 `shadowMap.autoUpdate=false`와 `needsUpdate`로 관리합니다(좋음). 정적 지오메트리는 재질별로 병합(batch)합니다(`lounge-village-world.ts:667-701`). `InstancedMesh`도 사용합니다.
- **[중간]** 장면을 오갈 때의 메모리: 마을은 **렌더러와 world를 모듈 전역에 캐시**합니다(`lounge-village.tsx:434-460, 2303-2308`). 방이나 실내에 들어가면 새 `WebGLRenderer`를 만들고, 나올 때 `forceContextLoss` 합니다. 그래서 방 안에 있는 동안에는 **WebGL 컨텍스트 2개**와 마을 텍스처(GPU 69MB 이상)가 함께 상주합니다. 저사양 노트북이나 Safari(컨텍스트 16개 제한)에서 컨텍스트 손실 위험이 있습니다.
  → 렌더러 하나(`sharedRenderer`)를 방과 실내에서도 재사용하거나, 방에 들어갈 때 마을 텍스처의 GPU 업로드를 해제하는 방안(`texture.dispose()` 후 복귀할 때 재업로드)을 제안합니다.
- **[낮음] 프레임마다 생기는 할당**: 마을 루프가 매 프레임 `Set` 2개, 배열 3~4개, `npcPlayer` 객체를 만듭니다(`lounge-village.tsx:1805-1818, 1844`). 그 밖에 `lastSent = {...position}` 같은 할당이 있습니다. 7명 규모라 영향은 작지만, 60fps에서는 GC가 자주 돕니다. `current.players`가 바뀔 때만 다시 계산하도록 메모이제이션하는 것을 제안합니다.
- 드로우콜은 코드만 읽어서는 확정할 수 없습니다. `renderer.info.render.calls/triangles`와 `renderer.info.memory.textures`를 설정의 디버그 오버레이나 `host.dataset`에 노출해 두면 회귀를 측정할 수 있습니다.

### 1.4 폴링, 백그라운드, 요청 크기

- 폴링 주기는 화면이 보일 때 8초, 숨겨졌을 때 45초이고, Realtime 힌트는 500ms 스로틀입니다(`lounge-cloud-room.ts:31-32, 196-210`). visibility, online, focus 이벤트에 반응합니다(좋음).
- 시뮬레이션(7명 모두 마을)에서 **`read` 응답 1건은 약 23KB**였습니다. 7명 × 분당 7.5회 × 23KB ≈ 분당 1.2MB의 응답이 나갑니다.
- **[높음] 읽기가 쓰기로 바뀜**: `read`에서도 `lease.seen`이 15초보다 오래되면 갱신하므로(`lounge-cloud-engine.ts:328`) `changed=true`가 되고 `hh_world_commit`으로 이어집니다. 시뮬레이션에서 idle read 525회 중 252회(48%)가 world 전체 행을 다시 썼습니다. 7명 기준 **분당 약 26번 전체 행 UPDATE**(행이 600KB라면 분당 약 15MB의 WAL/TOAST churn)가 생기고, CAS 경합의 주된 원인이 됩니다.
  → presence는 world 행에서 분리합니다(`hohyeon.presence(uid, room, connection, seen)`). 또는 `seen` 갱신 주기를 lease(180초)의 절반인 60~90초로 늘리고, `read`의 `seen` 갱신만으로는 커밋하지 않게 합니다. 만료 판단은 커밋 시점의 `now`로 합니다.
- **[중간] 요청량과 무료 한도**: Edge 호출은 1인이 화면을 보고 있는 1시간에 폴링만 약 450회입니다. 여기에 액션과 힌트 팬아웃(다른 6명이 새로 읽음)이 더해집니다. Supabase Free는 월 50만 회입니다. 7명이 하루 평균 5시간씩이면 폴링만으로 한도에 닿습니다. 요금제를 확인하고, 대시보드에 호출 수 알림을 설정할 것을 제안합니다. 힌트를 받은 클라이언트가 revision만 비교하는 가벼운 `op:'peek'`(world를 읽지 않는 `select revision`)을 쓰는 방안도 있습니다.

### 1.5 world JSON 크기 (시뮬레이션: `scratchpad/audit2/sim.mjs`)

- 7명이 채팅 액션을 600회씩 한 뒤 world는 **588KB**였습니다. 그중 **receipts가 577KB(98%)**, ledger 0.4KB, life 4.8KB, rooms 5.1KB입니다. 실제 운영에서는 여기에 정산된 게임 500건(ledger)과 생활 데이터가 더해집니다.
- 상한은 `hh_world_commit`의 6MB입니다(`accounts_and_cloud_save.sql` `hh_world_commit`). 넘으면 **모든 world 변경이 실패**합니다.
- 요청 하나마다 world 전체를 read(jsonb → JSON) → `structuredClone` → 방마다 `JSON.stringify` 2회 → 최종 `JSON.stringify(g)`와 `JSON.stringify(original)` 비교 → commit 순으로 처리합니다. 로컬 측정으로는 p50 4.6ms, p95 7.1ms이지만 Edge에서는 몇 배 느리고, world 크기에 비례해 늘어납니다.
- **[높음] 제안**
  1. receipts를 1인 512개에서 **64개 이하로 줄이거나 TTL 10분**을 둡니다. 재시도 창은 몇 분이면 충분합니다. world가 50KB 안팎으로 줄어듭니다.
  2. 또는 receipts를 별도 테이블 `hohyeon.receipts(uid, request_id pk, hash, ok, error, at)`로 옮기고 같은 트랜잭션에서 처리합니다(`hh_world_commit`을 확장).
  3. 비교할 때 `JSON.stringify(g) !== JSON.stringify(original)` 대신 dirty 플래그를 씁니다.
  4. 운영 확인용 SQL(읽기 전용): `select revision, pg_column_size(state), octet_length(state::text), (select sum(octet_length(v::text)) from jsonb_each(state->'receipts') t(k,v)) from hohyeon.world;` 그리고 `select taken_at, bytes from hohyeon.world_snapshots order by taken_at` 로 크기 추이를 봅니다.

---

## 2. 서버와 엔진

### 2.1 동시성과 CAS (`hohyeon-api/index.ts:273-339`)

- read → transition → `hh_world_commit(expected)`를 최대 12회 시도하고 백오프는 10~400ms입니다(`casBackoffMs`). 한 요청이 world 전체를 최대 12번 읽을 수 있습니다.
- 7명 규모에서는 경합이 주로 **1.4의 read-커밋**에서 나옵니다. 이것을 없애면 경합은 거의 사라집니다. 현재는 `attempt>=3`일 때만 경고 로그를 남기므로 경합률을 알 수 없습니다. → 시도 횟수 히스토그램을 로그로 남길 것을 제안합니다(`attempts` 필드를 매번).
- 한 트랜잭션 안에서 `select ... for update`로 world를 잠그고 JS 대신 plpgsql로 처리하는 방식은 엔진 공유 구조상 어렵습니다. 대안으로 `pg_advisory_xact_lock`을 쓰는 "read-for-update + commit" RPC 한 쌍(요청 1번에 DB 왕복 2번, 재시도 없음)이 가능합니다. 7명 규모에서는 직렬화 비용이 낮습니다.

### 2.2 멱등성과 순서

- receipts(요청 id + 해시), 접속별 `sequence`의 단조 증가, `epoch`로 다른 기기 인계를 처리합니다. 설계는 견고합니다(`lounge-cloud-engine.ts:186-264`). 테스트도 있습니다(`tests/lounge-cloud.test.mjs`).
- **[낮음]** `commandHash`는 `JSON.stringify(command)`라 키 순서에 의존합니다. 클라이언트가 재시도할 때 객체를 다시 만들면서 키 순서가 바뀌면 "이미 사용한 요청 번호" 409가 납니다. 현재 클라이언트는 같은 객체를 재사용하는지 확인하고, 필요하면 정렬된 stringify를 씁니다.

### 2.3 오류 처리

- **[중간]** `lounge-cloud-engine.ts:368-373`: `try` 블록 안의 모든 `Error`(TypeError, RangeError 포함)가 `ok=false, status=409, error=e.message`가 되어 **receipt로 저장되고 커밋**됩니다. 코드 버그가 사용자에게는 영문 메시지의 409로 보이고 서버 로그에는 남지 않습니다. 같은 requestId로 재시도해도 같은 실패가 반복됩니다.
  → `CloudError`, `LifeError`, 알려진 거절만 receipt로 남깁니다. 나머지는 다시 던져 500으로 보내고 `log('error')`로 기록합니다(스택 포함). 이러면 커밋되지 않으므로 상태도 오염되지 않습니다.
- 방 tick 실패를 격리하는 부분(`:165-175`)은 `console.error`만 합니다. 구조화 로그 `log('error','room_isolated',{code})`로 바꾸고 알림 대상에 넣을 것을 제안합니다.
- 브로드캐스트 실패는 경고 로그만 남기고 클라이언트 폴링이 보완합니다(적절함).

### 2.4 입력 검증

- **[중간] 채팅** (`lounge-room.ts:1644-1667`)
  - `a.text.trim().slice(0,120)`는 UTF-16 단위로 자릅니다. 119번째 위치에 이모지가 오면 **짝이 없는 서로게이트**가 남습니다. 재현: `JSON.stringify(("a".repeat(119)+"😀").slice(0,120))` → `"...\ud83d"`. Postgres jsonb는 짝이 없는 서로게이트 이스케이프를 거부하므로 커밋에서 예외가 나고 503("서버에 저장하지 못했어요")이 됩니다.
  - 제어문자, bidi 오버라이드(U+202E), 줄바꿈 필터가 없습니다. 방명록, 우편, 상태 메시지는 `lounge-life.ts:473-511` `lifeText`로 막고 있습니다.
  → 채팅도 `lifeText`와 같은 규칙(`Array.from` 기반 길이, CONTROL 정규식)으로 통일합니다. 레거시 `multiplayer-protocol.ts:18 cleanText`까지 포함해 **텍스트 정리 함수 3종을 하나로** 합칩니다.
- XSS: `dangerouslySetInnerHTML`, `innerHTML`, `eval`은 **0건**입니다(app 전체 grep). 이름은 고정 목록이고 텍스트는 React 텍스트 노드나 canvas `fillText`로만 출력합니다. 양호합니다.
- Edge 입력: 본문 80,000자 제한, 객체 여부 검사, `code` 길이 검사가 있습니다(좋음). `raw.length`는 UTF-16 길이라 바이트 제한과 다릅니다(낮음).

### 2.5 레이트 리밋

- API는 사용자당 분당 300회(`api:<uid>`), 인증은 IP당 분당 60회에 (계정, IP) 조합별 실패 잠금이 있습니다. 적절합니다.
- **[낮음]** `clientIp`는 `cf-connecting-ip`, `x-real-ip`, XFF 마지막 값 순으로 봅니다(`lounge-accounts.ts:225-237`). Supabase 게이트웨이가 이 헤더를 덮어쓰는지 실측으로 확인해야 합니다. 클라이언트가 위조할 수 있으면 IP 버킷을 우회할 수 있습니다(코드가 192비트라 무차별 대입은 현실성이 없음).

### 2.6 시간과 시간대(KST)

- 서버 시간은 DB의 `clock_timestamp()`(`hh_world_read.now`)를 쓰고, KST 계산은 `kstDay` 계열 순수 함수로 합니다. 클라이언트는 `serverNow`로 오프셋을 보정합니다. 양호합니다.
- **가짜 시계로 전체 테스트 실행**(scratchpad `clock.mjs`로 `Date`를 대체): 금요일 20:00 KST, 금요일 23:59:40, 수요일, 일요일, 월요일 23:59:50, 12/31 23:59:55 KST에서 **모두 통과**했습니다. 금요일 저녁 버그 이후 다른 시간 의존 실패는 재현되지 않았습니다. 목요일 23:59:58 실행에서 1건이 실패했지만 시간과 무관한 플래키 테스트(2.8)였습니다.
- **[낮음] 중복**: KST 오프셋과 하루 길이(ms) 상수가 3곳에 따로 있습니다(`lounge-economy.ts:355`, `lounge-calendar.ts:19`, `lounge-village-life.ts:417`). 86,400,000 리터럴도 6개 파일에 있습니다. `lounge-calendar.ts` 하나로 모을 것을 제안합니다. UUID 정규식도 3곳에 중복돼 있습니다.
- 테스트 하네스(`tests/lounge-cloud.test.mjs:8`, `lounge-table-seat.test.mjs:21`, `lounge-table-fill.test.mjs:12`, `lounge-game-departure.test.mjs:60`)가 `now=Date.now()`를 기준으로 삼습니다. 요일이나 시간대 보너스(금요 카지노, 일요 장터, 일일 지급 경계)가 결과에 섞여 들어갈 수 있습니다. → 고정 시각 `T0`(예: 수요일 12:00 KST)을 주입합니다. `lounge-room-timers`는 이미 `T0`를 씁니다.

### 2.7 원장 불변식

- `validateLedger`를 전이 시작과 끝에서 호출합니다(`lounge-cloud-engine.ts:121, 426`). SQL `hh_economy_report`에 `invariant_ok`(잔액 + 예약 + 하우스 = 초기 + 지급)가 있습니다.
- 빠진 부분: invariant가 **주기적으로 검사되지 않습니다**. pg_cron 일일 스냅샷 직후 `hh_economy_report()->'totals'->>'invariant_ok'`를 검사해서 false면 알림을 보내는 것을 제안합니다. 엔진 테스트에 "무작위 명령 시퀀스 → 불변식 유지" 속성 테스트(fuzz)를 추가하면 커버리지가 크게 늘어납니다.

### 2.8 테스트와 플래키

- `npm test` 5회: **5회 모두 통과**(456/456, 36~43초).
- 추가로 가짜 시계 7회 중 1회 실패했고, 해당 테스트만 40회 반복해 **3회 실패(약 7.5%)**했습니다.
  - **플래키 테스트 이름**: `empty room: reserved games are auto-completed and settled, never voided` — `tests/lounge-room-timers.test.mjs:215`
  - 원인: `assert.equal(houseBalance, -escrow.result.reduce(...))`. 블랙잭 결과 합이 0이면(푸시 등) 기대값이 `-0`이 되고, `strictEqual`(Object.is 비교)에서 `0 !== -0`으로 실패합니다. 무작위 덱에 따라 달라집니다.
  - 수정: `assert.equal(houseBalance, 0 - sum)`이나 `+(-sum)`, 또는 `assert.ok(houseBalance === -sum)`. 덱 시드를 고정하는 방법도 있습니다.
- 잠재적 타이밍 의존: `tests/lounge-seotda.test.mjs:262-263`(실시간 10초 대기 루프). CI 부하에서 느려질 수 있습니다(낮음).

---

## 3. 보안

### 3.1 인증 흐름 — **[치명(조건부)]**

`hohyeon-auth/index.ts:177-194`의 `login` 처리:

```
if (!m.activated && digest(password) === m.activation_hash) → 거부
data = signIn(password)                    // GoTrue 비밀번호로 로그인
if (!m.activated) { mode = 'activate'; recoveryCode = ... }   // "중단된 비밀번호 변경 복구"
```

- 미활성 계정은 GoTrue 비밀번호가 곧 활성화 코드입니다. 코드를 재발급할 때 1) `hh_admin_rotate_activation`이 **새 코드의 해시**를 저장하고 2) Auth 비밀번호를 새 코드로 바꿉니다. 이 **2단계가 실패하거나 빠지면**(`rotate-activation-code.mjs:55-60`, SQL 버전은 `password_set=false`인 경우) GoTrue 비밀번호가 **옛(유출된) 코드**로 남습니다.
- 이때 옛 코드로 `op:'login'`을 보내면 해시가 새 코드와 다르므로 첫 검사를 통과하고, `signIn`은 성공하고, `!activated`이므로 **계정이 활성화되고 복구 코드까지 공격자에게 발급**됩니다. `activation_expires_at` 검사도 이 경로에는 없습니다.
- 스크립트 주석("the account cannot be activated until this step succeeds")은 사실과 다릅니다.
- **수정**(작음): 복구 경로에 `looksLikeIssuedCode(b.password)`면 `AuthFailure` 조건을 추가합니다. 새 비밀번호는 `newPasswordProblem` 규칙상 코드 모양일 수 없으므로 정상적인 복구는 영향을 받지 않습니다. 또한 `codeExpired()`면 거부하고, 재발급 스크립트는 3단계가 실패하면 `activation_hash`를 null로 되돌리거나 `--reset`으로 GoTrue 비밀번호를 무작위 값으로 바꾸는 선행 단계를 넣습니다.
- **[높음] 운영 확인**(읽기 전용 SQL, 값 출력 없음): `select username, activated, activation_hash is not null as has_code, activation_expires_at from hohyeon.members where not activated;` → 미활성 5개가 모두 **유출 이후에 재발급되었고 만료가 설정돼 있는지** 확인합니다. `auth_events`에서 `op='login' and detail like 'activate%'` 행을 확인해 위 경로로 활성화된 이력이 있는지도 봅니다.
- 좋은 점: 실패 응답이 모두 같고, (계정, IP) 조합의 실패 잠금은 지수 백오프입니다. 계정별 운영 잠금(`hh_account_lock`), 비밀번호 변경 시 전 세션 종료, 감사 로그, 30일 유휴 만료, 계정당 세션 20개 제한이 있습니다.

### 3.2 세션 저장

- **[중간]** Supabase 세션(access 토큰과 **refresh 토큰**)이 localStorage `hohyeon-auth-v1`에 있습니다(`lounge-auth.ts:7-8`). XSS 싱크가 없어서 현재 위험은 낮지만, CSP가 없으니 방어층이 하나뿐입니다. refresh 토큰은 30일 동안 유효합니다.
- 데스크톱(Tauri)은 강한 CSP 덕분에 더 안전합니다.

### 3.3 GitHub Pages 헤더와 CSP

- 라이브 `curl -I` 결과: `strict-transport-security`만 있고 **CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy가 없습니다**. Pages는 헤더를 설정할 수 없습니다.
- **[중간] 제안**: `index.html`에 `<meta http-equiv="Content-Security-Policy">`를 넣습니다. 값은 Tauri CSP와 같게 합니다: `default-src 'self'; script-src 'self'; connect-src 'self' https://ogfpeqeoaznwjbrbedbx.supabase.co wss://…; img-src 'self' data: blob:; object-src 'none'; base-uri 'self'`. 인라인 `<script type="application/json">`는 실행되지 않으므로 허용됩니다. frame-ancestors는 meta로 지정할 수 없으므로 JS 프레임 탈출 코드(`if (top !== self) …`)를 추가하거나 헤더를 설정할 수 있는 호스팅으로 옮깁니다.
- 레거시 `island.html`(28MB)과 `theater.html`(15.6MB)이 **여전히 라이브에서 200을 반환**합니다. 같은 Supabase 프로젝트의 publishable 키로 공개(non-private) Realtime 채널을 씁니다(`multiplayer-transport.ts:7`). 게임 데이터 노출은 없지만 Realtime 쿼터를 남용할 수 있는 표면입니다. 내리거나 별도 프로젝트로 옮길 것을 제안합니다.

### 3.4 RLS, Realtime, Edge JWT

- `hohyeon` 스키마는 노출되지 않고, RLS가 켜져 있고 정책이 없으며, 권한은 service_role에만 있습니다. RPC도 anon과 authenticated에서 revoke했습니다. 양호합니다.
- Realtime `hh-cloud-*`: 수신은 세션과 lease가 있는 멤버만 가능합니다. 클라이언트 송신은 restrictive 정책으로 막혀 있습니다(`hardening.sql` 8번). 양호합니다.
  - **[낮음]** `hh_realtime_can_receive`는 SECURITY DEFINER이고 anon과 authenticated가 실행할 수 있어서 PostgREST `/rpc/`로도 호출됩니다. 반환값이 불리언뿐이라 영향은 미미합니다. 매 호출 world 행의 jsonb 경로를 읽는 비용이 있습니다.
- `hohyeon-api`는 `verify_jwt=true`로 설정돼 있고, 함수 안에서 다시 `admin.auth.getUser(token)`(GoTrue로 네트워크 왕복)를 하고 `hh_session_member`를 호출합니다. → **요청 1번에 DB와 Auth 왕복이 5번**(getUser, session_member, rate, world_read, world_commit)입니다. 비대칭 JWT 키로 전환하고 `auth.getClaims()`로 로컬 검증을 하면 왕복을 1번 줄일 수 있습니다(중간, 성능).
- CORS `*`: bearer 토큰 방식이라 허용 가능합니다. `hohyeon-auth`는 Pages 도메인과 `tauri://localhost`로 제한하면 피싱 프록시 표면이 줄어듭니다(낮음).

### 3.5 저장소 비밀값 (값은 출력하지 않음)

- `git grep`(현재 트리)과 **전체 이력**(`git log -p --all`)에서 JWT, `sb_secret_`, `sbp_`, `ghp_`, AWS, PEM, `HH-/HR-` 48자리 코드 패턴을 검색했습니다.
  - 발견: `app/lounge-auth.ts:4`, `app/multiplayer-transport.ts:7`의 **publishable(공개) 키**뿐입니다. 공개용이므로 정상입니다.
  - 이력의 `eyJhbGciOi` 일치 30건은 모두 minified `vendor-supabase` 라이브러리 안의 문자열이었고 키가 아닙니다.
  - 활성화 코드와 복구 코드 형식(`H[HR]-[0-9a-f]{48}`)은 이력 전체에서 **0건**입니다.
- `.gitignore`가 `.env*`, `*.pem`, `supabase/admin/reports/`를 제외합니다. 양호합니다.

### 3.6 Tauri

- CSP가 엄격합니다(`script-src 'self'`, `connect-src`는 Supabase 도메인만). `opener`는 http와 https만 엽니다(`desktop-init.js:44`). 딥링크는 접두사를 검사하고, 페이지 쪽에서 코드를 검증합니다. 양호합니다.
- **[낮음]** `withGlobalTauri: true`로 `window.__TAURI__`가 모든 스크립트에 노출됩니다. CSP 덕분에 위험은 낮습니다. `core:window:allow-destroy`와 `process:allow-restart` 권한은 필요한 만큼인지 다시 검토할 것을 제안합니다.

---

## 4. 코드 상태

### 4.1 죽은 코드와 레거시 (`scratchpad/audit2/reach.mjs`: `scripts/standalone-entry.tsx`에서 import 그래프를 따라감)

- 진입점에서 닿지 않는 `app` 파일이 **26개(1,978줄)**입니다. 그중 `lounge-economy-report.ts`(844줄)는 관리자 CLI가 쓰므로 유지합니다. 나머지는 옛 섬과 극장 코드입니다: `island-game.tsx`, `island-map.tsx`, `island-atmosphere.ts`, `world.tsx`, `theater-*.ts(x)` 5개, `multiplayer-session.ts`, `multiplayer-ui.tsx`, `use-multiplayer.ts`, `webmcp.ts`, `save-storage.ts`, `sprite-sheet.ts`, `character-avatar.tsx`, `character-renderer.ts`, `canvas-resolution.ts`, `game-assets.ts`, `wardrobe-ui.tsx`, `life-ui.tsx`, `layout.tsx`, `page.tsx`(vinext 경로). 일부는 `tests/game.test.mjs`, `life.test.mjs`, `multiplayer.test.mjs`, `theater.test.mjs`와 `scripts/verify-*.mjs`가 참조합니다.
  - `.oxlintrc.json`의 ignore 목록에 같은 파일들이 **나열되어 있어서** 사실상 관리되지 않는 상태입니다.
- `lounge-room.ts`(2,523줄)가 `theater-data`와 `multiplayer-transport`를 import합니다. 레거시 의존이 남아 있습니다.
- 크기: `docs/island.html` 28.2MB + `docs/theater.html` 15.6MB = **43.9MB**(라이브에서 제공 중), `legacy/` 27MB, `public/` 원본 PNG 34MB, `.git` 227MB(팩 194MB, 배포할 때마다 docs 바이너리를 커밋한 결과).
- **제안**: 레거시 섬과 극장을 별도 브랜치나 태그(`legacy-island`)로 옮기고, `docs/`에서 제거하고, 관련 테스트와 스크립트를 삭제합니다. 그다음 Pages 배포를 Actions artifact로 전환하면(`pages.yml`은 이미 준비됨) 커밋마다 이력이 수십 MB씩 늘어나는 일이 멈춥니다.

### 4.2 큰 파일

- `lounge-village.tsx` **3,205줄**(117KB). 컴포넌트 하나의 `useEffect` 안에 렌더 루프, 입력, 라벨, 낚시, 오디오, NPC가 모두 들어 있고 약 1,600줄에 달합니다(1616-2272).
- `lounge-game.tsx` **2,683줄**, `lounge-room.ts` 2,523줄, `LifePanels.tsx` 1,509줄, `lounge-life-plus.ts` 1,476줄.
- 제안: 마을 루프를 `village-input.ts`, `village-labels.ts`, `village-fishing.ts`, `village-residents.ts` 같은 순수 모듈과 작은 시스템으로 나눕니다. `lounge-game.tsx`는 탭 라우팅, 세이브, 연결 훅 단위로 분리합니다.

### 4.3 타입 구멍

- `as any` 2, `: any` 5(Edge 함수의 `body: any`, `m: any`, `data: any` 포함), `as unknown as` 16(`lounge-cloud-room.ts:504-518`의 `LoungeAction` 강제 캐스트 3곳 포함), 기타 `as X` 캐스트 약 120개. `@ts-ignore`는 0건입니다.
- **[높음] `supabase/functions`는 `tsconfig` exclude에 들어 있고 CI에서 `deno check`도 하지 않습니다.** 서버 진입점, 멤버와 프로필 형태, RPC 반환 타입이 검사되지 않습니다. → CI에 `denoland/setup-deno` + `deno check supabase/functions/*/index.ts`를 추가하고, RPC 반환 타입을 `supabase gen types`로 생성합니다.

### 4.4 Lint

- `oxlint`: 오류 0, **경고 17**(a11y `prefer-tag-over-role` 13, `no-autofocus` 2, `prefer-const` 1(`tests/lounge-table-seat.test.mjs:200`), `no-control-regex` 1(`multiplayer-protocol.ts:18`)).

### 4.5 테스트 커버리지 공백

- 테스트 파일 59개, 테스트 456개. 순수 엔진 커버리지는 넓습니다.
- 테스트가 없는 곳:
  - `lounge-cloud-room.ts`(572줄: 폴링, 힌트, 재접속, epoch, offline 상태 전이)
  - `lounge-cloud-save.ts`(드래프트와 CAS 저장 충돌)
  - `lounge-auth.ts`
  - **Edge 핸들러 자체**(`hohyeon-api/index.ts`의 CAS 루프와 op 분기, `hohyeon-auth`의 로그인 복구 경로. 3.1 버그가 테스트로 잡히지 않은 이유)
  - `.tsx` UI 전부
- 제안: `admin`, `rpc`, `fetch`를 주입할 수 있게 Edge 핸들러를 `handle(body, deps)`로 분리하고 node:test로 검증합니다. 특히 auth 시나리오 표(미활성/활성, 만료, 반쯤 끝난 재발급)를 만듭니다. `lounge-cloud-room`은 가짜 fetch와 가짜 타이머로 상태 전이를 테스트합니다.

### 4.6 CI

- `ci.yml`(push/PR): `tsc`, `npm test`, `lint`, `build-standalone`(임시 출력), 크기 요약. 양호합니다.
- 빠진 것:
  1. Edge `deno check`
  2. 번들 크기 **예산 검사**(요약만 출력하고 실패시키지 않음)
  3. 커밋된 `docs/`가 소스 빌드와 일치하는지 확인하는 검사(수동 빌드 커밋이라 어긋날 수 있음)
  4. 마이그레이션 검사(로컬 `supabase db start` 후 `db reset`으로 전 마이그레이션 적용과 `restore-world.sql` 리허설)
  5. Edge 함수 자동 배포
- `pages.yml`은 `workflow_dispatch` 전용이라 비활성 상태입니다. `desktop.yml`은 lint를 하지 않습니다.
- 이번 감사 시점의 GitHub Actions 실행 결과는 확인하지 않았습니다(로컬에서는 tsc를 제외한 동일 단계가 통과).

### 4.7 데스크톱 빌드 준비도

- **[중간]** 업데이터: `plugins.updater.pubkey`가 자리표시자 문자열이고 `bundle.createUpdaterArtifacts=false`입니다. `latest.json`이 만들어지지 않으므로 앱 안의 업데이트 확인은 항상 실패하거나 없음으로 끝납니다. 친구들이 수동으로 다시 설치해야 합니다.
  → `npx tauri signer generate`로 키를 만들고, 공개키는 conf에, 개인키는 `TAURI_SIGNING_PRIVATE_KEY` 시크릿에 넣고, `createUpdaterArtifacts: true`로 바꿉니다.
- 서명: macOS `signingIdentity: "-"`(ad-hoc)는 Gatekeeper 우회 안내가 필요합니다. Windows는 미서명이라 SmartScreen이 뜹니다. 7명 규모라면 안내로 감수할 수 있지만, 자동 업데이트까지 미서명이면 사용성이 나빠집니다.
- 딥링크 `beomtadew://lounge/<code>`는 E2E로 검증되지 않았습니다. 이미 실행 중인 앱으로 전달되는지(Windows 단일 인스턴스), 로그인 전에 링크가 보존되는지 수동 체크리스트가 필요합니다.
- `desktop/src-tauri/target` 1.7GB가 로컬에 있습니다(무시 대상인지 확인됨. git에는 없음).

---

## 5. 운영

### 5.1 백업과 복구

- 있는 것: pg_cron 매일 04:00 KST `hh_world_snapshot('daily')`, 보존 정책(14일은 전부, 90일까지는 일 단위, 이후 주 단위), 복구 미리보기와 복구 SQL, 사전 스냅샷 규칙. 좋습니다.
- **[높음] 빠진 것**
  1. 스냅샷이 **같은 DB**에만 있습니다. 프로젝트가 삭제되거나 일시정지되거나 DB가 손상되면 백업도 함께 잃습니다. Free 플랜은 자동 백업이 제한적입니다. → 주 1회 GitHub Actions(스케줄)로 `hh_world_restore_preview` 또는 `pg_dump --schema=hohyeon`을 뜨고, age/GPG로 암호화한 artifact나 비공개 저장소로 오프사이트 보관합니다. 서비스 키는 Actions 시크릿에 둡니다.
  2. world에 들어 있지 않은 **`members.save`(방, 코디 프로필)는 `profile_history` 20개**뿐이고 같은 DB에 있습니다. `auth.users` 매핑(user_id)도 백업 대상에 넣어야 합니다.
  3. **복구 리허설 기록이 없습니다**. 로컬 `supabase start`에 스냅샷을 넣고 `restore-world.sql`을 실행한 뒤 경제 리포트 `invariant_ok=true`까지 확인하는 과정을 CI 잡으로 만들 것을 제안합니다.
  4. pg_cron 성공 여부를 모니터링하지 않습니다: `select * from cron.job_run_details where jobid=… order by start_time desc limit 7`.

### 5.2 모니터링과 알림

- Edge 함수에 구조화 로그(JSON)와 `requestId`가 있고 `cas_contention`, `cas_exhausted`, `broadcast_failed`, `request_failed`를 기록합니다. 좋습니다.
- **[중간]** 알림이 없습니다. 제안: 15분마다 도는 GitHub Actions 스케줄(또는 Supabase Log Drain)로 다음을 확인하고 실패하면 Discord/Slack 웹훅으로 알립니다.
  - `cas_exhausted` 또는 5xx 발생 건수
  - 스냅샷이 26시간 넘게 없음
  - world 크기가 2MB 초과
  - `invariant_ok=false`
  - 인증 실패 급증(`auth_events`)
- 공개 헬스 엔드포인트가 없습니다. `op:'health'`(DB에서 `select revision`만 수행)를 두면 외부 업타임 모니터를 붙일 수 있습니다.

### 5.3 경제 리포트

- `supabase/admin/economy-report.mjs`가 `SUPABASE_ACCESS_TOKEN`(개인 PAT, **계정의 모든 프로젝트에 대한 전체 권한**)으로 Management API `/database/query`를 호출합니다(`:75-80`). 그리고 `hh_economy_report`의 SQL 쪽 요약은 JS 쪽 계산과 교차 검증합니다.
- **[중간]** PAT가 유출되면 영향 범위가 가장 넓습니다. → 읽기 전용 DB 역할(`hohyeon_report`, `hh_economy_report`만 EXECUTE 권한)과 전용 비밀번호로 `psql`이나 `postgres.js`로 직접 접속하게 바꾸고, PAT는 쓰지 않습니다. 리포트는 CI 스케줄로 생성해 비공개 artifact로 보관합니다.

### 5.4 배포 절차

- 현재 절차: 마이그레이션(수동, SQL 편집기 또는 CLI) → Edge(`supabase functions deploy`, 실제로는 사용자 토큰으로 Management API 수동 업로드) → Pages(로컬 빌드 후 `docs/` 커밋). 버전 호환성을 사람이 순서로 관리합니다(`ACCOUNTS.md:91-103`).
- **[중간] 제안: `deploy-server.yml`**
  - 트리거: `workflow_dispatch` + `supabase/**` 또는 엔진 파일(`app/lounge-*.ts` 중 서버에 번들되는 목록)이 바뀐 main push. `environment: production`(수동 승인 reviewer)으로 보호합니다.
  - 단계: `npm ci` → `tsc`, `test`, `deno check` → `supabase link --project-ref ogfpeqeoaznwjbrbedbx` → 사전 스냅샷(`psql -c "select hh_world_snapshot('pre-deploy-${GITHUB_SHA}')"`) → `supabase db push`(마이그레이션) → `supabase functions deploy hohyeon-auth hohyeon-api` → 스모크(`op:'profile'`은 인증이 필요하므로 헬스 op로 확인).
  - 시크릿: `SUPABASE_ACCESS_TOKEN`(가능하면 이 용도 전용 계정이나 조직 토큰), `SUPABASE_DB_PASSWORD`. 사용자 개인 토큰을 로컬 셸에서 쓰는 방식은 없앱니다.
  - 그다음 Pages 잡(`pages.yml`)을 서버 배포 성공 뒤에 `needs`로 이어 붙이면 순서 규칙이 자동으로 지켜집니다.
- 클라이언트와 서버 버전 불일치를 막기 위해 요청에 `x-client-version`을 보내고 서버가 최소 버전을 응답하게 하면(`app` 새로고침 안내) 순서 사고를 줄일 수 있습니다.

### 5.5 마이그레이션 관리

- 첫 두 마이그레이션은 운영에 **수동 적용**됐고, `supabase_migrations.schema_migrations` 이력과 일치하는지 확인하지 않았습니다. → `supabase migration list --linked`로 대조합니다.
- 마이그레이션 안에서 DML(`select hh_world_snapshot('migration-…')`)과 `create extension pg_cron`을 실행합니다. 로컬 `db reset`에서는 문제가 없지만, 브랜치나 프리뷰 DB에서는 부작용이 있을 수 있습니다(낮음).
- `hh_world_commit` 6MB 상한과 `hh_profile_save` 64KB 상한이 SQL과 TS 양쪽에 따로 있습니다. 한쪽을 바꾸면 불일치가 생깁니다. 상수를 한곳에서 관리하고 테스트로 대조할 것을 제안합니다(낮음).
- 롤백(down) 스크립트가 없습니다. 추가형 마이그레이션 원칙은 지켜지고 있습니다.

---

## 6. 빠른 수정 목록 (작은 것부터)

1. `hohyeon-auth` 로그인 복구 경로에 `looksLikeIssuedCode(password)`면 거부하는 조건과 만료 검사를 추가합니다. 재발급 스크립트는 3단계가 실패하면 해시를 되돌립니다. (1시간)
2. 미활성 5개 계정의 재발급과 만료를 SQL로 확인하고, 필요하면 `--days=7`로 재발급합니다. (운영 30분)
3. `tests/lounge-room-timers.test.mjs:215`의 `-0` 비교를 수정합니다. (5분)
4. 채팅을 `lifeText` 규칙으로 통일합니다(서로게이트와 제어문자 처리). (30분)
5. receipts 상한을 512에서 64로 줄이거나 TTL을 둡니다. `read`에서는 `seen`만으로 커밋하지 않고 주기를 60초 이상으로 늘립니다. (반나절, 엔진 테스트 포함)
6. 엔진의 예상치 못한 예외는 receipt로 남기지 않고 500으로 보내 로그를 남깁니다. (30분)
7. CI에 `deno check`와 번들 크기 예산을 추가합니다. (1시간)
8. `index.html`에 meta CSP와 프레임 탈출 코드를 추가합니다. (1시간 + 검증)
9. 오프사이트 백업, 복구 리허설, 알림용 Actions 스케줄을 만듭니다. (하루)
10. 서버 배포 워크플로(시크릿과 environment 승인)를 만들고 Pages를 Actions 배포로 전환한 뒤 레거시 페이지를 제거합니다. (하루)
