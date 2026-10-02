'use client';
// 먼바다 낚싯배 화면 (handover/design/design-sea-fishing.md §2): the boarding
// window at the pier's 출항 안내판, the "귀항까지 mm:ss" bar on the deck with
// 그만 돌아가기, the 3-second sail-out, the catch summary after coming back
// (럭스에게 팔기) and 허 선장's dawn knock. Everything the server decides comes
// from `view.life.voyage` (lounge-voyage.ts voyageView); the phase is
// recomputed here from the clock so the countdown never waits for a poll.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { FISH_BY_ID, ITEM_BY_ID } from '../lounge-items';
import { formatBeom, josa } from '../lounge-text';
import { ACTORS } from '../lounge-roster';
import { WEATHER_INFO, gameClockText, weatherOf } from '../lounge-calendar';
import { kstDay } from '../lounge-economy';
import { BOARDING_MS, DAWN_GUESTS, PILL, SEATS, VOYAGE_LINES, VOYAGE_MS, boardingSailing, nextSailing } from '../lounge-voyage-data';
import type { VoyageView } from '../lounge-voyage';
import { lifeSfx } from '../lounge-audio-life';
import { Modal } from './Modal';
import { NpcPortrait } from './NpcPortrait';
import { ItemIcon } from './ItemIcon';
import type { Notify } from './Toast';
import { useNow } from './use-now';
import './voyage.css';

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const hhmm = (t: number) => {
  const d = new Date(t + 9 * 3_600_000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
/** A line that stays the same all day for everyone (like the residents' lines). */
const lineOf = (list: readonly string[], key: number) => list[Math.abs(key) % list.length];
const fill = (line: string, me: string) => line.replaceAll('{me}', me);

export type TripPhase = 'boarding' | 'sailing' | 'back';
/** The trip's phase right now (server stamps, client clock). */
export function tripPhaseNow(trip: VoyageView['trip'], now: number): TripPhase | null {
  if (!trip) return null;
  return now < trip.dep ? 'boarding' : now < trip.endsAt ? 'sailing' : 'back';
}

// ---------------------------------------------------------------- boarding window
export function VoyageBoard({ room, view, notify, onClose }: { room: CloudRoom; view: CloudRoomView; notify: Notify; onClose: () => void }) {
  const v = view.life?.voyage;
  const now = useNow(true, 1000) + view.clockOffset;
  const [busy, setBusy] = useState(false);
  const me = view.players.find((p) => p.id === view.self);
  const myName = me ? (ACTORS[me.actor] ?? '친구') : '친구';
  const day = kstDay(now);
  const weather = weatherOf(day);
  const run = async (action: Parameters<CloudRoom['life']>[0], done: string) => {
    if (busy) return false;
    setBusy(true);
    try {
      const ok = await room.life(action);
      if (ok) notify(done);
      return ok;
    } finally {
      setBusy(false);
    }
  };
  if (!v)
    return (
      <Modal title="먼바다 출항 안내판" onClose={onClose}>
        <p className="l-help-text">서버 정보를 받는 중이에요.</p>
      </Modal>
    );
  const phase = tripPhaseNow(v.trip, now);
  const boardingDep = boardingSailing(now);
  const next = nextSailing(now);
  const seats = v.boarding && boardingDep === v.boarding.dep ? v.boarding.seats : 0;
  const guest = v.guestOf && now < v.guestOf.dep ? v.guestOf : null;
  const say = v.storm
    ? lineOf(VOYAGE_LINES.captain.storm, day)
    : !v.unlocked
      ? lineOf(VOYAGE_LINES.captain.board, day)
      : fill(lineOf(VOYAGE_LINES.captain.board, day + 1), myName);
  const why = v.storm
    ? '오늘은 폭풍이라 결항이에요.'
    : !v.unlocked
      ? `항구 구역이 열리고 낚시 Lv${v.level}이 되면 탈 수 있어요.`
      : v.sailedToday && !phase
        ? '배는 하루에 한 번만 탈 수 있어요.'
        : phase && phase !== 'back'
          ? ''
          : !boardingDep
            ? `다음 배는 ${hhmm(next)}에 떠요. 출항 2분 전부터 타요.`
            : seats >= SEATS
              ? '이 배는 자리가 다 찼어요.'
              : '';
  return (
    <Modal title="먼바다 출항 안내판" onClose={onClose} className="l-voyage-board">
      <div className="l-voyage-keeper">
        <NpcPortrait npc="captain" mood={v.storm ? 'sorry' : 'smile'} />
        <p>
          <b>허 선장</b>
          <span>{say}</span>
        </p>
      </div>
      <dl className="l-voyage-facts" data-testid="voyage-facts">
        <div>
          <dt>승선료</dt>
          <dd>{formatBeom(v.fare)} · 하루 한 번</dd>
        </div>
        <div>
          <dt>{boardingDep ? '이번 배' : '다음 배'}</dt>
          <dd data-testid="voyage-next">
            게임 {gameClockText(boardingDep ?? next)}(실제 {hhmm(boardingDep ?? next)}) 출항 · {boardingDep ? `${mmss(boardingDep - now)} 남음` : `승선 ${hhmm((boardingDep ?? next) - BOARDING_MS)}부터`}
          </dd>
        </div>
        <div>
          <dt>남은 자리</dt>
          <dd>
            <span className="l-voyage-seats" aria-label={`${SEATS}자리 중 ${SEATS - seats}자리 남음`}>
              {Array.from({ length: SEATS }, (_, i) => (
                <i key={i} data-taken={i < seats || undefined} />
              ))}
            </span>
            {SEATS - seats}/{SEATS}
          </dd>
        </div>
        <div>
          <dt>오늘 바다</dt>
          <dd data-storm={v.storm || undefined}>
            {WEATHER_INFO[weather].name}
            {v.storm ? ' · 결항' : weather === 'rain' ? ' · 입질 +15%' : ''} · 내일 {v.stormTomorrow ? '결항 예보' : '출항 예정'}
          </dd>
        </div>
        <div>
          <dt>항해</dt>
          <dd>{VOYAGE_MS / 60_000}분 · 게임 시각 05~19시 매 정시(실제 2분 30초마다) · 보물 상자 +5%p</dd>
        </div>
        <div>
          <dt>멀미약</dt>
          <dd>{v.pillUntil ? `먹었어요 · 자정까지 배가 덜 흔들려요` : (view.life?.me.inv?.[PILL] ?? 0) > 0 ? '가방에 있어요 · 가방에서 먹기' : '츠나데 텃밭에서 팔아요'}</dd>
        </div>
      </dl>
      {phase === 'boarding' && v.trip && (
        <p className="l-voyage-aboard" data-testid="voyage-aboard">
          {v.trip.dawn ? '새벽 배' : `${hhmm(v.trip.dep)} 배`}에 자리를 잡았어요. {mmss(v.trip.dep - now)} 뒤 출항해요.
          {v.trip.seats.length > 1 && ` 함께: ${v.trip.seats.map((a) => ACTORS[a]).join(', ')}`}
        </p>
      )}
      {why && <p className="l-why" data-testid="voyage-why">{why}</p>}
      {!phase && v.unlocked && (view.wallet?.balance ?? 0) < v.fare && <p className="l-help-text">{VOYAGE_LINES.rose.fare[0]} — 로제</p>}
      <p className="l-help-text">{VOYAGE_LINES.gabung.tomorrow[v.stormTomorrow ? 1 : 0]} — 가붕</p>
      <div className="l-voyage-actions">
        {phase === 'boarding' ? (
          <button type="button" className="l-secondary" disabled={busy} onClick={() => void run({ kind: 'voyageLeave' }, '배에서 내렸어요. 승선료를 돌려받았어요.')} data-testid="voyage-off">
            내리기 (환불)
          </button>
        ) : (
          <>
            {guest && (
              <button
                type="button"
                className="l-primary"
                disabled={busy || v.storm || v.sailedToday}
                onClick={() => void run({ kind: 'voyageBoard', dawn: guest.id }, `${ACTORS[guest.from]}의 새벽 배에 탔어요!`).then((ok) => ok && lifeSfx('pop'))}
                data-testid="voyage-dawn-board"
              >
                {ACTORS[guest.from]}의 새벽 배 타기 · {formatBeom(v.dawnFare)}
              </button>
            )}
            <button
              type="button"
              className="l-primary"
              disabled={busy || !!why || phase === 'sailing'}
              onClick={() => void run({ kind: 'voyageBoard' }, `${hhmm(boardingDep ?? next)} 배에 탔어요! 곧 출항해요.`).then((ok) => ok && lifeSfx('pop'))}
              data-testid="voyage-board"
            >
              타기 · {formatBeom(v.fare)}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- on the deck
export function VoyageHud({ view, onLeave }: { view: CloudRoomView; onLeave: () => void }) {
  const v = view.life?.voyage;
  const now = useNow(true, 500) + view.clockOffset;
  if (!v?.trip) return null;
  const left = v.trip.endsAt - now;
  return (
    <output className="l-voyage-hud" data-testid="voyage-hud">
      <strong>{v.trip.dawn ? '새벽 배' : '먼바다'}</strong>
      <span>
        귀항까지 <b data-testid="voyage-left">{mmss(left)}</b>
      </span>
      {v.pillUntil && <small>멀미약 효과</small>}
      <button type="button" className="l-secondary" onClick={onLeave} data-testid="voyage-leave">
        그만 돌아가기
      </button>
    </output>
  );
}

/** The 3-second cast-off: the boat slips out past the breakwater. */
export function SailOut({ back = false }: { back?: boolean }) {
  return (
    <output className="l-sailout" data-back={back || undefined} aria-label={back ? '항구로 돌아가는 중' : '출항하는 중'} data-testid="voyage-sailout">
      <div className="l-sailout-sea" />
      <div className="l-sailout-wall" />
      <div className="l-sailout-boat" />
      <p>{back ? '항구로 돌아가는 중…' : '방파제를 빠져나가는 중…'}</p>
    </output>
  );
}

// ---------------------------------------------------------------- back on the pier
export function VoyageSummary({ room, view, notify, onClose }: { room: CloudRoom; view: CloudRoomView; notify: Notify; onClose: () => void }) {
  const trip = view.life?.voyage?.trip;
  const [busy, setBusy] = useState(false);
  const [sold, setSold] = useState(0);
  const me = view.players.find((p) => p.id === view.self);
  const atHarbor = (me?.area ?? '') === 'harbor';
  const rows = useMemo(
    () =>
      Object.entries(trip?.haul ?? {})
        .filter(([id]) => FISH_BY_ID[id])
        .map(([id, n]) => ({ id, n, name: FISH_BY_ID[id].name, sell: FISH_BY_ID[id].sell }))
        .sort((a, b) => b.sell - a.sell),
    [trip],
  );
  const total = rows.reduce((s, r) => s + r.n * r.sell, 0);
  const inv = view.life?.me.inv ?? {};
  const done = async () => {
    if (await room.life({ kind: 'voyageDone' })) onClose();
  };
  const sell = async () => {
    if (busy) return;
    setBusy(true);
    try {
      let got = 0;
      const before = view.wallet?.balance ?? 0;
      for (const r of rows) {
        const n = Math.min(r.n, inv[r.id] ?? 0);
        if (n > 0 && (await room.life({ kind: 'sellItem', item: r.id, n, at: 'fishmarket' }))) got += n;
      }
      const after = room.snapshot().wallet?.balance ?? before;
      setSold(got);
      if (got) {
        notify(`럭스에게 ${got}마리를 팔았어요. ${formatBeom(Math.max(0, after - before))}!`);
        lifeSfx('fanfare');
      }
    } finally {
      setBusy(false);
    }
  };
  const line = lineOf(VOYAGE_LINES.captain.back, trip?.dep ?? 0);
  return (
    <Modal title={trip?.dawn ? '새벽 배 어획 정리' : '오늘 어획 정리'} onClose={() => void done()} className="l-voyage-summary">
      <div className="l-voyage-keeper">
        <NpcPortrait npc="captain" mood="smile" />
        <p>
          <b>허 선장</b>
          <span>{line}</span>
        </p>
      </div>
      {rows.length ? (
        <ul className="l-voyage-haul" data-testid="voyage-haul">
          {rows.map((r) => (
            <li key={r.id}>
              <ItemIcon id={r.id} size={36} />
              <span>{r.name}</span>
              <em>{r.n}마리</em>
              <small>{formatBeom(r.sell)}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="l-help-text">이번 항해에는 빈손이에요. 바다가 오늘은 비밀이 많았나 봐요.</p>
      )}
      {rows.length > 0 && (
        <p className="l-voyage-total">
          {rows.reduce((s, r) => s + r.n, 0)}마리 · 정가로 {formatBeom(total)} · 승선료 {formatBeom(trip?.fare ?? 0)}
        </p>
      )}
      <div className="l-voyage-actions">
        {rows.length > 0 && (
          <button type="button" className="l-primary" disabled={busy || !atHarbor || sold > 0} onClick={() => void sell()} data-testid="voyage-sell">
            {sold ? '럭스에게 팔았어요' : atHarbor ? '럭스에게 팔기 (어시장 정가)' : '항구에 돌아가면 팔 수 있어요'}
          </button>
        )}
        <button type="button" className="l-secondary" onClick={() => void done()} data-testid="voyage-done">
          닫기
        </button>
      </div>
      {rows.length > 0 && <p className="l-help-text">{lineOf(VOYAGE_LINES.lux.buy, trip?.dep ?? 1)} — 럭스</p>}
    </Modal>
  );
}

// ---------------------------------------------------------------- the dawn knock
export function DawnKnock({ room, view, notify, onClose, onAccepted }: { room: CloudRoom; view: CloudRoomView; notify: Notify; onClose: () => void; onAccepted: () => void }) {
  const v = view.life?.voyage;
  const [busy, setBusy] = useState(false);
  const [guests, setGuests] = useState<number[]>([]);
  const me = view.players.find((p) => p.id === view.self);
  const myActor = me?.actor ?? -1;
  const myName = ACTORS[myActor] ?? '친구';
  const known = Object.values(view.life?.actors ?? {}).filter((a) => a !== myActor);
  const friends = [...new Set(known)].sort((a, b) => a - b);
  const day = kstDay(useNow(false) + view.clockOffset);
  const answer = async (yes: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await room.life({ kind: 'voyageInvite', answer: yes ? 'yes' : 'no', ...(yes && guests.length ? { guests } : {}) });
      if (!ok) return;
      if (yes) {
        notify(`새벽 배를 잡았어요! 3분 뒤 출항해요.${guests.length ? ` ${guests.map((g) => ACTORS[g]).join(', ')}에게 초대를 보냈어요.` : ''}`);
        onAccepted();
      } else notify(fill(lineOf(VOYAGE_LINES.captain.decline, day), myName));
      onClose();
    } finally {
      setBusy(false);
    }
  };
  if (!v) return null;
  return (
    <Modal title="허 선장이 찾아왔어요" onClose={() => void answer(false)} className="l-voyage-knock">
      <div className="l-voyage-keeper">
        <NpcPortrait npc="captain" mood="smile" />
        <p>
          <b>허 선장</b>
          <span data-testid="voyage-knock-line">{fill(lineOf(VOYAGE_LINES.captain.knock, day), myName)}</span>
        </p>
      </div>
      <p className="l-help-text">
        최근 일주일에 {v.recent}번 배를 탄 단골에게만 오는 전용 새벽 배예요. 승선료 {formatBeom(v.dawnFare)}(30% 할인), 새벽에만 무는 물고기가 있고 전설도 조금 잘 나와요. 오늘의 한 번으로 쳐요.
      </p>
      {friends.length > 0 && (
        <fieldset className="l-voyage-guests">
          <legend>함께 갈 친구 (최대 {DAWN_GUESTS}명, 각자 승선료)</legend>
          {friends.map((a) => (
            <label key={a}>
              <input
                type="checkbox"
                checked={guests.includes(a)}
                disabled={!guests.includes(a) && guests.length >= DAWN_GUESTS}
                onChange={(e) => setGuests((g) => (e.target.checked ? [...g, a] : g.filter((x) => x !== a)))}
              />
              {ACTORS[a]}
            </label>
          ))}
        </fieldset>
      )}
      <div className="l-voyage-actions">
        <button type="button" className="l-secondary" disabled={busy} onClick={() => void answer(false)} data-testid="voyage-knock-no">
          오늘은 쉴래요
        </button>
        <button type="button" className="l-primary" disabled={busy} onClick={() => void answer(true)} data-testid="voyage-knock-yes">
          같이 가요 · {formatBeom(v.dawnFare)}
        </button>
      </div>
    </Modal>
  );
}

/** "멀미약을 먹었어요" etc. for a 멀미약 in the bag (Inventory). */
export const PILL_NAME = ITEM_BY_ID[PILL]?.name ?? '멀미약';
export const pillLine = (seller: string) => `${josa(seller, '이/가')} 건넨 ${PILL_NAME}`;

/**
 * Drives the trip: the sail-out when my boat leaves while I am at the harbor,
 * back to the pier when it is over, the summary once I am back. `area` is
 * where I am outdoors (null: the hub or a room).
 */
export function useVoyageFlow({
  view,
  area,
  busy,
  toDeck,
  toPier,
}: {
  view: CloudRoomView;
  area: string | null;
  /** A game, a dialog or a door is in the way: wait. */
  busy: boolean;
  toDeck: () => void;
  toPier: () => void;
}) {
  const trip = view.life?.voyage?.trip ?? null;
  const now = useNow(!!trip, 500) + view.clockOffset;
  const phase = tripPhaseNow(trip, now);
  const [sailing, setSailing] = useState<'out' | 'back' | null>(null);
  /** The trip whose summary I closed (it stays open until 닫기 sends voyageDone). */
  const [closed, setClosed] = useState<string | null>(null);
  /** The scene change waiting under the overlay (kept across re-renders). */
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goTo = useRef({ toDeck, toPier });
  useEffect(() => {
    goTo.current = { toDeck, toPier };
  });
  useEffect(() => {
    if (busy || pending.current || !trip) return;
    const kind = phase === 'sailing' && area === 'harbor' ? 'out' : phase === 'back' && area === 'offshore' ? 'back' : null;
    if (!kind) return;
    // The overlay first, then the scene change under it.
    pending.current = setTimeout(
      () => {
        pending.current = null;
        setSailing(null);
        if (kind === 'out') goTo.current.toDeck();
        else goTo.current.toPier();
      },
      kind === 'out' ? 3_000 : 1_600,
    );
    const show = setTimeout(() => setSailing(kind), 0);
    return () => clearTimeout(show);
  }, [busy, trip, phase, area]);
  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );
  // Once I am where the overlay was taking me, it is gone.
  const shown = sailing === 'out' ? (area === 'offshore' ? null : sailing) : sailing === 'back' ? (area === 'offshore' ? sailing : null) : null;
  return {
    phase,
    sailing: shown,
    summaryOpen: !!trip && phase === 'back' && area !== 'offshore' && !shown && closed !== trip.id,
    closeSummary: () => setClosed(trip?.id ?? null),
  };
}
