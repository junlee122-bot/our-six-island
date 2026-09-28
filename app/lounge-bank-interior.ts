import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LOUNGE_MODELS, TAVERN_MODELS } from './lounge-model-assets';
import { BANK_FLOOR_ITEMS, BANK_MODEL_KEYS, type BankModel, type BankPlacement } from './lounge-bank-layout';
export { BANK_MODEL_COUNT } from './lounge-bank-layout';

/** Existing credited kArchive furniture; no new downloads or duplicate textures. */
const BANK_MODELS = {
  counter: TAVERN_MODELS.barCounter, bookcase: LOUNGE_MODELS.archiveBookcase,
  sofa: LOUNGE_MODELS.sofa, teaTable: LOUNGE_MODELS.teaTable,
  plants: LOUNGE_MODELS.plantStand, bell: LOUNGE_MODELS.serviceBell,
  calendar: LOUNGE_MODELS.deskCalendar, desk: LOUNGE_MODELS.ovalTable,
  chair: LOUNGE_MODELS.banquetChair, lamp: TAVERN_MODELS.floorLamp,
  sideboard: TAVERN_MODELS.teaSideboard, pencil: LOUNGE_MODELS.pencil,
  ticketRail: TAVERN_MODELS.ticketRail,
} satisfies Record<BankModel, string>;

/** Tabletop and wall props never add invisible floor obstacles. */
const PROPS: Partial<Record<BankModel, readonly BankPlacement[]>> = {
  bell: [{ x: -.65, z: -2.08, width: .2, height: .16, depth: .2, y: 1.035 }],
  calendar: [
    { x: 1.18, z: -2.3, width: .25, height: .281, depth: .192, y: 1.035 },
    { x: -4.6, z: -1.08, width: .22, height: .247, depth: .169, y: 1.027 },
  ],
  pencil: [
    { x: -5.2, z: -.47, width: .28, height: .089, depth: .082, y: 1.04, turn: .18 },
    { x: -3.98, z: -.47, width: .28, height: .089, depth: .082, y: 1.04, turn: -.2 },
  ],
  ticketRail: [{ x: -4.9, z: -5.78, width: 1.65, height: .478, depth: .23, y: 2.45 }],
};
const COLORS = {
  wood: '#997552', woodDark: '#71563d', cream: '#e8d9b9', paper: '#f5ebd6',
  leaf: '#75968a', ink: '#586e65', brass: '#b79a5d', muted: '#c5ae84',
  clay: '#b78168', linen: '#d7c4a1', steel: '#a4b4a6',
} as const;
type Color = keyof typeof COLORS;

