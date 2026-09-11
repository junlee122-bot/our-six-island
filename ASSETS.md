# 여섯섬 에셋 제작 기록

2026-09-11 생활 확장판. 새 배경·가구·시설은 OpenAI 내장 `image_gen` 도구로 제작했습니다. 원본 사진은 게임 배포에 포함하지 않습니다.

## 실제 AI 업스케일

지도와 실내 배경은 [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN)의 공식 `realesr-animevideov3-x4` 모델로 각각 **1536×1024 → 6144×4096** 신경망 추론을 수행했습니다. 추론 후 크기를 늘리는 보간은 하지 않았습니다. 지도 구조와 실내 2×2 배치는 유지하며, 최종 배포에는 품질 95 WebP를 사용합니다. 확대된 디테일은 모델이 보완한 표현입니다.

- 런타임: Tencent NCNN 1.0.20260526, CPU 4 threads, tile 256, padding 24.
- 공식 모델 배포: [Real-ESRGAN v0.2.5.0](https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.2.5.0).
- 모델 SHA256: `548a36f9c3f4ab8da56cd3b13badf23968bee207b396dad14d04b830e5f2ab2d`.
- 모델/NCNN: BSD-3-Clause. 참고한 NCNN Vulkan 프런트엔드: MIT. 라이선스 원문은 `licenses/`에 보관합니다. 모델과 런타임은 웹 게임에 포함되지 않습니다.
- 실제 신경망 추론, 원본/결과 크기와 해시 검사, 전체 지도와 확대 비교 이미지 육안 검사를 완료했습니다.

## 배포 파일

| 경로 | 해상도 | 내용 |
| --- | --- | --- |
| `public/assets/island-hd.webp` | 6144×4096 | AI 업스케일한 전체 섬 지도 |
| `public/assets/interiors-hd.webp` | 6144×4096 | 집·상점·공방·박물관, 2×2 배경 |
| `public/assets/furniture.png` | 1254×1254 RGBA | 가구 16종, 4×4 투명 아틀라스 |
| `public/assets/facilities.png` | 1254×1254 RGBA | 공방·박물관·텃밭·카페, 2×2 투명 아틀라스 |
| `public/assets/friends-v2.png` | 기존 캐릭터 시트 | 도원·강재·민서·승준·민재·재민 |
| `public/assets/mayor-hohyeon.png` | 기존 캐릭터 | 호현 촌장 |

가구와 시설은 생성된 알파 채널을 그대로 보존합니다. 가구는 `naturalWidth / 4`의 소수점 셀 경계를 사용합니다. 일부 셀 가장자리에는 생성 이미지의 작은 그림자 흔적이 있습니다. 새 에셋은 프롬프트당 한 번 생성했고 추가 변형본은 만들지 않았습니다. 아래 프롬프트의 요청 해상도와 실제 생성 해상도가 다른 경우 위 표가 실제 파일 값입니다.

최종 지도 SHA256: `10d982f3734c0ef6949a961fabfdfd8376cfc77fb3c7d91d3e293950a2339bfd`.

최종 실내 SHA256: `9aadca5dd797a4183aa0e44a584168b0cec6c4ba7113e6e14cf9dc929f319a4d`.

## Prompts

### interiors-atlas.png

```text
Use case: stylized-concept.
Asset type: production background texture atlas for the original Korean cozy life simulation game 우리들의 여섯섬.
Create exactly one landscape image, 1536x1024 or higher, showing a precise 2x2 atlas of FOUR equal rectangular room backgrounds. The canvas has exactly two columns and two rows; boundaries exactly at 50% width and 50% height. No gutters, no margins, no grid lines, no labels, no people or animals. Each room fills its own quadrant all the way to that quadrant's edge.
Style: original warm painterly 2.5D rural island game illustration, delicate gouache/watercolor textures, soft rounded natural wooden forms, fine handcrafted detail, muted cream, honey wood, moss green, soft teal, tiny terracotta accents, cozy daylight. Cohesive with a sunny illustrated island full of cottage roofs, green orchards and turquoise sea; not copied from an existing franchise.
All four camera views IDENTICAL: near top-down frontal orthographic room view; back wall occupies upper 20 percent of each room, visible floor occupies lower 80 percent. No roof. Rear horizontal wall, left and right short walls, broad rectangular playable floor with no central obstructions. Bottom edge open with a clearly visible bottom-center doorway threshold.
TOP LEFT: cozy cottage interior, small bed against upper-left side and compact sofa against upper-right wall, modest rear window, warm plank floor, mostly empty central and lower floor.
TOP RIGHT: acorn general shop, full-width low counter at very back, stocked wood shelves against left and right sides, baskets near side walls, pale wood floor with open central and lower walking area.
BOTTOM LEFT: rustic crafting workshop, workbench along rear wall, hanging tools on rear wall and timber/material racks along side walls, warm worn wood floor, open central and lower walking area.
BOTTOM RIGHT: small natural-history museum, aquarium tanks and glass specimen displays along rear wall and rear corners, a few side-wall exhibit cases, pale stone floor, open central and lower walking area.
Constraint: furniture/display details cluster within the rear 25 percent and far left/right 18 percent of each quadrant; maintain large clear floors. No text, signs with writing, logos, watermarks, user interface or characters.
```

