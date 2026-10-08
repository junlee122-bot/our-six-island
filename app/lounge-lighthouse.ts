// 범마을 등대 (2026-10-08): the harbor lighthouse you can walk into. Two
// floors on the common interior standard (lounge-interior-view.ts): 1층 is
// 가붕's keeper's room (the logbook desk, coat hooks, the sea chart, the
// spiral stair) and the top is the lamp room (the big lamp, the sea through
// its windows, the balcony rail). Geometry: lounge-lighthouse-layout.ts.
//
// This module is the lighthouse's small data API, pure and `now`-injected
// (safe on the server and the client):
// - the place id and floor names,
// - the lamp: lit through the game night (lighthouseLampLit) and its beam's
//   angle (lighthouseBeamAngle), so the harbor's sweeping beam and the lamp
//   room's turning lens agree on every screen,
// - the logbook (등대 일지): one read-only page per real KST day built from
//   data the village already has (weather, the 먼바다 boat, this week's cup
//   catches, storm warnings),
// - the story slot: entries the endgame "여섯섬의 등대"
//   (handover/design/design-time-and-endgame.md, part 2) will add (letters and
//   events that show up in the logbook). Empty for now; nothing here builds
//   that story.
import { WEATHER_INFO, inGameHours, kstDate, pickIndex, weatherOf, weekdayOf, type Weather } from './lounge-calendar.ts';
import { FIRST_HOUR, LAST_HOUR } from './lounge-voyage-data.ts';
import { FISH_BY_ID } from './lounge-items.ts';
import { ACTORS } from './lounge-roster.ts';

/** The lighthouse's place id (endgame chapters, gather steps and map pins name it). */
export const LIGHTHOUSE_PLACE = 'harbor-lighthouse' as const;
export const LIGHTHOUSE_NAME = '범마을 등대';

/** The two floors (server areas). */
export const LIGHTHOUSE_AREAS = ['lighthouse', 'lighthouseTop'] as const;
export type LighthouseArea = (typeof LIGHTHOUSE_AREAS)[number];
export const isLighthouseArea = (a: unknown): a is LighthouseArea => a === 'lighthouse' || a === 'lighthouseTop';
export const LIGHTHOUSE_FLOOR: Record<LighthouseArea, { name: string; short: string; level: 1 | 2 }> = {
  lighthouse: { name: '등대지기의 방', short: '1층', level: 1 },
  lighthouseTop: { name: '등명실', short: '꼭대기', level: 2 },
};
/** The other floor (the spiral stair's far end). */
export const otherFloor = (a: LighthouseArea): LighthouseArea => (a === 'lighthouse' ? 'lighthouseTop' : 'lighthouse');

// ---------------------------------------------------------------- the lamp
/** 가붕 lights the lamp at game 18:00 and puts it out at 06:00 (lounge-npc-schedule.ts). */
export const LAMP_ON_HOUR = 18;
export const LAMP_OFF_HOUR = 6;
/** Whether the lamp burns at `now` (server time). */
export const lighthouseLampLit = (now: number) => inGameHours(now, LAMP_ON_HOUR, LAMP_OFF_HOUR);
/** One full turn of the lens (real ms). */
export const BEAM_TURN_MS = 16_000;
/** The beam's heading at `now` (radians about y), the same on every screen. */
export const lighthouseBeamAngle = (now: number) => ((((now % BEAM_TURN_MS) + BEAM_TURN_MS) % BEAM_TURN_MS) / BEAM_TURN_MS) * Math.PI * 2;
/** A line for the lamp (E at it in the lamp room). */
export function lampLine(now: number) {
  return lighthouseLampLit(now)
    ? '큰 등불이 천천히 돌며 먼바다까지 길을 비춰요.'
    : `지금은 쉬는 중이에요. 게임 시각 ${LAMP_ON_HOUR}시가 되면 가붕이 불을 켜요.`;
}

// ---------------------------------------------------------------- the story slot
/**
 * A future letter or event tied to the lighthouse (endgame "여섯섬의 등대"):
 * it appears in the logbook from `fromDay` (KST day) once every flag in
 * `flags` is set in the village. Data only; the story engine adds entries.
 */
