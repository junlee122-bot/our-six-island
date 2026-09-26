// VILL-2 fishing waters in the village (three.js): the waterfall pool under a
// rock cliff (north-west), the lake with its timber dock (north-east), the
// upstream rapids, the south beach with its rock heap (갯바위) and the night
// harbor dock. Geometry comes from lounge-village-layout.ts (the same numbers
// collision and the fishing spots use). Everything is primitives; repeated
// meshes are batched. `tick` scrolls the falling water and pulses the
// "fish are here" rings; `setNight` lights the harbor lanterns.
import * as THREE from 'three';
import {
  VILLAGE_BEACH,
  VILLAGE_BOUNDS,
  VILLAGE_FALLS,
  VILLAGE_HARBOR,
  VILLAGE_LAKE,
  VILLAGE_RAPIDS,
  VILLAGE_RIVER,
  VILLAGE_ROCKS,
} from './lounge-village-layout';
import { FISH_STAND, bobberPoint } from './lounge-village-spots';
import { FISH_SPOTS } from './lounge-items';
import { batchDirectMeshes } from './lounge-village-world';

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...extra });
const MAT = {
  rock: std('#8f8a80', { flatShading: true }),
  rockLight: std('#aaa497', { flatShading: true }),
  rockDark: std('#6f6a62', { flatShading: true }),
  moss: std('#6f8f55', { flatShading: true }),
  sand: std('#e6d3a4'),
  sandWet: std('#cdb785'),
  plank: std('#a77a4e'),
  plankDark: std('#79563c'),
  rope: std('#d8c39a'),
  boat: std('#d9644f'),
  boatTrim: std('#f3e6c8'),
  reed: std('#7d8f4c'),
  lily: std('#6f9d58'),
  lake: std('#6fb3c0', { roughness: 0.2, metalness: 0.06, transparent: true, opacity: 0.9 }),
  pool: std('#79c2c9', { roughness: 0.2, metalness: 0.06, transparent: true, opacity: 0.9 }),
  crate: std('#c49058'),
};
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  rock: new THREE.IcosahedronGeometry(1, 0),
  sphere: new THREE.SphereGeometry(1, 10, 8),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 8),
};

