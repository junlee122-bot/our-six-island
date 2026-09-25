// Life-expansion village layer (LIFE-B): the sea around the island, the pond,
// the sea pier, the museum pavilion, the bundle notice board and the greenhouse
// frame, village-restoration touches per bundle flag, today's forage / bug
// markers, the fishing bobber, the seasonal re-tint of grass and foliage, and
// cheap weather particles (rain, snow, falling leaves, spring petals).
// Everything is built from primitives; particles are one THREE.Points each.
import * as THREE from 'three';
import {
  VILLAGE_BOARD,
  VILLAGE_GREENHOUSE,
  VILLAGE_MARKET,
  VILLAGE_MUSEUM,
  VILLAGE_PIER,
  VILLAGE_POND,
  VILLAGE_TERRACE,
  VILLAGE_PLACES,
  type VillagePoint,
} from './lounge-village-layout';
import { VILLAGE_SEASON_MATERIALS, batchDirectMeshes } from './lounge-village-world';
import { SPAWN_POINTS } from './lounge-village-spots';
import { SEASON_TINT, ambienceOf } from './lounge-life-ui';
import type { Season, Weather } from './lounge-calendar';

const mat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
const MAT = {
  sea: mat('#7cc1cf', { roughness: 0.35, metalness: 0.05 }),
  pond: mat('#79c3c8', { roughness: 0.25, metalness: 0.08, transparent: true, opacity: 0.9 }),
  stone: mat('#b9ad98'),
  wood: mat('#8a6243'),
  woodLight: mat('#b4875a'),
  woodDark: mat('#5e4330'),
  cream: mat('#f3e7cc'),
  column: mat('#efe6d6'),
  roof: mat('#6f8fa3'),
  roof2: mat('#c98a5a'),
  cork: mat('#c9a06a'),
  paper: mat('#fff6df'),
  paperDone: mat('#9fd09a'),
  glass: mat('#bfe6e8', { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.45 }),
  frame: mat('#e9e3d6'),
  leaf: mat('#6aa84f'),
  lily: mat('#5f9a4a'),
  reed: mat('#7f9a52'),
  flag1: mat('#e2574c'),
  flag2: mat('#f2c14e'),
  flag3: mat('#5b8fb9'),
  boat: mat('#d9d0c0'),
  boatTrim: mat('#c9573f'),
  bobber: mat('#e2433a'),
  bobberTop: mat('#ffffff'),
  jet: mat('#bfe8f2', { transparent: true, opacity: 0.7 }),
};
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 18),
  sphere: new THREE.SphereGeometry(1, 12, 8),
  cone: new THREE.ConeGeometry(1, 1, 4),
};

