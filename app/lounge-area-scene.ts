// 성장 P2 regions in three.js (뒷산, 숲 깊은 곳, 광산 floors): the static
// set of a region built from lounge-areas.ts REGIONS and lounge-mine.ts
// floors, plus today's nodes / rocks shown or hidden by `update`. Uses the
// valley set's models (pines, broadleaf trees, shrubs, boulders, stumps,
// firewood) and simple procedural pieces (the bear cave mouth, the fallen
// log, mine walls, pillars, rocks, ladders and the lift cage). No React.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VALLEY_MODELS } from './lounge-model-assets';
import { VALLEY_MODEL_SIZE, type ValleyModelKey } from './lounge-village-layout';
import { HILL_CAVE, HILL_LOG, MINE_LIFT, REGIONS, type OutdoorArea } from './lounge-areas';
import { MINE_ARRIVE, MINE_ROOM, bandOf, type MineFloor } from './lounge-mine';
import type { NodeKind } from './lounge-growth-data';

let loader: GLTFLoader | null = null;
const cache = new Map<string, Promise<THREE.Group>>();
function load(model: ValleyModelKey) {
  const url = VALLEY_MODELS[model];
  let job = cache.get(url);
  if (!job) {
    loader ??= new GLTFLoader();
    job = loader.loadAsync(url).then((g) => g.scene);
    job.catch(() => cache.delete(url));
    cache.set(url, job);
  }
  return job;
}

/** Deterministic 0…1 from a string (placement jitter). */
function rnd(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}
function shadowed<T extends THREE.Object3D>(object: T, cast = true) {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = cast;
      child.receiveShadow = true;
    }
  });
  return object;
}
const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...extra });

/** Node look per kind in the regions. */
const NODE_LOOK: Record<NodeKind, { model: ValleyModelKey; s: number }> = {
  bush: { model: 'shrub', s: 1.7 },
  log: { model: 'firewood', s: 0.6 },
  rock: { model: 'graniteBoulder', s: 1.45 },
  tree: { model: 'broadleafTree', s: 1.55 },
  stump: { model: 'treeStump', s: 1.9 },
  shroom: { model: 'firewood', s: 0.55 },
};
const MARK_GEO = new THREE.OctahedronGeometry(0.17, 0);
const MARK_MAT = {
  wood: new THREE.MeshBasicMaterial({ color: '#9fd46b' }),
  rock: new THREE.MeshBasicMaterial({ color: '#f0a25a' }),
  shroom: new THREE.MeshBasicMaterial({ color: '#f6c56b' }),
  vein: new THREE.MeshBasicMaterial({ color: '#ffe27a' }),
};

export type RegionNode = { id: string; kind: NodeKind; x: number; z: number; taken: boolean };
export type RegionUpdate = {
  nodes: readonly RegionNode[];
  logCleared: boolean;
  /** The mine: today's floor, the rocks I broke on it, whether its ladder shows. */
  floor?: MineFloor | null;
  broken?: readonly number[];
  ladder?: boolean;
  lift?: boolean;
};

export class RegionSet {
  readonly root = new THREE.Group();
  readonly area: OutdoorArea;
  private nodes = new Map<string, { object: THREE.Object3D; mark: THREE.Mesh }>();
  private sources: Partial<Record<ValleyModelKey, THREE.Group>> = {};
  private log: THREE.Object3D | null = null;
  private floorGroup: THREE.Group | null = null;
  private floorKey = '';
  private rocks = new Map<number, THREE.Object3D>();
  private ladderGroup: THREE.Group | null = null;
  private liftGroup: THREE.Group | null = null;
  private state: RegionUpdate = { nodes: [], logCleared: false };
  private disposables: { dispose: () => void }[] = [];
  /** Called when a model arrives (the scene redraws). */
  onChange: () => void = () => {};

  constructor(area: OutdoorArea) {
    this.area = area;
    this.root.name = 'region-' + area;
    if (area === 'mine') this.buildMineShell();
    else this.buildOutdoor();
  }

