# Web-optimized copies · 2026-09-24

The GLB files served by the game are losslessly restructured copies (dedup, weld, prune), with vertex data quantized (`KHR_mesh_quantization`) and embedded textures re-encoded as WebP (`EXT_texture_webp`) by `scripts/optimize-assets.mjs`. The byte-for-byte originals described below (and hashed in each `assets.json`) are kept under `public/models/_originals/` with the same relative paths. Shapes, UVs, materials and credits are unchanged; kArchive's displayed terms permit modification with credit, and the 3DAssets.dev files are CC0.

# kArchive models

자료: kArchive · 출처: 쓰레드 dogfooter

Provider: https://karchive.vibeline.co.kr/models

- sofa.glb: https://karchive.vibeline.co.kr/models/angular-common-furniture-sofa-bench-clear
- tulips.glb: https://karchive.vibeline.co.kr/models/common-nature-tulip-flower-clump-heritage-normal

Downloaded and inspected 2026-09-18. Original GLB files are unmodified; the game adjusts their scale and placement at runtime. The provider's displayed terms permit personal/commercial use and modification, require credit, and prohibit resale of the original assets. No Creative Commons license is asserted.

Both models contain their own textures. No third-party model host is contacted during gameplay.

## Village buildings and garden models

Downloaded and inspected 2026-09-24 from the same provider and displayed usage terms above. The original GLB files are stored under `public/models/village/`; `assets.json` records the individual source pages, download URLs, sizes, hashes and texture metadata.

- cottage.glb: https://karchive.vibeline.co.kr/models/common-buildings-small-family-house-compact-normal
- cornerHouse.glb: https://karchive.vibeline.co.kr/models/common-buildings-small-family-house-corner-normal
- courtyardHouse.glb: https://karchive.vibeline.co.kr/models/common-buildings-small-family-house-courtyard-normal
- fruitTree.glb: https://karchive.vibeline.co.kr/models/common-nature-small-fruit-tree-cottage-normal
- hydrangea.glb: https://karchive.vibeline.co.kr/models/common-nature-flowering-hydrangea-bush-cottage-normal

These five original files total 3,455,236 bytes and contain embedded textures and geometry. The game only changes placement, orientation and scale. They are credited in the village screen and bundled license notice. No original asset resale or Creative Commons license is asserted.

# Bedroom furniture · 3DAssets.dev

Pack: https://3dassets.dev/packs/bedroom-and-living-room-furniture

License: CC0 1.0 Universal — https://creativecommons.org/publicdomain/zero/1.0/

Downloaded and inspected 2026-09-23. Eleven original, self-contained GLB files are kept under `furniture/`. `furniture/assets.json` records each asset page, original CDN URL, byte count, SHA-256 and relevant model metadata. The provider discloses AI-generated geometry (Muse Spark via T3 Code); no generation was commissioned for this change.

Included: Double Bed Upholstered, Desk Writing, Bookcase 5 Shelf, Rug Wool Large, Desk Task Chair, Table Lamp Dome, Side Table Square Drawer, Wardrobe 2 Door, Coffee Table Rect, Curtains Linen Pair and Cushion Set 4.

Original bytes are unmodified. At runtime the game fits scale/orientation to room furniture bounds, adjusts the bed fabric color, and stretches the flat rug/curtains to their intended surfaces. The cabinet and drawer animation clips are not played. The files use material colors and embedded geometry, require no external texture/buffer requests, and are served from the game's own content-hashed asset URLs.

## kArchive village expansion and room redesign · 2026-09-24

자료: kArchive · 출처: 쓰레드 dogfooter

Six original, self-contained GLB files were downloaded from the official model detail pages on 2026-09-24. Their original bytes are preserved; the game applies placement, scale and orientation at runtime. All six models contain one mesh and one embedded texture, with no external buffer/image URIs and no required extensions. Together they total 2,961,568 bytes.

Village files under `public/models/village/expansion/`:

