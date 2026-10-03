// 우리 농장 F3 in three.js: the facility sites, the 공동 밭 and the 공동 창고
// (design-our-farm.md §3-5, §10). Two parts so the farm set stays light:
//  - siteInstances: everything small and many (stakes and ropes of empty
//    sites, building crates, greenhouse frames and glass, beds, crops, the
//    machine-yard floor, saplings and fruit) as instances for the farm's
//    Batches (a handful of draw calls however much stands);
//  - SiteDecor: the few real models (kArchive greenhouse, tool shed, grown
//    fruit trees: 자료 kArchive · 출처 쓰레드 dogfooter) and the signs, made
//    once per look and only shown or hidden afterwards.
// Layout: lounge-farm-sites-layout.ts. State: the life view's farmSites.
import * as THREE from 'three';
import { FARM_GEO as G, deadShapes, giantShapes, tone } from './lounge-farm-3d';
import { MAT, SOIL_TOP, cropInstances, matrix, type Instance } from './lounge-village-life-3d';
import {
  COMMON_SIGN,
  FARM_COMMON,
  FARM_SITES,
  FARM_STORE,
  YARD_BACK,
  commonTileCenter,
  gridTileCenter,
  orchardTreeAt,
  type FarmSite,
} from './lounge-farm-sites-layout';
import {
  COMMON_COLS,
  COMMON_ROWS,
  FACILITY_BY_ID,
  GREENHOUSE_COLS,
  GREENHOUSE_ROWS,
  MINI_GREENHOUSE_COLS,
  MINI_GREENHOUSE_ROWS,
  SITE_SIZE_NAME,
  commonBedTiles,
} from './lounge-farm-sites-data';
import type { FarmSitesView, SitePlotView, SiteView } from './lounge-farm-sites';
import type { Crop } from './lounge-life';
import type { SignColors } from './lounge-district-kit';

const SOIL = 0.9;
const STAKE = '#8a6242';
const ROPE = '#e8dcc0';
const GLASS = new THREE.MeshStandardMaterial({ color: '#d6eef2', transparent: true, opacity: 0.26, roughness: 0.15, metalness: 0.1, depthWrite: false });
const FRUIT_COLOR: Readonly<Record<string, string>> = { apricot: '#f2a33a', peach: '#f7a6a0', apple: '#e04a3a', pear: '#e8d36a', tangerine: '#f28c28' };
export const SIGN_SITE: SignColors = { bg: '#efe9dc', ink: '#5a4a3a', line: '#a89a84' };
export const SIGN_BUILT: SignColors = { bg: '#f6e7cf', ink: '#6a3a1e', line: '#b4763f' };

/** Where a greenhouse's beds sit in its site (centre). */
export const greenhouseBeds = (s: FarmSite, mini: boolean) =>
  mini
    ? { x: s.x, z: s.z + 0.3, cols: MINI_GREENHOUSE_COLS, rows: MINI_GREENHOUSE_ROWS }
    : { x: s.x, z: s.z + 0.8, cols: GREENHOUSE_COLS, rows: GREENHOUSE_ROWS };
/** The built machine yard (its site), if one stands. */
export function machineYardSite(sites: FarmSitesView | undefined): FarmSite | null {
  const v = sites?.sites.find((x) => x.k === 'machineYard' && x.t >= 1);
  return v ? (FARM_SITES.find((s) => s.id === v.id) ?? null) : null;
}

