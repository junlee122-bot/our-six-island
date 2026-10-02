/** Rosé's independent casino desk. All positions use the shared network floor. */
export const LENDER_NAME = '로제';
export const CASINO_LENDER_SPOT = { x: 50, y: 45 } as const;
export const CASINO_LENDER_FRONT = { x: 50, y: 51 } as const;
export const CASINO_LENDER_REACH = 7.5;
export const CASINO_LENDER_RADIUS = 1.6;

/** The server and both renderers use the same place and distance check. */
export function nearCasinoLender(point: { x: number; y: number }, area: string): boolean {
  return area === 'casino' && Number.isFinite(point.x) && Number.isFinite(point.y)
    && point.x >= 15 && point.x <= 85 && point.y >= 42 && point.y <= 88
    && Math.hypot(point.x - CASINO_LENDER_SPOT.x, point.y - CASINO_LENDER_SPOT.y) <= CASINO_LENDER_REACH;
}

// ---------------------------------------------------------------- credit tiers
// 로제's limit grows with the borrower's record over the last 30 days (the
// window the finance book keeps settled notes for). Only notes of at least
// CASINO_CREDIT_MIN_PRINCIPAL repaid before their due time count, so tiers
// cannot be farmed with tiny loans; any late note in the window (collected
// after the due time, or still unpaid past it) drops the limit to the old
// 30,000범 until it ages out. Interest stays one flat 30% at every tier.
export const CASINO_LOAN_MIN = 1000;
export const CASINO_LOAN_RATE = 0.3;
export const CASINO_CREDIT_WINDOW_MS = 30 * 86_400_000;
export const CASINO_CREDIT_MIN_PRINCIPAL = 10_000;
export type CasinoCreditTier = { id: 'late' | 'new' | 'regular' | 'trusted' | 'vip'; name: string; repaid: number; max: number; days: number };
/** In order; `repaid` is the on-time count that unlocks the tier ('late' is the penalty step). */
export const CASINO_CREDIT_TIERS: readonly CasinoCreditTier[] = [
  { id: 'late', name: '연체 기록', repaid: 0, max: 30_000, days: 3 },
  { id: 'new', name: '새 손님', repaid: 0, max: 60_000, days: 3 },
  { id: 'regular', name: '단골', repaid: 2, max: 80_000, days: 4 },
  { id: 'trusted', name: '믿을 손님', repaid: 4, max: 100_000, days: 5 },
  { id: 'vip', name: '로제의 VIP', repaid: 6, max: 120_000, days: 5 },
];
type CreditNote = { lender: string; borrower: string; principal: number; offeredAt: number; dueAt: number; state: string; late?: boolean };
/** The borrower's tier now, the on-time count behind it and the next step (null at the top or while late). */
export function casinoCreditOf(loans: readonly CreditNote[], uid: string, now: number) {
  const mine = loans.filter((l) => l.lender === 'house' && l.borrower === uid && l.offeredAt > now - CASINO_CREDIT_WINDOW_MS);
  const late = mine.some((l) => l.late || (l.state === 'active' && now >= l.dueAt));
  const repaid = mine.filter((l) => l.state === 'paid' && !l.late && l.principal >= CASINO_CREDIT_MIN_PRINCIPAL).length;
  const ladder = CASINO_CREDIT_TIERS.slice(1);
  const tier = late ? CASINO_CREDIT_TIERS[0] : [...ladder].reverse().find((t) => repaid >= t.repaid)!;
  const next = late ? null : (ladder.find((t) => t.repaid > repaid) ?? null);
  return { tier, repaid, late, next };
}