- picnicTable.glb: https://karchive.vibeline.co.kr/models/common-furniture-hexagonal-picnic-table-cottage-normal
- parkBench.glb: https://karchive.vibeline.co.kr/models/common-furniture-l-shaped-park-bench-cottage-normal
- gardenLantern.glb: https://karchive.vibeline.co.kr/models/angular-onsen-garden-lantern-candle-insert

Room files under `public/models/lounge/redesign/`:

- archiveBookcase.glb: https://karchive.vibeline.co.kr/models/common-furniture-open-bookcase-cottage-normal
- plantStand.glb: https://karchive.vibeline.co.kr/models/angular-common-furniture-plant-stand-three-pots
- teaTable.glb: https://karchive.vibeline.co.kr/models/angular-common-furniture-coffee-table-tea-tray

Each directory's `assets.json` records the official detail/download URLs, SHA-256, byte size and transformed bounds. The source detail pages display permission for personal/commercial projects and modification, mandatory attribution, and prohibition on resale of original assets. No Creative Commons license is asserted. Files are served from the game's own content-hashed URLs without contacting the provider during gameplay.

## kArchive civic set: village, hall, casino and room · 2026-09-25

자료: kArchive · 출처: 쓰레드 dogfooter

Fifteen original, self-contained GLB files were downloaded from the official model detail pages on 2026-09-25 (`https://karchive-assets.vibeline.co.kr/models/v1/<collection>/<id>.glb`). Terms displayed on the detail pages and the pre-download consent dialog that day, recorded verbatim in each `assets.json`: personal and commercial projects may use and modify the models; AI training is allowed; resale of the original assets is prohibited; the credit "자료: kArchive / 출처: 쓰레드 dogfooter" is required on a license screen, credits or description. There is no separate terms page and no Creative Commons license is asserted. Each model has one mesh and one embedded JPEG texture (1024²), no external URIs and no required extensions; together the originals total 7,880,560 bytes (web copies 4,556,676 bytes).

Village files under `public/models/village/civic/` (`assets.json` there):

- greenhouse.glb: https://karchive.vibeline.co.kr/models/common-buildings-greenhouse-building-compact-normal
- noticeBoard.glb: https://karchive.vibeline.co.kr/models/common-infrastructure-public-notice-board-civic-normal
- museumLibrary.glb: https://karchive.vibeline.co.kr/models/common-buildings-public-library-compact-normal
- hanokHall.glb: https://karchive.vibeline.co.kr/models/dongji-12
- festivalStage.glb: https://karchive.vibeline.co.kr/models/newyear-11
- wisteriaPergola.glb: https://karchive.vibeline.co.kr/models/angular-onsen-wisteria-pergola
- vegetableBed.glb: https://karchive.vibeline.co.kr/models/angular-common-nature-vegetable-bed-soil-empty
- timberDeck.glb: https://karchive.vibeline.co.kr/models/angular-common-infrastructure-timber-deck-flat
- harborFence.glb: https://karchive.vibeline.co.kr/models/common-fences-harbor-bollard-chain-fence-straight-normal
- picketFence.glb: https://karchive.vibeline.co.kr/models/common-fences-rounded-wooden-picket-fence-straight-normal

Hall and casino files under `public/models/lounge/club/` (`assets.json` there):

- cardTable.glb: https://karchive.vibeline.co.kr/models/common-furniture-square-card-table-heritage-normal
- banquetChair.glb: https://karchive.vibeline.co.kr/models/common-furniture-round-back-banquet-chair-cottage-normal
- barStool.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-bar-stool-cushion
- queueRope.glb: https://karchive.vibeline.co.kr/models/restaurant-restaurant-queue-rope-post-heritage-normal

Room file under `public/models/lounge/redesign/` (entry added to that `assets.json`):

- rockingChair.glb: https://karchive.vibeline.co.kr/models/common-furniture-rocking-chair-cottage-normal (sold in the furniture shop as 흔들의자)

Modifications: the served copies are the web-optimized versions described at the top of this file (the fences, deck tile, bed frame, notice board, banquet chair, bar stool and rope post textures are reduced to 512²). At runtime the game sets position, orientation and (partly non-uniform) scale, draws the card-table blanket, bundle papers and crops with its own geometry, and, outside winter, recolors the snow texels of the hanok's roof and stone base with a shader. The room catalog thumbnail `public/assets/lounge/bedroom/thumbs/rocking-chair.webp` is a render of the rocking chair made for this project. Files are served from the game's own content-hashed URLs; the provider is not contacted during gameplay.

