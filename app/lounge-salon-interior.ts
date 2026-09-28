import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LOUNGE_MODELS, TAVERN_MODELS } from './lounge-model-assets';
import { SALON_FLOOR_PROPS as FLOOR } from './lounge-salon-layout';

/** kArchive furniture is reused here with fitted scale; source credits stay with each GLB. */
const MODELS = {
  vanity: TAVERN_MODELS.teaSideboard, chair: LOUNGE_MODELS.banquetChair,
  reception: TAVERN_MODELS.barCounter, sofa: LOUNGE_MODELS.sofa,
  wardrobe: TAVERN_MODELS.cornerCabinet, shelf: LOUNGE_MODELS.archiveBookcase,
  bell: LOUNGE_MODELS.serviceBell, plant: LOUNGE_MODELS.plantStand,
  teaTable: LOUNGE_MODELS.teaTable, coatStand: TAVERN_MODELS.coatStand,
  lamp: TAVERN_MODELS.floorLamp, wallShelf: TAVERN_MODELS.wallShelf,
  flowers: LOUNGE_MODELS.tulips, calendar: LOUNGE_MODELS.deskCalendar,
} as const;
export const SALON_MODEL_COUNT = Object.keys(MODELS).length;
type Place = { x: number; z: number; w: number; h: number; d: number; turn?: number; y?: number };
const PLACES: Record<keyof typeof MODELS, readonly Place[]> = {
  vanity: [-1.4, 2.2].map(x => ({ x, z: -4.1, w: 2.1, h: .85, d: .85 })),
  chair: [
    ...[-1.4, 2.2].map(x => ({ x, z: -2.4, w: .9, h: 1.05, d: .9, turn: Math.PI })),
    ...[FLOOR.washLeft, FLOOR.washRight].map(p => ({ x: p.x, z: p.z + .7, w: 1, h: 1.08, d: 1, turn: Math.PI })),
  ],
  reception: [{ x: -5, z: -1.5, w: 2.1, h: 1, d: .95 }],
  sofa: [{ ...FLOOR.waitingSofa, h: 1.25, turn: Math.PI }],
  wardrobe: [{ x: -6.6, z: -4.3, w: 1.35, h: 2.15, d: .75 }],
  shelf: [{ x: 6, z: -4.3, w: 1.7, h: 1.8, d: .85 }],
  bell: [{ x: -4.75, z: -1.4, w: .2, h: .16, d: .2, y: 1.015 }],
  plant: [
    { x: 7.8, z: -.6, w: .8, h: 1.4, d: .55 },
    { ...FLOOR.waitingPlant, h: 1.25 },
    { x: 7.85, z: 3.6, w: .8, h: 1.25, d: .55 },
  ],
  teaTable: [{ ...FLOOR.readingTable, h: .6 }],
  coatStand: [{ ...FLOOR.coatStand, h: 1.85 }],
  lamp: [{ ...FLOOR.waitingLamp, h: 1.85 }],
  wallShelf: [{ x: -4.25, z: -5.48, w: 1.2, h: 1.2, d: .72, y: 1.75 }],
  flowers: [{ x: -4.21, z: 2.68, w: .22, h: .34, d: .22, y: .6 }],
  calendar: [{ x: -5.53, z: -1.48, w: .32, h: .27, d: .22, y: 1.035 }],
};

