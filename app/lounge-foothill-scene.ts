// ⑤ 산기슭 마을 in three.js, on the district kit (lounge-district-kit.ts, 구역
// 공통 규격): 오른의 대장간 (the village's kArchive forge workshop, 자료:
// kArchive · 출처: 쓰레드 dogfooter) with an anvil yard and a chimney glow,
// 메르시 의원 (kArchive courtyard house with a red-cross board), the stone
// plaza with 신이치's star-patterned tent, the rocky ridge along the north with
// the 산기슭 광산 입구 (a dark mouth with timber props and a lantern) and the
// 온천 입구 behind a "공사 중" sign with drifting steam. Layout:
// lounge-foothill-layout.ts. No React.
import * as THREE from 'three';
import {
  FOOTHILL_ANVIL,
  FOOTHILL_BENCHES,
  FOOTHILL_BOARD,
  FOOTHILL_BUILDINGS,
  FOOTHILL_D,
  FOOTHILL_EXIT,
  FOOTHILL_LAMPS,
  FOOTHILL_MINE,
  FOOTHILL_ONSEN,
  FOOTHILL_PAVING,
  FOOTHILL_PROPS,
  FOOTHILL_RIDGE,
  FOOTHILL_ROCKS,
  FOOTHILL_TENT,
  FOOTHILL_TREES,
  FOOTHILL_W,
} from './lounge-foothill-layout';
import { FOOTHILL_MODEL_URLS } from './lounge-district-models';
import { DistrictSet, PAVING, districtMat, rnd, shadowed, type DistrictUpdate } from './lounge-district-kit';

export class FoothillSet extends DistrictSet {
  private steam: THREE.Mesh[] = [];
  private ember: THREE.Mesh | null = null;

  constructor(look: { ground: string; groundFar: string }) {
    super('foothill', FOOTHILL_MODEL_URLS);
    this.ground(FOOTHILL_W, FOOTHILL_D, look);
    for (const p of FOOTHILL_PAVING) this.pave(p, p.tone === 'gravel' ? PAVING.lane : p.tone === 'stone' ? PAVING.stone : PAVING.plaza);
    this.buildRidge();
    for (const b of FOOTHILL_BUILDINGS) this.buildHouse(b);
    this.buildForgeYard();
    this.buildTent();
    this.buildOnsen();
    this.buildEdge();
  }

  private buildRidge() {
    const R = FOOTHILL_RIDGE;
    // A rock wall along the north edge, broken by the mine mouth.
    const g0 = FOOTHILL_MINE.x - R.gap / 2,
      g1 = FOOTHILL_MINE.x + R.gap / 2,
      left = -FOOTHILL_W / 2 - 6,
      right = FOOTHILL_W / 2 + 6;
    for (const [a, b] of [
      [left, g0],
      [g1, right],
    ]) {
      const wall = this.box(b - a, 3.4, R.d + 2, '#8c8274');
      wall.position.set((a + b) / 2, 1.7, R.z - 1);
      this.root.add(shadowed(wall));
    }
    // Over the mouth: a lintel of rock with timber props and a lantern.
    const lintel = this.box(R.gap + 1.2, 1.2, R.d + 2, '#7c7266');
    lintel.position.set(FOOTHILL_MINE.x, 2.8, R.z - 1);
    const dark = this.box(R.gap - 0.2, 2.3, 0.1, '#1b1612');
    dark.position.set(FOOTHILL_MINE.x, 1.15, R.z + R.d / 2 - 0.4);
    dark.name = 'foothill-mine-mouth';
    this.root.add(shadowed(lintel), dark);
    for (const s of [-1, 1]) {
      const prop = this.box(0.25, 2.4, 0.25, '#6b4b33');
      prop.position.set(FOOTHILL_MINE.x + s * (R.gap / 2 - 0.15), 1.2, R.z + R.d / 2 - 0.3);
      this.root.add(shadowed(prop));
    }
    const beam = this.box(R.gap, 0.25, 0.3, '#6b4b33');
    beam.position.set(FOOTHILL_MINE.x, 2.35, R.z + R.d / 2 - 0.3);
    this.root.add(shadowed(beam));
    this.lantern(FOOTHILL_MINE.x + R.gap / 2 + 0.4, R.z + R.d / 2 + 0.2, '#ffc27a', 1.8);
    this.signpost('산기슭 광산', '광산 1층으로', { bg: '#e8e1d6', ink: '#3a2c20', line: '#8a6a48' }, FOOTHILL_MINE.x - R.gap / 2 - 1.2, FOOTHILL_MINE.stand.z - 0.6, { w: 1.9, h: 1.7, name: 'foothill-mine-sign' });
    // Boulders along the ridge foot.
    for (let x = -FOOTHILL_W / 2 + 2; x <= FOOTHILL_W / 2 - 2; x += 4.2) {
      if (Math.abs(x - FOOTHILL_MINE.x) < 3.4) continue;
      const k = rnd('ridge' + x);
      this.place(k < 0.5 ? 'graniteBoulder' : 'valleyRocks', x, R.z + R.d / 2 + 0.2, { w: 1.6 + k, h: 1.2 + k, d: 1.2 }, k * 6, 'foothill-ridge-rock-' + x.toFixed(1));
    }
  }