const at = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const push = (out: Instance[], place: THREE.Matrix4, local: Instance[]) => {
  for (const i of local) out.push({ ...i, m: place.clone().multiply(i.m) });
};
/** A staked rope outline round a site (empty or being built). */
function outline(out: Instance[], s: { x: number; z: number; w: number; d: number }) {
  const x0 = s.x - s.w / 2,
    z0 = s.z - s.d / 2;
  for (const [x, z, w, d] of [
    [s.x, z0, s.w, 0.06],
    [s.x, z0 + s.d, s.w, 0.06],
    [x0, s.z, 0.06, s.d],
    [x0 + s.w, s.z, 0.06, s.d],
  ])
    out.push({ geo: G.box, mat: tone(ROPE), m: matrix(x, 0.03, z, w, 0.03, d) });
  for (const [x, z] of [
    [x0, z0],
    [x0 + s.w, z0],
    [x0, z0 + s.d],
    [x0 + s.w, z0 + s.d],
  ])
    out.push({ geo: G.box, mat: tone(STAKE), m: matrix(x, 0.25, z, 0.08, 0.5, 0.08) });
}
/** Building materials piled on a site that is being funded. */
function buildingPile(out: Instance[], s: FarmSite) {
  out.push({ geo: G.box, mat: tone('#c49058'), m: matrix(s.x - 0.8, 0.25, s.z + 0.4, 0.8, 0.5, 0.6, 0.2) });
  out.push({ geo: G.box, mat: tone('#c49058'), m: matrix(s.x - 0.1, 0.2, s.z + 0.7, 0.6, 0.4, 0.5, -0.3) });
  for (let i = 0; i < 4; i++) out.push({ geo: G.cylinder, mat: tone('#9a6a42'), m: matrix(s.x + 0.9, 0.1 + i * 0.12, s.z + 0.3, 0.06, 1.6, 0.06, 0, 0, Math.PI / 2) });
  out.push({ geo: G.sphere, mat: tone('#a59a88'), m: matrix(s.x + 0.5, 0.15, s.z + 1.1, 0.3, 0.18, 0.25) });
}
/** Beds and crops of a plot grid (greenhouses, the shared field's tilled tiles). */
function plotInstances(out: Instance[], center: (t: number) => { x: number; z: number }, tiles: readonly number[], plots: readonly SitePlotView[], seed: number) {
  const byTile = new Map(plots.map((p) => [p.t, p]));
  for (const t of tiles) {
    const c = center(t),
      p = byTile.get(t);
    out.push({ geo: G.box, mat: p?.w ? MAT.soilWet : MAT.soil, m: matrix(c.x, 0.14, c.z, SOIL, 0.12, SOIL) });
    if (!p) continue;
    if (p.c) cropInstances(out, c, p.c, 0, seed + t, p.g);
    else if (p.d) {
      const local: Instance[] = [];
      deadShapes(local, seed + t);
      push(out, at(c.x, SOIL_TOP, c.z), local);
    }
  }
}
/** A glass house frame over a bed block (posts, eaves and a pitched glass roof). */
function glassHouse(out: Instance[], x: number, z: number, w: number, d: number, h: number) {
  const post = tone('#e9ecef');
  for (const [px, pz] of [
    [x - w / 2, z - d / 2],
    [x + w / 2, z - d / 2],
    [x - w / 2, z + d / 2],
    [x + w / 2, z + d / 2],
    [x, z - d / 2],
    [x, z + d / 2],
  ])
    out.push({ geo: G.box, mat: post, m: matrix(px, h / 2, pz, 0.08, h, 0.08) });
  for (const pz of [z - d / 2, z + d / 2]) out.push({ geo: G.box, mat: post, m: matrix(x, h, pz, w, 0.06, 0.06) });
  out.push({ geo: G.box, mat: post, m: matrix(x, h + d * 0.28, z, w, 0.06, 0.06) });
  // Two roof panes from the eaves up to the ridge, and the gable walls (glass).
  const slope = Math.atan2(d * 0.28, d / 2),
    len = Math.hypot(d / 2, d * 0.28);
  for (const side of [-1, 1]) out.push({ geo: G.box, mat: GLASS, m: matrix(x, h + d * 0.14, z + (side * d) / 4, w, 0.02, len, 0, side * slope) });
  for (const side of [-1, 1]) out.push({ geo: G.box, mat: GLASS, m: matrix(x + (side * w) / 2, h / 2, z, 0.02, h, d) });
  out.push({ geo: G.box, mat: GLASS, m: matrix(x, h / 2, z - d / 2, w, h, 0.02) });
}
function orchardInstances(out: Instance[], s: FarmSite, v: SiteView, day: number) {
  for (const t of v.tr ?? []) {
    const p = orchardTreeAt(s, t.s);
    out.push({ geo: G.cylinder, mat: tone('#8a5a3a'), m: matrix(p.x, 0.02, p.z, 0.34, 0.04, 0.34) });
    if (day < t.from) {
      // A sapling: a thin stem with a small crown (the grown tree is a model, SiteDecor).
      out.push({ geo: G.cylinder, mat: tone('#7a5234'), m: matrix(p.x, 0.32, p.z, 0.035, 0.64, 0.035) });
      out.push({ geo: G.sphere, mat: tone('#6fae54'), m: matrix(p.x, 0.72, p.z, 0.22, 0.2, 0.22) });
      continue;
    }
    for (let i = 0; i < t.n; i++) {
      const a = i * 2.1 + t.s;
      out.push({ geo: G.sphere, mat: tone(FRUIT_COLOR[t.f] ?? '#e04a3a'), m: matrix(p.x + Math.cos(a) * 0.45, 1.25 + (i % 2) * 0.2, p.z + 0.25 + Math.sin(a) * 0.2, 0.09, 0.09, 0.09) });
    }
  }
}
/**
 * Every instanced piece of the sites and the 공동 밭 (`day`: the KST day, for
 * when a sapling has grown). Machines in the yard are drawn with the fields.
 */
