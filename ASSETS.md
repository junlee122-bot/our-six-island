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



## 2026-09-11 캐릭터 모션·꾸미기 확장

내장 `image_gen`으로 걷기와 인사 자세, 착용 소품, 자연물 아틀라스를 추가 제작했습니다. 원본 파일은 보존하며, 머리색과 옷색 변경 및 소품 합성은 게임 실행 중 Canvas에서 수행합니다.

| 게임 파일 | 실제 해상도 | 용도 |
|---|---|---|
| `public/assets/friends-motion.png` | 1024×1536 RGB | 여섯 캐릭터 × 서기·왼발·오른발·인사 24자세 |
| `public/assets/accessories.png` | 1774×887 RGBA | 모자 4종·안경 3종·꽃 머리핀 |
| `public/assets/nature-detail.png` | 1774×887 RGBA | 나무·풀·꽃·돌·나비·갈매기 8종 |

캐릭터 생성 결과의 체크무늬는 실제 투명도가 아니어서 게임에서 가장자리에 연결된 중립색 배경만 제거합니다. 자세별 머리·눈·발 좌표를 측정해 정렬하고, 파란 머리와 청록색 옷의 색상 채널만 염색합니다. 자연물은 셀 경계의 희미한 선을 피하도록 안쪽을 사용합니다. 안경과 모자는 측정한 눈과 머리 위치에 맞추며, 기본 모습에는 도원의 붉은 머리, 강재의 긴 머리·둥근 안경, 재민의 갈색 모자를 적용합니다.

친구 아틀라스는 투명도 실패로 교정 시도가 있었으며, 바지가 일관된 첫 교정본을 최종 선택했습니다. 마지막 재생성본은 사용하지 않습니다. 걷기 자세는 서로 다르지만 손과 발의 교차가 모든 프레임에서 완전히 대칭은 아닙니다.

### 최초 생성 프롬프트

#### friends-motion

```text
Use case: identity-preserve.
Asset type: transparent runtime animation atlas for original cozy Korean 2.5D game 우리들의 여섯섬.
Input image: friends-v2.png is the character identity/style reference and edit source. Rebuild this character atlas in the following exact layout; remove all baked glasses, hats, cap, earrings, logos and accessories. Preserve the recognizable large heads, warm round eyes, natural warm skin, hairstyles, face identities and charming soft painted 3D/chibi body silhouettes of its six characters. IMPORTANT: shoulder-length center-parted hairstyle character is a MAN, with an androgynous youthful male face and broader sleeveless shoulders; do not feminize him.
Canvas: PORTRAIT 1024x1536 pixels (or exact 2:3 aspect ratio larger), genuine transparent alpha background. EXACTLY 4 columns and 6 rows, 24 equal SQUARE cells. Thus at 1024x1536 each cell is exactly 256x256. Invisible layout grid only. Each character fully contained in its own cell with at least 10 percent clear margin on each edge. No background, checkerboard painting, border, grid lines, text, numbers, or shadow outside the character. No ground shadows.
Composition: each row repeats exactly ONE character across four different full-body animation poses. Uniform camera front-facing slightly three-quarter, the same across every frame. Keep exact same character scale, proportions, body center, eye/head size and foot baseline within each row. All poses fit comfortably. Only arms/legs change. Four columns must show visibly different limb poses: column 1 neutral standing with arms relaxed; column 2 walking, left foot forward and right arm forward with other limbs back; column 3 walking, right foot forward and left arm forward with opposite limbs back; column 4 cheerful one-hand wave beside head while other arm rests down. Neutral and waving feet both on the same baseline. Walking feet must visibly alternate, not four cloned standing poses.
Row identities, TOP TO BOTTOM, following source atlas left-to-right then top-to-bottom:
ROW 1 도원: the source red straight bob with full blunt bangs and rounded youthful face; casual short sleeve tee, dark shorts, neutral dark/cream shoes. For this special recolorable atlas her red hair must instead be saturated deep BLUE as specified below.
ROW 2 강재: MAN with shoulder-length center-parted hair, friendly youthful MALE face, no glasses, teal sleeveless tank top, dark shorts, cream sneakers. Preserve male identity, modest slightly wider shoulders.
ROW 3 민서: long hair with wispy bangs, natural warm face, no glasses, teal long-sleeved button shirt with collar and rolled cuffs, dark shorts, dark shoes.
ROW 4 승준: MAN with short-to-medium dark source side-parted hair, youthful male face; teal short-sleeved collared shirt, charcoal loose long trousers, cream shoes.
ROW 5 민재: MAN with medium rounded bob parted hair, youthful male face, no glasses, teal short-sleeved casual tee, charcoal relaxed long trousers and cream/dark shoes.
ROW 6 재민: MAN with short cropped hair that was under a brown baseball cap in source; render exposed short hair and NO cap, no earrings. Teal casual short sleeve tee, dark shorts, dark/cream shoes.
RUNTIME COLOR MASK REQUIREMENT: ALL six characters' hair in EVERY frame is saturated DEEP BLUE (#3154ac, with coherent blue highlights/shadows). ALL tops in EVERY frame are saturated TEAL (#20b3ad with teal shading). Never use blue or teal for any skin, trousers, shorts or shoes. Skin natural warm peach. Trousers/shorts/shoes neutral charcoal, brown, black, cream only. No white shirts; all tops teal so application can recolor them. No baked glasses, hats, necklaces, earrings, accessories, patterns or logos.
Style: polish matching source, original painterly 2.5D island game art, softly sculpted forms, smooth painted edges, subtle brush texture, charming large heads and small bodies, delicate warm lighting. High definition individual sprites, readable small-size silhouettes. Do not render any labels or Korean letters. Output raw transparent PNG atlas, not a presentation sheet.
```

