'use client';
// "범타듀의 하루" panels: farm, bag (sell), shop (buy), mail, guestbook and
// "오늘의 한마디". Every action goes through CloudRoom.life(), which works in
// and out of rooms; server rejections arrive as the usual error toast.
import { useState } from 'react';
import {
  Backpack,
  Check,
  Droplets,
  Gift,
  Mail,
  MailOpen,
  Minus,
  Plus,
  Reply,
  Send,
  Sprout,
  Store,
  Wheat,
} from 'lucide-react';
import { AvatarView } from '../avatar-view';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  CROPS,
  CROP_INFO,
  FRUIT_SELL,
  GUESTBOOK_TEXT_MAX,
  MAIL_TEXT_MAX,
  PALETTES,
  SELL_MAX_N,
  BUY_MAX_N,
  SHOP,
  STATUS_TEXT_MAX,
  shopLock,
  plotStage,
  type Crop,
  type Gift as LifeGift,
  type LifeAction,
  type LifeView,
  type ShopItem,
} from '../lounge-life';
import { REACTIONS } from '../lounge-reactions';
import { ACTORS } from '../lounge-roster';
import { TROPHY_ART, isTrophy } from '../lounge-trophy-art';
import { formatBeom, josa } from '../lounge-text';
import { loungeAudio } from '../lounge-audio';
import { defaultLook, type Look } from '../lounge-look';
import { ConfirmModal, Modal } from './Modal';
import type { Notify } from './Toast';
import { useNow } from './use-now';
import { useServerClock } from './use-server-clock';
import { lookFor } from './friend-looks';
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

