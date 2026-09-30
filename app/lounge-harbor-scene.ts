// ② 항구 구역 in three.js, on the district kit (lounge-district-kit.ts, 구역 공통
// 규격): the quay with 어시장 and 낚시조합 (kArchive grill hut and corner house,
// 자료: kArchive · 출처: 쓰레드 dogfooter), the dawn-auction yard with its bell
// and fish crates, the big pier and the stone breakwater over the sea, the
// lighthouse on the rocky point (drawn in code: a white tower with red bands
// and a lamp room that glows at night), moored boats, crab-pot buoys, benches,
// lamps and trees. Layout: lounge-harbor-layout.ts. No React.
import * as THREE from 'three';
import {
  HARBOR_AUCTION,
  HARBOR_BENCHES,
  HARBOR_BOARD,
  HARBOR_BOATS,
  HARBOR_BREAKWATER,
  HARBOR_BUILDINGS,
  HARBOR_D,
  HARBOR_EXIT,
  HARBOR_LAMPS,
  HARBOR_LIGHTHOUSE,
  HARBOR_PAVING,
  HARBOR_PIER,
  HARBOR_POINT,
  HARBOR_PROPS,
  HARBOR_ROCKS,
  HARBOR_SHORE_Z,
  HARBOR_SPOTS,
  HARBOR_TREES,
  HARBOR_W,
} from './lounge-harbor-layout';
import { HARBOR_MODEL_URLS } from './lounge-district-models';
import { DistrictSet, PAVING, districtMat, rnd, shadowed, type DistrictUpdate } from './lounge-district-kit';

export class HarborSet extends DistrictSet {
  private auctionGoods = new THREE.Group();
  private beam: THREE.Mesh | null = null;

  constructor(look: { ground: string; groundFar: string }) {
    super('harbor', HARBOR_MODEL_URLS);
    this.ground(HARBOR_W, HARBOR_D, look);
    this.buildSea();
    this.buildQuay();
    for (const b of HARBOR_BUILDINGS) this.buildHouse(b);
    this.buildAuction();
    this.buildLighthouse();
    this.buildEdge();
    this.auctionGoods.name = 'harbor-auction-goods';
    this.root.add(this.auctionGoods);
  }