#### accessories

```text
Use case: stylized-concept.
Asset type: transparent wearable overlay atlas for original cozy Korean 2.5D game 우리들의 여섯섬.
Create one original PNG game atlas, landscape canvas 2048x1024 pixels, EXACT 4 columns x 2 rows of equal SQUARE cells (each 512x512). Background must be genuinely transparent alpha, not a painted checkerboard or solid color. No rendered grid lines, border, labels, letters, caption, UI, floor or cast shadows.
Composition: exactly ONE isolated wearable item per cell, front-facing with very slight three-quarter volume to match cute softly sculpted chibi people facing camera. All items entirely inside their own cell with generous at least 15 percent margin on every side. Hats are empty isolated garments, never show a head, mannequin, face, hair or person. Eyewear includes complete symmetric lenses with subtle temples, designed to overlay on big round-eyed faces. Frames centered, near-frontal and horizontal. Every accessory must be legible at small sprite scale.
Cells, left to right:
ROW 1 cell 1: simple warm brown baseball cap, softly curved brim at front, rounded crown, no words or logos. Cell 2: cream woven straw hat with softly rounded natural brim. Cell 3: moss-green canvas bucket hat. Cell 4: warm terracotta ribbed knit beanie with folded cuff.
ROW 2 cell 1: dark brown-black round eyeglasses, clear completely transparent lenses and smooth circular frames. Cell 2: delicate thin silver round glasses with clear transparent lenses. Cell 3: dark rounded-rectangle sunglasses with dark softly glossy lenses. Cell 4: small cream-white five-petal flower hairclip, warm yellow center, no head or hair.
Style: original polished painterly 2.5D cozy island game art: softly sculpted forms, warm subtle ambient lighting, gentle brush texture, rounded charming shapes, coherent muted natural colors. Match a family of big-headed warm-eyed doll-like island villagers: clothing and facial accessories have soft painted 3D depth, not flat vector icons. Realistic enough material texture to distinguish cloth, straw, knit and metal. No trademarked characters or franchise cloning. No duplicate items, extras, shadows or backgrounds. Output raw transparent PNG atlas.
```

#### nature-detail

