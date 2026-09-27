import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LOUNGE_MODELS, TAVERN_MODELS } from './lounge-model-assets';

/** kArchive furniture is reused here with fitted scale; source credits stay with each GLB. */
const MODELS = {
  vanity: TAVERN_MODELS.teaSideboard, chair: LOUNGE_MODELS.banquetChair,
  reception: TAVERN_MODELS.barCounter, sofa: LOUNGE_MODELS.sofa,
  wardrobe: TAVERN_MODELS.cornerCabinet, shelf: LOUNGE_MODELS.archiveBookcase,
  bell: LOUNGE_MODELS.serviceBell, plant: LOUNGE_MODELS.plantStand,
} as const;
type Place = { x: number; z: number; w: number; h: number; d: number; turn?: number; y?: number };
const PLACES: Record<keyof typeof MODELS, readonly Place[]> = {
  vanity: [-1.4, 2.2].map(x => ({ x, z: -4.1, w: 2.1, h: .85, d: .85 })),
  chair: [-1.4, 2.2].map(x => ({ x, z: -2.4, w: .9, h: 1.05, d: .9, turn: Math.PI })),
  reception: [{ x: -5, z: -1.5, w: 2.1, h: 1, d: .95 }],
  sofa: [{ x: 5.8, z: 2.3, w: 2.7, h: 1.25, d: 1.1, turn: -Math.PI / 2 }],
  wardrobe: [{ x: -6.6, z: -4.3, w: 1.35, h: 2.15, d: .75 }],
  shelf: [{ x: 6, z: -4.3, w: 1.4, h: 1.8, d: .75 }],
  bell: [{ x: -4.75, z: -1.4, w: .2, h: .16, d: .2, y: 1.015 }],
  plant: [{ x: 7.8, z: -.6, w: .8, h: 1.4, d: .55 }],
};

export function buildSalon(parent: THREE.Group, changed: () => void) {
  const group = new THREE.Group(); group.name = 'karchive-salon'; parent.add(group);
  const resources = new Set<{ dispose(): void }>();
  let disposed = false, loadedCount = 0;
  const own = (object: THREE.Object3D, target = resources) => object.traverse(child => {
    const mesh = child as THREE.Mesh; if (!mesh.isMesh) return;
    target.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      target.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) target.add(value);
    }
  });
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: .78 }));
    mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh); own(mesh); return mesh;
  };
  const fallback: Partial<Record<keyof typeof MODELS, THREE.Object3D[]>> = {
    vanity: [-1.4, 2.2].map(x => box(2.1, .8, .85, x, .4, -4.1, '#a78a68')),
    chair: [-1.4, 2.2].map(x => box(.85, .55, .85, x, .275, -2.4, '#ac6870')),
    reception: [box(2.1, 1, .95, -5, .5, -1.5, '#997450')],
    sofa: [box(1.1, .6, 2.7, 5.8, .3, 2.3, '#92a59a')],
    wardrobe: [box(1.35, 2.15, .75, -6.6, 1.075, -4.3, '#a68a65')],
    shelf: [box(1.4, 1.8, .75, 6, .9, -4.3, '#997750')],
  };
  // Static mirror artwork avoids an expensive second render of the room.
  const canvas = document.createElement('canvas'); canvas.width = 192; canvas.height = 256;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 192, 256);
    gradient.addColorStop(0, '#d6e3df'); gradient.addColorStop(.5, '#f0ede1'); gradient.addColorStop(1, '#b8cecb');
    context.fillStyle = gradient; context.fillRect(0, 0, 192, 256);
    context.fillStyle = '#ffffff55'; context.beginPath(); context.moveTo(0, 92); context.lineTo(192, 0); context.lineTo(192, 42); context.lineTo(0, 156); context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; resources.add(texture);
  for (const x of [-1.4, 2.2]) {
    box(1.56, 1.85, .12, x, 1.84, -5.47, '#bd995e');
    const mirror = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 1.71), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
    mirror.position.set(x, 1.84, -5.397); group.add(mirror); own(mirror);
    // Small bottles sit on the vanity, not in the walking path.
    for (let i = 0; i < 3; i++) {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(.045, .05, .18 + i * .02, 10), new THREE.MeshStandardMaterial({ color: ['#799f99', '#c99b9c', '#ead2a7'][i] }));
      bottle.position.set(x + .6 + i * .13, .94 + i * .01, -4.2); group.add(bottle); own(bottle);
    }
    box(1.6, .012, 1.4, x, .017, -2.4, '#e5c1b8');
  }
  box(2.1, .045, .96, -5, 1.01, -1.5, '#eadac4');
  const loader = new GLTFLoader();
  for (const [key, url] of Object.entries(MODELS) as [keyof typeof MODELS, string][]) {
    void loader.loadAsync(url).then(({ scene }) => {
      if (disposed) { const owned = new Set<{ dispose(): void }>(); own(scene, owned); for (const resource of owned) resource.dispose(); return; }
      own(scene);
      const bounds = new THREE.Box3().setFromObject(scene), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
      for (const p of PLACES[key]) {
        const holder = new THREE.Group(), model = scene.clone(true);
        model.position.set(-center.x, -bounds.min.y, -center.z); holder.add(model);
        holder.scale.setScalar(Math.min(p.w / size.x, p.h / size.y, p.d / size.z));
        holder.rotation.y = p.turn ?? 0; holder.position.set(p.x, p.y ?? 0, p.z);
        holder.traverse(child => { const mesh = child as THREE.Mesh; if (mesh.isMesh) mesh.castShadow = mesh.receiveShadow = true; });
        group.add(holder);
      }
      for (const object of fallback[key] ?? []) object.visible = false;
      loadedCount++; changed();
    }).catch(() => { /* Keep the matching furniture stand-in if a request fails. */ });
  }
  return {
    loaded: () => loadedCount,
    dispose() { disposed = true; parent.remove(group); for (const resource of resources) resource.dispose(); },
  };
}
