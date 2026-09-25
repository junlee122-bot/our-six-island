'use client';

// This application surface must receive keyboard focus for directional walking.
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Footprints, LoaderCircle, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import { AvatarView } from './avatar-view';
import { loungeSprites } from './lounge-sprites';
import { GAME_INFO, type GameKind } from './lounge-games';
import type { ChatLine, LoungePlayer, LoungeView } from './lounge-room';
import type { Look } from './lounge-look';
import { ACTORS } from './lounge-roster';
import { reactionVisible, reactionInfo } from './lounge-reactions';
import {
  TABLE_ACTION_LABEL,
  tableAction,
  tableLabel,
  tableState,
  type TableState,
} from './lounge-table-state';
import { sceneTableSide, type SceneArea, type ScenePoint } from './lounge-scene-layout';
import {
  INTERIOR_DOOR,
  INTERIOR_PLACE_EVENT,
  INTERIOR_ROOM,
  interiorAction,
  interiorHover,
  interiorPath,
  interiorStep,
  interiorToWorld,
  interiorTables,
  seatChair,
  seatCount,
  tableSeats,
  worldToInterior,
  type InteriorAction,
} from './lounge-interior-layout';
import { createInteriorScene, SEAT_HEIGHT, TABLE_HEIGHT, type SeatShow } from './lounge-interior-scene';
import { createInteriorHosts } from './lounge-interior-hosts';
import type { TablePhase } from './lounge-table-state';
import { advanceLocomotion, RUN_SPEED_MULTIPLIER, type LocomotionState } from './lounge-locomotion';
import { ActionButton } from './lounge/ActionButton';
import { DealerAvatar } from './lounge-dealer-host';
import { HOSTS } from './lounge-dealer-lines';
import { boundAction, boundDirection, sceneKeyTarget } from './lounge-scene-keys';
import { getSettings, onSettingsChange, qualityProfile, useSettings } from './lounge-settings';
import { keyLabel } from './lounge-keybinds';
import { josa, NAMES } from './lounge-text';
import './lounge-interior-3d.css';

/** Server units per second (the floor is 70 × 46 units), as on the flat floor. */
const WALK_SPEED = 16;
const FIGURE_HEIGHT = 1.72;
/** Figure canvas size (px); loungeSprites.draw puts the soles at 97% of its height. */
const FIGURE_W = 440,
  FIGURE_H = 540;
/** World height of a figure-canvas row (y px from the top). */
const rowHeight = (y: number) => ((FIGURE_H * 0.97 - y) / FIGURE_H) * FIGURE_HEIGHT;
/**
 * Seated figures: below this share of the figure's height are the legs; they
 * are drawn shorter (the thighs point at the table, so only the shins show)
 * and the hips rest on the chair.
 */
const LEG_LINE = 0.75;
const LEG_SQUASH = 0.55;
type Chair = { x: number; z: number; face: number };
/** First and last rows with drawn pixels (null for an empty canvas). */
function opaqueRows(canvas: HTMLCanvasElement) {
  const c = canvas.getContext('2d');
  if (!c) return null;
  const { data, width, height } = c.getImageData(0, 0, canvas.width, canvas.height);
  const filled = (y: number) => {
    for (let x = 3 + y * width * 4, end = x + width * 4; x < end; x += 4) if (data[x] > 40) return true;
    return false;
  };
  let top = 0,
    bottom = height - 1;
  while (top < height && !filled(top)) top++;
  while (bottom > top && !filled(bottom)) bottom--;
  return top < bottom ? { top, bottom } : null;
}
const BUBBLE_MS = 6500;
/** The camera looks in from the front-right (like my room, a little flatter). */
const YAW = (20 * Math.PI) / 180;
const COS = Math.cos(YAW),
  SIN = Math.sin(YAW);
/** Screen-relative keys → floor direction (network units, same scale on x/y). */
const screenToFloor = (h: number, v: number) => ({ x: h * COS + v * SIN, y: -h * SIN + v * COS });
/** Horizontal screen movement of a floor step (for which way a figure faces). */
const floorToScreenX = (dx: number, dy: number) => dx * COS - dy * SIN;

/** When each chat line first reached this browser (for speech bubbles). */
const arrivals = new Map<string, number>();
function chatArrival(id: string) {
  let at = arrivals.get(id);
  if (at === undefined) {
    at = Date.now();
    arrivals.set(id, at);
    if (arrivals.size > 400) arrivals.delete(arrivals.keys().next().value!);
  }
  return at;
}

type Props = {
  area: SceneArea;
  players: LoungePlayer[];
  self: string;
  /** My figure while the server has not placed me here yet. */
  me: { actor: number; look: Look };
  view: LoungeView;
  /** Chat lines of this place (speech bubbles). */
  chat: ChatLine[];
  onMove: (x: number, y: number) => void;
  /** The table's action (앉기 / 자리 잡기 / 구경하기 / 이어하기 / 일어나기). */
  onTable: (game: GameKind) => void;
  /** 나가기 at the door. */
  onExit: () => void;
  /** I am near the door: preload the village. */
  onNearDoor?: () => void;
  /** I sit at this forming table: walking pauses until I stand up. */
  seatedAt?: GameKind | null;
  /** A table sheet is open: its own buttons (and E) replace the action button. */
  sheetOpen?: boolean;
  /** The village's '카지노 VIP룸' project is done (the casino shows its VIP corner). */
  vip?: boolean;
  /** WebGL is not available (or the player chose the simple screen). */
  onUnavailable: () => void;
};

