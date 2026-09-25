/**
 * The 3D hall (회관) and casino (카지노) interiors: a warm low-poly shell
 * (floor, walls, door, windows, lamps, plants) and one table per game with a
 * floor sign, chairs on every seat, floor rings that show who sits where, and
 * the table host (루미 / 매화) standing at the dealer tables. Everything is
 * built from primitives and small canvas textures (no downloads); all of it
 * is owned by this scene and disposed with it.
 */
import * as THREE from 'three';
import { GAME_INFO, type GameKind } from './lounge-games';
import { NAMES } from './lounge-text';
import type { SceneArea } from './lounge-scene-layout';
import {
  INTERIOR_DOOR_Z,
  INTERIOR_ROOM,
  interiorTables,
  type InteriorTable,
  type InteriorWorld,
} from './lounge-interior-layout';

/** Table top height (world units). */
export const TABLE_HEIGHT = 0.78;

type Palette = {
  wall: string;
  wainscot: string;
  rail: string;
  floor: string[];
  trim: string;
  chair: string;
  cushion: string;
  hemi: [string, string, number];
  sun: [string, number];
  lamp: string;
  background: string;
};
const PALETTE: Record<SceneArea, Palette> = {
  lounge: {
    wall: '#efe2cc',
    wainscot: '#b98d5f',
    rail: '#f7eedc',
    floor: ['#c9a06a', '#c29a63', '#cfa874', '#bf955f'],
    trim: '#8d6a45',
    chair: '#9c7550',
    cushion: '#d9826a',
    hemi: ['#fff5e2', '#9a8468', 1.9],
    sun: ['#ffe9c8', 2.1],
    lamp: '#ffd79a',
    background: '#e9dcc4',
  },
  casino: {
    wall: '#6b3443',
    wainscot: '#4a2230',
    rail: '#d6b25e',
    floor: ['#7d2a38', '#782635', '#82303d', '#74243a'],
    trim: '#c9a24a',
    chair: '#5b2a1f',
    cushion: '#a8323f',
    hemi: ['#ffe6c9', '#5a3440', 1.55],
    sun: ['#ffdcb0', 1.7],
    lamp: '#ffc978',
    background: '#3c2129',
  },
};

const FELT: Record<GameKind, string> = {
  seotda: '#8e2f36',
  gostop: '#2f6b47',
  poker: '#2f7552',
  blackjack: '#23615f',
  chess: '#d8c39a',
};

export type SeatShow = { world: InteriorWorld; state: 'empty' | 'taken' | 'me' | 'away' };

/** A small canvas texture drawn once (owned by the scene). */
function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  if (c) draw(c);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
const FONT = '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export type InteriorScene = ReturnType<typeof createInteriorScene>;

