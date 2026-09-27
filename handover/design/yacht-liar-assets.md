# 야추 · 라이어 게임 에셋 조사 (kArchive 우선, GitHub 보충)

- 조사일: 2026-09-26 · 범위: 새 게임 두 개(야추 `yacht`, 라이어 게임 `liar`)에만 쓸 에셋. (처음 받은 "전체 조사" 요청은 도중에 범위가 바뀌어 중단했습니다.)
- 현재 상태: 회관(hall) 방의 `lounge-interior-scene.ts` 590~620행에서 두 테이블을 **절차 생성**합니다. 둘 다 둥근 나무 테이블과 펠트 천을 쓰고, 야추 테이블에는 상자 5개 주사위·트레이·원통 컵을, 라이어 테이블에는 흰 카드·빨간 표시·흰 컵 5개를 올립니다. `lounge-yacht-table.tsx`와 `lounge-liar-table.tsx`는 아직 없습니다(`table-chunks.ts`에서 import만 함). 오디오 파일은 0개이고 효과음은 모두 WebAudio 합성입니다(`table('deal'|'flip'|'chips')`, `chime(...)`). 주사위·투표 효과음은 아직 없습니다.
- 방법
  - kArchive: 이미 긁어 둔 `scratchpad/kcatalog.json`(6,691개)을 영문 slug와 한글 이름으로 키워드 검색했습니다. 후보 75개는 썸네일 시트(`ghassets/karchive/sheet.png`)로 눈으로 확인하고, 25개는 GLB를 받아 삼각형 수·텍스처·크기를 쟀습니다(`ghassets/karchive/glb/`).
  - GitHub: 라이선스 파일 원문(raw)을 확인했고, 표본은 `ghassets/` 아래에만 받았습니다. 저장소에는 아무것도 추가하지 않았습니다.
- kArchive 약관(2026-09-25 기록과 같음): 개인·상업 사용과 수정 가능, 원본 재판매 금지, **출처 표기 필수 "자료: kArchive / 출처: 쓰레드 dogfooter"**, CC 라이선스 아님.

---

## 1. kArchive 검색 결과 요약

### 1-1. kArchive에 **없는** 것(GitHub나 절차 생성으로 보충)

| 찾은 것 | 결과 |
|---|---|
| 주사위, 주사위 컵·트레이 | **없음**(`dice`, `주사위`, `윷` 0건) |
| 트로피, 메달, 시상대 | **없음**(`crown`은 고사리 이름 1건뿐) |
| 투표함·투표용지 | **없음**(`box`는 주방 기기·배전함만 나옴) |
| 가면·탐정 소품·돋보기 | **없음** |
| 스포트라이트·무대 조명 | **없음**(무대는 `newyear-11` 카운트다운 무대 1개. 축제 무대 `festivalStage.glb`로 **이미 사용 중**) |
| 칠판·화이트보드·이젤 | **없음**(게시판 `public-notice-board`는 **이미 사용 중**) |
| 모래시계·타이머 | 모래시계 없음. 대신 **새해 카운트다운 시계**(`newyear`)와 공공 시계 기둥이 있음 |
| 원형으로 놓인 의자 | 의자 6개가 붙은 **타원 회의 테이블** 한 덩어리가 있음(아래 L1) |

### 1-2. 야추 테이블 후보 (회관 `yacht` 테이블, 2~4인)

