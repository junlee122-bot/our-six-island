'use client';

// Native game sprites preserve their alpha and share the room's existing asset loader.
/* oxlint-disable next/no-img-element */
// This application surface supports directional navigation and contains real table buttons.
/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Footprints } from 'lucide-react';
import { AvatarView } from './avatar-view';
import { LOUNGE_ASSETS } from './lounge-assets';
import { GAME_INFO, type GameKind } from './lounge-games';
import type { LoungePlayer, LoungeView } from './lounge-room';
import { ACTORS } from './lounge-roster';
import {
  TABLE_ACTION_LABEL,
  tableAction,
  tableLabel,
  tableState,
  type TableState,
} from './lounge-table-state';
import {
  SCENE_LAYOUT,
  projectPlayer,
  unprojectFloor,
  sceneDepth,
  sceneStep,
  sceneNearestTable,
  sceneTableSide,
  type SceneArea,
  type ScenePoint,
  type SceneTable,
} from './lounge-scene-layout';
import { ActionButton } from './lounge/ActionButton';
import './lounge-scene.css';

type RoomFloorProps = {
  players: LoungePlayer[];
  self: string;
  onMove: (x: number, y: number) => void;
  /** The table's action (앉기 / 자리 잡기 / 구경하기 / 이어하기), after walking up to it. */
  onTable: (kind: GameKind) => void;
  view: LoungeView;
  area?: SceneArea;
  /** I sit at this forming table: walking is paused until I stand up. */
  seatedAt?: GameKind | null;
  /** A table sheet is open: its own buttons (and E) replace the action button. */
  sheetOpen?: boolean;
};

/** Small portrait chips above a table: who sits there, then empty seats. */
function SeatChips({ state, view }: { state: TableState; view: LoungeView }) {
  if (state.phase === 'empty') return null;
  const shown = Math.min(7, Math.max(state.required, state.occupants.length));
  return (
    <span className="cf-table-seats" aria-hidden="true" title="">
      {Array.from({ length: shown }, (_, i) => {
        const p = view.players.find((q) => q.id === state.occupants[i]);
        return p ? (
          <span
            key={p.id}
            className={'cf-seat' + (p.id === view.self ? ' is-me' : '')}
            title={`${p.id === view.self ? '나' : ACTORS[p.actor]}${state.invite?.from === p.id ? ' · 테이블을 연 친구' : ''}`}
          >
            <AvatarView actor={p.actor} look={p.look} portrait />
          </span>
        ) : state.occupants[i] ? (
          <span key={'away-' + i} className="cf-seat is-away" />
        ) : (
          <span key={'empty-' + i} className="cf-seat is-empty" title="빈자리" />
        );
      })}
    </span>
  );
}

