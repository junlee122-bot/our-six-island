// three.js layer for "범타듀의 하루" in the village: every friend's farm bed
// with low-poly crops by stage, fruit on the fruit trees, the market stall,
// badges over my mailbox / ripe bed, and the night lights (lamp pools,
// window glow, the casino marquee). Built once with the cached village world.
import * as THREE from 'three';
import type { Crop } from './lounge-life';
import {
  FARM_BEDS,
  FRUIT_TREE_POINTS,
  PLOT_GAP,
  PLOT_SIZE,
  farmBedRect,
  mailboxPoint,
  cropVisual,
  type PublicPlot,
} from './lounge-village-life';
import {
  VILLAGE_DECOR,
  VILLAGE_FURNISHINGS,
  VILLAGE_MARKET,
  VILLAGE_PLACES,
  VILLAGE_YARDS,
  YARD_FENCE_Z,
  villageYard,
  yardPlotCenter,
  type FarmYard,
} from './lounge-village-layout';
import { ACTORS } from './lounge-roster';
import { batchDirectMeshes } from './lounge-village-world';

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
const MAT = {
  frame: std('#8a6242'),
  soil: std('#7a5234'),
  soilWet: std('#4f3421'),
  /** Fallow ground in a bed that is not tilled yet (farm expansion). */
  fallow: std('#8fa968'),
  stone: std('#b9b2a2'),
  stoneDark: std('#8d877a'),
  water: std('#6fb2c4', { roughness: 0.25, metalness: 0.05 }),
  rope: std('#d8c39a'),
  hover: new THREE.MeshBasicMaterial({ color: '#fff2c4', transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }),
  mound: std('#6a452b'),
  leaf: std('#5e9a48'),
  leafDark: std('#3f7a3a'),
  leafLight: std('#8cc063'),
  carrot: std('#f08a2c'),
  tomato: std('#e2452f'),
  tomatoGreen: std('#9bc45a'),
  pumpkin: std('#ef8a25'),
  pumpkinGreen: std('#8fb35a'),
  strawberry: std('#e8384f'),
  flower: std('#fff6d8'),
  fruitRed: std('#e04a3a', { roughness: 0.5 }),
  fruitOrange: std('#f2a33a', { roughness: 0.5 }),
  wood: std('#9a6a42'),
  woodDark: std('#6e4629'),
  cloth: std('#e56b5d'),
  clothLight: std('#fff1d6'),
  crate: std('#c49058'),
  mine: new THREE.MeshBasicMaterial({ color: '#f4c54a', toneMapped: false }),
};
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 10, 8),
  cone: new THREE.ConeGeometry(1, 1, 7),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 8),
  disc: new THREE.CircleGeometry(1, 28),
};

type Instance = { geo: THREE.BufferGeometry; mat: THREE.Material; m: THREE.Matrix4 };
const tmp = new THREE.Object3D();
function matrix(
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  ry = 0,
  rx = 0,
  rz = 0,
) {
  tmp.position.set(x, y, z);
  tmp.rotation.set(rx, ry, rz);
  tmp.scale.set(sx, sy, sz);
  tmp.updateMatrix();
  return tmp.matrix.clone();
}

