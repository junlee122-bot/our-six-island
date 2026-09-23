'use client';

// Native game sprites preserve their alpha and share the room's existing asset loader.
/* oxlint-disable next/no-img-element */
// This application surface supports directional navigation and contains real table buttons.
/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { ArrowUpRight, Footprints } from 'lucide-react';
import { AvatarView } from './avatar-view';
import { LOUNGE_ASSETS } from './lounge-assets';
import {
  GAME_INFO,
  type GameKind,
  type LoungePlayer,
  type LoungeView,
} from './lounge-room';
import { ACTORS } from './theater-data';
import {
  SCENE_LAYOUT,
  projectPlayer,
  unprojectFloor,
  sceneDepth,
  type SceneArea,
  type SceneTable,
} from './lounge-scene-layout';
import './lounge-scene.css';

type RoomFloorProps = {
  players: LoungePlayer[];
  self: string;
  onMove: (x: number, y: number) => void;
  onTable: (kind: GameKind) => void;
  view: LoungeView;
  area?: SceneArea;
};

function tableSummary(view: LoungeView, game: GameKind) {
  const connected = view.status === 'connected';
  const match = connected ? view[game] : null;
  const ended =
    game === 'chess' ? !!view.chess?.winner : view[game]?.phase === 'over';
  const invite = connected
    ? view.invites.find(
        (item) => item.game === game && item.status === 'waiting',
      )
    : undefined;
  const seats = connected ? view.seats[game] : [];
  const capacity =
    invite?.required ?? (seats.length || GAME_INFO[game].players);
  const count = seats.filter(Boolean).length;
  const names = seats.flatMap((id, index) => {
    if (!id) return [];
    const player = view.players.find((p) => p.id === id);
    return [player ? ACTORS[player.actor] : view.names[game][index] || '친구'];
  });
  return {
    status: match
      ? ended
        ? '결과 보기'
        : '게임 중'
      : invite
        ? '초대 중'
        : '함께하기',
    active: !!match && !ended,
    occupancy: `${count}/${capacity}명`,
    detail: names.length ? names.join(', ') : '아직 빈 테이블이에요',
  };
}

function WorldFriend({
  p,
  self,
  area,
}: {
  p: LoungePlayer;
  self: string;
  area: SceneArea;
}) {
  const [walking, setWalking] = useState(false);
  const [expiredEmoteAt, setExpiredEmoteAt] = useState(0);
  const position = useRef({ x: p.x, y: p.y });
  useEffect(() => {
    if (position.current.x === p.x && position.current.y === p.y) return;
    position.current = { x: p.x, y: p.y };
    setWalking(true);
    const timer = setTimeout(() => setWalking(false), 800);
    return () => clearTimeout(timer);
  }, [p.x, p.y]);
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
  return (
    <div
      className={`cf-player${p.id === self ? ' cf-player-self' : ''}`}
      style={{
        left: `${foot.x}%`,
        top: `${foot.y}%`,
        zIndex: sceneDepth(foot.y),
      }}
      data-player={p.id}
    >
      <span className="cf-player-shadow" aria-hidden="true" />
      <AvatarView
        actor={p.actor}
        look={p.look}
        animated
        motion={walking ? 'walk' : waving ? 'wave' : 'idle'}
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
  onTable,
}: {
  table: SceneTable;
  view: LoungeView;
  onTable: (kind: GameKind) => void;
}) {
  const summary = tableSummary(view, table.game);
  const style: CSSProperties = {
    left: `${table.foot.x}%`,
    top: `${table.foot.y}%`,
    width: `${table.width}%`,
    transform: `translate(-${table.imageAnchor.x}%, -${table.imageAnchor.y}%)`,
    zIndex: sceneDepth(table.foot.y),
  };
  const art =
    (LOUNGE_ASSETS as typeof LOUNGE_ASSETS & { clubTable?: string })
      .clubTable ?? '/assets/lounge/club-table.png';
  return (
    <button
      type="button"
      className={`cf-game-table cf-game-${table.game}`}
      style={style}
      onClick={() => onTable(table.game)}
      aria-label={`${GAME_INFO[table.game].name} 테이블 열기 · ${summary.status} · ${summary.occupancy}`}
      title={`${GAME_INFO[table.game].name} · ${summary.detail}`}
    >
      <img className="cf-table-art" src={art} alt="" draggable={false} />
      <span className="cf-table-label">
        <strong>
          {GAME_INFO[table.game].name}
          <ArrowUpRight aria-hidden="true" size={12} />
        </strong>
        <span className="cf-table-meta">
          <i
            className={
              summary.active
                ? 'cf-status-dot cf-status-active'
                : 'cf-status-dot'
            }
          />
          {summary.status}
          <span>{summary.occupancy}</span>
        </span>
      </span>
    </button>
  );
}

