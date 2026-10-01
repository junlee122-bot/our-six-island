'use client';
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex */
// 성장 P2: a walkable outdoor region (뒷산, 숲 깊은 곳) or a 광산 floor.
// The region's set comes from lounge-area-scene.ts (RegionSet); walking from
// lounge-walk-world.ts through lounge-areas.ts (regionWalk). Friends in the
// same region (and, in the mine, on the same floor) walk here too. The camera
// follows me from above like the village's. E (the action key) uses what is
// in reach: a node, a mine rock, the ladder, the lift, a gate or an exit.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  LoaderCircle,
  Pickaxe,
} from './ui/icons';
import * as THREE from 'three';
import { loungeSprites } from './lounge-sprites';
import type { LoungePlayer } from './lounge-room';
import type { Look } from './lounge-look';
import { ACTORS } from './lounge-roster';
import { advanceLocomotion, RUN_SPEED_MULTIPLIER, type LocomotionState } from './lounge-locomotion';
import { ActionButton } from './lounge/ActionButton';
import { boundAction, boundDirection, sceneKeyTarget } from './lounge-scene-keys';
import { getSettings, onSettingsChange, qualityProfile, useSettings } from './lounge-settings';
import { keyLabel } from './lounge-keybinds';
import {
  HILL_LOG,
  MINE_LIFT,
  REGIONS,
  nearestExit,
  regionFromNetwork,
  regionToNetwork,
  regionWalk,
  type ExitTo,
  type OutdoorArea,
} from './lounge-areas';
import { mineFloor, LIFT_EVERY, type MineFloor } from './lounge-mine';
import { NODE_INFO, GATES, type NodeKind } from './lounge-growth-data';
import type { RegionsView } from './lounge-growth';
import type { ActionKind } from './lounge-flow';
import { RegionSet, type RegionNode } from './lounge-area-scene';
import type { WalkPoint } from './lounge-walk-world';
import './lounge-area-3d.css';
import './lounge-npc-figures.css';
import { WalkHints } from './ui/WalkHints';
import { dayLighting } from './lounge-village-life';
import { NPC_WALK_AREAS, npcsIn, type NpcArea } from './lounge-npc-schedule';
import { ResidentLayer } from './lounge-npc-figures';
import { newBehaviorMemory, residentFrames } from './lounge-npc-behavior';
import { NPCS, type NpcId } from './lounge-npc-data';
import { districtProgress } from './lounge-district-models';
import { weatherOf } from './lounge-calendar';
import { districtCounters, type DistrictCounter } from './lounge-district-counters';
import { josa } from './lounge-text';
import { RESIDENT_SCALE, VIEW_DISTANCE, VIEW_PITCH, VIEW_WALK_SPEED, VILLAGE_FIGURE_HEIGHT, followEase, viewHalf } from './lounge-village-camera';
import { applyVillageLight, villageFigureTint } from './lounge-village-view';
import { FrameCost, fishingFrameDue, type FishingFramePhase } from './lounge-fishing-frames';
import type { ShopArea } from './lounge-shop-interiors';
import { DistrictMinimap } from './lounge/DistrictMinimap';
import { loungeAudio } from './lounge-audio';
import { areaSurface } from './lounge-footsteps';
import { LOCKED_NOTICE_MS, arrivalFacing, arrivalPoint, doorClock, walksInto } from './lounge-map-doors';

/** How close you stand to a resident to talk (E). */
const RESIDENT_REACH = 1.9;

// 구역 공통 규격 (lounge-village-camera.ts): the hub walks and looks the same.
const WALK_SPEED = VIEW_WALK_SPEED;
const FIGURE_HEIGHT = VILLAGE_FIGURE_HEIGHT;
const FIGURE_W = 440,
  FIGURE_H = 640,
  FIGURE_BODY_H = 540;
const NODE_REACH = 1.35;
const ROCK_REACH = 1.3;
const PITCH = VIEW_PITCH;
const DAY = 86_400_000;
const kstDayOf = (now: number) => Math.floor((now + 9 * 3_600_000) / DAY);

export type AreaAction =
  | { kind: 'node'; id: string; node: NodeKind; label: string; disabled?: boolean }
  | { kind: 'rock'; rock: number; label: string }
  | { kind: 'ladder'; label: string }
  | { kind: 'lift'; label: string }
  | { kind: 'gate'; gate: string; label: string; disabled?: boolean }
  | { kind: 'exit'; to: ExitTo; label: string; disabled?: boolean }
  /** A resident walking about here (lounge-npc-schedule.ts). */
  | { kind: 'npc'; npc: NpcId; label: string }
  /** 시장 거리's request board. */
  | { kind: 'board'; label: string }
  /** A district counter (E at the door): 농협, 잡화점, 빵집, 신문사, 우체국, 파출소, 어시장, 낚시조합, 도서관, 좌판. */
  | { kind: 'counter'; place: DistrictCounter; label: string; disabled?: boolean; enter?: ShopArea }
  /** 방파제 / 큰 선착장: the fishing engine's harbor spots (rod and crab pot). */
  | { kind: 'fish'; spot: 'breakwater' | 'pier'; label: string }
  /** 친구에게 가기 signpost by each district's road out. */
  | { kind: 'signpost'; label: string };
