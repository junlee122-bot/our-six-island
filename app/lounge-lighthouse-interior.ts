/**
 * 범마을 등대's two rooms in three.js (lounge-lighthouse-layout.ts): built in
 * code like the tower outside (white plaster, navy panelling, red trim), with
 * a few kArchive props already credited (자료: kArchive · 출처: 쓰레드
 * dogfooter): the stove, the shelf of old logbooks, barrels, a crate, a keg,
 * a jar and a paper lamp. Each model is loaded once and drawn as one
 * instanced call; plain boxes are instanced by colour.
 *
 * 1층 (등대지기의 방): the logbook desk with the open book, coat hooks with
 * oilskins, the sea chart, a porthole and the spiral stair going up.
 * 꼭대기 (등명실): the sea through tall windows on the back wall, the big
 * lamp (a stack of glass lens rings round a bulb) that lights at game night
 * and turns with the harbor's beam (lounge-lighthouse.ts), the stair coming
 * up through the floor, and the balcony grating and rail toward the camera.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TAVERN_MODELS, VALLEY_MODELS } from './lounge-model-assets';
import { INTERIOR_ROOM } from './lounge-interior-layout';
import { lighthouseBeamAngle, lighthouseLampLit, type LighthouseArea } from './lounge-lighthouse';
import { BALCONY, LIGHTHOUSE_ITEMS, LIGHTHOUSE_LAMP, LIGHTHOUSE_SIGNS, LIGHTHOUSE_STAIR, type LighthouseItem, type LighthouseModel } from './lounge-lighthouse-layout';

const MODEL_URL: Record<LighthouseModel, string> = {
  stove: TAVERN_MODELS.stove,
  storageShelf: TAVERN_MODELS.storageShelf,
  barrelRack: TAVERN_MODELS.barrelRack,
  keg: TAVERN_MODELS.keg,
  firewood: VALLEY_MODELS.firewood,
  onggi: VALLEY_MODELS.onggi,
  hanjiLantern: VALLEY_MODELS.hanjiLantern,
  produceCrate: VALLEY_MODELS.produceCrate,
};
const FONT = '"Jua", "Pretendard", sans-serif';
const IRON = '#34444f',
  RED = '#c4513d',
  BRASS = '#c9a24a',
  NAVY = '#2f4a6a';

function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  if (c) draw(c);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** The sea chart on 1층's wall: the harbor, the point, the breakwater and the six islands far out. */
function drawChart(c: CanvasRenderingContext2D) {
  c.fillStyle = '#efe2c0';
  c.fillRect(0, 0, 512, 336);
  c.strokeStyle = '#8a6a3e';
  c.lineWidth = 10;
  c.strokeRect(5, 5, 502, 326);
  // Sea tint and depth lines.
  c.fillStyle = '#cfe0dc';
  c.fillRect(16, 120, 480, 204);
  c.strokeStyle = '#9dbdb8';
  c.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.moveTo(16, 150 + i * 42);
    c.bezierCurveTo(140, 130 + i * 42, 330, 175 + i * 42, 496, 150 + i * 42);
    c.stroke();
  }
  // The coast with the village and the point.
  c.fillStyle = '#d9c38f';
  c.beginPath();
  c.moveTo(16, 16);
  c.lineTo(496, 16);
  c.lineTo(496, 120);
  c.bezierCurveTo(430, 150, 400, 112, 360, 126);
  c.bezierCurveTo(300, 140, 220, 118, 150, 132);
  c.bezierCurveTo(90, 142, 50, 122, 16, 130);
  c.closePath();
  c.fill();
  c.strokeStyle = '#6b4b2a';
  c.lineWidth = 3;
  c.stroke();
  // Islands.
  for (const [x, y, r] of [
    [96, 236, 14],
    [170, 284, 10],
    [252, 250, 16],
    [330, 296, 9],
    [402, 238, 13],
    [458, 290, 8],
  ] as const) {
    c.fillStyle = '#d9c38f';
    c.beginPath();
    c.ellipse(x, y, r * 1.4, r, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  }
  // The dotted route out to sea and the lighthouse's star.
  c.setLineDash([6, 8]);
  c.strokeStyle = RED;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(380, 140);
  c.bezierCurveTo(330, 200, 280, 210, 252, 236);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = RED;
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2,
      r = i % 2 ? 6 : 14;
    c.lineTo(380 + Math.cos(a) * r, 128 + Math.sin(a) * r);
  }
  c.fill();
  // Compass rose.
  c.strokeStyle = NAVY;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(70, 72, 30, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = NAVY;
  c.beginPath();
  c.moveTo(70, 36);
  c.lineTo(78, 72);
  c.lineTo(70, 108);
  c.lineTo(62, 72);
  c.fill();
  c.font = `30px ${FONT}`;
  c.textAlign = 'center';
  c.fillText('N', 70, 30);
  c.fillStyle = '#4a3620';
  c.font = `38px ${FONT}`;
  c.fillText('범마을 앞바다', 250, 70);
}

