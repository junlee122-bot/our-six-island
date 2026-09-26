// kArchive civic set in the village (자료: kArchive · 출처: 쓰레드 dogfooter):
// the greenhouse, notice board, museum (library), 범마을 회관 (hanok), sea
// pier deck and railing, the friends' vegetable bed frames, the resident
// homes' picket fences, the east-garden wisteria pergola and the festival
// stage. Placement and footprints: lounge-village-karchive-layout.ts.
//
// Each model replaces a procedural stand-in only once it has loaded (the
// primitive version stays as the fallback). Village projects gate what they
// build: the greenhouse ('greenhouse') and the festival stage ('stage') show a
// small construction site until the project is done, the pier deck follows
// 'bridge' (inside the season layer's pier group), 'greenhouse2' adds a second
// greenhouse (replacing the economy pass's primitive one), the museum gets banners
// with 'museum' and the stage gets string lights with 'festival'. Repeated
// props (bed frames, fences, deck tiles, rails) are one InstancedMesh each.
import * as THREE from 'three';
import { LOUNGE_MODELS } from './lounge-model-assets';
import {
  VILLAGE_BOARD,
  VILLAGE_DECOR,
  VILLAGE_GREENHOUSE,
  VILLAGE_MUSEUM,
} from './lounge-village-layout';
import { FARM_BEDS, farmBedRect } from './lounge-village-life';
import {
  KARCHIVE_BOARD,
  KARCHIVE_GREENHOUSE,
  KARCHIVE_GREENHOUSE2,
  KARCHIVE_HALL,
  KARCHIVE_MODEL_SIZE,
  KARCHIVE_MUSEUM,
  KARCHIVE_PERGOLA,
  KARCHIVE_PIER,
  KARCHIVE_STAGE,
  VEGETABLE_BED_SOIL,
  karchiveFootprint,
} from './lounge-village-karchive-layout';
import type { Season } from './lounge-calendar';

type Loader = (url: string) => Promise<THREE.Group>;
type Placement = {
  x: number;
  z: number;
  y?: number;
  /** Uniform scale, or per-axis [x, y, z] (applied before `rot`). */
  scale: number | readonly [number, number, number];
  rot?: number;
};

/** Ground height the other village props rest on. */
const GROUND_Y = 0.03;

const tmp = new THREE.Matrix4();
function placementMatrix(p: Placement) {
  const s = typeof p.scale === 'number' ? [p.scale, p.scale, p.scale] : p.scale;
  return new THREE.Matrix4().compose(
    new THREE.Vector3(p.x, p.y ?? GROUND_Y, p.z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rot ?? 0),
    new THREE.Vector3(s[0], s[1], s[2]),
  );
}
function shadowed(object: THREE.Object3D) {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) child.castShadow = child.receiveShadow = true;
  });
  return object;
}
/** One copy of a model (origin at its bottom centre, as every civic GLB is). */
function placed(source: THREE.Group, p: Placement, name: string) {
  const holder = new THREE.Group();
  holder.name = name;
  holder.add(source.clone(true));
  holder.applyMatrix4(placementMatrix(p));
  return shadowed(holder);
}
/** Many copies of a model as one InstancedMesh per mesh (one draw call each). */
function instanced(source: THREE.Group, placements: readonly Placement[], name: string) {
  const group = new THREE.Group();
  group.name = name;
  source.updateMatrixWorld(true);
  const matrices = placements.map(placementMatrix);
  source.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const batch = new THREE.InstancedMesh(mesh.geometry, mesh.material, matrices.length);
    matrices.forEach((m, i) => batch.setMatrixAt(i, tmp.multiplyMatrices(m, mesh.matrixWorld)));
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
    batch.castShadow = batch.receiveShadow = true;
    group.add(batch);
  });
  return group;
}
/** Hides a procedural stand-in's meshes; sprites (signs), kept names and kArchive parts stay. */
function hideMeshes(group: THREE.Object3D | undefined, keep: readonly string[] = []) {
  const kept = (o: THREE.Object3D | null): boolean =>
    !!o && o !== group && (o.name.startsWith('karchive') || keep.includes(o.name) || kept(o.parent));
  group?.traverse((child) => {
    if (child instanceof THREE.Sprite || kept(child)) return;
    if ((child as THREE.Mesh).isMesh) child.visible = false;
  });
}

