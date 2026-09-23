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
import { LOUNGE_ASSETS } from './lounge-assets';
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
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

    const fallbacks = new Map<string, THREE.Group>();
    const fallback = (id: string) => {
      const group = new THREE.Group();
      fallbacks.set(id, group);
      scene.add(group);
      return group;
    };

    scene.add(new THREE.HemisphereLight('#fff5df', '#8c8176', 1.8));
    const sun = new THREE.DirectionalLight('#fff0ce', 2.65);
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
    const curtainsFallback = fallback('curtains');
    for (const x of [-2.67, 0.1])
      for (let i = 0; i < 4; i++)
        cylinder(
          0.082,
          0.11,
          1.85,
          x + i * 0.095,
          2.12,
          -2.99,
          '#ede2cf',
          curtainsFallback,
        );
    box(3.18, 0.065, 0.1, -1.14, 3.12, -2.97, '#936f50', curtainsFallback);
    // Door in the left wall, with inset panels and a brass handle.
    box(0.12, 2.48, 1.16, -3.96, 1.25, 1.94, '#ac8661');
    box(0.15, 2.3, 0.98, -3.87, 1.2, 1.94, '#c5a77f');
    for (const y of [0.67, 1.69])
      box(0.03, 0.78, 0.73, -3.78, y, 1.94, '#d2b58e');
    sphere(0.054, -3.7, 1.17, 2.29, '#b98f47');

    const furniture = Object.fromEntries(
      WALK_FURNITURE.map((item) => [item.id, item]),
    );
    const { bed, table, desk, shelf, chair, nightstand, wardrobe } = furniture;
    // Keep these light placeholders until each individual model is ready.
    // Hidden groups remain owned by the scene and are disposed on unmount.
    const bedFallback = fallback('bed');
    box(1.85, 0.3, 2.65, bed.x, 0.24, bed.z, '#ab7959', bedFallback);
    box(1.85, 1.05, 0.13, bed.x, 0.65, bed.z - 1.23, '#ac886a', bedFallback);
    box(1.72, 0.27, 2.47, bed.x, 0.52, bed.z, '#f0e8d7', bedFallback);
    box(1.77, 0.19, 1.78, bed.x, 0.72, bed.z + 0.33, '#bc9c96', bedFallback);
    const rugFallback = fallback('rug');
    box(3.45, 0.028, 2.7, 0.07, 0.039, 0.95, '#d7c9a8', rugFallback);
    const tableFallback = fallback('coffeeTable');
    box(
      table.width,
      0.13,
      table.depth,
      table.x,
      0.58,
      table.z,
      '#c59b6d',
      tableFallback,
    );
    for (const dx of [-0.58, 0.58])
      for (const dz of [-0.22, 0.22])
        box(
          0.08,
          0.5,
          0.08,
          table.x + dx,
          0.3,
          table.z + dz,
          '#a57e54',
          tableFallback,
        );
    // A pair of books and a ceramic tea cup give the coffee table a lived-in feel.
    box(0.36, 0.045, 0.26, table.x + 0.4, 0.675, table.z + 0.08, '#657a6d');
    box(0.32, 0.035, 0.23, table.x + 0.36, 0.717, table.z + 0.08, '#d7b380');
    cylinder(
      0.073,
      0.058,
      0.11,
      table.x + 0.05,
      0.705,
      table.z + 0.13,
      '#e7dbbf',
    );
    cylinder(
      0.057,
      0.057,
      0.003,
      table.x + 0.05,
      0.761,
      table.z + 0.13,
      '#705346',
    );
    const deskFallback = fallback('desk');
    box(
      desk.width,
      0.12,
      desk.depth,
      desk.x,
      0.7,
      desk.z,
      '#b88d62',
      deskFallback,
    );
    for (const dx of [-0.53, 0.53])
      for (const dz of [-0.31, 0.31])
        box(
          0.07,
          0.65,
          0.07,
          desk.x + dx,
          0.36,
          desk.z + dz,
          '#8a674a',
          deskFallback,
        );
    // Writing mat, notebook and pencil sit on the imported desktop.
    box(0.52, 0.012, 0.33, desk.x + 0.14, 0.754, desk.z + 0.05, '#8d9c8a');
    box(0.23, 0.018, 0.27, desk.x + 0.19, 0.77, desk.z + 0.04, '#f5ead7');
    const pencil = box(
      0.017,
      0.012,
      0.22,
      desk.x + 0.4,
      0.773,
      desk.z + 0.03,
      '#be925e',
    );
    pencil.rotation.y = 0.2;
    const shelfFallback = fallback('bookshelf');
    box(0.38, 2.2, 1.05, shelf.x, 1.15, shelf.z, '#b38d69', shelfFallback);
    const chairFallback = fallback('chair');
    box(0.48, 0.12, 0.47, chair.x, 0.54, chair.z, '#747d75', chairFallback);
    box(
      0.48,
      0.52,
      0.08,
      chair.x,
      0.78,
      chair.z + 0.22,
      '#747d75',
      chairFallback,
    );
    const nightstandFallback = fallback('nightstand');
    box(
      0.55,
      0.58,
      0.52,
      nightstand.x,
      0.35,
      nightstand.z,
      '#cab391',
      nightstandFallback,
    );
    const wardrobeFallback = fallback('wardrobe');
    box(
      wardrobe.width,
      1.95,
      0.64,
      wardrobe.x,
      1.03,
      wardrobe.z,
      '#eee5d4',
      wardrobeFallback,
    );
    const deskLight = new THREE.PointLight('#ffd79b', 1.25, 2);
    deskLight.position.set(desk.x - 0.37, 1.02, desk.z - 0.12);
    scene.add(deskLight);
    const bedsideLight = new THREE.PointLight('#ffc77d', 1.6, 2.5);
    bedsideLight.position.set(nightstand.x, 1.02, nightstand.z);
    scene.add(bedsideLight);
    // Framed print and a small clock above the bed.
    box(0.8, 0.99, 0.075, 2.31, 2.43, -3.23, '#ad8664');
    box(0.67, 0.85, 0.018, 2.31, 2.43, -3.18, '#eee1c4');
    // Existing illustrated decorations become wall surfaces in the 3D room.
    const wallArt = async (
      url: string,
      width: number,
      height: number,
      x: number,
      y: number,
      z: number,
      rotation: number,
      id: string,
    ) => {
      const texture = await new THREE.TextureLoader().loadAsync(url);
      if (disposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.05,
          roughness: 1,
        }),
      );
      art.position.set(x, y, z);
      art.rotation.y = rotation;
      scene.add(art);
      host.dataset[id] = 'loaded';
    };
    const artPromises = [
      wallArt(
        LOUNGE_ASSETS.bedroom_music_poster,
        0.7,
        0.95,
        2.31,
        2.43,
        -3.145,
        0,
        'poster',
      ),
      wallArt(
        LOUNGE_ASSETS.bedroom_photo_string,
        1.72,
        0.7,
        -3.965,
        2.04,
        0.2,
        Math.PI / 2,
        'photos',
      ),
    ];
    const lightPoints = Array.from(
      { length: 11 },
      (_, index) =>
        new THREE.Vector3(
          -3.94,
          3.1 - Math.sin((index / 10) * Math.PI) * 0.19,
          -2.9 + index * 0.54,
        ),
    );
    const string = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(lightPoints),
        40,
        0.009,
        5,
        false,
      ),
      material('#a78a65'),
    );
    scene.add(string);
    const bulbShape = new THREE.SphereGeometry(0.037, 10, 8);
    const bulbSurface = new THREE.MeshStandardMaterial({
      color: '#ffdf9d',
      emissive: '#ffc566',
      emissiveIntensity: 1.3,
    });
    for (const point of lightPoints) {
      const bulb = new THREE.Mesh(bulbShape, bulbSurface);
      bulb.position.copy(point).add(new THREE.Vector3(0.012, -0.064, 0));
      scene.add(bulb);
    }
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
        rotation?: number;
        stretch?: boolean;
        requireTexture?: boolean;
        tints?: Record<string, string>;
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
          if (typeof image?.width === 'number' && image.width > 0)
            textured = true;
        }
      });
      // GLTFLoader can resolve geometry after a texture request fails. These two
      // curated models both require their embedded colour maps to be complete.
      if (target.requireTexture && !textured) {
        disposeObject(object);
        throw new Error('The room model colour texture could not be loaded.');
      }
      object.rotation.y = target.rotation ?? 0;
      object.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object),
        size = bounds.getSize(new THREE.Vector3());
      const scale = Math.min(
        target.maxWidth / Math.max(size.x, 0.001),
        target.maxDepth / Math.max(size.z, 0.001),
        target.maxHeight / Math.max(size.y, 0.001),
      );
      if (target.stretch)
        object.scale.multiply(
          new THREE.Vector3(
            target.maxWidth / size.x,
            target.maxHeight / size.y,
            target.maxDepth / size.z,
          ),
        );
      else object.scale.multiplyScalar(scale);
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
          for (const surface of Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]) {
            const tint = target.tints?.[surface.name];
            if (tint && surface instanceof THREE.MeshStandardMaterial)
              surface.color.set(tint);
          }
        }
      });
      scene.add(object);
      renderer.shadowMap.needsUpdate = true;
      host.dataset[id] = 'loaded';
      if (textured) host.dataset[id + 'Texture'] = 'loaded';
      fallbacks.get(id)?.traverse((child) => {
        child.visible = false;
      });
      host.dataset.modelsLoaded = String(
        Number(host.dataset.modelsLoaded ?? 0) + 1,
      );
    };
    const sofa = furniture.sofa;
    const sofaFallback = fallback('sofa');
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
          requireTexture: true,
        },
        'sofa',
      ),
      placeModel(
        LOUNGE_MODELS.tulips,
        {
          x: table.x - 0.28,
          y: 0.65,
          z: table.z,
          maxWidth: 0.55,
          maxDepth: 0.48,
          maxHeight: 0.67,
          requireTexture: true,
        },
        'tulips',
      ),
      placeModel(
        LOUNGE_MODELS.bed,
        {
          x: bed.x,
          y: 0.055,
          z: bed.z,
          maxWidth: bed.width,
          maxDepth: bed.depth,
          maxHeight: 1.35,
          tints: {
            fabricBlue: finishes.wall === 'blush' ? '#bd929b' : '#8daaa0',
          },
        },
        'bed',
      ),
      placeModel(
        LOUNGE_MODELS.desk,
        {
          x: desk.x,
          y: 0.055,
          z: desk.z,
          maxWidth: desk.width,
          maxDepth: desk.depth,
          maxHeight: 0.82,
        },
        'desk',
      ),
      placeModel(
        LOUNGE_MODELS.bookshelf,
        {
          x: shelf.x,
          y: 0.055,
          z: shelf.z,
          maxWidth: shelf.width,
          maxDepth: shelf.depth,
          maxHeight: 2.26,
          rotation: Math.PI / 2,
        },
        'bookshelf',
      ),
      placeModel(
        LOUNGE_MODELS.rug,
        {
          x: 0.07,
          y: 0.021,
          z: 0.95,
          maxWidth: 3.45,
          maxDepth: 2.7,
          maxHeight: 0.027,
          stretch: true,
        },
        'rug',
      ),
      placeModel(
        LOUNGE_MODELS.chair,
        {
          x: chair.x,
          y: 0.055,
          z: chair.z,
          maxWidth: chair.width,
          maxDepth: chair.depth,
          maxHeight: 1.04,
          rotation: Math.PI,
        },
        'chair',
      ),
      placeModel(
        LOUNGE_MODELS.nightstand,
        {
          x: nightstand.x,
          y: 0.055,
          z: nightstand.z,
          maxWidth: nightstand.width,
          maxDepth: nightstand.depth,
          maxHeight: 0.67,
        },
        'nightstand',
      ),
      placeModel(
        LOUNGE_MODELS.wardrobe,
        {
          x: wardrobe.x,
          y: 0.055,
          z: wardrobe.z,
          maxWidth: wardrobe.width,
          maxDepth: wardrobe.depth,
          maxHeight: 2.05,
        },
        'wardrobe',
      ),
      placeModel(
        LOUNGE_MODELS.coffeeTable,
        {
          x: table.x,
          y: 0.055,
          z: table.z,
          maxWidth: table.width,
          maxDepth: table.depth,
          maxHeight: 0.64,
        },
        'coffeeTable',
      ),
      placeModel(
        LOUNGE_MODELS.curtains,
        {
          x: -1.22,
          y: 1.22,
          z: -2.99,
          maxWidth: 3.18,
          maxDepth: 0.18,
          maxHeight: 1.97,
          stretch: true,
        },
        'curtains',
      ),
      placeModel(
        LOUNGE_MODELS.lamp,
        {
          x: desk.x - 0.37,
          y: 0.754,
          z: desk.z - 0.12,
          maxWidth: 0.29,
          maxDepth: 0.29,
          maxHeight: 0.4,
        },
        'deskLamp',
      ),
      placeModel(
        LOUNGE_MODELS.lamp,
        {
          x: nightstand.x,
          y: 0.708,
          z: nightstand.z,
          maxWidth: 0.32,
          maxDepth: 0.32,
          maxHeight: 0.44,
        },
        'bedsideLamp',
      ),
      placeModel(
        LOUNGE_MODELS.cushions,
        {
          x: bed.x + 0.12,
          y: 0.76,
          z: bed.z + 0.7,
          maxWidth: 0.74,
          maxDepth: 0.46,
          maxHeight: 0.42,
        },
        'cushions',
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
    void Promise.allSettled([
      ...modelPromises,
      ...artPromises,
      spritesPromise,
    ]).then((results) => {
      if (disposed || contextFailed) return;
      if (results.at(-1)?.status === 'rejected') {
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
    });

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
        <span className="b3-mode-label">햇살 드는 나의 아지트</span>
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
        의 모델을 사용했어요. 출처: 쓰레드 dogfooter. 가구·커튼·쿠션은{' '}
        <a
          href="https://3dassets.dev/packs/bedroom-and-living-room-furniture"
          target="_blank"
          rel="noreferrer"
        >
          3DAssets.dev
        </a>
        의 CC0 모델입니다.
      </p>
    </section>
  );
}
