// ④ 목장·과수원 in three.js, on the district kit (lounge-district-kit.ts, 구역
// 공통 규격): 닐라 목장's 축사 (kArchive tool shed scaled up as a barn, 자료:
// kArchive · 출처: 쓰레드 dogfooter), a silo and a chicken coop drawn in code,
// the rope-fenced pasture with grazing cows and sheep and a few hens by the
// coop (simple code-drawn animals), the stream down the middle with its timber
// bridge and stepping stones, 하쿠's 강물 과수원 (kArchive corner house as the
// 과수원 창고, rows of the village's fruit-tree model, the valley pavilion as
// the 원두막) and the keepers' cottages. Layout: lounge-ranch-layout.ts. No React.
import * as THREE from 'three';
import {
  RANCH_ANIMALS,
  RANCH_BENCHES,
  RANCH_BOARD,
  RANCH_BRIDGE,
  RANCH_BUILDINGS,
  RANCH_COOP,
  RANCH_D,
  RANCH_EDGE_TREES,
  RANCH_EXIT,
  RANCH_HOUSES,
  RANCH_LAMPS,
  RANCH_PAVILION,
  RANCH_PAVING,
  RANCH_PROPS,
  RANCH_SILO,
  RANCH_STONES,
  RANCH_STREAM,
  RANCH_TREES_FRUIT,
  RANCH_W,
  pastureFence,
} from './lounge-ranch-layout';
import { RANCH_MODEL_URLS } from './lounge-district-models';
import { DistrictSet, PAVING, districtMat, rnd, shadowed } from './lounge-district-kit';

const SIGN_ROAD = { bg: '#c49a62', ink: '#3c2716', line: '#7d5a36' };

export class RanchSet extends DistrictSet {
  constructor(look: { ground: string; groundFar: string }) {
    super('ranch', RANCH_MODEL_URLS);
    this.ground(RANCH_W, RANCH_D, look);
    for (const p of RANCH_PAVING) this.pave(p, p.tone === 'wood' ? PAVING.wood : p.tone === 'yard' ? PAVING.plaza : PAVING.road);
    this.buildStream();
    for (const b of RANCH_BUILDINGS) this.buildShop(b);
    for (const h of RANCH_HOUSES) this.buildHouse(h);
    this.buildFarm();
    this.buildOrchard();
    this.buildEdge();
  }

