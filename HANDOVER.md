# 범타듀 밸리 인수인계 (Claude Code → ChatGPT)

작성일: 2026-09-27 · 저장소: `junlee122-bot/our-six-island` · 작업 브랜치: `claude/dreamy-einstein-x142a5` (= `main`과 동일 시점까지 반영)

이 문서 하나로 지금 상태, 처음 ChatGPT/Codex 코드와의 차이, 남은 작업, 운영 방법을 파악할 수 있게 정리했습니다. 세부 설계·점검 문서는 `handover/design/`에 있습니다. 화면·에셋을 건드리기 전에는 **`handover/STYLE-AND-SOURCES.md`**(미감 규칙과 자료 출처)를 먼저 읽으세요.

---

## 1. 한눈에 보기

- **게임**: 친구 7명(도원, 강재, 민서, 승준, 민재, 재민, 호현)이 하나의 온라인 월드를 공유하는 아늑한 3D 마을 생활 + 카지노/보드게임. PC(데스크톱) 전용.
- **공개 주소**: https://junlee122-bot.github.io/our-six-island/
- **스택**: React 19 + Vite(vinext) + three.js, TypeScript. 서버는 Supabase(Edge Functions `hohyeon-auth`, `hohyeon-api` + Postgres `hohyeon` 스키마, 비공개 Realtime). 데스크톱 앱은 Tauri 2(`desktop/`).
- **서버 권위(authoritative) 구조**: 게임 규칙은 `app/*.ts`의 순수 엔진에 있고, 같은 코드가 Edge Function에 번들되어 서버에서 판정합니다. 클라이언트는 결과만 그립니다.
- **월드 저장**: DB 한 행(JSON) + revision CAS. 범(화폐) 원장 불변식 `잔액 + 예약 + 하우스 − 지급 = 계정수 × 100,000`을 테스트가 항상 검사합니다.
- **2026-09-28 생활 업데이트**: 미용실·은행, 지도 친구 위치, 낚시 반응 등급·보너스, 차용증·방어 물품·강도, 루미 장부·대부 창구, NPC 친밀도/방 초대. 구현 범위·수치·검증은 [생활 업데이트](handover/design/life-services-2026-09-28.md)를 보세요. 은행 보관금도 위 원장의 예약 합계에 포함합니다.

## 2. 처음 ChatGPT 코드와 얼마나 달라졌나

기준 커밋: `00a2d49` (2026-09-24, Claude 작업 시작 직전, ChatGPT/Codex가 만든 상태)

| 항목 | 시작 시점 | 지금 |
|---|---|---|
| 커밋 수 (이후) | – | 80+ |
| 변경 파일 | – | 1,053개 (+185,053 / −35,052줄) |
| `app/` TS/TSX 코드 | 약 22,700줄 | 약 81,500줄 (약 3.6배) |
| `app/` 파일 수 | 103 | 278 |
| 테스트 파일 | 32 | 75 (테스트 632개, 전부 통과) |
| 배포 방식 | `docs/` 빌드 결과 커밋 + 수동 Edge 업로드 | GitHub Actions 자동 배포(Pages + Edge) |
| 옛 페이지 | island.html / theater.html 포함 | 삭제 (약 68MB 제거) |

### 새로 생기거나 크게 바뀐 것 (영역별)

**서버·보안·운영**
- 계정 활성화 강화(만료, 실패 잠금, 감사 로그, 세션 만료), 비공개 Realtime 채널, 인증 복구 경로 구멍 수정(D-1)
- 매일 월드 스냅샷(pg_cron) + 경제 현황판(`supabase/admin/economy-report.mjs`)
- 읽기만으로 월드 행을 쓰던 문제 제거(분당 26회 → 6.5회), 요청 기록 64개/10분 제한(월드 588KB → 80KB)
- 예상 못 한 엔진 오류는 로그만 남기고 커밋하지 않음, 채팅 이모지 쪼개짐 수정, 공통 텍스트 정리(`app/text-clean.ts`)
- 자동 배포: `.github/workflows/pages.yml`(Pages), `edge.yml`(Edge, 저장소 Secret `SUPABASE_ACCESS_TOKEN` 사용), `ci.yml`(타입·테스트·린트·CSS 린트)

