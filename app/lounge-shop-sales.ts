// 가게 매출 집계 (design-npcs-stage3.md §2-7): a village-wide daily tally of
// what the stage-3 shops took in and paid out, kept for the stock exchange
// (claude/stock-exchange: 1~3단계 가게가 종목). Each shop's money also moves
// through the ledger under its own reasons ('ranch-animal', 'orchard-sapling',
// 'smith-…', 'clinic', 'fortune', 'smith-ore', 'sell-…'), the way the stage-1/2
// shops are tallied; this table just keeps it per shop per KST day in one place.
//
//   life.shopSales[shop][day] = { rev, buy }
//     rev  범 friends paid the shop (animals, hay, saplings, upgrades, care, fortunes)
//     buy  범 the shop paid friends (goods, fruit, ores bought at its counter, premiums included)
//
// Pure helpers; the engines call recordShopSale after a successful trade.
import { kstDay } from './lounge-economy.ts';

export const STOCK_SHOPS = ['barn', 'orchardShop', 'smithy', 'clinic', 'fortune'] as const;
export type StockShop = (typeof STOCK_SHOPS)[number];
export const isStockShop = (s: unknown): s is StockShop => typeof s === 'string' && (STOCK_SHOPS as readonly string[]).includes(s);
/** Days of history kept per shop. */
export const SHOP_SALES_DAYS = 30;
export type ShopSalesDay = { rev: number; buy: number };
export type ShopSales = Partial<Record<StockShop, Record<string, ShopSalesDay>>>;

/** Adds a trade to today's row of `shop` (amounts are whole 범, ≥ 0). */
export function recordShopSale(life: { shopSales?: ShopSales }, shop: StockShop, amounts: { rev?: number; buy?: number }, now: number) {
  const rev = Math.max(0, Math.round(amounts.rev ?? 0)),
    buy = Math.max(0, Math.round(amounts.buy ?? 0));
  if (!rev && !buy) return;
  const all = (life.shopSales ??= {});
  const rows = (all[shop] ??= {});
  const day = String(kstDay(now));
  const row = (rows[day] ??= { rev: 0, buy: 0 });
  row.rev += rev;
  row.buy += buy;
  const days = Object.keys(rows).sort((a, b) => Number(a) - Number(b));
  for (const d of days.slice(0, Math.max(0, days.length - SHOP_SALES_DAYS))) delete rows[d];
}
/** Normalizes a saved table (unknown shops and malformed rows drop). */
export function readShopSales(v: unknown): ShopSales | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: ShopSales = {};
  const ok = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
  for (const shop of STOCK_SHOPS) {
    const rows = (v as Record<string, unknown>)[shop];
    if (!rows || typeof rows !== 'object' || Array.isArray(rows)) continue;
    const kept: Record<string, ShopSalesDay> = {};
    const days = Object.keys(rows)
      .filter((d) => /^\d{1,7}$/.test(d))
      .sort((a, b) => Number(a) - Number(b))
      .slice(-SHOP_SALES_DAYS);
    for (const d of days) {
      const r = (rows as Record<string, unknown>)[d] as { rev?: unknown; buy?: unknown } | null;
      if (!r || typeof r !== 'object') continue;
      const rev = ok(r.rev) ? r.rev : 0,
        buy = ok(r.buy) ? r.buy : 0;
      if (rev || buy) kept[d] = { rev, buy };
    }
    if (Object.keys(kept).length) out[shop] = kept;
  }
  return Object.keys(out).length ? out : undefined;
}
/** A shop's totals over the last `days` KST days (the stock exchange's input). */
export function shopSalesSince(sales: ShopSales | undefined, shop: StockShop, now: number, days = 7): ShopSalesDay {
  const from = kstDay(now) - days + 1;
  const out = { rev: 0, buy: 0 };
  for (const [d, r] of Object.entries(sales?.[shop] ?? {}))
    if (Number(d) >= from) {
      out.rev += r.rev;
      out.buy += r.buy;
    }
  return out;
}
