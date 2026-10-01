'use client';
// The hub minimap's panel for a district (lounge-district-minimap.ts): the
// same corner, toggle, size switch and pins. Places and friends walk me there;
// residents walking about show as small dots.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Footprints, Minus, Plus, X } from '../ui/icons';
import { districtFriendPins, districtMinimap, type MiniShape, type MiniTone } from '../lounge-district-minimap';
import { villageFriendGroups } from '../lounge-village-minimap';
import type { OutdoorArea } from '../lounge-areas';
import type { WalkPoint } from '../lounge-walk-world';
import { ACTORS } from '../lounge-roster';
import { NPCS, type NpcId } from '../lounge-npc-data';
import '../lounge-minimap.css';

/** The hub minimap's colours (lounge-village.tsx), by what a shape is. */
const TONE: Record<MiniTone, string> = {
  road: '#f7efd1',
  plaza: '#ecdcae',
  lawn: '#cfd9a6',
  water: '#96c9c2',
  deck: '#b58d58',
  stone: '#9b958a',
  board: '#c9a06a',
  stall: '#d9a066',
  civic: '#6f8fa3',
  lamp: '#e56b5d',
  wall: '#b9b49f',
};
const GROUND = '#dce3ba';
const RESIDENT = '#b5603f';

type Presence = { id: string; actor: number; area?: string; x: number; y: number };
export type DistrictMinimapProps = {
  area: OutdoorArea;
  /** KST weekday (0 = Sunday): which stalls stand today. */
  weekday: number;
  players: readonly Presence[];
  self: string | null;
  /** Where I am now (district coordinates). */
  where: () => WalkPoint;
  /** Residents drawn in the district right now. */
  residents: () => readonly { id: NpcId; x: number; z: number }[];
  /** Walk to a district point. */
  onGo: (p: WalkPoint) => void;
};

function Shape({ s }: { s: MiniShape }) {
  const fill = s.fill ?? TONE[s.tone];
  return s.kind === 'rect' ? (
    <rect x={s.x - s.w / 2} y={s.z - s.d / 2} width={s.w} height={s.d} rx={s.tone === 'civic' ? 0.6 : 0.3} fill={fill} />
  ) : (
    <circle cx={s.x} cy={s.z} r={s.r} fill={fill} />
  );
}

