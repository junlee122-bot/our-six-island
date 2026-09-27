# 범타듀 밸리 모드(Mod) 시스템 설계

작성일 2026-09-26 · 대상: 오너(호현) + 모드를 만들 친구들 · 상태: 설계안(코드 변경 없음)

> 한 줄 결론: **"데이터만 담긴 콘텐츠 팩(A) + 내 화면에만 적용되는 꾸미기 모드(B)"를 먼저 만들고, 스크립트 모드(C)는 보류합니다.** 팩은 이 저장소의 `mods/` 폴더(또는 별도 팩 저장소)에 두고 GitHub Actions가 검증·번들해서 Edge 함수와 Pages 클라이언트에 **같은 해시**로 싣습니다. 세계 저장(JSON)에는 `모드id:항목id` 문자열만 남기고, 모드를 꺼도 아이템은 지워지지 않고 "잠든 상태"로 보존합니다.

---

## 0. 코드에서 확인한 현재 구조 (설계의 근거)

| 관찰 | 위치 | 모드 설계에 주는 의미 |
|---|---|---|
| 콘텐츠가 TS 상수 표로 하드코딩 | `app/lounge-items.ts`(FISH·BUGS·FORAGE·DISHES·FURNITURE·CRAFTS·PROJECTS·SPAWN_SPOTS·FESTIVAL_SOUVENIRS·HOUSE_TIERS), `lounge-life.ts`(CROP_INFO·SHOP·PALETTES), `lounge-life-plus.ts`(BUNDLES·요리 레시피·수요 반감기), `lounge-bedroom-catalog.ts`(ROOM_CATALOG), `lounge-friend-lines.ts`, `lounge-social-defs.ts`, `lounge-calendar.ts`(HOLIDAYS·FRIEND_PROFILES), `lounge-look.ts`(COLLECTIONS·HATS), `lounge-model-assets.ts`(LOUNGE_MODELS), `lounge-liar-words.ts`, `lounge-sfx-files.ts`, `lounge-music-tracks.ts` | 표 → **레지스트리**로 바꾸는 것이 1순위 작업. 대부분 이미 "순수 데이터 + `*_BY_ID` 색인" 형태라 전환 비용이 낮음 |
| 작물이 문자열 **유니온 타입** | `lounge-life.ts` `type Crop = 'carrot' \| ...`, `CROP_INFO: Record<Crop, …>`, `isCropId` = `CROPS.includes` | 모드 작물을 받으려면 `Crop`을 `string` 브랜드 타입으로 풀고 레지스트리 조회로 바꿔야 함(가장 품이 큰 리팩터) |
| 저장 읽기가 **모르는 id를 버림** | `lounge-life-plus.ts` `readUserExt`: `counts(x.inv, isItemId)`; `readLifeExt`: museum `isMuseumId`, bundles/projects는 정의 목록만 순회 | **모드를 끄면 다음 쓰기 때 아이템이 조용히 사라짐.** 모드 시스템 전에 "모르는 id 보존(dormant)" 규칙이 필수 |
| 서버 권위 + 단일 월드 행 | `supabase/functions/hohyeon-api/index.ts` → `cloudTransition(row.state, …)` + `hh_world_save` CAS(최대 12회 재시도), 월드 6,000,000바이트 상한(마이그레이션 `octet_length(p_state::text)>6000000`), 프로필 세이브 65,536바이트 | 팩 정의는 **월드에 넣지 않는다**(용량). 월드엔 id·수량만 |
| Edge 함수 = `app/*.ts` esbuild 번들 | `.github/workflows/edge.yml` (`app/*.ts` 변경 시 tsc·test 후 배포) | 팩 데이터를 **빌드 시 번들**하는 게 가장 단순하고 결정적 |
| 경제 원장 불변식 | `lounge-economy.ts` `validateLedger`: 잔액+예약+하우스−발행 = 초기 총액, `grantBeom`만 발행 | 모드는 원장 함수를 직접 못 부름. 가격·보상은 **상한이 있는 선언형 필드**로만 |
| 에셋 매니페스트 + 콘텐츠 해시 | `lounge-assets.ts`, `lounge-model-assets.ts`, `scripts/build-standalone.mjs`(sha256 12자리 파일명, 없는 파일은 `''`로 비움) | 팩 에셋도 같은 파이프라인에 태우면 캐시·Pages·데스크톱이 공짜로 따라옴 |
| 출처 기록 문화 | `ASSETS.md` 출처표(kArchive "출처 표기 필수, 재판매 금지", Kenney CC0, hwatu CC BY-SA), `public/models/lounge/ATTRIBUTION.md`, `licenses/` | 팩 매니페스트에 **에셋별 출처·라이선스 필드를 강제**하고 크레딧 화면을 자동 생성 |
| 데스크톱 CSP | `desktop/src-tauri/tauri.conf.json` `script-src 'self'`, connect-src는 Supabase만 | 로컬 모드 폴더에서 **JS 실행 불가**(좋음). 이미지·오디오는 `blob:`로 읽을 수 있음 |
| 친구 대사 파일이 이미 "비개발자 편집용" | `lounge-friend-lines.ts` 머리말(치환자 `{me}` `{season}` 등, 60자 권장) + 게임 내 "내 대사 쓰기" | 대사 팩 형식은 이 규칙을 그대로 옮기면 됨 |

(참고: 요청에 적힌 skills/tools/research/materials·realty·가구점 파일은 현재 브랜치에 아직 없음. 그 시스템도 처음부터 레지스트리 방식으로 만들면 이후 모드 대상이 됨.)

---

## 1. 참고 사례 분석

