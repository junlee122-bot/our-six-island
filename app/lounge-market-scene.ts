// ① 시장 거리 in three.js: the district's static set from
// lounge-market-layout.ts. Six kArchive buildings fitted into their lots
// (자료: kArchive · 출처: 쓰레드 dogfooter — the same models the hub's shops
// use, public/models/village/{tavern,shops}/assets.json), each with a
// hand-lettered sign and a few props of its trade; the plaza with the request
// board and the market-day stalls (goods only on Sundays), benches, lamps
// that glow at night, trees, the street paving and the road sign back to the
// hub. Models come through lounge-district-models.ts (prefetched at the
// hub's gate, cached for the two most recent districts). No React.
import * as THREE from 'three';
import {
  MARKET_BENCHES,
  MARKET_BOARD,
  MARKET_CAFE_TABLES,
  MARKET_D,
  MARKET_EXIT,
  MARKET_LAMPS,
  MARKET_PAVING,
  MARKET_PICNIC,
  MARKET_PLANTERS,
  MARKET_SHOPS,
  MARKET_STALLS,
  MARKET_TREES,
  MARKET_W,
  type MarketModel,
} from './lounge-market-layout';
import { MARKET_MODEL_URLS, districtModel } from './lounge-district-models';

const FONT = '"Jua", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...extra });
function rnd(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}
function shadowed<T extends THREE.Object3D>(o: T, cast = true) {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = cast;
      c.receiveShadow = true;
    }
  });
  return o;
}
function signTexture(text: string, sub: string, colors: { bg: string; ink: string; line: string }) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const c = canvas.getContext('2d');
  if (c) {
    c.fillStyle = colors.bg;
    c.fillRect(0, 0, 512, 160);
    c.strokeStyle = colors.line;
    c.lineWidth = 10;
    c.strokeRect(6, 6, 500, 148);
    c.fillStyle = colors.ink;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `64px ${FONT}`;
    c.fillText(text, 256, 64);
    c.font = `30px ${FONT}`;
    c.fillText(sub, 256, 124);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export type MarketUpdate = { marketDay: boolean; night: boolean };

export class MarketSet {
  readonly root = new THREE.Group();
  private disposables: { dispose: () => void }[] = [];
  private goods = new THREE.Group();
  private glows: { mesh: THREE.Mesh; base: THREE.Color }[] = [];
  private lights: THREE.PointLight[] = [];
  private state: MarketUpdate = { marketDay: false, night: false };
  onChange: () => void = () => {};

  constructor(look: { ground: string; groundFar: string }) {
    this.root.name = 'district-market';
    this.buildGround(look);
    for (const s of MARKET_SHOPS) this.buildShop(s);
    this.buildPlaza();
    this.buildEdge();
    this.goods.name = 'market-goods';
    this.goods.visible = false;
    this.root.add(this.goods);
  }

  private own<T extends { dispose: () => void }>(x: T) {
    this.disposables.push(x);
    return x;
  }
  private plane(w: number, d: number, color: string, y: number) {
    const m = new THREE.Mesh(this.own(new THREE.PlaneGeometry(w, d)), this.own(mat(color)));
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    m.receiveShadow = true;
    return m;
  }
  private box(w: number, h: number, d: number, color: string, extra: THREE.MeshStandardMaterialParameters = {}) {
    return new THREE.Mesh(this.own(new THREE.BoxGeometry(w, h, d)), this.own(mat(color, extra)));
  }
  /** A model fitted into a w × h × d box standing at (x, z), front (+z) facing the camera. */
  private place(model: MarketModel, x: number, z: number, size: { w: number; h: number; d: number }, rot = 0, name: string = model) {
    const holder = new THREE.Group();
    holder.name = name;
    holder.position.set(x, 0, z);
    this.root.add(holder);
    void districtModel('market', MARKET_MODEL_URLS[model]).then(
      (source) => {
        const o = source.clone(true);
        o.rotation.y = rot;
        o.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(o),
          m = b.getSize(new THREE.Vector3());
        const s = Math.min(size.w / (m.x || 1), size.h / (m.y || 1), size.d / (m.z || 1));
        if (!Number.isFinite(s) || s <= 0) return;
        o.scale.multiplyScalar(s);
        o.updateMatrixWorld(true);
        const b2 = new THREE.Box3().setFromObject(o),
          c = b2.getCenter(new THREE.Vector3());
        o.position.x -= c.x;
        o.position.z -= c.z;
        o.position.y -= b2.min.y - 0.02;
        holder.add(shadowed(o));
        this.onChange();
      },
      () => {},
    );
    return holder;
  }

  private buildGround(look: { ground: string; groundFar: string }) {
    this.root.add(this.plane(MARKET_W + 70, MARKET_D + 70, look.groundFar, -0.02));
    this.root.add(this.plane(MARKET_W, MARKET_D, look.ground, 0));
    for (const p of MARKET_PAVING) {
      const m = this.plane(p.w, p.d, p.tone === 'road' ? '#b8a07c' : '#d2bf98', 0.012);
      m.position.set(p.x, 0.012, p.z);
      this.root.add(m);
    }
    // Plaza border stones.
    const plaza = MARKET_PAVING.find((p) => p.tone === 'plaza')!;
    const stone = this.own(mat('#a58f6d'));
    const edge = this.own(new THREE.BoxGeometry(1, 0.08, 0.28));
    for (const side of [-1, 1]) {
      const m = new THREE.Mesh(edge, stone);
      m.scale.x = plaza.w;
      m.position.set(plaza.x, 0.04, plaza.z + (side * plaza.d) / 2);
      this.root.add(m);
    }
  }

  private buildShop(s: (typeof MARKET_SHOPS)[number]) {
    this.place(s.model, s.x, s.z, { w: s.w - 0.3, h: s.h, d: s.d - 0.3 }, 0, 'market-shop-' + s.id);
    // A low placeholder floor under the lot so the set never looks empty while models stream in.
    const base = this.box(s.w - 0.4, 0.08, s.d - 0.4, '#9d8b73');
    base.position.set(s.x, 0.04, s.z);
    this.root.add(shadowed(base, false));
    // Standing sign right of the door.
    const front = s.z + s.d / 2;
    // Big enough to read from the district's high camera, tipped back toward it.
    const sx = s.x + s.w / 2 - 1.2;
    const post = this.box(0.12, 2.7, 0.12, '#6d4f33');
    post.position.set(sx, 1.35, front + 0.55);
    const board = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(2.8, 0.87)),
      this.own(new THREE.MeshBasicMaterial({ map: this.own(signTexture(s.name, s.sub, s.sign)), toneMapped: false })),
    );
    board.position.set(sx, 2.75, front + 0.7);
    board.rotation.x = -0.55;
    board.name = 'market-sign-' + s.id;
    this.root.add(shadowed(post), board);
    // Trade props.
    const at = (dx: number, dz: number) => ({ x: s.x + dx, z: front + dz });
    switch (s.id) {
      case 'coop':
        for (const [dx, dz, r] of [[-2.2, 0.6, 0.2], [-1.6, 0.9, -0.3], [-2.6, 1.1, 0.6]] as const) {
          const p = at(dx, dz);
          this.place('produceCrate', p.x, p.z, { w: 0.7, h: 0.45, d: 0.5 }, r);
        }
        this.place('onggi', s.x + s.w / 2 - 0.3, s.z - 0.6, { w: 0.8, h: 0.9, d: 0.8 });
        break;
      case 'general': {
        const p = at(-2.3, 0.5);
        this.place('barrelRack', p.x, p.z, { w: 1.1, h: 1, d: 0.6 });
        this.lantern(s.x - 1.1, front + 0.3, '#7cf0b4', 1.9);
        break;
      }
      case 'bakery': {
        for (const t of MARKET_CAFE_TABLES) this.place('cafeTable', t.x, t.z, { w: 1.1, h: 1, d: 1.1 });
        const p = at(-2.1, 0.6);
        this.place('menuBoard', p.x, p.z, { w: 0.7, h: 0.95, d: 0.5 });
        break;
      }
      case 'newspaper': {
        const p = at(-2.4, 0.5);
        this.place('noticeBoard', p.x, p.z, { w: 1.1, h: 1.1, d: 0.45 });
        break;
      }
      case 'post': {
        // A red pillar post box.
        const g = new THREE.Group();
        const body = this.box(0.42, 0.95, 0.42, '#b4382c');
        body.position.y = 0.48;
        const cap = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 16)), this.own(mat('#8f2a21')));
        cap.position.y = 1.01;
        const slot = this.box(0.26, 0.04, 0.02, '#2b1a14');
        slot.position.set(0, 0.8, 0.22);
        g.add(body, cap, slot);
        const p = at(-2.2, 0.7);
        g.position.set(p.x, 0, p.z);
        this.root.add(shadowed(g));
        break;
      }
      case 'police':
        this.lantern(s.x - 1.2, front + 0.3, '#8fb4ff', 2.3);
        break;
    }
  }
  /** A post lantern that glows at night. */
  private lantern(x: number, z: number, color: string, h: number) {
    const post = this.box(0.08, h, 0.08, '#4a3a2c');
    post.position.set(x, h / 2, z);
    const glow = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.16, 12, 10)), this.own(new THREE.MeshBasicMaterial({ color })));
    glow.position.set(x, h + 0.1, z);
    this.glows.push({ mesh: glow, base: new THREE.Color(color) });
    this.root.add(shadowed(post), glow);
    if (this.lights.length < 4) {
      const light = new THREE.PointLight(color, 0, 7, 1.6);
      light.position.set(x, h, z + 0.3);
      this.lights.push(light);
      this.root.add(light);
    }
  }

  private buildPlaza() {
    // 의뢰 게시판.
    this.place('noticeBoard', MARKET_BOARD.x, MARKET_BOARD.z, { w: MARKET_BOARD.w, h: 1.5, d: MARKET_BOARD.d }, 0, 'market-board');
    const plate = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(2.4, 0.75)),
      this.own(new THREE.MeshBasicMaterial({ map: this.own(signTexture('의뢰 게시판', '주민들의 오늘 부탁', { bg: '#f3e6c8', ink: '#5a3b22', line: '#a77b4c' })), toneMapped: false })),
    );
    plate.position.set(MARKET_BOARD.x, 2.2, MARKET_BOARD.z + 0.35);
    plate.rotation.x = -0.55;
    // Picnic table and planters so the plaza is not a bare square.
    for (const t of MARKET_PICNIC) this.place('picnicTable', t.x, t.z, { w: t.w, h: 1.2, d: t.d }, 0, 'market-picnic');
    for (const [i, p] of MARKET_PLANTERS.entries()) {
      const box = this.box(p.w, 0.42, p.d, '#8a6440');
      box.position.set(p.x, 0.21, p.z);
      const soil = this.box(p.w - 0.16, 0.06, p.d - 0.16, '#5b4330');
      soil.position.set(p.x, 0.43, p.z);
      this.root.add(shadowed(box), soil);
      const colors = ['#e8a0b4', '#f2d06b', '#b9d98a', '#f0b27a'];
      for (let k = 0; k < 6; k++) {
        const f = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.13, 8, 6)), this.own(mat(colors[(i + k) % colors.length])));
        f.position.set(p.x - p.w / 2 + 0.3 + (k % 3) * ((p.w - 0.6) / 2), 0.55, p.z + (k < 3 ? -0.18 : 0.18));
        this.root.add(f);
      }
    }
    this.root.add(plate);
    for (const st of MARKET_STALLS) {
      this.place(st.model, st.x, st.z, { w: st.w, h: st.h, d: st.d }, 0, 'market-' + st.id);
      // Market-day goods: crates of colour on the stall's front.
      for (let i = 0; i < 4; i++) {
        const g = this.box(0.34, 0.2, 0.28, i % 2 ? st.goods : '#e6d3a8');
        g.position.set(st.x - 0.7 + i * 0.46, 0.95, st.z + st.d / 2 - 0.15);
        g.rotation.y = rnd(st.id + i) * 0.4 - 0.2;
        this.goods.add(shadowed(g));
      }
    }
    for (const b of MARKET_BENCHES) this.place('parkBench', b.x, b.z, { w: b.w, h: 1.1, d: b.d }, 0, 'market-' + b.id);
    MARKET_LAMPS.forEach((l, i) => {
      this.place('gardenLantern', l.x, l.z, { w: 0.6, h: 1.8, d: 0.6 }, 0, 'market-lamp-' + i);
      const glow = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.12, 10, 8)), this.own(new THREE.MeshBasicMaterial({ color: '#ffd98a' })));
      glow.position.set(l.x, 1.62, l.z);
      this.glows.push({ mesh: glow, base: new THREE.Color('#ffd98a') });
      this.root.add(glow);
      if (i < 3 && this.lights.length < 7) {
        const light = new THREE.PointLight('#ffc27a', 0, 8, 1.6);
        light.position.set(l.x, 1.8, l.z + 0.3);
        this.lights.push(light);
        this.root.add(light);
      }
    });
    for (const [i, t] of MARKET_TREES.entries()) this.place(t.pine ? 'smallPine' : 'broadleafTree', t.x, t.z, { w: 1.9 * t.s, h: 1.9 * t.s, d: 1.9 * t.s }, rnd('mt' + i) * 6.28, 'market-tree-' + i);
    for (const [i, [x, z]] of ([[-4, -3.4], [4, -3.4], [-9.6, 12.6], [9.6, 12.6]] as const).entries())
      this.place('shrub', x, z, { w: 1.1, h: 0.55, d: 0.7 }, rnd('sh' + i) * 3, 'market-shrub-' + i);
  }

  private buildEdge() {
    // A ring of trees just outside the walkable edge, open at the road west.
    const w = MARKET_W,
      d = MARKET_D;
    const ring: [number, number][] = [];
    for (let x = -w / 2 - 1.5; x <= w / 2 + 1.5; x += 2.6) ring.push([x, -d / 2 - 1.3 - rnd('n' + x) * 2]);
    for (let z = -d / 2; z <= d / 2 + 1; z += 2.7) {
      if (Math.abs(z - MARKET_EXIT.z) > 2.6) ring.push([-w / 2 - 1.2 - rnd('w' + z) * 1.8, z]);
      ring.push([w / 2 + 1.2 + rnd('e' + z) * 1.8, z]);
    }
    for (let x = -w / 2 - 1.5; x <= w / 2 + 1.5; x += 3.4) ring.push([x, d / 2 + 1.4 + rnd('s' + x) * 1.2]);
    ring.forEach(([x, z], i) => {
      const k = rnd(`ring:${x.toFixed(1)}:${z.toFixed(1)}`);
      const pine = k < 0.4;
      const s = pine ? 2.2 + k : 2 + k * 0.8;
      this.place(pine ? 'smallPine' : 'broadleafTree', x, z, { w: 1.9 * s, h: 1.9 * s, d: 1.9 * s }, k * 6.28, 'market-ring-' + i);
    });
    // The road sign back to the hub.
    const post = this.box(0.14, 1.4, 0.14, '#8a6440');
    post.position.set(MARKET_EXIT.x + 1.6, 0.7, MARKET_EXIT.z - 1.8);
    const board = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(1.4, 0.44)),
      this.own(new THREE.MeshBasicMaterial({ map: this.own(signTexture('마을 중심', '큰길 따라 서쪽', { bg: '#c49a62', ink: '#3c2716', line: '#7d5a36' })), toneMapped: false })),
    );
    board.position.set(MARKET_EXIT.x + 1.6, 1.35, MARKET_EXIT.z - 1.72);
    this.root.add(shadowed(post), board);
  }

  update(u: MarketUpdate) {
    this.state = u;
    this.goods.visible = u.marketDay;
    for (const g of this.glows) (g.mesh.material as THREE.MeshBasicMaterial).color.copy(g.base).multiplyScalar(u.night ? 1 : 0.6);
    for (const l of this.lights) l.intensity = u.night ? 1.3 : 0;
  }
  current() {
    return this.state;
  }
  dispose() {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    this.root.removeFromParent();
  }
}
