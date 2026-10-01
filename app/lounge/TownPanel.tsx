'use client';
// 마을 확장 2단계: the counters of the districts (E at the door) — 농협 (나세라's
// weekly prices and crop buying), 빵집 카페 (drinks and breads that fill mood
// needs), 신문사 (yesterday's news and 잔나's forecast), 파출소 (볼리바스's robbery
// board), 항구 어시장 (fish buying and the dawn auction), 낚시조합 (the weekly
// cup), 언덕 도서관 (the reading club), 장날 좌판 and the 친구에게 가기 signpost.
// 가게 나누기 (2026-10): every shop sells its own goods here and buys its own
// kind of goods at full price (ShopGoods.tsx); 허풍 주점's bar is a counter
// too. 우체국 opens the mail window (lounge-game.tsx). Every trade is a server
// action (lounge-town.ts, lounge-life.ts, lounge-shops.ts); this only shows
// numbers from the view and sends the choice.
import { useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { CROP_INFO, type Crop, type LifeAction } from '../lounge-life';
import { ITEM_BY_ID, ITEM_PRICES } from '../lounge-items';
import { SHOP, type ShopItem } from '../lounge-life';
import { PEDDLER_POOL, SPICES_IDS, type ShopId } from '../lounge-shops';
import { FoodMenu, LunchShelf, ShopBuy, ShopSell } from './ShopGoods';
import { Tabs, tabPanelProps } from '../ui/Tabs';
import { DealerAvatar } from '../lounge-dealer-host';
import { HOSTS } from '../lounge-dealer-lines';
import { itemName } from '../lounge-life-plus';
import { NPCS, type NpcId } from '../lounge-npc-data';
import { jannaForecast, jannaMissedToday } from '../lounge-npc-dialog';
import { AUCTION_PREMIUM, COOP_WEEK_BONUS, READING_XP, STALL_PER_DAY, type StallId } from '../lounge-town';
import { SKILLS, SKILL_INFO } from '../lounge-growth-data';
import { FIXTURES } from '../lounge-farm-data';
import { ACTORS } from '../lounge-roster';
import { kstDay } from '../lounge-economy';
import { formatBeom, josa } from '../lounge-text';
import { DISTRICTS, type DistrictId } from '../lounge-districts';
import { GameButton } from '../ui/GameButton';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from './Modal';
import { ItemIcon } from './ItemIcon';
import { NpcPortrait } from './NpcPortrait';
import { useLifeAction } from './LifePanels';
import { useNow } from './use-now';
import type { Notify } from './Toast';
import './town.css';

export type TownPlace = 'coop' | 'general' | 'bakery' | 'newspaper' | 'police' | 'fishmarket' | 'guild' | 'library' | 'stalls' | 'harborStall' | 'tavern' | 'signpost';
/** Everything a counter may sell; ShopBuy shows only what that shop has now (lounge-shops.ts shopOffer). */
const SEEDS = SHOP.filter((i: ShopItem) => i.kind === 'seed' || i.kind === 'bundle').map((i) => i.id);
const UNLOCKS = SHOP.filter((i: ShopItem) => i.kind === 'trophy' || i.kind === 'palette').map((i) => i.id);
const SOIL = ['fertilizer', 'fertilizer-deluxe', 'speed-gro', 'retaining'];
const TACKLE = [...Object.keys(ITEM_PRICES).filter((id) => !SOIL.includes(id)), 'rod'];
const PEDDLER_ITEMS = [...SPICES_IDS, ...PEDDLER_POOL.map((p) => p.item)];
type Page = 'buy' | 'sell' | 'more';
/** Where a friend can be found by the signpost (areas with a gate to walk to). */
export type TravelArea = 'village' | DistrictId;

const KEEPER: Record<Exclude<TownPlace, 'signpost' | 'tavern'>, { npc: NpcId; title: string; line: string }> = {
  coop: { npc: 'nasera', title: '범마을 농협', line: '이번 주 시세표에 오른 작물은 웃돈을 드립니다. 규칙대로요.' },
  general: { npc: 'thresh', title: '등불 잡화점', line: '후후, 씨앗도 도구도 다 있어요. 밭 설비 도면도요.' },
  bakery: { npc: 'frieren', title: '느긋한 빵집 카페', line: '오늘 빵은 다 구웠어. 아마. 하나 골라.' },
  newspaper: { npc: 'janna', title: '범마을 신문사', line: '속보입니다! 어제 마을 소식, 여기 다 모았어요.' },
  police: { npc: 'volibas', title: '범마을 파출소', line: '이 마을의 평화는 이 볼리바스가 지킨다! 신고는 여기다.' },
  fishmarket: { npc: 'lux', title: '범마을 어시장', line: '물고기 사요! 새벽 여섯 시엔 경매가 열려요!' },
  guild: { npc: 'lux', title: '낚시조합', line: '이번 주 대회 순위예요! 상품은 여기서 드려요!' },
  library: { npc: 'beatrice', title: '언덕 도서관', line: '조용히 하는 거야. 독서 모임은 수요일 저녁인 거야.' },
  stalls: { npc: 'makima', title: '장날 좌판', line: '오늘의 물건이에요. 마음에 들면 계약해요.' },
  harborStall: { npc: 'makima', title: '마키마의 항구 좌판', line: '바다 냄새가 나네요. 오늘은 여기서 계약해요.' },
};
const STALL_NAME: Record<StallId, string> = {
  'stall-w': '서쪽 좌판',
  'stall-e': '동쪽 좌판',
  'stall-sw': '마키마의 계약 좌판',
  'stall-se': '남쪽 좌판',
  'stall-harbor': '마키마의 항구 좌판',
};
const AREA_WORD: Record<string, string> = {
  village: '마을 중심',
  market: '시장 거리',
  harbor: '항구 구역',
  hillside: '언덕 주택가',
  hill: '뒷산',
  woods: '숲 깊은 곳',
  mine: '광산',
  casino: '별빛 카지노',
  lounge: '범마을 회관',
  tavern: '허풍 주점',
  bank: '냐모 은행',
  salon: '보송 미용실',
  wardrobe: '분장실',
  home: '누군가의 방',
};
const hhmm = (t: number) => new Date(t + 9 * 3_600_000).toISOString().slice(11, 16);
const dayWord = (t: number, now: number) => {
  const d = kstDay(t) - kstDay(now);
  return d === 0 ? '오늘' : d === 1 ? '내일' : `${d}일 뒤`;
};

type Props = {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  place: TownPlace;
  onClose: () => void;
  /** 친구에게 가기: walk in at this area's gate. */
  onTravel?: (area: TravelArea) => void;
  /** 잡화점: the farm window (building fixtures); 허풍 주점: the shop upgrade board. */
  onOpen?: (what: 'farm' | 'tavernUp') => void;
};

export function TownPanel({ room, view, notify, place, onClose, onTravel, onOpen }: Props) {
  const life = view.life;
  const town = life?.town;
  const [run, busy] = useLifeAction(room, notify);
  const now = useNow(true, 30_000) + view.clockOffset;
  const me = view.players.find((p) => p.id === view.self);
  const keeper = place === 'signpost' || place === 'tavern' ? null : KEEPER[place];
  const title = place === 'signpost' ? '친구에게 가기' : place === 'tavern' ? '허풍 주점 · 허 선장' : keeper!.title;
  const act = (a: LifeAction, done: string) => void run(a, done, 'coin');
  const [page, setPage] = useState<Page>('buy');
  const base = { room, view, notify };
  /** 사기 / 팔기 (/ extra) tabs of a shop counter. */
  const tabs = (id: string, pages: { id: Page; label: string }[], body: Record<string, () => React.ReactNode>) => (
    <>
      <Tabs<Page> className="l-shop-tabs" label="가게" idBase={`shop-${id}`} value={pages.some((p) => p.id === page) ? page : pages[0].id} onChange={setPage} items={pages.map((p) => ({ id: p.id, label: p.label }))} />
      <div {...tabPanelProps(`shop-${id}`, pages.some((p) => p.id === page) ? page : pages[0].id)}>{body[pages.some((p) => p.id === page) ? page : pages[0].id]()}</div>
    </>
  );
  const fishShop: ShopId = life?.shops?.fishShop ?? 'general';

  const body = (() => {
    if (!life || !town) return <EmptyState glyph="store" title="마을에 접속한 뒤 이용할 수 있어요" />;
    switch (place) {
      case 'coop': {
        return (
          <>
            <section className="l-town-notice" aria-label="나세라의 주간 시세">
              <strong>이번 주 시세표</strong>
              <p>
                {town.coop.crops.map((c) => CROP_INFO[c]?.name ?? c).join(' · ')} — 팔면 {Math.round(COOP_WEEK_BONUS * 100)}% 웃돈 · 오늘 남은 웃돈 {formatBeom(town.coop.bonusLeft)}
                {life.shops?.coopSeeds.open ? ' · 오늘은 일요 작물 좌판: 시세표 작물 씨앗 10% 할인' : ''}
              </p>
            </section>
            {tabs('coop', [
              { id: 'sell', label: '작물·과일·가공품 팔기' },
              { id: 'buy', label: '일요 작물 좌판' },
            ], {
              sell: () => <ShopSell {...base} at="coop" coopWeek={town.coop.crops as Crop[]} />,
              buy: () =>
                life.shops?.coopSeeds.open ? (
                  <ShopBuy {...base} at="coop" items={SEEDS} />
                ) : (
                  <EmptyState glyph="sprout" title="작물 좌판은 일요일에 열려요" hint="시세표 작물의 씨앗을 10% 싸게 팔아요." />
                ),
            })}
          </>
        );
      }
      case 'general':
        return tabs('general', [
          { id: 'buy', label: '사기' },
          { id: 'sell', label: '팔기' },
          { id: 'more', label: '밭 설비 도면' },
        ], {
          buy: () => (
            <>
              {life.shops && (
                <p className="l-town-sub" data-testid="general-week">
                  이번 주 특가 {itemName(life.shops.special.item)} {formatBeom(life.shops.special.price)}
                  {life.shops.lantern.open ? ' · 지금은 토요일 밤 등불 상점! 비싼 씨앗 3종이 20% 싸요' : ' · 토요일 저녁 7시부터 자정까지 등불 상점이 열려요'}
                  {fishShop === 'general' ? ' · 항구가 열리기 전까지 낚시 도구도 여기서 팔아요' : ''}
                </p>
              )}
              <ShopBuy {...base} at="general" items={SEEDS} title="씨앗 · 꾸러미" />
              <ShopBuy {...base} at="general" items={SOIL} title="비료 · 흙" />
              <ShopBuy {...base} at="general" items={TACKLE} title="낚시 도구" />
              <ShopBuy {...base} at="general" items={UNLOCKS} title="희귀 소품 · 머리색 팔레트" hint="소품은 수확 목표를 채우면, 팔레트는 한 단계씩 열려요." />
            </>
          ),
          sell: () => <ShopSell {...base} at="general" />,
          more: () => (
          <>
            <h3 className="l-town-head">밭 설비 도면</h3>
            <ul className="l-town-list">
              {FIXTURES.map((f) => (
                <li key={f.id} className="l-town-row" data-testid={`fixture-${f.id}`}>
                  <ItemIcon id={f.id} size={36} />
                  <div>
                    <strong>{f.name}</strong>
                    <small>
                      {f.note} · {formatBeom(f.recipe.beom)}
                      {Object.entries(f.recipe.mats ?? {}).map(([m, n]) => ` · ${itemName(m)} ${n}`).join('')} · {SKILL_INFO[f.recipe.skill].name} {f.recipe.level}레벨
                    </small>
                  </div>
                  <GameButton size="s" onClick={() => onOpen?.('farm')}>
                    밭에서 만들기
                  </GameButton>
                </li>
              ))}
            </ul>
          </>
          ),
        });
      case 'bakery':
        return tabs('bakery', [
          { id: 'buy', label: '빵과 음료' },
          { id: 'more', label: '도시락' },
        ], {
          buy: () => <FoodMenu {...base} shop="bakery" />,
          more: () => <LunchShelf {...base} />,
        });
      case 'tavern':
        return (
          <>
            {tabs('tavern', [
              { id: 'buy', label: '안주와 음료' },
              { id: 'sell', label: '요리 팔기' },
            ], {
              buy: () => <FoodMenu {...base} shop="tavern" />,
              sell: () => <ShopSell {...base} at="tavern" />,
            })}
            <GameButton size="s" variant="ghost" onClick={() => onOpen?.('tavernUp')} data-testid="tavern-upgrades">
              주점 꾸미기 (업그레이드)
            </GameButton>
          </>
        );
      case 'newspaper': {
        const today = kstDay(now);
        const d = life.digest;
        const f = jannaForecast(today);
        return (
          <>
            <section className="l-town-notice" aria-label="잔나의 예보">
              <strong>내일 날씨 · 잔나 예보</strong>
              <p>
                {f.text}
                {jannaMissedToday(today) ? ' · 정정 보도: 어제 예보는 빗나갔어요.' : ''}
              </p>
            </section>
            {d.lines.length ? (
              <section className="l-town-news">
                <h3>어제 소식 · {d.date}</h3>
                <ul>
                  {d.lines.map((l, i) => (
                    <li key={i}>{l.text}</li>
                  ))}
                </ul>
              </section>
            ) : (
              <EmptyState glyph="news" title="어제는 조용한 하루였어요" />
            )}
          </>
        );
      }
      case 'police': {
        const lines = view.finance?.police ?? [];
        return lines.length ? (
          <ul className="l-town-news l-town-wanted">
            {lines.map((l) => (
              <li key={l.id}>
                <strong>수배 · {l.by}</strong> <small>{dayWord(l.at, now)} {hhmm(l.at)}</small>
                <span>{l.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState glyph="shield" title="요즘 마을은 조용해요" />
        );
      }
      case 'fishmarket': {
        const fish = Object.entries(life.me.inv ?? {}).filter(([id, n]) => n > 0 && ITEM_BY_ID[id]?.kind === 'fish');
        const a = town.auction;
        return tabs('fishmarket', [
          { id: 'buy', label: '낚시 도구' },
          { id: 'sell', label: '물고기 팔기' },
          { id: 'more', label: '새벽 경매' },
        ], {
          buy: () => <ShopBuy {...base} at="fishmarket" items={TACKLE} />,
          sell: () => <ShopSell {...base} at="fishmarket" />,
          more: () => (
          <>
            <section className="l-town-notice" aria-label="새벽 경매">
              <strong>새벽 경매 {a.open ? '· 지금 열려 있어요' : `· ${dayWord(a.next, now)} ${hhmm(a.next)}`}</strong>
              <p>
                경매에 올리면 +{Math.round(AUCTION_PREMIUM * 100)}% · 오늘 남은 웃돈 {formatBeom(a.premiumLeft)} · 남은 마리 {a.unitsLeft}
              </p>
            </section>
            {fish.length ? (
              <ul className="l-town-list">
                {fish.map(([id, n]) => (
                  <li key={id} className="l-town-row" data-testid={`fish-${id}`}>
                    <ItemIcon id={id} size={36} />
                    <div>
                      <strong>
                        {itemName(id)} <small>가진 개수 {n}</small>
                      </strong>
                      <small>매입가 {formatBeom(ITEM_BY_ID[id]?.sell ?? 0)}</small>
                    </div>
                    <span className="l-town-buttons">
                      <GameButton
                        size="s"
                        variant="primary"
                        disabled={busy || !a.open || !a.unitsLeft}
                        title={a.open ? undefined : '새벽 6시부터 7시까지 열려요'}
                        onClick={() => act({ kind: 'auctionSell', item: id, n: Math.min(n, a.unitsLeft) }, `${itemName(id)} ${Math.min(n, a.unitsLeft)}마리를 경매에 올렸어요.`)}
                      >
                        경매
                      </GameButton>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState glyph="fish" title="가방에 물고기가 없어요" />
            )}
          </>
          ),
        });
      }
      case 'guild': {
        const cup = life.angling?.cup;
        const meActor = me?.actor;
        if (!cup) return <EmptyState glyph="trophy" title="대회 기록을 불러오는 중이에요" />;
        const last = cup.history.at(-1);
        const rank = last ? last.ranks.findIndex((r) => r.actor === meActor) : -1;
        const can = !!last && rank >= 0 && last.players >= cup.minPlayers && !last.claimed.includes(meActor ?? -1);
        return (
          <>
            <section className="l-town-notice" aria-label="주간 낚시 대회">
              <strong>이번 주 대회 · {dayWord(cup.resetAt, now)} {hhmm(cup.resetAt)} 마감</strong>
              <p>잡은 물고기 중 희귀도 점수가 높은 세 마리의 합으로 순위를 매겨요. 상품 {cup.prizes.map((p) => formatBeom(p)).join(' · ')}</p>
            </section>
            {cup.standings.length ? (
              <ol className="l-town-news">
                {cup.standings.slice(0, 7).map((s) => (
                  <li key={s.actor}>
                    <strong>{ACTORS[s.actor] ?? '친구'}</strong> <small>{s.score}점</small>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState glyph="fish" title="이번 주 참가자가 아직 없어요" />
            )}
            {can && (
              <GameButton variant="primary" disabled={busy} onClick={() => act({ kind: 'cupClaim', week: last!.week }, `지난 대회 ${rank + 1}위 상품을 받았어요.`)}>
                지난 대회 {rank + 1}위 상품 받기 {formatBeom(cup.prizes[rank])}
              </GameButton>
            )}
          </>
        );
      }
      case 'library': {
        const c = town.club;
        return (
          <>
            <section className="l-town-notice" aria-label="독서 모임">
              <strong>독서 모임 {c.open ? '· 지금 열려 있어요' : `· ${dayWord(c.next, now)} ${hhmm(c.next)}`}</strong>
              <p>
                수요일 저녁 7시부터 9시까지. 참석하면 고른 기술 경험치 +{READING_XP}. {c.done ? '이번 주에는 이미 참석했어요.' : ''}
              </p>
            </section>
            <ul className="l-town-skills">
              {SKILLS.map((s) => (
                <li key={s}>
                  <GameButton disabled={busy || !c.open || c.done} onClick={() => act({ kind: 'readingClub', skill: s }, `독서 모임에서 ${SKILL_INFO[s].name} 책을 읽었어요.`)}>
                    {SKILL_INFO[s].name} 책
                  </GameButton>
                </li>
              ))}
            </ul>
          </>
        );
      }
      case 'stalls':
      case 'harborStall': {
        const st = town.stalls;
        const ids = (place === 'harborStall' ? ['stall-harbor'] : ['stall-sw', 'stall-w', 'stall-e', 'stall-se']) as StallId[];
        const open = place === 'harborStall' ? st.harbor : st.open;
        return (
          <>
            <p className="l-town-sub">
              {open ? `오늘 ${st.left}번 더 살 수 있어요 (하루 ${STALL_PER_DAY}번).` : place === 'harborStall' ? '마키마의 항구 좌판은 수요일과 토요일에 열려요.' : '장날(일요일)에만 좌판이 열려요.'}
            </p>
            <ul className="l-town-list">
              {ids.map((id) => {
                const g = st.goods[id];
                const bought = st.bought.includes(id);
                return (
                  <li key={id} className="l-town-row" data-testid={`stall-${id}`}>
                    <ItemIcon id={g.item} size={36} />
                    <div>
                      <strong>
                        {STALL_NAME[id]} <small>{itemName(g.item)}</small>
                      </strong>
                      <small>
                        {formatBeom(g.price)} · 잡화점 {formatBeom(ITEM_PRICES[g.item] ?? g.price)}
                      </small>
                    </div>
                    <GameButton size="s" variant="primary" disabled={busy || !open || bought || !st.left || view.wallet.balance < g.price} onClick={() => act({ kind: 'stallBuy', stall: id }, `${josa(itemName(g.item), '을/를')} 샀어요.`)}>
                      {bought ? '샀어요' : id === 'stall-sw' || id === 'stall-harbor' ? '계약' : '사기'}
                    </GameButton>
                  </li>
                );
              })}
            </ul>
            {(place === 'harborStall' ? life.shops?.peddler.area === 'harbor' : life.shops?.peddler.area === 'market') && (
              <>
                <ShopBuy {...base} at="peddler" items={PEDDLER_ITEMS} title="마키마의 이번 주 희귀품" hint="다른 가게에는 없는 물건이에요. 한 사람에게 한 번씩, 매주 월요일에 바뀌어요." />
                {life.shops && (
                  <section className="l-town-notice" aria-label="이번 주 계약" data-testid="peddler-deal">
                    <strong>이번 주 계약</strong>
                    <p>
                      {itemName(life.shops.peddler.deal.item)} {life.shops.peddler.deal.n}개를 가져오면 범 대신 {itemName(life.shops.peddler.stock[0].item)}을(를) 드려요. 가진 개수{' '}
                      {life.me.inv?.[life.shops.peddler.deal.item] ?? 0}
                    </p>
                    <GameButton
                      size="s"
                      variant="primary"
                      disabled={busy || life.shops.peddler.deal.done || (life.me.inv?.[life.shops.peddler.deal.item] ?? 0) < life.shops.peddler.deal.n}
                      onClick={() => act({ kind: 'peddlerDeal' }, `마키마와 계약했어요. ${itemName(life.shops!.peddler.stock[0].item)}을(를) 받았어요.`)}
                    >
                      {life.shops.peddler.deal.done ? '이번 주 계약 끝' : '계약하기'}
                    </GameButton>
                  </section>
                )}
              </>
            )}
          </>
        );
      }
      case 'signpost': {
        const seen = new Set<string>(['village', ...town.seen]);
        const open = new Set<string>(['village', ...(life.districts?.open ?? [])]);
        const friends = view.players.filter((p) => p.id !== view.self);
        return friends.length ? (
          <ul className="l-town-list">
            {friends.map((p) => {
              const area = (p.area ?? 'village') as string;
              const go = (['village', 'market', 'harbor', 'hillside'] as const).find((a) => a === area);
              const can = !!go && seen.has(go) && open.has(go) && me?.area !== go;
              return (
                <li key={p.id} className="l-town-row" data-testid={`travel-${p.actor}`}>
                  <span className="l-town-art" aria-hidden="true" />
                  <div>
                    <strong>{ACTORS[p.actor] ?? '친구'}</strong>
                    <small>{AREA_WORD[area] ?? '마을 어딘가'}</small>
                  </div>
                  <GameButton
                    size="s"
                    variant="primary"
                    disabled={!can}
                    title={!go ? '그곳은 입구까지 갈 수 없어요' : !seen.has(go) ? '한 번 가 본 곳만 갈 수 있어요' : undefined}
                    onClick={() => {
                      if (!go) return;
                      onTravel?.(go);
                      onClose();
                    }}
                  >
                    {go && me?.area === go ? '같은 곳' : `${go ? (go === 'village' ? '마을 중심' : DISTRICTS[go].name) : ''} 입구로`}
                  </GameButton>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState glyph="people" title="지금 접속한 친구가 없어요" />
        );
      }
    }
  })();

  return (
    <Modal title={title} wide onClose={onClose} className="l-town">
      {place === 'tavern' && (
        <div className="l-town-keeper">
          <span className="l-town-art">
            <DealerAvatar host="captain" mood="smile" />
          </span>
          <p>
            <b>{HOSTS.captain.name}</b> <span>한 상 차려 줄까요? 요리를 가져오면 제값에 사 드려요!</span>
          </p>
          <small>지갑 {formatBeom(view.wallet.balance)}</small>
        </div>
      )}
      {keeper && (
        <div className="l-town-keeper">
          <NpcPortrait npc={keeper.npc} />
          <p>
            <b>{NPCS[keeper.npc].name}</b> <span>{keeper.line}</span>
          </p>
          <small>지갑 {formatBeom(view.wallet.balance)}</small>
        </div>
      )}
      {body}
    </Modal>
  );
}