| 게임 | 방식 | 잘된 점 | 위험·한계 | 우리에게 |
|---|---|---|---|---|
| **RimWorld** | XML Defs(데이터) + C# 어셈블리 + Harmony 런타임 패치, `About.xml`(packageId, supportedVersions, 의존성·loadBefore/After), XML PatchOperations(xpath로 기존 Def 수정), Steam Workshop | 데이터와 코드의 분리. **PatchOperation**으로 "기존 것을 조금만 고치기"가 가능. packageId 네임스페이스와 로드 순서 규칙이 명확 | Harmony는 무엇이든 바꿀 수 있어 충돌·크래시의 온상. 멀티 없음 | **Defs + PatchOperation 모델을 그대로 차용**(JSON 버전). Harmony식 코드 패치는 배제 |
| **Project Zomboid** | Lua 스크립트 + `media/` 폴더(텍스처·사운드·스크립트 텍스트), `mod.info`, Workshop; 멀티 서버는 서버 설정에 `Mods=`·`WorkshopItems=` 목록 → 접속 시 클라이언트가 자동 다운로드·체크섬 검사 | **서버가 모드 목록의 주인**이고 클라이언트는 따라 받는다 — 우리 구조와 동일. 폴더 구조가 직관적 | Lua가 클라이언트에서도 돌기 때문에 치트·불일치. 버전 불일치 시 "접속 불가" 체험이 나쁨 | "서버 활성 목록 → 클라이언트 동기화 + 해시 검증" 흐름 차용. 불일치는 **자동 재다운로드**로 해결 |
| **Stardew Valley — SMAPI** | C# 모드 로더, 이벤트 API, `manifest.json`(UniqueID, Version, MinimumApiVersion, Dependencies, UpdateKeys) | 매니페스트 표준이 훌륭(SemVer, 의존성, 업데이트 키). 호환성 목록·로그 파서 같은 생태계 도구 | 코드 모드는 멀티에서 모두가 같은 모드를 가져야 함, 보안 없음 | **manifest 필드 구성을 거의 그대로 차용** |
| **Stardew — Content Patcher** | 코드 없는 JSON 콘텐츠 팩: `Load`(새 에셋), `EditData`(기존 데이터 항목 추가/수정), `EditImage`, 조건(`When`: 계절·날씨·요일), 토큰 | 친구도 만들 수 있을 정도로 쉬움. **데이터 편집 연산 + 조건**만으로 대부분 표현. 가장 큰 모드 생태계를 만든 방식 | 조건·토큰이 복잡해지면 사실상 언어가 됨. 같은 필드를 두 팩이 고치면 조용히 덮어씀 | **우리 A형의 직접 모델**. 조건은 우리 달력 필드(계절·요일·명절)로 제한, 충돌은 **명시적 오류** |
| **Minecraft 데이터팩 / 리소스팩** | 데이터팩: 서버 쪽 JSON(레시피·전리품표·태그·기능) `namespace:path`; 리소스팩: 클라이언트 텍스처·사운드·언어, 서버가 권장 리소스팩 배포 가능, `pack_format` 버전 | **서버 데이터(게임플레이) vs 클라 리소스(외형)의 깔끔한 2분할**. `namespace:id`, 태그(분류)로 확장 | pack_format이 자주 깨짐 | **A/B 티어 분리와 `modid:id` 네임스페이스, 태그** 차용. `gameVersion` 범위 필드 |
| **Factorio 모드 포털** | Lua(결정적 락스텝 멀티), `info.json`(name, version, factorio_version, dependencies: `? optional`, `! incompatible`, `~` 로드순서 무관), 서버 접속 시 모드 목록·버전·**체크섬 동기화**, 포털에서 원클릭 받기 | 모든 피어가 같은 모드·같은 버전이어야 한다는 것을 **도구가 강제**. 의존성 문법이 간결 | 락스텝이라 결정성 요구가 극단적 | 우리는 서버 권위라 결정성 부담이 훨씬 적지만, **"팩셋 해시"로 서버·클라이언트 일치 확인**은 차용. 의존성 문법(`?`, `!`) 차용 |
| **Terraria tModLoader** | C# 모드, 서버가 모드를 가진 클라이언트에 자동 전송, 모드 브라우저 | 서버→클라이언트 자동 전송이 편함 | 임의 코드가 친구 PC에서 실행됨(보안) | 자동 전송은 좋지만 **실행 코드 전송은 금지** |
| **Valheim / BepInEx** | 범용 Unity 플러그인 로더, 대부분 클라이언트 측, 서버 강제 없음 | 설치가 쉬움 | 버전 불일치·치트·세이브 오염이 일상 | "강제 없는 자유 로드"의 반면교사 |

**작은 친구 멀티 게임에서 통하는 것**
1. 서버가 모드 목록의 주인(Zomboid·Factorio) — 우리는 이미 서버 권위라 자연스러움.
2. 코드 없는 데이터 팩(Content Patcher·데이터팩) — 친구 7명 중 개발자가 아닌 사람도 가구·옷·대사를 넣을 수 있음.
3. 네임스페이스 id(`modid:item`)와 SemVer 매니페스트(SMAPI).
4. 외형 전용 모드는 개인 자유(리소스팩).

**위험한 것**
1. 임의 코드 실행(Harmony·BepInEx·tModLoader) — 친구 PC·서버 보안, 원장 불변식 우회.
2. 조용한 덮어쓰기(두 팩이 같은 필드 수정).
3. 모드 제거 시 세이브 오염 — 우리 코드는 이미 "모르는 id 버림" 상태라 특히 위험.
4. 월드 크기 폭증(6 MB 상한) — 정의를 월드에 저장하면 금방 참.

---

## 2. 원칙과 티어

### 원칙
- **P1 서버 권위 유지**: 게임플레이에 영향을 주는 모든 데이터는 Edge 함수가 가진 레지스트리가 정답. 클라이언트는 같은 팩셋(해시)을 받아 표시만 한다.
- **P2 데이터만, 코드 없음**: A형 팩에는 실행 코드가 들어갈 수 없다(JSON + 이미지/모델/오디오). 수식·스크립트 문자열도 금지.
- **P3 월드엔 id만**: 월드 JSON에는 `modid:itemId`와 수량·상태만. 정의·텍스트·에셋은 팩에.
- **P4 끄기는 안전하게**: 모드를 꺼도 데이터 손실 없음(잠든 id 보존), 다시 켜면 복귀.
- **P5 경제는 원장이 지킨다**: 팩은 범을 발행하는 새 경로를 만들 수 없고 기존 수도꼭지(판매·보상)를 상한 안에서만 쓴다.
- **P6 충돌은 시끄럽게**: 두 팩이 같은 것을 고치면 빌드가 실패하거나 명시적 우선순위가 필요.
- **P7 출처는 필수**: 에셋마다 출처·라이선스. 없으면 검증 실패.

### 티어

| 티어 | 이름 | 내용 | 누가 설치 | 어디서 적용 | 서버 영향 |
|---|---|---|---|---|---|
| **A** | 콘텐츠 팩 | 아이템·작물·물고기·벌레·채집물·요리/제작 레시피·가구·옷(컬렉션)·방 테마·친구 대사·명절/축제·라이어 제시어·음악/효과음·마을 공사·꾸러미 | 오너(서버) | 서버 + 모든 클라이언트(자동 동기화) | 있음(레지스트리) |
| **B** | 꾸미기 모드(클라이언트 전용) | UI 테마(CSS 변수 팔레트), 텍스처·효과음·배경음 교체, HUD 배치, 키 프리셋, 폰트 | 각자(웹: 설정에서 파일 업로드→IndexedDB, 데스크톱: 로컬 폴더) | 내 화면만 | 없음 |
| **C** | 스크립트 모드 | 새 규칙·미니게임 | — | — | **지금은 지원하지 않음** |

### C형(스크립트) 결정: **보류 권장**
- 선택지 검토
  - QuickJS-WASM을 Edge 함수에 넣어 샌드박스 실행: WASM 약 500 KB~1 MB가 번들에 추가, 요청마다 VM 기동(수~수십 ms), 연산 한도·메모리 한도 관리, CAS 재시도 12회마다 재실행. 원장·월드를 넘기는 API 설계가 사실상 "게임 엔진 공개 API"를 새로 만드는 일.
  - SES(Hardened JS) `Compartment`: 번들은 작지만 Deno Edge에서 `lockdown()`이 전역을 동결 → 기존 코드·supabase-js와 충돌 위험, 무한 루프를 못 끊음.
  - Web Worker/iframe 샌드박스(클라이언트만): 서버 권위가 깨짐.
- 7명 규모에서 필요한 "새 미니게임"은 오너가 직접 `app/*.ts`로 추가하는 것이 더 싸고 안전(이미 야추·라이어가 그렇게 들어옴).
- **대신 "C-lite" 제공**: 엔진에 미리 만들어 둔 **규칙 템플릿**을 데이터로 조립(예: "퀴즈 테이블" 템플릿에 문제 목록, "수집 이벤트" 템플릿에 목표 아이템·보상). 라이어 게임 = "제시어 목록 + 기존 규칙"이 이미 그런 구조. 이것으로 수요의 대부분을 흡수하고, 1년 뒤에도 스크립트 수요가 크면 QuickJS를 재검토.

---

