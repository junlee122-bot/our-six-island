// three.js layer for "범타듀의 하루" in the village: every friend's farm bed
// with low-poly crops by stage, fruit on the fruit trees, the market stall,
// badges over my mailbox / ripe bed, and the night lights (lamp pools,
// window glow, the casino marquee). Built once with the cached village world.
import * as THREE from 'three';
import type { Crop } from './lounge-life';
import {
  FARM_BEDS,
  FRUIT_TREE_POINTS,
  PLOT_SIZE,
  farmBedRect,
  mailboxPoint,
  plotCenterIn,
  cropVisual,
  type FarmBed,
  type PublicPlot,
} from './lounge-village-life';
import {
  VILLAGE_DECOR,
  VILLAGE_FURNISHINGS,
  VILLAGE_MARKET,
  VILLAGE_PLACES,
} from './lounge-village-layout';
import { batchDirectMeshes } from './lounge-village-world';

const std = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
const MAT = {
  frame: std('#8a6242'),
  soil: std('#7a5234'),
  soilWet: std('#4f3421'),
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
  /** Gold border under my own bed so it stands out from the neighbours'. */
  private mineMarker: THREE.Mesh;
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
    for (const bed of FARM_BEDS) {
      const r = farmBedRect(bed);
      box(this.root, MAT.frame, r.x, 0.08, r.z, r.w + 0.08, 0.16, r.d + 0.08).castShadow = false;
    }
    // Seven identical frames → one draw call.
    batchDirectMeshes(this.root);
    this.mineMarker = new THREE.Mesh(GEO.box, MAT.mine);
    this.mineMarker.visible = false;
    this.root.add(this.mineMarker);
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

  /** Applies the latest life state; returns true when anything visible changed. */
  update(u: LifeLayerUpdate) {
    let changed = false;
    if (u.selfActor !== this.markedActor) {
      this.markedActor = u.selfActor;
      const bed = FARM_BEDS.find((b) => b.actor === u.selfActor);
      this.mineMarker.visible = !!bed;
      if (bed) {
        const r = farmBedRect(bed);
        this.mineMarker.position.set(r.x, 0.035, r.z);
        this.mineMarker.scale.set(r.w + 0.42, 0.05, r.d + 0.42);
      }
      changed = true;
    }
    const key = JSON.stringify([u.plots, u.watered, u.selfActor]);
    if (key !== this.lastKey) {
      this.lastKey = key;
      changed = true;
      const soil: Instance[] = [],
        crops: Instance[] = [];
      let anyReady = false;
      let readyBed: FarmBed | null = null;
      for (const bed of FARM_BEDS) {
        const plots = u.plots[bed.actor] ?? [];
        // 9 / 12-plot farms (life expansion) fit the same bed in shallower rows.
        const total = Math.max(6, Math.min(12, plots.length));
        for (let i = 0; i < total; i++) {
          const at = plotCenterIn(bed, i, total);
          const mine = bed.actor === u.selfActor;
          soil.push({
            geo: GEO.box,
            mat: mine && u.watered[i] && plots[i]?.crop ? MAT.soilWet : MAT.soil,
            m: matrix(at.x, 0.14, at.z, PLOT_SIZE, 0.12, PLOT_SIZE * at.scale),
          });
          const plot = plots[i];
          if (plot?.crop) {
            cropInstances(crops, at, plot.crop, plot.stage, bed.actor * 1.7 + i);
            if (mine && plot.stage === 3) {
              anyReady = true;
              readyBed = bed;
            }
          }
        }
      }
      this.soil.set(soil);
      this.crops.set(crops);
      this.readyBadge.visible = anyReady;
      if (readyBed) {
        // Over the bed's back corner so it never covers the name tag.
        const r = farmBedRect(readyBed);
        this.readyBadge.position.set(r.x + r.w / 2, 1.05, r.z - r.d / 2);
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