## kArchive valley set: farm yards, fishing spots, nature, 팔각정 · 2026-09-26

자료: kArchive · 출처: 쓰레드 dogfooter

Twenty-two original, self-contained GLB files were downloaded from the official model detail pages on 2026-09-26 (`https://karchive-assets.vibeline.co.kr/models/v1/<collection>/<id>.glb`). The terms shown on the detail pages that day were unchanged from 2026-09-25 (personal and commercial use and modification allowed; AI training allowed; resale of the original assets prohibited; the credit "자료: kArchive / 출처: 쓰레드 dogfooter" is required); they are recorded verbatim in `public/models/village/valley/assets.json` with each file's URL, SHA-256 and byte size. Each model has one mesh and one embedded JPEG texture (1024², or 2048² for lp-au-04, lp-su-10 and kc-23). Originals total 17,367,012 bytes; web copies 5,606,592 bytes.

Files under `public/models/village/valley/`:

- waterPump.glb: https://karchive.vibeline.co.kr/models/apocalypse-manual-water-pump-station-cottage-normal
- picketGate.glb: https://karchive.vibeline.co.kr/models/angular-common-fences-picket-gate-closed
- toolShed.glb: https://karchive.vibeline.co.kr/models/common-buildings-garden-tool-shed-compact-normal
- onggi.glb: https://karchive.vibeline.co.kr/models/dongji-06
- produceCrate.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-produce-crate-vegetables
- firewood.glb: https://karchive.vibeline.co.kr/models/dongji-09
- scarecrow.glb: https://karchive.vibeline.co.kr/models/lp-au-04
- campChair.glb: https://karchive.vibeline.co.kr/models/common-furniture-folding-camp-chair-cottage-normal
- volcanicRock.glb: https://karchive.vibeline.co.kr/models/common-nature-volcanic-rock-cluster-cottage-normal
- graniteBoulder.glb: https://karchive.vibeline.co.kr/models/common-nature-rounded-granite-boulder-cottage-normal
- cattail.glb: https://karchive.vibeline.co.kr/models/common-nature-cattail-reed-clump-cottage-normal
- hanjiLantern.glb: https://karchive.vibeline.co.kr/models/dongji-11
- valleyRocks.glb: https://karchive.vibeline.co.kr/models/lp-su-10
- ropeFence.glb: https://karchive.vibeline.co.kr/models/common-fences-rope-and-timber-post-fence-straight-normal
- broadleafTree.glb: https://karchive.vibeline.co.kr/models/angular-common-nature-broadleaf-tree-mature
- smallPine.glb: https://karchive.vibeline.co.kr/models/common-nature-small-pine-tree-cottage-normal
- meadowGrass.glb: https://karchive.vibeline.co.kr/models/common-nature-tufted-meadow-grass-patch-cottage-normal
- shrub.glb: https://karchive.vibeline.co.kr/models/common-nature-broadleaf-shrub-cottage-normal
- treeStump.glb: https://karchive.vibeline.co.kr/models/common-nature-short-cut-tree-stump-cottage-normal
- cobbleWall.glb: https://karchive.vibeline.co.kr/models/common-fences-dry-stacked-cobble-fence-straight-normal
- pavilion.glb: https://karchive.vibeline.co.kr/models/kc-23
- stonePaver.glb: https://karchive.vibeline.co.kr/models/angular-common-infrastructure-stone-paver-flat

Modifications: web-optimized copies as described at the top of this file; textures are reduced to 512² for the props up to about 1 m across (pump, gate, jar, crate, firewood, camp chair, cattail, paper lantern, rope fence, stump, grass, shrub, stone wall, paver) and to 1024² for the rest (including the three 2048² originals). At runtime the game sets position, orientation and (partly non-uniform) scale, and adds a warm emissive glow to the paper lanterns at night.

