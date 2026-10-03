// 우리 농장 in three.js, on the district kit (lounge-district-kit.ts, 구역 공통
// 규격): the seven friends' kArchive houses in a row along the north edge
// (the hub's house models, door height as before; 자료: kArchive · 출처: 쓰레드
// dogfooter), each friend's 12 × 10 field right in front (F5: a 명인 표지판 before
// a full one, a plastic tunnel over the 서리 덮개's quarter), the lane and the
// paths between the fields, the central yard (shipping bin, mailbox, farm
// board), F3's facility sites and the 공동 밭 (lounge-farm-sites-3d.ts), and
// the road south to the hub. Tilled tiles and
// crops are instanced (the hub's crop shapes, lounge-village-life-3d.ts), so
// all 840 tiles cost a handful of draw calls. Layout: lounge-farm-layout.ts;
// what to draw comes from lounge-farm-view.ts (farmSceneState). No React.
import * as THREE from 'three';
import {
  FARM_BENCHES,
  FARM_BIN,
  FARM_BOARD,
  FARM_D,
  FARM_EXIT,
  FARM_FIELDS,
  FARM_HOUSES,
  FARM_LAMPS,
  FARM_MAILBOX,
  FARM_PAVING,
  FARM_PROPS,
  FARM_TREES,
  FARM_W,
  FIELD_TILE,
  HOME_COLORS,
  HOME_ROOFS,
  farmHouse,
  farmWorkSlot,
  fieldCellCenter,
  fieldOpenRect,
  fieldTileCenter,
  isMasterField,
  masterSign,
} from './lounge-farm-layout';
import { FARM_MODEL_URLS } from './lounge-district-models';
import { DistrictSet, PAVING, districtMat, shadowed, type DistrictUpdate } from './lounge-district-kit';
import { VILLAGE_HOUSE_MODELS, villageHouseScale } from './lounge-village-layout';
import { Batches, GEO, MAT, SOIL_TOP, cropInstances, matrix, type Instance } from './lounge-village-life-3d';
import { FROST_MAT, deadShapes, fixtureShapes, giantShapes, machineShapes, trellisShapes } from './lounge-farm-3d';
import { GRID_TILES, bedTiles, frostTiles, tileOpen } from './lounge-farm-data';
import { trellisTiles, yardSpots } from './lounge-farm-soil';
import type { FarmSceneState } from './lounge-farm-view';
import type { Crop } from './lounge-life';
import { SiteDecor, machineYardSite, siteInstances } from './lounge-farm-sites-3d';
import { yardMachineAt } from './lounge-farm-sites-layout';
import { ACTOR_NAMES } from './lounge-calendar';
import { kstDay } from './lounge-economy';

const SIGN_ROAD = { bg: '#c49a62', ink: '#3c2716', line: '#7d5a36' };
const SIGN_FARM = { bg: '#f6e7cf', ink: '#6a3a1e', line: '#b4763f' };
/** 명인 표지판: gold on dark wood. */
const SIGN_MASTER = { bg: '#f3d27a', ink: '#4a2c12', line: '#8a5a22' };
const FIELD_GRASS = '#8eac5c';
const SOIL_SIZE = FIELD_TILE * 0.9;

export type FarmUpdate = DistrictUpdate & { farm?: FarmSceneState; me?: number };

export class FarmSet extends DistrictSet {
  private readonly dynamic = new THREE.Group();
  private readonly batches: Batches;
  private farmKey = '';
  /** Per house: the 앞마당 정원 (tier 3) and the 2층 다락 (tier 4). */
  private tiers = new Map<number, { garden: THREE.Object3D[]; attic: THREE.Object3D }>();
  private mine = new THREE.Group();
  /** 우리 농장 F3: the facility sites' models and signs. */
  private sites: SiteDecor;
  /** F5: 명인 표지판 per friend (made the first time their field reaches 120 tiles). */
  private masters = new Map<number, THREE.Object3D[]>();

