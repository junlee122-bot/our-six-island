'use client';
// 낚시 (낚시 업그레이드, design-fishing-upgrade.md): a tackle board over the
// water. Cast → watch the float (it may nibble; do not pull yet) → the float
// dives with a "!" → press to hook (reaction grade) → 손맛 겨루기: keep the
// fish inside the green zone until the gauge fills (FishingReel) → the fish
// card (size, weight, quality, perfect, treasure, records, weekly cup). The
// server picks the fish at the cast, times the bite, stores the fight seed at
// the hook and replays the recorded input when the fish is landed.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { FISH, FISH_BY_ID, ITEM_BY_ID, SPOT_INFO, type FishDef, type Spot } from '../lounge-items';
import { REEL_REASON } from '../lounge-life-ui';
import { sellQuote, itemName } from '../lounge-life-plus';
import { anglerCandidates, biteDelayMs, fishGrams, gramsText, rarityOf, type AnglerLast, type AnglingView } from '../lounge-fish-engine';
import { BAITS, BEHAVIOUR_NAME, CRAB_POT, FISH_PROFILE, type BaitId } from '../lounge-fish-data';
import { FISH_QUALITY_MULT } from '../lounge-fish-quality';
import type { FightResult } from '../lounge-fish-minigame';
import { lifeSfx } from '../lounge-audio-life';
import { formatBeom, josa } from '../lounge-text';
import { ACTORS } from '../lounge-roster';
import { ItemIcon, QualityStar } from './ItemIcon';
import { FishCatchModel } from './FishCatchModel';
import { FishArt } from './FishArt';
import { FishingReel } from './FishingReel';
import { FishingJournal } from './FishingJournal';
import { Glyph } from './field-glyphs';
import { useNow } from './use-now';
import type { Notify } from './Toast';
import { boundAction } from '../lounge-scene-keys';
import { keyLabel } from '../lounge-keybinds';
import { getSettings } from '../lounge-settings';
import './life-plus.css';
import './farm-fish.css';
import './fishing-reel.css';

export type FishingPhase = 'casting' | 'wait' | 'bite' | 'reeling' | 'fight' | 'result';
type Result = Omit<AnglerLast, 'at'> & { isNew?: boolean; pressed?: boolean };

