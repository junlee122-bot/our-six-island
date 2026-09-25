'use client';
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  DoorOpen,
  Dices,
  Footprints,
  House,
  Landmark,
  Compass,
  Map as MapIcon,
  Minus,
  Plus,
  LocateFixed,
  RotateCcw,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  X,
  Send,
  Trees,
  Sprout,
  Shirt,
  Apple,
  Store,
  Mail,
  MessageCircle,
  FishingRod,
  Leaf,
  Bug,
  ClipboardList,
  Droplets,
  Sparkles,
} from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { LoungeSave } from './lounge-look';
import type { LoungePlayer } from './lounge-room';
import { ACTORS } from './lounge-roster';
import { loungeSprites } from './lounge-sprites';
import { REACTIONS, REACTION_TTL } from './lounge-reactions';
import {
  advanceLocomotion,
  RUN_SPEED_MULTIPLIER,
  type LocomotionState,
} from './lounge-locomotion';
import { LOUNGE_MODELS } from './lounge-model-assets';
import {
  VILLAGE_ACTOR_HEIGHT,
  villageCameraFrame,
} from './lounge-village-camera';
import {
  buildVillageWorld,
  VILLAGE_LAMP_GLOW,
  type VillageWorld,
} from './lounge-village-world';
import { VillageLifeLayer } from './lounge-village-life-3d';
import { VillageSeasonLayer } from './lounge-village-season-3d';
import {
  BOARD_FRONT,
  MUSEUM_FRONT,
  PIER_POINT,
  POND_EDGE,
  RIVER_BANK,
  SPAWN_POINTS,
  bobberPoint,
} from './lounge-village-spots';
import type { Spot } from './lounge-items';
import { itemName } from './lounge-life-plus';
import {
  DAY_PHASE_LABEL,
  FRUIT_TREE_POINTS,
  dayLighting,
  farmBed,
  farmBedRect,
  farmFront,
  npcLine,
  npcPose,
  plotsForActor,
  type DayPhase,
} from './lounge-village-life';
import {
  FRUIT_TREES,
  plotStage,
  type LifeView,
} from './lounge-life';
import { loungeAudio } from './lounge-audio';
import {
  villageAction,
  villageActionKey,
  type VillageAction,
  type VillageSpot,
} from './lounge-village-actions';
import { ActionButton } from './lounge/ActionButton';
import { lookFor, rememberLook } from './lounge/friend-looks';
import { useServerClock } from './lounge/use-server-clock';
import { sceneKeyTarget } from './lounge-scene-keys';
import { VillageLifeList, isTouchDevice } from './lounge/VillageSimple';
import {
  villageCanEnterPlace,
  villageNearbyEntrance,
  type NearbyVillageEntrance,
} from './lounge-village-entrance';
import {
  VILLAGE_BOUNDS,
  VILLAGE_DECOR,
  VILLAGE_DISTRICTS,
  VILLAGE_RIVER,
  VILLAGE_PATHS,
  VILLAGE_PLACES,
  VILLAGE_START,
  VILLAGE_ORCHARD,
  VILLAGE_FURNISHINGS,
  VILLAGE_MARKET,
  VILLAGE_POND,
  VILLAGE_MUSEUM,
  VILLAGE_BOARD,
  villageCanWalk,
  villageFromNetwork,
  villageHouseScale,
  villageToNetwork,
  villagePath,
  villageStep,
  type VillageDestination,
  type VillagePlace,
  type VillagePoint,
} from './lounge-village-layout';
import './lounge-village.css';

type ChatLine = { id: string; actor: number; text: string };

/** Compact overview / minimap name: "도원", "회관", "카지노", "분장실". */
const PLACE_SHORT: Record<VillagePlace['kind'], string> = {
  home: '',
  hall: '회관',
  casino: '카지노',
  wardrobe: '분장실',
};
function placeShortName(place: VillagePlace) {
  return place.kind === 'home' ? ACTORS[place.actor ?? 0] : PLACE_SHORT[place.kind];
}
function PlaceIcon({ place, size = 12 }: { place: VillagePlace; size?: number }) {
  const Icon =
    place.kind === 'home'
      ? House
      : place.kind === 'hall'
        ? Landmark
        : place.kind === 'casino'
          ? Dices
          : Shirt;
  return (
    <Icon
      className="hv-place-icon"
      size={size}
      aria-hidden="true"
      style={{ color: place.roofColor }}
    />
  );
}
const MINI_BOX = {
  x: -VILLAGE_BOUNDS.width / 2 - 2,
  y: -VILLAGE_BOUNDS.depth / 2 - 2,
  w: VILLAGE_BOUNDS.width + 4,
  h: VILLAGE_BOUNDS.depth + 4,
};
/** Building labels (walking): only the nearest place within this many world
 *  units of its footprint is named; the next one takes over past HANDOFF. */
const LABEL_NEAR = 4.2,
  LABEL_HANDOFF = 0.8;
type Props = {
  save: LoungeSave;
  players: LoungePlayer[];
  self: string;
  initialPosition?: VillagePoint;
  /** Village-scope chat; the newest line per friend floats above their head. */
  chat?: readonly ChatLine[];
  onMove: (x: number, y: number) => void;
  onEnter: (destination: VillageDestination, place: VillagePlace) => void;
  /** Kept for compatibility; the header now owns the friends list. */
  onFriends?: () => void;
  onRequest: () => void;
  /** Life state (farms, fruit timers, mail, statuses) from the latest response. */
  life?: LifeView | null;
  /** Server clock minus local clock (NPC schedule and timers agree across clients). */
  clockOffset?: number;
  /** Village lighting follows KST time (settings toggle). */
  dayNight?: boolean;
  onFarm?: () => void;
  onShop?: () => void;
  onMail?: () => void;
  onPick?: (tree: string) => void;
  /** '놀러 가기' at a friend's door. */
  onVisit?: (actor: number) => void;
  /** People inside each building (place id → count), for "회관 · 안에 N명". */
  areaCounts?: Readonly<Record<string, number>>;
  /** The door within reach changed: preload that building's scene. */
  onNear?: (place: VillagePlace | null) => void;
  // Life expansion (LIFE-B).
  /** 낚시하기 at the river, the pond or the sea pier. */
  onFish?: (spot: Spot) => void;
  /** 줍기 / 잡기 at today's forage or bug spawn. */
  onSpawn?: (spot: string, mode: 'forage' | 'bug', item: string) => void;
  onMuseum?: () => void;
  onBoard?: () => void;
  onWaterFriend?: (actor: number) => void;
  onWish?: () => void;
  /** Talking to an offline friend: true when they had something to ask (request card). */
  onTalk?: (actor: number) => void;
  /** The selected hotbar item (the farm action follows it). */
  tool?: string;
  /** The fishing bobber: where and in which phase. */
  fishing?: { spot: Spot; phase: 'casting' | 'wait' | 'bite' | 'reeling' | 'result' } | null;
  /** Weather particles and falling leaves (settings + reduced motion). */
  seasonFx?: boolean;
};
type Direction = 'up' | 'down' | 'left' | 'right';
// Physical key codes keep WASD working while a Korean IME is active.
const KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};
const DIRECTIONS = [
  ['up', ArrowUp, '위로 걷기'],
  ['left', ArrowLeft, '왼쪽으로 걷기'],
  ['down', ArrowDown, '아래로 걷기'],
  ['right', ArrowRight, '오른쪽으로 걷기'],
] as const;
const WALK_SPEED = 5.2;
const CAMERA_OFFSET = new THREE.Vector3(34, 43, 52);
/** Remote samples are replayed this far behind real time (cloud writes land ~every 500 ms). */
const REMOTE_DELAY = 550;
const BUBBLE_MS = 5000;

/* ------------------------------------------------------------------ */
/* Module-level caches: re-entering the village reuses parsed models,  */
/* the built world and one WebGL renderer instead of rebuilding all.   */
/* ------------------------------------------------------------------ */

let gltfLoader: GLTFLoader | null = null;
const modelCache = new Map<string, Promise<THREE.Group>>();
function loadModel(url: string) {
  let job = modelCache.get(url);
  if (!job) {
    gltfLoader ??= new GLTFLoader();
    job = gltfLoader.loadAsync(url).then((gltf) => gltf.scene);
    job.catch(() => modelCache.delete(url));
    modelCache.set(url, job);
  }
  return job;
}

type WorldState = {
  root: THREE.Group;
  world: VillageWorld;
  /** Terrain + resident homes: the first frame waits only for these. */
  houses: Promise<void>;
  /** Everything else, added progressively; false when any prop failed. */
  props: Promise<boolean>;
  loaded: Record<string, string>;
  listeners: Set<() => void>;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  life: VillageLifeLayer;
  season: VillageSeasonLayer;
};
let villageWorld: WorldState | null = null;

function fitModel(
  source: THREE.Group,
  point: VillagePoint,
  size: { w: number; d: number; h: number },
  baseY: number,
  rotation = 0,
) {
  const object = source.clone(true);
  object.rotation.y = rotation;
  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object),
    measured = bounds.getSize(new THREE.Vector3());
  const scale = Math.min(
    size.w / measured.x,
    size.h / measured.y,
    size.d / measured.z,
  );
  if (!Number.isFinite(scale) || scale <= 0)
    throw new Error('Invalid village model bounds');
  object.scale.multiplyScalar(scale);
  return placeOnGround(object, point, baseY);
}
function placeOnGround(
  object: THREE.Object3D,
  point: VillagePoint,
  baseY: number,
) {
  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  const center = bounds.getCenter(new THREE.Vector3());
  object.position.x += point.x - center.x;
  object.position.y += baseY - bounds.min.y;
  object.position.z += point.z - center.z;
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return object;
}

/** Grass top is ~0.026; props rest on it instead of floating at path height. */
const GROUND_Y = 0.03;

/** Starts building the village (models, terrain) before it is shown. */
export function preloadVillage() {
  getVillageWorld();
}

function getVillageWorld(): WorldState {
  if (villageWorld) return villageWorld;
  const root = new THREE.Group();
  root.name = 'village-root';
  const hemi = new THREE.HemisphereLight('#fff4d9', '#81936d', 2.25);
  root.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3d3', 3.0);
  sun.position.set(-20, 34, 25);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -55,
    right: 55,
    top: 48,
    bottom: -48,
    near: 1,
    far: 110,
  });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.06;
  root.add(sun);
  const world = buildVillageWorld(root);
  const life = new VillageLifeLayer(root);
  life.setLampGlowMaterial(VILLAGE_LAMP_GLOW);
  const season = new VillageSeasonLayer(root);
  const listeners = new Set<() => void>();
  const loaded: Record<string, string> = {};
  const changed = (id: string) => {
    loaded[id] = 'loaded';
    for (const listener of listeners) listener();
  };
  const add = (object: THREE.Object3D, id: string) => {
    root.add(object);
    changed(id);
  };

  // Resident homes: every model is scaled so its door is VILLAGE_DOOR_HEIGHT.
  const houseUrls = {
    cottage: LOUNGE_MODELS.cottage,
    cornerHouse: LOUNGE_MODELS.cornerHouse,
    courtyardHouse: LOUNGE_MODELS.courtyardHouse,
  } as const;
  const houseJobs = VILLAGE_PLACES.filter(
    (place) => place.kind === 'home' && place.model,
  ).map(async (place) => {
    const source = await loadModel(houseUrls[place.model!]);
    const object = source.clone(true);
    object.scale.setScalar(villageHouseScale(place.model!));
    placeOnGround(object, place, GROUND_Y);
    add(object, `house${place.actor}`);
    const fallback = root.getObjectByName('village-building-' + place.id);
    if (fallback) fallback.visible = false;
  });
  const houses = Promise.allSettled(houseJobs).then(() => undefined);

  // Everything else streams in after the first frame.
  const terrace = [
    { id: 'sofa', url: LOUNGE_MODELS.sofa, x: -8.7, z: 7.1, y: 0.39, w: 2.6, h: 1.65, d: 1.15 },
    { id: 'table', url: LOUNGE_MODELS.coffeeTable, x: -8.7, z: 8.55, y: 0.39, w: 1.65, h: 0.76, d: 0.8 },
    { id: 'tulips', url: LOUNGE_MODELS.tulips, x: -8.95, z: 8.55, y: 1.01, w: 0.46, h: 0.6, d: 0.45 },
    { id: 'chair', url: LOUNGE_MODELS.chair, x: -6.4, z: 8, y: 0.39, w: 0.85, h: 1.4, d: 0.85, r: -Math.PI / 2 },
    { id: 'bookshelf', url: LOUNGE_MODELS.bookshelf, x: -6.1, z: 6.9, y: 0.39, w: 0.85, h: 1.75, d: 0.5 },
  ];
  const propJobs = houses.then(() =>
    Promise.allSettled([
      ...terrace.map(async (item) => {
        const source = await loadModel(item.url);
        add(
          fitModel(source, item, { w: item.w, d: item.d, h: item.h }, item.y, item.r),
          item.id,
        );
      }),
      ...VILLAGE_DECOR.filter((item) => item.kind === 'hydrangea').map(
        async (item) => {
          const source = await loadModel(LOUNGE_MODELS.hydrangea);
          add(
            fitModel(source, item, { w: 0.9, d: 0.8, h: 0.85 }, GROUND_Y),
            `garden${item.home}`,
          );
        },
      ),
      ...VILLAGE_ORCHARD.map(async (point, i) => {
        const source = await loadModel(LOUNGE_MODELS.fruitTree);
        add(fitModel(source, point, { w: 2.8, d: 2.8, h: 4 }, GROUND_Y), `fruitTree${i}`);
      }),
      ...VILLAGE_FURNISHINGS.map(async (prop) => {
        const source = await loadModel(LOUNGE_MODELS[prop.model]);
        add(
          fitModel(
            source,
            prop,
            { w: prop.width, d: prop.depth, h: prop.height },
            GROUND_Y,
          ),
          prop.id,
        );
      }),
    ]),
  );
  const props = propJobs.then((results) =>
    results.every((result) => result.status === 'fulfilled'),
  );
  villageWorld = {
    root,
    world,
    houses,
    props,
    loaded,
    listeners,
    hemi,
    sun,
    life,
    season,
  };
  return villageWorld;
}