export function siteInstances(sites: FarmSitesView | undefined, day: number): Instance[] {
  const out: Instance[] = [];
  const byId = new Map((sites?.sites ?? []).map((v) => [v.id, v]));
  for (const s of FARM_SITES) {
    const v = byId.get(s.id);
    if (!v || v.t < 1) {
      outline(out, s);
      if (v) buildingPile(out, s);
      continue;
    }
    const seed = s.x * 3.1 + s.z;
    if (v.k === 'greenhouse' || v.k === 'greenhouseMini') {
      const mini = v.k === 'greenhouseMini',
        b = greenhouseBeds(s, mini),
        n = b.cols * b.rows;
      out.push({ geo: G.box, mat: tone('#d2bf98'), m: matrix(s.x, 0.012, s.z, s.w - 0.2, 0.02, s.d - 0.2) });
      plotInstances(out, (t) => gridTileCenter(b, b.cols, b.rows, t), Array.from({ length: n }, (_, i) => i), v.p ?? [], seed);
      glassHouse(out, b.x, b.z, b.cols + 0.4, b.rows + 0.4, mini ? 1.5 : 2);
    } else if (v.k === 'machineYard') {
      out.push({ geo: G.box, mat: tone('#c9b58f'), m: matrix(s.x, 0.012, s.z, s.w - 0.2, 0.02, s.d - 0.2) });
      // A low fence along the back strip.
      out.push({ geo: G.box, mat: tone('#9a6a42'), m: matrix(s.x, 0.3, s.z - s.d / 2 + YARD_BACK - 0.1, s.w - 0.4, 0.06, 0.06) });
    } else if (v.k === 'orchardPlot') {
      out.push({ geo: G.box, mat: tone('#9fbf6a'), m: matrix(s.x, 0.012, s.z, s.w - 0.3, 0.02, s.d - 0.3) });
      orchardInstances(out, s, v, day);
    } else {
      // A facility without its own look yet (later stages): its ground.
      out.push({ geo: G.box, mat: tone('#d2bf98'), m: matrix(s.x, 0.012, s.z, s.w - 0.2, 0.02, s.d - 0.2) });
    }
  }
  // 공동 밭: the tilled tiles (grass elsewhere), crops and giant beds.
  const f = sites?.field;
  const giantTiles = new Set((f?.giants ?? []).flatMap(commonBedTiles));
  plotInstances(
    out,
    commonTileCenter,
    f?.till ?? [],
    (f?.p ?? []).filter((p) => !giantTiles.has(p.t)),
    11,
  );
  for (const bed of f?.giants ?? []) {
    const tiles = commonBedTiles(bed),
      first = f?.p.find((p) => p.t === tiles[0]);
    if (!first?.c) continue;
    const a = commonTileCenter(tiles[0]),
      b = commonTileCenter(tiles[5]);
    const local: Instance[] = [];
    giantShapes(local, first.c as Crop);
    push(out, at((a.x + b.x) / 2, SOIL_TOP, (a.z + b.z) / 2).multiply(new THREE.Matrix4().makeScale(1.25, 1.25, 1.25)), local);
  }
  return out;
}

