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