function duration(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60),
    m = minutes % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
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
};
const cropLabel = (crop: Crop) => `${CROP_INFO[crop].emoji} ${CROP_INFO[crop].name}`;
export function giftText(gift: LifeGift | undefined) {
  if (!gift) return '';
  return gift.kind === 'fruit'
    ? `과일 ${gift.n}개`
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

/** "🥕 당근 3 · 🍅 토마토 1" for what changed in the bag. */
function producedText(before: LifeView | null | undefined, after: LifeView | null | undefined) {
  if (!before || !after) return '';
  return CROPS.map((c) => [c, after.me.bag.produce[c] - before.me.bag.produce[c]] as const)
    .filter(([, n]) => n > 0)
    .map(([c, n]) => `${cropLabel(c)} ${n}`)
    .join(' · ');
}
const SEED_KEY = 'bumtadew-last-seed';
function lastSeed(): Crop {
  try {
    const v = globalThis.localStorage?.getItem(SEED_KEY);
    if (CROPS.includes(v as Crop)) return v as Crop;
  } catch {}
  return 'carrot';
}
function rememberSeed(crop: Crop) {
  try {
    globalThis.localStorage?.setItem(SEED_KEY, crop);
  } catch {}
}

export function FarmModal({
  room,
  view,
  notify,
  onClose,
  onShop,
  onBag,
}: Base & { onShop: () => void; onBag?: () => void }) {
  const life = view.life;
  const now = useServerClock(
    view.clockOffset,
    life?.me.farm.map((p) => p.readyAt) ?? [],
    5000,
  );
  const [run, busy] = useLifeAction(room, notify);
  const [choosing, setChoosing] = useState<number | null>(null);
  const [seed, setSeed] = useState<Crop>(lastSeed);
  const [harvest, setHarvest] = useState('');
  if (!life)
    return (
      <Modal title="내 텃밭" onClose={onClose}>
        <NoLife />
      </Modal>
    );
  const farm = life.me.farm;
  const seeds = life.me.bag.seeds;
  const ready = farm.filter((p) => p.crop && plotStage(p, now) === 3).length;
  const empty = farm.filter((p) => !p.crop).length;
  const thirsty = farm.filter(
    (p) => p.crop && p.wateredAt === null && plotStage(p, now) < 3,
  ).length;
  const anySeeds = CROPS.some((c) => seeds[c] > 0);
  const pick = anySeeds && !seeds[seed] ? CROPS.find((c) => seeds[c] > 0)! : seed;
  const plantN = Math.min(empty, seeds[pick]);
  const harvestAll = async () => {
    const before = room.snapshot().life;
    if (await run({ kind: 'harvest', plot: -1 }, '', 'harvest')) {
      const got = producedText(before, room.snapshot().life);
      setHarvest(got || `작물 ${ready}개`);
    }
  };
  return (
    <Modal title="내 텃밭" onClose={onClose} className="l-life-modal">
      <p className="l-modal-intro">
        씨앗을 심고 물을 주면 40% 빨리 자라요. 다 자라면 수확해서 가방에 담아요.
      </p>
      {harvest && (
        <output className="l-next-step" data-testid="farm-next-step">
          <span>
            <Wheat size={15} aria-hidden="true" /> {harvest} → 가방에 담았어요
          </span>
          <span className="l-next-actions">
            {onBag && (
              <button className="l-primary" onClick={onBag} data-testid="farm-go-sell">
                <Backpack size={15} /> 팔러 가기
              </button>
            )}
            <button className="l-secondary" onClick={onShop}>
              <Store size={15} /> 씨앗 사기
            </button>
          </span>
        </output>
      )}
      <div className="l-farm-actions">
        <button
          className="l-primary"
          disabled={!ready || busy}
          onClick={() => void harvestAll()}
          data-testid="farm-harvest-all"
        >
          <Wheat size={16} /> 모두 수확 {ready ? `(${ready})` : ''}
        </button>
        <button
          className="l-secondary"
          disabled={!thirsty || busy}
          onClick={() =>
            void run(
              { kind: 'water', plot: -1 },
              `${thirsty}칸에 물을 줬어요. 더 빨리 자라요!`,
              'water',
            )
          }
          data-testid="farm-water-all"
        >
          <Droplets size={16} /> 모두 물 주기 {thirsty ? `(${thirsty})` : ''}
        </button>
        <button className="l-secondary" onClick={onShop}>
          <Store size={16} /> 씨앗 사러 가기
        </button>
      </div>
      {empty > 0 && (
        <div className="l-plant-all" data-testid="farm-plant-all-row">
          {anySeeds ? (
            <>
              <label>
                <span>빈 칸 {empty}칸에</span>
                <select
                  value={pick}
                  onChange={(e) => {
                    setSeed(e.target.value as Crop);
                    rememberSeed(e.target.value as Crop);
                  }}
                  data-testid="farm-seed"
                >
                  {CROPS.map((crop) => (
                    <option key={crop} value={crop} disabled={!seeds[crop]}>
                      {cropLabel(crop)} ({seeds[crop]}개)
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="l-primary"
                disabled={busy || !plantN}
                onClick={() => {
                  rememberSeed(pick);
                  void run(
                    { kind: 'plant', plot: -1, crop: pick },
                    `${CROP_INFO[pick].name} ${plantN}칸을 심었어요.`,
                    'plant',
                  );
                }}
                data-testid="farm-plant-all"
              >
                <Sprout size={15} /> 모두 심기 ({plantN})
              </button>
            </>
          ) : (
            <>
              <span>씨앗이 없어요.</span>
              <button className="l-primary" onClick={onShop} data-testid="farm-need-seeds">
                <Store size={15} /> 씨앗 사러 가기
              </button>
            </>
          )}
        </div>
      )}
      <ol className="l-farm-grid" aria-label="텃밭 6칸">
        {farm.map((plot, i) => {
          const stage = plot.crop ? plotStage(plot, now) : 0;
          const readyAt = plot.readyAt ?? 0;
          const total = plot.crop ? Math.max(1, readyAt - plot.plantedAt) : 1;
          const progress = plot.crop
            ? Math.min(1, Math.max(0, (now - plot.plantedAt) / total))
            : 0;
          return (
            <li
              key={i}
              className="l-plot"
              data-stage={plot.crop ? stage : 'empty'}
              data-testid={`plot-${i}`}
            >
              <span className="l-plot-art" aria-hidden="true">
                {plot.crop
                  ? stage === 3
                    ? CROP_INFO[plot.crop].emoji
                    : stage === 0
                      ? '🌱'
                      : '🌿'
                  : ''}
              </span>
              <strong>
                {i + 1}번 밭 · {plot.crop ? CROP_INFO[plot.crop].name : '비어 있음'}
              </strong>
              {plot.crop && (
                <>
                  <progress
                    className="l-plot-bar"
                    aria-label="자란 정도"
                    max={100}
                    value={Math.round(progress * 100)}
                  />
                  <small>
                    {stage === 3
                      ? '다 자랐어요!'
                      : `${duration(readyAt - now)} 뒤 수확${plot.wateredAt !== null ? ' · 물 줌 💧' : ''}`}
                  </small>
                </>
              )}
              {!plot.crop ? (
                choosing === i ? (
                  <div className="l-seed-choices">
                    {CROPS.map((crop) => (
                      <button
                        key={crop}
                        disabled={!seeds[crop] || busy}
                        onClick={() => {
                          setChoosing(null);
                          setSeed(crop);
                          rememberSeed(crop);
                          void run(
                            { kind: 'plant', plot: i, crop },
                            `${josa(CROP_INFO[crop].name, '을/를')} 심었어요.`,
                            'plant',
                          );
                        }}
                      >
                        {cropLabel(crop)} <small>{seeds[crop]}개</small>
                      </button>
                    ))}
                    {!anySeeds && (
                      <button className="l-link" onClick={onShop}>
                        <Store size={14} /> 씨앗 사러 가기
                      </button>
                    )}
                    <button className="l-link" onClick={() => setChoosing(null)}>
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    className="l-secondary"
                    disabled={busy}
                    onClick={() => {
                      // One tap plants the remembered seed when there is one.
                      if (seeds[pick] > 0)
                        void run(
                          { kind: 'plant', plot: i, crop: pick },
                          `${josa(CROP_INFO[pick].name, '을/를')} 심었어요.`,
                          'plant',
                        );
                      else setChoosing(i);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setChoosing(i);
                    }}
                    data-testid={`plot-${i}-plant`}
                  >
                    <Sprout size={15} />{' '}
                    {seeds[pick] > 0 ? `${CROP_INFO[pick].name} 심기` : '씨앗 심기'}
                  </button>
                )
              ) : stage === 3 ? (
                <button
                  className="l-primary"
                  disabled={busy}
                  onClick={async () => {
                    const before = room.snapshot().life;
                    if (await run({ kind: 'harvest', plot: i }, '', 'harvest'))
                      setHarvest(producedText(before, room.snapshot().life) || cropLabel(plot.crop!));
                  }}
                  data-testid={`plot-${i}-harvest`}
                >
                  <Wheat size={15} /> 수확
                </button>
              ) : (
                <button
                  className="l-secondary"
                  disabled={plot.wateredAt !== null || busy}
                  onClick={() =>
                    void run({ kind: 'water', plot: i }, '물을 줬어요. 더 빨리 자라요!', 'water')
                  }
                  data-testid={`plot-${i}-water`}
                >
                  <Droplets size={15} /> {plot.wateredAt !== null ? '물 줌' : '물 주기'}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <p className="l-help-text">
        가진 씨앗:{' '}
        {CROPS.map((c) => `${CROP_INFO[c].name} ${seeds[c]}`).join(' · ')}
        {empty > 0 && anySeeds && (
          <>
            {' '}
            · 빈 칸의 “씨앗 심기”는 고른 씨앗({CROP_INFO[pick].name})을 바로 심어요.{' '}
            <button className="l-link" onClick={() => setChoosing(farm.findIndex((p) => !p.crop))}>
              다른 씨앗 고르기
            </button>
          </>
        )}
      </p>
    </Modal>
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
  if (!life)
    return (
      <Modal title="가방" onClose={onClose}>
        <NoLife />
      </Modal>
    );
  const bag = life.me.bag;
  const cap = life.sellCapLeft;
  const rows: { id: Crop | 'fruit'; name: string; have: number; price: number }[] = [
    ...CROPS.map((crop) => ({
      id: crop,
      name: cropLabel(crop),
      have: bag.produce[crop],
      price: CROP_INFO[crop].sell,
    })),
    { id: 'fruit', name: '🍎 과일', have: bag.fruit, price: FRUIT_SELL },
  ];
  const sell = async (row: (typeof rows)[number], n: number) => {
    const total = n * row.price;
    const ok = await run(
      { kind: 'sell', crop: row.id, n },
      `${row.name.replace(/^\S+\s/, '')} ${n}개를 ${formatBeom(total)}에 팔았어요.`,
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
              {cropLabel(crop)} <b>{bag.seeds[crop]}</b>
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
            오늘 더 팔 수 있어요: <b>{formatBeom(cap)}</b>
            <small> · 매일 자정(한국 시간)에 다시 채워져요</small>
          </span>
        </p>
        <ul className="l-sell-list">
          {rows.map((row) => {
            const n = Math.min(counts[row.id] ?? 1, Math.max(1, row.have));
            const total = n * row.price;
            // "모두 팔기": everything in the bag that still fits today's cap.
            const all = Math.min(row.have, SELL_MAX_N, Math.floor(cap / row.price));
            const capped = !!row.have && total > cap;
            return (
              <li key={row.id} data-testid={`sell-${row.id}`}>
                <span className="l-sell-name">
                  <strong>{row.name}</strong>
                  <small>
                    {row.have}개 · 개당 {formatBeom(row.price)}
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
                    오늘 판매 한도를 넘어요
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
        {CROP_INFO[item.crop].emoji}
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
  return <span className="l-shop-art">🎁</span>;
}

export function ShopModal({ room, view, notify, onClose }: Base) {
  const life = view.life;
  const [run] = useLifeAction(room, notify);
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
    ['palette', '머리색 팔레트', '한 단계씩 열려요. 분장실 머리 색에 한 줄이 더 생겨요.'],
  ];
  const stacks = (item: ShopItem) => item.kind === 'seed' || item.kind === 'bundle';
  return (
    <Modal title="범타듀 상점" onClose={onClose} className="l-life-modal" wide>
      <p className="l-modal-intro">
        내 지갑 <b>{formatBeom(balance)}</b> · 수확물은 가방에서 팔 수 있어요.
      </p>
      {!life && <NoLife />}
      {groups.map(([kind, title, hint]) => (
        <section key={kind} className="l-shop-group" aria-label={title}>
          <h3>
            {title} <small>{hint}</small>
          </h3>
          <ul className="l-shop-list">
            {SHOP.filter((item) => item.kind === kind).map((item) => {
              const have = owned.has(item.id);
              const n = stacks(item) ? (counts[item.id] ?? 1) : 1;
              const price = item.price * n;
              const lock = have ? null : shopLock(item, ownedList, harvested);
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
                    <small>{item.description}</small>
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
}: Base & { selfActor: number; initialTo?: number }) {
  const life = view.life;
  const now = useNow(true, 30_000) + view.clockOffset;
  const [tab, setTab] = useState<'inbox' | 'write' | 'guestbook'>(
    initialTo === undefined ? 'inbox' : 'write',
  );
  const [to, setTo] = useState<number>(initialTo ?? others(selfActor)[0].actor);
  const [text, setText] = useState('');
  const [sticker, setSticker] = useState('');
  const [giftKind, setGiftKind] = useState<'none' | Crop | 'fruit'>('none');
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
  const giftMax =
    giftKind === 'none' ? 0 : giftKind === 'fruit' ? bag.fruit : bag.produce[giftKind];
  const send = async () => {
    const gift: LifeGift | undefined =
      giftKind === 'none'
        ? undefined
        : giftKind === 'fruit'
          ? { kind: 'fruit', n: Math.min(giftN, giftMax) }
          : { kind: 'produce', crop: giftKind, n: Math.min(giftN, giftMax) };
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
              const reaction = REACTIONS.find((r) => r.id === m.sticker);
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
              {CROPS.map((c) => (
                <option key={c} value={c} disabled={!bag.produce[c]}>
                  {CROP_INFO[c].name} ({bag.produce[c]}개)
                </option>
              ))}
              <option value="fruit" disabled={!bag.fruit}>
                과일 ({bag.fruit}개)
              </option>
            </select>
          </label>
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