**PC 게임 기본기**
- Esc 시스템 메뉴, 5탭 설정(그래픽/화면/소리/조작/알림), 키 재설정, 단축키(I/K/L/J/M/B/T/U/F1/F11), 툴팁·커서, 모바일 코드 제거, PC 전용 안내 화면
- Tauri 데스크톱 셸(딥링크 `beomtadew://`, 닫을 때 저장, 창이 가려져도 알림)

**마을·생활**
- 마을 96×76로 확장, 친구별 텃밭 마당(6/9/12칸), 새 낚시터 6곳 + 물고기 22종, 텃밭 장부/낚시 UI 재설계
- 작물 10종·품질·비료·날씨, 달력·명절·계절, 가방/단축 칸, 채집·벌레·박물관(공동 기증)·도감·요리·제작·게시판
- 친구 NPC 대사(`app/lounge-friend-lines.ts`, 친구가 직접 쓰는 대사 기능), 하트 보상, 축제(추석·봄 꽃놀이), "마을 적응하기" 체크리스트
- 경제 개편: 품목별 수요 곡선, 마을 공사 2차, 집 확장 4단계, 주간 명품 가구, 새로고침, 고급 염색, 5만/10만 판돈 (120일 시뮬레이션 범 총량 12.2배 → 약 1.1~1.5배)
- **맵 확장 1단계**: 기술 5종(농사/낚시/채집/광업/솜씨, Lv10, 전문가 30종), 대장간 도구 강화(구리→철→금→별빛), 마을 개척 연구 9개(V1~V3 활성), 성장 수첩(T)
- **맵 확장 2단계**: 뒷산·숲 깊은 곳·광산 1~20층(승강기, 화석) — 별도 지역 씬(`app/lounge-areas.ts`, `lounge-walk-world.ts`, `lounge-mine.ts`)
- **무드 시스템**: 욕구 4개, 무드렛 43종, 영감 4종, 방 아늑함, U 키 무드 창, 친구 응원 (`app/lounge-mood*.ts`)

**카지노·보드게임·건물**
- 3D 회관·카지노 실내, 스프라이트 딜러 루미(미쿠풍)·매화, 앉은 자세, AI 딜러 연출 개편, 혼자 블랙잭·AI 연습 판
- 새 게임: 야추, 라이어 게임, 파티 판(작물 효과, 범 없는 판만)
- **허풍 주점**(`app/lounge-liarsbar.ts`): Liar's Bar식 허풍 카드 + 러시안 룰렛(장난감 뻥총, 총알 위치 해시 선공개), 주점 업그레이드 18종
- **범마을 부동산**(집 확장 구매), **나무결 가구점**(오늘의 가구/명품) — 실내 공통 레지스트리 `app/lounge-venues.ts`
- 카지노·회관·주점 음악(WebAudio 작곡본 + Suno 곡 넣는 자리 `public/assets/lounge/music/`)

**아트·에셋**
- kArchive 3D 모델 약 50종(출처 표기 필수, `public/models/lounge/ATTRIBUTION.md`), Kenney CC0 효과음
- 힉스필드 생성: 딜러 2종, NPC 초상 3종, 스티커 5종, 미쿠 포스터, 새 옷 3벌(금빛 브레이드, 케이프 코트, 메이드)
- 모자 제거(도원 응원 머리띠만 유지), "처음 만난 우리" 옷은 호현만 유지
- 기록: `ASSETS.md` (모든 에셋 출처·라이선스·생성 프롬프트)

**UI 전면 개편 (A·B 단계 완료)**
- 토큰(`app/ui/tokens.css`, 장소별 `[data-venue]`), 한글 폰트 Jua/Pretendard/Gaegu(OFL, 서브셋), 공통 부품(`app/ui/`: Panel, GameButton, KeyHint, Glyph, Tabs, EmptyState)
- 메뉴·가방·상점·설정 수첩 스타일, HUD 슬롯 정리, 생활 창·게임 화면 장소별 통일, 기성 아이콘 → 손그림 Glyph
- 회귀 도구: `npm run ui:shots`(화면 캡처·대비·겹침 측정), `npm run lint:css`(색/글자 크기/모서리/그림자/z-index 규칙, CI에서 차단)

