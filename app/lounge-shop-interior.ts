/**
 * The shop rooms' furnishings (lounge-shop-interiors.ts): kArchive models
 * (자료: kArchive · 출처: 쓰레드 dogfooter) fitted into their boxes without
 * stretching, café chairs at the bakery's seats, plain boxes for counters and
 * display tables, rugs, wall panelling and the wall signs. Every model is
 * loaded once; a model used more than once is one instanced draw call. Plain
 * boxes are instanced by colour. Primitive stand-ins keep each footprint
 * visible until (or if not) its model arrives.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LOUNGE_MODELS, SHOP_INTERIOR_MODELS, TAVERN_MODELS, VALLEY_MODELS } from './lounge-model-assets';
import { CLUB_MODELS } from './lounge-karchive-club';
import { SHOP_INTERIORS, type ShopArea, type ShopItem, type ShopModel } from './lounge-shop-interiors';

/** Seat height (world units) of the café chairs; matches the interior scene's SEAT_HEIGHT. */
const SEAT_HEIGHT = 0.36;
const CHAIR_SCALE = SEAT_HEIGHT / CLUB_MODELS.banquetChair.seat;

const MODEL_URL: Record<ShopModel, string> = {
  ...SHOP_INTERIOR_MODELS,
  cafeTable: TAVERN_MODELS.cafeTable,
  register: TAVERN_MODELS.register,
  storageShelf: TAVERN_MODELS.storageShelf,
  teaSideboard: TAVERN_MODELS.teaSideboard,
  barrelRack: TAVERN_MODELS.barrelRack,
  produceCrate: VALLEY_MODELS.produceCrate,
  banquetChair: LOUNGE_MODELS.banquetChair,
  plantStand: LOUNGE_MODELS.plantStand,
  hanjiLantern: VALLEY_MODELS.hanjiLantern,
  gardenLantern: LOUNGE_MODELS.gardenLantern,
  onggi: VALLEY_MODELS.onggi,
  fishMackerel: LOUNGE_MODELS.fishMackerel,
  fishCod: LOUNGE_MODELS.fishCod,
  fishHairtail: LOUNGE_MODELS.fishHairtail,
};

/** Each room's own touches: rugs, panelling colour and the signs' colours. */
const LOOK: Record<ShopArea, { panel: string; trim: string; rugs: readonly [x: number, z: number, w: number, d: number, color: string][]; sign: [bg: string, ink: string, line: string] }> = {
  bakery: {
    panel: '#c99a6b',
    trim: '#f3e2c4',
    rugs: [
      [3.9, 0.9, 5.2, 4.9, '#d9b98f'],
      [-0.32, -1.75, 3.0, 1.1, '#b9785a'],
    ],
    sign: ['#fff4dd', '#7a4a2a', '#c58d5a'],
  },
  coop: {
    panel: '#8fa676',
    trim: '#ece2c6',
    rugs: [[0, -1.75, 3.4, 1.1, '#7f9a5e']],
    sign: ['#e9f0dc', '#2f5a3a', '#6f9a58'],
  },
  general: {
    panel: '#3f5a4c',
    trim: '#d8c49a',
    rugs: [
      [1.4, -1.75, 3.2, 1.1, '#6a4b3a'],
      [2.4, 2.2, 2.6, 2.0, '#58705f'],
    ],
    sign: ['#23302b', '#bff0d4', '#58b98a'],
  },
  broker: {
    panel: '#2f3e5a',
    trim: '#d9e2ef',
    rugs: [
      [0, -1.75, 3.6, 1.1, '#3d5478'],
      [0, 1.6, 6.4, 2.6, '#53698c'],
    ],
    sign: ['#16233a', '#ffd36e', '#5a78ad'],
  },
  fishmarket: {
    panel: '#5f8794',
    trim: '#e3eef2',
    rugs: [[-0.8, -1.75, 3.2, 1.1, '#46717f']],
    sign: ['#e3eef2', '#1f4a5c', '#4f8aa0'],
  },
};