```text
Use case: stylized-concept.
Asset type: transparent environmental decoration atlas for original cozy Korean 2.5D island game 우리들의 여섯섬.
Create one original high-detail PNG game atlas. Canvas landscape 2048x1024 pixels, EXACTLY 4 columns by 2 rows of equal SQUARE cells, each 512x512. Genuine transparent alpha background, no painted checkerboard, solid backdrop, gradients, grid lines, border, letters, labels, UI or landscape. Exactly one isolated subject/group per cell, fully contained with at least 15 percent clear margin on all four sides.
All subjects use consistent painterly 2.5D game rendering, gently elevated isometric three-quarter camera angle, soft warm daylight from upper left, naturally rounded shapes. Match a cozy hand-painted woodland island: yellow-green meadow grass; broad deciduous trees with clustered olive/moss/light lime leaves; blue-green tiered conifers; irregular warm gray rocks; creamy beaches and bright turquoise coastal water in the world, but NO background water, beach or land patches here. Distinct original art, not franchise clones.
ROW 1, left to right:
1. A mature soft-leaved deciduous tree: single sturdy warm brown trunk, broad rounded asymmetric layered canopy of moss and lime foliage, visible leaf groups and painterly details. Full tree and roots contained.
2. A small pine tree: friendly tapered silhouette of overlapping soft blue-green and olive evergreen tiers, small visible brown trunk. Full tree contained.
3. A lush rounded bush with little pale pink and white flowers scattered throughout its leaf canopy. Full bush isolated.
4. A tuft of meadow grass and a few tiny delicate meadow flowers: fresh light olive/lime blades with small white and pale yellow blossoms, organically grouped, no earth tile.
ROW 2, left to right:
1. A small group of irregular flat stepping stones: 4 or 5 smooth warm gray stone slabs loosely arranged, gentle perspective, subtle texture, no terrain under them.
2. A small shoreline rock group: 3 or 4 rounded angular warm-gray rocks with cream edges and hints of moss in crevices, no water/sand.
3. One tiny cream-white butterfly viewed from above with both wings spread open, delicate muted beige wing veins, slim body and two antennae. This remains ONE isolated butterfly centered in the cell with ample transparent area.
4. One small white gliding seagull viewed from gentle elevated angle, wings spread wide horizontally, soft gray feather shading and a tiny warm yellow beak, no water or sky.
Full objects isolated, no cropping or overlaps between cells, no extraneous decorations or animals. High quality painted textures, readable silhouettes, harmonious visual language. No ground shadows outside subjects. Output a raw transparent PNG atlas.
```

#### correctionPrompt

```text
Use case: precise-object-edit and background-extraction.
Edit this exact 4-column 6-row character animation atlas into a production TRANSPARENT PNG. It failed because the gray-and-white checkerboard is painted into an RGB image. REMOVE ALL checkerboard pixels completely, including the spaces between characters and their limbs/hair. The final PNG must have a real alpha channel with completely transparent background (alpha 0). Do NOT draw any checker pattern, color backdrop, white background, grids, separators, floor or cast shadows. Preserve antialiased clean character silhouettes.
Preserve the exact 1024x1536 portrait canvas and its exact invisible 4x6 layout of 256x256 SQUARE cells. All 24 sprites remain in the same row/column and preserve facial identity, hairstyle, clothing, blue hair and teal tops.
The current figures are too large: uniformly shrink all characters within each cell to about 78% of cell height, never more than 80%, leaving at least 10% transparent margin above the head and below the shoes. Center each sprite horizontally and keep the same baseline at about 88% of each cell height. Keep equal head/body scale across four frames of a row. No cell overlaps.
A specific wardrobe error: ROW 5 COLUMN 4 (the waving medium-bob-haired male) must wear the same charcoal LONG LOOSE TROUSERS and cream/dark shoes as the other three characters in row 5. No shorts in row 5. Every other row keeps its existing clothing.
A specific pose error: each COLUMN 3 walking pose must visibly reverse the arm and leg swing from COLUMN 2, so the opposite foot AND opposite hand come forward. Both arms are allowed to be out of contact with body. Column 1 stands neutrally; column 4 waves one hand beside head with other arm resting.
Hair stays deep saturated BLUE (#3154ac) in ALL frames, tops stay saturated TEAL (#20b3ad); natural warm skin and neutral trousers/shoes. No accessories. Preserve existing soft painterly 2.5D large-headed cozy character style. It is vital that background be actual alpha transparency. Output one corrected atlas PNG.
```

