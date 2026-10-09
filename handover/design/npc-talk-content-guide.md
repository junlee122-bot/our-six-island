# 주민 대화 내용 쓰는 법 (C2~C4용 안내서, 2026-10-08)

설계: [design-npc-conversation.md](https://github.com/junlee122-bot/our-six-island/blob/claude/design-improve/handover/design/design-npc-conversation.md) (브랜치 `claude/design-improve`).
엔진과 첫 5명(샹크스·예림이·미쿠·미스 포츈·프리렌)은 C1(`claude/npc-talk-c1`)이 만들었습니다.
나머지 24명은 이 안내서대로 **주민마다 파일 하나**를 쓰고 목록에 한 줄을 더하면 됩니다. 엔진·화면·서버는 건드리지 않아도 됩니다.

## 1. 파일과 등록

| 파일 | 할 일 |
|---|---|
| `app/npc-talk/<id>.ts` | 새로 만듭니다. `export const <ID>_TALK: NpcTalkBook = { ... }` |
| `app/npc-talk/index.ts` | `import { <ID>_TALK } from './<id>.ts';` 한 줄, `NPC_TALK`에 `<id>: <ID>_TALK,` 한 줄(서버용) |
| `app/npc-talk/types.ts` | 형식(읽기만). 바꾸지 않습니다 |

- `<id>`는 `app/lounge-npc-data.ts`의 `NPC_IDS` 그대로입니다(예: `himmel`, `beatrice`, `realtor`).
- 서버용 코드도 이 파일을 읽으니 import 경로에 **`.ts`를 꼭** 붙입니다(`'./types.ts'`).
- 목록에 넣는 순간 그 주민은 새 대화로 바뀝니다. 넣기 전까지는 예전처럼 한 줄 대화입니다.
- **지연 로딩**: 화면(클라이언트)은 책을 첫 번들에 넣지 않습니다. `app/lounge/npc-talk-books.ts`가
  `import.meta.glob('../npc-talk/*.ts')`로 **파일 이름**(`<id>.ts`)을 보고 주민마다 따로 불러옵니다(곁에 가거나 말을 걸 때).
  그래서 화면 쪽에는 등록할 것이 없습니다. 서버(`app/lounge-cloud-engine.ts`)는 판정을 하므로 `index.ts`의 목록 전부를 정적으로 씁니다.
  파일 이름은 꼭 주민 id와 같게, 책은 그 파일에서 `export`합니다. 불러오는 동안 "이야기 나누기"가 잠깐 기다리고, 실패하면 예전 한 줄 대화입니다.
- 세션 셋이 `index.ts`를 동시에 고치면 합칠 때 그 파일만 겹칩니다. 줄 단위로 더하기만 하면 쉽게 합쳐집니다.

## 2. 형식 (`NpcTalkBook`)

```ts
import type { NpcTalkBook } from './types.ts';

export const HIMMEL_TALK: NpcTalkBook = {
  npc: 'himmel',
  memories: { 'hero-yes': '용사 이야기를 좋아한다고 했어요', /* 모든 기억 태그의 수첩 문장 */ },
  talks: [ /* 평소 고르는 대화 30개 이상(테스트 하한 12) */ ],
  openers: [ /* 지금 상황 첫마디 25개 이상(테스트 하한 10) */ ],
  callbacks: [ /* 기억 꺼내기 15개 이상(테스트 하한 6) */ ],
  chapters: [ /* 이야기 6장(테스트: 5~6장) */ ],
  after: [ /* 오늘 대화를 마친 뒤 다시 말 걸면 하는 한마디 5개 이상(테스트 하한 2) */ ],
};
```

### 대화 하나 (`NpcTalkEntry`) — talks · openers · callbacks 모두 같은 모양

```ts
{
  id: 'sea-or-land',                 // 이 주민 안에서 겹치지 않게
  when: { weather: ['rain', 'storm'] }, // 언제 나오나(아래 4장). talks에는 순간 조건을 쓰지 않음
  open: '{me}, 너는 바다가 좋아, 땅이 좋아?',  // 주민 첫마디. 여러 쪽이면 배열
  replies: [                          // 2~3개
    { say: '당연히 바다지!', tier: 'great', remember: 'sea-lover', answer: '다하하! 그럴 줄 알았다.' },
    { say: '땅이 편해', tier: 'good', answer: '정직해서 좋다.' },
    { say: '둘 다 그냥 그래', tier: 'meh', face: 'calm', answer: '그럼 주점이 딱이네.' },
  ],
  use: 'sea-lover',                   // (선택) 이 대화가 쓰고 지우는 기억
}
```

- `say`: 플레이어가 누르는 대답(30자 이하). 키보드 1·2·3으로도 고릅니다.
- `tier`: 그 캐릭터다운 대답일수록 `great`, 무난하면 `good`, 안 맞으면 `meh`. **정답 표시는 없습니다.**
  안쪽 점수는 great 8 · good 6 · meh 3(오늘 첫 대화만, 깎이는 일 없음). 대화마다 `great`가 적어도 하나 있어야 합니다.
- `answer`: 주민 대답. 한 줄이나 몇 쪽(배열). 한 줄로 끝내지 말고 자주 2~3쪽으로 씁니다.
- `face`(선택): 대답할 때 표정. `smile · laugh · wow · shy · calm · think · sorry`.
  안 쓰면 great→laugh, good→smile, meh→calm. 포즈 시트가 있는 주민(미쿠 등)은 그 칸으로, 나머지는 초상 옆 작은 말풍선("하하", "끄덕")으로 보입니다.
- `remember`(선택): 고르면 그 주민이 기억하는 태그. 주민마다 20개까지, 오래된 것부터 지워집니다.

### 이야기 한 장 (`NpcChapter`)

```ts
{
  title: '뒷산의 노을',                          // 수첩: "이야기 2장 · 뒷산의 노을"
  hint: '저녁 무렵(게임 시각 오후 다섯 시부터 아홉 시) 뒷산에 올라가 보세요.', // 아직 안 열렸을 때 수첩에 보이는 실마리(80자 이하)
  need: { days: 3, points: 20, visit: { area: 'hill', from: 17, to: 21 } },
  scene: ['…', '…', '…'],                        // 8~15줄 권장(테스트: 3~15줄)
  replies: [ /* 선택 한 번, 2~3개 (대화와 같은 모양) */ ],
}
```

`need` 조건(주어진 것 모두 맞아야, 그리고 앞 장을 마쳐야 열림):

| 키 | 뜻 |
|---|---|
| `days` | 서로 다른 날 대화한 횟수 |
| `points` | 안쪽 점수 이상. **옛 저장 이전(마이그레이션)에도 씀**: 점수에 맞는 장부터 시작 |
| `visit: { area, from, to }` | 앞 장을 마친 뒤 그 지역에 게임 시각 [from, to) 사이에 가기(자정을 넘기면 from > to). 서버가 내가 실제로 선 지역으로 확인 |
| `bring: { item, take? }` | 그 물건을 가방에 갖고 오기. `take: true`면 장을 볼 때 하나 가져감 |
| `mem` | 그 기억이 있어야 함 |
| `love` | 연애 단계 이상(`'dating'` 등) |

`visit.area`로 쓸 수 있는 곳: `village`(마을 광장) · `market`(시장 거리) · `harbor` · `hillside` · `ranch` · `foothill`(문이 열려야 갈 수 있음) · `farm` · `hill`(뒷산) · `woods`(숲) · `mine` · `tavern` · `casino` · `lounge`(회관) · `home`.
문이 아직 닫혔을 수 있는 지역(`harbor` 등)보다는 처음부터 갈 수 있는 곳을 권합니다.

**장 배치 표준**(C1 다섯 명이 쓴 것, 그대로 따르기를 권함):

| 장 | need | 장면 |
|---|---|---|
| 1 | `{ days: 1 }` | 첫 만남. 조건 없음(테스트가 확인) |
| 2 | `{ days: 3, points: 20, visit }` | 주민이 말한 장소·시간 |
| 3 | `{ days: 6, points: 40, bring }` | 주민이 말한 물건 |
| 4 | `{ days: 9, points: 60, mem }` | 평소 대화에서 얻는 기억 하나 |
| 5 | `{ days: 13, points: 96 }` | 8하트. 꽃다발로 이어지는 장면(테스트가 96 장을 확인) |
| 6 | `{ days: 16, love: 'dating' }` | 연인 뒤. 청혼 반지로 이어짐(테스트가 마지막 장의 `love`를 확인) |

- `points`는 장마다 줄어들면 안 됩니다(마이그레이션 때문). `love`만 있는 마지막 장은 `points`를 쓰지 않습니다.
- 4장의 `mem`은 **평소 대화(talks)의 대답**에서 얻을 수 있어야 하고, 어떤 대화의 `use`로 지워지면 안 됩니다(테스트가 확인).
  그래야 기억이 20개를 넘겨 밀려나도 다시 얻을 수 있습니다.
- 꽃다발·청혼 규칙은 그대로입니다(8하트·10하트·연인 3일). 장면은 그 흐름에 말로만 이어 줍니다("꽃이라도 한 다발 들고 오면…").

## 3. 글자 규칙 (테스트가 모든 줄을 검사)

- 한 줄 **60자 이하**, 대답 버튼 30자 이하, 실마리 80자 이하.
- **숫자(0~9)를 쓰지 않습니다.** 점수처럼 보이는 걸 막기 위해서입니다. "삼백 년", "오십 년", "열 시"처럼 글자로 씁니다.
- 이모지, 영어 알파벳 금지.
- 채우기: `{me}`(내 이름) `{name}`(주민 이름) `{season}` `{weather}` `{fish}`(오늘 잡은 물고기) `{taste}`(내 취향 첫 번째) `{other}`(관계 주민) `{days}`.
  **채우기 바로 뒤에 조사를 붙이지 않습니다**(`{me}가` ✗ → `{me},` `{me}.`). 받침을 모르기 때문입니다.
- 말투: 원작 말투 중·강. 원작이나 한국어판 대사를 그대로 옮기지 않습니다. 말버릇·소재만 빌립니다.
  쓰레쉬·미스 포츈은 원작과 마을을 섞고, **발키리는 지금 대사 말투 그대로**입니다(`app/lounge-npc-lines-carpenter.ts`).
- 모두 성인입니다. 어두운 캐릭터는 '섬뜩한데 동네 사람'으로, 잔인한 말은 쓰지 않습니다.
- 반말/존댓말은 그 주민의 `speech`(`lounge-npc-data.ts`)와 지금 대사 파일을 따릅니다.

## 4. 조건 낱말 (`when`)

주어진 것이 모두 맞을 때 나옵니다. 배열은 "그중 하나".

| 키 | 값 | 뜻 |
|---|---|---|
| `time` | `'dawn' \| 'day' \| 'evening' \| 'night'` | 게임 시간대 |
| `season` | `'spring' \| 'summer' \| 'autumn' \| 'winter'` | 계절 |
| `weather` | `'sunny' \| 'cloudy' \| 'rain' \| 'storm' \| 'snow'` | 오늘 날씨 |
| `festival` | `true` | 축제·명절 날 |
| `fish` | `true` 또는 `['seabream', ...]` | 오늘 물고기를 잡음(그 물고기 중 하나). `{fish}`에 이름 |
| `bigFish` | `true` | 오늘 잡은 게 내 최고 기록·마을 기록 |
| `harvest` | `true` | 오늘 밭일(농사 경험치)을 함 |
| `gold` | `true` | 오늘 금별 작물을 거둠 |
| `mood` | `'high' \| 'low'` | 내 기분(좋음 이상 / 처짐·지침) |
| `news` | `'wedding' \| 'birthday' \| 'festival' \| 'legend' \| 'record' \| 'museum' \| 'breakup' …` | 오늘 마을 소식에 그 종류가 있음 |
| `friendNews` | (같은 종류) | 오늘 다른 친구에 관한 마을 소식 |
| `recent` | `'fishing' \| 'voyage' \| 'stockUp' \| 'stockDown' \| 'casinoWin' \| 'casinoLose' \| 'museum'` | 요즘 한 일(`lounge-npc-recent.ts`) |
| `bond` | 주민 id | 오늘 그 주민과도 이야기함. **그 주민과 관계(`NPC_BONDS`·`NPC_TIES`)가 있어야** 함(테스트). `{other}` |
| `with` | 주민 id | 지금 그 주민과 함께 있음(주민끼리 어울리기). `{other}` |
| `sulk` | `true` | 오늘 누군가와 서먹함. `{other}` |
| `bday` | `true` | 오늘 내 생일 |
| `love` | `'dating' \| 'engaged' \| 'married' \| 'none' \| 'any'` | 이 주민과의 연애 단계 |
| `ch` | 숫자 | 이야기를 그 장까지 마침 |
| `mem` | 태그 또는 배열 | 그 기억이 모두 있음 |
| `noMem` | 태그 또는 배열 | 그 기억이 하나도 없음 |

- **talks**: 순간 조건(`time` `season` `weather` `festival` `fish` `bigFish` `harvest` `gold` `mood` `news` `friendNews` `recent` `bond` `with` `sulk` `bday`)을 쓰지 않습니다. `love` `ch` `mem` `noMem`만.
- **openers**: 순간 조건이 적어도 하나 있어야 합니다.
- **callbacks**: `mem`이 꼭 있어야 하고, **한 번만 나오게** 합니다. 둘 중 하나:
  1. `use: '그 태그'` — 꺼내면서 기억을 지움.
  2. `@` 기억(아래)일 때: `noMem: 'x-heard'`를 걸고 **모든 대답에 `remember: 'x-heard'`**.
- 상황 조건(시간대·날씨·오늘 잡은 물고기·기분 등)은 화면이 첫마디를 고를 때 봅니다. 서버는 기억·장·연애 단계(`mem` `noMem` `ch` `love`, `@` 기억)만 다시 확인합니다(대답하는 사이 게임 시각이 넘어가도 괜찮게).

### 기억 태그

- 모양: 소문자·숫자·`-`·`:`, 24자 이하(`sea-lover`, `fav:strawberry`). 주민마다 따로라 앞에 주민 이름을 붙이지 않아도 됩니다.
- `remember`로 남기는 모든 태그는 `memories`에 수첩 문장이 있어야 합니다(테스트). 수첩에는 최근 기억 2~3개가 이 문장으로 보입니다("바다가 좋다고 했어요").
- 게임에서 읽어 오는 기억(저장 안 함, `@`로 시작):

| 태그 | 언제 |
|---|---|
| `@taste` | 내가 "내 취향"을 정함. `{taste}`에 첫 번째 좋아하는 것 |
| `@bday-soon` | 내 생일이 오늘부터 일주일 안 |
| `@outing` | 이 주민과 동행한 적 있음 |
| `@date` | 이 주민과 내 방 데이트를 한 적 있음 |

## 5. 고르는 순서 (엔진, `app/lounge-npc-talk.ts` `pickTalk`)

1. 맞는 기억 꺼내기(callbacks)가 있으면 사흘에 이틀꼴로 그중 하나.
2. 아니면 맞는 상황 첫마디(openers)가 있으면 사흘에 이틀꼴로 그중 하나.
3. 아니면 평소 대화(talks)를 차례대로(대화한 날 수로 돌아가서 다 듣기 전엔 겹치지 않음).

같은 사람·주민·날·상황이면 늘 같은 대화입니다(화면을 다시 그려도 안 바뀜). 하루 첫 대화만 관계에 들어가고, 그 뒤엔 "가볍게 한마디"로 `after` 한 줄을 합니다.

## 6. 주민별 체크리스트

- [ ] `app/npc-talk/<id>.ts`를 만들고 `index.ts`에 등록
- [ ] talks 30개 이상 · openers 25개 이상 · callbacks 15개 이상 · chapters 6장 · after 5개 이상
      (테스트 하한은 12 · 10 · 6 · 5~6 · 2로, 아직 늘리지 않은 주민도 통과합니다)
- [ ] 대화마다 대답 2~3개, `great` 하나 이상, 대부분은 세 등급이 고루
- [ ] openers에 날씨(비·눈), 시간대, 축제, 낚시·수확·금별, 기분, 마을 소식, 관계 주민(`bond`)이 골고루
- [ ] callbacks에 평소 대화에서 남긴 기억 넷 이상 + `@taste` · `@outing` · `@bday-soon` · `@date` 중 둘 이상
- [ ] 장: 1장 조건 없음, 2장 `visit`, 3장 `bring`, 4장 `mem`(talks에서 얻는 것), 5장 `points: 96`, 마지막 장 `love`
- [ ] 장면 8~15줄(테스트 상한 15줄), 실마리 문장에 장소·시간·물건을 플레이어가 알 수 있게
- [ ] 대답(`answer`)은 자주 2~3쪽, 장의 대답은 2~4쪽. 표정(`face`)도 상황에 맞게 고루
- [ ] 숫자·이모지·영어 없음, 60자, 채우기 뒤 조사 없음
- [ ] 원작 대사 그대로 옮기지 않음, 말투는 지금 대사 파일(`app/lounge-npc-lines-<id>.ts`, `-extra-`, `-love-`)과 이어지게
- [ ] `npm run check` 통과(아래)

## 7. 확인

```bash
node --experimental-strip-types --no-warnings --test tests/lounge-npc-talk.test.mjs   # 형식·분량·글자 규칙
npm run check                                                                      # tsc, 전체 테스트, oxlint
```

`tests/lounge-npc-talk.test.mjs`의 `checkBook`이 `NPC_TALK`에 등록된 **모든** 주민을 검사합니다. 실패 메시지에 주민 id와 대화 id가 나옵니다.
새 한글 글자가 화면 글꼴에 없으면 `npm run fonts`로 글꼴을 다시 만들어 함께 커밋합니다.

## 8. 저장과 서버 (참고)

- 저장: `life.ext[uid].npcRelations[npc]`에 `tc`(대화한 날 수) · `ch`(마친 장) · `mem`(기억, 20개) · `vis`(장소 약속을 지킨 장). 예전 줄(`ch` 없음)은 점수에 맞는 장에 놓입니다.
- 행동: 생활 행동 `{ kind: 'npcChat', npc, op: 'talk', id, pick }` · `{ op: 'story', pick }` · `{ op: 'visit' }`(`app/lounge-npc-talk-life.ts`).
  대화·장은 주민 곁에서만(기존 대화와 같은 위치 확인), 장소 약속은 서버가 내가 선 지역과 게임 시각으로 확인합니다.
- 점수(`points`)·하트·선물·연애 단계는 그대로 안에서 움직입니다. 화면에는 숫자가 보이지 않습니다.