const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
const SITE = {
  dirt: mat('#b39468'),
  plank: mat('#c79a62'),
  plankDark: mat('#8b6440'),
  post: mat('#f1ede3'),
  tape: mat('#f2b632'),
  stripe: mat('#e4643b'),
  bulb: new THREE.MeshBasicMaterial({ color: '#ffe3a1', toneMapped: false }),
  pole: mat('#6d4c33'),
  cloth: [mat('#c95f4f'), mat('#4f7fa6')],
};
const BOX = new THREE.BoxGeometry(1, 1, 1);
const SPHERE = new THREE.SphereGeometry(1, 10, 8);
function box(parent: THREE.Object3D, m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, ry = 0) {
  const o = new THREE.Mesh(BOX, m);
  o.position.set(x, y, z);
  o.scale.set(w, h, d);
  o.rotation.y = ry;
  o.castShadow = h > 0.12;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}

/** Same look as the season layer's wooden signs (a canvas sprite). */
function signSprite(text: string, scale = 0.5) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 88;
  const c = canvas.getContext('2d');
  if (c) {
    c.fillStyle = '#5b3d25';
    c.beginPath();
    c.roundRect(0, 0, 256, 88, 14);
    c.fill();
    c.fillStyle = '#fff3cf';
    c.beginPath();
    c.roundRect(6, 6, 244, 76, 10);
    c.fill();
    c.fillStyle = '#6a3f23';
    c.font = `bold ${text.length > 7 ? 34 : 40}px sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, 128, 46);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }),
  );
  sprite.scale.set(scale * (256 / 88), scale, 1);
  sprite.renderOrder = 20;
  return sprite;
}

/**
 * A small construction site standing in for an unfinished village project:
 * a dirt pad, a plank stack, corner posts with hazard tape and a sign.
 */
function constructionSite(x: number, z: number, w: number, d: number, label: string) {
  const g = new THREE.Group();
  g.name = 'karchive-site';
  box(g, SITE.dirt, x, 0.05, z, w, 0.05, d).castShadow = false;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      box(g, SITE.post, x + (sx * w) / 2, 0.45, z + (sz * d) / 2, 0.09, 0.9, 0.09);
      box(g, SITE.stripe, x + (sx * w) / 2, 0.62, z + (sz * d) / 2, 0.1, 0.14, 0.1);
    }
  for (const y of [0.5, 0.75])
    for (const s of [-1, 1]) {
      box(g, SITE.tape, x, y, z + (s * d) / 2, w, 0.05, 0.02);
      box(g, SITE.tape, x + (s * w) / 2, y, z, 0.02, 0.05, d);
    }
  for (let i = 0; i < 4; i++)
    box(g, i % 2 ? SITE.plank : SITE.plankDark, x - w * 0.18, 0.12 + i * 0.07, z + d * 0.1, w * 0.42, 0.06, 0.26, 0.08 * i);
  box(g, SITE.plank, x + w * 0.2, 0.22, z - d * 0.12, 0.42, 0.34, 0.42);
  box(g, SITE.plankDark, x + w * 0.2, 0.22, z - d * 0.12, 0.44, 0.04, 0.44);
  const sign = signSprite(label, 0.46);
  sign.position.set(x, 1.45, z + d / 2);
  g.add(sign);
  return g;
}

/**
 * The hanok is a winter model (snow on the roof and the stone base). Outside
 * winter a tiny shader patch turns its pure-white snow texels back into roof
 * tile (upper part) or stone (lower part), keeping the baked shading.
 */
function desnowMaterial(source: THREE.Material, roofFrom: number, uniform: { value: number }) {
  const material = (source as THREE.MeshStandardMaterial).clone();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.kxDesnow = uniform;
    shader.uniforms.kxRoofFrom = { value: roofFrom };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float kxWorldY;')
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nkxWorldY = (modelMatrix * vec4(transformed, 1.0)).y;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float kxWorldY;\nuniform float kxDesnow;\nuniform float kxRoofFrom;',
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        {
          vec3 c = diffuseColor.rgb;
          float lo = min(min(c.r, c.g), c.b), hi = max(max(c.r, c.g), c.b);
          float snow = smoothstep(0.42, 0.6, lo) * (1.0 - smoothstep(0.08, 0.14, hi - lo));
          vec3 tile = vec3(0.045, 0.055, 0.1);
          vec3 stone = vec3(0.30, 0.29, 0.28);
          vec3 fill = mix(stone, tile, step(kxRoofFrom, kxWorldY)) * (0.75 + 0.3 * lo);
          diffuseColor.rgb = mix(c, fill, snow * kxDesnow);
        }`,
      );
  };
  material.customProgramCacheKey = () => 'kx-desnow';
  return material;
}

