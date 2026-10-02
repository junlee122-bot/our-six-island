'use client';
// 가게 나누기 · 음식 시스템 (handover/design/design-food-and-shops.md): the
// pieces every shop counter shares — what this shop buys from my bag at full
// price, what it sells, the 빵집 / 주점 menus (eaten on the spot), the two
// buff slots and the 맛 도감 — plus the 가게 안내 card that replaced the old
// single 범타듀 상점 window. Every price is the server's (lounge-shops.ts
// shopOffer / sellQuote); the server checks I really stand at the counter.
import { SMITH_ORES, type SmithOre } from '../lounge-stage3-data';
import { useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { CROPS, CROP_INFO, FRUIT_SELL, SHOP_BY_ID, shopLock, type Crop, type LifeAction, type LifeView } from '../lounge-life';
import { BUFF_INFO, DISH_BY_ID, ITEM_BY_ID } from '../lounge-items';
import { itemName, sellQuote, ROD_PRICE } from '../lounge-life-plus';
import { SELL_AWAY, SHOP_INFO, buyerOf, shopOffer, type ShopId } from '../lounge-shops';
import { stockName, stockUnit } from '../lounge-farm';
import {
  LUNCHES,
  SHOP_FOODS,
  SHOP_FOOD_PER_DAY,
  TASTE_IDS,
  TASTE_REWARD,
  TASTE_STEP,
  foodPreview,
  tasteName,
  type BuffSlot,
} from '../lounge-food-data';
import { formatBeom, josa } from '../lounge-text';
import { GameButton } from '../ui/GameButton';
import { EmptyState } from '../ui/EmptyState';
import { Glyph } from '../ui/Glyph';
import { ItemIcon } from './ItemIcon';
import { Modal } from './Modal';
import { useLifeAction } from './LifePanels';
import { useNow } from './use-now';
import type { Notify } from './Toast';
import './town.css';

type Base = { room: CloudRoom; view: CloudRoomView; notify: Notify };
const pct = Math.round(SELL_AWAY * 100);
const actorOf = (view: CloudRoomView) => view.life?.actors?.[view.self] ?? view.players.find((p) => p.id === view.self)?.actor ?? 0;
/** "1시간 20분" / "35분" left until `until`. */
export function leftText(until: number, now: number) {
  const m = Math.max(1, Math.ceil((until - now) / 60_000));
  return m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}` : `${m}분`;
}

/* ------------------------------------------------------------ selling */

type SellRow = { key: string; id: string; name: string; have: number; q?: 0 | 1 | 2 | 3; goods?: boolean };
/** What of mine `shop` buys at full price (crops, fruit, bag items, farm goods). */
function sellRows(life: LifeView, shop: ShopId): SellRow[] {
  const fish = life.shops?.fishShop ?? 'general';
  const rows: SellRow[] = [];
  for (const c of CROPS) {
    const n = life.me.bag.produce[c];
    if (n > 0 && buyerOf(c, fish) === shop) rows.push({ key: c, id: c, name: CROP_INFO[c].name, have: n });
  }
  if (life.me.bag.fruit > 0 && shop === 'coop') rows.push({ key: 'fruit', id: 'fruit', name: '과일', have: life.me.bag.fruit });
  for (const [id, n] of Object.entries(life.me.inv ?? {})) {
    const buyer = buyerOf(id, fish);
    // 오른's 대장간 buys ores like the village forge (with today's-ore premium, lounge-stage3.ts).
    if (n > 0 && (buyer === shop || (shop === 'smithy' && buyer === 'forge'))) rows.push({ key: id, id, name: itemName(id), have: n });
  }
  if (shop === 'coop')
    for (const g of life.farmx?.goods ?? []) rows.push({ key: `${g.id}@${g.q}`, id: g.id, name: stockName(g.id), have: g.n, q: g.q, goods: true });
  return rows;
}

/** 이 가게에 팔기: my goods this shop buys at 100% (the bag pays 85%). */
export function ShopSell({ room, view, notify, at, coopWeek = [] }: Base & { at: ShopId; coopWeek?: readonly Crop[] }) {
  const life = view.life;
  const [run, busy] = useLifeAction(room, notify);
  const now = useNow(true, 60_000) + view.clockOffset;
  if (!life) return null;
  const rows = sellRows(life, at);
  const cap = life.sellCapLeft;
  const week = new Set<string>(coopWeek);
  const total = (r: SellRow, n: number) =>
    r.goods ? Math.round(stockUnit(r.id, r.q ?? 0, now, life.flags ?? []) * n) : sellQuote(life, r.id, 0, n, now, 1).total;
  const act = (r: SellRow, n: number): LifeAction =>
    r.goods
      ? { kind: 'sellGoods', item: r.id, q: r.q, n, at }
      : r.id === 'fruit' || (CROPS as string[]).includes(r.id)
        ? week.has(r.id)
          ? { kind: 'coopSell', crop: r.id as Crop, n }
          : { kind: 'sell', crop: r.id as Crop | 'fruit', n, at }
        : at === 'smithy' && (SMITH_ORES as readonly string[]).includes(r.id)
          ? { kind: 'oreSell', item: r.id as SmithOre, n }
          : { kind: 'sellItem', item: r.id, n, at };
  if (!rows.length)
    return <EmptyState glyph="bag" title={`${SHOP_INFO[at].name}에 팔 물건이 없어요`} hint={`여기서는 ${SHOP_INFO[at].buys}을(를) 제값에 사요.`} />;
  return (
    <>
      <p className="l-town-sub" data-testid="shop-sell-note">
        여기서는 제값(100%)을 받아요. 가방이나 출하 상자에서 팔면 {pct}%예요. 오늘 더 팔 수 있어요 {formatBeom(cap)}
        {life.me.haggleLeft ? ` · 흥정 +5% (남은 ${formatBeom(life.me.haggleLeft)})` : ''}
      </p>
      <ul className="l-town-list">
        {rows.map((r) => {
          let most = Math.min(r.have, 999);
          while (most > 1 && total(r, most) > cap) most--;
          const one = total(r, 1);
          return (
            <li key={r.key} className="l-town-row" data-testid={`shop-sell-${r.key}`}>
              <ItemIcon id={r.id} size={36} quality={r.q || undefined} />
              <div>
                <strong>
                  {r.name} <small>가진 개수 {r.have}</small>
                </strong>
                <small>
                  지금 {formatBeom(one)}
                  {week.has(r.id) ? ' · 시세표 작물 웃돈' : ''}
                </small>
              </div>
              <span className="l-town-buttons">
                <GameButton size="s" disabled={busy || one > cap} onClick={() => void run(act(r, 1), `${r.name} 1개를 팔았어요.`, 'coin')}>
                  1개
                </GameButton>
                {most > 1 && (
                  <GameButton size="s" variant="primary" disabled={busy} onClick={() => void run(act(r, most), `${r.name} ${most}개를 팔았어요.`, 'coin')}>
                    {most < r.have ? `${most}개` : '모두'}
                  </GameButton>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ------------------------------------------------------------ buying */

/** 이 가게에서 사기: `items` this shop sells now (server prices). */
export function ShopBuy({ room, view, notify, at, items, title, hint }: Base & { at: ShopId; items: readonly string[]; title?: string; hint?: string }) {
  const life = view.life;
  const [run, busy] = useLifeAction(room, notify);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const now = useNow(true, 60_000) + view.clockOffset;
  if (!life) return null;
  const actor = actorOf(view);
  const balance = view.wallet.balance;
  const owned = new Set(life.me.unlocks ?? []);
  const rows = items.flatMap((id) => {
    const offer = shopOffer(life, actor, at, id, now);
    return offer ? [{ id, offer }] : [];
  });
  if (!rows.length) return null;
  return (
    <section aria-label={title ?? '사기'}>
      {title && <h3 className="l-town-head">{title}</h3>}
      {hint && <p className="l-town-sub">{hint}</p>}
      <ul className="l-town-list">
        {rows.map(({ id, offer }) => {
          const unlock = SHOP_BY_ID[id];
          const rod = id === 'rod';
          const rodNow = life.me.fishing?.rod ?? 1;
          const rodTo = rodNow < 3 ? ((rodNow + 1) as 2 | 3) : null;
          const price = rod ? (rodTo ? ROD_PRICE[rodTo] : 0) : offer.price;
          const single = offer.max <= 1 || (!!unlock && unlock.kind !== 'seed' && unlock.kind !== 'bundle');
          const n = single ? 1 : Math.min(offer.max, counts[id] ?? 1);
          const have = unlock ? owned.has(id) && single : false;
          const bought = offer.once && life.shops?.peddler.bought.includes(id);
          const lock = unlock && !have ? shopLock(unlock, life.me.unlocks ?? [], life.me.harvested ?? {}, life.flags ?? []) : null;
          const name = rod ? (rodTo ? `${rodTo}단계 낚싯대` : '낚싯대') : unlock ? unlock.name : itemName(id);
          const note = rod
            ? rodTo
              ? `지금 ${rodNow}단계 · 입질 판정 ${rodTo === 2 ? '1.25' : '1.5'}배${rodTo === 3 ? ' · 희귀 물고기 1.5배' : ''}`
              : '가장 좋은 낚싯대예요.'
            : unlock
              ? unlock.description
              : (DISH_BY_ID[id] ? `식사 칸 · ${BUFF_INFO[DISH_BY_ID[id].buff!].name}: ${BUFF_INFO[DISH_BY_ID[id].buff!].text} · 어디서나 먹어요` : ITEM_BY_ID[id]?.note) ?? '';
          const action: LifeAction = rod ? { kind: 'upgradeRod', at } : unlock ? { kind: 'buy', item: id, ...(single ? {} : { n }), at } : { kind: 'buyItem', item: id, n, at };
          const done = have || bought || (rod && !rodTo);
          return (
            <li key={id} className="l-town-row" data-testid={`shop-buy-${id}`}>
              <ItemIcon id={rod ? 'rod' : id} size={36} />
              <div>
                <strong>
                  {name} {offer.note && <em className="l-shop-tag">{offer.note}</em>}
                </strong>
                <small>
                  {note}
                  {!rod && !unlock ? ` · 가진 개수 ${life.me.inv?.[id] ?? 0}` : ''}
                </small>
                {!done && <small>{formatBeom(price)}{single ? '' : ` × ${n} = ${formatBeom(price * n)}`}</small>}
              </div>
              <span className="l-town-buttons">
                {!single && !done && (
                  <>
                    <GameButton size="s" variant="ghost" aria-label={`${name} 하나 빼기`} disabled={n <= 1} onClick={() => setCounts((c) => ({ ...c, [id]: Math.max(1, n - 1) }))}>
                      −
                    </GameButton>
                    <GameButton size="s" variant="ghost" aria-label={`${name} 하나 더`} disabled={n >= offer.max} onClick={() => setCounts((c) => ({ ...c, [id]: Math.min(offer.max, n + 1) }))}>
                      +
                    </GameButton>
                  </>
                )}
                {done ? (
                  <small>{bought ? '이번 주에 샀어요' : '가지고 있어요'}</small>
                ) : (
                  <GameButton
                    size="s"
                    variant="primary"
                    disabled={busy || !!lock || price * n > balance}
                    title={lock ?? (price * n > balance ? '범이 모자라요' : undefined)}
                    onClick={() =>
                      void run(action, `${josa(name, '을/를')} 샀어요.`, 'coin').then((ok) => ok && setCounts((c) => ({ ...c, [id]: 1 })))
                    }
                  >
                    {lock ? '잠김' : '사기'}
                  </GameButton>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ food */

/** One line of what a food switches on ("간식 칸 · 배움 1시간: …"). */
export function FoodBuffLine({ id }: { id: string }) {
  const p = foodPreview(id);
  if (!p?.kind) return null;
  return (
    <small className="l-food-buff" data-slot={p.slot}>
      <Glyph name={p.slot === 'meal' ? 'pot' : 'apple'} size={14} /> {p.slot === 'meal' ? '식사 칸' : '간식 칸'} · {p.name}
      {p.hours ? ` ${p.hours}시간` : ''}: {p.text}
    </small>
  );
}

/** 빵집 / 주점 menu: bought and eaten on the spot (the 간식 칸). */
export function FoodMenu({ room, view, notify, shop }: Base & { shop: 'bakery' | 'tavern' }) {
  const life = view.life;
  const [run, busy] = useLifeAction(room, notify);
  if (!life?.town) return null;
  const left = shop === 'tavern' ? (life.town.tavern?.left ?? SHOP_FOOD_PER_DAY) : life.town.bakery.left;
  const tasted = new Set(life.me.taste?.ids ?? []);
  return (
    <section aria-label="오늘의 메뉴">
      <p className="l-town-sub">
        오늘 {left}번 더 먹을 수 있어요 (하루 {SHOP_FOOD_PER_DAY}번). 여기서 먹으면 간식 칸에 짧은 버프가 켜지고, 친구와 5분 안에 같이 먹으면 함께 먹기가 돼요.
      </p>
      <ul className="l-town-list">
        {SHOP_FOODS.filter((f) => f.shop === shop).map((f) => (
          <li key={f.id} className="l-town-row" data-testid={`food-${f.id}`}>
            <ItemIcon id={f.id} size={36} />
            <div>
              <strong>
                {f.name} {!tasted.has(f.id) && <em className="l-shop-tag">처음 맛보기</em>}
              </strong>
              <small>
                {f.note} · {formatBeom(f.price)}
              </small>
              <FoodBuffLine id={f.id} />
            </div>
            <GameButton
              size="s"
              variant="primary"
              disabled={busy || !left || view.wallet.balance < f.price}
              onClick={() => void run({ kind: 'shopFood', shop, item: f.id }, `${josa(f.name, '을/를')} 먹었어요.`, 'coin')}
            >
              먹기
            </GameButton>
          </li>
        ))}
      </ul>
    </section>
  );
}
/** The 빵집's lunchboxes (to the bag; a 식사 칸 meal eaten anywhere). */
export function LunchShelf(props: Base) {
  return (
    <ShopBuy
      {...props}
      at="bakery"
      items={LUNCHES}
      title="도시락 (가방에 넣어 가요)"
      hint="밖에서 먹는 집밥이에요. 광산이나 낚시터에서 먹으면 식사 칸 버프가 자정까지 켜져요. 집에서 직접 만들면 재료값만 들어요."
    />
  );
}

/* ------------------------------------------------------------ buff slots */

type SlotShown = { slot: BuffSlot; name: string; text: string; until: number; food: string };
export function slotsOf(life: LifeView | null | undefined, now: number): SlotShown[] {
  const out: SlotShown[] = [];
  const b = life?.me.buff;
  if (b && b.until > now) out.push({ slot: 'meal', name: b.name, text: b.text, until: b.until, food: b.dish });
  const s = life?.me.snack;
  if (s && s.until > now) out.push({ slot: 'snack', name: s.name, text: s.text, until: s.until, food: s.food });
  return out;
}
/** HUD: the 식사 칸 and 간식 칸 with what is on and how long it lasts. */
export function BuffSlots({ life, now }: { life: LifeView | null | undefined; now: number }) {
  const on = slotsOf(life, now);
  if (!on.length) return null;
  return (
    <span className="l-buff-slots" data-testid="hud-buff">
      {(['meal', 'snack'] as const).map((slot) => {
        const b = on.find((x) => x.slot === slot);
        return (
          <span key={slot} className="l-buff-slot" data-slot={slot} data-on={b ? true : undefined} title={b ? `${b.name} · ${b.text}` : `${slot === 'meal' ? '식사' : '간식'} 칸이 비어 있어요`}>
            <Glyph name={slot === 'meal' ? 'pot' : 'apple'} size={14} />
            {b ? (
              <>
                {b.name} <small>{leftText(b.until, now)}</small>
              </>
            ) : (
              <small>{slot === 'meal' ? '식사' : '간식'} 비어 있음</small>
            )}
          </span>
        );
      })}
    </span>
  );
}

/* ------------------------------------------------------------ 맛 도감 */

export function TasteDex({ life }: { life: LifeView }) {
  const ids = new Set(life.me.taste?.ids ?? []);
  const n = ids.size;
  const next = (Math.floor(n / TASTE_STEP) + 1) * TASTE_STEP;
  return (
    <section className="l-taste" aria-label="맛 도감" data-testid="taste-dex">
      <p className="l-town-sub">
        처음 먹어 본 음식마다 칸이 채워져요. {TASTE_STEP}가지마다 {formatBeom(TASTE_REWARD)}을 드려요. 지금 {n}/{TASTE_IDS.length}가지
        {n < TASTE_IDS.length ? ` · 다음 선물까지 ${next - n}가지` : ' · 다 맛봤어요!'}
      </p>
      <ul className="l-taste-grid">
        {TASTE_IDS.map((id) => {
          const seen = ids.has(id);
          return (
            <li key={id} data-seen={seen || undefined} title={seen ? tasteName(id) : '아직 못 먹어 봤어요'}>
              <ItemIcon id={id} size={32} />
              <small>{seen ? tasteName(id) : '？'}</small>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ 가게 안내 */

const AREA_NAME: Record<string, string> = { market: '시장 거리', harbor: '항구 구역', tavern: '허풍 주점', village: '마을 중심' };
/**
 * 가게 안내: replaced the single 범타듀 상점 window (2026-10). Where each shop
 * is, what it sells and buys, and the 85% rule.
 */
export function ShopsGuide({ view, onClose, onTravel }: { view: CloudRoomView; onClose: () => void; onTravel?: (area: 'market' | 'harbor') => void }) {
  const life = view.life;
  const shops = life?.shops;
  return (
    <Modal title="가게 안내" onClose={onClose} className="l-town l-shops-guide" wide>
      <section className="l-town-notice" aria-label="가게 이용 규칙">
        <strong>물건은 가게마다 따로 팔아요</strong>
        <p>
          씨앗·비료는 등불 잡화점, 낚시 도구는 어시장, 도시락은 빵집에서 사요. 팔 때는 그 물건을 사는 가게 창구에서 팔면 제값, 가방이나 출하 상자에서 팔면 {pct}%예요. 가게 창구는 주인이 자리를 비워도 열려 있어요.
        </p>
      </section>
      <ul className="l-town-list" data-testid="shops-guide">
        {(Object.keys(SHOP_INFO) as ShopId[]).map((id) => {
          const s = SHOP_INFO[id];
          const where =
            id === 'peddler'
              ? '일요일 시장 거리 · 수요일·토요일 항구'
              : id === 'fishmarket' && shops?.fishShop === 'general'
                ? '항구 구역 (항구가 열리기 전에는 잡화점이 대신 맡아요)'
                : AREA_NAME[s.area];
          return (
            <li key={id} className="l-town-row" data-testid={`guide-${id}`}>
              <span className="l-town-art" aria-hidden="true">
                <Glyph name={id === 'tavern' ? 'wine' : id === 'fishmarket' ? 'fish' : id === 'bakery' ? 'chef' : id === 'forge' ? 'anvil' : id === 'coop' ? 'wheat' : 'store'} size={24} />
              </span>
              <div>
                <strong>
                  {s.name} <small>{s.keeper} · {where}</small>
                </strong>
                <small>파는 것: {s.sells}</small>
                {s.buys && <small>제값에 사는 것: {s.buys}</small>}
              </div>
              {onTravel && (s.area === 'market' || s.area === 'harbor') && id !== 'peddler' && (
                <GameButton size="s" onClick={() => onTravel(s.area as 'market' | 'harbor')}>
                  가기
                </GameButton>
              )}
            </li>
          );
        })}
      </ul>
      {shops && (
        <p className="l-town-sub" data-testid="guide-week">
          이번 주 잡화점 특가: {itemName(shops.special.item)} {formatBeom(shops.special.price)} · 토요일 밤 등불 상점:{' '}
          {shops.lantern.seeds.map((c) => CROP_INFO[c]?.name ?? c).join(' · ')} 씨앗 할인 · 행상인 희귀품: {shops.peddler.stock.map((p) => itemName(p.item)).join(' · ')}
        </p>
      )}
      <p className="l-town-sub">과일 한 개는 농협에서 {formatBeom(FRUIT_SELL)}, 가방에서 {formatBeom(Math.round(FRUIT_SELL * SELL_AWAY))}이에요.</p>
    </Modal>
  );
}