let sharedRenderer: THREE.WebGLRenderer | null = null;
function acquireRenderer() {
  if (sharedRenderer && !sharedRenderer.getContext().isContextLost())
    return sharedRenderer;
  if (sharedRenderer) {
    sharedRenderer.dispose();
    sharedRenderer = null;
  }
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const canvas = renderer.domElement;
  canvas.className = 'hv-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  sharedRenderer = renderer;
  return renderer;
}

/* Upright character plane (yaw only), like the bedroom walk room: a
   screen-facing Sprite leans back ~0.9 units and sinks into walls. */
const CAMERA_UP_Y = Math.cos(
  Math.atan2(CAMERA_OFFSET.y, Math.hypot(CAMERA_OFFSET.x, CAMERA_OFFSET.z)),
);
const FIGURE_CANVAS = { width: 256, height: 320 } as const;
/** Vertical world height of the sprite canvas; projects to VILLAGE_ACTOR_HEIGHT on screen. */
const FIGURE_HEIGHT = VILLAGE_ACTOR_HEIGHT / CAMERA_UP_Y;
let figureGeometry: THREE.PlaneGeometry | null = null;
function getFigureGeometry() {
  if (!figureGeometry) {
    figureGeometry = new THREE.PlaneGeometry(
      VILLAGE_ACTOR_HEIGHT * (FIGURE_CANVAS.width / FIGURE_CANVAS.height),
      FIGURE_HEIGHT,
    );
    // loungeSprites.draw places the soles at 97% of the canvas height.
    figureGeometry.translate(0, FIGURE_HEIGHT * 0.47, 0);
  }
  return figureGeometry;
}
const FIGURE_YAW = Math.atan2(CAMERA_OFFSET.x, CAMERA_OFFSET.z);

function disposeObject(root: THREE.Object3D) {
  const shared = getFigureGeometry();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry && mesh.geometry !== shared) mesh.geometry.dispose();
    if (mesh.material)
      for (const material of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]) {
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) value.dispose();
        material.dispose();
      }
  });
}

/**
 * Keeps the follow camera's ground footprint on the island (plus a small
 * skirt) along the screen's own axes, while never letting the player leave
 * the central 75% of the view.
 */
function clampFollowTarget(
  target: THREE.Vector3,
  player: VillagePoint,
  halfWidth: number,
  halfHeight: number,
) {
  const ground = Math.hypot(CAMERA_OFFSET.x, CAMERA_OFFSET.z);
  const sinElevation = Math.sin(Math.acos(CAMERA_UP_Y));
  // Screen-right and screen-up directions projected onto the ground (orthonormal).
  const rx = CAMERA_OFFSET.z / ground,
    rz = -CAMERA_OFFSET.x / ground,
    fx = -CAMERA_OFFSET.x / ground,
    fz = -CAMERA_OFFSET.z / ground;
  const depth = halfHeight / sinElevation;
  const margin = 3;
  const w = VILLAGE_BOUNDS.width / 2,
    d = VILLAGE_BOUNDS.depth / 2;
  const extentA = w * Math.abs(rx) + d * Math.abs(rz) + margin,
    extentB = w * Math.abs(fx) + d * Math.abs(fz) + margin;
  let a = target.x * rx + target.z * rz,
    b = target.x * fx + target.z * fz;
  const limitA = Math.max(0, extentA - halfWidth),
    limitB = Math.max(0, extentB - depth);
  a = THREE.MathUtils.clamp(a, -limitA, limitA);
  b = THREE.MathUtils.clamp(b, -limitB, limitB);
  const pa = player.x * rx + player.z * rz,
    pb = player.x * fx + player.z * fz;
  a = THREE.MathUtils.clamp(a, pa - halfWidth * 0.75, pa + halfWidth * 0.75);
  b = THREE.MathUtils.clamp(b, pb - depth * 0.75, pb + depth * 0.75);
  target.x = a * rx + b * fx;
  target.z = a * rz + b * fz;
}

/** NPC friends wait beside (not on) their own front step. */
function npcPoint(actor: number): VillagePoint {
  const place = VILLAGE_PLACES.find((item) => item.actor === actor);
  if (!place) return { ...VILLAGE_START };
  for (const dx of [1.3, -1.3, 2])
    for (const dz of [0.4, 0.9]) {
      const point = { x: place.entry.x + dx, z: place.entry.z + dz };
      if (villageCanWalk(point)) return point;
    }
  return { ...place.entry };
}

type Sample = { t: number; x: number; z: number };

