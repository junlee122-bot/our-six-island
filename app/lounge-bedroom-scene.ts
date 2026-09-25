/**
 * The walk room: a fixed architectural shell (floor, two walls, window,
 * curtains, door) plus every item of the saved v3 room. Items are synced
 * incrementally (`setRoom`) so 꾸미기 모드 edits appear instantly.
 * GLB templates and textures are cached per session (re-entering the room
 * does not download or parse them again).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LOUNGE_MODELS } from './lounge-model-assets';
import {
  ROOM,
  catalogEntry,
  itemFootprint,
  wallSpan,
  type Bedroom,
  type CatalogEntry,
  type RoomItem,
} from './lounge-bedroom-data';
import { MODEL_FILES, PROP_ART } from './lounge-bedroom-art';
import { buildMiku } from './lounge-bedroom-miku3d';

export const BEDROOM_WALL_COLOR: Record<Bedroom['wall'], string> = {
  cream: '#eee6d7',
  sage: '#cbd1bd',
  blush: '#e8d3cb',
  blue: '#c9d8d6',
  mint: '#d3e8df',
  dusk: '#a9a2b8',
};
export const BEDROOM_FLOOR_COLOR: Record<Bedroom['floor'], string> = {
  oak: '#c3a579',
  walnut: '#8d7057',
  pale: '#e0d1b7',
  ash: '#cfc7bb',
};
/** The fixed camera looks in from here (front-right, elevated). */
export const ROOM_CAMERA = { x: 11, y: 10, z: 13 } as const;
export const CAMERA_YAW = Math.atan2(ROOM_CAMERA.x, ROOM_CAMERA.z);
const DEG = Math.PI / 180;

// ------------------------------------------------------------ caches
const loader = new GLTFLoader();
const gltfCache = new Map<string, Promise<THREE.Object3D>>();
const textureCache = new Map<string, THREE.Texture>();
const texturePromises = new Map<string, Promise<THREE.Texture>>();
const markShared = (root: THREE.Object3D) =>
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.userData.shared = true;
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
      m.userData.shared = true;
  });
function gltf(url: string) {
  let p = gltfCache.get(url);
  if (!p) {
    p = loader.loadAsync(url).then((g) => {
      markShared(g.scene);
      return g.scene;
    });
    p.catch(() => gltfCache.delete(url));
    gltfCache.set(url, p);
  }
  return p;
}
/** A texture that fills in once its image arrives (cached, never disposed). */
function textureNow(url: string, onLoad?: () => void): THREE.Texture {
  let texture = textureCache.get(url);
  if (!texture) {
    texture = new THREE.TextureLoader().load(url, () => onLoad?.());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.userData.shared = true;
    textureCache.set(url, texture);
  } else if (!texture.image && onLoad) {
    // Still loading elsewhere: refresh when it lands.
    textureAsync(url).then(onLoad, () => {});
  }
  return texture;
}
function textureAsync(url: string): Promise<THREE.Texture> {
  let p = texturePromises.get(url);
  if (!p) {
    p = new Promise<THREE.Texture>((resolve, reject) => {
      const cached = textureCache.get(url);
      if (cached?.image) return resolve(cached);
      const texture = new THREE.TextureLoader().load(url, resolve, undefined, reject);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      texture.userData.shared = true;
      if (!cached) textureCache.set(url, texture);
    }).then(() => textureCache.get(url)!);
    p.catch(() => texturePromises.delete(url));
    texturePromises.set(url, p);
  }
  return p;
}
/**
 * Warms the caches for a room (GLB templates, prop art) so walking in through
 * the door shows the furniture right after the transition.
 */
