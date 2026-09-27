import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LOUNGE_MODELS, TAVERN_MODELS } from './lounge-model-assets';

/** Existing credited kArchive models, reused as a quiet neighbourhood bank. */
const BANK_MODELS = {
  counter: TAVERN_MODELS.barCounter,
  bookcase: LOUNGE_MODELS.archiveBookcase,
  sofa: LOUNGE_MODELS.sofa,
  teaTable: LOUNGE_MODELS.teaTable,
  plants: LOUNGE_MODELS.plantStand,
  bell: LOUNGE_MODELS.serviceBell,
  calendar: LOUNGE_MODELS.deskCalendar,
} as const;

type Placement = { x: number; z: number; width: number; height: number; depth: number; turn?: number; y?: number };
const PLACES: Record<keyof typeof BANK_MODELS, readonly Placement[]> = {
  counter: [
    { x: -1.005, z: -2.2, width: 2.01, height: 1, depth: .88 },
    { x: 1.005, z: -2.2, width: 2.01, height: 1, depth: .88 },
  ],
  bookcase: [{ x: -5.3, z: -4.3, width: 1.95, height: 2.1, depth: .85 }],
  sofa: [{ x: 6.4, z: 1.2, width: 2.7, height: 1.35, depth: 1.1, turn: -Math.PI / 2 }],
  teaTable: [{ x: 4.3, z: 1.2, width: 1.2, height: .65, depth: 1.2 }],
  plants: [
    { x: -5.5, z: 0, width: 1.65, height: 1.7, depth: .65 },
    { x: 6.8, z: -4.8, width: 1.35, height: 1.5, depth: .65 },
  ],
  bell: [{ x: -.65, z: -2.08, width: .2, height: .18, depth: .2, y: 1.015 }],
  calendar: [{ x: 1.18, z: -2.3, width: .3, height: .25, depth: .22, y: 1.015 }],
};

export function buildBank(parent: THREE.Group, changed: () => void) {
  const group = new THREE.Group(); group.name = 'karchive-bank'; parent.add(group);
  let disposed = false, loadedCount = 0;
  const geometry = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  const own = (object: THREE.Object3D) => object.traverse(child => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    geometry.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: .82 }));
    mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh); own(mesh); return mesh;
  };
  // Every floor stand-in has the same footprint as its kArchive replacement.
  const standins: Partial<Record<keyof typeof BANK_MODELS, THREE.Object3D[]>> = {
    counter: [box(4.02, .96, .88, 0, .48, -2.2, '#8e6745')],
    bookcase: [box(1.95, 2.1, .85, -5.3, 1.05, -4.3, '#86694e')],
    sofa: [box(1.1, .65, 2.7, 6.4, .325, 1.2, '#487368')],
    teaTable: [box(1.2, .6, 1.2, 4.3, .3, 1.2, '#a98a61')],
    plants: [box(1.65, .32, .65, -5.5, .16, 0, '#8d7550')],
  };
  // A cream counter cap, a brass kick plate and a runner make the queue legible.
  box(4.12, .055, .94, 0, 1.005, -2.2, '#e3d4b8');
  box(3.9, .06, .025, 0, .09, -1.749, '#ba9b56');
  box(2.4, .012, 3.15, 0, .015, .13, '#71958a');
  for (const z of [-.7, .4, 1.5]) box(.46, .014, .035, 0, .024, z, '#eadbbe');
  // Framed bank seal and a wall clock; no extra floor obstacle.
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(.37, .37, .08, 40), new THREE.MeshStandardMaterial({ color: '#f2e9d2' }));
  clock.rotation.x = Math.PI / 2; clock.position.set(5.3, 2.2, -5.86); group.add(clock); own(clock);
  box(.025, .23, .025, 5.3, 2.29, -5.81, '#5a4937');
  box(.18, .025, .025, 5.375, 2.2, -5.8, '#5a4937');
  const loader = new GLTFLoader();
  for (const [key, url] of Object.entries(BANK_MODELS) as [keyof typeof BANK_MODELS, string][]) {
    void loader.loadAsync(url).then(({ scene }) => {
      if (disposed) {
        scene.traverse(child => {
          const mesh = child as THREE.Mesh; if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose();
            m.dispose();
          }
        });
        return;
      }
      own(scene);
      const bounds = new THREE.Box3().setFromObject(scene), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
      for (const p of PLACES[key]) {
        const holder = new THREE.Group(), model = scene.clone(true);
        const scale = Math.min(p.width / size.x, p.height / size.y, p.depth / size.z);
        model.position.set(-center.x, -bounds.min.y, -center.z);
        holder.add(model); holder.scale.setScalar(scale); holder.rotation.y = p.turn ?? 0;
        holder.position.set(p.x, p.y ?? 0, p.z);
        holder.traverse(child => { const mesh = child as THREE.Mesh; if (mesh.isMesh) mesh.castShadow = mesh.receiveShadow = true; });
        group.add(holder);
      }
      for (const object of standins[key] ?? []) object.visible = false;
      loadedCount++; changed();
    }).catch(() => { /* Solid stand-ins retain the visible furniture footprint. */ });
  }
  return {
    loaded: () => loadedCount,
    dispose() {
      disposed = true; parent.remove(group);
      for (const resource of [...geometry, ...materials, ...textures]) resource.dispose();
    },
  };
}