/** The view out of the lamp room: sky, the horizon, the islands and a boat. */
function drawSea(c: CanvasRenderingContext2D) {
  const sky = c.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, '#8fc4e2');
  sky.addColorStop(1, '#e4f2f4');
  c.fillStyle = sky;
  c.fillRect(0, 0, 1024, 300);
  // Clouds.
  c.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [x, y, s] of [
    [150, 90, 1],
    [520, 60, 1.3],
    [830, 110, 0.9],
  ] as const)
    for (const [dx, dy, r] of [
      [0, 0, 26],
      [26, -10, 30],
      [56, 0, 24],
    ] as const) {
      c.beginPath();
      c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
      c.fill();
    }
  const sea = c.createLinearGradient(0, 300, 0, 512);
  sea.addColorStop(0, '#4f8fb0');
  sea.addColorStop(1, '#2c6585');
  c.fillStyle = sea;
  c.fillRect(0, 300, 1024, 212);
  // Distant islands on the horizon.
  c.fillStyle = '#6f8f8a';
  for (const [x, w, h] of [
    [120, 140, 26],
    [430, 90, 18],
    [700, 170, 30],
    [930, 70, 14],
  ] as const) {
    c.beginPath();
    c.ellipse(x, 302, w / 2, h, 0, Math.PI, 0);
    c.fill();
  }
  // Glints on the water.
  c.strokeStyle = 'rgba(255,255,255,0.55)';
  c.lineWidth = 3;
  for (let i = 0; i < 46; i++) {
    const x = (i * 197) % 1024,
      y = 320 + ((i * 53) % 180);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 18 + (i % 3) * 8, y);
    c.stroke();
  }
  // A small boat with a sail.
  c.fillStyle = '#e0d2b0';
  c.beginPath();
  c.moveTo(600, 360);
  c.lineTo(660, 360);
  c.lineTo(648, 372);
  c.lineTo(612, 372);
  c.fill();
  c.fillStyle = '#fff6e0';
  c.beginPath();
  c.moveTo(630, 358);
  c.lineTo(630, 318);
  c.lineTo(652, 358);
  c.fill();
}