export function RoomFloor({
  players,
  self,
  onMove,
  onTable,
  view,
  area = 'lounge',
}: RoomFloorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastMove = useRef(0);
  const layout = SCENE_LAYOUT[area];
  const move = useCallback(
    (dx: number, dy: number) => {
      const p = players.find((p) => p.id === self);
      if (p)
        onMove(
          Math.max(15, Math.min(85, p.x + dx)),
          Math.max(42, Math.min(88, p.y + dy)),
        );
    },
    [players, self, onMove],
  );
  return (
    <div className={`cf-scene-shell cf-scene-${area}`}>
      <div
        ref={ref}
        className="cf-scene"
        tabIndex={0}
        role="application"
        aria-label={`${area === 'casino' ? '카지노' : '회관'} 공간. 바닥을 누르거나 방향키와 WASD로 이동합니다. 탁자를 누르면 게임이 열립니다.`}
        onKeyDown={(e) => {
          if (
            document.querySelector('dialog[open]') ||
            e.altKey ||
            e.ctrlKey ||
            e.metaKey
          )
            return;
          const d: Record<string, [number, number]> = {
            ArrowLeft: [-3, 0],
            a: [-3, 0],
            ArrowRight: [3, 0],
            d: [3, 0],
            ArrowUp: [0, -3],
            w: [0, -3],
            ArrowDown: [0, 3],
            s: [0, 3],
          };
          const direction = d[e.key] ?? d[e.key.toLowerCase()];
          if (!direction) return;
          e.preventDefault();
          if (Date.now() - lastMove.current > 110) {
            move(...direction);
            lastMove.current = Date.now();
          }
        }}
        onPointerDown={(e) => {
          if ((e.target as Element).closest('button') || e.button !== 0) return;
          ref.current?.focus({ preventScroll: true });
          const r = e.currentTarget.getBoundingClientRect();
          const point = {
            x: ((e.clientX - r.left) / r.width) * 100,
            y: ((e.clientY - r.top) / r.height) * 100,
          };
          if (point.y < layout.floor.back - 5) return;
          const destination = unprojectFloor(point, area);
          onMove(destination.x, destination.y);
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
        {layout.tables.map((table) => (
          <SceneGameTable
            key={table.game}
            table={table}
            view={view}
            onTable={onTable}
          />
        ))}
        {players
          .filter((p) => p.area === area)
          .map((p) => (
            <WorldFriend key={p.id} p={p} self={self} area={area} />
          ))}
        <span className="cf-scene-hint">
          <Footprints size={12} aria-hidden="true" />
          바닥을 눌러 이동<span> · 방향키 / WASD</span>
        </span>
      </div>
      <div className="cf-scene-table-list" aria-label="게임 테이블">
        {layout.tables.map(({ game }) => {
          const summary = tableSummary(view, game);
          return (
            <button
              type="button"
              key={game}
              onClick={() => onTable(game)}
              title={summary.detail}
            >
              <strong>
                {GAME_INFO[game].name}
                <ArrowUpRight size={13} aria-hidden="true" />
              </strong>
              <span>
                {summary.status} · {summary.occupancy}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