#### freshTransparencyRetryPrompt

```text
Create a TRANSPARENT PNG with a real alpha channel containing ONLY 24 separate cute game characters. All empty pixels must be alpha=0. NO checkerboard painting. NO solid background. NO grid, text, labels, shadows or scene.
Canvas portrait, exact ratio 2:3, ideally 1024x1536 or 2048x3072. EXACT 4 COLUMNS x 6 ROWS of equal SQUARE cells. One complete full-body figure per cell. Every figure must fit completely with 12% blank margin at the TOP and BOTTOM, and at least 12% blank margin on left/right; character height is 76% of square cell. No border or visible separator. This is a raw atlas for the Korean cozy island game 우리들의 여섯섬, but do not render this name.
Original polished soft painterly 2.5D chibi game art: very large rounded heads, small bodies, big warm dark brown eyes, natural light peach skin, tiny friendly closed smiles, subtle rosy cheeks, delicate painted hair strands and soft 3D shading. Front-facing with very slight three-quarter volume. All characters share camera and warm lighting. Smooth natural silhouettes, slightly toy-like proportions, charming and calm, not flat cartoon icons.
CRITICAL COLOR MASKS: Every character in every frame has saturated deep BLUE hair #3154ac with blue shading. All tops are saturated TEAL #20b3ad with teal shading. This is intentional for runtime recoloring. Natural warm skin. Shorts, long trousers and shoes only neutral charcoal/black/brown/cream. Absolutely no caps, glasses, earrings, jewelry, hairclips, logos, embroidery or other accessories.
Rows define six distinct characters, repeated with same identity, hair and clothing throughout row:
ROW 1: feminine youthful person, smooth chin-length blunt bob with full straight bangs and rounded face. Teal short-sleeve casual T-shirt, charcoal denim SHORTS, cream socks and charcoal/cream sneakers.
ROW 2: youthful MAN, shoulder-length CENTER-PARTED softly straight hair, thicker eyebrows, gentle male face, modest slightly broader shoulders, teal SLEEVELESS tank top, charcoal SHORTS, cream socks and cream sneakers. Long-haired MALE, not female.
ROW 3: feminine youthful person, long straight hair down to hips with wispy full bangs and oval round face, TEAL LONG-SLEEVED collared button shirt with rolled cuffs, charcoal SHORTS and dark shoes.
ROW 4: youthful MAN, short soft SIDE-PARTED hair with subtle loose waves, teal SHORT-SLEEVE COLLARED button shirt, charcoal LOOSE LONG TROUSERS covering legs, cream sneakers.
ROW 5: youthful MAN, medium-length rounded bob hair parted in middle and ending around jaw/neck, teal short-sleeve casual T-shirt, charcoal LOOSE LONG TROUSERS and cream/dark sneakers. Long trousers in ALL FOUR frames including wave.
ROW 6: youthful MAN, SHORT CROPPED hair with side-swept fringe, warm round face and visible ears, teal short-sleeve casual T-shirt, charcoal SHORTS, cream socks and charcoal/cream sneakers. No hat.
Columns define animation poses, repeated for every row:
COLUMN 1: neutral standing, feet planted together, both arms relaxed down.
COLUMN 2: walking LEFT FOOT FORWARD, RIGHT ARM FORWARD with bent elbow, left arm back and right leg back. Visible stride.
COLUMN 3: walking RIGHT FOOT FORWARD, LEFT ARM FORWARD with bent elbow, right arm back and left leg back. Clearly REVERSE column 2 arm and leg movements, not duplicate.
COLUMN 4: cheerful ONE-HAND WAVE, one hand raised beside head palm open, other arm relaxed by side. Both feet planted on same neutral baseline.
Within each row, hold the exact same head size, hair, identity, body scale and center; feet rest on baseline at 87% height of the cell. Poses visibly change the limbs without shifting whole character. 24 separate sprites, four columns six rows, no clipping. Use actual transparent alpha, not a visualization of transparency.
```
