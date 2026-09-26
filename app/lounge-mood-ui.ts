// 무드 UI helpers (pure): the three HUD moodles, the tooltip line, time left,
// and the panel's "이러면 나아져요" tips. No React, so tests can import it.
import { ACTOR_NAMES } from './lounge-calendar.ts';
import { DISH_BY_ID, ITEM_BY_ID } from './lounge-items.ts';
import {
  MOOD_TIER_BY_ID,
  SNACK_FOOD,
  type MoodIcon,
  type NeedId,
} from './lounge-mood-data.ts';
import type { MoodView } from './lounge-mood.ts';
import { CROP_INFO, CROPS, type Crop } from './lounge-life.ts';

const NEED_ICON: Record<NeedId, MoodIcon> = { food: 'bowl', rest: 'moon', fun: 'party', social: 'chat' };

export type Moodle = { key: string; icon: MoodIcon; label: string; value: number; until?: number; level: 1 | 2 | 3 | 4 };
const level = (v: number): Moodle['level'] => {
  const a = Math.abs(v);
  return a <= 2 ? 1 : a <= 4 ? 2 : a <= 7 ? 3 : 4;
};
/** The strongest thoughts and need effects, positive or negative (at most `n`). */
export function moodles(m: MoodView, n = 3): Moodle[] {
  const list: Moodle[] = [
    ...m.lets.map((l) => ({ key: l.id, icon: l.icon, label: l.name, value: l.value, until: l.until, level: level(l.value) })),
    ...m.needs
      .filter((x) => x.offset !== 0)
      .map((x) => ({ key: 'need-' + x.id, icon: NEED_ICON[x.id], label: `${x.name} · ${x.word}`, value: x.offset, level: level(x.offset) })),
  ];
  return list.sort((a, b) => Math.abs(b.value) - Math.abs(a.value) || (b.value < 0 ? 1 : 0) - (a.value < 0 ? 1 : 0)).slice(0, n);
}
/** "2시간 남음", "40분", "곧 사라져요". */
export function timeLeft(until: number, now: number) {
  const min = Math.ceil((until - now) / 60_000);
  if (min <= 1) return '곧 사라져요';
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60),
    rest = min % 60;
  return h >= 24 ? `${Math.floor(h / 24)}일` : rest && h < 3 ? `${h}시간 ${rest}분` : `${h}시간`;
}
export const signed = (v: number) => (v > 0 ? '+' : v < 0 ? '−' : '') + String(Math.abs(Math.round(v * 10) / 10));
/** Tooltip: "기분 좋아요 72 · 친구들과 한 판 +4 (2시간 남음) · 비 맞았어요 −3 (40분)". */
export function moodTooltip(m: MoodView, now: number) {
  return [
    `${MOOD_TIER_BY_ID[m.tier].name} ${m.v}`,
    ...moodles(m).map((x) => `${x.label} ${signed(x.value)}${x.until ? ` (${timeLeft(x.until, now)}${x.until - now > 60_000 ? ' 남음' : ''})` : ''}`),
  ].join(' · ');
}
/** One line under the big face. */
export function moodLine(m: MoodView) {
  const top = m.lets[0];
  if (m.insp) return `${m.insp.name}을 받았어요! 기분이 날아갈 것 같아요.`;
  if (m.tier === 'great') return top ? `오늘은 ${top.name.replace(/요!?$/, '서')} 신나요.` : '오늘은 뭘 해도 신나요.';
  if (m.tier === 'good') return top && top.value > 0 ? `${top.name} — 덕분에 기분이 좋아요.` : '오늘은 기분이 좋아요.';
  if (m.tier === 'ok') return '평범하고 괜찮은 하루예요.';
  if (m.tier === 'low') return '조금 시무룩해요. 아래 도움말을 해 보면 금방 나아져요.';
  return '많이 지쳤어요. 잠깐 쉬거나 따뜻한 걸 먹어 봐요.';
}