export type LighthouseStoryEntry = {
  id: string;
  kind: 'letter' | 'event';
  title: string;
  lines: readonly string[];
  needs?: { flags?: readonly string[]; fromDay?: number };
};
/** Entries the endgame will fill (none yet). */
export const LIGHTHOUSE_STORY: readonly LighthouseStoryEntry[] = [];
/** The story entries open on `day` for a village with `flags`. */
export function lighthouseStory(
  ctx: { day: number; flags?: readonly string[] },
  entries: readonly LighthouseStoryEntry[] = LIGHTHOUSE_STORY,
): LighthouseStoryEntry[] {
  const flags = new Set(ctx.flags ?? []);
  return entries.filter((e) => (e.needs?.fromDay ?? -Infinity) <= ctx.day && (e.needs?.flags ?? []).every((f) => flags.has(f)));
}

// ---------------------------------------------------------------- the logbook
/** Pages you can leaf back through (today and the six days before). */
export const LOGBOOK_PAGES = 7;
export type LogbookLine = { kind: 'weather' | 'voyage' | 'fish' | 'storm' | 'note' | 'story'; text: string };
export type LogbookPage = {
  day: number;
  /** 'YYYY-MM-DD' (KST). */
  date: string;
  title: string;
  weather: Weather;
  storm: boolean;
  lines: LogbookLine[];
};
/** This week's cup entries (lounge-fish-engine.ts AnglingView.cup.standings). */
export type LogbookCatches = readonly { actor: number; top: readonly { fish: string; cm: number }[] }[];
export type LogbookInput = {
  /** The page's KST day. */
  day: number;
  /** Today's KST day (the fish line and who is at sea are today's only). */
  today: number;
  /** This week's cup catches by friend. */
  catches?: LogbookCatches;
  /** Friends out on the 먼바다 boat right now (actors). */
  sailing?: readonly number[];
  /** Village flags (story entries). */
  flags?: readonly string[];
  story?: readonly LighthouseStoryEntry[];
};

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const SEA: Record<Weather, string> = {
  sunny: '바람 잔잔, 물결 낮음. 수평선이 또렷해요.',
  cloudy: '구름 낮게 깔림. 물결은 무릎 높이.',
  rain: '비. 갯바위가 미끄러우니 방파제 끝은 조심.',
  storm: '폭풍우. 파도가 방파제를 넘어요.',
  snow: '눈. 갑판과 계단에 눈이 쌓였어요.',
};
/** 가붕's one-line notes, by weather (one a day, the same on every screen). */
const NOTES: Record<Weather, readonly string[]> = {
  sunny: [
    '갈매기가 선착장 기둥마다 한 마리씩 앉았다. 오늘은 다들 기분이 좋은가 보다.',
    '렌즈를 닦았다. 햇빛이 무지개로 흩어져 방 안이 잠깐 축제 같았다.',
    '마을 쪽에서 빵 냄새가 바람을 타고 올라왔다. 점심은 정해졌다.',
  ],
  cloudy: [
    '구름이 낮은 날은 불빛이 더 멀리 간다. 오늘 밤은 일찍 켜야지.',
    '흐린 하늘 아래 바다는 은빛. 이런 날 고기가 잘 문다고들 한다.',
    '계단 난간에 기름칠. 삐걱 소리가 하나 줄었다.',
  ],
  rain: [
    '빗소리가 등명실 유리를 두드린다. 일지 쓰기 좋은 소리다.',
    '비 오는 밤엔 메기가 나온다던데. 강가 친구들 우산은 챙겼을까.',
    '젖은 우비를 고리에 걸었다. 내일 아침엔 말라 있겠지.',
  ],
  storm: [
    '폭풍. 배는 모두 묶어 두었다. 불은 밤새 꺼지지 않게 지킨다.',
    '파도가 방파제를 넘는다. 오늘은 다들 집에서 따뜻하게.',
    '바람이 탑을 휘감는다. 등대는 이런 날을 위해 서 있는 거다.',
  ],
  snow: [
    '눈 내리는 바다는 소리가 없다. 불빛만 천천히 돈다.',
    '계단에 쌓인 눈을 쓸었다. 마을 아이들이 눈사람을 만들었더라.',
    '첫 배 손님들 손이 시려 보였다. 난로를 일찍 피웠다.',
  ],
};
const pad = (n: number) => String(n).padStart(2, '0');