| # | kArchive slug(페이지 `https://karchive.vibeline.co.kr/models/<slug>`) | 무엇 | 원본 | 삼각형 | 텍스처 | 바운드(m) | 쓰임·판단 |
|---|---|---|---:|---:|---|---|---|
| Y1 | `common-furniture-square-card-table-heritage-normal` | 초록 펠트 사각 카드 테이블 | 515 KB (웹 332 KB) | 5,702 | JPG 1024² | 0.80×0.52×0.80 | **이미 `club/cardTable.glb`로 배포 중 → 추가 용량 0.** 초록 펠트 상판이 주사위판으로 딱 맞음. 절차 생성 원탁을 이것으로 바꾸고, 트레이·주사위만 위에 절차 생성으로 올림 |
| Y1' | `common-furniture-square-card-table-streamline-normal` / `-cottage-normal` | 같은 테이블의 원기둥 받침형 / 나무 다리형 | 455 / 423 KB | 5,694 / 5,929 | 1024² | 0.8×0.67×0.8 | 섯다·고스톱 테이블과 모양을 구별하고 싶을 때의 대안 |
| Y2 | `common-furniture-round-cafe-table-heritage-normal` | 원형 카페 테이블(청록 문양) | 422 KB | 6,104 | 1024² | 0.8×0.55×0.8 | 지금의 "둥근 테이블" 느낌을 유지하고 싶을 때. 펠트가 없어 트레이를 올려야 함 |
| Y3 | `newyear-09` | 탁상 달력(흰 페이지 + 빨간 링) | 382 KB | 3,174 | 1024² | 2.0 정규화* | **점수표 소품**. 흰 페이지가 비어 있어 점수 캔버스 텍스처를 덧대기 좋음 |
| Y4 | `exam-06` / `exam-07` | 연필 / 지우개 | 318 / 302 KB | 3,349 / 2,914 | 1024² | 2.0 정규화* | 점수표 옆 소품. 둘 중 연필 하나만 권장 |
| Y5 | `christmas-11` | 금색 별 토퍼 | 253 KB | 3,751 | 1024² | 2.0 정규화* | "야추!"(50점) 또는 승자 머리 위에 띄우는 별. 트로피가 없어서 대체로 씀 |
| Y6 | `newyear-05` / `newyear-03` / `newyear-04` | 풍선 묶음 / 파티 고깔 / 나팔 | 323 / 373 / 323 KB | 3.2~3.6k | 1024² | 2.0 정규화* | 승리 연출용 선택 사항. 테이블 옆 장식으로는 과함. 필요하면 풍선 하나만 |
| — | (주사위·컵·트레이) | — | — | — | — | — | kArchive에 없음 → §2-1 절차 생성 |

\* 기념일(holiday) 계열은 **가장 긴 변이 2 m로 정규화**되어 있어서(연필이 2 m) 런타임에서 0.06~0.15배로 줄여야 합니다. 일반 가구 계열은 실제 크기입니다(서비스 벨 0.1 m).

### 1-3. 라이어 게임 테이블 후보 (회관 `liar` 테이블, 4인 이상)