## 3. 콘텐츠 팩 형식

### 3.1 폴더 구조
```
mods/
  autumn-harvest/                 ← 폴더명 = 팩 id
    manifest.json
    content/
      crops.json
      recipes.json
      furniture.json
      festivals.json
      items.json
      patches.json                ← 기존 데이터 편집
    i18n/
      ko.json                     ← 표시 문자열(기본)
    assets/
      img/  (webp, png)
      models/ (glb)
      audio/ (ogg + m4a)
    CREDITS.md                    ← 사람이 읽는 출처(선택, 매니페스트가 기준)
```
배포 형태는 폴더 그대로(저장소 안) 또는 같은 구조의 `.zip`(관리 UI 업로드용). zip은 서버에서 풀지 않고 **CI/관리 스크립트가 풀어 검증 후 번들**한다.

### 3.2 manifest.json
```json
{
  "schema": 1,
  "id": "autumn-harvest",
  "name": "가을 수확제 팩",
  "version": "1.2.0",
  "authors": [{ "name": "민서", "actor": 2 }],
  "description": "가을 작물 3종, 요리 2종, 수확제 축제, 가구 5종",
  "license": "CC-BY-4.0",
  "game": ">=0.3.0 <0.5.0",
  "dependencies": { "core": ">=1", "?minseo-theme": ">=1.0.0" },
  "incompatible": ["old-harvest-pack"],
  "loadAfter": ["minseo-theme"],
  "kind": "content",
  "permissions": ["items", "crops", "recipes", "furniture", "festivals", "patch:shop"],
  "economy": { "maxSell": 12000, "maxReward": 20000 },
  "icon": "assets/img/icon.webp"
}
```
- `id`: `^[a-z][a-z0-9-]{2,31}$`. `core`는 예약(본편 내용이 `core` 팩으로 등록됨).
- `version`: SemVer. `game`: 게임 버전 범위(`package.json` version과 비교).
- `dependencies`: Factorio식 접두사 `?`(선택). `incompatible`은 별도 배열.
- `kind`: `content`(A) | `cosmetic`(B).
- `permissions`: 팩이 건드릴 수 있는 레지스트리 목록. 선언 안 한 종류의 파일이 있으면 검증 실패 → 오너가 활성화 화면에서 "이 팩은 상점 가격을 바꿉니다"를 보고 결정.
- `economy`: 팩이 스스로 선언하는 상한. 게임 전역 상한(5.6절)을 넘으면 실패.

### 3.3 id와 네임스페이스
- 팩 내부 파일에서는 **짧은 id**(`pear`)를 쓰고, 로더가 `autumn-harvest:pear`로 확장.
- 다른 팩·본편 참조는 **완전한 id**: `core:carrot`, `minseo-theme:mint-lamp`.
- 본편 기존 id(`carrot`, `koi`, `furn-rocking-chair`…)는 **접두사 없는 그대로 유지**하고 `core:` 별칭으로도 조회 가능 → 기존 월드 저장 마이그레이션 불필요.
- 월드에 저장되는 키: 본편은 `carrot`, 모드는 `autumn-harvest:pear`. 콜론 유무로 구분.
- 월드 JSON 키 길이 상한 64자(팩 id 32 + 콜론 + 항목 id 31).

### 3.4 콘텐츠 종류별 스키마(요약 + 예시)

공통 필드: `id`, `name`(또는 `i18n` 키 `@crop.pear.name`), `emoji`(선택), `icon`(팩 상대 경로, 선택), `note`, `tags`(선택, 예: `["fruit","autumn"]`).

**items.json** (`ItemDef` 대응: fish/bug/forage/flower/material/dish)
```json
[{ "id": "chestnut", "name": "밤송이", "emoji": "🌰", "kind": "forage", "cat": "forage",
   "sell": 180, "museum": true, "note": "가을 숲에서 떨어져요.",
   "spawn": { "spots": ["core:forest-edge"], "seasons": ["autumn"], "weight": 30 } }]
```

**fish** (items.json 안 `kind: "fish"` 또는 fish.json, `FishDef` 대응)
```json
{ "id": "autumn-trout", "name": "단풍 송어", "emoji": "🐟", "spots": ["river","rapids"],
  "seasons": ["autumn"], "time": "day", "sky": "any", "weight": 12, "sell": 900,
  "cm": [20, 45], "windowMs": 800, "note": "단풍 그림자를 따라 헤엄쳐요." }
```
`spots`는 기존 `Spot` 9종 중에서만(새 낚시터는 맵 수정이 필요해 A형 범위 밖).

**crops.json** (`CropInfo` 대응)
```json
[{ "id": "pear", "name": "배", "emoji": "🍐", "growMs": 21600000, "seed": 900, "sell": 3300,
   "seasons": ["autumn"], "regrow": null, "shop": { "seed": true, "bundle": false },
   "art": { "stages": "assets/img/pear-stages.webp" } }]
```
검증: 시간당 이익 `(sell - seed) / (growMs/h)`가 본편 계절 작물 대역(3,000~5,400범/h, `lounge-life.ts` 주석) × 1.15 이하.

**recipes.json** (요리 `DishDef`/제작 `RecipeDef` 대응)
```json
[{ "id": "pear-tart", "type": "cook", "name": "배 타르트", "emoji": "🥧",
   "needs": [{ "item": "autumn-harvest:pear", "n": 2 }, { "item": "core:wheat-flour", "n": 1 }],
   "sell": 5200, "buff": "luck" },
 { "id": "maple-shelf", "type": "craft", "makes": "autumn-harvest:maple-shelf",
   "needs": [{ "item": "core:wood", "n": 10 }, { "cat": "flower", "n": 2 }] }]
```
`buff`는 기존 `BUFF_INFO` 키만. 요리 판매가 ≤ 재료 판매가 합 × 1.6.

**furniture.json** (`CatalogEntry` + 상점 `FurnitureDef` 대응)
```json
[{ "id": "maple-shelf", "name": "단풍 선반", "kind": "model", "model": "assets/models/maple-shelf.glb",
   "category": "furniture", "mount": "floor", "w": 1.2, "d": 0.45, "h": 1.6, "top": 1.6,
   "price": 18000, "premium": true, "shop": "rotating",
   "source": { "by": "민서", "tool": "Higgsfield generate_3d", "license": "own", "url": null } },
 { "id": "leaf-poster", "name": "낙엽 포스터", "kind": "prop", "image": "assets/img/leaf-poster.webp",
   "category": "wall", "mount": "wall", "w": 0.9, "d": 0.04, "h": 1.2, "price": 6000,
   "source": { "by": "민서", "tool": "Higgsfield GPT Image", "license": "own" } }]
```
검증: `w,d ≤ 3.5`, `h ≤ 3.4`(ROOM.wallHeight 3.8 대비), `mount`/`category`는 기존 열거형, 가격 1,000~200,000.

**outfits.json** (`lounge-look.ts` `COLLECTIONS` 대응)
```json
[{ "id": "mint-cardigan", "name": "민트 가디건", "note": "민서의 가을 코디",
   "atlas": "assets/img/mint-cardigan-atlas.webp", "layout": "core:friends-motion-v2",
   "owners": [2], "price": 0 }]
```
아틀라스는 본편 모션 아틀라스와 **같은 셀 배치**(레이아웃 id로 지정)여야 하며, 검증기가 크기·셀 수를 확인. `owners`가 있으면 그 친구만 입을 수 있음(개인 테마 팩).