function WorldFriend({
  p,
  self,
  area,
  forceRun = false,
  local,
}: {
  p: LoungePlayer;
  self: string;
  area: SceneArea;
  forceRun?: boolean;
  /** My own figure is driven every frame by RoomFloor, not by server echoes. */
  local?: { motion: 'walk' | 'run' | null; facing: 1 | -1 };
}) {
  const [movement, setMovement] = useState<'walk' | 'run' | null>(null);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [expiredEmoteAt, setExpiredEmoteAt] = useState(0);
  const position = useRef({ x: p.x, y: p.y });
  const lastMoveAt = useRef(0);
  const fastStepCount = useRef(0);
  const movementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (position.current.x === p.x && position.current.y === p.y) return;
    const previous = { ...p, ...position.current };
    const previousFoot = projectPlayer(previous, area);
    const nextFoot = projectPlayer(p, area);
    const distance = Math.hypot(
      p.x - position.current.x,
      p.y - position.current.y,
    );
    const now = Date.now();
    const elapsed = now - lastMoveAt.current;
    // Keyboard run emits repeated 1.65x steps (~4.95 units) at ~110 ms.
    // A floor click is a single destination jump, so it must not imply running.
    const fastStep =
      elapsed >= 60 && elapsed <= 220 && distance >= 4.1 && distance <= 8.2;
    fastStepCount.current = fastStep ? fastStepCount.current + 1 : 0;
    position.current = { x: p.x, y: p.y };
    lastMoveAt.current = now;
    if (Math.abs(nextFoot.x - previousFoot.x) > 0.01)
      setFacing(nextFoot.x < previousFoot.x ? -1 : 1);
    setMovement(forceRun || fastStepCount.current >= 2 ? 'run' : 'walk');
    if (movementTimer.current) clearTimeout(movementTimer.current);
    movementTimer.current = setTimeout(() => setMovement(null), 800);
  }, [p, p.x, p.y, area, forceRun]);
  useEffect(
    () => () => {
      if (movementTimer.current) clearTimeout(movementTimer.current);
    },
    [],
  );
  useEffect(() => {
    const remaining = p.emote ? p.emoteAt + 4500 - Date.now() : 0;
    const timer = setTimeout(
      () => setExpiredEmoteAt(p.emoteAt),
      Math.max(0, remaining),
    );
    return () => clearTimeout(timer);
  }, [p.emote, p.emoteAt]);
  const foot = projectPlayer(p, area);
  const waving = !!p.emote && p.emoteAt !== expiredEmoteAt;
  const motion = local ? local.motion : movement;
  const faced = local ? local.facing : facing;
  return (
    <div
      className={`cf-player${p.id === self ? ' cf-player-self' : ''}${local ? ' cf-player-local' : ''}`}
      style={{
        left: `${foot.x}%`,
        top: `${foot.y}%`,
        zIndex: sceneDepth(foot.y),
      }}
      data-player={p.id}
      data-motion={motion ?? (waving ? 'wave' : 'idle')}
      data-facing={faced}
    >
      <span className="cf-player-shadow" aria-hidden="true" />
      <AvatarView
        actor={p.actor}
        look={p.look}
        animated
        facing={faced}
        motion={motion ?? (waving ? 'wave' : 'idle')}
      />
      <span className="cf-player-name">
        {ACTORS[p.actor]}
        {p.id === self && <small>나</small>}
      </span>
      {waving && (
        <span className="cf-player-emote" key={p.emoteAt}>
          {p.emote}
        </span>
      )}
    </div>
  );
}

function SceneGameTable({
  table,
  view,
  onApproach,
}: {
  table: SceneTable;
  view: LoungeView;
  onApproach: (kind: GameKind) => void;
}) {
  const state = tableState(view, table.game);
  const label = tableLabel(state);
  const style: CSSProperties = {
    left: `${table.foot.x}%`,
    top: `${table.foot.y}%`,
    width: `${table.width}%`,
    transform: `translate(-${table.imageAnchor.x}%, -${table.imageAnchor.y}%)`,
    zIndex: sceneDepth(table.foot.y),
  };
  const art = LOUNGE_ASSETS.clubTable;
  return (
    <button
      type="button"
      className={`cf-game-table cf-game-${table.game} is-${state.phase}${state.called || state.fill ? ' is-called' : ''}${state.seated ? ' is-mine' : ''}`}
      style={style}
      onClick={() => onApproach(table.game)}
      aria-label={`${label.text} · 누르면 테이블로 걸어가요`}
      title={label.text}
      data-table={state.id}
      data-phase={state.phase}
    >
      <img className="cf-table-art" src={art} alt="" draggable={false} />
      <span className="cf-table-label">
        <strong>{GAME_INFO[table.game].name}</strong>
        <span className="cf-table-meta">
          <i
            className={
              state.phase === 'playing'
                ? 'cf-status-dot cf-status-active'
                : state.phase === 'forming'
                  ? 'cf-status-dot cf-status-forming'
                  : 'cf-status-dot'
            }
          />
          {label.status}
        </span>
        <SeatChips state={state} view={view} />
        {state.phase !== 'empty' && !state.seated && (
          <span className="cf-table-cta">{label.text.split(' · ').pop()}</span>
        )}
      </span>
    </button>
  );
}

const SCENE_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
};
/** Server units per second; the floor is 70 × 46 units. */
const SCENE_WALK_SPEED = 16;

