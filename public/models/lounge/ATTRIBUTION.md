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

- rockingChair.glb: https://karchive.vibeline.co.kr/models/common-furniture-rocking-chair-cottage-normal

Modifications: the served copies are the web-optimized versions described at the top of this file (the fences, deck tile, bed frame, notice board, banquet chair, bar stool and rope post textures are reduced to 512²). At runtime the game sets position, orientation and (partly non-uniform) scale, draws the card-table blanket, bundle papers and crops with its own geometry, and, outside winter, recolors the snow texels of the hanok's roof and stone base with a shader. The room catalog thumbnail `public/assets/lounge/bedroom/thumbs/rocking-chair.webp` is a render of the rocking chair made for this project. Files are served from the game's own content-hashed URLs; the provider is not contacted during gameplay.