export type KarchiveUpdate = { season: Season | null; flags: readonly string[] };

export class VillageKarchiveLayer {
  readonly root = new THREE.Group();
  private scene: THREE.Object3D;
  private flags: readonly string[] = [];
  private season: Season | null = null;
  private lastKey = '';
  private desnow = { value: 1 };
  private greenhouse: THREE.Object3D | null = null;
  /** '온실 2동' (greenhouse2 project): a smaller copy beside the first. */
  private greenhouse2: THREE.Object3D | null = null;
  private greenhouseSite: THREE.Object3D;
  private stage: THREE.Object3D | null = null;
  private stageSite: THREE.Object3D;
  private stageLights = new THREE.Group();
  private museumBanners = new THREE.Group();

  constructor(scene: THREE.Object3D) {
    this.scene = scene;
    this.root.name = 'village-karchive';
    scene.add(this.root);
    const gh = VILLAGE_GREENHOUSE;
    this.greenhouseSite = constructionSite(gh.x, gh.z, gh.width, gh.depth, '온실 공사 중');
    const st = KARCHIVE_STAGE,
      siteSize = st.radius * 1.3;
    this.stageSite = constructionSite(st.x, st.z, siteSize, siteSize, '축제 무대 공사 중');
    this.greenhouseSite.visible = this.stageSite.visible = this.stageLights.visible = false;
    this.root.add(this.greenhouseSite, this.stageSite, this.stageLights, this.museumBanners);
    this.buildMuseumBanners();
    this.buildStageLights();
    this.apply();
  }

  /**
   * Starts every model download; each promise settles once its model is placed.
   * Ids are camelCase: the village mirrors them into `data-*` attributes.
   */
  load(load: Loader, placedOne: (id: string) => void): Promise<void>[] {
    const job = (id: string, url: string, place: (source: THREE.Group) => void) =>
      load(url).then((source) => {
        place(source);
        this.apply();
        placedOne(id);
      });
    return [
      job('karchiveHall', LOUNGE_MODELS.hanokHall, (s) => this.placeHall(s)),
      job('karchiveGreenhouse', LOUNGE_MODELS.greenhouse, (s) => this.placeGreenhouse(s)),
      job('karchiveMuseum', LOUNGE_MODELS.museumLibrary, (s) => this.placeMuseum(s)),
      job('karchiveBoard', LOUNGE_MODELS.noticeBoard, (s) => this.placeBoard(s)),
      job('karchiveStage', LOUNGE_MODELS.festivalStage, (s) => this.placeStage(s)),
      job('karchivePergola', LOUNGE_MODELS.wisteriaPergola, (s) => {
        const p = KARCHIVE_PERGOLA;
        this.root.add(placed(s, { x: p.x, z: p.z, scale: p.scale }, 'karchive-pergola'));
      }),
      job('karchiveBeds', LOUNGE_MODELS.vegetableBed, (s) => this.placeBeds(s)),
      job('karchiveFences', LOUNGE_MODELS.picketFence, (s) => this.placeFences(s)),
      job('karchiveDeck', LOUNGE_MODELS.timberDeck, (s) => this.placeDeck(s)),
      job('karchiveRails', LOUNGE_MODELS.harborFence, (s) => this.placeRails(s)),
    ];
  }

