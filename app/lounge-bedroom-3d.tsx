'use client';

// This application surface must receive keyboard focus for directional walking.
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Footprints,
  LoaderCircle,
  Palette,
  Sun,
} from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { loungeSprites } from './lounge-sprites';
import { LOUNGE_MODELS } from './lounge-model-assets';
import { defaultBedroom } from './lounge-bedroom-data';
import type { LoungeSave } from './lounge-look';
import { ACTORS } from './theater-data';
import {
  WALK_FURNITURE,
  WALK_START,
  findWalkPath,
  walkStep,
  type WalkPoint,
} from './lounge-bedroom-navigation';
import './lounge-bedroom-3d.css';

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
const WALL_COLOR = {
  cream: '#e9decd',
  sage: '#bfc9b5',
  blush: '#dfc2bb',
  blue: '#bed0d6',
};
const FLOOR_COLOR = { oak: '#b99368', walnut: '#88664e', pale: '#d7c6a8' };

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material)
      for (const material of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]) {
        materials.add(material);
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) textures.add(value);
      }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const texture of textures) {
    texture.dispose();
    const source = texture.source.data;
    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap)
      source.close();
  }
  for (const material of materials) material.dispose();
}

/** An intentionally separate walk room, sharing only the account's look and finishes. */
export function Bedroom3D({
  save,
  onDecorate,
}: {
  save: LoungeSave;
  onDecorate: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const directions = useRef(new Set<Direction>());
  const latest = useRef(save);
  useLayoutEffect(() => {
    latest.current = save;
  }, [save]);
  const [state, setState] = useState<
    'loading' | 'ready' | 'partial' | 'unavailable'
  >('loading');
  const [message, setMessage] = useState('방에 햇살을 들이는 중…');
  const room = save.bedroom ?? defaultBedroom(save.actor);
  const paint = useRef<{
    wall: THREE.MeshStandardMaterial;
    floor: THREE.MeshStandardMaterial[];
  } | null>(null);

  useEffect(() => {
    if (paint.current) {
      paint.current.wall.color.set(WALL_COLOR[room.wall]);
      paint.current.floor.forEach((material, index) =>
        material.color
          .set(FLOOR_COLOR[room.floor])
          .offsetHSL(0, 0, ((index % 3) - 1) * 0.018),
      );
    }
  }, [room.wall, room.floor]);

  useEffect(() => {
    const host = hostRef.current!;
    const pressed = directions.current;
    let disposed = false,
      frame = 0,
      visible = true,
      contextFailed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
    } catch {
      queueMicrotask(() => {
        if (!disposed) {
          setState('unavailable');
          setMessage(
            '이 기기에서는 입체 방을 열 수 없어요. 꾸미기는 계속 이용할 수 있어요.',
          );
        }
      });
      return () => {
        disposed = true;
      };
    }
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-6, 6, 4.8, -4.8, 0.1, 60);
    camera.position.set(10, 8.8, 12);
    camera.lookAt(0, 1.08, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // Only static geometry casts shadows; a contact shadow follows the sprite.
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    const canvas = renderer.domElement;
    canvas.className = 'b3-canvas';
    canvas.setAttribute(
      'aria-label',
      `${ACTORS[latest.current.actor]}의 입체 방. 바닥을 누르거나 방향키로 걸어 보세요.`,
    );
    canvas.setAttribute('role', 'img');
    host.insertBefore(canvas, host.firstChild);

    const materials = new Map<string, THREE.MeshStandardMaterial>();
    const material = (color: string, roughness = 0.85) => {
      const key = color + roughness;
      if (!materials.has(key))
        materials.set(
          key,
          new THREE.MeshStandardMaterial({ color, roughness }),
        );
      return materials.get(key)!;
    };
    const box = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      color: string | THREE.Material,
      parent: THREE.Object3D = scene,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        typeof color === 'string' ? material(color) : color,
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const cylinder = (
      top: number,
      bottom: number,
      height: number,
      x: number,
      y: number,
      z: number,
      color: string,
      parent: THREE.Object3D = scene,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(top, bottom, height, 28),
        material(color),
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };
    const sphere = (
      radius: number,
      x: number,
      y: number,
      z: number,
      color: string,
      parent: THREE.Object3D = scene,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 20, 12),
        material(color),
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      parent.add(mesh);
      return mesh;
    };

    scene.add(new THREE.HemisphereLight('#fff5df', '#9d8174', 2.5));
    const sun = new THREE.DirectionalLight('#fff0ce', 3.2);
    sun.position.set(-3, 8, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      left: -7,
      right: 7,
      top: 7,
      bottom: -7,
      near: 0.1,
      far: 25,
    });
    sun.shadow.normalBias = 0.025;
    sun.shadow.bias = -0.00015;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#d9e8f3', 1.3);
    fill.position.set(5, 5, -3);
    scene.add(fill);

    const finishes =
      latest.current.bedroom ?? defaultBedroom(latest.current.actor);
    const wall = new THREE.MeshStandardMaterial({
      color: WALL_COLOR[finishes.wall],
      roughness: 0.96,
    });
    const floors = Array.from(
      { length: 5 },
      (_, index) =>
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(FLOOR_COLOR[finishes.floor]).offsetHSL(
            0,
            0,
            ((index % 3) - 1) * 0.018,
          ),
          roughness: 0.86,
        }),
    );
    paint.current = { wall, floor: floors };
    box(8.28, 0.28, 6.88, 0, -0.19, 0, '#8c725b');
    const plankGeometry = new THREE.BoxGeometry(1.99, 0.065, 0.289);
    for (let color = 0; color < floors.length; color++) {
      const matrices: THREE.Matrix4[] = [];
      for (let strip = 0; strip < 22; strip++)
        for (let plank = 0; plank < 4; plank++) {
          if ((strip + plank * 2) % floors.length === color)
            matrices.push(
              new THREE.Matrix4().makeTranslation(
                -3 + plank * 2,
                -0.016,
                -3.3 + strip * 0.3 + 0.15,
              ),
            );
        }
      const planks = new THREE.InstancedMesh(
        plankGeometry,
        floors[color],
        matrices.length,
      );
      matrices.forEach((matrix, index) => planks.setMatrixAt(index, matrix));
      planks.receiveShadow = true;
      scene.add(planks);
    }
    box(8.25, 3.55, 0.17, 0, 1.73, -3.37, wall);
    box(0.17, 3.55, 6.75, -4.08, 1.73, -0.03, wall);
    box(8.1, 0.16, 0.1, 0, 0.13, -3.25, '#f0e7d5');
    box(0.1, 0.16, 6.6, -3.97, 0.13, 0, '#f0e7d5');
    box(8.32, 0.09, 0.25, 0, 3.51, -3.37, '#ede3d1');
    box(0.25, 0.09, 6.82, -4.08, 3.51, 0, '#ede3d1');

    // A sunlit window with mullions, sill and gathered curtains.
    const sky = new THREE.MeshBasicMaterial({ color: '#d8e8d8' });
    box(2.48, 1.7, 0.08, -1.28, 2.22, -3.24, '#b3916e');
    box(2.23, 1.48, 0.1, -1.28, 2.22, -3.17, sky);
    for (const x of [-2.41, -1.28, -0.15])
      box(0.065, 1.6, 0.13, x, 2.22, -3.1, '#f7efdc');
    for (const y of [1.44, 2.22, 3])
      box(2.33, 0.065, 0.13, -1.28, y, -3.1, '#f7efdc');
    box(2.72, 0.11, 0.32, -1.28, 1.37, -3.05, '#f1e4ce');
    for (const x of [-2.67, 0.1])
      for (let i = 0; i < 4; i++)
        cylinder(0.082, 0.11, 1.85, x + i * 0.095, 2.12, -2.99, '#ede2cf');
    box(3.18, 0.065, 0.1, -1.14, 3.12, -2.97, '#936f50');
    // Door in the left wall, with inset panels and a brass handle.
    box(0.12, 2.48, 1.16, -3.96, 1.25, 1.94, '#ac8661');
    box(0.15, 2.3, 0.98, -3.87, 1.2, 1.94, '#c5a77f');
    for (const y of [0.67, 1.69])
      box(0.03, 0.78, 0.73, -3.78, y, 1.94, '#d2b58e');
    sphere(0.054, -3.7, 1.17, 2.29, '#b98f47');

    const furniture = Object.fromEntries(
      WALK_FURNITURE.map((item) => [item.id, item]),
    );
    const bed = furniture.bed;
    box(1.85, 0.3, 2.65, bed.x, 0.24, bed.z, '#ab7959');
    box(1.85, 1.05, 0.13, bed.x, 0.65, bed.z - 1.23, '#ac886a');
    box(1.72, 0.27, 2.47, bed.x, 0.52, bed.z, '#f0e8d7');
    box(1.77, 0.19, 1.78, bed.x, 0.72, bed.z + 0.33, '#bc9c96');
    box(1.8, 0.08, 0.44, bed.x, 0.84, bed.z - 0.3, '#d4b6ae');
    box(1.83, 0.44, 0.08, bed.x, 0.52, bed.z + 1.23, '#bc9c96');
    for (const x of [bed.x - 0.4, bed.x + 0.4]) {
      const pillow = sphere(0.38, x, 0.83, bed.z - 0.82, '#faf3e5');
      pillow.scale.set(1, 0.27, 0.72);
    }
    // Wool rug, low table and a reading desk.
    box(3.45, 0.028, 2.9, 0.07, 0.039, 0.95, '#d7c9a8');
    for (let i = 0; i < 12; i++)
      box(3.31, 0.007, 0.013, 0.07, 0.057, -0.38 + i * 0.24, '#c3b794');
    const table = furniture.table;
    box(table.width, 0.13, table.depth, table.x, 0.62, table.z, '#c59b6d');
    for (const dx of [-0.58, 0.58])
      for (const dz of [-0.22, 0.22])
        box(0.08, 0.52, 0.08, table.x + dx, 0.32, table.z + dz, '#a57e54');
    box(0.36, 0.055, 0.26, table.x + 0.4, 0.73, table.z + 0.1, '#657a6d');
    box(0.32, 0.045, 0.23, table.x + 0.36, 0.78, table.z + 0.12, '#d7b380');
    const desk = furniture.desk;
    box(desk.width, 0.12, desk.depth, desk.x, 1.01, desk.z, '#b88d62');
    for (const dx of [-0.53, 0.53])
      for (const dz of [-0.31, 0.31])
        box(0.07, 0.96, 0.07, desk.x + dx, 0.5, desk.z + dz, '#8a674a');
    box(0.39, 0.018, 0.29, desk.x, 1.09, desk.z + 0.04, '#f2e8d3');
    cylinder(0.12, 0.14, 0.055, desk.x - 0.4, 1.1, desk.z - 0.2, '#c59a57');
    cylinder(0.018, 0.018, 0.5, desk.x - 0.4, 1.35, desk.z - 0.2, '#b78b4a');
    cylinder(0.12, 0.23, 0.25, desk.x - 0.4, 1.62, desk.z - 0.2, '#e4cca0');
    const lamp = new THREE.PointLight('#ffd58c', 1.4, 2.3);
    lamp.position.set(desk.x - 0.4, 1.49, desk.z - 0.2);
    scene.add(lamp);
    const shelf = furniture.shelf;
    box(0.1, 2.26, 1.58, -3.93, 1.15, shelf.z, '#ae8963');
    for (const z of [shelf.z - 0.77, shelf.z + 0.77])
      box(0.41, 2.26, 0.065, shelf.x, 1.15, z, '#bd976e');
    for (const y of [0.16, 0.78, 1.4, 2.03, 2.28])
      box(0.44, 0.07, 1.6, shelf.x, y, shelf.z, '#bd976e');
    for (let row = 0; row < 3; row++)
      for (let book = 0; book < 6; book++)
        box(
          0.25,
          0.29 + (book % 3) * 0.055,
          0.105,
          -3.62,
          0.35 + row * 0.62,
          -2.05 + book * 0.17,
          ['#718679', '#b87767', '#d2b684', '#877d94'][book % 4],
        );
    // Framed print and a small clock above the bed.
    box(0.8, 0.99, 0.075, 2.31, 2.43, -3.23, '#ad8664');
    box(0.67, 0.85, 0.018, 2.31, 2.43, -3.18, '#eee1c4');
    const print = sphere(0.2, 2.32, 2.52, -3.15, '#d1a56e');
    print.scale.z = 0.035;
    box(0.42, 0.065, 0.015, 2.31, 2.17, -3.14, '#99a584');
    const clockFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.23, 40),
      material('#f0e7d5'),
    );
    clockFace.position.set(0.96, 2.77, -3.24);
    scene.add(clockFace);
    box(0.022, 0.16, 0.02, 0.96, 2.84, -3.2, '#705e4b');
    box(0.13, 0.02, 0.02, 1.01, 2.77, -3.2, '#705e4b');
    const plant = furniture.plant;
    cylinder(0.26, 0.2, 0.46, plant.x, 0.25, plant.z, '#c99c7b');
    for (let i = 0; i < 7; i++) {
      const angle = i * 2.4;
      const leaf = sphere(
        0.22,
        plant.x + Math.cos(angle) * 0.18,
        0.74 + (i % 3) * 0.16,
        plant.z + Math.sin(angle) * 0.18,
        ['#768a65', '#8b9b71', '#5f795c'][i % 3],
      );
      leaf.scale.set(0.72, 1.45, 0.55);
      leaf.rotation.z = Math.cos(angle) * 0.5;
    }

    // Place model geometry from bounds, never trusting source pivots or unit scale.
    const loader = new GLTFLoader();
    const placeModel = async (
      url: string,
      target: {
        x: number;
        y: number;
        z: number;
        maxWidth: number;
        maxDepth: number;
        maxHeight: number;
      },
      id: string,
    ) => {
      const gltf = await loader.loadAsync(url);
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }
      const object = gltf.scene;
      let textured = false;
      object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        for (const value of Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]) {
          const surface = value as THREE.MeshStandardMaterial;
          const image = surface.map?.image as { width?: number } | undefined;
          if (typeof image?.width === 'number' && image.width > 0) textured = true;
        }
      });
      // GLTFLoader can resolve geometry after a texture request fails. These two
      // curated models both require their embedded colour maps to be complete.
      if (!textured) {
        disposeObject(object);
        throw new Error('The room model colour texture could not be loaded.');
      }
      object.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object),
        size = bounds.getSize(new THREE.Vector3());
      const scale = Math.min(
        target.maxWidth / Math.max(size.x, 0.001),
        target.maxDepth / Math.max(size.z, 0.001),
        target.maxHeight / Math.max(size.y, 0.001),
      );
      object.scale.multiplyScalar(scale);
      object.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(object),
        center = fitted.getCenter(new THREE.Vector3());
      object.position.add(
        new THREE.Vector3(
          target.x - center.x,
          target.y - fitted.min.y,
          target.z - center.z,
        ),
      );
      object.name = id;
      object.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      scene.add(object);
      renderer.shadowMap.needsUpdate = true;
      host.dataset[id] = 'loaded';
      host.dataset[id + 'Texture'] = 'loaded';
    };
    const sofa = furniture.sofa;
    const sofaFallback = new THREE.Group();
    scene.add(sofaFallback);
    box(2.68, 0.39, 1.04, sofa.x, 0.43, sofa.z, '#b3b9a2', sofaFallback);
    box(2.68, 0.6, 0.2, sofa.x, 0.88, sofa.z - 0.42, '#a4ad96', sofaFallback);
    for (const dx of [-1.25, 1.25])
      box(0.2, 0.48, 1.04, sofa.x + dx, 0.74, sofa.z, '#a4ad96', sofaFallback);
    const modelPromises = [
      placeModel(
        LOUNGE_MODELS.sofa,
        {
          x: sofa.x,
          y: 0.055,
          z: sofa.z,
          maxWidth: 2.72,
          maxDepth: 1.12,
          maxHeight: 1.25,
        },
        'sofa',
      ).then(() => {
        if (!disposed) {
          scene.remove(sofaFallback);
          disposeObject(sofaFallback);
          renderer.shadowMap.needsUpdate = true;
        }
      }),
      placeModel(
        LOUNGE_MODELS.tulips,
        {
          x: table.x - 0.28,
          y: 0.7,
          z: table.z,
          maxWidth: 0.55,
          maxDepth: 0.48,
          maxHeight: 0.67,
        },
        'tulips',
      ),
    ];

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 440;
    spriteCanvas.height = 540;
    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);
    spriteTexture.colorSpace = THREE.SRGBColorSpace;
    spriteTexture.minFilter = THREE.LinearFilter;
    spriteTexture.generateMipmaps = false;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: spriteTexture,
        transparent: true,
        alphaTest: 0.12,
        depthTest: true,
        depthWrite: true,
        toneMapped: false,
      }),
    );
    sprite.center.set(0.5, 0.03);
    sprite.scale.set(1.58, 1.94, 1);
    scene.add(sprite);
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.27, 32),
      new THREE.MeshBasicMaterial({
        color: '#514834',
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(1, 0.6, 1);
    scene.add(shadow);
    const destination = new THREE.Mesh(
      new THREE.RingGeometry(0.13, 0.17, 32),
      new THREE.MeshBasicMaterial({
        color: '#f7f0cd',
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    destination.rotation.x = -Math.PI / 2;
    destination.visible = false;
    scene.add(destination);
    let position = { ...WALK_START },
      path: WalkPoint[] = [];
    let sprites: Awaited<ReturnType<typeof loungeSprites>> | null = null;
    const spritesPromise = loungeSprites().then((value) => {
      sprites = value;
    });
    void Promise.allSettled([...modelPromises, spritesPromise]).then(
      (results) => {
        if (disposed || contextFailed) return;
        if (results[2].status === 'rejected') {
          setState('unavailable');
          setMessage(
            '캐릭터 그림을 불러오지 못했어요. 꾸미기로 돌아갔다가 다시 열어 주세요.',
          );
        } else if (results.some((result) => result.status === 'rejected')) {
          setState('partial');
          setMessage(
            '일부 소품을 불러오지 못했어요. 기본 방에서 산책할 수 있어요.',
          );
        } else {
          setState('ready');
          setMessage('바닥을 누르면 그곳으로 걸어가요.');
        }
      },
    );

    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.06);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const rayPoint = new THREE.Vector3();
    const onPointer = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      host.focus({ preventScroll: true });
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.ray.intersectPlane(ground, rayPoint);
      if (!hit || Math.abs(hit.x) > 4.2 || Math.abs(hit.z) > 3.5) return;
      path = findWalkPath(position, { x: hit.x, z: hit.z });
      const last = path.at(-1);
      destination.visible = Boolean(last);
      if (last) {
        destination.position.set(last.x, 0.07, last.z);
      }
    };
    const keydown = (event: KeyboardEvent) => {
      const direction = KEYS[event.key] ?? KEYS[event.key.toLowerCase()];
      if (
        !direction ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        document.querySelector('dialog[open]')
      )
        return;
      event.preventDefault();
      pressed.add(direction);
      path = [];
      destination.visible = false;
    };
    const keyup = (event: KeyboardEvent) => {
      const direction = KEYS[event.key] ?? KEYS[event.key.toLowerCase()];
      if (direction) pressed.delete(direction);
    };
    const blur = () => pressed.clear();
    const contextLost = (event: Event) => {
      event.preventDefault();
      if (!disposed) {
        contextFailed = true;
        cancelAnimationFrame(frame);
        setState('unavailable');
        setMessage(
          '입체 화면 연결이 끊겼어요. 꾸미기로 돌아갔다가 다시 열어 주세요.',
        );
      }
    };
    canvas.addEventListener('pointerdown', onPointer);
    canvas.addEventListener('webglcontextlost', contextLost);
    host.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    host.addEventListener('focusout', blur);
    const resize = () => {
      const width = host.clientWidth,
        height = host.clientHeight;
      if (!width || !height) return;
      const aspect = width / height;
      // Include the high rear wall corner, not just the floor footprint.
      const halfHeight = Math.max(4.85, 5.8 / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) blur();
    });
    visibilityObserver.observe(host);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let previous = performance.now(),
      lastSprite = -100,
      lastRender = -100,
      lastData = -100;
    const animate = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      if (!visible || document.hidden) return;
      const before = position;
      const held = pressed;
      let horizontal = Number(held.has('right')) - Number(held.has('left'));
      let vertical = Number(held.has('down')) - Number(held.has('up'));
      if (horizontal || vertical) {
        path = [];
        destination.visible = false;
        const length = Math.hypot(horizontal, vertical);
        horizontal /= length;
        vertical /= length;
        position = walkStep(
          position,
          (horizontal + vertical) * Math.SQRT1_2 * 2.25 * dt,
          (vertical - horizontal) * Math.SQRT1_2 * 2.25 * dt,
        );
      } else if (path.length) {
        const next = path[0],
          dx = next.x - position.x,
          dz = next.z - position.z,
          distance = Math.hypot(dx, dz),
          step = Math.min(distance, 2.25 * dt);
        if (distance < 0.025) path.shift();
        else
          position = walkStep(
            position,
            (dx / distance) * step,
            (dz / distance) * step,
          );
        if (!path.length) destination.visible = false;
      }
      const walking =
        Math.hypot(position.x - before.x, position.z - before.z) > 0.0001;
      sprite.position.set(position.x, 0.065, position.z);
      shadow.position.set(position.x, 0.066, position.z);
      if (sprites && now - lastSprite > (walking ? 40 : 80)) {
        const current = latest.current;
        sprites.draw(
          spriteCanvas,
          current.actor,
          current.looks[current.actor],
          walking ? 'walk' : 'idle',
          now / 1000,
          false,
          reduced.matches,
        );
        spriteTexture.needsUpdate = true;
        lastSprite = now;
      }
      if (now - lastData > 150) {
        host.dataset.avatarX = position.x.toFixed(3);
        host.dataset.avatarZ = position.z.toFixed(3);
        host.dataset.walking = String(walking);
        lastData = now;
      }
      if (now - lastRender > (walking ? 33 : 80)) {
        renderer.render(scene, camera);
        lastRender = now;
      }
    };
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      pressed.clear();
      paint.current = null;
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointer);
      canvas.removeEventListener('webglcontextlost', contextLost);
      host.removeEventListener('keydown', keydown);
      host.removeEventListener('focusout', blur);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
      disposeObject(scene);
      sun.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  const holdDirection = (
    direction: Direction,
    target: HTMLButtonElement,
    pointerId: number,
  ) => {
    target.setPointerCapture(pointerId);
    directions.current.add(direction);
  };
  return (
    <section className="b3-room" aria-label="입체 방 산책">
      <header className="b3-heading">
        <div>
          <span className="b3-eyebrow">
            <Sun size={14} /> 오후의 작은 쉼표
          </span>
          <h1>{ACTORS[save.actor]}의 햇살방</h1>
          <p>좋아하는 옷을 입고, 햇살 드는 방을 천천히 걸어 보세요.</p>
        </div>
        <span className="b3-mode-label">입체 공간 · 2D 캐릭터</span>
      </header>
      <div className="b3-scene-frame">
        {/* Keyboard focus is required for directional movement in this application surface. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
        <div
          ref={hostRef}
          className="b3-scene"
          tabIndex={0}
          role="application"
          aria-label="입체 방. 클릭 또는 방향키와 WASD로 이동"
          data-testid="bedroom-3d"
          data-load-state={state}
        >
          <div className="b3-scene-note" aria-hidden="true">
            <span>HOHYEON HOME</span>
            <strong>조금 느린 오후</strong>
          </div>
          {state === 'loading' && (
            <output className="b3-loading">
              <LoaderCircle size={19} />
              {message}
            </output>
          )}
          {state === 'unavailable' && (
            <div className="b3-fallback" aria-live="polite">
              <strong>잠시, 꾸미기에서 만나요</strong>
              <p>{message}</p>
              <button type="button" onClick={onDecorate}>
                <Palette size={16} /> 내 방 꾸미기
              </button>
            </div>
          )}
          {state !== 'unavailable' && (
            <div className="b3-pad" aria-label="걷기 방향">
              {(
                [
                  ['up', ArrowUp, '위로 걷기'],
                  ['left', ArrowLeft, '왼쪽으로 걷기'],
                  ['down', ArrowDown, '아래로 걷기'],
                  ['right', ArrowRight, '오른쪽으로 걷기'],
                ] as const
              ).map(([direction, Icon, label]) => (
                <button
                  key={direction}
                  type="button"
                  className={`b3-pad-${direction}`}
                  aria-label={label}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    holdDirection(
                      direction,
                      event.currentTarget,
                      event.pointerId,
                    );
                  }}
                  onPointerUp={() => directions.current.delete(direction)}
                  onPointerCancel={() => directions.current.delete(direction)}
                  onLostPointerCapture={() =>
                    directions.current.delete(direction)
                  }
                  onKeyDown={(event) => {
                    if (event.key === ' ' || event.key === 'Enter') {
                      event.preventDefault();
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
        </div>
        <div className="b3-scene-footer">
          <span>
            <Footprints size={15} /> 바닥을 눌러 이동
            <span className="b3-key-help"> · 방향키 / WASD</span>
          </span>
          <span className="b3-garden-tag">
            <i /> 나만의 산책
          </span>
        </div>
      </div>
      {state === 'partial' && <output className="b3-status">{message}</output>}
      <div className="b3-room-caption">
        <div>
          <strong>산책과 꾸미기, 두 가지 즐거움</strong>
          <p>
            햇살방은 산책용 공간이에요. 꾸미기에 저장한 가구 배치는 따로
            보관되고, 벽·바닥 색과 지금 입은 코디는 함께 사용해요.
          </p>
        </div>
        <button type="button" onClick={onDecorate}>
          <Palette size={16} /> 내 방 꾸미기 <span aria-hidden="true">↗</span>
        </button>
      </div>
      <p className="b3-credit">
        소파와 튤립은{' '}
        <a
          href="https://karchive.vibeline.co.kr/models"
          target="_blank"
          rel="noreferrer"
        >
          kArchive
        </a>
        의 3D 모델을 사용했어요. 출처: 쓰레드 dogfooter.
      </p>
    </section>
  );
}
