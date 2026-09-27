# 범타듀 밸리 UI 감사 + 통합 리디자인 계획

- 대상: `dd95b1d` + 그 시점의 작업 트리 스냅샷 (2026-09-26 21:24 UTC, `uiaudit/src/`). 빌드: `node scripts/build-standalone.mjs --out uiaudit/pages` (정상 빌드, 경고는 이미지 용량뿐)
- 캡처: 목(mock) Supabase 하니스(`uiaudit/h.mjs`, p1 하니스를 스냅샷 엔진으로 바꾼 것). 실제 Supabase에는 한 번도 연결하지 않았어요.
- 스크린샷: `uiaudit/shots/` (1920×1080 전체, 1440×900·1280×720은 HUD 위주). 목업: `uiaudit/mock/`
- 기준: UI/UX Pro Max 스킬(접근성 우선순위, 아이콘·토큰 규칙, pro-rules 체크리스트). 스킬이 자동으로 추천한 디자인 시스템(글래스모피즘, 하늘색 #0EA5E9, Inter)은 코지 농장 게임과 맞지 않아 쓰지 않았어요. 채택한 규칙은 "이모지 아이콘 금지, 한 아이콘 가족, 대비 4.5:1, 44px 터치 영역, 의미 토큰, 초점 링"이에요.

> 캡처 시 주의할 점
> 1. 컨테이너에 한글 폰트가 없어서 WenQuanYi로 그려졌어요. 실제 Windows에서는 맑은 고딕이라 글자 폭이 조금 달라요. 그래서 "폰트를 번들하지 않는다"는 것 자체가 이슈 목록에 올라가 있어요.
> 2. 우측 상단의 "연결 끊김 · 다시 연결 중"은 하니스가 Realtime 웹소켓을 막아서 생긴 것이라 이슈에서 뺐어요.
> 3. 같은 컨테이너에서 다른 에이전트들이 브라우저를 여러 개 돌려서(load 30 이상) 회관 걷기가 시간 안에 끝나지 않았어요. 섯다·고스톱 게임 화면은 오늘 오전 빌드의 캡처(`shots/games-earlier/`, b2p 최종)를 참고용으로 썼어요.

---

## 0. 요약

**한 줄 진단:** 텃밭 장부(FarmLedger)와 성장 수첩(GrowthPanel)만 "게임"이고, 나머지 30여 개 창은 "잘 만든 웹 앱"이에요. 같은 게임 안에서 두 가지 시각 언어가 섞여 있고, 늦게 들어온 CSS 층(`lounge-club.css`)이 따뜻한 팔레트 위에 차가운 회청색 SaaS 톤을 덮고 있어요.

| 지표 (스냅샷 CSS 37개 파일, 21,571줄) | 값 |
|---|---|
| 서로 다른 hex 색 | **1,967** (rgb()·color-mix 제외) |
| font-size 값 | **63** (12px 미만 323회, 그중 11px 308회) |
| font-weight 값 | **11** (650, 750, 900 포함) |
| border-radius 값 | **60** |
| box-shadow 값 | **261** |
| z-index 값 | **30** (raw 숫자와 `var(--z-*)` 혼용) |
| `kbd` 스타일 규칙 | **28** (11개 파일) |
| lucide 아이콘 | **136종 / 52개 파일**, 손그림 글리프는 3개 모듈(field-glyphs, growth-glyphs, ItemIcon) |
| 번들된 한글 폰트 | **0** (맑은 고딕 시스템 폰트에 의존) |
| 창 껍데기(스킨) | `.l-modal` 하나를 **12가지 이상 클래스로 재스킨** + 게임 화면 3종 + 가게 카운터 3종 |

**가장 먼저 고칠 5가지**
1. [P0] 친구들 창: 쉬는 중인 친구 행이 한 글자씩 세로로 줄바꿈돼요.
2. [P0] 마을 안내(M) 목록이 "마을 적응하기" 체크리스트 밑에 깔려요.
3. [P0] 대비 미달이 체계적으로 나타나요. 보조문구 11px + 연회녹색(2.6~2.9:1), 성장 수첩 레벨 숫자는 2.5:1, 게임 액션 비활성 버튼은 거의 보이지 않아요.
4. [P1] 창 껍데기가 제각각이에요. 흰 카드, 나무 수첩, 가게 카운터, 남색 액션 바, 크림 게임판이 섞여 있어요. 5종 `<Panel variant>`로 정리할 수 있어요.
5. [P1] 아이콘(lucide와 손그림)·키 힌트(키캡, 평문, 괄호)·타이포(63단계, 폰트 번들 없음)를 각각 하나로 통일해야 해요.

**추천 계획:** 토큰 파일 하나(`app/ui/tokens.css`)와 프리미티브 5개(`<Panel>`, `<GameButton>`, `<KeyHint>`/`<KeyHintBar>`, `<Glyph>`, `<Tabs>`)를 먼저 만들어요. 그다음 사람들이 가장 자주 여는 창(☰ 메뉴, Esc 메뉴, 가방, HUD)부터 옮기고, 게임 화면은 마지막에 장소 토큰으로 정리해요. 8단계, 단계마다 스크린샷 회귀 검사를 돌려요. (4장)

---

## 1. 우선순위 이슈 목록

표기: **P0** 깨짐·읽기 불가 · **P1** 일관성·게임다움 · **P2** 다듬기. 스크린샷 경로는 `uiaudit/` 기준이에요.

### P0 — 깨짐 / 읽기 어려움

**P0-1. 친구들 창: 쉬는 중인 친구 행이 세로로 한 글자씩 줄바꿈돼요**
- `shots/main-fhd/m-fhd-22-friends.png`: "강/재", "편/지/쓰/기", "방에/놀러/가기"가 쪼개져 보여요. 620px 창에 2열 그리드를 두고, 각 행이 아바타·이름·상태·버튼 2개를 한 줄에 넣으려다 생긴 문제예요.
- 파일: `app/lounge/FriendsModal.tsx:90–170`, `app/lounge-social.css:89–110` (`.l-online-list.is-resting`)
- 수정: 쉬는 중 목록은 1열로 두고, 이름·버튼에 `white-space: nowrap`을 줘요. 버튼은 `<GameButton size="s">`로 바꿔요. 창 너비는 `wide`(1020)로 올리거나 행을 "아바타 + (이름/상태) + 버튼 묶음" 2줄 레이아웃으로 바꿔요.

**P0-2. 마을 안내(M) 목록이 "마을 적응하기" 체크리스트에 가려져요**
- `shots/main-fhd/m-fhd-29-map.png`: 목록 헤더("어디로 가볼까요?")와 첫 항목들이 체크리스트 밑에 숨어요.
- 원인: 두 요소가 같은 자리(left 16–22px, top 140–150px)에 있어요. `.hv-directory`는 `z-index: 12`(`app/lounge-village-shell.css:273`)이고, `.l-adapt`는 `position: fixed; z-index: var(--z-hud, 30)`(`app/lounge/friend-life.css:627`)이에요.
- 수정: 단기로는 목록이 열려 있는 동안 `.l-adapt`를 접어요(`data-directory-open`). 장기로는 6장의 HUD 슬롯 시스템(좌상단 한 기둥에 쌓기)으로 겹침 자체를 없애요. 1280×720에서는 같은 체크리스트가 미니맵 위쪽 절반도 덮어요(`hud-s/m-s-03-village-hud.png`).

**P0-3. 대비 미달이 구조적으로 반복돼요 (측정: `shots/main-fhd/metrics-fhd.json`)**

| 화면 | 가장 낮은 대비 | 원인 |
|---|---|---|
| 범타듀 상점 `m-fhd-31-shop.png` | 2.88:1 (11px, 14곳) | 씨앗 설명 11px 연회녹색 |
| 만든 이야기 `m-fhd-20-credits.png` | 2.74:1 (12px, 본문 전체) | 크레딧 본문 |
| 성장 수첩 `m-fhd-38-growth.png` | 2.48:1 (11px `.l-perk-lv`) | 잠긴 특전 레벨 숫자 |
| 마을 개척 `m-fhd-40-growth-research.png` | 2.22:1 (12px `.l-research-seal`) | 친구 도장 이니셜 18곳 |
| 로그인 `m-fhd-01-login.png` | 3.08:1 (11px, 17곳) | 영문 아이디, 하단 안내 |
| 마을 HUD `v2-fhd/m-fhd-02-village-hud.png` | 1.75:1 | 비활성 "게임 초대"(하니스의 연결 끊김 때문에 비활성이지만, 실제 오프라인에서도 똑같이 보여요) |
| 도움말 문구 전반 | 2.64:1 | `.l-help-text { 11px; #98a18e }` (`app/lounge.css:1132`) |
| 블랙잭·홀덤 액션 바 `games/…-04-blackjack-start.png`, `…-13-poker-mid.png` | 측정 불가(그라데이션), 눈으로 봐도 거의 안 보여요 | 남색 바 위의 비활성 버튼 opacity .46 |

- 공통 원인: ① 11px 보조문구 + `#839075` / `#98a18e` 계열의 "올리브 회색" ② `button:disabled { opacity: .46 }`(`app/globals.css:7`)가 어두운 배경에서 대비를 무너뜨려요.
- 수정: 보조문구 최소 13px, `--text-soft: #6e5843`(크림 종이 위 5.8:1)을 써요. 비활성은 opacity가 아니라 전용 토큰(배경 `rgb(120 110 90 / .25)` + 글자 `--text-soft`)으로 그려요.

**P0-4. 창 닫기(×) 버튼이 34×34 또는 34×44예요**
- 측정한 모든 모달에서 같아요(`metrics-fhd.json` → `shell.close`). 키보드 우선 게임이라 치명적이진 않지만, 44×44가 기본이에요. 게임 화면의 "일어나기"도 텍스트 링크 크기예요.
- 파일: `app/lounge/Modal.tsx`, `.l-modal > header` 스타일(`app/lounge.css:1157`)

**P0-5. 방 꾸미기: 오른쪽 360px 패널이 비어 있어요**
- `shots/main-fhd/m-fhd-07-room-editor.png`: "놓기"를 누르기 전에는 오른쪽 사이드 전체가 흰 공백이에요. 상단 버튼 4개와 "다 됐어요"만 떠 있어요. 편집 중 Esc로 빠져나갈 수 없는 것도 확인했어요(자동화도 "다 됐어요" 클릭으로만 나갈 수 있었어요).
- 파일: `app/lounge-bedroom-editor.tsx`, `app/lounge-bedroom-edit-dock.css`
- 수정: 빈 상태에 가구 서랍(최근 가구 6칸)과 키 안내(`R 회전 · Delete 치우기 · Ctrl+Z`)를 넣어요. Esc = "다 됐어요"로 해요.

### P1 — 일관성 / "웹 앱 같은 느낌"

**P1-1. 창 껍데기가 8종 이상이에요. 같은 내용도 창마다 다르게 보여요**

| 계열 | 예시 | 외형 |
|---|---|---|
| 기본 `.l-modal` (+ `lounge-club.css`가 `#fafaf7` / 테두리 `#d0d6df` 회청색으로 덮어씀) | 지갑, 계정, 친구들, 게임 초대, 설정, 조작 안내, 크레딧 | 흰 SaaS 카드, 제목 23px/750, 반경 12 |
| `.l-life-modal` | 가방, 상점, 도감, 사이, 게시판, 요리, 우편, 소식 | 위와 같은 흰 카드 + pill 탭(999px) |
| 나무 수첩 `.l-ledger` / `.l-growth` / `.l-forge` | 텃밭 장부, 성장 수첩, 대장간 | 호두나무 테두리, 크림 종이, 테이프 제목 19px, 반경 14 |
| 가게 카운터 `.sc-counter` × 3 | 주점, 부동산, 가구점 | 자체 팔레트 `--sc-*` |
| 게임 화면 (카지노) | 블랙잭, 홀덤, 체스 | 어두운 초록 + **남색 액션 바** + 자간 벌린 제목 |
| 게임 화면 (회관) | 섯다, 고스톱, 야추 | 크림 페이지 + 갈색 판 + **주황 테두리 1330×1000** |
| 테이블 시트 / 회관·카지노 목록 | `games/g-fhd-yacht_liar-04-yacht-result.png` | 흰 팝오버 카드 |
| 토스트 | `m-fhd-09-daily-bum.png` 우상단 | **남색 `#263954`**(`lounge-club.css:188`)가 원래 초록 `#355740`(`lounge.css:1551`)을 덮어요 |

- 가장 뚜렷한 증거는 **같은 "마을 개척" 보드가 두 가지 옷을 입고 있다**는 거예요. 성장 수첩(T) 안에서는 나무 수첩(`m-fhd-40-growth-research.png`)이고, 마을 게시판(B) 탭에서는 흰 SaaS 카드(`v2-fhd/m-fhd-10-board-3.png`)예요.
- 파일: `app/lounge/Modal.tsx`(껍데기는 하나), 스킨은 `lounge.css:1138`, `lounge-club.css:183–190`, `lounge/growth.css:16–55`, `lounge/farm-fish.css`, `lounge/shop-counter.css`, `lounge-table-venue.css`

**P1-2. 한 게임 안에 두 가지 시각 언어가 있어요 (손그림 수첩과 SaaS 대시보드)**
- 설정(`crop-settings.png`): iOS식 토글, 세그먼트 컨트롤, 좌측 탭 사이드바가 그대로 웹 설정 페이지예요.
- 상점(`m-fhd-31-shop.png`): 3열 카드 그리드, `− 1 +` 스테퍼, "1개 사기" 초록 버튼이 쇼핑몰 같아요. 코지 게임이라면 "가판대 선반 + 가격표"여야 해요.
- ☰ 메뉴(`m-fhd-05-hamburger.png`): 20개 항목이 똑같은 흰 버튼으로 나열돼요. 위계가 없고, 이름 옆 kbd만 있어요.
- 로그인(`m-fhd-01-login.png`): 랜딩 페이지 구성(좌 히어로 + 우 폼, 11px 라벨)이라 첫인상부터 "웹 서비스"예요.
- 대조군: 텃밭 장부(`m-fhd-32-farm-ledger.png`)와 성장 수첩(`m-fhd-38-growth.png`)은 나무 제본, 테이프 제목, 줄 친 종이, 눌리는 버튼, 스탬프까지 게임 같아요. **이 둘을 기준으로 삼아요.**

**P1-3. 아이콘이 섞여 있어요 (lucide 136종 vs 손그림 글리프)**
- 마을 HUD 한 화면에 lucide 49개와 손그림 5개가 함께 있어요(`metrics` → `village-hud.icons`). 같은 창 안에서도 섞여요. 성장 수첩 탭은 lucide `Sparkles`, 본문은 손그림 괭이예요. 게시판 꾸러미 8개는 모두 같은 망치 아이콘이라 정보가 없어요(`v2-fhd/m-fhd-07-board.png`).
- 편지 스티커는 이모지(`😆 👋 💌`)를 그대로 그려요: `app/lounge/LifePanels.tsx:99–106, 828, 918`. 데이터의 `emoji` 필드(`app/lounge-items.ts`)는 화면에 쓰이진 않지만 남아 있어요.
- 규칙 제안: UI 글리프는 `field-glyphs.tsx` 한 가족(24 박스, 잉크 `#4a3423` 1.6px, 단색 채움)으로, 아이템은 `ItemIcon`(48 박스 채색)으로 해요. lucide는 단계적으로 없애요. 첫 단계는 자주 쓰는 30개(Check 16, RotateCcw 12, X 11, Sparkles 9, Mail 8 …)예요.

**P1-4. 타이포그래피에 체계가 없어요**
- 폰트를 번들하지 않아서 OS 폰트에 운명을 맡기고 있어요(Windows 맑은 고딕, 그 밖은 대체 폰트). 그런데도 `Georgia, serif`(블랙잭 "21" 이탤릭)와 `Arial`이 섞여요.
- 63단계 크기 중 12px 미만 리터럴이 323곳(11px 308, 11.5px 7, 10px대 7, 8px 1)이에요. 굵기는 11가지(650, 750, 900 …)예요.
- 자간을 벌린 한글 제목("별 빛 카 지 노", "블 랙 잭")은 한글에서 어색하고 읽기 어려워요(`games/…-04-blackjack-start.png`).
- 제안: 3가지 목소리, 6단계(3.3절).

**P1-5. 키 힌트 표기가 5가지예요**
① 키캡 `<kbd>`(규칙 28개, 모양 제각각) ② 평문 "E 앉기 · Esc 닫기"(테이블 시트) ③ 괄호 "꾸미기 (E)", "거두기 (3) (E)"(접근성 이름) ④ 우상단 문장형 pill "클릭해서 이동 · 방향키 / WASD · Shift 달리기 · E 앉기 · Esc 메뉴" ⑤ 버튼 안 키캡(장부, 액션 버튼)
- 장부와 수첩의 "창 아래 키 안내 줄"(`←↑↓→ 칸 고르기 · E 가꾸기 · Esc 덮기`)이 가장 좋은 패턴이에요. 모든 창으로 넓혀요(`<KeyHintBar>`).

**P1-6. 마을 HUD가 붐비고, 같은 기능이 여러 번 나와요** (`v2-fhd/m-fhd-02-village-hud.png`)
- 1920 기준으로 화면 안에 조작 가능한 요소가 약 45개예요(`probe-fhd.log`).
- 중복: **가방** 2곳(우상단 아이콘, 좌하단 "가방"), **지도·안내** 4곳(좌상단 "마을 안내", 미니맵, "지도 ×" 칩, 우측 지도 버튼), **현재 장소** 2곳(하단 중앙 장소 카드 "승준의 텃밭 · 수확할 작물 3개 · E"와 우하단 "거두기 (3) E").
- 좌하단 "마을 게시판" 라벨이 화면 밖으로 잘려요. 미니맵 아래 "지도 ×" 칩과 "수다/가방/스티커"가 붙어 있어요.
- 우상단 9개 요소가 한 흰 바에 있어요. 게임 초대(주 버튼)와 지갑, 오늘의 범(보상), 아이콘 3개가 같은 무게예요.
- 수정 방향은 5장 HUD 목업(`mock/after-hud.png`)을 참고해요. 장소 카드와 행동 버튼을 **한 간판**으로 합쳐요. 좌상단은 "날짜 간판 → 적응하기 메모" 한 기둥으로, 가방·우편은 핫바 옆으로 옮겨요.

**P1-7. 게임 화면이 장소마다 다른 앱처럼 보여요**
- 카지노(`games/s2-fhd-…-04-blackjack-start.png`, `…-13-poker-mid.png`, `…-21-chess-mid.png`): 초록 펠트 위에 **남색 액션 바**(`#0e1a2b`, 캡처에서 측정)가 있어요. 오른쪽 사이드는 지갑 카드 하나뿐이라 1920에서 400px 이상 비어요. 체스 오른쪽 패널도 절반이 비어요.
- 회관 섯다(`games-earlier/s2-fhd-…-04-seotda-start.png`): 크림 페이지 안의 갈색 판, 판 전체를 두르는 1330×1000 **주황 차례 테두리**, 판 아래 300px 공백이 있어요.
- 테이블 시트(`games/g-fhd-yacht_liar-04-yacht-result.png`): 흰 SaaS 팝오버, 숫자 키캡이 칸 모서리에 반쯤 걸쳐 있어요. "1–4 판돈 · P 파티 판 · Shift+2–4 인원 · Esc 닫기"는 평문이에요.
- 파일: `app/lounge/GameScreen.tsx`, `app/lounge-table-venue.css`(주석에 "navy bar on the green casino … white web strip in the hall"을 고친 흔적이 남아 있어요), `app/lounge-blackjack.css:34`, `app/lounge-casino.css:143`, `app/lounge-game-fit.css:76`

**P1-8. 빈 상태가 "빈 칸"으로만 나와요**
- 도감(`m-fhd-34-collection.png`): 회색 물고기 실루엣 46개와 "???" 46개, 오른쪽에 거의 빈 안내 패널이 있어요. 첫 발견 전까지 동기를 주지 못해요(힌트가 없어요: 어디서, 언제, 계절).
- 추억 앨범(`m-fhd-25-album.png`): 1020×198짜리 거의 빈 창이에요.
- 방 꾸미기 오른쪽 패널(P0-5), 게시판 "아직 아무도 보태지 않았어요"도 같은 문제예요.
- 수정: `<EmptyState glyph hint action>` 하나로 모아요. 도감은 "다음으로 찾기 쉬운 3종" 힌트 카드, 앨범은 "하트 2개가 되면 첫 장이 생겨요" 진행 막대로 채워요.

**P1-9. CSS 구조가 "덮어쓰기 층"으로 쌓여 있어요**
- `lounge.css`(3,461줄) → `lounge-club.css`(`.l-app .l-modal`, `.l-app .l-toast` 재정의) → `lounge-village-shell.css`(`.l-immersive …`) → `lounge-table-venue.css`(`.l-app .l-game-screen[data-venue] …`) 순서로 덮어요. CSS는 컴포넌트가 import하므로 **lazy 청크의 로드 순서에 따라 이기는 규칙이 바뀔 수 있어요**(`farm-fish.css`는 FarmLedger, Fishing, Growth, Forge, village 5곳에서 import해요).
- `globals.css`에는 옛 섬 게임 CSS(`.island-app`, `.online-hud`, `.invite-card` …, 한 줄에 수 KB)가 남아 있어요. 사용 여부를 확인한 뒤 제거 후보로 봐요.
- z-index는 30가지 값(1~1501)이 raw 숫자와 `var(--z-hud)`/`--z-overlay`/`--z-toast`/`--z-coach`로 섞여 있어요.

### P2 — 다듬기

- **P2-1 모션:** 애니메이션 91개, `prefers-reduced-motion` 블록 39개로 대체로 괜찮아요. 전환 시간(150/180/200/250/300ms, .15s/0.15s 표기 혼용)을 토큰 3개로 줄여요: `--dur-quick: 120ms`(누름), `--dur-ui: 200ms`(창·탭), `--dur-scene: 450ms`(장면·배너).
- **P2-2 초점:** 전역 `button:focus-visible { outline 3px #d5943e }`는 좋아요. 다만 `outline: none`이 18곳에 있고(장부, 수첩, 가게 카운터, 라이어 테이블 …), 그중 일부는 대체 스타일에 의존해요. `:focus-visible` 대체 스타일이 있는지 점검해요. 나무 배경 위 `#d5943e` 링은 대비가 약하니(나무 `#7a5334` 대비 약 2:1) 장소 토큰 `--focus`로 바꿔요.
- **P2-3 카피:** 해요체는 거의 모든 곳에서 잘 지켜요. 다만 방 하단에 늘 떠 있는 "가구 모델 kArchive(출처: 쓰레드 dogfooter)·3DAssets.dev CC0 …" 크레딧 줄(`m-fhd-04-room.png` 하단)은 게임 화면에서 크레딧 창으로 옮겨요. "연결 끊김 / 다시 연결 중 (2)"는 두 줄로 줄바꿈돼 버튼 높이를 깨요.
- **P2-4 토스트:** 위치(상단 중앙, 하단 중앙), 색(남색, 초록, 크림 배너)이 제각각이에요. `note` 껍데기의 "종이 쪽지"로 통일하고, 위치는 상단 중앙 한 곳으로 해요.
- **P2-5 1280×720:** 6장 참고(적응하기와 미니맵 겹침, 성장 수첩 잘림).

---

## 2. 화면별 메모 (1920×1080)

| 화면 | 스크린샷 | 판정 | 메모 |
|---|---|---|---|
| 로그인 | `main-fhd/m-fhd-01-login.png`, `-02-login-password.png` | 웹 | 랜딩 페이지 구성, 11px 라벨(3.1:1). 방 미리보기가 좋아요. 이걸 전면 배경으로 하고 폼은 "우편함 쪽지" 카드로 |
| 처음 안내 | `onboard/ob-fhd-02-tutorial-move.png` | 보통 | 6-1장 참고 |
| 내 방 HUD | `main-fhd/m-fhd-04-room.png` | 웹 | 하단에 "이 방 수다 / 한 판, 한마디 / 스티커 / 내 방명록"이 모양 다른 4덩어리. 크레딧 줄 상시 노출 |
| ☰ 마을 메뉴 | `main-fhd/m-fhd-05-hamburger.png` | 웹 | 흰 버튼 20개. `mock/after-menu.png`로 교체 제안 |
| Esc 메뉴 | `main-fhd/m-fhd-06-esc-menu-room.png`, `-28-esc-menu-village.png` | 웹(좋은 구조) | 키캡 표기가 좋아요. 껍데기만 journal로 |
| 방 꾸미기 | `main-fhd/m-fhd-07-room-editor.png` | 깨짐 | P0-5 |
| 지갑 / 오늘의 범 | `main-fhd/m-fhd-08-wallet.png`, `-09-daily-bum.png` | 웹 | 100,000범을 31px로. 남색 토스트 |
| 소식(digest) | `main-fhd/m-fhd-03-room-first-dialog.png` | 보통 | "내일 예고" 파란 상자(`#f1f7fb`)가 팔레트 밖이에요. note 껍데기가 딱 맞아요 |
| 계정 | `main-fhd/m-fhd-11-account.png` | 웹 | 시스템 화면이라 웹 느낌이 허용되는 곳. 그래도 껍데기는 통일 |
| 우편함 | `main-fhd/m-fhd-12-mail.png`, `-13-mail-write.png` | 웹 | 편지는 가장 "손글씨"여야 할 곳. Gaegu와 note 껍데기로. 이모지 스티커 |
| 설정 | `main-fhd/m-fhd-14…18-settings*.png` | 웹 | iOS 토글과 세그먼트. 조작 탭의 키캡 표는 좋아요 |
| 조작 안내(F1) | `main-fhd/m-fhd-19-controls-help.png` | 보통 | 키캡이 설정과 다른 모양 |
| 크레딧 | `main-fhd/m-fhd-20-credits.png` | 대비 미달 | 본문 전체 2.74:1 |
| 되돌릴 수 없는 일 | `main-fhd/m-fhd-21-danger.png` | 확인 못 함 | 메뉴의 버튼이 details였는지 클릭이 먹지 않았어요(로그 "(no button)") |
| 친구들 | `main-fhd/m-fhd-22-friends.png` | 깨짐 | P0-1 |
| 게임 초대 | `main-fhd/m-fhd-23-game-invite.png` | 웹 | 게임 8종 목록이 전부 같은 흰 행. 게임별 글리프와 장소 색 칩이 필요해요 |
| 오늘의 한마디 | `main-fhd/m-fhd-24-status-line.png` | 웹 | |
| 추억 앨범 | `main-fhd/m-fhd-25-album.png` | 빈 상태 | P1-8 |
| 마을 HUD | `hud-fhd/m-fhd-03-village-hud.png` | 붐빔 | P1-6, `mock/after-hud.png` |
| 마을 안내(M) | `main-fhd/m-fhd-29-map.png` | 깨짐 | P0-2 |
| 가방 | `v2-fhd/m-fhd-06-bag.png` | 웹+게임 | 아이템 칸과 핫바는 게임다운데 껍데기와 필터 pill은 웹 |
| 상점 | `main-fhd/m-fhd-31-shop.png` | 웹 | 쇼핑몰 카드 그리드, 2.88:1 |
| 텃밭 장부 | `main-fhd/m-fhd-32-farm-ledger.png` | **기준** | 버튼 `.l-leaf`(#5f8a55 위 흰 글자 3.86:1)만 `#4f7a45`로 |
| 요리·만들기 | `main-fhd/m-fhd-41-board.png` (창 이름은 board지만 요리 탭) | 웹 | 효과 줄이 보라색(`#f1eafb`)이라 팔레트 밖 |
| 도감 / 박물관 | `main-fhd/m-fhd-34-collection.png`, `-35-museum.png` | 빈 상태 | P1-8, 박물관 11px 3.0:1 |
| 친구 사이(L) | `v2-fhd/m-fhd-04-bonds-friend.png`, `-05-tasks.png` | 웹 | 하트 줄과 보상 표는 좋아요. 분홍 상자, 파란 버튼 등 색이 섞여요 |
| 성장 수첩(T) | `main-fhd/m-fhd-38…40-growth*.png` | **기준** | 탭 아이콘만 lucide. 레벨 숫자 2.5:1 |
| 마을 게시판(B) | `v2-fhd/m-fhd-07…10-board*.png` | 웹 | 같은 개척 보드가 흰 옷을 입어요(P1-1) |
| 대장간 | `v2-fhd/m-fhd-11-forge-village.png`, `-12-forge-dialog.png` | 확인 못 함 | E 입력이 들어가지 않아 창을 못 열었어요(코드상 `.l-forge`는 수첩 스타일). 장소 카드 "무너진 공방"과 행동 버튼 "무너진 공방 보기 E"가 같은 정보를 두 번 보여 줘요 |
| 주점·부동산·가구점 카운터 | (캡처 시간 초과) | 코드 검토 | `shop-counter.css`의 독자 토큰 `--sc-*`. journal + `data-venue=tavern`으로 흡수 제안 |
| 친구 방 방문 | (캡처 시간 초과) | — | |
| 낚시 | `v2-fhd/m-fhd-14-fishing-wait.png`, `-15-fishing-bite.png` | **게임다움** | 나무 태클 보드는 장부와 같은 손이에요. 다만 "E · Space · 클릭"은 평문이고(키캡 아님), 내 이름표 "승준 나"가 월드 라벨 "연못 낚시터"와 겹쳐요. 보드 아래쪽이 핫바에 붙어 있어요 |
| 카지노 게임 | `games/s2-fhd-…` | 웹+펠트 | P1-7 |
| 회관 게임 | `games/g-fhd-…`, `games-earlier/…` | 크림+주황 | P1-7 |

---

## 3. 통합 디자인 시스템 제안

목업: `mock/after-system.png`(토큰 시트), `mock/tokens.css`(그대로 옮겨 쓸 수 있는 CSS 변수).

### 3.1 원칙
1. **"수첩이 기본"**: 텃밭 장부와 성장 수첩의 언어(호두나무 제본, 크림 종이, 갈색 잉크, 눌리는 버튼, 스탬프)를 모든 정보 창의 기본으로 해요.
2. **장소는 색만 바꿔요**: 회관, 카지노, 주점은 **같은 토큰 이름**에 다른 값을 넣어요(`[data-venue]`). 컴포넌트 CSS에는 hex를 쓰지 않아요.
3. **한 손**: 아이콘, 키캡, 테두리 두께, 그림자 방향이 모두 같은 "손그림"에서 나와요.
4. **게임 화면은 HUD가 아니라 무대예요**: 흰 SaaS 사이드 카드, 남색 바, 전면 주황 테두리를 쓰지 않아요.

### 3.2 색 토큰 (의미 이름 → 장소별 값)

| 의미 토큰 | 마을(기본) | 회관 | 카지노 | 주점 |
|---|---|---|---|---|
| `--surface` (종이/판) | `#f8efd9` | `#f6ecd8` 한지 | `#16443a` 펠트 | `#efdcb6` 양피지 |
| `--surface-raised` | `#fffaf0` | `#fffaf0` | `#1f5a45` | `#f7ead0` |
| `--frame` / `--frame-edge` | `#7a5334` / `#4f3421` | `#5a3322` / `#3a1f14` 옻칠 | `#6b1f24` / `#3d0f13` 옥스블러드 | `#2e1f16` / `#1a110b` 참나무 |
| `--text` | `#3d2b1d` (11.7:1) | `#3a2618` (12.2:1) | `#f4ecd6` (6.8:1) | `#2e1f16` |
| `--text-soft` | `#6e5843` (5.8:1) | `#6b4a36` | `#c9bb9a` (5.5:1) | `#5d4632` |
| `--accent` / `--accent-edge` | `#4f7a45` / `#3a5c33` (흰 글자 4.8:1) | `#2f6b5a` 옥색 | `#c9a24a` 황동(검은 글자) | `#a8612a` 호박 |
| `--danger` | `#b93a33` 인주 | `#b8432f` 단청 | 〃 | 〃 |
| `--focus` | `#d5943e` | `#d5943e` | `#f3d98a` | `#ffe3a3` |

- 보조 팔레트(아이템 채색, 계절)는 `--season-*`, `--q-silver`/`--q-gold`(품질)처럼 **이름 있는 것만** 허용해요. 현재의 1,967개 hex는 CI에서 `tokens.css` 밖의 hex를 경고하는 방식으로 줄여요.
- 없애는 것: `lounge-club.css`의 회청 계열(`#fafaf7`, `#d0d6df`, `#263954`, `#f5f7fa` …)과 카지노 액션 바의 남색.

### 3.3 글자

저장소에 번들된 한글 폰트는 **없어요**. 제안 조합은 모두 OFL이고, KS X 1001 2,350자 서브셋 woff2로 번들해요(Pretendard 서브셋은 굵기당 약 250–300KB. `scripts/build-standalone.mjs`의 이미지 예산처럼 폰트 예산을 두면 좋아요).

| 목소리 | 폰트 | 쓰는 곳 |
|---|---|---|
| display | **Jua** (둥근 간판체) | 창 제목, HUD 간판, 큰 숫자(범, 레벨), 탭 |
| body | **Pretendard** (400/600/700) | 본문, 버튼, 표. 대체 폰트는 `'Malgun Gothic'` |
| hand | **Gaegu** (400/700) | 편지, 쪽지, 소식, 적응하기, 말풍선 |

| 토큰 | 크기/줄높이 | 예 |
|---|---|---|
| `--fs-display` | 30 / 1.15 (Jua) | 지갑 금액, 결과 화면 |
| `--fs-title` | 22 / 1.2 (Jua) | 창 제목(테이프 라벨) |
| `--fs-title-s` | 18 / 1.25 (Jua) | 섹션 제목 |
| `--fs-body` | 15 / 1.55 | 본문 기본(현재 13–14px 혼재) |
| `--fs-body-s` | 13 / 1.5 | 보조문구(현재 11px 자리) |
| `--fs-cap` | 12 / 1.4, 600 | 캡션, 칸 번호. **12px 미만 금지** |

- 굵기는 400/600/700만 써요. 자간을 벌린 한글 제목은 금지하고, `Georgia` 이탤릭 숫자 대신 Jua를 써요.

### 3.4 간격, 반경, 깊이
- 간격: 4의 배수 `--sp-1..6 = 4, 8, 12, 16, 24, 32`. 창 안쪽 여백 24, 카드 사이 12, 칸 사이 6–8.
- 반경: **3개만** `--r-s 6`(키캡, 칩), `--r-m 10`(버튼, 칸, 카드), `--r-l 14`(창). 999px pill 탭은 없애고 종이 탭(위만 둥근 `8 8 0 0`)으로 바꿔요.
- 깊이: 그림자 **3개** `--lift-1`(0 2 0 갈색 35%: 간판, 칩) · `--lift-2`(+ 14px 퍼짐: 쪽지, 떠 있는 카드) · `--lift-3`(0 28 80: 창). 버튼은 `--edge-press`(inset 0 -3 0)로 "눌리는 판"을 만들어요. 흐린 유리(backdrop-filter)는 HUD에서 쓰지 않아요.
- 테두리: 나무 2–3px inset(`--frame-edge`), 종이 1.5px 잉크. 1px 회색 테두리는 쓰지 않아요.
- z-index: `--z-scene 0 · --z-world-label 5 · --z-hud 30 · --z-hud-pop 35 · --z-overlay 40 · --z-coach 900 · --z-toast 1000`의 7단계로 해요. raw 숫자는 금지해요.

### 3.5 창 껍데기 5종 `<Panel variant>`

| variant | 모양 | 쓰는 곳 (옮길 대상) |
|---|---|---|
| `journal` | 나무 제본 + 크림 종이 + 테이프 제목 + 아래 `KeyHintBar` | ☰ 메뉴, Esc 메뉴, 가방, 상점, 도감, 사이, 게시판, 요리, 성장, 장부, 대장간, 설정, 조작 안내, 친구들, 게임 초대, 지갑, 계정 |
| `sign` | 나무 간판(작은 판) / `sign paper`(종이 간판) | HUD 모든 요소, 행동 버튼, 장소 이름표, 테이블 이름표 |
| `note` | 테이프 붙은 쪽지(Gaegu) | 소식, 편지, 적응하기, 토스트, 레벨업, 내일 예고 |
| `felt` | 펠트 + 옥스블러드 레일 + 황동 선 | 카지노 게임 화면, 카지노 테이블 시트 |
| `hanji` | 한지 + 옻칠 테두리 + 단청 선 | 회관 게임 화면(섯다, 고스톱, 야추, 라이어), 회관 테이블 시트 |

(주점은 `journal`에 `data-venue="tavern"` 토큰만 바꿔요. 부동산과 가구점 카운터도 `journal`로 흡수해요.)

### 3.6 아이콘 규칙: 한 가족
- **UI 글리프 = `<Glyph name>`** (`app/lounge/field-glyphs.tsx`를 `app/ui/Glyph.tsx`로 승격): 24 박스, 잉크 `#4a3423` 1.6px, 둥근 끝, 단색 채움 1–2색. `currentColor` 변형(선만)은 어두운 배경(카지노)에서만 써요.
- **아이템 = `<ItemIcon>`** (48 박스 채색): 그대로 둬요.
- **금지:** lucide 새로 쓰기(oxlint `no-restricted-imports`), 이모지를 아이콘으로 쓰기(편지 스티커는 `<Glyph name="sticker-laugh">` 등 8종을 새로 그려요).
- 1차로 그릴 30종(lucide 사용 빈도 순): check, close, undo, sparkle, letter, chat, party, coin, lock, send, crown, arrow, gift, house, landmark, eye, sprout, people, store, logout, armchair, clipboard, upload, book, bag, plus, footprints, apple, leaf, door. `mock/glyphs.js`에 같은 손으로 새로 그린 27종 초안이 있어요(기존 6종 포함 33종).

### 3.7 `<KeyHint>` / `<KeyHintBar>`
- 키캡 한 모양: 24px 높이, `--r-s`, 종이 바탕 + inset 1px 잉크 + 아래 3px 눌림. 어두운 배경에서는 `--ink-on-wood` 바탕이에요.
- 표기 규칙: 버튼 안에서는 **라벨 뒤에 키캡**(`거두기 [E]`). 설명 줄에서는 **키캡 뒤에 동사**(`[Esc] 닫기`). 괄호 "(E)"는 aria-label에만 써요.
- `KeyHintBar`: 모든 `journal` 창의 오른쪽 아래 같은 자리예요. 우상단 문장형 pill("클릭해서 이동 · 방향키 / WASD …")은 `KeyHintBar` 형식으로 바꾸고, 처음 30분 뒤에는 접어요.
- 키 이름은 `lounge-keybinds.ts`의 `keyLabel()`에서만 가져와요(리바인드 반영).

### 3.8 `<GameButton>`
- variant: `primary`(accent + 눌림) · `secondary`(종이 + 잉크 테두리) · `quiet`(점선 밑줄 텍스트) · `danger`(인주) · `icon`(44×44)
- size: `m` 44 높이(기본), `s` 36(표 안). 모든 버튼에 `kbd` 슬롯이 있어요.
- disabled: opacity를 쓰지 않고 전용 색을 써요. 이유를 `title`/툴팁으로 알려요("재료가 부족해요").
- focus: `outline 3px var(--focus)`, offset 3px.

---

## 4. 구현 계획 (단계별)

모든 단계는 **스크린샷 회귀**(이번 `uiaudit/main.mjs` 하니스를 저장소 `scripts/ui-shots.mjs`로 옮긴 것)와 **대비 측정**(`measure()`를 그대로 씀)을 통과해야 병합해요. 다른 에이전트와 파일이 겹치지 않도록 단계마다 건드리는 파일 목록을 명시했어요.

**0단계 — 안전망 (반나절)**
- `scripts/ui-shots.mjs`: 목 하니스로 20개 화면 × 1920/1440/1280 캡처와 `metrics.json` 생성. CI에서 "12px 미만 텍스트 개수", "4.5:1 미만 개수"가 늘면 실패하게 해요.
- `scripts/css-lint.mjs`: `app/ui/tokens.css` 밖의 hex, `font-size` px 리터럴, raw `z-index`를 경고해요(처음엔 경고만, 수치를 기록해 두고 줄여 가요).

**1단계 — 토큰과 폰트 (1일)**
- `app/ui/tokens.css`(= `mock/tokens.css`를 정리한 것)를 추가하고 `globals.css` 바로 뒤에 import해요. `:root`와 `[data-venue]` 두 층만 둬요.
- 폰트: `public/fonts/`에 Jua, Pretendard(400/600/700), Gaegu 서브셋 woff2를 넣고 `@font-face { font-display: swap }`. `licenses/`에 OFL 전문을 추가해요.
- `globals.css`의 옛 섬 게임 CSS가 쓰이는지 확인하고 제거해요.

**2단계 — 프리미티브 5개 (1.5일)** `app/ui/`
- `Panel.tsx`: `<Panel variant="journal|sign|note|felt|hanji" title onClose keyHints>`. 내부에서 기존 `Modal.tsx`(초점 복원, Esc, backdrop)를 그대로 써요. `Modal`은 껍데기 스타일만 잃어요.
- `GameButton.tsx`, `KeyHint.tsx`(+ `KeyHintBar`), `Glyph.tsx`(field-glyphs 승격 + 30종 추가), `Tabs.tsx`(종이 탭, 1–9 숫자키로 전환. 성장 수첩의 1–3 쪽 넘기기를 일반화).
- `EmptyState.tsx`(글리프, 힌트, 행동 하나).

**3단계 — P0 버그 (0.5일, 1단계와 병렬 가능)**
- 친구들 행 레이아웃(`FriendsModal.tsx`, `lounge-social.css`), 안내 목록과 적응하기 겹침(`lounge-village-shell.css`, `friend-life.css`), 보조문구와 비활성 대비, 닫기 44px, 방 꾸미기 빈 패널과 Esc.

**4단계 — 가장 자주 여는 창 (2일)**: ☰ 마을 메뉴 → Esc 메뉴 → 가방 → 상점 → 조작 안내 → 설정
- 대상: `SystemMenu.tsx`, `lounge-game.tsx`의 village menu 부분, `Inventory.tsx`, `LifePanels.tsx`(상점), `SettingsModal.tsx`, `pc.css`, `life-plus.css`
- `lounge-club.css`의 `.l-app .l-modal`/`.l-toast` 재정의를 제거해요(이 단계부터 기본 껍데기가 journal이라 필요 없어요).

**5단계 — HUD (2일)**: 5장 목업과 6장 슬롯 시스템 기준
- `WorldHeader.tsx` → 좌상단 날짜 간판과 우상단 간판 묶음, `LifeHud.tsx`(핫바 나무 레일), `ActionButton.tsx`와 장소 카드 → 하나의 "행동 간판", `SocialHud.tsx`(적응하기 → note), 미니맵 테두리와 "지도 ×" 칩 제거, 가방·지도 중복 정리.
- 1280×720에서 HUD 슬롯이 겹치지 않는지 스크린샷으로 확인해요.

**6단계 — 나머지 생활 창 (2일)**: 도감·박물관, 친구 사이, 게시판(개척 보드는 성장 수첩의 것을 그대로), 요리, 우편(note + Gaegu, 이모지 스티커 → 글리프), 소식, 앨범, 지갑, 계정, 친구들, 게임 초대, 가게 카운터 3종(`shop-counter.css` → journal + tavern 토큰).

**7단계 — 게임 화면과 테이블 시트 (3일)**
- `GameScreen.tsx`와 `lounge-table-venue.css`: 카지노 → `felt`, 회관 → `hanji`, 주점 → `journal[data-venue=tavern]`. 남색 액션 바와 주황 전면 테두리를 없애요(차례 표시는 내 자리 판에만 황동 글로우). 오른쪽 빈 사이드는 "판 기록과 한마디"로 채우거나 접어요.
- `TableSheet.tsx`와 회관·카지노 목록 → 장소 껍데기 + `KeyHintBar`.
- 각 게임 CSS(`lounge-*-table.css` 10개)에서 hex를 장소 토큰으로 바꿔요. 게임 로직 파일은 건드리지 않아요.

**8단계 — 정리 (1일)**: lucide import 0개(oxlint 에러로 전환), `kbd` 규칙 1개, z-index 토큰만, CSS 린트 경고 0을 목표로 해요. 로그인 화면을 note와 방 미리보기 배경으로 바꿔요.

예상 합계 약 13–14일(한 사람 기준). 4~7단계는 창 단위라 여러 에이전트가 나눠 맡을 수 있어요(파일이 겹치지 않게 위 목록대로).

---

## 5. 목업 (전/후)

| 무엇 | 전 | 후 |
|---|---|---|
| 디자인 시스템 시트 | — | `mock/after-system.png` |
| ☰ 마을 메뉴 → "범타듀 수첩" 목차 | `shots/main-fhd/m-fhd-05-hamburger.png` | `mock/after-menu.png` (나란히: `mock/compare-menu.png`) |
| 마을 HUD | `shots/hud-fhd/m-fhd-03-village-hud.png` | `mock/after-hud.png` (나란히: `mock/compare-hud.png`) |

- 메뉴: 20개 흰 버튼 → 두 쪽 수첩 목차(점선 리더 + 키캡), 초점 항목은 금색 테두리, 위험 영역은 인주 점선 도장, 아래 `KeyHintBar`.
- HUD: 흰 바 → 나무·종이 간판, 적응하기 → 테이프 쪽지(Gaegu), 장소 카드 + 행동 버튼 → 한 간판 "승준의 텃밭 | 거두기 [E]", 핫바 → 나무 레일, 미니맵 → 핀 꽂은 지도, 가방·지도 중복 제거.
- 목업 폰트는 실제 제안 폰트(Jua, Pretendard, Gaegu)로 렌더했어요. 소스는 `mock/*.html`, 렌더러는 `render.mjs`예요.

---

## 6. 1440×900 · 1280×720

스크린샷: `shots/hud-d/`(1440×900), `shots/hud-s/`(1280×720). 대비와 껍데기 측정은 `metrics-d.json`, `metrics-s.json`에 있어요. 두 해상도 모두 가로 스크롤은 없어요(`overflowX: false`).

**1280×720 (가장 작은 목표 해상도)**
- **적응하기 체크리스트가 미니맵 위쪽 절반을 덮어요** (`hud-s/m-s-03-village-hud.png`). 체크리스트(top 150, 높이 약 310)와 미니맵(bottom 기준)이 세로로 만나요. 1920에서는 떨어져 있어서 보이지 않던 겹침이에요. P0-2와 같은 원인(좌측 기둥에 절대 위치 요소 5개)이에요.
- 좌측 기둥이 브랜드, 마을 안내, 적응하기, 미니맵, "지도 ×", 수다/가방/스티커로 6층이라 **화면 높이 720을 다 써요**. 핫바(가운데 아래)와 행동 버튼(오른쪽)은 여유가 있어요.
- 우상단 바가 700px(화면의 55%)예요. 지갑, 오늘의 범, 게임 초대가 줄바꿈 직전이에요.
- **성장 수첩이 680px로 줄면서 왼쪽 쪽의 "오늘 할 수 있는 것" 카드와 아래 키 안내 줄이 잘려요** (`hud-s/m-s-06-growth.png`). 쪽 안에 스크롤이 없어요. 텃밭 장부(626px)는 들어가요.
- 방 화면에서 초록 알림 토스트가 헤더 바로 아래 가운데에 떠서, 처음 안내 카드가 뜰 때는 둘이 겹쳐 보여요(`onboard/ob-fhd-01-first.png`, 1920에서도 같아요).

**1440×900**
- 레이아웃은 1920과 거의 같아요. 우상단 바가 좌상단 날짜 칩 쪽으로 가까워지고(`hud-d/m-d-03-village-hud.png`), 적응하기와 미니맵 사이 간격이 50px로 줄어요.
- 성장 수첩은 1180×794로 화면 높이의 88%를 차지해요. 텃밭 장부와 가방은 1020 너비 그대로라 문제없어요.

**권장**
- HUD 슬롯 시스템: 좌상단(날짜 간판 + 적응하기 쪽지, 최대 높이 `40vh`, 넘치면 접힘) · 좌하단(미니맵, 720 이하에서는 기본 접힘 → `M` 키캡만) · 우상단(간판 묶음, 1280 이하에서는 지갑·오늘의 범을 한 간판으로 합침) · 하단 중앙(행동 간판 + 핫바).
- `journal` 창은 `max-height: calc(100dvh - 48px)`로 두고, **쪽(page) 단위로 스크롤**해요. `KeyHintBar`는 스크롤 밖에 고정해요.

## 6-1. 처음 안내(튜토리얼)

- `shots/onboard/ob-fhd-02-tutorial-move.png`, `-03-tutorial-step2.png`: 상단 가운데 흰 카드(1/4, 2/4 진행 점, WASD/Shift 키캡)예요. 구조와 문구(해요체, "해 보세요")가 좋아요.
- 이슈: ① 카드와 알림 토스트가 같은 자리에 겹쳐 쌓여요 ② "건너뛰기"가 11px 텍스트 링크라 찾기 어려워요 ③ 2단계 문구 "오른쪽 아래 버튼이 '나가기'로 바뀌면 문 앞이에요"는 좌상단에 이미 "나가기" 버튼이 있어서 헷갈려요 ④ 껍데기가 흰 SaaS 카드예요. `note` 껍데기(테이프 쪽지 + Gaegu 제목)로 바꾸면 "마을 적응하기"와 한 가족이 돼요.

---

## 7. 부록: 측정과 재현

- CSS 통계: `cssstats.mjs` → `cssstats.txt`
- 화면별 대비와 껍데기 측정: `shots/*/metrics-*.json` (`texts`, `lowCount`, `low[]`, `shell{cls,w,h,bg,radius,head,close,sizes,btnRadii}`, `icons{lucide,other}`)
- 하니스: `h.mjs`(목 Supabase, 스냅샷 엔진), `main.mjs <fhd|d|s> [hud|v2]`, `games-casino.mjs`, `games-hall.mjs`(b2p·c3games에서 옮김), `onboard.mjs`
- 빌드: `build.sh`(작업 트리를 `src/`로 스냅샷해 빌드, 저장소는 건드리지 않음)