## 3. 작업·배포 방법

```bash
npm ci
npm run check          # tsc + 테스트 + oxlint
npm run lint:css       # 스타일 규칙
npm run build:pages    # 로컬 빌드(scripts/build-standalone.mjs)
npm run ui:shots       # UI 회귀 캡처(로컬 목 서버, 실제 Supabase 접속 안 함)
```

- **배포**: `main`에 push하면 자동. Pages는 매번, Edge Function은 `supabase/functions/**` 또는 `app/*.ts`가 바뀌면 배포됩니다. 빌드 결과(`docs/`)는 커밋하지 않습니다(.gitignore).
- **서버 코드를 바꾸면** 클라이언트보다 서버가 먼저/같이 배포되어야 합니다(자동 배포가 동시에 처리).
- **에셋**: kArchive 모델은 `scripts/optimize-assets.mjs` 파이프라인(원본 `_originals/`, `assets.json`에 약관·SHA-256 기록) 그대로 사용.

## 4. 보안 원칙 (반드시 지킬 것)

- 활성화 코드, Supabase 토큰, service_role 키를 저장소·채팅·AI 대화에 절대 넣지 않습니다. 배포 토큰은 GitHub Secret `SUPABASE_ACCESS_TOKEN`에만 있습니다.
- 예전에 채팅에 노출된 Supabase 토큰은 폐기해야 합니다(사용자 확인 필요).
- 아직 가입하지 않은 계정 5개(강재, 민서, 민재, 재민, 호현)의 활성화 코드는 한때 유출된 적이 있어 **재발급이 보류 중**입니다. 재발급은 `supabase/admin/rotate-activation-code.mjs`로 하고 코드는 친구에게 1:1로만 전달합니다.

## 5. 남은 작업 (우선순위 순)

1. **UI 마무리 점검**: A·B단계 이후 성장 수첩의 ‘고르기’ 대비를 높이고, 혼합 색상·스크롤 밖 조작의 오탐을 수정했습니다. 최신 검증과 수치는 [2026-09-28 점검 기록](handover/design/ui-finish-2026-09-28.md)과 `scripts/ui-baseline.json`을 보세요. CI의 `ui-regression` 잡은 기준보다 나빠지거나 화면·측정이 누락되면 실패합니다. 개선한 수치는 `--strict --baseline scripts/ui-baseline.json --write-baseline <새 파일>`로 검증한 뒤 갱신하세요. lucide 의존성·사용은 없으며 `app/ui/icons.tsx`도 자체 Glyph를 사용합니다.
2. **맵 확장 3단계**: 과수원 언덕(V4), 목장(V5: 닭장·외양간·동물 5종), 가공 기계(옹기·숙성통·베틀), 스프링클러·기상대(V8), 도구 5단계 — 설계: `handover/design/design-expansion-techtree.md`
3. **맵 확장 4단계**: 온천(V6), 여섯섬 배편(V7, `dock` 보상 채우기), 깊은 굴(V9, 금 요구량 낮출 것)
4. **2단계 보완**: 광산 동굴·레일을 kArchive 모델로 교체, 뒷산/광산의 "간단 그래픽" 대체 화면
5. **보드게임 추가**: 오목·뒤집기 → 윷놀이 → 원카드 → 허풍 주사위 → 장기(MIT 엔진) → 마피아 — `handover/design/boardgames-open-assets.md`
6. **무드 3단계**: 친구 7명 표정 그림, 기분별 NPC 대사, 머리 위 말풍선 — `handover/design/design-mood.md`
7. **주점 보완**: NPC 걷기 일정, 주점 전용 스티커, 방아쇠 순간 음악 줄이기, 허풍 주사위 테이블
8. **운영**: 외부 백업·복원 연습, 오류/스냅샷 실패 알림, Edge 호출량 모니터링(무료 한도 월 50만)
9. **데스크톱**: 서명·자동 업데이트 키, 실제 Windows/Mac에서 딥링크·알림 테스트