export function buildLighthouse(parent: THREE.Group, area: LighthouseArea, changed: () => void, options: { lights: boolean }) {
  const group = new THREE.Group();
  group.name = 'lighthouse-' + area;
  parent.add(group);
  const top = area === 'lighthouseTop';
  const { minX, maxX, minZ, maxZ, wallHeight } = INTERIOR_ROOM;
  let disposed = false,
    loadedCount = 0;
  const resources = new Set<{ dispose(): void }>();
  const own = (object: THREE.Object3D, target = resources) =>
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      target.add(mesh.geometry);
      for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        target.add(m);
        for (const value of Object.values(m)) if (value instanceof THREE.Texture) target.add(value);
      }
    });
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const material = (color: string) => {
    let value = materials.get(color);
    if (!value) {
      value = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
      materials.set(color, value);
      resources.add(value);
    }
    return value;
  };
  const cube = new THREE.BoxGeometry(1, 1, 1);
  resources.add(cube);
  /** Plain boxes instanced by colour: the room's, and the stair's (in its own frame). */
  const blocks = new Map<string, THREE.Matrix4[]>(),
    stairBlocks = new Map<string, THREE.Matrix4[]>();
  const up = new THREE.Vector3(0, 1, 0);
  const put = (into: Map<string, THREE.Matrix4[]>) => (w: number, h: number, d: number, x: number, y: number, z: number, color: string, turn = 0) => {
    const list = into.get(color) ?? [];
    into.set(color, list);
    list.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(up, turn), new THREE.Vector3(w, h, d)));
  };
  const box = put(blocks),
    stairBox = put(stairBlocks);
  /** A one-off mesh owned by this room. */
  const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    resources.add(geometry);
    resources.add(mat);
    return m;
  };

  // ------------------------------------------------ the spiral stair (both floors)
  const S = LIGHTHOUSE_STAIR;
  const stair = new THREE.Group();
  stair.name = 'lighthouse-stair';
  stair.position.set(S.x, 0, S.z);
  group.add(stair);
  const poleH = top ? 1.15 : wallHeight;
  stair.add(mesh(new THREE.CylinderGeometry(0.11, 0.11, poleH, 12), material(IRON), 0, poleH / 2, 0));
  // Wedge steps winding up with a post every other step (1층; upstairs they come up through the hatch).
  const steps = 16,
    rise = wallHeight / steps;
  if (!top)
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2 * 1.1 + 2.2;
      stairBox(S.r * 0.95, 0.07, 0.42, Math.cos(a) * S.r * 0.52, (i + 1) * rise, -Math.sin(a) * S.r * 0.52, '#8a6440', a);
      if (i % 2 === 0) stairBox(0.05, 0.8, 0.05, Math.cos(a) * S.r * 0.98, (i + 1) * rise + 0.4, -Math.sin(a) * S.r * 0.98, IRON);
    }
  if (!top) {
    const helix = new THREE.CatmullRomCurve3(
      Array.from({ length: 24 }, (_, k) => {
        const i = (k / 23) * steps,
          a = (i / steps) * Math.PI * 2 * 1.1 + 2.2;
        return new THREE.Vector3(Math.cos(a) * S.r * 0.98, i * rise + 0.82, -Math.sin(a) * S.r * 0.98);
      }),
    );
    stair.add(mesh(new THREE.TubeGeometry(helix, 64, 0.03, 6), material(BRASS), 0, 0, 0));
  } else {
    // The hatch in the floor: a dark round opening with a brass rim and a rail on the room side.
    const hole = mesh(new THREE.CircleGeometry(S.r, 28), new THREE.MeshBasicMaterial({ color: '#2a2622' }), 0, 0.012, 0);
    hole.rotation.x = -Math.PI / 2;
    hole.receiveShadow = false;
    stair.add(hole);
    const rim = mesh(new THREE.TorusGeometry(S.r, 0.05, 6, 32), material(BRASS), 0, 0.03, 0);
    rim.rotation.x = Math.PI / 2;
    stair.add(rim);
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * 0.95 + (k / 8) * Math.PI * 1.25;
      stairBox(0.05, 0.9, 0.05, Math.cos(a) * (S.r + 0.06), 0.45, -Math.sin(a) * (S.r + 0.06), IRON);
    }
    const rail = new THREE.EllipseCurve(0, 0, S.r + 0.06, S.r + 0.06, Math.PI * 0.95, Math.PI * 2.2, false, 0);
    const pts = rail.getPoints(24).map((p) => new THREE.Vector3(p.x, 0.92, -p.y));
    stair.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, 0.03, 6), material(BRASS), 0, 0, 0));
  }

  // ------------------------------------------------ furniture
  const standIns = new Map<LighthouseModel, THREE.Mesh[]>();
  for (const it of LIGHTHOUSE_ITEMS[area]) {
    if (!it.model) {
      box(it.w, it.h, it.d, it.x, (it.y ?? 0) + it.h / 2, it.z, it.color ?? '#8c6a48', it.turn ?? 0);
      continue;
    }
    const stand = new THREE.Mesh(cube, material('#9b8467'));
    const h = Math.min(it.h, 0.6);
    stand.scale.set(it.w * 0.9, h, it.d * 0.9);
    stand.rotation.y = it.turn ?? 0;
    stand.position.set(it.x, (it.y ?? 0) + h / 2, it.z);
    stand.castShadow = stand.receiveShadow = true;
    group.add(stand);
    standIns.set(it.model, [...(standIns.get(it.model) ?? []), stand]);
  }
  // Wall signs (one small canvas each).
  for (const sign of LIGHTHOUSE_SIGNS[area]) {
    const tex = canvasTexture(384, 108, (c) => {
      c.fillStyle = '#f6f1e4';
      c.fillRect(0, 0, 384, 108);
      c.strokeStyle = NAVY;
      c.lineWidth = 6;
      c.strokeRect(8, 8, 368, 92);
      c.fillStyle = NAVY;
      c.font = `52px ${FONT}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(sign.text, 192, 58);
    });
    resources.add(tex);
    const h = sign.w / 3.55;
    group.add(mesh(new THREE.PlaneGeometry(sign.w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), sign.x, sign.y, minZ + 0.07));
  }

  // ------------------------------------------------ the beam and the lamp (lamp room)
  let lens: THREE.Group | null = null;
  let beams: THREE.Mesh[] = [];
  let bulb: THREE.MeshStandardMaterial | null = null;
  let glow: THREE.PointLight | null = null;
  let seaMaterial: THREE.MeshBasicMaterial | null = null;
  if (!top) {
    // 1층: the sea chart, the coat hooks, a porthole and the tea things.
    const chart = canvasTexture(512, 336, drawChart);
    resources.add(chart);
    group.add(mesh(new THREE.PlaneGeometry(2.0, 1.31), new THREE.MeshStandardMaterial({ map: chart, roughness: 0.95 }), -0.55, 1.62, minZ + 0.07));
    box(2.12, 1.43, 0.05, -0.55, 1.62, minZ + 0.04, '#6b4b2a');
    box(1.8, 0.08, 0.08, 1.6, 1.86, minZ + 0.1, '#6b4b2a');
    for (const [x, color, len] of [
      [0.95, '#e8b83a', 1.0],
      [1.6, NAVY, 1.1],
      [2.25, '#7a8a5a', 0.9],
    ] as const) {
      box(0.08, 0.1, 0.12, x, 1.84, minZ + 0.16, BRASS);
      box(0.5, len, 0.16, x, 1.8 - len / 2, minZ + 0.2, color);
      box(0.56, 0.12, 0.2, x, 1.74, minZ + 0.2, color);
    }
    box(0.36, 0.08, 0.36, 2.25, 1.95, minZ + 0.22, RED);
    // A porthole high on the back wall past the stair.
    const glass = new THREE.MeshBasicMaterial({ color: '#cfe8f2', toneMapped: false });
    resources.add(glass);
    const port = mesh(new THREE.CircleGeometry(0.42, 24), glass, 7.4, 2.3, minZ + 0.08);
    port.castShadow = false;
    group.add(port);
    const ring = mesh(new THREE.TorusGeometry(0.44, 0.06, 6, 24), material(BRASS), 7.4, 2.3, minZ + 0.1);
    group.add(ring);
    // Two cups on the tea table, a rug under it.
    box(1.8, 0.012, 1.6, -4.0, 0.028, 1.8, '#c4513d');
    box(1.6, 0.008, 1.4, -4.0, 0.037, 1.8, '#e9d6b0');
    for (const x of [-4.2, -3.8]) {
      const cup = mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 10), material('#f3ead2'), x, 0.66, 1.75);
      group.add(cup);
    }
    // A hanging ship's lantern over the desk.
    box(0.02, 0.6, 0.02, -3.2, wallHeight - 0.3, -3.6, IRON);
    const lantern = mesh(new THREE.SphereGeometry(0.16, 12, 8), new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: '#ffc978', emissiveIntensity: 0.9 }), -3.2, wallHeight - 0.7, -3.6);
    lantern.castShadow = false;
    group.add(lantern);
  } else {
    // The back wall is glass: the sea behind, iron mullions and a low wall in front.
    const sea = canvasTexture(1024, 512, drawSea);
    resources.add(sea);
    seaMaterial = new THREE.MeshBasicMaterial({ map: sea, toneMapped: false });
    const view = mesh(new THREE.PlaneGeometry(maxX - minX + 6, wallHeight + 3.2), seaMaterial, 0, wallHeight / 2 + 0.6, minZ - 1.4);
    view.castShadow = view.receiveShadow = false;
    group.add(view);
    box(maxX - minX + 0.3, 0.95, 0.18, 0, 0.475, minZ - 0.09, IRON);
    box(maxX - minX + 0.3, 0.12, 0.26, 0, 0.98, minZ - 0.06, '#d8dee0');
    box(maxX - minX + 0.3, 0.22, 0.2, 0, wallHeight - 0.11, minZ - 0.09, IRON);
    for (let x = minX; x <= maxX + 0.01; x += (maxX - minX) / 6) box(0.12, wallHeight - 1.0, 0.14, x, 0.98 + (wallHeight - 1.0) / 2, minZ - 0.09, IRON);
    const pane = new THREE.MeshStandardMaterial({ color: '#dff2f8', transparent: true, opacity: 0.16, roughness: 0.1, depthWrite: false });
    const glassWall = mesh(new THREE.PlaneGeometry(maxX - minX, wallHeight - 1.1), pane, 0, 0.98 + (wallHeight - 1.1) / 2, minZ - 0.12);
    glassWall.castShadow = glassWall.receiveShadow = false;
    group.add(glassWall);
    // The balcony: grating slats over the floor's front strip and the rail toward the camera.
    for (let z = BALCONY.z0; z < maxZ; z += 0.3) box(maxX - minX, 0.02, 0.2, 0, 0.03, z + 0.1, '#5d666b');
    for (let x = minX + 0.2; x <= maxX; x += 1.05) box(0.06, 1.0, 0.06, x, 0.5, BALCONY.rail, IRON);
    box(maxX - minX, 0.07, 0.09, 0, 1.0, BALCONY.rail, IRON);
    box(maxX - minX, 0.04, 0.05, 0, 0.55, BALCONY.rail, IRON);
    // The big lamp: an iron pedestal, brass base, a stack of glass lens rings round the bulb.
    const L = LIGHTHOUSE_LAMP;
    group.add(mesh(new THREE.CylinderGeometry(0.62, 0.8, 0.85, 20), material(IRON), L.x, 0.425, L.z));
    group.add(mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.12, 24), material(BRASS), L.x, 0.9, L.z));
    lens = new THREE.Group();
    lens.name = 'lighthouse-lens';
    lens.position.set(L.x, 0.96, L.z);
    group.add(lens);
    const ringGlass = new THREE.MeshStandardMaterial({ color: '#f6e7b8', transparent: true, opacity: 0.55, roughness: 0.15, metalness: 0.1 });
    resources.add(ringGlass);
    for (let k = 0; k < 6; k++) {
      const r = 0.6 - Math.abs(k - 2.5) * 0.07;
      const ringMesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.2, 18, 1, true), ringGlass);
      ringMesh.position.y = 0.12 + k * 0.22;
      resources.add(ringMesh.geometry);
      lens.add(ringMesh);
    }
    // Brass bars that make the turning visible.
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const bar = new THREE.Mesh(cube, material(BRASS));
      bar.scale.set(0.05, 1.36, 0.05);
      bar.position.set(Math.cos(a) * 0.6, 0.7, Math.sin(a) * 0.6);
      lens.add(bar);
    }
    bulb = new THREE.MeshStandardMaterial({ color: '#fff4cf', emissive: '#ffd36e', emissiveIntensity: 0.15 });
    lens.add(mesh(new THREE.SphereGeometry(0.26, 16, 12), bulb, 0, 0.7, 0));
    // The lamp's cap.
    group.add(mesh(new THREE.ConeGeometry(0.75, 0.5, 20), material(RED), L.x, 2.62, L.z));
    // Two beams out of the lens (shown while lit), soft and additive.
    const beamMat = new THREE.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false });
    resources.add(beamMat);
    const beamGeo = new THREE.ConeGeometry(0.9, 7, 18, 1, true);
    resources.add(beamGeo);
    beams = [1, -1].map((side) => {
      const b = new THREE.Mesh(beamGeo, beamMat);
      b.rotation.z = (side * Math.PI) / 2;
      b.position.set(side * 3.6, 0.7, 0);
      b.renderOrder = 2;
      lens!.add(b);
      return b;
    });
    if (options.lights) {
      glow = new THREE.PointLight('#ffe2a0', 0, 9, 1.4);
      glow.position.set(L.x, 1.7, L.z + 0.4);
      group.add(glow);
    }
  }

  for (const [into, target] of [
    [blocks, group],
    [stairBlocks, stair],
  ] as const)
    for (const [color, list] of into) {
      const batch = new THREE.InstancedMesh(cube, material(color), list.length);
      list.forEach((m, i) => batch.setMatrixAt(i, m));
      batch.castShadow = batch.receiveShadow = true;
      batch.name = `lighthouse-detail-${color}`;
      target.add(batch);
      resources.add(batch);
    }

  // ------------------------------------------------ models
  const placements = new Map<LighthouseModel, LighthouseItem[]>();
  for (const it of LIGHTHOUSE_ITEMS[area]) if (it.model) placements.set(it.model, [...(placements.get(it.model) ?? []), it]);
  const keys = [...placements.keys()];
  const loader = new GLTFLoader();
  for (const key of keys)
    void loader
      .loadAsync(MODEL_URL[key])
      .then(({ scene }) => {
        if (disposed) {
          const late = new Set<{ dispose(): void }>();
          own(scene, late);
          for (const r of late) r.dispose();
          return;
        }
        own(scene);
        scene.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(scene),
          size = bounds.getSize(new THREE.Vector3()),
          center = bounds.getCenter(new THREE.Vector3());
        if (![size.x, size.y, size.z].every((n) => Number.isFinite(n) && n > 0)) return;
        const meshes: THREE.Mesh[] = [];
        scene.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh);
        });
        const matrices = placements.get(key)!.map((p) => {
          const k = Math.min(p.w / size.x, p.h / size.y, p.d / size.z);
          return new THREE.Matrix4()
            .compose(new THREE.Vector3(p.x, p.y ?? 0, p.z), new THREE.Quaternion().setFromAxisAngle(up, p.turn ?? 0), new THREE.Vector3().setScalar(k))
            .multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
        });
        for (const m of meshes) {
          const batch = new THREE.InstancedMesh(m.geometry, m.material, matrices.length);
          matrices.forEach((x, i) => batch.setMatrixAt(i, x.clone().multiply(m.matrixWorld)));
          batch.castShadow = batch.receiveShadow = true;
          batch.name = `lighthouse-${key}`;
          group.add(batch);
          resources.add(batch);
        }
        for (const stand of standIns.get(key) ?? []) stand.visible = false;
        loadedCount++;
        changed();
      })
      .catch(() => {
        /* The stand-in keeps the footprint visible. */
      });

  let lit: boolean | null = null,
    angle = -1;
  return {
    loaded: () => loadedCount,
    wanted: keys.length,
    /** Whether the lamp burns (lamp room; 1층 reports the same clock). */
    lit: () => !!lit,
    /**
     * The lamp at server time `now`: lit through the game night, the lens
     * turning with the harbor's beam, the sea darker at night. True when the
     * view should re-render.
     */
    animate(now: number) {
      const on = lighthouseLampLit(now);
      let moved = false;
      if (on !== lit) {
        lit = on;
        moved = true;
        if (bulb) bulb.emissiveIntensity = on ? 2.4 : 0.15;
        for (const b of beams) (b.material as THREE.MeshBasicMaterial).opacity = on ? 0.13 : 0;
        if (glow) glow.intensity = on ? 4.5 : 0;
        if (seaMaterial) seaMaterial.color.set(on ? '#5d6c95' : '#ffffff');
      }
      if (lens && on) {
        const a = lighthouseBeamAngle(now);
        if (Math.abs(a - angle) > 0.02) {
          angle = a;
          lens.rotation.y = a;
          moved = true;
        }
      }
      return moved;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      parent.remove(group);
      glow?.dispose();
      for (const r of resources) r.dispose();
    },
  };
}
