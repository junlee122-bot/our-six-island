# kArchive 마을 확장 후보 조사 — 범타듀 밸리 (농장 마당·낚시터·자연 채움·랜드마크)

- 조사일: 2026-09-26 · 대상: `scratchpad/kcatalog.json`(6,691개, 09-25 수집)과 썸네일 · 페이지 주소는 `https://karchive.vibeline.co.kr/models/<slug>` 형식임
- 방법: 카탈로그를 품목 계열별로 묶어 훑고(공통 자연·기반시설·울타리·건물 계열, 온천·세기말·레스토랑 계열, 사계절 `lp-*`, 명절, 야경 `kc-*`), 후보 **171개**의 썸네일로 시트를 만들어 눈으로 봤음(`scratchpad/vx/s1-*.png`, `s2-*.png`, `s3-0.png`). 대표 GLB **14개**는 `scratchpad/vx/glb/`에만 받아 바이트·삼각형·텍스처·크기를 쟀음(저장소에는 받지 않음).
- 제외: 이전 보고서 Top 15(온실, 게시판, 텃밭 틀, 데크 타일, 계류주 울타리, 도서관, dongji-12, 카드 테이블, 연회 의자, 바 스툴, 줄 기둥, newyear-11, 등나무 쉼터, 피켓 울타리, 흔들의자). **저장소에 이미 들어간 것**(`public/models/village/**/assets.json`): 주택 3종, 과일나무, 수국, 그리고 확장용 `picnicTable`(육각 피크닉 테이블), `parkBench`(L자 벤치), `gardenLantern`(석등 `angular-onsen-garden-lantern-candle-insert`). 이것들은 후보에서 뺐고 배치 설명에서만 언급함. 이전 보고서 후보(Top 15 밖)는 새 용도에 맞으면 "(이전 후보)"로 다시 넣었음.
- 라이선스: 바뀐 것 없음. 사용·수정 가능, **출처 표기 필수**("자료: kArchive / 출처: 쓰레드 dogfooter"), 원본 재판매 금지, CC 아님. 새로 받는 모델도 `assets.json`에 원본 URL·SHA-256·다운로드일·약관 문구를 기록해야 함.
- 표기: 용량은 사이트 표시값(MB). **굵은 용량 = 2 MB 초과, 2048² 텍스처라 1024² 재인코딩 필요.** 우선순위 — 상: 확장 핵심 자리에 바로 필요하고 1 MB 이하 · 중: 분위기 향상 또는 재인코딩 필요 · 하: 있으면 좋음, 무겁거나 스타일·테마 위험.

## 0. 실측으로 확인한 공통 특성

| 표본 | 원본 바이트 | 삼각형 | 텍스처 | 크기(가로×높이×깊이, 단위) | 원점 |
|---|---:|---:|---|---|---|
| 수동 펌프 `apocalypse-manual-water-pump-station-cottage-normal` | 480,640 | 6,037 | JPG 1024² | 0.44×0.55×0.85 | 바닥 |
| 나무 물통 `onsen-mineral-dosing-barrel-cottage-normal` | 510,800 | 6,065 | JPG 1024² | 0.66×0.79×0.70 | 바닥 |
| 피켓 문 `angular-common-fences-picket-gate-closed` | 482,792 | 4,449 | JPG 1024² | 1.05×0.60×0.12 | 바닥 |
| 막돌 담 `common-fences-dry-stacked-cobble-fence-straight-normal` | 263,972 | 2,605 | JPG 1024² | 1.00×1.20×0.24 | 바닥 |
| 옹기 `dongji-06` | 247,880 | 3,875 | JPG 1024² | 1.8×2.0×1.8 (명절 계열은 약 2단위로 정규화) | 바닥 |
| 한지 등 `dongji-11` | 353,004 | 3,174 | JPG 1024² | 1.0×2.0×1.0 | 바닥 |
| 캠핑 의자 `common-furniture-folding-camp-chair-cottage-normal` | 458,984 | 6,168 | JPG 1024² | 0.72×0.74×0.80 | 바닥 |
| 현무암 바위 `common-nature-volcanic-rock-cluster-cottage-normal` | 512,404 | 6,265 | JPG 1024² | 1.20×0.48×1.03 | 바닥 |
| 풀 무더기 `common-nature-tufted-meadow-grass-patch-cottage-normal` | 593,132 | 6,252 | JPG 1024² | 1.20×0.41×0.97 | 바닥 |
| 활엽수 `angular-common-nature-broadleaf-tree-mature` | 611,372 | 6,253 | JPG 1024² | 1.80×1.91×1.08 | 바닥 |
| 석등(이미 사용 중) `angular-onsen-garden-lantern-candle-insert` | 365,956 | 3,724 | JPG 1024² | 0.47×1.10×0.43 | 바닥 |
| 팔각정 `kc-23` | 2,571,116 | 4,060 | **JPG 2048²** | 1.76×1.90×1.77 | **가운데**(minY −0.95) |
| 등산로 이정표 `kc-18` | 2,682,296 | 2,987 | **JPG 2048²** | 1.06×1.90×0.70 | **가운데** |
| 계곡 바위와 물 `lp-su-10` | 2,932,612 | 6,189 | **JPG 2048²** | 1.68×0.57×1.90 | **가운데**(minY −0.29) |

해석:
1. 이전 조사와 같음. **모두 메시 1개·머티리얼 1개·구운 JPEG 1장.** 1 MB 이하 = 1024², 2 MB 이상(`lp-*`, `kc-*`) = 2048².
2. **`kc-*`, `lp-*`는 원점이 가운데**(pygltflib로 만든 파일)라 바닥 맞춤(Y 오프셋)이 필요함. Blender로 만든 `common-*`, 명절 계열은 원점이 바닥임.
3. 작은 풀·바위도 **6천 삼각형 안팎**임. 넓은 맵에 수백 개 깔면 삼각형이 폭증함(풀 200개 = 125만). 대량 채움은 절차 생성 풀·돌 카드로 하고, 모델은 눈에 띄는 자리에 강조용으로 쓰는 게 좋음.
4. 우리 `scripts/optimize-assets.mjs`는 텍스처를 WebP(EXT_texture_webp)로 바꾸고 디코더 없는 구성을 유지함. 따라서 GPU에서는 **압축 없는 RGBA**로 풀림 → **1024² 1장 ≈ 4 MB, 밉맵 포함 ≈ 5.3 MB, 512²는 ≈ 1.3 MB, 2048²는 ≈ 21 MB.** 모델 종류 하나가 곧 텍스처 한 장이므로 **"종류는 적게, 같은 모델은 많이"**가 원칙임.

## 1. 용도별 후보(Top 15·이미 사용 중 제외)

### A. 친구 7명 농장 마당

