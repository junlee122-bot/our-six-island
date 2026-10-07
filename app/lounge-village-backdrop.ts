// D17: the hub's far edge. The straight-on camera may look a few units past
// the island's rim (clampFollowTarget's margin), and at the top of the screen
// that showed a flat band of sky behind the district gates. This closes it
// off: a darker forest floor beyond the north, west and east rims, two rows
// of low-poly pines that fade into a hazy far row, and soft hills behind.
// The roads through the district gates carry on into the trees.
//
// One InstancedMesh per part (a few draw calls), no shadows, tinted by season
// (setSeason). The south stays open: the beach and the sea are there.
import * as THREE from 'three';
import type { Season } from './lounge-calendar.ts';
import { DISTRICTS, DISTRICT_IDS } from './lounge-districts.ts';
import { VILLAGE_BOUNDS, VILLAGE_FALLS } from './lounge-village-layout.ts';

/** How far the floor reaches past the rim, and where the side strips stop (the coast begins). */
export const BACKDROP_REACH = 26;
export const BACKDROP_SIDE_SOUTH_Z = 12;
const ROAD_HALF = 1.3;
const GATE_GAP = 3.6;

type Palette = { floor: string; road: string; near: string; mid: string; far: string; hill: string };
const PALETTES: Record<Season | 'default', Palette> = {
  default: { floor: '#5f7f52', road: '#b59a74', near: '#3f6646', mid: '#527a55', far: '#7d9a86', hill: '#8fa996' },
  spring: { floor: '#66885a', road: '#b9a079', near: '#456e4b', mid: '#5b845c', far: '#86a28d', hill: '#9bb59f' },
  summer: { floor: '#5a7d4c', road: '#b59a74', near: '#365f3f', mid: '#4b7650', far: '#7a9883', hill: '#8ba792' },
  autumn: { floor: '#7d7a4c', road: '#b8976c', near: '#7b5a2e', mid: '#9a6a32', far: '#a99878', hill: '#b0a88e' },
  winter: { floor: '#dfe7e6', road: '#c9bfae', near: '#55715f', mid: '#8aa196', far: '#c3d0cf', hill: '#d6dfe0' },
};

/** A tiny deterministic hash (the same backdrop on every client). */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43_758.5453;
  return x - Math.floor(x);
};

export type BackdropTree = { x: number; z: number; s: number; row: 0 | 1 | 2 };
/** Where the pines stand: two rows past each rim, gaps at the gates and the falls. */
export function backdropTrees(): BackdropTree[] {
  const hw = VILLAGE_BOUNDS.width / 2,
    hd = VILLAGE_BOUNDS.depth / 2;
  const northGaps = [VILLAGE_FALLS.x, ...DISTRICT_IDS.map((id) => DISTRICTS[id].gate).filter((g) => Math.abs(g.z) > hd - 2 && g.z < 0).map((g) => g.x)];
  const sideGaps = DISTRICT_IDS.map((id) => DISTRICTS[id].gate).filter((g) => Math.abs(g.x) > hw - 2);
  const out: BackdropTree[] = [];
  let i = 0;
  const rows: [number, 0 | 1 | 2][] = [
    [2.2, 0],
    [5.4, 1],
    [10.5, 2],
  ];
  // North: x across the whole width and past the corners.
  for (const [off, row] of rows) {
    const step = row === 2 ? 3.4 : 2.3;
    for (let x = -hw - 14; x <= hw + 14; x += step) {
      i++;
      const jx = x + (rand(i, 1) - 0.5) * step * 0.7;
      if (row < 2 && northGaps.some((g) => Math.abs(jx - g) < GATE_GAP)) continue;
      out.push({ x: jx, z: -hd - off - rand(i, 2) * 1.6, s: (row === 2 ? 1.5 : 1) * (0.85 + rand(i, 3) * 0.45), row });
    }
  }
  // West and east: down to where the coast begins.
  for (const side of [-1, 1]) {
    for (const [off, row] of rows) {
      const step = row === 2 ? 3.4 : 2.3;
      for (let z = -hd - 2; z <= BACKDROP_SIDE_SOUTH_Z; z += step) {
        i++;
        const jz = z + (rand(i, 4) - 0.5) * step * 0.7;
        if (row < 2 && sideGaps.some((g) => Math.sign(g.x) === side && Math.abs(jz - g.z) < GATE_GAP)) continue;
        out.push({ x: side * (hw + off + rand(i, 5) * 1.6), z: jz, s: (row === 2 ? 1.5 : 1) * (0.85 + rand(i, 6) * 0.45), row });
      }
    }
  }
  return out;
}