export function createInteriorScene(
  scene: THREE.Scene,
  area: SceneArea,
  options: { lights: boolean },
) {
  const pal = PALETTE[area];
  const root = new THREE.Group();
  root.name = 'interior-' + area;
  scene.add(root);
  scene.background = new THREE.Color(pal.background);
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const surface = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) => {
    const key = color + JSON.stringify(extra);
    let m = materials.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
      materials.set(key, m);
    }
    return m;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: string | THREE.Material,
    parent: THREE.Object3D = root,
    shadow = true,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      typeof material === 'string' ? surface(material) : material,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (
    rTop: number,
    rBottom: number,
    h: number,
    x: number,
    y: number,
    z: number,
    material: string | THREE.Material,
    parent: THREE.Object3D = root,
    segments = 16,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBottom, h, segments),
      typeof material === 'string' ? surface(material) : material,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const textures: THREE.Texture[] = [];

  // ---------------------------------------------------------- lights
  const hemi = new THREE.HemisphereLight(pal.hemi[0], pal.hemi[1], pal.hemi[2]);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(pal.sun[0], pal.sun[1]);
  sun.position.set(-5, 11, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 9, bottom: -9, near: 0.1, far: 40 });
  sun.shadow.normalBias = 0.03;
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(area === 'casino' ? '#f2c9a0' : '#e6efe6', 0.7);
  fill.position.set(8, 6, 4);
  scene.add(fill);
  const lamps: THREE.PointLight[] = [];
  if (options.lights)
    for (const x of [-4, 4]) {
      const lamp = new THREE.PointLight(pal.lamp, area === 'casino' ? 9 : 6, 11, 1.6);
      lamp.position.set(x, 3.1, -0.6);
      scene.add(lamp);
      lamps.push(lamp);
    }

  // ---------------------------------------------------------- shell
  const { minX, maxX, minZ, maxZ, wallHeight } = INTERIOR_ROOM;
  const width = maxX - minX,
    depth = maxZ - minZ;
  box(width + 0.4, 0.3, depth + 0.4, 0, -0.16, (minZ + maxZ) / 2, pal.trim, root, false);
  if (area === 'lounge') {
    // Warm oak planks (instanced, four tones).
    const plank = new THREE.BoxGeometry(1, 0.05, 1);
    const rows = Math.ceil(depth / 0.36);
    pal.floor.forEach((color, tone) => {
      const spots: THREE.Matrix4[] = [];
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < 10; col++) {
          if ((row * 3 + col) % pal.floor.length !== tone) continue;
          // Staggered planks, clipped to the floor.
          const x0 = Math.max(minX, minX + col * 2.1 - (row % 2) * 1.05),
            x1 = Math.min(maxX, minX + (col + 1) * 2.1 - (row % 2) * 1.05),
            z0 = minZ + row * 0.36,
            z1 = Math.min(maxZ, z0 + 0.36);
          if (x1 - x0 < 0.05 || z1 - z0 < 0.05) continue;
          spots.push(
            new THREE.Matrix4().compose(
              new THREE.Vector3((x0 + x1) / 2, -0.005, (z0 + z1) / 2),
              new THREE.Quaternion(),
              new THREE.Vector3(x1 - x0 - 0.012, 1, z1 - z0 - 0.012),
            ),
          );
        }
      const mesh = new THREE.InstancedMesh(plank, surface(color, { roughness: 0.9 }), spots.length);
      spots.forEach((m, i) => mesh.setMatrixAt(i, m));
      mesh.receiveShadow = true;
      root.add(mesh);
    });
    // A woven rug under the middle of the hall.
    const rug = canvasTexture(256, 160, (c) => {
      c.fillStyle = '#d9b77d';
      c.fillRect(0, 0, 256, 160);
      c.strokeStyle = '#a4553f';
      c.lineWidth = 8;
      c.strokeRect(10, 10, 236, 140);
      c.strokeStyle = '#5f7f5a';
      c.lineWidth = 3;
      c.strokeRect(22, 22, 212, 116);
      c.fillStyle = '#b86d4e';
      for (let i = 0; i < 6; i++) c.fillRect(44 + i * 32, 74, 16, 12);
    });
    textures.push(rug);
    const rugMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 2.6),
      new THREE.MeshStandardMaterial({ map: rug, roughness: 1 }),
    );
    rugMesh.rotation.x = -Math.PI / 2;
    rugMesh.position.set(0, 0.025, 3.2);
    rugMesh.receiveShadow = true;
    root.add(rugMesh);
  } else {
    // Patterned carpet.
    const carpet = canvasTexture(128, 128, (c) => {
      c.fillStyle = pal.floor[0];
      c.fillRect(0, 0, 128, 128);
      c.strokeStyle = '#a14652';
      c.lineWidth = 3;
      for (const [x, y] of [[64, 0], [0, 64], [128, 64], [64, 128]] as const) {
        c.beginPath();
        c.moveTo(x, y - 30);
        c.lineTo(x + 30, y);
        c.lineTo(x, y + 30);
        c.lineTo(x - 30, y);
        c.closePath();
        c.stroke();
      }
      c.fillStyle = '#c9a24a';
      for (const [x, y] of [[64, 64], [0, 0], [128, 0], [0, 128], [128, 128]] as const) {
        c.beginPath();
        c.arc(x, y, 5, 0, Math.PI * 2);
        c.fill();
      }
    });
    carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping;
    carpet.repeat.set(width / 1.6, depth / 1.6);
    textures.push(carpet);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshStandardMaterial({ map: carpet, roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.002, (minZ + maxZ) / 2);
    floor.receiveShadow = true;
    root.add(floor);
  }
  const wall = surface(pal.wall, { roughness: 1 });
  box(width + 0.3, wallHeight, 0.18, 0, wallHeight / 2, minZ - 0.09, wall);
  // Side walls, with the door opening on the left.
  box(0.18, wallHeight, INTERIOR_DOOR_Z.z0 - minZ, minX - 0.09, wallHeight / 2, (minZ + INTERIOR_DOOR_Z.z0) / 2, wall);
  box(0.18, wallHeight, maxZ - INTERIOR_DOOR_Z.z1, minX - 0.09, wallHeight / 2, (INTERIOR_DOOR_Z.z1 + maxZ) / 2, wall);
  box(0.18, wallHeight - 2.4, INTERIOR_DOOR_Z.z1 - INTERIOR_DOOR_Z.z0, minX - 0.09, 2.4 + (wallHeight - 2.4) / 2, (INTERIOR_DOOR_Z.z0 + INTERIOR_DOOR_Z.z1) / 2, wall);
  // Only a low half wall on the right: the camera looks in from the front-right.
  box(0.18, 0.95, depth, maxX + 0.09, 0.475, (minZ + maxZ) / 2, pal.wainscot);
  box(0.26, 0.07, depth + 0.1, maxX + 0.09, 0.98, (minZ + maxZ) / 2, pal.rail);
  // Wainscot and rails.
  box(width, 0.9, 0.04, 0, 0.45, minZ + 0.02, pal.wainscot);
  box(0.04, 0.9, INTERIOR_DOOR_Z.z0 - minZ, minX + 0.02, 0.45, (minZ + INTERIOR_DOOR_Z.z0) / 2, pal.wainscot);
  box(0.04, 0.9, maxZ - INTERIOR_DOOR_Z.z1, minX + 0.02, 0.45, (INTERIOR_DOOR_Z.z1 + maxZ) / 2, pal.wainscot);
  for (const y of [0.92, wallHeight - 0.25]) {
    box(width, 0.07, 0.07, 0, y, minZ + 0.04, pal.rail);
  }
  // Door frame (the way back out to the village).
  const doorZ = (INTERIOR_DOOR_Z.z0 + INTERIOR_DOOR_Z.z1) / 2,
    doorW = INTERIOR_DOOR_Z.z1 - INTERIOR_DOOR_Z.z0;
  box(0.24, 0.16, doorW + 0.3, minX - 0.02, 2.42, doorZ, pal.trim);
  for (const z of [INTERIOR_DOOR_Z.z0 - 0.08, INTERIOR_DOOR_Z.z1 + 0.08]) box(0.24, 2.46, 0.14, minX - 0.02, 1.23, z, pal.trim);
  const outside = new THREE.Mesh(
    new THREE.PlaneGeometry(doorW, 2.36),
    new THREE.MeshBasicMaterial({ color: area === 'casino' ? '#f3d9a4' : '#dcecc4', toneMapped: false }),
  );
  outside.rotation.y = Math.PI / 2;
  outside.position.set(minX - 0.17, 1.18, doorZ);
  root.add(outside);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.1, doorW - 0.1), surface(area === 'casino' ? '#c9a24a' : '#9c7a52'));
  mat.rotation.x = -Math.PI / 2;
  mat.position.set(minX + 0.6, 0.02, doorZ);
  mat.receiveShadow = true;
  root.add(mat);

  // Back wall: windows (hall) or the lit sign (casino), plus a name banner.
  const banner = canvasTexture(640, 150, (c) => {
    roundRect(c, 6, 6, 628, 138, 26);
    c.fillStyle = area === 'casino' ? '#2a1720' : '#fff6e2';
    c.fill();
    c.lineWidth = 8;
    c.strokeStyle = area === 'casino' ? '#e0b85a' : '#9c6b44';
    c.stroke();
    c.fillStyle = area === 'casino' ? '#ffd98a' : '#6b4526';
    c.font = `800 72px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(area === 'casino' ? NAMES.casino : NAMES.hall, 320, 80);
  });
  textures.push(banner);
  const bannerMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.9),
    new THREE.MeshStandardMaterial({
      map: banner,
      roughness: 0.9,
      emissive: area === 'casino' ? '#ffffff' : '#000000',
      emissiveMap: area === 'casino' ? banner : null,
      emissiveIntensity: area === 'casino' ? 0.55 : 0,
    }),
  );
  bannerMesh.position.set(0, 2.72, minZ + 0.06);
  root.add(bannerMesh);
  if (area === 'lounge') {
    const glass = new THREE.MeshBasicMaterial({ color: '#f6e7b8', toneMapped: false });
    for (const x of [-5.2, 5.2]) {
      box(2.1, 1.7, 0.1, x, 2.05, minZ + 0.05, pal.trim);
      box(1.84, 1.44, 0.04, x, 2.05, minZ + 0.11, glass, root, false);
      box(0.07, 1.44, 0.06, x, 2.05, minZ + 0.14, pal.rail);
      box(1.84, 0.07, 0.06, x, 2.05, minZ + 0.14, pal.rail);
      box(2.3, 0.08, 0.26, x, 1.18, minZ + 0.15, pal.rail);
    }
    // Wall lanterns (warm paper shades) along the back wall.
    const paper = surface('#fff1d6', { emissive: '#ffc978', emissiveIntensity: 0.9 });
    for (const x of [-7.2, -3.0, 3.4, 7.2]) {
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), paper);
      lantern.scale.set(1, 1.3, 1);
      lantern.position.set(x, 2.55, minZ + 0.3);
      root.add(lantern);
      box(0.06, 0.06, 0.3, x, 2.9, minZ + 0.17, pal.trim);
      cylinder(0.12, 0.12, 0.04, x, 2.84, minZ + 0.3, '#9c3b30');
      cylinder(0.12, 0.12, 0.04, x, 2.27, minZ + 0.3, '#9c3b30');
    }
    // A notice board and a low shelf with tea things.
    box(1.5, 1.0, 0.06, 7.2 - 5.1, 1.95, minZ + 0.05, '#a47b50');
    box(1.34, 0.84, 0.04, 7.2 - 5.1, 1.95, minZ + 0.09, '#e8d9b6');
    for (const [x, y, color] of [[1.8, 2.1, '#f4c9a0'], [2.25, 1.85, '#c9e0bf'], [2.3, 2.15, '#f7e19a']] as const)
      box(0.3, 0.24, 0.02, x, y, minZ + 0.12, color);
    box(1.8, 0.8, 0.45, -2.2, 0.4, minZ + 0.3, '#9a7249');
    cylinder(0.14, 0.12, 0.2, -2.6, 0.9, minZ + 0.3, '#e8e0cf');
    cylinder(0.1, 0.1, 0.14, -2.0, 0.87, minZ + 0.3, '#6f8f73');
    cylinder(0.1, 0.1, 0.14, -1.7, 0.87, minZ + 0.3, '#6f8f73');
  } else {
    // Gold wall sconces and a bar counter along the back wall.
    const glow = surface('#fff4d6', { emissive: '#ffd27a', emissiveIntensity: 1.2 });
    for (const x of [-7.4, -1.1 - 1.3, 3.0, 7.4]) {
      box(0.34, 0.08, 0.2, x, 2.2, minZ + 0.12, pal.trim);
      const shade = cylinder(0.14, 0.2, 0.3, x, 2.42, minZ + 0.2, glow, root, 14);
      shade.castShadow = false;
    }
    box(3.2, 1.05, 0.5, -4.3 + 0.1, 0.53, minZ + 0.35, '#4a2a1e');
    box(3.3, 0.08, 0.6, -4.2, 1.08, minZ + 0.35, pal.trim);
    for (let i = 0; i < 5; i++)
      cylinder(0.06, 0.06, 0.32, -5.4 + i * 0.5, 1.6, minZ + 0.18, ['#3f6b52', '#8e2f36', '#c9a24a', '#6b4a8e', '#3f6b52'][i]);
    box(3.3, 0.06, 0.26, -4.2, 1.42, minZ + 0.15, pal.trim);
    // Two slot machines by the right wall.
    for (const z of [-3.4, -1.9]) {
      box(0.7, 1.5, 0.8, maxX - 0.5, 0.75, z, '#5a2d3a');
      box(0.04, 0.5, 0.56, maxX - 0.87, 1.1, z, surface('#fff0c4', { emissive: '#ffcf6b', emissiveIntensity: 0.9 }), root, false);
      cylinder(0.03, 0.03, 0.4, maxX - 0.45, 1.7, z + 0.28, pal.trim);
    }
    // Velvet rope posts by the door.
    for (const z of [1.6, 5.0]) {
      cylinder(0.05, 0.08, 0.9, minX + 1.3, 0.45, z, pal.trim);
      cylinder(0.12, 0.12, 0.04, minX + 1.3, 0.02, z, pal.trim);
    }
  }
  // Potted plants in the corners.
  for (const [x, z] of [[minX + 0.6, minZ + 0.6], [maxX - 0.6, minZ + 0.6], [maxX - 0.6, maxZ - 0.6]] as const) {
    if (area === 'casino' && x > 0 && z < 0) continue;
    cylinder(0.3, 0.24, 0.5, x, 0.25, z, area === 'casino' ? '#c9a24a' : '#b5673f');
    const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), surface('#5c8a4f', { flatShading: true }));
    leaves.position.set(x, 0.95, z);
    leaves.castShadow = true;
    root.add(leaves);
    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), surface('#6f9c5c', { flatShading: true }));
    top.position.set(x + 0.1, 1.35, z - 0.05);
    top.castShadow = true;
    root.add(top);
  }

  // ---------------------------------------------------------- tables
  const tables = interiorTables(area);
  type TableNode = {
    table: InteriorTable;
    group: THREE.Group;
    seats: THREE.Group;
    hit: THREE.Mesh;
    key: string;
  };
  const nodes = new Map<GameKind, TableNode>();
  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const ringGeometry = new THREE.RingGeometry(0.26, 0.34, 28);
  const ringMaterials = {
    empty: new THREE.MeshBasicMaterial({ color: '#fff6dc', transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide }),
    taken: new THREE.MeshBasicMaterial({ color: '#6fcf8f', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
    me: new THREE.MeshBasicMaterial({ color: '#f2c14e', transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }),
    away: new THREE.MeshBasicMaterial({ color: '#b7ad9c', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }),
  };
  const seatGeometry = {
    stool: new THREE.CylinderGeometry(0.24, 0.24, 0.1, 14),
    leg: new THREE.CylinderGeometry(0.035, 0.035, 0.46, 6),
    back: new THREE.BoxGeometry(0.5, 0.5, 0.08),
    seat: new THREE.BoxGeometry(0.5, 0.1, 0.46),
  };
  const chairWood = surface(pal.chair);
  const cushion = surface(pal.cushion);
  const buildChair = (parent: THREE.Group, at: InteriorWorld, face: number) => {
    const chair = new THREE.Group();
    chair.position.set(at.x, 0, at.z);
    chair.rotation.y = face;
    if (area === 'lounge') {
      const top = new THREE.Mesh(seatGeometry.stool, cushion);
      top.position.y = 0.5;
      top.castShadow = true;
      chair.add(top);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const leg = new THREE.Mesh(seatGeometry.leg, chairWood);
        leg.position.set(Math.cos(a) * 0.15, 0.23, Math.sin(a) * 0.15);
        chair.add(leg);
      }
    } else {
      const seat = new THREE.Mesh(seatGeometry.seat, cushion);
      seat.position.y = 0.5;
      seat.castShadow = true;
      const back = new THREE.Mesh(seatGeometry.back, cushion);
      back.position.set(0, 0.8, -0.22);
      back.castShadow = true;
      chair.add(seat, back);
      for (const [x, z] of [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]] as const) {
        const leg = new THREE.Mesh(seatGeometry.leg, chairWood);
        leg.position.set(x, 0.23, z);
        chair.add(leg);
      }
    }
    parent.add(chair);
  };
  const sign = (table: InteriorTable) => {
    const info = GAME_INFO[table.game];
    const texture = canvasTexture(256, 176, (c) => {
      roundRect(c, 6, 6, 244, 164, 20);
      c.fillStyle = area === 'casino' ? '#2d1a22' : '#fff4dd';
      c.fill();
      c.lineWidth = 7;
      c.strokeStyle = area === 'casino' ? '#d9b25a' : '#8d6a45';
      c.stroke();
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = area === 'casino' ? '#ffd98a' : '#9c3b30';
      c.font = `800 58px ${FONT}`;
      c.fillText(info.symbol, 128, 64);
      c.fillStyle = area === 'casino' ? '#fff1d0' : '#5a3b22';
      c.font = `800 38px ${FONT}`;
      c.fillText(info.name, 128, 130);
    });
    textures.push(texture);
    const group = new THREE.Group();
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 0.5),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, emissive: '#ffffff', emissiveMap: texture, emissiveIntensity: 0.25 }),
    );
    face.position.y = 1.08;
    face.rotation.x = -0.12;
    group.add(face);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.0, 0.06), surface(pal.trim));
    post.position.y = 0.5;
    post.castShadow = true;
    group.add(post);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.05, 12), surface(pal.trim));
    foot.position.y = 0.025;
    group.add(foot);
    // In front of the table's wall end, facing the camera.
    group.position.set(
      table.center.x - table.toward * (table.rx * 0.95),
      0,
      table.center.z + table.rz + 0.55,
    );
    return group;
  };
  const buildTable = (table: InteriorTable) => {
    const group = new THREE.Group();
    group.name = 'table-' + table.game;
    group.position.set(table.center.x, 0, table.center.z);
    const felt = surface(FELT[table.game], { roughness: 1 });
    const wood = surface(area === 'casino' ? '#4a2a1e' : '#8e6540');
    const { rx, rz } = table;
    if (table.game === 'poker' || table.game === 'blackjack') {
      const half = table.game === 'blackjack';
      const top = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.08, 40, 1, false, half ? Math.PI / 2 : 0, half ? Math.PI : Math.PI * 2),
        felt,
      );
      top.scale.set(rx, 1, rz);
      top.position.set(0, TABLE_HEIGHT, half ? rz * 0.35 : 0);
      top.castShadow = top.receiveShadow = true;
      group.add(top);
      const rail = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.07, 8, 40, half ? Math.PI : Math.PI * 2),
        surface('#3a2418'),
      );
      rail.rotation.x = -Math.PI / 2;
      if (half) rail.rotation.z = Math.PI;
      rail.scale.set(rx, rz, 1);
      rail.position.set(0, TABLE_HEIGHT + 0.05, half ? rz * 0.35 : 0);
      rail.castShadow = true;
      group.add(rail);
      const base = cylinder(0.35, 0.5, TABLE_HEIGHT - 0.04, 0, (TABLE_HEIGHT - 0.04) / 2, half ? -rz * 0.15 : 0, wood, group, 14);
      base.scale.set(1.6, 1, 1);
      // Chip stacks and a card shoe / a few cards.
      const chipColors = ['#d9534f', '#f2f0e6', '#3a7bd5', '#2f2f2f'];
      for (let i = 0; i < 4; i++)
        cylinder(0.07, 0.07, 0.05 + i * 0.03, -0.45 + i * 0.3, TABLE_HEIGHT + 0.06 + i * 0.015, half ? -rz * 0.05 : 0.05, chipColors[i], group, 12);
      for (let i = 0; i < 3; i++) box(0.16, 0.012, 0.23, -0.3 + i * 0.3, TABLE_HEIGHT + 0.05, half ? -rz * 0.35 : -rz * 0.35, '#fbf7ec', group, false);
    } else if (table.game === 'chess') {
      box(rx * 1.7, 0.1, rz * 1.9, 0, TABLE_HEIGHT, 0, wood, group);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const)
        box(0.1, TABLE_HEIGHT, 0.1, x * rx * 0.72, TABLE_HEIGHT / 2, z * rz * 0.8, wood, group);
      const board = canvasTexture(128, 128, (c) => {
        for (let y = 0; y < 8; y++)
          for (let x = 0; x < 8; x++) {
            c.fillStyle = (x + y) % 2 ? '#7a5634' : '#efdcb4';
            c.fillRect(x * 16, y * 16, 16, 16);
          }
      });
      board.magFilter = THREE.NearestFilter;
      textures.push(board);
      const top = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshStandardMaterial({ map: board, roughness: 0.8 }));
      top.rotation.x = -Math.PI / 2;
      top.position.set(0, TABLE_HEIGHT + 0.052, 0);
      top.receiveShadow = true;
      group.add(top);
      for (let i = 0; i < 6; i++) {
        const piece = cylinder(0.035, 0.05, 0.16 + (i % 3) * 0.04, -0.45 + i * 0.18, TABLE_HEIGHT + 0.14, i % 2 ? -0.42 : 0.42, i % 2 ? '#2d2a26' : '#f7f1e2', group, 10);
        piece.castShadow = true;
      }
    } else {
      // Hwatu tables: a wooden table with a thick blanket and a few cards.
      box(rx * 1.75, 0.1, rz * 1.8, 0, TABLE_HEIGHT - 0.04, 0, wood, group);
      box(rx * 1.6, 0.04, rz * 1.62, 0, TABLE_HEIGHT + 0.03, 0, felt, group);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const)
        box(0.12, TABLE_HEIGHT - 0.08, 0.12, x * rx * 0.76, (TABLE_HEIGHT - 0.08) / 2, z * rz * 0.78, wood, group);
      for (let i = 0; i < 6; i++) {
        const card = box(0.13, 0.012, 0.2, -0.55 + i * 0.22, TABLE_HEIGHT + 0.058, (i % 2 ? -0.18 : 0.14), i % 3 ? '#b8322f' : '#f5ecd6', group, false);
        card.rotation.y = (i - 2.5) * 0.12;
      }
      cylinder(0.16, 0.13, 0.08, rx * 0.55, TABLE_HEIGHT + 0.09, -rz * 0.45, '#e9e1d0', group, 12);
    }
    // Invisible box for pointing at the table.
    const hit = new THREE.Mesh(new THREE.BoxGeometry(rx * 2.1, TABLE_HEIGHT + 0.4, rz * 2.2), hitMaterial);
    hit.position.y = (TABLE_HEIGHT + 0.4) / 2;
    hit.userData.game = table.game;
    group.add(hit);
    root.add(group);
    root.add(sign(table));
    const seats = new THREE.Group();
    seats.name = 'seats-' + table.game;
    root.add(seats);
    nodes.set(table.game, { table, group, seats, hit, key: '' });
  };
  tables.forEach(buildTable);

  // ---------------------------------------------------------- hosts
  const hostMeshes: THREE.Group[] = [];
  for (const table of tables) {
    if (!table.host || !table.hostAt) continue;
    const lumi = table.host === 'lumi';
    const host = new THREE.Group();
    host.name = 'host-' + table.host;
    const outfit = surface(lumi ? '#34507a' : '#e7b7c3');
    const skin = surface('#f5dcc6');
    const hair = surface(lumi ? '#2e2c52' : '#231a1c');
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.9, 12), outfit);
    body.position.y = 0.72;
    body.castShadow = true;
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.3, 12), surface(lumi ? '#22324d' : '#c9667f'));
    skirt.position.y = 0.2;
    skirt.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), skin);
    head.position.y = 1.4;
    head.castShadow = true;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
    cap.position.y = 1.43;
    cap.rotation.x = -0.35;
    const back = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.42, 12), hair);
    back.position.set(0, 1.28, -0.08);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.19, 0.08, 12), surface(lumi ? '#f4efe3' : '#fff6ef'));
    collar.position.y = 1.18;
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 6),
      surface(lumi ? '#e9c46a' : '#f08aa5', { emissive: lumi ? '#6a4a10' : '#6a2030', emissiveIntensity: 0.4 }),
    );
    pin.position.set(0.16, 1.58, 0.1);
    const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.02), surface('#3a2830'));
    eyes.position.set(0, 1.42, 0.21);
    host.add(body, skirt, head, cap, back, collar, pin, eyes);
    host.position.set(table.hostAt.x, 0, table.hostAt.z);
    // Face the table.
    host.rotation.y = Math.atan2(table.center.x - table.hostAt.x, table.center.z - table.hostAt.z);
    root.add(host);
    hostMeshes.push(host);
  }

  /** Rebuilds a table's chairs and seat rings when who sits there changes. */
  const setSeats = (game: GameKind, seats: SeatShow[]) => {
    const node = nodes.get(game);
    if (!node) return false;
    const key = seats.map((s) => `${s.world.x.toFixed(2)},${s.world.z.toFixed(2)},${s.state}`).join('|');
    if (key === node.key) return false;
    node.key = key;
    node.seats.clear();
    for (const s of seats) {
      const face = Math.atan2(node.table.center.x - s.world.x, node.table.center.z - s.world.z);
      // Chairs sit a little behind the seat spot, away from the table.
      const dx = s.world.x - node.table.center.x,
        dz = s.world.z - node.table.center.z,
        d = Math.hypot(dx, dz) || 1;
      buildChair(node.seats, { x: s.world.x + (dx / d) * 0.28, z: s.world.z + (dz / d) * 0.28 }, face);
      const ring = new THREE.Mesh(ringGeometry, ringMaterials[s.state]);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(s.world.x, 0.03, s.world.z);
      ring.renderOrder = 1;
      node.seats.add(ring);
    }
    return true;
  };

  return {
    sun,
    tables,
    setSeats,
    /** Invisible table boxes (pointer hits carry `userData.game`). */
    hits: () => [...nodes.values()].map((n) => n.hit),
    setLights(on: boolean) {
      for (const lamp of lamps) lamp.visible = on;
    },
    dispose() {
      scene.remove(root, hemi, sun, fill, ...lamps);
      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) m.dispose();
      });
      for (const m of materials.values()) m.dispose();
      for (const m of Object.values(ringMaterials)) m.dispose();
      for (const g of Object.values(seatGeometry)) g.dispose();
      ringGeometry.dispose();
      hitMaterial.dispose();
      for (const t of textures) t.dispose();
      sun.shadow.dispose();
      for (const lamp of lamps) lamp.dispose();
      hemi.dispose();
      fill.dispose();
      sun.dispose();
    },
  };
}