  private buildHouse(b: (typeof FOOTHILL_BUILDINGS)[number]) {
    this.place(b.model, b.x, b.z, { w: b.w - 0.3, h: b.h, d: b.d - 0.3 }, 0, 'foothill-' + b.id);
    const front = b.z + b.d / 2;
    this.signpost(b.name, b.sub, b.sign, b.x + (b.id === 'smithy' ? -(b.w / 2) + 1.2 : b.w / 2 - 1.2), front + 0.55, { name: 'foothill-sign-' + b.id });
    if (b.id === 'clinic') {
      // A red cross on a white board above the door.
      const board = this.box(0.9, 0.9, 0.08, '#ffffff');
      board.position.set(b.x, b.h * 0.72, front + 0.05);
      const v = this.box(0.18, 0.6, 0.1, '#c0392b');
      v.position.set(b.x, b.h * 0.72, front + 0.1);
      const h = this.box(0.6, 0.18, 0.1, '#c0392b');
      h.position.set(b.x, b.h * 0.72, front + 0.1);
      this.root.add(board, v, h);
    }
  }

  private buildForgeYard() {
    // The anvil on its stump.
    const A = FOOTHILL_ANVIL;
    const stump = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.34, 0.4, 0.55, 12)), this.own(districtMat('#6b4e36')));
    stump.position.set(A.x, 0.28, A.z);
    const anvil = this.box(A.w, 0.28, 0.36, '#4b4f55', { metalness: 0.5, roughness: 0.45 });
    anvil.position.set(A.x, 0.7, A.z);
    const horn = new THREE.Mesh(this.own(new THREE.ConeGeometry(0.14, 0.4, 10)), this.own(districtMat('#4b4f55', { metalness: 0.5, roughness: 0.45 })));
    horn.rotation.z = -Math.PI / 2;
    horn.position.set(A.x + A.w / 2 + 0.18, 0.72, A.z);
    anvil.name = 'foothill-anvil';
    this.root.add(shadowed(stump), shadowed(anvil), shadowed(horn));
    // The forge's ember glow by its door (brighter at night).
    const forge = FOOTHILL_BUILDINGS.find((b) => b.id === 'smithy')!;
    const ember = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.22, 12, 8)), this.own(new THREE.MeshBasicMaterial({ color: '#ff8a3a' })));
    ember.position.set(forge.x - 2.2, 0.9, forge.z + forge.d / 2 + 0.2);
    this.glows.push({ mesh: ember, base: new THREE.Color('#ff8a3a') });
    this.ember = ember;
    this.root.add(ember);
    this.pointLight(ember.position.x, 1.2, ember.position.z + 0.5, '#ff9a4a');
    for (const [i, p] of FOOTHILL_PROPS.entries()) {
      if (p.model) this.place(p.model, p.x, p.z, { w: p.w, h: p.h, d: p.d }, p.rot ?? 0, 'foothill-prop-' + i);
      else {
        // An ore cart: a box on two wheels with ore on top.
        const cart = this.box(p.w, p.h * 0.6, p.d, p.color ?? '#6e5a46');
        cart.position.set(p.x, p.h * 0.55, p.z);
        const ore = this.box(p.w * 0.8, 0.18, p.d * 0.7, '#b07a4a');
        ore.position.set(p.x, p.h * 0.9, p.z);
        this.root.add(shadowed(cart), shadowed(ore));
      }
    }
    this.place('noticeBoard', FOOTHILL_BOARD.x, FOOTHILL_BOARD.z, { w: FOOTHILL_BOARD.w, h: 1.5, d: FOOTHILL_BOARD.d }, 0, 'foothill-board');
    this.signpost('산기슭 게시판', '오늘의 광석 · 점집', { bg: '#efe6d6', ink: '#3a2c20', line: '#8a6a48' }, FOOTHILL_BOARD.x + 1.3, FOOTHILL_BOARD.z + 0.3, { w: 2.2, h: 1.9, name: 'foothill-board-sign' });
  }

  private buildTent() {
    const T = FOOTHILL_TENT;
    const g = new THREE.Group();
    g.name = 'foothill-tent';
    const wall = new THREE.Mesh(this.own(new THREE.CylinderGeometry(T.r, T.r, 1.4, 20, 1, true)), this.own(districtMat('#2c3e7a', { side: THREE.DoubleSide })));
    wall.position.y = 0.7;
    const roof = new THREE.Mesh(this.own(new THREE.ConeGeometry(T.r + 0.25, 1.5, 20)), this.own(districtMat('#25336a')));
    roof.position.y = 2.15;
    const trim = new THREE.Mesh(this.own(new THREE.CylinderGeometry(T.r + 0.26, T.r + 0.26, 0.12, 20)), this.own(districtMat('#d8b25a', { metalness: 0.3 })));
    trim.position.y = 1.42;
    const star = new THREE.Mesh(this.own(new THREE.OctahedronGeometry(0.18)), this.own(new THREE.MeshBasicMaterial({ color: '#ffe08a' })));
    star.position.y = 3.05;
    this.glows.push({ mesh: star, base: new THREE.Color('#ffe08a') });
    // The table in the tent's mouth with a crystal ball.
    const table = this.box(1.1, 0.7, 0.6, '#5a3e2a');
    table.position.set(0, 0.35, T.r - 0.15);
    const ball = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.16, 14, 10)), this.own(districtMat('#bfe3ff', { transparent: true, opacity: 0.8, roughness: 0.1 })));
    ball.position.set(0, 0.86, T.r - 0.15);
    g.add(wall, roof, trim, star, table, ball);
    g.position.set(T.x, 0, T.z);
    this.root.add(shadowed(g));
    this.signpost('신이치의 점집', '주말 · 축제 때만', { bg: '#1f2a52', ink: '#ffe08a', line: '#d8b25a' }, T.x - T.r - 0.9, T.z + 1.4, { w: 2, h: 1.8, name: 'foothill-tent-sign' });
  }

  private buildOnsen() {
    const O = FOOTHILL_ONSEN;
    // A stone ring with a covered pool and a "공사 중" barrier.
    const rim = this.box(O.w, 0.35, O.d, '#9b948a');
    rim.position.set(O.x, 0.18, O.z);
    const pool = this.box(O.w - 0.8, 0.05, O.d - 0.8, '#8fc7cf');
    pool.position.set(O.x, 0.37, O.z);
    this.root.add(shadowed(rim, false), pool);
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.5, 10, 8)), this.own(new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.22, depthWrite: false })));
      puff.position.set(O.x - 1.6 + i * 1.1, 1 + i * 0.2, O.z);
      this.steam.push(puff);
      this.root.add(puff);
    }
    const bar = this.box(O.w + 0.4, 0.14, 0.1, '#e0a030');
    bar.position.set(O.x, 0.8, O.z + O.d / 2 + 0.3);
    this.root.add(bar);
    this.signpost('온천 입구', '공사 중 · 다음에 열어요', { bg: '#fff3d6', ink: '#7a4a1a', line: '#e0a030' }, O.x - O.w / 2 - 0.4, O.z + O.d / 2 + 0.9, { w: 2, h: 1.7, name: 'foothill-onsen-sign' });
  }

  private buildEdge() {
    for (const [i, b] of FOOTHILL_BENCHES.entries()) this.place('parkBench', b.x, b.z, { w: b.w, h: 1.1, d: b.d }, 0, 'foothill-bench-' + i);
    FOOTHILL_LAMPS.forEach((l, i) => this.gardenLamp(l.x, l.z, i));
    for (const [i, t] of FOOTHILL_TREES.entries()) this.tree(t.x, t.z, t.s, !!t.pine, i);
    for (const [i, r] of FOOTHILL_ROCKS.entries()) this.place(i % 2 ? 'graniteBoulder' : 'valleyRocks', r.x, r.z, { w: 1.2 * r.s, h: 0.9 * r.s, d: 1 * r.s }, rnd('frock' + i) * 6, 'foothill-rock-' + i);
    // Pines outside the map (west, east, south), open where the 산길 leaves.
    const ring = this.ring(FOOTHILL_W, FOOTHILL_D, null).filter(([x, z]) => z > -FOOTHILL_D / 2 && !(z > FOOTHILL_D / 2 && Math.abs(x - FOOTHILL_EXIT.x) < 3.4));
    this.plantRing(ring);
    this.signpost('마을 중심', '산길 따라 남쪽', { bg: '#c49a62', ink: '#3c2716', line: '#7d5a36' }, FOOTHILL_EXIT.x - 1.8, FOOTHILL_EXIT.z - 2.2, { w: 1.4, h: 1.4, name: 'foothill-road-sign' });
  }

  override update(u: DistrictUpdate) {
    super.update(u);
    if (this.ember) (this.ember.material as THREE.MeshBasicMaterial).color.set(u.night ? '#ffb070' : '#ff8a3a');
  }
  override tick(t: number) {
    super.tick(t);
    this.steam.forEach((p, i) => {
      p.position.y = 0.9 + (((t / 2400 + i * 0.35) % 1) * 1.6);
      (p.material as THREE.MeshBasicMaterial).opacity = 0.26 * (1 - ((t / 2400 + i * 0.35) % 1));
    });
  }
}
