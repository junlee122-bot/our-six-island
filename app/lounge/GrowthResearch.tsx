'use client';
// 마을 개척 (성장 P1): the shared research map drawn as a surveyor's chart —
// nine sites linked by their prerequisites, the open one with its 범 purse,
// material crates and the seven friends' seals. Used by the 성장 창 (T, tab 3)
// and the village board's “개척” tab. Only “대장간 재건” is live in P1; later
// sites show their region preview as 준비 중.
import { useMemo, useState, type KeyboardEvent } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  RESEARCH,
  RESEARCH_BY_ID,
  RESEARCH_HELPERS,
  RESEARCH_MIN_BEOM,
  RESEARCH_RELAX_DAYS,
} from '../lounge-growth-data';
import type { ResearchView } from '../lounge-growth';
import { ITEM_BY_ID } from '../lounge-items';
import { ACTORS, ACTOR_COLORS } from '../lounge-roster';
import { formatBeom, josa } from '../lounge-text';
import { lifeSfx } from '../lounge-audio-life';
import { ItemIcon } from './ItemIcon';
import { Glyph } from './field-glyphs';
import type { Notify } from './Toast';
import { useLifeAction } from './LifePanels';
import './farm-fish.css';
import './growth.css';

/** Chart position (column, row) of each site: prerequisites flow left to right. */
const MAP_AT: Record<string, [number, number]> = {
  forge: [0, 1.4],
  trail: [1, 1.4],
  lift: [2, 0.5],
  orchardHill: [2, 2.4],
  weather: [3, 0],
  onsen: [3, 1.1],
  ranch: [3, 2.4],
  deep: [4, 1.1],
  ferry: [4, 2.4],
};
const COL_W = 150,
  ROW_H = 58,
  PAD_X = 64,
  PAD_Y = 34;
const at = (id: string) => {
  const [c, r] = MAP_AT[id] ?? [0, 0];
  return { x: PAD_X + c * COL_W, y: PAD_Y + r * ROW_H };
};
const GIVE_STEPS = [1_000, 10_000, 50_000];
const stepLabel = (v: number) => (v >= 10_000 ? `${v / 10_000}만` : `${v / 1_000}천`);

type SiteState = 'done' | 'waiting' | 'open' | 'locked' | 'soon';
function siteState(r: ResearchView | undefined, live: boolean): SiteState {
  if (r?.done) return 'done';
  if (r?.full) return 'waiting';
  if (!live) return 'soon';
  return r?.open ? 'open' : 'locked';
}
const STATE_WORD: Record<SiteState, string> = {
  done: '완공',
  waiting: '완공 대기',
  open: '모으는 중',
  locked: '잠김',
  soon: '준비 중',
};
function hoursLeft(ms: number) {
  const h = Math.max(0, Math.ceil(ms / 3_600_000));
  return h >= 24 ? `${Math.ceil(h / 24)}일` : `${h}시간`;
}