function add(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.rotation.y = ry;
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
/** Deterministic 0..1 noise so the rock heaps look hand-placed, not random per load. */
const jitter = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
function rock(parent: THREE.Object3D, x: number, z: number, r: number, i: number, mat: THREE.Material = MAT.rock) {
  const m = add(parent, GEO.rock, mat, x, r * 0.45, z, r * (0.9 + jitter(i, 1) * 0.3), r * (0.6 + jitter(i, 2) * 0.35), r * (0.85 + jitter(i, 3) * 0.3), jitter(i, 4) * 6);
  m.rotation.x = (jitter(i, 5) - 0.5) * 0.5;
  return m;
}

/** Soft foam / falling-water stripes (canvas), scrolled by `tick`. */
function stripeTexture(tint: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 128;
  const c = canvas.getContext('2d')!;
  c.fillStyle = tint;
  c.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 26; i++) {
    const x = (i * 23) % 64,
      y = (i * 37) % 128,
      h = 14 + ((i * 13) % 30);
    c.fillStyle = i % 3 ? 'rgba(255,255,255,0.75)' : 'rgba(214,240,244,0.85)';
    c.beginPath();
    c.roundRect(x, y, 3 + (i % 3), h, 2);
    c.fill();
    if (y + h > 128) {
      c.beginPath();
      c.roundRect(x, y - 128, 3 + (i % 3), h, 2);
      c.fill();
    }
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
/** A painted wooden spot sign (sprite) like the pond's "연못 낚시터". */
function spotSign(text: string, sub = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = sub ? 120 : 88;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#5b3d25';
  c.beginPath();
  c.roundRect(0, 0, 256, canvas.height, 14);
  c.fill();
  c.fillStyle = '#fff3cf';
  c.beginPath();
  c.roundRect(6, 6, 244, canvas.height - 12, 10);
  c.fill();
  c.fillStyle = '#6a3f23';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.font = 'bold 40px sans-serif';
  c.fillText(text, 128, sub ? 42 : 46);
  if (sub) {
    c.font = 'bold 26px sans-serif';
    c.fillStyle = '#8a5a34';
    c.fillText(sub, 128, 86);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
  const scale = 0.52;
  sprite.scale.set(scale * (256 / canvas.height), scale, 1);
  sprite.renderOrder = 20;
  return sprite;
}
/** The part of a disc on the island side of a straight edge (z ≥ zEdge). */
function discInside(radius: number, cz: number, zEdge: number, segments = 40) {
  const shape = new THREE.Shape();
  const dz = zEdge - cz;
  const a0 = Math.abs(dz) < radius ? Math.asin(Math.max(-1, Math.min(1, dz / radius))) : -Math.PI / 2;
  // Angles measured so that z = cz + r·sin(a); keep a ∈ [a0, π − a0].
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = a0 + ((Math.PI - 2 * a0) * i) / segments;
    pts.push(new THREE.Vector2(Math.cos(a) * radius, -(Math.sin(a) * radius)));
  }
  shape.setFromPoints(pts);
  const g = new THREE.ShapeGeometry(shape);
  // Shape lies in XY with y = −z; lay it on the ground.
  g.rotateX(-Math.PI / 2);
  return g;
}

export class VillageWatersLayer {
  readonly root = new THREE.Group();
  private falling: THREE.Texture;
  private foam: THREE.MeshBasicMaterial;
  private rings: { mesh: THREE.Mesh; phase: number }[] = [];
  private ringMat: THREE.MeshBasicMaterial;
  private lanterns: THREE.MeshBasicMaterial;
  private glow: THREE.MeshBasicMaterial;
  private reducedQuery: MediaQueryList | null = null;
  constructor(parent: THREE.Object3D) {
    this.root.name = 'village-waters';
    parent.add(this.root);
    this.falling = stripeTexture('#9fd6de');
    this.foam = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false });
    this.ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
    this.lanterns = new THREE.MeshBasicMaterial({ color: '#ffe3a1', transparent: true, opacity: 0.35, toneMapped: false });
    this.glow = new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    this.buildBeach();
    this.buildFalls();
    this.buildLake();
    this.buildRapids();
    this.buildRocks();
    this.buildHarbor();
    this.buildRings();
    try {
      this.reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
    } catch {}
  }

  private group(name: string) {
    const g = new THREE.Group();
    g.name = name;
    this.root.add(g);
    return g;
  }

  private buildBeach() {
    const g = this.group('village-beach');
    const { width, depth } = VILLAGE_BOUNDS;
    const z0 = VILLAGE_BEACH.z0,
      z1 = depth / 2;
    // Dry sand band, a wet strip at the waterline and scattered shells/driftwood.
    add(g, GEO.box, MAT.sand, 0, 0.035, (z0 + z1) / 2 + 0.2, width - 0.9, 0.05, z1 - z0 - 0.4).castShadow = false;
    add(g, GEO.box, MAT.sandWet, 0, 0.04, z1 - 0.55, width - 0.9, 0.05, 0.7).castShadow = false;
    for (let i = 0; i < 18; i++) {
      const x = -width / 2 + 3 + jitter(i, 7) * (width - 6),
        z = z0 + 1 + jitter(i, 8) * (z1 - z0 - 2);
      if (i % 3 === 0) add(g, GEO.box, MAT.plankDark, x, 0.08, z, 0.7, 0.07, 0.12, jitter(i, 9) * 3);
      else add(g, GEO.sphere, i % 2 ? MAT.boatTrim : MAT.rockLight, x, 0.07, z, 0.1, 0.05, 0.08);
    }
    batchDirectMeshes(g);
    // Surf just past the edge (animated opacity).
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(width + 6, 0.9), this.foam);
    surf.rotation.x = -Math.PI / 2;
    surf.position.set(0, -0.5, z1 + 0.7);
    surf.name = 'village-surf';
    g.add(surf);
  }

  private buildFalls() {
    const g = this.group('village-falls');
    const { x, z, radius } = VILLAGE_FALLS;
    const edge = -VILLAGE_BOUNDS.depth / 2;
    const water = new THREE.Mesh(discInside(radius, z, edge), MAT.pool);
    water.position.set(x, 0.15, z);
    water.receiveShadow = true;
    g.add(water);
    // Rim stones along the arc on the island side.
    for (let i = 0; i < 16; i++) {
      const a = (i / 15) * Math.PI;
      const rx = x + Math.cos(a) * (radius + 0.25),
        rz = z + Math.sin(a) * (radius + 0.25);
      if (rz < edge + 0.1) continue;
      rock(g, rx, rz, 0.32 + jitter(i, 1) * 0.18, i, i % 4 ? MAT.rockLight : MAT.moss);
    }
    // The cliff rises just past the island edge, the fall pours down its face.
    const cliff = this.group('village-falls-cliff');
    for (let i = 0; i < 14; i++) {
      const cx = x - 6.5 + i * 1,
        h = 3.2 + jitter(i, 2) * 2.4 - Math.abs(cx - x) * 0.18;
      add(cliff, GEO.rock, i % 3 ? MAT.rock : MAT.rockDark, cx, h / 2 - 0.4, edge - 1.4 - jitter(i, 3) * 0.8, 1.1, h / 2 + 0.3, 1.4, jitter(i, 4) * 4);
      if (i % 2) add(cliff, GEO.rock, MAT.moss, cx, h - 0.2, edge - 1.3, 0.7, 0.28, 0.8, jitter(i, 5) * 4);
    }
    batchDirectMeshes(cliff);
    const fallTex = this.falling;
    fallTex.repeat.set(1.5, 1.2);
    const sheet = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 4.6),
      new THREE.MeshStandardMaterial({ map: fallTex, transparent: true, opacity: 0.92, roughness: 0.2, emissive: '#9fd6de', emissiveIntensity: 0.25 }),
    );
    sheet.position.set(x, 2.35, edge - 0.55);
    g.add(sheet);
    // Spray where it lands.
    for (let i = 0; i < 6; i++)
      add(g, GEO.sphere, this.foam, x - 1 + i * 0.4, 0.28, edge + 0.5 + jitter(i, 6) * 0.6, 0.38, 0.14, 0.32).castShadow = false;
    const sign = spotSign('폭포 소', '낚싯대 2단계부터');
    const stand = FISH_STAND.falls;
    sign.position.set(stand.x + 1.2, 1.6, stand.z + 0.6);
    g.add(sign);
  }

  private buildLake() {
    const g = this.group('village-lake');
    const { x, z, radius, dockZ } = VILLAGE_LAKE;
    const water = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), MAT.lake);
    water.rotation.x = -Math.PI / 2;
    water.position.set(x, 0.15, z);
    water.receiveShadow = true;
    g.add(water);
    const ring = this.group('village-lake-rim');
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      if (Math.abs(Math.sin(a)) < 0.2 && Math.cos(a) < 0) continue; // dock gap (west)
      rock(ring, x + Math.cos(a) * (radius + 0.25), z + Math.sin(a) * (radius + 0.25), 0.26 + jitter(i, 2) * 0.12, i + 40, i % 5 ? MAT.rockLight : MAT.moss);
    }
    for (const [dx, dz, r] of [[1.2, -1.8, 0.4], [2.1, 0.9, 0.3], [-0.6, 2.4, 0.34], [2.6, -0.6, 0.26]] as const)
      add(ring, GEO.cyl, MAT.lily, x + dx, 0.19, z + dz, r, 0.02, r).castShadow = false;
    for (let i = 0; i < 10; i++) {
      const a = 0.4 + i * 0.28;
      add(ring, GEO.cyl, MAT.reed, x + Math.cos(a) * (radius - 0.2), 0.5, z + Math.sin(a) * (radius - 0.2), 0.035, 0.9 + jitter(i, 3) * 0.4, 0.035);
    }
    batchDirectMeshes(ring);
    // Timber dock from the west shore into the lake, a rowboat tied alongside.
    const dock = this.group('village-lake-dock');
    const x0 = x - radius - 0.6,
      x1 = x - radius + 2.6;
    for (let px = x0; px <= x1; px += 0.34) add(dock, GEO.box, (Math.round(px * 3) & 1) ? MAT.plank : MAT.plankDark, px, 0.3, dockZ, 0.3, 0.08, 1.3);
    for (const px of [x0 + 0.2, x1 - 0.1]) for (const s of [-1, 1]) add(dock, GEO.cyl, MAT.plankDark, px, 0.05, dockZ + s * 0.6, 0.07, 0.8, 0.07);
    const boat = new THREE.Group();
    add(boat, GEO.box, MAT.boat, 0, 0.12, 0, 1.6, 0.26, 0.62).castShadow = false;
    add(boat, GEO.box, MAT.boatTrim, 0, 0.27, 0, 1.64, 0.05, 0.66);
    add(boat, GEO.box, MAT.plank, 0, 0.2, 0, 0.18, 0.14, 0.56);
    boat.position.set(x1 - 0.6, 0, dockZ + 1.05);
    boat.rotation.y = 0.12;
    dock.add(boat);
    batchDirectMeshes(dock);
    const sign = spotSign('호숫가 선착장');
    sign.position.set(x0 - 0.3, 1.55, dockZ - 1.1);
    g.add(sign);
  }

  private buildRapids() {
    const g = this.group('village-rapids');
    const mid = (VILLAGE_RIVER.minZ + VILLAGE_RIVER.maxZ) / 2;
    const rocks = this.group('village-rapids-rocks');
    for (let i = 0; i < 16; i++) {
      const x = VILLAGE_RAPIDS.x0 + 1.2 + i * ((VILLAGE_RAPIDS.x1 - VILLAGE_RAPIDS.x0 - 1.5) / 15);
      const z = mid + (jitter(i, 1) - 0.5) * 1.5;
      rock(rocks, x, z, 0.24 + jitter(i, 2) * 0.22, i + 90, i % 3 ? MAT.rock : MAT.rockDark).position.y = 0.16;
    }
    batchDirectMeshes(rocks);
    // White water: foam streaks between the rocks (animated with the surf).
    for (let i = 0; i < 12; i++) {
      const x = VILLAGE_RAPIDS.x0 + 1.6 + i * 1.05;
      const foam = new THREE.Mesh(GEO.sphere, this.foam);
      foam.position.set(x, 0.2, mid + (jitter(i, 4) - 0.5) * 1.3);
      foam.scale.set(0.5, 0.02, 0.16);
      foam.rotation.y = (jitter(i, 5) - 0.5) * 0.6;
      g.add(foam);
    }
    const sign = spotSign('윗물 여울');
    sign.position.set(FISH_STAND.rapids.x - 1.4, 1.5, FISH_STAND.rapids.z - 0.9);
    g.add(sign);
  }

  private buildRocks() {
    const g = this.group('village-sea-rocks');
    const { x, z, radius } = VILLAGE_ROCKS;
    rock(g, x, z + 0.2, radius * 0.95, 200, MAT.rock);
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * 0.1 + (i / 7) * Math.PI * 0.8;
      rock(g, x + Math.cos(a) * radius * 1.1, z + Math.sin(a) * radius * 0.9, 0.4 + jitter(i, 6) * 0.4, 210 + i, i % 3 ? MAT.rockDark : MAT.moss).position.y -= 0.25;
    }
    batchDirectMeshes(g);
    const sign = spotSign('갯바위');
    sign.position.set(x - 2, 1.55, z - radius - 0.9);
    g.add(sign);
  }

  private buildHarbor() {
    const g = this.group('village-harbor');
    const { x, z, width, length } = VILLAGE_HARBOR;
    const dock = this.group('village-harbor-dock');
    for (let dz = -0.3; dz <= length; dz += 0.36)
      add(dock, GEO.box, (Math.round(dz * 3) & 1) ? MAT.plank : MAT.plankDark, x, 0.3, z + dz, width, 0.08, 0.32);
    for (let dz = 0.6; dz <= length; dz += 1.8) for (const s of [-1, 1]) add(dock, GEO.cyl, MAT.plankDark, x + s * (width / 2 - 0.08), -0.15, z + dz, 0.08, 1.0, 0.08);
    // Crates and a coiled rope on the deck, a moored boat on the east side.
    add(dock, GEO.box, MAT.crate, x - 0.45, 0.52, z + 1.2, 0.46, 0.36, 0.46, 0.2);
    add(dock, GEO.box, MAT.crate, x - 0.5, 0.86, z + 1.25, 0.36, 0.3, 0.36, -0.3);
    add(dock, GEO.cyl, MAT.rope, x + 0.45, 0.4, z + 2.2, 0.22, 0.12, 0.22);
    add(dock, GEO.box, MAT.boat, x + 1.55, -0.28, z + 3.4, 0.7, 0.3, 2.0).castShadow = false;
    add(dock, GEO.box, MAT.boatTrim, x + 1.55, -0.1, z + 3.4, 0.74, 0.05, 2.04);
    for (const s of [-1, 1]) add(dock, GEO.cyl, MAT.plankDark, x + s * (width / 2 + 0.05), 0.95, z + 0.5, 0.05, 1.3, 0.05);
    add(dock, GEO.cyl, MAT.plankDark, x, 1.4, z + length, 0.06, 2.2, 0.06);
    batchDirectMeshes(dock);
    // Lantern globes (lit at night) and their glow on the water.
    for (const [lx, ly, lz] of [[x - width / 2 - 0.05, 1.65, z + 0.5], [x + width / 2 + 0.05, 1.65, z + 0.5], [x, 2.55, z + length]] as const) {
      const bulb = new THREE.Mesh(GEO.sphere, this.lanterns);
      bulb.position.set(lx, ly, lz);
      bulb.scale.setScalar(0.14);
      g.add(bulb);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), this.glow);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(lx, -0.45, lz + 0.6);
      g.add(pool);
    }
    const sign = spotSign('밤 항구', '저녁 7시~새벽 5시');
    sign.position.set(x - 1.6, 1.6, z - 1.1);
    g.add(sign);
  }

  /** Gentle rings where the fish are, at every spot (hint for where to cast). */
  private buildRings() {
    const g = this.group('village-fish-rings');
    const geo = new THREE.RingGeometry(0.3, 0.36, 28);
    for (const [i, spot] of FISH_SPOTS.entries()) {
      if (spot === 'river' || spot === 'pond' || spot === 'sea') continue;
      const at = bobberPoint(spot, FISH_STAND[spot]);
      for (let k = 0; k < 2; k++) {
        const mesh = new THREE.Mesh(geo, this.ringMat.clone());
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(at.x, spot === 'rocks' || spot === 'harbor' ? -0.48 : 0.2, at.z);
        mesh.renderOrder = 3;
        g.add(mesh);
        this.rings.push({ mesh, phase: i * 0.37 + k * 0.5 });
      }
    }
  }

  /** 0 = daylight, 1 = full night (harbor lanterns). */
  setNight(level: number) {
    this.lanterns.opacity = 0.35 + 0.65 * level;
    this.glow.opacity = 0.55 * level;
  }

  /** Animates falling water, foam and the fish rings (reduced motion: still). */
  tick(now: number) {
    if (this.reducedQuery?.matches) return;
    const t = now / 1000;
    this.falling.offset.y = (t * 0.9) % 1;
    this.foam.opacity = 0.45 + 0.15 * Math.sin(t * 2.1);
    for (const r of this.rings) {
      const k = (t * 0.35 + r.phase) % 1;
      r.mesh.scale.setScalar(0.6 + k * 1.8);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - k);
    }
  }
}