/** What the decor needs from the farm set (its protected kit helpers, bound). */
export type DecorKit = {
  place: (model: string, x: number, z: number, size: { w: number; h: number; d: number }, rot?: number, name?: string) => THREE.Object3D;
  signpost: (text: string, sub: string, colors: SignColors, x: number, z: number, opts?: { w?: number; h?: number; name?: string }) => THREE.Object3D;
  plane: (w: number, d: number, color: string, y: number) => THREE.Mesh;
  box: (w: number, h: number, d: number, color: string) => THREE.Mesh;
};
/** Models and signs of the sites, made once per look and toggled after. */
export class SiteDecor {
  readonly group = new THREE.Group();
  private parts = new Map<string, THREE.Object3D[]>();
  private key = '';
  private readonly kit: DecorKit;
  /** Friends' names by actor (signs of personal sites). */
  private readonly names: readonly string[];

  constructor(root: THREE.Group, kit: DecorKit, names: readonly string[]) {
    this.kit = kit;
    this.names = names;
    this.group.name = 'farm-sites';
    root.add(this.group);
    this.buildCommon(root);
  }

  /** The 공동 밭's grass, rim and sign, and the 공동 창고 crate (always there). */
  private buildCommon(root: THREE.Group) {
    const C = FARM_COMMON;
    const base = this.kit.plane(C.w, C.d, '#8eac5c', 0.008);
    base.position.set(C.x, 0.008, C.z);
    base.name = 'farm-common';
    root.add(base);
    for (const [x, z, w, d] of [
      [C.x, C.z - C.d / 2 - 0.05, C.w + 0.2, 0.1],
      [C.x, C.z + C.d / 2 + 0.05, C.w + 0.2, 0.1],
      [C.x - C.w / 2 - 0.05, C.z, 0.1, C.d],
      [C.x + C.w / 2 + 0.05, C.z, 0.1, C.d],
    ]) {
      const m = this.kit.box(w, 0.1, d, '#8a6242');
      m.position.set(x, 0.05, z);
      root.add(m);
    }
    this.kit.signpost('공동 밭', `누구나 심고 거둬요 · ${COMMON_COLS}×${COMMON_ROWS}`, SIGN_BUILT, COMMON_SIGN.x, COMMON_SIGN.z, { w: 2.2, h: 1.4, name: 'farm-common-sign' });
    const S = FARM_STORE;
    this.kit.place('produceCrate', S.x, S.z, { w: S.w, h: 0.7, d: S.d }, 0, 'farm-store');
    this.kit.signpost('공동 창고', '꾸러미 · 축제 기부', SIGN_SITE, S.x + 1.2, S.z - 0.2, { w: 1.8, h: 1.3, name: 'farm-store-sign' });
  }

