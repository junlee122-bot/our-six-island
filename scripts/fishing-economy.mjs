// 낚시 수익 점검 (design-fishing-upgrade.md §10): plays one hour of fishing
// through the real engine (cast → hook → fight with the reference player →
// land), sells the catch through the real sell path (demand curves, market
// taper, quality) and compares it with farming per hour.
//
//   node --experimental-strip-types --no-warnings scripts/fishing-economy.mjs
import { emptyLife, ensureLifeMember, lifeAction, lifeView, CROP_INFO, CROPS } from '../app/lounge-life.ts';
import { newLoungeLedger, registerWallet, validateLedger, kstDay } from '../app/lounge-economy.ts';
import { seasonOf, weatherOf, gameHour, GAME_HOUR_MS } from '../app/lounge-calendar.ts';
import { botPlay, TICK_MS } from '../app/lounge-fish-minigame.ts';

const HOUR = 3_600_000;
const UID = '11111111-1111-4111-8111-111111111111';
const M = { id: UID, actor: 0 };
/** Seconds around each fish that are not the bite wait or the fight. */
const OVERHEAD_MS = 1_000 + 400 + 2_500; // cast swing, reaction, reading the card

/** The first dry day of `season` at game hour `hour` (an hour of fishing then runs through a whole game day). */
function findTime(season, hour) {
  const T0 = Date.UTC(2026, 8, 24, 3);
  for (let t = T0; t < T0 + 28 * 24 * HOUR; t += GAME_HOUR_MS)
    if (seasonOf(t) === season && gameHour(t) === hour && !['rain', 'storm'].includes(weatherOf(kstDay(t)))) return t;
  throw new Error('no time');
}

function hourOfFishing({ spot, season, hour, rod = 1, level = 0, bait, bot = { react: 7, look: 3 } }) {
  let ledger = registerWallet(newLoungeLedger(), `wallet-${UID}`);
  let life = ensureLifeMember(emptyLife(), UID, 0);
  life.flags = ['bridge', 'lights'];
  life.growth = { u: { [UID]: { xp: { fish: [0, 60, 160, 320, 560, 900, 1400, 2100, 3100, 4500][Math.max(0, level - 1)] ?? 0 }, tools: { rod } } } };
  if (bait) ((life.ext ??= {})[UID] ??= {}).inv = { [bait]: 999 };
  const act = (a, at) => {
    const next = lifeAction(life, ledger, M, a, at);
    life = next.life;
    ledger = next.ledger;
  };
  const start = findTime(season, hour);
  let at = start,
    tries = 0,
    caught = 0;
  while (at < start + HOUR) {
    act({ kind: 'anglerCast', spot, ...(bait ? { bait } : {}) }, at);
    const cast = lifeView(life, UID, 0, at).angling.me.cast;
    const hookAt = cast.biteAt + 400;
    act({ kind: 'anglerHook', token: cast.token }, hookAt);
    const fight = lifeView(life, UID, 0, hookAt).angling.me.fight;
    const play = botPlay(fight.setup, bot);
    const landAt = hookAt + play.result.ticks * TICK_MS + 50;
    act({ kind: 'anglerLand', token: fight.token, runs: play.runs }, landAt);
    tries++;
    if (lifeView(life, UID, 0, landAt).angling.me.last.ok) caught++;
    at = landAt + OVERHEAD_MS;
  }
  // Sell everything that is a fish, one species at a time (the way a player would).
  const inv = lifeView(life, UID, 0, at).me.inv;
  const before = ledger.accounts[`wallet-${UID}`];
  let baitCost = 0;
  for (const [id, n] of Object.entries(inv)) {
    if (id.startsWith('bait')) continue;
    try {
      act({ kind: 'sellItem', item: id, n }, at);
    } catch {
      /* seeds/food parcels are not sold here */
    }
  }
  if (bait) baitCost = (999 - (lifeView(life, UID, 0, at).me.inv[bait] ?? 0)) * (bait === 'bait-shrimp' ? 80 : bait === 'bait-dough' ? 40 : 150);
  validateLedger(ledger);
  const earned = ledger.accounts[`wallet-${UID}`] - before;
  return { tries, caught, earned, net: earned - baitCost };
}