/** Village presence uses the 'village' area; its coordinates map onto the island. */
export function Village3D(props: Props) {
  const latest = useRef(props);
  useLayoutEffect(() => {
    latest.current = props;
  }, [props]);
  const hostRef = useRef<HTMLDivElement>(null),
    labelsRef = useRef<HTMLDivElement>(null);
  const miniSelfRef = useRef<SVGCircleElement>(null);
  const routeRef = useRef<HTMLOutputElement>(null);
  const requestedPlace = useRef<VillagePlace | null>(null);
  const directions = useRef(new Set<Direction>());
  const runToggle = useRef(false),
    shiftHeld = useRef(false);
  const [runPressed, setRunPressed] = useState(false);
  const controls = useRef<{
    go: (place: VillagePlace) => void;
    enter: (place: VillagePlace) => void;
    zoom: (delta: number) => void;
    home: () => void;
    overview: () => void;
    visit: (point: VillagePoint) => void;
    stop: () => void;
    act: (action: VillageAction) => void;
  } | null>(null);
  const [state, setState] = useState<
    'loading' | 'ready' | 'partial' | 'unavailable' | 'lost'
  >('loading');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<VillagePlace | null>(null),
    [directory, setDirectory] = useState(false),
    [nearby, setNearby] = useState<NearbyVillageEntrance | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const nearbyId = useRef<string | null>(null);
  const [action, setAction] = useState<VillageAction | null>(null);
  const [phase, setPhase] = useState<DayPhase>('day');
  const [touch] = useState(isTouchDevice);
  // Phones start with the minimap folded into a small button.
  const [miniOpen, setMiniOpen] = useState(
    () =>
      typeof window === 'undefined' ||
      !window.matchMedia?.('(max-width: 600px)').matches,
  );
  /** Nearest building (minimap highlight), updated only when it changes. */
  const [nearestPlace, setNearestPlace] = useState<string | null>(null);
  // Ready crops / ripe trees for the farm label and the directory, refreshed
  // exactly when the next one becomes ready (server clock).
  const lifeClock = useServerClock(
    props.clockOffset ?? 0,
    [
      ...(props.life?.me.farm.map((p) => p.readyAt) ?? []),
      ...FRUIT_TREES.map((t) => props.life?.me.fruitReadyAt?.[t] ?? 0),
    ],
    60_000,
  );
  const readyCount = (props.life?.me.farm ?? []).filter(
    (p) => p.crop && (p.readyAt ?? Infinity) <= lifeClock,
  ).length;
  const ripeTrees = props.life
    ? FRUIT_TREES.filter((t) => (props.life?.me.fruitReadyAt?.[t] ?? 0) <= lifeClock).length
    : 0;
  // Keep a friend's outfit for when they are offline (NPCs, mail avatars).
  useEffect(() => {
    for (const p of props.players)
      if (!p.id.startsWith('friend-')) rememberLook(p.actor, p.look);
  }, [props.players]);
  // Onboarding / directory "내 텃밭으로 가 보기".
  useEffect(() => {
    const guide = () => {
      const bed = farmBed(latest.current.save.actor);
      if (bed) controls.current?.visit(farmFront(bed));
    };
    window.addEventListener('bumtadew:guide-farm', guide);
    // "가 보기" from the life panels (museum, board, fishing spots…).
    const go = (e: Event) => {
      const p = (e as CustomEvent<VillagePoint>).detail;
      if (p && Number.isFinite(p.x) && Number.isFinite(p.z)) controls.current?.visit(p);
    };
    window.addEventListener('bumtadew:go', go);
    return () => {
      window.removeEventListener('bumtadew:guide-farm', guide);
      window.removeEventListener('bumtadew:go', go);
    };
  }, []);
  // The door prompt ("회관 · 안에 2명") and the action button's context.
  const doorPlace =
    action?.target.type === 'door'
      ? action.target.entrance.place
      : !action
        ? (nearby?.place ?? null)
        : null;
  const doorCount =
    doorPlace && props.areaCounts ? (props.areaCounts[doorPlace.id] ?? 0) : undefined;
  const actionDetail = doorPlace
    ? doorPlace.name + (doorCount ? ` · 안에 ${doorCount}명` : '')
    : action?.target.type === 'spot' && action.target.spot.kind === 'npc'
      ? ACTORS[action.target.spot.actor]
      : undefined;
  const actionDisabled =
    action?.target.type === 'spot' &&
    action.target.spot.kind === 'tree' &&
    (!props.life ||
      (props.life.me.fruitReadyAt?.[action.target.spot.id] ??
        action.target.spot.readyAt) > lifeClock);
  // Preload the building I am about to enter (chunk + art).
  const nearPlaceId = nearby?.place.id ?? null;
  useEffect(() => {
    latest.current.onNear?.(
      nearPlaceId ? (VILLAGE_PLACES.find((p) => p.id === nearPlaceId) ?? null) : null,
    );
  }, [nearPlaceId]);
  const select = (place: VillagePlace) => {
    requestedPlace.current = place;
    setDistrict(null);
    setSelected(place);
    setDirectory(false);
    controls.current?.go(place);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement;
      if (
        !document.querySelector('dialog[open]') &&
        (!active || active === document.body || !active.isConnected)
      )
        hostRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const host = hostRef.current!;
    const labels = labelsRef.current!;
    const activeDirections = directions.current;
    let disposed = false,
      frame = 0,
      visible = true,
      contextLost = false,
      assetsReady = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = acquireRenderer();
    } catch {
      queueMicrotask(() => {
        if (!disposed) setState('unavailable');
      });
      return () => {
        disposed = true;
      };
    }
    const canvas = renderer.domElement;
    host.insertBefore(canvas, host.firstChild);
    const world = getVillageWorld();
    const scene = new THREE.Scene();
    scene.add(world.root);
    renderer.shadowMap.needsUpdate = true;
    const syncLoaded = () => {
      if (disposed) return;
      renderer.shadowMap.needsUpdate = true;
      Object.assign(host.dataset, world.loaded);
      host.dataset.modelsLoaded = String(Object.keys(world.loaded).length);
      needsRender = true;
    };
    world.listeners.add(syncLoaded);
    const camera = new THREE.OrthographicCamera(-36, 36, 24, -24, 0.1, 180);
    const target = new THREE.Vector3(0, 0, 0),
      desiredTarget = target.clone();
    let followZoom = villageCameraFrame(
      host.clientWidth,
      host.clientHeight,
      VILLAGE_BOUNDS.width,
      VILLAGE_BOUNDS.depth,
    ).followZoom;
    let zoom = followZoom,
      desiredZoom = zoom;
    let follow = true;
    const zoomLimit = () => Math.max(8, followZoom * 1.7);
    const safePosition = (point: VillagePoint): VillagePoint =>
      villageCanWalk(point)
        ? { ...point }
        : (villagePath(VILLAGE_START, point).at(-1) ?? { ...VILLAGE_START });
    // Spawn on the plaza, or just outside the building we are leaving; the
    // server's stale presence coordinates are never used for our own start.
    let position: VillagePoint = safePosition(
      latest.current.initialPosition ?? VILLAGE_START,
    );
    target.set(position.x, 0, position.z - 1.2);
    desiredTarget.copy(target);
    let path: VillagePoint[] = [];
    let entryIntent: VillagePlace | null = null;
    let lastEntranceCheck = -1000;
    let width = host.clientWidth,
      height = host.clientHeight;
    let needsRender = true;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.33, 0.43, 40),
      new THREE.MeshBasicMaterial({
        color: '#fff2b5',
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.visible = false;
    scene.add(marker);
    const goTo = (
      point: VillagePoint,
      enterWhenNear: VillagePlace | null = null,
    ) => {
      entryIntent = enterWhenNear;
      path = villagePath(position, point);
      const end = path.at(-1);
      if (!end) entryIntent = null;
      marker.visible = !!end;
      if (end) marker.position.set(end.x, 0.2, end.z);
      follow = true;
      desiredZoom = Math.max(desiredZoom, followZoom);
      host.focus({ preventScroll: true });
    };
    const setZoom = (value: number) => {
      desiredZoom = THREE.MathUtils.clamp(value, 0.8, zoomLimit());
    };
    controls.current = {
      visit: (point) => {
        requestedPlace.current = null;
        goTo(point);
      },
      stop: () => {
        path = [];
        entryIntent = null;
        requestedPlace.current = null;
        marker.visible = false;
      },
      go: (place) => {
        requestedPlace.current = place;
        goTo(place.entry);
      },
      enter: (place) => {
        requestedPlace.current = place;
        if (villageCanEnterPlace(place, latest.current.save.actor))
          goTo(place.entry, place);
        else goTo(place.entry);
      },
      zoom: (delta) => setZoom(desiredZoom + delta),
      home: () => {
        follow = true;
        desiredZoom = followZoom;
      },
      overview: () => {
        follow = false;
        desiredTarget.set(0, 0, 0);
        desiredZoom = 1;
      },
      act: (target) => act(target),
    };

    type Figure = {
      group: THREE.Group;
      body: THREE.MeshBasicMaterial;
      texture: THREE.CanvasTexture;
      canvas: HTMLCanvasElement;
      point: VillagePoint;
      drawn: number;
      walking: boolean;
      motion: 'walk' | 'run' | 'idle';
      phase: number;
      facing: 1 | -1;
      speed: number;
      samples: Sample[];
      network: { x: number; y: number } | null;
      tag: HTMLElement | null;
      bubble: HTMLElement;
      bubbleText: string;
    };
    const figures = new Map<string, Figure>();
    let sprites: Awaited<ReturnType<typeof loungeSprites>> | null = null;
    const spritesJob = loungeSprites().then(async (value) => {
      if (disposed) return;
      sprites = value;
      const save = latest.current.save;
      await value.ensure(save.actor, save.looks[save.actor]);
      if (!disposed && !reduced.matches)
        void value.warmMotion(save.actor, save.looks[save.actor]).catch(() => {
          /* The existing wardrobe remains usable when optional motion art is offline. */
        });
    });
    // First frame = terrain + resident homes + my own character's atlas.
    void Promise.allSettled([world.houses, spritesJob]).then((results) => {
      if (disposed || contextLost) return;
      assetsReady = true;
      needsRender = true;
      renderer.shadowMap.needsUpdate = true;
      setState(results[1]?.status === 'rejected' ? 'unavailable' : 'ready');
      void world.props.then((complete) => {
        if (!disposed && !complete) setState('partial');
      });
    });
    syncLoaded();

    // Offline friends appear as NPCs that wander on a shared, time-based schedule.
    const npcPlayers = new Map<number, LoungePlayer>();
    const npcPlayer = (actor: number): LoungePlayer => {
      let player = npcPlayers.get(actor);
      if (!player) {
        player = {
          id: `friend-${actor}`,
          actor,
          look: lookFor(actor),
          x: 50,
          y: 60,
          emote: '',
          emoteAt: 0,
          balance: 0,
          area: 'village',
        };
        npcPlayers.set(actor, player);
      }
      // The friend's last seen outfit (cached per device), else the default.
      player.look = lookFor(actor);
      return player;
    };
    const npcTalk = new Map<number, { text: string; until: number }>();
    const serverNow = () => Date.now() + (latest.current.clockOffset ?? 0);
    let currentAction: VillageAction | null = null,
      actionKey = '';
    const act = (action: VillageAction) => {
      const current = latest.current;
      const t = action.target;
      if (t.type === 'door') {
        const { place, canEnter } = t.entrance;
        entryIntent = null;
        requestedPlace.current = place;
        if (canEnter) current.onEnter(place.destination, place);
        else if (place.kind === 'home' && place.actor !== undefined)
          current.onVisit?.(place.actor);
        return;
      }
      const target = t.spot;
      if (action.disabled) return;
      if (target.kind === 'fish') current.onFish?.(target.spot);
      else if (target.kind === 'spawn') current.onSpawn?.(target.spot, target.mode, target.item);
      else if (target.kind === 'museum') current.onMuseum?.();
      else if (target.kind === 'board') current.onBoard?.();
      else if (target.kind === 'friendFarm') current.onWaterFriend?.(target.actor);
      else if (target.kind === 'fountain') current.onWish?.();
      else if (target.kind === 'farm') current.onFarm?.();
      else if (target.kind === 'market') current.onShop?.();
      else if (target.kind === 'mailbox') current.onMail?.();
      else if (target.kind === 'commons') {
        const bed = farmBed(current.save.actor);
        if (bed) goTo(farmFront(bed));
      } else if (target.kind === 'tree') {
        const readyAt = current.life?.me.fruitReadyAt?.[target.id] ?? target.readyAt;
        if (current.life && readyAt <= serverNow()) current.onPick?.(target.id);
      } else if (target.kind === 'npc') {
        const status = Object.values(current.life?.statuses ?? {}).find(
          (s) => s.actor === target.actor,
        );
        npcTalk.set(target.actor, {
          text: npcLine(target.actor, status?.text, serverNow()).slice(0, 48),
          until: Date.now() + 6000,
        });
        host.dataset.talk = String(target.actor);
        needsRender = true;
        current.onTalk?.(target.actor);
      }
    };
    let lastFishKey = '',
      fishFrom: VillagePoint = { x: 0, z: 0 };
    let lastLife: LifeView | null | undefined = undefined,
      lastLight = -1e9,
      lastAudio = -1e9,
      lastElevation = -1;
    const updateLife = () => {
      const current = latest.current,
        life = current.life,
        me = current.save.actor,
        at = serverNow();
      const plots: Record<number, ReturnType<typeof plotsForActor>> = {};
      for (let a = 0; a < ACTORS.length; a++)
        plots[a] = plotsForActor(life, a, me);
      if (life?.me.farm?.length)
        plots[me] = life.me.farm.map((plot) => ({
          crop: plot.crop,
          stage: plot.crop ? plotStage(plot, at) : 0,
        }));
      const seasonChanged = life?.calendar
        ? world.season.update({
            season: life.calendar.season,
            weather: life.weather?.today ?? 'sunny',
            flags: life.flags ?? [],
            spawns: life.me.spawns ?? [],
            effects: current.seasonFx !== false,
            bundlesDone: (life.bundles ?? []).map((b) => b.done),
          })
        : false;
      if (seasonChanged) {
        host.dataset.season = life?.calendar?.season ?? '';
        host.dataset.weather = life?.weather?.today ?? '';
        host.dataset.spawns = String((life?.me.spawns ?? []).filter((sp) => !sp.taken).length);
        renderer.shadowMap.needsUpdate = true;
        needsRender = true;
      }
      const changed = world.life.update({
        plots,
        watered: life?.me.farm?.map((plot) => plot.wateredAt !== null) ?? [],
        selfActor: me,
        ripeTrees: life
          ? FRUIT_TREES.filter((t) => (life.me.fruitReadyAt?.[t] ?? 0) <= at)
          : [],
        unreadMail: (life?.me.mailUnread ?? 0) > 0,
      });
      if (!changed) return;
      host.dataset.plots = String(
        Object.values(plots).reduce(
          (n, list) => n + list.filter((plot) => plot.crop).length,
          0,
        ),
      );
      needsRender = true;
    };
    const noon = dayLighting(Date.UTC(2026, 0, 1, 3));
    // Sprites are unlit (toneMapped: false); at night they take a cool tint
    // so the characters do not glow against the dark village.
    const figureTint = new THREE.Color('#ffffff'),
      nightTint = new THREE.Color('#c9d0ff');
    let lastSky = '';
    const applyLight = () => {
      const light =
        latest.current.dayNight === false ? noon : dayLighting(serverNow());
      world.hemi.color.set(light.hemiSky);
      world.hemi.groundColor.set(light.hemiGround);
      world.hemi.intensity = light.hemiIntensity;
      world.sun.color.set(light.sun);
      world.sun.intensity = light.sunIntensity;
      world.sun.position.set(-20, 12 + 22 * light.elevation, 25);
      if (Math.abs(light.elevation - lastElevation) > 0.01) {
        lastElevation = light.elevation;
        renderer.shadowMap.needsUpdate = true;
      }
      renderer.toneMappingExposure = light.exposure;
      world.life.setNight(light.lamps);
      if (light.sky !== lastSky) {
        lastSky = light.sky;
        host.style.background = `linear-gradient(180deg, ${light.sky}, ${light.sky}ee)`;
        needsRender = true;
      }
      host.dataset.phase = light.phase;
      host.dataset.lamps = light.lamps.toFixed(2);
      setPhase(light.phase);
      const tint = new THREE.Color('#ffffff').lerp(nightTint, Math.min(1, light.lamps) * 0.85);
      if (!tint.equals(figureTint)) {
        figureTint.copy(tint);
        for (const figure of figures.values()) figure.body.color.copy(figureTint);
        needsRender = true;
      }
      return light;
    };
    let night = false;

    const createFigure = (p: LoungePlayer): Figure => {
      const own = p.id === latest.current.self;
      const c = document.createElement('canvas');
      c.width = FIGURE_CANVAS.width;
      c.height = FIGURE_CANVAS.height;
      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      const bodyMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        color: figureTint,
        transparent: true,
        alphaTest: 0.12,
        depthWrite: true,
        toneMapped: false,
      });
      const body = new THREE.Mesh(getFigureGeometry(), bodyMaterial);
      body.rotation.y = FIGURE_YAW;
      const group = new THREE.Group();
      group.add(body);
      if (own) {
        // Occluded silhouette: drawn only where something nearer hides the
        // figure (GreaterDepth), so the player never vanishes behind a roof.
        const ghost = new THREE.Mesh(
          getFigureGeometry(),
          new THREE.MeshBasicMaterial({
            map: texture,
            color: '#3d5a86',
            transparent: true,
            opacity: 0.42,
            alphaTest: 0.12,
            depthWrite: false,
            depthFunc: THREE.GreaterDepth,
            toneMapped: false,
          }),
        );
        ghost.rotation.y = FIGURE_YAW;
        ghost.renderOrder = 10;
        group.add(ghost);
      }
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.32, 20),
        new THREE.MeshBasicMaterial({
          color: '#45573c',
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      // Above the paving insets (top 0.19) so the shadow never disappears.
      shadow.position.y = 0.205;
      shadow.scale.y = 0.65;
      group.add(shadow);
      if (own) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.4, 0.5, 40),
          new THREE.MeshBasicMaterial({
            color: '#ffe4a0',
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.21;
        group.add(ring);
      }
      scene.add(group);
      const npc = p.id.startsWith('friend-');
      const point = own
        ? position
        : safePosition(npc ? npcPoint(p.actor) : villageFromNetwork(p));
      let tag: HTMLElement | null = null;
      const bubble = document.createElement('span');
      bubble.className = 'hv-bubble';
      bubble.hidden = true;
      bubble.setAttribute('aria-hidden', 'true');
      if (!own) {
        tag = document.createElement('span');
        tag.className = 'hv-tag';
        tag.textContent = ACTORS[p.actor] ?? '친구';
        tag.dataset.player = p.id;
        labels.appendChild(tag);
      }
      labels.appendChild(bubble);
      return {
        group,
        body: bodyMaterial,
        texture,
        canvas: c,
        point,
        drawn: -1000,
        walking: false,
        motion: 'idle',
        phase: 0,
        facing: 1,
        speed: 0,
        samples: [{ t: performance.now(), ...point }],
        network: own || npc ? null : { x: p.x, y: p.y },
        tag,
        bubble,
        bubbleText: '',
      };
    };
    const removeFigure = (id: string, figure: Figure) => {
      scene.remove(figure.group);
      disposeObject(figure.group);
      figure.tag?.remove();
      figure.bubble.remove();
      figures.delete(id);
    };

    // Newest chat line per friend becomes a speech bubble for a few seconds.
    const seenChat = new Set<string>(
      (latest.current.chat ?? []).map((line) => line.id),
    );
    const chatBubbles = new Map<number, { text: string; until: number; at: number }>();
    let lastChat: readonly ChatLine[] | undefined = latest.current.chat;

    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.16),
      hit = new THREE.Vector3();
    let press: {
      id: number;
      x: number;
      y: number;
      startX: number;
      startY: number;
      dragged: boolean;
    } | null = null;
    // Two-finger pinch zoom (touch) shares the canvas with drag and tap.
    const touches = new Map<number, { x: number; y: number }>();
    let pinch: { distance: number; zoom: number } | null = null;
    const pinchDistance = () => {
      const [a, b] = [...touches.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    let locomotion: LocomotionState = { phase: 0, facing: 1 };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen')
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size >= 2) {
        press = null;
        pinch = { distance: pinchDistance(), zoom: desiredZoom };
        return;
      }
      if (e.button !== 0 || !e.isPrimary) return;
      host.focus({ preventScroll: true });
      canvas.setPointerCapture(e.pointerId);
      press = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        dragged: false,
      };
    };
    const drag = (e: PointerEvent) => {
      if (touches.has(e.pointerId))
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && touches.size >= 2) {
        const distance = pinchDistance();
        if (pinch.distance > 0 && distance > 0)
          setZoom(pinch.zoom * (distance / pinch.distance));
        needsRender = true;
        return;
      }
      if (!press || e.pointerId !== press.id) return;
      if (Math.hypot(e.clientX - press.startX, e.clientY - press.startY) > 6)
        press.dragged = true;
      if (press.dragged) {
        follow = false;
        const units = (camera.top - camera.bottom) / camera.zoom / height;
        const right = new THREE.Vector3().setFromMatrixColumn(
          camera.matrixWorld,
          0,
        );
        const up = new THREE.Vector3().setFromMatrixColumn(
          camera.matrixWorld,
          1,
        );
        desiredTarget.addScaledVector(right, -(e.clientX - press.x) * units);
        desiredTarget.addScaledVector(up, (e.clientY - press.y) * units * 1.4);
        desiredTarget.y = 0;
        desiredTarget.x = THREE.MathUtils.clamp(
          desiredTarget.x,
          -VILLAGE_BOUNDS.width / 2,
          VILLAGE_BOUNDS.width / 2,
        );
        desiredTarget.z = THREE.MathUtils.clamp(
          desiredTarget.z,
          -VILLAGE_BOUNDS.depth / 2,
          VILLAGE_BOUNDS.depth / 2,
        );
      }
      press.x = e.clientX;
      press.y = e.clientY;
    };
    const releaseTouch = (e: PointerEvent) => {
      touches.delete(e.pointerId);
      if (touches.size < 2) pinch = null;
    };
    const up = (e: PointerEvent) => {
      const wasPinching = !!pinch;
      releaseTouch(e);
      if (!press || e.pointerId !== press.id) return;
      if (!press.dragged && !wasPinching) {
        entryIntent = null;
        requestedPlace.current = null;
        const r = canvas.getBoundingClientRect();
        pointer.set(
          ((e.clientX - r.left) / r.width) * 2 - 1,
          (-(e.clientY - r.top) / r.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        if (
          raycaster.ray.intersectPlane(floor, hit) &&
          Math.abs(hit.x) <= VILLAGE_BOUNDS.width / 2 + 1 &&
          Math.abs(hit.z) <= VILLAGE_BOUNDS.depth / 2 + 1
        )
          goTo({ x: hit.x, z: hit.z });
      }
      press = null;
    };
    const cancel = (e: PointerEvent) => {
      releaseTouch(e);
      press = null;
    };
    const lostCapture = (e: PointerEvent) => {
      if (press?.id === e.pointerId) press = null;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      // Trackpad pinch arrives as ctrl+wheel with small deltas.
      const scale = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      setZoom(desiredZoom * scale);
      needsRender = true;
    };
    const keydown = (e: KeyboardEvent) => {
      // Heard on window (focus may be on body or a dock button after a dialog).
      const at = sceneKeyTarget(e, host);
      if (!at || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyE') {
        // The one action button: E always presses it (Enter on a focused
        // button stays that button's).
        if (currentAction && (at === 'scene' || e.code === 'KeyE')) {
          e.preventDefault();
          act(currentAction);
        }
        return;
      }
      const direction = KEYS[e.code];
      if (direction) {
        e.preventDefault();
        entryIntent = null;
        requestedPlace.current = null;
        directions.current.add(direction);
        path = [];
        marker.visible = false;
        follow = true;
        desiredZoom = Math.max(desiredZoom, followZoom);
      }
    };
    const keyup = (e: KeyboardEvent) => {
      const d = KEYS[e.code];
      if (d) directions.current.delete(d);
      if (e.key === 'Shift') {
        shiftHeld.current = false;
        setRunPressed(runToggle.current);
      }
    };
    const blur = (event?: Event) => {
      if (
        event?.type === 'focusout' &&
        event instanceof FocusEvent &&
        event.relatedTarget instanceof Node &&
        host.contains(event.relatedTarget)
      )
        return;
      activeDirections.clear();
      shiftHeld.current = false;
      setRunPressed(runToggle.current);
      path = [];
      entryIntent = null;
      requestedPlace.current = null;
      marker.visible = false;
      press = null;
    };
    const keyrun = (e: KeyboardEvent) => {
      if (e.key !== 'Shift' || e.repeat || !sceneKeyTarget(e, host)) return;
      shiftHeld.current = true;
      setRunPressed(true);
    };
    const visibilityChanged = () => {
      if (document.hidden) blur();
    };
    const loss = (e: Event) => {
      // preventDefault allows the browser to restore the context later.
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frame);
      setState('lost');
    };
    const restored = () => {
      if (disposed) return;
      contextLost = false;
      renderer.shadowMap.needsUpdate = true;
      for (const figure of figures.values()) {
        figure.texture.needsUpdate = true;
        figure.drawn = -1000;
      }
      needsRender = true;
      setState(assetsReady ? 'ready' : 'loading');
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(animate);
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', drag);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('lostpointercapture', lostCapture);
    canvas.addEventListener('wheel', wheel, { passive: false });
    canvas.addEventListener('webglcontextlost', loss);
    canvas.addEventListener('webglcontextrestored', restored);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keydown', keyrun);
    host.addEventListener('focusout', blur);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibilityChanged);
    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) return;
      const aspect = width / height;
      const framing = villageCameraFrame(
        width,
        height,
        VILLAGE_BOUNDS.width,
        VILLAGE_BOUNDS.depth,
      );
      const half = framing.half;
      const wasDefault = Math.abs(desiredZoom - followZoom) < 0.01;
      followZoom = framing.followZoom;
      if (follow && wasDefault) zoom = desiredZoom = followZoom;
      Object.assign(camera, {
        left: -half * aspect,
        right: half * aspect,
        top: half,
        bottom: -half,
      });
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      needsRender = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) blur();
    });
    visibility.observe(host);
    // Tell friends where I actually am right away (not the server's default).
    queueMicrotask(() => {
      if (disposed) return;
      const net = villageToNetwork(position);
      latest.current.onMove(net.x, net.y);
    });

    const selfTag = labels.querySelector<HTMLElement>('[data-self-label]');
    const myBed = farmBed(latest.current.save.actor);
    /**
     * Building name chips. While walking only the building you are about to
     * enter, the one you are heading to and the nearest one within LABEL_NEAR
     * are named (fading in/out); the zoomed-out map names every place with a
     * compact chip. Nothing is named while the camera sweeps fast.
     */
    type PlaceLabel = {
      id: string;
      element: HTMLElement | null;
      /** Footprint centre and half extents (world units). */
      x: number;
      z: number;
      hw: number;
      hd: number;
      /** Anchor above the roof. */
      ax: number;
      ay: number;
      az: number;
      shown: boolean;
      w: number;
      h: number;
    };
    const placeLabels: PlaceLabel[] = VILLAGE_PLACES.map((place) => ({
      id: place.id,
      element: labels.querySelector<HTMLElement>(`[data-place="${place.id}"]`),
      x: place.x,
      z: place.z,
      hw: place.width / 2,
      hd: place.depth / 2,
      ax: place.x,
      ay: place.kind === 'home' ? 3.4 : 4.4,
      az: place.z,
      shown: false,
      w: 0,
      h: 0,
    }));
    if (myBed) {
      const r = farmBedRect(myBed);
      placeLabels.push({
        id: 'farm',
        element: labels.querySelector<HTMLElement>('[data-farm-label]'),
        x: r.x,
        z: r.z,
        hw: r.w / 2,
        hd: r.d / 2,
        ax: r.x,
        ay: 1.1,
        az: r.z - r.d / 2,
        shown: false,
        w: 0,
        h: 0,
      });
    }
    let labelMode: 'walk' | 'overview' | '' = '',
      labelNearest: string | null = null,
      reportedNearest: string | null = null,
      labelsMeasured = -1e9,
      cameraCalmSince = 0,
      cameraSpeed = 0;
    const measureLabels = () => {
      for (const label of placeLabels)
        if (label.element) {
          label.w = label.element.offsetWidth;
          label.h = label.element.offsetHeight;
        }
    };
    const footprintDistance = (label: PlaceLabel) =>
      Math.hypot(
        Math.max(0, Math.abs(position.x - label.x) - label.hw),
        Math.max(0, Math.abs(position.z - label.z) - label.hd),
      );
    // Bottom edge of the floating header card, in scene pixels (L1).
    let topLimit = 10;
    /** On-screen HUD controls (scene pixels) that name chips keep clear of. */
    let hud: { l: number; r: number; t: number; b: number }[] = [];
    const measureTop = () => {
      const origin = host.getBoundingClientRect();
      hud = [
        ...document.querySelectorAll(
          '.hv-top-tools, .hv-camera, .hv-minimap, .hv-pad, .l-world-social',
        ),
      ]
        .map((element) => element.getBoundingClientRect())
        .filter((r) => r.width > 0)
        .map((r) => ({
          l: r.left - origin.left - 4,
          r: r.right - origin.left + 4,
          t: r.top - origin.top - 4,
          b: r.bottom - origin.top + 4,
        }));
      const header = document.querySelector('.l-world-header');
      if (!header) return;
      const bottom = header.getBoundingClientRect().bottom - origin.top;
      topLimit = Math.max(10, Math.min(height / 2, bottom));
    };
    measureTop();
    const projected = new THREE.Vector3();
    const project = (x: number, y: number, z: number) => {
      projected.set(x, y, z).project(camera);
      return {
        x: ((projected.x + 1) * width) / 2,
        y: ((1 - projected.y) * height) / 2,
        inFront: projected.z < 1,
      };
    };
    let previous = 0,
      lastRender = -1000,
      lastSend = -1000,
      lastData = -1000;
    let lastSent = { ...position },
      wasWalking = false;
    const animate = (now: number) => {
      if (disposed || contextLost) return;
      frame = requestAnimationFrame(animate);
      // Movement is substepped by villageStep, so a long frame (slow phone)
      // moves the right distance instead of slowing the world down.
      const dt = previous ? Math.min((now - previous) / 1000, 0.25) : 0;
      previous = now;
      if (!assetsReady || !visible || document.hidden) return;
      const before = position;
      const h =
        Number(directions.current.has('right')) -
        Number(directions.current.has('left'));
      const v =
        Number(directions.current.has('down')) -
        Number(directions.current.has('up'));
      const run = runToggle.current || shiftHeld.current;
      if (h || v) {
        entryIntent = null;
        requestedPlace.current = null;
        path = [];
        marker.visible = false;
        follow = true;
        desiredZoom = Math.max(desiredZoom, followZoom);
        const len = Math.hypot(h, v),
          speed =
            ((run ? WALK_SPEED * RUN_SPEED_MULTIPLIER : WALK_SPEED) * dt) / len;
        // Camera-right and ground-forward vectors keep arrow keys aligned with the screen.
        position = villageStep(
          position,
          (h * 0.837 + v * 0.547) * speed,
          (v * 0.837 - h * 0.547) * speed,
        );
      } else if (path.length) {
        let budget = WALK_SPEED * (run ? RUN_SPEED_MULTIPLIER : 1) * dt;
        while (path.length && budget > 0) {
          const to = path[0],
            dx = to.x - position.x,
            dz = to.z - position.z,
            distance = Math.hypot(dx, dz);
          if (distance < 0.06) {
            path.shift();
            continue;
          }
          const step = Math.min(distance, budget);
          const next = villageStep(
            position,
            (dx / distance) * step,
            (dz / distance) * step,
          );
          budget -= step;
          if (Math.hypot(next.x - position.x, next.z - position.z) < 1e-4) {
            path = [];
            break;
          }
          position = next;
        }
        if (!path.length) marker.visible = false;
      }
      const movedX = position.x - before.x,
        movedZ = position.z - before.z,
        moved = Math.hypot(movedX, movedZ),
        walking = moved > 0.0001,
        horizontal = movedX * 0.837 - movedZ * 0.547,
        playerMotion = advanceLocomotion(
          locomotion,
          { distance: moved, horizontal },
          run ? 'run' : 'walk',
          WALK_SPEED,
        );
      locomotion = playerMotion.state;
      if ((walking && now - lastSend > 180) || (!walking && wasWalking)) {
        if (
          Math.hypot(position.x - lastSent.x, position.z - lastSent.z) > 0.01
        ) {
          const net = villageToNetwork(position);
          latest.current.onMove(net.x, net.y);
          lastSent = { ...position };
          lastSend = now;
        }
      }
      wasWalking = walking;
      if (now - lastEntranceCheck > 80) {
        lastEntranceCheck = now;
        const entrance = villageNearbyEntrance(
          position,
          latest.current.save.actor,
        );
        if ((entrance?.place.id ?? null) !== nearbyId.current) {
          nearbyId.current = entrance?.place.id ?? null;
          setNearby(entrance);
        }
        const npcs: { actor: number; point: VillagePoint }[] = [];
        for (const [id, figure] of figures)
          if (id.startsWith('friend-'))
            npcs.push({ actor: Number(id.slice(7)), point: figure.point });
        const nextAction = villageAction(position, latest.current.save.actor, {
          life: latest.current.life,
          now: serverNow(),
          npcs,
          canVisit: !!latest.current.onVisit,
          tool: latest.current.tool,
        });
        const nextKey = villageActionKey(nextAction);
        currentAction = nextAction;
        if (nextKey !== actionKey) {
          actionKey = nextKey;
          setAction(nextAction);
        }
        // The minimap highlights the nearest building (any distance).
        let near: string | null = null,
          nearDistance = Infinity;
        for (const label of placeLabels) {
          if (label.id === 'farm') continue;
          const d = footprintDistance(label);
          if (d < nearDistance) {
            nearDistance = d;
            near = label.id;
          }
        }
        if (near !== reportedNearest) {
          reportedNearest = near;
          setNearestPlace(near);
        }
        host.dataset.spot =
          nextAction?.target.type === 'spot' ? nextAction.target.spot.kind : '';
        host.dataset.action = nextAction?.kind ?? '';
        host.dataset.nearbyPlace = entrance?.place.id ?? '';
        host.dataset.entryReady = String(entrance?.canEnter ?? false);
        host.dataset.destination =
          entryIntent?.destination ??
          requestedPlace.current?.destination ??
          entrance?.place.destination ??
          '';
        if (
          entryIntent &&
          entrance?.canEnter &&
          entrance.place.id === entryIntent.id
        ) {
          const place = entryIntent;
          entryIntent = null;
          latest.current.onEnter(place.destination, place);
        }
      }
      // Camera: follow with a clamp so the island edge never fills half the view.
      if (follow) {
        desiredTarget.set(position.x, 0, position.z - 1.2);
        clampFollowTarget(
          desiredTarget,
          position,
          camera.right / desiredZoom,
          camera.top / desiredZoom,
        );
      }
      const cameraMoving =
        Math.abs(zoom - desiredZoom) > 0.002 ||
        target.distanceToSquared(desiredTarget) > 0.00001;
      const beforeX = target.x,
        beforeZ = target.z,
        beforeZoom = zoom;
      target.lerp(desiredTarget, reduced.matches ? 1 : Math.min(1, dt * 5));
      zoom +=
        (desiredZoom - zoom) * (reduced.matches ? 1 : Math.min(1, dt * 6));
      if (dt > 0) {
        // Screen-space camera speed (px/s) plus relative zoom speed; smoothed
        // so one long frame does not flash the labels.
        const pixels = (zoom * height) / (camera.top - camera.bottom);
        const pan = (Math.hypot(target.x - beforeX, target.z - beforeZ) * pixels) / dt;
        const scale = (Math.abs(zoom - beforeZoom) / zoom / dt) * 400;
        cameraSpeed += (pan + scale - cameraSpeed) * Math.min(1, dt * 12);
        // Faster than a run (the follow camera's top speed) counts as a sweep.
        const fast = cameraSpeed > WALK_SPEED * RUN_SPEED_MULTIPLIER * pixels * 1.3 + 40;
        if (fast) cameraCalmSince = now;
      }
      camera.position.copy(target).add(CAMERA_OFFSET);
      camera.lookAt(target);
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      const current = latest.current;
      // Contract: the village shows only village presences (plus me and NPCs).
      const present = new Set(
        current.players
          .filter((p) => !p.id.startsWith('friend-'))
          .map((p) => p.actor),
      );
      const residents = [
        ...current.players.filter(
          (p) => p.id === current.self || (p.area as string) === 'village',
        ),
        ...ACTORS.map((_, actor) => actor)
          .filter((actor) => actor !== current.save.actor && !present.has(actor))
          .map(npcPlayer),
      ];
      if (current.life !== lastLife) {
        lastLife = current.life;
        updateLife();
      }
      if (now - lastLight > 1500) {
        lastLight = now;
        measureTop();
        const light = applyLight();
        night = light.phase === 'night' || light.phase === 'evening';
        updateLife();
      }
      if (now - lastAudio > 700) {
        lastAudio = now;
        loungeAudio.setScene({
          village: true,
          night,
          water: Math.max(
            0,
            1 -
              Math.abs(position.z - (VILLAGE_RIVER.minZ + VILLAGE_RIVER.maxZ) / 2) /
                9,
          ),
        });
      }
      if (walking) loungeAudio.footstep(run);
      const residentIds = new Set(residents.map((p) => p.id));
      for (const [id, figure] of figures)
        if (!residentIds.has(id)) removeFigure(id, figure);
      if (current.chat !== lastChat) {
        lastChat = current.chat;
        for (const line of current.chat ?? [])
          if (!seenChat.has(line.id)) {
            seenChat.add(line.id);
            chatBubbles.set(line.actor, {
              text: line.text.slice(0, 40),
              at: Date.now(),
              until: Date.now() + BUBBLE_MS,
            });
          }
      }
      let anyWalking = walking;
      for (const p of residents) {
        let figure = figures.get(p.id);
        if (!figure) {
          figure = createFigure(p);
          figures.set(p.id, figure);
        }
        const own = p.id === current.self;
        if (own) {
          figure.point = position;
          figure.walking = walking;
          figure.motion = walking ? playerMotion.motion : 'idle';
          figure.phase = locomotion.phase;
          figure.facing = locomotion.facing;
        } else if (p.id.startsWith('friend-')) {
          const pose = npcPose(p.actor, serverNow());
          const beforeNpc = figure.point;
          figure.point = pose.point;
          const npcX = pose.point.x - beforeNpc.x,
            npcZ = pose.point.z - beforeNpc.z,
            npcDistance = Math.hypot(npcX, npcZ);
          const npcMotion = advanceLocomotion(
            { phase: figure.phase, facing: figure.facing },
            {
              // A teleport (first frame, clock jump) is not a stride.
              distance: npcDistance < 2 ? npcDistance : 0,
              horizontal: npcX * 0.837 - npcZ * 0.547,
            },
            'walk',
            WALK_SPEED,
          );
          figure.phase = npcMotion.state.phase;
          figure.facing = npcMotion.state.facing;
          figure.walking = pose.walking;
          figure.motion = pose.walking ? 'walk' : 'idle';
        } else if (figure.network) {
          // Remote: replay a timestamped buffer without collision (the sender
          // already walked a valid route), snapping only on teleports.
          if (figure.network.x !== p.x || figure.network.y !== p.y) {
            figure.network = { x: p.x, y: p.y };
            const next = villageFromNetwork(p);
            const last = figure.samples.at(-1)!;
            const jump = Math.hypot(next.x - last.x, next.z - last.z);
            const elapsed = Math.max(0.001, (now - last.t) / 1000);
            if (
              jump > 12 ||
              (jump > 3 &&
                jump / Math.min(elapsed, 0.6) >
                  WALK_SPEED * RUN_SPEED_MULTIPLIER * 1.6)
            )
              figure.samples = [{ t: now - REMOTE_DELAY, ...next }];
            else {
              // After a pause, start the new leg now rather than in the past.
              last.t = Math.max(last.t, now - 500);
              figure.samples.push({ t: now, ...next });
              if (figure.samples.length > 12) figure.samples.shift();
            }
          }
          const renderAt = now - REMOTE_DELAY;
          const samples = figure.samples;
          while (samples.length > 1 && samples[1].t <= renderAt) samples.shift();
          const a = samples[0],
            b = samples[1];
          const beforeRemote = figure.point;
          figure.point =
            b && renderAt > a.t
              ? {
                  x: a.x + (b.x - a.x) * ((renderAt - a.t) / (b.t - a.t)),
                  z: a.z + (b.z - a.z) * ((renderAt - a.t) / (b.t - a.t)),
                }
              : { x: a.x, z: a.z };
          const remoteX = figure.point.x - beforeRemote.x,
            remoteZ = figure.point.z - beforeRemote.z,
            remoteDistance = Math.hypot(remoteX, remoteZ);
          // Smoothed speed with hysteresis avoids walk/run/idle flicker.
          const instant = dt > 0 ? remoteDistance / dt : 0;
          figure.speed += (instant - figure.speed) * Math.min(1, dt * 6);
          const running =
            figure.motion === 'run'
              ? figure.speed > WALK_SPEED * 1.18
              : figure.speed > WALK_SPEED * 1.32;
          figure.motion =
            figure.speed < (figure.motion === 'idle' ? 0.6 : 0.3)
              ? 'idle'
              : running
                ? 'run'
                : 'walk';
          const remoteMotion = advanceLocomotion(
            { phase: figure.phase, facing: figure.facing },
            {
              distance: remoteDistance,
              horizontal: remoteX * 0.837 - remoteZ * 0.547,
            },
            figure.motion === 'run' ? 'run' : 'walk',
            WALK_SPEED,
          );
          figure.phase = remoteMotion.state.phase;
          figure.facing = remoteMotion.state.facing;
          figure.walking = figure.motion !== 'idle';
        }
        if (figure.walking) anyWalking = true;
        const onBridge =
          VILLAGE_RIVER.bridges.some(
            (bridge) => Math.abs(figure.point.x - bridge.x) < bridge.halfWidth,
          ) &&
          figure.point.z > VILLAGE_RIVER.minZ - 0.7 &&
          figure.point.z < VILLAGE_RIVER.maxZ + 0.7;
        const elevation = onBridge
          ? Math.min(
              1,
              (figure.point.z - (VILLAGE_RIVER.minZ - 0.7)) / 0.5,
              (VILLAGE_RIVER.maxZ + 0.7 - figure.point.z) / 0.5,
            ) * 0.53
          : 0;
        figure.group.position.set(figure.point.x, elevation, figure.point.z);
        // Redraw on the gait clock while moving (draw() skips unchanged
        // poses), and a few times a second at rest for idle breathing.
        if (sprites && (figure.walking || now - figure.drawn > 140)) {
          const changed = sprites.draw(
            figure.canvas,
            p.actor,
            p.look,
            figure.motion,
            figure.phase,
            false,
            reduced.matches,
            { facing: figure.facing },
          );
          if (changed) {
            figure.texture.needsUpdate = true;
            needsRender = true;
          }
          figure.drawn = now;
        }
        // Speech bubble: newest of chat line or sticker reaction.
        let text = '';
        let startedAt = 0;
        const reaction = p.reaction;
        if (reaction) {
          const expires = reaction.expiresAt ?? reaction.at + REACTION_TTL;
          if (Date.now() < expires) {
            text = REACTIONS.find((item) => item.id === reaction.id)?.label ?? '';
            startedAt = reaction.at;
          }
        }
        const said = chatBubbles.get(p.actor);
        if (said && Date.now() < said.until && said.at >= startedAt)
          text = said.text;
        if (p.id.startsWith('friend-')) {
          const talk = npcTalk.get(p.actor);
          if (talk && Date.now() < talk.until) text = talk.text;
          else if (talk) npcTalk.delete(p.actor);
        }
        if (text !== figure.bubbleText) {
          figure.bubbleText = text;
          figure.bubble.textContent = text;
          figure.bubble.hidden = !text;
        }
      }
      // Fishing bobber follows the overlay's phase (cast from where I stand).
      const fishing = current.fishing ?? null;
      const fishKey = fishing ? fishing.spot + ':' + fishing.phase : '';
      if (fishKey !== lastFishKey) {
        if (!fishing) world.season.setFishing(null);
        else {
          if (!lastFishKey) fishFrom = { ...position };
          world.season.setFishing({
            phase:
              fishing.phase === 'bite'
                ? 'bite'
                : fishing.phase === 'result'
                  ? 'caught'
                  : 'wait',
            from: fishFrom,
            to: bobberPoint(fishing.spot, fishFrom),
          });
        }
        lastFishKey = fishKey;
        host.dataset.fishing = fishing?.phase ?? '';
        needsRender = true;
      }
      if (world.season.tick(now, dt, target)) needsRender = true;
      const shouldRender =
        needsRender ||
        anyWalking ||
        cameraMoving ||
        !!press ||
        !!pinch ||
        // Idle frames only move the river ripple; a slower tick saves battery.
        now - lastRender > 250;
      if (shouldRender) {
        // Gentle stream: the ripple texture drifts downstream.
        for (const texture of world.world.water)
          texture.offset.x = (now / 1000) * -0.05;
        renderer.render(scene, camera);
        lastRender = now;
        needsRender = false;
        // Labels are projected on every rendered frame so they never lag.
        const mode = zoom < 1.5 ? 'overview' : 'walk';
        if (mode !== labelMode) {
          labelMode = mode;
          labels.dataset.mode = mode;
          labelsMeasured = -1e9;
        }
        if (now - labelsMeasured > 1500) {
          labelsMeasured = now;
          measureLabels();
        }
        const calm = now - cameraCalmSince > 160;
        const door = nearbyId.current,
          heading = requestedPlace.current?.id ?? null;
        if (mode === 'walk') {
          // Nearest building within reach, with a little hand-off margin.
          let best: PlaceLabel | null = null,
            bestDistance = LABEL_NEAR;
          for (const label of placeLabels) {
            const d = footprintDistance(label);
            if (d < bestDistance) {
              best = label;
              bestDistance = d;
            }
          }
          const held = placeLabels.find((label) => label.id === labelNearest);
          if (
            held &&
            best !== held &&
            footprintDistance(held) < LABEL_NEAR + LABEL_HANDOFF &&
            footprintDistance(held) < bestDistance + LABEL_HANDOFF
          )
            best = held;
          // At a door that building is the one worth naming.
          labelNearest = door ?? best?.id ?? null;
        }
        const bottomLimit = height - (width < 600 ? 150 : 90),
          // The zoom / locate column sits on the right edge.
          rightLimit = width - (width < 600 ? 60 : 74);
        const mine = `home-${current.save.actor}`;
        const rank = (label: PlaceLabel) =>
          label.id === door
            ? 0
            : label.id === heading
              ? 1
              : label.id === labelNearest
                ? 2
                : label.id === mine
                  ? 3
                  : label.id.startsWith('home-')
                    ? 6
                    : label.id === 'farm'
                      ? 5
                      : 4;
        // Chips never overlap each other or my own name tag: higher-priority
        // ones win, the rest wait (hidden) until there is room.
        // On the whole-village map chips sit centred on their anchor and may
        // touch; while walking they sit above the roof, clear of my name tag.
        const overview = mode === 'overview';
        const selfAt = project(position.x, FIGURE_HEIGHT * 0.98, position.z);
        const taken = overview
          ? [...hud]
          : [...hud, { l: selfAt.x - 34, r: selfAt.x + 34, t: selfAt.y - 28, b: selfAt.y }];
        const order = [...placeLabels].sort((a, b) => rank(a) - rank(b));
        for (const label of order) {
          const element = label.element;
          if (!element) continue;
          const at = project(label.ax, label.ay, label.az);
          const inView =
            at.inFront &&
            at.x > -20 &&
            at.x < width + 20 &&
            at.y > topLimit &&
            at.y < height + 10;
          let want =
            inView &&
            (label.id === door ||
              (calm &&
                ((mode === 'overview' && label.id !== 'farm') ||
                  label.id === heading ||
                  label.id === labelNearest)));
          // Keep the whole chip inside the scene (below the header card).
          const halfW = label.w / 2 + 6;
          let x = Math.min(Math.max(at.x, halfW), Math.max(halfW, rightLimit - halfW));
          const baseY = Math.min(
            Math.max(at.y, topLimit + label.h + 6),
            Math.max(topLimit + label.h + 6, bottomLimit),
          );
          let y = baseY;
          if (want) {
            // On the map a crowded chip may shift a little to make room.
            const pad = overview ? -3 : 3,
              v = label.h * 0.75,
              u = label.w * 0.6,
              shifts: [number, number][] = overview
                ? [[0, 0], [0, -v], [0, v], [u, 0], [-u, 0]]
                : [[0, 0]];
            let placed = false;
            for (const [dx, shift] of shifts) {
              const top = (overview ? baseY - label.h / 2 : baseY - label.h) + shift;
              const box = {
                l: x + dx - label.w / 2 - pad,
                r: x + dx + label.w / 2 + pad,
                t: top - pad,
                b: top + label.h + pad,
              };
              const hits = (o: { l: number; r: number; t: number; b: number }) =>
                o.l < box.r && box.l < o.r && o.t < box.b && box.t < o.b;
              // The door's own chip may touch other chips, never the controls.
              if (label.id === door ? !hud.some(hits) : !taken.some(hits)) {
                taken.push(box);
                x += dx;
                y = baseY + shift;
                placed = true;
                break;
              }
            }
            want = placed;
          }
          if (want !== label.shown) {
            label.shown = want;
            element.dataset.show = String(want);
          }
          element.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,${overview ? -50 : -100}%)`;
        }
        const headY = FIGURE_HEIGHT * 0.98;
        if (selfTag) {
          const at = project(position.x, headY, position.z);
          selfTag.style.transform = `translate(${at.x}px,${at.y}px) translate(-50%,-100%)`;
        }
        for (const [id, figure] of figures) {
          const own = id === current.self;
          const at = project(
            figure.point.x,
            figure.group.position.y + headY,
            figure.point.z,
          );
          const show =
            at.inFront && at.x > -40 && at.x < width + 40 && at.y > -20 && at.y < height + 20;
          if (figure.tag) {
            figure.tag.style.transform = `translate(${at.x}px,${at.y}px) translate(-50%,-100%)`;
            figure.tag.style.visibility = show ? 'visible' : 'hidden';
          }
          if (!figure.bubble.hidden)
            figure.bubble.style.transform = `translate(${at.x}px,${at.y - (own ? 30 : 26)}px) translate(-50%,-100%)`;
        }
      }
      if (now - lastData > 300) {
        miniSelfRef.current?.setAttribute('cx', String(position.x));
        miniSelfRef.current?.setAttribute('cy', String(position.z));
        if (routeRef.current)
          routeRef.current.textContent = path.length
            ? '길을 따라 이동 중 · 방향키로 직접 걷기'
            : '도착했어요 · 주변을 자유롭게 둘러보세요';
        Object.assign(host.dataset, {
          follow: String(follow),
          actorPixels: (
            (VILLAGE_ACTOR_HEIGHT * zoom * height) /
            (camera.top - camera.bottom)
          ).toFixed(1),
          avatarX: position.x.toFixed(3),
          avatarZ: position.z.toFixed(3),
          walking: String(walking),
          motion: playerMotion.motion,
          facing: String(locomotion.facing),
          zoom: zoom.toFixed(2),
          targetX: target.x.toFixed(3),
          targetZ: target.z.toFixed(3),
          overview: String(zoom < 1.5),
          labelNearest: labelNearest ?? '',
          labelsShown: placeLabels.filter((l) => l.shown).map((l) => l.id).join(','),
          residents: String(residents.length),
          drawCalls: String(renderer.info.render.calls),
        });
        lastData = now;
      }
    };
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      loungeAudio.setScene({ village: false });
      cancelAnimationFrame(frame);
      controls.current = null;
      activeDirections.clear();
      observer.disconnect();
      visibility.disconnect();
      world.listeners.delete(syncLoaded);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', drag);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', lostCapture);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('webglcontextlost', loss);
      canvas.removeEventListener('webglcontextrestored', restored);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keydown', keyrun);
      host.removeEventListener('focusout', blur);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibilityChanged);
      for (const [id, figure] of figures) removeFigure(id, figure);
      scene.remove(world.root);
      disposeObject(marker);
      canvas.remove();
      // The renderer and the built world are kept for a fast return; a lost
      // context is discarded so the next visit (or retry) starts cleanly.
      if (contextLost || renderer.getContext().isContextLost()) {
        renderer.dispose();
        if (sharedRenderer === renderer) sharedRenderer = null;
      } else renderer.renderLists.dispose();
    };
  }, [attempt]);

  const retry = () => {
    if (sharedRenderer?.getContext().isContextLost()) {
      sharedRenderer.dispose();
      sharedRenderer = null;
    }
    setState('loading');
    setAttempt((value) => value + 1);
  };

  const minimapRoads = VILLAGE_PATHS.map(([x1, z1, x2, z2, w]) => (
    <line
      key={`${x1},${z1},${x2},${z2}`}
      x1={x1}
      y1={z1}
      x2={x2}
      y2={z2}
      stroke="#f7efd1"
      strokeWidth={Math.max(0.9, w * 0.8)}
      strokeLinecap="round"
    />
  ));

  return (
    <section className="hv-village" aria-label="범타듀 밸리 마을">
      <div className="hv-heading">
        <div>
          <span className="hv-eyebrow">
            <Trees size={15} /> 우리들의 마을
          </span>
          <h1>범타듀 밸리</h1>
          <p>일곱 친구의 골목에서 숲과 강 너머까지.</p>
        </div>
        <span className="hv-weather" data-phase={phase}>
          {phase === 'night' ? (
            <Moon size={20} />
          ) : phase === 'morning' ? (
            <Sunrise size={20} />
          ) : phase === 'evening' ? (
            <Sunset size={20} />
          ) : (
            <Sun size={20} />
          )}
          <span>
            {props.dayNight === false ? '산책하기 좋은 날' : DAY_PHASE_LABEL[phase]}
            <small>우리들의 범타듀 밸리</small>
          </span>
        </span>
      </div>
      <div className="hv-frame">
        <div
          ref={hostRef}
          className="hv-scene"
          role="application"
          tabIndex={0}
          aria-label="범타듀 밸리. 바닥을 눌러 걷기, 방향키와 WASD로 이동, Shift 또는 달리기 버튼으로 달리기, 드래그로 지도 둘러보기"
          data-testid="village-3d"
          data-load-state={state}
          data-nearby-place=""
          data-entry-ready="false"
          data-destination=""
        >
          <div ref={labelsRef} className="hv-labels">
            {VILLAGE_PLACES.map((place) => (
              <button
                key={place.id}
                type="button"
                data-place={place.id}
                data-owned={String(place.actor === props.save.actor)}
                className={`hv-place hv-place-${place.kind}${selected?.id === place.id ? ' is-selected' : ''}`}
                onClick={() => select(place)}
                aria-label={`${place.name} 둘러보기`}
                data-show="false"
              >
                <PlaceIcon place={place} />
                <span className="hv-place-full">{place.name}</span>
                <span className="hv-place-short">{placeShortName(place)}</span>
                {place.actor === props.save.actor && <small>내 집</small>}
              </button>
            ))}
            {farmBed(props.save.actor) && (
              <button
                type="button"
                className="hv-place hv-farm-label"
                data-farm-label="mine"
                onClick={() => {
                  const bed = farmBed(props.save.actor);
                  if (bed) controls.current?.visit(farmFront(bed));
                }}
                aria-label={`${ACTORS[props.save.actor]}의 텃밭으로 걸어가기`}
                data-show="false"
              >
                <Sprout size={12} aria-hidden="true" />
                <span className="hv-place-full">{ACTORS[props.save.actor]}의 텃밭</span>
                <span className="hv-place-short">텃밭</span>
                {readyCount > 0 && <small>수확 {readyCount}</small>}
              </button>
            )}
            <span className="hv-self" data-self-label>
              {ACTORS[props.save.actor]}
              <small>나</small>
            </span>
          </div>
          {state === 'loading' && (
            <output className="hv-loading" aria-live="polite" aria-busy="true">
              <span className="l-spinner" />
              마을에 햇살을 들이는 중…
            </output>
          )}
          {(state === 'unavailable' || state === 'lost') && (
            <section
              className="hv-fallback"
              aria-live="polite"
              aria-labelledby="hv-fallback-title"
            >
              <Trees size={32} />
              <h2 id="hv-fallback-title">마을 안내소</h2>
              <p>
                {state === 'lost'
                  ? '입체 화면 연결이 잠시 끊겼어요. 다시 시도하면 마을로 돌아가요.'
                  : '이 브라우저에서 입체 그래픽(WebGL)을 켜지 못했어요.'}
                <br />
                아래에서 원하는 장소로 바로 들어갈 수도 있어요.
              </p>
              <button type="button" className="hv-retry" onClick={retry}>
                <RotateCcw size={16} /> 다시 시도
              </button>
              <div>
                {VILLAGE_PLACES.filter((place) =>
                  villageCanEnterPlace(place, props.save.actor),
                ).map((place) => (
                  <button
                    key={place.id}
                    onClick={() => props.onEnter(place.destination, place)}
                  >
                    {place.name}
                    <DoorOpen size={16} />
                  </button>
                ))}
              </div>
              <VillageLifeList
                actor={props.save.actor}
                life={props.life}
                clockOffset={props.clockOffset}
                onFarm={props.onFarm}
                onShop={props.onShop}
                onMail={props.onMail}
                onPick={props.onPick}
                onVisit={props.onVisit}
                online={props.players
                  .filter((p) => !p.id.startsWith('friend-'))
                  .map((p) => p.actor)}
              />
            </section>
          )}
        </div>
        <div className="hv-top-tools">
          <button
            onClick={() => setDirectory(!directory)}
            aria-expanded={directory}
          >
            <MapIcon size={17} />
            마을 안내
          </button>
        </div>
        <div
          className={`hv-minimap${miniOpen ? ' is-open' : ''}`}
          data-testid="minimap"
        >
          <button
            type="button"
            className="hv-minimap-toggle"
            data-testid="minimap-toggle"
            aria-expanded={miniOpen}
            aria-controls="hv-minimap-body"
            onClick={() => setMiniOpen(!miniOpen)}
            aria-label={miniOpen ? '미니맵 접기' : '미니맵 펼치기'}
          >
            <Compass size={17} aria-hidden="true" />
            <span>지도</span>
            {miniOpen && <X size={14} aria-hidden="true" />}
          </button>
          {miniOpen && (
            <div id="hv-minimap-body" className="hv-minimap-body">
              <div className="hv-minimap-map">
                <button
                  type="button"
                  className="hv-minimap-overview"
                  onClick={() => controls.current?.overview()}
                  aria-label="미니맵으로 전체 보기"
                >
                  <svg
                    viewBox={[
                      MINI_BOX.x,
                      MINI_BOX.y,
                      MINI_BOX.w,
                      MINI_BOX.h,
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    <rect
                      x={-VILLAGE_BOUNDS.width / 2}
                      y={-VILLAGE_BOUNDS.depth / 2}
                      width={VILLAGE_BOUNDS.width}
                      height={VILLAGE_BOUNDS.depth}
                      rx="3"
                      fill="#dce3ba"
                    />
                    {minimapRoads}
                    <rect
                      x={-VILLAGE_BOUNDS.width / 2}
                      y={VILLAGE_RIVER.minZ}
                      width={VILLAGE_BOUNDS.width}
                      height={VILLAGE_RIVER.maxZ - VILLAGE_RIVER.minZ}
                      fill="#96c9c2"
                    />
                    <circle cx={VILLAGE_POND.x} cy={VILLAGE_POND.z} r={VILLAGE_POND.radius} fill="#96c9c2" />
                    {[VILLAGE_MUSEUM, VILLAGE_BOARD].map((b) => (
                      <rect
                        key={b.id}
                        x={b.x - b.width / 2}
                        y={b.z - b.depth / 2 - (b.id === 'board' ? 0.3 : 0)}
                        width={b.width}
                        height={Math.max(0.8, b.depth)}
                        rx="0.3"
                        fill={b.id === 'museum' ? '#6f8fa3' : '#c9a06a'}
                      />
                    ))}
                    {VILLAGE_RIVER.bridges.map((b) => (
                      <rect
                        key={b.x}
                        x={b.x - b.halfWidth}
                        y={VILLAGE_RIVER.minZ - 0.4}
                        width={b.halfWidth * 2}
                        height={VILLAGE_RIVER.maxZ - VILLAGE_RIVER.minZ + 0.8}
                        fill="#b58d58"
                      />
                    ))}
                    {VILLAGE_PLACES.map((p) => (
                      <rect
                        key={p.id}
                        x={p.x - p.width / 2}
                        y={p.z - p.depth / 2}
                        width={p.width}
                        height={p.depth}
                        rx="0.6"
                        fill={p.roofColor}
                        stroke={p.id === nearestPlace ? '#fff7d6' : 'none'}
                        strokeWidth="0.9"
                      />
                    ))}
                    <rect
                      x={VILLAGE_MARKET.x - VILLAGE_MARKET.width / 2}
                      y={VILLAGE_MARKET.z - VILLAGE_MARKET.depth / 2}
                      width={VILLAGE_MARKET.width}
                      height={VILLAGE_MARKET.depth}
                      rx="0.4"
                      fill="#e56b5d"
                    />
                    {VILLAGE_DISTRICTS.map((d) => (
                      <circle
                        key={d.id}
                        cx={d.point.x}
                        cy={d.point.z}
                        r="1.6"
                        fill={d.color}
                      />
                    ))}
                    <circle
                      ref={miniSelfRef}
                      cx={VILLAGE_START.x}
                      cy={VILLAGE_START.z}
                      r="2"
                      fill="#fff6dd"
                      stroke="#536642"
                      strokeWidth="1"
                    />
                  </svg>
                </button>
                {VILLAGE_PLACES.map((p) => {
                  const named =
                    p.kind !== 'home' ||
                    p.actor === props.save.actor ||
                    p.id === nearestPlace ||
                    p.id === selected?.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className="hv-minimap-place"
                      data-minimap-place={p.id}
                      data-named={String(named)}
                      data-nearest={String(p.id === nearestPlace)}
                      style={{
                        left: `${((p.x - MINI_BOX.x) / MINI_BOX.w) * 100}%`,
                        top: `${((p.z - MINI_BOX.y) / MINI_BOX.h) * 100}%`,
                      }}
                      onClick={() => {
                        select(p);
                        // On a phone the open map would hide the walk; fold it.
                        if (window.matchMedia?.('(max-width: 600px)').matches)
                          setMiniOpen(false);
                      }}
                      aria-label={`${p.name}${p.id === nearestPlace ? ' (가장 가까운 곳)' : ''} 걸어가기`}
                    >
                      <span aria-hidden="true">
                        {p.actor === props.save.actor ? '내 집' : placeShortName(p)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <small className="hv-minimap-note">
                {nearestPlace
                  ? `가까운 곳 · ${VILLAGE_PLACES.find((p) => p.id === nearestPlace)?.name ?? ''}`
                  : '건물을 누르면 걸어가요'}
              </small>
            </div>
          )}
        </div>
        {directory && (
          <aside className="hv-directory" aria-label="마을 장소">
            <header>
              <strong>어디로 가볼까요?</strong>
              <button
                onClick={() => setDirectory(false)}
                aria-label="마을 안내 닫기"
              >
                <X size={17} />
              </button>
            </header>
            <span className="hv-directory-sub">범타듀의 하루</span>
            {farmBed(props.save.actor) && (
              <button
                data-district="farm"
                onClick={() => {
                  const bed = farmBed(props.save.actor);
                  setSelected(null);
                  setDirectory(false);
                  setDistrict(`${ACTORS[props.save.actor]}의 텃밭`);
                  if (bed) controls.current?.visit(farmFront(bed));
                }}
              >
                <span className="hv-place-dot" style={{ background: '#8a6242' }} />
                <span>
                  <strong>{ACTORS[props.save.actor]}의 텃밭</strong>
                  <small>
                    내 집 앞 {props.life?.me.farm.length ?? 6}칸 · {readyCount ? `수확할 작물 ${readyCount}개` : '씨앗 심기 · 물 주기'}
                  </small>
                </span>
                <ArrowRight size={15} />
              </button>
            )}
            <button
              data-district="orchard"
              onClick={() => {
                setSelected(null);
                setDirectory(false);
                setDistrict('과일나무');
                const ripe = FRUIT_TREES.find(
                  (t) => (props.life?.me.fruitReadyAt?.[t] ?? 0) <= lifeClock,
                );
                const p = FRUIT_TREE_POINTS[ripe ?? FRUIT_TREES[0]];
                if (p) controls.current?.visit({ x: p.x + 1.2, z: p.z + 1.4 });
              }}
            >
              <span className="hv-place-dot" style={{ background: '#e04a3a' }} />
              <span>
                <strong>과일나무</strong>
                <small>
                  {ripeTrees ? `지금 딸 수 있는 나무 ${ripeTrees}그루` : '6시간마다 다시 익어요'}
                </small>
              </span>
              <ArrowRight size={15} />
            </button>
            {(
              [
                ['river', '강가 낚시터', '강을 따라 어디서나 낚시해요', '#5aa0b8', RIVER_BANK],
                ['pond', '연못 낚시터', '서쪽 들판의 조용한 연못', '#79c3c8', POND_EDGE],
                [
                  'sea',
                  '동쪽 바다 데크',
                  props.life?.flags?.includes('bridge') ? '바다 물고기를 낚아요' : '데크 수리가 필요해요',
                  '#3f7fa0',
                  { x: PIER_POINT.x - 0.8, z: PIER_POINT.z },
                ],
                ['museum', '마을 박물관', '기증하고 이름을 남겨요', '#6f8fa3', MUSEUM_FRONT],
                ['board', '마을 게시판', '함께 채우는 꾸러미', '#c9a06a', BOARD_FRONT],
              ] as const
            ).map(([id, name, sub, color, point]) => (
              <button
                key={id}
                data-district={id}
                onClick={() => {
                  setSelected(null);
                  setDirectory(false);
                  setDistrict(name);
                  controls.current?.visit(point);
                }}
              >
                <span className="hv-place-dot" style={{ background: color }} />
                <span>
                  <strong>{name}</strong>
                  <small>{sub}</small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
            {(props.life?.me.spawns ?? []).some((sp) => !sp.taken) && (
              <button
                data-district="spawns"
                onClick={() => {
                  setSelected(null);
                  setDirectory(false);
                  setDistrict('오늘의 채집');
                  const open = (props.life?.me.spawns ?? []).find((sp) => !sp.taken);
                  const p = open ? SPAWN_POINTS[open.spot] : null;
                  if (p) controls.current?.visit(p);
                }}
              >
                <span className="hv-place-dot" style={{ background: '#6aa84f' }} />
                <span>
                  <strong>오늘의 채집 · 곤충</strong>
                  <small>
                    남은 곳 {(props.life?.me.spawns ?? []).filter((sp) => !sp.taken).length}군데 · 가까운 곳으로
                  </small>
                </span>
                <ArrowRight size={15} />
              </button>
            )}
            <span className="hv-directory-sub">함께 노는 곳</span>
            {VILLAGE_PLACES.filter((p) => p.kind !== 'home').map((p) => (
              <button key={p.id} onClick={() => select(p)}>
                <span
                  className="hv-place-dot"
                  style={{ background: p.roofColor }}
                />
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.subtitle}</small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
            <button
              data-district="market"
              onClick={() => {
                setSelected(null);
                setDirectory(false);
                setDistrict(VILLAGE_MARKET.name);
                controls.current?.visit({
                  x: VILLAGE_MARKET.x,
                  z: VILLAGE_MARKET.z + VILLAGE_MARKET.depth / 2 + 0.8,
                });
              }}
            >
              <span className="hv-place-dot" style={{ background: '#e56b5d' }} />
              <span>
                <strong>{VILLAGE_MARKET.name}</strong>
                <small>씨앗 · 희귀 소품 · 수확물 팔기</small>
              </span>
              <ArrowRight size={15} />
            </button>
            <span className="hv-directory-sub">강 너머, 숲 가까이</span>
            {VILLAGE_DISTRICTS.map((d) => (
              <button
                key={d.id}
                data-district={d.id}
                onClick={() => {
                  setSelected(null);
                  setDirectory(false);
                  setDistrict(d.name);
                  controls.current?.visit(d.point);
                }}
              >
                <span
                  className="hv-place-dot"
                  style={{ background: d.color }}
                />
                <span>
                  <strong>{d.name}</strong>
                  <small>{d.description}</small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
            <span className="hv-directory-sub">친구들의 골목</span>
            <div className="hv-home-list">
              {VILLAGE_PLACES.filter((p) => p.kind === 'home').map((p) => (
                <button key={p.id} onClick={() => select(p)}>
                  <House size={14} />
                  {ACTORS[p.actor!]}
                  {p.actor === props.save.actor && <small>나</small>}
                </button>
              ))}
            </div>
          </aside>
        )}
        <div className="hv-camera" aria-label="마을 화면 조절">
          <button
            onClick={() => controls.current?.zoom(0.45)}
            aria-label="마을 확대"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => controls.current?.zoom(-0.45)}
            aria-label="마을 축소"
          >
            <Minus size={18} />
          </button>
          <span />
          <button
            onClick={() => controls.current?.home()}
            aria-label="내 위치 보기"
          >
            <LocateFixed size={18} />
          </button>
          <button
            onClick={() => controls.current?.overview()}
            aria-label="마을 전체 보기"
          >
            <MapIcon size={18} />
          </button>
        </div>
        {state !== 'unavailable' && state !== 'lost' && (
          <div className="hv-pad" aria-label="마을 걷기와 달리기">
            <button
              type="button"
              className="hv-pad-run"
              aria-label="달리기 전환"
              aria-pressed={runPressed}
              onClick={() => {
                runToggle.current = !runToggle.current;
                setRunPressed(runToggle.current || shiftHeld.current);
              }}
            >
              <Footprints size={15} /> {runPressed ? '달리기 켬' : '달리기'}
            </button>
            {DIRECTIONS.map(([direction, Icon, label]) => (
              <button
                key={direction}
                className={`hv-pad-${direction}`}
                aria-label={label}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  directions.current.add(direction);
                }}
                onPointerUp={() => directions.current.delete(direction)}
                onPointerCancel={() => directions.current.delete(direction)}
                onLostPointerCapture={() =>
                  directions.current.delete(direction)
                }
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    directions.current.add(direction);
                  }
                }}
                onKeyUp={() => directions.current.delete(direction)}
                onBlur={() => directions.current.delete(direction)}
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        )}
        {district && !nearby && !action && (
          <section className="hv-route" aria-label="산책 목적지">
            <Trees size={18} />
            <div>
              <strong>{district}</strong>
              <output ref={routeRef}>길을 따라 이동 중</output>
            </div>
            <button
              aria-label="산책 경로 닫기"
              onClick={() => {
                controls.current?.stop();
                setDistrict(null);
              }}
            >
              <X size={16} />
            </button>
          </section>
        )}
        {(action || nearby) && state !== 'unavailable' && state !== 'lost' && (
          <section
            className={
              'hv-entry-prompt' +
              (action?.target.type === 'spot' ? ' hv-spot-prompt' : '')
            }
            aria-live="polite"
            data-testid={
              action?.target.type === 'spot'
                ? 'village-spot-prompt'
                : 'village-entry-prompt'
            }
            data-place={doorPlace?.id}
            data-spot={
              action?.target.type === 'spot' ? action.target.spot.kind : undefined
            }
            data-entry-ready={doorPlace ? String(!!nearby?.canEnter) : undefined}
          >
            {action?.target.type === 'spot' ? (
              <SpotPrompt
                spot={action.target.spot}
                life={props.life ?? null}
                clockOffset={props.clockOffset ?? 0}
                touch={touch}
                actor={props.save.actor}
              />
            ) : doorPlace ? (
              <div>
                <strong>
                  {doorPlace.name}
                  {doorCount !== undefined && (
                    <span className="hv-inside" data-testid="door-count">
                      {' · '}
                      {doorCount > 0 ? `안에 ${doorCount}명` : '안에 아무도 없어요'}
                    </span>
                  )}
                </strong>
                <small>
                  {action
                    ? doorPlace.kind === 'home' &&
                      doorPlace.actor !== props.save.actor
                      ? `놀러 가서 방명록을 남겨요${touch ? '' : ' · E'}`
                      : touch
                        ? '오른쪽 아래 버튼으로 들어가요'
                        : 'E 또는 오른쪽 아래 버튼으로 들어가요'
                    : '주민의 집이에요. 집 앞에서 인사해요.'}
                </small>
              </div>
            ) : null}
          </section>
        )}
        {state !== 'unavailable' && state !== 'lost' && (
          <ActionButton
            className="hv-action"
            kind={action?.kind ?? null}
            label={action?.label}
            detail={actionDetail}
            touch={touch}
            disabled={actionDisabled || !!action?.disabled}
            onPress={() => {
              if (action) controls.current?.act(action);
            }}
          />
        )}
        {selected && !nearby && !action && (
          <section className="hv-place-card" aria-label="선택한 장소">
            <div
              className="hv-place-monogram"
              style={{ background: selected.color }}
            >
              {selected.kind === 'home' ? (
                <House size={25} />
              ) : (
                <DoorOpen size={25} />
              )}
            </div>
            <div>
              <small>
                {selected.kind === 'home'
                  ? '친구들의 골목'
                  : '광장 옆 작은 아지트'}
              </small>
              <h2>{selected.name}</h2>
              <p>{selected.subtitle}</p>
            </div>
            <button
              className="hv-enter"
              onClick={() => {
                if (!villageCanEnterPlace(selected, props.save.actor)) {
                  controls.current?.go(selected);
                } else controls.current?.enter(selected);
              }}
            >
              {!villageCanEnterPlace(selected, props.save.actor)
                ? '집 앞에서 만나기'
                : '걸어서 들어가기'}
              <ArrowRight size={16} />
            </button>
            <button
              className="hv-card-close"
              aria-label="장소 안내 닫기"
              onClick={() => setSelected(null)}
            >
              <X size={16} />
            </button>
          </section>
        )}
        <div className="hv-map-caption" aria-hidden="true">
          <span>범타듀</span>
          <small>작은 집들이 모여, 우리의 동네</small>
        </div>
      </div>
      <div className="hv-bottom">
        <span>
          <Footprints size={15} />
          바닥을 눌러 걷기 <i>·</i> 드래그로 둘러보기
          {!touch && (
            <>
              {' '}
              <i>·</i> 방향키 / WASD
            </>
          )}
        </span>
        <button onClick={props.onRequest}>
          <Send size={14} />
          함께할 게임 초대
        </button>
      </div>
      {state === 'partial' && (
        <output
          className="hv-partial"
          aria-live="polite"
          style={{ display: 'block' }}
        >
          일부 마을 소품을 불러오지 못했어요. 마을 산책과 건물 입장은 이용할 수
          있어요.
        </output>
      )}
      <p className="hv-credit">
        주택·과일나무·수국·소파·튤립 원본 모델:{' '}
        <a
          href="https://karchive.vibeline.co.kr/models"
          target="_blank"
          rel="noreferrer"
        >
          kArchive
        </a>{' '}
        · 출처: 쓰레드 dogfooter. 테라스 가구: 3DAssets.dev (CC0).
      </p>
    </section>
  );
}

function remaining(ms: number) {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}시간 ${minutes % 60 ? (minutes % 60) + '분' : ''}`.trim()
    : `${minutes}분`;
}

/** What the action button will do here (farm, market, trees, mailbox, friends). */
function SpotPrompt({
  spot,
  life,
  clockOffset,
  touch,
  actor,
}: {
  spot: VillageSpot;
  life: LifeView | null;
  clockOffset: number;
  touch: boolean;
  actor: number;
}) {
  // Server clock that also wakes exactly when a crop or this tree is ready.
  const clock = useServerClock(
    clockOffset,
    spot.kind === 'farm'
      ? (life?.me.farm.map((p) => p.readyAt) ?? [])
      : spot.kind === 'tree'
        ? [life?.me.fruitReadyAt?.[spot.id] ?? spot.readyAt]
        : [],
  );
  const key = touch ? '' : ' · E';
  if (spot.kind === 'farm') {
    const farm = life?.me.farm ?? [];
    const ready = farm.filter((p) => p.crop && (p.readyAt ?? Infinity) <= clock).length;
    const empty = farm.filter((p) => !p.crop).length;
    const thirsty = farm.filter(
      (p) => p.crop && p.wateredAt === null && !p.rained && (p.readyAt ?? Infinity) > clock,
    ).length;
    return (
      <div>
        <strong>
          <Sprout size={14} /> {ACTORS[actor]}의 텃밭
        </strong>
        <small>
          {!life
            ? '마을에 연결되면 돌볼 수 있어요'
            : ready
              ? `수확할 작물 ${ready}개${key}`
              : empty
                ? `빈 밭 ${empty}칸${key}`
                : thirsty
                  ? `물 줄 작물 ${thirsty}칸${key}`
                  : '물을 다 줬어요 · 쑥쑥 자라는 중'}
        </small>
      </div>
    );
  }
  if (spot.kind === 'commons')
    return (
      <div>
        <strong>
          <Sprout size={14} /> 마을 공동 밭
        </strong>
        <small>함께 가꾸는 밭이에요 · 내 텃밭은 {ACTORS[actor]}의 집 앞에 있어요</small>
      </div>
    );
  if (spot.kind === 'market')
    return (
      <div>
        <strong>
          <Store size={14} /> 범타듀 상점
        </strong>
        <small>씨앗 · 희귀 소품 · 머리색 팔레트{key}</small>
      </div>
    );
  if (spot.kind === 'mailbox') {
    const unread = life?.me.mailUnread ?? 0;
    return (
      <div>
        <strong>
          <Mail size={14} /> {ACTORS[actor]}의 우편함
        </strong>
        <small>
          {unread ? `읽지 않은 편지 ${unread}통` : '새 편지가 없어요'}
          {key}
        </small>
      </div>
    );
  }
  if (spot.kind === 'tree') {
    const readyAt = life?.me.fruitReadyAt?.[spot.id] ?? spot.readyAt;
    const ready = !readyAt || readyAt <= clock;
    const index = Object.keys(FRUIT_TREE_POINTS).indexOf(spot.id) + 1;
    return (
      <div>
        <strong>
          <Apple size={14} /> {index}번 과일나무
        </strong>
        <small>
          {!life
            ? '마을에 연결되면 딸 수 있어요'
            : ready
              ? `잘 익은 과일이 달렸어요${key}`
              : `${remaining(readyAt - clock)} 뒤에 다시 익어요`}
        </small>
      </div>
    );
  }
  if (spot.kind === 'fish') {
    const locked = spot.spot === 'sea' && !life?.flags?.includes('bridge');
    return (
      <div>
        <strong>
          <FishingRod size={14} /> {spot.spot === 'river' ? '강가 낚시터' : spot.spot === 'pond' ? '연못 낚시터' : '동쪽 바다 데크'}
        </strong>
        <small>
          {locked
            ? '데크가 부서져 있어요 · 마을 게시판의 봄나물 꾸러미로 고칠 수 있어요'
            : `찌가 쏙 들어가면 당겨요 · 미끼 ${life?.me.fishing?.bait ?? 0}개${key}`}
        </small>
      </div>
    );
  }
  if (spot.kind === 'spawn') {
    const Icon = spot.mode === 'bug' ? Bug : Leaf;
    return (
      <div>
        <strong>
          <Icon size={14} /> {itemName(spot.item)}
        </strong>
        <small>
          {spot.mode === 'bug' ? '살금살금 다가가서 잡아요' : '오늘 여기서 주울 수 있어요'}
          {key}
        </small>
      </div>
    );
  }
  if (spot.kind === 'museum')
    return (
      <div>
        <strong>
          <Landmark size={14} /> 마을 박물관
        </strong>
        <small>
          처음 기증하면 이름이 남아요 · 기증 {Object.keys(life?.museum ?? {}).length}종{key}
        </small>
      </div>
    );
  if (spot.kind === 'board') {
    const done = (life?.bundles ?? []).filter((b) => b.done).length;
    return (
      <div>
        <strong>
          <ClipboardList size={14} /> 마을 게시판
        </strong>
        <small>
          함께 채우는 꾸러미 · {done}/{life?.bundles?.length ?? 8} 완성{key}
        </small>
      </div>
    );
  }
  if (spot.kind === 'friendFarm') {
    const done = !!life?.me.waterFriend?.includes(spot.actor);
    return (
      <div>
        <strong>
          <Droplets size={14} /> {ACTORS[spot.actor]}의 텃밭
        </strong>
        <small>{done ? '오늘은 이미 물을 줬어요 · 내일 또 도와줘요' : `친구 밭에 물 주기 · 하루 한 번 추억이 쌓여요${key}`}</small>
      </div>
    );
  }
  if (spot.kind === 'fountain')
    return (
      <div>
        <strong>
          <Sparkles size={14} /> 광장 분수
        </strong>
        <small>하루 한 번 소원을 빌 수 있어요{key}</small>
      </div>
    );
  return (
    <div>
      <strong>
        <MessageCircle size={14} /> {ACTORS[spot.actor]}
      </strong>
      <small>
        {life?.me.requests?.some((r) => r.from === spot.actor && !r.done) ? '부탁이 있는 것 같아요' : '산책 중이에요'}
        {key}
      </small>
    </div>
  );
}
