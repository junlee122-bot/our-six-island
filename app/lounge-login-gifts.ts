// Server-only login hook. Pending gifts are armed by a trusted administrator in
// the private world row; no request field or public game action creates one.
import type { CloudWorld } from './lounge-cloud-engine.ts';
import { casBackoffMs } from './lounge-accounts.ts';
import { grantBeom, validateLedger } from './lounge-economy.ts';
import { ensureLifeMember, MAIL_MAX, MAIL_TEXT_MAX, readLife } from './lounge-life.ts';

/** Retain delivered records permanently, even after mail/ledger entries expire. */
export type LoginGift = {
  uid: string;
  amount: number;
  title: string;
  armedAt: number;
  deliveredAt?: number;
  ledgerEntryId?: string;
};
export type LoginGiftMember = { id: string; actor: number };
export type LoginGiftWorldRow = { revision: number; state: CloudWorld; now: number };
export type LoginGiftStore = {
  read: () => Promise<LoginGiftWorldRow>;
  commit: (revision: number, state: CloudWorld) => Promise<number | null>;
  sleep?: (ms: number) => Promise<void>;
};
export const LOGIN_GIFT_CAS_ATTEMPTS = 12;
export const LOGIN_GIFT_UNAVAILABLE =
  '로그인 선물을 확인하지 못했어요. 잠시 후 다시 로그인해 주세요.';
export class LoginGiftError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(LOGIN_GIFT_UNAVAILABLE);
    this.reason = reason;
  }
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GIFT_ID = /^[A-Za-z0-9-]{1,48}$/;
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const positiveInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const fail = (reason: string): never => { throw new LoginGiftError(reason); };
function validTitle(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > 40) return false;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) return false;
  }
  return true;
}

/** Pure transition, called only after the server has verified a login's uid. */
export function applyLoginGifts(
  original: CloudWorld,
  member: LoginGiftMember,
  now: number,
): { state: CloudWorld; changed: boolean; delivered: string[] } {
  if (!UUID.test(member.id) || !Number.isInteger(member.actor) || member.actor < 0 || member.actor > 6)
    fail('invalid_member');
  if (!positiveInteger(now) || original?.schema !== 1) fail('invalid_world');
  const records = original.loginGifts;
  if (records === undefined) return { state: original, changed: false, delivered: [] };
  if (!records || typeof records !== 'object' || Array.isArray(records)) fail('invalid_gifts');
  const pending: [string, LoginGift][] = [];
  for (const [id, gift] of Object.entries(records)) {
    // Another account's pending gift never changes the current login's world.
    if (!gift || typeof gift !== 'object' || gift.uid !== member.id) continue;
    if (
      !GIFT_ID.test(id) || !UUID.test(gift.uid) || !positiveInteger(gift.amount) ||
      !validTitle(gift.title) ||
      !positiveInteger(gift.armedAt)
    ) fail('invalid_gift');
    const entryId = 'login-gift-' + id;
    if (own(gift, 'deliveredAt') || own(gift, 'ledgerEntryId')) {
      // A malformed delivery marker is never interpreted as a new pending gift.
      if (!positiveInteger(gift.deliveredAt) || gift.deliveredAt < gift.armedAt || gift.ledgerEntryId !== entryId)
        fail('invalid_delivery');
      continue;
    }
    if (gift.armedAt <= now) pending.push([id, gift]);
  }
  if (!pending.length) return { state: original, changed: false, delivered: [] };
  validateLedger(original.ledger);
  const wallet = 'wallet-' + member.id;
  // Scheduled gifts must not silently create an additional initial wallet grant.
  if (!own(original.ledger.accounts, wallet)) fail('missing_wallet');
  const next = structuredClone(original);
  next.life = ensureLifeMember(next.life ?? readLife(null), member.id, member.actor);
  for (const [id, gift] of pending) {
    const entryId = 'login-gift-' + id;
    const text = `[마을 선물] ${gift.title.trim().replace(/\s+/g, ' ')} ${gift.amount.toLocaleString('en-US')}범이 지갑에 입금되었어요.`;
    if (text.length > MAIL_TEXT_MAX) fail('gift_notice_too_long');
    // grantBeom updates balance, granted, flow totals and the ledger revision,
    // then verifies the conservation invariant. No money is attached to mail.
    next.ledger = grantBeom(next.ledger, wallet, gift.amount, entryId, now, gift.title.trim());
    const inbox = next.life.mail[member.id] ?? [];
    if (inbox.some((mail) => mail.id === entryId)) fail('existing_gift_notice');
    next.life.mail[member.id] = [...inbox, {
      id: entryId, from: member.id, actor: member.actor,
      text, at: now, read: false,
    }].slice(-MAIL_MAX);
    next.loginGifts![id] = { ...gift, deliveredAt: now, ledgerEntryId: entryId };
  }
  validateLedger(next.ledger);
  return { state: next, changed: true, delivered: pending.map(([id]) => id) };
}

/** A lost response or simultaneous login retries the full transition from CAS. */
export async function completeLoginGifts(
  op: string,
  member: LoginGiftMember,
  store: LoginGiftStore,
): Promise<LoginGiftWorldRow> {
  // Refresh/profile/activation/recovery and game open/read must never claim it.
  if (op !== 'login') return store.read();
  const sleep = store.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  for (let attempt = 0; attempt < LOGIN_GIFT_CAS_ATTEMPTS; attempt++) {
    if (attempt) await sleep(casBackoffMs(attempt - 1));
    const row = await store.read();
    if (!Number.isSafeInteger(row.revision) || row.revision < 0) fail('invalid_revision');
    const next = applyLoginGifts(row.state, member, row.now);
    if (!next.changed) return row;
    const revision = await store.commit(row.revision, next.state);
    if (revision === null) continue;
    if (!Number.isSafeInteger(revision) || revision <= row.revision) fail('invalid_commit');
    return { ...row, revision, state: next.state };
  }
  return fail('cas_exhausted');
}