  // ---------------------------------------------------------- outdoors
  private ground(w: number, d: number, color: string, y = 0) {
    const geo = new THREE.PlaneGeometry(w, d);
    const m = new THREE.Mesh(geo, mat(color));
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    m.receiveShadow = true;
    this.disposables.push(geo, m.material as THREE.Material);
    return m;
  }
  /** A dirt path strip from a to b. */
  private strip(a: { x: number; z: number }, b: { x: number; z: number }, width: number, color: string) {
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const m = this.ground(width, len + width * 0.6, color, 0.012);
    m.position.set((a.x + b.x) / 2, 0.012, (a.z + b.z) / 2);
    m.rotation.z = -Math.atan2(b.x - a.x, b.z - a.z);
    return m;
  }
  private placeModel(model: ValleyModelKey, x: number, z: number, s: number, rot = 0, name: string = model) {
    const holder = new THREE.Group();
    holder.name = name;
    holder.position.set(x, -VALLEY_MODEL_SIZE[model].y0 * s, z);
    holder.scale.setScalar(s);
    holder.rotation.y = rot;
    this.root.add(holder);
    const src = this.sources[model];
    const fill = (source: THREE.Group) => {
      if (holder.children.length) return;
      holder.add(shadowed(source.clone(true)));
      this.onChange();
    };
    if (src) fill(src);
    else
      void load(model).then(
        (source) => {
          this.sources[model] = source;
          fill(source);
        },
        () => {},
      );
    return holder;
  }
  private buildOutdoor() {
    const r = REGIONS[this.area];
    const { w, d } = r.bounds;
    const hill = this.area === 'hill';
    this.root.add(this.ground(w + 60, d + 60, r.look.groundFar, -0.02));
    this.root.add(this.ground(w, d, r.look.ground));
    const dirt = hill ? '#b39266' : '#7d6446';
    if (hill) {
      // The trail up from the village, to the cave, and west to the log.
      this.root.add(this.strip({ x: 0, z: d / 2 }, { x: 0, z: 4 }, 2.4, dirt));
      this.root.add(this.strip({ x: 0, z: 4 }, { x: HILL_CAVE.x, z: HILL_CAVE.z + 2 }, 2.1, dirt));
      this.root.add(this.strip({ x: 0, z: 4 }, { x: HILL_LOG.x + 1, z: HILL_LOG.z }, 1.8, dirt));
    } else {
      this.root.add(this.strip({ x: w / 2, z: 0 }, { x: 4, z: 0 }, 1.8, dirt));
      this.root.add(this.strip({ x: 4, z: 0 }, { x: -8, z: -6 }, 1.4, dirt));
    }
    // A ring of trees just outside the walkable edge (none in front of the camera's view line).
    const edge: [number, number][] = [];
    for (let x = -w / 2 - 2; x <= w / 2 + 2; x += 2.3) edge.push([x, -d / 2 - 1.2 - rnd('bz' + x) * 2.5]);
    for (let z = -d / 2; z <= d / 2 + 2; z += 2.4) {
      edge.push([-w / 2 - 1.1 - rnd('lx' + z) * 2, z]);
      if (!(this.area === 'woods' && Math.abs(z) < 2.6)) edge.push([w / 2 + 1.1 + rnd('rx' + z) * 2, z]);
    }
    for (let x = -w / 2 - 2; x <= w / 2 + 2; x += 3.1) if (!(hill && Math.abs(x) < 2.8)) edge.push([x, d / 2 + 1.4 + rnd('fz' + x) * 1.5]);
    for (const [x, z] of edge) {
      const k = rnd(`t:${this.area}:${x.toFixed(1)}:${z.toFixed(1)}`);
      const pine = hill ? k < 0.72 : k < 0.35;
      this.placeModel(pine ? 'smallPine' : 'broadleafTree', x, z, pine ? 2 + k * 1.2 : 1.9 + k, k * 6.28);
    }
    // Colliders: boulders (hill) and old trees (woods).
    for (const c of r.colliders) {
      if (c.shape !== 'circle') continue;
      if (hill) this.placeModel('graniteBoulder', c.x, c.z, c.r * 2.1, rnd('b' + c.x) * 6.28, 'boulder');
      else this.placeModel('broadleafTree', c.x, c.z, 2.3 + c.r * 0.6, rnd('w' + c.x) * 6.28, 'old-tree');
    }
    // Grass tufts and rocks for texture.
    for (let i = 0; i < (hill ? 26 : 20); i++) {
      const x = (rnd(`gx${i}${this.area}`) - 0.5) * (w - 3),
        z = (rnd(`gz${i}${this.area}`) - 0.5) * (d - 3);
      if (Math.abs(x) < 1.8 && z > 3) continue;
      this.placeModel(i % 5 === 0 ? 'valleyRocks' : 'meadowGrass', x, z, i % 5 === 0 ? 0.7 : 1.3, rnd('gr' + i) * 6.28, 'tuft');
    }
    if (hill) {
      this.buildCave();
      this.buildSign(0.2 + 1.6, d / 2 - 1.6, '마을');
      this.buildLog();
      this.buildSign(HILL_LOG.x + 1.6, HILL_LOG.z - 2.8, '숲');
      // The log's root walls on each side.
      for (const zc of [-7.4, 3.4]) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8, 0), mat('#6f6a5f'));
        rock.scale.set(0.9, 0.62, 1.8);
        rock.position.set(-27, 0.5, zc);
        this.root.add(shadowed(rock));
        this.disposables.push(rock.geometry, rock.material as THREE.Material);
      }
    } else {
      this.buildSign(w / 2 - 1.2, -1.8, '뒷산');
    }
  }
  private buildSign(x: number, z: number, _to: string) {
    const wood = mat('#8a6440');
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.3, 0.14), wood);
    post.position.set(x, 0.65, z);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.34, 0.06), mat('#c49a62'));
    board.position.set(x, 1.12, z + 0.08);
    this.root.add(shadowed(post), shadowed(board));
    this.disposables.push(post.geometry, board.geometry, wood, board.material as THREE.Material);
  }
  private buildCave() {
    const g = new THREE.Group();
    g.name = 'bear-cave';
    const stone = mat('#7c776c'),
      dark = new THREE.MeshBasicMaterial({ color: '#120d0a' }),
      timber = mat('#6d4a2c');
    const lumps: [number, number, number, number, number][] = [
      [0, 1.6, -2.2, 3.2, 1.4],
      [-3.2, 1.1, -2, 2.4, 1.2],
      [3.4, 1.2, -2.1, 2.5, 1.2],
      [-1.6, 2.6, -2.6, 2.2, 1],
      [1.8, 2.5, -2.7, 2.1, 1],
    ];
    for (const [x, y, z, r, sq] of lumps) {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), stone);
      m.scale.set(1, sq, 0.8);
      m.position.set(x, y, z);
      m.rotation.y = x;
      g.add(m);
      this.disposables.push(m.geometry);
    }
    // The mouth: a dark arch facing the camera, framed with mine timbers.
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(1.25, 24, 0, Math.PI), dark);
    mouth.scale.set(1, 1.35, 1);
    mouth.position.set(0, 0.02, -0.55);
    g.add(mouth);
    for (const x of [-1.25, 1.25]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 0.2), timber);
      post.position.set(x, 0.9, -0.45);
      g.add(post);
      this.disposables.push(post.geometry);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.24, 0.24), timber);
    beam.position.set(0, 1.84, -0.45);
    g.add(beam);
    // A little mine cart rail stub.
    for (const x of [-0.35, 0.35]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 2.2), mat('#5b5b60', { metalness: 0.5, roughness: 0.5 }));
      rail.position.set(x, 0.04, 0.6);
      g.add(rail);
      this.disposables.push(rail.geometry, rail.material as THREE.Material);
    }
    this.disposables.push(mouth.geometry, beam.geometry, stone, dark, timber);
    g.position.set(HILL_CAVE.x, 0, HILL_CAVE.z + 0.6);
    this.root.add(shadowed(g));
    // The lantern by the mouth.
    const lamp = new THREE.PointLight('#ffb35a', 0.9, 6, 2);
    lamp.position.set(HILL_CAVE.x + 1.6, 1.6, HILL_CAVE.z + 1.2);
    this.root.add(lamp);
  }
  private buildLog() {
    const bark = mat('#6b4a2f'),
      cut = mat('#caa576');
    const g = new THREE.Group();
    g.name = 'fallen-log';
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, HILL_LOG.d + 1.6, 14), bark);
    trunk.rotation.x = Math.PI / 2;
    trunk.position.y = 0.6;
    const end = new THREE.Mesh(new THREE.CircleGeometry(0.62, 14), cut);
    end.position.set(0, 0.6, (HILL_LOG.d + 1.6) / 2 + 0.01);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.6, 8), bark);
    branch.position.set(0.3, 1.2, -0.6);
    branch.rotation.z = -0.7;
    g.add(trunk, end, branch);
    g.position.set(HILL_LOG.x, 0, HILL_LOG.z);
    this.disposables.push(trunk.geometry, end.geometry, branch.geometry, bark, cut);
    this.log = shadowed(g);
    this.root.add(this.log);
  }

  // ---------------------------------------------------------- mine
  private buildMineShell() {
    const { w, d } = MINE_ROOM;
    this.root.add(this.ground(w + 8, d + 8, '#221a14', -0.02));
  }
  private buildFloor(floor: MineFloor) {
    if (this.floorGroup) {
      this.root.remove(this.floorGroup);
      this.floorGroup.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          for (const x of Array.isArray(m.material) ? m.material : [m.material]) x.dispose();
        }
      });
    }
    this.rocks.clear();
    const g = new THREE.Group();
    g.name = `mine-floor-${floor.floor}`;
    const { w, d } = MINE_ROOM;
    const band = bandOf(floor.floor);
    const tone = ['#6b5a49', '#5c6068', '#4b3f3f', '#43394d'][Math.min(3, Math.floor((band.from - 1) / 5))];
    const rockTone = ['#8a7d6c', '#7b818c', '#6d5a55', '#6a5c78'][Math.min(3, Math.floor((band.from - 1) / 5))];
    const floorMat = mat(tone),
      wallMat = mat('#3b3029'),
      pillarMat = mat('#554536'),
      rockMat = mat(rockTone, { flatShading: true }),
      timber = mat('#6d4a2c');
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    g.add(plane);
    // Walls: back and sides (the front stays open to the camera), rough lumps along them.
    const back = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, 3.2, 0.6), wallMat);
    back.position.set(0, 1.6, -d / 2 - 0.3);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.2, d + 0.6), wallMat);
    left.position.set(-w / 2 - 0.3, 1.1, 0);
    const right = left.clone();
    right.position.x = w / 2 + 0.3;
    g.add(back, left, right);
    for (let i = 0; i < 14; i++) {
      const side = i % 3,
        t = rnd(`wl${floor.floor}:${i}`);
      const lump = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + t * 0.6, 0), pillarMat);
      if (side === 0) lump.position.set(-w / 2 + t * w, 0.3 + t * 0.8, -d / 2 + 0.1);
      else lump.position.set(side === 1 ? -w / 2 + 0.1 : w / 2 - 0.1, 0.3 + t * 0.4, -d / 2 + t * d);
      g.add(lump);
    }
    // Timber frames on the back wall.
    for (const x of [-5.5, 0, 5.5]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.8, 0.22), timber);
      post.position.set(x, 1.4, -d / 2 + 0.05);
      g.add(post);
    }
    for (const p of floor.pillars) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.85, p.r * 1.05, 2.6, 7), pillarMat);
      pillar.position.set(p.x, 1.3, p.z);
      g.add(pillar);
    }
    // Rocks (each an irregular lump; vein rocks glint gold).
    const rockGeo = new THREE.DodecahedronGeometry(0.46, 0);
    for (const r of floor.rocks) {
      const holder = new THREE.Group();
      holder.name = 'mine-rock-' + r.i;
      const lump = new THREE.Mesh(rockGeo, rockMat);
      const t = rnd(`rk${floor.floor}:${r.i}`);
      lump.scale.set(1 + t * 0.3, 0.72 + t * 0.2, 0.95);
      lump.rotation.y = t * 6;
      lump.position.y = 0.3;
      holder.add(lump);
      if (r.vein || t > 0.72) {
        const glint = new THREE.Mesh(MARK_GEO, r.vein ? MARK_MAT.vein : MARK_MAT.rock);
        glint.scale.setScalar(0.55);
        glint.position.set(0.18, 0.62, 0.15);
        holder.add(glint);
      }
      holder.position.set(r.x, 0, r.z);
      g.add(holder);
      this.rocks.set(r.i, holder);
    }
    // The ladder down (shows once enough rocks are broken today).
    const lad = new THREE.Group();
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.62, 20), new THREE.MeshBasicMaterial({ color: '#0b0806' }));
    hole.rotation.x = -Math.PI / 2;
    hole.position.y = 0.015;
    lad.add(hole);
    for (const x of [-0.24, 0.24]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.2, 0.07), timber);
      rail.position.set(x, 0.45, -0.1);
      rail.rotation.x = -0.35;
      lad.add(rail);
    }
    for (let k = 0; k < 4; k++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), timber);
      rung.position.set(0, 0.1 + k * 0.28, 0.05 - k * 0.1);
      lad.add(rung);
    }
    lad.position.set(floor.ladder.x, 0, floor.ladder.z);
    lad.name = 'mine-ladder';
    this.ladderGroup = lad;
    g.add(lad);
    // The ladder up (always) by the entrance.
    const up = new THREE.Group();
    for (const x of [-0.26, 0.26]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 0.08), timber);
      rail.position.set(x, 1.3, 0);
      up.add(rail);
    }
    for (let k = 0; k < 7; k++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.06), timber);
      rung.position.set(0, 0.25 + k * 0.34, 0);
      up.add(rung);
    }
    up.position.set(MINE_ARRIVE.x, 0, d / 2 - 0.15);
    g.add(up);
    // The lift cage (once 광산 승강기 is built).
    const lift = new THREE.Group();
    const iron = mat('#6c6f75', { metalness: 0.6, roughness: 0.45 });
    for (const [x, z] of [
      [-0.6, -0.6],
      [0.6, -0.6],
      [-0.6, 0.6],
      [0.6, 0.6],
    ]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.4, 0.08), iron);
      bar.position.set(x, 1.2, z);
      lift.add(bar);
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 1.3), iron);
    roof.position.y = 2.4;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.3), timber);
    base.position.y = 0.04;
    lift.add(roof, base);
    lift.position.set(MINE_LIFT.x, 0, MINE_LIFT.z);
    lift.name = 'mine-lift';
    this.liftGroup = lift;
    g.add(lift);
    // Lanterns on the back wall.
    for (const x of [-4.5, 4.5]) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffcf7a' }));
      lamp.position.set(x, 2.2, -d / 2 + 0.3);
      g.add(lamp);
      const light = new THREE.PointLight('#ffb35a', 1.4, 9, 1.6);
      light.position.set(x, 2.1, -d / 2 + 0.8);
      g.add(light);
    }
    this.disposables.push(rockGeo);
    shadowed(g);
    plane.castShadow = false;
    this.floorGroup = g;
    this.root.add(g);
  }

  // ---------------------------------------------------------- nodes
  private nodeObject(n: RegionNode) {
    let entry = this.nodes.get(n.id);
    if (entry) return entry;
    const look = NODE_LOOK[n.kind];
    const object = this.placeModel(look.model, n.x, n.z, look.s, rnd(n.id) * 6.28, 'region-node-' + n.id);
    if (n.kind === 'shroom') {
      // Mushroom caps on the log.
      const cap = mat('#b5553c'),
        stem = mat('#efe2c8');
      for (let k = 0; k < 3; k++) {
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.18, 8), stem);
        const c = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), cap);
        const x = n.x - 0.4 + k * 0.4,
          z = n.z + 0.2 - k * 0.12;
        s.position.set(x, 0.95, z);
        c.position.set(x, 1.03, z);
        object.userData.extra = [...(object.userData.extra ?? []), s, c];
        this.root.add(s, c);
        this.disposables.push(s.geometry, c.geometry);
      }
      this.disposables.push(cap, stem);
    }
    const size = VALLEY_MODEL_SIZE[look.model];
    const mark = new THREE.Mesh(MARK_GEO, n.kind === 'rock' ? MARK_MAT.rock : n.kind === 'shroom' ? MARK_MAT.shroom : MARK_MAT.wood);
    mark.position.set(n.x, size.h * look.s + 0.55, n.z);
    mark.scale.set(1, 1.5, 1);
    this.root.add(mark);
    entry = { object, mark };
    this.nodes.set(n.id, entry);
    return entry;
  }

  update(u: RegionUpdate) {
    this.state = u;
    const up = new Set(u.nodes.filter((n) => !n.taken).map((n) => n.id));
    for (const n of u.nodes) this.nodeObject(n);
    for (const [id, e] of this.nodes) {
      const on = up.has(id);
      e.object.visible = on;
      e.mark.visible = on;
      for (const x of (e.object.userData.extra ?? []) as THREE.Object3D[]) x.visible = on;
    }
    if (this.log) this.log.visible = !u.logCleared;
    if (this.area === 'mine' && u.floor) {
      const key = JSON.stringify([u.floor.floor, u.floor.template, u.floor.mirror, u.floor.rocks.length, u.floor.ladder]);
      if (key !== this.floorKey) {
        this.floorKey = key;
        this.buildFloor(u.floor);
      }
      const broken = new Set(u.broken ?? []);
      for (const [i, r] of this.rocks) r.visible = !broken.has(i);
      if (this.ladderGroup) this.ladderGroup.visible = !!u.ladder;
      if (this.liftGroup) this.liftGroup.visible = !!u.lift;
    }
  }
  /** Marks bob a little. */
  tick(t: number) {
    const y = Math.sin(t / 420) * 0.08;
    for (const e of this.nodes.values()) if (e.mark.visible) e.mark.position.y = (e.mark.userData.y0 ??= e.mark.position.y) + y;
  }
  dispose() {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    if (this.floorGroup)
      this.floorGroup.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) m.geometry.dispose();
      });
  }
  current() {
    return this.state;
  }
}