export function buildSalon(parent: THREE.Group, changed: () => void) {
  const group = new THREE.Group(); group.name = 'karchive-salon'; parent.add(group);
  const resources = new Set<{ dispose(): void }>();
  // Repeated props share both GLB textures and these small procedural materials.
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  let disposed = false, loadedCount = 0;
  const own = (object: THREE.Object3D, target = resources) => object.traverse(child => {
    const mesh = child as THREE.Mesh; if (!mesh.isMesh) return;
    if (mesh instanceof THREE.InstancedMesh) target.add(mesh);
    target.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      target.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) target.add(value);
    }
  });
  const material = (color: string, metal = false) => {
    const key = color + (metal ? ':metal' : '');
    let value = materials.get(key);
    if (!value) {
      value = new THREE.MeshStandardMaterial({ color, roughness: metal ? .35 : .78, metalness: metal ? .45 : 0 });
      materials.set(key, value); resources.add(value);
    }
    return value;
  };
  const add = (geometry: THREE.BufferGeometry, color: string, x: number, y: number, z: number, metal = false) => {
    const mesh = new THREE.Mesh(geometry, material(color, metal));
    mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh); own(mesh); return mesh;
  };
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string) => {
    return add(new THREE.BoxGeometry(w, h, d), color, x, y, z);
  };
  const fallback: Partial<Record<keyof typeof MODELS, THREE.Object3D[]>> = {
    vanity: [-1.4, 2.2].map(x => box(2.1, .8, .85, x, .4, -4.1, '#a78a68')),
    chair: PLACES.chair.map(p => box(p.w, .55, p.d, p.x, .275, p.z, '#ac6870')),
    reception: [box(2.1, 1, .95, -5, .5, -1.5, '#997450')],
    sofa: [box(FLOOR.waitingSofa.w, .6, FLOOR.waitingSofa.d, FLOOR.waitingSofa.x, .3, FLOOR.waitingSofa.z, '#92a59a')],
    wardrobe: [box(1.35, 2.15, .75, -6.6, 1.075, -4.3, '#a68a65')],
    shelf: [box(1.7, 1.8, .85, 6, .9, -4.3, '#997750')],
    teaTable: [box(FLOOR.readingTable.w, .6, FLOOR.readingTable.d, FLOOR.readingTable.x, .3, FLOOR.readingTable.z, '#a78a68')],
    coatStand: [box(.08, 1.75, .08, FLOOR.coatStand.x, .875, FLOOR.coatStand.z, '#997750')],
    lamp: [box(.06, 1.65, .06, FLOOR.waitingLamp.x, .825, FLOOR.waitingLamp.z, '#bd995e')],
    wallShelf: [box(1.2, 1.2, .36, -4.25, 2.35, -5.48, '#a78a68')],
  };
  fallback.plant = PLACES.plant.map(p => box(p.w, .3, p.d, p.x, .15, p.z, '#a78a68'));
  // Flat rugs visually join each zone, without introducing a walk obstacle.
  box(4.9, .016, 2.75, -3.9, .02, 3.35, '#c8a995');
  box(4.58, .02, 2.43, -3.9, .024, 3.35, '#e2cbbb');
  for (const z of [2.3, 4.4]) box(4.42, .023, .035, -3.9, .028, z, '#b38e77');
  const washCenterX = (FLOOR.washLeft.x + FLOOR.washRight.x) / 2;
  const washCenterZ = FLOOR.washLeft.z + .08;
  box(4.75, .016, 3.1, washCenterX, .02, washCenterZ, '#b7c4b5');
  box(4.52, .02, 2.85, washCenterX, .024, washCenterZ, '#d5d9c7');

  // A low reading table and magazines keep the front waiting lounge lived-in.
  for (let i = 0; i < 3; i++) {
    const magazine = box(.38, .022, .29, -3.65 + i * .035, .617 + i * .025, 2.58, ['#799f99', '#c99b9c', '#ead2a7'][i]);
    magazine.rotation.y = -.18 + i * .15;
  }
  box(.12, .025, .15, -3.58, .696, 2.59, '#f2e9d2');
  // Folded capes hang beside the coat stand, not across the entrance.
  for (let i = 0; i < 2; i++) box(.25, .66, .055, -7.02 + i * .25, 1.05, 1.25, ['#799f99', '#c99b9c'][i]);

  // Two ceramic shampoo bowls, with a raised rim and separate tap/drain.
  const bowlGeometry = new THREE.LatheGeometry([
    new THREE.Vector2(0, -.17), new THREE.Vector2(.28, -.16), new THREE.Vector2(.46, .015),
    new THREE.Vector2(.46, .085), new THREE.Vector2(.39, .085), new THREE.Vector2(.29, -.085), new THREE.Vector2(0, -.11),
  ], 20);
  resources.add(bowlGeometry);
  for (const p of [FLOOR.washLeft, FLOOR.washRight]) {
    box(.58, .8, .62, p.x, .4, p.z - .62, '#79948b');
    box(1.04, .06, .32, p.x, .83, p.z - 1.01, '#ac8a63');
    const bowl = add(bowlGeometry, '#f0eadb', p.x, 1.0, p.z - .56); bowl.scale.z = .86;
    add(new THREE.CylinderGeometry(.052, .052, .012, 12), '#8e8777', p.x, .896, p.z - .56, true);
    add(new THREE.CylinderGeometry(.027, .027, .36, 10), '#bd995e', p.x + .3, 1.15, p.z - .84, true);
    const spout = add(new THREE.CylinderGeometry(.027, .027, .23, 10), '#bd995e', p.x + .3, 1.33, p.z - .73, true);
    spout.rotation.x = Math.PI / 2;
    box(.16, .035, .075, p.x + .3, 1.19, p.z - .9, '#bd995e');
    // Soft neck rest visibly connects the basin and the chair.
    const neck = add(new THREE.CylinderGeometry(.055, .055, .32, 10), '#796658', p.x, 1.05, p.z - .165);
    neck.rotation.z = Math.PI / 2;
    box(.62, .045, .35, p.x, .48, p.z + .68, '#d8c9b5');
  }

  // Clean towels and product bottles sit on physical shelves/countertops.
  for (const y of [.35, .87, 1.39]) {
    box(1.26, .045, .55, 6, y, -4.14, '#ac8a63');
    for (let column = 0; column < 2; column++) for (let row = 0; row < 2; row++) {
      box(.43, .09, .36, 5.7 + column * .59, y + .07 + row * .1, -3.99, row ? '#e7d1c1' : '#efe4cc');
    }
  }
  // A trolley between the two styling stations keeps tools within reach.
  const trolley = FLOOR.workTrolley;
  for (const x of [-1, 1]) for (const z of [-1, 1]) {
    box(.035, .78, .035, trolley.x + x * .27, .5, trolley.z + z * .3, '#997750');
    const wheel = add(new THREE.CylinderGeometry(.065, .065, .035, 10), '#796658', trolley.x + x * .27, .09, trolley.z + z * .3);
    wheel.rotation.z = Math.PI / 2;
  }
  for (const y of [.24, .64, .9]) box(.65, .055, .72, trolley.x, y, trolley.z, '#bd995e');
  box(.44, .11, .4, trolley.x, .323, trolley.z, '#efe4cc');
  box(.28, .12, .28, trolley.x - .1, 1.0, trolley.z, '#799f99');
  for (let i = 0; i < 4; i++) box(.022, .25, .022, trolley.x - .18 + i * .047, 1.1, trolley.z, '#796658');
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
    box(1.6, .012, 1.4, x, .017, -2.4, '#e5c1b8');
    for (const side of [-1, 1]) {
      box(.12, .16, .13, x + side * .97, 2.13, -5.6, '#bd995e');
      add(new THREE.CylinderGeometry(.095, .17, .23, 12), '#efe4cc', x + side * .97, 2.31, -5.5);
    }
  }
  box(2.1, .045, .96, -5, 1.01, -1.5, '#eadac4');

  const bottles: { x: number; y: number; z: number; h: number; color: string }[] = [];
  const bottleColors = ['#799f99', '#c99b9c', '#ead2a7', '#8d9c7a'];
  for (const x of [-1.4, 2.2]) for (let i = 0; i < 3; i++)
    bottles.push({ x: x + .45 + i * .16, y: .86, z: -4.15, h: .21 + i * .03, color: bottleColors[i] });
  for (const y of [1.84, 2.44]) {
    box(1.25, .045, .24, -4.25, y - .027, -5.04, '#ac8a63');
    for (let i = 0; i < 5; i++)
      bottles.push({ x: -4.7 + i * .225, y, z: -5.03, h: .23 + i % 2 * .07, color: bottleColors[i % 4] });
  }
  for (const p of [FLOOR.washLeft, FLOOR.washRight]) for (let i = 0; i < 2; i++)
    bottles.push({ x: p.x - .23 + i * .16, y: .86, z: p.z - .98, h: .22, color: bottleColors[i] });
  for (let i = 0; i < 2; i++) {
    bottles.push({ x: trolley.x + .12, y: .932, z: trolley.z - .18 + i * .25, h: .18, color: bottleColors[i] });
    bottles.push({ x: -4.55 + i * .19, y: 1.035, z: -1.67, h: .21, color: bottleColors[i + 2] });
  }
  // Instancing batches 24 product bottles into three draws; no per-bottle texture.
  const bottleBodies = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .065, 1, 10), material('#ffffff'), bottles.length);
  const bottleCaps = new THREE.InstancedMesh(new THREE.CylinderGeometry(.027, .027, .065, 8), material('#796658'), bottles.length);
  const bottleLabels = new THREE.InstancedMesh(new THREE.BoxGeometry(.08, .075, .008), material('#efe4cc'), bottles.length);
  const transform = new THREE.Object3D();
  for (const [i, p] of bottles.entries()) {
    transform.position.set(p.x, p.y + p.h / 2, p.z); transform.scale.set(1, p.h, 1); transform.updateMatrix();
    bottleBodies.setMatrixAt(i, transform.matrix); bottleBodies.setColorAt(i, new THREE.Color(p.color));
    transform.position.set(p.x, p.y + p.h + .0325, p.z); transform.scale.set(1, 1, 1); transform.updateMatrix(); bottleCaps.setMatrixAt(i, transform.matrix);
    transform.position.set(p.x, p.y + p.h * .48, p.z + .06); transform.updateMatrix(); bottleLabels.setMatrixAt(i, transform.matrix);
  }
  for (const mesh of [bottleBodies, bottleCaps, bottleLabels]) {
    mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = mesh.receiveShadow = true; group.add(mesh); own(mesh);
  }
  if (bottleBodies.instanceColor) bottleBodies.instanceColor.needsUpdate = true;

  // A pair of botanical prints shares one tiny original canvas texture.
  const art = document.createElement('canvas'); art.width = art.height = 256;
  const ink = art.getContext('2d');
  if (ink) {
    ink.fillStyle = '#efe4cc'; ink.fillRect(0, 0, 256, 256);
    ink.strokeStyle = '#79948b'; ink.lineWidth = 5; ink.lineCap = 'round';
    for (const [x, y, tilt] of [[78, 71, -.3], [131, 39, .12], [176, 98, .42]]) {
      ink.beginPath(); ink.moveTo(128, 227); ink.quadraticCurveTo(x + 16, 170, x, y); ink.stroke();
      ink.fillStyle = '#79948b'; ink.beginPath(); ink.ellipse(x + 17, y + 49, 23, 9, tilt, 0, Math.PI * 2); ink.fill();
      for (let i = 0; i < 5; i++) {
        const angle = i * Math.PI * .4;
        ink.fillStyle = '#c99b9c'; ink.beginPath(); ink.ellipse(x + Math.cos(angle) * 13, y + Math.sin(angle) * 13, 12, 8, angle, 0, Math.PI * 2); ink.fill();
      }
      ink.fillStyle = '#bd995e'; ink.beginPath(); ink.arc(x, y, 7, 0, Math.PI * 2); ink.fill();
    }
  }
  const artTexture = new THREE.CanvasTexture(art); artTexture.colorSpace = THREE.SRGBColorSpace; resources.add(artTexture);
  const artMaterial = new THREE.MeshBasicMaterial({ map: artTexture, toneMapped: false }); resources.add(artMaterial);
  for (const p of [{ x: 4.15, y: 2.33, size: 1.02 }, { x: -6.6, y: 2.87, size: .72 }]) {
    box(p.size + .1, p.size + .1, .06, p.x, p.y, -5.85, '#bd995e');
    const print = new THREE.Mesh(new THREE.PlaneGeometry(p.size, p.size), artMaterial);
    print.position.set(p.x, p.y, -5.81); group.add(print); own(print);
  }
  const loader = new GLTFLoader();
  for (const [key, url] of Object.entries(MODELS) as [keyof typeof MODELS, string][]) {
    void loader.loadAsync(url).then(({ scene }) => {
      if (disposed) { const owned = new Set<{ dispose(): void }>(); own(scene, owned); for (const resource of owned) resource.dispose(); return; }
      own(scene);
      const bounds = new THREE.Box3().setFromObject(scene), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
      if (![size.x, size.y, size.z].every(n => Number.isFinite(n) && n > 0)) throw new Error('Invalid salon model bounds');
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
    dispose() {
      if (disposed) return;
      disposed = true; parent.remove(group);
      for (const resource of resources) resource.dispose();
      resources.clear(); materials.clear(); group.clear();
    },
  };
}
