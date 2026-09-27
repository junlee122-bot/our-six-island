// Bank, promissory notes and casino counter. Called only by the cloud engine.
import { houseTransfer, kstDay, spendBeom, storeBeom, transferBeom, validateLedger, type LoungeLedger } from './lounge-economy.ts';
import { CROPS, CROP_INFO, cloneLife, uidOf, type LifeState } from './lounge-life.ts';
import { addCropQ, cropQCount } from './lounge-life-plus.ts';
import { FURNITURE_BY_REF } from './lounge-items.ts';
import { ACTORS } from './lounge-roster.ts';

const DAY = 86_400_000;
const wallet = (uid: string) => 'wallet-' + uid;
const integer = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;
function fail(text: string): never { throw new Error(text); }
export type Loan = {
  id: string; lender: string; borrower: string; principal: number; interest: number;
  days: number; offeredAt: number; dueAt: number; paid: number;
  state: 'offered' | 'active' | 'paid' | 'declined'; remindedAt?: number;
};
export type FinanceLog = { id: number; users: string[]; at: number; text: string };
export type CasinoDay = { day: number; earned: number; paid: number; net: Record<string, number>; mercy: Record<string, number> };
export type FinanceState = {
  version: 1; seq: number; loans: Loan[]; logs: FinanceLog[];
  protection: Record<string, { until: number; whistles: number }>; attempts: Record<string, number>; targeted: Record<string, number>;
  casino: CasinoDay[];
};
export type FinanceAction = { kind: 'finance' } & (
  | { op: 'deposit' | 'withdraw'; amount: number }
  | { op: 'offer'; to: number; amount: number; interest: number; days: number }
  | { op: 'accept' | 'decline' | 'remind'; id: string }
  | { op: 'repay'; id: string; amount: number }
  | { op: 'borrow'; amount: number }
  | { op: 'protect'; item: 'lock' | 'whistle' }
  | { op: 'rob'; to: number; item: 'cash' | 'produce' | 'furniture' }
  | { op: 'mercy' }
);
export type FinancePresence = { id: string; actor: number; area: string; x: number; y: number; busy?: boolean };
export const newFinance = (): FinanceState => ({ version: 1, seq: 0, loans: [], logs: [], protection: {}, attempts: {}, targeted: {}, casino: [] });
const dictionary = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const validUser = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(v) && !['constructor', 'prototype', '__proto__'].includes(v);
const timeValue = (v: unknown) => integer(v, 0, Number.MAX_SAFE_INTEGER);
export function readFinance(raw?: FinanceState): FinanceState {
  if (raw === undefined) return newFinance();
  if (!raw || raw.version !== 1 || !integer(raw.seq, 0, Number.MAX_SAFE_INTEGER) ||
    !Array.isArray(raw.loans) || raw.loans.length > 200 || !Array.isArray(raw.logs) || raw.logs.length > 100 || !Array.isArray(raw.casino) || raw.casino.length > 31 ||
    !dictionary(raw.protection) || !dictionary(raw.attempts) || !dictionary(raw.targeted) || raw.loans.some((l) =>
      !l || typeof l.id !== 'string' || !/^note-\d+$/.test(l.id) || !validUser(l.lender) || !validUser(l.borrower) || l.lender === l.borrower ||
      !integer(l.principal, 1, 500_000) || !integer(l.interest, 0, 150_000) || !integer(l.paid, 0, l.principal + l.interest) ||
      !['offered', 'active', 'paid', 'declined'].includes(l.state) || !integer(l.days, 1, 14) ||
      !timeValue(l.offeredAt) || !timeValue(l.dueAt) || (l.remindedAt !== undefined && !timeValue(l.remindedAt))))
    fail('은행 장부를 읽을 수 없습니다.');
  if (new Set(raw.loans.map((l) => l.id)).size !== raw.loans.length ||
    raw.logs.some((l) => !l || !timeValue(l.id) || l.id > raw.seq || !timeValue(l.at) || !Array.isArray(l.users) || l.users.some((id) => !validUser(id)) || typeof l.text !== 'string' || l.text.length > 500) ||
    Object.entries(raw.protection).some(([id, p]) => !validUser(id) || !p || !timeValue(p.until) || !integer(p.whistles, 0, 3)) ||
    [raw.attempts, raw.targeted].some((map) => Object.entries(map).some(([id, d]) => !validUser(id) || !timeValue(d))) ||
    new Set(raw.casino.map((d) => d.day)).size !== raw.casino.length ||
    raw.casino.some((d) => !d || !timeValue(d.day) || !timeValue(d.earned) || !timeValue(d.paid) || !dictionary(d.net) || !dictionary(d.mercy) ||
      Object.entries(d.net).some(([w, n]) => !w.startsWith('wallet-') || !validUser(w.slice(7)) || !Number.isSafeInteger(n)) ||
      Object.entries(d.mercy).some(([id, n]) => !validUser(id) || !integer(n, 0, 10000))))
    fail('은행 장부를 읽을 수 없습니다.');
  return structuredClone(raw);
}
function log(state: FinanceState, users: string[], at: number, text: string) {
  state.logs = [...state.logs, { id: ++state.seq, users, at, text }].slice(-100);
}
function addLoan(state: FinanceState, loan: Omit<Loan, 'id'>) {
  // Keep all outstanding liabilities; discard only old completed/expired offers.
  state.loans = state.loans.filter((l) => l.state === 'active' || (l.state === 'offered' && l.offeredAt + DAY > loan.offeredAt) || l.offeredAt > loan.offeredAt - 30 * DAY);
  if (state.loans.length >= 200) fail('차용증 보관함이 가득 찼어요. 기존 거래를 먼저 마쳐 주세요.');
  const created = { ...loan, id: `note-${++state.seq}` };
  state.loans.push(created);
  return created;
}
/** Capture new settled blackjack results before hot escrows are compacted away. */
export function recordCasino(state: FinanceState | undefined, before: LoungeLedger, after: LoungeLedger, now: number) {
  const games = Object.entries(after.games).filter(([id, g]) => g.game === 'blackjack' && g.state === 'settled' && before.games[id]?.state !== 'settled');
  if (!games.length) return state;
  const next = readFinance(state), day = kstDay(now);
  let today = next.casino.find((d) => d.day === day);
  if (!today) { today = { day, earned: 0, paid: 0, net: {}, mercy: {} }; next.casino.push(today); }
  for (const [, g] of games) g.wallets.forEach((w, i) => {
    const n = g.result[i];
    if (n < 0) today!.earned -= n;
    else today!.paid += n;
    today!.net[w] = (today!.net[w] ?? 0) + n;
  });
  next.casino = next.casino.filter((d) => d.day >= day - 30);
  return next;
}
export function financeView(state: FinanceState | undefined, ledger: LoungeLedger, life: LifeState, uid: string, now: number) {
  const s = state ?? newFinance(), day = kstDay(now), today = s.casino.find((d) => d.day === day);
  return {
    stored: ledger.vault?.[wallet(uid)] ?? 0,
    loans: s.loans.filter((l) => l.lender === uid || l.borrower === uid).map((l) => ({ ...l,
      lenderActor: l.lender === 'house' ? null : life.actors[l.lender], borrowerActor: life.actors[l.borrower],
      expired: l.state === 'offered' && now >= l.offeredAt + DAY,
    })),
    logs: s.logs.filter((l) => l.users.includes(uid)).slice(-30).reverse(),
    protection: s.protection[uid] ?? { until: 0, whistles: 0 },
    robbedToday: s.attempts[uid] === day,
    casino: { earned: today?.earned ?? 0, paid: today?.paid ?? 0,
      profit: (today?.earned ?? 0) - (today?.paid ?? 0) - Object.values(today?.mercy ?? {}).reduce((a, b) => a + b, 0),
      myNet: today?.net[wallet(uid)] ?? 0, mercyUsed: Object.hasOwn(today?.mercy ?? {}, uid),
      refund: today?.mercy[uid] ?? 0 },
  };
}
export type FinanceView = ReturnType<typeof financeView>;