**room-themes.json** (`lounge-bedroom-themes.ts` 대응): 벽·바닥 색/텍스처, 조명 톤.

**dialog.json** (`lounge-friend-lines.ts` 대응)
```json
{ "friend": 2, "mode": "add",
  "greet": ["{me}, 가을 냄새 나지 않아?", "배 따러 갈래?"],
  "season": { "autumn": ["밤 줍기 좋은 날이야."] },
  "smallTalk": [["단풍 예쁘다", "그치! {season}은 역시 이 맛이야."]],
  "hearts": { "6": ["너랑 수확제 준비하는 게 제일 좋아."] } }
```
치환자는 기존 목록(`{me}` `{name}` `{season}` `{item}` `{friend}` `{news}` `{holiday}`)만. 한 줄 60자, 이모지 금지(기존 규칙). `friend` 대사는 **그 친구 본인 또는 오너가 승인한 팩만**(`authors[].actor`와 비교) — 친구 캐릭터 사칭 방지.

**festivals.json** (`lounge-social-defs.ts` 축제 달력 + `FESTIVAL_SOUVENIRS` 대응)
```json
[{ "id": "harvest-fair", "name": "가을 수확제", "when": { "season": "autumn", "weekday": 6 },
   "goal": { "items": [{ "tag": "autumn-harvest:crop", "n": 60 }] },
   "souvenir": "autumn-harvest:maple-shelf", "music": "autumn-harvest:fair-theme",
   "board": "마을 광장에서 수확물을 모아요!" }]
```
보상은 **가구·칭호·추억(비화폐)** 만. 범 보상은 불가(5.6절).

**liar-words.json** (`LiarCategory` 대응)
```json
[{ "category": "우리 동네 맛집", "words": ["..."] }]
```
카테고리당 12~40단어, 단어 1~12자, 중복 금지, 금칙어 필터.

**audio.json** (`SFX_FILES`, `MUSIC_TRACKS` 대응)
```json
{ "music": [{ "id": "fair-theme", "files": ["assets/audio/fair.ogg","assets/audio/fair.m4a"], "loopStart": 2.1 }],
  "sfx": [{ "id": "leaf-rustle", "files": ["assets/audio/leaf.ogg","assets/audio/leaf.m4a"], "gain": 0.3 }],
  "placeMusic": { "core:tavern": "fair-theme" } }
```
`placeMusic`은 기존 슬롯 교체 → patch 권한 `patch:music` 필요.

**bundles/projects.json**: 마을 꾸러미·공사. 공사 비용(범)은 **싱크**라 허용, 보상 플래그는 팩 네임스페이스 플래그만(`autumn-harvest:cider-stand`), 본편 플래그(`greenhouse2` 등) 세팅 불가.

### 3.5 현지화
- 기본 언어는 `ko`. 문자열을 JSON에 직접 써도 되고, `"@key"`로 `i18n/ko.json`을 참조할 수도 있음.
- 게임이 현재 한국어 전용이므로 MVP는 직접 문자열만 지원, `i18n/`은 형식만 예약.

### 3.6 패치(기존 데이터 편집, Content Patcher식)
`patches.json`:
```json
[
  { "op": "edit", "target": "core:shop/seed-pumpkin", "set": { "price": 450 }, "reason": "수확제 할인" },
  { "op": "append", "target": "core:liar/음식", "path": "words", "values": ["전어구이"] },
  { "op": "append", "target": "core:dialog/2", "path": "season.autumn", "values": ["추석엔 송편!"] },
  { "op": "edit", "target": "core:furniture/sofa", "set": { "name": "가을 벤치 소파" }, "when": { "season": "autumn" } },
  { "op": "hide", "target": "core:shop/bundle-strawberry" }
]
```
- 연산: `edit`(필드 set, 허용 필드만), `append`(배열에 추가), `remove`(배열 원소 제거), `hide`(목록·상점에서 숨김; 이미 가진 것은 유지). **삭제 연산은 없음**(세이브 보호).
- `when`: `season`, `weekday`, `holiday`, `timeOfDay`만(모두 `lounge-calendar.ts`의 순수 함수로 결정 → 서버·클라이언트 동일).
- 편집 가능 필드 화이트리스트(종류별): 예) 가구 `name, note, price(±50%)`, 작물 `name, emoji, sell(±30%)`, 상점 `price(±50%)`. 규칙 수치(`windowMs`, `growMs`)는 본편 항목에 대해 편집 불가(밸런스 테스트가 고정한 값).
- **충돌 검출**: 같은 `(target, field)`를 두 팩이 `edit` → 빌드 오류 `E_PATCH_CONFLICT`. 해결책은 (1) 한 팩이 `loadAfter`로 명시하고 `"override": true`를 달거나 (2) 오너가 `mods/enabled.json`의 `resolve` 항목에 승자를 지정. `append`는 순서만 정하면 충돌 아님.

### 3.7 에셋 규칙
| 종류 | 형식 | 상한(파일) | 비고 |
|---|---|---|---|
| 아이콘·소품 이미지 | WebP(권장), PNG | 512 KB, 2048px | 마젠타 배경 제거 규칙은 본편과 동일 옵션 |
| 옷 아틀라스 | 무손실 WebP | 4 MB | 본편 셀 배치 준수 |
| 3D 모델 | GLB (`KHR_mesh_quantization`, `EXT_texture_webp` 허용, Draco/Meshopt **불가**) | 2 MB, 삼각형 30k | 본편과 같은 디코더 조건(ASSETS.md) |
| 오디오 | Ogg Vorbis + AAC(m4a) 쌍 | 음악 3 MB, 효과음 200 KB | 음량 -16 LUFS 기준(`TRACK_LEVEL`) |
| 팩 전체 | — | 콘텐츠 팩 25 MB, 꾸미기 팩 40 MB | 전체 활성 팩 합계 150 MB 권장 |

모든 에셋에 kArchive식 출처 필드(매니페스트 `assets` 또는 항목의 `source`):
```json
"assets": { "assets/models/maple-shelf.glb": { "by": "민서", "origin": "Higgsfield generate_3d",
  "license": "own", "attribution": null, "jobId": "…" } }
```
`license` 허용값: `own`(직접/생성 소유), `CC0`, `CC-BY-4.0`, `CC-BY-SA-4.0`, `kArchive`(출처 표기 필수·재판매 금지), `custom`(오너 수동 승인). `attribution` 필요한 라이선스인데 비어 있으면 실패. `NC`·출처 불명은 거부.

### 3.8 검증과 오류 보고
- 오류 코드 체계: `E_MANIFEST_*`, `E_SCHEMA`(파일·JSON 경로·기대값 포함), `E_ID_DUP`, `E_REF_MISSING`(없는 id 참조), `E_PATCH_CONFLICT`, `E_ECON_CAP`, `E_ASSET_SIZE`, `E_ASSET_FORMAT`, `E_LICENSE`, `E_TEXT`(길이·금칙·제어문자), `W_*`(경고: 밸런스 대역 밖 등).
- 출력 예:
  ```
  ✖ autumn-harvest/content/crops.json [0].sell  E_ECON_CAP  시간당 이익 6,100범/h > 상한 6,210범/h? 통과. 
  ✖ autumn-harvest/content/furniture.json [2].h  E_SCHEMA  3.9 > 최대 3.4 (방 높이 3.8)
  ⚠ autumn-harvest  W_BALANCE  배 타르트 판매가가 재료 대비 1.55배 (권장 1.4배 이하)
  ```
