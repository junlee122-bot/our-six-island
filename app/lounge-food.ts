// 음식 시스템 engine bits shared by the life engines (design-food-and-shops.md
// §2): the 맛 도감 (first taste of each food, a small 범 reward every
// TASTE_STEP foods) and 함께 먹기 (two friends eating in the same place within
// TOGETHER_MS both get a moodlet and sociability, once per pair a day). The
// meals themselves are the life 'eat' action (lounge-life-plus.ts); 빵집 and
// 주점 food is the town 'shopFood' action (lounge-town.ts).
//
// Cycle-safe: imported by lounge-life / lounge-life-plus / lounge-town and
// importing them back, so their bindings are used inside functions only.
import { grantBeom, type LoungeLedger } from './lounge-economy.ts';
import { ACTOR_NAMES } from './lounge-calendar.ts';
import type { LifeState } from './lounge-life.ts';
import { addNews, bondGate, pairKey } from './lounge-life-plus.ts';
import { moodTogether } from './lounge-mood.ts';
import {
  EAT_PLACES,
  SHOP_FOOD_BY_ID,
  TASTE_REWARD,
  TASTE_STEP,
  TOGETHER_MS,
  TOGETHER_SOCIAL,
  isTasteId,
  type EatPlace,
} from './lounge-food-data.ts';

const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const extOf = (life: LifeState, uid: string) => ((life.ext ??= {})[uid] ??= {});

/** Records a first taste; pays TASTE_REWARD for each new TASTE_STEP reached. */
export function tasteNote(life: LifeState, ledger: LoungeLedger, uid: string, id: string, now: number): LoungeLedger {
  if (!isTasteId(id)) return ledger;
  const x = extOf(life, uid),
    list = (x.taste ??= []);
  if (list.includes(id)) return ledger;
  list.push(id);
  const due = Math.floor(list.length / TASTE_STEP),
    paid = x.tasteRw ?? 0,
    wallet = 'wallet-' + uid;
  if (due <= paid || !own(ledger.accounts, wallet)) return ledger;
  x.tasteRw = due;
  return grantBeom(ledger, wallet, TASTE_REWARD * (due - paid), `life-taste-${uid}-${++life.seq}`, now, 'taste');
}

/** Where an eating action happened (null: unknown, so no 함께 먹기). */
function eatPlace(action: { kind: string; where?: unknown; item?: unknown; shop?: unknown }): EatPlace | null {
  if (action.kind === 'bakeryBuy') return 'market';
  if (action.kind === 'shopFood') {
    const f = typeof action.item === 'string' && own(SHOP_FOOD_BY_ID, action.item) ? SHOP_FOOD_BY_ID[action.item] : undefined;
    return f ? (f.shop === 'tavern' ? 'tavern' : 'market') : null;
  }
  if (action.kind !== 'eat' && action.kind !== 'snack') return null;
  return (EAT_PLACES as readonly unknown[]).includes(action.where) ? (action.where as EatPlace) : null;
}
/**
 * After a successful eating action (lounge-life.ts lifeAction): remembers
 * when and where I ate, and 함께 먹기 with every friend who ate in the same
 * place within TOGETHER_MS (once per pair a KST day).
 */
export function foodAfterAction(life: LifeState, member: { id: string; actor: number }, action: { kind: string }, now: number) {
  const where = eatPlace(action as { kind: string });
  if (!where) return;
  const tavern = where === 'tavern';
  for (const [uid, actor] of Object.entries(life.actors)) {
    if (uid === member.id || actor === member.actor) continue;
    const e = life.ext?.[uid]?.eatAt;
    if (!e || e.w !== where || now - e.at > TOGETHER_MS || e.at > now) continue;
    if (!bondGate(life, `eat:${pairKey(member.actor, actor)}`, now)) continue;
    moodTogether(life, member.id, now, tavern, TOGETHER_SOCIAL);
    moodTogether(life, uid, now, tavern, TOGETHER_SOCIAL);
    const a = ACTOR_NAMES[member.actor] ?? '친구',
      b = ACTOR_NAMES[actor] ?? '친구';
    addNews(life, now, `eat:${pairKey(member.actor, actor)}`, 'mood', `${a}와(과) ${b}이(가) ${tavern ? '주점에서 한 상 같이 먹었어요' : '같이 밥을 먹었어요'}`, [member.actor, actor]);
  }
  extOf(life, member.id).eatAt = { at: now, w: where };
}
