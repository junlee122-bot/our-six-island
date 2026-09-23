# 현재 게임 라운지의 에셋 (2026-09-17)

## 회관과 분장실의 2D 아트

Higgsfield의 GPT Image 2.5로 회관 배경·카지노 배경·독립 테이블과 세 캐릭터 컬렉션을 새로 생성했습니다. **새 생성은 6건, 사용 크레딧은 18(271 → 253)**입니다. 분장실은 앞서 승인된 `dressing-room.png`를 재사용하여 이번 실행에서 다시 생성하지 않았습니다. 앞선 콘셉트 3장 제작의 9크레딧은 이번 18크레딧과 별도입니다.

| 배포 원본 파일 | 제작·재사용 | 용도 |
|---|---|---|
| `public/assets/lounge/club-room.webp` | 새 회관 배경 | 사람과 이동식 테이블을 포함하지 않는 로비 배경 |
| `public/assets/lounge/club-casino.webp` | 새 카지노 배경 | 같은 건물의 저녁 게임방 배경 |
| `public/assets/lounge/club-table.webp` | 새 독립 테이블 | 배경과 분리하여 배치하는 테이블 그림 |
| `public/assets/lounge/club-wardrobe.webp` | 기존 `dressing-room.png` 재사용 | 분장실 왼쪽 착용 미리보기 배경 |
| `public/assets/lounge/club-friends-classic.webp` | 새 기본복 시트 | 일곱 친구의 기본복 |
| `public/assets/lounge/club-friends-street.webp` | 새 스트리트룩 시트 | 일곱 친구의 스트리트룩 |
| `public/assets/lounge/club-friends-smart.webp` | 새 외출복 시트 | 일곱 친구의 외출복 |

각 캐릭터 시트는 4열 × 2행으로 도원·강재·민서·승준 / 민재·재민·호현·빈칸 순서입니다. 세 컬렉션의 **일곱 친구 × 세 의상 = 21개 전신 모습**이며, 21명의 다른 인물이 아닙니다. 기존 얼굴 특징과 의상 디자인을 기준으로 선화와 명암을 정리했습니다. 시트의 파란 머리는 런타임 염색용이고, 마젠타 배경은 렌더러에서 제거합니다. 실제 화면의 머리색은 저장된 코디를 따릅니다.

새 WebP 7개는 생성 아트를 게임용 이미지로 변환한 파일입니다. 도원의 와이드 팬츠·데님·미쿠 복장, 만두머리, 응원 머리띠와 기존 모자·안경·꽃 머리핀은 원래 자산을 유지합니다. 따라서 도원의 모든 추가 코디를 새 그림으로 다시 만든 것은 아닙니다. 기존 의상의 걷기·인사 프레임과 호랑이 임티, 화투·체스 SVG도 재사용합니다.

회관·카지노는 **2D 배경·테이블 이미지와 Canvas 캐릭터**를 합성합니다. 내 방의 ‘방 산책’은 Three.js로 렌더링하는 실시간 3D 방이며, 기존 Canvas 캐릭터를 빌보드로 표시합니다. 3D 캐릭터 모델·리깅은 만들지 않았습니다. 분장실과 산책방은 같은 코디·염색 렌더러를 사용합니다. 분장실의 옷 중심 썸네일은 기존 전신 그림을 화면에서 잘라 보여주며 원본 인물 그림을 별도 도형으로 대체하지 않습니다.

## Pages 이미지 패키징

`app/lounge-assets.ts`는 현재 **119개 고유 이미지**를 참조합니다. `scripts/build-standalone.mjs`는 각 파일의 SHA-256 앞 12자리를 파일명에 넣어 `docs/assets/`에 저장하고, 게임의 이미지 경로를 `./assets/...` 상대 URL로 바꿉니다. 코드와 스타일은 `docs/index.html`에 포함하지만 이미지는 Base64로 내장하지 않습니다. HTML과 해당 이미지 파일을 함께 게시해야 하며, 이미지별 캐시를 재사용하고 내용이 바뀐 파일은 새 URL로 받습니다. 별도의 서비스 워커나 오프라인 로그인 기능을 추가한 것은 아닙니다.

119개는 현재 라운지의 이미지 참조 수입니다. `docs/assets/`에 남은 이전 버전의 해시 파일이나 보존된 `theater.html`·`island.html` 내부 이미지는 이 수에 포함하지 않습니다. 아래 과거 제작 기록의 생성 도구·해상도·프롬프트는 당시 원본에 대한 기록이며, 현재 공통 컬렉션과 방의 사용 경로는 위 WebP 표를 기준으로 합니다.

