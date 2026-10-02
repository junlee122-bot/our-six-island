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
import { Footprints } from './ui/icons';
import { AvatarView } from './avatar-view';
import { VENUES } from './lounge-venues';
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
  sceneNearestTable,
  sceneTableSide,
  type SceneArea,
  type ScenePoint,
  type SceneTable,
} from './lounge-scene-layout';
import { ActionButton } from './lounge/ActionButton';
import './lounge-scene.css';
import { boundAction } from './lounge-scene-keys';
import { interiorPath, interiorStep } from './lounge-interior-layout';
import { CASINO_LENDER_SPOT, CASINO_LENDER_FRONT, LENDER_NAME, nearCasinoLender } from './lounge-casino-lender';
import { BANKER_SPOT, BANKER_FRONT, BANKER_NAME, BANK_OBSTACLES, nearBanker } from './lounge-bank-layout';
import { SALON_STYLIST_SPOT, SALON_FRONT, SALON_STYLIST_NAME, SALON_OBSTACLES, nearSalon } from './lounge-salon-layout';
import { SHOP_INTERIORS, isShopArea, nearShopCounter, shopObstacles, type ShopArea } from './lounge-shop-interiors';
import { NPCS } from './lounge-npc-data';

type RoomFloorProps = {
  players: LoungePlayer[];
  self: string;
  onMove: (x: number, y: number) => void;
  /** The table's action (앉기 / 자리 잡기 / 구경하기 / 이어하기), after walking up to it. */
  onTable: (kind: GameKind) => void;
  onLender?: () => void;
  onBanker?: () => void;
  onSalon?: () => void;
  /** A shop room's counter (opens the shop's window). */
  onCounter?: () => void;
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
      aria-label={`${label.text} · 클릭하면 테이블로 걸어가요`}
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

/** The flat (간단 그래픽) look of each interior; the tavern borrows the hall's art, tinted. */
const shopArt = (area: ShopArea) => ({
  src: LOUNGE_ASSETS.room,
  alt: SHOP_INTERIORS[area].name,
  short: SHOP_INTERIORS[area].short,
  tagline: SHOP_INTERIORS[area].tagline,
  title: SHOP_INTERIORS[area].name,
});
const FLAT_ART: Record<SceneArea, { src: string; alt: string; short: string; tagline: string; title: string }> = {
  bakery: shopArt('bakery'),
  coop: shopArt('coop'),
  general: shopArt('general'),
  fishmarket: shopArt('fishmarket'),
  broker: shopArt('broker'),
  salon: { src: LOUNGE_ASSETS.wardrobe, alt: '그웬의 미용실', short: '미용실', tagline: '그웬과 오늘의 모습을 골라요', title: '미용실' },
  bank: {
    src: LOUNGE_ASSETS.room, alt: '범마을 은행', short: '은행',
    tagline: '통장과 약속을 맡기는 곳', title: '범마을 은행',
  },
  lounge: {
    src: LOUNGE_ASSETS.room,
    alt: '햇살과 생활감이 가득한 범타듀 밸리의 마을 회관',
    short: '회관',
    tagline: '일곱 친구의 아지트',
    title: '범마을 회관',
  },
  casino: {
    src: LOUNGE_ASSETS.casino,
    alt: '은은한 조명의 범타듀 카지노',
    short: '카지노',
    tagline: '오늘 밤의 한 판',
    title: '범타듀 카지노',
  },
  tavern: {
    src: LOUNGE_ASSETS.room,
    alt: '호박색 등불 아래 허풍 주점',
    short: '주점',
    tagline: VENUES.tavern.tagline,
    title: VENUES.tavern.name,
  },
};

export function RoomFloor({
  players,
  self,
  onMove,
  onTable,
  onLender,
  onBanker,
  onSalon,
  onCounter,
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
    route: [] as ScenePoint[],
    lastSent: null as ScenePoint | null,
    moving: false,
    /** Walking up to this table; its action runs on arrival. */
    approach: null as GameKind | null,
    locked: false,
  });
  useEffect(() => {
    live.current.locked = !!seatedAt || sheetOpen;
    if (live.current.locked) {
      live.current.held.clear();
      live.current.shift = false;
      live.current.target = null;
      live.current.route = [];
      live.current.approach = null;
    }
  }, [seatedAt, sheetOpen]);
  const latest = useRef({ onMove, runMode, area, onTable, onLender, onBanker, onSalon, onCounter });
  useEffect(() => {
    latest.current = { onMove, runMode, area, onTable, onLender, onBanker, onSalon, onCounter };
  }, [onMove, runMode, area, onTable, onLender, onBanker, onSalon, onCounter]);
  // The one action button: the nearest table within reach ("둘러보기", E).
  const [near, setNear] = useState<GameKind | null>(null);
  const nearRef = useRef<GameKind | null>(null);
  const [nearService, setNearService] = useState<'lender' | 'banker' | 'salon' | 'counter' | null>(null);
  const serviceRef = useRef<'lender' | 'banker' | 'salon' | 'counter' | null>(null);

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
      wasMoving = false,
      dialogAt = -1000,
      dialogOpen = false;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = previous ? Math.min((now - previous) / 1000, 0.25) : 0;
      previous = now;
      const state = live.current;
      if (!state.point || !dt) return;
      // A DOM query per frame adds up; an open dialog is checked 5× a second.
      if (now - dialogAt > 200) {
        dialogAt = now;
        dialogOpen = !!document.querySelector('dialog[open]');
      }
      if (dialogOpen) {
        state.held.clear(); state.shift = false; state.target = null; state.route = []; state.approach = null;
      }
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
        state.route = [];
        state.approach = null;
      } else if (state.target && !state.locked) {
        dx = state.target.x - state.point.x;
        dy = state.target.y - state.point.y;
        if (Math.hypot(dx, dy) < 0.3) {
          state.target = state.route.shift() ?? null;
          dx = dy = 0;
        }
      }
      const length = Math.hypot(dx, dy);
      let moved = false;
      if (length > 0) {
        const step = state.target ? Math.min(speed, length) : speed;
        const next = interiorStep(
          state.point,
          (dx / length) * step,
          (dy / length) * step,
          latest.current.area,
        );
        moved = Math.hypot(next.x - state.point.x, next.y - state.point.y) > 0.01;
        if (!moved) { state.target = null; state.route = []; }
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
      const service = nearCasinoLender(state.point, latest.current.area) ? 'lender'
        : nearBanker(state.point, latest.current.area) ? 'banker' : nearSalon(state.point, latest.current.area) ? 'salon'
          : nearShopCounter(state.point, latest.current.area) ? 'counter' : null;
      if (service !== serviceRef.current) { serviceRef.current = service; setNearService(service); }
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
    state.route = [];
    state.approach = game;
    ref.current?.focus({ preventScroll: true });
  };
  const approachService = () => {
    const state = live.current;
    if (state.locked || !state.point || (area !== 'casino' && area !== 'bank' && area !== 'salon' && !isShopArea(area))) return;
    state.held.clear(); state.approach = null;
    state.route = interiorPath(state.point, isShopArea(area) ? SHOP_INTERIORS[area].front : area === 'casino' ? CASINO_LENDER_FRONT : area === 'salon' ? SALON_FRONT : BANKER_FRONT, area);
    state.target = state.route.shift() ?? null;
    ref.current?.focus({ preventScroll: true });
  };
  const openService = () => {
    const state = live.current;
    if (state.locked || !state.point) return;
    if (nearCasinoLender(state.point, area)) onLender?.();
    else if (nearBanker(state.point, area)) onBanker?.();
    else if (nearSalon(state.point, area)) onSalon?.();
    else if (nearShopCounter(state.point, area)) onCounter?.();
  };
  const shop = isShopArea(area) ? SHOP_INTERIORS[area] : null;
  const serviceSpot = shop ? { x: shop.front.x, y: shop.front.y - 9 } : area === 'casino' ? CASINO_LENDER_SPOT : area === 'salon' ? SALON_STYLIST_SPOT : BANKER_SPOT;
  const serviceName = shop ? (shop.owner ? NPCS[shop.owner].name : shop.short) : area === 'casino' ? LENDER_NAME : area === 'salon' ? SALON_STYLIST_NAME : BANKER_NAME;
  const serviceTitle = shop ? (shop.owner ? `${NPCS[shop.owner].name} · ${shop.short} ${shop.deskWord ?? '계산대'}` : `${shop.short} 창구`) : area === 'casino' ? '로제 · 대출과 상환' : area === 'salon' ? '그웬 · 미용실 원장' : '냐모 · 은행 창구';
  const serviceFoot = projectPlayer(serviceSpot, area);
  return (
    <div className={`cf-scene-shell cf-scene-${area}`}>
      <div
        ref={ref}
        className="cf-scene"
        data-testid="interior-simple"
        tabIndex={0}
        role="application"
        aria-label={`${FLAT_ART[area].short} 공간. 바닥을 클릭하거나 방향키와 WASD로 이동해요. 테이블을 클릭하면 그 자리로 걸어가고, 가까이에서 E를 누르면 앉거나 구경해요.`}
        onKeyDown={(e) => {
          if (
            document.querySelector('dialog[open]') ||
            e.altKey ||
            e.ctrlKey ||
            e.metaKey
          )
            return;
          live.current.shift = e.shiftKey;
          if (boundAction(e.nativeEvent) === 'action' || e.code === 'Enter') {
            if (e.target !== e.currentTarget) return;
            if (serviceRef.current && !live.current.locked) {
              e.preventDefault(); openService(); return;
            }
            if (nearRef.current && !live.current.locked) {
              e.preventDefault();
              latest.current.onTable(nearRef.current);
            }
            return;
          }
          // Physical key codes: WASD also works with a Korean IME active.
          if (!SCENE_KEYS[e.code]) return;
          e.preventDefault();
          if (live.current.locked) return;
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
          live.current.route = [];
          live.current.approach = null;
        }}
      >
        <img
          className="cf-room-art"
          src={FLAT_ART[area].src}
          alt={FLAT_ART[area].alt}
          draggable={false}
        />
        <div className="cf-room-caption" aria-hidden="true">
          <span>
            {FLAT_ART[area].tagline}
          </span>
          <strong>{FLAT_ART[area].title}</strong>
        </div>
        {(area === 'bank' || area === 'salon') && (area === 'bank' ? BANK_OBSTACLES : SALON_OBSTACLES).filter(o => o.id !== 'banker' && o.id !== 'stylist').map(o => {
          const at = projectPlayer(o, area);
          return <span key={o.id} className={'cf-bank-fixture cf-bank-' + o.id} style={{ left: `${at.x}%`, top: `${at.y}%`, width: `${o.rx * 2}%`, height: `${o.ry * 1.3}%` }} aria-hidden="true" />;
        })}
        {shop && shopObstacles(shop.area).filter((o) => !o.staff).map((o) => {
          const at = projectPlayer(o, area);
          return <span key={o.id} className="cf-bank-fixture" style={{ left: `${at.x}%`, top: `${at.y}%`, width: `${o.rx * 2}%`, height: `${o.ry * 1.3}%` }} aria-hidden="true" />;
        })}
        {(area === 'casino' || area === 'bank' || area === 'salon' || shop) && <button type="button" className="cf-service" data-testid={shop ? 'simple-counter' : area === 'casino' ? 'simple-lender' : area === 'salon' ? 'simple-stylist' : 'simple-banker'}
          style={{ left: `${serviceFoot.x}%`, top: `${serviceFoot.y}%` }} onClick={approachService}
          aria-label={shop ? `${shop.short} ${shop.deskWord ?? '계산대'}로 걸어가기` : `${serviceName}에게 걸어가기`}>
          {(!shop || shop.owner) && <img src={shop ? LOUNGE_ASSETS[`chibi_${shop.owner}` as keyof typeof LOUNGE_ASSETS] : area === 'casino' ? LOUNGE_ASSETS.chibi_rose : area === 'salon' ? LOUNGE_ASSETS.chibi_gwen : LOUNGE_ASSETS.chibi_nyamo} alt="" draggable={false} />}
          <span className="cf-service-name">{serviceTitle}</span>
        </button>}
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
          클릭해서 이동<span> · 방향키 / WASD</span>
        </span>
      </div>
      {nearService && !seatedAt && !sheetOpen && <ActionButton className="cf-action" kind="talk" detail={nearService === 'counter' ? serviceTitle : nearService === 'lender' ? '로제 · 카지노 대부' : nearService === 'salon' ? '그웬 · 미용실 원장' : '냐모 · 은행원'} label={nearService === 'counter' ? `${shop?.short ?? ''} 이용하기` : '이야기하기'} onPress={openService} />}
      {!nearService && near && !seatedAt && !sheetOpen && (() => {
        const state = tableState(view, near);
        const kind = tableAction(state);
        return (
          <ActionButton
            className="cf-action"
            kind={kind}
            detail={tableLabel(state).text}
            label={`${GAME_INFO[near].name} ${TABLE_ACTION_LABEL[kind]}`}
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
              aria-label={`${tableLabel(state).text} · 클릭하면 테이블로 걸어가요`}
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