/** The pre-upgrade flow (cast → reel on the bite, no fight) for comparison. */
function hourOfLegacy({ spot, season, hour }) {
  let ledger = registerWallet(newLoungeLedger(), `wallet-${UID}`);
  let life = ensureLifeMember(emptyLife(), UID, 0);
  const act = (a, at) => {
    const next = lifeAction(life, ledger, M, a, at);
    life = next.life;
    ledger = next.ledger;
  };
  const start = findTime(season, hour);
  let at = start,
    tries = 0;
  while (at < start + HOUR) {
    act({ kind: 'cast', spot }, at);
    const p = lifeView(life, UID, 0, at).me.fishing.pending;
    act({ kind: 'reel', token: p.token, timingMs: 300 }, p.biteAt + 400);
    tries++;
    at = p.biteAt + 400 + OVERHEAD_MS;
  }
  const before = ledger.accounts[`wallet-${UID}`];
  for (const [id, n] of Object.entries(lifeView(life, UID, 0, at).me.inv)) {
    try {
      act({ kind: 'sellItem', item: id, n }, at);
    } catch {
      /* not sellable */
    }
  }
  return { tries, earned: ledger.accounts[`wallet-${UID}`] - before };
}

const rows = [
  ['강 · 봄 낮 · 낚싯대 1단', { spot: 'river', season: 'spring', hour: 12 }],
  ['연못 · 여름 낮 · 낚싯대 1단', { spot: 'pond', season: 'summer', hour: 12 }],
  ['갯바위 · 가을 낮 · 3단 · 새우 미끼 · Lv6', { spot: 'rocks', season: 'autumn', hour: 12, rod: 3, level: 6, bait: 'bait-shrimp' }],
  ['밤 항구 · 가을 22시 · 3단 · Lv6', { spot: 'harbor', season: 'autumn', hour: 22, rod: 3, level: 6 }],
  ['바다 데크 · 겨울 낮 · 4단 · Lv10 · 잘하는 친구', { spot: 'sea', season: 'winter', hour: 12, rod: 4, level: 10, bot: { react: 3, look: 6 } }],
];
console.log('낚시 1시간 (첫 판매, 하루 수요 곡선 적용 · 물고기는 같은 어종 4마리까지 제값, 시장 포화·하루 한도 없음)');
for (const [name, opts] of rows) {
  const r = hourOfFishing(opts);
  console.log(`  ${name.padEnd(34)} 시도 ${String(r.tries).padStart(3)} · 낚음 ${String(r.caught).padStart(3)} · 판매 ${r.earned.toLocaleString('en-US').padStart(7)}범 · 미끼 뺀 ${r.net.toLocaleString('en-US').padStart(7)}범`);
}
const legacy = hourOfLegacy({ spot: 'river', season: 'spring', hour: 12 });
console.log(`  (업그레이드 전) 강 · 봄 낮 · 1단               시도 ${legacy.tries} · 판매 ${legacy.earned.toLocaleString('en-US')}범`);
console.log('\n농사 (12칸, 씨앗값 뺀 이익, 수확 품질·계절 가산 없음)');
for (const c of CROPS) {
  const info = CROP_INFO[c],
    hours = info.growMs / HOUR,
    profit = info.sell - info.seed;
  console.log(`  ${info.name.padEnd(6)} ${hours.toFixed(1).padStart(4)}시간 · 칸당 ${profit.toLocaleString('en-US').padStart(6)} · 12칸 시간당 ${Math.round((profit * 12) / hours).toLocaleString('en-US').padStart(7)}범 (손 쓰는 시간 몇 분)`);
}