| 모델 | 용량 | 맞는 이유 / 스타일 | 우선 | 놓을 곳 |
|---|---:|---|---|---|
| [`apocalypse-manual-water-pump-station-cottage-normal`](https://karchive.vibeline.co.kr/models/apocalypse-manual-water-pump-station-cottage-normal) | 0.5 MB | 수동 펌프(나무틀+주철 펌프). **실측 480,640 B · 6.0k 삼각형 · JPG 1024² · 0.44×0.55×0.85**. 좀비 컬렉션이지만 모양은 시골 펌프 그대로 | 상 | 마당마다 1개. 물뿌리개 채우는 곳(상호작용 지점). 우물 대용 |
| [`onsen-mineral-dosing-barrel-cottage-normal`](https://karchive.vibeline.co.kr/models/onsen-mineral-dosing-barrel-cottage-normal) | 0.5 MB | 나무 물통+꼭지+받침대. 실측 510,800 B · 6.1k · 1024² | 중 | 펌프 대신 쓰는 두 번째 물 주는 곳(친구별 변주), 또는 부두 물통 |
| [`angular-onsen-rainwater-basin-water-filled`](https://karchive.vibeline.co.kr/models/angular-onsen-rainwater-basin-water-filled) | 0.4 MB | 돌 수반(물 채움). 세면대처럼 네모남 | 하 | 광장 음수·손씻기. 마당용으로는 도시적 |
| [`common-buildings-garden-tool-shed-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-garden-tool-shed-compact-normal) | 0.7 MB | 파란 지붕 농기구 창고. 기존 주택 계열 색 | 상 | 12칸 마당 해금 보상·출하함 겸용. 7마당이 같은 모델을 공유 |
| [`common-buildings-garden-tool-shed-corner-normal`](https://karchive.vibeline.co.kr/models/common-buildings-garden-tool-shed-corner-normal) | 0.8 MB | 창고 코너형(외벽에 화분) | 하 | 창고 변주가 꼭 필요할 때만 |
| [`angular-common-fences-picket-gate-closed`](https://karchive.vibeline.co.kr/models/angular-common-fences-picket-gate-closed) | 0.5 MB | 피켓 울타리 문(닫힘). 실측 482,792 B · 4.4k · 1.05×0.6 m | 상 | 마당 입구. 기존 `picketFence.glb`(동글판)와 색이 약간 다를 수 있으니 나란히 놓고 확인 |
| [`angular-common-fences-picket-gate-open`](https://karchive.vibeline.co.kr/models/angular-common-fences-picket-gate-open) | 0.5 MB | 같은 문(열림) | 중 | 주인이 접속 중일 때 열린 문으로 교체하는 연출 |
| [`angular-common-fences-bamboo-gate-closed`](https://karchive.vibeline.co.kr/models/angular-common-fences-bamboo-gate-closed) | 0.6 MB | 대나무 문 | 중 | 한국풍 마당(친구 한 명 테마)용 |
| [`common-fences-garden-low-hoop-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-garden-low-hoop-fence-straight-normal) | 0.4 MB | 낮은 고리형 화단 울타리 | 하 | 밭 칸 테두리(발에 걸리지 않는 높이) |
| [`dongji-06`](https://karchive.vibeline.co.kr/models/dongji-06) | 0.2 MB | 옹기 항아리. 실측 247,880 B · 3.9k · 1024². 0.2 MB로 매우 가벼움 | 상 | 마당 구석에 2–5개 묶어서 **장독대** 구성. 크기만 달리해 반복 |
| [`lp-au-20`](https://karchive.vibeline.co.kr/models/lp-au-20) | **2.1 MB** | 장독대(받침 포함 완성품) | 중 | 마을 공용 장독대 한 곳. 2.1 MB·2048² → 재인코딩 필요. 옹기 반복으로 대체 가능 |
| [`dongji-07`](https://karchive.vibeline.co.kr/models/dongji-07) | 0.3 MB | 돌절구 | 중 | 마당 소품, 장독대 옆 |
| [`dongji-05`](https://karchive.vibeline.co.kr/models/dongji-05) | 0.3 MB | 전통 소반 | 하 | 평상·정자 위 소품 |
| [`dongji-09`](https://karchive.vibeline.co.kr/models/dongji-09) | 0.3 MB | 장작 더미 | 상 | 마당·창고 옆 채움 소품. 0.3 MB |
| [`angular-common-nature-fallen-log-stacked-firewood`](https://karchive.vibeline.co.kr/models/angular-common-nature-fallen-log-stacked-firewood) | 0.5 MB | 장작 쌓기(각진) | 하 | 장작 더미 대안 |
| [`angular-restaurant-produce-crate-vegetables`](https://karchive.vibeline.co.kr/models/angular-restaurant-produce-crate-vegetables) | 0.5 MB | 채소 든 나무 상자 | 상 | 출하함·수확물 표시. 과일판(`-fruit`)도 있음 |
| [`gaecheon-05`](https://karchive.vibeline.co.kr/models/gaecheon-05) | 0.5 MB | 쑥 바구니(체크무늬 바구니) | 중 | 수확 바구니. 0.5 MB |
| [`gaecheon-04`](https://karchive.vibeline.co.kr/models/gaecheon-04) | 0.3 MB | 마늘 꾸러미 | 하 | 처마·창고 벽 장식 |
| [`angular-restaurant-flour-sack-cart-two-sacks`](https://karchive.vibeline.co.kr/models/angular-restaurant-flour-sack-cart-two-sacks) | 0.5 MB | 자루 실은 손수레 | 중 | 수레 대용(바퀴 달림). 농장 입구 |
| [`angular-common-furniture-plant-stand-gardening-tools`](https://karchive.vibeline.co.kr/models/angular-common-furniture-plant-stand-gardening-tools) | 0.4 MB | 화분대+원예 도구 | 중 | 모종·도구 선반. 물뿌리개 대용 소품 포함 |
| [`angular-common-nature-herb-bed-mature-herbs`](https://karchive.vibeline.co.kr/models/angular-common-nature-herb-bed-mature-herbs) | 0.5 MB | 허브 화단(틀) | 중 | 6칸 마당 옆 작은 화단 |
| [`angular-common-nature-flower-bed-full-flowers`](https://karchive.vibeline.co.kr/models/angular-common-nature-flower-bed-full-flowers) | 0.7 MB | 꽃 화단 | 중 | 집 앞. 모종판(`-seedlings`)으로 성장 단계 |
| [`angular-onsen-garden-planter-fern-planting`](https://karchive.vibeline.co.kr/models/angular-onsen-garden-planter-fern-planting) | 0.6 MB | 돌 화분(고사리) | 하 | 현관 양옆 |
| [`angular-common-furniture-laundry-drying-stand-clothes`](https://karchive.vibeline.co.kr/models/angular-common-furniture-laundry-drying-stand-clothes) | 0.5 MB | 빨래 건조대 | 하 | 생활감. 원래 실내용 |
| [`angular-apocalypse-tool-chest-closed`](https://karchive.vibeline.co.kr/models/angular-apocalypse-tool-chest-closed) | 0.5 MB | 공구 캐비닛(바퀴) | 하 | 창고 안·작업대. 금속이라 농장엔 약간 도시적 |
| [`lp-au-04`](https://karchive.vibeline.co.kr/models/lp-au-04) | **3.1 MB** | 허수아비(받침 흙판). 3.1 MB·2048² | 상 | 12칸 마당 상징물. **재인코딩 필수**(1024²로 ~0.5 MB 추정). 흙판은 밭에 묻히게 배치 |
| [`lp-au-06`](https://karchive.vibeline.co.kr/models/lp-au-06) | **2.4 MB** | 볏단 더미 | 중 | 가을 계절 소품. 2.4 MB → 재인코딩 |
| [`lp-au-13`](https://karchive.vibeline.co.kr/models/lp-au-13) | **2.5 MB** | 호박 더미 | 중 | 가을 수확 장식. 2.5 MB |
| [`lp-au-14`](https://karchive.vibeline.co.kr/models/lp-au-14) | **2.6 MB** | 사과 궤짝+사다리 | 중 | 과수원 마당. 2.6 MB |
| [`lp-au-15`](https://karchive.vibeline.co.kr/models/lp-au-15) | **2.4 MB** | 밤송이 바구니 | 하 | 가을. 2.4 MB |
| [`lp-sp-14`](https://karchive.vibeline.co.kr/models/lp-sp-14) | **2.6 MB** | 벌통 | 하 | 양봉 확장. 2.6 MB |
| [`lp-sp-15`](https://karchive.vibeline.co.kr/models/lp-sp-15) | **2.5 MB** | 모종 선반 | 하 | 씨앗 가게. 2.5 MB |
| [`lp-sp-16`](https://karchive.vibeline.co.kr/models/lp-sp-16) | **2.7 MB** | 딸기 화분 | 하 | 현관 장식. 2.7 MB |
| [`lp-au-12`](https://karchive.vibeline.co.kr/models/lp-au-12) | **2.9 MB** | 경운기 | 하 | 한국 농촌 느낌 강함. 2.9 MB, 받침 있음 |
| [`common-infrastructure-road-direction-sign-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-road-direction-sign-civic-normal) | 0.3 MB | 방향 표지판(화살표 판) | 중 | 이름 팻말 기둥으로만 사용하고 글자는 캔버스 텍스처로 덮기. 화살표가 인쇄돼 있음 |
| [`common-infrastructure-bus-stop-timetable-post-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-bus-stop-timetable-post-civic-normal) | 0.4 MB | 정류장 기둥 표지(버스 그림) | 하 | 이름 팻말로는 부적합. 버스 정류장 전용 |
| [`convenience-parcel-locker-bank-cottage-normal`](https://karchive.vibeline.co.kr/models/convenience-parcel-locker-bank-cottage-normal) | 0.5 MB | 택배함 | 하 | 우체통이 카탈로그에 없어 대체 후보. 편의점 느낌이라 마당엔 어색 |

### B. 낚시터(성격별)

| 모델 | 용량 | 맞는 이유 / 스타일 | 우선 | 놓을 곳 |
|---|---:|---|---|---|
| [`lp-su-10`](https://karchive.vibeline.co.kr/models/lp-su-10) | **2.8 MB** | 계곡 바위와 물(작은 폭포+웅덩이 디오라마). **실측 2,932,612 B · 6.2k · JPG 2048² · 1.68×0.57×1.9, 원점이 가운데(minY −0.29)** | 상 | **폭포 웅덩이** 주인공. 1024²로 재인코딩, 2–3배 확대. 물 표면은 우리 물 셰이더로 덮는 게 자연스러움 |
| [`lp-sp-17`](https://karchive.vibeline.co.kr/models/lp-sp-17) | **2.6 MB** | 시냇물 징검다리 디오라마 | 중 | **상류 급류** 건너는 곳. 2.6 MB → 재인코딩. 받침 흙판을 지형에 묻어야 함 |
| [`common-nature-rounded-granite-boulder-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-rounded-granite-boulder-cottage-normal) | 0.5 MB | 둥근 화강암 바위 | 상 | **상류 급류** 물속·물가에 반복. 회전·크기 변주 |
| [`common-nature-smooth-river-boulder-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-smooth-river-boulder-cottage-normal) | 0.4 MB | 매끈한 강돌(이전 보고서 후보) | 중 | 급류 물속 |
| [`common-nature-flat-slate-rock-cluster-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-flat-slate-rock-cluster-cottage-normal) | 0.5 MB | 납작 판석 무리 | 중 | 낚시하며 서는 발판 바위(상류·폭포) |
| [`common-nature-layered-sandstone-rock-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-layered-sandstone-rock-cottage-normal) | 0.6 MB | 층진 사암 | 중 | **폭포 절벽** 조각. 쌓아서 절벽 느낌 |
| [`common-nature-limestone-outcrop-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-limestone-outcrop-cottage-normal) | 0.6 MB | 석회암 노두 | 하 | 절벽·언덕 모서리 |
| [`common-nature-hanging-vine-root-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-hanging-vine-root-clump-cottage-normal) | 0.5 MB | 늘어진 덩굴 뿌리 | 중 | 폭포 절벽면에 붙이기 |
| [`common-nature-moss-mound-cluster-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-moss-mound-cluster-cottage-normal) | 0.5 MB | 이끼 둔덕 | 중 | 폭포 웅덩이 주변 습한 느낌 |
| [`common-nature-volcanic-rock-cluster-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-volcanic-rock-cluster-cottage-normal) | 0.5 MB | 현무암 바위 무리(구멍 있는 검은 돌·주황 틈). 실측 512,404 B · 6.3k · 1.2×0.48 m | 상 | **해변 바위** 낚시터. 제주 느낌. 몇 개 크게 키워 서는 자리로 |
| [`common-nature-rounded-beach-pebble-cluster-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-rounded-beach-pebble-cluster-cottage-normal) | 0.4 MB | 해변 조약돌 | 중 | 해변 바위 주변 채움 |
| [`common-nature-muddy-river-bank-chunk-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-muddy-river-bank-chunk-cottage-normal) | 0.6 MB | 진흙 강둑 조각(물풀 포함) | 중 | 호수·강 가장자리 경계 처리 |
| [`angular-common-nature-rock-cluster-three-rocks`](https://karchive.vibeline.co.kr/models/angular-common-nature-rock-cluster-three-rocks) | 0.3 MB | 각진 바위 3개(0.3 MB) | 하 | 가벼운 채움 돌. 동글판과 섞으면 약간 어색 |
| [`kc-22`](https://karchive.vibeline.co.kr/models/kc-22) | 1.7 MB | 바위 무리(야경 컬렉션) | 하 | 1.7 MB. 동글동글 바위로 충분 |
| [`common-nature-cattail-reed-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-cattail-reed-clump-cottage-normal) | 0.5 MB | 부들(이전 후보) | 상 | 호수 선착장·강가 공통. 반복 사용 |
| [`angular-common-nature-reed-clump-dense`](https://karchive.vibeline.co.kr/models/angular-common-nature-reed-clump-dense) | 0.5 MB | 갈대 빽빽 | 중 | 부들과 섞어 변주. `-bent-dry-stems`는 가을판 |
| [`common-nature-reedy-marsh-grass-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-reedy-marsh-grass-clump-cottage-normal) | 0.6 MB | 습지 풀 | 중 | 물가 경계 |
| [`common-nature-pond-lily-leaf-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-pond-lily-leaf-clump-cottage-normal) | 0.5 MB | 연잎+꽃(이전 후보) | 중 | **호수 선착장** 수면 |
| [`lp-au-10`](https://karchive.vibeline.co.kr/models/lp-au-10) | **3.1 MB** | 억새 무리 | 하 | 가을 강변. 3.1 MB |
| [`common-furniture-folding-camp-chair-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-folding-camp-chair-cottage-normal) | 0.4 MB | 접이식 캠핑 의자(초록 천). 실측 458,984 B · 6.2k · 0.72×0.74 m | 상 | **모든 낚시터 공통 "앉는 자리"** 표시. 낚시 중 캐릭터 옆 |
| [`common-furniture-folding-camp-table-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-folding-camp-table-cottage-normal) | 0.4 MB | 캠핑 테이블 | 중 | 미끼·양동이 올려 두는 자리 |
| [`common-fences-rope-and-timber-post-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-rope-and-timber-post-fence-straight-normal) | 0.3 MB | 밧줄+나무 말뚝(이전 후보) | 상 | **다리 끝**·호수 선착장 난간. 계류주 사슬(top15)보다 시골스러움 |
| [`apocalypse-rescue-flotation-gear-rack-cottage-normal`](https://karchive.vibeline.co.kr/models/apocalypse-rescue-flotation-gear-rack-cottage-normal) | 0.6 MB | 구명환 거치대(이전 후보) | 중 | 호수 선착장·밤 항구 |
| [`angular-apocalypse-lookout-tower`](https://karchive.vibeline.co.kr/models/angular-apocalypse-lookout-tower) | 0.7 MB | 각진 망루(나무 다리+지붕). 0.7 MB | 중 | **밤 항구** 등대 대용 망루, 호수 전망대 |
| [`lp-su-20`](https://karchive.vibeline.co.kr/models/lp-su-20) | **2.3 MB** | 해변 망루(빨간 지붕, 받침 모래) | 중 | **해변 바위** 옆 랜드마크. 2.3 MB → 재인코딩 |
| [`lp-su-14`](https://karchive.vibeline.co.kr/models/lp-su-14) | **2.8 MB** | 등대(이전 후보) | 중 | 밤 항구 끝. 2.8 MB → 재인코딩 |
| [`dongji-11`](https://karchive.vibeline.co.kr/models/dongji-11) | 0.3 MB | 한지 등(나무틀 사각등). 실측 353,004 B · 3.2k · 높이 2 단위 | 상 | **밤 항구** 부두 말뚝마다. 밤에만 발광 머티리얼 켜기 |
| [`lp-sp-19`](https://karchive.vibeline.co.kr/models/lp-sp-19) | **2.6 MB** | 청사초롱 가로등 | 중 | 밤 항구 입구·다리 끝. 2.6 MB |
| [`common-infrastructure-street-vending-canopy-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-street-vending-canopy-civic-normal) | 0.5 MB | 줄무늬 천막 노점 | 중 | 밤 항구 포장마차(밤에만 등장) |
| [`restaurant-seafood-grill-hut-cottage-normal`](https://karchive.vibeline.co.kr/models/restaurant-seafood-grill-hut-cottage-normal) | 0.8 MB | 해산물 구이 오두막(이전 후보) | 중 | 밤 항구 매점 |
| [`lp-wi-04`](https://karchive.vibeline.co.kr/models/lp-wi-04) | **2.5 MB** | 붕어빵 포장마차 | 하 | 겨울 밤 항구. 2.5 MB |
| [`lp-su-04`](https://karchive.vibeline.co.kr/models/lp-su-04) | **2.6 MB** | 파라솔+비치체어 | 중 | 해변 바위 낚시터 옆 휴식. 2.6 MB |
| [`lp-su-05`](https://karchive.vibeline.co.kr/models/lp-su-05) | **2.4 MB** | 모래성 | 하 | 해변 장식. 2.4 MB |
| [`common-nature-driftwood-branch-cluster-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-driftwood-branch-cluster-cottage-normal) | 0.5 MB | 유목(이전 후보) | 중 | 해변 바위 |
| [`angular-common-infrastructure-timber-deck-service-hatch-closed`](https://karchive.vibeline.co.kr/models/angular-common-infrastructure-timber-deck-service-hatch-closed) | 0.3 MB | 데크 타일(해치 있는 변형) | 하 | 선착장 타일 반복감 줄이기. 텍스처 1장 추가라 효과 대비 비쌈 |
| [`lp-wi-11`](https://karchive.vibeline.co.kr/models/lp-wi-11) | **2.4 MB** | 얼어붙은 연못 | 하 | 겨울 호수 이벤트. 2.4 MB |

### C. 넓어진 맵 자연 채움

| 모델 | 용량 | 맞는 이유 / 스타일 | 우선 | 놓을 곳 |
|---|---:|---|---|---|
| [`angular-common-nature-broadleaf-tree-mature`](https://karchive.vibeline.co.kr/models/angular-common-nature-broadleaf-tree-mature) | 0.6 MB | 각진 활엽수(성목). 실측 611,372 B · 6.3k · 1.8×1.9 m | 상 | 숲·길가 주력 나무. 계절 교체 세트의 기준 |
| [`angular-common-nature-broadleaf-tree-young`](https://karchive.vibeline.co.kr/models/angular-common-nature-broadleaf-tree-young) | 0.4 MB | 활엽수(어린) | 중 | 같은 텍스처 계열이지만 **별도 파일=텍스처 1장 추가**. 크기 변주는 스케일로 대신 가능 |
| [`angular-common-nature-broadleaf-tree-leafless`](https://karchive.vibeline.co.kr/models/angular-common-nature-broadleaf-tree-leafless) | 0.3 MB | 활엽수(잎 없음, 0.3 MB) | 중 | 겨울 교체판. 겨울에만 로드하면 GPU 상시 비용 없음 |
| [`angular-common-nature-birch-tree-mature`](https://karchive.vibeline.co.kr/models/angular-common-nature-birch-tree-mature) | 0.6 MB | 자작나무(성목) | 중 | 숲 가장자리 변주. `-leafless` 겨울판 있음 |
| [`angular-common-nature-pine-tree-mature`](https://karchive.vibeline.co.kr/models/angular-common-nature-pine-tree-mature) | 0.4 MB | 각진 소나무 | 중 | 상록. 동글판 작은 소나무와 둘 중 하나만 |
| [`common-nature-small-pine-tree-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-small-pine-tree-cottage-normal) | 0.4 MB | 작은 소나무 3그루 무리(이전 후보) | 상 | 상록수 주력. 겨울에도 그대로 |
| [`angular-common-nature-fruit-tree-mature-fruiting`](https://karchive.vibeline.co.kr/models/angular-common-nature-fruit-tree-mature-fruiting) | 0.5 MB | 각진 과수(열매) | 하 | 이미 쓰는 동글 과일나무(`fruitTree.glb`)와 겹침 |
| [`lp-su-11`](https://karchive.vibeline.co.kr/models/lp-su-11) | **2.5 MB** | 매미 앉은 느티나무 | 중 | **마을 당산나무** 후보(광장 중심). 2.5 MB → 재인코딩 |
| [`gaecheon-06`](https://karchive.vibeline.co.kr/models/gaecheon-06) | 0.4 MB | 신단수(0.4 MB) | 중 | 당산나무 대안. 가볍지만 치비풍 |
| [`lp-au-07`](https://karchive.vibeline.co.kr/models/lp-au-07) | **3.1 MB** | 감나무와 까치 | 하 | 가을 포인트. 3.1 MB |
| [`lp-sp-05`](https://karchive.vibeline.co.kr/models/lp-sp-05) | **2.7 MB** | 목련 | 하 | 봄 포인트. 2.7 MB |
| [`lp-sp-03`](https://karchive.vibeline.co.kr/models/lp-sp-03) / [`lp-sp-04`](https://karchive.vibeline.co.kr/models/lp-sp-04) | **3.6 / 3.0 MB** | 개나리 / 진달래 덤불 | 하 | 봄 교체. 3.6 / 3.0 MB로 무거움 |
| [`lp-au-09`](https://karchive.vibeline.co.kr/models/lp-au-09) | **2.8 MB** | 코스모스 | 하 | 가을 길가. 2.8 MB |
| [`common-nature-small-palm-tree-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-small-palm-tree-cottage-normal) | 0.4 MB | 작은 야자 | 하 | 해변 낚시터 한두 그루 |
| [`angular-common-nature-bamboo-clump-six-stalks`](https://karchive.vibeline.co.kr/models/angular-common-nature-bamboo-clump-six-stalks) | 0.5 MB | 대숲 한 묶음 | 중 | 한국풍 뒤뜰·정자 뒤 |
| [`common-nature-broadleaf-shrub-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-broadleaf-shrub-cottage-normal) | 0.5 MB | 활엽 관목 | 상 | 길가·마당 경계 채움 주력 덤불 |
| [`angular-common-nature-shrub-cluster-dense-cluster`](https://karchive.vibeline.co.kr/models/angular-common-nature-shrub-cluster-dense-cluster) | 0.6 MB | 각진 관목 무리 | 하 | 관목 변주 |
| [`common-nature-bluebell-flower-cluster-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-bluebell-flower-cluster-cottage-normal) | 0.5 MB | 블루벨 꽃 | 중 | 숲길 색 포인트 |
| [`common-nature-flowering-daisy-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-flowering-daisy-clump-cottage-normal) | 0.6 MB | 데이지(이전 후보) | 중 | 들판 꽃 |
| [`common-nature-tufted-meadow-grass-patch-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-tufted-meadow-grass-patch-cottage-normal) | 0.6 MB | 풀 무더기. 실측 593,132 B · **6.3k 삼각형** | 상 | 강조용 풀. 수백 개 깔면 삼각형 과다 → 대량 잔디는 절차 풀 카드로 |
| [`common-nature-low-clover-patch-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-low-clover-patch-cottage-normal) | 0.6 MB | 클로버 패치 | 중 | 바닥 얼룩 채움(낮아서 가림 없음) |
| [`common-nature-broad-fern-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-broad-fern-clump-cottage-normal) | 0.6 MB | 고사리 | 중 | 숲·폭포 그늘 |
| [`common-nature-dry-prairie-grass-tuft-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-dry-prairie-grass-tuft-cottage-normal) | 0.7 MB | 마른 풀 | 하 | 가을·해변 모래 언덕 |
| [`common-nature-short-cut-tree-stump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-short-cut-tree-stump-cottage-normal) | 0.5 MB | 그루터기 | 상 | 숲길 채움, 앉는 자리 |
| [`angular-common-nature-tree-stump-mushroom-cluster`](https://karchive.vibeline.co.kr/models/angular-common-nature-tree-stump-mushroom-cluster) | 0.4 MB | 버섯 난 그루터기 | 중 | 채집 포인트 표시 |
| [`common-nature-fallen-hollow-log-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-fallen-hollow-log-cottage-normal) | 0.4 MB | 속 빈 쓰러진 통나무 | 중 | 숲 바닥·강가 |
| [`common-nature-exposed-root-cluster-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-exposed-root-cluster-cottage-normal) | 0.5 MB | 드러난 뿌리 | 하 | 큰 나무 밑동 채움 |
| [`lp-sp-20`](https://karchive.vibeline.co.kr/models/lp-sp-20) / [`kc-15`](https://karchive.vibeline.co.kr/models/kc-15) / [`lp-au-21`](https://karchive.vibeline.co.kr/models/lp-au-21) | **2.6 / 2.3 / 2.8 MB** | 봄 언덕 / 야산 / 단풍 산 지형 디오라마 | 하 | 맵 가장자리 원경. 2.3–2.8 MB, 받침째 모양이라 지형과 맞추기 어려움 → 원경 실루엣 용도만 |

### D. 길·울타리·조명

| 모델 | 용량 | 맞는 이유 / 스타일 | 우선 | 놓을 곳 |
|---|---:|---|---|---|
| [`common-fences-dry-stacked-cobble-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-dry-stacked-cobble-fence-straight-normal) | 0.3 MB | 막돌 쌓은 담(회색 벽돌형). 실측 263,972 B · 2.6k · 1.0×1.2×0.24 m. corner·end·junction 있음 | 상 | **돌담** 골목, 층 높이 차 옹벽 대용 |
| [`extra-hanok-wall`](https://karchive.vibeline.co.kr/models/extra-hanok-wall) | 0.4 MB | 한옥 기와 담장(이전 후보) | 중 | 한옥 회관 둘레·정자 주변 |
| [`common-fences-split-log-ranch-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-split-log-ranch-fence-straight-normal) | 0.3 MB | 통나무 목장 울타리 | 중 | 마을 밖 들판·산길 경계 |
| [`common-fences-broad-bamboo-lattice-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-broad-bamboo-lattice-fence-straight-normal) | 0.3 MB | 대나무 격자 울타리 | 하 | 한국풍 마당 변주 |
| [`common-fences-reed-bundle-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-reed-bundle-fence-straight-normal) | 0.4 MB | 갈대 다발 울타리 | 하 | 강가 마당 |
| [`angular-common-infrastructure-stone-paver-flat`](https://karchive.vibeline.co.kr/models/angular-common-infrastructure-stone-paver-flat) | 0.3 MB | 1m 판석 타일(이전 후보) | 상 | 마을 길 본선. 인스턴싱 |
| [`common-infrastructure-street-lamp-column-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-street-lamp-column-civic-normal) | 0.4 MB | 가로등(이전 후보) | 중 | 큰길. 밤 연출은 코드 조명 |
| [`christmas-19`](https://karchive.vibeline.co.kr/models/christmas-19) | 0.4 MB | 크리스마스 가로등(0.4 MB) | 하 | 장식이 달려 있어 겨울 한정 |

### E. 랜드마크·쉼터

| 모델 | 용량 | 맞는 이유 / 스타일 | 우선 | 놓을 곳 |
|---|---:|---|---|---|
| [`kc-23`](https://karchive.vibeline.co.kr/models/kc-23) | **2.5 MB** | 팔각정 쉼터(단청 지붕). 실측 2,571,116 B · 4.1k · **JPG 2048²** · 원점 가운데(minY −0.95) | 상 | **정자** 랜드마크(언덕 위·호수 옆). 재인코딩 필수, 3–4배 확대 |
| [`lp-su-02`](https://karchive.vibeline.co.kr/models/lp-su-02) | **2.5 MB** | 원두막(초가 지붕) | 중 | 과수원·밭 옆 쉼터. 2.5 MB |
| [`lp-su-03`](https://karchive.vibeline.co.kr/models/lp-su-03) | **2.2 MB** | 평상과 수박 | 중 | 여름 마당·정자 앞. 2.2 MB |
| [`kc-18`](https://karchive.vibeline.co.kr/models/kc-18) | **2.6 MB** | 등산로 이정표("정상/약수터" 한글). 실측 2,682,296 B · 2048² | 중 | 산길·폭포 가는 길 입구. 재인코딩 |
| [`kc-17`](https://karchive.vibeline.co.kr/models/kc-17) | 1.7 MB | 나무 벤치(등산로) | 하 | 1.7 MB. 동글 벤치로 충분 |
| [`common-buildings-bus-terminal-shelter-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-bus-terminal-shelter-compact-normal) | 0.7 MB | 버스 정류장 건물(파란 지붕) | 중 | 마을 입구 랜드마크. 0.7 MB |
| [`common-furniture-circular-tree-bench-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-circular-tree-bench-cottage-normal) | 0.5 MB | 나무 둘레 원형 벤치 | 중 | 당산나무 밑 |
| [`common-furniture-backless-shelter-bench-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-backless-shelter-bench-cottage-normal) | 0.4 MB | 지붕 달린 그네형 벤치 | 중 | 호숫가·공원 |
| [`common-furniture-public-chess-bench-table-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-public-chess-bench-table-cottage-normal) | 0.4 MB | 체스 테이블 벤치 | 하 | 광장. 바둑판으로 보이게 텍스처 교체 가능 |
| [`common-infrastructure-public-clock-column-civic-normal`](https://karchive.vibeline.co.kr/models/common-infrastructure-public-clock-column-civic-normal) | 0.5 MB | 시계 기둥 | 중 | 광장 중심 랜드마크 |
| [`common-buildings-weather-station-cabin-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-weather-station-cabin-compact-normal) | 0.7 MB | 기상 관측소(풍향계) | 하 | 언덕 위. 풍차 대용 실루엣 |
| [`common-buildings-campground-reception-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-campground-reception-compact-normal) | 0.7 MB | 캠핑 안내소 | 하 | 숲 입구 매점 |
| [`gaecheon-08`](https://karchive.vibeline.co.kr/models/gaecheon-08) | 0.4 MB | 돌 제단(고인돌 모양) | 중 | 숲속 비밀 장소·서낭당 느낌. 0.4 MB |
| [`gaecheon-07`](https://karchive.vibeline.co.kr/models/gaecheon-07) | 0.4 MB | 곰 동굴 | 하 | 숲 끝 탐험 지점. 0.4 MB |
| [`kc-12`](https://karchive.vibeline.co.kr/models/kc-12) | **2.5 MB** | 아파트 놀이터·경비실 | 하 | 받침·경비실이 붙은 디오라마. 마을 톤과 거리 있음 |
| [`lp-su-12`](https://karchive.vibeline.co.kr/models/lp-su-12) / [`lp-au-18`](https://karchive.vibeline.co.kr/models/lp-au-18) | **2.3 / 2.5 MB** | 캠핑 텐트 / 캠프파이어 | 하 | 캠핑장 구역. 2.3 / 2.5 MB |
| [`lp-wi-02`](https://karchive.vibeline.co.kr/models/lp-wi-02) / [`lp-wi-03`](https://karchive.vibeline.co.kr/models/lp-wi-03) | **2.6 / 3.0 MB** | 눈 덮인 초가집 / 한옥 대문 | 하 | 겨울판이라 사계절 상시 배치에는 부적합 |
## 2. 장소별 배치 설계(추천 조합)

### 2-1. 친구 마당(7곳, 같은 모델을 돌려 씀)

| 마당 단계 | 밭 | 들어가는 모델 | 비고 |
|---|---|---|---|
| 기본(6칸) | 2×3 `vegetableBed`(이미 있음) | 피켓 울타리(이미 있음) + **피켓 문** 1 + **수동 펌프** 1 + **옹기** 2 + 이름 팻말(절차) | 펌프 앞 1칸을 "물 주는 곳" 트리거로 |
| 9칸 | 3×3 | + **채소 상자** 1 + **장작 더미** 1 + 옹기 1 추가 | 상자는 출하함 역할 |
| 12칸 | 3×4 | + **농기구 창고** 1 + **허수아비** 1 | 해금 보상으로 "눈에 띄는 변화" |
| 친구별 개성 | — | 물통(`onsen-mineral-dosing-barrel`), 대나무 문, 허브 화단, 손수레, 쑥 바구니 중 1–2개 | 텍스처가 늘어나므로 **최대 3종**만 추가 권장 |

- 7마당 × (문 1 + 펌프 1 + 옹기 3 + 상자 1 + 장작 1 + 창고 1 + 허수아비 1) = 인스턴스 63개지만 **텍스처는 7장**뿐임.
- 걸어서 들어가는 길은 판석 타일 2–3장을 문 앞에 두면 됨.
- 옹기는 2.0 단위로 정규화돼 있어 **0.25–0.35배**로 줄여야 함(마당 항아리 높이 0.5–0.7 m).

### 2-2. 낚시터 6곳(성격 차이는 "주인공 모델 1개 + 공통 소품"으로)

| 낚시터 | 주인공(1–2종) | 공통 재사용 | 절차/코드 |
|---|---|---|---|
| 상류 급류 | 화강암 바위 여러 개, (선택) `lp-sp-17` 징검다리 | 부들, 캠핑 의자 | 흰 물거품·빠른 물 흐름 셰이더 |
| 폭포 웅덩이 | **`lp-su-10` 계곡 바위와 물**(확대), 사암 쌓기, 덩굴 뿌리 | 이끼, 고사리, 캠핑 의자 | 떨어지는 물줄기(스크롤 텍스처 평면), 물보라 파티클 |
| 호수 선착장 | 데크 타일(이미 있음) + **밧줄 말뚝 난간** | 연잎, 부들, 캠핑 의자, 구명환 | 잔잔한 수면. 보트는 없음 |
| 해변 바위 | **현무암 바위** 크게 2–3개 + 조약돌 | 유목, 캠핑 의자, (선택) 해변 망루 `lp-su-20` | 파도 거품 |
| 밤 전용 항구 | 계류주 사슬 울타리(이미 있음) + **한지 등** 줄지어 | 구명환, 각진 망루, 노점 천막(포장마차) | 밤에만 등불 발광·등장 토글 |
| 다리 끝 | **밧줄 말뚝 난간** | 캠핑 의자, 부들 | **다리 본체는 절차 생성**(카탈로그에 나무 보행교 없음) |

### 2-3. 넓어진 맵 채움

- 나무 3종(활엽수 성목, 작은 소나무 무리, 기존 과일나무)으로 숲을 만들고 **스케일 0.7–1.4, Y축 회전 무작위**로 반복함. 계절은 활엽수 `-leafless`만 겨울에 교체해도 충분함.
- 덤불 1종(활엽 관목) + 풀 1종(풀 무더기) + 그루터기 1종 + 바위 2종(화강암, 현무암)을 길가·물가에 뿌림. 모델 채움은 화면당 수십 개 선으로 두고, 바닥 전체의 풀은 절차 생성으로.
- 한국 느낌: 돌담 골목 + 장독대(옹기 반복) + 팔각정 + 한지 등 + 대숲. 이 조합이면 텍스처 5장으로 "한국 시골 마을" 인상이 남.

## 3. 추천 최종 목록 22개(확장 전용)

| # | 모델 | 용량 | 텍스처 | 용도 / 위치 | 반복 |
|---|---|---:|---|---|---|
| 1 | [`apocalypse-manual-water-pump-station-cottage-normal`](https://karchive.vibeline.co.kr/models/apocalypse-manual-water-pump-station-cottage-normal) | 0.48 (실측) | 1024² | 마당 물 주는 곳(우물 대용) | 7 |
| 2 | [`angular-common-fences-picket-gate-closed`](https://karchive.vibeline.co.kr/models/angular-common-fences-picket-gate-closed) | 0.48 (실측) | 1024² | 마당 입구 문 | 7 |
| 3 | [`common-buildings-garden-tool-shed-compact-normal`](https://karchive.vibeline.co.kr/models/common-buildings-garden-tool-shed-compact-normal) | 0.7 | 1024² | 12칸 마당 창고·출하함 | 7 |
| 4 | [`dongji-06`](https://karchive.vibeline.co.kr/models/dongji-06) 옹기 | 0.25 (실측) | 1024² | 마당·마을 장독대 | 20–30 |
| 5 | [`angular-restaurant-produce-crate-vegetables`](https://karchive.vibeline.co.kr/models/angular-restaurant-produce-crate-vegetables) | 0.5 | 1024² | 수확 상자·출하함 | 7–14 |
| 6 | [`dongji-09`](https://karchive.vibeline.co.kr/models/dongji-09) 장작 더미 | 0.3 | 1024² | 마당·창고 옆 | 7–10 |
| 7 | [`lp-au-04`](https://karchive.vibeline.co.kr/models/lp-au-04) 허수아비 | **3.1** | **2048² → 1024²** | 12칸 마당 상징 | 7 |
| 8 | [`common-furniture-folding-camp-chair-cottage-normal`](https://karchive.vibeline.co.kr/models/common-furniture-folding-camp-chair-cottage-normal) | 0.46 (실측) | 1024² | 모든 낚시터의 앉는 자리 | 6–10 |
| 9 | [`common-nature-volcanic-rock-cluster-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-volcanic-rock-cluster-cottage-normal) | 0.51 (실측) | 1024² | 해변 바위 낚시터 | 10+ |
| 10 | [`common-nature-rounded-granite-boulder-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-rounded-granite-boulder-cottage-normal) | 0.5 | 1024² | 상류 급류·폭포·숲 | 20+ |
| 11 | [`common-nature-cattail-reed-clump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-cattail-reed-clump-cottage-normal) | 0.5 | 1024² | 호수·강·다리 물가 | 20+ |
| 12 | [`dongji-11`](https://karchive.vibeline.co.kr/models/dongji-11) 한지 등 | 0.35 (실측) | 1024² | 밤 항구 등불, 골목 | 10–15 |
| 13 | [`lp-su-10`](https://karchive.vibeline.co.kr/models/lp-su-10) 계곡 바위와 물 | **2.93 (실측)** | **2048² → 1024²** | 폭포 웅덩이 주인공 | 1 |
| 14 | [`common-fences-rope-and-timber-post-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-rope-and-timber-post-fence-straight-normal) | 0.3 | 1024² | 다리 끝·호수 선착장 난간 | 15+ |
| 15 | [`angular-common-nature-broadleaf-tree-mature`](https://karchive.vibeline.co.kr/models/angular-common-nature-broadleaf-tree-mature) | 0.61 (실측) | 1024² | 숲·길가 주력 나무 | 40+ |
| 16 | [`common-nature-small-pine-tree-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-small-pine-tree-cottage-normal) | 0.4 | 1024² | 상록 숲 | 30+ |
| 17 | [`common-nature-tufted-meadow-grass-patch-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-tufted-meadow-grass-patch-cottage-normal) | 0.59 (실측) | 1024² | 강조용 풀(6.3k 삼각형이라 수 제한) | ≤40 |
| 18 | [`common-nature-broadleaf-shrub-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-broadleaf-shrub-cottage-normal) | 0.5 | 1024² | 길가·경계 덤불 | 30+ |
| 19 | [`common-nature-short-cut-tree-stump-cottage-normal`](https://karchive.vibeline.co.kr/models/common-nature-short-cut-tree-stump-cottage-normal) | 0.5 | 1024² | 숲길 채움 | 10+ |
| 20 | [`common-fences-dry-stacked-cobble-fence-straight-normal`](https://karchive.vibeline.co.kr/models/common-fences-dry-stacked-cobble-fence-straight-normal) 돌담 | 0.26 (실측) | 1024² | 돌담 골목·옹벽 대용(corner/end/junction은 같은 계열이지만 **별도 텍스처**) | 30+ |
| 21 | [`kc-23`](https://karchive.vibeline.co.kr/models/kc-23) 팔각정 | **2.57 (실측)** | **2048² → 1024²** | 정자 랜드마크 | 1 |
| 22 | [`angular-common-infrastructure-stone-paver-flat`](https://karchive.vibeline.co.kr/models/angular-common-infrastructure-stone-paver-flat) | 0.3 | 1024² | 늘어난 길 본선 | 100+ |

**합계**
- 원본: **약 17.1 MB (22개)**. 그중 2048² 3개(허수아비·계곡·팔각정)가 8.6 MB임.
- 3개를 1024²로 줄이면(개당 약 0.5 MB로 추정, 실측 아님) 약 **10.0 MB**. 기존 최적화 비율(약 66%)을 적용하면 배포 크기 **약 6.6 MB**로 추정함.
- **GPU 텍스처**(WebP → RGBA 풀림, 밉맵 포함)
  - 22장을 모두 1024²로 두면 **약 117 MB**.
  - 권장안: 한 변 1 m 이하 소품 11종(펌프, 문, 옹기, 상자, 장작, 의자, 부들, 한지 등, 밧줄 난간, 그루터기, 풀)을 **512²**로, 나머지 11종을 1024²로 두면 11×1.3 + 11×5.3 ≈ **73 MB**.
  - 이미 들어갔거나 들어가는 중인 kArchive 모델 약 23종(Top 15 + 주택·나무 5 + 확장 3)도 1024²면 약 120 MB임. **마을 전체가 약 190–240 MB가 되므로 모바일에서는 부담이 큼.** 대안은 다음과 같음.
    - (a) 소품 전부 512²
    - (b) 같은 구역 소품 텍스처를 2048² 아틀라스 1장으로 합치기(모두 머티리얼 1개라 UV 재배치만 하면 됨. 11종이면 21 MB → 이득 없음. 16종 이상을 합칠 때만 이득)
    - (c) 구역 단위 지연 로드(낚시터·폭포 모델은 그 구역에 들어갈 때 로드)
- 반복 수가 많은 7종(판석, 활엽수, 소나무, 돌담, 부들, 화강암, 덤불)은 `InstancedMesh`로 그려야 드로콜이 늘지 않음.

**차순위(필요해지면 추가)**: 나무 물통(친구별 변주), 활엽수 `-leafless`(겨울), 연잎, 구명환 거치대, 각진 망루(밤 항구), 노점 천막(포장마차), 사암·덩굴 뿌리(폭포 절벽), `lp-su-11` 느티나무(당산나무, 재인코딩), 원형 벤치, 버스 정류장, `kc-18` 이정표(재인코딩), 한옥 담장, 대숲.

## 4. 카탈로그로 안 되는 것 → 절차 생성·다른 출처

| 필요한 것 | 카탈로그 상황 | 권장 |
|---|---|---|
| **배·나룻배·조각배** | 없음(`boat` 검색 0건) | 절차 생성(선체=늘린 반원통 + 좌석 판 2개, 저폴리 몇십 삼각형), 또는 CC0 저폴리 팩(Kenney "Pirate Kit"/"Watercraft Kit" 등, 라이선스 따로 확인) |
| **낚싯대·그물·양동이·미끼통** | 없음(양동이는 사우나 벤치에 붙은 것뿐) | 절차 생성. 낚싯대는 캐릭터 손 소품이라 선+원통으로 충분 |
| **물 자체**(급류 흐름, 폭포 물줄기, 물보라, 파도 거품) | 모델에 구운 물만 있음(`lp-su-10`, `lp-sp-17`) | 셰이더(UV 스크롤·노멀 흔들기) + 파티클. 기존 물 표현과 통일 |
| **나무 보행교(다리 본체)** | 없음. 레일용 `flat-bridge-deck`는 철도, `hg-13`은 와플 다리 | 데크 타일(이미 있음) 반복 + 밧줄 말뚝 난간 + 절차 생성 교각 |
| **이름 팻말**(친구 7명 이름) | 글자가 비어 있는 팻말 없음(방향 표지판은 화살표 인쇄) | 절차 생성 나무판 + 캔버스 텍스처로 이름 표시. 기둥만 모델을 써도 됨 |
| **우체통** | 없음(택배함뿐) | 절차 생성(빨간 원통+지붕). 한국식 빨간 우체통이 오히려 개성 |
| **물뿌리개·퇴비함·지지대 격자(트렐리스)·건초** | 물뿌리개·퇴비·트렐리스 없음. 건초는 `lp-au-06` 볏단(2.4 MB)뿐 | 물뿌리개는 UI 아이콘/손 소품으로 절차 생성. 퇴비함은 나무판 상자로 절차 생성. 트렐리스는 등나무 쉼터(Top 15)로 대신함 |
| **솟대·장승** | 없음(`gaecheon-08` 돌 제단, `gaecheon-06` 신단수가 가장 가까움) | 절차 생성이 쉬움. 솟대=긴 막대+나무 새, 장승=원통+얼굴 텍스처. 마을 입구 한 쌍 |
| **풍차** | 없음(기상 관측소 풍향계가 유일한 실루엣) | 절차 생성(탑+회전 날개 4장, 날개 회전 애니메이션) |
| **계단·옹벽·언덕 지형** | 계단은 폐자재 팔레트 계단뿐. 언덕은 받침 디오라마(`lp-sp-20`, `kc-15`) | 지형·계단·옹벽은 절차 생성(높이맵 + 돌담 모델을 옹벽 테두리로) |
| **곡선 길·길 가장자리** | 1 m 정사각 판석·데크만 있음 | 길은 지형 텍스처(스플랫)로 칠하고 판석 모델은 광장·마당 입구에만 |
| **놀이터(그네·미끄럼틀)** | `kc-12` 아파트 놀이터 디오라마뿐(받침·경비실 포함, 2.5 MB) | 필요하면 절차 생성 그네 1개. 우선순위 낮음 |
| **대량 풀·꽃·작은 돌** | 모델은 개당 6천 삼각형 | 절차 생성 카드(교차 평면 2장) + 인스턴싱. 모델은 강조용 |
| **물고기(수조·낚은 물고기 연출)** | `fish-*` 300종이 있지만 개당 3.5–4.4 MB, 2048² | 이전 보고서대로 몇 종만 1024² 재인코딩, 또는 2D 스프라이트 |

## 5. 위험·주의

1. **스타일 섞임**: 동글동글(`common-*` 무접두사)과 각진(`angular-*`)이 섞임. 추천 목록은 동글 12종, 각진 4종(문, 상자, 활엽수, 판석), 명절 3종, 사계절·야경 3종임. 각진 활엽수는 잎 덩어리가 각져 보여 동글 소나무 옆에서 약간 튐. 한 숲 안에서는 한 계열만 쓰는 게 좋음.
2. **받침 디오라마**: `lp-*`, `kc-*`는 흙판·모래판·잔디판이 붙어 있음. 허수아비·계곡·팔각정은 받침을 지형에 묻거나 받침 색에 맞춰 바닥을 칠해야 함.
3. **정규화 크기 제각각**: 명절 계열은 약 2단위, `common-*`는 실제 미터 크기에 가까움. 기존처럼 바운딩 박스로 맞춰야 함.
4. **세기말 컬렉션 출처**: 펌프·구명환·망루는 "세기말·좀비" 컬렉션이지만 모양에는 좀비 요소가 없음. 크레딧 표기만 kArchive로 하면 됨.
5. **계절 교체**: 계절판(`-leafless`, `lp-au-*`)을 상시 로드하면 텍스처가 두 배가 됨. 계절이 바뀔 때 교체 로드하는 방식을 권장.
6. **라이선스**: 출처 표기(화면 크레딧·`#third-party-licenses`·`assets.json`)를 추가하는 것을 잊지 말 것. 원본 GLB를 따로 배포(ZIP 등)하는 것은 재판매·재배포 위험이 있으니 게임 번들 안에서만.