export function preloadRoomAssets(room: { items: readonly { ref: string }[] }) {
  for (const ref of new Set(room.items.map((item) => item.ref))) {
    const entry = catalogEntry(ref);
    if (!entry) continue;
    if (entry.kind === 'model' && MODEL_FILES[ref])
      void modelTemplate(entry).catch(() => {});
    else if (entry.kind === 'prop' && PROP_ART[ref])
      void textureAsync(PROP_ART[ref]).catch(() => {});
  }
}
/** Fitted, centred template of a catalog GLB (cached per ref). */
const templates = new Map<string, Promise<THREE.Object3D>>();
function modelTemplate(entry: CatalogEntry) {
  let p = templates.get(entry.ref);
  if (!p) {
    p = gltf(MODEL_FILES[entry.ref]).then((source) => {
      const object = source.clone(true);
      object.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object),
        size = bounds.getSize(new THREE.Vector3());
      const flat = entry.mount === 'rug';
      const ratio = new THREE.Vector3(
        entry.w / Math.max(size.x, 0.001),
        entry.h / Math.max(size.y, 0.001),
        entry.d / Math.max(size.z, 0.001),
      );
      if (flat) object.scale.multiply(ratio);
      else object.scale.multiplyScalar(Math.min(ratio.x, ratio.y, ratio.z));
      object.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(object),
        center = fitted.getCenter(new THREE.Vector3());
      object.position.sub(new THREE.Vector3(center.x, fitted.min.y, center.z));
      const wrap = new THREE.Group();
      wrap.add(object);
      wrap.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = !flat;
          mesh.receiveShadow = true;
        }
      });
      return wrap;
    });
    p.catch(() => templates.delete(entry.ref));
    templates.set(entry.ref, p);
  }
  return p;
}
function disposeOwned(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh && !(child as THREE.LineSegments).isLineSegments) return;
    if (!mesh.geometry.userData.shared) mesh.geometry.dispose();
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material])
      if (!m.userData.shared) m.dispose();
  });
}

