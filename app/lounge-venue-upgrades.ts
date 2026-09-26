// 가게 업그레이드: the contribution action (server side; data and rules are in
// lounge-venue-data.ts, re-exported here).
import { spendBeom, type LoungeLedger } from './lounge-economy.ts';
import { LifeError, type LifeState } from './lounge-life.ts';
import { addMemory, addNews } from './lounge-life-plus.ts';
import { ACTORS } from './lounge-roster.ts';
import { josa } from './lounge-text.ts';
import {
  VENUE_NAME,
  VENUE_REJECT,
  VENUE_MIN_GIVE,
  VENUE_UPGRADE_BY_ID,
  upgradeDone,
  upgradeOpen,
  type VenueAction,
} from './lounge-venue-data.ts';
export * from './lounge-venue-data.ts';

const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);

/**
 * One contribution. `life` is the engine's working copy (mutated like the
 * other life actions); returns the new ledger.
 */
export function venueAction(
  life: LifeState,
  ledger: LoungeLedger,
  member: { id: string; actor: number },
  a: VenueAction,
  now: number,
): { life: LifeState; ledger: LoungeLedger } {
  const def = typeof a.upgrade === 'string' && Object.hasOwn(VENUE_UPGRADE_BY_ID, a.upgrade) ? VENUE_UPGRADE_BY_ID[a.upgrade] : null;
  if (!def) throw new LifeError(VENUE_REJECT.upgrade);
  if (upgradeDone(life, def.id)) throw new LifeError(VENUE_REJECT.done);
  if (!upgradeOpen(life, def)) throw new LifeError(VENUE_REJECT.locked);
  const venues = (life.venues ??= {}),
    state = (venues[def.id] ??= { got: 0, by: {} });
  const left = def.cost - state.got;
  if (!safe(a.n) || a.n < Math.min(VENUE_MIN_GIVE, left)) throw new LifeError(VENUE_REJECT.give);
  const amount = Math.min(a.n, left),
    wallet = 'wallet-' + member.id;
  if ((ledger.accounts[wallet] ?? 0) < amount) throw new LifeError(VENUE_REJECT.balance);
  // Unique entry id per contribution (life.seq is the engine's counter, as in seqId).
  const entry = `life-venue-up-${member.id}-${++life.seq}`;
  const next = spendBeom(ledger, wallet, amount, entry, now, 'venue-up');
  state.got += amount;
  state.by[String(member.actor)] = Math.min(Number.MAX_SAFE_INTEGER, (state.by[String(member.actor)] ?? 0) + amount);
  const who = ACTORS[member.actor] ?? '친구';
  addNews(life, now, `venue:${def.id}:${member.actor}`, 'bundle', `${josa(who, '이/가')} ${VENUE_NAME[def.venue]} “${def.name}”에 범을 보탰어요`, [member.actor]);
  if (state.got >= def.cost) {
    state.doneAt = now;
    const helpers = Object.keys(state.by)
      .map(Number)
      .filter((n) => Number.isInteger(n) && n >= 0 && n < 7)
      .sort((p, q) => p - q);
    const text = `${VENUE_NAME[def.venue]} “${def.name}” 완성! ${def.note}`;
    addMemory(life, now, 'project', helpers, text);
    addNews(life, now, `venuedone:${def.id}`, 'bundle', text, helpers);
  }
  return { life, ledger: next };
}