- 오류가 하나라도 있으면 그 팩은 **통째로 비활성**(부분 로드 없음). 경고는 통과.

---

## 4. 배포·설치 흐름

### 4.1 후보 비교
| 방식 | 장점 | 단점 | 판정 |
|---|---|---|---|
| ① **이 저장소 `mods/` 폴더 → Actions가 검증·번들** | 기존 파이프라인(edge.yml·pages.yml·desktop.yml) 재사용, 서버·클라 해시 자동 일치, PR 리뷰로 오너 승인, git이 버전 기록 | 친구가 git/PR을 알아야 함(→ GitHub 웹 업로드로 해결) | **MVP 권장** |
| ② 별도 팩 저장소(`our-six-island-mods`) + submodule/CI 체크아웃 | 친구들에게 쓰기 권한만 따로 줄 수 있음, 본 저장소 오염 없음 | CI 설정 약간 추가 | 친구 기여가 많아지면 2단계에서 전환 |
| ③ 관리 UI 업로드 → Supabase Storage, Edge가 런타임에 읽음 | 재배포 없이 즉시 적용 | Edge 콜드스타트마다 fetch·검증, 버전 관리·롤백 직접 구현, 서버·클라 불일치 창 | 3단계(선택) |

### 4.2 권장 흐름(MVP, ①)
1. 친구가 템플릿을 복사해 `mods/<팩id>/`를 만들고 GitHub 웹에서 업로드 → PR.
2. `ci.yml`에 `npm run mods:check` 추가: 검증기가 모든 팩 검증, 오류를 PR 코멘트/로그로.
3. 오너가 PR 머지 + `mods/enabled.json`에 팩 추가:
   ```json
   { "schema": 1, "packs": [ { "id": "autumn-harvest", "version": "1.2.0" }, { "id": "minseo-theme" } ],
     "resolve": { "core:furniture/sofa#name": "autumn-harvest" } }
   ```
4. 빌드 스크립트 `scripts/build-mods.mjs`가 활성 팩을 로드 순서대로 병합 → 산출물
   - `app/generated/mod-registry.json`(정의만, 에셋 경로는 해시 URL) — Edge 번들과 클라이언트가 **같은 파일**을 import.
   - 팩 에셋은 `build-standalone.mjs`의 해시 파이프라인에 편입(`mod-<팩id>-<이름>-<hash>.webp`).
   - `packSetHash` = sha256(정렬된 `id@version` + 레지스트리 JSON) 앞 16자.
5. edge.yml 트리거 경로에 `mods/**` 추가 → Edge 재배포, pages.yml → Pages 재배포. 데스크톱은 다음 릴리스에 포함되지만 **원격 팩 다운로드**(4.4)로 즉시 따라감.

### 4.3 월드에서의 활성화
- 서버 레지스트리 = 번들된 `mod-registry.json`. 월드 상태에 `mods: { set: "<packSetHash>", packs: ["autumn-harvest@1.2.0", …], seen: ["autumn-harvest", …] }`(수백 바이트)만 기록.
- `cloudTransition` 응답과 realtime `revision` 이벤트에 `packSetHash` 동봉. 클라이언트 해시가 다르면 "새 콘텐츠가 도착했어요 · 새로고침" 배너(웹) / 자동 재로드(데스크톱).
- 서버는 클라이언트가 보낸 명령의 id를 **자기 레지스트리로만** 검사하므로 오래된 클라이언트가 있어도 월드는 안전(존재하지 않는 id → 기존 reject 경로).

### 4.4 클라이언트 다운로드
- 레지스트리 JSON은 앱 번들에 포함(작음, 팩당 수~수십 KB). 에셋은 **지연 로드**: 가구를 방에 놓거나 상점에 보일 때 해시 URL fetch → 브라우저 캐시(파일명이 해시라 영구 캐시).
- 데스크톱(Tauri): 빌드 시 포함된 팩은 로컬, 이후 추가된 팩은 Pages의 해시 URL에서 받아 앱 데이터 폴더에 캐시. CSP `connect-src`/`img-src`에 Pages 도메인을 추가해야 함(오너 결정 D6).

### 4.5 클라이언트 전용(B) 모드 설치
- 웹: 설정 → 꾸미기 모드 → zip/폴더 선택 → 검증(같은 검증기의 브라우저 빌드) → IndexedDB 저장 → `blob:` URL로 적용. 계정 설정(`lounge-settings.ts`)에는 활성 목록 id만.
- 데스크톱: `%APPDATA%/beomtadew-valley/mods/`(각 OS 앱 데이터 경로) 폴더를 Tauri fs 플러그인으로 읽기 전용 스캔. `cosmetic` 팩만 허용, `content` 팩은 무시하고 경고.
- B형이 바꿀 수 있는 것: CSS 변수 토큰, 이미지/모델/오디오 **교체 매핑**(`"replace": { "core:furniture/sofa": "assets/models/my-sofa.glb" }`), HUD 위치 프리셋, 키 프리셋(`lounge-keybinds.ts` 형식). CSS 원문·폰트 URL 외부 로드 금지(토큰 값만, 폰트는 파일 동봉).
- 다른 사람 화면에는 영향 없음. 스크린샷 공유 시 오해 방지를 위해 설정에 "꾸미기 모드 켜짐" 표시.

### 4.6 안전장치
- A형: 실행 코드 없음(`.js/.ts/.html/.svg`(스크립트 가능) 거부, SVG는 MVP에서 불가), JSON 외 텍스트 파일은 `CREDITS.md`만.
- 텍스트 정화: 기존 `text-clean.ts`/`lounge-text.ts` 정화 함수 재사용(제어문자·양방향 문자·과도한 공백 제거, 길이 제한), 금칙어.
- 크기 상한(3.7절), 파일 수 상한(팩당 300), 경로 정규화(`..` 거부).
- 라이선스 검사(3.7절), 친구 대사는 본인/오너 승인만.
- 원장: 5.6절.

### 4.7 모드 제거와 고아 데이터
**전제 공사(필수)**: 모든 `read*`가 "모르는 id를 버리는" 현재 동작을 **"콜론이 있는 id는 레지스트리에 없어도 보존"**으로 바꾼다.
- 인벤토리(`ext[uid].inv`), 작물 가방, 박물관 기부, 방 배치(`bedroom.items[].ref`, 프로필 세이브), 옷(`look.collection`), 꾸러미·공사 진행.
- 보존된 항목은 **잠든(dormant)** 상태: 목록에 "잠든 물건 · 가을 수확제 팩이 꺼져 있어요" 회색 카드로 보이고, 팔기·선물·사용 불가, 방에서는 상자 모양 자리표시(placeholder) 모델.
- 팩을 다시 켜면 즉시 복귀.
- 오너가 **영구 제거**를 선택하면 1회성 마이그레이션 명령(`op: 'modPurge'`)이 실행:
  - 아이템: 당시 레지스트리 판매가 × 수량을 **"모드 정리 환불"** 로 지급 — 원장상 `grantBeom` 경로를 쓰되 사유 `mod-refund`로 흐름 버킷 분리, 월드당 상한(예: 친구 1인 50,000범). 또는 오너 선택으로 환불 없이 "추억 상자" 아이템 1개로 대체.
  - 가구: 가구점 가격의 50% 환불 또는 동일 카테고리 본편 가구로 교체.
  - 옷: `original` 컬렉션으로.
  - 진행 중 축제·꾸러미: 기여 범은 이미 싱크로 사라졌으므로 환불하지 않음(명시).
  - 실행 전 `hohyeon_world_backup`(마이그레이션 20260925090000) 스냅샷을 강제.