export function financeAction(
  original: FinanceState | undefined, ledger: LoungeLedger, originalLife: LifeState,
  uid: string, a: FinanceAction, now: number, presence: FinancePresence[], roll = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32,
) {
  const state = readFinance(original), life = cloneLife(originalLife), w = wallet(uid), day = kstDay(now);
  let next = ledger;
  if (!Object.hasOwn(life.actors, uid)) fail('마을에 먼저 들어와 주세요.');
  const me = presence.find((p) => p.id === uid);
  if (!me) fail('마을에 접속한 뒤 거래해 주세요.');
  if (a.op === 'deposit' || a.op === 'withdraw') {
    next = storeBeom(next, w, a.amount, a.op === 'withdraw');
    log(state, [uid], now, `${a.op === 'deposit' ? '은행에 맡김' : '은행에서 찾음'} · ${a.amount.toLocaleString('ko-KR')}범`);
  } else if (a.op === 'offer') {
    const target = uidOf(life, a.to);
    if (!target || target === uid || !Object.hasOwn(ledger.accounts, wallet(target))) fail('차용증을 받을 친구를 확인해 주세요.');
    if (!integer(a.amount, 100, 500_000) || !integer(a.interest, 0, 10) || !integer(a.days, 1, 14)) fail('원금 100~500,000범, 이자 0~10%, 기한 1~14일로 정해 주세요.');
    if (ledger.accounts[w] < a.amount) fail('빌려줄 수 있는 범이 부족해요.');
    if (state.loans.filter((l) => l.lender === uid && (l.state === 'active' || l.state === 'offered' && l.offeredAt + DAY > now)).length >= 7) fail('진행 중인 차용증을 먼저 정리해 주세요.');
    addLoan(state, { lender: uid, borrower: target, principal: a.amount, interest: Math.floor(a.amount * a.interest / 100), days: a.days, offeredAt: now, dueAt: 0, paid: 0, state: 'offered' });
    log(state, [uid, target], now, '새 차용증이 도착했어요. 수락해야 원금이 송금돼요.');
  } else if (a.op === 'accept' || a.op === 'decline' || a.op === 'repay' || a.op === 'remind') {
    const loan = state.loans.find((l) => l.id === a.id);
    if (!loan || (loan.lender !== uid && loan.borrower !== uid)) fail('내 차용증을 선택해 주세요.');
    if (a.op === 'accept' || a.op === 'decline') {
      if (loan.borrower !== uid || loan.state !== 'offered' || now >= loan.offeredAt + DAY) fail('수락할 수 있는 차용증이 아니에요.');
      if (a.op === 'accept') {
        next = transferBeom(next, wallet(loan.lender), w, loan.principal);
        loan.state = 'active'; loan.dueAt = now + loan.days * DAY;
        log(state, [uid, loan.lender], now, `차용증 수락 · 원금 ${loan.principal.toLocaleString('ko-KR')}범 송금 완료`);
      } else { loan.state = 'declined'; log(state, [uid, loan.lender], now, '차용증을 거절했어요. 송금된 범은 없어요.'); }
    } else if (a.op === 'repay') {
      if (loan.borrower !== uid || loan.state !== 'active' || !integer(a.amount, 1, loan.principal + loan.interest - loan.paid)) fail('남은 빚 안에서 상환 금액을 정해 주세요.');
      next = loan.lender === 'house' ? houseTransfer(next, w, -a.amount) : transferBeom(next, w, wallet(loan.lender), a.amount);
      loan.paid += a.amount;
      if (loan.paid === loan.principal + loan.interest) loan.state = 'paid';
      log(state, [uid, loan.lender], now, `${a.amount.toLocaleString('ko-KR')}범 상환${loan.state === 'paid' ? ' · 완납했어요' : ''}`);
    } else {
      if (loan.lender !== uid || loan.state !== 'active' || now < loan.dueAt) fail('만기가 지난 내 차용증만 독촉할 수 있어요.');
      if (loan.remindedAt !== undefined && kstDay(loan.remindedAt) === day) fail('이 차용증은 오늘 이미 독촉했어요.');
      loan.remindedAt = now;
      log(state, [uid, loan.borrower], now, `빚 독촉 쪽지 · 남은 ${(loan.principal + loan.interest - loan.paid).toLocaleString('ko-KR')}범을 상환해 주세요.`);
    }
  } else if (a.op === 'borrow') {
    if (me.area !== 'casino') fail('카지노의 대부 창구에서 계약해 주세요.');
    if (!integer(a.amount, 1000, 30_000)) fail('1,000~30,000범 안에서 빌릴 수 있어요.');
    if (state.loans.some((l) => l.borrower === uid && l.lender === 'house' && l.state === 'active')) fail('기존 카지노 빚을 먼저 갚아 주세요.');
    next = houseTransfer(next, w, a.amount);
    const interest = Math.floor(a.amount * .3);
    addLoan(state, { lender: 'house', borrower: uid, principal: a.amount, interest, days: 3, offeredAt: now, dueAt: now + 3 * DAY, paid: 0, state: 'active' });
    log(state, [uid], now, `카지노 대부 · ${a.amount.toLocaleString('ko-KR')}범 받음 / 3일 뒤 ${(a.amount + interest).toLocaleString('ko-KR')}범 상환 (단리 30%, 추가 연체이자 없음)`);
  } else if (a.op === 'protect') {
    if (a.item !== 'lock' && a.item !== 'whistle') fail('방범 물품을 선택해 주세요.');
    const guard = (state.protection[uid] ??= { until: 0, whistles: 0 });
    if (a.item === 'lock' && guard.until > now) fail('자물쇠가 아직 지켜주고 있어요.');
    if (a.item === 'whistle' && guard.whistles >= 3) fail('호루라기는 세 개까지 보관할 수 있어요.');
    next = spendBeom(next, w, a.item === 'lock' ? 1500 : 800, `guard-${++state.seq}`, now, 'buy-guard');
    if (a.item === 'lock') guard.until = now + DAY;
    else guard.whistles++;
    log(state, [uid], now, a.item === 'lock' ? '방범 자물쇠 구매 · 지금부터 24시간 강도를 막아요.' : '방범 호루라기 구매 · 다음 강도 한 번을 자동으로 막아요.');
  } else if (a.op === 'rob') {
    const target = uidOf(life, a.to), victim = presence.find((p) => p.id === target);
    if (!target || !victim || target === uid) fail('접속 중인 다른 친구를 선택해 주세요.');
    if (me.area !== 'village' || victim.area !== 'village' || me.busy || victim.busy || Math.hypot(me.x - victim.x, me.y - victim.y) > 6) fail('게임이나 낚시를 하지 않는 가까운 마을 친구에게만 시도할 수 있어요.');
    if (state.attempts[uid] === day || state.targeted[target] === day) fail('하루 한 번만 시도할 수 있고, 오늘 대상이 된 친구는 보호돼요.');
    if (!['cash', 'produce', 'furniture'].includes(a.item)) fail('강도 대상을 확인해 주세요.');
    const guard = state.protection[target];
    if (guard && (guard.until > now || guard.whistles > 0)) {
      state.attempts[uid] = day; state.targeted[target] = day;
      const locked = guard.until > now;
      if (!locked) guard.whistles--;
      log(state, [uid, target], now, `${ACTORS[life.actors[target]]}의 ${locked ? '방범 자물쇠' : '호루라기'}가 강도를 막았어요. 물건과 범은 그대로예요.`);
      return { state, ledger: next, life };
    }
    const vw = wallet(target);
    const cash = Math.min(3000, Math.floor((ledger.accounts[vw] ?? 0) * .03));
    const crop = CROPS.find((c) => cropQCount(life, target, c, 0) > 0 && (life.bag[uid]?.produce[c] ?? 0) < 9999);
    const furn = Object.entries(life.ext?.[target]?.furn ?? {}).find(([ref, n]) => n >= 2 && (life.ext?.[uid]?.furn?.[ref] ?? 0) < 9999 && FURNITURE_BY_REF[ref] && !FURNITURE_BY_REF[ref].luxury && !FURNITURE_BY_REF[ref].unsold && FURNITURE_BY_REF[ref].price <= 20_000)?.[0];
    if (!['cash', 'produce', 'furniture'].includes(a.item) || (a.item === 'cash' ? cash < 100 : a.item === 'produce' ? !crop : !furn)) fail('가져갈 수 있는 소지금·일반 수확물·여분 가구가 없어요.');
    state.attempts[uid] = day; state.targeted[target] = day;
    if (roll() < .35) {
      let taken = '';
      if (a.item === 'cash') { next = transferBeom(next, vw, w, cash); taken = `${cash.toLocaleString('ko-KR')}범`; }
      else if (a.item === 'produce' && crop) { addCropQ(life, target, crop, 0, -1); addCropQ(life, uid, crop, 0, 1); taken = `${CROP_INFO[crop].name} 1개`; }
      else if (furn) {
        life.ext![target].furn![furn]--;
        (life.ext![target].furnStrict ??= {})[furn] = true;
        const access = ((life.rooms ??= {})[target] ??= { access: 'friends', rev: 0 });
        access.rev++;
        const x = ((life.ext ??= {})[uid] ??= {}), bag = (x.furn ??= {});
        (x.furnStrict ??= {})[furn] = true;
        const receiverRoom = (life.rooms[uid] ??= { access: 'friends', rev: 0 });
        receiverRoom.rev++;
        bag[furn] = (bag[furn] ?? 0) + 1; taken = `${FURNITURE_BY_REF[furn].name} 1개`;
      }
      log(state, [uid, target], now, `강도 놀이 성공 · ${ACTORS[life.actors[target]]}에게서 ${taken} 가져왔어요.`);
    } else {
      const fine = Math.min(500, ledger.accounts[w]);
      if (fine) next = transferBeom(next, w, vw, fine);
      log(state, [uid, target], now, `강도 놀이 발각 · ${fine.toLocaleString('ko-KR')}범을 상대에게 줬어요.`);
    }
  } else if (a.op === 'mercy') {
    if (me.area !== 'casino') fail('카지노에서 루미에게 부탁해 주세요.');
    const today = state.casino.find((d) => d.day === day), loss = -(today?.net[w] ?? 0);
    if (!today || loss <= 0) fail('오늘 루미와 한 블랙잭에서 순손실이 있을 때 부탁할 수 있어요.');
    if (Object.hasOwn(today.mercy, uid)) fail('오늘은 이미 부탁했어요.');
    const amount = roll() < .3 ? Math.min(10_000, Math.floor(loss * .2)) : 0;
    today.mercy[uid] = amount;
    if (amount) next = houseTransfer(next, w, amount);
    log(state, [uid], now, amount ? `루미가 ${amount.toLocaleString('ko-KR')}범을 돌려줬어요. 오늘 순손실의 일부예요.` : '루미: 오늘은 어렵겠어요. 다음에는 좋은 패가 오길 바랄게요.');
  } else fail('은행 요청을 확인해 주세요.');
  validateLedger(next);
  return { state, ledger: next, life };
}