## kArchive friends' tables (야추 · 라이어 게임) · 2026-09-26

자료: kArchive · 출처: 쓰레드 dogfooter

Seven original, self-contained GLB files were downloaded from the official model URLs on 2026-09-26 (`https://karchive-assets.vibeline.co.kr/models/v1/<collection>/<id>.glb`); the displayed terms were unchanged from 2026-09-25 and are recorded verbatim in `public/models/lounge/friends/assets.json` with each file's source page, URL, SHA-256, byte size, triangle count and bounds. Originals (2,756,920 bytes) are kept under `public/models/_originals/lounge/friends/`; web copies total 1,337,824 bytes (512² textures, 1024² for the oval table).

Files under `public/models/lounge/friends/`:

- ovalTable.glb: https://karchive.vibeline.co.kr/models/angular-common-furniture-oval-meeting-table-heritage-normal
- serviceBell.glb: https://karchive.vibeline.co.kr/models/rounded-restaurant-service-bell-ready
- serviceBellPressed.glb: https://karchive.vibeline.co.kr/models/rounded-restaurant-service-bell-button-pressed
- lectern.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-menu-lectern-blank-menu-stack
- ballotBox.glb: https://karchive.vibeline.co.kr/models/onsen-entrance-ticket-pedestal-heritage-normal
- deskCalendar.glb: https://karchive.vibeline.co.kr/models/newyear-09
- pencil.glb: https://karchive.vibeline.co.kr/models/exam-06

Modifications: web-optimized copies as described at the top of this file. At runtime the game sets position, orientation and (partly non-uniform) scale; the holiday-set calendar and pencil (normalized to a 2 m longest side) are scaled down to desk size. The 야추 table reuses `club/cardTable.glb` and the 라이어 table reuses `club/banquetChair.glb` (no new bytes). Dice and the dice cup are drawn in code (three.js RoundedBoxGeometry / LatheGeometry).

## kArchive blacksmith (성장 · 대장간) · 2026-09-26

자료: kArchive · 출처: 쓰레드 dogfooter

Two original, self-contained GLB files were downloaded from the official model URLs on 2026-09-26 (`https://karchive-assets.vibeline.co.kr/models/v1/rounded/<id>.glb`); the displayed terms were unchanged from 2026-09-25 (personal and commercial use and modification allowed; AI training allowed; resale of the original assets prohibited; the credit "자료: kArchive / 출처: 쓰레드 dogfooter" is required) and are recorded verbatim in `public/models/village/forge/assets.json` with each file's source page, URL, SHA-256, byte size, triangle count and bounds. Originals (1,817,216 bytes) are kept under `public/models/_originals/village/forge/`; web copies total 1,219,536 bytes (1024² WebP textures).

Files under `public/models/village/forge/`:

- workshop.glb: https://karchive.vibeline.co.kr/models/common-buildings-community-workshop-compact-normal
- workshopRuin.glb: https://karchive.vibeline.co.kr/models/common-buildings-community-workshop-compact-destroyed

Modifications: web-optimized copies as described at the top of this file. At runtime the game sets position and scale; the ruined workshop stands in the village until the shared project “대장간 재건” is finished, then the rebuilt one. The village's material nodes (잡목·통나무 더미·바위) reuse the valley set's shrub, firewood and granite boulder.


## kArchive 허풍 주점 · 범마을 부동산 · 나무결 가구점 · 2026-09-26

자료: kArchive · 출처: 쓰레드 dogfooter

Original, self-contained GLB files were downloaded from the official model URLs on 2026-09-26 (`https://karchive-assets.vibeline.co.kr/models/v1/<collection>/<id>.glb`). The displayed terms were checked again on a model page that day and were unchanged (personal and commercial use and modification allowed; AI training allowed; resale of the original assets prohibited; the credit "자료: kArchive / 출처: 쓰레드 dogfooter" is required; no Creative Commons license). They are recorded verbatim in each folder's `assets.json` with the file's source page, URL, SHA-256, byte size, triangle count, texture and bounds. Originals are kept under `public/models/_originals/` with the same paths.