  private buildStream() {
    const s = RANCH_STREAM;
    // The stream runs past both edges of the map.
    this.sea({ x: s.x, z: 0, w: s.w, d: RANCH_D + 40 }, '#7cc0cf');
    for (const side of [-1, 1]) {
      const bank = this.box(0.35, 0.18, RANCH_D + 40, '#8d7a5c');
      bank.position.set(s.x + side * (s.w / 2 + 0.1), 0.05, 0);
      this.root.add(shadowed(bank, false));
    }
    // The timber bridge on the farm road, with rails.
    const b = RANCH_BRIDGE;
    const deck = this.box(b.w, 0.2, b.d, PAVING.wood);
    deck.position.set(b.x, 0.12, b.z);
    this.root.add(shadowed(deck, false));
    for (const side of [-1, 1]) {
      const rail = this.box(b.w, 0.08, 0.08, '#6b4b33');
      rail.position.set(b.x, 0.75, b.z + side * (b.d / 2 - 0.05));
      this.root.add(shadowed(rail));
      for (const dx of [-b.w / 2 + 0.1, 0, b.w / 2 - 0.1]) {
        const post = this.box(0.1, 0.7, 0.1, '#6b4b33');
        post.position.set(b.x + dx, 0.4, b.z + side * (b.d / 2 - 0.05));
        this.root.add(shadowed(post));
      }
    }
    // Stepping stones further south.
    for (let i = 0; i < 3; i++) {
      const stone = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.55, 0.62, 0.18, 12)), this.own(districtMat('#a39c90')));
      stone.position.set(RANCH_STONES.x - 1 + i, 0.06, RANCH_STONES.z + (i % 2 ? 0.25 : -0.2));
      stone.name = 'ranch-stone-' + i;
      this.root.add(shadowed(stone, false));
    }
  }

  private buildShop(b: (typeof RANCH_BUILDINGS)[number]) {
    this.place(b.model, b.x, b.z, { w: b.w - 0.3, h: b.h, d: b.d - 0.3 }, 0, 'ranch-' + b.id);
    const front = b.z + b.d / 2;
    this.signpost(b.name, b.sub, b.sign, b.x + b.w / 2 - 1.2, front + 0.55, { name: 'ranch-sign-' + b.id });
  }

  private buildHouse(h: (typeof RANCH_HOUSES)[number]) {
    this.place(h.model, h.x, h.z, { w: h.w - 0.3, h: h.h, d: h.d - 0.3 }, 0, 'ranch-house-' + h.id);
    this.signpost(h.name, '', { bg: '#f3e6cc', ink: '#5a3b22', line: '#a77b4c' }, h.door.x + 1.6, h.door.z - 0.5, { w: 1.7, h: 1.5, name: 'ranch-sign-' + h.id });
  }

  private buildFarm() {
    // The silo: a tall cylinder with a domed cap.
    const S = RANCH_SILO;
    const silo = new THREE.Group();
    silo.name = 'ranch-silo';
    const body = new THREE.Mesh(this.own(new THREE.CylinderGeometry(S.r, S.r, S.h, 20)), this.own(districtMat('#c9b7a0')));
    body.position.y = S.h / 2;
    const band = new THREE.Mesh(this.own(new THREE.CylinderGeometry(S.r + 0.03, S.r + 0.03, 0.3, 20)), this.own(districtMat('#9b4a36')));
    band.position.y = S.h * 0.7;
    const cap = new THREE.Mesh(this.own(new THREE.SphereGeometry(S.r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), this.own(districtMat('#8a8f94', { metalness: 0.3 })));
    cap.position.y = S.h;
    silo.add(body, band, cap);
    silo.position.set(S.x, 0, S.z);
    this.root.add(shadowed(silo));
    // The chicken coop: a small shed on legs with a ramp.
    const C = RANCH_COOP;
    this.place('toolShed', C.x, C.z, { w: C.w - 0.2, h: C.h, d: C.d - 0.2 }, Math.PI, 'ranch-coop');
    this.signpost('닭장', '', { bg: '#fff3dc', ink: '#6a3a1e', line: '#c98a4a' }, C.x + C.w / 2 + 0.6, C.z + 0.6, { w: 1.2, h: 1.3, name: 'ranch-coop-sign' });
    // The pasture's rope fence.
    for (const [i, f] of pastureFence().entries()) {
      const long = Math.max(f.w, f.d),
        along = f.w >= f.d;
      const n = Math.max(1, Math.round(long / 3));
      for (let k = 0; k < n; k++) {
        const t = -long / 2 + (k + 0.5) * (long / n);
        this.place('ropeFence', f.x + (along ? t : 0), f.z + (along ? 0 : t), { w: along ? long / n : 0.3, h: 0.9, d: along ? 0.3 : long / n }, along ? 0 : Math.PI / 2, `ranch-fence-${i}-${k}`);
      }
    }
    for (const [i, a] of RANCH_ANIMALS.entries()) this.root.add(this.animal(a.kind, a.x, a.z, a.rot, i));
    for (const [i, p] of RANCH_PROPS.entries()) {
      if (p.model) this.place(p.model, p.x, p.z, { w: p.w, h: p.h, d: p.d }, p.rot ?? 0, 'ranch-prop-' + i);
      else {
        const bale = this.box(p.w, p.h, p.d, p.color ?? '#d8b864');
        bale.position.set(p.x, p.h / 2, p.z);
        bale.rotation.y = p.rot ?? 0;
        bale.name = 'ranch-hay-' + i;
        this.root.add(shadowed(bale));
      }
    }
    this.place('noticeBoard', RANCH_BOARD.x, RANCH_BOARD.z, { w: RANCH_BOARD.w, h: 1.5, d: RANCH_BOARD.d }, 0, 'ranch-board');
    this.signpost('목장 게시판', '돌봄은 하루 한 번', { bg: '#f6e7cf', ink: '#6a3a1e', line: '#b4763f' }, RANCH_BOARD.x - 1.4, RANCH_BOARD.z + 0.3, { w: 2.2, h: 1.9, name: 'ranch-board-sign' });
  }

  /** A simple code-drawn animal (boxes and spheres) facing `rot`. */
  private animal(kind: 'cow' | 'sheep' | 'chicken', x: number, z: number, rot: number, i: number) {
    const g = new THREE.Group();
    g.name = `ranch-${kind}-${i}`;
    const leg = (lx: number, lz: number, h: number, color: string, w = 0.14) => {
      const m = this.box(w, h, w, color);
      m.position.set(lx, h / 2, lz);
      g.add(m);
    };
    if (kind === 'cow') {
      const body = this.box(0.8, 0.6, 1.4, '#f4f1ea');
      body.position.y = 0.85;
      const patch = this.box(0.82, 0.32, 0.5, '#3a3430');
      patch.position.set(0, 0.95, -0.2);
      const head = this.box(0.46, 0.46, 0.5, '#f4f1ea');
      head.position.set(0, 1.05, 0.88);
      const nose = this.box(0.4, 0.2, 0.12, '#e8b4a8');
      nose.position.set(0, 0.92, 1.15);
      for (const s of [-1, 1]) {
        const horn = this.box(0.08, 0.16, 0.08, '#d8cdb0');
        horn.position.set(s * 0.18, 1.34, 0.8);
        g.add(horn);
      }
      g.add(body, patch, head, nose);
      for (const [lx, lz] of [[-0.28, -0.5], [0.28, -0.5], [-0.28, 0.5], [0.28, 0.5]]) leg(lx, lz, 0.6, '#efe9df');
    } else if (kind === 'sheep') {
      const body = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.5, 14, 10)), this.own(districtMat('#f6f2e8')));
      body.scale.set(1, 0.85, 1.3);
      body.position.y = 0.72;
      const head = this.box(0.3, 0.34, 0.34, '#3b3632');
      head.position.set(0, 0.86, 0.68);
      g.add(body, head);
      for (const [lx, lz] of [[-0.2, -0.35], [0.2, -0.35], [-0.2, 0.35], [0.2, 0.35]]) leg(lx, lz, 0.42, '#3b3632', 0.1);
    } else {
      const body = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.2, 12, 8)), this.own(districtMat('#fbf8f0')));
      body.scale.set(0.9, 0.9, 1.2);
      body.position.y = 0.3;
      const head = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.11, 10, 8)), this.own(districtMat('#fbf8f0')));
      head.position.set(0, 0.48, 0.16);
      const comb = this.box(0.04, 0.08, 0.1, '#d23b2f');
      comb.position.set(0, 0.6, 0.15);
      const beak = this.box(0.05, 0.04, 0.07, '#e8a63a');
      beak.position.set(0, 0.46, 0.28);
      g.add(body, head, comb, beak);
      for (const lx of [-0.06, 0.06]) leg(lx, 0, 0.14, '#e8a63a', 0.03);
    }
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    return shadowed(g);
  }

  private buildOrchard() {
    for (const [i, t] of RANCH_TREES_FRUIT.entries())
      this.place('fruitTree', t.x, t.z, { w: 2.6, h: 2.8, d: 2.6 }, rnd('orchard' + i) * 6.28, 'ranch-fruit-tree-' + i);
    const P = RANCH_PAVILION;
    this.place('pavilion', P.x, P.z, { w: P.w, h: P.h, d: P.d }, 0, 'ranch-pavilion');
    this.signpost('원두막', '', { bg: '#e7f1e3', ink: '#2e5a3c', line: '#6f9f74' }, P.x - P.w / 2 - 0.6, P.z - 1, { w: 1.4, h: 1.4, name: 'ranch-pavilion-sign' });
  }

  private buildEdge() {
    for (const [i, b] of RANCH_BENCHES.entries()) this.place('parkBench', b.x, b.z, { w: b.w, h: 1.1, d: b.d }, b.w < b.d ? Math.PI / 2 : 0, 'ranch-bench-' + i);
    RANCH_LAMPS.forEach((l, i) => this.gardenLamp(l.x, l.z, i));
    for (const [i, t] of RANCH_EDGE_TREES.entries()) this.tree(t.x, t.z, t.s, !!t.pine, i);
    // A ring of trees outside the map, open where the 들길 leaves (south).
    const ring = this.ring(RANCH_W, RANCH_D, null).filter(([x, z]) => !(z > RANCH_D / 2 && Math.abs(x - RANCH_EXIT.x) < 3.4) && Math.abs(x - RANCH_STREAM.x) > 2.4);
    this.plantRing(ring);
    this.signpost('마을 중심', '들길 따라 남쪽', SIGN_ROAD, RANCH_EXIT.x + 1.8, RANCH_EXIT.z - 2.2, { w: 1.4, h: 1.4, name: 'ranch-road-sign' });
  }
}