export type { DistrictCounter } from './lounge-district-counters';

type Figure = {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  mesh: THREE.Mesh;
  shadow: THREE.Mesh;
  actor: number;
  look: Look;
  pos: WalkPoint;
  locomotion: LocomotionState;
  motion: 'idle' | 'walk' | 'run';
  drawnAt: number;
};

export type AreaSceneProps = {
  area: OutdoorArea;
  /** Where I arrive (region coordinates). */
  spawn: WalkPoint;
  players: LoungePlayer[];
  self: string | null;
  me: { actor: number; look: Look };
  regions: RegionsView | null;
  /** Server clock minus local (for today's mine floor). */
  clockOffset: number;
  /** Axe tier (the 숲 깊은 곳 log needs 2; stumps 3). */
  axeTier: number;
  /** Paused while a dialog is open. */
  paused?: boolean;
  /** The fishing overlay's phase while it is open (the scene behind it draws only now and then). */
  fishing?: FishingFramePhase | null;
  /** 설정 → 낮밤 변화 (false: always lit like noon). */
  dayNight?: boolean;
  onMove: (x: number, y: number) => void;
  onAction: (action: AreaAction) => void;
};

export function AreaScene({ area, spawn, players, self, me, regions, clockOffset, axeTier, paused = false, fishing = null, dayNight = true, onMove, onAction }: AreaSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef(new Map<string, HTMLElement>());
  const labelLayerRef = useRef<HTMLDivElement>(null);
  /** Where residents are drawn right now (talk reach). */
  const residentsRef = useRef<{ id: NpcId; x: number; z: number }[]>([]);
  const districtId = area === 'market' || area === 'harbor' || area === 'hillside' ? area : null;
  const [loadPct, setLoadPct] = useState(() => (districtId ? districtProgress(districtId) : 1));
  useEffect(() => {
    if (!districtId || loadPct >= 1) return;
    const id = setInterval(() => setLoadPct(districtProgress(districtId)), 150);
    return () => clearInterval(id);
  }, [districtId, loadPct]);
  const [{ keys }] = useSettings();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [action, setAction] = useState<AreaAction | null>(null);
  const region = REGIONS[area];
  const [day, setDay] = useState(() => kstDayOf(Date.now() + clockOffset));
  useEffect(() => {
    const id = setInterval(() => setDay(kstDayOf(Date.now() + clockOffset)), 30_000);
    return () => clearInterval(id);
  }, [clockOffset]);
  const mine = regions?.mine;
  const floorNo = area === 'mine' ? Math.max(1, mine?.at ?? 1) : 0;
  const lift = !!mine?.lift;
  const floor: MineFloor | null = useMemo(() => (area === 'mine' ? mineFloor(day, floorNo, lift) : null), [area, day, floorNo, lift]);
  const logCleared = !!regions?.woods.cleared;
  const walk = useMemo(() => regionWalk(area, { logCleared, day, floor: floorNo, lift }), [area, logCleared, day, floorNo, lift]);
  const nodes: RegionNode[] = useMemo(
    () => (area === 'hill' ? (regions?.hill.nodes ?? []) : area === 'woods' ? (regions?.woods.nodes ?? []) : []),
    [area, regions],
  );
  const broken = useMemo(() => (area === 'mine' ? (mine?.broken[floorNo] ?? []) : []), [area, mine, floorNo]);
  // Friends here (same region; in the mine, the same floor).
  const here = useMemo(
    () =>
      players.filter(
        (p) => p.id !== self && p.area === area && (area !== 'mine' || (mine?.friends[p.actor] ?? 0) === floorNo),
      ),
    [players, self, area, mine, floorNo],
  );

  const live = useRef({
    point: walk.near(spawn),
    held: new Set<string>(),
    shift: false,
    route: [] as WalkPoint[],
    target: null as WalkPoint | null,
    lastSent: { x: NaN, z: NaN },
  });
  const latest = useRef({ walk, nodes, broken, floor, here, me, paused, fishing, onMove, onAction, regions, axeTier, logCleared, area, clockOffset, dayNight });
  useLayoutEffect(() => {
    latest.current = { walk, nodes, broken, floor, here, me, paused, fishing, onMove, onAction, regions, axeTier, logCleared, area, clockOffset, dayNight };
  });
  const actionRef = useRef<AreaAction | null>(null);
  useLayoutEffect(() => {
    actionRef.current = action;
  });
  /** Doorways (exits, shop doors, the ladder) rest a moment after I arrive. */
  const doors = useRef(doorClock());
  /** Runs an action, holding back doorways until they are awake. */
  const act = (a: AreaAction) => {
    const doorway = a.kind === 'exit' || a.kind === 'ladder' || (a.kind === 'counter' && !!a.enter);
    if (doorway && !doors.current.ready()) return;
    latest.current.onAction(a);
  };
  const actRef = useRef(act);
  useLayoutEffect(() => {
    actRef.current = act;
  });
  // A new floor / region puts me at its arrival point.
  useEffect(() => {
    const l = live.current;
    l.point = latest.current.walk.near({ x: spawn.x, z: spawn.z });
    l.route = [];
    l.target = null;
    l.lastSent = { x: NaN, z: NaN };
    doors.current.arrive();
  }, [area, floorNo, spawn.x, spawn.z]);

  /** What is in reach at `p` (nearest wins). */
  const findAction = (p: WalkPoint): AreaAction | null => {
    const s = latest.current;
    const found: { d: number; a: AreaAction }[] = [];
    for (const n of s.nodes) {
      if (n.taken) continue;
      const d = Math.hypot(p.x - n.x, p.z - n.z);
      if (d <= NODE_REACH) {
        const info = NODE_INFO[n.kind];
        const need = info.tool === 'axe' ? (info.tier ?? 1) : 1;
        found.push({
          d,
          a:
            s.axeTier < need
              ? { kind: 'node', id: n.id, node: n.kind, label: `${info.name} · 도끼 ${need}단계 필요`, disabled: true }
              : { kind: 'node', id: n.id, node: n.kind, label: `${info.name} ${info.verb}` },
        });
      }
    }
    if (s.area === 'mine' && s.floor) {
      const gone = new Set(s.broken);
      for (const r of s.floor.rocks) {
        if (gone.has(r.i)) continue;
        const d = Math.hypot(p.x - r.x, p.z - r.z);
        if (d <= ROCK_REACH) found.push({ d, a: { kind: 'rock', rock: r.i, label: r.vein ? '광맥 바위 깨기' : '바위 깨기' } });
      }
      if (s.regions?.mine.ladder) {
        const d = Math.hypot(p.x - s.floor.ladder.x, p.z - s.floor.ladder.z);
        if (d <= 1.3) found.push({ d: d - 0.2, a: { kind: 'ladder', label: `${s.floor.floor + 1}층으로 내려가기` } });
      }
      if (s.regions?.mine.lift) {
        const d = Math.hypot(p.x - MINE_LIFT.x, p.z - MINE_LIFT.z);
        if (d <= MINE_LIFT.reach) found.push({ d, a: { kind: 'lift', label: '승강기 타기' } });
      }
    }
    for (const r of residentsRef.current) {
      const d = Math.hypot(p.x - r.x, p.z - r.z);
      if (d <= RESIDENT_REACH) found.push({ d: d - 0.3, a: { kind: 'npc', npc: r.id, label: `${josa(NPCS[r.id].name, '과/와')} 이야기하기` } });
    }
    if (s.area === 'market' || s.area === 'harbor' || s.area === 'hillside') {
      const now = Date.now() + s.clockOffset;
      const weekday = new Date(now + 9 * 3_600_000).getUTCDay();
      for (const c of districtCounters(s.area, weekday)) {
        const d = Math.hypot(p.x - c.x, p.z - c.z);
        if (d <= c.reach) found.push({ d: d + (c.a.kind === 'counter' ? 0.15 : 0), a: c.a });
      }
    }
    const exit = nearestExit(s.area, p);
    if (exit) {
      // The fallen log stays for everyone until someone splits it; 승준's explorer pass walks him past it.
      if (exit.to === 'woods' && !s.logCleared && !s.regions?.pass) {
        const gate = GATES.woods;
        found.push({
          d: exit.distance,
          a: {
            kind: 'gate',
            gate: 'woods',
            label: s.axeTier >= gate.tier ? '쓰러진 통나무 쪼개기' : `쓰러진 통나무 · 도끼 ${gate.tier}단계 필요`,
            disabled: s.axeTier < gate.tier,
          },
        });
      } else found.push({ d: exit.distance, a: { kind: 'exit', to: exit.to, label: exit.label } });
    }
    found.sort((a, b) => a.d - b.d);
    return found[0]?.a ?? null;
  };

  /** Walk to a district point along the paths (the minimap's places and friends). */
  const walkTo = (p: WalkPoint) => {
    const l = live.current;
    l.held.clear();
    l.route = latest.current.walk.path(l.point, p);
    l.target = l.route.shift() ?? null;
  };

  const findActionRef = useRef(findAction);
  useLayoutEffect(() => {
    findActionRef.current = findAction;
  });

  // ------------------------------------------------------------ three.js
  useEffect(() => {
    const host = hostRef.current!;
    const l = live.current;
    let disposed = false,
      frame = 0,
      dirty = true;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    } catch {
      queueMicrotask(() => !disposed && setFailed(true));
      return () => {
        disposed = true;
      };
    }
    const quality = qualityProfile(getSettings().quality);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const light = REGIONS[area].light;
    renderer.toneMappingExposure = light?.exposure ?? (area === 'mine' ? 1.45 : 1.05);
    renderer.shadowMap.enabled = quality.shadows;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const canvas = renderer.domElement;
    canvas.className = 'ar-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);

    const scene = new THREE.Scene();
    const region = REGIONS[area];
    scene.background = new THREE.Color(region.look.sky);
    // Only a far haze: the camera sits ~50 units away.
    if (area !== 'mine') scene.fog = new THREE.Fog(region.look.fog, 90, 170);
    const hemi = new THREE.HemisphereLight(area === 'mine' ? '#8a7560' : '#fff6e2', area === 'mine' ? '#1d1510' : '#5d7446', light?.hemi ?? (area === 'mine' ? 1.35 : 1.5));
    const sun = new THREE.DirectionalLight(area === 'mine' ? '#ffd9a8' : '#fff1d6', light?.sun ?? (area === 'mine' ? 0.35 : 2.1));
    sun.position.set(-12, 22, 10);
    sun.castShadow = quality.shadows;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    const shadowHalf = light?.shadow ?? 24;
    sc.left = -shadowHalf;
    sc.right = shadowHalf;
    sc.top = shadowHalf;
    sc.bottom = -shadowHalf;
    // A district's own day and night (the hub's palettes, lounge-village-life.ts).
    let lastDay = -1e9,
      night = false,
      tint = new THREE.Color('#ffffff');
    const applyDay = (t: number) => {
      if (!light?.dayCycle || t - lastDay < 2000) return false;
      lastDay = t;
      const now = Date.now() + latest.current.clockOffset;
      const pal = latest.current.dayNight === false ? dayLighting(Date.UTC(2026, 0, 1, 3)) : dayLighting(now);
      scene.background = new THREE.Color(pal.sky);
      applyVillageLight({ hemi, sun }, renderer, pal, weatherOf(kstDayOf(now)), light);
      night = pal.lamps > 0.5;
      tint = villageFigureTint(pal.lamps);
      // The district's piece and bed follow its own clock (night variant, crickets).
      loungeAudio.setScene({ village: false, night });
      return true;
    };
    sc.far = 80;
    scene.add(hemi, sun, sun.target);
    // My lantern (the mine is dark).
    const lantern = new THREE.PointLight('#ffc27a', area === 'mine' ? 3.2 : 0, 10, 1.3);
    scene.add(lantern);

    const set = new RegionSet(area);
    set.onChange = () => {
      dirty = true;
    };
    scene.add(set.root);
    const marketDayNow = () => new Date(Date.now() + latest.current.clockOffset + 9 * 3_600_000).getUTCDay() === 0;
    const applyState = () => {
      const s = latest.current;
      set.update({
        nodes: s.nodes,
        logCleared: s.logCleared,
        floor: s.floor,
        broken: s.broken,
        ladder: !!s.regions?.mine.ladder,
        lift: !!s.regions?.mine.lift,
        marketDay: marketDayNow(),
        night,
      });
      dirty = true;
    };
    applyDay(performance.now());
    applyState();
    // Residents walking about here (the district's shops, their errands).
    const residents = NPC_WALK_AREAS.includes(area as NpcArea) && labelLayerRef.current
      ? new ResidentLayer(scene, labelLayerRef.current, {
          height: (FIGURE_HEIGHT * RESIDENT_SCALE) / Math.cos(PITCH),
          billboard: 'upright',
          // Chibi residents on a friend's plane (same height and feet line).
          chibi: { plane: ((FIGURE_HEIGHT * FIGURE_H) / FIGURE_BODY_H) / Math.cos(PITCH), upY: Math.cos(PITCH) },
        })
      : null;
    if (residents) residents.onChange = () => {
      dirty = true;
    };
    // Dusk and night darken them like the friends (the tint below).
    residents?.setTint(tint);
    const memory = newBehaviorMemory();

    // Camera: orthographic, pitched, following me (clamped to the region).
    const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 120);
    const offset = new THREE.Vector3(0, Math.sin(PITCH), Math.cos(PITCH)).multiplyScalar(VIEW_DISTANCE);
    const look = new THREE.Vector3();
    const halfView = REGIONS[area].view ?? (area === 'mine' ? 8.4 : 11);
    const frameCamera = (aspect: number) => {
      const half = viewHalf(aspect, halfView);
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
    };
    frameCamera(16 / 9);
    const aim = new THREE.Vector3();
    /** Follows me (time-based easing); true while the camera still moves. */
    const follow = (p: WalkPoint, snap: boolean, dt = 0) => {
      const b = region.bounds;
      const aspect = (camera.right - camera.left) / (camera.top - camera.bottom);
      // How much ground the view shows around its centre (x across, z in depth).
      const spanX = Math.max(0, b.w / 2 - camera.top * aspect * 0.8),
        spanZ = Math.max(0, b.d / 2 - (camera.top / Math.sin(PITCH)) * 0.72);
      const tx = area === 'mine' ? 0 : Math.max(-spanX, Math.min(spanX, p.x)),
        tz = area === 'mine' ? 0.4 : Math.max(-spanZ, Math.min(spanZ, p.z));
      aim.set(tx, 0, tz);
      const far = look.distanceTo(aim);
      if (snap || far < 0.005) look.copy(aim);
      else look.lerp(aim, followEase(dt));
      const moving = !snap && far >= 0.005;
      camera.position.copy(look).add(offset);
      camera.lookAt(look);
      sun.position.set(look.x - 12, 22, look.z + 10);
      sun.target.position.copy(look);
      return moving;
    };
    follow(l.point, true);
    const cameraUp = new THREE.Vector3(0, Math.cos(PITCH), -Math.sin(PITCH));

    // Figures: sprite canvases on camera-facing planes (the village's look).
    // An upright plane stretched by 1 / cos(pitch) projects exactly like a
    // camera-facing one but never leans back into a wall behind it (구역 공통 규격).
    const planeH = (FIGURE_HEIGHT * FIGURE_H) / FIGURE_BODY_H;
    const figureGeo = new THREE.PlaneGeometry(planeH * (FIGURE_W / FIGURE_H), planeH / Math.cos(PITCH));
    figureGeo.translate(0, (planeH / Math.cos(PITCH)) * 0.47, 0);
    const shadowGeo = new THREE.CircleGeometry(0.34, 20);
    const shadowMat = new THREE.MeshBasicMaterial({ color: '#2d2418', transparent: true, opacity: 0.28, depthWrite: false });
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const makeFigure = (actor: number, lk: Look, at: WalkPoint): Figure => {
      const c = document.createElement('canvas');
      c.width = FIGURE_W;
      c.height = FIGURE_H;
      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      const mesh = new THREE.Mesh(figureGeo, new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.12, toneMapped: false }));
      // Upright, facing the camera (which never turns sideways).
      mesh.rotation.set(0, 0, 0);
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      scene.add(mesh, shadow);
      return { canvas: c, texture, mesh, shadow, actor, look: lk, pos: { ...at }, locomotion: { phase: 0, facing: 1 }, motion: 'idle', drawnAt: -1000 };
    };
    const dropFigure = (f: Figure) => {
      scene.remove(f.mesh, f.shadow);
      (f.mesh.material as THREE.Material).dispose();
      f.texture.dispose();
    };
    const mineFig = makeFigure(latest.current.me.actor, latest.current.me.look, l.point);
    // In through an exit: face into the map.
    const cameThrough = region.exits.find((e) => {
      const p = arrivalPoint(e);
      return Math.hypot(p.x - l.point.x, p.z - l.point.z) < 1.5;
    });
    if (cameThrough) mineFig.locomotion = { phase: 0, facing: arrivalFacing(cameThrough) };
    host.dataset.walking = 'false';
    host.dataset.avatarX = l.point.x.toFixed(2);
    host.dataset.avatarZ = l.point.z.toFixed(2);
    const others = new Map<string, Figure>();
    let sprites: Awaited<ReturnType<typeof loungeSprites>> | null = null;
    void loungeSprites().then(
      async (value) => {
        await value.ensure(latest.current.me.actor, latest.current.me.look).catch(() => {});
        sprites = value;
        mineFig.drawnAt = -1000;
        if (!disposed) setReady(true);
      },
      () => !disposed && setReady(true),
    );
    const draw = (f: Figure, t: number, force = false) => {
      if (!sprites || (!force && t - f.drawnAt < (f.motion === 'idle' ? 90 : 40))) return;
      f.drawnAt = t;
      if (sprites.draw(f.canvas, f.actor, f.look, f.motion, f.locomotion.phase, false, reduced.matches, { facing: f.locomotion.facing })) {
        f.texture.needsUpdate = true;
        dirty = true;
      }
    };
    const place = (f: Figure) => {
      f.mesh.position.set(f.pos.x, 0.02, f.pos.z);
      f.shadow.position.set(f.pos.x, 0.025, f.pos.z);
    };

    // Pointer: click the ground to walk there (around walls).
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || latest.current.paused) return;
      host.focus({ preventScroll: true });
      const rect = canvas.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      // A click on a resident walks up to them (E talks once in reach).
      const who = residents?.hit(raycaster);
      const at = who ? residentsRef.current.find((r) => r.id === who) : null;
      if (at) {
        l.held.clear();
        l.route = latest.current.walk.path(l.point, { x: at.x, z: at.z + 1.1 });
        l.target = l.route.shift() ?? null;
        return;
      }
      if (!raycaster.ray.intersectPlane(ground, hit)) return;
      l.held.clear();
      l.route = latest.current.walk.path(l.point, { x: hit.x, z: hit.z });
      l.target = l.route.shift() ?? null;
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    // "가 보기" (and the harness): walk to a region point.
    const goTo = (e: Event) => {
      const p = (e as CustomEvent<WalkPoint>).detail;
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.z)) return;
      l.held.clear();
      l.route = latest.current.walk.path(l.point, p);
      l.target = l.route.shift() ?? null;
    };
    window.addEventListener('bumtadew:go', goTo);

    const keydown = (event: KeyboardEvent) => {
      const at = sceneKeyTarget(event, host);
      if (!at || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Shift') l.shift = true;
      const bound = boundAction(event);
      if (bound === 'action' || (event.key === 'Enter' && at === 'scene')) {
        const a = actionRef.current;
        if (a && !latest.current.paused && !('disabled' in a && a.disabled)) {
          event.preventDefault();
          actRef.current(a);
        }
        return;
      }
      const dir = boundDirection(event);
      if (!dir) return;
      event.preventDefault();
      l.shift = event.shiftKey;
      l.held.add(dir);
      l.target = null;
      l.route = [];
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
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', release);

    const resize = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      if (!w || !h) return;
      frameCamera(w / h);
      renderer.setSize(w, h, false);
      dirty = true;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();
    const offSettings = onSettingsChange(() => {
      const q = qualityProfile(getSettings().quality);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pixelRatio));
      resize();
    });

    const tag = new THREE.Vector3();
    const project = (id: string, p: WalkPoint) => {
      const el = labelsRef.current.get(id);
      if (!el) return;
      tag.set(p.x, 0, p.z).addScaledVector(cameraUp, FIGURE_HEIGHT + 0.3).project(camera);
      el.style.transform = `translate(${((tag.x + 1) / 2) * host.clientWidth}px, ${((1 - tag.y) / 2) * host.clientHeight}px) translate(-50%, -100%)`;
    };
    let previous = performance.now(),
      lastSend = 0,
      wasMoving = false,
      lastData = -1000,
      lastRender = -1000,
      lastAction = '',
      lastWalkInto = -1e9,
      stateKey = '';
    const drawCost = new FrameCost();
    let fishKey: FishingFramePhase | null = null;
    const animate = (t: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      drawCost.frame(t);
      const s = latest.current;
      // Behind the fishing overlay this scene draws (and updates) only now and then.
      if (s.fishing) {
        if (!fishingFrameDue(s.fishing, t, lastRender, drawCost.ms, s.fishing !== fishKey)) return;
        dirty = true;
      }
      fishKey = s.fishing;
      const dt = Math.min((t - previous) / 1000, 0.25);
      previous = t;
      if (document.hidden || !host.clientWidth) return;
      // State from the server (nodes taken, rocks broken, ladder…).
      if (applyDay(t)) {
        dirty = true;
        for (const f of [mineFig, ...others.values()]) (f.mesh.material as THREE.MeshBasicMaterial).color.copy(tint);
        residents?.setTint(tint);
      }
      const key = JSON.stringify([s.nodes.map((n) => n.id + +n.taken), s.broken, s.floor?.floor, s.regions?.mine.ladder, s.regions?.mine.lift, s.logCleared, night, area === 'market' && marketDayNow()]);
      if (key !== stateKey) {
        stateKey = key;
        applyState();
      }
      // Me: keys, then a clicked route.
      let dx = Number(l.held.has('right')) - Number(l.held.has('left')),
        dz = Number(l.held.has('down')) - Number(l.held.has('up'));
      if (s.paused) dx = dz = 0;
      const speed = WALK_SPEED * (l.shift ? RUN_SPEED_MULTIPLIER : 1) * dt;
      if (!dx && !dz && l.target && !s.paused) {
        dx = l.target.x - l.point.x;
        dz = l.target.z - l.point.z;
        if (Math.hypot(dx, dz) < 0.12) {
          l.target = l.route.shift() ?? null;
          dx = dz = 0;
        }
      }
      const before = l.point;
      const len = Math.hypot(dx, dz);
      // Walking on into an exit (keys, or a click past it) takes it, like E.
      if (len > 0 && doors.current.ready() && t - lastWalkInto > LOCKED_NOTICE_MS) {
        for (const e of REGIONS[s.area].exits) {
          if (!walksInto(l.point, { x: dx, z: dz }, e)) continue;
          // The fallen log stays a wall until it is split (E there says so).
          if (e.to === 'woods' && !s.logCleared && !s.regions?.pass) continue;
          lastWalkInto = t;
          l.held.clear();
          l.route = [];
          l.target = null;
          queueMicrotask(() => actRef.current({ kind: 'exit', to: e.to, label: e.label }));
          break;
        }
      }
      if (len > 0) {
        const stepLen = l.target ? Math.min(speed, len) : speed;
        l.point = s.walk.step(before, (dx / len) * stepLen, (dz / len) * stepLen);
        if (l.target && Math.hypot(l.point.x - before.x, l.point.z - before.z) < 0.001) {
          l.target = null;
          l.route = [];
        }
      }
      const mx = l.point.x - before.x,
        mz = l.point.z - before.z,
        moved = Math.hypot(mx, mz);
      const loco = advanceLocomotion(mineFig.locomotion, { distance: moved, horizontal: mx }, l.shift ? 'run' : 'walk', WALK_SPEED);
      const changed = loco.motion !== mineFig.motion || loco.state.facing !== mineFig.locomotion.facing;
      mineFig.locomotion = loco.state;
      mineFig.motion = loco.motion;
      mineFig.pos = l.point;
      if (s.me.actor !== mineFig.actor || s.me.look !== mineFig.look) {
        mineFig.actor = s.me.actor;
        mineFig.look = s.me.look;
        mineFig.drawnAt = -1000;
      }
      place(mineFig);
      draw(mineFig, t, changed);
      if (moved > 0) dirty = true;
      lantern.position.set(l.point.x, 1.8, l.point.z + 0.4);
      if (follow(l.point, false, dt)) dirty = true;
      const moving = moved > 0.0005;
      if (moving && !s.paused) loungeAudio.footstep(l.shift, areaSurface(s.area, l.point));
      if ((moving && t - lastSend > 180) || (!moving && wasMoving)) {
        if (Math.hypot(l.point.x - l.lastSent.x, l.point.z - l.lastSent.z) > 0.01 || Number.isNaN(l.lastSent.x)) {
          const net = regionToNetwork(s.area, l.point);
          s.onMove(net.x, net.y);
          l.lastSent = { ...l.point };
          lastSend = t;
        }
      }
      wasMoving = moving;
      if ((moving || moving !== (host.dataset.walking === 'true')) && t - lastData > 120) {
        lastData = t;
        host.dataset.walking = String(moving);
        host.dataset.avatarX = l.point.x.toFixed(2);
        host.dataset.avatarZ = l.point.z.toFixed(2);
      }
      // Friends here.
      const seen = new Set<string>();
      for (const p of s.here) {
        seen.add(p.id);
        const goal = regionFromNetwork(s.area, p);
        let f = others.get(p.id);
        if (!f) {
          f = makeFigure(p.actor, p.look, goal);
          others.set(p.id, f);
          void sprites?.ensure(p.actor, p.look).catch(() => {});
        }
        const gx = goal.x - f.pos.x,
          gz = goal.z - f.pos.z,
          gd = Math.hypot(gx, gz);
        let stepped = 0;
        if (gd > 8) f.pos = goal;
        else if (gd > 0.02) {
          stepped = Math.min(gd, WALK_SPEED * 1.1 * dt);
          f.pos = { x: f.pos.x + (gx / gd) * stepped, z: f.pos.z + (gz / gd) * stepped };
        }
        const fl = advanceLocomotion(f.locomotion, { distance: stepped, horizontal: gx }, 'walk', WALK_SPEED);
        const ch = fl.motion !== f.motion;
        f.locomotion = fl.state;
        f.motion = fl.motion;
        if (p.look !== f.look) {
          f.look = p.look;
          f.drawnAt = -1000;
        }
        place(f);
        draw(f, t, ch);
        if (stepped) dirty = true;
      }
      for (const [id, f] of others)
        if (!seen.has(id)) {
          dropFigure(f);
          others.delete(id);
          dirty = true;
        }
      // Residents: their schedule spot, then this screen's idle / greet / chat / step-aside.
      if (residents) {
        const now = Date.now() + s.clockOffset;
        const people = [
          { id: 'self', name: ACTORS[s.me.actor] ?? '', x: l.point.x, z: l.point.z },
          ...[...others.entries()].map(([id, f]) => ({ id, name: ACTORS[f.actor] ?? '', x: f.pos.x, z: f.pos.z })),
        ];
        const w = weatherOf(Math.floor((now + 9 * 3_600_000) / DAY));
        const frames = residentFrames(npcsIn(s.area as NpcArea, now), people, now, {
          rain: w === 'rain' || w === 'storm',
          night,
          memory,
          canStand: s.walk.canWalk,
        });
        if (residents.update(frames, t, dt, camera)) dirty = true;
        residentsRef.current = residents.positions();
      }
      // What E does here.
      const a = findActionRef.current(l.point);
      const ak = a ? JSON.stringify(a) : '';
      if (ak !== lastAction) {
        lastAction = ak;
        setAction(a);
      }
      // Redraw when something changed; otherwise ~4 times a second (the node marks bob).
      if (!dirty && t - lastRender < 250) return;
      lastRender = t;
      set.tick(t);
      for (const [id, f] of others) project(id, f.pos);
      project('self', l.point);
      renderer.render(scene, camera);
      drawCost.drew(t);
      residents?.project(camera, host.clientWidth, host.clientHeight);
      dirty = false;
    };
    frame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', release);
      window.removeEventListener('bumtadew:go', goTo);
      canvas.removeEventListener('pointerdown', onPointerDown);
      ro.disconnect();
      offSettings();
      for (const f of others.values()) dropFigure(f);
      dropFigure(mineFig);
      residents?.dispose();
      residentsRef.current = [];
      set.dispose();
      figureGeo.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      renderer.dispose();
      canvas.remove();
    };
    // The scene is rebuilt per region / floor; everything else flows through refs.
  }, [area, floorNo, day]);

  const kind: ActionKind | null = !action
    ? null
    : action.kind === 'npc'
      ? 'talk'
      : action.kind === 'board' || action.kind === 'signpost'
        ? 'board'
        : action.kind === 'fish'
          ? 'fish'
          : action.kind === 'counter'
            ? 'enter'
        : action.kind === 'node'
      ? action.node === 'rock'
        ? 'smash'
        : 'chop'
      : action.kind === 'rock'
        ? 'smash'
        : action.kind === 'gate'
          ? 'chop'
          : action.kind === 'exit' && action.to === 'village'
            ? 'exit'
            : 'enter';
  const tags = here.map((p) => ({ id: p.id, name: ACTORS[p.actor] }));
  const mineInfo = area === 'mine' && floor && mine;
  const brokenHere = broken.length;
  return (
    <div
      ref={hostRef}
      className={`ar-scene ar-${area}`}
      tabIndex={0}
      role="application"
      data-testid="area-3d"
      data-area={area}
      data-load-state={failed ? 'unavailable' : ready ? 'ready' : 'loading'}
      data-floor={area === 'mine' ? floorNo : undefined}
      aria-label={`${region.name}${area === 'mine' ? ` ${floorNo}층` : ''} · 방향키로 걷고 ${keyLabel(keys.action)}로 행동해요`}
    >
      <div className="ar-labels" aria-hidden="true" ref={labelLayerRef}>
        {tags.map((t) => (
          <span
            key={t.id}
            className="ar-tag"
            ref={(el) => {
              if (el) labelsRef.current.set(t.id, el);
              else labelsRef.current.delete(t.id);
            }}
          >
            {t.name}
          </span>
        ))}
      </div>
      <div className="ar-plate" data-testid="area-plate">
        <strong>{area === 'mine' ? `광산 ${floorNo}층` : region.name}</strong>
        <span>
          {mineInfo
            ? mine.ladder
              ? '사다리가 보여요 · 아래층으로 내려갈 수 있어요'
              : `바위 ${Math.min(brokenHere, floor.ladderNeed)}/${floor.ladderNeed} 깨면 사다리가 나와요`
            : region.tagline}
        </span>
        {mineInfo && (
          <span className="ar-plate-sub">
            <Pickaxe size={12} aria-hidden="true" /> 곡괭이 {mine.pickaxe}단계 · 가장 깊이 {mine.deep}층
            {floor.vein ? ' · 오늘의 광맥 층' : ''}
            {mine.lift ? ` · 승강기 ${LIFT_EVERY}층마다` : ''}
          </span>
        )}
      </div>
      {!ready && !failed && (
        <output className="ar-loading">
          <LoaderCircle size={17} className="l-spin" aria-hidden="true" /> {josa(region.name, '으로/로')} 가는 중…{loadPct < 1 ? ` ${Math.round(loadPct * 100)}%` : ''}
        </output>
      )}
      {failed && (
        <div className="ar-loading" role="alert">
          이 기기에서는 3D 화면을 열 수 없어요.
        </div>
      )}
      {action && !paused && (
        <ActionButton
          className="ar-action"
          kind={kind}
          label={action.label}
          disabled={'disabled' in action && !!action.disabled}
          shortcut={keyLabel(keys.action)}
          onPress={() => act(action)}
        />
      )}
      <WalkHints className="ar-hint" />
      {districtId && (
        <DistrictMinimap
          area={area}
          weekday={(day + 4) % 7}
          players={players}
          self={self}
          where={() => live.current.point}
          residents={() => residentsRef.current}
          onGo={walkTo}
        />
      )}
    </div>
  );
}
/** Where the log gate sits (for the village's "가 보기"). */
export const AREA_LOG = HILL_LOG;