export function ResearchBoard({
  room,
  view,
  notify,
  compact = false,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  /** Inside the 성장 창 (less intro text). */
  compact?: boolean;
}) {
  const life = view.life;
  const growth = life?.growth;
  const list = growth?.research;
  const byId = useMemo(() => Object.fromEntries((list ?? []).map((r) => [r.id, r])), [list]);
  const firstOpen = RESEARCH.find((d) => byId[d.id] && !byId[d.id].done && d.live)?.id ?? 'forge';
  const [picked, setPicked] = useState<string>(firstOpen);
  const [step, setStep] = useState(10_000);
  const [run, busy] = useLifeAction(room, notify);
  if (!life || !growth)
    return <p className="l-help-text">서버가 업데이트되면 마을 개척을 시작할 수 있어요. 잠시 뒤 다시 열어 주세요.</p>;
  const def = RESEARCH_BY_ID[picked] ?? RESEARCH[0];
  const r = byId[def.id];
  const state = siteState(r, def.live);
  const now = life.serverNow;
  const me = life.actors[view.self] ?? -1;
  const beomLeft = Math.max(0, def.beom - (r?.got ?? 0));
  const reserve = (r ? r.missing : RESEARCH_HELPERS) - (r && r.helpers.includes(me) ? 0 : 1);
  const beomRoom = Math.max(0, beomLeft - Math.max(0, reserve) * RESEARCH_MIN_BEOM);
  const amount = Math.max(Math.min(RESEARCH_MIN_BEOM, beomRoom), Math.min(step, beomRoom));
  const balance = view.wallet.balance;
  const inv = life.me.inv ?? {};
  const give = async (action: { beom?: number; item?: string; n?: number }, label: string) => {
    const ok = await run({ kind: 'research', project: def.id, ...action }, `${def.name}에 ${label} 보탰어요.`);
    if (ok) lifeSfx('donate');
  };
  const move = (d: number) => {
    const ids = RESEARCH.map((x) => x.id);
    const i = ids.indexOf(def.id);
    setPicked(ids[(i + d + ids.length) % ids.length]);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (t.closest('input')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(-1);
    else return;
    e.preventDefault();
    e.stopPropagation();
  };
  const width = PAD_X * 2 + COL_W * 4,
    height = PAD_Y * 2 + ROW_H * 2.4;
  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- Arrow keys move between sites; every control is a button.
    <div className="l-research" data-compact={compact || undefined} onKeyDown={onKey} data-testid="research-board">
      {!compact && (
        <p className="l-modal-intro">
          <Glyph name="sign" /> 범과 재료를 모아 마을을 넓혀요. 서로 다른 친구 {RESEARCH_HELPERS}명이 보태야 끝나고(시작하고 {RESEARCH_RELAX_DAYS}일이
          지나면 조건이 풀려요), 다 모이면 다음 날 아침 6시에 완공돼요.
        </p>
      )}
      <div className="l-research-chart" role="listbox" aria-label="마을 개척 지도 (방향키로 고르기)">
        <svg viewBox={`0 0 ${width} ${height}`} className="l-research-lines" aria-hidden="true">
          {RESEARCH.flatMap((d) =>
            d.requires.map((req) => {
              const a = at(req),
                b = at(d.id);
              const lit = byId[req]?.done;
              return (
                <path
                  key={req + d.id}
                  d={`M${a.x + 44} ${a.y} C${a.x + 90} ${a.y} ${b.x - 90} ${b.y} ${b.x - 44} ${b.y}`}
                  className={lit ? 'l-research-road' : 'l-research-trail'}
                />
              );
            }),
          )}
        </svg>
        {RESEARCH.map((d) => {
          const rv = byId[d.id],
            st = siteState(rv, d.live),
            p = at(d.id);
          const pct = rv ? Math.round(((Math.min(rv.got, d.beom) / d.beom) * 0.5 + matShare(d.mats, rv.mat) * 0.5) * 100) : 0;
          return (
            <button
              key={d.id}
              type="button"
              role="option"
              aria-selected={picked === d.id}
              className="l-research-site"
              data-state={st}
              style={{ left: `${(p.x / width) * 100}%`, top: `${(p.y / height) * 100}%` }}
              onClick={() => setPicked(d.id)}
              data-testid={`research-${d.id}`}
              data-tip={`${d.code} ${d.name} · ${STATE_WORD[st]}`}
            >
              <span className="l-research-pin" aria-hidden="true">
                {st === 'done' ? <Glyph name="spark" size={16} /> : st === 'soon' || st === 'locked' ? <Glyph name="lock" size={15} /> : <Glyph name="anvil" size={16} />}
              </span>
              <b>{d.name}</b>
              <small>{st === 'open' ? `${pct}%` : STATE_WORD[st]}</small>
            </button>
          );
        })}
      </div>
      <section className="l-research-card" data-state={state} aria-live="polite" data-testid="research-detail">
        <header>
          <span className="l-research-code">{def.code}</span>
          <h3>{def.name}</h3>
          <span className="l-research-stamp" data-state={state}>
            {STATE_WORD[state]}
          </span>
        </header>
        <p className="l-research-opens">
          <Glyph name="sign" size={16} /> {def.opens}
        </p>
        <p className="l-research-preview">{def.preview}</p>
        {def.requires.length > 0 && state !== 'done' && (
          <p className="l-research-req">
            먼저: {def.requires.map((q) => RESEARCH_BY_ID[q].name).join(' · ')}
            {def.requiresFlag ? ' · 꾸러미 “마을 기금”(선착장)' : ''}
          </p>
        )}
        {state === 'soon' ? (
          <p className="l-research-soon">
            <Glyph name="lock" size={15} /> 이 개척지는 다음 업데이트에서 열려요. 필요한 것: {formatBeom(def.beom)} ·{' '}
            {Object.entries(def.mats)
              .map(([id, n]) => `${ITEM_BY_ID[id]?.name ?? id} ${n}`)
              .join(' · ')}
          </p>
        ) : (
          <>
            <ul className="l-research-slots">
              <li data-full={beomLeft === 0 || undefined}>
                <span className="l-research-purse" aria-hidden="true">
                  <Glyph name="sack" size={30} />
                </span>
                <span className="l-research-slot-text">
                  <strong>공사비</strong>
                  <span className="l-research-bar" style={{ ['--p' as string]: `${Math.min(100, ((r?.got ?? 0) / def.beom) * 100)}%` }} />
                  <small data-testid="research-beom">
                    {formatBeom(r?.got ?? 0)} / {formatBeom(def.beom)}
                    {beomLeft ? ` · 남은 ${formatBeom(beomLeft)}` : ' · 다 모았어요'}
                  </small>
                </span>
                {state === 'open' && beomLeft > 0 && (
                  <span className="l-research-give">
                    {beomRoom > 0 ? (
                      <>
                        <span className="l-beom-steps" role="group" aria-label="보탤 범">
                          {[...GIVE_STEPS.filter((v) => v < beomRoom), beomRoom]
                            .filter((v, i, a) => a.indexOf(v) === i)
                            .map((v) => (
                              <button key={v} type="button" aria-pressed={amount === v} onClick={() => setStep(v)}>
                                {GIVE_STEPS.includes(v) ? stepLabel(v) : `남은 ${formatBeom(v)}`}
                              </button>
                            ))}
                        </span>
                        <button
                          type="button"
                          className="l-leaf"
                          disabled={busy || balance < amount}
                          onClick={() => void give({ beom: amount }, josa(formatBeom(amount), '을/를'))}
                          data-testid="research-give-beom"
                        >
                          보태기
                        </button>
                      </>
                    ) : (
                      <small className="l-why">마지막 {formatBeom(beomLeft)}은 새 친구 몫이에요</small>
                    )}
                  </span>
                )}
              </li>
              {Object.entries(def.mats).map(([id, need]) => {
                const got = r?.mat[id] ?? 0,
                  left = Math.max(0, need - got),
                  have = inv[id] ?? 0,
                  n = Math.min(left, have);
                return (
                  <li key={id} data-full={left === 0 || undefined}>
                    <ItemIcon id={id} size={36} />
                    <span className="l-research-slot-text">
                      <strong>{ITEM_BY_ID[id]?.name ?? id}</strong>
                      <span className="l-research-bar" data-kind="mat" style={{ ['--p' as string]: `${(got / need) * 100}%` }} />
                      <small>
                        {got}/{need}개{left ? ` · 나는 ${have}개` : ' · 다 모았어요'}
                      </small>
                    </span>
                    {state === 'open' && left > 0 && (
                      <span className="l-research-give">
                        {have >= 10 && n > 10 && (
                          <button type="button" className="l-ink l-small" disabled={busy} onClick={() => void give({ item: id, n: 10 }, `${ITEM_BY_ID[id]?.name} 10개를`)}>
                            10개
                          </button>
                        )}
                        <button
                          type="button"
                          className="l-leaf l-small"
                          disabled={busy || n < 1}
                          onClick={() => void give({ item: id, n }, `${ITEM_BY_ID[id]?.name} ${n}개를`)}
                          data-testid={`research-give-${id}`}
                        >
                          {n ? `${n}개 모두` : '없어요'}
                        </button>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="l-research-helpers" data-testid="research-helpers">
              <span className="l-research-seals" aria-label="보탠 친구">
                {ACTORS.map((name, a) => {
                  const helped = r?.helpers.includes(a);
                  return (
                    <span
                      key={name}
                      className="l-research-seal"
                      data-on={helped || undefined}
                      style={{ ['--c' as string]: ACTOR_COLORS[a] }}
                      data-tip={`${name}${helped ? ' · 보탰어요' : ''}`}
                    >
                      {name.slice(0, 1)}
                    </span>
                  );
                })}
              </span>
              <small>
                {state === 'done'
                  ? `완공! 보탠 친구 ${r?.helpers.length ?? 0}명 모두 “마을 공사 현판”을 받았어요.`
                  : state === 'waiting'
                    ? `다 모였어요! ${hoursLeft((r?.doneAt ?? now) - now)} 뒤 아침 6시에 완공돼요.`
                    : r && r.missing > 0
                      ? `마지막 한 사람을 기다려요 · ${r.missing}명 더${r.relaxAt ? ` (${hoursLeft(r.relaxAt - now)} 뒤에는 조건이 풀려요)` : ''}`
                      : r
                        ? `${r.helpers.length}명이 보탰어요${r.mine ? ` · 나는 ${r.mine}번` : ''}`
                        : `아직 아무도 보태지 않았어요. ${josa('첫 번째 손길', '이/가')} 되어 주세요.`}
              </small>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
function matShare(mats: Readonly<Record<string, number>>, got: Record<string, number>) {
  const e = Object.entries(mats);
  return e.length ? e.reduce((s, [id, n]) => s + Math.min(1, (got[id] ?? 0) / n), 0) / e.length : 1;
}
