'use client';
// "범타듀의 하루" panels: farm, bag (sell), shop (buy), mail, guestbook and
// "오늘의 한마디". Every action goes through CloudRoom.life(), which works in
// and out of rooms; server rejections arrive as the usual error toast.
import { useState } from 'react';
import {
  Backpack,
  Check,
  FlaskConical,
  Gift,
  House,
  RefreshCw,
  Sofa,
  Mail,
  MailOpen,
  Minus,
  Plus,
  Reply,
  Send,
  Sprout,
  Store,
} from 'lucide-react';
import { AvatarView } from '../avatar-view';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  CROPS,
  CROP_INFO,
  FRUIT_SELL,
  cropInSeason,
  GUESTBOOK_TEXT_MAX,
  MAIL_TEXT_MAX,
  PALETTES,
  SELL_MAX_N,
  BUY_MAX_N,
  SHOP,
  STATUS_TEXT_MAX,
  shopLock,
  type Crop,
  type Gift as LifeGift,
  type LifeAction,
  type LifeView,
  type ShopItem,
} from '../lounge-life';
import { ROD_PRICE, itemName, sellQuote } from '../lounge-life-plus';
import { ITEM_BY_ID, ITEM_PRICES, FURNITURE_BY_REF, HOUSE_TIERS } from '../lounge-items';
import { SEASON_INFO } from '../lounge-calendar';
import { giftTaste, tastesKnown } from '../lounge-life-ui';
import { ItemIcon } from './ItemIcon';
import { FURNITURE_ART } from '../lounge-furniture-art';
import { REACTIONS, reactionInfo } from '../lounge-reactions';
import { ACTORS } from '../lounge-roster';
import { TROPHY_ART, isTrophy } from '../lounge-trophy-art';
import { formatBeom, josa } from '../lounge-text';
import { loungeAudio } from '../lounge-audio';
import { defaultLook, type Look } from '../lounge-look';
import { ConfirmModal, Modal } from './Modal';
import type { Notify } from './Toast';
import { useNow } from './use-now';
import { lookFor } from './friend-looks';
import { FarmLedger } from './FarmLedger';
import type { VillagePoint } from '../lounge-village-layout';
import './life.css';

type Base = {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
};
type Chime = Parameters<typeof loungeAudio.chime>[0];

/** Sends a life action; on success shows `done` and plays a small chime. */
export function useLifeAction(room: CloudRoom, notify: Notify) {
  const [busy, setBusy] = useState(false);
  const run = async (action: LifeAction, done: string, chime?: Chime) => {
    if (busy) return false;
    setBusy(true);
    try {
      const ok = await room.life(action);
      if (ok) {
        if (done) notify(done);
        if (chime) loungeAudio.chime(chime);
      }
      return ok;
    } finally {
      setBusy(false);
    }
  };
  return [run, busy] as const;
}

function when(at: number, now: number) {
  const ago = now - at;
  if (ago < 60_000) return '방금';
  if (ago < 3_600_000) return `${Math.floor(ago / 60_000)}분 전`;
  if (ago < 86_400_000) return `${Math.floor(ago / 3_600_000)}시간 전`;
  return `${Math.floor(ago / 86_400_000)}일 전`;
}
/** A little picture next to each sticker word in mail. */
const STICKER_EMOJI: Record<string, string> = {
  laugh: '😆',
  wow: '😲',
  cry: '😭',
  love: '💖',
  cheer: '👍',
  think: '🤔',
  sorry: '🙏',
  hello: '👋',
  jeje: '😎',
  yoi: '🏁',
  eum: '😑',
  aye: '🤨',
  nonono: '🙅',
};
const cropLabel = (crop: Crop) => CROP_INFO[crop].name;
export function giftText(gift: LifeGift | undefined) {
  if (!gift) return '';
  return gift.kind === 'fruit'
    ? `과일 ${gift.n}개`
    : gift.kind === 'item'
      ? `${itemName(gift.item)} ${gift.n}개`
      : `${CROP_INFO[gift.crop].name} ${gift.n}개`;
}

function NoLife() {
  return (
    <p className="l-help-text">
      마을에 연결되면 텃밭과 가방을 쓸 수 있어요. 잠시 후 다시 열어 주세요.
    </p>
  );
}

