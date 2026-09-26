'use client';
// 텃밭 장부 (VILL-2): the farm window as a wooden-bound notebook. The left
// page draws my yard the way it stands in the village (back bed above, front
// bed below, fallow rows until the farm is expanded); the right page is the
// selected plot with the seed pouch (only seeds I own that grow now) and the
// friends whose plots need water. Keyboard: arrows pick a plot, E / Enter /
// Space tends it, 1–9 plant from the pouch, H harvests all, W waters all.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  CROPS,
  CROP_INFO,
  cropInSeason,
  plotStage,
  type Crop,
  type LifeAction,
  type LifeView,
} from '../lounge-life';
import { FARM_EXPAND_PRICE, itemName } from '../lounge-life-plus';
import { ITEM_BY_ID } from '../lounge-items';
import { SEASON_INFO, WEATHER_INFO } from '../lounge-calendar';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa } from '../lounge-text';
import { loungeAudio } from '../lounge-audio';
import { lifeSfx } from '../lounge-audio-life';
import { farmBed, farmFront } from '../lounge-village-life';
import type { VillagePoint } from '../lounge-village-layout';
import { CropStageArt, ItemIcon, QualityStar } from './ItemIcon';
import { Glyph } from './field-glyphs';
import { ConfirmModal, Modal } from './Modal';
import type { Notify } from './Toast';
import { useServerClock } from './use-server-clock';
import './farm-fish.css';

type Plot = LifeView['me']['farm'][number];
const STAGE_NAME = ['씨앗', '새싹', '자라는 중', '수확할 때'] as const;
/** Plot order on the page: back bed (7–12) above, front bed (1–6) below. */
const PAGE_ROWS = [
  [6, 7, 8],
  [9, 10, 11],
  [0, 1, 2],
  [3, 4, 5],
] as const;
const SEED_KEY = 'bumtadew-last-seed';

function duration(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60),
    m = minutes % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}
const bedName = (i: number) => `${i < 6 ? '앞' : '뒤'} 두둑 ${(i % 6) + 1}`;
function rememberSeed(crop: Crop) {
  try {
    globalThis.localStorage?.setItem(SEED_KEY, crop);
  } catch {}
}
function lastSeed(): Crop | null {
  try {
    const v = globalThis.localStorage?.getItem(SEED_KEY);
    return CROPS.includes(v as Crop) ? (v as Crop) : null;
  } catch {
    return null;
  }
}

type Harvest = { crop: Crop; n: number; quality: 0 | 1 | 2 }[];
/** What the last harvest put in the bag, by crop and star (for the basket strip). */
function harvestOf(before: LifeView | null | undefined, after: LifeView | null | undefined): Harvest {
  if (!before || !after) return [];
  const out: Harvest = [];
  for (const c of CROPS) {
    const n = after.me.bag.produce[c] - before.me.bag.produce[c];
    if (n <= 0) continue;
    const gold = (after.me.quality?.gold?.[c] ?? 0) - (before.me.quality?.gold?.[c] ?? 0),
      silver = (after.me.quality?.silver?.[c] ?? 0) - (before.me.quality?.silver?.[c] ?? 0);
    if (gold > 0) out.push({ crop: c, n: gold, quality: 2 });
    if (silver > 0) out.push({ crop: c, n: silver, quality: 1 });
    if (n - gold - silver > 0) out.push({ crop: c, n: n - gold - silver, quality: 0 });
  }
  return out;
}