## 6. 사용자가 정해야 할 것

- 친구 7명의 실제 생일과 좋아하는/싫어하는 선물 (`app/lounge-calendar.ts`의 `FRIEND_PROFILES`, 지금은 임시값)
- 친구별 NPC 대사 (`app/lounge-friend-lines.ts`, 지금은 무난한 임시 성격)
- 경제: 하루 판매 3만 범 이후 감소·10만 상한 유지(추천: 유지), 카지노 VIP룸 비용 150만 → 100만 인하(추천)
- 활성화 코드 재발급 시점
- Suno 카지노/회관/주점 곡 (파일만 `public/assets/lounge/music/`에 넣으면 됨, 규격은 ASSETS.md)

## 7. 알려진 이슈

- 3D 화면을 소프트웨어 렌더러로 오래 돌리면 테스트 하니스가 느려져 "연결 끊김"이 보일 수 있음(게임 버그 아님).
- 친구 방 가구 모서리에는 아직 걸리는 곳이 일부 남음(마을은 걸림 0).
- 캐릭터 그림은 정면 한 방향뿐이라 테이블 끝자리도 카메라를 봄.
- 한글 조사 자동 처리는 키 이름 등 일부에만 적용.

## 8. 주요 파일 지도

| 영역 | 파일 |
|---|---|
| 서버 진입 | `supabase/functions/hohyeon-api/index.ts`, `hohyeon-auth/index.ts` |
| 월드 엔진 | `app/lounge-cloud-engine.ts`, `app/lounge-room.ts`, `app/lounge-economy.ts` |
| 생활 | `app/lounge-life.ts`, `lounge-life-plus.ts`, `lounge-life-social.ts`, `lounge-calendar.ts`, `lounge-items.ts` |
| 은행·강도·주민 관계 | `app/lounge-finance.ts`, `lounge-furniture-protection.ts`, `lounge-romance.ts`, `lounge/FinancePanel.tsx`, `lounge/NpcRelationsPanel.tsx` |
| 성장·지역 | `app/lounge-growth*.ts`, `lounge-areas.ts`, `lounge-mine.ts`, `lounge-walk-world.ts` |
| 무드 | `app/lounge-mood*.ts` |
| 게임 | `app/lounge-blackjack.ts`, `lounge-poker.ts`, `lounge-seotda*`, `lounge-gostop*`, `lounge-chess*`, `lounge-yacht.ts`, `lounge-liar.ts`, `lounge-liarsbar.ts` |
| 마을 3D | `app/lounge-village*.ts(x)` |
| 실내 3D | `app/lounge-venues.ts`, `lounge-interior-*.ts(x)`, `lounge-tavern-*.ts` |
| 화면 | `app/lounge-game.tsx`(최상위), `app/lounge/*.tsx`, `app/ui/*` |
| 문서 | `handover/STYLE-AND-SOURCES.md`(미감 규칙·자료 출처), `README.md`, `ACCOUNTS.md`(계정·배포), `ASSETS.md`(에셋 제작 기록), `GAME_PROGRESS.md`, `handover/design/*` |

## 9. ChatGPT에 처음 보낼 메시지 (예시)

> 이 저장소는 친구 7명이 함께 하는 3D 마을 생활 게임 "범타듀 밸리"야. 루트의 `HANDOVER.md`를 먼저 읽고, 화면·에셋을 건드릴 때는 `handover/STYLE-AND-SOURCES.md`의 미감 규칙과 에셋 추가 순서를 따라. 세부 설계는 `handover/design/`을 참고해. 규칙은 서버 권위 구조라 `app/*.ts` 엔진을 바꾸면 테스트(`npm run check`)와 원장 불변식이 통과해야 하고, 스타일은 `app/ui/tokens.css` 토큰만 써야 해(`npm run lint:css`). 비밀 값(활성화 코드, Supabase 토큰)은 절대 코드나 대화에 넣지 마. `main`에 올리면 자동 배포돼. 다음 작업은 5장의 순서대로 진행해 줘.