  constructor(look: { ground: string; groundFar: string }) {
    super('farm', FARM_MODEL_URLS);
    this.ground(FARM_W, FARM_D, look);
    for (const p of FARM_PAVING) this.pave(p, p.tone === 'yard' ? PAVING.plaza : p.tone === 'lane' ? PAVING.lane : PAVING.road);
    for (const f of FARM_FIELDS) this.buildFieldBase(f.x0, f.z0, f.w, f.d, f.actor);
    for (const h of FARM_HOUSES) this.buildHouse(h);
    this.buildYard();
    this.sites = new SiteDecor(
      this.root,
      {
        place: (model, x, z, size, rot, name) => this.place(model, x, z, size, rot, name),
        signpost: (text, sub, colors, x, z, opts) => this.signpost(text, sub, colors, x, z, opts),
        plane: (w, d, color, y) => this.plane(w, d, color, y),
        box: (w, h, d, color) => this.box(w, h, d, color),
      },
      ACTOR_NAMES,
    );
    this.sites.update(undefined, 0);
    this.buildEdge();
    this.dynamic.name = 'farm-fields';
    this.root.add(this.dynamic);
    this.batches = new Batches(this.dynamic);
    this.mine.name = 'farm-mine-marker';
    this.mine.visible = false;
    this.root.add(this.mine);
  }

  /** The grass under a field and a low timber edge (the tilled block is drawn per update). */
  private buildFieldBase(x0: number, z0: number, w: number, d: number, actor: number) {
    const base = this.plane(w, d, FIELD_GRASS, 0.008);
    base.position.set(x0 + w / 2, 0.008, z0 + d / 2);
    base.name = 'farm-field-' + actor;
    this.root.add(base);
    const rim = (x: number, z: number, rw: number, rd: number) => {
      const m = this.box(rw, 0.1, rd, '#8a6242');
      m.position.set(x, 0.05, z);
      this.root.add(shadowed(m, false));
    };
    rim(x0 + w / 2, z0 - 0.05, w + 0.2, 0.1);
    rim(x0 + w / 2, z0 + d + 0.05, w + 0.2, 0.1);
    rim(x0 - 0.05, z0 + d / 2, 0.1, d);
    rim(x0 + w + 0.05, z0 + d / 2, 0.1, d);
  }