/** The rarest fish in this week's cup catches (the lowest catch weight), with who landed it. */
export function rarestCatch(catches: LogbookCatches | undefined): { fish: string; name: string; emoji: string; actor: number; cm: number } | null {
  let best: { fish: string; name: string; emoji: string; actor: number; cm: number; weight: number } | null = null;
  for (const s of catches ?? [])
    for (const c of s.top) {
      const def = FISH_BY_ID[c.fish];
      if (!def || !Number.isInteger(s.actor) || s.actor < 0 || s.actor >= ACTORS.length) continue;
      if (!best || def.weight < best.weight || (def.weight === best.weight && c.cm > best.cm))
        best = { fish: c.fish, name: def.name, emoji: def.emoji, actor: s.actor, cm: c.cm, weight: def.weight };
    }
  if (!best) return null;
  const { weight: _w, ...out } = best;
  return out;
}

/** One logbook page: the day's sea notes from existing village data (read only). */
export function logbookPage(input: LogbookInput): LogbookPage {
  const { day, today } = input;
  const weather = weatherOf(day),
    tomorrow = weatherOf(day + 1);
  const storm = weather === 'storm';
  const date = kstDate(day);
  const w = WEATHER_INFO[weather];
  const lines: LogbookLine[] = [{ kind: 'weather', text: `${w.emoji} ${w.name} · ${SEA[weather]}` }];
  const sailings = LAST_HOUR - FIRST_HOUR + 1;
  if (storm) lines.push({ kind: 'voyage', text: '먼바다 배: 결항. 샹크스 선장은 배를 묶어 두고 주점에서 쉬어요.' });
  else {
    lines.push({ kind: 'voyage', text: `먼바다 배: 게임 시각 ${pad(FIRST_HOUR)}:00부터 ${pad(LAST_HOUR)}:00까지 매시 출항 (하루 ${sailings}번).` });
    const out = day === today ? (input.sailing ?? []).filter((a) => Number.isInteger(a) && a >= 0 && a < ACTORS.length) : [];
    if (out.length) lines.push({ kind: 'voyage', text: `지금 바다에 나간 친구: ${[...new Set(out)].map((a) => ACTORS[a]).join(', ')}` });
  }
  if (day === today) {
    const rare = rarestCatch(input.catches);
    lines.push({
      kind: 'fish',
      text: rare ? `이번 주 가장 귀한 물고기: ${rare.emoji} ${rare.name} ${rare.cm}cm · ${ACTORS[rare.actor]}` : '이번 주 낚시 대회 기록은 아직 비어 있어요.',
    });
  }
  lines.push({
    kind: 'storm',
    text: storm
      ? '⚠ 폭풍 경보: 방파제 출입을 삼가고 배를 묶어 두세요.'
      : tomorrow === 'storm'
        ? '⚠ 내일 폭풍 예보: 먼바다 배가 쉬어요. 통발은 오늘 걷어 두세요.'
        : '경보 없음. 바다가 순해요.',
  });
  for (const e of lighthouseStory({ day, flags: input.flags }, input.story))
    lines.push({ kind: 'story', text: `${e.kind === 'letter' ? '✉' : '★'} ${e.title} — ${e.lines.join(' ')}` });
  const notes = NOTES[weather];
  lines.push({ kind: 'note', text: notes[pickIndex(`lighthouse-log:${day}`, notes.length)] });
  return {
    day,
    date,
    title: `${Number(date.slice(5, 7))}월 ${Number(date.slice(8, 10))}일 (${WEEKDAY[weekdayOf(day)]}) 바다 일지`,
    weather,
    storm,
    lines,
  };
}
/** Today's page and the ones before it, newest first. */
export function logbookPages(input: Omit<LogbookInput, 'day'>, count = LOGBOOK_PAGES): LogbookPage[] {
  return Array.from({ length: Math.max(1, Math.min(LOGBOOK_PAGES, count)) }, (_, i) => logbookPage({ ...input, day: input.today - i }));
}

// ---------------------------------------------------------------- 바다 바라보기
/** The calm lines of the balcony view (one a day). */
const VIEW_LINES = [
  '파도가 밀려왔다 물러가요. 숨도 같이 천천히.',
  '수평선 끝에서 배 한 척이 작게 반짝여요.',
  '바람에 소금 냄새가 실려 와요. 마음이 조금 넓어졌어요.',
  '갈매기 두 마리가 나란히 바람을 타요. 서두를 것 없어요.',
  '먼 섬들이 희미하게 보여요. 언젠가 저기까지 가 볼 수 있을까요.',
];
export const seaViewLine = (day: number) => VIEW_LINES[pickIndex(`lighthouse-view:${day}`, VIEW_LINES.length)];
/** How long the camera pans over the sea (ms). */
export const SEA_VIEW_MS = 6_500;
