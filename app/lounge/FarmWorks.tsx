'use client';
// 텃밭 확장 pages of the farm window (design-farming-upgrade.md §8):
//   밭 배치 — the 10 × 8 field and its front-yard spots: place / move / pick
//             up sprinklers and 덩굴 시렁 (tiles), scarecrows and bee houses
//             (front-yard spots, F2); build them; the farm's news.
//   가공    — the four work-yard slots (옹기, 숙성통, 건조기, 씨앗 제조기) and the
//             저장고 of artisan goods (sell or ship).
//   출하·품평회 — the shipping bin (sold after KST midnight) and the weekly fair
//             judged by 나세라 조합장.
// The server decides everything (lounge-farm.ts); this only sends actions.
import { useMemo, useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { CROPS, type LifeAction, type LifeView, type Quality } from '../lounge-life';
import {
  FAIR_FEE,
  FIXTURES,
  FIXTURE_BY_ID,
  MACHINES,
  MACHINE_BY_ID,
  STAR_FERT_RECIPE,
  WORK_SLOTS,
  productOf,
  sprinklerCovers,
  GRID_COLS,
  GRID_ROWS,
  tileOpen,
  tileRC,
  type Recipe,
} from '../lounge-farm-data';
import { fairScore, stockName, stockUnit, type FarmLog } from '../lounge-farm';
import { BEE_REACH, YARD_SPOTS } from '../lounge-farm-soil';
import { cropSplit, QUALITY_LABEL } from '../lounge-life-ui';
import { SKILL_INFO } from '../lounge-growth-data';
import { ORCHARD_FRUITS } from '../lounge-stage3-data';
import { itemName } from '../lounge-life-plus';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa } from '../lounge-text';
import { loungeAudio } from '../lounge-audio';
import { Panel } from '../ui/Panel';
import { GameButton } from '../ui/GameButton';
import { EmptyState } from '../ui/EmptyState';
import { KeyHintBar } from '../ui/KeyHint';
import { Glyph } from '../ui/Glyph';
import { CropStageArt, ItemIcon } from './ItemIcon';
import type { Notify } from './Toast';
import { useServerClock } from './use-server-clock';
import './farm-works.css';

export type FarmPage = 'ledger' | 'layout' | 'works' | 'market';
type Life = LifeView;
type Run = (action: LifeAction, done: string, chime?: 'plant' | 'water' | 'harvest') => Promise<boolean>;
type StockRow = { id: string; q: Quality; n: number };

/** Field rows as the field lies on 우리 농장: north (the house) on top. */
const GRID_ROWS_VIEW = Array.from({ length: GRID_ROWS }, (_, r) => Array.from({ length: GRID_COLS }, (_, c) => r * GRID_COLS + c));
const tileName = (tile: number) => `${tileRC(tile).r + 1}줄 ${tileRC(tile).c + 1}칸`;
const STAGE_TEXT = ['씨앗', '새싹', '잎', '꽃·열매', '수확'] as const;

function left(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60),
    m = minutes % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}
