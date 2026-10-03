// 텃밭 확장 in the 3D village (design-farming-upgrade.md §8): low-poly shapes
// for the 16 new crops through five growth stages (seed mound, sprout,
// leaves, flower / green fruit, ripe), trellis frames, giant crops over a
// whole bed, and each yard's fixtures (sprinklers, scarecrows, bee houses)
// and work-yard machines. The kArchive 장독 (onggi) and 허수아비 (scarecrow)
// models already used in the yards are reused for the jar and the scarecrow;
// everything else is a primitive in the same warm, muted palette.
import * as THREE from 'three';
import { NEW_CROP_IDS, type FixtureKind, type MachineKind, type NewCrop } from './lounge-farm-data';
import { VALLEY_MODELS } from './lounge-model-assets';
import { VILLAGE_YARDS, yardPlotCenter, type FarmYard, type VillagePoint } from './lounge-village-layout';
import type { LifeView } from './lounge-life';

export type Instance = { geo: THREE.BufferGeometry; mat: THREE.Material; m: THREE.Matrix4 };
/** A yard's farm extras for the layer (actor-keyed by yardFarms). */
export type YardFarm = { fx: [number, FixtureKind][]; mach: [number, MachineKind, boolean][]; giants: number[] };

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
const mats = new Map<string, THREE.MeshStandardMaterial>();
/** One shared material per colour (instanced batches group by material). */
export const tone = (color: string) => {
  let m = mats.get(color);
  if (!m) mats.set(color, (m = std(color)));
  return m;
};
export const FARM_GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 10, 8),
  cone: new THREE.ConeGeometry(1, 1, 7),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 8),
  pyramid: new THREE.ConeGeometry(1, 1, 4),
};
const G = FARM_GEO;
const tmp = new THREE.Object3D();
export function matrix(x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rx = 0, rz = 0) {
  tmp.position.set(x, y, z);
  tmp.rotation.set(rx, ry, rz);
  tmp.scale.set(sx, sy, sz);
  tmp.updateMatrix();
  return tmp.matrix.clone();
}

// ---------------------------------------------------------------- crops
type Form = 'root' | 'leafy' | 'bush' | 'vine' | 'trellis' | 'flower' | 'stalk' | 'herb';
const LOOK: Record<NewCrop, { form: Form; leaf: string; fruit: string; green?: string }> = {
  garlic: { form: 'root', leaf: '#8aa35a', fruit: '#efe6d2' },
  pea: { form: 'trellis', leaf: '#6fb050', fruit: '#9fd36e' },
  lettuce: { form: 'leafy', leaf: '#8cc663', fruit: '#c8ec9c' },
  tulip: { form: 'flower', leaf: '#5f9e48', fruit: '#e0566e' },
  onion: { form: 'root', leaf: '#8aa35a', fruit: '#c98f52' },
  pepper: { form: 'bush', leaf: '#4f8a3a', fruit: '#cf3a2c' },
  cucumber: { form: 'trellis', leaf: '#5f9e48', fruit: '#3f7a34' },
  blueberry: { form: 'bush', leaf: '#3f7a3f', fruit: '#4a5fa8' },
  chamoe: { form: 'vine', leaf: '#6aa54c', fruit: '#e9b82e' },
  zinnia: { form: 'flower', leaf: '#5f9e48', fruit: '#d9506a' },
  grape: { form: 'trellis', leaf: '#6a9e4a', fruit: '#6f3a8a' },
  radish: { form: 'root', leaf: '#6fae4f', fruit: '#efebe0' },
  eggplant: { form: 'bush', leaf: '#4f8a3a', fruit: '#5f3478' },
  chrysanthemum: { form: 'flower', leaf: '#4f7e40', fruit: '#e8bf3a' },
  greenonion: { form: 'stalk', leaf: '#4f9a3c', fruit: '#efebe0' },
  insam: { form: 'herb', leaf: '#4f8a3a', fruit: '#cf3a2c' },
  hop: { form: 'trellis', leaf: '#5f9a45', fruit: '#c6dd84' },
};
const GREEN_FRUIT = '#9bc45a',
  MOUND = '#6a452b',
  STAKE = '#9a6a42',
  BUD = '#7fae55';