function Stepper({
  value,
  min = 1,
  max,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <span className="l-stepper">
      <button
        type="button"
        aria-label={`${label} 줄이기`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={15} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        aria-label={`${label} 늘리기`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={15} />
      </button>
    </span>
  );
}

/* ------------------------------------------------------------------ farm */

/**
 * 내 텃밭 → 텃밭 장부 (VILL-2): the wooden notebook in FarmLedger.tsx. My
 * actor comes from the life view when the caller does not pass it.
 */
export function FarmModal({
  room,
  view,
  notify,
  onClose,
  onShop,
  onBag,
  onWalk,
  actor,
}: Base & {
  onShop: () => void;
  onBag?: () => void;
  onWalk?: (point: VillagePoint) => void;
  actor?: number;
}) {
  return (
    <FarmLedger
      room={room}
      view={view}
      notify={notify}
      onClose={onClose}
      onShop={onShop}
      onBag={onBag}
      onWalk={onWalk}
      actor={actor ?? view.life?.actors?.[view.self] ?? 0}
    />
  );
}

/* ------------------------------------------------------------------ bag */

export function BagModal({
  room,
  view,
  notify,
  onClose,
  onShop,
}: Base & { onShop: () => void }) {
  const life = view.life;
  const [run, busy] = useLifeAction(room, notify);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [earned, setEarned] = useState<{ id: number; amount: number } | null>(null);
  const clock = useNow(true, 60_000);
  if (!life)
    return (
      <Modal title="가방" onClose={onClose}>
        <NoLife />
      </Modal>
    );
  const bag = life.me.bag;
  const cap = life.sellCapLeft;
  const now = clock + view.clockOffset;
  // Demand curves (ECON-2): the price of each crop sags as more is sold today.
  const quote = (id: Crop | 'fruit', n: number) => sellQuote(life, id, 0, n, now);
  const rows: { id: Crop | 'fruit'; name: string; have: number; price: number }[] = [
    ...CROPS.map((crop) => ({
      id: crop,
      name: cropLabel(crop),
      have: bag.produce[crop],
      price: quote(crop, 1).unit,
    })),
    { id: 'fruit', name: '과일', have: bag.fruit, price: FRUIT_SELL },
  ];
  const sell = async (row: (typeof rows)[number], n: number) => {
    const total = quote(row.id, n).total;
    const ok = await run(
      { kind: 'sell', crop: row.id, n },
      `${row.name} ${n}개를 약 ${formatBeom(total)}에 팔았어요.`,
      'coin',
    );
    if (ok) {
      setCounts((prev) => ({ ...prev, [row.id]: 1 }));
      setEarned((prev) => ({ id: (prev?.id ?? 0) + 1, amount: total }));
    }
  };
  return (
    <Modal title="가방" onClose={onClose} className="l-life-modal">
      <section className="l-bag-section" aria-label="씨앗">
        <h3>
          <Sprout size={16} /> 씨앗
        </h3>
        <ul className="l-bag-chips">
          {CROPS.map((crop) => (
            <li key={crop}>
              <ItemIcon id={'seed-' + crop} size={18} /> {cropLabel(crop)} <b>{bag.seeds[crop]}</b>
            </li>
          ))}
        </ul>
      </section>
      <section className="l-bag-section" aria-label="수확물과 과일">
        <h3>
          <Backpack size={16} /> 수확물 · 과일
        </h3>
        <p className="l-sell-cap" data-testid="sell-cap">
          <span className="l-wallet-line">
            내 지갑 <b>{formatBeom(view.wallet.balance)}</b>
            {earned && (
              <em
                key={earned.id}
                className="l-coin-float"
                aria-hidden="true"
                data-testid="coin-float"
              >
                +{formatBeom(earned.amount)}
              </em>
            )}
          </span>
          <span>
            같은 작물을 많이 팔수록 값이 내려가요. 여러 작물을 섞어 팔면 이득이에요.
            <small> · 시세는 매일 자정(한국 시간)에 돌아와요 · 오늘 판 금액 {formatBeom(life.soldToday ?? 0)}</small>
          </span>
        </p>
        <ul className="l-sell-list">
          {rows.map((row) => {
            const n = Math.min(counts[row.id] ?? 1, Math.max(1, row.have));
            const q = quote(row.id, n);
            const total = q.total;
            // "모두 팔기": everything in the bag that still fits the daily safety ceiling.
            let all = Math.min(row.have, SELL_MAX_N);
            while (all > 1 && quote(row.id, all).total > cap) all--;
            const capped = !!row.have && total > cap;
            return (
              <li key={row.id} data-testid={`sell-${row.id}`}>
                <ItemIcon id={row.id} size={30} />
                <span className="l-sell-name">
                  <strong>{row.name}</strong>
                  <small>
                    {row.have}개 · 개당 {formatBeom(row.price)}
                    {q.share < 0.995 && (
                      <em className="l-demand" data-testid={`sell-demand-${row.id}`}>
                        {' '}
                        지금 {formatBeom(q.next)} ({Math.round(q.share * 100)}%)
                      </em>
                    )}
                  </small>
                </span>
                {row.have > 1 && (
                  <Stepper
                    label={`${row.name} 팔 개수`}
                    value={n}
                    max={Math.min(row.have, SELL_MAX_N)}
                    onChange={(v) => setCounts((prev) => ({ ...prev, [row.id]: v }))}
                  />
                )}
                <span className="l-sell-buttons">
                  <button
                    className="l-primary"
                    disabled={!row.have || busy || capped}
                    onClick={() => void sell(row, n)}
                  >
                    {row.have ? `${formatBeom(total)}에 팔기` : '없음'}
                  </button>
                  {row.have > 1 && all > 1 && all !== n && (
                    <button
                      className="l-secondary"
                      disabled={busy}
                      onClick={() => void sell(row, all)}
                      data-testid={`sell-all-${row.id}`}
                    >
                      {all < row.have ? `${all}개 팔기` : '모두 팔기'}
                    </button>
                  )}
                </span>
                {capped && (
                  <small className="l-why" data-testid={`sell-why-${row.id}`}>
                    오늘 판매 상한을 넘어요
                  </small>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      <button className="l-secondary" onClick={onShop}>
        <Store size={16} /> 범타듀 상점 가기
      </button>
    </Modal>
  );
}

/* ------------------------------------------------------------------ shop */

function ShopArt({ item }: { item: ShopItem }) {
  if ((item.kind === 'seed' || item.kind === 'bundle') && item.crop)
    return (
      <span className="l-shop-art">
        <ItemIcon id={'seed-' + item.crop} size={40} />
        {item.kind === 'bundle' && <small>×{item.seeds}</small>}
      </span>
    );
  if (item.kind === 'palette')
    return (
      <span className="l-shop-art l-shop-swatches">
        {(PALETTES[item.id as keyof typeof PALETTES] ?? []).map((hex) => (
          <i key={hex} style={{ background: hex }} />
        ))}
      </span>
    );
  if (isTrophy(item.id))
    return (
      <span className="l-shop-art">
        {/* oxlint-disable-next-line nextjs/no-img-element -- Inline SVG art. */}
        <img src={TROPHY_ART[item.id]} alt="" />
      </span>
    );
  return (
    <span className="l-shop-art">
      <Gift size={28} aria-hidden="true" />
    </span>
  );
}

export type ShopTab = 'seeds' | 'tools' | 'furniture' | 'house';
export function ShopModal({
  room,
  view,
  notify,
  onClose,
  initialTab = 'seeds',
}: Base & { initialTab?: ShopTab }) {
  const life = view.life;
  const [run] = useLifeAction(room, notify);
  const [tab, setTab] = useState<ShopTab>(initialTab);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [confirm, setConfirm] = useState<{ item: ShopItem; n: number } | null>(null);
  const balance = view.wallet.balance;
  const ownedList = life?.me.unlocks ?? [];
  const owned = new Set(ownedList);
  const harvested = life?.me.harvested ?? {};
  const groups: [ShopItem['kind'], string, string][] = [
    ['seed', '씨앗', '심으면 실시간으로 자라요.'],
    ['bundle', '씨앗 꾸러미', '밭 한 판을 조금 싸게.'],
    ['trophy', '희귀 소품', '수확 목표를 채우면 살 수 있어요. 내 방 꾸미기의 “희귀 소품”에 생겨요.'],
    ['palette', '머리색 팔레트·염색', '한 단계씩 열려요. 분장실 머리 색에 한 줄이 더 생겨요. 명품 염색은 오래 모아서 사는 한정 색이에요.'],
  ];
  const stacks = (item: ShopItem) => item.kind === 'seed' || item.kind === 'bundle';
  return (
    <Modal title="범타듀 상점" onClose={onClose} className="l-life-modal" wide>
      <p className="l-modal-intro">
        내 지갑 <b>{formatBeom(balance)}</b> · 수확물은 가방에서 팔 수 있어요.
      </p>
      <div className="l-mail-tabs" role="tablist" aria-label="상점">
        <button role="tab" aria-selected={tab === 'seeds'} onClick={() => setTab('seeds')} data-testid="shop-tab-seeds">
          <Sprout size={15} /> 씨앗·소품
        </button>
        <button role="tab" aria-selected={tab === 'tools'} onClick={() => setTab('tools')} data-testid="shop-tab-tools">
          <FlaskConical size={15} /> 도구·비료
        </button>
        <button role="tab" aria-selected={tab === 'furniture'} onClick={() => setTab('furniture')} data-testid="shop-tab-furniture">
          <Sofa size={15} /> 오늘의 가구
        </button>
        <button role="tab" aria-selected={tab === 'house'} onClick={() => setTab('house')} data-testid="shop-tab-house">
          <House size={15} /> 집 확장
        </button>
      </div>
      {!life && <NoLife />}
      {tab === 'house' && life && <HouseShop room={room} view={view} notify={notify} />}
      {tab === 'tools' && life && <ToolShop room={room} view={view} notify={notify} />}
      {tab === 'furniture' && life && <FurnitureShop room={room} view={view} notify={notify} />}
      {tab === 'seeds' && groups.map(([kind, title, hint]) => (
        <section key={kind} className="l-shop-group" aria-label={title}>
          <h3>
            {title} <small>{hint}</small>
          </h3>
          <ul className="l-shop-list">
            {SHOP.filter((item) => item.kind === kind).map((item) => {
              const have = owned.has(item.id);
              const n = stacks(item) ? (counts[item.id] ?? 1) : 1;
              const price = item.price * n;
              const lock = have ? null : shopLock(item, ownedList, harvested, life?.flags ?? []);
              const short = !lock && price > balance;
              return (
                <li
                  key={item.id}
                  data-owned={have || undefined}
                  data-locked={lock ? true : undefined}
                  data-testid={`shop-${item.id}`}
                >
                  <ShopArt item={item} />
                  <span className="l-shop-text">
                    <strong>{item.name}</strong>
                    <small>
                      {item.description}
                      {item.crop && CROP_INFO[item.crop].seasons
                        ? ` · ${CROP_INFO[item.crop].seasons!.map((x) => SEASON_INFO[x].name).join('·')} 작물${
                            life && !cropInSeason(item.crop, life.calendar?.season ?? 'spring') && !life.flags?.includes('greenhouse')
                              ? ' (지금은 못 심어요)'
                              : ''
                          }`
                        : ''}
                    </small>
                    <b>{formatBeom(item.price)}</b>
                    {item.requires && !have && (
                      <progress
                        className="l-plot-bar"
                        aria-label="목표까지"
                        max={item.requires.n}
                        value={Math.min(item.requires.n, harvested[item.requires.kind] ?? 0)}
                      />
                    )}
                  </span>
                  {stacks(item) && (
                    <Stepper
                      label={`${item.name} 개수`}
                      value={n}
                      max={BUY_MAX_N}
                      onChange={(v) => setCounts((prev) => ({ ...prev, [item.id]: v }))}
                    />
                  )}
                  {have ? (
                    <span className="l-owned">
                      <Check size={15} /> 가지고 있어요
                    </span>
                  ) : (
                    <span className="l-buy">
                      <button
                        className="l-primary"
                        disabled={!life || !!lock || short}
                        onClick={() => setConfirm({ item, n })}
                      >
                        {stacks(item) ? `${n}개 사기` : '사기'}
                      </button>
                      {(lock || short) && (
                        <small className="l-why">{lock ?? '범이 모자라요'}</small>
                      )}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {confirm && (
        <ConfirmModal
          title="살까요?"
          body={
            <>
              <b>{confirm.item.name}</b>
              {stacks(confirm.item) ? ` ${confirm.n}개` : ''}를{' '}
              <b>{formatBeom(confirm.item.price * confirm.n)}</b>에 사요. 지갑에{' '}
              {formatBeom(balance - confirm.item.price * confirm.n)}이 남아요.
            </>
          }
          confirmLabel="사기"
          busyLabel="사는 중…"
          cancelLabel="다음에"
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            const { item, n } = confirm;
            const ok = await run(
              { kind: 'buy', item: item.id, ...(stacks(item) ? { n } : {}) },
              item.kind === 'trophy'
                ? `${josa(item.name, '을/를')} 샀어요! 내 방 꾸미기의 희귀 소품에서 놓아 보세요.`
                : item.kind === 'palette'
                  ? `${josa(item.name, '을/를')} 샀어요! 분장실 머리 색에서 골라 보세요.`
                  : item.kind === 'bundle'
                    ? `${item.name} ${n}개를 샀어요. 씨앗 ${n * (item.seeds ?? 1)}개가 가방에 들어왔어요.`
                    : `${item.name} ${n}개를 샀어요.`,
              'coin',
            );
            if (ok) setConfirm(null);
            return ok;
          }}
        />
      )}
    </Modal>
  );
}

/** 도구·비료: fertilizer, bait, the fishing rod and farm expansion. */
function ToolShop({ room, view, notify }: Omit<Base, 'onClose'>) {
  const life = view.life!;
  const [run, busy] = useLifeAction(room, notify);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [rodConfirm, setRodConfirm] = useState(false);
  const balance = view.wallet.balance;
  const rod = life.me.fishing?.rod ?? 1;
  const nextRod = rod < 3 ? ((rod + 1) as 2 | 3) : null;
  return (
    <section className="l-shop-group" aria-label="도구와 비료">
      <h3>
        소모품 <small>비료는 작물 품질을, 미끼는 희귀 물고기 확률을 올려요.</small>
      </h3>
      <ul className="l-shop-list">
        {Object.entries(ITEM_PRICES).map(([id, price]) => {
          const n = counts[id] ?? 1;
          const def = ITEM_BY_ID[id];
          return (
            <li key={id} data-testid={`shop-${id}`}>
              <span className="l-shop-art">
                <ItemIcon id={id} size={40} />
              </span>
              <span className="l-shop-text">
                <strong>{def?.name ?? itemName(id)}</strong>
                <small>
                  {def?.note} · 가진 개수 {life.me.inv?.[id] ?? 0}
                </small>
                <b>{formatBeom(price)}</b>
              </span>
              <Stepper label={`${def?.name ?? id} 개수`} value={n} max={20} onChange={(v) => setCounts((p) => ({ ...p, [id]: v }))} />
              <span className="l-buy">
                <button
                  className="l-primary"
                  disabled={busy || price * n > balance}
                  onClick={() =>
                    void run({ kind: 'buyItem', item: id, n }, `${def?.name ?? id} ${n}개를 샀어요.`, 'coin').then(
                      (ok) => ok && setCounts((p) => ({ ...p, [id]: 1 })),
                    )
                  }
                  data-testid={`buy-${id}`}
                >
                  {formatBeom(price * n)}
                </button>
                {price * n > balance && <small className="l-why">범이 모자라요</small>}
              </span>
            </li>
          );
        })}
      </ul>
      <h3>
        낚싯대 <small>좋은 낚싯대는 입질을 더 오래 기다려 줘요.</small>
      </h3>
      <ul className="l-shop-list">
        <li data-testid="shop-rod">
          <span className="l-shop-art">
            <ItemIcon id="rod" size={40} />
          </span>
          <span className="l-shop-text">
            <strong>
              {rod}단계 낚싯대{nextRod ? ` → ${nextRod}단계` : ''}
            </strong>
            <small>
              {nextRod
                ? `입질 판정 ${nextRod === 2 ? '1.25' : '1.5'}배${nextRod === 3 ? ' · 희귀 물고기 1.5배' : ''}`
                : '가장 좋은 낚싯대예요.'}
            </small>
            {nextRod && <b>{formatBeom(ROD_PRICE[nextRod])}</b>}
          </span>
          {nextRod ? (
            <span className="l-buy">
              <button className="l-primary" disabled={busy || ROD_PRICE[nextRod] > balance} onClick={() => setRodConfirm(true)} data-testid="buy-rod">
                바꾸기
              </button>
              {ROD_PRICE[nextRod] > balance && <small className="l-why">범이 모자라요</small>}
            </span>
          ) : (
            <span className="l-owned">
              <Check size={15} /> 최고 단계
            </span>
          )}
        </li>
      </ul>
      {rodConfirm && nextRod && (
        <ConfirmModal
          title="낚싯대를 바꿀까요?"
          body={
            <>
              <b>{nextRod}단계 낚싯대</b>를 <b>{formatBeom(ROD_PRICE[nextRod])}</b>에 사요.
            </>
          }
          confirmLabel="바꾸기"
          busyLabel="바꾸는 중…"
          cancelLabel="다음에"
          onClose={() => setRodConfirm(false)}
          onConfirm={() => run({ kind: 'upgradeRod' }, `${nextRod}단계 낚싯대로 바꿨어요!`, 'coin')}
        />
      )}
    </section>
  );
}

/** 오늘의 가구: today's rotating furniture stock (resets at KST midnight). */
function FurnitureShop({ room, view, notify }: Omit<Base, 'onClose'>) {
  const life = view.life!;
  const [run, busy] = useLifeAction(room, notify);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [confirm, setConfirm] = useState<{ ref: string; name: string; price: number; n: number } | null>(null);
  const balance = view.wallet.balance;
  const shop = life.shop;
  const owned = life.me.furniture ?? {};
  const now = useNow(true, 60_000) + view.clockOffset;
  const hours = shop ? Math.max(0, Math.ceil((shop.resetAt - now) / 3_600_000)) : 0;
  return (
    <section className="l-shop-group" aria-label="오늘의 가구" data-testid="furniture-shop">
      <h3>
        오늘의 가구{' '}
        <small>
          매일 자정에 바뀌어요 (약 {hours}시간 뒤){shop?.discount ? ` · 일요 장터 ${shop.discount}% 할인` : ''}. 산 가구는 내 방 꾸미기의 “내 가구”에
          생겨요.
        </small>
      </h3>
      {shop?.rerolls !== undefined && (
        <p className="l-help-text" data-testid="furn-reroll-row">
          오늘 {shop.rerolls}번 새로 고쳤어요.{' '}
          {shop.rerollPrice ? (
            <button
              type="button"
              className="l-secondary"
              disabled={busy || balance < shop.rerollPrice}
              onClick={() => void run({ kind: 'rerollShop' }, `오늘의 가구를 ${formatBeom(shop.rerollPrice!)}에 새로 고쳤어요.`, 'coin')}
              data-testid="furn-reroll"
            >
              <RefreshCw size={14} /> {formatBeom(shop.rerollPrice)}에 새로 고치기
            </button>
          ) : (
            '오늘은 더 새로 고칠 수 없어요.'
          )}
        </p>
      )}
      <ul className="l-shop-list l-furn-list">
        {(shop?.items ?? []).map((item) => {
          const n = counts[item.ref] ?? 1;
          const total = item.price * n;
          return (
            <li key={item.ref} data-testid={`furn-${item.ref}`}>
              <span className="l-shop-art l-furn-art">
                {/* oxlint-disable-next-line nextjs/no-img-element -- Inline SVG furniture art. */}
                <img src={FURNITURE_ART[item.ref]} alt="" />
              </span>
              <span className="l-shop-text">
                <strong>
                  {item.name}
                  {item.limited && <em className="l-limited">{item.limited === 'holiday' ? '명절 한정' : '계절 한정'}</em>}
                </strong>
                <small>
                  {FURNITURE_BY_REF[item.ref]?.craft ? '공방에서 만들 수도 있어요 · ' : ''}가진 개수 {owned[item.ref] ?? 0}
                </small>
                <b>{formatBeom(item.price)}</b>
              </span>
              <Stepper label={`${item.name} 개수`} value={n} max={5} onChange={(v) => setCounts((p) => ({ ...p, [item.ref]: v }))} />
              <span className="l-buy">
                <button className="l-primary" disabled={total > balance} onClick={() => setConfirm({ ...item, n })} data-testid={`buy-${item.ref}`}>
                  {n}개 사기
                </button>
                {total > balance && <small className="l-why">범이 모자라요</small>}
              </span>
            </li>
          );
        })}
      </ul>
      {!!shop?.luxury?.length && (
        <>
          <h3>
            이번 주 명품 가구{' '}
            <small>
              매주 월요일에 바뀌어요 (약 {Math.max(1, Math.ceil(((shop.luxuryResetAt ?? now) - now) / 86_400_000))}일 뒤). 한 주에 한 사람당 하나씩만 살 수 있는
              귀한 가구예요.
            </small>
          </h3>
          <ul className="l-shop-list l-furn-list" data-testid="luxury-shop">
            {shop.luxury.map((item) => {
              const bought = !!shop.luxuryBought?.includes(item.ref);
              return (
                <li key={item.ref} data-owned={bought || undefined} data-testid={`lux-${item.ref}`}>
                  <span className="l-shop-art l-furn-art">
                    {/* oxlint-disable-next-line nextjs/no-img-element -- Inline SVG furniture art. */}
                    <img src={FURNITURE_ART[item.ref]} alt="" />
                  </span>
                  <span className="l-shop-text">
                    <strong>
                      {item.name}
                      <em className="l-limited">이번 주 한정</em>
                    </strong>
                    <small>가진 개수 {owned[item.ref] ?? 0}</small>
                    <b>{formatBeom(item.price)}</b>
                  </span>
                  {bought ? (
                    <span className="l-owned">
                      <Check size={15} /> 이번 주에 샀어요
                    </span>
                  ) : (
                    <span className="l-buy">
                      <button
                        className="l-primary"
                        disabled={item.price > balance}
                        onClick={() => setConfirm({ ...item, n: 1 })}
                        data-testid={`buy-${item.ref}`}
                      >
                        사기
                      </button>
                      {item.price > balance && <small className="l-why">범이 모자라요</small>}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {confirm && (
        <ConfirmModal
          title="가구를 살까요?"
          body={
            <>
              <b>{confirm.name}</b> {confirm.n}개를 <b>{formatBeom(confirm.price * confirm.n)}</b>에 사요. 지갑에{' '}
              {formatBeom(balance - confirm.price * confirm.n)}이 남아요.
            </>
          }
          confirmLabel="사기"
          busyLabel="사는 중…"
          cancelLabel="다음에"
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            const ok = await run(
              { kind: 'buyFurniture', ref: confirm.ref, n: confirm.n },
              `${josa(confirm.name, '을/를')} 샀어요! 내 방 꾸미기의 “내 가구”에서 놓아 보세요.`,
              'coin',
            );
            if (ok) setConfirm(null);
            return ok;
          }}
        />
      )}
    </section>
  );
}

/** 집 확장: house tiers bought in order (room styles, the house outside). */
function HouseShop({ room, view, notify }: Omit<Base, 'onClose'>) {
  const life = view.life!;
  const [run, busy] = useLifeAction(room, notify);
  const [confirm, setConfirm] = useState(false);
  const balance = view.wallet.balance;
  const tier = life.me.house ?? 0;
  const next = HOUSE_TIERS.find((t) => t.tier === tier + 1);
  return (
    <section className="l-shop-group" aria-label="집 확장" data-testid="house-shop">
      <h3>
        집 확장 <small>한 단계씩 넓혀요. 새 벽지·바닥은 내 방 꾸미기의 “벽·바닥”에서 골라요. 지금 {tier}단계예요.</small>
      </h3>
      <ul className="l-shop-list l-house-tiers">
        {HOUSE_TIERS.map((t) => {
          const have = t.tier <= tier,
            isNext = t.tier === tier + 1;
          return (
            <li key={t.tier} data-owned={have || undefined} data-locked={!have && !isNext ? true : undefined} data-testid={`house-${t.tier}`}>
              <span className="l-shop-art">
                <House size={28} aria-hidden="true" />
                <small>{t.tier}단계</small>
              </span>
              <span className="l-shop-text">
                <strong>{t.name}</strong>
                <small>{t.note}</small>
                <b>{formatBeom(t.price)}</b>
              </span>
              {have ? (
                <span className="l-owned">
                  <Check size={15} /> 완료
                </span>
              ) : isNext ? (
                <span className="l-buy">
                  <button className="l-primary" disabled={busy || t.price > balance} onClick={() => setConfirm(true)} data-testid="buy-house">
                    공사하기
                  </button>
                  {t.price > balance && <small className="l-why">범이 모자라요</small>}
                </span>
              ) : (
                <span className="l-buy">
                  <small className="l-why">{t.tier - 1}단계 다음에 열려요</small>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {confirm && next && (
        <ConfirmModal
          title="집을 넓힐까요?"
          body={
            <>
              <b>{next.name}</b>에 <b>{formatBeom(next.price)}</b>이 들어요. 지갑에 {formatBeom(balance - next.price)}이 남아요.
            </>
          }
          confirmLabel="공사하기"
          busyLabel="공사 중…"
          cancelLabel="다음에"
          onClose={() => setConfirm(false)}
          onConfirm={() => run({ kind: 'upgradeHouse' }, `집 확장 ${next.tier}단계 “${next.name}”을 마쳤어요!`, 'coin')}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ mail */

const others = (self: number) =>
  ACTORS.map((name, actor) => ({ name, actor })).filter((f) => f.actor !== self);

export function MailModal({
  room,
  view,
  notify,
  onClose,
  selfActor,
  initialTo,
  initialGift,
}: Base & { selfActor: number; initialTo?: number; initialGift?: string }) {
  const life = view.life;
  const now = useNow(true, 30_000) + view.clockOffset;
  const [tab, setTab] = useState<'inbox' | 'write' | 'guestbook'>(
    initialTo === undefined && !initialGift ? 'inbox' : 'write',
  );
  const [to, setTo] = useState<number>(initialTo ?? others(selfActor)[0].actor);
  const [text, setText] = useState('');
  const [sticker, setSticker] = useState('');
  // 'none' | a crop id | 'fruit' | an inventory item id (fish, bugs, forage, dishes…).
  const [giftKind, setGiftKind] = useState<string>(initialGift ?? 'none');
  const [giftN, setGiftN] = useState(1);
  const [run, busy] = useLifeAction(room, notify);
  if (!life)
    return (
      <Modal title="우편함" onClose={onClose}>
        <NoLife />
      </Modal>
    );
  const mail = [...life.me.mail].reverse();
  const bag = life.me.bag;
  const isCropGift = (CROPS as string[]).includes(giftKind);
  const giftMax =
    giftKind === 'none'
      ? 0
      : giftKind === 'fruit'
        ? bag.fruit
        : isCropGift
          ? bag.produce[giftKind as Crop]
          : (life.me.inv?.[giftKind] ?? 0);
  const giftItems = Object.entries(life.me.inv ?? {}).filter(
    ([id, n]) => n > 0 && ITEM_BY_ID[id] && ITEM_BY_ID[id].kind !== 'tool',
  );
  const myBond = life.me.bonds?.find((b) => b.actor === to);
  const known = tastesKnown(myBond?.level ?? 0);
  const tasteMark = (id: string) => {
    if (!known) return '';
    const t = giftTaste(to, id);
    return t === 'like' ? ' · 좋아해요' : t === 'dislike' ? ' · 별로예요' : '';
  };
  const send = async () => {
    const n = Math.min(giftN, giftMax);
    const gift: LifeGift | undefined =
      giftKind === 'none'
        ? undefined
        : giftKind === 'fruit'
          ? { kind: 'fruit', n }
          : isCropGift
            ? { kind: 'produce', crop: giftKind as Crop, n }
            : { kind: 'item', item: giftKind, n };
    const ok = await run(
      {
        kind: 'mail',
        to,
        text,
        ...(sticker ? { sticker } : {}),
        ...(gift && gift.n > 0 ? { gift } : {}),
      },
      `${ACTORS[to]}에게 편지를 보냈어요.`,
      'mail',
    );
    if (ok) {
      setText('');
      setSticker('');
      setGiftKind('none');
      setGiftN(1);
      setTab('inbox');
    }
  };
  return (
    <Modal title="우편함" onClose={onClose} className="l-life-modal">
      <div className="l-mail-tabs" role="tablist" aria-label="우편함">
        <button
          role="tab"
          aria-selected={tab === 'inbox'}
          onClick={() => setTab('inbox')}
        >
          <Mail size={15} /> 받은 편지
          {life.me.mailUnread > 0 && <b className="l-badge">{life.me.mailUnread}</b>}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'write'}
          onClick={() => setTab('write')}
          data-testid="mail-write-tab"
        >
          <Send size={15} /> 편지 쓰기
        </button>
        <button
          role="tab"
          aria-selected={tab === 'guestbook'}
          onClick={() => setTab('guestbook')}
        >
          내 방명록
        </button>
      </div>
      {tab === 'guestbook' ? (
        <section className="l-guestbook" aria-label="내 방명록">
          {!life.me.guestbook.length && (
            <p className="l-help-text">
              아직 다녀간 친구가 없어요. 친구가 내 집에 놀러 오면 여기에 한 줄이 남아요.
            </p>
          )}
          <ul>
            {[...life.me.guestbook].reverse().map((e, i) => (
              <li key={`${e.at}-${i}`}>
                <b>{ACTORS[e.actor] ?? '친구'}</b>
                <span>{e.text}</span>
                <small>{when(e.at, now)}</small>
              </li>
            ))}
          </ul>
        </section>
      ) : tab === 'inbox' ? (
        <>
          {life.me.mailUnread > 0 && (
            <button
              className="l-secondary l-mail-all"
              disabled={busy}
              onClick={() => void run({ kind: 'readMail', id: 'all' }, '모두 읽음으로 표시했어요.')}
            >
              <MailOpen size={15} /> 모두 읽음으로 표시
            </button>
          )}
          {!mail.length && <p className="l-help-text">아직 받은 편지가 없어요.</p>}
          <ul className="l-mail-list">
            {mail.map((m) => {
              const reaction = reactionInfo(m.sticker);
              return (
                <li key={m.id} data-unread={!m.read || undefined} data-testid="mail-item">
                  <span className="l-mail-face" aria-hidden="true">
                    <AvatarView actor={m.actor} look={lookFor(m.actor)} portrait />
                  </span>
                  <div>
                    <strong>
                      {ACTORS[m.actor] ?? '친구'}
                      <small> · {when(m.at, now)}</small>
                      {!m.read && <em className="l-new">새 편지</em>}
                    </strong>
                    {m.text && <p>{m.text}</p>}
                    {(reaction || m.gift) && (
                      <p className="l-mail-extra">
                        {reaction && (
                          <span className="l-sticker-chip" title={reaction.description}>
                            <span aria-hidden="true">{STICKER_EMOJI[reaction.id] ?? '💌'}</span>{' '}
                            {reaction.label}
                          </span>
                        )}
                        {m.gift && (
                          <span className="l-gift-chip">
                            <Gift size={13} /> {giftText(m.gift)} 선물 · 가방에 들어왔어요
                          </span>
                        )}
                      </p>
                    )}
                    <div className="l-mail-actions">
                      {!m.read && (
                        <button
                          className="l-link"
                          disabled={busy}
                          onClick={() => void run({ kind: 'readMail', id: m.id }, '')}
                        >
                          읽음으로 표시
                        </button>
                      )}
                      <button
                        className="l-link"
                        onClick={() => {
                          setTo(m.actor);
                          setTab('write');
                          if (!m.read) void room.life({ kind: 'readMail', id: m.id });
                        }}
                      >
                        <Reply size={14} /> 답장
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <form
          className="l-mail-form"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label>
            <span>받는 친구</span>
            <select
              value={to}
              onChange={(e) => setTo(Number(e.target.value))}
              data-testid="mail-to"
            >
              {others(selfActor).map((f) => (
                <option key={f.actor} value={f.actor}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>
              편지 <small>{Array.from(text).length}/{MAIL_TEXT_MAX}</small>
            </span>
            <textarea
              value={text}
              maxLength={MAIL_TEXT_MAX}
              rows={3}
              required={!sticker && giftKind === 'none'}
              placeholder={
                sticker || giftKind !== 'none'
                  ? '글 없이 스티커나 선물만 보내도 돼요'
                  : `${ACTORS[to]}에게 한 줄 남겨 보세요`
              }
              onChange={(e) => setText(e.target.value)}
              data-testid="mail-text"
            />
          </label>
          <fieldset className="l-sticker-pick">
            <legend>스티커 (선택)</legend>
            <button type="button" aria-pressed={!sticker} onClick={() => setSticker('')}>
              없음
            </button>
            {REACTIONS.map((r) => (
              <button
                type="button"
                key={r.id}
                aria-pressed={sticker === r.id}
                onClick={() => setSticker(r.id)}
              >
                <span aria-hidden="true">{STICKER_EMOJI[r.id] ?? '💌'}</span> {r.label}
              </button>
            ))}
          </fieldset>
          <label>
            <span>선물 (선택)</span>
            <select
              value={giftKind}
              onChange={(e) => {
                setGiftKind(e.target.value as typeof giftKind);
                setGiftN(1);
              }}
              data-testid="mail-gift"
            >
              <option value="none">선물 없음</option>
              <optgroup label="작물·과일">
                {CROPS.filter((c) => bag.produce[c] > 0).map((c) => (
                  <option key={c} value={c}>
                    {CROP_INFO[c].name} ({bag.produce[c]}개){tasteMark(c)}
                  </option>
                ))}
                <option value="fruit" disabled={!bag.fruit}>
                  과일 ({bag.fruit}개){tasteMark('fruit')}
                </option>
              </optgroup>
              {giftItems.length > 0 && (
                <optgroup label="물고기·곤충·채집물·요리">
                  {giftItems.map(([id, n]) => (
                    <option key={id} value={id}>
                      {ITEM_BY_ID[id].name} ({n}개){tasteMark(id)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          <p className="l-help-text" data-testid="mail-tastes">
            {known
              ? `${josa(ACTORS[to], '은/는')} ${
                  giftKind !== 'none' && giftTaste(to, giftKind) === 'like'
                    ? '이 선물을 좋아해요. 추억이 두 배로 쌓여요.'
                    : giftKind !== 'none' && giftTaste(to, giftKind) === 'dislike'
                      ? '이 선물은 별로 안 좋아해요.'
                      : '어떤 선물을 좋아할까요? 좋아하는 선물은 추억이 두 배예요.'
                }`
              : `${ACTORS[to]}의 취향은 하트가 하나 생기면 알 수 있어요.`}
          </p>
          {giftKind !== 'none' && giftMax > 0 && (
            <Stepper label="선물 개수" value={Math.min(giftN, giftMax)} max={Math.min(99, giftMax)} onChange={setGiftN} />
          )}
          <button
            className="l-primary"
            type="submit"
            disabled={busy || (!text.trim() && !sticker && !(giftKind !== 'none' && giftMax > 0))}
            data-testid="mail-send"
          >
            <Send size={15} /> 보내기
          </button>
        </form>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ guestbook */

export function Guestbook({
  room,
  owner,
  entries,
  notify,
  now,
  onWritten,
}: {
  room: CloudRoom;
  owner: number;
  entries: { actor: number; text: string; at: number }[];
  notify: Notify;
  now: number;
  onWritten: () => void;
}) {
  const [text, setText] = useState('');
  const [run, busy] = useLifeAction(room, notify);
  return (
    <section className="l-guestbook" aria-label={`${ACTORS[owner]}의 방명록`}>
      <h2>{ACTORS[owner]}의 방명록</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await run(
              { kind: 'guestbook', owner, text },
              '방명록에 한 줄 남겼어요.',
              'mail',
            )
          ) {
            setText('');
            onWritten();
          }
        }}
      >
        <input
          value={text}
          maxLength={GUESTBOOK_TEXT_MAX}
          placeholder="다녀간 한 줄을 남겨요"
          aria-label="방명록 한 줄"
          onChange={(e) => setText(e.target.value)}
          data-testid="guestbook-text"
        />
        <button className="l-primary" disabled={busy || !text.trim()} data-testid="guestbook-send">
          남기기
        </button>
      </form>
      <small className="l-count">
        {Array.from(text).length}/{GUESTBOOK_TEXT_MAX}
      </small>
      {!entries.length && <p className="l-help-text">첫 번째로 방명록을 남겨 보세요.</p>}
      <ul>
        {[...entries].reverse().map((e, i) => (
          <li key={`${e.at}-${i}`} data-testid="guestbook-entry">
            <b>{ACTORS[e.actor] ?? '친구'}</b>
            <span>{e.text}</span>
            <small>{when(e.at, now)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ status */

export function StatusModal({ room, view, notify, onClose }: Base) {
  const current = view.life?.me.status?.text ?? '';
  const [text, setText] = useState(current);
  const [run, busy] = useLifeAction(room, notify);
  return (
    <Modal title="오늘의 한마디" onClose={onClose}>
      <p className="l-modal-intro">
        내가 마을에 없을 때 친구가 말을 걸면 내 캐릭터가 이 말을 해요.
      </p>
      <form
        className="l-status-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run({ kind: 'status', text }, text.trim() ? '한마디를 바꿨어요.' : '한마디를 지웠어요.'))
            onClose();
        }}
      >
        <input
          value={text}
          maxLength={STATUS_TEXT_MAX}
          placeholder="예: 오늘은 딸기 심는 날!"
          aria-label="오늘의 한마디"
          onChange={(e) => setText(e.target.value)}
          data-testid="status-text"
        />
        <small className="l-count">
          {Array.from(text).length}/{STATUS_TEXT_MAX}
        </small>
        <div className="l-modal-actions">
          {current && (
            <button type="button" className="l-secondary" disabled={busy} onClick={() => setText('')}>
              지우기
            </button>
          )}
          <button className="l-primary" disabled={busy || text.trim() === current} data-testid="status-save">
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Friend's look for avatars when only the actor is known. */
export const lookOf = (actor: number, look?: Look) => look ?? defaultLook(actor);
export type { LifeView };
