'use client';
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  DoorOpen,
  Footprints,
  House,
  Map as MapIcon,
  Minus,
  Plus,
  LocateFixed,
  Sun,
  Users,
  X,
  Send,
  Trees,
} from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { LoungeSave } from './lounge-look';
import type { LoungePlayer } from './lounge-room';
import { ACTORS } from './theater-data';
import { loungeSprites } from './lounge-sprites';
import {
  advanceLocomotion,
  RUN_SPEED_MULTIPLIER,
  type LocomotionState,
} from './lounge-locomotion';
import { LOUNGE_MODELS } from './lounge-model-assets';
import { villageCameraFrame } from './lounge-village-camera';
import { buildVillageWorld } from './lounge-village-world';
import {
  villageCanEnterPlace,
  villageNearbyEntrance,
  type NearbyVillageEntrance,
} from './lounge-village-entrance';
import {
  VILLAGE_BOUNDS,
  VILLAGE_DISTRICTS,
  VILLAGE_RIVER,
  VILLAGE_PLACES,
  VILLAGE_START,
  VILLAGE_ORCHARD,
  VILLAGE_FURNISHINGS,
  villageCanWalk,
  villageFromNetwork,
  villageToNetwork,
  villagePath,
  villageStep,
  type VillageDestination,
  type VillagePlace,
  type VillagePoint,
} from './lounge-village-layout';
import './lounge-village.css';

type Props = {
  save: LoungeSave;
  players: LoungePlayer[];
  self: string;
  initialPosition?: VillagePoint;
  onMove: (x: number, y: number) => void;
  onEnter: (destination: VillageDestination, place: VillagePlace) => void;
  onFriends: () => void;
  onRequest: () => void;
};
type Direction = 'up' | 'down' | 'left' | 'right';
const KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  w: 'up',
  ArrowDown: 'down',
  s: 'down',
  ArrowLeft: 'left',
  a: 'left',
  ArrowRight: 'right',
  d: 'right',
};
const DIRECTIONS = [
  ['up', ArrowUp, '위로 걷기'],
  ['left', ArrowLeft, '왼쪽으로 걷기'],
  ['down', ArrowDown, '아래로 걷기'],
  ['right', ArrowRight, '오른쪽으로 걷기'],
] as const;

function disposeScene(root: THREE.Object3D) {
  const geometry = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometry.add(mesh.geometry);
    if (mesh.material)
      for (const material of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]) {
        materials.add(material);
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) textures.add(value);
      }
  });
  geometry.forEach((g) => g.dispose());
  textures.forEach((t) => {
    t.dispose();
    if (
      typeof ImageBitmap !== 'undefined' &&
      t.source.data instanceof ImageBitmap
    )
      t.source.data.close();
  });
  materials.forEach((m) => m.dispose());
}

