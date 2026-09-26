'use client';

// This application surface must receive keyboard focus for directional walking.
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Footprints,
  LoaderCircle,
  Lock,
  Palette,
  RotateCcw,
  Sun,
} from 'lucide-react';
import * as THREE from 'three';
import { loungeSprites } from './lounge-sprites';
import { HAT_HEADROOM, hatTagHeight, withHatHeadroom } from './lounge-figure-frame';
import {
  BEDROOM_LIMITS,
  ROOM,
  ROOM_DOOR_POINT,
  catalogEntry,
  defaultBedroom,
  readBedroom,
  roomConflicts,
  roomFromNetwork,
  roomToNetwork,
  type Bedroom,
  type RoomAccess,
  type RoomItem,
} from './lounge-bedroom-data';
import { bedroomTheme, BEDROOM_THEMES } from './lounge-bedroom-themes';
import { createBedroomScene, ROOM_CAMERA, type RoomScene } from './lounge-bedroom-scene';
import {
  CONFLICT_TEXT,
  duplicateItem,
  moveFloorItem,
  moveWallItem,
  placeOpen,
  rotateItem,
  scaleItem,
  withItem,
  withoutItem,
} from './lounge-bedroom-edit';
import {
  EditBar,
  EditCatalog,
  EditToolbar,
  ResetRoomDialog,
  RoomSettings,
} from './lounge-bedroom-editor';
import {
  advanceLocomotion,
  RUN_SPEED_MULTIPLIER,
  type LocomotionState,
} from './lounge-locomotion';
import type { Look, LoungeSave } from './lounge-look';
import type { ChatLine, LoungePlayer } from './lounge-room';
import { reactionVisible, reactionInfo } from './lounge-reactions';
import { ACTORS } from './lounge-roster';
import { josa } from './lounge-text';
import {
  ROOM_DOOR_REACH,
  WALK_START,
  besideBed,
  roomItemUsable,
  leavingThroughDoor,
  roomAction,
  besideCookTable,
  findWalkPath,
  nearestWalkable,
  roomObstacles,
  setWalkObstacles,
  walkStep,
  type WalkObstacle,
  type WalkPoint,
} from './lounge-bedroom-navigation';
import { ActionButton } from './lounge/ActionButton';
import type { ActionKind } from './lounge-flow';
import { boundAction, boundDirection, sceneKeyTarget } from './lounge-scene-keys';
import { getSettings, onSettingsChange, qualityProfile, useSettings } from './lounge-settings';
import { keyLabel } from './lounge-keybinds';
import './lounge-bedroom-3d.css';
import './lounge-bedroom-edit-dock.css';

type Direction = 'up' | 'down' | 'left' | 'right';

/** A friend's room opened with '놀러 가기' (walk, chat; no decorating). */
export type BedroomVisit = {
  owner: number;
  ownerLook: Look;
  bedroom: Bedroom | null;
};
/** Everyone in the same room ('home' + owner) as seen from the server. */
export type RoomPresence = {
  players: LoungePlayer[];
  self: string;
  /** Chat lines of this room's scope. */
  chat: ChatLine[];
  /** My position in network coordinates (0..100). */
  onMove: (x: number, y: number) => void;
};
/** Where the owner likes to stand when a friend visits while they are away (as an NPC). */
const HOST_SPOT = { x: 1.5, z: 2.5 } as const;
const HOST_ID = 'host-npc';
const BUBBLE_MS = 6500;
/** Desktop 꾸미기: the room fills the window and the tools sit in a side dock. */
const WIDE_EDIT = '(min-width: 1024px)';
const subscribeWide = (change: () => void) => {
  const query = window.matchMedia?.(WIDE_EDIT);
  query?.addEventListener('change', change);
  return () => query?.removeEventListener('change', change);
};
const wideNow = () => !!window.matchMedia?.(WIDE_EDIT).matches;

type Occupant = { id: string; actor: number; look: Look; npc?: boolean };
type History = { past: Bedroom[]; future: Bedroom[] };
const roomKey = (room: Bedroom) => JSON.stringify(room);
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

