// VILL-2 valley set in the village (three.js): the kArchive yard props (pump,
// gate, 장독대, firewood, crate, shed, scarecrow), the fishing-spot props, the
// nature filler, the stone-wall alley, pavers and the 팔각정. Placement and
// colliders: VILLAGE_VALLEY_PROPS in lounge-village-layout.ts; sources:
// public/models/village/valley/assets.json.
//
// Memory: every model is one mesh with one baked texture, so a kind costs one
// texture however often it repeats. Repeated props are one InstancedMesh per
// kind; props that depend on a friend's farm size are separate objects that
// toggle. Fishing-spot props (falls, lake, rapids, rocks, harbor, bridge, sea)
// load only when the player first comes near that spot.
import * as THREE from 'three';
import { VALLEY_MODELS } from './lounge-model-assets';
import {
  VALLEY_CHAIR_OFFSET,
  VALLEY_MODEL_SIZE,
  VILLAGE_FALLS,
  VILLAGE_HARBOR,
  VILLAGE_LAKE,
  VILLAGE_PIER,
  VILLAGE_RAPIDS,
  VILLAGE_RIVER,
  VILLAGE_ROCKS,
  VILLAGE_VALLEY_PROPS,
  type ValleyModelKey,
  type ValleyProp,
  type ValleyZone,
  type VillagePoint,
} from './lounge-village-layout';
import { FISH_STAND, bobberPoint } from './lounge-village-spots';
import type { Spot } from './lounge-items';
import type { Season } from './lounge-calendar';

type Loader = (url: string) => Promise<THREE.Group>;
const GROUND_Y = 0.03;
/** Zone props load once the player is this close to the zone's centre. */
const ZONE_REACH = 24;
const RIVER_MID = (VILLAGE_RIVER.minZ + VILLAGE_RIVER.maxZ) / 2;
const ZONE_CENTER: Record<Exclude<ValleyZone, 'village'>, VillagePoint> = {
  falls: { x: VILLAGE_FALLS.x, z: VILLAGE_FALLS.z },
  lake: { x: VILLAGE_LAKE.x, z: VILLAGE_LAKE.z },
  rapids: { x: (VILLAGE_RAPIDS.x0 + VILLAGE_RAPIDS.x1) / 2, z: RIVER_MID },
  rocks: { x: VILLAGE_ROCKS.x, z: VILLAGE_ROCKS.z },
  harbor: { x: VILLAGE_HARBOR.x, z: VILLAGE_HARBOR.z },
  bridge: { x: 0, z: RIVER_MID },
  sea: { x: VILLAGE_PIER.x, z: VILLAGE_PIER.z },
};

/** Camp chairs beside the new stands and the pier, turned toward the water. */
const CHAIRS: ValleyProp[] = (['rapids', 'falls', 'lake', 'rocks', 'harbor', 'sea'] as const satisfies readonly Spot[]).map(
  (spot) => {
    const stand = FISH_STAND[spot],
      bob = bobberPoint(spot, stand);
    const x = stand.x + VALLEY_CHAIR_OFFSET.x,
      z = stand.z + VALLEY_CHAIR_OFFSET.z;
    return {
      model: 'campChair',
      x,
      z,
      s: 0.85,
      rot: Math.atan2(bob.x - x, bob.z - z),
      y: spot === 'harbor' || spot === 'sea' ? 0.3 : 0,
      zone: spot,
    };
  },
);
const ALL_PROPS: readonly ValleyProp[] = [...VILLAGE_VALLEY_PROPS.filter((p) => p.s !== 0), ...CHAIRS];

