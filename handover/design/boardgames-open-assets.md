# 범타듀 밸리 — 오픈 라이선스 에셋으로 바로 들여올 수 있는 보드·테이블 게임 조사

조사일: 2026-09-26 · 조사 범위: GitHub, Wikimedia Commons, Kenney, game-icons.net
라이선스는 각 저장소의 LICENSE 파일과 README, Commons API 메타데이터(extmetadata)에서 직접 확인했습니다. 저장소는 수정하지 않았습니다. 샘플만 `scratchpad/boardgames/`에 받았습니다.

## 먼저 알아둘 점

- **규칙은 저작권 대상이 아닙니다.** 윷놀이, 장기, 오목, 원카드, 마피아, 라이어 다이스 같은 전통·민속 게임은 규칙을 그대로 구현해도 됩니다. 조심해야 하는 것은 아트, 상표(게임 이름), 그리고 남이 짠 코드뿐입니다.
- **우리 스택에 맞는 "엔진 + 아트" 완성 패키지는 거의 없습니다.** 그래서 현실적인 방식은 이렇습니다. ① 아트는 CC0나 CC-BY 팩을 가져오고, ② 엔진은 규칙이 단순하면 우리 서버 판정 구조(`app/lounge-*.ts`)에 직접 짜고, ③ 규칙이 복잡한 장기만 MIT 라이선스 TS 엔진을 가져다 씁니다.
- **GPL 계열은 피해야 합니다.** 배포 HTML에 번들로 들어가기 때문입니다. Fairy-Stockfish·ffish.js(GPL-3), lichess chessground(GPL-3), pychess-variants(AGPL-3), riichi-ts(GPL-3)가 여기에 해당합니다.
- **지금 포커와 블랙잭 카드는 CSS/텍스트로 그립니다**(`app/lounge-poker-table.tsx`). CC0 카드 덱을 들이면 새 카드 게임에 쓰는 것은 물론이고 기존 게임 카드도 함께 바꿀 수 있습니다.
- CC BY-SA는 우리가 이미 화투에서 다루고 있습니다(`ASSETS.md`의 HWATU-ATTRIBUTION). 쓸 수는 있지만, 수정한 아트도 같은 라이선스로 공개해야 합니다. 그래서 대안이 있으면 CC0나 CC-BY를 우선했습니다.

## 추천 순위 (Top 10)