- 환불 가격 계산에 필요하므로 레지스트리는 **제거된 팩의 마지막 가격표**를 `mods/_tombstones/<팩id>.json`(id → sell)로 남김.

### 4.8 버전 업과 마이그레이션
- 팩 SemVer: MAJOR가 오르면 id 변경·삭제 허용, 대신 `migrations` 필드 필수:
  ```json
  "migrations": [{ "from": "<2.0.0", "rename": { "pear-pie": "pear-tart" }, "drop": { "old-lamp": { "refund": 3000 } } }]
  ```
  월드의 `mods.packs`에 기록된 이전 버전과 비교해 서버가 한 번 적용(CAS 트랜잭션 안).
- MINOR/PATCH: 추가·수치 조정만(삭제 금지, 검증기가 이전 태그와 비교).
- 게임 본편이 레지스트리 스키마를 바꾸면 `schema` 번호를 올리고 로더가 이전 스키마를 변환(최소 1개 이전 스키마 지원).

---

## 5. 엔진 설계

### 5.1 레지스트리 전환 대상
| 레지스트리 | 현재 원천 | 전환 난도 | 비고 |
|---|---|---|---|
| `items` (+fish/bug/forage/dish) | `lounge-items.ts` FISH·BUGS·FORAGE·DISHES·ITEMS·ITEM_BY_ID·ITEM_PRICES | 중 | `isItemId` 호출부 교체 |
| `crops` | `lounge-life.ts` `Crop` 유니온·CROPS·CROP_INFO·SHOP 씨앗 생성, `lounge-items.ts` CROP_SELL_REF | **상** | 유니온 → `CropId = string & {__crop}`; `Record<Crop,…>` → Map; 테스트 다수가 값 고정 |
| `recipes` | `lounge-items.ts` CRAFTS, life-plus 요리 | 중 | |
| `furniture` / `roomCatalog` | `lounge-items.ts` FURNITURE, `lounge-bedroom-catalog.ts` ROOM_CATALOG, `lounge-furniture-art.ts`, `lounge-model-assets.ts` | 중 | 3D 로드 경로가 레지스트리의 해시 URL을 따르도록 |
| `outfits` | `lounge-look.ts` COLLECTIONS·Look['collection'] 유니온, `lounge-sprites.ts` | 상 | 아틀라스 레이아웃 계약 문서화 필요 |
| `roomThemes` | `lounge-bedroom-themes.ts` | 하 | |
| `dialog` | `lounge-friend-lines.ts` | **하** | 이미 배열 모음 → MVP 대상 |
| `festivals` / `holidays` | `lounge-social-defs.ts`, `lounge-calendar.ts` HOLIDAYS, `lounge-items.ts` FESTIVAL_SOUVENIRS | 중 | 날짜 계산은 순수 함수 유지 |
| `liarWords` | `lounge-liar-words.ts` | **하** | MVP 대상 |
| `audio` | `lounge-sfx-files.ts` (SfxId 유니온), `lounge-music-tracks.ts` | 하~중 | |
| `bundles` / `projects` / `villageFlags` | `lounge-life-plus.ts` BUNDLES, `lounge-items.ts` PROJECTS·VILLAGE_FLAGS | 중 | 본편 플래그 보호 |
| `shop` | `lounge-life.ts` SHOP, 가구점 로테이션 풀 | 중 | 로테이션은 `pickIndex(hash32)` 결정성 유지 |
| (신규) skills/tools/research/materials, 주점·부동산·가구점 업그레이드 | 작성 중 | — | **처음부터 레지스트리로 작성** 권장 |

### 5.2 구조
```
app/mod-registry.ts      순수 TS: 타입, Registry 클래스(get/has/list/byTag), 'core' 등록
app/mod-schema.ts        손으로 쓴 검증기(작은 함수 조합), 오류 코드
app/mod-merge.ts         로드 순서 정렬(위상 정렬 + loadAfter), 패치 적용, 충돌 검출, packSetHash
app/mod-core.ts          기존 표를 'core' 팩으로 감싸기(표 자체는 당분간 그대로 두고 어댑터)
app/generated/mod-registry.json  빌드 산출물(커밋하지 않고 CI에서 생성, 로컬은 npm script)
scripts/build-mods.mjs   mods/ 읽기 → 검증 → 병합 → JSON + 에셋 목록
scripts/mods-check.mjs   CLI 검증기(7절)
```
- 레지스트리는 **동결(Object.freeze)된 불변 객체**로, 모듈 최상위에서 한 번 생성. 서버·클라이언트 동일 코드.
- 엔진 함수는 기존 시그니처를 유지하고 내부에서 `REG.items.get(id)`를 쓴다(점진 이행). 예: `ITEM_BY_ID`를 `REG.items.index`의 별칭으로 남겨 호출부 수정 최소화.

### 5.3 결정적 병합
1. `enabled.json` 목록 → 의존성·`incompatible` 검사 → 위상 정렬(동순위는 id 사전순).
2. `core` 먼저 등록 → 각 팩의 새 정의 등록(id 중복 = 오류).
3. 패치를 팩 순서대로 적용, `(target, field)` 소유자 기록으로 충돌 검출.
4. 조건부 패치(`when`)는 병합 시 해석하지 않고 레지스트리에 조건과 함께 저장 → 조회 시 `now`로 해석(서버는 `row.now`, 클라는 서버 시각 오프셋). 기존 엔진의 `now` 주입 패턴과 동일.
5. 결과를 정렬된 키로 직렬화 → `packSetHash`.
같은 입력이면 어느 기계에서든 같은 바이트 → CI에서 서버용·클라용을 따로 만들어도 해시 일치를 테스트로 보장.

### 5.4 스키마 검증 방식
- **zod 대신 손으로 쓴 소형 검증기** 권장: Edge 번들은 `--minify`라도 zod v3 약 50 KB(minified)가 추가되고, 런타임 검증은 빌드 시 1회면 충분하므로 Edge에는 **검증된 산출물만** 싣고 검증기는 싣지 않는다.
- 검증기는 `scripts/`와 클라이언트 B형 설치 화면에서만 사용(클라이언트는 lazy import).
- 스키마는 TS 타입과 한 파일에서 정의(`field.int(min,max)`, `field.enum(SEASONS)` 같은 20~30줄 헬퍼) → JSON Schema로도 내보내 에디터 자동완성(VS Code `$schema`) 제공.

### 5.5 Edge 함수가 팩 데이터를 얻는 방법
- **MVP: 번들 포함**. `mod-registry.json`을 `app/mod-registry.ts`가 import → esbuild가 인라인. 콜드스타트 추가 비용 0, 버전 불일치 없음, 롤백 = git revert.
  - 크기 예산: 정의만이므로 팩당 10~50 KB, 전체 500 KB 이하 권장(Edge 함수 번들 상한 대비 여유).
- **3단계(선택): Storage 로드**. `mods/<packSetHash>.json`을 Supabase Storage에서 읽고 모듈 전역 변수에 캐시(키 = 월드의 `mods.set`). 월드의 `mods.set`과 다르면 다시 읽음. 이때도 검증은 업로드 시점(관리 스크립트)에서 수행하고 Edge는 해시 검사만.