| # | slug | 무엇 | 원본 | 삼각형 | 텍스처 | 바운드(m) | 쓰임·판단 |
|---|---|---|---:|---:|---|---|---|
| L1 | `angular-common-furniture-oval-meeting-table-heritage-normal` | 타원 회의 테이블(의자 없음, 짙은 청록 상판) | 497 KB | 4,829 | 1024² | 1.20×0.51×0.75 | **라이어 테이블 본체로 권장.** 의자는 이미 배포 중인 `club/banquetChair.glb`를 좌석 수만큼 둥글게 배치(추가 0 KB). 인원이 바뀌어도 대응됨 |
| L1' | `common-furniture-oval-meeting-table-heritage-normal` | 타원 테이블 + **의자 6개 일체형** | 590 KB | 5,725 | 1024² | 0.95×0.33×0.80 | "둘러앉은 의자"가 한 덩어리로 옴. 단, 최대 7인이면 의자가 부족하고 빌보드 캐릭터 좌석과 위치를 맞춰야 해서 L1보다 불리함. 크기도 작아(0.33 m 높이) 스케일 조정 필요 |
| L2 | `rounded-restaurant-service-bell-ready` (+`-button-pressed`) | 호텔 카운터 벨(크림색) | 291 KB | 4,146 | 1024² | 0.10×0.08×0.10 | **지목·투표 벨.** 테이블 중앙에 두고 투표 시작·라이어 지목 때 누름. 눌린 버전이 따로 있어 2단 모션도 가능 |
| L3 | `convenience-service-call-bell-pedestal-heritage-normal` | 벨이 올라간 받침대 | 471 KB | 5,749 | 1024² | 0.58×1.10×0.51 | 벨을 테이블 밖에 세울 때의 대안(L2와 둘 중 하나) |
| L4 | `angular-restaurant-menu-lectern-blank-menu-stack` | 청록 메뉴 스탠드(빈 종이 묶음) | 460 KB | 4,006 | 1024² | 0.55×1.00×0.34 | **발언대·사회자 단상.** 차례인 사람의 힌트를 말하는 자리. 대표 버전 `restaurant-menu-lectern`(2.3 MB, 2048² 텍스처)은 과해서 제외 |
| L5 | `onsen-entrance-ticket-pedestal-heritage-normal` | 표 넣는 구멍이 있는 받침대 | 509 KB | 5,806 | 1024² | 0.61×1.10×0.53 | **투표함 대용.** 모양이 "종이 넣는 슬롯"이라 투표함으로 읽힘. cottage(나무 A자) 버전도 있음 |
| L6 | `onsen-portable-privacy-changing-screen-heritage-normal` | 3폭 가림막 | 471 KB | 5,466 | 1024² | 1.40×0.91×0.15 | 테이블 뒤 장식으로 "몰래 제시어 확인하는 곳" 분위기를 냄. 선택 사항 |
| L7 | `newyear` | 금별 장식 카운트다운 시계 | 424 KB | 3,665 | 1024² | 2.0 정규화* | **힌트 타이머 소품.** 모래시계가 없어서 대체로 씀 |
| L8 | `hangul-06` | 한지 두루마리 | 351 KB | 3,547 | 1024² | 2.0 정규화* | **제시어 카드 대신.** 지금의 흰 카드 상자를 두루마리로 교체. 한국풍이라 화투 테이블과도 어울림 |
| L9 | `exam-12` | 학사모·안경 쓴 부엉이 | 480 KB | 5,431 | 1024² | 2.0 정규화* | 사회자·심판 마스코트(선택). 탐정 분위기에 가장 가까운 kArchive 소품 |
| L10 | `restaurant-floor-lamp` | 홀 스탠드 조명 | 2.0 MB | 6,276 | **JPG 2048²** | 0.65×1.47×0.65 | 스포트라이트 분위기용. 텍스처를 512²로 줄이면 약 200 KB. 우선순위 낮음 |
| — | `christmas-09`(선물 상자), `common-furniture-stacking-school-chair-*`, `common-furniture-reading-armchair-*` | 투표함 대용 / 의자 대안 | 355~495 KB | 3.6~6k | 1024² | — | 선물 상자는 투표함으로 읽히지 않아 탈락. 의자는 banquetChair 재사용이 나음 |

화풍: 모두 지금 쓰는 kArchive "동글동글/각진" 계열과 같은 파스텔·둥근 모서리이고 1메시·1머티리얼·구운 JPEG 텍스처 구조입니다. 회관의 한옥·카드 테이블·연회 의자 옆에 두어도 어색하지 않습니다(썸네일 시트로 확인). 탁상 달력(Y3)의 빨강과 카운트다운 시계(L7)의 금별은 채도가 조금 높으니 작게 씁니다.

용량: 원본 GLB 한 개의 절반 정도가 1024² JPEG 텍스처입니다(표본 25개 측정). 기존 파이프라인(`optimize-assets.mjs`, 양자화 + WebP)으로 cardTable은 515→332 KB(0.64배)가 되었습니다. **테이블 위 소품은 화면에서 수십 픽셀 크기이므로 `textureMax: 512`를 권장**하며, 그러면 개당 약 120~180 KB로 예상합니다.

---

## 2. GitHub 보충 (kArchive에 없는 것)

### 2-1. 3D 주사위 → **외부 에셋 없이 절차 생성 권장**