export const isNewCrop = (crop: string): crop is NewCrop => (NEW_CROP_IDS as readonly string[]).includes(crop);
export const isTrellisCrop = (crop: string) => isNewCrop(crop) && LOOK[crop].form === 'trellis';
const HEIGHT = [0.06, 0.16, 0.26, 0.34, 0.4] as const;

/**
 * Shapes of a new crop at growth stage `g` (0–4) around the local origin
 * (tile centre on the soil). `seed` varies the leaf angles per tile.
 */
export function newCropShapes(out: Instance[], crop: NewCrop, g: number, seed: number) {
  const look = LOOK[crop],
    leaf = tone(look.leaf),
    ripe = g >= 4,
    h = HEIGHT[Math.max(0, Math.min(4, g))];
  if (g <= 0) {
    out.push({ geo: G.sphere, mat: tone(MOUND), m: matrix(0, 0, 0, 0.17, 0.06, 0.13) });
    out.push({ geo: G.cone, mat: leaf, m: matrix(0, 0.07, 0, 0.022, 0.08, 0.022) });
    return;
  }
  const fruitMat = tone(ripe ? look.fruit : GREEN_FRUIT);
  const ring = (n: number, r: number, f: (a: number, x: number, z: number, i: number) => void) => {
    for (let i = 0; i < n; i++) {
      const a = seed + (i / n) * Math.PI * 2;
      f(a, Math.cos(a) * r, Math.sin(a) * r, i);
    }
  };
  switch (look.form) {
    case 'root':
      ring(2 + g, 0.04, (a, x, z) =>
        out.push({ geo: G.cone, mat: leaf, m: matrix(x, h / 2, z, 0.022, h, 0.022, 0, Math.sin(a) * 0.3, -Math.cos(a) * 0.3) }),
      );
      if (g >= 3) out.push({ geo: G.sphere, mat: tone(look.fruit), m: matrix(0, 0.02, 0, ripe ? 0.09 : 0.06, ripe ? 0.07 : 0.045, ripe ? 0.09 : 0.06) });
      break;
    case 'leafy':
      ring(3 + g, 0.05 + g * 0.015, (a, x, z) =>
        out.push({ geo: G.sphere, mat: leaf, m: matrix(x, h * 0.35, z, 0.06 + g * 0.018, 0.03 + g * 0.01, 0.05 + g * 0.012, a) }),
      );
      if (g >= 3) out.push({ geo: G.sphere, mat: tone(look.fruit), m: matrix(0, h * 0.45, 0, 0.05 + (ripe ? 0.04 : 0.01), 0.05 + (ripe ? 0.03 : 0), 0.05 + (ripe ? 0.04 : 0.01)) });
      break;
    case 'bush':
      out.push({ geo: G.sphere, mat: leaf, m: matrix(0, h * 0.55, 0, 0.07 + g * 0.025, h * 0.55, 0.07 + g * 0.025) });
      out.push({ geo: G.cylinder, mat: tone(STAKE), m: matrix(0, h * 0.2, 0, 0.012, h * 0.4, 0.012) });
      if (g >= 3)
        ring(ripe ? 5 : 3, 0.09 + g * 0.01, (_a, x, z, i) =>
          out.push({ geo: crop === 'pepper' || crop === 'eggplant' ? G.cone : G.sphere, mat: fruitMat, m: matrix(x, h * (0.35 + (i % 2) * 0.25), z, 0.03, crop === 'eggplant' ? 0.07 : crop === 'pepper' ? 0.06 : 0.03, 0.03, 0, crop === 'blueberry' ? 0 : Math.PI) }),
        );
      break;
    case 'vine':
      ring(3 + g, 0.1, (a, x, z) =>
        out.push({ geo: G.sphere, mat: leaf, m: matrix(x, 0.04, z, 0.08 + g * 0.012, 0.03, 0.06 + g * 0.01, a) }),
      );
      if (g >= 3) out.push({ geo: G.sphere, mat: fruitMat, m: matrix(0.03, 0.06, 0.05, ripe ? 0.12 : 0.07, ripe ? 0.09 : 0.05, ripe ? 0.1 : 0.06, seed) });
      break;
    case 'trellis': {
      // Two stakes and a crossbar; leaves climb with the stage, fruit hangs from the top.
      const top = 0.2 + g * 0.12;
      for (const dx of [-0.13, 0.13]) out.push({ geo: G.cylinder, mat: tone(STAKE), m: matrix(dx, top / 2, 0, 0.012, top, 0.012) });
      out.push({ geo: G.box, mat: tone(STAKE), m: matrix(0, top, 0, 0.3, 0.018, 0.018) });
      for (let i = 0; i < g * 2; i++) {
        const side = i % 2 ? 0.13 : -0.13,
          y = 0.06 + (i / (g * 2)) * top;
        out.push({ geo: G.sphere, mat: leaf, m: matrix(side + Math.sin(seed + i) * 0.03, y, 0.02, 0.05, 0.04, 0.035, seed + i) });
      }
      if (g >= 3)
        for (const [dx, k] of [[-0.07, 0], [0.06, 1], [0, 2]] as const) {
          if (!ripe && k === 2) continue;
          const y = top - 0.08 - k * 0.04;
          if (crop === 'grape') out.push({ geo: G.cone, mat: fruitMat, m: matrix(dx, y, 0.03, 0.04, 0.09, 0.04, 0, Math.PI) });
          else out.push({ geo: G.cylinder, mat: fruitMat, m: matrix(dx, y, 0.03, 0.018, crop === 'cucumber' ? 0.13 : 0.08, 0.018) });
        }
      break;
    }
    case 'flower':
      out.push({ geo: G.cylinder, mat: leaf, m: matrix(0, h / 2, 0, 0.012, h, 0.012) });
      ring(2, 0.04, (a, x, z) => out.push({ geo: G.sphere, mat: leaf, m: matrix(x, h * 0.3, z, 0.05, 0.015, 0.025, a) }));
      if (g === 3) out.push({ geo: G.sphere, mat: tone(BUD), m: matrix(0, h, 0, 0.035, 0.05, 0.035) });
      if (ripe) {
        out.push({ geo: G.sphere, mat: tone(look.fruit), m: matrix(0, h + 0.02, 0, crop === 'tulip' ? 0.05 : 0.08, crop === 'tulip' ? 0.07 : 0.025, crop === 'tulip' ? 0.05 : 0.08) });
        if (crop !== 'tulip') out.push({ geo: G.sphere, mat: tone(crop === 'zinnia' ? '#f5c52a' : '#c98a1a'), m: matrix(0, h + 0.035, 0, 0.028, 0.015, 0.028) });
      }
      break;
    case 'stalk':
      ring(2 + g, 0.03, (a, x, z) =>
        out.push({ geo: G.cylinder, mat: leaf, m: matrix(x, h / 2 + 0.02, z, 0.014, h, 0.014, 0, Math.sin(a) * 0.08, -Math.cos(a) * 0.08) }),
      );
      if (g >= 3) out.push({ geo: G.cylinder, mat: tone(look.fruit), m: matrix(0, 0.04, 0, 0.05, 0.08, 0.05) });
      break;
    case 'herb':
      ring(2 + g, 0.06, (a, x, z) => out.push({ geo: G.sphere, mat: leaf, m: matrix(x, h * 0.6, z, 0.045, 0.012, 0.03, a) }));
      out.push({ geo: G.cylinder, mat: leaf, m: matrix(0, h * 0.35, 0, 0.01, h * 0.7, 0.01) });
      if (ripe) ring(4, 0.02, (_a, x, z) => out.push({ geo: G.sphere, mat: fruitMat, m: matrix(x, h * 0.75, z, 0.02, 0.02, 0.02) }));
      break;
  }
}
/** Brown, fallen leaves where a crop withered (the tile is empty soil). */
export function deadShapes(out: Instance[], seed: number) {
  for (let i = 0; i < 4; i++) {
    const a = seed + i * 1.7;
    out.push({ geo: G.sphere, mat: tone('#8a6a3a'), m: matrix(Math.cos(a) * 0.07, 0.015, Math.sin(a) * 0.07, 0.07, 0.012, 0.025, a) });
  }
  out.push({ geo: G.cylinder, mat: tone('#7a5a32'), m: matrix(0, 0.05, 0, 0.01, 0.1, 0.01, 0, 0.5, 0.2) });
}
/** Fertilizer grains on the soil: cream (비료), gold-green (고급), lilac (별빛). */
export function fertShapes(out: Instance[], level: number, seed: number) {
  const color = level >= 3 ? '#c8b0f0' : level === 2 ? '#d8d070' : '#efe2c0';
  for (let i = 0; i < 3; i++) {
    const a = seed * 1.3 + i * 2.2;
    out.push({ geo: G.sphere, mat: tone(color), m: matrix(Math.cos(a) * 0.24, 0.005, Math.sin(a) * 0.24, 0.025, 0.012, 0.025) });
  }
}
/** One giant crop over a whole bed (3 × 2 tiles), centred on the bed. */
export function giantShapes(out: Instance[], crop: string) {
  if (crop === 'pumpkin') {
    for (const [dx, s] of [[-0.18, 0.8], [0.18, 0.8], [0, 0.95]] as const)
      out.push({ geo: G.sphere, mat: tone('#ef8a25'), m: matrix(dx, 0.36, 0, 0.62 * s, 0.42, 0.55) });
    out.push({ geo: G.cylinder, mat: tone('#4a7a2e'), m: matrix(0, 0.82, 0, 0.05, 0.18, 0.05, 0, 0.2) });
  } else if (crop === 'cabbage') {
    out.push({ geo: G.sphere, mat: tone('#b8dc8f'), m: matrix(0, 0.34, 0, 0.62, 0.42, 0.52) });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      out.push({ geo: G.sphere, mat: tone('#6fa84a'), m: matrix(Math.cos(a) * 0.55, 0.14, Math.sin(a) * 0.4, 0.34, 0.1, 0.26, a) });
    }
  } else {
    out.push({ geo: G.sphere, mat: tone('#3f8f3e'), m: matrix(0, 0.34, 0, 0.8, 0.4, 0.5) });
    for (const dz of [-0.28, 0, 0.28]) out.push({ geo: G.sphere, mat: tone('#255e28'), m: matrix(0, 0.35, dz, 0.81, 0.39, 0.05) });
  }
}