### furniture-atlas.png

```text
Use case: stylized-concept.
Asset type: production transparent furniture sprite atlas for the original Korean cozy life simulation 우리들의 여섯섬.
Create one square 2048x2048 PNG if possible, exactly 4 columns by 4 rows, SIXTEEN equal square cells. TRANSPARENT BACKGROUND with genuine alpha channel: empty pixels completely transparent, not white, not checkerboard painted into the image. No grid lines, labels, cell borders, text, people or animals.
Each cell contains one isolated centered furniture object. Every object fully contained with a generous transparent margin of at least 15 percent on all four sides of its own cell. All object art same camera and same world scale: front-facing orthographic view from a slightly elevated 2.5D camera, seeing front and top. Soft delicate contact shadows only under each individual object, never bleeding to cell edges.
Style: original warm handcrafted rural island game illustration, painterly gouache/watercolor, natural oak wood, rounded adorable forms with readable silhouettes, cream, honey, moss green, soft teal and terracotta, fine details but clean silhouettes. Match sunny cottage-island map art.
Read strictly LEFT TO RIGHT, TOP TO BOTTOM:
Row 1: flowering terracotta flower pot; simple wooden chair; glowing paper lantern on a little wooden stand; small cream camping tent.
Row 2: rectangular wooden table; cozy two-seat soft teal sofa; wooden bookshelf full of books; wooden single bed with pale cream bedding.
Row 3: folded-edge red-and-cream checked picnic rug spread flat; wooden garden bench; short rustic garden fence segment; small round stone water fountain.
Row 4: vintage wooden tabletop radio; rectangular raised wooden garden planter with leafy plants; warm stone fireplace with small fire; potted small fruit tree with orange fruit.
Exactly sixteen separate objects, no extra props outside their silhouettes. Common scale while allowing naturally smaller objects more negative space. No landscape, room, background color, checker pattern, presentation sheet background, text or watermark. Preserve genuine transparent alpha around all sprites.
```

### facilities-atlas.png

```text
Use case: stylized-concept.
Asset type: production outdoor facility sprite atlas for the original Korean cozy life simulation 우리들의 여섯섬.
Create one square 2048x2048 PNG if possible: precisely 2 columns by 2 rows of FOUR equal square cells. Genuine transparent PNG alpha background, all empty pixels completely transparent, not opaque white or a drawn checkerboard. No grid, no gutters, no borders, no text or labels, no people or animals.
Each cell contains a single complete centered isolated small rural facility, with generous transparent margin at least 12 percent per side. Camera identical across all four: front-facing orthographic from slightly above, warm 2.5D game illustration. Buildings' front doors are centered low on their front wall. Consistent world scale and light from upper left. Original painterly gouache/watercolor rural island art: soft rounded cottages, cream stucco, honey timber, muted terracotta and teal shingle roofs, mossy green plants, fine handcrafted details matching a sunny turquoise-sea village map.
TOP LEFT: rustic crafting workshop hut, warm timber framing, compact teal pitched roof, centered wooden front door, little side window and tools neatly resting by side wall.
TOP RIGHT: small natural-history museum greenhouse, symmetrical quaint cream stone cottage base and glass conservatory roof, centered welcoming doorway, a small sculpted leaf medallion with no text.
BOTTOM LEFT: compact rectangular vegetable garden plot, neatly arranged raised wooden planter boxes with carrots, leafy greens and tomato plants; all planters contained on one tiny earthy garden footprint, no building.
BOTTOM RIGHT: cozy village café, cream cottage with terracotta roof, centered wood door, small windows, modest striped cream and moss-green awning, small potted flowers at the facade; no writing on any sign.
No large surrounding terrain or scenery, no landscape background, no opaque rectangles, no cast shadows reaching cell edges. Exactly four isolated assets suitable for overlaying on a painted island map. Preserve true transparent alpha.
```