### 5.6 월드 크기 영향
- 추가되는 것: `mods` 메타(≤1 KB) + 모드 아이템 키가 기존 인벤토리 맵에 섞임. 키가 평균 10자 → 25자로 늘어나는 정도. 친구 7명 × 모드 아이템 50종 × 25B ≈ 9 KB. 6 MB 상한에 무시 가능.
- 위험 요소는 **팩이 만드는 새 상태 필드**(축제 진행, 꾸러미 진행). 팩 하나당 월드 증가분을 검증기가 추정(`축제 수 × 200B + 꾸러미 수 × 300B`)하고 팩당 20 KB 상한.
- 잠든 id는 월드에 남으므로 영구 제거(4.7) 도구가 정리 역할.

### 5.7 경제·원장 안전
- 팩은 `grantBeom`/`spendBeom`을 직접 부를 수 없다(코드가 없으므로). 범의 흐름은 **기존 엔진 경로**(판매·요청 보상·축제 기념품)가 레지스트리 수치를 읽어 수행.
- 범 발행(수도꼭지)은 기존 경로만: 판매(`sellTotal`의 수요 감쇠 `demandMult`·`marketMult`·`SELL_CAP_PER_DAY` 그대로 적용), 요청 보상(`REQUEST_REWARD_MAX` 상한). 팩은 새 수도꼭지를 만들 수 없음 → 축제·꾸러미·공사 보상은 **비화폐만**.
- 가격 상한(검증기 + 런타임 이중):
  - 아이템 판매가 ≤ 12,000범(본편 최고가 대역), 작물 시간당 이익 ≤ 본편 최대 × 1.15, 요리 ≤ 재료 합 × 1.6, 가구 구매가 1,000~200,000, 씨앗가 ≥ 판매가 × 0.2.
  - 런타임: 레지스트리 로드시 `clampEcon(def)`로 한 번 더 자름(검증 우회 방지).
- 모드 아이템의 판매 수입은 흐름 버킷에 팩 id별로 집계(`flowBucket`에 `mod:<id>` 접두) → `supabase/admin/economy-report.mjs`에 "팩별 범 유입" 표 추가. 오너가 인플레이션을 한눈에.
- 패치로 본편 가격을 낮추는 것(할인)은 허용 범위 ±50%, 판매가 인상은 +30%까지.

### 5.8 테스트
- `tests/mod-merge.test.mjs`: 위상 정렬, id 중복, 패치 충돌, `resolve` 동작, packSetHash 결정성(두 번 빌드 동일).
- `tests/mod-schema.test.mjs`: 종류별 정상/오류 픽스처(`tests/fixtures/mods/*`).
- `tests/mod-dormant.test.mjs`: 팩 끄기 → `readLife` 후에도 `autumn-harvest:pear` 보존, 판매 거부, 다시 켜면 판매 가능.
- `tests/mod-purge.test.mjs`: 영구 제거 환불 후 `validateLedger` 통과, 상한 적용.
- `tests/mod-econ.test.mjs`: 기존 `lounge-econ2.test.mjs` 패턴으로 예제 팩 포함 시 시간당 이익 대역 검사.
- 회귀: 레지스트리 전환 후 **기존 테스트 전부 통과**가 1단계 완료 조건(core 팩이 기존 표와 완전히 같은 값을 내는지 스냅샷 테스트).
- 예제 팩 2종을 CI 픽스처로 항상 빌드.

---

## 6. 모드 관리 UI

### 6.1 모드 목록(설정 → 모드)
- 카드: 아이콘, 이름, 버전, 만든 사람(친구 아바타 연결: `authors[].actor`), 한 줄 설명, 포함 내용 요약("작물 3 · 레시피 2 · 가구 5 · 축제 1"), 권한 배지("상점 가격 변경").
- 상태: 켜짐 / 꺼짐(잠든 물건 N개 보관 중) / 오류.
- 모든 친구가 볼 수 있음. **켜기·끄기는 오너만**(MVP에서는 `enabled.json` PR이 켜기이므로 UI는 읽기 전용 + "오너에게 요청" 버튼 = 우편 전송).
- 하단에 `packSetHash`와 "내 화면은 최신입니다 / 새로고침 필요" 표시.

### 6.2 크레딧 페이지
- 본편 `ASSETS.md` 출처표 + 모든 활성 팩의 `assets` 출처를 합쳐 자동 생성. kArchive처럼 표기 필수 라이선스는 굵게.
- 팩별 섹션: 만든 사람, 라이선스, 사용 도구(Higgsfield 등), 원본 링크.
- 아이템 상세(도감·상점·방 편집)에 작은 "가을 수확제 팩 · 민서" 표식 → 누가 만든 콘텐츠인지 알 수 있게(친구들끼리의 재미 요소).

### 6.3 오류·충돌 표시
- 오너 전용 탭: CI 검증 결과(빌드 산출물에 포함된 `mod-report.json`)를 그대로 표시 — 비활성된 팩과 이유, 경고 목록, 충돌과 현재 승자.
- 일반 사용자: 오류 팩은 목록에 "이번 버전에서 꺼졌어요(오너 확인 중)"만.

### 6.4 클라이언트 전용 모드 설정
- 꾸미기 모드 목록(내 기기), 켜기/끄기/순서, "원래대로" 버튼, 교체된 에셋 미리보기, 저장 용량 표시(IndexedDB).
- 테마 미리보기: 기존 UI 팔레트 위에 토큰만 바꿔 실시간 반영.

---

## 7. 제작 도구와 문서

### 7.1 템플릿
`mods/_template/`(빌드에서 제외):
```
manifest.json          주석 대신 "_help" 필드로 설명
content/items.json     예제 1개씩
content/furniture.json
content/dialog.json
content/liar-words.json
assets/img/README.txt  "여기에 webp를 넣으세요 (512KB 이하)"
```
JSON 파일 첫 줄 `"$schema": "../../schemas/furniture.schema.json"` → VS Code/GitHub.dev에서 자동완성·빨간 줄.

### 7.2 CLI 검증기
```
npm run mods:check                    # 전체
npm run mods:check -- mods/autumn-harvest
npm run mods:check -- --zip my-pack.zip
npm run mods:preview -- autumn-harvest  # 로컬 dev 서버에서 이 팩만 켜서 실행
```
- Node 22 `--experimental-strip-types`(기존 `npm test` 방식)로 `app/mod-schema.ts`를 직접 사용 → 게임과 같은 검증 코드.
- 에셋 검사: `sharp` 없이 WebP/PNG 헤더에서 크기 읽기, GLB는 JSON 청크 파싱으로 확장·삼각형 수 계산, Ogg 헤더 확인.
- 출력은 한국어, 줄마다 파일·경로·고치는 법.

### 7.3 친구용 문서 `mods/README.md`(작성 시)
목차 예:
1. 팩이 뭐예요? (5줄)
2. 3분 만에 가구 하나 넣기: 템플릿 복사 → 이미지 넣기 → furniture.json 한 줄 → GitHub 웹에서 업로드 → PR
3. 내 옷 만들기: 아틀라스 레이아웃 그림, 셀 크기
4. 내 NPC 대사 팩: 치환자 표, 60자 규칙, 하트 대사
5. 라이어 제시어 팩
6. 값의 한도표(가격·크기·용량)
7. 출처 적는 법(Higgsfield·kArchive·직접 그림)
8. 자주 나는 오류와 해결

