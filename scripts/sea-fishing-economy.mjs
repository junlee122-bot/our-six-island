// 먼바다 낚싯배 수익 점검 (design-sea-fishing.md §5): plays a 20-minute voyage
// and 20 minutes on the harbor's breakwater through the real engine (cast →
// hook → fight with the reference player → land) and values the catch at the
// 어시장 (full share) with the live fish prices and the live fish selling rule
// (lounge-life-plus sellTotal: FISH_DEMAND_FREE of a species a day at full
// price, then the usual demand curve; no market saturation or daily cap).
//
//   node --experimental-strip-types --no-warnings scripts/sea-fishing-economy.mjs
import { emptyLife, ensureLifeMember, lifeAction, lifeView } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, kstDay } from '../app/lounge-economy.ts';
import { GAME_MINUTE_MS, seasonOf, weatherOf, gameHour } from '../app/lounge-calendar.ts';
import { botPlay, TICK_MS } from '../app/lounge-fish-minigame.ts';
import { FISH_BY_ID } from '../app/lounge-items.ts';
import { FISH_DEMAND_FREE, sellTotal } from '../app/lounge-life-plus.ts';
import { VOYAGE_FARE, VOYAGE_MS, boardingSailing } from '../app/lounge-voyage-data.ts';

const HOUR = 3_600_000;
const UID = '11111111-1111-4111-8111-111111111111';
const M = { id: UID, actor: 0 };
const OVERHEAD_MS = 1_000 + 400 + 2_500;
/**
 * A friend's real pace: the reference player is quick, so each fish takes at
 * least this long (walking to a rail, the card, the bag, chat): about 35 fish
 * in 20 minutes, the pace the design assumes.
 */
const PACE_MS = Number(process.env.PACE_MS ?? 34_000);
/** 범 for selling k of a species in one day at the 어시장 (fish skip saturation and the cap). */
const saleOf = (id, k) => sellTotal(id, FISH_BY_ID[id]?.sell ?? 0, 0, k);

/** The first game hour:minute (게임 하루 = 실제 1시간) in that season and sky. */
function findTime(season, hour, minute, sky) {
  const T0 = Date.UTC(2026, 8, 24, 3);
  for (let t = T0; t < T0 + 200 * 24 * HOUR; t += HOUR / 24) {
    const w = weatherOf(kstDay(t));
    if (seasonOf(t) === season && gameHour(t) === hour && (sky === 'rain' ? w === 'rain' : !['rain', 'storm', 'snow'].includes(w))) return t + minute * GAME_MINUTE_MS;
  }
  throw new Error('no time');
}

function session({ spot, season, hour, rod, level, sky, bait, minutes = 20 }) {
  let ledger = registerWallet(newLoungeLedger(), `wallet-${UID}`);
  let life = ensureLifeMember(emptyLife(), UID, 0);
  life.flags = ['bridge', 'lights', 'district-harbor'];
  life.growth = { u: { [UID]: { xp: { fish: [0, 60, 160, 320, 560, 900, 1400, 2100, 3100, 4500][Math.max(0, level - 1)] }, tools: { rod } } } };
  if (bait) ((life.ext ??= {})[UID] ??= {}).inv = { [bait]: 999 };
  const act = (a, at) => {
    const next = lifeAction(life, ledger, M, a, at);
    life = next.life;
    ledger = next.ledger;
  };
  let start = findTime(season, hour, 0, sky);
  if (spot === 'offshore') {
    const board = start - 60_000;
    act({ kind: 'voyageBoard' }, board);
    start = boardingSailing(board) + 1_000;
  }
  const end = start + (spot === 'offshore' ? VOYAGE_MS - 1_000 : minutes * 60_000);
  let at = start,
    tries = 0;
  const caught = {};
  while (at < end - 20_000) {
    act({ kind: 'anglerCast', spot, ...(bait ? { bait } : {}) }, at);
    const cast = lifeView(life, UID, 0, at).angling.me.cast;
    const hookAt = cast.biteAt + 400;
    act({ kind: 'anglerHook', token: cast.token }, hookAt);
    const fight = lifeView(life, UID, 0, hookAt).angling.me.fight;
    const play = botPlay(fight.setup, { react: 7, look: 3 });
    const landAt = hookAt + play.result.ticks * TICK_MS + 50;
    act({ kind: 'anglerLand', token: fight.token, runs: play.runs }, landAt);
    tries++;
    const last = lifeView(life, UID, 0, landAt).angling.me.last;
    if (last.ok) caught[last.fish] = (caught[last.fish] ?? 0) + 1;
    at = Math.max(landAt + OVERHEAD_MS, at + PACE_MS);
  }
  let value = 0,
    n = 0;
  for (const [id, k] of Object.entries(caught)) {
    n += k;
    value += saleOf(id, k);
  }
  return { tries, n, value: Math.round(value), species: Object.keys(caught).length };
}

const rows = [
  { label: '방파제 · 가을 낮 · 3단 · Lv6', opts: { spot: 'breakwater', season: 'autumn', hour: 12, rod: 3, level: 6 } },
  { label: '먼바다 · 가을 낮 · 3단 · Lv6', opts: { spot: 'offshore', season: 'autumn', hour: 12, rod: 3, level: 6 } },
  { label: '방파제 · 여름 낮 · 2단 · Lv4', opts: { spot: 'breakwater', season: 'summer', hour: 10, rod: 2, level: 4 } },
  { label: '먼바다 · 여름 낮 · 2단 · Lv4', opts: { spot: 'offshore', season: 'summer', hour: 10, rod: 2, level: 4 } },
  { label: '먼바다 · 여름 낮 · 3단 · Lv8 · 새우', opts: { spot: 'offshore', season: 'summer', hour: 10, rod: 3, level: 8, bait: 'bait-shrimp' } },
  { label: '방파제 · 겨울 밤 · 3단 · Lv6', opts: { spot: 'breakwater', season: 'winter', hour: 18, rod: 3, level: 6 } },
  { label: '먼바다 · 겨울 저녁 · 3단 · Lv6', opts: { spot: 'offshore', season: 'winter', hour: 18, rod: 3, level: 6 } },
  { label: '먼바다 · 봄 비 · 3단 · Lv6', opts: { spot: 'offshore', season: 'spring', hour: 12, rod: 3, level: 6, sky: 'rain' } },
];
console.log(`한 마리 최소 ${PACE_MS / 1000}초`);
console.log(`| 20분 | 시도 / 낚음 | 어종 | 판매(어시장, ${FISH_DEMAND_FREE}마리까지 정가·이후 수요 곡선) | 승선료 뺀 순익 |`);
console.log('|---|---|---|---|---|');
for (const { label, opts } of rows) {
  const r = session(opts);
  const net = opts.spot === 'offshore' ? r.value - VOYAGE_FARE : r.value;
  console.log(`| ${label} | ${r.tries} / ${r.n} | ${r.species} | ${r.value.toLocaleString('en-US')} | ${net.toLocaleString('en-US')} |`);
}