Files under `public/models/lounge/tavern/` (Interior props of 허풍 주점 (base set and every upgrade tier); 34 files, originals 20,799,680 bytes, web copies 7,148,168 bytes):

- barCounter.glb: https://karchive.vibeline.co.kr/models/angular-onsen-reception-desk — 바 카운터(2개 이어 붙임) · 기본
- wallShelf.glb: https://karchive.vibeline.co.kr/models/common-furniture-wall-shelf-unit-cottage-normal — 바 뒤 선반 · 기본
- bottle.glb: https://karchive.vibeline.co.kr/models/newyear-06 — 선반 위 술병(반복) · 기본
- keg.glb: https://karchive.vibeline.co.kr/models/onsen-mineral-dosing-barrel-cottage-normal — 막걸리 통(케그) · 기본
- cafeTable.glb: https://karchive.vibeline.co.kr/models/common-furniture-round-cafe-table-cottage-normal — 허풍 카드 메인 테이블(확대) · 기본
- saddleStool.glb: https://karchive.vibeline.co.kr/models/common-furniture-saddle-workshop-stool-cottage-normal — 테이블 안장 의자 · 기본
- fireplace.glb: https://karchive.vibeline.co.kr/models/christmas-23 — 벽난로 · 기본
- glass.glb: https://karchive.vibeline.co.kr/models/newyear-07 — 잔 · 업그레이드 바 1단계
- cupTree.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-cup-tree-four-mugs — 머그 걸이 · 업그레이드 바 1단계
- bottleCrate.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-bottle-crate-full-bottles — 병 상자 · 업그레이드 바 1단계
- cornerCabinet.glb: https://karchive.vibeline.co.kr/models/common-furniture-corner-display-cabinet-cottage-normal — 코너 장식장 · 업그레이드 바 2단계
- teaSideboard.glb: https://karchive.vibeline.co.kr/models/angular-onsen-tea-sideboard-open-stocked — 찻장 · 업그레이드 바 2단계
- glassRack.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-glassware-rack-full-glasses — 잔 상자 · 업그레이드 바 2단계
- sodaTap.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-soda-fountain-ready — 맥주 탭 · 업그레이드 바 3단계
- beverageBar.glb: https://karchive.vibeline.co.kr/models/restaurant-beverage-bar — 음료 바 · 업그레이드 바 3단계
- boothBench.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-booth-bench-seat-cushions — 관전석 부스 · 업그레이드 좌석 1단계
- shelterBench.glb: https://karchive.vibeline.co.kr/models/common-furniture-backless-shelter-bench-cottage-normal — 지붕 벤치 · 업그레이드 좌석 2단계
- soban.glb: https://karchive.vibeline.co.kr/models/dongji-05 — 소반 · 업그레이드 좌석 3단계
- stringLights.glb: https://karchive.vibeline.co.kr/models/christmas-17 — 전구 줄 · 업그레이드 조명 1단계
- starLamp.glb: https://karchive.vibeline.co.kr/models/christmas-18 — 별 등 · 업그레이드 조명 2단계
- floorLamp.glb: https://karchive.vibeline.co.kr/models/restaurant-floor-lamp — 스탠드 등 · 업그레이드 조명 3단계
- coatStand.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-coat-stand-coats-and-bags — 옷걸이 · 업그레이드 벽·장식 1단계
- bambooPlanter.glb: https://karchive.vibeline.co.kr/models/angular-onsen-garden-planter-bamboo-planting — 대나무 화분 · 업그레이드 벽·장식 1단계
- doorway.glb: https://karchive.vibeline.co.kr/models/angular-common-buildings-board-batten-doorway-2m — 판자 문틀 · 업그레이드 벽·장식 2단계
- windowFrame.glb: https://karchive.vibeline.co.kr/models/angular-common-buildings-board-batten-window-2m — 판자 창틀 · 업그레이드 벽·장식 2단계
- audioConsole.glb: https://karchive.vibeline.co.kr/models/common-furniture-audio-equipment-console-cottage-normal — 음향 콘솔 · 업그레이드 벽·장식 3단계
- ticketRail.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-order-ticket-rail-five-blank-tickets — 주문표 걸이 · 업그레이드 벽·장식 3단계
- cauldron.glb: https://karchive.vibeline.co.kr/models/dongji-03 — 국밥 가마솥 · 업그레이드 주방 1단계
- stove.glb: https://karchive.vibeline.co.kr/models/dongji-10 — 아궁이 · 업그레이드 주방 1단계
- teaUrn.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-tea-urn-open-filled — 보리차 통 · 업그레이드 주방 2단계
- register.glb: https://karchive.vibeline.co.kr/models/angular-restaurant-cash-register-closed — 계산대 · 업그레이드 주방 2단계
- storageShelf.glb: https://karchive.vibeline.co.kr/models/rounded-restaurant-storage-shelf-fully-stocked — 식료품 선반 · 업그레이드 주방 3단계
- barrelRack.glb: https://karchive.vibeline.co.kr/models/apocalypse-sand-filter-barrel-rack-cottage-normal — 술통 받침 · 업그레이드 주방 3단계
- chestnutRoaster.glb: https://karchive.vibeline.co.kr/models/lp-wi-06 — 군밤 화로 · 업그레이드 주방 3단계
Files under `public/models/village/tavern/` (허풍 주점 exteriors (base and upgrade tiers) and the entrance board; 5 files, originals 3,755,348 bytes, web copies 2,370,384 bytes):