  /** Season and village project flags; true when something visible changed. */
  update(u: KarchiveUpdate) {
    this.flags = u.flags;
    this.season = u.season;
    return this.apply();
  }

  private apply() {
    const has = (flag: string) => this.flags.includes(flag);
    const key = JSON.stringify([
      this.season,
      has('greenhouse'),
      has('greenhouse2'),
      has('stage'),
      has('festival'),
      has('museum'),
      !!this.greenhouse,
      !!this.stage,
    ]);
    if (key === this.lastKey) return false;
    this.lastKey = key;
    this.desnow.value = this.season === 'winter' ? 0 : 1;
    if (this.greenhouse) {
      this.greenhouse.visible = has('greenhouse');
      this.greenhouseSite.visible = !has('greenhouse');
    }
    if (this.greenhouse2) this.greenhouse2.visible = has('greenhouse') && has('greenhouse2');
    if (this.stage) {
      this.stage.visible = has('stage');
      this.stageSite.visible = !has('stage');
      this.stageLights.visible = has('stage') && has('festival');
    }
    this.museumBanners.visible = has('museum');
    return true;
  }

  private placeHall(source: THREE.Group) {
    const size = KARCHIVE_MODEL_SIZE.hanokHall,
      scale = KARCHIVE_HALL.width / size.w;
    const hall = placed(
      source,
      { x: KARCHIVE_HALL.x, z: KARCHIVE_HALL.front - (size.d * scale) / 2, scale },
      'karchive-hall',
    );
    // The eaves start a little under half the model's height; below is wall and base.
    const roofFrom = GROUND_Y + size.h * scale * 0.45;
    hall.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.material = desnowMaterial(mesh.material as THREE.Material, roofFrom, this.desnow);
    });
    this.root.add(hall);
    const fallback = this.scene.getObjectByName('village-building-hall');
    if (fallback) fallback.visible = false;
  }

  private placeGreenhouse(source: THREE.Group) {
    const g = KARCHIVE_GREENHOUSE,
      f = karchiveFootprint('greenhouse', g.scale);
    const greenhouse = new THREE.Group();
    greenhouse.name = 'karchive-greenhouse';
    greenhouse.add(placed(source, { x: g.x, z: g.z, scale: g.scale }, 'karchive-greenhouse-model'));
    const sign = signSprite('마을 온실', 0.46);
    sign.position.set(g.x, f.h + 0.45, g.z + f.d / 2);
    greenhouse.add(sign);
    this.greenhouse = greenhouse;
    this.root.add(greenhouse);
    // The second house stands east of the first, clear of the plaza lamp.
    const g2 = KARCHIVE_GREENHOUSE2,
      f2 = karchiveFootprint('greenhouse', g2.scale);
    const second = new THREE.Group();
    second.name = 'karchive-greenhouse2';
    second.add(placed(source, { x: g2.x, z: g2.z, scale: g2.scale }, 'karchive-greenhouse2-model'));
    const sign2 = signSprite('온실 2동', 0.4);
    sign2.position.set(g2.x, f2.h + 0.4, g2.z + f2.d / 2);
    second.add(sign2);
    this.greenhouse2 = second;
    this.root.add(second);
    this.scene.getObjectByName('village-project-greenhouse2')?.removeFromParent();
    // The primitive frame and its flagged glass are replaced for good.
    this.scene.getObjectByName('village-greenhouse')?.removeFromParent();
    this.scene.getObjectByName('village-greenhouse-glass')?.removeFromParent();
  }

  private placeMuseum(source: THREE.Group) {
    const m = KARCHIVE_MUSEUM;
    this.root.add(placed(source, { x: m.x, z: m.z, scale: m.scale }, 'karchive-museum'));
    const old = this.scene.getObjectByName('village-museum');
    hideMeshes(old);
    // The sign floats over the door; the old second floor is not needed.
    const f = karchiveFootprint('museumLibrary', m.scale);
    old?.traverse((child) => {
      if (child instanceof THREE.Sprite) child.position.set(m.x, f.h + 0.5, m.z + f.d / 2);
    });
    this.scene.getObjectByName('village-museum-floor2')?.removeFromParent();
  }

  private buildMuseumBanners() {
    // '박물관 2층' project: festival banners flank the museum door.
    const m = VILLAGE_MUSEUM;
    for (const [i, side] of [-1, 1].entries()) {
      const x = m.x + side * (m.width / 2 - 0.12),
        z = m.z + m.depth / 2 + 0.35;
      box(this.museumBanners, SITE.pole, x, 0.95, z, 0.07, 1.9, 0.07);
      box(this.museumBanners, SITE.cloth[i], x + side * -0.2, 1.45, z, 0.36, 0.7, 0.03);
      const knob = new THREE.Mesh(SPHERE, SITE.tape);
      knob.position.set(x, 1.93, z);
      knob.scale.setScalar(0.07);
      this.museumBanners.add(knob);
    }
    this.museumBanners.name = 'karchive-museum-banners';
  }

  private placeBoard(source: THREE.Group) {
    const b = KARCHIVE_BOARD;
    this.root.add(placed(source, { x: b.x, z: b.z, scale: b.scale }, 'karchive-board'));
    const old = this.scene.getObjectByName('village-board');
    hideMeshes(old, ['village-board-papers']);
    // Re-pin the bundle papers onto the model's panel (2 rows × 4).
    const papers = old?.getObjectByName('village-board-papers') as THREE.InstancedMesh | undefined;
    if (papers) {
      const s = b.scale,
        panel = { x: 0.34 * s, y0: 0.5 * s, y1: 0.86 * s, z: 0.045 * s };
      const q = new THREE.Quaternion(),
        e = new THREE.Euler(),
        m = new THREE.Matrix4();
      for (let i = 0; i < 8; i++) {
        const col = i % 4,
          row = Math.floor(i / 4);
        m.compose(
          new THREE.Vector3(
            VILLAGE_BOARD.x - panel.x + (col * 2 * panel.x) / 3,
            GROUND_Y + panel.y1 - row * (panel.y1 - panel.y0),
            VILLAGE_BOARD.z + panel.z,
          ),
          q.setFromEuler(e.set(0, 0, ((i * 37) % 7) * 0.03 - 0.09)),
          new THREE.Vector3(0.17, 0.19, 0.01),
        );
        papers.setMatrixAt(i, m);
      }
      papers.instanceMatrix.needsUpdate = true;
      papers.computeBoundingSphere();
    }
    old?.traverse((child) => {
      if (child instanceof THREE.Sprite) child.position.y = GROUND_Y + KARCHIVE_MODEL_SIZE.noticeBoard.h * b.scale + 0.42;
    });
  }

  private placeStage(source: THREE.Group) {
    const s = KARCHIVE_STAGE;
    this.stage = placed(source, { x: s.x, z: s.z, scale: s.scale }, 'karchive-stage');
    this.root.add(this.stage);
  }

  private buildStageLights() {
    // '축제 무대 조명' project: a string of warm bulbs across the stage arch.
    const s = KARCHIVE_STAGE,
      f = karchiveFootprint('festivalStage', s.scale);
    for (let i = 0; i <= 10; i++) {
      const t = i / 10,
        a = Math.PI * t;
      const bulb = new THREE.Mesh(SPHERE, SITE.bulb);
      bulb.position.set(s.x - Math.cos(a) * f.w * 0.52, f.h * 0.55 + Math.sin(a) * f.h * 0.5, s.z + f.d * 0.12);
      bulb.scale.setScalar(0.07);
      this.stageLights.add(bulb);
    }
    this.stageLights.name = 'karchive-stage-lights';
  }

  private placeBeds(source: THREE.Group) {
    // One frame per friend's bed; the soil surface sits just under the soil
    // tiles (top 0.2) the life layer draws, so crops stay where they were.
    const size = KARCHIVE_MODEL_SIZE.vegetableBed,
      sy = 0.9,
      y = 0.17 - VEGETABLE_BED_SOIL * sy;
    const placements = FARM_BEDS.map((bed): Placement => {
      const r = farmBedRect(bed),
        turned = r.d > r.w;
      const w = (turned ? r.d : r.w) + 0.12,
        d = (turned ? r.w : r.d) + 0.12;
      return { x: r.x, z: r.z, y, scale: [w / size.w, sy, d / size.d], rot: turned ? Math.PI / 2 : 0 };
    });
    this.root.add(instanced(source, placements, 'karchive-beds'));
    this.scene.getObjectByName('village-farm-frames')?.removeFromParent();
  }

  private placeFences(source: THREE.Group) {
    // Resident side fences (VILLAGE_DECOR 'fence', each a z-run) as picket segments.
    const placements: Placement[] = [];
    for (const item of VILLAGE_DECOR) {
      if (item.kind !== 'fence' || item.collider?.shape !== 'box') continue;
      const length = item.collider.d,
        count = Math.max(1, Math.round(length / 0.6)),
        seg = length / count;
      for (let i = 0; i < count; i++)
        placements.push({
          x: item.x,
          z: item.z - length / 2 + seg * (i + 0.5),
          scale: seg,
          rot: Math.PI / 2,
        });
    }
    this.root.add(instanced(source, placements, 'karchive-fences'));
  }

  private placeDeck(source: THREE.Group) {
    const p = KARCHIVE_PIER,
      fixed = this.scene.getObjectByName('village-pier-fixed');
    if (!fixed) return;
    const tiles = Array.from({ length: p.tiles }, (_, i): Placement => ({
      x: p.x0 + p.tile * (i + 0.5),
      z: p.z,
      y: p.top - KARCHIVE_MODEL_SIZE.timberDeck.h * 1.2,
      scale: [p.tile, 1.2, p.tile],
    }));
    hideMeshes(fixed);
    // Inside the pier group: it shows once the 'bridge' project is done.
    fixed.add(instanced(source, tiles, 'karchive-deck'));
    // Pilings under the deck (the old posts were part of the hidden batch).
    const piles = new THREE.Group();
    piles.name = 'karchive-deck-piles';
    for (let i = 1; i <= p.tiles; i++)
      for (const s of [-1, 1]) box(piles, SITE.pole, p.x0 + p.tile * i - 0.1, -0.2, p.z + s * (p.tile / 2 - 0.1), 0.14, 1.0, 0.14);
    fixed.add(piles);
  }

  private placeRails(source: THREE.Group) {
    const p = KARCHIVE_PIER,
      fixed = this.scene.getObjectByName('village-pier-fixed');
    if (!fixed) return;
    hideMeshes(fixed);
    // Bollard-and-chain rails along both sides over the sea, and across the end.
    const scale = 0.72,
      end = p.x0 + p.tile * p.tiles;
    const placements: Placement[] = [];
    for (let x = p.railFrom + scale / 2; x + scale / 2 <= end + 0.01; x += scale)
      for (const s of [-1, 1]) placements.push({ x, z: p.z + s * (p.tile / 2 - 0.08), y: p.top, scale });
    for (const dz of [-scale / 2, scale / 2])
      placements.push({ x: end - 0.08, z: p.z + dz, y: p.top, scale, rot: Math.PI / 2 });
    fixed.add(instanced(source, placements, 'karchive-rails'));
  }
}