### 7.4 예제 팩
**① 가을 수확제 팩 (`autumn-harvest`)**
- 작물 3: 배(가을, 6시간, 씨 900/판매 3,300), 밤호박(가을, 4시간, 600/2,300), 들깨(가을·겨울, 8시간, 재수확 2회).
- 레시피 2: 배 타르트(요리, 행운 버프), 단풍 선반(제작, 나무 10 + 꽃 2).
- 축제 1: 가을 수확제(가을 토요일, 팩 작물 60개 공동 목표, 기념품 = 단풍 선반, 전용 배경음).
- 가구 5: 단풍 선반(GLB), 허수아비(prop), 수확 바구니(small), 낙엽 포스터(wall), 짚단 소파(floor).
- 패치: 가을 동안 `core:shop/seed-pumpkin` 10% 할인.
**② 민서 테마 팩 (`minseo-theme`)**
- 옷 1: 민트 가디건(`owners: [2]`), 방 테마 1: "민트 다락방"(벽지·바닥·조명 톤), 대사: 민서 NPC `add` 모드 대사 20줄 + ♥6 대사 3줄(작성자 actor 2 = 본인이라 통과), 소품 2(민트 스탠드, 고양이 쿠션).
- 권한: `outfits`, `roomThemes`, `dialog:self`, `furniture`.

### 7.5 Higgsfield 생성 아트 활용
- 2D 소품(prop)·포스터·아이콘: Higgsfield 이미지 생성 → `remove_background` → 512px WebP. 본편 방 소품 28+9종이 이미 같은 경로(ASSETS.md 출처 C)로 만들어졌으므로 **스타일 가이드 프롬프트**(본편 프롬프트 기록 재사용)를 템플릿 문서에 포함해 톤 통일.
- 3D 가구: `generate_3d`로 GLB 생성 → `scripts/optimize-assets.mjs`와 같은 양자화·WebP 텍스처 처리(검증기가 Draco 거부) → 삼각형 30k 이하.
- 옷 아틀라스: 본편 셀 배치를 참조 이미지로 제공해 생성 후 수작업 정리(가장 품이 큼 → 2단계 이후).
- 출처 필드: `origin: "Higgsfield <모델명>"`, `jobId`, `license: "own"`, 프롬프트는 팩 `CREDITS.md`에. 유료 크레딧 사용량은 오너가 관리(친구가 직접 생성하면 친구 계정).
- 주의: 실존 브랜드·캐릭터 로고 금지(미쿠 테마처럼 "오리지널 모티브" 규칙을 문서에 명시).

---

## 8. 단계별 로드맵

| 단계 | 내용 | 규모(1인 기준) | 완료 조건 |
|---|---|---|---|
| **0. 전제 공사** | 잠든 id 보존(모든 `read*`에서 `modid:` id 보존, 판매·사용 거부 처리), 월드 `mods` 메타 필드, 백업 강제 경로 | 2~3일 | 테스트 `mod-dormant` 통과, 기존 테스트 전부 통과 |
| **1. MVP 레지스트리 + A형 일부** | `mod-registry/schema/merge.ts`, `core` 어댑터, **라이어 제시어·친구 대사·가구(방 카탈로그+가구점)·일반 아이템(채집·재료)** 레지스트리 전환, `build-mods.mjs`, `mods:check`, CI·edge/pages 트리거에 `mods/**`, 모드 목록·크레딧 UI(읽기 전용), packSetHash 새로고침 배너 | 1.5~2주 | 예제 팩(가구 5 + 대사 + 제시어) 켜서 서버·웹·데스크톱에서 보이고 거래·배치 가능 |
| **1b. B형 꾸미기 MVP** | UI 테마 토큰 팩, 효과음·배경음 교체, 키 프리셋. 웹 IndexedDB, 데스크톱 로컬 폴더 | 4~5일 | 내 화면만 바뀌고 친구 화면 불변 |
| **2. 게임플레이 콘텐츠 확장** | 작물(유니온 해제), 물고기·벌레, 레시피, 축제, 꾸러미·공사, 음악/효과음, 패치 연산(edit/append/hide + 충돌), 조건 `when`, 영구 제거·환불, 팩 SemVer 마이그레이션, 경제 리포트 팩별 집계 | 3~4주 | 가을 수확제 팩 전체 동작, `validateLedger`·econ 테스트 통과 |
| **3. 배포 편의** | 팩 저장소 분리 또는 관리 스크립트로 Storage 업로드, 게임 내 켜기/끄기(오너), 옷 아틀라스 팩, 템플릿 규칙 조립형(C-lite: 퀴즈·수집 이벤트) | 2~3주 | 재배포 없이 팩 전환(선택) |
| **4. 재검토** | 스크립트 모드(QuickJS) 필요성 재평가 | — | 수요가 있을 때만 |

### 위험
| 위험 | 영향 | 대응 |
|---|---|---|
| 레지스트리 전환 중 회귀(특히 `Crop` 유니온, 경제 수치) | 높음 | core 스냅샷 테스트, 단계별 전환, 작물은 2단계로 미룸 |
| 모드 끄기로 아이템 소실 | 높음(현재 코드 기준 실제 발생) | 0단계를 모든 것보다 먼저 |
| 인플레이션 | 중 | 수도꼭지 신설 금지 + 이중 상한 + 팩별 유입 리포트 |
| 친구 캐릭터 대사 사칭·부적절 텍스트 | 중 | 대사는 본인/오너 승인, 정화·금칙어, PR 리뷰 |
| 라이선스 위반 에셋 | 중 | 출처 필드 필수, NC·불명 거부, 크레딧 자동화 |
| 웹 번들·Pages 용량 증가 | 중 | 에셋 지연 로드, 팩·전체 용량 상한 |
| 데스크톱 CSP 변경 | 낮음 | Pages 도메인 1개만 img/media/connect에 추가 |
| 신규 시스템(skills/tools/주점 등)이 하드코딩으로 먼저 굳음 | 중 | 지금부터 레지스트리 형태로 작성 |

### 오너 결정 사항(권장 기본값)
| # | 결정 | 권장 기본값 |
|---|---|---|
| D1 | 스크립트 모드 지원 여부 | **지원 안 함**(C-lite 템플릿으로 대체, 1년 뒤 재검토) |
| D2 | 팩 보관 위치 | **이 저장소 `mods/`** (기여가 늘면 별도 저장소) |
| D3 | 팩 켜기 권한 | **오너만**, 친구는 PR·우편으로 요청 |
| D4 | 모드 끄기 시 아이템 처리 | **잠든 상태로 보존**, 영구 제거 시 판매가 환불(1인 50,000범 상한) |
| D5 | 팩이 범 보상을 줄 수 있나 | **불가**(판매 수입만, 기존 수요 감쇠 적용) |
| D6 | 데스크톱이 빌드 후 추가된 팩 에셋을 받나 | **받음**(CSP에 Pages 도메인 추가) |
| D7 | 친구 대사 팩 승인 | **본인 작성 팩만 자동 허용**, 타인 대사는 오너 승인 |
| D8 | 본편 수치 패치 허용 폭 | 가격 ±50%, 판매가 +30%, 규칙 수치 불가 |
| D9 | 검증 라이브러리 | **손으로 쓴 검증기**(Edge에 싣지 않음), zod 미사용 |
| D10 | MVP 콘텐츠 종류 | **가구·아이템(채집/재료)·대사·라이어 제시어 + B형 테마** |
| D11 | 허용 라이선스 | own, CC0, CC-BY, CC-BY-SA, kArchive(표기 필수); NC·불명 거부 |