| 순위 | 게임 | 인원 | 에셋 출처·라이선스 | 포함된 것 | 작업량 | 추천 이유 |
|---|---|---|---|---|---|---|
| 1 | **윷놀이** | 2–7명 (개인전, 또는 2팀·3팀 팀전) | 가져올 아트가 거의 필요 없음. 윷가락 4개와 말판 29칸은 3D 프리미티브로 직접 모델링. Commons `Yut-head.png` 등은 **Public domain**(참고용). `Yut board.svg`·`Yut Routes.svg`는 CC BY-SA 4.0이므로 쓰지 않는 편이 좋음. 말은 Kenney Boardgame Pack(CC0) 폰 사용 가능 | 규칙만 공개(민속). 쓸 만한 오픈소스 코드는 없음(GitHub 구현은 대부분 라이선스 없는 Java·C# 과제) | 중하. 엔진 약 400줄(도·개·걸·윷·모·빽도, 업기, 잡기, 지름길). 윷 던지기 연출이 핵심 | 한국 친구 7명 마을에 가장 잘 맞음. 운 요소가 커서 실력 차이가 덜 나고 팀전으로 7명이 함께 할 수 있음. 명절 이벤트와도 연계 가능 |
| 2 | **장기** | 2명 (+관전·훈수) | 말·판: **Kadagaden/chess-pieces**의 `janggi_wooden/`(14개 SVG)와 `boards/JanggiWood.svg`, **CC BY 4.0**(LICENSE.txt 확인). 대안으로 Commons Hari Seldon 세트(CC BY-SA 4.0) | 엔진: **neil-armstrong-fig/janggi**, **MIT**, 순수 TS 약 2,500줄(`webapp/src/game/`, React 의존 없음). 합법수 생성, 궁성 대각선, 빅장, 한수쉼, 반복, 상마 배치까지 구현 | 중. 체스(chess.js) 연동 방식을 그대로 옮기면 됨. 봇은 Fairy-Stockfish(GPL)라서 **제외** | 이미 있는 체스 테이블 구조를 재사용할 수 있음. 나무 말 SVG가 따뜻한 톤과 잘 맞음. Kakao 장기 풍이라는 점만 크레딧에 적으면 됨 |
| 3 | **라이어 다이스(허풍 주사위)** | 2–7명 이상 | 주사위: Kenney **Boardgame Pack, CC0**(Dice 25장). 야추의 3D 주사위와 컵을 그대로 재사용 가능 | 규칙 공개(Perudo). 코드는 직접 작성 | 하. 엔진 약 300줄(비공개 주사위, 입찰, 도전). 야추 인프라 재사용 | 7명이 한 판에 모두 참여할 수 있음. 블러핑이 있어서 대화 게임으로 좋음. 진행 중인 '라이어 게임'과 이름이 겹치니 "허풍 주사위" 같은 이름을 권장 |
| 4 | **원카드 (+도둑잡기·훌라)** | 2–7명 | **AustinGabriel/Public-Domain-and-CC0-Playing-Cards, CC0**. SVG·PNG 54장, 카드 뒷면 포함. SVG가 14MB로 무거워서 PNG 아틀라스로 최적화 필요. 가벼운 대안: Kenney Boardgame Pack 카드 69장(CC0, PNG) | 규칙 공개. 코드는 직접 작성 | 하~중. 원카드 엔진 약 350줄. 같은 덱을 포커와 블랙잭에도 적용하면 효과가 두 배 | 한국에서 누구나 아는 게임. 7명까지 가능. 기존 카지노 카드 비주얼도 함께 좋아짐 |
| 5 | **마피아** | 5–7명 이상 | 역할 아이콘: **game-icons.net, CC BY 3.0**(아이콘 4,000개 이상 SVG, 작가 표기 필수). 사회자는 기존 딜러 호스트(`lounge-dealer-host`) 재사용 | 규칙 공개. 코드는 직접 작성 | 중. 밤·낮 페이즈, 비공개 역할, 투표. 채팅 패널 재사용 | 7명 친구에게 가장 사회적인 게임. 아트가 거의 필요 없음. 라이어 게임의 역할 배정과 투표 구조를 공유 가능 |
| 6 | **오목** | 2명 | 에셋 불필요. 바둑판과 돌은 절차적 3D(원판·반구). 필요하면 Kenney Chips(CC0) | 코드는 직접 작성(약 150줄, 렌주 33 금지 선택 사항) | 하 | 제일 빨리 추가할 수 있음. 모든 연령이 아는 한국 게임. 체스 UI 재사용 |
| 7 | **바둑 (9×9·13×13)** | 2명 | 에셋 불필요(절차적 돌·판) | 착수·따냄·패 판정: **SabakiHQ/go-board, MIT** | 중(계가 UI가 가장 어려움) | 오목과 같은 판·돌을 공유할 수 있음. 9줄 바둑이면 한 판이 10분 안에 끝남 |
| 8 | **오셀로** | 2명 | 에셋 불필요(양면 원반). Kenney `chipBlackWhite`(CC0) 참고 | 코드는 직접 작성(약 150줄). 게임 이름 'Othello'는 상표이므로 "뒤집기"나 "리버시"로 표기 | 하 | 뒤집는 애니메이션이 3D로 보기 좋음. 짧은 판 |
| 9 | **말판 게임 (루도·뱀과 사다리)** | 2–6명 | **Kenney Boardgame Pack, CC0**(폰 406장, 주사위, 칩 포함, 2.2MB zip) | 규칙 공개(PD). 코드는 직접 작성 | 하 | 아이들 게임 같지만 가볍게 파티용으로 좋음. 윷놀이와 겹치므로 후순위 |
| 10 | **리치 마작** | 4명 (정확히) | **FluffyStuff/riichi-mahjong-tiles, CC0**(LICENSE.md 확인). SVG 40종, 일반·검정 2종, 864KB | 점수 계산: **livewing/mahjong-calc, MIT**(TS). riichi-ts는 GPL이라 제외 | 상. 치·퐁·깡, 리치, 역 판정, 쯔모·론 UI | 타일 아트 품질이 최상이고 CC0. 다만 4명 고정이고 한국 친구들에게 익숙하지 않을 수 있음 |

## 게임별 메모

### 1. 윷놀이
- 아트: 윷가락(반원기둥 4개, 한 개는 뒷면에 '빽도' 표시)과 말판은 3D로 직접 만드는 쪽이 빠르고, 라이선스 걱정도 없습니다. Commons 사진(`Yut Sticks.jpg`는 CC BY 4.0, 9248×6936)은 텍스처나 레퍼런스로만 참고하면 됩니다.
- 엔진: 서버가 윷 결과를 굴립니다(도 3/16, 개 6/16, 걸 4/16, 윷 1/16, 모 1/16, 빽도 변형 포함). 윷·모가 나오면 한 번 더 던지고, 잡아도 한 번 더 던집니다. 업기, 지름길(모서리와 방), 동시 이동 선택이 들어갑니다.
- 7명: 3:4 팀전이나 개인 4말 경쟁. 판돈(범) 걸기는 기존 정산 로직을 재사용합니다.

### 2. 장기
- `janggi_wooden/{red,blue}_{king,advisor,elephant,horse,chariot,cannon,pawn}.svg`를 씁니다. README에는 "Kakao Janggi에서 영감을 받았다"고 적혀 있습니다(원작 복제가 아니라 재해석). 라이선스는 CC BY 4.0이라 작가 Kadagaden만 표기하면 됩니다.
- 엔진: `webapp/src/game/moves/GetLegal*Moves.ts`, `ApplyMove.ts`, `OutcomeOf.ts`. `@src/game/...` 경로 별칭만 바꾸면 서버에 그대로 넣을 수 있습니다. `docs/rules.md`에 규칙 판단 근거가 정리되어 있습니다. 샘플은 `scratchpad/boardgames/janggi-neil/`에 있습니다.
- 봇이 필요하면 GPL 엔진이 아니라 간단한 알파베타 탐색을 직접 짜야 합니다.

### 3. 라이어 다이스
- 한 사람당 주사위 5개를 컵에 감춥니다. "5가 4개 이상" 식으로 입찰을 올리거나 "거짓말!"을 외쳐 도전합니다. 도전에서 진 사람은 주사위를 1개 잃습니다.
- 서버 판정 구조에 딱 맞는 비공개 정보 게임입니다. 한 판에 7명 × 5개 = 주사위 35개로, 공간이 넉넉합니다.

### 4. 원카드 / 도둑잡기 / 훌라
- AustinGabriel 덱은 README에 "All assets ... public domain / CC0"라고 명시되어 있습니다. 2026-08에 만든 저장소로 별 17개입니다. 원본 PD 소스를 조합한 것이라고 스스로 밝히고 있습니다.
- Kenney Playing Cards Pack(2020, CC0, 270개 파일)도 있습니다. 둥근 캐주얼 스타일이라 아늑한 톤에는 이쪽이 더 맞을 수 있습니다.
- 제외: htdebeer/SVG-cards(LGPL-2.1, 쓸 수는 있지만 고지 부담), hayeah/playing-cards-assets(README에 라이선스 표기가 없음).

### 5. 마피아
- game-icons.net 아이콘(칼, 방패, 주사기, 돋보기, 가면 등)으로 역할 카드를 만듭니다. 크레딧 문구는 "Icons made by {author}. Available on https://game-icons.net"입니다.
- Secret Hitler(CC BY-NC-SA)나 The Resistance, 한밤의 늑대인간 아트는 NC 조건이거나 저작권이 있어서 **쓸 수 없습니다**. 규칙만 참고할 수 있습니다.

### 6–8. 오목, 바둑, 오셀로
- 판 하나와 흑백 돌 하나로 세 게임을 모두 할 수 있습니다. 한 번에 세 게임을 추가하는 셈이라 가성비가 좋습니다.
- 확인 결과 wgo.js는 저장소 루트에서 LICENSE 파일을 찾지 못해 제외했습니다. SabakiHQ/go-board와 Shudan은 MIT입니다.

### 9. 말판 게임
- Kenney Boardgame Pack 구성: Cards 69, Chips 33, Dice 25, Pieces 406(PNG + Vector + Spritesheets). zip 2.2MB, 2014년 공개, CC0.

### 10. 리치 마작
- 타일이 `Man1–9`, `Pin`, `Sou`, 자패(`Chun`, `Haku`, `Hatsu`...), `Front`, `Back`, `Blank`으로 나뉘어 있어서 3D 타일 앞면 텍스처로 바로 쓸 수 있습니다.
- 규칙 엔진 전체를 MIT로 가져올 수 있는 TS 프로젝트는 찾지 못했습니다. 점수 계산만 livewing(MIT)을 쓸 수 있습니다.

## 제외했거나 주의할 후보

| 후보 | 이유 |
|---|---|
| Fairy-Stockfish / ffish.js / fairy-stockfish-nnue.wasm | GPL-3. 배포 HTML에 넣으면 전체가 GPL 조건을 받음 |
| lichess chessground, pychess-variants | GPL-3 / AGPL-3 |
| MahjongPantheon/riichi-ts | GPL-3 |
| Commons 장기 SVG (Hari Seldon), `Janggi.svg`, 윷판 SVG | CC BY-SA 3.0/4.0. 쓸 수는 있지만 수정본도 SA로 공개해야 함. Kadagaden(CC BY)이 더 나음 |
| Ka-hu/shogi-pieces | CC BY 4.0(일부 CC BY-SA 3.0). 라이선스는 괜찮지만 한국 친구들에게 쇼기는 잘 맞지 않음 |
| Secret Hitler, Cheapass 일부 | NC(비상업) 조건 |
| 할리갈리, 코드네임, 쿠, 부루마블, 우노 | 아트와 상표가 저작권·상표권 대상. 규칙 메커닉만 참고하고 이름과 아트는 자체 제작해야 함 |
| hayeah/playing-cards-assets | 라이선스 표기가 없음 |
| wgo.js | LICENSE 파일을 확인하지 못함 |
| Kenney 3D 보드게임 키트 | 없음. Kenney의 보드게임 에셋은 2D(PNG/벡터)뿐. 3D 말은 직접 모델링하거나 SVG를 3D 판 위의 텍스처로 쓰기 |

## 권장 순서

1. **오목 → 오셀로**: 판과 돌을 공유합니다. 각 1일 내외로 한 번에 2개를 추가할 수 있습니다.
2. **윷놀이**: 한국 마을 정체성이 가장 크고 7명이 함께 할 수 있습니다.
3. **원카드 + CC0 덱 도입**: 기존 포커와 블랙잭 카드도 함께 바꿉니다.
4. **라이어 다이스**: 야추 인프라를 재사용합니다.
5. **장기**: MIT 엔진과 CC BY 나무 말을 씁니다.
6. **마피아**: 라이어 게임의 투표 구조를 확장합니다.

모든 추가 에셋은 `ASSETS.md` 표와 배포 HTML의 `#third-party-licenses`에 같은 형식으로 적어야 합니다. CC BY는 작가, 출처 URL, 라이선스 링크를 표기합니다. MIT는 LICENSE 전문을 보관합니다.

## 샘플 위치
`/tmp/claude-0/-home-user-our-six-island/3d44dba4-7ce1-5ebb-9f1d-02158add7c10/scratchpad/boardgames/`
- `janggi-neil/`: MIT 장기 엔진 전체
- `Public-Domain-and-CC0-Playing-Cards/`: CC0 카드 54장 (SVG/PNG)
- `riichi-mahjong-tiles/`: CC0 마작 타일
- `kbg.zip`: Kenney Boardgame Pack (CC0)
- `kada/`: Kadagaden 저장소 파일 목록 (blob 없음)