export type MoodTipAction = 'snack' | 'rest' | 'drink' | 'tea' | 'eat' | 'talk' | 'invite' | 'visit' | 'cheer' | 'fish' | 'none';
export type MoodTip = { key: string; text: string; why: string; action: MoodTipAction; actor?: number; item?: string };
export type MoodTipInput = {
  mood: MoodView;
  /** Bag: crop counts, fruit, inventory. */
  produce: Partial<Record<Crop, number>>;
  fruit: number;
  inv: Record<string, number>;
  /** Today's meal already eaten. */
  ate: boolean;
  /** Other friends online right now (actors). */
  online: number[];
  now: number;
};
/** The cheapest thing in the bag that makes a snack (crops, fruit, edible forage, dishes). */
export function snackPick(produce: MoodTipInput['produce'], fruit: number, inv: Record<string, number>) {
  const options: { id: string; name: string; value: number }[] = [];
  for (const c of CROPS) if ((produce[c] ?? 0) > 0) options.push({ id: c, name: CROP_INFO[c].name, value: CROP_INFO[c].sell ?? 0 });
  if (fruit > 0) options.push({ id: 'fruit', name: '과일', value: 150 });
  for (const [id, n] of Object.entries(inv)) {
    if (n <= 0) continue;
    const item = ITEM_BY_ID[id] as { name: string; sell: number; kind?: string } | undefined;
    if (DISH_BY_ID[id]) options.push({ id, name: DISH_BY_ID[id].name, value: DISH_BY_ID[id].sell + 10_000 });
    else if (item?.kind === 'forage') options.push({ id, name: item.name, value: item.sell });
  }
  return options.sort((a, b) => a.value - b.value)[0] ?? null;
}
/** Up to three tips from the lowest need and the biggest negative thought. */
export function moodTips(input: MoodTipInput): MoodTip[] {
  const { mood: m, online, now } = input;
  const tips: (MoodTip & { score: number })[] = [];
  const need = (id: NeedId) => m.needs.find((x) => x.id === id)!;
  // A need that is dropping but still "okay" gets a softer word.
  const soft: Record<NeedId, string> = { food: '출출해지고 있어요', rest: '조금 피곤해요', fun: '조금 심심해요', social: '친구가 그리워요' };
  const feel = (id: NeedId) => {
    const n = need(id);
    return n.offset < 0 ? n.word : soft[id];
  };
  const name = (a: number) => ACTOR_NAMES[a] ?? '친구';
  if (m.cup) tips.push({ key: 'tea', text: '촌장님 찻잔이 와 있어요 → 따뜻하게 마시기', why: '생각 +6 · 배부름 60 이상', action: 'tea', score: 100 });
  const food = need('food');
  if (food.value < 55) {
    const dish = Object.keys(input.inv).find((id) => input.inv[id] > 0 && DISH_BY_ID[id]?.buff);
    const snack = m.snacksLeft ? snackPick(input.produce, input.fruit, input.inv) : null;
    if (!input.ate && dish)
      tips.push({ key: 'eat', text: `${feel('food')} → 가방의 ${DISH_BY_ID[dish].name} 먹기`, why: '배부름 가득 · 맛있는 식사 +3', action: 'eat', item: dish, score: 90 - food.value });
    else if (snack)
      tips.push({ key: 'snack', text: `${feel('food')} → ${snack.name} 간식 먹기`, why: `배부름 +${DISH_BY_ID[snack.id] ? 40 : SNACK_FOOD} · 오늘 ${m.snacksLeft}번 더`, action: 'snack', item: snack.id, score: 85 - food.value });
    else
      tips.push({ key: 'drink', text: `${feel('food')} → 카지노 바에서 음료 한 잔`, why: m.drinkPrice ? `배부름 +20 · ${m.drinkPrice}범` : '배부름 +20 · 오늘 첫 잔은 무료', action: 'drink', score: 80 - food.value });
  }
  const rest = need('rest');
  if (rest.value < 45)
    tips.push(
      m.restAt > now
        ? { key: 'rest', text: `${feel('rest')} → 조금 뒤 침대에서 또 쉬어요`, why: '6시간 쉬면 푹 자고 와요', action: 'none', score: 70 - rest.value }
        : { key: 'rest', text: `${feel('rest')} → 내 방 침대에서 쉬기`, why: '휴식 +50', action: 'rest', score: 88 - rest.value },
    );
  const fun = need('fun');
  if (fun.value < 55)
    tips.push(
      online.length
        ? { key: 'invite', text: `${name(online[0])}이(가) 접속 중이에요 → 한 판 어때요?`, why: '즐거움 +25 · 사교 +15', action: 'invite', actor: online[0], score: 75 - fun.value }
        : { key: 'fish', text: `${feel('fun')} → 낚시나 채집으로 기분 전환`, why: '종류를 바꿔 가며 놀면 더 즐거워요', action: 'fish', score: 60 - fun.value },
    );
  const social = need('social');
  if (social.value < 55)
    tips.push(
      online.length
        ? { key: 'visit', text: `${feel('social')} → ${name(online[online.length - 1])}의 방에 놀러 가기`, why: '사교 +15 · 친구 방에서 놀았어요 +6', action: 'visit', actor: online[online.length - 1], score: 72 - social.value }
        : { key: 'talk', text: `${feel('social')} → 마을 친구에게 말 걸기`, why: '사교 +10 · 수다 +2', action: 'talk', score: 65 - social.value },
    );
  const worst = [...m.lets].filter((l) => l.value < 0).sort((a, b) => a.value - b.value)[0];
  if (worst) {
    const text =
      worst.id === 'rain' || worst.id === 'storm'
        ? '비가 와요 → 오늘은 방에서 쉬어도 좋아요'
        : worst.id === 'bigLoss'
          ? '크게 잃은 기분은 몇 시간이면 사라져요 → 친구와 수다 어때요?'
          : worst.id === 'bang'
            ? '뻥총에 뻗은 건 금방 잊혀요 → 바에서 한 잔 어때요?'
            : `${worst.name} → 금방 지나가요`;
    tips.push({ key: 'neg-' + worst.id, text, why: `${signed(worst.value)} · 곧 사라져요`, action: worst.id === 'bang' ? 'drink' : worst.id === 'bigLoss' ? 'talk' : 'rest', score: 50 - worst.value * 5 });
  }
  const low = Object.entries(m.faces)
    .filter(([a, f]) => (f.tier === 'low' || f.tier === 'tired') && !m.cheered.includes(+a))
    .map(([a]) => +a);
  if (low.length) tips.push({ key: 'cheer', text: `${name(low[0])}이(가) 시무룩해 보여요 → 응원해 볼까요?`, why: '응원하면 나도 +2', action: 'cheer', actor: low[0], score: 58 });
  if (!tips.length)
    tips.push({
      key: 'good',
      text: m.insp ? `${m.insp.name}을 써 봐요!` : '지금 이대로 좋아요 → 영감 게이지가 차고 있어요',
      why: m.insp ? m.insp.text : `기분이 65를 넘으면 게이지가 차요 (이번 주 ${m.week}/${m.weekMax})`,
      action: 'none',
      score: 1,
    });
  return tips
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score: _score, ...t }) => t);
}
