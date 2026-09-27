# kArchive 3D 모델 후보 조사 — 범타듀 밸리

- 조사일: 2026-09-25 · 대상: https://karchive.vibeline.co.kr/models (자료: kArchive · 출처: 쓰레드 dogfooter)
- 방법: 목록 143페이지를 컬렉션 8개(동글동글 63p, 각진 63p, 농작물·생선 9p, 기념일·명절 3p, 사계절 2p, 한국 도시 야경·한국 편의점·헨젤과 그레텔 각 1p) 모두 수집. 모델 **6,691개**를 파싱함(slug·이름·표시 용량·썸네일·조회/다운로드 수). 후보 178개는 썸네일 시트로 눈으로 확인. 대표 GLB 12개는 `scratchpad/karchive/`에만 받아 삼각형 수와 텍스처를 쟀음(저장소에는 받지 않음). 원시 목록은 `scratchpad/kcatalog.json`에 있음.
- 표기: 용량은 사이트가 보여 주는 GLB 원본 크기(MB). "실측"은 직접 받아 잰 바이트 수. 페이지 주소는 모두 `https://karchive.vibeline.co.kr/models/<slug>` 형식임.

## 0. 라이선스·약관 재확인

| 항목 | 2026-09-25 현재 표시 | 저장소 기록(09-18·09-24)과 비교 |
|---|---|---|
| 사용 범위 | 개인·상업 프로젝트에 사용 및 수정 가능 | 같음 |
| 재판매 | 원본 자료 재판매 금지 | 같음 |
| 출처 표기 | 라이선스 화면, 크레딧 또는 설명란에 **"자료: kArchive / 출처: 쓰레드 dogfooter"** 필수 | 같음 |
| AI 학습 | 사용 가능 | 같음(`village/assets.json` terms에 이미 기록됨. `lounge/ATTRIBUTION.md` 본문에는 없음) |
| 형식 | 별도 약관 페이지 없음(`/terms`, `/license` 모두 404). 목록 상단 배너와 다운로드 전 동의 창("수락하면 24시간 동안 다시 표시하지 않음")에만 있음 | 같음 |
| CC 여부 | CC 표기 없음 → 기존대로 "CC 아님" | 같음 |

**달라진 조건은 없음.** 사이트는 이제 컬렉션 ZIP 묶음도 제공함(전체 6,691개 4.44 GB, 동글동글 3,000개 1.38 GB, 각진 3,000개 1.25 GB, 농작물·생선 400개 1.41 GB, 사계절 94개 0.23 GB, 기념일·명절 140개 0.05 GB 등). 조건은 개별 모델과 같음. 약관이 페이지 문구로만 있으므로, 받을 때마다 날짜와 문구를 `assets.json`에 기록하는 기존 방식을 계속 쓰는 게 좋음.

## 1. 카탈로그 구조와 기술 특성(실측)

| 계열 | 수량 | 원본 크기 | 특성 |
|---|---|---|---|
| 동글동글(rounded) `common-*`, `restaurant/onsen/icecream/convenience/apocalypse-*` | 3,000 | 대부분 0.3–1.0 MB. 이름 붙은 "대표" 버전은 1.7–3.6 MB | 우리가 이미 쓰는 계열(주택·과일나무·수국 등). 따뜻한 파스텔, 둥근 모서리 |
| 각진(angular) `angular-*` | 3,000 | 0.2–0.8 MB | 같은 품목의 각진 버전. 약간 채도가 낮고 평평하지만 섞어 써도 어색하지 않음 |
| 기념일·명절 `christmas/halloween/newyear/dongji/hangul/gaecheon/exam/pepero-*` | 140 | 0.2–0.7 MB(대표 1–2개는 2.6–2.9) | 치비 느낌이 강하고 작고 가벼움 |
| 사계절 `lp-sp/su/au/wi/pc-*` | 94 | 1.7–3.6 MB | 디오라마 받침이 달린 경우가 많음. 텍스처 2048² |
| 농작물·생선 `crop-*`, `fish-*` | 400 | 2.0–4.5 MB | 한 품목에 하나. 텍스처 2048² |
| 한국 도시 야경·편의점·헨젤과 그레텔 | 57 | 1.7–3.6 MB | 도시/동화 테마. 우리 마을과는 대부분 거리가 멂 |

변형 규칙: 같은 품목에 `cottage / heritage / streamline`(색·재질), `normal / destroyed`(파손형), 상태(`-empty`, `-full`, `-open`…)가 붙음. 건물은 `compact / corner / courtyard / duplex` 4가지 모양이 있음. **파손형(`destroyed`)과 좀비 테마(`apocalypse`)는 대부분 제외**했음.

GLB 실측(12개 표본): 모두 **메시 1개, 머티리얼 1개, 구운(baked) JPEG 텍스처 1장**, 외부 참조와 확장은 없음.

| 표본 | 원본 바이트 | 삼각형 | 텍스처 |
|---|---:|---:|---|
| greenhouse-building-compact-normal | 922,920 | 8,911 | JPG 1024² |
| public-notice-board-civic-normal | 432,848 | 6,063 | JPG 1024² |
| rocking-chair-cottage-normal | 481,632 | 6,104 | JPG 1024² |
| angular vegetable-bed-mature-crops | 685,812 | 5,390 | JPG 1024² |
| harbor-bollard-chain-fence-straight | 296,368 | 2,598 | JPG 1024² |
| newyear-11 카운트다운 무대 | 449,036 | 4,960 | JPG 1024² |
| newyear-12 불꽃 분수 | 350,900 | 3,545 | JPG 1024² |
| gaecheon-03 호랑이 | 495,612 | 5,407 | JPG 1024² |
| restaurant-bar-stool(대표판) | 1,855,948 | 6,246 | **JPG 2048²** |
| restaurant-beverage-bar(대표판) | 2,408,392 | 6,021 | **JPG 2048²** |
| lp-sp-01 벚나무(사계절) | 3,469,744 | 1,784 | **JPG 2048²** |
| fish-mackerel 고등어 | 3,925,688 | 6,123 | **JPG 2048²** |