  private buildHouse(h: (typeof FARM_HOUSES)[number]) {
    const spec = VILLAGE_HOUSE_MODELS[h.model],
      s = villageHouseScale(h.model),
      height = spec.height * s;
    // The hub's scale: the door is VILLAGE_DOOR_HEIGHT tall.
    this.place(h.model, h.x, h.z, { w: h.w, h: height + 0.02, d: h.d }, 0, 'farm-house-' + h.actor);
    const color = { bg: HOME_COLORS[h.actor], ink: '#3c2716', line: HOME_ROOFS[h.actor] };
    this.signpost(h.name, '', color, h.door.x + 1.7, h.door.z - 0.3, { w: 1.8, h: 1.5, name: 'farm-sign-' + h.actor });
    // 앞마당 정원 (house tier 3): hydrangeas by the door and a lantern.
    const garden = [
      this.place('hydrangea', h.door.x - 1.3, h.door.z - 0.5, { w: 0.9, h: 0.8, d: 0.7 }, 0, `farm-garden-${h.actor}-a`),
      this.place('hydrangea', h.x + h.w / 2 - 0.6, h.door.z - 0.5, { w: 0.9, h: 0.8, d: 0.7 }, 0, `farm-garden-${h.actor}-b`),
      this.place('gardenLantern', h.door.x + 0.9, h.door.z - 0.5, { w: 0.4, h: 1.2, d: 0.4 }, 0, `farm-garden-${h.actor}-lamp`),
    ];
    for (const g of garden) g.visible = false;
    // 2층 증축 (tier 4): a dormer room on the roof with a little window.
    const attic = new THREE.Group();
    attic.name = 'farm-attic-' + h.actor;
    const room = this.box(h.w * 0.42, 0.9, h.d * 0.4, HOME_COLORS[h.actor]);
    room.position.set(0, 0.45, 0);
    const roof = new THREE.Mesh(this.own(new THREE.ConeGeometry(h.w * 0.34, 0.7, 4)), this.own(districtMat(HOME_ROOFS[h.actor])));
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 1.25, 0);
    const pane = this.box(0.42, 0.36, 0.04, '#ffe7a8', { emissive: '#ffd98a', emissiveIntensity: 0.35 });
    pane.position.set(0, 0.5, h.d * 0.2 + 0.02);
    attic.add(room, roof, pane);
    attic.position.set(h.x, height * 0.82, h.z + h.d * 0.08);
    attic.visible = false;
    this.root.add(shadowed(attic));
    this.tiers.set(h.actor, { garden, attic });
  }

  private buildYard() {
    // Shipping bin: a wooden chest with a slanted lid.
    const B = FARM_BIN;
    const bin = new THREE.Group();
    bin.name = 'farm-bin';
    const body = this.box(B.w, B.h * 0.7, B.d, '#9a6a42');
    body.position.y = B.h * 0.35;
    const lid = this.box(B.w + 0.08, 0.12, B.d + 0.1, '#6e4629');
    lid.position.set(0, B.h * 0.75, -0.05);
    lid.rotation.x = -0.18;
    const band = this.box(B.w + 0.02, 0.08, B.d + 0.02, '#c9a24a', { metalness: 0.3 });
    band.position.y = B.h * 0.5;
    bin.add(body, lid, band);
    bin.position.set(B.x, 0, B.z);
    this.root.add(shadowed(bin));
    this.signpost('출하함', '넣으면 다음 날 팔려요', SIGN_FARM, B.x + B.w / 2 + 0.7, B.z - 0.2, { w: 2, h: 1.5, name: 'farm-bin-sign' });
    // Mailbox: a red box on a post.
    const M = FARM_MAILBOX;
    const post = this.box(0.1, 1, 0.1, '#6d4f33');
    post.position.set(M.x, 0.5, M.z);
    const box = this.box(M.w, 0.38, M.d, '#c8473a');
    box.position.set(M.x, 1.1, M.z);
    box.name = 'farm-mailbox';
    this.root.add(shadowed(post), shadowed(box));
    // Farm board.
    this.place('noticeBoard', FARM_BOARD.x, FARM_BOARD.z, { w: FARM_BOARD.w, h: 1.5, d: FARM_BOARD.d }, 0, 'farm-board');
    this.signpost('농장 게시판', '밭 소식 · 품평회', SIGN_FARM, FARM_BOARD.x - 1.6, FARM_BOARD.z + 0.3, { w: 2.2, h: 1.9, name: 'farm-board-sign' });
    for (const [i, p] of FARM_PROPS.entries()) this.place(p.model, p.x, p.z, { w: p.w, h: p.h, d: p.d }, p.rot ?? 0, 'farm-prop-' + i);
    for (const [i, b] of FARM_BENCHES.entries()) this.place('parkBench', b.x, b.z, { w: b.w, h: 1.1, d: b.d }, b.w < b.d ? Math.PI / 2 : 0, 'farm-bench-' + i);
  }

  private buildEdge() {
    FARM_LAMPS.forEach((l, i) => this.gardenLamp(l.x, l.z, i));
    for (const [i, t] of FARM_TREES.entries()) this.tree(t.x, t.z, t.s, !!t.pine, i);
    // A ring of trees outside the map, open where the 농장 길 leaves (south).
    this.plantRing(this.ring(FARM_W, FARM_D, null).filter(([x, z]) => !(z > FARM_D / 2 && Math.abs(x - FARM_EXIT.x) < 3.4)));
    this.signpost('마을 중심', '농장 길 따라 남쪽', SIGN_ROAD, FARM_EXIT.x + 2, FARM_EXIT.z - 2.4, { w: 1.6, h: 1.4, name: 'farm-road-sign' });
  }

  override update(u: FarmUpdate) {
    super.update(u);
    if (!u.farm) return;
    const key = JSON.stringify([u.farm, u.me ?? -1]);
    if (key === this.farmKey) return;
    this.farmKey = key;
    this.drawFields(u.farm);
    this.sites.update(u.farm.sites, kstDay(Date.now()));
    for (const [actor, t] of this.tiers) {
      const tier = u.farm.houses[actor] ?? 0;
      for (const g of t.garden) g.visible = tier >= 3;
      t.attic.visible = tier >= 4;
    }
    this.markMine(u.me ?? -1, u.farm);
    this.onChange();
  }

  /** Tilled tiles, crops, withered plants, giant beds, fixtures and work-yard machines (instanced). */
  private drawFields(state: FarmSceneState) {
    const soil: Instance[] = [],
      crops: Instance[] = [],
      yard = machineYardSite(state.sites);
    for (const field of state.fields) {
      const f = FARM_FIELDS.find((x) => x.actor === field.actor);
      if (!f) continue;
      const plots = new Map(field.plots.map((p) => [p.tile, p]));
      // Tiles of giant beds are one big crop (lounge-farm.ts giantBed).
      const inGiant = new Set<number>();
      for (const bed of field.giants) {
        const tiles = bedTiles(bed),
          first = plots.get(tiles[0]);
        for (const t of tiles) inGiant.add(t);
        if (!first?.crop) continue;
        const a = fieldTileCenter(f, tiles[0]),
          b = fieldTileCenter(f, tiles[5]);
        const local: Instance[] = [];
        giantShapes(local, first.crop);
        const place = new THREE.Matrix4().makeTranslation((a.x + b.x) / 2, SOIL_TOP, (a.z + b.z) / 2).multiply(new THREE.Matrix4().makeScale(1.25, 1.25, 1.25));
        for (const i of local) crops.push({ ...i, m: place.clone().multiply(i.m) });
      }
      for (let tile = 0; tile < GRID_TILES; tile++) {
        if (!tileOpen(field.size, tile)) continue;
        const at = fieldTileCenter(f, tile),
          p = plots.get(tile);
        // F2: only tilled tiles are soil; the rest of the open block is short grass (fallow).
        if (!p?.tilled) {
          soil.push({ geo: GEO.box, mat: MAT.fallow, m: matrix(at.x, 0.03, at.z, SOIL_SIZE, 0.04, SOIL_SIZE) });
          continue;
        }
        soil.push({ geo: GEO.box, mat: p.wet ? MAT.soilWet : MAT.soil, m: matrix(at.x, 0.14, at.z, SOIL_SIZE, 0.12, SOIL_SIZE) });
        const seed = field.actor * 1.7 + tile;
        if (!p.crop && p.dead) {
          const local: Instance[] = [];
          deadShapes(local, seed);
          const place = new THREE.Matrix4().makeTranslation(at.x, SOIL_TOP, at.z);
          for (const k of local) crops.push({ ...k, m: place.clone().multiply(k.m) });
        }
        if (p.crop && !inGiant.has(tile)) cropInstances(crops, at, p.crop as Crop, 0, seed, p.growth);
      }
      for (const [tile, kind] of field.fx) {
        if (!tileOpen(field.size, tile)) continue;
        const at = fieldTileCenter(f, tile);
        const place = new THREE.Matrix4().makeTranslation(at.x, SOIL_TOP, at.z);
        const local: Instance[] = [];
        fixtureShapes(local, kind);
        for (const i of local) crops.push({ ...i, m: place.clone().multiply(i.m) });
      }
      // F2: scarecrows and bee houses on the field's front-yard spots (just off its edge).
      for (const [spot, kind] of field.yard) {
        const s = yardSpots(field.size)[spot];
        if (!s) continue;
        const at = fieldCellCenter(f, s.r, s.c);
        const place = new THREE.Matrix4().makeTranslation(at.x, 0.02, at.z);
        const local: Instance[] = [];
        fixtureShapes(local, kind);
        for (const i of local) crops.push({ ...i, m: place.clone().multiply(i.m) });
      }
      // F2: 덩굴 시렁 over three tiles in a row.
      for (const anchor of field.trellis) {
        const tiles = trellisTiles(anchor);
        if (!tiles || !tileOpen(field.size, tiles[2])) continue;
        const a = fieldTileCenter(f, tiles[1]);
        const place = new THREE.Matrix4().makeTranslation(a.x, SOIL_TOP, a.z).multiply(new THREE.Matrix4().makeScale(FIELD_TILE / 1.4 * 0.95, 1, 1));
        const local: Instance[] = [];
        trellisShapes(local);
        for (const i of local) crops.push({ ...i, m: place.clone().multiply(i.m) });
      }
      // F5 서리 덮개: a low plastic tunnel over the covered quarter.
      if (field.frost)
        for (const tile of frostTiles(field.size)) {
          const at = fieldTileCenter(f, tile);
          crops.push({ geo: GEO.box, mat: FROST_MAT, m: matrix(at.x, 0.42, at.z, FIELD_TILE * 0.98, 0.56, FIELD_TILE * 0.98) });
        }
      this.showMaster(field.actor, isMasterField(field.size));
      const house = farmHouse(field.actor);
      // 우리 농장 F3: once the machine yard stands, everyone's machines stand there (small).
      if (house)
        for (const [slot, kind, busy] of field.mach) {
          const at = yard ? yardMachineAt(yard, field.actor, slot) : farmWorkSlot(house, slot);
          const place = new THREE.Matrix4().makeTranslation(at.x, 0.03, at.z);
          if (yard) place.multiply(new THREE.Matrix4().makeScale(0.55, 0.55, 0.55));
          const local: Instance[] = [];
          machineShapes(local, kind, busy, false);
          for (const i of local) crops.push({ ...i, m: place.clone().multiply(i.m) });
        }
    }
    this.batches.set([...soil, ...crops, ...siteInstances(state.sites, kstDay(Date.now()))]);
  }

  /** F5: the 명인 표지판 in front of a 120-tile field (made once, then shown or hidden). */
  private showMaster(actor: number, on: boolean) {
    let parts = this.masters.get(actor);
    if (!parts && on) {
      const f = FARM_FIELDS.find((x) => x.actor === actor);
      if (!f) return;
      const at = masterSign(f),
        before = this.root.children.length;
      this.signpost(`명인 ${ACTOR_NAMES[actor] ?? ''}의 밭`, '12×10 · 120칸', SIGN_MASTER, at.x, at.z, { w: 2.1, h: 1.2, name: 'farm-master-' + actor });
      parts = this.root.children.slice(before);
      this.masters.set(actor, parts);
    }
    for (const o of parts ?? []) o.visible = on;
  }

  /** A thin gold outline round my own tilled block. */
  private markMine(me: number, state: FarmSceneState) {
    const f = FARM_FIELDS.find((x) => x.actor === me),
      mine = state.fields.find((x) => x.actor === me);
    this.mine.clear();
    this.mine.visible = !!f && !!mine;
    if (!f || !mine) return;
    const r = fieldOpenRect(f, mine.size),
      pad = 0.18;
    const strip = (x: number, z: number, w: number, d: number) => {
      const m = new THREE.Mesh(GEO.box, MAT.mine);
      m.position.set(x, 0.05, z);
      m.scale.set(w, 0.03, d);
      this.mine.add(m);
    };
    strip(r.x, r.z - r.d / 2 - pad, r.w + 2 * pad, 0.07);
    strip(r.x, r.z + r.d / 2 + pad, r.w + 2 * pad, 0.07);
    strip(r.x - r.w / 2 - pad, r.z, 0.07, r.d + 2 * pad);
    strip(r.x + r.w / 2 + pad, r.z, 0.07, r.d + 2 * pad);
  }

  override dispose() {
    this.batches.dispose();
    super.dispose();
  }
}