const clock = (at: number) => {
  const d = new Date(at + 9 * 3_600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
const qName = (q: Quality) => (q ? ` ${QUALITY_LABEL[q]}` : '');

/** Crops (by quality), fruit and artisan goods I hold, most valuable first. */
function stockRows(life: Life, now: number, goods = true): StockRow[] {
  const rows: StockRow[] = [];
  for (const crop of CROPS) {
    const split = cropSplit(life.me, crop);
    for (const q of [3, 2, 1, 0] as Quality[]) if (split[q] > 0) rows.push({ id: crop, q, n: split[q] });
  }
  if (life.me.bag.fruit > 0) rows.push({ id: 'fruit', q: 0, n: life.me.bag.fruit });
  if (goods) for (const g of life.farmx?.goods ?? []) rows.push({ id: g.id, q: g.q, n: g.n });
  const flags = life.flags ?? [];
  return rows.sort((a, b) => stockUnit(b.id, b.q, now, flags) - stockUnit(a.id, a.q, now, flags));
}
/** Why a farm build is not possible now (mirrors the server's buildBlock). */
function recipeBlock(life: Life, recipe: Recipe, balance: number): string | null {
  const lv = life.growth?.skills.find((s) => s.id === recipe.skill)?.level ?? 1;
  if (lv < recipe.level) return `${SKILL_INFO[recipe.skill].name} Lv${recipe.level}부터`;
  for (const [id, n] of Object.entries(recipe.mats)) if ((life.me.inv[id] ?? 0) < n) return '재료가 부족해요';
  if (balance < recipe.beom) return '범이 부족해요';
  return null;
}
function logText(l: FarmLog): string {
  const crop = l.crop ? stockName(l.crop) : '';
  switch (l.kind) {
    case 'crow':
      return `새벽에 까마귀가 ${josa(crop, '을/를')} 먹었어요 (${(l.tile ?? 0) + 1}번 칸)`;
    case 'guard':
      return '새벽에 까마귀가 왔다가 허수아비를 보고 돌아갔어요';
    case 'wither':
      return `철이 지나 ${josa(crop, '이/가')} 시들었어요 (${(l.tile ?? 0) + 1}번 칸)`;
    case 'giant':
      return `거대 ${crop}! ${l.n ?? 12}개를 거뒀어요`;
    case 'ship':
      return `출하 상자 ${l.n ?? 0}개가 ${formatBeom(l.beom ?? 0)}에 팔렸어요`;
    case 'help':
      return `${josa(ACTORS[l.actor ?? 0] ?? '친구', '이/가')} 밭을 거들어 ${l.n ?? 0}칸을 거둬 줬어요`;
    case 'fair':
      return `품평회 ${l.n}등 · ${crop}${l.beom ? ` · 상금 ${formatBeom(l.beom)}` : ''}`;
  }
}

function RecipeLine({ recipe }: { recipe: Recipe }) {
  return (
    <small className="l-fw-recipe">
      {SKILL_INFO[recipe.skill].name} Lv{recipe.level} · {formatBeom(recipe.beom)}
      {Object.entries(recipe.mats).map(([id, n]) => ` · ${itemName(id)} ${n}`)}
    </small>
  );
}
function BuildList({ life, items, run, busy, balance }: { life: Life; items: readonly { id: string; name: string; note: string; recipe: Recipe }[]; run: Run; busy: boolean; balance: number }) {
  return (
    <ul className="l-fw-build">
      {items.map((it) => {
        const why = recipeBlock(life, it.recipe, balance),
          have = life.me.inv[it.id] ?? 0;
        return (
          <li key={it.id}>
            <ItemIcon id={it.id} size={40} />
            <span className="l-fw-build-text">
              <b>
                {it.name}
                {have ? <em> · 가방 {have}</em> : null}
              </b>
              <small>{it.note}</small>
              <RecipeLine recipe={it.recipe} />
            </span>
            <GameButton
              size="s"
              disabled={!!why || busy}
              disabledReason={why ?? undefined}
              onClick={() => void run({ kind: 'farmBuild', item: it.id }, `${josa(it.name, '을/를')} 만들었어요. 가방에 넣었어요.`, 'plant')}
              data-testid={`farm-build-${it.id}`}
            >
              만들기
            </GameButton>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------- 밭 배치
/** A place on the layout page: a field tile (≥ 0) or a front-yard spot (−1 − spot). */
const spotSel = (spot: number) => -1 - spot;
const spotName = (spot: number) => `${YARD_SPOTS[spot].r < 0 ? '집 쪽' : '길 쪽'} 앞마당 ${spot + 1}`;
function LayoutPage({ life, run, busy, balance, now }: { life: Life; run: Run; busy: boolean; balance: number; now: number }) {
  const farm = life.me.farm,
    size = life.me.plots,
    open = (tile: number) => tileOpen(size, tile),
    fx = life.farmx?.fixtures ?? [],
    yard = life.farmx?.yard ?? [];
  const fixtureOf = (tile: number) => fx.find((f) => f.tile === tile) ?? null;
  const yardAt = (spot: number) => yard.find((f) => f.spot === spot) ?? null;
  const [sel, setSel] = useState<number>(() => {
    const first = fx[0]?.tile ?? farm.findIndex((p, i) => !p.crop && tileOpen(life.me.plots, i));
    return first >= 0 ? first : 0;
  });
  const [moving, setMoving] = useState<number | null>(null);
  const isYard = sel < 0,
    spot = -1 - sel;
  const chosen = isYard ? yardAt(spot) : fixtureOf(sel);
  /** Tiles the chosen fixture reaches (sprinklers: water; scarecrow 4; bee house 2). */
  const reach = (tile: number) => {
    if (!chosen) return false;
    const def = FIXTURE_BY_ID[chosen.kind];
    if (!isYard) return tile !== sel && !!def.water && sprinklerCovers(chosen.kind, sel, tile);
    const s = YARD_SPOTS[spot],
      { r, c } = tileRC(tile),
      d = Math.max(Math.abs(r - s.r), Math.abs(c - s.c));
    return d <= (chosen.kind === 'scarecrow' ? (def.guard ?? 0) : BEE_REACH);
  };
  const owned = FIXTURES.filter((f) => (life.me.inv[f.id] ?? 0) > 0);
  const placeable = owned.filter((f) => !!f.yard === isYard);
  const click = (target: number) => {
    if (moving !== null) {
      const from = moving;
      setMoving(null);
      if (from < 0 && target < 0 && target !== from) {
        void run({ kind: 'farmMove', from: -1 - from, to: -1 - target, area: 'yard' }, `${spotName(-1 - target)}으로 옮겼어요.`).then((ok) => ok && setSel(target));
      } else if (from >= 0 && target >= 0 && target !== from && open(target) && !farm[target].crop && !fixtureOf(target) && farm[target].trellis === undefined) {
        void run({ kind: 'farmMove', from, to: target }, `${FIXTURE_BY_ID[fixtureOf(from)!.kind].name}를 ${tileName(target)}으로 옮겼어요.`).then((ok) => ok && setSel(target));
      }
      return;
    }
    setSel(target);
  };
  const plot = isYard ? undefined : farm[sel],
    log = life.farmx?.log ?? [];
  const where = isYard ? spotName(spot) : tileName(sel);
  const yardRow = (side: number) => {
    const cells = Array.from({ length: GRID_COLS }, (_, c) => YARD_SPOTS.findIndex((s) => s.r === side && s.c === c));
    return (
      <div className="l-fw-row" role="row" data-part="yard">
        {cells.map((k, c) => {
          if (k < 0) return <span key={c} className="l-fw-tile" data-state="spacer" aria-hidden="true" />;
          const f = yardAt(k);
          return (
            <button
              key={c}
              type="button"
              role="gridcell"
              className="l-fw-tile"
              data-state={f ? 'yard' : 'yard-empty'}
              data-target={(moving !== null && moving < 0 && moving !== spotSel(k)) || undefined}
              aria-selected={sel === spotSel(k)}
              aria-label={`${spotName(k)} · ${f ? FIXTURE_BY_ID[f.kind].name : '빈 자리'}`}
              onClick={() => click(spotSel(k))}
              data-testid={`farm-yard-${k}`}
            >
              {f ? <ItemIcon id={f.kind} size={26} /> : <Glyph name="pin" size={12} />}
            </button>
          );
        })}
      </div>
    );
  };
  return (
    <div className="l-fw-cols">
      <section className="l-fw-yard" aria-label="밭 격자">
        <p className="l-fw-hint">
          <Glyph name="grid" size={16} /> 스프링클러와 덩굴 시렁은 밭 칸에, 허수아비와 벌통은 밭 가장자리 앞마당 자리에 놓아요.
        </p>
        <div className="l-fw-grid" role="grid" aria-label={`밭 ${size}칸과 앞마당`}>
          <div className="l-fw-bed l-fw-field" data-bed="field">
            <span className="l-fw-bedname">집 앞 밭 (위쪽이 집)</span>
            {yardRow(-1)}
            {GRID_ROWS_VIEW.map((row, r) => (
              <div key={r} className="l-fw-row" role="row">
                {row.map((tile) => {
                  const p = farm[tile],
                    f = fixtureOf(tile);
                  if (!p || !open(tile))
                    return (
                      <span key={tile} className="l-fw-tile" data-state="fallow" aria-hidden="true">
                        <Glyph name="lock" size={10} />
                      </span>
                    );
                  const grass = !p.t && !p.crop && !p.dead && !f;
                  const state = f ? 'fixture' : p.crop ? 'crop' : p.dead ? 'dead' : grass ? 'grass' : 'empty';
                  return (
                    <button
                      key={tile}
                      type="button"
                      role="gridcell"
                      className="l-fw-tile"
                      data-state={state}
                      data-reach={reach(tile) || undefined}
                      data-target={(moving !== null && moving >= 0 && state !== 'fixture' && state !== 'crop' && p.trellis === undefined) || undefined}
                      data-wet={(p.crop && (p.wateredAt !== null || p.rained)) || undefined}
                      data-trellis={p.trellis !== undefined || undefined}
                      aria-selected={sel === tile}
                      aria-label={`${tileName(tile)} · ${f ? FIXTURE_BY_ID[f.kind].name : p.crop ? itemName(p.crop) : p.dead ? '시든 작물' : grass ? '풀밭' : '빈 흙'}${p.trellis !== undefined ? ' · 덩굴 시렁' : ''}`}
                      onClick={() => click(tile)}
                      data-testid={`farm-tile-${tile}`}
                    >
                      {f ? <ItemIcon id={f.kind} size={26} /> : p.crop ? <CropStageArt crop={p.crop} stage={p.stage} size={28} /> : null}
                      {p.sprinkled && !f ? (
                        <span className="l-fw-mark" data-kind="water">
                          <Glyph name="drop" size={12} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
            {yardRow(GRID_ROWS)}
          </div>
        </div>
        {moving !== null && (
          <p className="l-fw-moving" role="status">
            <Glyph name="arrow" size={14} /> {moving < 0 ? '옮길 앞마당 자리를 누르세요' : '옮길 빈 칸을 누르세요'} · 같은 곳을 다시 누르면 그만둬요
          </p>
        )}
      </section>

      <section className="l-fw-side" aria-label="고른 칸">
        <Panel variant="note" title={where} className="l-fw-card">
          {!isYard && !open(sel) ? (
            <EmptyState glyph="lock" title="아직 밭 밖이에요" hint="텃밭 장부에서 밭을 넓히면 이 칸을 써요." />
          ) : chosen ? (
            <div className="l-fw-detail">
              <p className="l-fw-title">
                <ItemIcon id={chosen.kind} size={36} /> <b>{FIXTURE_BY_ID[chosen.kind].name}</b>
              </p>
              <p>{FIXTURE_BY_ID[chosen.kind].note}</p>
              {chosen.kind === 'beehouse' && chosen.readyAt !== undefined && (
                <p>{now >= chosen.readyAt ? '꿀이 다 찼어요.' : `다음 꿀까지 ${left(chosen.readyAt - now)}`}</p>
              )}
              <div className="l-fw-actions">
                {chosen.kind === 'beehouse' && chosen.readyAt !== undefined && now >= chosen.readyAt && (
                  <GameButton
                    variant="primary"
                    size="s"
                    glyph="basket"
                    disabled={busy}
                    onClick={() => void run(isYard ? { kind: 'farmCollect', yard: spot } : { kind: 'farmCollect', tile: sel }, '꿀 한 병을 저장고에 담았어요.', 'harvest')}
                  >
                    꿀 거두기
                  </GameButton>
                )}
                <GameButton size="s" glyph="arrow" disabled={busy} onClick={() => setMoving(sel)} data-testid="farm-move">
                  옮기기
                </GameButton>
                <GameButton
                  size="s"
                  variant="ghost"
                  glyph="bag"
                  disabled={busy}
                  onClick={() => void run(isYard ? { kind: 'farmPickup', yard: spot } : { kind: 'farmPickup', tile: sel }, `${FIXTURE_BY_ID[chosen.kind].name}를 가방에 넣었어요.`)}
                >
                  가방에 넣기
                </GameButton>
              </div>
            </div>
          ) : plot?.trellis !== undefined && !plot?.crop ? (
            <div className="l-fw-detail">
              <p className="l-fw-title">
                <ItemIcon id="trellis" size={36} /> <b>덩굴 시렁</b>
              </p>
              <p>{FIXTURE_BY_ID.trellis.note}</p>
              <div className="l-fw-actions">
                <GameButton size="s" variant="ghost" glyph="bag" disabled={busy} onClick={() => void run({ kind: 'farmPickup', tile: sel }, '덩굴 시렁을 가방에 넣었어요.')}>
                  가방에 넣기
                </GameButton>
              </div>
            </div>
          ) : plot?.crop ? (
            <div className="l-fw-detail">
              <p className="l-fw-title">
                <CropStageArt crop={plot.crop} stage={plot.stage} size={36} /> <b>{itemName(plot.crop)}</b> <small>{STAGE_TEXT[plot.growth ?? 0]}</small>
              </p>
              <p>작물이 자라는 칸이에요. 거둔 뒤에 설비를 놓을 수 있어요.</p>
              {plot.witherAt ? <p>철이 지나 {clock(plot.witherAt)}에 시들어요.</p> : null}
              {plot.sl ? <p>앞 칸 지지대 작물의 그늘 때문에 {plot.sl}% 늦게 자라요.</p> : null}
            </div>
          ) : placeable.length ? (
            <div className="l-fw-detail">
              <p>
                {plot?.dead ? `시든 ${itemName(plot.dead)}를 치우고 ` : ''}여기에 놓을 설비를 고르세요.
                {!isYard && placeable.some((f) => f.span) ? ' 덩굴 시렁은 이 칸부터 오른쪽으로 3칸에 걸쳐요.' : ''}
              </p>
              <ul className="l-fw-pick">
                {placeable.map((f) => (
                  <li key={f.id}>
                    <GameButton
                      size="s"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          isYard ? { kind: 'farmPlace', item: f.id, yard: spot } : { kind: 'farmPlace', item: f.id, tile: sel },
                          `${where}에 ${josa(f.name, '을/를')} 놓았어요.`,
                          'plant',
                        )
                      }
                      data-testid={`farm-place-${f.id}`}
                    >
                      <ItemIcon id={f.id} size={24} /> {f.name} <small>{life.me.inv[f.id]}</small>
                    </GameButton>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <EmptyState
              glyph="hammer"
              title={isYard ? '앞마당에 놓을 설비가 없어요' : '밭 칸에 놓을 설비가 없어요'}
              hint={isYard ? '허수아비나 벌통을 만들면 여기 놓을 수 있어요.' : '스프링클러나 덩굴 시렁을 만들면 여기 놓을 수 있어요.'}
            />
          )}
        </Panel>
        <Panel variant="note" title="설비 만들기" className="l-fw-card">
          <BuildList
            life={life}
            run={run}
            busy={busy}
            balance={balance}
            items={[...FIXTURES, { id: 'fertilizer-star', name: '별빛 비료', note: '품질 3단계 · 별빛 작물이 나올 수 있어요', recipe: STAR_FERT_RECIPE }]}
          />
        </Panel>
        <Panel variant="note" title="밭 소식" className="l-fw-card">
          {log.length ? (
            <ul className="l-fw-log">
              {[...log].reverse().map((l, i) => (
                <li key={i}>
                  <time>{clock(l.at)}</time> {logText(l)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="l-fw-hint">아직 조용해요. 까마귀가 오거나 철이 바뀌면 여기에 적혀요.</p>
          )}
        </Panel>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- 가공
function WorksPage({ life, run, busy, balance, now }: { life: Life; run: Run; busy: boolean; balance: number; now: number }) {
  const machines = life.farmx?.machines ?? [],
    ownedMachines = MACHINES.filter((m) => (life.me.inv[m.id] ?? 0) > 0),
    goods = life.farmx?.goods ?? [],
    flags = life.flags ?? [];
  const readyMachines = machines.filter((m) => m.out && (m.doneAt ?? Infinity) <= now).length,
    readyBees = (life.farmx?.fixtures ?? []).filter((f) => f.kind === 'beehouse' && (f.readyAt ?? Infinity) <= now).length;
  // 과수원 fruit (bag items) go in the jar, keg and dryer like other fruit.
  const orchard: StockRow[] = ORCHARD_FRUITS.flatMap((id) => ((life.me.inv[id] ?? 0) > 0 ? [{ id, q: 0 as Quality, n: life.me.inv[id] }] : []));
  const inputs = (kind: (typeof MACHINES)[number]['id']) =>
    [...stockRows(life, now, false), ...orchard]
      .filter((r) => (kind === 'seedmaker' ? (CROPS as readonly string[]).includes(r.id) : !!productOf(kind, r.id)))
      .filter((r) => r.n >= MACHINE_BY_ID[kind].per);
  return (
    <div className="l-fw-cols">
      <section className="l-fw-yard" aria-label="작업 마당">
        <header className="l-fw-head">
          <p className="l-fw-hint">
            <Glyph name="pot" size={16} /> 장독대 옆 작업 마당 {WORK_SLOTS}자리. 넣은 작물의 품질이 가공품에 그대로 이어져요.
          </p>
          <GameButton
            variant="primary"
            size="s"
            glyph="basket"
            disabled={busy || !(readyMachines + readyBees)}
            onClick={() => void run({ kind: 'farmCollect', slot: -1 }, `${readyMachines + readyBees}개를 저장고에 담았어요.`, 'harvest')}
            data-testid="farm-collect-all"
          >
            모두 거두기{readyMachines + readyBees ? ` ${readyMachines + readyBees}` : ''}
          </GameButton>
        </header>
        <ol className="l-fw-slots">
          {Array.from({ length: WORK_SLOTS }, (_, slot) => {
            const m = machines.find((x) => x.slot === slot);
            if (!m)
              return (
                <li key={slot} className="l-fw-slot" data-state="empty">
                  <span className="l-fw-slot-name">{slot + 1}번 자리 · 비어 있음</span>
                  {ownedMachines.length ? (
                    <span className="l-fw-actions">
                      {ownedMachines.map((d) => (
                        <GameButton key={d.id} size="s" disabled={busy} onClick={() => void run({ kind: 'farmPlace', item: d.id, slot }, `${slot + 1}번 자리에 ${josa(d.name, '을/를')} 놓았어요.`)} data-testid={`farm-slot-${slot}-${d.id}`}>
                          <ItemIcon id={d.id} size={22} /> {d.name}
                        </GameButton>
                      ))}
                    </span>
                  ) : (
                    <small className="l-fw-hint">오른쪽에서 기계를 만들면 여기 놓을 수 있어요.</small>
                  )}
                </li>
              );
            const def = MACHINE_BY_ID[m.kind],
              done = !!m.out && (m.doneAt ?? Infinity) <= now,
              working = !!m.out && !done;
            return (
              <li key={slot} className="l-fw-slot" data-state={done ? 'done' : working ? 'working' : 'idle'} data-testid={`farm-slot-${slot}`}>
                <span className="l-fw-slot-name">
                  <ItemIcon id={m.kind} size={34} /> {def.name}
                </span>
                {m.out ? (
                  <span className="l-fw-slot-out">
                    <ItemIcon id={m.out} size={30} quality={m.q} />
                    <span>
                      <b>
                        {m.out.startsWith('seed-') ? `${itemName(m.out.slice(5))} 씨앗 ${m.n ?? 1}봉` : `${stockName(m.out)}${qName(m.q ?? 0)}`}
                      </b>
                      <small>{done ? '다 됐어요' : `${left((m.doneAt ?? now) - now)} 남음`}</small>
                    </span>
                    {working && m.startAt !== undefined && m.doneAt !== undefined ? (
                      <progress max={m.doneAt - m.startAt} value={Math.max(0, now - m.startAt)} aria-label="가공 진행" />
                    ) : null}
                    {done && (
                      <GameButton variant="primary" size="s" glyph="basket" disabled={busy} onClick={() => void run({ kind: 'farmCollect', slot }, '저장고에 담았어요.', 'harvest')}>
                        거두기
                      </GameButton>
                    )}
                  </span>
                ) : (
                  <span className="l-fw-slot-in">
                    <small>{def.note}</small>
                    {inputs(m.kind).length ? (
                      <span className="l-fw-actions">
                        {inputs(m.kind)
                          .slice(0, 6)
                          .map((r) => (
                            <GameButton
                              key={`${r.id}@${r.q}`}
                              size="s"
                              disabled={busy}
                              onClick={() =>
                                void run(
                                  { kind: 'farmLoad', slot, item: r.id, q: r.q },
                                  `${def.name}에 ${itemName(r.id)}${qName(r.q)} ${def.per}개를 넣었어요.`,
                                  'plant',
                                )
                              }
                              data-testid={`farm-load-${slot}-${r.id}`}
                            >
                              <ItemIcon id={r.id} size={22} quality={r.q || undefined} /> {itemName(r.id)} <small>{r.n}</small>
                            </GameButton>
                          ))}
                      </span>
                    ) : (
                      <small className="l-fw-hint">넣을 작물이 가방에 없어요{def.per > 1 ? ` (${def.per}개 필요)` : ''}.</small>
                    )}
                    <GameButton size="s" variant="ghost" glyph="bag" disabled={busy} onClick={() => void run({ kind: 'farmPickup', slot }, `${josa(def.name, '을/를')} 가방에 넣었어요.`)}>
                      치우기
                    </GameButton>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <Panel variant="note" title="저장고" className="l-fw-card">
          {goods.length ? (
            <ul className="l-fw-goods">
              {goods.map((g) => {
                const unit = stockUnit(g.id, g.q, now, flags);
                return (
                  <li key={`${g.id}@${g.q}`}>
                    <ItemIcon id={g.id} size={36} quality={g.q || undefined} />
                    <span>
                      <b>
                        {stockName(g.id)}
                        {qName(g.q)}
                      </b>
                      <small>
                        {g.n}개 · 여기서 팔면 한 개 {formatBeom(Math.round(unit * 0.85))} (농협 창구 {formatBeom(unit)})
                      </small>
                    </span>
                    <span className="l-fw-actions">
                      <GameButton size="s" disabled={busy} onClick={() => void run({ kind: 'sellGoods', item: g.id, q: g.q, n: 1 }, `${stockName(g.id)} 하나를 팔았어요.`)}>
                        하나 팔기
                      </GameButton>
                      <GameButton size="s" variant="ghost" glyph="sack" disabled={busy} onClick={() => void run({ kind: 'ship', item: g.id, q: g.q, n: g.n }, `${stockName(g.id)} ${g.n}개를 출하 상자에 넣었어요.`)}>
                        출하 상자에
                      </GameButton>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState glyph="pot" title="저장고가 비어 있어요" hint="기계에서 거둔 잼·술·말린 것·꿀이 여기 쌓여요." />
          )}
        </Panel>
      </section>
      <section className="l-fw-side">
        <Panel variant="note" title="기계 만들기" className="l-fw-card">
          <BuildList life={life} run={run} busy={busy} balance={balance} items={MACHINES} />
        </Panel>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- 출하·품평회
function MarketPage({ life, run, busy, balance, now }: { life: Life; run: Run; busy: boolean; balance: number; now: number }) {
  const bin = life.farmx?.bin ?? null,
    fair = life.fair,
    rows = stockRows(life, now),
    flags = life.flags ?? [];
  const [pick, setPick] = useState<string | null>(null);
  const entry = rows.find((r) => `${r.id}@${r.q}` === pick) ?? rows[0] ?? null;
  return (
    <div className="l-fw-cols">
      <section className="l-fw-yard" aria-label="출하 상자">
        <Panel variant="note" title="출하 상자" className="l-fw-card">
          <p className="l-fw-hint">
            <Glyph name="sunrise" size={16} /> 자정이 지나 처음 무엇이든 하면 팔려요. 그날 시장의 첫 판매로 쳐요. 자정 전에는 도로 꺼낼 수 있어요.
          </p>
          {bin?.items.length ? (
            <>
              <ul className="l-fw-goods" data-testid="farm-bin">
                {bin.items.map((it) => (
                  <li key={`${it.id}@${it.q}`}>
                    <ItemIcon id={it.id} size={32} quality={it.q || undefined} />
                    <span>
                      <b>
                        {stockName(it.id)}
                        {qName(it.q)}
                      </b>
                      <small>{it.n}개</small>
                    </span>
                    <GameButton size="s" variant="ghost" disabled={busy} onClick={() => void run({ kind: 'unship', item: it.id, q: it.q, n: it.n }, '상자에서 꺼냈어요.')}>
                      꺼내기
                    </GameButton>
                  </li>
                ))}
              </ul>
              <p className="l-fw-sum">
                정가로 {formatBeom(bin.value)}어치 · {clock(bin.payAt)} 이후 정산 <small>(수요 곡선 때문에 실제로는 조금 적어요)</small>
              </p>
            </>
          ) : (
            <EmptyState glyph="sack" title="상자가 비어 있어요" hint="아래에서 작물이나 가공품을 넣어 두세요." />
          )}
        </Panel>
        <Panel variant="note" title="넣을 수 있는 것" className="l-fw-card">
          {rows.length ? (
            <ul className="l-fw-goods">
              {rows.slice(0, 14).map((r) => (
                <li key={`${r.id}@${r.q}`}>
                  <ItemIcon id={r.id} size={30} quality={r.q || undefined} />
                  <span>
                    <b>
                      {stockName(r.id)}
                      {qName(r.q)}
                    </b>
                    <small>
                      {r.n}개 · 정가 {formatBeom(stockUnit(r.id, r.q, now, flags))}
                    </small>
                  </span>
                  <span className="l-fw-actions">
                    <GameButton size="s" disabled={busy} onClick={() => void run({ kind: 'ship', item: r.id, q: r.q, n: 1 }, `${stockName(r.id)} 하나를 상자에 넣었어요.`)}>
                      1개
                    </GameButton>
                    <GameButton size="s" disabled={busy || r.n < 2} onClick={() => void run({ kind: 'ship', item: r.id, q: r.q, n: r.n }, `${stockName(r.id)} ${r.n}개를 상자에 넣었어요.`)} data-testid={`farm-ship-${r.id}-${r.q}`}>
                      모두
                    </GameButton>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState glyph="basket" title="팔 것이 없어요" hint="작물을 거두거나 가공품을 만들면 여기에 떠요." />
          )}
        </Panel>
      </section>
      <section className="l-fw-side" aria-label="품평회">
        <Panel variant="note" title="이번 주 품평회" className="l-fw-card">
          {fair ? (
            <>
              <p className="l-fw-hint">
                <Glyph name="award" size={16} /> 심사 {fair.judge.name} {fair.judge.role} · {clock(fair.judgeAt)} · 참가비 {formatBeom(fair.fee)}. 상금은 모인 참가비에서 1·2·3등이 50·30·20%씩 받아요. 낸 물건은 조합에 기증돼요.
              </p>
              {fair.entries.length ? (
                <ol className="l-fw-entries">
                  {[...fair.entries]
                    .sort((a, b) => b.score - a.score)
                    .map((e) => (
                      <li key={e.actor}>
                        <ItemIcon id={e.item} size={28} quality={e.q || undefined} />
                        <b>{ACTORS[e.actor]}</b> {stockName(e.item)}
                        {qName(e.q)} <small>{e.score.toLocaleString('en-US')}점</small>
                      </li>
                    ))}
                </ol>
              ) : (
                <p className="l-fw-hint">아직 아무도 내지 않았어요.</p>
              )}
              {fair.entered ? (
                <p className="l-fw-sum">이번 주에는 이미 냈어요. 월요일 0시 뒤에 결과가 나와요.</p>
              ) : entry ? (
                <div className="l-fw-enter">
                  <label>
                    <span>낼 물건</span>
                    <select value={`${entry.id}@${entry.q}`} onChange={(e) => setPick(e.target.value)} data-testid="farm-fair-pick">
                      {rows.slice(0, 20).map((r) => (
                        <option key={`${r.id}@${r.q}`} value={`${r.id}@${r.q}`}>
                          {stockName(r.id)}
                          {qName(r.q)} · {fairScore(r.id, r.q, now, flags).toLocaleString('en-US')}점
                        </option>
                      ))}
                    </select>
                  </label>
                  <GameButton
                    variant="primary"
                    size="s"
                    glyph="award"
                    disabled={busy || balance < FAIR_FEE}
                    disabledReason={balance < FAIR_FEE ? '범이 부족해요' : undefined}
                    onClick={() => void run({ kind: 'fairEnter', item: entry.id, q: entry.q }, `품평회에 ${josa(stockName(entry.id), '을/를')} 냈어요.`, 'harvest')}
                    data-testid="farm-fair-enter"
                  >
                    출품하기 · {formatBeom(FAIR_FEE)}
                  </GameButton>
                </div>
              ) : (
                <p className="l-fw-hint">낼 작물이나 가공품이 없어요.</p>
              )}
              {fair.results.length > 0 && (
                <details className="l-fw-results">
                  <summary>지난 결과</summary>
                  <ul>
                    {[...fair.results].reverse().map((r) => (
                      <li key={r.week}>
                        <b>{r.entrants}명 참가</b>
                        {r.ranks.map((k, i) => (
                          <span key={i}>
                            {i + 1}등 {ACTORS[k.actor]} · {stockName(k.item)}
                            {qName(k.q)}
                            {k.prize ? ` · ${formatBeom(k.prize)}` : ''}
                          </span>
                        ))}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          ) : (
            <EmptyState glyph="award" title="품평회 소식을 기다리는 중" hint="서버와 연결되면 이번 주 품평회가 보여요." />
          )}
        </Panel>
      </section>
    </div>
  );
}

/** One page of the farm window other than the ledger. */
export function FarmWorks({ page, room, view, notify }: { page: Exclude<FarmPage, 'ledger'>; room: CloudRoom; view: CloudRoomView; notify: Notify }) {
  const life = view.life;
  const deadlines = useMemo(
    () => [
      ...(life?.farmx?.machines.map((m) => m.doneAt) ?? []),
      ...(life?.farmx?.fixtures.map((f) => f.readyAt) ?? []),
      ...(life?.me.farm.map((p) => p.readyAt) ?? []),
    ],
    [life],
  );
  const now = useServerClock(view.clockOffset, deadlines, 15_000);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const run: Run = async (action, done, chime) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try {
      const ok = await room.life(action);
      if (ok) {
        if (done) notify(done);
        if (chime) loungeAudio.chime(chime);
      }
      return ok;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  if (!life?.farmx)
    return <EmptyState glyph="sprout" title="마을에 연결되면 농장 설비를 볼 수 있어요" hint="잠시 뒤에 다시 열어 주세요." />;
  const balance = view.wallet.balance;
  const props = { life, run, busy, balance, now };
  return (
    <div className="l-fw" aria-busy={busy} data-testid={`farm-works-${page}`}>
      {page === 'layout' ? <LayoutPage {...props} /> : page === 'works' ? <WorksPage {...props} /> : <MarketPage {...props} />}
      <KeyHintBar
        className="l-fw-keys"
        items={[
          { keys: [{ code: 'Tab' }], does: '다음 칸·버튼' },
          { keys: [{ code: 'Enter' }], does: '고르기' },
          { keys: [{ code: 'Escape' }], does: '덮기' },
        ]}
      />
    </div>
  );
}