  /** Shows the look of every site for this state (`day`: KST day, grown trees). */
  update(sites: FarmSitesView | undefined, day: number) {
    const byId = new Map((sites?.sites ?? []).map((v) => [v.id, v]));
    const wants: [string, () => THREE.Object3D[]][] = [];
    for (const s of FARM_SITES) {
      const v = byId.get(s.id);
      const signZ = s.z - s.d / 2 + 0.4;
      if (!v) {
        const label = s.actor !== undefined ? `${this.names[s.actor] ?? '친구'}의 부지` : `빈 ${SITE_SIZE_NAME[s.size]}`;
        wants.push([`empty:${s.id}`, () => [this.kit.signpost(label, '시설 짓는 자리', SIGN_SITE, s.x, signZ, { w: 2, h: 1.2, name: 'farm-site-' + s.id })]]);
        continue;
      }
      const def = FACILITY_BY_ID[v.k];
      if (v.t < 1) {
        wants.push([`build:${s.id}:${v.k}`, () => [this.kit.signpost(`${def.name} 공사 중`, '범과 재료를 보태 주세요', SIGN_SITE, s.x, signZ, { w: 2.2, h: 1.3, name: 'farm-site-' + s.id })]]);
        continue;
      }
      const owner = v.o !== undefined ? `${this.names[v.o] ?? '친구'}의 ` : '';
      const sign = () => this.kit.signpost(owner + def.name, v.k === 'machineYard' ? `${v.t}단계` : '', SIGN_BUILT, s.x - s.w / 2 + 1.1, signZ, { w: 2, h: 1.3, name: 'farm-site-' + s.id });
      if (v.k === 'greenhouse') {
        wants.push([`gh:${s.id}`, () => [sign(), this.kit.place('greenhouse', s.x + 2.6, s.z - s.d / 2 + 1.3, { w: 3.2, h: 2.4, d: 2.3 }, 0, 'farm-greenhouse-' + s.id)]]);
      } else if (v.k === 'machineYard') {
        wants.push([`yard:${s.id}:${v.t}`, () => [sign(), this.kit.place('toolShed', s.x + s.w / 2 - 1, s.z - s.d / 2 + 0.7, { w: 1.5, h: 1.6, d: 1.1 }, 0, 'farm-yard-shed-' + s.id)]]);
      } else if (v.k === 'orchardPlot') {
        for (const t of v.tr ?? []) {
          if (day < t.from) continue;
          const p = orchardTreeAt(s, t.s);
          wants.push([`tree:${s.id}:${t.s}`, () => [this.kit.place('broadleafTree', p.x, p.z, { w: 1.3, h: 2, d: 1.3 }, t.s, `farm-orchard-${s.id}-${t.s}`)]]);
        }
        wants.push([`orchard:${s.id}`, () => [sign()]]);
      } else if (v.k === 'barn') {
        // 우리 농장 F4: the 축사 (the tool shed scaled up, like 닐라's) and its 사일로; 2층 stands taller.
        const h = v.t >= 2 ? 3.4 : 2.6;
        wants.push([
          `barn:${s.id}:${v.t}`,
          () => {
            const silo = this.kit.box(1.3, 3.6, 1.3, '#c9b48a');
            silo.position.set(s.x + s.w / 2 - 1.2, 1.8, s.z - s.d / 2 + 1.4);
            silo.name = 'farm-silo-' + s.id;
            return [sign(), this.kit.place('toolShed', s.x + 0.6, s.z - s.d / 2 + 2, { w: 4.4, h, d: 3 }, 0, 'farm-barn-' + s.id), silo];
          },
        ]);
      } else if (v.k === 'coop') {
        wants.push([`coop:${s.id}:${v.t}`, () => [sign(), this.kit.place('toolShed', s.x + 1, s.z - s.d / 2 + 1.5, { w: v.t >= 2 ? 3 : 2.2, h: 1.8, d: 1.8 }, 0, 'farm-coop-' + s.id)]]);
      } else {
        wants.push([`site:${s.id}:${v.k}`, () => [sign()]]);
      }
    }
    const key = wants.map(([k]) => k).join('|');
    if (key === this.key) return;
    this.key = key;
    const keep = new Set(wants.map(([k]) => k));
    for (const [k, objs] of this.parts) for (const o of objs) o.visible = keep.has(k);
    for (const [k, make] of wants) {
      if (this.parts.has(k)) continue;
      const objs = make();
      // Signs come in two pieces (post and board); keep both with the part.
      const all = objs.flatMap((o) => (o.name.startsWith('farm-site-') ? [o, ...this.siblingPost(o)] : [o]));
      for (const o of all) this.group.add(o);
      this.parts.set(k, all);
    }
  }
  /** The post a signpost added right before its board (DistrictSet.signpost adds both to the root). */
  private siblingPost(board: THREE.Object3D): THREE.Object3D[] {
    const parent = board.parent;
    if (!parent) return [];
    const i = parent.children.indexOf(board);
    return i > 0 ? [parent.children[i - 1]] : [];
  }
}