export function RoomFloor({
  players,
  self,
  onMove,
  onTable,
  view,
  area = 'lounge',
  seatedAt = null,
  sheetOpen = false,
}: RoomFloorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [runMode, setRunMode] = useState(false);
  const layout = SCENE_LAYOUT[area];
  const me = players.find((p) => p.id === self && p.area === area);
  // My position is simulated locally every frame (continuous walking with
  // table collision) and sent at a throttle, like the village.
  const [local, setLocal] = useState<{
    point: ScenePoint;
    motion: 'walk' | 'run' | null;
    facing: 1 | -1;
  } | null>(null);
  const live = useRef({
    point: me ? { x: me.x, y: me.y } : null as ScenePoint | null,
    held: new Set<string>(),
    shift: false,
    target: null as ScenePoint | null,
    lastSent: null as ScenePoint | null,
    moving: false,
    /** Walking up to this table; its action runs on arrival. */
    approach: null as GameKind | null,
    locked: false,
  });
  useEffect(() => {
    live.current.locked = !!seatedAt;
    if (seatedAt) {
      live.current.held.clear();
      live.current.target = null;
      live.current.approach = null;
    }
  }, [seatedAt]);
  const latest = useRef({ onMove, runMode, area, onTable });
  useEffect(() => {
    latest.current = { onMove, runMode, area, onTable };
  }, [onMove, runMode, area, onTable]);
  // The one action button: the nearest table within reach ("둘러보기", E).
  const [near, setNear] = useState<GameKind | null>(null);
  const nearRef = useRef<GameKind | null>(null);
  const [touch] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(hover: none) and (pointer: coarse)').matches,
  );
  // Adopt server positions (entering, seats after a game) while standing still.
  useEffect(() => {
    if (!me) return;
    const state = live.current;
    const sent = state.lastSent;
    if (
      !state.point ||
      (!state.moving &&
        (!sent || Math.hypot(sent.x - me.x, sent.y - me.y) > 0.6))
    ) {
      state.point = { x: me.x, y: me.y };
      setLocal(null);
    }
  }, [me?.x, me?.y, me]);
  useEffect(() => {
    let frame = 0,
      previous = 0,
      lastSend = 0,
      facing: 1 | -1 = 1,
      wasMoving = false;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = previous ? Math.min((now - previous) / 1000, 0.25) : 0;
      previous = now;
      const state = live.current;
      if (!state.point || !dt) return;
      let dx = 0,
        dy = 0;
      for (const code of state.held) {
        const d = SCENE_KEYS[code];
        if (d) {
          dx += d[0];
          dy += d[1];
        }
      }
      if (state.locked) dx = dy = 0;
      const running = state.shift || latest.current.runMode;
      const speed = SCENE_WALK_SPEED * (running ? 1.65 : 1) * dt;
      if (dx || dy) {
        state.target = null;
        state.approach = null;
      } else if (state.target && !state.locked) {
        dx = state.target.x - state.point.x;
        dy = state.target.y - state.point.y;
        if (Math.hypot(dx, dy) < 0.3) {
          state.target = null;
          dx = dy = 0;
        }
      }
      const length = Math.hypot(dx, dy);
      let moved = false;
      if (length > 0) {
        const step = state.target ? Math.min(speed, length) : speed;
        const next = sceneStep(
          state.point,
          (dx / length) * step,
          (dy / length) * step,
          latest.current.area,
        );
        moved = Math.hypot(next.x - state.point.x, next.y - state.point.y) > 0.01;
        if (!moved) state.target = null;
        if (Math.abs(next.x - state.point.x) > 0.01)
          facing = next.x < state.point.x ? -1 : 1;
        state.point = next;
      }
      state.moving = moved;
      if (moved || wasMoving)
        setLocal({
          point: { ...state.point },
          motion: moved ? (running ? 'run' : 'walk') : null,
          facing,
        });
      if ((moved && now - lastSend > 150) || (!moved && wasMoving)) {
        const sent = state.lastSent;
        if (!sent || Math.hypot(sent.x - state.point.x, sent.y - state.point.y) > 0.05) {
          latest.current.onMove(state.point.x, state.point.y);
          state.lastSent = { ...state.point };
          lastSend = now;
        }
      }
      wasMoving = moved;
      if (!state.target && state.approach) {
        const game = state.approach;
        state.approach = null;
        if (sceneNearestTable(state.point, latest.current.area)?.game === game)
          latest.current.onTable(game);
      }
      const table = sceneNearestTable(state.point, latest.current.area)?.game ?? null;
      if (table !== nearRef.current) {
        nearRef.current = table;
        setNear(table);
      }
    };
    frame = requestAnimationFrame(tick);
    const release = () => {
      live.current.held.clear();
      live.current.shift = false;
    };
    window.addEventListener('blur', release);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('blur', release);
    };
  }, []);
  // Tapping a table walks me up to it; its action runs when I arrive.
  const approach = (game: GameKind) => {
    const state = live.current;
    if (state.locked || !state.point) return;
    state.held.clear();
    state.target = sceneTableSide(area, game);
    state.approach = game;
    ref.current?.focus({ preventScroll: true });
  };
  return (
    <div className={`cf-scene-shell cf-scene-${area}`}>
      <div
        ref={ref}
        className="cf-scene"
        tabIndex={0}
        role="application"
        aria-label={`${area === 'casino' ? '카지노' : '회관'} 공간. 바닥을 누르거나 방향키와 WASD로 이동합니다. 테이블을 누르면 그 자리로 걸어가고, 가까이에서 E를 누르면 앉거나 구경해요.`}
        onKeyDown={(e) => {
          if (
            document.querySelector('dialog[open]') ||
            e.altKey ||
            e.ctrlKey ||
            e.metaKey
          )
            return;
          live.current.shift = e.shiftKey;
          if (e.code === 'KeyE' || e.code === 'Enter') {
            if (e.target !== e.currentTarget) return;
            if (nearRef.current && !live.current.locked) {
              e.preventDefault();
              latest.current.onTable(nearRef.current);
            }
            return;
          }
          // Physical key codes: WASD also works with a Korean IME active.
          if (!SCENE_KEYS[e.code]) return;
          e.preventDefault();
          live.current.held.add(e.code);
        }}
        onKeyUp={(e) => {
          live.current.shift = e.shiftKey;
          live.current.held.delete(e.code);
        }}
        onBlur={() => {
          live.current.held.clear();
          live.current.shift = false;
        }}
        onPointerDown={(e) => {
          if ((e.target as Element).closest('button') || e.button !== 0) return;
          if (live.current.locked) return;
          ref.current?.focus({ preventScroll: true });
          const r = e.currentTarget.getBoundingClientRect();
          const point = {
            x: ((e.clientX - r.left) / r.width) * 100,
            y: ((e.clientY - r.top) / r.height) * 100,
          };
          if (point.y < layout.floor.back - 5) return;
          const destination = unprojectFloor(point, area);
          live.current.target = destination;
          live.current.approach = null;
        }}
      >
        <img
          className="cf-room-art"
          src={area === 'casino' ? LOUNGE_ASSETS.casino : LOUNGE_ASSETS.room}
          alt={
            area === 'casino'
              ? '은은한 조명의 범타듀 카지노'
              : '햇살과 생활감이 가득한 범타듀 밸리의 마을 회관'
          }
          draggable={false}
        />
        <div className="cf-room-caption" aria-hidden="true">
          <span>
            {area === 'casino' ? '오늘 밤의 한 판' : '일곱 친구의 아지트'}
          </span>
          <strong>{area === 'casino' ? '범타듀 카지노' : '범마을 회관'}</strong>
        </div>
        <button
          type="button"
          className="cf-run-toggle"
          aria-pressed={runMode}
          onClick={(event) => {
            event.stopPropagation();
            setRunMode((running) => !running);
          }}
        >
          <Footprints size={14} aria-hidden="true" />
          달리기 {runMode ? '켜짐' : '꺼짐'}
        </button>
        {layout.tables.map((table) => (
          <SceneGameTable
            key={table.game}
            table={table}
            view={view}
            onApproach={approach}
          />
        ))}
        {players
          .filter((p) => p.area === area)
          .map((p) =>
            p.id === self && local ? (
              <WorldFriend
                key={p.id}
                p={{ ...p, x: local.point.x, y: local.point.y }}
                self={self}
                area={area}
                local={{ motion: local.motion, facing: local.facing }}
              />
            ) : (
              <WorldFriend key={p.id} p={p} self={self} area={area} />
            ),
          )}
        <span className="cf-scene-hint">
          <Footprints size={12} aria-hidden="true" />
          바닥을 눌러 이동<span> · 방향키 / WASD</span>
        </span>
      </div>
      {near && !seatedAt && !sheetOpen && (() => {
        const state = tableState(view, near);
        const kind = tableAction(state);
        return (
          <ActionButton
            className="cf-action"
            kind={kind}
            detail={tableLabel(state).text}
            label={`${GAME_INFO[near].name} ${TABLE_ACTION_LABEL[kind]}`}
            touch={touch}
            onPress={() => onTable(near)}
          />
        );
      })()}
      <div className="cf-scene-table-list" aria-label="게임 테이블">
        {layout.tables.map(({ game }) => {
          const state = tableState(view, game);
          return (
            <button
              type="button"
              key={game}
              onClick={() => approach(game)}
              className={`is-${state.phase}${state.called || state.fill ? ' is-called' : ''}`}
              aria-label={`${tableLabel(state).text} · 누르면 테이블로 걸어가요`}
            >
              <strong>{GAME_INFO[game].name}</strong>
              <span>{tableLabel(state).status}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