export class VillageBackdrop {
  readonly root = new THREE.Group();
  private readonly mats = {
    floor: new THREE.MeshStandardMaterial({ roughness: 1 }),
    road: new THREE.MeshStandardMaterial({ roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: '#6b4a33', roughness: 1 }),
    near: new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }),
    mid: new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }),
    far: new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }),
    hill: new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }),
  };
  private readonly geos: THREE.BufferGeometry[] = [];
  private season: Season | null | undefined;

  constructor(parent: THREE.Object3D) {
    this.root.name = 'village-backdrop';
    const hw = VILLAGE_BOUNDS.width / 2,
      hd = VILLAGE_BOUNDS.depth / 2,
      R = BACKDROP_REACH;
    // The floor sits just under the island's grass so the rim reads as a low bank.
    const floorY = -0.12;
    const slab = (w: number, d: number, x: number, z: number, mat: THREE.Material, y = floorY) => {
      const g = new THREE.PlaneGeometry(w, d);
      g.rotateX(-Math.PI / 2);
      this.geos.push(g);
      const m = new THREE.Mesh(g, mat);
      m.position.set(x, y, z);
      m.receiveShadow = false;
      m.castShadow = false;
      this.root.add(m);
    };
    slab(2 * (hw + R), R, 0, -hd - R / 2, this.mats.floor);
    const sideDepth = BACKDROP_SIDE_SOUTH_Z + hd;
    slab(R, sideDepth, -hw - R / 2, -hd + sideDepth / 2, this.mats.floor);
    slab(R, sideDepth, hw + R / 2, -hd + sideDepth / 2, this.mats.floor);
    // The gate roads carry on into the trees.
    for (const id of DISTRICT_IDS) {
      const g = DISTRICTS[id].gate;
      if (g.z < -hd + 2) slab(ROAD_HALF * 2, R, g.x, -hd - R / 2, this.mats.road, floorY + 0.01);
      else if (Math.abs(g.x) > hw - 2 && g.z < BACKDROP_SIDE_SOUTH_Z) slab(R, ROAD_HALF * 2, Math.sign(g.x) * (hw + R / 2), g.z, this.mats.road, floorY + 0.01);
    }
    // Pines: a trunk and a two-tier cone, one InstancedMesh per part and row.
    const trees = backdropTrees();
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.22, 1, 6);
    const lowGeo = new THREE.ConeGeometry(1.15, 2.1, 7);
    const topGeo = new THREE.ConeGeometry(0.8, 1.6, 7);
    this.geos.push(trunkGeo, lowGeo, topGeo);
    const rowMat = [this.mats.near, this.mats.mid, this.mats.far];
    const m4 = new THREE.Matrix4(),
      q = new THREE.Quaternion(),
      v = new THREE.Vector3(),
      sc = new THREE.Vector3();
    const place = (geo: THREE.BufferGeometry, mat: THREE.Material, list: BackdropTree[], y: number, sy = 1) => {
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((t, k) => {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rand(k, 9) * Math.PI);
        m4.compose(v.set(t.x, floorY + y * t.s, t.z), q, sc.set(t.s, t.s * sy, t.s));
        mesh.setMatrixAt(k, m4);
      });
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      this.root.add(mesh);
    };
    for (const row of [0, 1, 2] as const) {
      const list = trees.filter((t) => t.row === row);
      if (row < 2) place(trunkGeo, this.mats.trunk, list, 0.5);
      place(lowGeo, rowMat[row], list, 1.75);
      place(topGeo, rowMat[row], list, 2.85);
    }
    // Soft hills behind the far row (flattened domes).
    const hillGeo = new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    this.geos.push(hillGeo);
    const hills: { x: number; z: number; w: number; h: number }[] = [];
    for (let k = 0, x = -hw - 20; x <= hw + 20; k++, x += 11) hills.push({ x: x + rand(k, 7) * 4, z: -hd - 19 - rand(k, 8) * 3, w: 9 + rand(k, 10) * 6, h: 4 + rand(k, 11) * 3 });
    const hillMesh = new THREE.InstancedMesh(hillGeo, this.mats.hill, hills.length);
    hills.forEach((h, k) => hillMesh.setMatrixAt(k, m4.compose(v.set(h.x, floorY, h.z), q.identity(), sc.set(h.w, h.h, h.w * 0.6))));
    hillMesh.frustumCulled = false;
    this.root.add(hillMesh);
    this.setSeason(null);
    parent.add(this.root);
  }

  /** Recolours the floor and the trees for the season (null = the calendar is not known yet). */
  setSeason(season: Season | null) {
    if (season === this.season) return false;
    this.season = season;
    const p = PALETTES[season ?? 'default'];
    this.mats.floor.color.set(p.floor);
    this.mats.road.color.set(p.road);
    this.mats.near.color.set(p.near);
    this.mats.mid.color.set(p.mid);
    this.mats.far.color.set(p.far);
    this.mats.hill.color.set(p.hill);
    return true;
  }

  dispose() {
    this.root.removeFromParent();
    for (const g of this.geos) g.dispose();
    for (const m of Object.values(this.mats)) m.dispose();
  }
}