function matrixOf(p: ValleyProp) {
  const size = VALLEY_MODEL_SIZE[p.model];
  const s = typeof p.s === 'number' ? [p.s, p.s, p.s] : p.s;
  return new THREE.Matrix4().compose(
    new THREE.Vector3(p.x, GROUND_Y + (p.y ?? 0) - size.y0 * s[1], p.z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rot ?? 0),
    new THREE.Vector3(s[0], s[1], s[2]),
  );
}
const tmp = new THREE.Matrix4();
/** Every copy of one kind as one InstancedMesh per mesh (one draw call each). */
function instanced(source: THREE.Group, props: readonly ValleyProp[], name: string, shadows: boolean) {
  const group = new THREE.Group();
  group.name = name;
  source.updateMatrixWorld(true);
  const matrices = props.map(matrixOf);
  source.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const batch = new THREE.InstancedMesh(mesh.geometry, mesh.material, matrices.length);
    matrices.forEach((m, i) => batch.setMatrixAt(i, tmp.multiplyMatrices(m, mesh.matrixWorld)));
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
    batch.castShadow = shadows;
    batch.receiveShadow = true;
    group.add(batch);
  });
  return group;
}
function single(source: THREE.Group, p: ValleyProp, name: string) {
  const holder = new THREE.Group();
  holder.name = name;
  holder.add(source.clone(true));
  holder.applyMatrix4(matrixOf(p));
  holder.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) child.castShadow = child.receiveShadow = true;
  });
  return holder;
}
/** Flat or tiny props do not cast shadows (saves shadow-map draw calls). */
const NO_SHADOW = new Set<ValleyModelKey>(['stonePaver', 'meadowGrass', 'onggi', 'produceCrate']);

export type ValleyUpdate = {
  /** Plots per friend (6 / 9 / 12). */
  plots: Record<number, number>;
  season?: Season | null;
};
/**
 * Seasonal tint multiplied over the baked foliage texture, so the kArchive
 * trees follow the procedural ones (gold in autumn, frosted in winter).
 */
type Tint = { color: string; glow: string; glowIntensity: number };
const AUTUMN: Tint = { color: '#ffcf6a', glow: '#7a4410', glowIntensity: 0.28 };
const FROST: Tint = { color: '#b9c2c4', glow: '#e4ecf0', glowIntensity: 0.42 };
const FOLIAGE_TINT: Partial<Record<ValleyModelKey, Partial<Record<Season, Tint>>>> = {
  broadleafTree: { autumn: AUTUMN, winter: FROST },
  shrub: { autumn: AUTUMN, winter: FROST },
  meadowGrass: { autumn: AUTUMN, winter: FROST },
  smallPine: { winter: { ...FROST, glowIntensity: 0.3 } },
};

export class VillageValleyLayer {
  readonly root = new THREE.Group();
  private scene: THREE.Object3D;
  private load: Loader | null = null;
  private placedOne: ((id: string) => void) | null = null;
  private zonesLoaded = new Set<ValleyZone>();
  /** Size-gated yard props: [object, actor, plots needed]. */
  private gated: [THREE.Object3D, number, number][] = [];
  private plots: Record<number, number> = {};
  private lanterns: THREE.MeshStandardMaterial[] = [];
  private night = 0;
  private textures = new Map<string, number>();
  private foliage = new Map<ValleyModelKey, THREE.MeshStandardMaterial[]>();
  private season: Season | null = null;
  constructor(scene: THREE.Object3D) {
    this.scene = scene;
    this.root.name = 'village-valley';
    scene.add(this.root);
  }

  /** Village-wide props start loading now; zone props wait for `near`. */
  loadAll(load: Loader, placedOne: (id: string) => void): Promise<void>[] {
    this.load = load;
    this.placedOne = placedOne;
    return this.loadZone('village');
  }