/** Instanced batches rebuilt whenever the plot set changes (cheap, rare). */
class Batches {
  private meshes = new Map<string, THREE.InstancedMesh>();
  private root: THREE.Group;
  constructor(root: THREE.Group) {
    this.root = root;
  }
  set(instances: Instance[]) {
    const groups = new Map<string, Instance[]>();
    for (const i of instances) {
      const key = i.geo.uuid + ':' + i.mat.uuid;
      const list = groups.get(key);
      if (list) list.push(i);
      else groups.set(key, [i]);
    }
    for (const [key, mesh] of this.meshes)
      if (!groups.has(key)) {
        mesh.count = 0;
        mesh.visible = false;
      }
    for (const [key, list] of groups) {
      let mesh = this.meshes.get(key);
      if (!mesh || mesh.instanceMatrix.count < list.length) {
        if (mesh) {
          this.root.remove(mesh);
          mesh.dispose();
        }
        mesh = new THREE.InstancedMesh(
          list[0].geo,
          list[0].mat,
          Math.max(16, list.length * 2),
        );
        mesh.castShadow = false;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        this.meshes.set(key, mesh);
        this.root.add(mesh);
      }
      list.forEach((item, index) => mesh!.setMatrixAt(index, item.m));
      mesh.count = list.length;
      mesh.visible = true;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

const SOIL_TOP = 0.2;
/** Crops are drawn a little larger than life so they read from the follow camera. */
const CROP_SCALE = 1.5;
function cropInstances(
  out: Instance[],
  at: { x: number; z: number },
  crop: Crop,
  stage: number,
  seed: number,
) {
  const local: Instance[] = [];
  cropShapes(local, crop, stage, seed);
  const place = new THREE.Matrix4()
    .makeTranslation(at.x, SOIL_TOP, at.z)
    .multiply(new THREE.Matrix4().makeScale(CROP_SCALE, CROP_SCALE, CROP_SCALE));
  for (const i of local) out.push({ ...i, m: place.clone().multiply(i.m) });
}
/** Crop shapes around the local origin (plot centre on the soil surface). */
function cropShapes(
  out: Instance[],
  crop: Crop,
  stage: number,
  seed: number,
) {
  const v = cropVisual(crop, stage);
  if (!v) return;
  const y = 0;
  const at = { x: 0, z: 0 };
  if (v.mound) {
    out.push({ geo: GEO.sphere, mat: MAT.mound, m: matrix(at.x, y, at.z, 0.17, 0.06, 0.13) });
    out.push({ geo: GEO.cone, mat: MAT.leafLight, m: matrix(at.x, y + 0.08, at.z, 0.025, 0.1, 0.025) });
    return;
  }
  const leafMat =
    crop === 'carrot' ? MAT.leafLight : crop === 'strawberry' ? MAT.leafDark : MAT.leaf;
  for (let i = 0; i < v.leaves; i++) {
    const a = seed + (i / v.leaves) * Math.PI * 2;
    const spread = crop === 'pumpkin' || crop === 'strawberry' ? 0.13 : 0.06;
    const lx = at.x + Math.cos(a) * spread,
      lz = at.z + Math.sin(a) * spread;
    if (crop === 'pumpkin' || crop === 'strawberry') {
      // Broad, low leaves.
      const s = crop === 'pumpkin' ? 0.1 + v.height * 0.12 : 0.07 + v.height * 0.06;
      out.push({ geo: GEO.sphere, mat: leafMat, m: matrix(lx, y + v.height * 0.35, lz, s, 0.035, s * 0.8, a) });
    } else {
      // Upright feathery (carrot) / bushy (tomato) cones.
      const tilt = 0.25;
      out.push({
        geo: GEO.cone,
        mat: leafMat,
        m: matrix(lx, y + v.height / 2, lz, crop === 'tomato' ? 0.06 : 0.035, v.height, crop === 'tomato' ? 0.06 : 0.035, 0, Math.sin(a) * tilt, -Math.cos(a) * tilt),
      });
    }
  }
  if (crop === 'tomato' && stage >= 2) {
    // Stake plus tomatoes (green while growing, red when ripe).
    out.push({ geo: GEO.cylinder, mat: MAT.wood, m: matrix(at.x, y + 0.25, at.z, 0.012, 0.5, 0.012) });
    const fruitMat = v.fruit ? MAT.tomato : MAT.tomatoGreen;
    for (let i = 0; i < 3; i++) {
      const a = seed * 2 + i * 2.1;
      out.push({ geo: GEO.sphere, mat: fruitMat, m: matrix(at.x + Math.cos(a) * 0.07, y + 0.17 + i * 0.07, at.z + Math.sin(a) * 0.07, 0.05, 0.05, 0.05) });
    }
  }
  if (crop === 'pumpkin' && stage >= 2) {
    const s = v.fruit ? 0.19 : 0.1;
    out.push({ geo: GEO.sphere, mat: v.fruit ? MAT.pumpkin : MAT.pumpkinGreen, m: matrix(at.x + 0.04, y + s * 0.55, at.z + 0.06, s, s * 0.72, s) });
    if (v.fruit)
      out.push({ geo: GEO.cylinder, mat: MAT.leafDark, m: matrix(at.x + 0.04, y + s * 1.2, at.z + 0.06, 0.018, 0.08, 0.018) });
  }
  if (crop === 'carrot' && v.fruit)
    out.push({ geo: GEO.cone, mat: MAT.carrot, m: matrix(at.x, y + 0.03, at.z, 0.07, 0.12, 0.07, 0, Math.PI) });
  if (crop === 'strawberry') {
    if (stage === 2)
      for (let i = 0; i < 3; i++) {
        const a = seed + i * 2.1;
        out.push({ geo: GEO.sphere, mat: MAT.flower, m: matrix(at.x + Math.cos(a) * 0.1, y + 0.1, at.z + Math.sin(a) * 0.1, 0.025, 0.012, 0.025) });
      }
    if (v.fruit)
      for (let i = 0; i < 4; i++) {
        const a = seed + i * 1.6;
        out.push({ geo: GEO.cone, mat: MAT.strawberry, m: matrix(at.x + Math.cos(a) * 0.12, y + 0.05, at.z + Math.sin(a) * 0.12, 0.04, 0.07, 0.04, 0, Math.PI) });
      }
  }
}

/** Small canvas billboard (badge / sign). */
function labelSprite(draw: (c: CanvasRenderingContext2D) => void, w = 128, h = 128, scale = 0.7) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d')!;
  draw(c);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }),
  );
  sprite.scale.set(scale * (w / h), scale, 1);
  sprite.renderOrder = 20;
  return sprite;
}
function badge(color: string, glyph: string) {
  return labelSprite((c) => {
    c.fillStyle = color;
    c.beginPath();
    c.arc(64, 60, 46, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 8;
    c.strokeStyle = '#fffdf2';
    c.stroke();
    c.beginPath();
    c.moveTo(52, 100);
    c.lineTo(64, 124);
    c.lineTo(76, 100);
    c.fill();
    c.fillStyle = '#fffdf2';
    c.font = 'bold 60px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(glyph, 64, 62);
  });
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const c = canvas.getContext('2d')!;
  const g = c.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,214,140,0.9)');
  g.addColorStop(0.45, 'rgba(255,196,110,0.35)');
  g.addColorStop(1, 'rgba(255,190,100,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function box(
  parent: THREE.Object3D,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
) {
  const mesh = new THREE.Mesh(GEO.box, mat);
  mesh.position.set(x, y, z);
  mesh.scale.set(w, h, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** The "범타듀 상점" stall: counter, striped awning, crates and a sign. */
function buildMarket(root: THREE.Object3D) {
  const g = new THREE.Group();
  g.name = 'village-market';
  g.position.set(VILLAGE_MARKET.x, 0, VILLAGE_MARKET.z);
  root.add(g);
  const w = VILLAGE_MARKET.width,
    d = VILLAGE_MARKET.depth;
  box(g, MAT.woodDark, 0, 0.05, 0, w + 0.1, 0.1, d + 0.1);
  box(g, MAT.wood, 0, 0.5, d / 2 - 0.3, w - 0.2, 0.8, 0.45);
  box(g, MAT.clothLight, 0, 0.92, d / 2 - 0.3, w - 0.1, 0.06, 0.55);
  for (const x of [-w / 2 + 0.12, w / 2 - 0.12])
    for (const z of [-d / 2 + 0.12, d / 2 - 0.12])
      box(g, MAT.woodDark, x, 1.05, z, 0.1, 2.1, 0.1);
  // Striped awning sloping toward the plaza.
  const stripes = 7;
  for (let i = 0; i < stripes; i++) {
    const s = box(
      g,
      i % 2 ? MAT.clothLight : MAT.cloth,
      -w / 2 + (w / stripes) * (i + 0.5),
      2.2,
      0.05,
      w / stripes + 0.01,
      0.06,
      d + 0.5,
    );
    s.rotation.x = 0.28;
  }
  for (let i = 0; i < stripes; i++)
    box(g, i % 2 ? MAT.cloth : MAT.clothLight, -w / 2 + (w / stripes) * (i + 0.5), 1.98, d / 2 + 0.28, w / stripes, 0.18, 0.04);
  // Produce crates on the counter.
  const produce = [MAT.carrot, MAT.tomato, MAT.pumpkin, MAT.strawberry];
  produce.forEach((mat, i) => {
    const x = -0.75 + i * 0.5;
    box(g, MAT.crate, x, 1.02, d / 2 - 0.3, 0.4, 0.14, 0.34);
    for (let k = 0; k < 3; k++) {
      const m = new THREE.Mesh(GEO.sphere, mat);
      m.position.set(x - 0.1 + k * 0.1, 1.13, d / 2 - 0.3 + (k % 2) * 0.06);
      m.scale.setScalar(0.07);
      g.add(m);
    }
  });
  // Sign board.
  const sign = labelSprite(
    (c) => {
      c.fillStyle = '#5b3d25';
      c.fillRect(0, 0, 256, 88);
      c.fillStyle = '#fff3cf';
      c.fillRect(6, 6, 244, 76);
      c.fillStyle = '#6a3f23';
      c.font = 'bold 44px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('범타듀 상점', 128, 46);
    },
    256,
    88,
    0.5,
  );
  sign.position.set(0, 2.62, d / 2);
  g.add(sign);
  // ~38 static meshes → one draw call per material (the sign stays a sprite).
  batchDirectMeshes(g);
  return g;
}

/** A friend's yard name board: a painted plank on two stakes (canvas on a plane). */
function yardSignTexture(name: string, color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 112;
  const c = canvas.getContext('2d')!;
  // Plank with a darker rim and two grain strokes.
  c.fillStyle = '#7a5334';
  c.beginPath();
  c.roundRect(2, 8, 252, 98, 16);
  c.fill();
  c.fillStyle = '#e9cf9e';
  c.beginPath();
  c.roundRect(10, 15, 236, 84, 11);
  c.fill();
  c.strokeStyle = 'rgba(122, 83, 52, 0.28)';
  c.lineWidth = 3;
  for (const y of [34, 80]) {
    c.beginPath();
    c.moveTo(22, y);
    c.bezierCurveTo(90, y - 6, 160, y + 6, 234, y - 2);
    c.stroke();
  }
  // Owner colour ribbon at the left, then the name.
  c.fillStyle = color;
  c.beginPath();
  c.roundRect(20, 30, 16, 52, 5);
  c.fill();
  c.fillStyle = '#4a2f1d';
  c.font = 'bold 42px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(`${name}네 텃밭`, 140, 58);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Static yard dressing (VILL-2): the name board at each gate, a stone well
 * with a little roof and bucket, and a kerb of stones marking the yard's
 * sides. Named groups so kArchive models can replace them later.
 */
function buildYards(root: THREE.Object3D) {
  const wells = new THREE.Group(),
    kerbs = new THREE.Group(),
    signs = new THREE.Group();
  wells.name = 'village-yard-wells';
  kerbs.name = 'village-yard-kerbs';
  signs.name = 'village-yard-signs';
  root.add(wells, kerbs, signs);
  const plane = new THREE.PlaneGeometry(1, 1);
  for (const yard of VILLAGE_YARDS) {
    const home = VILLAGE_PLACES.find((p) => p.actor === yard.actor);
    // Well: stone ring, dark water, two posts, a pitched roof and a bucket.
    const { x, z } = yard.well;
    const ring = new THREE.Mesh(GEO.cylinder, MAT.stone);
    ring.position.set(x, 0.24, z);
    ring.scale.set(0.3, 0.44, 0.3);
    const water = new THREE.Mesh(GEO.cylinder, MAT.water);
    water.position.set(x, 0.43, z);
    water.scale.set(0.23, 0.04, 0.23);
    wells.add(ring, water);
    for (const s of [-1, 1]) box(wells, MAT.woodDark, x + s * 0.27, 0.72, z, 0.06, 1.0, 0.06);
    for (const s of [-1, 1]) {
      const roof = box(wells, MAT.wood, x, 1.28, z + s * 0.17, 0.74, 0.04, 0.4);
      roof.rotation.x = s * 0.62;
    }
    box(wells, MAT.woodDark, x, 1.0, z, 0.56, 0.04, 0.04);
    const bucket = new THREE.Mesh(GEO.cylinder, MAT.crate);
    bucket.position.set(x + 0.36, 0.13, z + 0.22);
    bucket.scale.set(0.1, 0.2, 0.1);
    wells.add(bucket);
    // Kerb stones along both yard sides (house front → fence), walkable.
    for (const side of [yard.x0, yard.x1]) {
      if (Math.abs(side) > 25.9) continue;
      for (let zz = yard.z0 + 0.35; zz < yard.z1 - 0.2; zz += 0.42) {
        const stone = new THREE.Mesh(GEO.sphere, (Math.round(zz * 2) & 1) ? MAT.stone : MAT.stoneDark);
        stone.position.set(side, 0.05, zz);
        stone.scale.set(0.16, 0.06, 0.13);
        stone.receiveShadow = true;
        kerbs.add(stone);
      }
    }
    // Name board on two stakes, just inside the gate, facing the lane.
    const sx = yard.sign.x + 0.8,
      sz = YARD_FENCE_Z - 0.3;
    for (const dx of [-0.62, 0.62]) box(signs, MAT.woodDark, sx + dx, 0.55, sz, 0.08, 1.1, 0.08);
    const board = new THREE.Mesh(
      plane,
      new THREE.MeshStandardMaterial({ map: yardSignTexture(ACTORS[yard.actor] ?? '', home?.roofColor ?? '#8a6242'), roughness: 0.9 }),
    );
    board.position.set(sx, 1.02, sz + 0.05);
    board.scale.set(1.55, 0.68, 1);
    board.castShadow = true;
    board.name = `yard-sign-${yard.actor}`;
    signs.add(board);
  }
  batchDirectMeshes(wells);
  batchDirectMeshes(kerbs);
}

export type LifeLayerUpdate = {
  plots: Record<number, PublicPlot[]>;
  /** Plots of mine that were watered (darker soil). */
  watered: boolean[];
  selfActor: number;
  /** Trees whose fruit I can pick now. */
  ripeTrees: string[];
  unreadMail: boolean;
};

export class VillageLifeLayer {
  readonly root = new THREE.Group();
  private crops: Batches;
  private soil: Batches;
  private fruit: Batches;
  private lastKey = '';
  private lastFruit = '';
  private readyBadge: THREE.Sprite;
  private mailBadge: THREE.Sprite;
  /** Gold rope around my own beds so they stand out from the neighbours'. */
  private mineMarker: THREE.Group;
  /** Soft highlight over the plot under the pointer. */
  private hover: THREE.Mesh;
  private hoverKey = '';
  private markedActor = -2;
  private night: {
    pools: THREE.InstancedMesh;
    poolMaterial: THREE.MeshBasicMaterial;
    bulbs: THREE.MeshBasicMaterial;
    windows: THREE.MeshBasicMaterial;
    group: THREE.Group;
  };
  private lampGlow: THREE.MeshBasicMaterial | null = null;
  constructor(parent: THREE.Object3D) {
    this.root.name = 'village-life';
    parent.add(this.root);
    // Bed frames are static; soil tiles and crops are instanced batches.
    // (Named: the kArchive bed frames in lounge-village-karchive.ts replace them.)
    const frames = new THREE.Group();
    frames.name = 'village-farm-frames';
    this.root.add(frames);
    for (const bed of FARM_BEDS) {
      const r = farmBedRect(bed);
      box(frames, MAT.frame, r.x, 0.08, r.z, r.w + 0.08, 0.16, r.d + 0.08).castShadow = false;
    }
    // Fourteen identical frames → one draw call.
    batchDirectMeshes(frames);
    buildYards(this.root);
    // My yard: a thin gold rope around both beds (four flat strips).
    this.mineMarker = new THREE.Group();
    for (let i = 0; i < 4; i++) this.mineMarker.add(new THREE.Mesh(GEO.box, MAT.mine));
    this.mineMarker.visible = false;
    this.root.add(this.mineMarker);
    this.hover = new THREE.Mesh(GEO.box, MAT.hover);
    this.hover.visible = false;
    this.hover.renderOrder = 5;
    this.root.add(this.hover);
    const soilGroup = new THREE.Group(),
      cropGroup = new THREE.Group(),
      fruitGroup = new THREE.Group();
    this.root.add(soilGroup, cropGroup, fruitGroup);
    this.soil = new Batches(soilGroup);
    this.crops = new Batches(cropGroup);
    this.fruit = new Batches(fruitGroup);
    buildMarket(this.root);
    this.readyBadge = badge('#5f9a3f', '!');
    this.readyBadge.visible = false;
    this.mailBadge = badge('#d4574a', '✉');
    this.mailBadge.visible = false;
    this.root.add(this.readyBadge, this.mailBadge);
    this.night = this.buildNight();
    this.update({ plots: {}, watered: [], selfActor: -1, ripeTrees: [], unreadMail: false });
  }
  /** Lets the layer brighten the shared lamp glow material at night. */
  setLampGlowMaterial(material: THREE.MeshBasicMaterial) {
    this.lampGlow = material;
  }

  private buildNight() {
    const group = new THREE.Group();
    group.name = 'village-night';
    this.root.add(group);
    const poolMaterial = new THREE.MeshBasicMaterial({
      map: glowTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      opacity: 0,
    });
    const lamps = [
      ...VILLAGE_DECOR.filter((d) => d.kind === 'lamp').map((d) => ({ x: d.x, z: d.z, r: 1.9 })),
      ...VILLAGE_FURNISHINGS.filter((f) => f.model === 'gardenLantern').map((f) => ({ x: f.x, z: f.z, r: 1.6 })),
      ...VILLAGE_PLACES.filter((p) => p.kind === 'home').map((p) => ({ x: p.entry.x, z: p.entry.z - 0.2, r: 1.3 })),
      ...VILLAGE_PLACES.filter((p) => p.kind !== 'home').map((p) => ({ x: p.entry.x, z: p.entry.z, r: 2.4 })),
      { x: VILLAGE_MARKET.x, z: VILLAGE_MARKET.z + 1.2, r: 1.8 },
    ];
    const pools = new THREE.InstancedMesh(GEO.disc, poolMaterial, lamps.length);
    lamps.forEach((l, i) =>
      pools.setMatrixAt(i, matrix(l.x, 0.215, l.z, l.r, l.r, 1, 0, -Math.PI / 2)),
    );
    pools.renderOrder = 2;
    pools.frustumCulled = false;
    group.add(pools);
    // Casino marquee bulbs and lantern globes, lit at night.
    const bulbs = new THREE.MeshBasicMaterial({
      color: '#ffe9a8',
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    const casino = VILLAGE_PLACES.find((p) => p.id === 'casino');
    if (casino) {
      for (const x of [-2.52, -1.68, -0.84, 0, 0.84, 1.68, 2.52]) {
        const b = new THREE.Mesh(GEO.sphere, bulbs);
        b.position.set(casino.x + x, 3.51, casino.z + 3.42);
        b.scale.setScalar(0.13);
        group.add(b);
      }
      for (const x of [-3.25, 3.25]) {
        const b = new THREE.Mesh(GEO.sphere, bulbs);
        b.position.set(casino.x + x, 4.16, casino.z + 3.42);
        b.scale.set(0.3, 0.22, 0.3);
        group.add(b);
      }
      const sign = labelSprite(
        (c) => {
          c.shadowColor = '#ffcf5a';
          c.shadowBlur = 18;
          c.fillStyle = '#fff2b0';
          c.font = 'bold 50px sans-serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('★ 별빛 카지노 ★', 200, 48);
        },
        400,
        96,
        0.62,
      );
      (sign.material as THREE.SpriteMaterial).opacity = 0;
      // Drawn over the hipped roof behind it (the casino faces the camera).
      (sign.material as THREE.SpriteMaterial).depthTest = false;
      sign.renderOrder = 30;
      sign.position.set(casino.x, 4.45, casino.z + 3.6);
      sign.name = 'casino-sign';
      group.add(sign);
    }
    // Warm window panes on the hall and the casino.
    const windows = new THREE.MeshBasicMaterial({
      color: '#ffd98a',
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    const paneGeometry = new THREE.PlaneGeometry(0.57, 1.17);
    for (const place of VILLAGE_PLACES.filter((p) => p.kind === 'hall' || p.kind === 'casino'))
      for (const x of [-2.65, -1.45, 1.45, 2.65]) {
        const pane = new THREE.Mesh(paneGeometry, windows);
        pane.position.set(place.x + x, 2.24, place.z + 3.31);
        group.add(pane);
      }
    // 9 bulbs + 8 panes → two draw calls (they only fade together).
    batchDirectMeshes(group);
    paneGeometry.dispose();
    return { pools, poolMaterial, bulbs, windows, group };
  }

  /** 0 = daylight, 1 = full night lighting. */
  setNight(level: number) {
    const n = this.night;
    n.poolMaterial.opacity = 0.75 * level;
    n.bulbs.opacity = level;
    n.windows.opacity = 0.9 * level;
    n.group.visible = level > 0.02;
    const sign = n.group.getObjectByName('casino-sign') as THREE.Sprite | undefined;
    if (sign) (sign.material as THREE.SpriteMaterial).opacity = level;
    if (this.lampGlow)
      this.lampGlow.color.setRGB(1, 0.886 + 0.1 * level, 0.64 + 0.3 * level).multiplyScalar(1 + 1.2 * level);
  }

  /** Highlights plot `index` of `actor`'s farm (null clears); true when it changed. */
  setHover(target: { actor: number; index: number } | null) {
    const key = target ? `${target.actor}:${target.index}` : '';
    if (key === this.hoverKey) return false;
    this.hoverKey = key;
    const yard = target ? villageYard(target.actor) : null;
    this.hover.visible = !!yard;
    if (yard && target) {
      const at = yardPlotCenter(yard, target.index);
      this.hover.position.set(at.x, 0.215, at.z);
      this.hover.scale.set(PLOT_SIZE + 0.06, 0.02, PLOT_SIZE + 0.06);
    }
    return true;
  }

  /** Applies the latest life state; returns true when anything visible changed. */
  update(u: LifeLayerUpdate) {
    let changed = false;
    if (u.selfActor !== this.markedActor) {
      this.markedActor = u.selfActor;
      const yard = villageYard(u.selfActor);
      this.mineMarker.visible = !!yard;
      if (yard) {
        const [a, b] = yard.beds;
        const x0 = Math.min(a.x - a.w / 2, b.x - b.w / 2) - 0.28,
          x1 = Math.max(a.x + a.w / 2, b.x + b.w / 2) + 0.28,
          z0 = Math.min(a.z - a.d / 2, b.z - b.d / 2) - 0.28,
          z1 = Math.max(a.z + a.d / 2, b.z + b.d / 2) + 0.28;
        const strips = this.mineMarker.children;
        const set = (m: THREE.Object3D, x: number, z: number, w: number, d: number) => {
          m.position.set(x, 0.04, z);
          m.scale.set(w, 0.03, d);
        };
        set(strips[0], (x0 + x1) / 2, z0, x1 - x0, 0.07);
        set(strips[1], (x0 + x1) / 2, z1, x1 - x0, 0.07);
        set(strips[2], x0, (z0 + z1) / 2, 0.07, z1 - z0);
        set(strips[3], x1, (z0 + z1) / 2, 0.07, z1 - z0);
      }
      changed = true;
    }
    const key = JSON.stringify([u.plots, u.watered, u.selfActor]);
    if (key !== this.lastKey) {
      this.lastKey = key;
      changed = true;
      const soil: Instance[] = [],
        crops: Instance[] = [];
      let readyYard: FarmYard | null = null;
      for (const yard of VILLAGE_YARDS) {
        const plots = u.plots[yard.actor] ?? [];
        // 6 / 9 / 12 plots: the back bed stays fallow until the farm grows.
        const total = Math.max(6, Math.min(12, plots.length));
        const mine = yard.actor === u.selfActor;
        for (let i = 0; i < 12; i++) {
          const at = yardPlotCenter(yard, i);
          if (i >= total) {
            // Untilled: grass over the whole cell (no furrows) with a few tufts.
            soil.push({ geo: GEO.box, mat: MAT.fallow, m: matrix(at.x, 0.14, at.z, PLOT_SIZE + PLOT_GAP + 0.01, 0.12, PLOT_SIZE + PLOT_GAP + 0.01) });
            for (let k = 0; k < 3; k++) {
              const a = (yard.actor * 3 + i * 5 + k * 2.1) % 6.28;
              soil.push({ geo: GEO.cone, mat: MAT.leafLight, m: matrix(at.x + Math.cos(a) * 0.2, 0.26, at.z + Math.sin(a) * 0.2, 0.05, 0.12, 0.05) });
            }
            continue;
          }
          const plot = plots[i];
          const wet = mine ? !!(u.watered[i] && plot?.crop) : !!(plot?.crop && plot.thirsty === false);
          soil.push({
            geo: GEO.box,
            mat: wet ? MAT.soilWet : MAT.soil,
            m: matrix(at.x, 0.14, at.z, PLOT_SIZE, 0.12, PLOT_SIZE),
          });
          if (plot?.crop) {
            cropInstances(crops, at, plot.crop, plot.stage, yard.actor * 1.7 + i);
            if (mine && plot.stage === 3) readyYard = yard;
          }
        }
      }
      this.soil.set(soil);
      this.crops.set(crops);
      this.readyBadge.visible = !!readyYard;
      if (readyYard) {
        // Over the front bed's back corner so it never covers the name board.
        const r = readyYard.beds[0];
        this.readyBadge.position.set(r.x + r.w / 2, 1.1, r.z - r.d / 2);
      }
    }
    const fruitKey = u.ripeTrees.join(',');
    if (fruitKey !== this.lastFruit) {
      this.lastFruit = fruitKey;
      changed = true;
      const fruit: Instance[] = [];
      for (const id of u.ripeTrees) {
        const p = FRUIT_TREE_POINTS[id];
        if (!p) continue;
        for (let i = 0; i < 7; i++) {
          const a = i * 0.9 + 0.4;
          // Face the camera side (+x/+z) so the fruit is not hidden in the crown.
          const r = 0.95 + (i % 2) * 0.2;
          fruit.push({
            geo: GEO.sphere,
            mat: i % 3 ? MAT.fruitRed : MAT.fruitOrange,
            m: matrix(p.x + Math.cos(a) * r * 0.8 + 0.3, 2.1 + (i % 3) * 0.45, p.z + Math.abs(Math.sin(a)) * r * 0.8 + 0.3, 0.13, 0.13, 0.13),
          });
        }
      }
      this.fruit.set(fruit);
    }
    const mail = mailboxPoint(u.selfActor);
    const mailVisible = !!mail && u.unreadMail;
    if (mailVisible !== this.mailBadge.visible) changed = true;
    this.mailBadge.visible = mailVisible;
    if (mail) this.mailBadge.position.set(mail.x, 2.25, mail.z);
    return changed;
  }
}