type Figure = {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
  actor: number;
  look: Look;
  pos: ScenePoint;
  locomotion: LocomotionState;
  motion: 'walk' | 'run' | 'idle';
  drawnAt: number;
  /** The chair this figure sits on (null: standing). */
  chair: Chair | null;
  /** A seated figure is posed from this standing drawing. */
  standing: HTMLCanvasElement | null;
  /** Opaque rows of the standing drawing (measured once per look). */
  rows: { top: number; bottom: number } | null;
  /** How far the figure is lowered (seated) — the name tag follows. */
  lift: number;
};

export function Interior3D({
  area,
  players,
  self,
  me,
  view,
  chat,
  onMove,
  onTable,
  onExit,
  onNearDoor,
  seatedAt = null,
  sheetOpen = false,
  vip = false,
  onUnavailable,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef(new Map<string, HTMLElement>());
  const [{ keys }] = useSettings();
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [action, setAction] = useState<InteriorAction | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const layout = useMemo(() => interiorTables(area), [area]);

  // Who is here, and where the seated ones sit (their table seat wins over
  // the last reported spot, so seated friends always show at their table).
  const here = useMemo(() => players.filter((p) => p.area === area), [players, area]);
  const meHere = here.find((p) => p.id === self) ?? null;
  const tables = useMemo(
    () =>
      layout.map((t) => {
        const st = tableState(view, t.game);
        const count = seatCount(st, GAME_INFO[t.game].players);
        return { ...t, state: st, seats: tableSeats(area, t.game, count, st.occupants) };
      }),
    [layout, view, area],
  );
  const seatedPoint = useMemo(() => {
    const map = new Map<string, ScenePoint>();
    for (const t of tables)
      if (t.state.phase !== 'empty')
        for (const s of t.seats) if (s.who && s.who !== self) map.set(s.who, s.at);
    return map;
  }, [tables, self]);
  // The chair each seated player sits on (me too, while I sit at a table).
  const seatedChair = useMemo(() => {
    const map = new Map<string, Chair & { at: ScenePoint }>();
    for (const t of tables)
      if (t.state.phase !== 'empty')
        for (const s of t.seats)
          if (s.who && (s.who !== self || t.game === seatedAt)) map.set(s.who, { ...seatChair(t, s.world), at: s.at });
    return map;
  }, [tables, self, seatedAt]);

  // Speech bubbles and stickers over heads.
  const [openedAt] = useState(() => Date.now());
  const bubbles = useMemo(() => {
    const out: Record<number, { text: string; until: number }> = {};
    for (const line of chat) {
      const at = chatArrival(line.id);
      if (at > openedAt + 300) out[line.actor] = { text: line.text, until: at + BUBBLE_MS };
    }
    return out;
  }, [chat, openedAt]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const bubbleFor = (p: LoungePlayer) => {
    if (p.reaction && reactionVisible(p.reaction, area, undefined, now))
      return reactionInfo(p.reaction.id)?.label;
    const b = bubbles[p.actor];
    return b && b.until > now ? b.text : undefined;
  };

  // ------------------------------------------------------------ latest values
  const latest = useRef({ here, self, me, meHere, seatedPoint, seatedChair, tables, onMove, onTable, onExit, onNearDoor, onUnavailable, sheetOpen });
  useLayoutEffect(() => {
    latest.current = { here, self, me, meHere, seatedPoint, seatedChair, tables, onMove, onTable, onExit, onNearDoor, onUnavailable, sheetOpen };
  });
  const live = useRef({
    point: meHere ? { x: meHere.x, y: meHere.y } : { ...INTERIOR_DOOR },
    adopted: !!meHere,
    held: new Set<'up' | 'down' | 'left' | 'right'>(),
    shift: false,
    /** The waypoint I walk to now, then the rest of the route. */
    target: null as ScenePoint | null,
    route: [] as ScenePoint[],
    /** Where the route ends (the marker on the floor). */
    goal: null as ScenePoint | null,
    lastSent: null as ScenePoint | null,
    moving: false,
    approach: null as GameKind | null,
    locked: false,
  });
  // The casino's VIP corner follows the village project ('vip' flag).
  const vipRef = useRef(vip);
  useLayoutEffect(() => {
    vipRef.current = vip;
  }, [vip]);
  const actionRef = useRef<InteriorAction | null>(null);
  const exited = useRef(false);
  const runAction = (next: InteriorAction | null) => {
    if (!next || live.current.locked) return;
    if (next.kind === 'door') {
      if (exited.current) return;
      exited.current = true;
      latest.current.onExit();
    } else latest.current.onTable(next.game);
  };
  const runRef = useRef(runAction);
  useLayoutEffect(() => {
    runRef.current = runAction;
  });
  useEffect(() => {
    const l = live.current;
    l.locked = !!seatedAt;
    if (seatedAt) {
      l.held.clear();
      l.target = null;
      l.approach = null;
    }
  }, [seatedAt]);
  // The first server position here (walking in at the door or beside a
  // table) is where I stand; later moves arrive as INTERIOR_PLACE_EVENT.
  useEffect(() => {
    if (!meHere) return;
    const l = live.current;
    if (!l.adopted) {
      l.point = { x: meHere.x, y: meHere.y };
      l.adopted = true;
    }
  }, [meHere?.x, meHere?.y, meHere]);

  /** Walk somewhere, around the tables when they are in the way. */
  const walkTo = (goal: ScenePoint) => {
    const l = live.current;
    l.route = interiorPath(l.point, goal, area);
    l.target = l.route.shift() ?? null;
    l.goal = goal;
  };
  const walkToRef = useRef(walkTo);
  useLayoutEffect(() => {
    walkToRef.current = walkTo;
  });
  /** Walk up to a table; its action runs on arrival (as on the flat floor). */
  const approach = (game: GameKind) => {
    const l = live.current;
    if (l.locked) return;
    l.held.clear();
    walkTo(sceneTableSide(area, game));
    l.approach = game;
    hostRef.current?.focus({ preventScroll: true });
  };
  const approachRef = useRef(approach);
  useLayoutEffect(() => {
    approachRef.current = approach;
  });

  // ------------------------------------------------------------ three.js
  useEffect(() => {
    const host = hostRef.current!;
    const l = live.current;
    let disposed = false,
      frame = 0,
      visible = true,
      contextFailed = false,
      dirty = true;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    } catch {
      queueMicrotask(() => {
        if (!disposed) latest.current.onUnavailable();
      });
      return () => {
        disposed = true;
      };
    }
    const quality = qualityProfile(getSettings().quality);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = area === 'casino' ? 1.12 : 1.05;
    renderer.shadowMap.enabled = quality.shadows;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // Only the room and its furniture cast shadows; figures have contact shadows.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    const canvas = renderer.domElement;
    canvas.className = 'ih-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);

    const scene = new THREE.Scene();
    // A fixed orthographic camera like my room's: figures and table legs stay
    // upright anywhere on screen (no perspective lean at the edges).
    const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 90);
    const pitch = (46 * Math.PI) / 180;
    const target = new THREE.Vector3(0, 0.6, -0.3);
    camera.position
      .copy(target)
      .add(new THREE.Vector3(Math.sin(YAW) * Math.cos(pitch), Math.sin(pitch), Math.cos(YAW) * Math.cos(pitch)).multiplyScalar(40));
    camera.lookAt(target);
    camera.updateMatrixWorld();
    const studio = createInteriorScene(scene, area, { lights: quality.effects, vip: vipRef.current });

    // Frame the floor and the back wall (with its name banner) as large as the
    // window allows, leaving room at the top for the HUD.
    const framing = (() => {
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0),
        up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      const r: number[] = [],
        u: number[] = [];
      const add = (x: number, y: number, z: number) => {
        const p = new THREE.Vector3(x, y, z).sub(target);
        r.push(p.dot(right));
        u.push(p.dot(up));
      };
      for (const x of [INTERIOR_ROOM.minX - 0.1, INTERIOR_ROOM.maxX + 0.1]) {
        for (const z of [INTERIOR_ROOM.minZ, INTERIOR_ROOM.maxZ + 0.2]) add(x, 0, z);
        add(x, 3.3, INTERIOR_ROOM.minZ);
      }
      const span = (v: number[]) => ({ lo: Math.min(...v), hi: Math.max(...v) });
      return { right: span(r), up: span(u) };
    })();
    const frameCamera = (aspect: number, height: number) => {
      const { right: r, up: u } = framing;
      // Keep ~88 px of the top for the header over the back wall.
      const top = Math.min(0.14, 88 / Math.max(1, height));
      const halfW = (r.hi - r.lo) / 2,
        halfH = (u.hi - u.lo) / 2 / (1 - top / 2);
      const half = Math.max(halfH, halfW / aspect) * 1.02;
      const cx = (r.hi + r.lo) / 2,
        cy = (u.hi + u.lo) / 2 + half * top * 0.5;
      camera.left = cx - half * aspect;
      camera.right = cx + half * aspect;
      camera.top = cy + half;
      camera.bottom = cy - half;
      camera.updateProjectionMatrix();
    };
    frameCamera(16 / 9, 900);
    const cameraUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);

    // ---------------------------------------------------------- figures
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const figureGeometry = new THREE.PlaneGeometry(FIGURE_HEIGHT * cameraUp.y * (FIGURE_W / FIGURE_H), FIGURE_HEIGHT);
    // loungeSprites.draw places the soles at 97% of the texture's height.
    figureGeometry.translate(0, FIGURE_HEIGHT * 0.47, 0);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 64;
    {
      const c = shadowCanvas.getContext('2d');
      if (c) {
        const g = c.createRadialGradient(32, 32, 4, 32, 32, 31);
        g.addColorStop(0, 'rgba(50, 36, 24, 0.34)');
        g.addColorStop(0.45, 'rgba(50, 36, 24, 0.17)');
        g.addColorStop(1, 'rgba(50, 36, 24, 0)');
        c.fillStyle = g;
        c.fillRect(0, 0, 64, 64);
      }
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    shadowTexture.colorSpace = THREE.SRGBColorSpace;
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false });
    const shadowGeometry = new THREE.PlaneGeometry(0.7, 0.5);
    // The table hosts (루미 / 매화) stand at their tables' ends.
    const hosts = createInteriorHosts(scene, studio.tables, {
      yaw: YAW,
      squash: cameraUp.y,
      shadow: { geometry: shadowGeometry, material: shadowMaterial },
      onLoad: () => {
        dirty = true;
      },
    });
    const hostTables = new Map<GameKind, { phase: TablePhase; seats: number }>();
    const makeFigure = (actor: number, look: Look, at: ScenePoint): Figure => {
      const c = document.createElement('canvas');
      c.width = FIGURE_W;
      c.height = FIGURE_H;
      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      const mesh = new THREE.Mesh(
        figureGeometry,
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.12, toneMapped: false }),
      );
      mesh.rotation.y = YAW;
      const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      shadow.rotation.x = -Math.PI / 2;
      shadow.renderOrder = 1;
      scene.add(mesh, shadow);
      return {
        canvas: c,
        texture,
        mesh,
        shadow,
        actor,
        look,
        pos: { ...at },
        locomotion: { phase: 0, facing: 1 },
        motion: 'idle',
        drawnAt: -1000,
        chair: null,
        standing: null,
        rows: null,
        lift: 0,
      };
    };
    const dropFigure = (f: Figure) => {
      scene.remove(f.mesh, f.shadow);
      (f.mesh.material as THREE.Material).dispose();
      f.texture.dispose();
      f.canvas.width = f.canvas.height = 0;
      if (f.standing) f.standing.width = f.standing.height = 0;
    };
    const mine = makeFigure(latest.current.me.actor, latest.current.me.look, l.point);
    mine.mesh.name = 'me';
    const others = new Map<string, Figure>();
    let sprites: Awaited<ReturnType<typeof loungeSprites>> | null = null;
    const spritesJob = loungeSprites().then(async (value) => {
      const m = latest.current.me;
      await value.ensure(m.actor, m.look);
      sprites = value;
      for (const p of latest.current.here) void value.ensure(p.actor, p.look).catch(() => {});
    });
    const drawFigure = (f: Figure, t: number, force = false) => {
      if (!sprites || (!force && t - f.drawnAt < (f.motion === 'idle' ? 90 : 40))) return;
      f.drawnAt = t;
      if (!f.chair) {
        if (sprites.draw(f.canvas, f.actor, f.look, f.motion, f.locomotion.phase, false, reduced.matches, { facing: f.locomotion.facing })) {
          f.texture.needsUpdate = true;
          dirty = true;
        }
        return;
      }
      // Seated: pose the standing drawing — the body as drawn, the legs shorter.
      if (!f.standing) {
        f.standing = document.createElement('canvas');
        f.standing.width = FIGURE_W;
        f.standing.height = FIGURE_H;
      }
      const facing = f.locomotion.facing;
      if (!sprites.draw(f.standing, f.actor, f.look, 'idle', 0, false, reduced.matches, { facing }) && !force) return;
      if (!f.rows) f.rows = opaqueRows(f.standing);
      if (!f.rows) return;
      const { top, bottom } = f.rows;
      const cut = Math.round(top + (bottom - top) * LEG_LINE);
      const c = f.canvas.getContext('2d');
      if (!c) return;
      c.clearRect(0, 0, FIGURE_W, FIGURE_H);
      c.drawImage(f.standing, 0, 0, FIGURE_W, cut + 1, 0, 0, FIGURE_W, cut + 1);
      c.drawImage(f.standing, 0, cut, FIGURE_W, bottom + 2 - cut, 0, cut, FIGURE_W, (bottom + 2 - cut) * LEG_SQUASH);
      f.texture.needsUpdate = true;
      // The hips (the cut line) rest on the seat.
      f.lift = SEAT_HEIGHT + 0.015 - rowHeight(cut);
      dirty = true;
    };
    // The seated figure stands a little in front of its chair's middle (toward
    // the camera), so the backrest stays behind and the table in front.
    const toCamera = { x: Math.sin(YAW) * 0.1, z: Math.cos(YAW) * 0.1 };
    const placeFigure = (f: Figure) => {
      if (f.chair) {
        f.mesh.position.set(f.chair.x + toCamera.x, f.lift, f.chair.z + toCamera.z);
        f.shadow.position.set(f.chair.x, 0.035, f.chair.z);
        return;
      }
      const w = interiorToWorld(f.pos);
      f.mesh.position.set(w.x, 0.03, w.z);
      f.shadow.position.set(w.x, 0.035, w.z);
    };
    /** Sit down on a chair (or stand up with null); the next draw re-poses. */
    const seatFigure = (f: Figure, chair: Chair | null) => {
      const same = f.chair && chair && f.chair.x === chair.x && f.chair.z === chair.z;
      if (same || (!f.chair && !chair)) return false;
      f.chair = chair ? { x: chair.x, z: chair.z, face: chair.face } : null;
      f.lift = chair ? f.lift : 0;
      if (chair) {
        // Face the table's side of the screen (front-on for the far seats).
        const toward = floorToScreenX(Math.sin(chair.face), Math.cos(chair.face));
        f.locomotion = { ...f.locomotion, facing: Math.abs(toward) < 0.3 ? f.locomotion.facing : toward > 0 ? 1 : -1 };
        f.motion = 'idle';
      }
      f.drawnAt = -1000;
      return true;
    };
    void spritesJob.then(
      () => {
        if (!disposed && !contextFailed) setState('ready');
      },
      () => {
        if (!disposed) setState('ready');
      },
    );

    // ---------------------------------------------------------- pointer
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitPoint = new THREE.Vector3();
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.22, 32),
      new THREE.MeshBasicMaterial({ color: '#fff4cf', transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide }),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.visible = false;
    scene.add(marker);
    const pointAt = (event: PointerEvent): { table: GameKind | null; floor: ScenePoint | null } => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(studio.hits(), false)[0];
      const table = (hit?.object.userData.game as GameKind | undefined) ?? null;
      const onFloor = raycaster.ray.intersectPlane(floor, hitPoint);
      return { table, floor: onFloor ? worldToInterior({ x: onFloor.x, z: onFloor.z }) : null };
    };
    const showMarker = (p: ScenePoint | null) => {
      marker.visible = !!p;
      if (p) {
        const w = interiorToWorld(p);
        marker.position.set(w.x, 0.04, w.z);
      }
      dirty = true;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || contextFailed) return;
      host.focus({ preventScroll: true });
      if (l.locked) return;
      const at = pointAt(event);
      const hover = at.table ? ({ kind: 'table', game: at.table } as const) : at.floor ? interiorHover(at.floor, area) : null;
      if (hover?.kind === 'table') {
        approachRef.current(hover.game);
        showMarker(l.goal);
        return;
      }
      if (!at.floor) return;
      if (at.floor.y < 36 || at.floor.x < 8 || at.floor.x > 92 || at.floor.y > 96) return;
      l.held.clear();
      l.approach = null;
      walkToRef.current(
        hover?.kind === 'door'
          ? { ...INTERIOR_DOOR }
          : { x: Math.max(15, Math.min(85, at.floor.x)), y: Math.max(42, Math.min(88, at.floor.y)) },
      );
      showMarker(l.goal);
    };
    let hoverKind = '';
    const onPointerMove = (event: PointerEvent) => {
      if (contextFailed) return;
      const at = pointAt(event);
      const kind = at.table ? 'table' : at.floor ? (interiorHover(at.floor, area)?.kind ?? '') : '';
      if (kind !== hoverKind) host.dataset.hover = hoverKind = kind;
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);

    // ---------------------------------------------------------- keys
    const keydown = (event: KeyboardEvent) => {
      // Heard on window, so WASD keeps working after a dialog closes.
      const at = sceneKeyTarget(event, host);
      if (!at || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Shift') l.shift = true;
      const bound = boundAction(event);
      if (bound === 'action' || (event.key === 'Enter' && at === 'scene')) {
        if (latest.current.sheetOpen) return;
        if (actionRef.current && !l.locked) {
          event.preventDefault();
          runRef.current(actionRef.current);
        }
        return;
      }
      const dir = boundDirection(event);
      if (!dir) return;
      event.preventDefault();
      l.shift = event.shiftKey;
      if (l.locked) return;
      l.held.add(dir);
      l.target = null;
      l.approach = null;
      showMarker(null);
    };
    const keyup = (event: KeyboardEvent) => {
      const dir = boundDirection(event);
      if (dir) l.held.delete(dir);
      if (event.key === 'Shift') l.shift = false;
    };
    const release = () => {
      l.held.clear();
      l.shift = false;
    };
    const visibilityChanged = () => {
      if (document.hidden) release();
    };
    const pause = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail) {
        release();
        l.target = null;
        l.approach = null;
        showMarker(null);
      }
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', release);
    window.addEventListener('bumtadew:pause', pause);
    document.addEventListener('visibilitychange', visibilityChanged);
    // The game put me somewhere (a seat, beside a table after a game): the
    // server echo can lag behind my own moves, so it tells me directly.
    const place = (e: Event) => {
      const p = (e as CustomEvent<ScenePoint>).detail;
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
      l.point = { x: p.x, y: p.y };
      l.lastSent = { ...l.point };
      l.adopted = true;
      l.target = null;
      l.approach = null;
      showMarker(null);
    };
    window.addEventListener(INTERIOR_PLACE_EVENT, place);

    const contextLost = (event: Event) => {
      event.preventDefault();
      if (disposed) return;
      contextFailed = true;
      cancelAnimationFrame(frame);
      setState('unavailable');
    };
    const contextRestored = () => {
      if (disposed) return;
      contextFailed = false;
      renderer.shadowMap.needsUpdate = true;
      mine.drawnAt = -1000;
      setState('ready');
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(animate);
    };
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.addEventListener('webglcontextrestored', contextRestored);

    const resize = () => {
      const width = host.clientWidth,
        height = host.clientHeight;
      if (!width || !height) return;
      frameCamera(width / height, height);
      renderer.setSize(width, height, false);
      dirty = true;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    // 설정 → 그래픽: pixel ratio, shadows and lamps follow the preset live.
    const applyQuality = () => {
      const q = qualityProfile(getSettings().quality);
      const ratio = Math.min(window.devicePixelRatio || 1, q.pixelRatio);
      if (renderer.getPixelRatio() !== ratio) renderer.setPixelRatio(ratio);
      if (renderer.shadowMap.enabled !== q.shadows) {
        renderer.shadowMap.enabled = q.shadows;
        scene.traverse((object) => {
          const material = (object as THREE.Mesh).material;
          for (const m of Array.isArray(material) ? material : material ? [material] : []) m.needsUpdate = true;
        });
      }
      studio.setLights(q.effects);
      renderer.shadowMap.needsUpdate = true;
      resize();
    };
    applyQuality();
    const offSettings = onSettingsChange(applyQuality);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) release();
      else dirty = true;
    });
    visibilityObserver.observe(host);

    // ---------------------------------------------------------- loop
    const label = new THREE.Vector3();
    const project = (id: string, x: number, y: number, z: number, w: number, h: number, below = false) => {
      const el = labelsRef.current.get(id);
      if (!el) return;
      label.set(x, y, z).project(camera);
      el.style.transform = `translate(${((label.x + 1) / 2) * w}px, ${((1 - label.y) / 2) * h}px) translate(-50%, ${below ? '0' : '-100%'})`;
    };
    const projectLabels = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      // Over the head: a seated figure's tag drops with it.
      const tag = (id: string, f: Figure) => {
        const p = f.chair ? { x: f.mesh.position.x, z: f.mesh.position.z } : interiorToWorld(f.pos);
        project(id, p.x, FIGURE_HEIGHT + 0.22 + (f.chair ? f.lift - 0.03 : 0), p.z, w, h);
      };
      tag('self', mine);
      for (const [id, f] of others) tag(id, f);
      for (const t of latest.current.tables) {
        // The table's sign hangs from its front edge; the host tag is over the host.
        project('table-' + t.game, t.center.x, TABLE_HEIGHT * 0.55, t.center.z + t.rz + 0.05, w, h, true);
        const stand = hosts.standAt(t.game);
        if (stand) project('host-' + t.game, stand.x, 1.9, stand.z, w, h);
      }
    };
    let previous = performance.now(),
      lastTick = 0,
      lastRender = -100,
      lastData = -100,
      lastSend = 0,
      wasMoving = false;
    const animate = (t: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      // 프레임 제한 (설정 → 그래픽).
      const cap = getSettings().fpsCap;
      if (cap && t - lastTick < 1000 / cap - 2) return;
      lastTick = t;
      const dt = Math.min((t - previous) / 1000, 0.25);
      previous = t;
      if (!visible || document.hidden || !host.clientWidth) return;
      const current = latest.current;
      // Me: keys first, then a clicked destination.
      const keyed = screenToFloor(
        Number(l.held.has('right')) - Number(l.held.has('left')),
        Number(l.held.has('down')) - Number(l.held.has('up')),
      );
      let dx = keyed.x,
        dy = keyed.y;
      if (l.locked) dx = dy = 0;
      const running = l.shift;
      const speed = WALK_SPEED * (running ? RUN_SPEED_MULTIPLIER : 1) * dt;
      if (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6) {
        l.target = null;
        l.approach = null;
      } else if (l.target && !l.locked) {
        dx = l.target.x - l.point.x;
        dy = l.target.y - l.point.y;
        if (Math.hypot(dx, dy) < 0.3) {
          // Next waypoint, or arrived.
          l.target = l.route.shift() ?? null;
          dx = dy = 0;
          if (!l.target) showMarker(null);
        }
      }
      const length = Math.hypot(dx, dy);
      const before = l.point;
      if (length > 0 && dt > 0) {
        const step = l.target ? Math.min(speed, length) : speed;
        const next = interiorStep(before, (dx / length) * step, (dy / length) * step, area);
        if (Math.hypot(next.x - before.x, next.y - before.y) < 0.005 && l.target) {
          l.target = null;
          l.route = [];
          showMarker(null);
        }
        l.point = next;
      }
      const moved = Math.hypot(l.point.x - before.x, l.point.y - before.y);
      l.moving = moved > 0.005;
      const loco = advanceLocomotion(mine.locomotion, { distance: moved * 0.2, horizontal: floorToScreenX(l.point.x - before.x, l.point.y - before.y) }, running ? 'run' : 'walk', 2.25);
      const changed = loco.motion !== mine.motion || loco.state.facing !== mine.locomotion.facing;
      mine.locomotion = loco.state;
      mine.motion = loco.motion;
      mine.pos = l.point;
      const m = current.meHere ?? current.me;
      if (m.actor !== mine.actor || m.look !== mine.look) {
        mine.actor = m.actor;
        mine.look = m.look;
        mine.drawnAt = -1000;
        mine.rows = null;
      }
      // Sitting at a table: on my chair once the game has put me at my seat.
      const myChair = current.seatedChair.get(current.self);
      if (seatFigure(mine, myChair && Math.hypot(myChair.at.x - l.point.x, myChair.at.y - l.point.y) < 0.6 ? myChair : null))
        dirty = true;
      placeFigure(mine);
      drawFigure(mine, t, changed);
      // Tell the server where I am (throttled, and once more when I stop) —
      // only once it has me in this place, so a move never lands in the village.
      if (current.meHere && ((l.moving && t - lastSend > 150) || (!l.moving && wasMoving))) {
        const sent = l.lastSent;
        if (!sent || Math.hypot(sent.x - l.point.x, sent.y - l.point.y) > 0.05) {
          current.onMove(l.point.x, l.point.y);
          l.lastSent = { ...l.point };
          lastSend = t;
        }
      }
      wasMoving = l.moving;
      if (!l.target && l.approach) {
        const game = l.approach;
        l.approach = null;
        const a = interiorAction(l.point, area);
        if (a?.kind === 'table' && a.game === game) current.onTable(game);
      }
      // Friends glide to their latest spot (seated ones to their seat).
      const wanted = current.here.filter((p) => p.id !== current.self);
      for (const [id, f] of others)
        if (!wanted.some((p) => p.id === id)) {
          dropFigure(f);
          others.delete(id);
          labelsRef.current.get(id)?.style.setProperty('transform', 'translate(-9999px, 0)');
          dirty = true;
        }
      for (const p of wanted) {
        const goal = current.seatedPoint.get(p.id) ?? { x: p.x, y: p.y };
        let f = others.get(p.id);
        if (!f) {
          f = makeFigure(p.actor, p.look, goal);
          others.set(p.id, f);
          void sprites?.ensure(p.actor, p.look).catch(() => {});
          dirty = true;
        }
        if (f.look !== p.look) {
          f.look = p.look;
          f.drawnAt = -1000;
          f.rows = null;
        }
        const gx = goal.x - f.pos.x,
          gy = goal.y - f.pos.y,
          d = Math.hypot(gx, gy);
        let step = 0;
        if (d > 30) f.pos = { ...goal };
        else if (d > 0.1) {
          step = Math.min(d, (d > 8 ? WALK_SPEED * RUN_SPEED_MULTIPLIER : WALK_SPEED) * dt);
          f.pos = { x: f.pos.x + (gx / d) * step, y: f.pos.y + (gy / d) * step };
        }
        const fl = advanceLocomotion(f.locomotion, { distance: step * 0.2, horizontal: floorToScreenX(gx, gy) }, d > 8 ? 'run' : 'walk', 2.25);
        const fc = fl.motion !== f.motion || fl.state.facing !== f.locomotion.facing;
        f.locomotion = fl.state;
        f.motion = fl.motion;
        // Arrived at a seat: sit on its chair.
        const chair = current.seatedChair.get(p.id);
        if (seatFigure(f, chair && Math.hypot(goal.x - f.pos.x, goal.y - f.pos.y) <= 0.1 ? chair : null)) dirty = true;
        placeFigure(f);
        drawFigure(f, t, fc);
        if (step) dirty = true;
      }
      for (const table of current.tables) hostTables.set(table.game, { phase: table.state.phase, seats: table.seats.length });
      if (hosts.update(t, hostTables, reduced.matches)) dirty = true;
      if (t - lastData > 150) {
        const next = interiorAction(l.point, area);
        const prev = actionRef.current;
        if (next?.kind !== prev?.kind || (next?.kind === 'table' && prev?.kind === 'table' && next.game !== prev.game)) {
          actionRef.current = next;
          setAction(next);
          if (next?.kind === 'door') current.onNearDoor?.();
        }
        // Seat chairs and rings follow who sits where.
        for (const table of current.tables) {
          const seats: SeatShow[] = table.seats.map((s) => ({
            world: s.world,
            state: !s.who
              ? 'empty'
              : s.who === current.self
                ? 'me'
                : current.here.some((p) => p.id === s.who)
                  ? 'taken'
                  : 'away',
          }));
          if (studio.setSeats(table.game, seats)) {
            renderer.shadowMap.needsUpdate = true;
            dirty = true;
          }
        }
        host.dataset.action = next ? (next.kind === 'door' ? 'door' : 'table:' + next.game) : '';
        host.dataset.avatarX = l.point.x.toFixed(2);
        host.dataset.avatarY = l.point.y.toFixed(2);
        host.dataset.walking = String(l.moving);
        host.dataset.others = String(others.size);
        lastData = t;
      }
      // kArchive furniture arriving, or the VIP project finishing.
      if (studio.refresh(vipRef.current)) {
        renderer.shadowMap.needsUpdate = true;
        dirty = true;
      }
      if (l.moving || dirty || t - lastRender > 120) {
        renderer.render(scene, camera);
        projectLabels();
        lastRender = t;
        dirty = false;
      }
    };
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      release();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      offSettings();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', release);
      window.removeEventListener('bumtadew:pause', pause);
      window.removeEventListener(INTERIOR_PLACE_EVENT, place);
      document.removeEventListener('visibilitychange', visibilityChanged);
      dropFigure(mine);
      for (const f of others.values()) dropFigure(f);
      others.clear();
      hosts.dispose();
      figureGeometry.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      marker.geometry.dispose();
      (marker.material as THREE.Material).dispose();
      studio.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
    // The scene is rebuilt only for another place or a retry.
  }, [area, attempt]);

  const placeName = area === 'casino' ? NAMES.casino : NAMES.hall;
  const others = here.filter((p) => p.id !== self);
  const myPlayer = meHere;
  const actionState = action?.kind === 'table' ? tableState(view, action.game) : null;
  const actionKind = actionState ? tableAction(actionState) : null;
  return (
    <div
      ref={hostRef}
      className={`ih-scene ih-${area}`}
      tabIndex={0}
      role="application"
      aria-label={`${placeName} 안. 바닥을 클릭하거나 방향키와 ${[keys.up, keys.left, keys.down, keys.right].map(keyLabel).join('')}로 걸어요. 테이블을 클릭하면 그 앞까지 걸어가고, 가까이에서 ${keyLabel(keys.action)}를 누르면 앉거나 구경해요. Esc로 메뉴를 열어요.`}
      data-testid="interior-3d"
      data-area={area}
      data-load-state={state}
      data-seated={seatedAt ?? ''}
    >
      <div className="ih-labels" aria-hidden="true">
        <div
          className="ih-label ih-label-self"
          ref={(el) => {
            if (el) labelsRef.current.set('self', el);
            else labelsRef.current.delete('self');
          }}
        >
          {myPlayer && bubbleFor(myPlayer) && <span className="ih-bubble">{bubbleFor(myPlayer)}</span>}
        </div>
        {others.map((p) => {
          const text = bubbleFor(p);
          const seated = seatedPoint.has(p.id);
          return (
            <div
              key={p.id}
              className="ih-label"
              data-player={p.id}
              ref={(el) => {
                if (el) labelsRef.current.set(p.id, el);
                else labelsRef.current.delete(p.id);
              }}
            >
              {text && <span className="ih-bubble">{text}</span>}
              <span className="ih-name">
                <i className="ih-online" />
                {ACTORS[p.actor]}
                {seated && <em>앉아 있어요</em>}
              </span>
            </div>
          );
        })}
        {tables.map((t) =>
          t.host ? (
            <div
              key={'host-' + t.game}
              className="ih-label ih-host"
              ref={(el) => {
                if (el) labelsRef.current.set('host-' + t.game, el);
                else labelsRef.current.delete('host-' + t.game);
              }}
            >
              <span className="ih-name ih-host-name">
                <DealerAvatar host={t.host} mood={t.state.phase === 'playing' ? 'focus' : 'smile'} />
                {HOSTS[t.host].name}
                <em>{t.host === 'lumi' ? '딜러' : '진행자'}</em>
              </span>
            </div>
          ) : null,
        )}
      </div>
      <div className="ih-signs">
        {tables.map((t) => (
          <TableSign
            key={t.game}
            game={t.game}
            state={t.state}
            view={view}
            near={action?.kind === 'table' && action.game === t.game}
            onApproach={() => approach(t.game)}
            refFn={(el) => {
              if (el) labelsRef.current.set('table-' + t.game, el);
              else labelsRef.current.delete('table-' + t.game);
            }}
          />
        ))}
      </div>
      <nav className="ih-tables" aria-label={`${placeName} 테이블`}>
        <strong>{placeName}</strong>
        {tables.map((t) => (
          <button
            type="button"
            key={t.game}
            data-testid={'interior-table-' + t.game}
            className={`is-${t.state.phase}${t.state.called || t.state.fill ? ' is-called' : ''}`}
            onClick={() => approach(t.game)}
            aria-label={`${tableLabel(t.state).text} · 클릭하면 테이블로 걸어가요`}
          >
            <span>{GAME_INFO[t.game].name}</span>
            <small>{tableLabel(t.state).status}</small>
          </button>
        ))}
      </nav>
      {state === 'loading' && (
        <output className="ih-loading">
          <LoaderCircle size={19} />
          {placeName}에 불을 켜는 중…
        </output>
      )}
      {state === 'unavailable' && (
        <div className="ih-fallback" aria-live="polite">
          <strong>입체 화면 연결이 잠시 끊겼어요</strong>
          <p>다시 시도하면 {josa(placeName, '으로/로')} 돌아가요. 간단한 화면으로 볼 수도 있어요.</p>
          <div>
            <button
              type="button"
              onClick={() => {
                setState('loading');
                setAttempt((n) => n + 1);
              }}
            >
              <RotateCcw size={16} /> 다시 시도
            </button>
            <button type="button" onClick={onUnavailable}>
              간단한 화면으로 보기
            </button>
          </div>
        </div>
      )}
      {!seatedAt && !sheetOpen && state !== 'unavailable' && action && (
        <ActionButton
          className="ih-action"
          kind={action.kind === 'door' ? 'exit' : actionKind}
          label={
            action.kind === 'door'
              ? `${NAMES.village}로 나가기`
              : `${GAME_INFO[action.game].name} ${TABLE_ACTION_LABEL[actionKind!]}`
          }
          detail={actionState ? tableLabel(actionState).text : undefined}
          shortcut={keyLabel(keys.action)}
          onPress={() => runAction(action)}
        />
      )}
      <span className="ih-hint">
        <Footprints size={13} aria-hidden="true" />
        클릭해서 이동 · 방향키 / {[keys.up, keys.left, keys.down, keys.right].map(keyLabel).join('')} · Shift 달리기 ·{' '}
        {keyLabel(keys.action)} 앉기 · Esc 메뉴
      </span>
    </div>
  );
}