export function FarmLedger({
  room,
  view,
  notify,
  onClose,
  onShop,
  onBag,
  onWalk,
  actor,
}: {
  /** My actor (resident index). */
  actor: number;
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
  onShop: () => void;
  onBag?: () => void;
  /** Walks there in the village (switching to the village first). */
  onWalk?: (point: VillagePoint) => void;
}) {
  const life = view.life;
  const now = useServerClock(view.clockOffset, life?.me.farm.map((p) => p.readyAt) ?? [], 5000);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [basket, setBasket] = useState<Harvest>([]);
  const [expand, setExpand] = useState(false);
  const [packet, setPacket] = useState<Crop | null>(lastSeed);
  const bookRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bookRef.current?.focus({ preventScroll: true });
  }, []);
  const run = async (action: LifeAction, done: string, chime?: 'plant' | 'water' | 'harvest') => {
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

  const farm: readonly Plot[] = life?.me.farm ?? [];
  const size = life?.me.plots ?? farm.length;
  const season = life?.calendar?.season ?? 'spring';
  const greenhouse = !!life?.flags?.includes('greenhouse');
  const plantable = (c: Crop) => greenhouse || cropInSeason(c, season);
  const seeds = life?.me.bag.seeds;
  const pouch = CROPS.filter((c) => (seeds?.[c] ?? 0) > 0 && plantable(c));
  const offSeason = CROPS.filter((c) => (seeds?.[c] ?? 0) > 0 && !plantable(c));
  const chosen = packet && pouch.includes(packet) ? packet : (pouch[0] ?? null);
  const stageOf = (p: Plot) => (p.crop ? plotStage(p, now) : 0);
  const ready = farm.filter((p) => p.crop && stageOf(p) === 3).length;
  const empty = farm.filter((p) => !p.crop).length;
  const thirstyOf = (p: Plot) => !!p.crop && stageOf(p) < 3 && p.wateredAt === null && !p.rained;
  const thirsty = farm.filter(thirstyOf).length;
  const inv = life?.me.inv ?? {};
  const fertOf = (level: 1 | 2) => farm.filter((p) => p.crop && (p.fert ?? 0) < level && stageOf(p) < 3).length;
  const nextSize = size === 6 ? 9 : size === 9 ? 12 : 0;
  // Default selection: something to do first (ripe, then empty, then thirsty).
  const current =
    sel !== null && sel < farm.length
      ? sel
      : Math.max(
          0,
          [farm.findIndex((p) => p.crop && stageOf(p) === 3), farm.findIndex((p) => !p.crop), farm.findIndex(thirstyOf)].find((i) => i >= 0) ?? 0,
        );
  const plot = farm[current];

  const friends = useMemo(() => {
    if (!life) return [];
    const me = life.actors ? Object.entries(life.actors) : [];
    return me
      .filter(([, a]) => a !== actor)
      .map(([uid, actor]) => {
        const plots = life.housesPlotsPublic?.[uid] ?? [];
        return {
          actor,
          need: plots.filter((p) => p.needsWater).length,
          growing: plots.filter((p) => p.crop).length,
          done: !!life.me.waterFriend?.includes(actor),
        };
      })
      .filter((f) => f.need > 0 || f.done)
      .sort((a, b) => Number(a.done) - Number(b.done) || b.need - a.need);
  }, [life, actor]);

  if (!life)
    return (
      <Modal title="텃밭 장부" onClose={onClose} className="l-ledger">
        <p className="l-ledger-empty">마을에 연결되면 장부를 펼칠 수 있어요.</p>
      </Modal>
    );

  const harvestAll = async () => {
    const before = room.snapshot().life;
    if (await run({ kind: 'harvest', plot: -1 }, '', 'harvest')) {
      const got = harvestOf(before, room.snapshot().life);
      setBasket(got);
      lifeSfx(got.some((g) => g.quality === 2) ? 'sparkle' : 'pop');
    }
  };
  const harvestOne = async (i: number) => {
    const before = room.snapshot().life;
    if (await run({ kind: 'harvest', plot: i }, '', 'harvest')) {
      const got = harvestOf(before, room.snapshot().life);
      setBasket(got);
      lifeSfx(got.some((g) => g.quality === 2) ? 'sparkle' : 'pop');
    }
  };
  const plantOne = (i: number, crop: Crop) => {
    setPacket(crop);
    rememberSeed(crop);
    void run({ kind: 'plant', plot: i, crop }, `${bedName(i)}에 ${josa(CROP_INFO[crop].name, '을/를')} 심었어요.`, 'plant');
  };
  const plantAll = (crop: Crop) => {
    const n = Math.min(empty, seeds?.[crop] ?? 0);
    rememberSeed(crop);
    void run({ kind: 'plant', plot: -1, crop }, `${CROP_INFO[crop].name} ${n}칸을 심었어요.`, 'plant');
  };
  const waterAll = () => void run({ kind: 'water', plot: -1 }, `목마른 ${thirsty}칸에 물을 줬어요.`, 'water');
  /** The one thing E does for the selected plot. */
  const primary = (i: number) => {
    const p = farm[i];
    if (!p) return;
    if (!p.crop) {
      if (chosen) plantOne(i, chosen);
      return;
    }
    const st = stageOf(p);
    if (st === 3) void harvestOne(i);
    else if (thirstyOf(p)) void run({ kind: 'water', plot: i }, `${bedName(i)}에 물을 줬어요.`, 'water');
  };
  const move = (dx: number, dy: number) => {
    let r = PAGE_ROWS.findIndex((row) => (row as readonly number[]).includes(current)),
      c = (PAGE_ROWS[r] as readonly number[]).indexOf(current);
    for (let step = 0; step < 4; step++) {
      r = (r + dy + PAGE_ROWS.length) % PAGE_ROWS.length;
      c = Math.max(0, Math.min(2, c + dx));
      const next = PAGE_ROWS[r][c];
      if (next < farm.length) {
        setSel(next);
        return;
      }
      if (!dy) return;
    }
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target as HTMLElement;
    if (target !== e.currentTarget && target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
    const k = e.key.toLowerCase();
    let handled = true;
    if (e.key === 'ArrowLeft') move(-1, 0);
    else if (e.key === 'ArrowRight') move(1, 0);
    else if (e.key === 'ArrowUp') move(0, -1);
    else if (e.key === 'ArrowDown') move(0, 1);
    else if (k === 'e' || e.key === 'Enter' || e.key === ' ') primary(current);
    else if (k === 'h' && ready) void harvestAll();
    else if (k === 'w' && thirsty) waterAll();
    else if (/^[1-9]$/.test(e.key) && pouch[Number(e.key) - 1]) {
      const crop = pouch[Number(e.key) - 1];
      if (plot && !plot.crop) plantOne(current, crop);
      else setPacket(crop);
    } else handled = false;
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const weather = life.weather?.today;
  const name = ACTORS[actor] ?? '';
  const st = plot ? stageOf(plot) : 0;
  const readyAt = plot?.readyAt ?? 0;
  const regrow = plot?.crop ? CROP_INFO[plot.crop].regrow : undefined;
  return (
    <Modal title={`${name}네 텃밭 장부`} onClose={onClose} className="l-ledger" wide>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Arrow keys / 1–9 / H / W move and act inside the ledger. */}
      <div
        ref={bookRef}
        className="l-ledger-book"
        tabIndex={-1}
        role="application"
        aria-roledescription="텃밭 장부"
        onKeyDown={onKey}
        data-testid="farm-ledger"
      >
        <section className="l-ledger-page l-ledger-left" aria-label="내 밭 그림">
          <header className="l-ledger-date">
            <span className="l-ledger-stamp">
              {SEASON_INFO[season].name} {life.calendar?.seasonDay ?? ''}일
            </span>
            <span>{weather ? WEATHER_INFO[weather].name : ''}</span>
            <span className="l-ledger-tally">
              익음 <b>{ready}</b> · 목마름 <b>{thirsty}</b> · 빈 칸 <b>{empty}</b>
            </span>
          </header>
          <div className="l-ledger-yard" role="grid" aria-label={`텃밭 ${farm.length}칸 (방향키로 고르기)`}>
            {[0, 1].map((part) => {
              const rows = PAGE_ROWS.slice(part === 0 ? 2 : 0, part === 0 ? 4 : 2);
              const locked = part === 1 && size < 9;
              return (
                <div
                  key={part}
                  className="l-ledger-bed"
                  data-part={part === 0 ? 'front' : 'back'}
                  data-locked={locked || undefined}
                  style={{ order: part === 0 ? 2 : 0 }}
                >
                  <span className="l-ledger-bedname">{part === 0 ? '앞 두둑' : '뒤 두둑'}</span>
                  {rows.map((row, r) => (
                    <div key={r} className="l-ledger-row" role="row">
                      {row.map((i) => {
                        const p = farm[i];
                        if (!p)
                          return (
                            <span key={i} className="l-ledger-plot" data-state="fallow" aria-hidden="true">
                              <span className="l-ledger-fallow" />
                            </span>
                          );
                        const s = stageOf(p);
                        const state = !p.crop ? 'empty' : s === 3 ? 'ready' : thirstyOf(p) ? 'thirsty' : 'growing';
                        return (
                          <button
                            key={i}
                            type="button"
                            role="gridcell"
                            className="l-ledger-plot"
                            data-state={state}
                            data-wet={(p.crop && (p.wateredAt !== null || p.rained)) || undefined}
                            aria-selected={current === i}
                            aria-label={`${bedName(i)} · ${p.crop ? `${CROP_INFO[p.crop].name} ${STAGE_NAME[s]}` : '빈 칸'}${state === 'thirsty' ? ' · 목말라요' : ''}`}
                            data-testid={`plot-${i}`}
                            onClick={() => setSel(i)}
                            onDoubleClick={() => primary(i)}
                          >
                            <span className="l-ledger-soil" />
                            {p.crop ? <CropStageArt crop={p.crop} stage={s} size={46} /> : null}
                            {state === 'thirsty' && (
                              <span className="l-ledger-mark l-ledger-thirst">
                                <Glyph name="drop" size={14} />
                              </span>
                            )}
                            {p.crop && p.quality ? (
                              <span className="l-ledger-mark l-ledger-q">
                                <QualityStar quality={p.quality} size={13} />
                              </span>
                            ) : null}
                            {p.crop && p.fert ? (
                              <span className="l-ledger-mark l-ledger-fert" title={p.fert === 2 ? '고급 비료' : '비료'}>
                                <Glyph name="leaf" size={12} />
                              </span>
                            ) : null}
                            <i className="l-ledger-num">{i + 1}</i>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  {locked && (
                    <div className="l-ledger-lock">
                      <Glyph name="lock" size={16} />
                      <span>
                        뒤 두둑은 아직 풀밭이에요
                        <small>
                          {nextSize}칸으로 넓히면 여기부터 갈아요 · {formatBeom(FARM_EXPAND_PRICE[nextSize as 9 | 12])}
                        </small>
                      </span>
                      <button type="button" className="l-ink" onClick={() => setExpand(true)} data-testid="farm-expand">
                        밭 넓히기
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <span className="l-ledger-path" aria-hidden="true">
              대문 쪽
            </span>
          </div>
          <footer className="l-ledger-actions">
            <button type="button" className="l-leaf" disabled={!ready || busy} onClick={() => void harvestAll()} data-testid="farm-harvest-all">
              <Glyph name="basket" /> 모두 거두기{ready ? ` ${ready}` : ''} <kbd>H</kbd>
            </button>
            <button type="button" className="l-ink" disabled={!thirsty || busy} onClick={waterAll} data-testid="farm-water-all">
              <Glyph name="can" /> 모두 물 주기{thirsty ? ` ${thirsty}` : ''} <kbd>W</kbd>
            </button>
            {(['fertilizer', 'fertilizer-deluxe'] as const).map((item, k) => {
              const have = inv[item] ?? 0;
              if (!have) return null;
              const n = Math.min(have, fertOf((k + 1) as 1 | 2));
              return (
                <button
                  key={item}
                  type="button"
                  className="l-ink"
                  disabled={!n || busy}
                  onClick={() =>
                    void run({ kind: 'fertilize', plot: -1, item }, `${n}칸에 ${ITEM_BY_ID[item].name}를 뿌렸어요.`, 'plant')
                  }
                  data-testid={`farm-fert-${k + 1}`}
                >
                  <Glyph name="leaf" /> {ITEM_BY_ID[item].name} {n ? n : ''}
                  <small>남은 {have}</small>
                </button>
              );
            })}
            {nextSize && size >= 9 ? (
              <button type="button" className="l-ink" onClick={() => setExpand(true)} data-testid="farm-expand">
                {nextSize}칸으로 넓히기
              </button>
            ) : null}
          </footer>
        </section>

        <section className="l-ledger-page l-ledger-right" aria-label="고른 칸">
          {basket.length > 0 && (
            <output className="l-ledger-basket" data-testid="farm-next-step">
              <strong>
                <Glyph name="basket" /> 바구니에 담았어요
              </strong>
              <span className="l-ledger-haul">
                {basket.map((b, k) => (
                  <span key={`${b.crop}${b.quality}`} className="l-ledger-pop" style={{ animationDelay: `${k * 90}ms` }} data-q={b.quality}>
                    <ItemIcon id={b.crop} size={38} quality={b.quality || undefined} />
                    <b>×{b.n}</b>
                  </span>
                ))}
              </span>
              <span className="l-ledger-row-actions">
                {onBag && (
                  <button type="button" className="l-leaf" onClick={onBag} data-testid="farm-go-sell">
                    가방 열고 팔기
                  </button>
                )}
                <button type="button" className="l-ink" onClick={() => setBasket([])}>
                  계속 가꾸기
                </button>
              </span>
            </output>
          )}
          {plot && (
            <article className="l-ledger-card" data-state={!plot.crop ? 'empty' : st === 3 ? 'ready' : 'growing'}>
              <header>
                <span className="l-ledger-where">{bedName(current)}</span>
                <h3>{plot.crop ? CROP_INFO[plot.crop].name : '빈 칸'}</h3>
                {plot.crop ? (
                  <ol className="l-ledger-stages" aria-label={`자란 단계 ${STAGE_NAME[st]}`}>
                    {STAGE_NAME.map((label, k) => (
                      <li key={label} data-on={k <= st || undefined} data-now={k === st || undefined}>
                        <CropStageArt crop={plot.crop!} stage={k} size={30} />
                        <small>{label}</small>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </header>
              {plot.crop ? (
                <>
                  <dl className="l-ledger-facts">
                    <dt>수확</dt>
                    <dd>{st === 3 ? '지금 거둘 수 있어요' : `${duration(readyAt - now)} 뒤`}</dd>
                    <dt>물</dt>
                    <dd>{plot.rained ? '오늘 비가 적셔 줬어요' : plot.wateredAt !== null ? '오늘 줬어요' : st === 3 ? '다 자랐어요' : '목말라요 · 주면 40% 빨리 자라요'}</dd>
                    <dt>거름</dt>
                    <dd>{plot.fert === 2 ? '고급 비료' : plot.fert === 1 ? '비료' : '아직 안 줬어요'}</dd>
                    {plot.quality ? (
                      <>
                        <dt>예감</dt>
                        <dd>
                          <QualityStar quality={plot.quality} size={13} /> {plot.quality === 2 ? '금별이 나올 것 같아요' : '은별이 나올 것 같아요'}
                        </dd>
                      </>
                    ) : null}
                    {regrow && plot.harvestsLeft > 1 ? (
                      <>
                        <dt>또 열림</dt>
                        <dd>{plot.harvestsLeft - 1}번 더 거둬요</dd>
                      </>
                    ) : null}
                  </dl>
                  <div className="l-ledger-row-actions">
                    {st === 3 ? (
                      <button type="button" className="l-leaf" disabled={busy} onClick={() => void harvestOne(current)} data-testid={`plot-${current}-harvest`}>
                        <Glyph name="basket" /> 거두기 <kbd>E</kbd>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="l-ink"
                        disabled={busy || !thirstyOf(plot)}
                        onClick={() => void run({ kind: 'water', plot: current }, `${bedName(current)}에 물을 줬어요.`, 'water')}
                        data-testid={`plot-${current}-water`}
                      >
                        <Glyph name="can" /> {plot.rained ? '비가 줬어요' : plot.wateredAt !== null ? '물 줬어요' : '물 주기'} {thirstyOf(plot) ? <kbd>E</kbd> : null}
                      </button>
                    )}
                    {st < 3 &&
                      (['fertilizer', 'fertilizer-deluxe'] as const).map((item, k) =>
                        (inv[item] ?? 0) > 0 && (plot.fert ?? 0) < k + 1 ? (
                          <button
                            key={item}
                            type="button"
                            className="l-ink"
                            disabled={busy}
                            onClick={() => void run({ kind: 'fertilize', plot: current, item }, `${bedName(current)}에 ${ITEM_BY_ID[item].name}를 뿌렸어요.`, 'plant')}
                          >
                            <Glyph name="leaf" /> {ITEM_BY_ID[item].name}
                          </button>
                        ) : null,
                      )}
                  </div>
                </>
              ) : (
                <div className="l-ledger-pouch" data-testid="farm-plant-all-row">
                  <p className="l-ledger-note">
                    <Glyph name="sack" /> 씨앗 주머니 <small>숫자키로 바로 심어요</small>
                  </p>
                  {pouch.length ? (
                    <>
                      <ul className="l-ledger-packets" aria-label="심을 수 있는 씨앗">
                        {pouch.slice(0, 9).map((crop, k) => (
                          <li key={crop}>
                            <button
                              type="button"
                              className="l-ledger-packet"
                              aria-pressed={chosen === crop}
                              disabled={busy}
                              onClick={() => plantOne(current, crop)}
                              data-testid={`farm-seed-${crop}`}
                            >
                              <kbd>{k + 1}</kbd>
                              <ItemIcon id={'seed-' + crop} size={40} />
                              <span>{CROP_INFO[crop].name}</span>
                              <small>
                                {seeds?.[crop]}봉 · {duration(CROP_INFO[crop].growMs)}
                              </small>
                            </button>
                          </li>
                        ))}
                      </ul>
                      {empty > 1 && chosen && (
                        <button
                          type="button"
                          className="l-leaf l-ledger-all"
                          disabled={busy}
                          onClick={() => plantAll(chosen)}
                          data-testid="farm-plant-all"
                        >
                          <Glyph name="seed" /> 빈 칸 {Math.min(empty, seeds?.[chosen] ?? 0)}곳에 {itemName(chosen)} 심기
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="l-ledger-empty">
                      지금 심을 씨앗이 없어요.
                      <button type="button" className="l-leaf" onClick={onShop} data-testid="farm-need-seeds">
                        상점에서 씨앗 사기
                      </button>
                    </p>
                  )}
                  {offSeason.length > 0 && (
                    <p className="l-ledger-aside">
                      철 지난 씨앗은 넣어 뒀어요 ·{' '}
                      {offSeason.map((c) => `${CROP_INFO[c].name} ${seeds?.[c]}`).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </article>
          )}
          <section className="l-ledger-friends" aria-label="물이 필요한 친구 밭">
            <h4>
              <Glyph name="can" size={16} /> 친구 밭 물 주기 <small>하루 한 번씩 · 우정이 쌓여요</small>
            </h4>
            {friends.length ? (
              <ul>
                {friends.slice(0, 6).map((f) => {
                  const bed = farmBed(f.actor);
                  return (
                    <li key={f.actor} data-done={f.done || undefined}>
                      <span className="l-ledger-friend">{ACTORS[f.actor]}네</span>
                      <span>{f.done ? '오늘 물 줬어요' : `목마른 칸 ${f.need}`}</span>
                      {!f.done && bed && onWalk && (
                        <button
                          type="button"
                          className="l-ink l-small"
                          onClick={() => {
                            onClose();
                            onWalk(farmFront(bed));
                          }}
                        >
                          <Glyph name="walk" size={14} /> 가 보기
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="l-ledger-aside">지금은 목마른 친구 밭이 없어요.</p>
            )}
          </section>
          <p className="l-ledger-keys" aria-hidden="true">
            <kbd>←↑↓→</kbd> 칸 고르기 <kbd>E</kbd> 가꾸기 <kbd>1–9</kbd> 씨앗 <kbd>Esc</kbd> 덮기
          </p>
        </section>
      </div>
      {expand && nextSize ? (
        <ConfirmModal
          title="밭을 넓힐까요?"
          body={
            <>
              뒤 두둑을 갈아 <b>{nextSize}칸</b>이 돼요. <b>{formatBeom(FARM_EXPAND_PRICE[nextSize as 9 | 12])}</b>이 들어요. 지갑에{' '}
              {formatBeom(view.wallet.balance)}이 있어요.
            </>
          }
          confirmLabel="넓히기"
          busyLabel="밭 가는 중…"
          cancelLabel="다음에"
          onClose={() => setExpand(false)}
          onConfirm={() => run({ kind: 'expandFarm' }, `텃밭이 ${nextSize}칸으로 넓어졌어요!`, 'harvest')}
        />
      ) : null}
    </Modal>
  );
}
