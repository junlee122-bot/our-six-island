// 성장 P1 in the village (three.js): the blacksmith (kArchive community
// workshop; its ruined twin stands on the same lot until 마을 개척 “대장간
// 재건” is done) with a hanging sign and a glowing forge mouth, and today's
// material nodes at the village edge (shrub → 잡목, firewood → 통나무 더미,
// granite boulder → 바위, the valley set's models). Nodes have no collider;
// a broken one hides until tomorrow. Placement: KARCHIVE_FORGE and
// lounge-growth-data NODE_SPOTS.
import * as THREE from 'three';
import { LOUNGE_MODELS, VALLEY_MODELS } from './lounge-model-assets';
import { KARCHIVE_FORGE } from './lounge-village-karchive-layout';
import { VALLEY_MODEL_SIZE } from './lounge-village-layout';
import { NODE_SPOTS, type NodeKind } from './lounge-growth-data';

type Loader = (url: string) => Promise<THREE.Group>;
const GROUND_Y = 0.03;
/** Node look per kind: which valley model, its scale and a per-spot turn. */
const NODE_LOOK: Record<NodeKind, { model: 'shrub' | 'firewood' | 'graniteBoulder'; s: number }> = {
  bush: { model: 'shrub', s: 1.45 },
  log: { model: 'firewood', s: 0.55 },
  rock: { model: 'graniteBoulder', s: 1.05 },
};
const hashTurn = (id: string) => {
  let h = 7;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 628) / 100;
};
export type GrowthUpdate = {
  forgeOpen: boolean;
  /** A tool is waiting at the forge (the chimney glows). */
  forgeReady: boolean;
  nodes: readonly { id: string; kind: NodeKind; taken: boolean }[];
};

function shadowed(object: THREE.Object3D) {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) child.castShadow = child.receiveShadow = true;
  });
  return object;
}

export class VillageGrowthLayer {
  readonly root = new THREE.Group();
  private workshop: THREE.Object3D | null = null;
  private ruin: THREE.Object3D | null = null;
  private site: THREE.Group;
  private glow: THREE.Mesh;
  private nodes = new Map<string, THREE.Object3D>();
  private sources: Partial<Record<NodeKind, THREE.Group>> = {};
  private state: GrowthUpdate = { forgeOpen: false, forgeReady: false, nodes: [] };
  private lastKey = '';

  constructor(scene: THREE.Object3D) {
    this.root.name = 'village-growth';
    scene.add(this.root);
    // Until the models load: a low stone footing and a timber frame on the lot.
    this.site = new THREE.Group();
    this.site.name = 'forge-site';
    const f = KARCHIVE_FORGE;
    const footing = new THREE.Mesh(
      new THREE.BoxGeometry(f.w, 0.22, f.d),
      new THREE.MeshStandardMaterial({ color: '#8d8a82', roughness: 0.95 }),
    );
    footing.position.set(f.x, 0.11, f.z);
    this.site.add(shadowed(footing));
    // The forge mouth: a warm glow at the door once it is rebuilt.
    this.glow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.55),
      new THREE.MeshBasicMaterial({ color: '#ff9a3c', transparent: true, opacity: 0.55, depthWrite: false }),
    );
    this.glow.position.set(f.x + 0.55, 0.45, f.z + f.d / 2 - 0.2);
    this.glow.visible = false;
    this.root.add(this.site, this.glow);
  }

  /** Starts the downloads; each promise settles once its model is placed. */
  load(load: Loader, placedOne: (id: string) => void): Promise<void>[] {
    const f = KARCHIVE_FORGE;
    const place = (source: THREE.Group, name: string) => {
      const holder = new THREE.Group();
      holder.name = name;
      holder.add(source.clone(true));
      holder.scale.setScalar(f.scale);
      holder.position.set(f.x, GROUND_Y, f.z);
      return shadowed(holder);
    };
    const jobs = [
      load(LOUNGE_MODELS.forgeWorkshop).then((s) => {
        this.workshop = place(s, 'forge-workshop');
        this.root.add(this.workshop);
        this.apply(true);
        placedOne('growthForge');
      }),
      load(LOUNGE_MODELS.forgeRuin).then((s) => {
        this.ruin = place(s, 'forge-ruin');
        this.root.add(this.ruin);
        this.apply(true);
        placedOne('growthForgeRuin');
      }),
      ...(Object.keys(NODE_LOOK) as NodeKind[]).map((kind) =>
        load(VALLEY_MODELS[NODE_LOOK[kind].model]).then((s) => {
          this.sources[kind] = s;
          this.apply(true);
          placedOne('growthNode' + kind[0].toUpperCase() + kind.slice(1));
        }),
      ),
    ];
    return jobs;
  }

  /** Today's nodes and the forge state; true when something visible changed. */
  update(u: GrowthUpdate) {
    this.state = u;
    return this.apply(false);
  }

  private nodeObject(id: string, kind: NodeKind) {
    let object = this.nodes.get(id);
    const source = this.sources[kind];
    if (object || !source) return object ?? null;
    const spot = NODE_SPOTS.find((n) => n.id === id);
    if (!spot) return null;
    const look = NODE_LOOK[kind],
      size = VALLEY_MODEL_SIZE[look.model];
    object = new THREE.Group();
    object.name = 'growth-node-' + id;
    object.add(source.clone(true));
    object.scale.setScalar(look.s);
    object.position.set(spot.x, GROUND_Y - size.y0 * look.s, spot.z);
    object.rotation.y = hashTurn(id);
    shadowed(object);
    this.root.add(object);
    this.nodes.set(id, object);
    return object;
  }

  private apply(force: boolean) {
    const u = this.state;
    const key = JSON.stringify([
      u.forgeOpen,
      u.forgeReady,
      u.nodes.map((n) => n.id + (n.taken ? '-' : '+')),
      !!this.workshop,
      !!this.ruin,
      Object.keys(this.sources).length,
    ]);
    if (!force && key === this.lastKey) return false;
    this.lastKey = key;
    if (this.workshop) this.workshop.visible = u.forgeOpen;
    if (this.ruin) this.ruin.visible = !u.forgeOpen;
    this.site.visible = !(u.forgeOpen ? this.workshop : this.ruin);
    this.glow.visible = u.forgeOpen && !!this.workshop;
    (this.glow.material as THREE.MeshBasicMaterial).opacity = u.forgeReady ? 0.85 : 0.5;
    const up = new Set(u.nodes.filter((n) => !n.taken).map((n) => n.id));
    for (const n of u.nodes) this.nodeObject(n.id, n.kind);
    for (const [id, object] of this.nodes) object.visible = up.has(id);
    return true;
  }
}