해석: **용량의 대부분은 텍스처**임. 1 MB 이하는 1024², 1.7 MB 이상은 2048²임. 우리 `scripts/optimize-assets.mjs`(WebP 재인코딩 + 양자화)를 거치면 기존 kArchive 파일이 원본의 약 66%로 줄었음(cottage 725,532 → 478,396). 2048² 모델은 1024²로 줄이면 대략 0.4–0.6 MB까지 내려갈 것으로 **추정함(실측 아님)**. 삼각형 2–9천 개는 정사영 아이소 뷰에 무리 없음. 다만 같은 모델을 수십 개 깔 때(울타리·데크 타일)는 인스턴싱이 필요함. 모든 모델이 텍스처를 1장씩 따로 쓰므로 **모델 종류가 늘면 텍스처 메모리가 선형으로 늘어남**(1024² 1장은 GPU에서 약 4 MB, 밉맵 포함 약 5.3 MB).

## 2. 절차 생성물 → 모델 교체 가능성 요약

| 현재 절차 생성(코드) | 교체 후보 | 판단 |
|---|---|---|
| 온실(`lounge-village-season-3d.ts`) | [`common-buildings-greenhouse-building-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-greenhouse-building-compact-normal) / duplex·corner 변형 | **교체 권장.** 유리 온실+주황 지붕이 기존 주택과 같은 계열. 온실 확장 공공사업은 compact→duplex 단계 교체로 표현할 수 있음 |
| 마을 게시판(season-3d·life-3d) | [`common-infrastructure-public-notice-board-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-public-notice-board-civic-normal) | **교체 권장.** 지붕 달린 목재 게시판. 종이 스프라이트만 앞에 붙이면 됨 |
| 부두(season-3d `pier`) | [`angular-common-infrastructure-timber-deck-flat`](https://karchive.vibeline.co.kr/models/angular-common-infrastructure-timber-deck-flat) 타일 + [`common-fences-harbor-bollard-chain-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-harbor-bollard-chain-fence-straight-normal) 난간 + [`apocalypse-rescue-flotation-gear-rack-cottage-normal`](https://karchive.vibeline.co.kr/models/apocalypse-rescue-flotation-gear-rack-cottage-normal) | **부분 교체.** 부두 전체 모델은 없음. 1m 데크 타일을 인스턴싱하고 난간을 붙이는 방식 |
| 박물관 파빌리온(season-3d) | [`common-buildings-public-library-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-public-library-compact-normal) 또는 [`common-buildings-park-visitor-center-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-park-visitor-center-compact-normal) | **교체 가능.** 둘 다 공공건물 느낌. 전시장 전용 모델은 없음 |
| 회관 외관(`buildCivicHall`) | [`dongji-12`](https://karchive.vibeline.co.kr/models/dongji-12) 겨울 한옥(0.7) + [`extra-hanok-wall`](https://karchive.vibeline.co.kr/models/extra-hanok-wall) 담장 | **교체 검토.** '범마을 회관'에 한옥 톤이 맞음. 겨울판이라 지붕에 눈 느낌이 조금 있으니 확인 필요. 크기가 작아 1.5–2배로 키워야 할 수 있음 |
| 카지노 외관(`buildCivicHall(casino)`) | [`restaurant-bistro-facade`](https://karchive.vibeline.co.kr/models/restaurant-bistro-facade)(2.4), [`common-buildings-ticket-station-building-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-ticket-station-building-compact-normal), [`icecream-gelato-parlor-building-cottage-normal`](https://karchive.vibeline.co.kr/models/icecream-gelato-parlor-building-cottage-normal) | **적합한 모델 없음.** '카지노'다운 건물이 없음. 비스트로 외관이 가장 가깝지만 식당 간판 느낌이라, 현행 절차 생성+네온 간판 유지를 권장 |
| 길·밭 | 길: [`angular-common-infrastructure-stone-paver-flat`](https://karchive.vibeline.co.kr/models/angular-common-infrastructure-stone-paver-flat) 1m 타일 / 밭: [`angular-common-nature-vegetable-bed-soil-empty`](https://karchive.vibeline.co.kr/models/angular-common-nature-vegetable-bed-soil-empty)·seedlings·mature | 길은 타일 수가 많아 **절차 생성 유지** 권장(드로콜·텍스처 부담). 밭은 **상자형 텃밭 틀만 교체**하고 작물은 기존 절차 생성을 그 위에 얹는 방식이 좋음 |
| 다리(`bridge`) | [`lp-sp-17`](https://karchive.vibeline.co.kr/models/lp-sp-17) 시냇물 징검다리(2.6), 레일 `flat-bridge-deck-*`(철도용) | **적합한 모델 없음.** 나무 보행교가 없음. '다리 보수' 공공사업은 절차 생성 유지 |
| 광장 분수(`fountain`) | [`common-infrastructure-public-drinking-fountain-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-public-drinking-fountain-civic-normal)(음수대), [`newyear-12`](https://karchive.vibeline.co.kr/models/newyear-12)(불꽃 분수), [`angular-onsen-rainwater-basin-water-filled`](https://karchive.vibeline.co.kr/models/angular-onsen-rainwater-basin-water-filled)(돌 수반) | **정식 분수 모델 없음.** '광장 분수' 공공사업은 절차 생성 유지. 수반·불꽃 분수는 장식으로만 |
| 딜러 테이블(섯다·고스톱·홀덤·블랙잭) | [`common-furniture-square-card-table-heritage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-square-card-table-heritage-normal), [`common-furniture-square-card-table-streamline-normal`](https://karchive.vibeline.co.kr/models/common-furniture-square-card-table-streamline-normal)(녹색 상판), [`common-furniture-oval-meeting-table-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-oval-meeting-table-cottage-normal) | **부분 교체.** 정사각 카드 테이블은 섯다·고스톱에 맞음. 반원형 블랙잭·타원 홀덤 테이블은 없으므로 현행 유지 |
| 의자 | [`common-furniture-round-back-banquet-chair-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-round-back-banquet-chair-cottage-normal), [`angular-restaurant-bar-stool-cushion`](https://karchive.vibeline.co.kr/models/angular-restaurant-bar-stool-cushion), [`common-furniture-bucket-lounge-chair-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-bucket-lounge-chair-cottage-normal) | **교체 권장.** 연회용 의자는 게임 테이블에, 바 의자는 바에 |
| 바 카운터 | [`restaurant-beverage-bar`](https://karchive.vibeline.co.kr/models/restaurant-beverage-bar)(2.3), [`angular-restaurant-soda-fountain-ready`](https://karchive.vibeline.co.kr/models/angular-restaurant-soda-fountain-ready), [`angular-restaurant-glassware-rack-full-glasses`](https://karchive.vibeline.co.kr/models/angular-restaurant-glassware-rack-full-glasses) | 음료 바가 모양은 좋지만 2.3 MB(2048²)라 최적화 필수. 카운터 본체는 절차 생성, 위 소품만 모델로 쓰는 절충도 가능 |
| 슬롯머신 | [`convenience-lottery-pictogram-terminal-cottage-normal`](https://karchive.vibeline.co.kr/models/convenience-lottery-pictogram-terminal-cottage-normal), [`angular-onsen-drink-vending-machine`](https://karchive.vibeline.co.kr/models/angular-onsen-drink-vending-machine) | **적합한 모델 없음.** 복권 단말이 가장 가깝지만 슬롯머신은 아님. 현행 유지 |
| 우편함·가로등·벤치·나무(`mailbox/lamp/bench/tree`) | [`common-infrastructure-street-lamp-column-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-street-lamp-column-civic-normal), [`common-nature-small-birch-tree-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-small-birch-tree-cottage-normal), [`common-nature-small-pine-tree-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-small-pine-tree-cottage-normal) | 인스턴싱 중인 가벼운 도형이라 **교체 이득이 작음.** 포인트 위치에만 섞어 쓰기 |

## 3. 위치별 후보

우선순위 기준 — 상: 절차 생성물을 바로 대체하거나 핵심 장소에 필요, 1 MB 이하 · 중: 분위기 향상 또는 1–3 MB · 하: 있으면 좋음, 무겁거나 스타일·테마 위험.

### 3-1. 마을 외관·자연/계절

| 모델 | 용량 | 맞는 이유 | 우선 | 위험 |
|---|---|---|---|---|
| [`common-nature-cattail-reed-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-cattail-reed-clump-cottage-normal) 부들 | 0.5 MB | 강·연못 가장자리. 낚시터 분위기 | 상 | 없음 |
| [`common-nature-pond-lily-leaf-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-pond-lily-leaf-clump-cottage-normal) 연잎 | 0.5 MB | 연못 수면 장식 | 중 | 수면 높이 맞춤 |
| [`common-nature-small-birch-tree-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-small-birch-tree-cottage-normal) 자작나무 | 0.4 MB | 기존 과일나무와 같은 계열 | 중 | 인스턴싱 필요 |
| [`common-nature-small-pine-tree-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-small-pine-tree-cottage-normal) 소나무 | 0.4 MB | 숲 가장자리 | 중 | 인스턴싱 필요 |
| [`common-nature-rounded-boxwood-shrub-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-rounded-boxwood-shrub-cottage-normal) 회양목 | 0.6 MB | 집 앞 화단 | 중 | — |
| [`common-nature-flowering-daisy-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-flowering-daisy-clump-cottage-normal) 데이지 | 0.6 MB | 튤립·수국과 세트 | 중 | — |
| [`common-nature-sunflower-stalk-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-sunflower-stalk-clump-cottage-normal) 해바라기 | 0.6 MB | 여름 화단 | 하 | — |
| [`common-nature-mushroom-cluster-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-mushroom-cluster-cottage-normal) 버섯 무리 | 0.5 MB | 채집 포인트 표시로 쓰기 좋음 | 중 | — |
| [`common-nature-smooth-river-boulder-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-smooth-river-boulder-cottage-normal) 강돌 | 0.4 MB | 강가 | 하 | — |
| [`common-nature-driftwood-branch-cluster-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-driftwood-branch-cluster-cottage-normal) 유목 | 0.5 MB | 바다 부두 해변 | 하 | — |
| [`common-fences-rounded-wooden-picket-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-rounded-wooden-picket-fence-straight-normal) 둥근 나무 울타리(end·corner·junction 있음) | 0.2 MB | 밭·집 경계. 모듈식 | 상 | 개수가 많으면 인스턴싱 |
| [`common-fences-hedge-topiary-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-hedge-topiary-fence-straight-normal) 생울타리 | 0.4 MB | 광장 테두리 | 하 | — |
| [`common-fences-woven-willow-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-woven-willow-fence-straight-normal) 버들 울타리 | 0.4 MB | 농장 시골 느낌 | 하 | — |
| [`angular-onsen-wisteria-pergola`](https://karchive.vibeline.co.kr/models/angular-onsen-wisteria-pergola) 등나무 쉼터(각진) | 0.8 MB | 광장·정원 포인트. 보라 꽃 | 상 | 동글동글판 [`onsen-wisteria-pergola`](https://karchive.vibeline.co.kr/models/onsen-wisteria-pergola)는 3.6 MB라 각진판 권장 |
| [`angular-onsen-arched-garden-gate`](https://karchive.vibeline.co.kr/models/angular-onsen-arched-garden-gate) 정원 아치문 | 0.7 MB | 마을 입구·축제장 입구 | 중 | 동글판은 2.1 MB |
| [`common-infrastructure-street-lamp-column-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-street-lamp-column-civic-normal) 가로등 | 0.4 MB | 광장 가로등 | 하 | 조명은 코드에서 따로 |
| [`common-infrastructure-road-direction-sign-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-road-direction-sign-civic-normal) 방향 표지판 | 0.3 MB | 갈림길 안내 | 중 | 화살표 글자 없음, 괜찮음 |
| [`common-infrastructure-park-trash-bin-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-park-trash-bin-civic-normal) 공원 쓰레기통 | 0.4 MB | 광장 소품 | 하 | — |
| [`lp-sp-01`](https://karchive.vibeline.co.kr/models/lp-sp-01) 벚나무(만개) | 3.3 MB | 봄 축제 포인트 나무 | 중 | 2048² 텍스처·받침 흙. 최적화 필수 |
| [`lp-au-01`](https://karchive.vibeline.co.kr/models/lp-au-01) 붉은 단풍 / [`lp-au-02`](https://karchive.vibeline.co.kr/models/lp-au-02) 은행 | 2.7 MB / 2.4 MB | 가을 계절 교체 | 중 | 각 2.4–2.7 MB |
| [`lp-wi-01`](https://karchive.vibeline.co.kr/models/lp-wi-01) 눈 덮인 소나무 | 2.6 MB | 겨울 | 하 | 2.6 MB |

### 3-2. 농사·온실

| 모델 | 용량 | 맞는 이유 | 우선 | 위험 |
|---|---|---|---|---|
| [`common-buildings-greenhouse-building-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-greenhouse-building-compact-normal) 온실 | 0.9 MB | **절차 생성 온실 교체.** 실측 922,920 B, 8.9k 삼각형 | 상 | 내부가 막혀 있으면 내부 진입 연출은 별도 |
| [`common-buildings-greenhouse-building-duplex-normal`](https://karchive.vibeline.co.kr/models/common-buildings-greenhouse-building-duplex-normal) 온실(2동) | 0.9 MB | '온실 확장' 공공사업 완료 후 모습 | 중 | — |
| [`angular-common-nature-vegetable-bed-soil-empty`](https://karchive.vibeline.co.kr/models/angular-common-nature-vegetable-bed-soil-empty) 빈 텃밭 틀 | 0.4 MB | 밭 칸의 틀. 작물은 기존 코드로 | 상 | 밭 칸 크기(1칸)에 맞춰 스케일 |
| [`angular-common-nature-vegetable-bed-seedlings`](https://karchive.vibeline.co.kr/models/angular-common-nature-vegetable-bed-seedlings) / [`angular-common-nature-vegetable-bed-mature-crops`](https://karchive.vibeline.co.kr/models/angular-common-nature-vegetable-bed-mature-crops) | 0.5 MB / 0.7 MB | 성장 단계 시각화(대표 이미지·상점) | 중 | 10작물 구분은 안 됨 |
| [`angular-common-nature-herb-bed-mature-herbs`](https://karchive.vibeline.co.kr/models/angular-common-nature-herb-bed-mature-herbs) 허브 화단 | 0.5 MB | 부엌 텃밭 | 하 | — |
| [`common-nature-berry-bush-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-berry-bush-cottage-normal) 베리 덤불 | 0.5 MB | 채집·과일 | 중 | — |
| [`common-buildings-garden-tool-shed-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-garden-tool-shed-compact-normal) 농기구 창고 | 0.7 MB | 밭 옆 창고·출하함 | 중 | — |
| [`common-buildings-grain-storage-building-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-grain-storage-building-compact-normal) 곡물 창고 | 0.7 MB | 헛간(동물 추가 시 겸용) | 하 | — |
| [`angular-restaurant-produce-crate-vegetables`](https://karchive.vibeline.co.kr/models/angular-restaurant-produce-crate-vegetables) 채소 상자 | 0.5 MB | 출하함·시장 가판 | 중 | — |
| [`lp-au-04`](https://karchive.vibeline.co.kr/models/lp-au-04) 허수아비 | 3.1 MB | 밭 상징물 | 중 | 3.1 MB |
| [`lp-sp-14`](https://karchive.vibeline.co.kr/models/lp-sp-14) 벌통과 벌 | 2.6 MB | 꿀·양봉 확장 | 하 | 2.6 MB |
| [`lp-sp-15`](https://karchive.vibeline.co.kr/models/lp-sp-15) 모종 선반 | 2.5 MB | 씨앗 상점 | 하 | 2.5 MB |
| [`lp-au-06`](https://karchive.vibeline.co.kr/models/lp-au-06) 볏단 더미 | 2.4 MB | 가을 수확 장식 | 하 | 2.4 MB |
| `crop-*` 100종(예: [`crop-carrot`](https://karchive.vibeline.co.kr/models/crop-carrot)) | 2.4 MB | 작물 아이콘·도감 | 하 | 개당 2–4.5 MB라 인게임 작물로는 과함. 2D 아이콘으로 구워 쓰는 용도만 |

### 3-3. 낚시·부두

| 모델 | 용량 | 맞는 이유 | 우선 | 위험 |
|---|---|---|---|---|
| [`angular-common-infrastructure-timber-deck-flat`](https://karchive.vibeline.co.kr/models/angular-common-infrastructure-timber-deck-flat) 1m 목재 데크 타일 | 0.4 MB | **절차 생성 부두 바닥 교체** | 상 | 타일 반복이 보임. 인스턴싱 |
| [`common-fences-harbor-bollard-chain-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-harbor-bollard-chain-fence-straight-normal) 항구 계류주+사슬(end·corner 있음) | 0.3 MB | 부두 난간. 실측 296,368 B | 상 | — |
| [`common-fences-rope-and-timber-post-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-rope-and-timber-post-fence-straight-normal) 밧줄 말뚝 울타리 | 0.3 MB | 강 낚시터 경계 | 중 | — |
| [`apocalypse-rescue-flotation-gear-rack-cottage-normal`](https://karchive.vibeline.co.kr/models/apocalypse-rescue-flotation-gear-rack-cottage-normal) 구명환 거치대 | 0.6 MB | 부두 소품 | 중 | 좀비 컬렉션 소속이지만 모양은 평범함 |
| [`restaurant-seafood-grill-hut-cottage-normal`](https://karchive.vibeline.co.kr/models/restaurant-seafood-grill-hut-cottage-normal) 해산물 구이 오두막 | 0.8 MB | 부두 옆 매점·낚시 상점 | 중 | — |
| [`lp-su-14`](https://karchive.vibeline.co.kr/models/lp-su-14) 등대 | 2.8 MB | 바다 부두 끝 랜드마크 | 중 | 2.8 MB, 받침 섬 포함 |
| [`lp-wi-10`](https://karchive.vibeline.co.kr/models/lp-wi-10) 얼음낚시 텐트 | 2.4 MB | 겨울 낚시 이벤트 | 하 | 2.4 MB |
| `fish-*` 300종(예: [`fish-mackerel`](https://karchive.vibeline.co.kr/models/fish-mackerel) 실측 3,925,688 B) | 3.7 MB | 박물관 수조 전시, 낚은 물고기 연출 | 하 | **개당 3.5–4.4 MB, 2048² 텍스처.** 몇 종만 1024²로 줄여서 써야 함 |

### 3-4. 박물관·게시판

| 모델 | 용량 | 맞는 이유 | 우선 | 위험 |
|---|---|---|---|---|
| [`common-infrastructure-public-notice-board-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-public-notice-board-civic-normal) 게시판 | 0.4 MB | **절차 생성 게시판 교체.** 실측 432,848 B | 상 | — |
| [`common-buildings-public-library-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-public-library-compact-normal) 공공도서관 | 0.7 MB | **박물관 파빌리온 교체** 후보 1 | 상 | 도서관 외형이지만 간판이 없어 박물관으로 써도 됨 |
| [`common-buildings-park-visitor-center-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-park-visitor-center-compact-normal) 공원 방문자 센터 | 0.7 MB | 박물관 후보 2 | 중 | — |
| [`common-furniture-corner-display-cabinet-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-corner-display-cabinet-cottage-normal) 코너 진열장 | 0.5 MB | 박물관 내부 전시장 | 중 | — |
| [`common-buildings-weather-station-cabin-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-weather-station-cabin-compact-normal) 기상관측소 | 0.7 MB | 계절·날씨 안내소 | 하 | — |

### 3-5. 범마을 회관(섯다·고스톱)

| 모델 | 용량 | 맞는 이유 | 우선 | 위험 |
|---|---|---|---|---|
| [`dongji-12`](https://karchive.vibeline.co.kr/models/dongji-12) 겨울 한옥 | 0.7 MB | **회관 외관 교체** 후보. 한옥 톤이 '범마을'과 맞음 | 상 | 겨울판(눈 느낌). 작은 크기라 확대 필요 |
| [`extra-hanok-wall`](https://karchive.vibeline.co.kr/models/extra-hanok-wall) 한옥 기와 담장 | 0.4 MB | 회관 마당 경계 | 중 | — |
| [`common-furniture-square-card-table-heritage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-square-card-table-heritage-normal) 정사각 카드 테이블 | 0.5 MB | **섯다·고스톱 테이블 교체** | 상 | 상판 색은 머티리얼 틴트로 맞추기 |
| [`dongji-11`](https://karchive.vibeline.co.kr/models/dongji-11) 한지 등 | 0.3 MB | 회관 실내 조명 | 중 | — |
| [`dongji-05`](https://karchive.vibeline.co.kr/models/dongji-05) 전통 소반 / [`hangul-08`](https://karchive.vibeline.co.kr/models/hangul-08) 서안 | 0.3 MB / 0.3 MB | 좌식 소품·간식 상 | 중 | — |
| [`dongji-06`](https://karchive.vibeline.co.kr/models/dongji-06) 옹기 항아리 | 0.2 MB | 마당 소품 | 하 | — |
| [`lp-sp-19`](https://karchive.vibeline.co.kr/models/lp-sp-19) 청사초롱 봄 가로등 | 2.6 MB | 회관 입구 | 중 | 2.6 MB |
| [`angular-onsen-kotatsu`](https://karchive.vibeline.co.kr/models/angular-onsen-kotatsu) 코타츠(각진) | 0.4 MB | 겨울 한정 좌식 게임석 | 하 | 일본풍 |
| [`angular-common-furniture-screen-divider-zigzag-open`](https://karchive.vibeline.co.kr/models/angular-common-furniture-screen-divider-zigzag-open) 병풍형 칸막이 | 0.5 MB | 테이블 사이 구분 | 중 | — |
| [`angular-onsen-relaxation-bench-tea-tray`](https://karchive.vibeline.co.kr/models/angular-onsen-relaxation-bench-tea-tray) 찻상 벤치 | 0.4 MB | 대기석 | 하 | — |

### 3-6. 별빛 카지노 / VIP룸

| 모델 | 용량 | 맞는 이유 | 우선 | 위험 |
|---|---|---|---|---|
| [`common-furniture-round-back-banquet-chair-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-round-back-banquet-chair-cottage-normal) 연회용 의자 | 0.4 MB | **게임 테이블 의자 교체** | 상 | — |
| [`angular-restaurant-bar-stool-cushion`](https://karchive.vibeline.co.kr/models/angular-restaurant-bar-stool-cushion) 쿠션 바 의자 | 0.5 MB | **바 의자 교체** | 상 | 동글판 [`restaurant-bar-stool`](https://karchive.vibeline.co.kr/models/restaurant-bar-stool)은 1.8 MB(2048²) |
| [`restaurant-restaurant-queue-rope-post-heritage-normal`](https://karchive.vibeline.co.kr/models/restaurant-restaurant-queue-rope-post-heritage-normal) 차단봉(빨간 줄) | 0.4 MB | **VIP룸 입구** 상징 | 상 | — |
| [`common-furniture-square-card-table-streamline-normal`](https://karchive.vibeline.co.kr/models/common-furniture-square-card-table-streamline-normal) 녹색 상판 카드 테이블 | 0.4 MB | 체스·홀덤 보조석 | 중 | 홀덤 타원형은 아님 |
| [`common-furniture-round-cafe-table-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-round-cafe-table-cottage-normal) 원형 카페 테이블 | 0.4 MB | 라운지 | 중 | — |
| [`common-furniture-bucket-lounge-chair-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-bucket-lounge-chair-cottage-normal) 라운지 의자 | 0.5 MB | VIP룸 소파석 | 중 | — |
| [`restaurant-booth-seat`](https://karchive.vibeline.co.kr/models/restaurant-booth-seat) 부스 좌석 | 2.1 MB | VIP룸 | 중 | 2.1 MB. 대안 [`angular-restaurant-booth-bench-seat-cushions`](https://karchive.vibeline.co.kr/models/angular-restaurant-booth-bench-seat-cushions)(0.3) |
| [`restaurant-floor-lamp`](https://karchive.vibeline.co.kr/models/restaurant-floor-lamp) 스탠드 조명 | 1.9 MB | 분위기 | 하 | 1.9 MB |
| [`restaurant-beverage-bar`](https://karchive.vibeline.co.kr/models/restaurant-beverage-bar) 음료 바 | 2.3 MB | **바 카운터 교체** 후보 | 중 | 2.3 MB. 최적화 필수 |
| [`angular-restaurant-soda-fountain-ready`](https://karchive.vibeline.co.kr/models/angular-restaurant-soda-fountain-ready) / [`angular-restaurant-glassware-rack-full-glasses`](https://karchive.vibeline.co.kr/models/angular-restaurant-glassware-rack-full-glasses) | 0.5 MB / 0.5 MB | 바 위 소품 | 하 | — |
| [`convenience-lottery-pictogram-terminal-cottage-normal`](https://karchive.vibeline.co.kr/models/convenience-lottery-pictogram-terminal-cottage-normal) 복권 단말 | 0.5 MB | 슬롯머신 대용 | 하 | 슬롯머신처럼 안 보임 |
| [`restaurant-checker-floor`](https://karchive.vibeline.co.kr/models/restaurant-checker-floor) 체커 바닥 | 1.7 MB | 카지노 바닥 | 하 | 1.7 MB. 텍스처 바닥은 코드가 더 가벼움 |
| [`newyear-06`](https://karchive.vibeline.co.kr/models/newyear-06) 샴페인 병 | 0.4 MB | VIP 테이블 소품 | 하 | — |
| [`restaurant-bistro-facade`](https://karchive.vibeline.co.kr/models/restaurant-bistro-facade) 비스트로 외관 | 2.4 MB | 카지노 외관 대안 | 하 | 식당 느낌, 2.4 MB |

### 3-7. 축제 무대·광장 분수

| 모델 | 용량 | 맞는 이유 | 우선 | 위험 |
|---|---|---|---|---|
| [`newyear-11`](https://karchive.vibeline.co.kr/models/newyear-11) 카운트다운 무대 | 0.4 MB | **'마을 축제 무대' 공공사업 결과물.** 반원 무대+별 장식. 실측 449,036 B | 상 | 새해 테마 장식(별)이 있음 |
| [`newyear-12`](https://karchive.vibeline.co.kr/models/newyear-12) 불꽃 분수 | 0.3 MB | 축제 밤 연출 | 중 | 진짜 물 분수 아님 |
| [`newyear-05`](https://karchive.vibeline.co.kr/models/newyear-05) 풍선 묶음 | 0.3 MB | 축제 장식 | 중 | — |
| [`newyear-01`](https://karchive.vibeline.co.kr/models/newyear-01) 새해 종 | 0.4 MB | 연말 행사 | 하 | — |
| [`extra-party-table`](https://karchive.vibeline.co.kr/models/extra-party-table) 파티 원형 테이블 | 0.3 MB | 축제 음식 테이블 | 중 | — |
| [`common-infrastructure-street-vending-canopy-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-street-vending-canopy-civic-normal) 노점 차양 | 0.5 MB | 축제 가판 | 중 | — |
| [`icecream-icecream-cart-umbrella-stand-cottage-normal`](https://karchive.vibeline.co.kr/models/icecream-icecream-cart-umbrella-stand-cottage-normal) 아이스크림 수레 | 0.5 MB | 여름 축제 | 중 | — |
| [`icecream-sundae-terrace-pavilion-cottage-normal`](https://karchive.vibeline.co.kr/models/icecream-sundae-terrace-pavilion-cottage-normal) 선데 테라스 정자 | 0.8 MB | 축제장 쉼터 | 하 | — |
| [`common-infrastructure-public-clock-column-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-public-clock-column-civic-normal) 광장 시계탑 | 0.5 MB | 광장 중심 | 중 | — |
| [`common-infrastructure-public-drinking-fountain-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-public-drinking-fountain-civic-normal) 음수대 | 0.4 MB | 분수 공사 전 임시물 | 하 | 분수가 아님 |
| [`christmas`](https://karchive.vibeline.co.kr/models/christmas) 크리스마스트리 | 2.6 MB | 겨울 축제 | 중 | 2.6 MB. 가벼운 [`christmas-06`](https://karchive.vibeline.co.kr/models/christmas-06) 장식 전 트리(0.3) 있음 |
| [`halloween-13`](https://karchive.vibeline.co.kr/models/halloween-13) 호박 랜턴 | 0.3 MB | 가을 축제 | 중 | — |
| [`lp-wi-04`](https://karchive.vibeline.co.kr/models/lp-wi-04) 붕어빵 포장마차 / [`lp-su-08`](https://karchive.vibeline.co.kr/models/lp-su-08) 빙수 수레 | 2.5 MB / 2.8 MB | 계절 노점 | 하 | 각 2.5–2.8 MB |
| [`lp-au-18`](https://karchive.vibeline.co.kr/models/lp-au-18) 캠프파이어 | 2.5 MB | 가을 밤 행사 | 하 | 2.5 MB |

### 3-8. 방 가구·상점 판매용

(이미 사용 중: 소파, 오픈 책장, 화분 선반, 티 테이블 + 3DAssets CC0 가구 11종)

| 모델 | 용량 | 맞는 이유 | 우선 | 위험 |
|---|---|---|---|---|
| [`common-furniture-rocking-chair-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-rocking-chair-cottage-normal) 흔들의자 | 0.5 MB | 가구점 인기 품목. 실측 481,632 B | 상 | — |
| [`common-furniture-reading-armchair-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-reading-armchair-cottage-normal) 독서 안락의자 | 0.5 MB | 방 | 중 | — |
| [`common-furniture-television-media-console-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-television-media-console-cottage-normal) TV 장식장 | 0.4 MB | 방 | 중 | — |
| [`common-furniture-audio-equipment-console-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-audio-equipment-console-cottage-normal) 오디오 콘솔 | 0.5 MB | 음악 좋아하는 친구 방 | 중 | — |
| [`common-furniture-wall-shelf-unit-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-wall-shelf-unit-cottage-normal) 벽 선반 | 0.5 MB | 방 | 중 | — |
| [`common-furniture-coat-and-shoe-hall-stand-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-coat-and-shoe-hall-stand-cottage-normal) 옷걸이·신발장 | 0.5 MB | 현관 | 하 | — |
| [`angular-common-furniture-storage-trunk-closed`](https://karchive.vibeline.co.kr/models/angular-common-furniture-storage-trunk-closed) 트렁크 | 0.5 MB | 수납 | 하 | — |
| [`angular-common-furniture-bedside-cabinet-book-and-lamp`](https://karchive.vibeline.co.kr/models/angular-common-furniture-bedside-cabinet-book-and-lamp) 협탁 | 0.4 MB | 방 | 하 | 기존 CC0 협탁과 겹침 |
| [`angular-common-furniture-drawer-dresser-closed`](https://karchive.vibeline.co.kr/models/angular-common-furniture-drawer-dresser-closed) 서랍장 | 0.4 MB | 방 | 하 | — |
| [`angular-common-nature-cactus-planter-young-cactus`](https://karchive.vibeline.co.kr/models/angular-common-nature-cactus-planter-young-cactus) 선인장 화분 | 0.5 MB | 소형 소품 | 중 | — |
| [`angular-onsen-tea-sideboard-tea-service`](https://karchive.vibeline.co.kr/models/angular-onsen-tea-sideboard-tea-service) 다기 찬장 | 0.4 MB | 부엌·방 | 하 | — |
| [`angular-onsen-massage-chair-upright`](https://karchive.vibeline.co.kr/models/angular-onsen-massage-chair-upright) 안마의자 | 0.4 MB | 재미 가구 | 하 | 동글판은 2.0 MB |
| [`christmas-23`](https://karchive.vibeline.co.kr/models/christmas-23) 벽난로 / [`christmas-28`](https://karchive.vibeline.co.kr/models/christmas-28) 스노글로브 | 0.5 MB / 0.3 MB | 겨울 한정 판매 | 중 | — |

### 3-9. 집 확장·부엌·제작

| 모델 | 용량 | 맞는 이유 | 우선 | 위험 |
|---|---|---|---|---|
| [`common-buildings-small-family-house-duplex-normal`](https://karchive.vibeline.co.kr/models/common-buildings-small-family-house-duplex-normal) 주택 2층형 | 0.6 MB | **집 확장 2단계 외관.** 이미 쓰는 compact·corner·courtyard와 같은 세트 | 상 | — |
| [`common-buildings-townhouse-entrance-module-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-townhouse-entrance-module-compact-normal) 타운하우스 | 0.7 MB | 확장 3단계 | 중 | — |
| [`common-buildings-post-office-building-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-post-office-building-compact-normal) 우체국 | 0.6 MB | 편지·택배 기능 | 중 | — |
| [`common-buildings-corner-retail-shell-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-corner-retail-shell-compact-normal) 모퉁이 상점 | 0.7 MB | **가구점 외관** | 중 | 기존 `buildWardrobeShop`과 역할 겹침 |
| [`common-buildings-community-workshop-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-community-workshop-compact-normal) 공방 | 0.8 MB | 제작 작업장 | 중 | — |
| [`rounded-restaurant-cooking-range-one-pot`](https://karchive.vibeline.co.kr/models/rounded-restaurant-cooking-range-one-pot) 조리 레인지 | 0.5 MB | 부엌·요리 | 중 | 대표판 [`restaurant-cooking-range`](https://karchive.vibeline.co.kr/models/restaurant-cooking-range)는 2.5 MB |
| [`angular-restaurant-sink-unit-empty-dry`](https://karchive.vibeline.co.kr/models/angular-restaurant-sink-unit-empty-dry) 싱크대 | 0.4 MB | 부엌 | 하 | — |
| [`rounded-restaurant-prep-workbench-vegetable-prep`](https://karchive.vibeline.co.kr/models/rounded-restaurant-prep-workbench-vegetable-prep) 조리 작업대 | 0.6 MB | 요리 | 중 | — |
| [`rounded-restaurant-rice-cooker-closed`](https://karchive.vibeline.co.kr/models/rounded-restaurant-rice-cooker-closed) 밥솥 | 0.4 MB | 한국 부엌 소품 | 하 | — |
| [`angular-apocalypse-survival-workbench-repair-tools`](https://karchive.vibeline.co.kr/models/angular-apocalypse-survival-workbench-repair-tools) 작업대 | 0.6 MB | 제작대 | 중 | 좀비 컬렉션이지만 모양은 평범한 목공 작업대 |
| [`angular-apocalypse-tool-chest-open-empty`](https://karchive.vibeline.co.kr/models/angular-apocalypse-tool-chest-open-empty) 공구함 | 0.5 MB | 제작 | 하 | — |

### 3-10. 동물(후보)

**농장 동물(닭·소·양·돼지)은 카탈로그에 없음.** 있는 것은 명절·계절 캐릭터 동물뿐이며, 모두 치비풍이라 NPC나 장식으로만 가능함.

| 모델 | 용량 | 맞는 이유 | 우선 | 위험 |
|---|---|---|---|---|
| [`halloween-03`](https://karchive.vibeline.co.kr/models/halloween-03) 검은 고양이 | 0.3 MB | 마을 고양이 NPC | 중 | 보라 리본(할로윈) |
| [`gaecheon-02`](https://karchive.vibeline.co.kr/models/gaecheon-02) 곰 / [`gaecheon-03`](https://karchive.vibeline.co.kr/models/gaecheon-03) 호랑이 | 0.3 MB / 0.5 MB | '범마을' 마스코트 호랑이! 실측 495,612 B | 상(호랑이) | 서 있는 인형 포즈. 애니메이션 없음 |
| [`exam-12`](https://karchive.vibeline.co.kr/models/exam-12) 합격 부엉이 | 0.5 MB | 박물관 관장 NPC 느낌 | 중 | 학사모 |
| [`christmas-02`](https://karchive.vibeline.co.kr/models/christmas-02) 루돌프 | 0.4 MB | 겨울 | 하 | — |
| [`lp-sp-21`](https://karchive.vibeline.co.kr/models/lp-sp-21) 강아지 / [`lp-su-21`](https://karchive.vibeline.co.kr/models/lp-su-21) 밀짚모자 강아지 | 2.1 MB / 2.5 MB | 반려동물 | 하 | 2.1–2.5 MB, 받침 포함 |
| [`lp-au-16`](https://karchive.vibeline.co.kr/models/lp-au-16) 도토리 다람쥐 / [`lp-wi-18`](https://karchive.vibeline.co.kr/models/lp-wi-18) 노루 | 2.5 MB / 2.8 MB | 숲 장식 | 하 | 2.5–2.8 MB |
| [`apocalypse-animal-rescue-shelter-heritage-normal`](https://karchive.vibeline.co.kr/models/apocalypse-animal-rescue-shelter-heritage-normal) 동물 보호소 | 0.7 MB | 반려동물 입양소 건물 | 하 | 좀비 컬렉션. normal판은 평범함 |
| [`onsen-pet-washing-suite-cottage-normal`](https://karchive.vibeline.co.kr/models/onsen-pet-washing-suite-cottage-normal) 펫 목욕 부스 | 0.7 MB | 반려동물 관리 | 하 | — |

모든 GLB는 정적 메시이며 **리깅·애니메이션이 없음**. 걷는 동물은 코드로 통통 튀는 이동만 가능함.

### 3-11. 기타(상점·잡화)

| 모델 | 용량 | 맞는 이유 | 우선 | 위험 |
|---|---|---|---|---|
| [`angular-convenience-gondola-shelf-full-stocked`](https://karchive.vibeline.co.kr/models/angular-convenience-gondola-shelf-full-stocked) 진열 곤돌라 | 0.7 MB | 잡화점 | 하 | 편의점 느낌 |
| [`angular-convenience-checkout-counter-shopping-goods`](https://karchive.vibeline.co.kr/models/angular-convenience-checkout-counter-shopping-goods) 계산대 | 0.5 MB | 상점 | 하 | — |
| [`angular-convenience-shopping-handbasket-full-groceries`](https://karchive.vibeline.co.kr/models/angular-convenience-shopping-handbasket-full-groceries) 장바구니 | 0.4 MB | 시장 소품 | 하 | — |
| [`common-infrastructure-bicycle-parking-hoop-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-bicycle-parking-hoop-civic-normal) 자전거 거치대 | 0.4 MB | 마을 소품 | 하 | — |
| [`common-furniture-public-chess-bench-table-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-public-chess-bench-table-cottage-normal) 야외 체스 테이블 | 0.4 MB | 카지노 앞·광장에 체스 미니게임 입구 | 중 | — |
| [`common-furniture-long-community-table-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-long-community-table-cottage-normal) 긴 공동 식탁 | 0.5 MB | 마을 잔치 | 중 | — |
| [`common-furniture-circular-tree-bench-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-circular-tree-bench-cottage-normal) 나무 둘레 벤치 | 0.5 MB | 광장 큰 나무 아래 | 중 | — |

**제외한 것**: 철도 모듈 420개(레일 게임용), 철조망·공사 울타리, 좀비·대피소 건물 대부분, 한국 도시 야경(아파트·타워), 헨젤과 그레텔(과자 동화 테마라 톤이 다름), 파손형 전부.

## 4. 최종 추천 Top 15

| # | 모델 | 용량 | 들어갈 곳 / 교체 대상 |
|---|---|---|---|
| 1 | [`common-buildings-greenhouse-building-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-greenhouse-building-compact-normal) | 0.9 MB | 온실(절차 생성 교체) |
| 2 | [`common-infrastructure-public-notice-board-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-public-notice-board-civic-normal) | 0.4 MB | 마을 게시판(교체) |
| 3 | [`angular-common-nature-vegetable-bed-soil-empty`](https://karchive.vibeline.co.kr/models/angular-common-nature-vegetable-bed-soil-empty) | 0.4 MB | 밭 칸 틀(작물은 코드 유지) |
| 4 | [`angular-common-infrastructure-timber-deck-flat`](https://karchive.vibeline.co.kr/models/angular-common-infrastructure-timber-deck-flat) | 0.4 MB | 부두 바닥(교체) |
| 5 | [`common-fences-harbor-bollard-chain-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-harbor-bollard-chain-fence-straight-normal) | 0.3 MB | 부두 난간 |
| 6 | [`common-buildings-public-library-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-public-library-compact-normal) | 0.7 MB | 박물관 파빌리온(교체) |
| 7 | [`dongji-12`](https://karchive.vibeline.co.kr/models/dongji-12) | 0.7 MB | 범마을 회관 외관(교체 검토) |
| 8 | [`common-furniture-square-card-table-heritage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-square-card-table-heritage-normal) | 0.5 MB | 섯다·고스톱 테이블 |
| 9 | [`common-furniture-round-back-banquet-chair-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-round-back-banquet-chair-cottage-normal) | 0.4 MB | 회관·카지노 의자 |
| 10 | [`angular-restaurant-bar-stool-cushion`](https://karchive.vibeline.co.kr/models/angular-restaurant-bar-stool-cushion) | 0.5 MB | 카지노 바 의자 |
| 11 | [`restaurant-restaurant-queue-rope-post-heritage-normal`](https://karchive.vibeline.co.kr/models/restaurant-restaurant-queue-rope-post-heritage-normal) | 0.4 MB | 카지노 VIP룸 입구 |
| 12 | [`newyear-11`](https://karchive.vibeline.co.kr/models/newyear-11) | 0.4 MB | 마을 축제 무대 |
| 13 | [`angular-onsen-wisteria-pergola`](https://karchive.vibeline.co.kr/models/angular-onsen-wisteria-pergola) | 0.8 MB | 광장·정원 쉼터 |
| 14 | [`common-fences-rounded-wooden-picket-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-rounded-wooden-picket-fence-straight-normal) | 0.2 MB | 밭·집 울타리 |
| 15 | [`common-furniture-rocking-chair-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-rocking-chair-cottage-normal) | 0.5 MB | 가구점 판매 |

- **Top 15 원본 합계: 약 7.5 MB (15개).** 모두 1 MB 이하라 표본 패턴상 텍스처는 1024² 1장으로 추정됨(온실·게시판·흔들의자·계류주 울타리·축제 무대 5개는 실측으로 확인). 기존 최적화 비율(약 66%)을 적용하면 배포 크기는 **약 5.0 MB로 추정**됨.
- 차순위 5개: [`common-buildings-small-family-house-duplex-normal`](https://karchive.vibeline.co.kr/models/common-buildings-small-family-house-duplex-normal)(집 확장), [`gaecheon-03`](https://karchive.vibeline.co.kr/models/gaecheon-03)(호랑이 마스코트), [`common-nature-cattail-reed-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-cattail-reed-clump-cottage-normal)(물가), [`lp-au-04`](https://karchive.vibeline.co.kr/models/lp-au-04)(허수아비), [`restaurant-beverage-bar`](https://karchive.vibeline.co.kr/models/restaurant-beverage-bar)(바 카운터, 최적화 필수).
- 이 문서의 후보 전체(중복 제외 146개)를 받으면 원본 약 **133.3 MB**임. 그중 2 MB 이상이 27개, 합계 71.3 MB로 절반 이상을 차지함. 이것들은 1024² 재인코딩 없이 넣지 않는 것을 권장함.

## 5. 공통 위험·주의

1. **라이선스**: CC 아님, 원본 재판매 금지, 출처 표기 필수. 새로 받는 모델도 `assets.json`에 원본 URL·SHA-256·다운로드일·당시 약관 문구를 남기고, 화면 크레딧과 `#third-party-licenses`에 추가해야 함. 약관이 페이지 문구로만 있으므로 스크린샷이나 문구 사본을 보관하는 것이 좋음.
2. **텍스처 수**: 모델마다 1024²(대표판·사계절·농작물·생선은 2048²) 텍스처가 1장씩임. 종류를 20개 이상 늘리면 모바일 GPU 메모리(1024²당 약 5 MB)가 부담됨. 가능하면 아틀라스로 합치거나 512²로 줄이는 것을 검토.
3. **스타일**: 동글동글 계열은 기존 kArchive 주택과 일치함. 각진 계열은 채도가 약간 낮음. 사계절·명절 모델은 디오라마 받침(흙판·눈판)이 붙은 경우가 있어 바닥과 겹침 처리가 필요함. 명절 캐릭터는 더 치비풍임.
4. **크기·축척**: 모델마다 단위가 제각각이라 기존처럼 바운딩 박스로 맞춰야 함. 회관 한옥(dongji-12)과 명절 소품은 작게 만들어져 있음.
5. **충돌·상호작용**: 단일 메시라 문·창문이 분리돼 있지 않음. 입장 트리거와 충돌 박스는 기존처럼 코드에서 따로 정의해야 함.
6. **대체 불가 항목**: 카지노 외관, 슬롯머신, 블랙잭·홀덤 전용 테이블, 보행교(다리), 물 분수, 농장 동물은 카탈로그에 맞는 모델이 없음. 이 항목들은 절차 생성을 유지하거나 다른 출처를 써야 함.