  private loadZone(zone: ValleyZone): Promise<void>[] {
    if (!this.load || this.zonesLoaded.has(zone)) return [];
    this.zonesLoaded.add(zone);
    const props = ALL_PROPS.filter((p) => p.zone === zone);
    const kinds = [...new Set(props.map((p) => p.model))];
    const load = this.load;
    return kinds.map((model) =>
      load(VALLEY_MODELS[model]).then((source) => {
        const mine = props.filter((p) => p.model === model);
        const fixed = mine.filter((p) => !p.yard),
          gated = mine.filter((p) => p.yard);
        if (fixed.length)
          this.root.add(instanced(source, fixed, `valley-${zone}-${model}`, !NO_SHADOW.has(model)));
        for (const [i, p] of gated.entries()) {
          const object = single(source, p, `valley-${model}-${p.yard!.actor}-${i}`);
          object.visible = (this.plots[p.yard!.actor] ?? 6) >= p.yard!.plots;
          this.gated.push([object, p.yard!.actor, p.yard!.plots]);
          this.root.add(object);
        }
        if (model === 'hanjiLantern') this.litLanterns();
        if (FOLIAGE_TINT[model]) {
          const mats: THREE.MeshStandardMaterial[] = [];
          source.traverse((child) => {
            const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
            if ((child as THREE.Mesh).isMesh && m && !mats.includes(m)) mats.push(m);
          });
          this.foliage.set(model, mats);
          this.tint(model);
        }
        if (model === 'waterPump') {
          // The pump stands where the primitive well was; the well's collider stays.
          const wells = this.scene.getObjectByName('village-yard-wells');
          if (wells) wells.visible = false;
        }
        this.countTexture(model, source);
        this.placedOne?.(`valley${model[0].toUpperCase()}${model.slice(1)}${zone === 'village' ? '' : zone[0].toUpperCase() + zone.slice(1)}`);
      }),
    );
  }

  private countTexture(model: string, source: THREE.Group) {
    if (this.textures.has(model)) return;
    let bytes = 0;
    source.traverse((child) => {
      const map = ((child as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined)?.map;
      const image = map?.image as { width?: number; height?: number } | undefined;
      if (image?.width && image.height) bytes += (image.width * image.height * 4 * 4) / 3;
    });
    this.textures.set(model, bytes);
  }
  /** GPU texture memory of the loaded valley kinds (RGBA + mips), bytes. */
  textureBytes() {
    let sum = 0;
    for (const n of this.textures.values()) sum += n;
    return sum;
  }
  loadedKinds() {
    return this.textures.size;
  }

  private litLanterns() {
    this.root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.parent?.name.includes('hanjiLantern')) return;
      const m = (mesh.material as THREE.MeshStandardMaterial).clone();
      m.emissive = new THREE.Color('#ffc46b');
      m.emissiveMap = m.map;
      m.emissiveIntensity = this.night * 0.9;
      mesh.material = m;
      this.lanterns.push(m);
    });
  }

  /** Loads the fishing-spot props the player comes near; returns the new jobs. */
  near(point: VillagePoint): Promise<void>[] {
    const jobs: Promise<void>[] = [];
    for (const [zone, c] of Object.entries(ZONE_CENTER) as [Exclude<ValleyZone, 'village'>, VillagePoint][])
      if (!this.zonesLoaded.has(zone) && Math.hypot(point.x - c.x, point.z - c.z) < ZONE_REACH)
        jobs.push(...this.loadZone(zone));
    return jobs;
  }

  private tint(model: ValleyModelKey) {
    const t = this.season ? FOLIAGE_TINT[model]?.[this.season] : undefined;
    for (const m of this.foliage.get(model) ?? []) {
      m.color.set(t?.color ?? '#ffffff');
      m.emissive.set(t?.glow ?? '#000000');
      m.emissiveIntensity = t?.glowIntensity ?? 0;
    }
  }

  /** Farm sizes decide which yard props show; true when something changed. */
  update(u: ValleyUpdate) {
    this.plots = u.plots;
    let changed = false;
    if (u.season !== undefined && u.season !== this.season) {
      this.season = u.season;
      for (const model of this.foliage.keys()) this.tint(model);
      changed = true;
    }
    for (const [object, actor, need] of this.gated) {
      const show = (u.plots[actor] ?? 6) >= need;
      if (object.visible !== show) {
        object.visible = show;
        changed = true;
      }
    }
    return changed;
  }

  /** 0 = day, 1 = night: the harbor's paper lanterns glow. */
  setNight(level: number) {
    this.night = level;
    for (const m of this.lanterns) m.emissiveIntensity = level * 0.9;
  }
}