## 섯다 테이블

고스톱에서 사용하는 원본 화투 SVG 중 `m01-01`~`m10-02`의 20장(각 월의 01·02 파일)을 수정 없이 재사용합니다. Spenĉjo / Marcus Richert / Louie Mantia Jr.의 CC BY-SA 4.0 출처와 아래 화투 라이선스를 유지합니다. 섯다 전용 화면의 천 테이블·패 뒷면·월 표시·배분 모션은 CSS로 제작했으며 섯다 추가 당시 별도 이미지를 생성하지 않았습니다. 카드 자체가 벡터라 확대해도 선명하고, 현재는 위 Pages 패키징 방식으로 별도 이미지 파일을 참조합니다.

족보 구현은 [한게임 공식 화투 가이드](https://mgostop.hangame.com/guide/combine/04_04_game_mode.html)를 참고했습니다. 멍텅구리 구사의 9땡 한도와 재경기 정책 등 실제 적용한 규칙은 README 및 게임 안에 명시합니다.

## 도원 추가 코디

내장 imagegen으로 기존 도원의 얼굴·전신 그림을 참조해 아래 에셋을 각각 1회 생성했습니다. 의상과 머리는 완전한 전신 그림으로 교체하고 응원 머리띠는 이마 위치에 맞춰 올립니다. 그림의 원본 파일은 보존하고, 머리 부분만 런타임에서 염색해 청바지·미쿠 복장의 색을 유지합니다.

| 파일                                                          | 실제 크기 / 배치   | 내용                                                           |
| ------------------------------------------------------------- | ------------------ | -------------------------------------------------------------- |
| [daowon-outfits.png](public/assets/lounge/daowon-outfits.png) | 1536×1024 RGB, 3×2 | 와이드 팬츠·데님·하츠네 미쿠 복장, 윗줄 단발 / 아랫줄 만두머리 |
| [daowon-buns.png](public/assets/lounge/daowon-buns.png)       | 1254×1254 RGB, 2×2 | 기존 클래식·스트리트 / 스마트·데일리 의상의 만두머리 버전      |
| [hachimaki.png](public/assets/lounge/hachimaki.png)           | 1774×887 RGBA      | 흰 천·붉은 원의 일본 응원 머리띠, 실제 투명 배경               |

정확한 프롬프트: [새 의상](public/assets/lounge/daowon-outfits.prompt.txt), [만두머리](public/assets/lounge/daowon-buns.prompt.txt), [하치마키](public/assets/lounge/hachimaki.prompt.txt). 춘리의 양쪽 만두머리와 하츠네 미쿠 복장을 참고한 생성 팬아트이며 공식 게임·캐릭터 이미지 파일을 다운로드한 것은 아닙니다.

## 기존 라운지 에셋과 원본 제작 기록

고스톱 테이블·패 뒷면·획득패 영역은 CSS로 직접 제작했습니다. 패 내기, 뒤집기, 수거, 상대 피 가져오기 모션은 기존 화투 SVG에 Web Animations를 적용하며, 원본 아트 파일은 변경하지 않습니다. 공개 카드 이동 기록만 각 클라이언트에 전달합니다.

2D 전신 렌더러는 얼굴·몸·옷을 잘라 합성하지 않습니다. 기존 모션 스프라이트와 액세서리를 재사용하고, 의상 변경은 일곱 친구의 완전한 전신 그림을 교체합니다.

| 파일                                                                    | 출처 / 실제 크기                      | 용도                                       |
| ----------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------ |
| friends-motion.png, accessories.png, jaemin-cap.png, hohyeon-friend.png | 기존 생성 에셋 재사용                 | 원래 전신·걷기·인사, 안경, 작은 모자, 호현 |
| lounge-friends-classic.png                                              | 내장 imagegen, 1774×887               | 4×2 배치의 일곱 친구 기본복                |
| lounge-friends-street.png                                               | classic을 참조한 imagegen, 1774×887   | 얼굴과 포즈를 유지한 스트리트룩            |
| lounge-friends-smart.png                                                | classic을 참조한 imagegen, 1774×887   | 얼굴과 포즈를 유지한 외출복                |
| lounge-room.png                                                         | 내장 imagegen, 1536×1024              | 로비 배경                                  |
| wK...wP, bK...bP.svg                                                    | Chessnut / Alexis Luengas, Apache-2.0 | 체스 기물 12개, 원본 그대로                |
| m01-01...m12-04.svg                                                     | Spenĉjo, CC BY-SA 4.0                 | 한국 화투 48장, 원본 그대로                |

생성 시트의 순서: 도원·강재·민서·승준 / 민재·재민·호현·빈칸. 실제 배경은 #fb03fa 또는 #fa04fa에 가까운 마젠타여서 런타임에서 허용 범위로 제거합니다. 청색 머리는 런타임 염색 채널입니다. 시트별 생성은 한 번씩 실행했으며 요청한 2048×1024보다 작은 1774×887 결과를 사용합니다. 전체 프롬프트는 public/assets/lounge/*.prompt.txt에 있습니다. 원본 이미지를 생성 후 업스케일했다고 주장하지 않습니다.

Chessnut 원본: https://github.com/LexLuengas/chessnut-pieces . LICENSE와 COPYRIGHT를 같은 폴더에 보관합니다. chess.js 1.4.0은 BSD-2-Clause이며 CHESS-JS-LICENSE.txt를 보관합니다.

화투는 https://github.com/itsent-lab/hwatu/tree/main/apps/web/public/cards/hwatu 에서 다운로드했습니다. 제작 Spenĉjo, 디자인 Marcus Richert, Louie Mantia Jr.의 원안에 기반합니다. **아트 라이선스는 저장소 코드의 MIT가 아닌 CC BY-SA 4.0**입니다. https://creativecommons.org/licenses/by-sa/4.0/ . HWATU-ATTRIBUTION.txt와 hwatu-verification.json에 원저작물, 출처, 검증값을 보관합니다. 아트 변형은 없으며 SVG를 게임 화면 크기에 맞춰 표시합니다.

기본 규칙 참고: chess.js 공식 저장소, 한게임 3인 고스톱 가이드, 피망 고스톱 가이드(개인 마지막 패의 특수 피 보너스 제외, 1~5피 피박). 지역별 차이가 있는 규칙은 README 및 게임 안 규칙 설명으로 명시합니다.

아래는 보존된 섬·극장 에셋의 이전 기록입니다.

---

# 여섯섬 에셋 제작 기록

2026-09-11 생활 확장판. 새 배경·가구·시설은 OpenAI 내장 `image_gen` 도구로 제작했습니다. 원본 사진은 게임 배포에 포함하지 않습니다.

## 실제 AI 업스케일

지도와 실내 배경은 [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN)의 공식 `realesr-animevideov3-x4` 모델로 각각 **1536×1024 → 6144×4096** 신경망 추론을 수행했습니다. 추론 후 크기를 늘리는 보간은 하지 않았습니다. 지도 구조와 실내 2×2 배치는 유지하며, 최종 배포에는 품질 95 WebP를 사용합니다. 확대된 디테일은 모델이 보완한 표현입니다.

- 런타임: Tencent NCNN 1.0.20260526, CPU 4 threads, tile 256, padding 24.
- 공식 모델 배포: [Real-ESRGAN v0.2.5.0](https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.2.5.0).
- 모델 SHA256: `548a36f9c3f4ab8da56cd3b13badf23968bee207b396dad14d04b830e5f2ab2d`.
- 모델/NCNN: BSD-3-Clause. 참고한 NCNN Vulkan 프런트엔드: MIT. 라이선스 원문은 `licenses/`에 보관합니다. 모델과 런타임은 웹 게임에 포함되지 않습니다.
- 실제 신경망 추론, 원본/결과 크기와 해시 검사, 전체 지도와 확대 비교 이미지 육안 검사를 완료했습니다.

## 로그인 미리보기

`public/assets/lounge/login/*.webp`의 7개 전신은 기존 `loungeSprites().draw()`에 `defaultLook()`를 적용해 440×540 캔버스로 사전 렌더링한 파생 이미지입니다. 투명 lossless WebP 합계 667,580바이트이며 원본 캔버스와 알파·보이는 RGB 픽셀이 일치합니다. 새 AI 생성은 사용하지 않았습니다. 같은 파일을 계정 선택 얼굴과 전신 미리보기에 재사용하고, 등장·인사·대기 움직임은 CSS로 적용합니다. 로그인 전에는 전체 의상·소품 아틀라스를 다운로드하지 않습니다.

## 배포 파일

| 경로                              | 해상도           | 내용                                     |
| --------------------------------- | ---------------- | ---------------------------------------- |
| `public/assets/island-hd.webp`    | 6144×4096        | AI 업스케일한 전체 섬 지도               |
| `public/assets/interiors-hd.webp` | 6144×4096        | 집·상점·공방·박물관, 2×2 배경            |
| `public/assets/furniture.png`     | 1254×1254 RGBA   | 가구 16종, 4×4 투명 아틀라스             |
| `public/assets/facilities.png`    | 1254×1254 RGBA   | 공방·박물관·텃밭·카페, 2×2 투명 아틀라스 |
| `public/assets/friends-v2.png`    | 기존 캐릭터 시트 | 도원·강재·민서·승준·민재·재민            |
| `public/assets/mayor-hohyeon.png` | 기존 캐릭터      | 호현 촌장                                |

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

| 게임 파일                          | 실제 해상도   | 용도                                       |
| ---------------------------------- | ------------- | ------------------------------------------ |
| `public/assets/friends-motion.png` | 1024×1536 RGB | 여섯 캐릭터 × 서기·왼발·오른발·인사 24자세 |
| `public/assets/accessories.png`    | 1774×887 RGBA | 모자 4종·안경 3종·꽃 머리핀                |
| `public/assets/nature-detail.png`  | 1774×887 RGBA | 나무·풀·꽃·돌·나비·갈매기 8종              |

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

## Jaemin original cap restoration (2026-09-14)

- public/assets/jaemin-cap.png: 1683 × 935, AI-redrawn chestnut cap with cream/orange floral embroidery, referenced from Jaemin at bottom right of friends-v2.png.
- Generated using built-in imagegen, followed by one focused crown/transparency correction. The delivered PNG is RGB with a painted neutral checkerboard, despite the transparency request. The character renderer removes its edge-connected neutral backdrop at native resolution before scaling, using the existing motion-sheet cleanup.
- Only Jaemin wearing the cap uses this dedicated asset. It is fitted to each pose at 1.03 times the hair width and near the crown, replacing the generic 1.18-width raised cap. The brim stays above the eyes. Other hats, colors and all other characters are preserved. Saved cap appearances automatically use the updated art.

### Initial generation prompt

```text
Use case: stylized-concept
Asset type: one transparent game accessory sprite, replacement baseball cap for a chibi character.
Primary request: Recreate ONLY the brown embroidered baseball cap worn by Jaemin, the boy at the BOTTOM RIGHT of reference image 1, as a single isolated cap. Restore his original design, with a snug LOW CROWN and compact curved brim. The hat must fit closely to a small round head, never look inflated, tall, oversized, or like a dome.
Input images: Image 1 is the authoritative ORIGINAL design reference (bottom-right boy only). Image 2 is supporting style and camera reference for the bottom-row boy; do not draw the boy.
Subject: one warm dark chestnut-brown baseball cap, softly worn cotton fabric, subtle stitched panels, tiny top button, compact gently curved brim. Preserve the original small cluster of delicate cream and muted-orange daisy embroidery on the front panel, slightly toward the viewer's left. Tiny understated flowers, no lettering, no branding.
Style/medium: polished soft 3D chibi game illustration, matching the original cap's material, color, gentle highlights and lighting.
Composition/framing: frontal view with only a very slight three-quarter turn like the original reference; near-horizontal brim that can overlay the frontal bottom-row head. Visibly low shallow crown. Total visible cap width divided by total visible cap height approximately 1.8 (between 1.7 and 1.9), including brim. One centered cap, full silhouette uncropped. Useful content fills most of a close landscape canvas with modest transparent margins.
Scene/backdrop: genuine transparent RGBA background, clean antialiased alpha cutout; preserve actual transparency.
Constraints: exactly ONE cap and no other assets. No head, face, ears, hair, neck, body, hands, mannequin, stand, floor, scenery, backdrop, shadow outside the cap, checkerboard pattern, lettering, watermark, or text. Do not reproduce any other character or accessory from either reference.
```

### Focused correction prompt

```text
Use case: precise-object-edit
Asset type: ONE production-ready transparent PNG game accessory sprite.
Edit target: the single brown embroidered cap in the reference image.
Change only these two issues:
1. Reduce the crown height enough that the visible cap silhouette width / total height is approximately 1.8. Flatten the crown into a snug low-profile baseball cap, maintaining natural seam curvature and a compact curved brim. Keep the chestnut brown material, frontal slight-three-quarter orientation, and small cream/orange daisy embroidery.
2. REMOVE THE ENTIRE CHECKERBOARD BACKGROUND and replace it with REAL ALPHA TRANSPARENCY. The checkerboard visible in the input is unwanted painted pixels, NOT the desired background. Every pixel outside the cap must have alpha = 0. Generate an actual RGBA PNG with a genuine transparent background and antialiased alpha edges. Do not draw a checkerboard, gray/white squares, white background, or any backdrop.
One cap only, centered in a tight landscape frame with modest transparent margin, full silhouette visible. No head, face, ears, hair, body, mannequin, floor, stand, exterior shadow, text, watermark or other object. Preserve the embroidered flower design and soft polished chibi game style, making the flower cluster a little smaller only if needed to remain comfortably inside the lower crown.
```

## 우당탕 극장 에셋 (2026-09-15)

OpenAI 내장 imagegen으로 새 에셋 세 장을 생성했습니다. 원본 사진은 배포하지 않습니다. 호현은 일곱 번째 남성 친구로 다시 그렸으며 수염, 콧수염, 턱수염, 수염 그림자를 넣지 않았습니다.

| 파일                                | 실제 해상도 | 처리                                                                                                       |
| ----------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| public/assets/hohyeon-friend.png    | 1024 × 1536 | RGB의 그려진 체크 배경을 런타임에서 연결 영역으로 제거. 얼굴 비율을 유지하고 기존 여섯 친구와 크기를 맞춤. |
| public/assets/theater-wardrobe.png  | 1254 × 1254 | 실제 RGBA. 4×4로 먼저 나누고 각 셀의 의상 영역을 분리. 상의 8종, 하의 4종, 신발 4종.                       |
| public/assets/theater-backstage.png | 1536 × 1024 | 극장 배경. 무대 및 단체 기념사진에 사용.                                                                   |

기존 friends-motion.png, accessories.png, jaemin-cap.png를 재사용합니다. 신체와 의상은 Canvas에서 층별로 합성하며, 분리된 의상과 신발 사이의 발목은 연속된 도형으로 연결합니다. 얼굴, 머리, 의상과 배경 일러스트는 생성 에셋입니다. 분장 미리보기의 흔들기·인사·기쁨 모션은 합성 캐릭터의 이동/회전/배율 애니메이션입니다. 새로운 보행 스프라이트를 생성했다고 표기하지 않습니다.

### hohyeon-friend 생성 프롬프트

```text
Use case: identity-preserve
Asset type: ONE full-body chibi adult male actor sprite for a friendly sitcom dress-up game.
Input images: Image 1 is HoHyeon's identity reference. Image 2 is the authoritative visual style and body proportion reference for his six equal friends. This is a redesign of ONLY the man in image 1.
Primary request: Make HoHyeon the seventh equal friend, with a more handsome soft refined male face: warm skin, gentle symmetrical expressive brown eyes, neat natural eyebrows, a calm friendly closed-mouth smile. Youthful ADULT MAN, not a child. Preserve his recognizable identity while softening the heavy brows and facial shapes.
CRITICAL face change: COMPLETELY CLEAN SHAVEN. Absolutely NO beard, moustache, stubble, goatee, cheek whiskers, hair flecks, dark moustache area, or facial-hair shadow. His entire upper lip, cheeks, chin and jaw are smooth warm skin.
Style/medium: Match image 2's soft polished painterly 2.5D chibi game art, big expressive head with delicate face, warm soft lighting, small adult-styled body. Head including hair is about 42 percent of total full-body height.
Hair: neat natural side-part hairstyle, short at sides, soft swept locks on top. Although his natural hair is black, render ALL hair using cobalt BLUE #3154ac as the main color for a runtime recolor mask. Only hair is blue; eyebrows stay dark and natural.
Neutral costume: simple plain TEAL T-shirt #20b3ad for runtime recoloring, charcoal shorts, clean white low-top shoes. Neck visible. Arms relaxed straight down with hands well away from face, feet comfortably apart.
Composition: one front-facing full-body figure, centered, entire head and both feet visible with modest surrounding margin. No action pose.
Background: genuine transparent PNG with an actual ALPHA channel, every pixel outside the figure alpha 0. DO NOT DRAW the checkerboard from image 2 and do not draw white paper.
Remove all original accessories: NO cap or hat, NO glasses, NO backpack, NO bag, NO ball, NO handheld props, NO jewelry. No other character, labels, letters, logos, frame, floor or external shadow.
```

### theater-wardrobe 생성 프롬프트

```text
Use case: stylized-concept
Asset type: ONE modular paper-doll wardrobe atlas for a polished chibi dress-up game, 2048 by 2048 square canvas.
Layout: EXACTLY FOUR COLUMNS and FOUR ROWS, sixteen equal square cells. Cells have NO drawn borders. Each piece is centered in its own square and entirely inside that square with approximately 15 percent margin. Read the ordering strictly left to right, then top to bottom.
Style/medium: soft painterly 2.5D chibi game illustration, softly rounded forms, refined material textures, warm even lighting. Front camera with only slight elevation. All clothes have a SMALL ADULT CHIBI torso shape with short compact proportions, not tall adult proportions. Consistent perspective, centered symmetry, scale and lighting across atlas.
Clothing presentation: garments alone, shaped as if worn on an INVISIBLE BODY, not flat-lay. Hollow neckline and open sleeve ends. No human body, mannequin, hanger, head, face, neck, hair, hands, arms, legs or skin anywhere.
ROW 1 — FOUR UPPER BODY GARMENTS:
Column 1: white casual short-sleeve T-shirt.
Column 2: ochre roomy hoodie, hood resting behind collar, not raised.
Column 3: navy suit jacket over a cream shirt.
Column 4: chestnut detective trench-coat UPPER BODY ONLY, hem ending at the upper hips, with lapels and double-breasted buttons.
ROW 2 — FOUR UPPER BODY GARMENTS:
Column 1: white chef's double-breasted coat.
Column 2: pastel lavender pajama shirt.
Column 3: blue denim jacket over a white T-shirt.
Column 4: crimson knit cardigan over a white T-shirt.
All eight upper-body garments have the SAME shoulder location and their hems end at the SAME upper-hip height within their cells. Sleeves are visible, descend naturally at the sides in a relaxed pose; cuffs or sleeve holes are open with absolutely NO HANDS.
ROW 3 — FOUR LOWER BODY GARMENTS:
Column 1: charcoal straight trousers.
Column 2: indigo denim shorts.
Column 3: cream pleated skirt.
Column 4: lavender pajama trousers.
Lower garments only, waist visible, no legs, skin, shoes or feet.
ROW 4 — FOUR PAIRS OF FOOTWEAR:
Column 1: a pair of cream sneakers.
Column 2: a pair of brown ankle boots.
Column 3: a pair of red canvas trainers.
Column 4: a pair of yellow soft slippers.
Each footwear cell contains exactly ONE matching pair of shoes standing side by side facing the camera, without legs or feet.
Background: actual transparent RGBA PNG. Every pixel outside the clothing pieces must have alpha 0, including all margins and space between cells. No white canvas or checkerboard pixels.
Constraints: exactly sixteen complete clothing assets, no missing cells, no duplicate garments, materially distinct silhouettes rather than simple recolors. No labels, writing, logos, grid lines, humans, mannequins, stand, floor, room, background, or cast shadows outside the pieces.
```

### 카지노 배경과 홀덤 테이블

- `public/assets/lounge/casino-room.png`: 이미지 생성 도구로 새로 제작한 1536×1024 RGB 배경. 따뜻한 원목·녹색 벨벳·황동 조명과 빈 중앙 바닥. 인물·텍스트·로고 없음. 생성 1회, 원본 그대로 사용.
- 정확한 생성 프롬프트: [casino-room.prompt.txt](public/assets/lounge/casino-room.prompt.txt).
- 홀덤 카드 52장, 카드 뒷면, 칩, 펠트 테이블은 `app/lounge-poker-table.tsx`와 `app/lounge-casino.css`에서 직접 구현한 벡터/텍스트/CSS 그래픽입니다. 외부 카드 이미지를 복사하지 않았습니다. 딜러 아이콘은 기존 Lucide 의존성을 사용합니다.
- 게임 규칙 참고: [PokerStars Texas Hold'em](https://www.pokerstars.com/poker/games/texas-holdem/), [Poker TDA 규칙 47 — 짧은 올인과 베팅 재개](https://www.pokertda.com/view-poker-tda-rules/). 규칙 엔진과 화폐 원장은 직접 구현했습니다.

### 블랙잭 테이블

- 기존 카지노 배경, `PokerCard` 카드 컴포넌트와 Lucide 딜러 아이콘을 재사용했습니다. 새 외부 이미지나 의존성을 추가하지 않았습니다.
- `app/lounge-blackjack-table.tsx`와 `app/lounge-blackjack.css`에서 버건디 펠트, 공개 카드·합계, 여러 손, 딜러와 베팅 버튼을 구현했습니다. 이동 효과는 카드 배분 시 적용하고 동작 줄이기 설정을 따릅니다.
- 기본 규칙 참고: [Bicycle — Blackjack](https://bicyclecards.com/how-to-play/blackjack). 이 게임의 6덱/S17/스플릿 1회/보험·서렌더 제외 조건은 게임 내 안내와 README에 명시합니다. 딜러와 정산은 자체 규칙 엔진이며 외부 AI API는 호출하지 않습니다.

### theater-backstage 생성 프롬프트

```text
Use case: stylized-concept
Asset type: ONE original game backdrop, landscape 1536 by 1024 pixels, for a cozy chibi friends' rehearsal and dressing studio. This is a usable scene background, not a mockup.
Scene: a colorful small theater rehearsal studio seen straight on in an almost orthographic front view with subtle depth. A muted teal back wall with one tall arched stage opening centered on the wall. Warm honey-colored wooden stage floor spans the full width of the bottom third.
Composition: Reserve the BROAD CENTRAL 70 PERCENT OF THE IMAGE as visually calm open wall, unobstructed arch area and empty stage floor where chibi avatars and game interface can later be overlaid. Keep all furnishings at the extreme edges. No person or furniture blocks the central floor.
Leftmost edge: a tall dressing-room mirror outlined by warm amber round bulb lights, partly tucked behind rich midnight-navy and raspberry-plum velvet curtain fabric.
Rightmost edge: a small tasteful hanging clothes rack with a few colorful garments, tucked close to a raspberry-plum and midnight-navy velvet curtain at the outer frame.
Lighting/mood: warm inviting theatrical light, soft broad amber spotlight landing on the clear central floor, gentle shadows and restrained detail, no harsh glare. Beautiful velvet fabric folds on far left and right.
Style/medium: polished soft painterly 2.5D theatrical chibi game environment with rounded forms and tactile materials, charming and cozy, compatible with big-headed illustrated friend characters. Attractive harmonious muted teal, deep navy, raspberry plum and warm amber palette.
Constraints: no people, characters, faces, silhouettes of people, text, numbers, letters, signs, logos, watermarks, UI panels, buttons, screenshots, foreground furniture, clutter, or props across the central floor. Only one scene; landscape full-bleed opaque illustration.
```
## 범티콘 감정 스티커 (2026-09-17)

`public/assets/lounge/reactions/`에 웃음(laugh), 놀람(wow), 눈물(cry), 하트(love), 응원(cheer), 고민(think), 미안(sorry), 인사(hello) 8종을 추가했습니다. OpenAI 내장 imagegen으로 각 에셋을 개별 생성한 원본 1254 × 1254 RGBA PNG이며 투명 배경과 흰 스티커 테두리를 유지했습니다. 인터넷에서 가져온 캐릭터나 게임 원화는 사용하지 않았습니다.

정확한 생성 프롬프트는 `public/assets/lounge/reactions/prompts.json`에 보관합니다. 공통 디자인은 따뜻한 주황색·크림색의 작은 호랑이, 갈색 외곽선, 평면 2D 메신저 스티커, 텍스트 없이 감정과 손동작으로 표현하는 방식입니다. 원본 PNG를 편집·크롭하지 않고 게임에 포함했습니다.

로비·카지노 및 체스·고스톱·섯다·홀덤·블랙잭 화면의 **스티커** 버튼으로 전송합니다. 같은 방의 같은 공간/게임 화면에서 보낸 사람 이름과 함께 최대 3개를 표시하며, 각 반응은 6초 후 사라집니다. 1.8초 전송 간격, 표시 숨기기, 모션 줄이기 설정을 지원합니다. 유효 시간이 지난 스티커는 재접속 때 재생되지 않으며 계정 코디/지갑 기록을 변경하지 않습니다.

## 개인 방과 배치 소품 (2026-09-18)

Higgsfield의 `gpt_image_2_5`, high, 4K 설정, 3:2로 빈 방 1장과 소품 아틀라스 3장을 생성했습니다. 실제 출력은 각각 3504×2336입니다. 기존 승인된 `club-wardrobe.webp`를 스타일 참고로 제공했습니다. 생성 4회에 총 18크레딧을 사용했습니다.

`public/assets/lounge/bedroom/`에는 빈 방 배경 1장과 투명 배경 소품 28개의 WebP를 저장합니다. 가구 11종, 러그, 인형·쿠션 3종, 음악 소품 2종, 식물·책·티 세트·피규어·머리띠·카메라 7종, 벽 장식 4종입니다. 이미지를 다시 그리는 후처리 없이 아틀라스에서 각 물체를 분리하고 투명 여백을 정리하여 WebP로 변환했습니다. 서로 살짝 넘어간 셀 세 곳은 빈 공간에서 추출 경계를 조정해 이웃 소품이 섞이지 않게 했습니다.

정확한 프롬프트, 생성 작업 ID, 각 소품의 원본 추출 좌표와 크기는 [generation.json](public/assets/lounge/bedroom/generation.json)에 기록했습니다. 배경의 벽·바닥 색과 가구 위치·크기·반전은 앱에서 표시할 때 적용하며, 사용자 입력으로 외부 이미지 URL이나 HTML을 저장하지 않습니다. 캐릭터는 기존 2D 아바타를 재사용합니다.


## 2026-09 도원 산책방과 중국풍 코디

산책방의 소파와 튤립은 kArchive의 실제 GLB 두 파일을 사용합니다. 자료: kArchive · 출처: 쓰레드 dogfooter. 모델별 원본 주소와 이용 조건은 `public/models/lounge/ATTRIBUTION.md`에 기록했습니다. 침대·책상·선반·벽·바닥·창문은 Three.js 도형으로 제작했습니다. 모델은 내장 텍스처와 함께 content hash URL로 Pages에 배포하며 방을 열 때만 다운로드합니다. 기존 2D 꾸미기 배치는 별도 보존하고 벽·바닥색은 두 보기에서 공유합니다.

`public/assets/lounge/dowon-shampoo-atlas.png`는 Higgsfield GPT Image 2.5, 2K/high로 생성한 2048×1360 그림입니다. 작업 ID: `288df657-627d-456e-b1dc-3ef19b886f06` (2026-09-19). 기존 `daowon-outfits.png`를 얼굴·그림체 참고로 사용했습니다. 2×1 셀은 기본 단발과 만두머리이며, 청록색 차이나 칼라·매듭 장식·아이보리 바지의 동일 의상입니다. 파란 머리와 마젠타 배경은 기존 런타임 염색·배경 제거 규약을 따릅니다.

새 `hairColor`/`skinColor`는 6자리 HEX 값이며 머리·피부만 Canvas에서 다시 칠합니다. 그림의 명암·선화와 의상 원색은 유지합니다. 저장 파일에는 색상값만 저장하고 픽셀 이미지나 모델을 저장하지 않습니다.

## 2026-09-23 아카츠키 코스튬

사용자가 요청한 나루토 아카츠키의 검은 망토·붉은 구름 디자인을 참고해, 기존 `club-friends-classic.webp`의 일곱 친구 그림체와 얼굴을 유지하는 새 의상을 Higgsfield GPT Image 2.5로 생성했습니다. 원화나 게임 스크린샷을 다운로드해 복사하지 않았습니다. 작업 ID는 `ecaf0007-edca-4304-821e-8505800f91dd`이며 생성 1회, high/4K/3:2 설정입니다. 생성 전 표시된 예상 비용은 4.25크레딧입니다.

원본 `akatsuki-atlas.png`는 3504×2336, 4×2 셀입니다. 첫 일곱 셀은 도원·강재·민서·승준·민재·재민·호현, 마지막 셀은 도원 만두머리입니다. 런타임 `akatsuki-atlas.webp`는 같은 해상도의 quality 95/effort 6 WebP이며 951,564바이트입니다. 원본 PNG를 보관하고 피부·머리 염색 및 마젠타 배경 제거 후 외곽을 확인했습니다. 안경·모자·머리띠는 기존 액세서리를 조합합니다.

정확한 생성 프롬프트, 작업·원본 주소, 셀 순서와 런타임 해시는 [akatsuki-generation.json](public/assets/lounge/akatsuki-generation.json)에 기록합니다. 새 의상에만 목과 샌들의 노출 피부 마스크를 적용해 붉은 구름·크림 테두리·검은 망토색을 유지합니다.