// ---------------------------------------------------------------- fixtures and machines
const SPRINKLER_HEAD: Record<string, string> = { sprinkler: '#c77a3f', 'sprinkler-q': '#a9b4be', 'sprinkler-s': '#b99cf0' };
export function fixtureShapes(out: Instance[], kind: FixtureKind) {
  if (kind === 'beehouse') {
    out.push({ geo: G.box, mat: tone('#e2b870'), m: matrix(0, 0.2, 0, 0.34, 0.32, 0.3) });
    out.push({ geo: G.pyramid, mat: tone('#8a5a34'), m: matrix(0, 0.44, 0, 0.3, 0.16, 0.3, Math.PI / 4) });
    out.push({ geo: G.box, mat: tone('#5a3418'), m: matrix(0, 0.08, 0.151, 0.1, 0.03, 0.01) });
    return;
  }
  if (kind === 'scarecrow') {
    out.push({ geo: G.cylinder, mat: tone(STAKE), m: matrix(0, 0.35, 0, 0.018, 0.7, 0.018) });
    out.push({ geo: G.box, mat: tone(STAKE), m: matrix(0, 0.5, 0, 0.42, 0.025, 0.025) });
    out.push({ geo: G.box, mat: tone('#c95f3f'), m: matrix(0, 0.46, 0, 0.18, 0.2, 0.08) });
    out.push({ geo: G.sphere, mat: tone('#f2d88a'), m: matrix(0, 0.66, 0, 0.08, 0.08, 0.08) });
    out.push({ geo: G.cone, mat: tone('#c9a36a'), m: matrix(0, 0.76, 0, 0.14, 0.1, 0.14) });
    return;
  }
  const head = tone(SPRINKLER_HEAD[kind] ?? '#c77a3f');
  out.push({ geo: G.cylinder, mat: tone('#6f726b'), m: matrix(0, 0.12, 0, 0.018, 0.24, 0.018) });
  out.push({ geo: G.cylinder, mat: head, m: matrix(0, 0.26, 0, 0.07, 0.05, 0.07) });
  out.push({ geo: G.cone, mat: head, m: matrix(0, 0.31, 0, 0.04, 0.05, 0.04) });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    out.push({ geo: G.sphere, mat: tone('#8fd0f0'), m: matrix(Math.cos(a) * 0.1, 0.3, Math.sin(a) * 0.1, 0.015, 0.015, 0.015) });
  }
}
/** 덩굴 시렁 (F2): posts at both ends and the middle, a top rail and two strings, over three tiles (local x −1…+1). */
export function trellisShapes(out: Instance[]) {
  for (const x of [-1.4, 0, 1.4]) out.push({ geo: G.cylinder, mat: tone(STAKE), m: matrix(x, 0.42, 0, 0.025, 0.84, 0.025) });
  out.push({ geo: G.box, mat: tone(STAKE), m: matrix(0, 0.84, 0, 2.9, 0.035, 0.035) });
  for (const y of [0.34, 0.6]) out.push({ geo: G.box, mat: tone('#d8c39a'), m: matrix(0, y, 0, 2.8, 0.012, 0.012) });
}
export function machineShapes(out: Instance[], kind: MachineKind, busy: boolean, hasOnggi: boolean) {
  if (kind === 'jar') {
    if (!hasOnggi) {
      out.push({ geo: G.sphere, mat: tone('#7a4a2a'), m: matrix(0, 0.2, 0, 0.2, 0.22, 0.2) });
      out.push({ geo: G.cylinder, mat: tone('#5a3418'), m: matrix(0, 0.42, 0, 0.13, 0.04, 0.13) });
    }
  } else if (kind === 'keg') {
    out.push({ geo: G.cylinder, mat: tone('#b9854a'), m: matrix(0, 0.22, 0, 0.17, 0.42, 0.17) });
    for (const y of [0.08, 0.36]) out.push({ geo: G.cylinder, mat: tone('#5f6a74'), m: matrix(0, y, 0, 0.175, 0.025, 0.175) });
    out.push({ geo: G.box, mat: tone('#5a3418'), m: matrix(0, 0.16, 0.18, 0.04, 0.04, 0.04) });
  } else if (kind === 'dehydrator') {
    out.push({ geo: G.box, mat: tone('#c9a36a'), m: matrix(0, 0.2, 0, 0.36, 0.38, 0.28) });
    for (const y of [0.1, 0.2, 0.3]) out.push({ geo: G.box, mat: tone('#8a5a34'), m: matrix(0, y, 0.142, 0.3, 0.02, 0.01) });
  } else {
    out.push({ geo: G.box, mat: tone('#8a5a34'), m: matrix(0, 0.14, 0, 0.3, 0.26, 0.26) });
    out.push({ geo: G.cone, mat: tone('#a9b4be'), m: matrix(0, 0.36, 0, 0.16, 0.2, 0.16, 0, Math.PI) });
  }
  // A warm lamp on top while it works.
  if (busy) out.push({ geo: G.sphere, mat: BUSY, m: matrix(0.12, 0.5, 0.1, 0.035, 0.035, 0.035) });
}
const BUSY = new THREE.MeshBasicMaterial({ color: '#ffc85a', toneMapped: false });