- 조사 결과: GitHub에 CC0 주사위 GLB 저장소는 사실상 없습니다(코드 검색 0건). three.js 주사위 저장소들(`accassid/dice-gen`, `aqandrew/react-3d-dice` 등)은 물리 엔진(cannon)을 끼운 데모이고, 라이선스가 없거나 우리 목적에 과합니다.
- 권장: 이미 설치된 **three.js `examples/jsm/geometries/RoundedBoxGeometry.js`(MIT, three에 포함)**로 모서리가 둥근 주사위를 만들고, 눈은 캔버스 텍스처(6면 머티리얼)나 살짝 파인 작은 구로 표현합니다. 개당 약 200~400 삼각형이고 **추가 용량은 0**입니다. 크림색 몸체와 짙은 갈색 눈(#3d2f25, `ItemIcon`의 INK 색)으로 하고 1·4의 눈만 빨갛게 하면 동양식 주사위가 되어 한국 분위기에 맞습니다.
- 주사위 컵: 지금 쓰는 원통(`#8e2f36`)을 `LatheGeometry`로 바꾸면 테두리와 가죽 느낌을 낼 수 있습니다(0 KB).
- 2D 참고: **Kenney Boardgame Pack v2 (CC0)**의 `PNG/Dice/dieWhite1~6`, `dieRed*`는 64², 장당 약 0.8~1.2 KB입니다. 확인한 미러는 `lukesoldano/NotRisk` `Assets/kenney_boardgame-pack/`이고, 그 안의 `license.txt`에 "CC0 License (Creative Commons Zero)"가 적혀 있습니다. 3D 주사위 면 텍스처나 UI 결과 표시에 바로 쓸 수 있지만, 아래 lucide 아이콘이나 직접 그린 SVG로도 충분합니다.

### 2-2. UI 아이콘 → **1순위는 이미 의존성에 있는 `lucide-react`(ISC)**

`package.json`에 `lucide-react 1.31.0`이 이미 있고 여러 화면에서 쓰고 있습니다. 설치본에 아래 아이콘이 모두 있는 것을 확인했습니다. **추가 용량(트리셰이킹 후 개당 약 0.3 KB)과 라이선스 추가 작업이 거의 없습니다.**

| 용도 | lucide 아이콘 |
|---|---|
| 야추 주사위 1~6 / 굴리기 버튼 | `dice-1`…`dice-6`, `dices` |
| 야추 점수표·기록 | `clipboard-list`, `notebook-pen`, `trophy`, `medal`, `crown`, `party-popper` |
| 라이어 제시어·질문 | `scroll`, `file-question-mark`, `message-circle-question-mark` |
| 라이어 가면·정체 | `venetian-mask`, `drama`, `eye-off`, `user-round-search` |
| 투표·판결 | `vote`, `stamp`, `gavel`, `ticket` |
| 타이머·차례 | `hourglass`, `timer`, `bell-ring`, `megaphone`, `mic-vocal`, `spotlight` |

보조 후보(더 굵고 게임다운 실루엣이 필요할 때)

| 저장소 | 라이선스(원문 확인) | 내용 | 판단 |
|---|---|---|---|
| [phosphor-icons/core](https://github.com/phosphor-icons/core) | **MIT** (`LICENSE`) | `assets/duotone/*.svg`: dice-one~six, hourglass-medium, detective, mask-happy/sad, gavel, stamp, bell-ringing, trophy, crown, medal, megaphone, microphone-stage | duotone 스타일이 크림·갈색 테마에서 lucide보다 따뜻해 보입니다. 필요한 SVG 몇 개만 인라인으로 복사하고 LICENSE를 보관합니다. 개당 0.5~1 KB |
| [game-icons/icons](https://github.com/game-icons/icons) | **CC BY 3.0**(일부 CC0), `license.txt`. 작가별 표기 필요(Lorc, Delapouite…) | `delapouite/rolling-dice-cup`, `dice-six-faces-*`, `vote`(투표함에 표 넣기), `stamper`, `podium-winner`, `spy`, `lorc/domino-mask`, `lorc/hourglass`, `lorc/ringing-bell`, `lorc/trophy` | **주사위 컵·투표함·시상대처럼 lucide에 없는 그림**이 있습니다. 채운 실루엣이라 버튼 배지나 결과 도장에 좋습니다. 쓰면 화면 크레딧에 "game-icons.net — Delapouite/Lorc, CC BY 3.0"을 표기해야 합니다 |
| [microsoft/fluentui-emoji](https://github.com/microsoft/fluentui-emoji) | **MIT** (`LICENSE`) | 3D PNG 256²(장당 20~46 KB): Game die, Hourglass, Ballot box with ballot, Detective, Bell, Trophy, Stopwatch, Shushing face, Performing arts, Party popper | 결과 배너·튜토리얼 삽화용으로만. 광택 3D 렌더라 우리의 "칠한 실루엣" 아이콘(`ItemIcon.tsx`, "이모지를 아이콘으로 쓰지 않음" 원칙)과 결이 달라서 **보조 삽화에만 쓰고 아이콘으로는 쓰지 않음** |
| jdecked/twemoji | 그래픽 CC BY 4.0 | 평면 이모지 SVG | Fluent와 같은 이유로 비권장 |

표본: `ghassets/icons-sheet.png`(Fluent 20개, Phosphor 27개, game-icons 19개, Kenney 주사위 5개를 크림 배경에 갈색으로 렌더링한 시트).

### 2-3. 효과음 → **Kenney CC0 오디오 3팩**(현재 합성음 보강)

| 팩 | 라이선스 확인(미러의 원문) | 받은 표본(길이·크기) | 게임 안 용도 |
|---|---|---|---|
| **Kenney Casino Audio 1.1** | CC0. `coderKillo/do-you-wanna-jam-2026` `assets/sfx/kenney_casino-audio/License.txt` 원문: "License (Creative Commons Zero, CC0)" | `dice-shake-1~3`(1.4~1.5초, 약 19 KB), `dice-throw-1~3`(0.4~0.6초, 8~10 KB), `dice-grab-1~2`(0.7~0.8초), `die-throw-1~2`(주사위 1개, 0.5~0.65초), `card-slide/place/fan/shove`(0.6~0.8초, 9~12 KB) | **야추**: 흔들기(굴리기 버튼을 누르고 있는 동안) → 던지기(결과), 킵할 주사위 잡기는 `dice-grab`, 1~2개만 다시 굴릴 때는 `die-throw`. **라이어**: 제시어 카드를 나눌 때 `card-slide`, 공개할 때 `card-place` |
| **Kenney Interface Sounds 1.0** | CC0. `lwjglgamedev/vulkanbook` `…/License-Interface Sounds.txt` 원문: "License: (Creative Commons Zero, CC0)" | `tick_001/002`(0.02초, 4.5 KB), `bong_001`(0.12초), `question_001`(0.49초), `confirmation_001`(0.29초), `drop_001`, `glass_001`, `error_004`, `select_001` | **라이어**: 힌트 타이머 마지막 5초는 `tick`, 차례 넘김은 `bong`, 투표 시작·지목은 `question`, 표 넣기는 `drop`, 투표 확정은 `confirmation`, 라이어가 제시어를 맞히면 `error`. **야추**: 점수 칸 고르기는 `select`, 기록은 `confirmation` |
| **Kenney Music Jingles** (Pizzicato) | CC0. `lukewilliamboswell/roc-ray` `…/LICENSE-music-jingles.txt` 원문: "License (Creative Commons Zero, CC0)" | `jingles_PIZZI00~16`(0.5~1.3초, 10~19 KB) | 피치카토 현악이라 코지 톤에 맞습니다. 야추 "야추!"(50점)·승리, 라이어 정체 공개(라이어 잡힘 / 라이어 승리)에 짧은 징글 2~3개 |

- 없는 것: 묵직한 "퀴즈 부저"나 드럼롤은 CC0 GitHub 미러에서 마땅한 것을 찾지 못했습니다. 기존 WebAudio 합성(`lounge-audio.ts`의 스팅 방식)으로 만드는 편이 톤도 맞고 용량도 0입니다.
- 총량: 권장 12~15개를 모두 합쳐 **약 150~200 KB**(OGG Vorbis)입니다.
- 주의
  - ① 저장소에 들어가는 **첫 오디오 파일**입니다. `scripts/build-standalone.mjs`는 이미지·모델 매니페스트만 읽으므로 오디오 매니페스트(`lounge-audio-assets.ts` 같은 것)와 해시 복사를 추가해야 합니다.
  - ② 구형 Safari는 Ogg Vorbis를 디코딩하지 못할 수 있습니다. `decodeAudioData`가 실패하면 기존 합성음으로 폴백하도록 하거나, AAC(m4a)로 변환해 함께 둡니다.
  - ③ 볼륨은 지금의 카드·칩 합성음 크기에 맞춰 정규화하고, 효과음 채널 설정(음소거)을 그대로 따르게 합니다.

---

## 3. 배치 제안(어디에 무엇을)

**회관 3D (lounge-interior-scene.ts의 `yacht`/`liar` 분기)**
- 야추: 절차 생성 원탁 대신 **cardTable.glb(Y1, 재사용)**을 두고, 위에 절차 생성 나무 트레이와 **RoundedBox 주사위 5개**를 올립니다. 옆에는 절차 생성 컵을 두고 **탁상 달력 점수표(Y3) + 연필(Y4)**을 놓습니다. 승리 연출로 별(Y5)을 선택적으로 띄웁니다.
- 라이어: **각진 타원 테이블(L1)** 주위에 **banquetChair.glb(재사용)**를 좌석 수만큼 둥글게 놓습니다. 중앙에 **서비스 벨(L2)**과 **두루마리 제시어(L8)**를 두고, 테이블 옆에 **발언대(L4)**와 **투표함 받침대(L5)**, **카운트다운 시계(L7)**를 세웁니다. 뒤쪽 가림막(L6)과 부엉이 사회자(L9)는 선택 사항입니다.

**게임 화면 UI (`lounge-yacht-table.tsx` / `lounge-liar-table.tsx` 신규)**
- 아이콘은 lucide(`dice-1~6`, `dices`, `clipboard-list`, `vote`, `venetian-mask`, `hourglass`, `bell-ring`, `stamp`)로 통일합니다. 주사위 컵·투표함·시상대 그림이 꼭 필요하면 game-icons 3개를 CC BY 표기와 함께 씁니다.
- 주사위 면은 직접 SVG로 그리거나(권장, 5분 작업) Kenney `dieWhite1~6` PNG를 씁니다.

**효과음 (lounge-audio.ts에 `dice(kind)`, `liar(kind)` 추가)**: §2-3의 표와 같습니다.

---

## 4. 라이선스·출처 표기 정리

| 출처 | 라이선스 | 표기 의무 | 할 일 |
|---|---|---|---|
| kArchive(Y·L 항목) | 사이트 약관(CC 아님): 사용·수정 가능, 원본 재판매 금지 | **필수**: "자료: kArchive / 출처: 쓰레드 dogfooter" | 기존 방식대로 `public/models/lounge/<폴더>/assets.json`에 URL·해시·약관 문구와 날짜를 기록하고, `ATTRIBUTION.md`와 화면 크레딧에 추가 |
| three.js RoundedBoxGeometry | MIT(three 본체) | 이미 three 고지에 포함 | 없음 |
| lucide-react | ISC | 이미 의존성 | 배포 고지(`#third-party-licenses`)에 lucide가 있는지 확인 |
| Phosphor(선택) | MIT | 저작권 고지 보관 | LICENSE 사본 보관 |
| game-icons.net(선택) | **CC BY 3.0** | **필수**: 작가명 + 라이선스 | 크레딧에 "Icons by Delapouite / Lorc — game-icons.net, CC BY 3.0" |
| Kenney Casino / Interface / Jingles / Boardgame | CC0 | 없음(권장만) | `License.txt` 사본을 같은 폴더에 보관. 미러가 아닌 kenney.nl 원본 ZIP에서 받는 것을 권장 |
| Fluent Emoji(선택) | MIT | 저작권 고지 보관 | 삽화로만 쓸 때 LICENSE 보관 |

제외: OpenMoji(CC BY-SA, 변형 시 동일 조건), 라이선스 파일이 없는 three.js 주사위 데모 저장소들.

## 5. 위험·주의

1. **스케일 차이**: 기념일 계열(`newyear*`, `exam*`, `christmas*`, `hangul*`)은 2 m로 정규화되어 있습니다. 로더에서 bounds 기준으로 목표 크기를 지정해야 합니다(기존 `assets.json`의 `bounds`와 런타임 맞춤 방식을 그대로 적용).
2. **채도**: 달력의 빨강, 시계의 금별·남색은 회관 톤보다 진합니다. 작게 두거나 머티리얼 `color`로 살짝 탁하게 합니다.
3. **용량**: kArchive 권장 8~10개를 기본 파이프라인으로 처리하면 약 2.5 MB, 텍스처 512²로 처리하면 **약 1.2~1.6 MB**입니다. 회관 입장 시 지연 로드(해당 테이블이 보일 때)를 권장합니다. `restaurant-floor-lamp`와 `restaurant-menu-lectern`의 2048² 버전은 쓰지 않습니다.
4. **의자 일체형 테이블(L1')**은 좌석 수가 고정(6)이라 7인일 때 어긋납니다 → L1 + 기존 의자 재사용을 권장합니다.
5. **오디오 파이프라인이 새로 필요**합니다(매니페스트·해시·Safari 폴백). 가장 작업량이 큰 항목입니다.
6. 아이콘 화풍: Fluent 3D 이모지는 우리 아이콘 원칙과 맞지 않습니다 → UI 아이콘은 lucide 계열로 통일합니다.

---

## 6. 최종 추천 목록

| 우선 | 항목 | 출처·라이선스 | 용도(위치) | 추가 용량(웹) | 작업량 |
|---|---|---|---|---|---|
| 1 | 초록 펠트 카드 테이블 `cardTable.glb` 재사용 | kArchive(이미 배포) | 회관 야추 테이블 본체 | 0 | 하(배치만) |
| 1 | RoundedBox 주사위 5개 + 선반형 컵 | three.js MIT(절차 생성) | 야추 3D 테이블 + 게임 화면 | 0 | 하~중 |
| 1 | Kenney Casino Audio: dice-shake·throw·grab, die-throw, card-slide/place | CC0 | 야추 굴리기·킵, 라이어 제시어 배분 | 약 90 KB | 중(첫 오디오 파이프라인) |
| 1 | lucide 아이콘(dice-1~6, dices, vote, venetian-mask, hourglass, bell-ring, stamp, clipboard-list, scroll) | ISC(이미 의존성) | 두 게임 UI 전체 | 약 3 KB | 하 |
| 1 | 각진 타원 회의 테이블 `angular-common-furniture-oval-meeting-table-heritage-normal` + banquetChair 재사용 | kArchive | 회관 라이어 테이블 | 약 150~300 KB | 하~중 |
| 2 | 서비스 벨 `rounded-restaurant-service-bell-ready`(+pressed) | kArchive | 라이어 지목·투표 벨(테이블 중앙) | 약 120~185 KB | 하 |
| 2 | 탁상 달력 `newyear-09` + 연필 `exam-06` | kArchive | 야추 점수표 소품 | 약 250~400 KB | 하(스케일) |
| 2 | Kenney Interface Sounds: tick·bong·question·drop·confirmation·error·select | CC0 | 라이어 타이머·투표, 야추 점수 기록 | 약 60 KB | 하(파이프라인 이후) |
| 2 | 메뉴 스탠드 발언대 `angular-restaurant-menu-lectern-blank-menu-stack` | kArchive | 라이어 발언대 | 약 150~295 KB | 하 |
| 2 | 표 넣는 받침대 `onsen-entrance-ticket-pedestal-heritage-normal` | kArchive | 라이어 투표함 | 약 150~320 KB | 하 |
| 3 | 카운트다운 시계 `newyear` | kArchive | 라이어 힌트 타이머 소품 | 약 130~270 KB | 하 |
| 3 | 한지 두루마리 `hangul-06` | kArchive | 라이어 제시어(카드 대신) | 약 120~220 KB | 하 |
| 3 | Kenney Music Jingles(Pizzicato) 2~3개 | CC0 | 야추 50점·승리, 라이어 정체 공개 | 약 45 KB | 하 |
| 3 | 금별 `christmas-11` | kArchive | 야추 승자 연출 | 약 100~160 KB | 하 |
| 4 | game-icons: rolling-dice-cup, vote, podium-winner | CC BY 3.0(표기 필수) | lucide에 없는 그림 배지 | 약 3 KB | 하(+크레딧) |
| 4 | 가림막 `onsen-portable-privacy-changing-screen-heritage-normal`, 부엉이 `exam-12` | kArchive | 라이어 테이블 분위기(선택) | 각각 약 150~300 KB | 하 |

**요약**: kArchive에는 **주사위·트로피·투표함·모래시계·가면이 없습니다.** 그 빈자리는 ① 절차 생성(주사위·컵), ② 이미 있는 lucide 아이콘, ③ Kenney CC0 효과음으로 메우는 것이 가장 가볍습니다. 3D 소품은 kArchive의 **재사용 2건(테이블·의자, 0 KB)과 신규 6~8건(웹 약 1.2~1.6 MB)**이면 두 테이블이 회관의 다른 테이블 수준으로 올라옵니다.

표본 위치(모두 scratchpad, 저장소 밖): `ghassets/karchive/{sheet.png, glb/, thumbs/}`, `ghassets/icons-sheet.png`, `ghassets/{fluent,phosphor,gameicons,kenney-boardgame}/`, `ghassets/kenney-{casino,interface,jingles}/*.ogg`.