  private buildSea() {
    const top = HARBOR_SHORE_Z,
      bottom = HARBOR_D / 2 + 30;
    // The sea runs past the map's edges toward the horizon.
    this.sea({ x: 0, z: (top + bottom) / 2, w: HARBOR_W + 70, d: bottom - top });
    // A sandy strip and a stone quay wall along the shore.
    const wall = this.box(HARBOR_W, 0.5, 0.5, '#8d8171');
    wall.position.set(0, 0.0, top + 0.1);
    this.root.add(shadowed(wall, false));
    // The big pier: a timber deck on posts.
    const pier = this.box(HARBOR_PIER.w, 0.22, HARBOR_PIER.d + 0.4, PAVING.wood);
    pier.position.set(HARBOR_PIER.x, 0.08, HARBOR_PIER.z);
    this.root.add(shadowed(pier, false));
    for (let z = HARBOR_PIER.z - HARBOR_PIER.d / 2 + 0.3; z <= HARBOR_PIER.z + HARBOR_PIER.d / 2; z += 0.55) {
      const plank = this.box(HARBOR_PIER.w - 0.1, 0.03, 0.06, '#7a5a3c');
      plank.position.set(HARBOR_PIER.x, 0.2, z);
      this.root.add(plank);
    }
    for (const side of [-1, 1])
      for (let z = HARBOR_PIER.z - HARBOR_PIER.d / 2 + 1; z <= HARBOR_PIER.z + HARBOR_PIER.d / 2; z += 2.4) {
        const post = this.box(0.22, 0.9, 0.22, '#5d4430');
        post.position.set(HARBOR_PIER.x + side * (HARBOR_PIER.w / 2 - 0.05), 0.1, z);
        this.root.add(shadowed(post));
      }
    // The breakwater: a stone arm with tetrapod-ish blocks along its sea side.
    const bw = this.box(HARBOR_BREAKWATER.w, 0.4, HARBOR_BREAKWATER.d + 0.4, PAVING.stone);
    bw.position.set(HARBOR_BREAKWATER.x, 0.05, HARBOR_BREAKWATER.z);
    this.root.add(shadowed(bw, false));
    for (let z = HARBOR_BREAKWATER.z - HARBOR_BREAKWATER.d / 2 + 0.6; z <= HARBOR_BREAKWATER.z + HARBOR_BREAKWATER.d / 2; z += 1.1) {
      const block = this.box(0.7, 0.55, 0.7, '#9b9489');
      block.position.set(HARBOR_BREAKWATER.x + HARBOR_BREAKWATER.w / 2 + 0.35, 0.1, z);
      block.rotation.y = rnd('bw' + z) * 1.2;
      this.root.add(shadowed(block));
    }
    // Moored boats: an open hull (painted sides, a cream gunwale, a plank floor
    // and two thwarts), since from the camera's height a lidded box reads as a slab.
    for (const [i, b] of HARBOR_BOATS.entries()) {
      const g = new THREE.Group();
      const w = b.len * 0.36;
      const floor = this.box(w - 0.2, 0.06, b.len - 0.2, '#6b4e36');
      floor.position.y = 0.06;
      g.add(floor);
      const sides: [x: number, z: number, sw: number, sd: number][] = [
        [-(w / 2 - 0.06), 0, 0.12, b.len],
        [w / 2 - 0.06, 0, 0.12, b.len],
        [0, -(b.len / 2 - 0.06), w, 0.12],
        [0, b.len / 2 - 0.06, w, 0.12],
      ];
      for (const [x, z, sw, sd] of sides) {
        const side = this.box(sw, 0.42, sd, b.color);
        side.position.set(x, 0.05, z);
        const rail = this.box(sw + 0.05, 0.06, sd + 0.05, '#f2e6cf');
        rail.position.set(x, 0.29, z);
        g.add(side, rail);
      }
      for (const z of [-b.len * 0.2, b.len * 0.22]) {
        const seat = this.box(w - 0.2, 0.06, 0.3, '#a07c55');
        seat.position.set(0, 0.2, z);
        g.add(seat);
      }
      g.position.set(b.x, 0, b.z);
      g.rotation.y = b.rot;
      g.name = 'harbor-boat-' + i;
      this.root.add(shadowed(g));
    }
    // Crab-pot buoys (orange floats by the pot spots).
    for (const s of HARBOR_SPOTS.filter((x) => x.pot)) {
      const buoy = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.16, 10, 8)), this.own(districtMat('#e8793a')));
      buoy.position.set(s.stand.x + (s.spot === 'pier' ? -2.3 : 1.9), 0.02, s.stand.z + 0.4);
      buoy.name = 'harbor-pot-buoy';
      this.root.add(buoy);
    }
  }

  private buildQuay() {
    for (const p of HARBOR_PAVING) this.pave(p, p.tone === 'quay' ? PAVING.quay : p.tone === 'stone' ? PAVING.stone : PAVING.road);
    // The rocky point the lighthouse stands on.
    const point = new THREE.Mesh(this.own(new THREE.CircleGeometry(HARBOR_POINT.r, 28)), this.own(districtMat('#b3a78f')));
    point.rotation.x = -Math.PI / 2;
    point.position.set(HARBOR_POINT.x, 0.008, HARBOR_POINT.z);
    point.receiveShadow = true;
    this.root.add(point);
    for (const [i, b] of HARBOR_BENCHES.entries()) this.place('parkBench', b.x, b.z, { w: b.w, h: 1.1, d: b.d }, 0, 'harbor-bench-' + i);
    HARBOR_LAMPS.forEach((l, i) => this.gardenLamp(l.x, l.z, i));
    for (const [i, p] of HARBOR_PROPS.entries()) this.place(p.model, p.x, p.z, { w: p.w, h: p.h, d: p.d }, p.rot ?? 0, 'harbor-prop-' + i);
    // Quay railings east and west of the pier.
    for (const [i, x] of [-20, -12, 8, 14].entries()) this.place('harborFence', x, HARBOR_SHORE_Z - 0.2, { w: 3.6, h: 0.9, d: 0.3 }, 0, 'harbor-fence-' + i);
    // The board (auction times and this week's cup).
    this.place('noticeBoard', HARBOR_BOARD.x, HARBOR_BOARD.z, { w: HARBOR_BOARD.w, h: 1.5, d: HARBOR_BOARD.d }, 0, 'harbor-board');
    this.signpost('항구 게시판', '새벽 경매 · 주간 낚시 대회', { bg: '#e3eef2', ink: '#1f4a5c', line: '#4f8aa0' }, HARBOR_BOARD.x + 1.3, HARBOR_BOARD.z + 0.3, { w: 2.2, h: 1.9, name: 'harbor-board-sign' });
  }

  private buildHouse(b: (typeof HARBOR_BUILDINGS)[number]) {
    this.place(b.model, b.x, b.z, { w: b.w - 0.3, h: b.h, d: b.d - 0.3 }, 0, 'harbor-' + b.id);
    const base = this.box(b.w - 0.4, 0.08, b.d - 0.4, '#9d8b73');
    base.position.set(b.x, 0.04, b.z);
    this.root.add(shadowed(base, false));
    const front = b.z + b.d / 2;
    this.signpost(b.name, b.sub, b.sign, b.x + b.w / 2 - 1.2, front + 0.55, { name: 'harbor-sign-' + b.id });
    if (b.id === 'fishmarket') {
      for (const [i, m] of (['fishMackerel', 'fishCod', 'fishHairtail'] as const).entries())
        this.place(m, b.x - 2.6 + i * 1.1, front + 0.9, { w: 0.9, h: 0.3, d: 0.4 }, 0.3 * i, 'harbor-fish-' + i);
    } else {
      this.place('barrelRack', b.x - 2.2, front + 0.6, { w: 1.1, h: 1, d: 0.6 }, 0, 'harbor-guild-rack');
    }
  }

  private buildAuction() {
    const a = HARBOR_AUCTION;
    this.place('tavernStall', a.x, a.z, { w: a.w, h: 2.6, d: a.d }, 0, 'harbor-auction');
    // The auction bell on a post.
    const post = this.box(0.1, 2, 0.1, '#5d4430');
    post.position.set(a.x + a.w / 2 + 0.4, 1, a.z + 0.6);
    const bell = new THREE.Mesh(this.own(new THREE.ConeGeometry(0.2, 0.3, 12, 1, true)), this.own(districtMat('#d4a64a', { metalness: 0.3, roughness: 0.4, side: THREE.DoubleSide })));
    bell.position.set(a.x + a.w / 2 + 0.4, 1.85, a.z + 0.6);
    this.root.add(shadowed(post), bell);
    this.signpost('새벽 경매', '매일 아침 6시 ~ 7시', { bg: '#f6ecd6', ink: '#5a3b22', line: '#b2874f' }, a.x - a.w / 2 - 0.5, a.z + 0.7, { w: 2, h: 1.9, name: 'harbor-auction-sign' });
    // Fish crates on the stall front.
    for (let i = 0; i < 5; i++) {
      const crate = this.box(0.44, 0.22, 0.32, i % 2 ? '#8fb3c7' : '#d7c49a');
      crate.position.set(a.x - 1 + i * 0.5, 0.95, a.z + a.d / 2 - 0.1);
      crate.rotation.y = rnd('crate' + i) * 0.3 - 0.15;
      this.auctionGoods.add(shadowed(crate));
    }
  }

  private buildLighthouse() {
    const L = HARBOR_LIGHTHOUSE;
    const g = new THREE.Group();
    g.name = 'harbor-lighthouse';
    g.position.set(L.x, 0, L.z);
    const base = new THREE.Mesh(this.own(new THREE.CylinderGeometry(L.r + 0.3, L.r + 0.5, 0.6, 20)), this.own(districtMat('#8f877a')));
    base.position.y = 0.3;
    const body = new THREE.Mesh(this.own(new THREE.CylinderGeometry(L.r * 0.62, L.r * 0.92, L.height * 0.72, 20)), this.own(districtMat('#f3eee2')));
    body.position.y = 0.6 + (L.height * 0.72) / 2;
    g.add(base, body);
    for (const k of [0.25, 0.55]) {
      const band = new THREE.Mesh(this.own(new THREE.CylinderGeometry(L.r * (0.92 - 0.3 * k - 0.02) + 0.02, L.r * (0.92 - 0.3 * (k - 0.1)) + 0.02, L.height * 0.08, 20)), this.own(districtMat('#c4513d')));
      band.position.y = 0.6 + L.height * 0.72 * k;
      g.add(band);
    }
    const top = 0.6 + L.height * 0.72;
    const deck = new THREE.Mesh(this.own(new THREE.CylinderGeometry(L.r * 0.85, L.r * 0.85, 0.2, 20)), this.own(districtMat('#4a4a4a')));
    deck.position.y = top + 0.1;
    const room = new THREE.Mesh(this.own(new THREE.CylinderGeometry(L.r * 0.5, L.r * 0.5, 1.2, 16)), this.own(districtMat('#cfe6ea', { transparent: true, opacity: 0.75, roughness: 0.2 })));
    room.position.y = top + 0.8;
    const lamp = new THREE.Mesh(this.own(new THREE.SphereGeometry(L.r * 0.3, 14, 10)), this.own(new THREE.MeshBasicMaterial({ color: '#ffe7a6' })));
    lamp.position.y = top + 0.8;
    this.glows.push({ mesh: lamp, base: new THREE.Color('#ffe7a6') });
    const roof = new THREE.Mesh(this.own(new THREE.ConeGeometry(L.r * 0.62, 1, 16)), this.own(districtMat('#c4513d')));
    roof.position.y = top + 1.9;
    const door = this.box(0.8, 1.4, 0.1, '#6b4b33');
    door.position.set(0, 1.3, L.r * 0.9);
    door.rotation.x = -0.12;
    g.add(deck, room, lamp, roof, door);
    // The beam: a soft cone swept round at night.
    const beam = new THREE.Mesh(
      this.own(new THREE.ConeGeometry(1.4, 9, 20, 1, true)),
      this.own(new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })),
    );
    beam.rotation.z = Math.PI / 2;
    beam.position.set(4.6, top + 0.8, 0);
    const pivot = new THREE.Group();
    pivot.position.y = 0;
    pivot.add(beam);
    pivot.name = 'harbor-lighthouse-beam';
    g.add(shadowed(pivot, false));
    this.beam = beam;
    this.root.add(shadowed(g));
    this.pointLight(L.x, top + 0.8, L.z + 1.5, '#ffe2a0');
    this.signpost('등대', '가붕의 불빛', { bg: '#eef2f4', ink: '#27465a', line: '#6f8ea4' }, L.door.x + 1.9, L.door.z + 0.1, { w: 1.6, h: 1.6, name: 'harbor-lighthouse-sign' });
  }

  private buildEdge() {
    // Trees on the land side, rocks on the point, a ring behind the quay.
    for (const [i, t] of HARBOR_TREES.entries()) this.tree(t.x, t.z, t.s, i % 3 === 1, i);
    for (const [i, r] of HARBOR_ROCKS.entries()) this.place(i % 2 ? 'graniteBoulder' : 'valleyRocks', r.x, r.z, { w: 1.2 * r.s, h: 0.9 * r.s, d: 1 * r.s }, rnd('rock' + i) * 6, 'harbor-rock-' + i);
    const ring = this.ring(HARBOR_W, HARBOR_D, { side: 'w', z: HARBOR_EXIT.z }).filter(([, z]) => z < HARBOR_SHORE_Z - 1.5);
    this.plantRing(ring);
    this.signpost('마을 중심', '둑길 따라 서쪽', { bg: '#c49a62', ink: '#3c2716', line: '#7d5a36' }, HARBOR_EXIT.x + 1.6, HARBOR_EXIT.z - 1.8, { w: 1.4, h: 1.4, name: 'harbor-road-sign' });
  }

  override update(u: DistrictUpdate) {
    super.update(u);
    if (this.beam) (this.beam.material as THREE.MeshBasicMaterial).opacity = u.night ? 0.16 : 0;
  }
  override tick(t: number) {
    super.tick(t);
    if (this.beam?.parent && this.state.night) this.beam.parent.rotation.y = (t / 4000) % (Math.PI * 2);
  }
}