/** A table's sign: name, status, who sits there (portraits) and the next step. */
function TableSign({
  game,
  state,
  view,
  near,
  onApproach,
  refFn,
}: {
  game: GameKind;
  state: TableState;
  view: LoungeView;
  near: boolean;
  onApproach: () => void;
  refFn: (el: HTMLButtonElement | null) => void;
}) {
  const label = tableLabel(state);
  const shown = state.phase === 'empty' ? 0 : Math.min(7, Math.max(state.required, state.occupants.length));
  return (
    <button
      type="button"
      ref={refFn}
      className={`ih-sign is-${state.phase}${state.seated || state.member ? ' is-mine' : ''}${state.called || state.fill ? ' is-called' : ''}${near ? ' is-near' : ''}`}
      data-table={game}
      data-phase={state.phase}
      onClick={onApproach}
      tabIndex={-1}
      aria-label={`${label.text} · 클릭하면 테이블로 걸어가요`}
    >
      <strong>{GAME_INFO[game].name}</strong>
      <span className="ih-sign-status">
        <i />
        {label.status}
      </span>
      {shown > 0 && (
        <span className="ih-sign-seats">
          {Array.from({ length: shown }, (_, i) => {
            const id = state.occupants[i];
            const p = id ? view.players.find((q) => q.id === id) : undefined;
            return p ? (
              <span key={p.id} className={'ih-seat' + (p.id === view.self ? ' is-me' : '')} title={p.id === view.self ? '나' : ACTORS[p.actor]}>
                <AvatarView actor={p.actor} look={p.look} portrait />
              </span>
            ) : (
              <span key={'seat-' + i} className={'ih-seat ' + (id ? 'is-away' : 'is-empty')} title={id ? '자리 비움' : '빈자리'} />
            );
          })}
        </span>
      )}
    </button>
  );
}