// ------------------------------------------------------------ shared bits
let blobTexture: THREE.CanvasTexture | null = null;
function blob() {
  if (!blobTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const c = canvas.getContext('2d')!,
      g = c.createRadialGradient(32, 32, 3, 32, 32, 31);
    g.addColorStop(0, 'rgba(62, 49, 31, 0.34)');
    g.addColorStop(0.5, 'rgba(62, 49, 31, 0.15)');
    g.addColorStop(1, 'rgba(62, 49, 31, 0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    blobTexture = new THREE.CanvasTexture(canvas);
    blobTexture.colorSpace = THREE.SRGBColorSpace;
    blobTexture.userData.shared = true;
  }
  return blobTexture;
}
const blobMaterial = () => {
  const m = new THREE.MeshBasicMaterial({
    map: blob(),
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  m.userData.shared = true;
  return m;
};
let sharedBlob: THREE.MeshBasicMaterial | null = null;
const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
hitMaterial.userData.shared = true;

type Node = {
  item: RoomItem;
  group: THREE.Group;
  content: THREE.Group;
  hit: THREE.Mesh;
  /** Card height/width, known once the image loaded. */
  aspect?: number;
  loaded: Promise<unknown>;
};

export type RoomScene = ReturnType<typeof createBedroomScene>;

/** Builds the room into `scene`. `onChange` is called whenever something new is visible. */
export function createBedroomScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  initial: Bedroom,
  host: HTMLElement,
  onChange: () => void,
) {
  let disposed = false;
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const surface = (color: string) => {
    let value = materials.get(color);
    if (!value) {
      value = new THREE.MeshStandardMaterial({ color, roughness: 0.84 });
      materials.set(color, value);
    }
    return value;
  };
  const shell = new THREE.Group();
  shell.name = 'shell';
  scene.add(shell);
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: string | THREE.Material,
    parent: THREE.Object3D = shell,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      typeof color === 'string' ? surface(color) : color,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const wall = new THREE.MeshStandardMaterial({
    color: BEDROOM_WALL_COLOR[initial.wall],
    roughness: 1,
  });
  const floors = Array.from(
    { length: 5 },
    () => new THREE.MeshStandardMaterial({ roughness: 0.91 }),
  );
  const setPaint = (wallColor: Bedroom['wall'], floor: Bedroom['floor']) => {
    wall.color.set(BEDROOM_WALL_COLOR[wallColor]);
    floors.forEach((material, index) =>
      material.color
        .set(BEDROOM_FLOOR_COLOR[floor])
        .offsetHSL(0, 0, ((index % 3) - 1) * 0.018),
    );
    const dusk = wallColor === 'dusk';
    hemi.intensity = dusk ? 1.55 : 2;
    sun.color.set(dusk ? '#ffd9b8' : '#ffefd5');
    onChange();
  };
  const hemi = new THREE.HemisphereLight('#fff7e7', '#928e79', 2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffefd5', 2.3);
  sun.position.set(-4, 9, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -8,
    right: 8,
    top: 8,
    bottom: -8,
    near: 0.1,
    far: 30,
  });
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.00015;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#e4eee6', 1.1);
  fill.position.set(7, 5, 1);
  scene.add(fill);
  setPaint(initial.wall, initial.floor);

  // Plank floor, wainscoting and a picture rail make one coherent shell.
  const { minX, minZ } = ROOM;
  box(10.28, 0.3, 8.48, 0, -0.2, 0, '#937a5a');
  const plankGeometry = new THREE.BoxGeometry(1.99, 0.065, 0.29);
  floors.forEach((material, color) => {
    const matrices: THREE.Matrix4[] = [];
    for (let row = 0; row < 28; row++)
      for (let col = 0; col < 5; col++)
        if ((row + col * 2) % floors.length === color)
          matrices.push(
            new THREE.Matrix4().makeTranslation(
              -4 + col * 2 + ((row % 2) - 0.5) * 0.5,
              -0.016,
              minZ + row * 0.3 + 0.15,
            ),
          );
    const planks = new THREE.InstancedMesh(plankGeometry, material, matrices.length);
    matrices.forEach((matrix, index) => planks.setMatrixAt(index, matrix));
    planks.receiveShadow = true;
    shell.add(planks);
  });
  box(10.23, 3.8, 0.16, 0, 1.85, minZ - 0.08, wall);
  box(0.16, 3.8, 8.3, minX - 0.08, 1.85, 0, wall);
  const wainscot = '#d8d9c8';
  box(10.1, 0.77, 0.03, 0, 0.47, minZ + 0.015, wainscot);
  box(0.03, 0.77, 8.16, minX + 0.015, 0.47, 0, wainscot);
  for (const y of [0.13, 0.88, 3.68]) {
    box(10.16, 0.07, 0.06, 0, y, minZ + 0.03, '#f4eddf');
    box(0.06, 0.07, 8.23, minX + 0.03, y, 0, '#f4eddf');
  }
  // Window over the desk nook.
  const win = ROOM.window,
    wx = (win.x0 + win.x1) / 2,
    wy = (win.y0 + win.y1) / 2;
  box(win.x1 - win.x0 + 0.1, win.y1 - win.y0 + 0.02, 0.08, wx, wy, minZ + 0.02, '#ac9471');
  box(
    win.x1 - win.x0 - 0.16,
    win.y1 - win.y0 - 0.24,
    0.05,
    wx,
    wy,
    minZ + 0.05,
    new THREE.MeshBasicMaterial({ color: '#d4e5d3' }),
  );
  for (const x of [win.x0 + 0.1, wx, win.x1 - 0.1])
    box(0.065, win.y1 - win.y0 - 0.12, 0.06, x, wy, minZ + 0.1, '#faf2df');
  for (const y of [win.y0 + 0.1, wy, win.y1 - 0.1])
    box(win.x1 - win.x0 - 0.1, 0.065, 0.06, wx, y, minZ + 0.1, '#faf2df');
  box(win.x1 - win.x0 + 0.2, 0.08, 0.2, wx, win.y0 - 0.02, minZ + 0.12, '#f3e8d2');
  // Door at the front end of the left wall.
  const door = ROOM.door,
    dz = (door.z0 + door.z1) / 2;
  box(0.06, door.height, door.z1 - door.z0, minX + 0.02, door.height / 2, dz, '#a98e6a');
  box(0.07, door.height - 0.2, door.z1 - door.z0 - 0.19, minX + 0.06, door.height / 2 - 0.08, dz, '#c9b58f');
  for (const y of [0.68, 1.72])
    box(0.015, 0.8, 0.78, minX + 0.1, y, dz, '#dfcdaa');
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 8), surface('#b09557'));
  knob.position.set(minX + 0.14, 1.23, dz + 0.34);
  shell.add(knob);
  const doormat = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 1.05),
    surface('#b8a58a'),
  );
  doormat.rotation.x = -Math.PI / 2;
  doormat.position.set(minX + 0.4, 0.035, dz);
  doormat.receiveShadow = true;
  shell.add(doormat);
  // Curtains belong to the window (not a placeable item).
  const curtainFallback = new THREE.Group();
  shell.add(curtainFallback);
  for (const side of [win.x0 - 0.15, win.x1 + 0.08])
    for (let fold = 0; fold < 3; fold++) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.13, 10), surface('#e8dcc5'));
      c.position.set(side + fold * 0.07, 2.4, minZ + 0.2);
      curtainFallback.add(c);
    }
  box(win.x1 - win.x0 + 0.7, 0.06, 0.08, wx, win.y1 + 0.06, minZ + 0.25, '#9b805a');
  const shellLoads: Promise<unknown>[] = [
    gltf(LOUNGE_MODELS.curtains).then((source) => {
      if (disposed) return;
      const object = source.clone(true);
      object.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object),
        size = bounds.getSize(new THREE.Vector3());
      object.scale.multiply(
        new THREE.Vector3((win.x1 - win.x0 + 0.66) / size.x, 2.2 / size.y, 0.18 / size.z),
      );
      object.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(object),
        center = fitted.getCenter(new THREE.Vector3());
      object.position.add(new THREE.Vector3(wx - center.x, 1.3 - fitted.min.y, minZ + 0.28 - center.z));
      shell.add(object);
      curtainFallback.visible = false;
      renderer.shadowMap.needsUpdate = true;
      onChange();
    }),
  ];

  // ---------------------------------------------------------- items
  const itemsRoot = new THREE.Group();
  itemsRoot.name = 'items';
  scene.add(itemsRoot);
  const nodes = new Map<string, Node>();
  const refresh = () => {
    if (disposed) return;
    renderer.shadowMap.needsUpdate = true;
    onChange();
  };
  const place = (node: Node) => {
    const { item, group, content } = node;
    const entry = catalogEntry(item.ref)!;
    group.scale.setScalar(item.scale);
    if (entry.mount === 'wall') {
      const left = item.wall === 'left';
      group.position.set(left ? minX + 0.035 : item.x, item.y ?? 2, left ? item.z : minZ + 0.035);
      group.rotation.set(0, left ? Math.PI / 2 : 0, 0);
      return;
    }
    group.position.set(item.x, item.y ?? 0, item.z);
    if (entry.kind === 'prop' && entry.mount !== 'rug') {
      // Painted cards always face the camera; 180° mirrors them.
      group.rotation.set(0, CAMERA_YAW, 0);
      const flip = item.rotY > 90 && item.rotY < 270;
      content.scale.x = flip ? -1 : 1;
    } else group.rotation.set(0, item.rotY * DEG, 0);
  };
  const cardHeight = (node: Node, entry: CatalogEntry) =>
    node.aspect ? entry.w * node.aspect : entry.h;
  const sizeHit = (node: Node) => {
    const entry = catalogEntry(node.item.ref)!;
    const h = entry.kind === 'prop' ? cardHeight(node, entry) : entry.h;
    node.hit.scale.set(
      entry.w,
      Math.max(h, 0.12),
      entry.kind === 'prop' && entry.mount !== 'rug' ? Math.max(0.2, entry.d) : Math.max(entry.d, 0.08),
    );
    node.hit.position.set(0, entry.mount === 'wall' ? 0 : Math.max(h, 0.12) / 2, entry.mount === 'wall' ? 0.05 : 0);
  };
  const build = (item: RoomItem): Node => {
    const entry = catalogEntry(item.ref)!;
    const group = new THREE.Group(),
      content = new THREE.Group();
    group.name = 'item-' + item.id;
    group.add(content);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), hitMaterial);
    hit.userData.itemId = item.id;
    group.add(hit);
    const node: Node = { item, group, content, hit, loaded: Promise.resolve() };
    // Soft contact shadow under everything that stands on something.
    if (entry.mount === 'floor' || entry.mount === 'small') {
      sharedBlob ??= blobMaterial();
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), sharedBlob);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.012;
      shadow.scale.set(entry.w * 1.15, entry.d * 1.3 + 0.1, 1);
      shadow.renderOrder = 1;
      content.add(shadow);
    }
    const miku = entry.kind === 'model' ? buildMiku(entry.ref, (url) => textureNow(url, refresh)) : null;
    if (miku) {
      content.add(miku);
    } else if (entry.kind === 'model') {
      node.loaded = modelTemplate(entry).then((template) => {
        if (disposed) return;
        content.add(template.clone(true));
        refresh();
      });
    } else {
      node.loaded = textureAsync(PROP_ART[entry.ref]).then((texture) => {
        if (disposed) return;
        const image = texture.image as { width: number; height: number };
        node.aspect = image.height / Math.max(1, image.width);
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.12,
          roughness: 1,
          side: THREE.DoubleSide,
        });
        let plane: THREE.Mesh;
        if (entry.mount === 'rug') {
          plane = new THREE.Mesh(new THREE.PlaneGeometry(entry.w, entry.d), material);
          plane.rotation.x = -Math.PI / 2;
          plane.position.y = 0.02;
          material.depthWrite = false;
          plane.renderOrder = 1;
          plane.receiveShadow = true;
        } else if (entry.mount === 'wall') {
          plane = new THREE.Mesh(new THREE.PlaneGeometry(entry.w, entry.h), material);
          plane.position.z = 0.012;
          plane.receiveShadow = true;
        } else {
          const h = cardHeight(node, entry);
          const geometry = new THREE.PlaneGeometry(entry.w, h);
          geometry.translate(0, h / 2, 0);
          plane = new THREE.Mesh(geometry, material);
          // Cards look like paper standees when lit from the side; keep them evenly lit.
          material.emissive.set('#3a342c');
          material.emissiveMap = texture;
          material.emissiveIntensity = 0.35;
        }
        plane.name = 'art';
        content.add(plane);
        sizeHit(node);
        refresh();
      });
    }
    sizeHit(node);
    place(node);
    itemsRoot.add(group);
    return node;
  };
  let loads: Promise<unknown>[] = [];
  const setRoom = (room: Bedroom) => {
    const seen = new Set<string>();
    for (const item of room.items) {
      if (!catalogEntry(item.ref)) continue;
      seen.add(item.id);
      const current = nodes.get(item.id);
      if (current && current.item.ref === item.ref) {
        current.item = item;
        place(current);
        continue;
      }
      if (current) {
        itemsRoot.remove(current.group);
        disposeOwned(current.group);
      }
      const node = build(item);
      nodes.set(item.id, node);
      loads.push(node.loaded);
    }
    for (const [id, node] of nodes)
      if (!seen.has(id)) {
        itemsRoot.remove(node.group);
        disposeOwned(node.group);
        nodes.delete(id);
      }
    host.dataset.items = String(nodes.size);
    refresh();
  };
  setRoom(initial);
  const ready = Promise.allSettled([...shellLoads, ...loads]).then((results) => {
    loads = [];
    return results.filter((r) => r.status === 'rejected').length;
  });

  /** Moves one item live (dragging) without touching the saved room. */
  const preview = (item: RoomItem) => {
    const node = nodes.get(item.id);
    if (!node) return;
    node.item = item;
    place(node);
    onChange();
  };

  // ---------------------------------------------------------- selection
  const selection = new THREE.Group();
  selection.visible = false;
  selection.renderOrder = 5;
  scene.add(selection);
  const outlineMaterial = new THREE.LineBasicMaterial({ color: '#2fbfa8', depthTest: false, transparent: true });
  const fillMaterial = new THREE.MeshBasicMaterial({ color: '#2fbfa8', transparent: true, opacity: 0.3, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), outlineMaterial);
  const fillPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fillMaterial);
  outline.renderOrder = fillPlane.renderOrder = 6;
  selection.add(fillPlane, outline);
  let selected: string | null = null,
    selectedConflict = false;
  const drawSelection = () => {
    const node = selected ? nodes.get(selected) : undefined;
    if (!node) {
      selection.visible = false;
      return;
    }
    const color = selectedConflict ? '#e0605e' : '#2fbfa8';
    outlineMaterial.color.set(color);
    fillMaterial.color.set(color);
    selection.visible = true;
    const entry = catalogEntry(node.item.ref)!;
    if (entry.mount === 'wall') {
      const span = wallSpan(node.item)!;
      const w = span.a1 - span.a0 + 0.08,
        h = span.y1 - span.y0 + 0.08;
      selection.rotation.set(0, span.wall === 'left' ? Math.PI / 2 : 0, 0);
      selection.position.set(
        span.wall === 'left' ? minX + 0.06 : (span.a0 + span.a1) / 2,
        (span.y0 + span.y1) / 2,
        span.wall === 'left' ? (span.a0 + span.a1) / 2 : minZ + 0.06,
      );
      selection.scale.set(w, h, 1);
    } else {
      const f = itemFootprint(node.item)!;
      selection.rotation.set(-Math.PI / 2, 0, 0);
      selection.position.set((f.x0 + f.x1) / 2, (node.item.y ?? 0) + 0.03, (f.z0 + f.z1) / 2);
      selection.scale.set(f.x1 - f.x0 + 0.08, f.z1 - f.z0 + 0.08, 1);
    }
  };
  const setSelection = (id: string | null, conflict = false) => {
    selected = id;
    selectedConflict = conflict;
    drawSelection();
    onChange();
  };

  const raycaster = new THREE.Raycaster();
  /**
   * The item under a ray (hit boxes only), topmost first. `prefer` (the
   * selected item) wins whenever the ray touches it, so dragging a piece that
   * stands in front of the bed moves that piece, not the bed.
   */
  const pick = (ray: THREE.Ray, prefer?: string | null): string | null => {
    raycaster.ray.copy(ray);
    const hits = raycaster.intersectObjects(
      [...nodes.values()].map((n) => n.hit),
      false,
    );
    // Prefer small/wall things over the big furniture they sit on.
    const rank = (id: string) => {
      const e = catalogEntry(nodes.get(id)?.item.ref ?? '');
      return e?.mount === 'small' ? 0 : e?.mount === 'wall' ? 1 : e?.mount === 'floor' ? 2 : 3;
    };
    hits.sort((a, b) => rank(a.object.userData.itemId) - rank(b.object.userData.itemId) || a.distance - b.distance);
    const top = hits[0]?.object.userData.itemId as string | undefined;
    // The selected piece keeps the grab unless something smaller sits on it.
    if (prefer && top && hits.some((h) => h.object.userData.itemId === prefer) && rank(prefer) <= rank(top)) return prefer;
    return top ?? null;
  };

  return {
    sun,
    ready,
    setPaint,
    setRoom: (room: Bedroom) => {
      setRoom(room);
      drawSelection();
    },
    preview: (item: RoomItem) => {
      preview(item);
      drawSelection();
    },
    setSelection,
    pick,
    /** World-space top centre of an item (for labels). */
    itemTop(id: string) {
      const node = nodes.get(id);
      if (!node) return null;
      const box = new THREE.Box3().setFromObject(node.group);
      return new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2);
    },
    dispose() {
      disposed = true;
      for (const node of nodes.values()) disposeOwned(node.group);
      nodes.clear();
      disposeOwned(shell);
      for (const m of materials.values()) m.dispose();
      wall.dispose();
      floors.forEach((m) => m.dispose());
      outline.geometry.dispose();
      fillPlane.geometry.dispose();
      outlineMaterial.dispose();
      fillMaterial.dispose();
      sun.shadow.dispose();
    },
  };
}

/** One 3D catalog item on its own (tools: catalog thumbnails, previews). */
export async function itemPreview(ref: string): Promise<THREE.Object3D | null> {
  const entry = catalogEntry(ref);
  if (!entry || entry.kind !== 'model') return null;
  const miku = buildMiku(ref, (url) => textureNow(url));
  if (miku) {
    await Promise.all(
      [...textureCache.keys()].map((url) => textureAsync(url).catch(() => null)),
    );
    return miku;
  }
  return (await modelTemplate(entry)).clone(true);
}