export function DistrictMinimap({ area, weekday, players, self, where, residents, onGo }: DistrictMinimapProps) {
  const map = useMemo(() => districtMinimap(area, weekday), [area, weekday]);
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [friendGroup, setFriendGroup] = useState<string | null>(null);
  const [nearest, setNearest] = useState<string | null>(null);
  const [npcs, setNpcs] = useState<readonly { id: NpcId; x: number; z: number }[]>([]);
  const selfRef = useRef<SVGCircleElement>(null);
  const latest = useRef({ where, residents });
  useEffect(() => {
    latest.current = { where, residents };
  });
  // My dot follows every frame while the map is open; the nearest place and the residents twice a second.
  useEffect(() => {
    if (!open || !map) return;
    let frame = 0,
      last = 0,
      lx = NaN,
      lz = NaN;
    const tick = (t: number) => {
      frame = requestAnimationFrame(tick);
      const p = latest.current.where();
      if (p.x !== lx || p.z !== lz) {
        lx = p.x;
        lz = p.z;
        selfRef.current?.setAttribute('cx', String(p.x));
        selfRef.current?.setAttribute('cy', String(p.z));
      }
      if (t - last < 500) return;
      last = t;
      let best: { id: string; d: number } | null = null;
      for (const pl of map.places) {
        if (pl.kind === 'house') continue;
        const d = Math.hypot(pl.go.x - p.x, pl.go.z - p.z);
        if (d < 6 && (!best || d < best.d)) best = { id: pl.id, d };
      }
      setNearest(best?.id ?? null);
      const now = latest.current.residents();
      setNpcs((was) =>
        was.length === now.length && was.every((r, i) => r.id === now[i].id && Math.abs(r.x - now[i].x) < 0.5 && Math.abs(r.z - now[i].z) < 0.5) ? was : now.map((r) => ({ ...r })),
      );
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [open, map]);
  if (!map) return null;

  const { w, d } = map.bounds;
  // Pins stay inside the map; a named pin keeps its label off the edge too.
  const pos = (p: { x: number; z: number }, label = false) => {
    const mx = label ? 4 : 1,
      x = Math.max(-w / 2 + mx, Math.min(w / 2 - mx, p.x)),
      z = Math.max(-d / 2 + 1.5, Math.min(d / 2 - 1.5, p.z));
    return { left: `${((x + w / 2) / w) * 100}%`, top: `${((z + d / 2) / d) * 100}%` };
  };
  const scale = w / 100;
  const friends = districtFriendPins(players, self, area);
  const groups = villageFriendGroups(friends, (expanded ? 400 : 260) / w);
  const shown = groups.find((g) => g.key === friendGroup);
  const go = (p: WalkPoint) => {
    onGo(p);
    setFriendGroup(null);
    if (expanded) setExpanded(false);
  };
  const onFriendKey = (e: { key: string; preventDefault: () => void; stopPropagation: () => void }) => {
    if (e.key === 'Escape' && shown) {
      e.preventDefault();
      e.stopPropagation();
      setFriendGroup(null);
    }
  };
  const near = map.places.find((p) => p.id === nearest);
  const start = where();

  return (
    <nav
      aria-label={`${map.name} 지도`}
      className={`hv-minimap${open ? ' is-open' : ''}${expanded ? ' is-expanded' : ''}`}
      data-testid="minimap"
      data-minimap-area={area}
    >
      <button
        type="button"
        className="hv-minimap-toggle"
        data-testid="minimap-toggle"
        aria-expanded={open}
        aria-controls="hv-district-minimap-body"
        onClick={() => {
          setOpen(!open);
          setFriendGroup(null);
        }}
        aria-label={open ? '미니맵 접기' : '미니맵 펼치기'}
      >
        <Compass size={17} aria-hidden="true" />
        <span>{open ? '지도 접기' : '지도 펼치기'}</span>
        {open && <X size={14} aria-hidden="true" />}
      </button>
      {open && (
        <div id="hv-district-minimap-body" className="hv-minimap-body">
          <div className="hv-minimap-tools">
            <strong>{map.name}</strong>
            <button
              type="button"
              onClick={() => {
                setExpanded(!expanded);
                setFriendGroup(null);
              }}
              aria-expanded={expanded}
              aria-label={expanded ? '미니맵 축소' : '미니맵 확대'}
              data-testid="minimap-resize"
            >
              {expanded ? <Minus size={14} /> : <Plus size={14} />}
              {expanded ? '축소' : '확대'}
            </button>
          </div>
          <div className="hv-minimap-map">
            <div className="hv-minimap-overview">
              <svg viewBox={[-w / 2, -d / 2, w, d].join(' ')} aria-hidden="true">
                <rect x={-w / 2} y={-d / 2} width={w} height={d} rx={3 * scale} fill={GROUND} />
                {map.shapes.map((s, i) => (
                  <Shape key={i} s={s} />
                ))}
                {map.places.map((p) =>
                  p.kind === 'fish' ? <circle key={p.id} cx={p.x} cy={p.z} r={1.1 * scale} fill={TONE.water} stroke="#fff6dd" strokeWidth={0.4 * scale} /> : null,
                )}
                {npcs.map((r) => (
                  <circle key={r.id} cx={r.x} cy={r.z} r={1.1 * scale} fill={RESIDENT} stroke="#fff6dd" strokeWidth={0.4 * scale} />
                ))}
                <circle ref={selfRef} cx={start.x} cy={start.z} r={2 * scale} fill="#fff6dd" stroke="#536642" strokeWidth={scale} />
              </svg>
            </div>
            {map.places.map((p) => (
              <button
                key={p.id}
                type="button"
                className="hv-minimap-place"
                data-minimap-place={p.id}
                data-minimap-kind={p.kind}
                data-named={String(p.named || expanded || p.id === nearest)}
                data-nearest={String(p.id === nearest)}
                style={pos(p, true)}
                onClick={() => go(p.go)}
                aria-label={`${p.title}${p.id === nearest ? ' (가장 가까운 곳)' : ''}`}
              >
                <span aria-hidden="true">{p.label}</span>
              </button>
            ))}
            {npcs.map((r) => (
              <button
                key={r.id}
                type="button"
                className="hv-minimap-place"
                data-minimap-resident={r.id}
                data-named="false"
                data-nearest="false"
                style={pos(r)}
                onClick={() => go({ x: r.x, z: r.z + 1.1 })}
                aria-label={`${NPCS[r.id].name}에게 걸어가기`}
              >
                <span aria-hidden="true">{NPCS[r.id].name}</span>
              </button>
            ))}
            {groups.map((group) => {
              const friend = group.friends[0],
                clustered = group.friends.length > 1;
              const label = clustered
                ? group.friends.map((p) => ACTORS[p.actor]).join(' · ') + ' 위치 목록'
                : `${ACTORS[friend.actor]} · ${friend.location}${friend.indoor ? ' 안' : ''}`;
              return (
                <button
                  type="button"
                  key={group.key}
                  className="hv-minimap-friend"
                  data-minimap-friend={clustered ? undefined : friend.actor}
                  data-minimap-cluster={clustered ? group.friends.length : undefined}
                  data-indoor={String(group.friends.every((p) => p.indoor))}
                  aria-label={clustered ? label : label + ' 위치로 걸어가기'}
                  title={label}
                  aria-expanded={clustered ? friendGroup === group.key : undefined}
                  aria-controls={clustered ? 'hv-district-minimap-peers' : undefined}
                  onKeyDown={onFriendKey}
                  style={pos(group.point)}
                  onClick={() => (clustered ? setFriendGroup(friendGroup === group.key ? null : group.key) : go(friend.point))}
                >
                  <b aria-hidden="true">{clustered ? group.friends.length : ACTORS[friend.actor].slice(0, 1)}</b>
                  <span>{clustered ? `친구 ${group.friends.length}명` : ACTORS[friend.actor] + (friend.indoor ? ' · 실내' : '')}</span>
                </button>
              );
            })}
          </div>
          <small className="hv-minimap-note">{near ? `가까운 곳 · ${near.label}` : '장소를 클릭하면 걸어가요'}</small>
          <small className="hv-minimap-legend">
            나: 빈 원 · 친구 {friends.length}명 · 주민 {npcs.length}명
          </small>
          {shown && shown.friends.length > 1 && (
            <section id="hv-district-minimap-peers" className="hv-minimap-peers" aria-label="모여 있는 친구들">
              <header>
                <strong>여기 있는 친구들</strong>
                <button type="button" aria-label="친구 위치 목록 닫기" onKeyDown={onFriendKey} onClick={() => setFriendGroup(null)}>
                  <X size={16} />
                </button>
              </header>
              {shown.friends.map((friend) => (
                <button
                  type="button"
                  key={friend.id}
                  data-minimap-friend={friend.actor}
                  data-indoor={String(friend.indoor)}
                  onKeyDown={onFriendKey}
                  onClick={() => go(friend.point)}
                >
                  <strong>{ACTORS[friend.actor]}</strong>
                  <small>
                    {friend.location}
                    {friend.indoor ? ' 안' : ''}
                  </small>
                  <Footprints size={15} aria-hidden="true" />
                </button>
              ))}
            </section>
          )}
        </div>
      )}
    </nav>
  );
}