function box(parent: THREE.Object3D, m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number) {
  const o = new THREE.Mesh(GEO.box, m);
  o.position.set(x, y, z);
  o.scale.set(w, h, d);
  o.castShadow = h > 0.15;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function cyl(parent: THREE.Object3D, m: THREE.Material, x: number, y: number, z: number, r: number, h: number) {
  const o = new THREE.Mesh(GEO.cyl, m);
  o.position.set(x, y, z);
  o.scale.set(r, h, r);
  o.castShadow = h > 0.2;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function canvasSprite(draw: (c: CanvasRenderingContext2D) => void, w: number, h: number, scale: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }),
  );
  sprite.scale.set(scale * (w / h), scale, 1);
  sprite.renderOrder = 20;
  return sprite;
}
function signSprite(text: string, scale = 0.62) {
  return canvasSprite(
    (c) => {
      c.fillStyle = '#5b3d25';
      c.beginPath();
      c.roundRect(0, 0, 256, 88, 14);
      c.fill();
      c.fillStyle = '#fff3cf';
      c.beginPath();
      c.roundRect(6, 6, 244, 76, 10);
      c.fill();
      c.fillStyle = '#6a3f23';
      c.font = 'bold 40px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, 128, 46);
    },
    256,
    88,
    scale,
  );
}
/** Round marker icon: a leaf (forage) or a butterfly (bug) on a soft disc. */
function markerTexture(kind: 'forage' | 'bug') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const c = canvas.getContext('2d')!;
  const g = c.createRadialGradient(48, 48, 8, 48, 48, 46);
  g.addColorStop(0, kind === 'bug' ? 'rgba(255,244,170,0.95)' : 'rgba(236,255,214,0.95)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 96, 96);
  c.lineWidth = 3;
  c.strokeStyle = '#3d2f25';
  if (kind === 'forage') {
    c.fillStyle = '#6aa84f';
    c.beginPath();
    c.moveTo(48, 76);
    c.bezierCurveTo(20, 60, 22, 30, 50, 20);
    c.bezierCurveTo(72, 34, 72, 60, 48, 76);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(48, 76);
    c.lineTo(52, 30);
    c.stroke();
  } else {
    c.fillStyle = '#f2c14e';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.ellipse(48 + s * 16, 38, 15, 12, s * 0.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.ellipse(48 + s * 12, 60, 10, 9, -s * 0.4, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
    c.fillStyle = '#3d2f25';
    c.fillRect(45, 28, 6, 40);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function particleTexture(kind: 'rain' | 'snow' | 'leaves' | 'petals') {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const c = canvas.getContext('2d')!;
  if (kind === 'rain') {
    const g = c.createLinearGradient(16, 0, 16, 32);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    c.fillStyle = g;
    c.fillRect(14.5, 0, 3, 32);
  } else if (kind === 'snow') {
    const g = c.createRadialGradient(16, 16, 1, 16, 16, 12);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  } else {
    c.fillStyle = '#ffffff';
    c.beginPath();
    if (kind === 'leaves') {
      c.moveTo(16, 3);
      c.bezierCurveTo(28, 10, 26, 24, 16, 29);
      c.bezierCurveTo(6, 24, 4, 10, 16, 3);
    } else c.ellipse(16, 16, 9, 6, 0.6, 0, Math.PI * 2);
    c.fill();
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type Ambience = 'rain' | 'snow' | 'leaves' | 'petals';
const AMBIENCE_COUNT: Record<Ambience, number> = { rain: 700, snow: 420, leaves: 90, petals: 110 };
const AREA = { x: 64, y: 22, z: 64 };

export type SeasonUpdate = {
  season: Season;
  weather: Weather;
  flags: readonly string[];
  spawns: readonly { spot: string; kind: 'forage' | 'bug'; taken: boolean }[];
  /** Weather particles allowed (settings + reduced motion). */
  effects: boolean;
  /** Bundle notice board papers: done state per bundle. */
  bundlesDone: readonly boolean[];
  /** 집 확장 tier per actor (3: front garden, 4: second floor + nameplate). */
  houses?: Readonly<Record<number, number>>;
};
export type FishingState = {
  phase: 'none' | 'wait' | 'bite' | 'caught';
  from: VillagePoint;
  to: VillagePoint;
};

export class VillageSeasonLayer {
  readonly root = new THREE.Group();
  private base: Record<keyof typeof VILLAGE_SEASON_MATERIALS, THREE.Color>;
  private flagged = new Map<string, THREE.Object3D[]>();
  /** Today's spawn markers: one Points object per kind (2 draw calls in all). */
  private markers: Record<'forage' | 'bug', { points: THREE.Points; base: Float32Array }> | null = null;
  private markerCount = 0;
  /** Bundle papers on the board: one instanced mesh, coloured per bundle. */
  private papers: THREE.InstancedMesh | null = null;
  private pierBroken: THREE.Group;
  private pierFixed: THREE.Group;
  private bobber: THREE.Group;
  private ripple: THREE.Mesh;
  private line: THREE.Line;
  private bite: THREE.Sprite;
  private fishing: FishingState = { phase: 'none', from: { x: 0, z: 0 }, to: { x: 0, z: 0 } };
  private fishingSince = 0;
  private particles: { kind: Ambience; points: THREE.Points; speed: Float32Array; phase: Float32Array } | null = null;
  private lastKey = '';
  private lastTick = 0;
  private effects = true;
  private reducedQuery: MediaQueryList | null = null;
  private get reduced() {
    return !!this.reducedQuery?.matches;
  }
  constructor(parent: THREE.Object3D) {
    this.root.name = 'village-season';
    parent.add(this.root);
    const m = VILLAGE_SEASON_MATERIALS;
    this.base = {
      grass: m.grass.color.clone(),
      grassLight: m.grassLight.color.clone(),
      leaf: m.leaf.color.clone(),
      leafLight: m.leafLight.color.clone(),
      leafDark: m.leafDark.color.clone(),
      bank: m.bank.color.clone(),
    };
    // The sea: one plane under the island plinth (the island hides it above).
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), MAT.sea);
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -0.62;
    sea.receiveShadow = false;
    sea.name = 'village-sea';
    this.root.add(sea);
    this.buildPond();
    const pier = this.buildPier();
    this.pierBroken = pier.broken;
    this.pierFixed = pier.fixed;
    this.buildMuseum();
    this.buildBoard();
    this.buildGreenhouse();
    this.buildFlagTouches();
    this.buildProjectTouches();
    const fishing = this.buildBobber();
    this.bobber = fishing.bobber;
    this.ripple = fishing.ripple;
    this.line = fishing.line;
    this.bite = fishing.bite;
    try {
      this.reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
    } catch {}
  }

  private buildPond() {
    const g = new THREE.Group();
    g.name = 'village-pond';
    const { x, z, radius } = VILLAGE_POND;
    cyl(g, MAT.stone, x, 0.06, z, radius + 0.35, 0.12).castShadow = false;
    const water = cyl(g, MAT.pond, x, 0.14, z, radius, 0.06);
    water.castShadow = false;
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const s = new THREE.Mesh(GEO.sphere, MAT.stone);
      s.position.set(x + Math.cos(a) * (radius + 0.3), 0.14, z + Math.sin(a) * (radius + 0.3));
      s.scale.set(0.26, 0.12, 0.2);
      g.add(s);
    }
    for (const [dx, dz, r] of [
      [-0.9, 0.6, 0.34],
      [0.7, -0.8, 0.28],
      [1.2, 0.9, 0.22],
    ]) {
      const pad = cyl(g, MAT.lily, x + dx, 0.18, z + dz, r, 0.02);
      pad.castShadow = false;
    }
    for (const [dx, dz] of [
      [-2.2, -1.2],
      [-2.4, -0.6],
      [2.1, -1.5],
      [2.3, -1.0],
    ])
      cyl(g, MAT.reed, x + dx, 0.45, z + dz, 0.035, 0.8);
    const sign = signSprite('연못 낚시터', 0.55);
    sign.position.set(x, 1.5, z + radius + 0.8);
    batchDirectMeshes(g);
    g.add(sign);
    this.root.add(g);
  }

  private buildPier() {
    const { x, z, width } = VILLAGE_PIER;
    const fixed = new THREE.Group(),
      broken = new THREE.Group();
    fixed.name = 'village-pier-fixed';
    broken.name = 'village-pier-broken';
    const x0 = x - 1.2;
    for (let i = 0; i < 12; i++) box(fixed, i % 2 ? MAT.woodLight : MAT.wood, x0 + i * 0.5, 0.3, z, 0.46, 0.1, width);
    for (const px of [x0, x0 + 2, x0 + 4, x0 + 5.6])
      for (const s of [-1, 1]) cyl(fixed, MAT.woodDark, px, -0.1, z + s * (width / 2 - 0.08), 0.08, 0.9);
    const lamp = cyl(fixed, MAT.woodDark, x0 + 5.6, 0.85, z - width / 2 + 0.1, 0.05, 1.1);
    lamp.castShadow = false;
    const bulb = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#ffe7a0' }));
    bulb.position.set(x0 + 5.6, 1.45, z - width / 2 + 0.1);
    bulb.scale.setScalar(0.12);
    fixed.add(bulb);
    // Broken: two planks, a gap, a tilted plank and a "수리 중" sign.
    for (let i = 0; i < 3; i++) box(broken, MAT.wood, x0 + i * 0.5, 0.3, z, 0.46, 0.1, width);
    const loose = box(broken, MAT.woodLight, x0 + 2.6, 0.12, z + 0.2, 0.46, 0.08, width * 0.8);
    loose.rotation.z = 0.35;
    cyl(broken, MAT.woodDark, x0 + 4, -0.1, z - 0.4, 0.08, 0.7);
    const sign = signSprite('데크 수리 중', 0.5);
    sign.position.set(x0 + 0.4, 1.3, z);
    const fixedSign = signSprite('바다 낚시터', 0.5);
    fixedSign.position.set(x0 + 0.4, 1.3, z);
    batchDirectMeshes(fixed);
    batchDirectMeshes(broken);
    broken.add(sign);
    fixed.add(fixedSign);
    fixed.visible = false;
    this.root.add(fixed, broken);
    // Dock flag: a little boat tied at the pier end.
    const boat = new THREE.Group();
    const hull = box(boat, MAT.boat, 0, 0.05, 0, 1.8, 0.3, 0.7);
    hull.castShadow = false;
    box(boat, MAT.boatTrim, 0, 0.22, 0, 1.84, 0.06, 0.74);
    box(boat, MAT.wood, 0, 0.12, 0, 0.2, 0.18, 0.6);
    boat.position.set(x0 + 4.4, -0.35, z + width / 2 + 0.6);
    this.addFlagged('dock', boat);
    return { fixed, broken };
  }

  private buildMuseum() {
    const g = new THREE.Group();
    g.name = 'village-museum';
    const { x, z, width: w, depth: d } = VILLAGE_MUSEUM;
    box(g, MAT.stone, x, 0.1, z, w + 0.3, 0.2, d + 0.3);
    box(g, MAT.cream, x, 0.8, z - d / 2 + 0.15, w, 1.2, 0.2);
    for (const cx of [-w / 2 + 0.15, -w / 6, w / 6, w / 2 - 0.15]) cyl(g, MAT.column, x + cx, 0.8, z + d / 2 - 0.15, 0.1, 1.2);
    box(g, MAT.cream, x, 1.45, z, w + 0.2, 0.12, d + 0.2);
    const roof = new THREE.Mesh(GEO.cone, MAT.roof);
    roof.position.set(x, 1.85, z);
    roof.scale.set(w * 0.78, 0.7, d * 0.85);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    g.add(roof);
    // Display plinths with small shapes (fish, flower, bug jars).
    for (const [i, color] of ['#e2574c', '#f2c14e', '#6aa84f'].entries()) {
      const px = x - 0.7 + i * 0.7;
      box(g, MAT.column, px, 0.42, z, 0.36, 0.44, 0.36);
      const item = new THREE.Mesh(GEO.sphere, mat(color));
      item.position.set(px, 0.76, z);
      item.scale.set(0.14, 0.12, 0.14);
      g.add(item);
    }
    batchDirectMeshes(g);
    const sign = signSprite('마을 박물관', 0.55);
    sign.position.set(x, 2.5, z + d / 2);
    g.add(sign);
    this.root.add(g);
    // Museum flag: a second floor (and the roof moves up).
    const floor2 = new THREE.Group();
    floor2.name = 'village-museum-floor2';
    box(floor2, MAT.cream, x, 1.95, z, w * 0.7, 0.9, d * 0.7);
    box(floor2, MAT.glass, x, 1.95, z + d * 0.35 + 0.01, w * 0.5, 0.5, 0.02);
    const roof2 = new THREE.Mesh(GEO.cone, MAT.roof2);
    roof2.position.set(x, 2.75, z);
    roof2.scale.set(w * 0.58, 0.6, d * 0.65);
    roof2.rotation.y = Math.PI / 4;
    floor2.add(roof2);
    this.addFlagged('museum', floor2);
  }

  private buildBoard() {
    const g = new THREE.Group();
    g.name = 'village-board';
    const { x, z, width: w } = VILLAGE_BOARD;
    for (const s of [-1, 1]) box(g, MAT.woodDark, x + s * (w / 2 - 0.05), 0.75, z, 0.1, 1.5, 0.1);
    box(g, MAT.cork, x, 1.05, z + 0.03, w, 0.8, 0.06);
    box(g, MAT.wood, x, 1.52, z, w + 0.24, 0.1, 0.3);
    batchDirectMeshes(g);
    const papers = new THREE.InstancedMesh(GEO.box, new THREE.MeshStandardMaterial({ roughness: 0.9 }), 8);
    const m = new THREE.Matrix4(),
      q = new THREE.Quaternion(),
      e = new THREE.Euler();
    for (let i = 0; i < 8; i++) {
      m.compose(
        new THREE.Vector3(x - w / 2 + 0.2 + (i % 4) * ((w - 0.4) / 3), 1.25 - Math.floor(i / 4) * 0.36, z + 0.07),
        q.setFromEuler(e.set(0, 0, ((i * 37) % 7) * 0.03 - 0.09)),
        new THREE.Vector3(0.24, 0.26, 0.01),
      );
      papers.setMatrixAt(i, m);
      papers.setColorAt(i, MAT.paper.color);
    }
    papers.name = 'village-board-papers';
    this.papers = papers;
    g.add(papers);
    const sign = signSprite('마을 게시판', 0.5);
    sign.position.set(x, 2.05, z);
    g.add(sign);
    this.root.add(g);
  }

  private buildGreenhouse() {
    const g = new THREE.Group();
    g.name = 'village-greenhouse';
    const { x, z, width: w, depth: d } = VILLAGE_GREENHOUSE;
    box(g, MAT.stone, x, 0.06, z, w + 0.1, 0.12, d + 0.1).castShadow = false;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, MAT.frame, x + (sx * w) / 2, 0.7, z + (sz * d) / 2, 0.06, 1.3, 0.06);
    box(g, MAT.frame, x, 1.35, z, w, 0.06, 0.06);
    for (const sz of [-1, 1]) box(g, MAT.frame, x, 1.36, z + (sz * d) / 2, w, 0.05, 0.05);
    batchDirectMeshes(g);
    this.root.add(g);
    const glass = new THREE.Group();
    glass.name = 'village-greenhouse-glass';
    for (const sz of [-1, 1]) {
      const pane = box(glass, MAT.glass, x, 0.7, z + (sz * d) / 2, w, 1.26, 0.02);
      pane.castShadow = false;
    }
    for (const sx of [-1, 1]) box(glass, MAT.glass, x + (sx * w) / 2, 0.7, z, 0.02, 1.26, d).castShadow = false;
    const roofA = box(glass, MAT.glass, x, 1.5, z - d / 4, w, 0.02, d / 2 + 0.1);
    roofA.rotation.x = 0.5;
    const roofB = box(glass, MAT.glass, x, 1.5, z + d / 4, w, 0.02, d / 2 + 0.1);
    roofB.rotation.x = -0.5;
    for (let i = 0; i < 4; i++) {
      const plant = new THREE.Mesh(GEO.sphere, MAT.leaf);
      plant.position.set(x - 0.6 + i * 0.4, 0.3, z);
      plant.scale.set(0.18, 0.22, 0.18);
      glass.add(plant);
    }
    const sign = signSprite('마을 온실', 0.46);
    sign.position.set(x, 2.1, z + d / 2);
    glass.add(sign);
    this.addFlagged('greenhouse', glass);
  }

  private buildFlagTouches() {
    // Café: a sign over the terrace.
    const cafe = signSprite('노을 카페', 0.55);
    cafe.position.set(VILLAGE_TERRACE.x, 2.4, VILLAGE_TERRACE.z);
    this.addFlagged('cafe', cafe);
    // Stage: bunting around the plaza.
    const bunting = new THREE.Group();
    const flags = [MAT.flag1, MAT.flag2, MAT.flag3];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const f = new THREE.Mesh(GEO.cone, flags[i % 3]);
      f.position.set(Math.sin(a) * 4.2, 2.6 + Math.sin(i * 1.3) * 0.08, Math.cos(a) * 4.2);
      f.scale.set(0.16, -0.3, 0.02);
      f.rotation.y = a;
      bunting.add(f);
    }
    batchDirectMeshes(bunting);
    this.addFlagged('stage', bunting);
    // Fountain: water jets over the plaza fountain.
    const jets = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const jet = cyl(jets, MAT.jet, Math.sin(a) * 0.5, 1.4, Math.cos(a) * 0.5, 0.05, 0.9);
      jet.castShadow = false;
    }
    cyl(jets, MAT.jet, 0, 1.7, 0, 0.08, 1.4).castShadow = false;
    this.addFlagged('fountain', jets);
    // Market: a second awning crate row beside the stall.
    const market = new THREE.Group();
    const mx = VILLAGE_MARKET.x + VILLAGE_MARKET.width / 2 + 0.6,
      mz = VILLAGE_MARKET.z;
    box(market, MAT.woodLight, mx, 0.25, mz, 0.7, 0.5, 0.6);
    box(market, MAT.woodLight, mx, 0.62, mz, 0.6, 0.24, 0.5);
    box(market, MAT.flag1, mx, 1.3, mz, 0.9, 0.06, 0.9);
    cyl(market, MAT.woodDark, mx, 0.65, mz + 0.4, 0.04, 1.3);
    batchDirectMeshes(market);
    this.addFlagged('market', market);
  }

  /** 마을 공사 2차 (ECON-2): what each finished project adds to the village. */
  private buildProjectTouches() {
    const glow = new THREE.MeshBasicMaterial({ color: '#ffe7a0' });
    // 다리 등불: lantern posts along the sea deck.
    const lights = new THREE.Group();
    lights.name = 'village-project-lights';
    const { x: px, z: pz, width: pw } = VILLAGE_PIER;
    for (let i = 0; i < 4; i++)
      for (const s of [-1, 1]) {
        const lx = px - 1.2 + i * 1.6,
          lz = pz + s * (pw / 2 - 0.05);
        cyl(lights, MAT.woodDark, lx, 0.8, lz, 0.04, 1.0);
        const bulb = new THREE.Mesh(GEO.sphere, glow);
        bulb.position.set(lx, 1.38, lz);
        bulb.scale.setScalar(0.12);
        lights.add(bulb);
      }
    const lightSign = signSprite('다리 등불', 0.42);
    lightSign.position.set(px - 1.2, 2.0, pz);
    lights.add(lightSign);
    this.addFlagged('lights', lights);
    // 광장 대분수: a higher tier of jets over the plaza fountain.
    const plaza = new THREE.Group();
    plaza.name = 'village-project-plaza';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      cyl(plaza, MAT.jet, Math.sin(a) * 0.95, 1.2, Math.cos(a) * 0.95, 0.04, 1.3).castShadow = false;
    }
    cyl(plaza, MAT.jet, 0, 2.3, 0, 0.1, 2.2).castShadow = false;
    const plazaSign = signSprite('광장 대분수', 0.42);
    plazaSign.position.set(0, 3.7, 0);
    plaza.add(plazaSign);
    this.addFlagged('plaza', plaza);
    // 카지노 VIP룸: a gold awning and sign on the casino.
    const casino = VILLAGE_PLACES.find((p) => p.kind === 'casino');
    if (casino) {
      const vip = new THREE.Group();
      vip.name = 'village-project-vip';
      const gold = mat('#d9b25a', { metalness: 0.4, roughness: 0.4 });
      box(vip, gold, casino.x, 2.55, casino.z + casino.depth / 2 + 0.35, casino.width * 0.55, 0.08, 0.8);
      const sign = signSprite('카지노 VIP룸', 0.5);
      sign.position.set(casino.x, 3.3, casino.z + casino.depth / 2 + 0.4);
      vip.add(sign);
      this.addFlagged('vip', vip);
    }
    // 온실 2동: a second glass house beside the first.
    const gh = new THREE.Group();
    gh.name = 'village-project-greenhouse2';
    const { x: gx, z: gz, width: gw, depth: gd } = VILLAGE_GREENHOUSE;
    const g2x = gx + gw + 0.5;
    box(gh, MAT.stone, g2x, 0.06, gz, gw * 0.8, 0.12, gd).castShadow = false;
    box(gh, MAT.glass, g2x, 0.7, gz, gw * 0.8, 1.26, gd).castShadow = false;
    for (let i = 0; i < 3; i++) {
      const plant = new THREE.Mesh(GEO.sphere, MAT.leaf);
      plant.position.set(g2x - 0.4 + i * 0.4, 0.3, gz);
      plant.scale.set(0.18, 0.22, 0.18);
      gh.add(plant);
    }
    const ghSign = signSprite('온실 2동', 0.4);
    ghSign.position.set(g2x, 2.0, gz + gd / 2);
    gh.add(ghSign);
    this.addFlagged('greenhouse2', gh);
    // 마을 축제 무대: a ring of festival lights over the plaza.
    const fest = new THREE.Group();
    fest.name = 'village-project-festival';
    const colors = [glow, new THREE.MeshBasicMaterial({ color: '#f7a8c9' }), new THREE.MeshBasicMaterial({ color: '#9fd8f0' })];
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const b = new THREE.Mesh(GEO.sphere, colors[i % 3]);
      b.position.set(Math.sin(a) * 4.5, 3.0 + Math.sin(i * 0.9) * 0.1, Math.cos(a) * 4.5);
      b.scale.setScalar(0.09);
      fest.add(b);
    }
    const festSign = signSprite('마을 축제', 0.5);
    festSign.position.set(0, 4.3, -4.2);
    fest.add(festSign);
    this.addFlagged('festival', fest);
  }

  /** 집 확장 tiers 3–4 outside each friend's house (rebuilt when tiers change). */
  private houseGroup: THREE.Group | null = null;
  private houseKey = '';
  private updateHouses(houses: Readonly<Record<number, number>> | undefined) {
    const key = JSON.stringify(houses ?? {});
    if (key === this.houseKey) return;
    this.houseKey = key;
    if (this.houseGroup) {
      this.root.remove(this.houseGroup);
      this.houseGroup.traverse((o) => {
        if (o instanceof THREE.Sprite) {
          o.material.map?.dispose();
          o.material.dispose();
        }
      });
    }
    const g = new THREE.Group();
    g.name = 'village-house-tiers';
    for (const place of VILLAGE_PLACES) {
      if (place.kind !== 'home' || place.actor === undefined) continue;
      const tier = houses?.[place.actor] ?? 0;
      if (tier < 3) continue;
      const fz = place.z + place.depth / 2 + 0.4;
      // Tier 3: a flower bed and two garden lanterns in front of the house.
      for (let i = 0; i < 5; i++) {
        const f = new THREE.Mesh(GEO.sphere, [MAT.flag1, MAT.flag2, MAT.flag3][i % 3]);
        f.position.set(place.x - place.width / 2 + 0.3 + i * 0.22, 0.14, fz);
        f.scale.setScalar(0.1);
        g.add(f);
      }
      for (const s of [-1, 1]) {
        cyl(g, MAT.woodDark, place.x + s * (place.width / 2 + 0.2), 0.45, fz, 0.035, 0.9);
        const bulb = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#ffe7a0' }));
        bulb.position.set(place.x + s * (place.width / 2 + 0.2), 0.95, fz);
        bulb.scale.setScalar(0.09);
        g.add(bulb);
      }
      // Tier 4: a pennant pole and a nameplate over the door.
      if (tier >= 4) {
        const poleX = place.x + place.width / 2 + 0.5;
        cyl(g, MAT.woodDark, poleX, 1.5, place.z, 0.04, 3.0);
        const flag = new THREE.Mesh(GEO.box, MAT.flag2);
        flag.position.set(poleX + 0.3, 2.8, place.z);
        flag.scale.set(0.55, 0.32, 0.02);
        g.add(flag);
        const plate = signSprite(`${place.name.replace(/의 집$/, '')}의 2층집`, 0.42);
        plate.position.set(place.x, 3.6, fz - 0.2);
        g.add(plate);
      }
    }
    this.houseGroup = g;
    this.root.add(g);
  }

  private buildMarkers(kind: 'forage' | 'bug') {
    const n = 32,
      base = new Float32Array(n * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geometry.setDrawRange(0, 0);
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: markerTexture(kind),
        size: kind === 'bug' ? 30 : 28,
        sizeAttenuation: false,
        transparent: true,
        depthWrite: false,
        alphaTest: 0.05,
        toneMapped: false,
      }),
    );
    points.frustumCulled = false;
    points.renderOrder = 15;
    points.name = 'village-spawns-' + kind;
    this.root.add(points);
    return { points, base };
  }

  private addFlagged(flag: string, object: THREE.Object3D) {
    object.visible = false;
    this.root.add(object);
    const list = this.flagged.get(flag) ?? [];
    list.push(object);
    this.flagged.set(flag, list);
  }

  private buildBobber() {
    const bobber = new THREE.Group();
    const bottom = new THREE.Mesh(GEO.sphere, MAT.bobber);
    bottom.scale.setScalar(0.13);
    const top = new THREE.Mesh(GEO.sphere, MAT.bobberTop);
    top.position.y = 0.1;
    top.scale.setScalar(0.09);
    bobber.add(bottom, top);
    bobber.visible = false;
    const ripple = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.38, 32),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide }),
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.visible = false;
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
      new THREE.LineBasicMaterial({ color: '#f7f3e8', transparent: true, opacity: 0.8 }),
    );
    line.visible = false;
    line.frustumCulled = false;
    const bite = canvasSprite(
      (c) => {
        c.fillStyle = '#e2433a';
        c.beginPath();
        c.arc(64, 60, 46, 0, Math.PI * 2);
        c.fill();
        c.lineWidth = 8;
        c.strokeStyle = '#fffdf2';
        c.stroke();
        c.fillStyle = '#fffdf2';
        c.font = 'bold 72px sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('!', 64, 64);
      },
      128,
      128,
      0.8,
    );
    bite.visible = false;
    this.root.add(bobber, ripple, line, bite);
    return { bobber, ripple, line, bite };
  }

  /** Season, weather, flags and today's spawns (returns true when something changed). */
  update(u: SeasonUpdate): boolean {
    const key = JSON.stringify([u.season, u.weather, u.flags, u.spawns.map((s) => s.spot + s.kind + s.taken), u.effects, u.bundlesDone, u.houses ?? {}]);
    if (key === this.lastKey) return false;
    this.lastKey = key;
    this.updateHouses(u.houses);
    this.effects = u.effects && !this.reduced;
    // Season tint (winter frost, autumn gold…): a blend over the original colours.
    const tint = SEASON_TINT[u.season];
    const m = VILLAGE_SEASON_MATERIALS;
    const blend = (target: THREE.MeshStandardMaterial, base: THREE.Color, color: string, k: number) =>
      target.color.copy(base).lerp(new THREE.Color(color), k);
    const k = u.season === 'summer' ? 0.25 : u.season === 'winter' ? (u.weather === 'snow' ? 0.8 : 0.55) : 0.5;
    blend(m.grass, this.base.grass, tint.grass, k);
    blend(m.grassLight, this.base.grassLight, tint.grassLight, k);
    blend(m.leaf, this.base.leaf, tint.leaf, u.season === 'summer' ? 0.2 : 0.55);
    blend(m.leafLight, this.base.leafLight, tint.leafLight, u.season === 'summer' ? 0.2 : 0.6);
    blend(m.leafDark, this.base.leafDark, tint.leaf, u.season === 'summer' ? 0.1 : 0.4);
    MAT.pond.color.set(u.season === 'winter' ? '#cfe6ec' : '#79c3c8');
    // Flags.
    for (const [flag, objects] of this.flagged) for (const o of objects) o.visible = u.flags.includes(flag);
    const bridge = u.flags.includes('bridge');
    this.pierFixed.visible = bridge;
    this.pierBroken.visible = !bridge;
    if (this.papers) {
      for (let i = 0; i < 8; i++) this.papers.setColorAt(i, u.bundlesDone[i] ? MAT.paperDone.color : MAT.paper.color);
      if (this.papers.instanceColor) this.papers.instanceColor.needsUpdate = true;
    }
    // Spawn markers (points in world space, pixel-sized icons).
    this.markers ??= {
      forage: this.buildMarkers('forage'),
      bug: this.buildMarkers('bug'),
    };
    this.markerCount = 0;
    for (const kind of ['forage', 'bug'] as const) {
      const list = u.spawns.filter((sp) => sp.kind === kind && !sp.taken && SPAWN_POINTS[sp.spot]);
      const { points, base } = this.markers[kind];
      const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
      list.slice(0, base.length / 3).forEach((sp, i) => {
        const p = SPAWN_POINTS[sp.spot];
        base[i * 3] = p.x + (kind === 'bug' ? 0.45 : -0.35);
        base[i * 3 + 1] = kind === 'bug' ? 1.2 : 0.45;
        base[i * 3 + 2] = p.z - 0.3;
      });
      (attr.array as Float32Array).set(base);
      attr.needsUpdate = true;
      points.geometry.setDrawRange(0, Math.min(list.length, base.length / 3));
      points.visible = list.length > 0;
      this.markerCount += list.length;
    }
    // Ambience particles.
    const want = this.effects ? ambienceOf(u.season, u.weather) : null;
    if (this.particles?.kind !== want) {
      if (this.particles) {
        this.root.remove(this.particles.points);
        this.particles.points.geometry.dispose();
        (this.particles.points.material as THREE.PointsMaterial).map?.dispose();
        (this.particles.points.material as THREE.PointsMaterial).dispose();
        this.particles = null;
      }
      if (want) this.particles = this.buildParticles(want, tint.particle);
    }
    return true;
  }

  private buildParticles(kind: Ambience, color: string) {
    const n = AMBIENCE_COUNT[kind];
    const positions = new Float32Array(n * 3),
      speed = new Float32Array(n),
      phase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = (Math.random() - 0.5) * AREA.x;
      positions[i * 3 + 1] = Math.random() * AREA.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * AREA.z;
      speed[i] = kind === 'rain' ? 16 + Math.random() * 6 : kind === 'snow' ? 1.2 + Math.random() * 1 : 1 + Math.random() * 0.8;
      phase[i] = Math.random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      map: particleTexture(kind),
      color: kind === 'rain' ? '#b9d3e6' : color,
      size: kind === 'rain' ? 22 : kind === 'snow' ? 7 : 10,
      sizeAttenuation: false,
      transparent: true,
      depthWrite: false,
      opacity: kind === 'rain' ? 0.75 : 0.95,
      toneMapped: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 30;
    points.name = 'village-ambience-' + kind;
    this.root.add(points);
    return { kind, points, speed, phase };
  }

  /** The fishing bobber: cast from `from` to `to`, waiting / biting / caught. */
  setFishing(state: FishingState | null) {
    const next = state ?? { phase: 'none' as const, from: { x: 0, z: 0 }, to: { x: 0, z: 0 } };
    if (next.phase !== this.fishing.phase || next.to.x !== this.fishing.to.x || next.to.z !== this.fishing.to.z)
      this.fishingSince = performance.now();
    this.fishing = next;
    const on = next.phase !== 'none';
    this.bobber.visible = on;
    this.line.visible = on;
    this.ripple.visible = on;
    this.bite.visible = next.phase === 'bite';
    if (on) {
      this.bobber.position.set(next.to.x, 0.2, next.to.z);
      this.ripple.position.set(next.to.x, 0.21, next.to.z);
      this.bite.position.set(next.to.x, 1.3, next.to.z);
      const pos = this.line.geometry.getAttribute('position') as THREE.BufferAttribute;
      pos.setXYZ(0, next.from.x + 0.25, 1.3, next.from.z);
      pos.setXYZ(1, next.to.x, 0.28, next.to.z);
      pos.needsUpdate = true;
    }
  }

  /** Animates particles, markers and the bobber; true when a frame should render. */
  tick(now: number, dt: number, center: THREE.Vector3): boolean {
    // Reduced motion: nothing moves on its own (phase changes still render once).
    if (this.reduced) {
      if (this.particles) this.particles.points.visible = false;
      return false;
    }
    if (this.particles) this.particles.points.visible = true;
    const animated = !!this.particles || this.fishing.phase !== 'none' || this.markerCount > 0;
    if (!animated) return false;
    // ~30 fps is plenty for ambience; markers alone only need ~8 fps.
    const interval = this.particles || this.fishing.phase !== 'none' ? 33 : 125;
    if (now - this.lastTick < interval) return false;
    const step = Math.min(0.1, this.lastTick ? (now - this.lastTick) / 1000 : dt);
    this.lastTick = now;
    const t = now / 1000;
    if (this.particles) {
      const { kind, points, speed, phase } = this.particles;
      const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const a = attr.array as Float32Array;
      for (let i = 0; i < speed.length; i++) {
        const j = i * 3;
        a[j + 1] -= speed[i] * step;
        if (kind !== 'rain') {
          a[j] += Math.sin(t * 1.3 + phase[i]) * step * (kind === 'snow' ? 0.4 : 1.1) + (kind === 'leaves' ? step * 0.5 : 0);
          a[j + 2] += Math.cos(t * 0.9 + phase[i]) * step * 0.3;
        } else a[j] += step * 1.5;
        if (a[j + 1] < 0) {
          a[j + 1] += AREA.y;
          a[j] = (Math.random() - 0.5) * AREA.x;
          a[j + 2] = (Math.random() - 0.5) * AREA.z;
        }
      }
      attr.needsUpdate = true;
      points.position.set(center.x, 0, center.z);
    }
    if (this.markers)
      for (const { points, base } of Object.values(this.markers)) {
        if (!points.visible) continue;
        const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
        const a = attr.array as Float32Array;
        for (let i = 0; i < base.length; i += 3) a[i + 1] = base[i + 1] + Math.sin(t * 2.4 + base[i]) * 0.06;
        attr.needsUpdate = true;
      }
    if (this.fishing.phase !== 'none') {
      const since = (now - this.fishingSince) / 1000;
      const bite = this.fishing.phase === 'bite';
      const dip = bite ? -0.1 + Math.sin(t * 22) * 0.06 : this.reduced ? 0 : Math.sin(t * 2.2) * 0.03;
      this.bobber.position.y = 0.2 + dip;
      const r = this.reduced ? 1 : 1 + ((since * (bite ? 1.6 : 0.6)) % 1) * (bite ? 2.2 : 1.2);
      this.ripple.scale.setScalar(r);
      (this.ripple.material as THREE.MeshBasicMaterial).opacity = this.reduced ? 0.5 : Math.max(0, 0.8 - (r - 1) * 0.35);
      if (bite && !this.reduced) this.bite.scale.setScalar(0.8 + Math.sin(t * 14) * 0.06);
    }
    return true;
  }
}