- tavernStall.glb: https://karchive.vibeline.co.kr/models/restaurant-ramen-stall-building-cottage-normal — 허풍 주점 외관 · 기본
- menuBoard.glb: https://karchive.vibeline.co.kr/models/restaurant-allergen-pictogram-board-cottage-normal — 입구 칠판 ‘오늘의 카드: ?’ · 업그레이드 외관 1단계
- dumplingShop.glb: https://karchive.vibeline.co.kr/models/restaurant-dumpling-shop-building-cottage-normal — 외관 2단계 ‘본채 새 단장’(대안 외관)
- stallHeritage.glb: https://karchive.vibeline.co.kr/models/restaurant-ramen-stall-building-heritage-normal — 외관 3단계 ‘홍등 거리’(홍등이 가장 선명한 변형)
- grillHut.glb: https://karchive.vibeline.co.kr/models/restaurant-seafood-grill-hut-cottage-normal — 외관 3단계 곁채 ‘항구 구이 좌판’
Files under `public/models/village/shops/` (범마을 부동산 and 나무결 가구점 buildings (base and upgrade tiers); 4 files, originals 2,949,752 bytes, web copies 1,949,580 bytes):

- realtyOffice.glb: https://karchive.vibeline.co.kr/models/common-buildings-office-reception-building-compact-normal — 범마을 부동산 외관 · 기본
- realtyDuplex.glb: https://karchive.vibeline.co.kr/models/common-buildings-office-reception-building-duplex-normal — 부동산 외관 2단계 ‘2층 사무소’
- furnitureShop.glb: https://karchive.vibeline.co.kr/models/convenience-corner-convenience-store-building-cottage-normal — 나무결 가구점 외관 · 기본
- furnitureShowroom.glb: https://karchive.vibeline.co.kr/models/convenience-corner-convenience-store-building-heritage-normal — 가구점 외관 2단계 ‘쇼윈도 증축’

Reused without new bytes: the room's archive bookcase (`redesign/archiveBookcase.glb`, the same kArchive model as the tavern's bookcase tier), the valley set's onggi, hanji lantern and firewood, and the friends' tables' service bell (the tavern's 거짓말! bell).

Modifications: web-optimized copies as described at the top of this file (small props at 512² WebP textures, buildings and the main table at 1024²). At runtime the game sets position, orientation and scale (the holiday-set models, normalized to a 2 m longest side, are scaled down), tints the hanji lanterns' glow, and shows or swaps models by the shared shop upgrades (외관 · 바·카운터 · 좌석 · 조명 · 벽·장식 · 주방). The toy cork gun (뻥총), dartboard, gramophone, posters, rug and signs are drawn in code.