export function Bedroom3D({
  save,
  onChange,
  onDecorated,
  onAccess,
  visit,
  presence,
  unlocks = [],
  notice,
  onExit,
  onDress,
  onCook,
  spawn = 'door',
  onNearDoor,
}: {
  save: LoungeSave;
  /** Owner only: saves room edits (꾸미기 모드 is unavailable without it). */
  onChange?: (save: LoungeSave) => void;
  /** Called after each saved edit (visitors refetch the room). */
  onDecorated?: () => void;
  /** Called when the owner changes who may visit. */
  onAccess?: (access: RoomAccess) => void;
  /** Read-only visit: their room and their figure; I walk as myself. */
  visit?: BedroomVisit;
  presence?: RoomPresence;
  unlocks?: readonly string[];
  notice?: (message: string) => void;
  /** Walking out of the door / 나가기 / Esc (my room): back to the village. */
  onExit?: () => void;
  /** 옷 갈아입기 at the wardrobe or mirror (my room). */
  onDress?: () => void;
  /** 요리·만들기 at a table or the hearth (my room). */
  onCook?: () => void;
  /** Where I appear: at the door (walked in) or beside the bed (day start). */
  spawn?: 'door' | 'bed';
  /** I am near the door: preload the village. */
  onNearDoor?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef(new Map<string, HTMLDivElement>());
  const directions = useRef(new Set<Direction>());
  const shiftHeld = useRef(false);
  const roomActor = visit ? visit.owner : save.actor;
  const room = useMemo(
    () =>
      visit
        ? (visit.bedroom ?? defaultBedroom(visit.owner))
        : (save.bedroom ?? defaultBedroom(save.actor)),
    [visit, save.bedroom, save.actor],
  );
  const canEdit = !visit && !!onChange;
  const canEditRef = useRef(canEdit);
  useLayoutEffect(() => {
    canEditRef.current = canEdit;
  });
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RoomItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const [panel, setPanel] = useState<'catalog' | 'settings' | null>(null);
  const wideEdit = useSyncExternalStore(subscribeWide, wideNow, () => false);
  const [resetOpen, setResetOpen] = useState(false);
  const [history, setHistory] = useState<History>({ past: [], future: [] });
  const [announcement, setAnnouncement] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'partial' | 'unavailable'>('loading');
  const [message, setMessage] = useState('방에 햇살을 들이는 중…');
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  /** The last room this component saved itself (not a replacement from elsewhere). */
  const [ownKey, setOwnKey] = useState('');

  // ------------------------------------------------------------ latest values
  const latest = useRef({ save, room, visit, presence, editing, selectedId, draft });
  useLayoutEffect(() => {
    latest.current = { save, room, visit, presence, editing, selectedId, draft };
  });
  const studioRef = useRef<RoomScene | null>(null);
  const positionRef = useRef<WalkPoint>(
    spawn === 'bed' && !visit
      ? besideBed(save.bedroom ?? defaultBedroom(save.actor))
      : { ...WALK_START },
  );
  const [action, setAction] = useState<{ kind: ActionKind; item?: string } | null>(null);
  const [{ keys }] = useSettings();
  const flow = useRef({ onExit, onDress, onNearDoor, onCook });
  useLayoutEffect(() => {
    flow.current = { onExit, onDress, onNearDoor, onCook };
  });
  const exited = useRef(false);
  const runAction = (kind: ActionKind | undefined) => {
    if (kind === 'exit') {
      if (exited.current) return;
      exited.current = true;
      flow.current.onExit?.();
    } else if (kind === 'dress') flow.current.onDress?.();
    else if (kind === 'cook') flow.current.onCook?.();
    else if (kind === 'decorate' && canEditRef.current) {
      setEditing(true);
      hostRef.current?.focus({ preventScroll: true });
    }
  };
  const runActionRef = useRef(runAction);
  useLayoutEffect(() => {
    runActionRef.current = runAction;
  });
  // "혼자 할 수 있는 것 → 방 꾸미기" from the invite window.
  useEffect(() => {
    const decorate = () => runActionRef.current('decorate');
    window.addEventListener('bumtadew:room-decorate', decorate);
    return () => window.removeEventListener('bumtadew:room-decorate', decorate);
  }, []);
  const actionRef = useRef<{ kind: ActionKind; item?: string } | null>(null);
  const historyRef = useRef(history);
  useLayoutEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Everyone in this room: live players, or the owner as an NPC when away.
  const occupants: Occupant[] = useMemo(() => {
    const list: Occupant[] = [];
    const inRoom = (presence?.players ?? []).filter(
      (p) => p.id !== presence?.self && p.area === 'home' && (p.home ?? p.actor) === roomActor,
    );
    for (const p of inRoom) list.push({ id: p.id, actor: p.actor, look: p.look });
    if (visit && !inRoom.some((p) => p.actor === visit.owner))
      list.push({ id: HOST_ID, actor: visit.owner, look: visit.ownerLook, npc: true });
    return list;
  }, [presence?.players, presence?.self, roomActor, visit]);
  // The away owner stands on the nearest open spot (clear of this room's furniture).
  const hostSpot = useMemo(
    () => nearestWalkable(HOST_SPOT, roomObstacles(room), 0.45) ?? HOST_SPOT,
    [room],
  );
  const hostSpotRef = useRef(hostSpot);
  useLayoutEffect(() => {
    hostSpotRef.current = hostSpot;
  }, [hostSpot]);
  const occupantsRef = useRef(occupants);
  useLayoutEffect(() => {
    occupantsRef.current = occupants;
  }, [occupants]);

  // Speech bubbles: the newest chat line per friend for a few seconds after it
  // arrived (lines already there when the room opened are history, not speech).
  const [openedAt] = useState(() => Date.now());
  const bubbles = useMemo(() => {
    const out: Record<number, { text: string; until: number }> = {};
    for (const line of presence?.chat ?? []) {
      const at = chatArrival(line.id);
      if (at > openedAt + 300) out[line.actor] = { text: line.text, until: at + BUBBLE_MS };
    }
    return out;
  }, [presence?.chat, openedAt]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ------------------------------------------------------------ editing ops
  const conflicts = useMemo(() => {
    const shown = draft ? withItem(room, draft) : room;
    return roomConflicts(shown);
  }, [room, draft]);
  const selected = selectedId
    ? (draft?.id === selectedId ? draft : room.items.find((i) => i.id === selectedId)) ?? null
    : null;
  const selectedConflict = selected ? conflicts.find((c) => c.id === selected.id) : undefined;
  const conflictCount = new Set(conflicts.map((c) => c.id)).size;

  const apply = (next: Bedroom, text: string) => {
    setOwnKey(roomKey(next));
    const current = latest.current.save;
    onChange?.({ ...current, bedroom: next });
    latest.current = { ...latest.current, room: next, save: { ...current, bedroom: next } };
    setAnnouncement(text);
    onDecorated?.();
  };
  const commit = (value: Bedroom, text: string) => {
    if (!canEdit) return;
    const previous = latest.current.room,
      next = readBedroom(value, save.actor);
    setDraft(null);
    if (roomKey(next) === roomKey(previous)) return;
    setHistory({ past: [...historyRef.current.past, previous].slice(-30), future: [] });
    apply(next, text);
    if ((next.access ?? 'friends') !== (previous.access ?? 'friends')) onAccess?.(next.access ?? 'friends');
  };
  const commitItem = (item: RoomItem, text: string) => commit(withItem(latest.current.room, item), text);
  const undo = () => {
    const h = historyRef.current,
      previous = h.past.at(-1);
    if (!previous) return;
    setDraft(null);
    setHistory({ past: h.past.slice(0, -1), future: [latest.current.room, ...h.future].slice(0, 30) });
    apply(previous, '마지막 변경을 되돌렸어요.');
    if (!previous.items.some((i) => i.id === latest.current.selectedId)) setSelectedId(null);
  };
  const redo = () => {
    const h = historyRef.current,
      next = h.future[0];
    if (!next) return;
    setDraft(null);
    setHistory({ past: [...h.past, latest.current.room].slice(-30), future: h.future.slice(1) });
    apply(next, '변경을 다시 적용했어요.');
    if (!next.items.some((i) => i.id === latest.current.selectedId)) setSelectedId(null);
  };
  /** Premium furniture: owned copies (one unlock entry each) minus placed copies. */
  const premiumLeft = (ref: string, current: { items: readonly { ref: string }[] }) =>
    !catalogEntry(ref)?.premium ||
    unlocks.filter((u) => u === ref).length > current.items.filter((i) => i.ref === ref).length;
  const add = (ref: string) => {
    const current = latest.current.room,
      entry = catalogEntry(ref);
    if (!entry) return;
    if (current.items.length >= BEDROOM_LIMITS.maxItems) {
      notice?.(`소품은 ${BEDROOM_LIMITS.maxItems}개까지 놓을 수 있어요.`);
      return;
    }
    if (!premiumLeft(ref, current)) {
      notice?.(`${josa(entry.name, '은/는')} 가진 만큼 모두 놓았어요.`);
      return;
    }
    // Just in front of me (towards the camera), on the nearest open floor
    // (not on the bed or under my feet, so the next drag grabs this one).
    const p = positionRef.current;
    const item = placeOpen(current, ref, { x: p.x + 0.9, z: p.z + 0.45 }, [p]);
    if (!item) return;
    commitItem(item, `${josa(entry.name, '을/를')} 놓았어요. 끌어서 옮겨 보세요.`);
    setSelectedId(item.id);
    setPanel(null);
  };
  const remove = (id: string) => {
    const entry = catalogEntry(latest.current.room.items.find((i) => i.id === id)?.ref ?? '');
    commit(withoutItem(latest.current.room, id), `${josa(entry?.name ?? '소품', '을/를')} 치웠어요.`);
    setSelectedId(null);
  };
  // Stable entry points for the three.js handlers (setters never change).
  const setters = useRef({ setSelectedId, setDraft, setDragging });
  const editOps = useRef({ commitItem, remove, undo, redo });
  useLayoutEffect(() => {
    editOps.current = { commitItem, remove, undo, redo };
  });
  const stopEditing = () => {
    setEditing(false);
    setSelectedId(null);
    setDraft(null);
    setPanel(null);
  };
  // A room replaced from elsewhere (other device, account switch) starts a new history.
  const key = roomKey(room);
  const [trackedKey, setTrackedKey] = useState(key);
  if (key !== trackedKey) {
    setTrackedKey(key);
    if (key !== ownKey) setHistory({ past: [], future: [] });
  }

  // ------------------------------------------------------------ room sync
  useEffect(() => {
    const studio = studioRef.current;
    if (!studio) return;
    studio.setRoom(room);
    studio.setPaint(room.wall, room.floor);
  }, [room]);
  useEffect(() => {
    const obstacles: WalkObstacle[] = roomObstacles(draft ? withItem(room, draft) : room);
    if (occupants.some((o) => o.npc))
      obstacles.push({ id: HOST_ID, x: hostSpot.x, z: hostSpot.z, width: 0.5, depth: 0.4 });
    setWalkObstacles(obstacles);
    // Furniture placed on me: step aside to the nearest free spot.
    const here = nearestWalkable(positionRef.current, obstacles);
    if (here) positionRef.current = here;
  }, [room, draft, occupants, hostSpot]);
  useEffect(() => {
    studioRef.current?.setSelection(editing ? selectedId : null, !!selectedConflict);
  }, [editing, selectedId, selectedConflict, room, draft]);
  useEffect(() => () => setWalkObstacles([]), []);

  // ------------------------------------------------------------ three.js
  useEffect(() => {
    const host = hostRef.current!;
    const pressed = directions.current;
    let disposed = false,
      frame = 0,
      visible = true,
      contextFailed = false,
      dirty = true;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      queueMicrotask(() => {
        if (!disposed) {
          setState('unavailable');
          setMessage('이 기기에서는 입체 방을 열 수 없어요.');
        }
      });
      return () => {
        disposed = true;
      };
    }
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-6, 6, 4.8, -4.8, 0.1, 60);
    camera.position.set(ROOM_CAMERA.x, ROOM_CAMERA.y, ROOM_CAMERA.z);
    camera.lookAt(0, 1.08, 0);
    camera.updateMatrixWorld();
    const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    // The room box in camera space (screen right / up), for framing.
    const roomFrame = (() => {
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1),
        target = new THREE.Vector3(0, 1.08, 0);
      const r: number[] = [],
        u: number[] = [];
      for (const x of [ROOM.minX - 0.2, ROOM.maxX + 0.1])
        for (const y of [-0.35, ROOM.wallHeight])
          for (const z of [ROOM.minZ - 0.2, ROOM.maxZ + 0.1]) {
            const p = new THREE.Vector3(x, y, z).sub(target);
            r.push(p.dot(cameraRight));
            u.push(p.dot(up));
          }
      const span = (v: number[]) => ({
        center: (Math.max(...v) + Math.min(...v)) / 2,
        half: (Math.max(...v) - Math.min(...v)) / 2,
      });
      return { right: span(r), up: span(u) };
    })();
    const quality = qualityProfile(getSettings().quality);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = quality.shadows;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // Only static geometry casts shadows; a contact shadow follows the sprite.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    const canvas = renderer.domElement;
    canvas.className = 'b3-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);

    const studio = createBedroomScene(scene, renderer, latest.current.room, host, () => {
      dirty = true;
    });
    studioRef.current = studio;

    // ---------------------------------------------------------- figures
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const avatarHeight = 1.82;
    const cameraUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    // The figure canvas adds a hat band (HAT_HEADROOM) above the 440×540 body
    // canvas that avatarHeight spans, so a hat never shrinks the figure.
    const avatarCanvasHeight = withHatHeadroom(540),
      avatarPlaneHeight = (avatarHeight * avatarCanvasHeight) / 540;
    const avatarGeometry = new THREE.PlaneGeometry(avatarHeight * cameraUp.y * (440 / 540), avatarPlaneHeight);
    // loungeSprites.draw places the soles at 97% of the texture's height.
    avatarGeometry.translate(0, avatarPlaneHeight * 0.47, 0);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 64;
    {
      const c = shadowCanvas.getContext('2d')!,
        g = c.createRadialGradient(32, 32, 4, 32, 32, 31);
      g.addColorStop(0, 'rgba(62, 49, 31, 0.3)');
      g.addColorStop(0.45, 'rgba(62, 49, 31, 0.16)');
      g.addColorStop(1, 'rgba(62, 49, 31, 0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    shadowTexture.colorSpace = THREE.SRGBColorSpace;
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false });
    const shadowGeometry = new THREE.PlaneGeometry(0.72, 0.52);
    type Figure = {
      canvas: HTMLCanvasElement;
      texture: THREE.CanvasTexture;
      mesh: THREE.Mesh;
      shadow: THREE.Mesh;
      actor: number;
      look: Look;
      pos: WalkPoint;
      target: WalkPoint;
      locomotion: LocomotionState;
      motion: 'walk' | 'run' | 'idle';
      drawnAt: number;
    };
    const figure = (actor: number, look: Look, at: WalkPoint): Figure => {
      const c = document.createElement('canvas');
      c.width = 440;
      c.height = avatarCanvasHeight;
      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      // Upright in world space; a screen-facing Sprite would lean into furniture.
      const mesh = new THREE.Mesh(
        avatarGeometry,
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.12, toneMapped: false }),
      );
      mesh.rotation.y = Math.atan2(camera.position.x, camera.position.z);
      const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
      shadow.rotation.x = -Math.PI / 2;
      scene.add(mesh, shadow);
      return { canvas: c, texture, mesh, shadow, actor, look, pos: { ...at }, target: { ...at }, locomotion: { phase: 0, facing: 1 }, motion: 'idle', drawnAt: -1000 };
    };
    const dropFigure = (f: Figure) => {
      scene.remove(f.mesh, f.shadow);
      (f.mesh.material as THREE.Material).dispose();
      f.texture.dispose();
      f.canvas.width = f.canvas.height = 0;
    };
    const me = figure(latest.current.save.actor, latest.current.save.looks[latest.current.save.actor], positionRef.current);
    me.mesh.name = 'me';
    const others = new Map<string, Figure>();
    let sprites: Awaited<ReturnType<typeof loungeSprites>> | null = null;
    const spritesPromise = loungeSprites().then(async (value) => {
      const current = latest.current.save;
      await value.ensure(current.actor, current.looks[current.actor]);
      sprites = value;
      if (!disposed && !reduced.matches)
        await value.warmMotion(current.actor, current.looks[current.actor]).catch(() => {
          /* Retain the static wardrobe when optional motion art is offline. */
        });
    });
    const drawFigure = (f: Figure, t: number, force = false) => {
      if (!sprites || (!force && t - f.drawnAt < (f.motion === 'idle' ? 90 : 40))) return;
      if (sprites.draw(f.canvas, f.actor, f.look, f.motion, f.locomotion.phase, false, reduced.matches, { facing: f.locomotion.facing, headroom: HAT_HEADROOM })) {
        f.texture.needsUpdate = true;
        dirty = true;
      }
      f.drawnAt = t;
    };

    void Promise.allSettled([studio.ready, spritesPromise]).then(([models, figures]) => {
      if (disposed || contextFailed) return;
      if (figures.status === 'rejected') {
        setState('unavailable');
        setMessage('캐릭터 그림을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.');
      } else if (models.status === 'fulfilled' && models.value > 0) {
        setState('partial');
        setMessage('일부 소품을 불러오지 못했어요. 방은 그대로 둘러볼 수 있어요.');
      } else {
        setState('ready');
        setMessage('바닥을 클릭하면 그곳으로 걸어가요.');
      }
    });

    // ---------------------------------------------------------- pointer
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();
    const destination = new THREE.Mesh(
      new THREE.RingGeometry(0.13, 0.17, 32),
      new THREE.MeshBasicMaterial({ color: '#f7f0cd', transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide }),
    );
    destination.rotation.x = -Math.PI / 2;
    destination.visible = false;
    scene.add(destination);
    let path: WalkPoint[] = [];
    const rayFrom = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.ray;
    };
    type Drag = { pointer: number; id: string; start: RoomItem; offset: { x: number; z: number }; moved: boolean; sx: number; sy: number };
    let drag: Drag | null = null;
    /** Where a wall item under the pointer would hang (the nearer wall wins). */
    const wallHit = (ray: THREE.Ray) => {
      const options: { wall: 'back' | 'left'; along: number; y: number; d: number }[] = [];
      const back = ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -ROOM.minZ), new THREE.Vector3());
      if (back && back.x >= ROOM.minX - 0.3 && back.x <= ROOM.maxX && back.y > 0 && back.y < ROOM.wallHeight + 0.4)
        options.push({ wall: 'back', along: back.x, y: back.y, d: back.distanceTo(ray.origin) });
      const left = ray.intersectPlane(new THREE.Plane(new THREE.Vector3(1, 0, 0), -ROOM.minX), new THREE.Vector3());
      if (left && left.z >= ROOM.minZ - 0.3 && left.z <= ROOM.maxZ && left.y > 0 && left.y < ROOM.wallHeight + 0.4)
        options.push({ wall: 'left', along: left.z, y: left.y, d: left.distanceTo(ray.origin) });
      options.sort((a, b) => a.d - b.d);
      return options[0] ?? null;
    };
    const dragTo = (event: PointerEvent) => {
      if (!drag) return;
      const current = latest.current.room;
      const item = latest.current.draft?.id === drag.id ? latest.current.draft : current.items.find((i) => i.id === drag!.id);
      if (!item) return;
      const entry = catalogEntry(item.ref)!;
      const ray = rayFrom(event);
      let next: RoomItem | null = null;
      if (entry.mount === 'wall') {
        const hit = wallHit(ray);
        if (hit) next = moveWallItem(item, hit.wall, hit.along, hit.y);
      } else {
        floorPlane.constant = -(item.y ?? 0);
        if (ray.intersectPlane(floorPlane, hitPoint))
          next = moveFloorItem(current, item, Math.round((hitPoint.x + drag.offset.x) * 20) / 20, Math.round((hitPoint.z + drag.offset.z) * 20) / 20);
      }
      if (!next) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.sx, event.clientY - drag.sy) < 4) return;
      drag.moved = true;
      latest.current.draft = next;
      studio.preview(next);
      setters.current.setDraft(next);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      host.focus({ preventScroll: true });
      const ray = rayFrom(event);
      if (latest.current.editing) {
        const id = studio.pick(ray, latest.current.selectedId);
        setters.current.setSelectedId(id);
        if (!id) return;
        const item = latest.current.room.items.find((i) => i.id === id)!;
        const entry = catalogEntry(item.ref)!;
        let offset = { x: 0, z: 0 };
        if (entry.mount !== 'wall') {
          floorPlane.constant = -(item.y ?? 0);
          if (ray.intersectPlane(floorPlane, hitPoint)) offset = { x: item.x - hitPoint.x, z: item.z - hitPoint.z };
        }
        drag = { pointer: event.pointerId, id, start: item, offset, moved: false, sx: event.clientX, sy: event.clientY };
        canvas.setPointerCapture(event.pointerId);
        setters.current.setDragging(true);
        event.preventDefault();
        return;
      }
      floorPlane.constant = 0;
      const hit = ray.intersectPlane(floorPlane, hitPoint);
      if (!hit || hit.x < ROOM.minX - 0.2 || hit.x > ROOM.maxX + 0.2 || hit.z < ROOM.minZ - 0.2 || hit.z > ROOM.maxZ + 0.2) return;
      path = findWalkPath(positionRef.current, { x: hit.x, z: hit.z });
      const last = path.at(-1);
      destination.visible = Boolean(last);
      if (last) destination.position.set(last.x, 0.07, last.z);
      dirty = true;
    };
    /** Cursor: grab over furniture while decorating, pointer over the door and usable furniture. */
    let hoverKind = '';
    const hoverAt = (event: PointerEvent) => {
      if (contextFailed) return '';
      const ray = rayFrom(event);
      const current = latest.current;
      if (current.editing) return studio.pick(ray, current.selectedId) ? 'grab' : '';
      floorPlane.constant = 0;
      const hit = ray.intersectPlane(floorPlane, hitPoint);
      if (hit && Math.hypot(hit.x - ROOM_DOOR_POINT.x, hit.z - ROOM_DOOR_POINT.z) < ROOM_DOOR_REACH && !current.visit)
        return 'place';
      const id = studio.pick(ray, null);
      const ref = id ? current.room.items.find((i) => i.id === id)?.ref : undefined;
      return ref && !current.visit && roomItemUsable(ref) ? 'spot' : '';
    };
    const onPointerMove = (event: PointerEvent) => {
      if (drag && event.pointerId === drag.pointer) {
        dragTo(event);
        if (hoverKind !== 'drag') host.dataset.hover = hoverKind = 'drag';
        return;
      }
      const kind = hoverAt(event);
      if (kind !== hoverKind) host.dataset.hover = hoverKind = kind;
    };
    const endDrag = (event: PointerEvent, cancel = false) => {
      if (!drag || event.pointerId !== drag.pointer) return;
      const d = drag;
      drag = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      setters.current.setDragging(false);
      const moved = latest.current.draft;
      if (!cancel && d.moved && moved?.id === d.id) {
        editOps.current.commitItem(moved, `${josa(catalogEntry(moved.ref)?.name ?? '소품', '을/를')} 옮겼어요.`);
      } else {
        latest.current.draft = null;
        setters.current.setDraft(null);
        studio.setRoom(latest.current.room);
      }
    };
    const onPointerUp = (event: PointerEvent) => endDrag(event);
    const onPointerCancel = (event: PointerEvent) => endDrag(event, true);

    // ---------------------------------------------------------- keys
    const keydown = (event: KeyboardEvent) => {
      // Heard on window: after a dialog closes focus may sit on body or on the
      // button that opened it, and WASD / Ctrl+Z should still reach the room.
      const at = sceneKeyTarget(event, host);
      if (!at || event.altKey) return;
      if (latest.current.editing) {
        if ((event.ctrlKey || event.metaKey) && event.code === 'KeyZ') {
          event.preventDefault();
          if (event.shiftKey) editOps.current.redo();
          else editOps.current.undo();
          return;
        }
        if ((event.ctrlKey || event.metaKey) && event.code === 'KeyY') {
          event.preventDefault();
          editOps.current.redo();
          return;
        }
        // Delete / R / arrows on a focused toolbar button stay that button's.
        if (at !== 'scene') return;
        const id = latest.current.selectedId,
          item = id ? latest.current.room.items.find((i) => i.id === id) : undefined;
        if (!item) return;
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          editOps.current.remove(item.id);
        } else if (event.key === 'Escape') setters.current.setSelectedId(null);
        else if (event.code === 'KeyR') {
          event.preventDefault();
          editOps.current.commitItem(rotateItem(latest.current.room, item, event.shiftKey ? -90 : 90), '방향을 바꿨어요.');
        } else {
          const step = event.shiftKey ? 0.5 : 0.1;
          const offsets: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
          const o = offsets[event.key];
          if (!o || event.ctrlKey || event.metaKey) return;
          event.preventDefault();
          const entry = catalogEntry(item.ref)!;
          const next =
            entry.mount === 'wall'
              ? moveWallItem(item, item.wall ?? 'back', (item.wall === 'left' ? item.z : item.x) + (item.wall === 'left' ? -o[0] : o[0]), (item.y ?? 2) - o[1])
              : moveFloorItem(latest.current.room, item, item.x + o[0], item.z + o[1]);
          editOps.current.commitItem(next, '조금 옮겼어요.');
        }
        return;
      }
      const bound = boundAction(event);
      if (bound === 'action' && !event.ctrlKey && !event.metaKey) {
        // The one action button: E always presses it.
        if (actionRef.current) {
          event.preventDefault();
          runActionRef.current(actionRef.current.kind);
        }
        return;
      }
      // Esc (menu) is app-wide now: lounge-game.tsx opens the Esc menu.
      const direction = boundDirection(event);
      if (!direction || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      pressed.add(direction);
      path = [];
      destination.visible = false;
    };
    const runKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Shift' || event.repeat || !sceneKeyTarget(event, host)) return;
      shiftHeld.current = true;
    };
    const keyup = (event: KeyboardEvent) => {
      const direction = boundDirection(event);
      if (direction) pressed.delete(direction);
      if (event.key === 'Shift') {
        shiftHeld.current = false;
      }
    };
    const blur = () => {
      pressed.clear();
      shiftHeld.current = false;
      path = [];
      destination.visible = false;
    };
    const visibilityChanged = () => {
      if (document.hidden) blur();
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      if (!disposed) {
        contextFailed = true;
        cancelAnimationFrame(frame);
        setState('unavailable');
        setMessage('입체 화면 연결이 잠시 끊겼어요. 다시 시도하면 방으로 돌아가요.');
      }
    };
    const contextRestored = () => {
      if (disposed) return;
      contextFailed = false;
      renderer.shadowMap.needsUpdate = true;
      me.drawnAt = -1000;
      setState('ready');
      setMessage('바닥을 클릭하면 그곳으로 걸어가요.');
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(animate);
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.addEventListener('webglcontextrestored', contextRestored);
    // "요리·만들기" from the menu (and tests): walk to a kitchen table / point.
    const roomGo = (e: Event) => {
      const detail = (e as CustomEvent<{ x: number; z: number } | 'cook'>).detail;
      const target = detail === 'cook' ? besideCookTable(latest.current.room) : detail;
      if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.z)) return;
      path = findWalkPath(positionRef.current, target);
      const last = path.at(-1);
      destination.visible = Boolean(last);
      if (last) destination.position.set(last.x, 0.07, last.z);
      dirty = true;
    };
    window.addEventListener('bumtadew:room-go', roomGo);
    window.addEventListener('keydown', keydown);
    window.addEventListener('keydown', runKeydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibilityChanged);
    host.addEventListener('focusout', blur);
    const resize = () => {
      const width = host.clientWidth,
        height = host.clientHeight;
      if (!width || !height) return;
      const aspect = width / height;
      // Frame the whole room box (floor slab to the top of the walls) tightly.
      const { right: r, up: u } = roomFrame;
      const halfHeight = Math.max(u.half, r.half / aspect) * 1.05;
      camera.left = r.center - halfHeight * aspect;
      camera.right = r.center + halfHeight * aspect;
      camera.top = u.center + halfHeight;
      camera.bottom = u.center - halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      dirty = true;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    // 설정 → 그래픽: pixel ratio and shadows follow the quality preset live.
    const applyQuality = () => {
      const q = qualityProfile(getSettings().quality);
      const ratio = Math.min(window.devicePixelRatio || 1, q.pixelRatio);
      if (renderer.getPixelRatio() !== ratio) renderer.setPixelRatio(ratio);
      if (renderer.shadowMap.enabled !== q.shadows) {
        renderer.shadowMap.enabled = q.shadows;
        scene.traverse((object) => {
          const material = (object as THREE.Mesh).material;
          for (const m of Array.isArray(material) ? material : material ? [material] : [])
            m.needsUpdate = true;
        });
      }
      renderer.shadowMap.needsUpdate = true;
      resize();
    };
    applyQuality();
    const offSettings = onSettingsChange(applyQuality);
    // The Esc menu stops my walk (friends in the room keep moving).
    const pause = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail) blur();
    };
    window.addEventListener('bumtadew:pause', pause);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) blur();
    });
    visibilityObserver.observe(host);

    // ---------------------------------------------------------- loop
    let previous = performance.now(),
      lastRender = -100,
      lastData = -100,
      lastSent = -1000,
      sentAt: WalkPoint | null = null;
    const label = new THREE.Vector3();
    const projectLabels = () => {
      const w = host.clientWidth,
        h = host.clientHeight;
      const place = (id: string, p: WalkPoint, f: Figure) => {
        const el = labelsRef.current.get(id);
        if (!el) return;
        const rise = sprites ? sprites.hatRise(f.canvas) : 0;
        label.set(p.x, hatTagHeight(1.98, avatarHeight * 0.94, rise, avatarPlaneHeight), p.z).project(camera);
        el.style.transform = `translate(${((label.x + 1) / 2) * w}px, ${((1 - label.y) / 2) * h}px) translate(-50%, -100%)`;
      };
      place('self', me.pos, me);
      for (const [id, f] of others) place(id, f.pos, f);
    };
    let lastTick = 0;
    const animate = (t: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      // 프레임 제한 (설정 → 그래픽).
      const cap = getSettings().fpsCap;
      if (cap && t - lastTick < 1000 / cap - 2) return;
      lastTick = t;
      const dt = Math.min((t - previous) / 1000, 0.25);
      previous = t;
      if (!visible || document.hidden) return;
      // Me.
      const before = positionRef.current;
      let position = before;
      const running = shiftHeld.current,
        speed = 2.25 * (running ? RUN_SPEED_MULTIPLIER : 1);
      if (!latest.current.editing) {
        let horizontal = Number(pressed.has('right')) - Number(pressed.has('left'));
        let vertical = Number(pressed.has('down')) - Number(pressed.has('up'));
        if (horizontal || vertical) {
          path = [];
          destination.visible = false;
          const length = Math.hypot(horizontal, vertical);
          horizontal /= length;
          vertical /= length;
          const stepX = (horizontal + vertical) * Math.SQRT1_2 * speed * dt;
          position = walkStep(position, stepX, (vertical - horizontal) * Math.SQRT1_2 * speed * dt);
          if (leavingThroughDoor(position, stepX) && flow.current.onExit)
            queueMicrotask(() => runActionRef.current('exit'));
        } else if (path.length) {
          const next = path[0],
            dx = next.x - position.x,
            dz = next.z - position.z,
            distance = Math.hypot(dx, dz),
            step = Math.min(distance, speed * dt);
          if (distance < 0.025) path.shift();
          else position = walkStep(position, (dx / distance) * step, (dz / distance) * step);
          if (!path.length) destination.visible = false;
        }
      } else if (path.length) {
        path = [];
        destination.visible = false;
      }
      positionRef.current = position;
      const movedX = position.x - before.x,
        movedZ = position.z - before.z,
        moved = Math.hypot(movedX, movedZ);
      const walking = moved > 0.0001;
      const motion = advanceLocomotion(me.locomotion, { distance: moved, horizontal: movedX * cameraRight.x + movedZ * cameraRight.z }, running ? 'run' : 'walk', 2.25);
      const changed = motion.motion !== me.motion || motion.state.facing !== me.locomotion.facing;
      me.locomotion = motion.state;
      me.motion = motion.motion;
      me.pos = position;
      const current = latest.current.save;
      me.actor = current.actor;
      me.look = current.looks[current.actor];
      me.mesh.position.set(position.x, 0.065, position.z);
      me.shadow.position.set(position.x, 0.066, position.z);
      drawFigure(me, t, changed);
      // Tell the room where I am (throttled), and once more when I stop.
      const net = latest.current.presence;
      if (net && (walking ? t - lastSent > 220 : sentAt && (sentAt.x !== position.x || sentAt.z !== position.z))) {
        const p = roomToNetwork(position);
        net.onMove(p.x, p.y);
        lastSent = t;
        sentAt = { ...position };
      }
      // Friends in the same room glide to their latest reported spot.
      const wanted = occupantsRef.current;
      for (const [id, f] of others)
        if (!wanted.some((o) => o.id === id)) {
          dropFigure(f);
          others.delete(id);
          dirty = true;
        }
      const players = latest.current.presence?.players ?? [];
      for (const o of wanted) {
        const live = players.find((p) => p.id === o.id);
        const target = o.npc ? { ...hostSpotRef.current } : live ? roomFromNetwork(live) : { ...WALK_START };
        let f = others.get(o.id);
        if (!f) {
          f = figure(o.actor, o.look, target);
          if (o.npc) f.locomotion.facing = -1;
          others.set(o.id, f);
          void sprites?.ensure(o.actor, o.look).catch(() => {});
        }
        f.look = o.look;
        f.target = target;
        const dx = f.target.x - f.pos.x,
          dz = f.target.z - f.pos.z,
          d = Math.hypot(dx, dz);
        let fm = 0;
        if (d > 3.5) f.pos = { ...f.target };
        else if (d > 0.02) {
          const step = Math.min(d, (d > 1.2 ? 4 : 2.3) * dt);
          f.pos = { x: f.pos.x + (dx / d) * step, z: f.pos.z + (dz / d) * step };
          fm = step;
        }
        const m = advanceLocomotion(f.locomotion, { distance: fm, horizontal: (dx / (d || 1)) * fm * cameraRight.x + (dz / (d || 1)) * fm * cameraRight.z }, d > 1.2 ? 'run' : 'walk', 2.25);
        const fc = m.motion !== f.motion || m.state.facing !== f.locomotion.facing;
        f.locomotion = m.state;
        f.motion = m.motion;
        f.mesh.position.set(f.pos.x, 0.065, f.pos.z);
        f.shadow.position.set(f.pos.x, 0.066, f.pos.z);
        drawFigure(f, t, fc);
        if (fm) dirty = true;
      }
      if (t - lastData > 150) {
        // Screen position of the selected item (tests and assistive overlays).
        const sel = latest.current.editing ? latest.current.selectedId : null;
        const top = sel ? studio.itemTop(sel) : null;
        if (top) {
          top.y = Math.max(0.1, top.y * 0.5);
          top.project(camera);
          host.dataset.selectedAt = `${Math.round(((top.x + 1) / 2) * host.clientWidth)},${Math.round(((1 - top.y) / 2) * host.clientHeight)}`;
        } else delete host.dataset.selectedAt;
        const nextAction = latest.current.editing
          ? null
          : roomAction(position, latest.current.room, {
              own: canEditRef.current,
              canExit: !!flow.current.onExit,
              canDress: !!flow.current.onDress,
              canCook: !!flow.current.onCook,
            });
        if (
          nextAction?.kind !== actionRef.current?.kind ||
          nextAction?.item !== actionRef.current?.item
        ) {
          if (nextAction?.kind === 'exit') flow.current.onNearDoor?.();
          actionRef.current = nextAction;
          setAction(nextAction);
        }
        host.dataset.action = nextAction?.kind ?? '';
        host.dataset.avatarX = position.x.toFixed(3);
        host.dataset.avatarZ = position.z.toFixed(3);
        host.dataset.walking = String(walking);
        host.dataset.motion = me.motion;
        host.dataset.others = String(others.size);
        lastData = t;
      }
      if (walking || dirty || t - lastRender > 120) {
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
      pressed.clear();
      studioRef.current = null;
      resizeObserver.disconnect();
      offSettings();
      window.removeEventListener('bumtadew:pause', pause);
      visibilityObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      window.removeEventListener('bumtadew:room-go', roomGo);
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keydown', runKeydown);
      host.removeEventListener('focusout', blur);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibilityChanged);
      dropFigure(me);
      for (const f of others.values()) dropFigure(f);
      avatarGeometry.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      destination.geometry.dispose();
      (destination.material as THREE.Material).dispose();
      studio.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [attempt]);

  useEffect(() => {
    const host = hostRef.current;
    if (host) host.dataset.editing = String(editing);
  }, [editing, attempt, state]);

  const theme = BEDROOM_THEMES.find((t) => t.id === room.theme) ?? bedroomTheme(roomActor);
  const ownerName = ACTORS[roomActor];
  const closed = (room.access ?? 'friends') === 'closed';
  const bubbleFor = (actor: number, reaction?: LoungePlayer['reaction']) => {
    if (reaction && reactionVisible(reaction, 'home', undefined, now))
      return reactionInfo(reaction.id)?.label;
    const b = bubbles[actor];
    return b && b.until > now ? b.text : undefined;
  };
  const players = presence?.players ?? [];
  const selfPlayer = players.find((p) => p.id === presence?.self);
  const selfBubble = bubbleFor(save.actor, selfPlayer?.reaction);
  const visitors = occupants.filter((o) => !o.npc);

  // The open catalog / wall-and-floor panel: over the room on small screens,
  // in the side dock on desktop (so it never covers the room).
  const editPanel =
    editing && panel === 'catalog' ? (
      <EditCatalog room={room} unlocks={unlocks} onAdd={add} onClose={() => setPanel(null)} />
    ) : editing && panel === 'settings' ? (
      <RoomSettings
        room={room}
        unlocks={unlocks}
        onChange={commit}
        onReset={() => setResetOpen(true)}
        onClose={() => setPanel(null)}
      />
    ) : null;
  return (
    <section className="b3-room" aria-label="입체 방" data-editing={editing || undefined}>
      <header className="b3-heading">
        <div>
          <span className="b3-eyebrow">
            <Sun size={14} /> 좋아하는 것들로 채운 하루
          </span>
          <h1>
            {ownerName}의 {theme.title}
          </h1>
          <p>
            {visit
              ? `${ownerName}의 방에 놀러 왔어요. 함께 있는 친구와 이야기해 보세요.`
              : theme.description}
          </p>
        </div>
        <div className="b3-heading-side">
          <span className="b3-mode-label">
            {visit ? `${ownerName}의 ${theme.title} · 놀러 왔어요` : theme.tag}
          </span>
          {!visit && (
            <span className="b3-visitors" data-testid="room-visitors">
              {closed ? (
                <>
                  <Lock size={13} /> 방문 닫힘
                </>
              ) : visitors.length ? (
                `지금 내 방에 온 친구 · ${visitors.map((v) => ACTORS[v.actor]).join(', ')}`
              ) : (
                '아직 놀러 온 친구가 없어요'
              )}
            </span>
          )}
        </div>
      </header>
      <div className="b3-scene-frame">
        {/* Keyboard focus is required for directional movement in this application surface. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div
          ref={hostRef}
          className="b3-scene"
          tabIndex={0}
          role="application"
          aria-label={
            editing
              ? '꾸미기 모드. 소품을 클릭해 고르고 끌어서 옮겨요. R 회전, Delete 치우기, 방향키로 조금씩 옮기기.'
              : `${ownerName}의 입체 방. 바닥을 클릭하거나 방향키와 WASD로 걸어요. Shift로 달리고 Esc로 메뉴를 열어요.`
          }
          data-testid="bedroom-3d"
          data-load-state={state}
          data-room-actor={roomActor}
        >
          <div className="b3-labels" aria-hidden="true">
            <div
              className="b3-label b3-label-self"
              ref={(el) => {
                if (el) labelsRef.current.set('self', el);
                else labelsRef.current.delete('self');
              }}
            >
              {selfBubble && <span className="b3-bubble">{selfBubble}</span>}
            </div>
            {occupants.map((o) => {
              const live = players.find((p) => p.id === o.id);
              const text = bubbleFor(o.actor, live?.reaction);
              return (
                <div
                  key={o.id}
                  className="b3-label"
                  data-occupant={o.actor}
                  ref={(el) => {
                    if (el) labelsRef.current.set(o.id, el);
                    else labelsRef.current.delete(o.id);
                  }}
                >
                  {text && <span className="b3-bubble">{text}</span>}
                  <span className="b3-name">
                    {ACTORS[o.actor]}
                    {o.actor === roomActor && <em>{o.npc ? '집주인 · 자리 비움' : '집주인'}</em>}
                  </span>
                </div>
              );
            })}
          </div>
          {state === 'loading' && (
            <output className="b3-loading">
              <LoaderCircle size={19} />
              {message}
            </output>
          )}
          {state === 'unavailable' && (
            <div className="b3-fallback" aria-live="polite">
              <strong>잠시 문제가 생겼어요</strong>
              <p>{message}</p>
              <div className="b3-fallback-actions">
                <button
                  type="button"
                  onClick={() => {
                    setState('loading');
                    setMessage('방에 햇살을 들이는 중…');
                    setAttempt((value) => value + 1);
                  }}
                >
                  <RotateCcw size={16} /> 다시 시도
                </button>
              </div>
            </div>
          )}
          {!wideEdit && editPanel}
        </div>
        {editing ? (
          <div className="b3-edit-dock">
            {wideEdit && editPanel}
            {selected && !panel && (
              <EditToolbar
                item={selected}
                conflict={selectedConflict ? CONFLICT_TEXT[selectedConflict.reason] : null}
                busy={dragging}
                onRotate={(deg) => commitItem(rotateItem(room, selected, deg), '방향을 바꿨어요.')}
                onRotation={(deg) => {
                  const next = rotateItem(room, selected, deg - selected.rotY);
                  setDraft(next);
                  studioRef.current?.preview(next);
                }}
                onRotationEnd={() => {
                  const d = latest.current.draft;
                  if (d) commitItem(d, '방향을 바꿨어요.');
                }}
                onScale={(scale) => {
                  const next = scaleItem(room, selected, scale);
                  setDraft(next);
                  studioRef.current?.preview(next);
                }}
                onScaleEnd={() => {
                  const d = latest.current.draft;
                  if (d) commitItem(d, '크기를 바꿨어요.');
                }}
                onDuplicate={() => {
                  if (room.items.length >= BEDROOM_LIMITS.maxItems) {
                    notice?.(`소품은 ${BEDROOM_LIMITS.maxItems}개까지 놓을 수 있어요.`);
                    return;
                  }
                  if (!premiumLeft(selected.ref, room)) {
                    notice?.('가진 가구를 모두 놓았어요. 가구 상점에서 더 살 수 있어요.');
                    return;
                  }
                  const copy = duplicateItem(room, selected);
                  if (copy) {
                    commitItem(copy, '하나 더 놓았어요.');
                    setSelectedId(copy.id);
                  }
                }}
                onDelete={() => remove(selected.id)}
                onDeselect={() => setSelectedId(null)}
              />
            )}
            <EditBar
              canUndo={history.past.length > 0 && !dragging}
              canRedo={history.future.length > 0 && !dragging}
              conflicts={conflictCount}
              onUndo={undo}
              onRedo={redo}
              onCatalog={() => setPanel(panel === 'catalog' ? null : 'catalog')}
              onSettings={() => setPanel(panel === 'settings' ? null : 'settings')}
              onDone={() => {
                stopEditing();
                hostRef.current?.focus({ preventScroll: true });
              }}
            />
          </div>
        ) : null}
        {!editing && state !== 'unavailable' && (
          <ActionButton
            className="b3-action"
            kind={action?.kind ?? null}
            shortcut={keyLabel(keys.action)}
            onPress={() => runAction(action?.kind)}
          />
        )}
        <div className="b3-scene-footer">
          <span>
            {editing ? (
              <>
                <Palette size={15} /> 소품을 클릭해 고르고 끌어서 옮겨요
                <span className="b3-key-help"> · R 회전 · Delete 치우기 · Ctrl+Z 되돌리기</span>
              </>
            ) : (
              <>
                <Footprints size={15} /> 클릭해서 이동
                <span className="b3-key-help"> · 방향키 / {[keys.up, keys.left, keys.down, keys.right].map(keyLabel).join('')} · Shift 달리기 · Esc 메뉴</span>
              </>
            )}
          </span>
          {/* Model credits live in the room's status bar (full-window room). */}
          <small className="b3-credit">
            가구 모델{' '}
            <a href="https://karchive.vibeline.co.kr/models" target="_blank" rel="noreferrer">
              kArchive
            </a>
            (출처: 쓰레드 dogfooter)·
            <a href="https://3dassets.dev/packs/bedroom-and-living-room-furniture" target="_blank" rel="noreferrer">
              3DAssets.dev
            </a>{' '}
            CC0 · 미쿠 테마 소품은 새로 그린 팬 아트예요
          </small>
        </div>
      </div>
      {state === 'partial' && <output className="b3-status">{message}</output>}
      <output className="b3-sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </output>
      {resetOpen && (
        <ResetRoomDialog
          onClose={() => setResetOpen(false)}
          onReset={() => {
            commit(defaultBedroom(save.actor), '처음 배치로 되돌렸어요. 실행 취소로 돌아갈 수 있어요.');
            setSelectedId(null);
            setResetOpen(false);
            setPanel(null);
            notice?.('처음 배치로 되돌렸어요.');
          }}
        />
      )}
    </section>
  );
}