/** Where work-yard slot `slot` (0–3) stands in a yard: west of the path, between the 장독대 and the house. */
export function workSlotPoint(yard: FarmYard, slot: number): VillagePoint {
  const col = slot % 2,
    row = Math.floor(slot / 2);
  return { x: Math.round((yard.pathX - 0.95 - col * 0.8) * 100) / 100, z: -16.55 - row * 0.8 };
}
/** uid-keyed farmsPublic → actor-keyed yards for the layer. */
export function yardFarms(life: LifeView | null | undefined): Record<number, YardFarm> {
  const out: Record<number, YardFarm> = {};
  if (!life?.farmsPublic) return out;
  for (const [uid, f] of Object.entries(life.farmsPublic)) {
    const actor = life.actors?.[uid];
    if (actor !== undefined) out[actor] = f;
  }
  return out;
}

type Loader = (url: string) => Promise<THREE.Group>;
/**
 * Fixtures on the tiles and machines in the work yards of every friend. The
 * kArchive onggi and scarecrow sources are cloned per placement once loaded
 * (primitives until then), everything else is instanced.
 */
export class FarmExtrasLayer {
  readonly root = new THREE.Group();
  private batch: (instances: Instance[]) => void;
  private models: Partial<Record<'onggi' | 'scarecrow', THREE.Group>> = {};
  private modelRoot = new THREE.Group();
  private lastKey = '';
  constructor(parent: THREE.Object3D, batch: (group: THREE.Group) => (instances: Instance[]) => void) {
    this.root.name = 'village-farm-extras';
    parent.add(this.root);
    const shapes = new THREE.Group();
    this.root.add(shapes, this.modelRoot);
    this.batch = batch(shapes);
  }
  /** Loads the two reused kArchive models (cached by the village loader). */
  load(load: Loader, changed: (id: string) => void): Promise<void>[] {
    return (['onggi', 'scarecrow'] as const).map((key) =>
      load(VALLEY_MODELS[key]).then((source) => {
        this.models[key] = source;
        this.lastKey = '';
        changed(`farm${key[0].toUpperCase()}${key.slice(1)}`);
      }),
    );
  }
  private placeModel(key: 'onggi' | 'scarecrow', x: number, z: number, height: number, ry: number, base: number) {
    const source = this.models[key]!;
    const box = new THREE.Box3().setFromObject(source),
      size = box.getSize(new THREE.Vector3()),
      s = height / Math.max(0.001, size.y);
    const holder = new THREE.Group();
    holder.add(source.clone(true));
    holder.scale.setScalar(s);
    holder.position.set(x, base - box.min.y * s, z);
    holder.rotation.y = ry;
    holder.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) c.castShadow = c.receiveShadow = true;
    });
    this.modelRoot.add(holder);
  }
  /** Redraws when the yards changed; true when anything visible changed. */
  update(farms: Record<number, YardFarm>): boolean {
    const key = JSON.stringify([farms, !!this.models.onggi, !!this.models.scarecrow]);
    if (key === this.lastKey) return false;
    this.lastKey = key;
    const out: Instance[] = [];
    this.modelRoot.clear();
    for (const yard of VILLAGE_YARDS) {
      const f = farms[yard.actor];
      if (!f) continue;
      for (const [tile, kind] of f.fx) {
        const at = yardPlotCenter(yard, tile);
        if (kind === 'scarecrow' && this.models.scarecrow) {
          this.placeModel('scarecrow', at.x, at.z, 0.9, -0.3, 0.2);
          continue;
        }
        const place = new THREE.Matrix4().makeTranslation(at.x, 0.2, at.z);
        const local: Instance[] = [];
        fixtureShapes(local, kind);
        for (const i of local) out.push({ ...i, m: place.clone().multiply(i.m) });
      }
      for (const [slot, kind, busy] of f.mach) {
        const at = workSlotPoint(yard, slot);
        const hasOnggi = kind === 'jar' && !!this.models.onggi;
        if (hasOnggi) this.placeModel('onggi', at.x, at.z, 0.5, slot, 0.03);
        const place = new THREE.Matrix4().makeTranslation(at.x, 0.03, at.z);
        const local: Instance[] = [];
        machineShapes(local, kind, busy, hasOnggi);
        for (const i of local) out.push({ ...i, m: place.clone().multiply(i.m) });
      }
    }
    this.batch(out);
    return true;
  }
}