export function buildBank(parent: THREE.Group, changed: () => void) {
  const group = new THREE.Group(); group.name = 'karchive-bank'; parent.add(group);
  let disposed = false, loadedCount = 0;
  const resources = new Set<{ dispose(): void }>();
  const own = (object: THREE.Object3D, target = resources) => object.traverse(child => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    target.add(mesh.geometry);
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      target.add(m);
      for (const value of Object.values(m)) if (value instanceof THREE.Texture) target.add(value);
    }
  });
  const materials = new Map<Color, THREE.MeshStandardMaterial>();
  const material = (color: Color) => {
    let value = materials.get(color);
    if (!value) {
      value = new THREE.MeshStandardMaterial({ color: COLORS[color], roughness: .82 });
      materials.set(color, value); resources.add(value);
    }
    return value;
  };
  const cube = new THREE.BoxGeometry(1, 1, 1); resources.add(cube);
  const blocks = new Map<Color, THREE.Matrix4[]>();
  // Permanent paper, panels and trim are instanced by colour. More detail
  // does not create a separate geometry, material or draw call for each box.
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: Color, turn = 0) => {
    const matrices = blocks.get(color) ?? []; blocks.set(color, matrices);
    matrices.push(new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turn),
      new THREE.Vector3(w, h, d),
    ));
  };
  const solid = (p: BankPlacement, color: Color, h = p.height) => {
    const mesh = new THREE.Mesh(cube, material(color));
    mesh.scale.set(p.width, h, p.depth); mesh.rotation.y = p.turn ?? 0;
    mesh.position.set(p.x, (p.y ?? 0) + h / 2, p.z);
    mesh.castShadow = mesh.receiveShadow = true; group.add(mesh); return mesh;
  };
  const fallback: Partial<Record<BankModel, THREE.Object3D[]>> = {};
  for (const p of BANK_FLOOR_ITEMS) {
    if (!p.model) continue;
    const color: Color = p.model === 'sofa' ? 'leaf' : p.model === 'plants' ? 'ink' : 'wood';
    const h = p.model === 'chair' ? .5 : p.model === 'plants' ? .35 : p.height;
    (fallback[p.model] ??= []).push(solid(p, color, h));
  }

  const rug = (x: number, z: number, w: number, d: number, color: Color) => {
    box(w, .012, d, x, .013, z, color);
    for (const sx of [-1, 1]) box(.035, .008, d - .14, x + sx * (w / 2 - .09), .022, z, 'cream');
    for (const sz of [-1, 1]) box(w - .14, .008, .035, x, .022, z + sz * (d / 2 - .09), 'cream');
  };
  // Related rugs give the consultation, waiting and storage corners a boundary.
  rug(-4.7, -.7, 4.75, 5.1, 'linen');
  rug(5.25, 1.65, 4.2, 5.15, 'leaf');
  rug(4.35, -4.1, 4.1, 2.35, 'ink');
  rug(0, .58, 2.35, 4.4, 'leaf');
  for (const z of [-.55, .6, 1.75]) box(.46, .01, .035, 0, .028, z, 'cream');

  // The two existing reception modules remain one desk, in the same position.
  box(4.1, .055, .94, 0, 1.005, -2.2, 'cream');
  box(3.9, .06, .025, 0, .09, -1.749, 'brass');
  for (const x of [-1.38, 1.38]) {
    box(.64, .018, .42, x, 1.041, -2.13, 'ink');
    box(.38, .023, .28, x + .03, 1.061, -2.13, 'paper');
  }
  // Open forms and stacked ledgers make the left table a writing desk.
  for (const x of [-5.16, -4.02]) {
    box(.56, .018, .44, x, 1.038, -.72, 'woodDark', x < -4.5 ? .08 : -.08);
    box(.5, .012, .38, x, 1.057, -.72, 'paper', x < -4.5 ? .08 : -.08);
    for (let i = 0; i < 3; i++) box(.29, .002, .008, x, 1.065, -.79 + i * .055, 'muted');
  }
  for (let i = 0; i < 3; i++) {
    box(.4, .065, .3, -5.3, 1.065 + i * .065, -1.13, i === 1 ? 'clay' : 'ink');
    box(.31, .038, .008, -5.3, 1.065 + i * .065, -.976, 'paper');
  }

  // Low panelling fills the plaster without obscuring the existing windows.
  box(16.3, .64, .075, 0, .37, -5.84, 'leaf');
  box(16.4, .065, .105, 0, .71, -5.83, 'cream');
  for (let i = 0; i < 14; i++) box(.045, .56, .025, -7.65 + i * 1.17, .37, -5.79, 'ink');
  box(.06, .64, 7.6, -8.22, .37, -1.65, 'leaf');
  box(.09, .065, 7.6, -8.2, .71, -1.65, 'cream');

  // A matte safe and six deposit drawers share their footprint with pathfinding.
  const vault = BANK_FLOOR_ITEMS.find(p => p.id === 'vault')!;
  solid(vault, 'ink');
  const face = vault.z + vault.depth / 2 + .012;
  box(1.66, 1.81, .045, 3.72, 1.08, face, 'steel');
  box(1.4, 1.57, .05, 3.72, 1.08, face + .025, 'ink');
  for (const y of [.5, 1.61]) box(.16, .24, .12, 3.04, y, face + .065, 'brass');
  for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) {
    const x = 4.91 + col * .48, y = .39 + row * .6;
    box(.43, .53, .04, x, y, face + .016, 'steel');
    box(.19, .045, .04, x, y, face + .055, 'woodDark');
    box(.14, .075, .007, x, y + .14, face + .041, 'cream');
  }
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(.25, .035, 6, 18), material('brass'));
  wheel.position.set(3.86, 1.12, face + .12); group.add(wheel); own(wheel);
  box(.49, .04, .035, 3.86, 1.12, face + .12, 'brass');
  box(.04, .49, .035, 3.86, 1.12, face + .12, 'brass');
  box(3.27, .08, 1.04, vault.x, .045, vault.z, 'woodDark');

  // A paper dispenser sits beside the writing corner, outside the centre aisle.
  const ticket = BANK_FLOOR_ITEMS.find(p => p.id === 'ticket-stand')!;
  box(ticket.width, .08, ticket.depth, ticket.x, .04, ticket.z, 'woodDark');
  box(.14, .91, .14, ticket.x, .51, ticket.z, 'brass');
  box(.54, .21, .46, ticket.x, 1.045, ticket.z, 'wood');
  box(.4, .02, .24, ticket.x, 1.158, ticket.z, 'paper');
  box(.23, .1, .012, ticket.x, 1.028, ticket.z + .239, 'paper');

  // A single small atlas supplies all four signs; there is no reflected render.
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
  const context = canvas.getContext('2d');
  if (context) {
    for (const [i, text] of ['서류 쓰는 곳', '보관실', '잠시 쉬어가요', '차례표'].entries()) {
      const x = (i % 2) * 256, y = Math.floor(i / 2) * 128;
      context.fillStyle = COLORS.cream; context.fillRect(x, y, 256, 128);
      context.strokeStyle = COLORS.brass; context.lineWidth = 4; context.strokeRect(x + 10, y + 10, 236, 108);
      context.fillStyle = COLORS.woodDark; context.font = '28px Jua, sans-serif';
      context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(text, x + 128, y + 64);
    }
  }
  const atlas = new THREE.CanvasTexture(canvas); atlas.colorSpace = THREE.SRGBColorSpace; resources.add(atlas);
  const signMaterial = new THREE.MeshBasicMaterial({ map: atlas, toneMapped: false }); resources.add(signMaterial);
  const sign = (index: number, x: number, y: number, z: number, width: number, height: number) => {
    const geometry = new THREE.PlaneGeometry(width, height), uv = geometry.getAttribute('uv');
    const u = index % 2, v = index < 2 ? 1 : 0;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + u) / 2, (uv.getY(i) + v) / 2);
    const panel = new THREE.Mesh(geometry, signMaterial); panel.position.set(x, y, z); group.add(panel); own(panel);
    box(width + .09, height + .09, .055, x, y, z - .034, 'woodDark');
  };
  sign(0, -4.85, 3.18, -5.75, 1.9, .55);
  sign(1, 4.25, 2.53, -5.77, 1.6, .49);
  sign(2, 7.35, 1.86, -5.77, 1.5, .49);
  sign(3, ticket.x, 1.06, ticket.z + .247, .39, .13);

  const clock = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .075, 24), material('cream'));
  clock.rotation.x = Math.PI / 2; clock.position.set(7.35, 2.62, -5.86); group.add(clock); own(clock);
  box(.024, .21, .025, 7.35, 2.7, -5.81, 'woodDark');
  box(.17, .024, .025, 7.42, 2.62, -5.8, 'woodDark');
  for (const [color, matrices] of blocks) {
    const batch = new THREE.InstancedMesh(cube, material(color), matrices.length);
    matrices.forEach((matrix, i) => batch.setMatrixAt(i, matrix));
    batch.castShadow = batch.receiveShadow = true; batch.name = 'bank-detail-' + color;
    group.add(batch); resources.add(batch);
  }

  const loader = new GLTFLoader();
  for (const key of BANK_MODEL_KEYS) {
    void loader.loadAsync(BANK_MODELS[key]).then(({ scene }) => {
      if (disposed) {
        const late = new Set<{ dispose(): void }>(); own(scene, late);
        for (const resource of late) resource.dispose();
        return;
      }
      own(scene);
      const bounds = new THREE.Box3().setFromObject(scene), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
      if (![size.x, size.y, size.z].every(n => Number.isFinite(n) && n > 0)) return;
      for (const p of [...BANK_FLOOR_ITEMS.filter(item => item.model === key), ...(PROPS[key] ?? [])]) {
        const holder = new THREE.Group(), model = scene.clone(true);
        model.position.set(-center.x, -bounds.min.y, -center.z); holder.add(model);
        holder.scale.setScalar(Math.min(p.width / size.x, p.height / size.y, p.depth / size.z));
        holder.rotation.y = p.turn ?? 0; holder.position.set(p.x, p.y ?? 0, p.z);
        holder.traverse(child => { const mesh = child as THREE.Mesh; if (mesh.isMesh) mesh.castShadow = mesh.receiveShadow = true; });
        group.add(holder);
      }
      for (const object of fallback[key] ?? []) object.visible = false;
      loadedCount++; changed();
    }).catch(() => { /* Matching stand-ins retain the visible collision footprint. */ });
  }
  return {
    loaded: () => loadedCount,
    dispose() {
      if (disposed) return;
      disposed = true; parent.remove(group);
      for (const resource of resources) resource.dispose();
    },
  };
}