/** The village uses the existing shared position range; account and room saves are unchanged. */
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
  } | null>(null);
  const [state, setState] = useState<
    'loading' | 'ready' | 'partial' | 'unavailable'
  >('loading');
  const [selected, setSelected] = useState<VillagePlace | null>(null),
    [directory, setDirectory] = useState(false),
    [nearby, setNearby] = useState<NearbyVillageEntrance | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const nearbyId = useRef<string | null>(null);
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
    const activeDirections = directions.current;
    let disposed = false,
      frame = 0,
      visible = true,
      contextLost = false,
      assetsReady = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      queueMicrotask(() => {
        if (!disposed) setState('unavailable');
      });
      return () => {
        disposed = true;
      };
    }
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
    host.insertBefore(canvas, host.firstChild);
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#fff4d9', '#81936d', 2.25));
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
    scene.add(sun);
    buildVillageWorld(scene);
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
    const offset = new THREE.Vector3(34, 43, 52);
    const me = latest.current.players.find((p) => p.id === latest.current.self);
    const networkStart = me ? villageFromNetwork(me) : VILLAGE_START;
    const safePosition = (point: VillagePoint): VillagePoint =>
      villageCanWalk(point)
        ? { ...point }
        : (villagePath(VILLAGE_START, point).at(-1) ?? { ...VILLAGE_START });
    let position: VillagePoint = safePosition(
      latest.current.initialPosition ?? networkStart,
    );
    target.set(position.x, 0, position.z - 1.2);
    desiredTarget.copy(target);
    let path: VillagePoint[] = [];
    let entryIntent: VillagePlace | null = null;
    let lastEntranceCheck = -1000;
    let width = host.clientWidth,
      height = host.clientHeight;
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
      if (end) marker.position.set(end.x, 0.19, end.z);
      follow = true;
      desiredZoom = Math.max(desiredZoom, followZoom);
      host.focus({ preventScroll: true });
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
        follow = true;
        desiredZoom = Math.max(desiredZoom, followZoom);
      },
      enter: (place) => {
        requestedPlace.current = place;
        if (villageCanEnterPlace(place, latest.current.save.actor))
          goTo(place.entry, place);
        else goTo(place.entry);
        follow = true;
        desiredZoom = Math.max(desiredZoom, followZoom);
      },
      zoom: (delta) => {
        desiredZoom = THREE.MathUtils.clamp(
          desiredZoom + delta,
          0.8,
          Math.max(8, followZoom * 1.7),
        );
      },
      home: () => {
        follow = true;
        desiredZoom = followZoom;
      },
      overview: () => {
        follow = false;
        desiredTarget.set(0, 0, 0);
        desiredZoom = 1;
      },
    };

    // Reuse the room's actual GLB furniture as an outdoor reading terrace.
    const loader = new GLTFLoader();
    const assets = [
      {
        id: 'sofa',
        url: LOUNGE_MODELS.sofa,
        x: -8.7,
        z: 7.1,
        y: 0.39,
        w: 2.6,
        h: 1.65,
        d: 1.15,
      },
      {
        id: 'table',
        url: LOUNGE_MODELS.coffeeTable,
        x: -8.7,
        z: 8.55,
        y: 0.39,
        w: 1.65,
        h: 0.76,
        d: 0.8,
      },
      {
        id: 'tulips',
        url: LOUNGE_MODELS.tulips,
        x: -8.95,
        z: 8.55,
        y: 1.01,
        w: 0.46,
        h: 0.6,
        d: 0.45,
      },
      {
        id: 'chair',
        url: LOUNGE_MODELS.chair,
        x: -6.4,
        z: 8,
        y: 0.39,
        w: 0.85,
        h: 1.4,
        d: 0.85,
        r: -Math.PI / 2,
      },
      {
        id: 'bookshelf',
        url: LOUNGE_MODELS.bookshelf,
        x: -6.1,
        z: 6.9,
        y: 0.39,
        w: 0.85,
        h: 1.75,
        d: 0.5,
      },
    ];
    const modelJobs = assets.map(async (item) => {
      const gltf = await loader.loadAsync(item.url);
      if (disposed) {
        disposeScene(gltf.scene);
        return;
      }
      const object = gltf.scene;
      object.rotation.y = item.r ?? 0;
      object.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object),
        size = bounds.getSize(new THREE.Vector3());
      const scale = Math.min(item.w / size.x, item.h / size.y, item.d / size.z);
      if (!Number.isFinite(scale) || scale <= 0) {
        disposeScene(object);
        throw new Error('Invalid village prop');
      }
      object.scale.multiplyScalar(scale);
      object.updateMatrixWorld(true);
      bounds.setFromObject(object);
      const center = bounds.getCenter(new THREE.Vector3());
      object.position.set(
        item.x - center.x,
        item.y - bounds.min.y,
        item.z - center.z,
      );
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(object);
      renderer.shadowMap.needsUpdate = true;
      host.dataset[item.id] = 'loaded';
      host.dataset.modelsLoaded = String(
        Number(host.dataset.modelsLoaded ?? 0) + 1,
      );
    });

    type Figure = {
      group: THREE.Group;
      sprite: THREE.Sprite;
      texture: THREE.CanvasTexture;
      canvas: HTMLCanvasElement;
      point: VillagePoint;
      last: string;
      drawn: number;
      actor: number;
      walking: boolean;
      phase: number;
      facing: 1 | -1;
    };
    const figures = new Map<string, Figure>();
    let sprites: Awaited<ReturnType<typeof loungeSprites>> | null = null;
    const sourceModels = new Map<string, Promise<THREE.Group | null>>();
    const placeOriginal = async (
      url: string,
      id: string,
      point: VillagePoint,
      w: number,
      d: number,
      h: number,
      fallback?: string,
    ) => {
      let pending = sourceModels.get(url);
      if (!pending) {
        pending = loader.loadAsync(url).then((gltf) => {
          if (disposed) {
            disposeScene(gltf.scene);
            return null;
          }
          return gltf.scene;
        });
        sourceModels.set(url, pending);
      }
      const source = await pending;
      if (!source || disposed) return;
      const object = source.clone(true);
      const bounds = new THREE.Box3().setFromObject(object),
        size = bounds.getSize(new THREE.Vector3());
      const scale = Math.min(w / size.x, d / size.z, h / size.y);
      if (!Number.isFinite(scale) || scale <= 0)
        throw new Error('Invalid kArchive model bounds');
      object.scale.multiplyScalar(scale);
      object.updateMatrixWorld(true);
      bounds.setFromObject(object);
      const center = bounds.getCenter(new THREE.Vector3());
      object.position.set(
        point.x - center.x,
        0.16 - bounds.min.y,
        point.z - center.z,
      );
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(object);
      if (fallback) {
        const original = scene.getObjectByName(fallback);
        if (original) original.visible = false;
      }
      renderer.shadowMap.needsUpdate = true;
      host.dataset[id] = 'loaded';
      host.dataset.originalsLoaded = String(
        Number(host.dataset.originalsLoaded ?? 0) + 1,
      );
    };
    const houseModels = [
      LOUNGE_MODELS.cornerHouse,
      LOUNGE_MODELS.cottage,
      LOUNGE_MODELS.courtyardHouse,
    ];
    const originalJobs = VILLAGE_PLACES.filter(
      (place) => place.kind === 'home',
    ).flatMap((place) => [
      placeOriginal(
        houseModels[place.actor! % 3],
        `house${place.actor}`,
        place,
        place.width,
        place.depth,
        4.8,
        'village-building-' + place.id,
      ),
      placeOriginal(
        LOUNGE_MODELS.hydrangea,
        `garden${place.actor}`,
        { x: place.x + 1.85, z: place.z + 2.9 },
        0.9,
        0.8,
        0.85,
      ),
    ]);
    for (const [i, point] of VILLAGE_ORCHARD.entries())
      originalJobs.push(
        placeOriginal(
          LOUNGE_MODELS.fruitTree,
          `fruitTree${i}`,
          point,
          2.8,
          2.8,
          4,
        ),
      );
    for (const prop of VILLAGE_FURNISHINGS)
      originalJobs.push(
        placeOriginal(
          LOUNGE_MODELS[prop.model],
          prop.id,
          prop,
          prop.width,
          prop.depth,
          prop.height,
        ),
      );
    const spritesJob = loungeSprites().then(async (value) => {
      if (!disposed) sprites = value;
      if (
        !disposed &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        const save = latest.current.save;
        await value.warmMotion(save.actor, save.looks[save.actor]).catch(() => {
          /* The existing wardrobe remains usable when optional motion art is offline. */
        });
      }
    });
    void Promise.allSettled([...modelJobs, ...originalJobs, spritesJob]).then(
      (results) => {
        if (disposed || contextLost) return;
        assetsReady = true;
        setState(
          results.at(-1)?.status === 'rejected'
            ? 'unavailable'
            : results.some((r) => r.status === 'rejected')
              ? 'partial'
              : 'ready',
        );
      },
    );
    const createFigure = (p: LoungePlayer): Figure => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 320;
      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.12,
          depthWrite: true,
          toneMapped: false,
        }),
      );
      sprite.center.set(0.5, 0.03);
      sprite.scale.set(1.5, 1.88, 1);
      sprite.position.y = 0.18;
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.42, 20),
        new THREE.MeshBasicMaterial({
          color: '#45573c',
          transparent: true,
          opacity: 0.19,
          depthWrite: false,
        }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.165;
      shadow.scale.y = 0.65;
      const group = new THREE.Group();
      group.add(sprite, shadow);
      if (p.id === latest.current.self) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.49, 0.63, 40),
          new THREE.MeshBasicMaterial({
            color: '#ffe4a0',
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.18;
        group.add(ring);
      }
      scene.add(group);
      const npc = p.id.startsWith('friend-');
      const entry =
        VILLAGE_PLACES.find((place) => place.actor === p.actor)?.entry ??
        VILLAGE_START;
      const point = npc ? entry : villageFromNetwork(p);
      return {
        group,
        sprite,
        texture,
        canvas: c,
        point: safePosition(point),
        last: '',
        drawn: -1000,
        actor: p.actor,
        walking: false,
        phase: 0,
        facing: 1,
      };
    };

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
    let locomotion: LocomotionState = { phase: 0, facing: 1 };
    const down = (e: PointerEvent) => {
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
    const up = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.id) return;
      if (!press.dragged) {
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
    const cancel = () => {
      press = null;
    };
    const lostCapture = (e: PointerEvent) => {
      if (press?.id === e.pointerId) press = null;
    };
    const keydown = (e: KeyboardEvent) => {
      if (
        e.target instanceof Element &&
        e.target.closest('button,input,textarea,select')
      )
        return;
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        document.querySelector('dialog[open]')
      )
        return;
      if (e.key === 'Enter' || e.key.toLowerCase() === 'e') {
        const entrance = villageNearbyEntrance(
          position,
          latest.current.save.actor,
        );
        if (entrance?.canEnter) {
          e.preventDefault();
          entryIntent = null;
          requestedPlace.current = entrance.place;
          latest.current.onEnter(entrance.place.destination, entrance.place);
        }
        return;
      }
      const direction = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
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
      const d = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
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
      if (e.key !== 'Shift' || e.repeat) return;
      shiftHeld.current = true;
      setRunPressed(true);
    };
    const visibilityChanged = () => {
      if (document.hidden) blur();
    };
    const loss = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frame);
      setState('unavailable');
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', drag);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', cancel);
    canvas.addEventListener('lostpointercapture', lostCapture);
    canvas.addEventListener('webglcontextlost', loss);
    host.addEventListener('keydown', keydown);
    host.addEventListener('keydown', keyrun);
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
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) blur();
    });
    visibility.observe(host);
    let previous = 0,
      lastRender = -1000,
      lastSend = -1000,
      lastData = -1000;
    let lastSent = { ...position },
      wasWalking = false;
    const projected = new THREE.Vector3();
    const animate = (now: number) => {
      if (disposed || contextLost) return;
      frame = requestAnimationFrame(animate);
      const dt = previous ? Math.min((now - previous) / 1000, 0.08) : 0;
      previous = now;
      // Let image decoding finish before compiling and drawing the full world.
      // This avoids competing with asset loading on phones and software WebGL.
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
          speed = ((run ? 5.2 * RUN_SPEED_MULTIPLIER : 5.2) * dt) / len;
        // Camera-right and ground-forward vectors keep arrow keys aligned with the screen.
        position = villageStep(
          position,
          (h * 0.837 + v * 0.547) * speed,
          (v * 0.837 - h * 0.547) * speed,
        );
      } else if (path.length) {
        const to = path[0],
          dx = to.x - position.x,
          dz = to.z - position.z,
          distance = Math.hypot(dx, dz);
        if (distance < 0.06) path.shift();
        else {
          const step = Math.min(
            distance,
            5.2 * (run ? RUN_SPEED_MULTIPLIER : 1) * dt,
          );
          position = villageStep(
            position,
            (dx / distance) * step,
            (dz / distance) * step,
          );
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
          5.2,
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
      if (follow) desiredTarget.set(position.x, 0, position.z - 1.2);
      target.lerp(desiredTarget, reduced.matches ? 1 : Math.min(1, dt * 5));
      zoom +=
        (desiredZoom - zoom) * (reduced.matches ? 1 : Math.min(1, dt * 6));
      camera.position.copy(target).add(offset);
      camera.lookAt(target);
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      const current = latest.current;
      const residents = current.players.filter(
        (p) => p.id === current.self || p.area === 'lounge',
      );
      const residentIds = new Set(residents.map((p) => p.id));
      for (const [id, figure] of figures)
        if (!residentIds.has(id)) {
          scene.remove(figure.group);
          disposeScene(figure.group);
          figures.delete(id);
        }
      for (const p of residents) {
        let figure = figures.get(p.id);
        if (!figure) {
          figure = createFigure(p);
          figures.set(p.id, figure);
        }
        const own = p.id === current.self;
        let moving = walking && own,
          motion: 'walk' | 'run' | 'idle' =
            own && walking ? playerMotion.motion : 'idle',
          phase = own ? locomotion.phase : figure.phase,
          facing: 1 | -1 = own ? locomotion.facing : figure.facing;
        if (own) figure.point = position;
        else if (!p.id.startsWith('friend-')) {
          const point = villageFromNetwork(p);
          if (villageCanWalk(point)) {
            const beforeRemote = figure.point;
            figure.point = villageStep(
              figure.point,
              (point.x - figure.point.x) * Math.min(1, dt * 9),
              (point.z - figure.point.z) * Math.min(1, dt * 9),
            );
            const remoteX = figure.point.x - beforeRemote.x,
              remoteZ = figure.point.z - beforeRemote.z,
              remoteDistance = Math.hypot(remoteX, remoteZ),
              remoteMotion = advanceLocomotion(
                { phase: figure.phase, facing: figure.facing },
                {
                  distance: remoteDistance,
                  horizontal: remoteX * 0.837 - remoteZ * 0.547,
                },
                remoteDistance / Math.max(dt, 0.001) > 5.2 * 1.3
                  ? 'run'
                  : 'walk',
                5.2,
              );
            moving = remoteMotion.motion !== 'idle';
            phase = remoteMotion.state.phase;
            facing = remoteMotion.state.facing;
            figure.phase = phase;
            figure.facing = facing;
            motion = remoteMotion.motion;
          }
        }
        if (own) {
          figure.phase = locomotion.phase;
          figure.facing = locomotion.facing;
        }
        figure.walking = moving;
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
        const key = JSON.stringify([p.actor, p.look, motion, facing]);
        if (
          sprites &&
          (key !== figure.last || now - figure.drawn > (moving ? 70 : 300))
        ) {
          const changed = sprites.draw(
            figure.canvas,
            p.actor,
            p.look,
            motion,
            phase,
            false,
            reduced.matches,
            { facing },
          );
          if (changed) figure.texture.needsUpdate = true;
          figure.last = key;
          figure.drawn = now;
        }
      }
      if (now - lastData > 100) {
        for (const place of VILLAGE_PLACES) {
          const label = labelsRef.current?.querySelector<HTMLElement>(
            `[data-place="${place.id}"]`,
          );
          if (!label) continue;
          projected
            .set(place.x, place.kind === 'home' ? 4.5 : 5.9, place.z)
            .project(camera);
          const x = ((projected.x + 1) * width) / 2,
            y = ((1 - projected.y) * height) / 2;
          label.style.transform = `translate(${x}px,${y}px) translate(-50%,-100%)`;
          label.style.visibility =
            projected.z < 1 &&
            x > 20 &&
            x < width - 20 &&
            y > 10 &&
            y < height - 60
              ? 'visible'
              : 'hidden';
        }
        const tag =
          labelsRef.current?.querySelector<HTMLElement>('[data-self-label]');
        if (tag) {
          projected.set(position.x, 2.3, position.z).project(camera);
          tag.style.transform = `translate(${((projected.x + 1) * width) / 2}px,${((1 - projected.y) * height) / 2}px) translate(-50%,-100%)`;
        }
        miniSelfRef.current?.setAttribute('cx', String(position.x));
        miniSelfRef.current?.setAttribute('cy', String(position.z));
        if (routeRef.current)
          routeRef.current.textContent = path.length
            ? '길을 따라 이동 중 · 방향키로 직접 걷기'
            : '도착했어요 · 주변을 자유롭게 둘러보세요';
        Object.assign(host.dataset, {
          follow: String(follow),
          actorPixels: (
            (1.88 * zoom * height) /
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
          residents: String(residents.length),
        });
        lastData = now;
      }
      if (
        now - lastRender >
        (walking ||
        [...figures.values()].some((figure) => figure.walking) ||
        press ||
        Math.abs(zoom - desiredZoom) > 0.01 ||
        target.distanceToSquared(desiredTarget) > 0.0001
          ? 32
          : 250)
      ) {
        renderer.render(scene, camera);
        lastRender = now;
        host.dataset.drawCalls = String(renderer.info.render.calls);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      controls.current = null;
      activeDirections.clear();
      observer.disconnect();
      visibility.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', drag);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('lostpointercapture', lostCapture);
      canvas.removeEventListener('webglcontextlost', loss);
      host.removeEventListener('keydown', keydown);
      host.removeEventListener('keydown', keyrun);
      host.removeEventListener('focusout', blur);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibilityChanged);
      disposeScene(scene);
      sun.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return (
    <section className="hv-village" aria-label="범타듀 밸리 마을">
      <div className="hv-heading">
        <div>
          <span className="hv-eyebrow">
            <Trees size={15} /> BEOMDEW VALLEY
          </span>
          <h1>범타듀 밸리</h1>
          <p>일곱 친구의 골목에서 숲과 강 너머까지.</p>
        </div>
        <span className="hv-weather">
          <Sun size={20} />
          <span>
            산책하기 좋은 날<small>우리들의 범타듀 밸리</small>
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
              >
                <span
                  className="hv-place-dot"
                  style={{ background: place.roofColor }}
                />
                <span>{place.name}</span>
                {place.actor === props.save.actor && <small>내 집</small>}
              </button>
            ))}
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
          {state === 'unavailable' && (
            <section
              className="hv-fallback"
              aria-live="polite"
              aria-labelledby="hv-fallback-title"
            >
              <Trees size={32} />
              <h2 id="hv-fallback-title">마을 안내소</h2>
              <p>
                이 기기에서는 입체 풍경을 열지 못했어요.
                <br />
                아래에서 원하는 장소로 바로 들어갈 수 있어요.
              </p>
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
          <button onClick={props.onFriends}>
            <Users size={17} />
            <span>친구 초대</span>
          </button>
          <button onClick={props.onRequest}>
            <Send size={16} />
            <span>게임 현황</span>
          </button>
        </div>
        <button
          className="hv-minimap"
          onClick={() => controls.current?.overview()}
          aria-label="미니맵으로 전체 보기"
        >
          <span>
            <MapIcon size={12} /> 범타듀 밸리 <small>내 위치</small>
          </span>
          <svg
            viewBox={[
              -VILLAGE_BOUNDS.width / 2 - 2,
              -VILLAGE_BOUNDS.depth / 2 - 2,
              VILLAGE_BOUNDS.width + 4,
              VILLAGE_BOUNDS.depth + 4,
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
            <path
              d="M-32 5 H32 M0 -26 V26 M-27 5 V24 H27 V5"
              fill="none"
              stroke="#f7efd1"
              strokeWidth="2"
            />
            <rect
              x={-VILLAGE_BOUNDS.width / 2}
              y={VILLAGE_RIVER.minZ}
              width={VILLAGE_BOUNDS.width}
              height={VILLAGE_RIVER.maxZ - VILLAGE_RIVER.minZ}
              fill="#96c9c2"
            />
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
              />
            ))}
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
        {state !== 'unavailable' && (
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
        {district && !nearby && (
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
        {nearby && state !== 'unavailable' && (
          <section
            className="hv-entry-prompt"
            aria-label={`${nearby.place.name} 입구`}
            aria-live="polite"
            data-testid="village-entry-prompt"
            data-place={nearby.place.id}
            data-entry-ready={String(nearby.canEnter)}
          >
            <div>
              <strong>{nearby.place.name}</strong>
              <small>
                {nearby.canEnter
                  ? 'E 또는 Enter를 눌러 들어가기'
                  : '주민의 집이에요. 집 앞에서 인사해요.'}
              </small>
            </div>
            {nearby.canEnter ? (
              <button
                type="button"
                onClick={() => controls.current?.enter(nearby.place)}
              >
                들어가기 <ArrowRight size={15} />
              </button>
            ) : (
              <span>방문 불가</span>
            )}
          </section>
        )}
        {selected && !nearby && (
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
          <span>BEOMDEW</span>
          <small>작은 집들이 모여, 우리의 동네</small>
        </div>
      </div>
      <div className="hv-bottom">
        <span>
          <Footprints size={15} />
          바닥을 눌러 걷기 <i>·</i> 드래그로 둘러보기 <i>·</i> 방향키 / WASD
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