/** Ice on the fish beds and a cream top on the counters (instanced boxes). */
const ICE = '#e6f2f4',
  TOP = '#efe1c2';

export function buildShop(parent: THREE.Group, area: ShopArea, changed: () => void) {
  const shop = SHOP_INTERIORS[area];
  const look = LOOK[area];
  const group = new THREE.Group();
  group.name = 'shop-' + area;
  parent.add(group);
  let disposed = false,
    loadedCount = 0;
  const resources = new Set<{ dispose(): void }>();
  const own = (object: THREE.Object3D, target = resources) =>
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      target.add(mesh.geometry);
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        target.add(m);
        for (const value of Object.values(m)) if (value instanceof THREE.Texture) target.add(value);
      }
    });
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const material = (color: string) => {
    let value = materials.get(color);
    if (!value) {
      value = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
      materials.set(color, value);
      resources.add(value);
    }
    return value;
  };
  const cube = new THREE.BoxGeometry(1, 1, 1);
  resources.add(cube);
  // Plain boxes, instanced by colour (one draw call per colour).
  const blocks = new Map<string, THREE.Matrix4[]>();
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string, turn = 0) => {
    const list = blocks.get(color) ?? [];
    blocks.set(color, list);
    list.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, y, z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turn),
        new THREE.Vector3(w, h, d),
      ),
    );
  };

  // Rugs with a cream border, low panelling on the back wall.
  for (const [x, z, w, d, color] of look.rugs) {
    // Just above the floor planks (their tops are at y 0.02).
    box(w, 0.012, d, x, 0.028, z, color);
    for (const sx of [-1, 1]) box(0.035, 0.008, d - 0.14, x + sx * (w / 2 - 0.09), 0.037, z, look.trim);
    for (const sz of [-1, 1]) box(w - 0.14, 0.008, 0.035, x, 0.037, z + sz * (d / 2 - 0.09), look.trim);
  }
  box(16.3, 0.64, 0.075, 0, 0.37, -5.84, look.panel);
  box(16.4, 0.065, 0.105, 0, 0.71, -5.83, look.trim);

  // Plain furniture (counters, display tables, ice beds) and stand-ins for models.
  const standIns = new Map<ShopModel, THREE.Mesh[]>();
  for (const it of shop.items) {
    if (!it.model) {
      box(it.w, it.h, it.d, it.x, (it.y ?? 0) + it.h / 2, it.z, it.color ?? '#8c6a48', it.turn ?? 0);
      // A cream top on counters, crushed ice on the fish beds.
      const cap = area === 'fishmarket' && it.id.startsWith('ice-') ? ICE : TOP;
      box(it.w + 0.06, 0.05, it.d + 0.06, it.x, (it.y ?? 0) + it.h + 0.025, it.z, cap, it.turn ?? 0);
      continue;
    }
    const stand = new THREE.Mesh(cube, material(it.model === 'cafeTable' ? '#a07a52' : '#9b8467'));
    const h = Math.min(it.h, 0.6);
    stand.scale.set(it.w * 0.9, h, it.d * 0.9);
    stand.rotation.y = it.turn ?? 0;
    stand.position.set(it.x, (it.y ?? 0) + h / 2, it.z);
    stand.castShadow = stand.receiveShadow = true;
    group.add(stand);
    const list = standIns.get(it.model) ?? [];
    list.push(stand);
    standIns.set(it.model, list);
  }

  // Wall signs: one small canvas atlas (two per room).
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const [bg, ink, line] = look.sign;
  if (context)
    for (const [i, sign] of shop.signs.slice(0, 2).entries()) {
      const y = i * 128;
      context.fillStyle = bg;
      context.fillRect(0, y, 512, 128);
      context.strokeStyle = line;
      context.lineWidth = 6;
      context.strokeRect(9, y + 9, 494, 110);
      context.fillStyle = ink;
      context.font = '52px Jua, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(sign.text, 256, y + 66);
    }
  const atlas = new THREE.CanvasTexture(canvas);
  atlas.colorSpace = THREE.SRGBColorSpace;
  resources.add(atlas);
  const signMaterial = new THREE.MeshBasicMaterial({ map: atlas, toneMapped: false });
  resources.add(signMaterial);
  for (const [i, sign] of shop.signs.slice(0, 2).entries()) {
    const h = sign.w / 3.6;
    const geometry = new THREE.PlaneGeometry(sign.w, h),
      uv = geometry.getAttribute('uv');
    for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k), (uv.getY(k) + (i === 0 ? 1 : 0)) / 2);
    const panel = new THREE.Mesh(geometry, signMaterial);
    panel.position.set(sign.x, sign.y, -5.82);
    group.add(panel);
    own(panel);
    box(sign.w + 0.08, h + 0.08, 0.05, sign.x, sign.y, -5.85, look.panel);
  }
  for (const [color, list] of blocks) {
    const batch = new THREE.InstancedMesh(cube, material(color), list.length);
    list.forEach((m, i) => batch.setMatrixAt(i, m));
    batch.castShadow = batch.receiveShadow = true;
    batch.name = `shop-detail-${color}`;
    group.add(batch);
    resources.add(batch);
  }

  // Models: fitted placements per model (the café chairs at the seats).
  const placements = new Map<ShopModel, (ShopItem | { chair: true; x: number; z: number; face: number })[]>();
  for (const it of shop.items) if (it.model) placements.set(it.model, [...(placements.get(it.model) ?? []), it]);
  if (shop.seats.length) placements.set('banquetChair', shop.seats.map((s) => ({ chair: true as const, x: s.x, z: s.z, face: s.face })));
  const loader = new GLTFLoader();
  const keys = [...placements.keys()];
  for (const key of keys) {
    void loader
      .loadAsync(MODEL_URL[key])
      .then(({ scene }) => {
        if (disposed) {
          const late = new Set<{ dispose(): void }>();
          own(scene, late);
          for (const r of late) r.dispose();
          return;
        }
        own(scene);
        scene.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(scene),
          size = bounds.getSize(new THREE.Vector3()),
          center = bounds.getCenter(new THREE.Vector3());
        if (![size.x, size.y, size.z].every((n) => Number.isFinite(n) && n > 0)) return;
        const meshes: THREE.Mesh[] = [];
        scene.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh);
        });
        const matrices = placements.get(key)!.map((p) => {
          const up = new THREE.Vector3(0, 1, 0);
          if ('chair' in p)
            return new THREE.Matrix4().compose(new THREE.Vector3(p.x, 0, p.z), new THREE.Quaternion().setFromAxisAngle(up, p.face), new THREE.Vector3().setScalar(CHAIR_SCALE));
          const k = Math.min(p.w / size.x, p.h / size.y, p.d / size.z);
          return new THREE.Matrix4()
            .compose(new THREE.Vector3(p.x, p.y ?? 0, p.z), new THREE.Quaternion().setFromAxisAngle(up, p.turn ?? 0), new THREE.Vector3().setScalar(k))
            .multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
        });
        for (const mesh of meshes) {
          // One instanced draw call per mesh, however many placements.
          const batch = new THREE.InstancedMesh(mesh.geometry, mesh.material, matrices.length);
          matrices.forEach((m, i) => batch.setMatrixAt(i, m.clone().multiply(mesh.matrixWorld)));
          batch.castShadow = batch.receiveShadow = true;
          batch.name = `shop-${key}`;
          group.add(batch);
          resources.add(batch);
        }
        for (const stand of standIns.get(key) ?? []) stand.visible = false;
        loadedCount++;
        changed();
      })
      .catch(() => {
        /* The stand-in keeps the footprint visible. */
      });
  }
  return {
    /** Models placed so far / models this room uses. */
    loaded: () => loadedCount,
    wanted: keys.length,
    dispose() {
      if (disposed) return;
      disposed = true;
      parent.remove(group);
      for (const r of resources) r.dispose();
    },
  };
}