/** An honest-looking weight for a fish of `cm` (display only). */
export const fishWeight = (id: string, cm: number) => gramsText(fishGrams(id, cm));
export const fishRarity = (f: FishDef) => (f.weight <= 1 ? 'legend' : f.weight < 10 ? 'rare' : 'common');
const RARITY_NAME = { legend: '전설', rare: '드묾', common: '흔함' } as const;
const QUALITY_NAME = ['보통', '은별', '금별'] as const;
const BAIT_KEY = 'beomtadew.fishing.bait';
const readBait = (): BaitId | '' => {
  try {
    const v = localStorage.getItem(BAIT_KEY);
    return (BAITS as readonly string[]).includes(v ?? '') ? (v as BaitId) : '';
  } catch {
    return '';
  }
};
const clockText = (at: number) => {
  const d = new Date(at + 9 * 3_600_000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
const lootText = (l: NonNullable<AnglerLast['treasure']>) =>
  l.kind === 'seed' ? `${itemName(l.item)} 씨앗 ${l.n}개` : `${itemName(l.item)}${l.n > 1 ? ` ${l.n}개` : ''}`;

export function FishingOverlay({
  room,
  view,
  spot,
  notify,
  onClose,
  onPhase,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  spot: Spot;
  notify: Notify;
  onClose: () => void;
  /** Tells the village where the bobber is (bobber / bite / fight animation). */
  onPhase: (phase: FishingPhase | null) => void;
}) {
  const [phase, setPhase] = useState<FishingPhase>('casting');
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [nibble, setNibble] = useState(0);
  const [closing, setClosing] = useState(false);
  const [closeFailed, setCloseFailed] = useState(false);
  const [journal, setJournal] = useState(false);
  const [bait, setBait] = useState<BaitId | ''>(readBait);
  const [potBusy, setPotBusy] = useState(false);
  const [windowMs, setWindowMs] = useState(1000);
  const closingRef = useRef(false);
  const castingRef = useRef(true);
  const cancelBusy = useRef(false);
  const token = useRef<{ token: string; biteAt: number; windowMs: number } | null>(null);
  const fightRef = useRef<NonNullable<AnglingView['me']['fight']> | null>(null);
  const [fight, setFight] = useState<NonNullable<AnglingView['me']['fight']> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef = useRef(phase);
  const rootRef = useRef<HTMLDivElement>(null);
  const actRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(false);
  const baitRef = useRef(bait);
  const cb = useRef({ onClose, onPhase });
  useLayoutEffect(() => {
    cb.current = { onClose, onPhase };
    baitRef.current = bait;
  });
  useLayoutEffect(() => {
    phaseRef.current = phase;
    cb.current.onPhase(phase);
  }, [phase]);
  useEffect(() => () => cb.current.onPhase(null), []);
  const reduced = useMemo(() => {
    try {
      return matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }, []);

  // Do not leave a live cast or fight behind when the sheet closes.
  const finishClose = useCallback(async () => {
    if (cancelBusy.current) return;
    cancelBusy.current = true;
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    const live = fightRef.current?.token ?? token.current?.token;
    const ok = !live || (await room.life({ kind: 'anglerCancel', token: live }));
    cancelBusy.current = false;
    if (!ok) {
      closingRef.current = false;
      setClosing(false);
      setCloseFailed(true);
      return;
    }
    token.current = null;
    fightRef.current = null;
    cb.current.onClose();
  }, [room]);
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setCloseFailed(false);
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
    if (!castingRef.current && !busyRef.current) void finishClose();
  }, [finishClose]);

  const showResult = useCallback((last: AnglerLast | null | undefined, before: readonly string[], pressed: boolean) => {
    if (!last) {
      setResult({ ok: false, reason: 'escaped' });
      setPhase('result');
      lifeSfx('miss');
      return;
    }
    const isNew = !!last.fish && !before.includes(last.fish);
    setResult({ ...last, isNew, pressed });
    setPhase('result');
    const f = last.fish ? FISH_BY_ID[last.fish] : undefined;
    lifeSfx(!last.ok ? 'miss' : f && f.weight < 10 ? 'fanfare' : 'reel');
    if (last.ok && (isNew || last.record || last.treasure)) timers.current.push(setTimeout(() => lifeSfx('sparkle'), 380));
  }, []);

  /** Hook the bite: the server checks the timing and starts the fight. */
  const hook = useCallback(
    async (pressed: boolean) => {
      const p = token.current;
      if (!p || busyRef.current || closingRef.current) return;
      busyRef.current = true;
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
      const before = room.snapshot().life?.me.dex ?? [];
      setPhase('reeling');
      lifeSfx('tick');
      const ok = await room.life({ kind: 'anglerHook', token: p.token });
      token.current = null;
      busyRef.current = false;
      const a = room.snapshot().life?.angling;
      const f = ok ? a?.me.fight : null;
      const hooked = f && f.token === p.token ? f : null;
      // Closed while the hook was on its way: let a fish it hooked go on the server too.
      fightRef.current = hooked;
      if (closingRef.current) {
        await finishClose();
        return;
      }
      if (hooked) {
        setFight(hooked);
        setPhase('fight');
        lifeSfx('splash');
        return;
      }
      showResult(ok ? a?.me.last : null, before, pressed);
    },
    [room, finishClose, showResult],
  );

  /** The fight is over on this side: send the runs; the server replays them. */
  const land = useCallback(
    async (runs: number[], _local: FightResult) => {
      const f = fightRef.current;
      if (!f || busyRef.current) return;
      busyRef.current = true;
      const before = room.snapshot().life?.me.dex ?? [];
      setPhase('reeling');
      const ok = await room.life({ kind: 'anglerLand', token: f.token, runs });
      fightRef.current = null;
      setFight(null);
      busyRef.current = false;
      if (closingRef.current) {
        await finishClose();
        return;
      }
      showResult(ok ? room.snapshot().life?.angling?.me.last : null, before, true);
    },
    [room, finishClose, showResult],
  );

  // Cast (again on each attempt): the server answers with the pending bite.
  useEffect(() => {
    let cancelled = false;
    castingRef.current = true;
    lifeSfx('cast');
    void (async () => {
      let sent = performance.now();
      const chosen = baitRef.current,
        have = chosen ? (room.snapshot().life?.me.inv?.[chosen] ?? 0) : 0;
      const ok = await room.life({ kind: 'anglerCast', spot, ...(chosen && have > 0 ? { bait: chosen } : {}) }, (at) => {
        sent = at;
      });
      const pending = room.snapshot().life?.angling?.me.cast;
      castingRef.current = false;
      if (cancelled) {
        if (ok && pending) void room.life({ kind: 'anglerCancel', token: pending.token });
        return;
      }
      if (!ok || !pending) {
        cb.current.onClose();
        return;
      }
      token.current = { token: pending.token, biteAt: pending.biteAt, windowMs: pending.windowMs };
      if (closingRef.current) {
        await finishClose();
        return;
      }
      // Commit the wait now: the bite timer below checks for it, and when the
      // reply ran late that timer is due at once, ahead of a queued render.
      flushSync(() => {
        setWindowMs(pending.windowMs);
        setPhase('wait');
      });
      // Counted from when the cast left, not from when its reply ran (see biteDelayMs).
      const toBite = biteDelayMs(pending, performance.now() - sent);
      if (!reduced)
        for (const at of [0.35, 0.7]) {
          const t = toBite * at;
          if (t > 700 && toBite - t > 600) timers.current.push(setTimeout(() => !cancelled && setNibble((n) => n + 1), t));
        }
      timers.current.push(
        setTimeout(() => {
          if (cancelled || phaseRef.current !== 'wait') return;
          // The dip is a reaction cue: draw it in this task, not in a render
          // queued behind the 3D scene's next frame (long on a slow GPU).
          flushSync(() => setPhase('bite'));
          lifeSfx('bite');
          requestAnimationFrame(() => actRef.current?.focus({ preventScroll: true }));
        }, toBite),
        // Missed the window: hook anyway so the server records it and clears the cast.
        setTimeout(() => {
          if (!cancelled && phaseRef.current === 'bite') void hook(false);
        }, toBite + pending.windowMs + 350),
      );
    })();
    return () => {
      cancelled = true;
      for (const t of timers.current) clearTimeout(t);
      timers.current = [];
    };
  }, [attempt, room, spot, hook, reduced, finishClose]);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);
  const act = useCallback(() => {
    if (closingRef.current) return;
    const p = phaseRef.current;
    if (p === 'bite' || p === 'wait') void hook(true);
    else if (p === 'result') {
      busyRef.current = false;
      setResult(null);
      setPhase('casting');
      setAttempt((a) => a + 1);
    }
  }, [hook]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        requestClose();
        return;
      }
      // The reel fight reads its own hold keys.
      if (phaseRef.current === 'fight') return;
      if (e.code === 'KeyJ' && !e.repeat && phaseRef.current !== 'bite') {
        e.preventDefault();
        e.stopPropagation();
        setJournal(true);
        return;
      }
      if (boundAction(e) === 'action' || e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) act();
      }
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [act, requestClose]);

  const life = view.life;
  const me = life?.angling?.me;
  const fish = result?.fish ? FISH_BY_ID[result.fish] : undefined;
  const record = result?.fish ? life?.records?.[result.fish] : undefined;
  const best = result?.fish ? me?.log?.[result.fish] : undefined;
  const inv = life?.me.inv ?? {};
  const rod = me?.rod ?? life?.me.fishing?.rod ?? 1;
  const info = SPOT_INFO[spot];
  const now = useNow(true, 30_000) + view.clockOffset;
  const dex = life?.me.dex ?? [];
  const ctx = life?.calendar
    ? { season: life.calendar.season, weather: life.weather?.today ?? 'sunny', now, level: me?.level, rod, caught: me?.legends }
    : null;
  const biting = ctx ? [...anglerCandidates(spot, ctx)].sort((a, b) => b.weight - a.weight) : [];
  const living = FISH.filter((f) => f.spots.includes(spot));
  const found = living.filter((f) => dex.includes(f.id)).length;
  const q = Math.min(2, result?.quality ?? 0) as 0 | 1 | 2; // fish top out at 금별 (별빛 is a farm grade)
  const price = fish && life ? Math.round(sellQuote(life, fish.id, 0, 1, now).next * FISH_QUALITY_MULT[q]) : undefined;
  const myActor = life?.actors?.[view.self];
  const friends = (life?.angling?.anglers?.[spot] ?? []).filter((a) => a !== myActor);
  const pot = me?.pots.find((p) => p.spot === spot);
  const baits = BAITS.filter((b) => (inv[b] ?? 0) > 0);
  useEffect(() => {
    if (result?.ok && fish && result.record) notify(`${fish.name} ${result.cm}cm · 마을 최대어 기록이에요!`);
  }, [result, fish, notify]);
  const chooseBait = (b: BaitId | '') => {
    setBait(b);
    try {
      if (b) localStorage.setItem(BAIT_KEY, b);
      else localStorage.removeItem(BAIT_KEY);
    } catch {
      /* private window: the choice lasts for this visit */
    }
  };
  const potAction = async (kind: 'crabSet' | 'crabCollect' | 'crabTake', done: string) => {
    if (potBusy) return;
    setPotBusy(true);
    const before = { ...(room.snapshot().life?.me.inv ?? {}) };
    const ok = await room.life(kind === 'crabSet' ? { kind, spot } : kind === 'crabCollect' ? { kind, spot } : { kind, spot });
    setPotBusy(false);
    if (!ok) return;
    if (kind === 'crabCollect') {
      const after = room.snapshot().life?.me.inv ?? {};
      const got = Object.keys(after).find((id) => (after[id] ?? 0) > (before[id] ?? 0));
      notify(got ? `통발에서 ${josa(itemName(got), '을/를')} 건졌어요!` : done);
      lifeSfx('pickup');
    } else notify(done);
  };
  const actKey = keyLabel(getSettings().keys.action);
  const fighting = phase === 'fight' && fight;
  return (
    <div
      ref={rootRef}
      className="l-angler"
      data-phase={phase}
      data-spot={spot}
      data-testid="fishing"
      role="dialog"
      aria-label={`${info.name}에서 낚시하기`}
      tabIndex={-1}
    >
      <header className="l-angler-sign">
        <span className="l-angler-board">
          <strong>{info.name}</strong>
          <small>{info.note}</small>
        </span>
        <span className="l-angler-tags">
          <span className="l-tag">낚싯대 {rod}단</span>
          {me?.tackle.map((t) => (
            <span className="l-tag" key={t.id} title={`${ITEM_BY_ID[t.id]?.name} · ${t.uses}번 남음`}>
              {ITEM_BY_ID[t.id]?.name} {t.uses}
            </span>
          ))}
          {friends.length > 0 && (
            <span className="l-tag" data-testid="fish-coop" title="같은 낚시터에서 낚는 친구가 있으면 크기·보물 확률이 올라요">
              함께 {friends.map((a) => ACTORS[a] ?? '친구').join('·')}
            </span>
          )}
        </span>
        <button type="button" className="l-angler-close" onClick={() => setJournal(true)} disabled={phase === 'fight'} aria-label="낚시 수첩 (J)" data-testid="fish-journal-open">
          <Glyph name="book" /> <kbd>J</kbd>
        </button>
        <button type="button" className="l-angler-close" aria-label="그만하기 (Esc)" onClick={requestClose} disabled={closing}>
          <kbd>Esc</kbd>
        </button>
      </header>
      <div className="l-angler-now" aria-label="지금 여기서 무는 물고기">
        <span className="l-angler-now-label">
          지금 무는 물고기 <small>{found}/{living.length}종 찾음</small>
        </span>
        <ul>
          {biting.slice(0, 8).map((f) => {
            const known = dex.includes(f.id);
            return (
              <li key={f.id} data-known={known || undefined} data-rarity={fishRarity(f)} title={known ? `${f.name} · ${RARITY_NAME[fishRarity(f)]} · ${BEHAVIOUR_NAME[FISH_PROFILE[f.id]?.behaviour ?? 'mixed']}` : `아직 못 만난 물고기 · ${RARITY_NAME[fishRarity(f)]}`}>
                <FishArt id={f.id} size={30} unknown={!known} />
                <small>{known ? f.name : '?'}</small>
              </li>
            );
          })}
          {!biting.length && <li className="l-angler-quiet">지금은 조용해요</li>}
        </ul>
      </div>
      {!fighting && phase !== 'result' && (
        <div className="l-angler-gear" data-testid="fish-gear">
          <label>
            미끼
            <select value={baits.includes(bait as BaitId) ? bait : ''} onChange={(e) => chooseBait(e.target.value as BaitId | '')} aria-label="다음에 쓸 미끼">
              <option value="">없이</option>
              {baits.map((b) => (
                <option key={b} value={b}>
                  {ITEM_BY_ID[b]?.name} ({inv[b]})
                </option>
              ))}
            </select>
          </label>
          <span className="l-gear-note">{bait && baits.includes(bait) ? ITEM_BY_ID[bait]?.note : '다음 던지기부터 적용돼요'}</span>
          <span className="l-gear-spacer" />
          {pot ? (
            pot.ready ? (
              <button type="button" className="l-leaf" disabled={potBusy} onClick={() => void potAction('crabCollect', '통발을 거뒀어요.')} data-testid="pot-collect">
                <Glyph name="basket" /> 통발 거두기
              </button>
            ) : pot.bait ? (
              <span className="l-gear-note" data-testid="pot-wait">통발 {clockText(pot.readyAt)}에 차요</span>
            ) : (
              <>
                <button type="button" className="l-ink" disabled={potBusy} onClick={() => void potAction('crabSet', '통발에 미끼를 넣었어요. 4시간 뒤에 와 봐요.')}>
                  통발에 미끼 넣기
                </button>
                <button type="button" className="l-ink" disabled={potBusy} onClick={() => void potAction('crabTake', '통발을 가방에 넣었어요.')}>
                  통발 걷기
                </button>
              </>
            )
          ) : (inv[CRAB_POT] ?? 0) > 0 ? (
            <button type="button" className="l-ink" disabled={potBusy} onClick={() => void potAction('crabSet', '통발을 놓았어요. 4시간 뒤에 거둘 수 있어요.')} data-testid="pot-set">
              통발 놓기 ({inv[CRAB_POT]})
            </button>
          ) : null}
        </div>
      )}
      {fighting ? (
        <FishingReel setup={fight.setup} behaviourName={fight.behaviourName} difficulty={fight.setup.difficulty} onDone={(runs, r) => void land(runs, r)} />
      ) : phase === 'result' && result ? (
        <div className={`l-catch${result.ok ? ' is-ok' : ''}`} data-testid="fish-result" data-fish={result.fish ?? ''}>
          {result.ok && fish ? (
            <>
              <figure className="l-catch-art" data-rarity={fishRarity(fish)}>
                <FishCatchModel key={fish.id} fish={fish.id} />
                <svg className="l-catch-ruler" viewBox="0 0 200 18" aria-hidden="true">
                  <rect x="1" y="3" width="198" height="12" rx="2" fill="#f3dc9a" stroke="#a8743a" />
                  {Array.from({ length: 21 }, (_, i) => (
                    <path key={i} d={`M${6 + i * 9.4} 3 v${i % 5 ? 4 : 7}`} stroke="#8a5a34" strokeWidth="1" />
                  ))}
                </svg>
                <figcaption>{result.cm}cm</figcaption>
                {result.isNew && (
                  <span className="l-stamp" aria-label="처음 낚았어요">
                    첫<br />낚시
                  </span>
                )}
              </figure>
              <div className="l-catch-text">
                <span className="l-catch-rarity" data-rarity={fishRarity(fish)}>
                  {RARITY_NAME[fishRarity(fish)]}
                </span>
                <strong>
                  {fish.name} {q > 0 && <QualityStar quality={q} size={16} />}
                </strong>
                <b>
                  {result.cm}cm · {gramsText(result.grams ?? fishGrams(fish.id, result.cm ?? 0))} · {QUALITY_NAME[q]}
                </b>
                <span className="l-catch-tags">
                  {result.perfect && <span className="l-catch-tag" data-kind="perfect">완벽하게 낚음</span>}
                  {result.seconds !== undefined && <span className="l-catch-tag">겨루기 {result.seconds}초</span>}
                  {result.coop ? <span className="l-catch-tag" data-kind="coop">함께 낚시 {result.coop}명</span> : null}
                  {result.cupScore ? <span className="l-catch-tag">대회 점수 {result.cupScore}</span> : null}
                  {result.pressed && (result.grade === 'S' || result.grade === 'A') && <span className="l-catch-tag">재빠르게 챘어요</span>}
                </span>
                <p>{fish.note}</p>
                <dl>
                  <dt>내 기록</dt>
                  <dd>{result.best ? <span className="l-ribbon">새 기록</span> : best ? `${best.cm}cm · ${gramsText(best.g)}` : '—'}</dd>
                  <dt>마을 최대어</dt>
                  <dd>
                    {result.record ? (
                      <span className="l-ribbon is-gold">
                        <Glyph name="star" size={13} /> 이 물고기예요
                      </span>
                    ) : record ? (
                      `${record.cm}cm · ${ACTORS[record.actor] ?? '친구'}`
                    ) : (
                      '—'
                    )}
                  </dd>
                  <dt>시세</dt>
                  <dd>개당 {formatBeom(price ?? fish.sell)}{q > 0 ? ` (${QUALITY_NAME[q]} ×${FISH_QUALITY_MULT[q]})` : ''}</dd>
                </dl>
              </div>
            </>
          ) : (
            <p className="l-catch-miss">
              <strong>앗, 놓쳤어요</strong>
              {result.reason === 'escaped'
                ? '물고기가 줄을 끊고 달아났어요.'
                : result.reason === 'refused'
                  ? '줄이 엉켰어요. 다시 던져 주세요.'
                  : (REEL_REASON[result.reason ?? 'timing'] ?? REEL_REASON.timing)}
              <small>
                {result.reason === 'early'
                  ? '찌가 살짝 떨리는 건 입질 흉내예요. 쏙 잠길 때까지 기다려요.'
                  : result.reason === 'escaped'
                    ? '물고기가 초록 칸 밖에 오래 있으면 게이지가 줄어요. 칸을 조금 먼저 움직여 봐요.'
                    : '찌가 잠기면 바로 채요.'}
              </small>
            </p>
          )}
          {result.treasure && (
            <div className="l-catch-parcel" data-testid="fish-treasure">
              <ItemIcon id={result.treasure.kind === 'seed' ? `seed-${result.treasure.item}` : result.treasure.item} size={34} />
              <span>
                <strong>보물 상자를 열었어요!</strong>
                <small>{lootText(result.treasure)} · 가방에 담았어요</small>
              </span>
            </div>
          )}
          {result.treasureLost && !result.treasure && <p className="l-angler-tip">보물 상자가 떠올랐지만 놓쳤어요. 초록 칸으로 상자를 덮고 있으면 열려요.</p>}
          {result.pressed && result.reactionMs !== undefined && result.grade && (
            <div className="l-catch-reaction" data-testid="fish-reaction" aria-label={`입질 반응 ${result.reactionMs}밀리초, ${result.grade}등급`}>
              <b>{result.grade}급</b>
              <span>
                입질 반응 <strong>{result.reactionMs.toLocaleString()} ms</strong>
                <small>서버 입질 → 챔질 도착 · 통신 시간 포함</small>
              </span>
              <small>S ≤200 · A ≤350 · B ≤500 · C ≤750 · D ≤1,100 · E &gt;1,100 ms</small>
            </div>
          )}
          {result.ok && result.parcel && (
            <div className="l-catch-parcel" data-testid="fish-parcel">
              <ItemIcon id={result.parcel.kind === 'seed' ? `seed-${result.parcel.item}` : result.parcel.item} size={34} />
              <span>
                <strong>물 위에서 꾸러미도 건졌어요!</strong>
                <small>
                  {itemName(result.parcel.item)}
                  {result.parcel.kind === 'seed' ? ' 씨앗' : ''} 1개 · 주머니에 담았어요
                </small>
              </span>
            </div>
          )}
          <div className="l-catch-actions">
            <button ref={actRef} type="button" className="l-leaf" onClick={() => act()} data-testid="fish-again" disabled={closing} autoFocus>
              <Glyph name="hook" /> 다시 던지기 <kbd>{actKey}</kbd>
            </button>
            <button type="button" className="l-ink" onClick={() => setJournal(true)} disabled={closing}>
              낚시 수첩 <kbd>J</kbd>
            </button>
            <button type="button" className="l-ink" onClick={requestClose} disabled={closing}>
              그만하기 <kbd>Esc</kbd>
            </button>
          </div>
        </div>
      ) : (
        <button
          ref={actRef}
          type="button"
          className="l-angler-water"
          onClick={() => act()}
          disabled={closing || phase === 'casting' || phase === 'reeling'}
          data-testid="fish-act"
          aria-live="assertive"
        >
          <span className="l-angler-scene" aria-hidden="true">
            <span className="l-angler-ripple" />
            <span className="l-angler-float" key={phase === 'wait' ? `n${nibble}` : phase} data-nibble={phase === 'wait' && nibble > 0 ? true : undefined}>
              <svg viewBox="0 0 24 40" width="22" height="36">
                <path d="M12 0 v10" stroke="#4a3423" strokeWidth="1.4" />
                <ellipse cx="12" cy="18" rx="6" ry="8" fill="#fffaf0" stroke="#4a3423" strokeWidth="1.4" />
                <path d="M6 18 a6 8 0 0 0 12 0z" fill="#d9573f" />
                <path d="M12 26 v8" stroke="#4a3423" strokeWidth="1.4" />
              </svg>
            </span>
            {phase === 'bite' && <b className="l-angler-bang">!</b>}
          </span>
          <span className="l-angler-say">
            {closing
              ? '낚싯대를 거두는 중…'
              : phase === 'casting'
                ? '휘익, 찌를 던지는 중…'
                : phase === 'wait'
                  ? nibble > 0
                    ? '톡톡… 아직이에요, 쏙 잠길 때까지'
                    : '찌를 지켜봐요'
                  : phase === 'bite'
                    ? '지금! 채요'
                    : '줄을 당기는 중…'}
            <small>{phase === 'bite' ? `${actKey} · Space · 클릭` : phase === 'wait' ? '너무 일찍 채면 놓쳐요' : ''}</small>
          </span>
          {phase === 'bite' && (
            <span className="l-reelbar" aria-hidden="true" style={{ ['--window' as string]: `${windowMs}ms` }}>
              <span className="l-reelbar-sweet" />
              <span className="l-reelbar-mark" />
            </span>
          )}
          {phase === 'reeling' && <span className="l-reel-spin" aria-hidden="true" />}
        </button>
      )}
      <p className="l-angler-tip" role="status">
        {closing
          ? '정리가 끝나면 다시 걸을 수 있어요.'
          : closeFailed
            ? '낚싯대를 거두지 못했어요. 연결을 확인한 뒤 Esc로 다시 시도해 주세요.'
            : phase === 'fight'
              ? 'Esc를 누르면 물고기를 놓아 줘요.'
              : `찌 ${me?.tackleSlots ?? 0}칸 · 보물 상자 ${me?.treasurePct ?? 12}% · 성공 시 씨앗 12% / 먹거리 4% 추가 발견`}
      </p>
      {journal && <FishingJournal room={room} view={view} notify={notify} spot={spot} onClose={() => setJournal(false)} />}
    </div>
  );
}

/** Banner text for a caught fish (used by the village for a short line). */
export const caughtText = (fish: string, cm?: number) =>
  `${josa(FISH_BY_ID[fish]?.name ?? '물고기', '을/를')} 낚았어요${cm ? ` · ${cm}cm` : ''}!`;

/** Rarity helper for other panels (journal, collection). */
export { rarityOf };
