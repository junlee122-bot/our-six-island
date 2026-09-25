import * as THREE from 'three';
import {
  VILLAGE_BOARDWALK,
  VILLAGE_BOUNDS,
  VILLAGE_DECOR,
  VILLAGE_FARMLAND,
  VILLAGE_FARMLAND_ENTRY,
  VILLAGE_PATHS,
  VILLAGE_PLACES,
  VILLAGE_RIVER,
  VILLAGE_TERRACE,
  type VillagePlace,
} from './lounge-village-layout';

type Place = Pick<
  VillagePlace,
  | 'x'
  | 'z'
  | 'width'
  | 'depth'
  | 'id'
  | 'kind'
  | 'color'
  | 'roofColor'
  | 'actor'
>;

const mat = (
  color: string,
  roughness = 0.88,
  extra: Partial<THREE.MeshStandardMaterialParameters> = {},
) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });

const M = {
  earth: mat('#d8c7a4'),
  edge: mat('#947d5d'),
  grass: mat('#91ad79'),
  grassLight: mat('#adc28b'),
  path: mat('#dfcaa0'),
  pathLight: mat('#f1deb8'),
  stone: mat('#b6a286'),
  stoneDark: mat('#84735d'),
  water: mat('#83cbd0', 0.25, {
    metalness: 0.08,
    transparent: true,
    opacity: 0.86,
  }),
  bank: mat('#c7b17f'),
  wood: mat('#79563c'),
  woodLight: mat('#a77a4e'),
  cream: mat('#f4e6c9'),
  white: mat('#fff4dc'),
  glass: mat('#8ec5c5', 0.3, { metalness: 0.08 }),
  glassDark: mat('#628c8c'),
  gold: mat('#e9b759', 0.45, { metalness: 0.18 }),
  leaf: mat('#658c59'),
  leafLight: mat('#89aa69'),
  leafDark: mat('#52744e'),
  flowerPink: mat('#df8792'),
  flowerYellow: mat('#efc65e'),
  flowerBlue: mat('#8eacd1'),
  roofA: mat('#c96652'),
  roofB: mat('#6d9180'),
  roofC: mat('#bd8658'),
  roofD: mat('#8398b7'),
  roofE: mat('#a77e9b'),
  roofF: mat('#c2a04e'),
  roofG: mat('#b76852'),
};

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const sphereGeo = new THREE.SphereGeometry(1, 8, 6);
const coneGeo = new THREE.ConeGeometry(1, 1, 7);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 10);

function box(
  parent: THREE.Object3D,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  rz = 0,
) {
  const o = new THREE.Mesh(boxGeo, material);
  o.position.set(x, y, z);
  o.scale.set(w, h, d);
  o.rotation.z = rz;
  o.castShadow = h > 0.18;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function sphere(
  parent: THREE.Object3D,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  r: number,
  scaleY = 1,
) {
  const o = new THREE.Mesh(sphereGeo, material);
  o.position.set(x, y, z);
  o.scale.set(r, r * scaleY, r);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function cylinder(
  parent: THREE.Object3D,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  rTop: number,
  rBottom: number,
  h: number,
  sides = 10,
) {
  const geo =
    sides === 10
      ? cylinderGeo
      : new THREE.CylinderGeometry(rTop, rBottom, h, sides);
  const o = new THREE.Mesh(geo, material);
  o.position.set(x, y, z);
  if (geo === cylinderGeo) {
    o.scale.set(rTop, h, rBottom);
  }
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
function line(
  parent: THREE.Object3D,
  material: THREE.Material,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  width: number,
  y = 0.17,
) {
  const dx = x2 - x1,
    dz = z2 - z1,
    len = Math.hypot(dx, dz);
  const o = box(
    parent,
    material,
    (x1 + x2) / 2,
    y,
    (z1 + z2) / 2,
    width,
    0.11,
    len,
  );
  o.rotation.y = Math.atan2(dx, dz);
  return o;
}
const doubleSidedCache = new WeakMap<THREE.Material, THREE.Material>();
function doubleSided(material: THREE.Material) {
  let value = doubleSidedCache.get(material);
  if (!value) {
    value = material.clone();
    value.side = THREE.DoubleSide;
    doubleSidedCache.set(material, value);
  }
  return value;
}
function roofPanel(
  parent: THREE.Object3D,
  material: THREE.Material,
  points: [number, number, number][],
) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(points.flat(), 3),
  );
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.computeVertexNormals();
  // Clone once per material: mutating the shared material to DoubleSide would
  // make every other box using it render both faces too.
  const mesh = new THREE.Mesh(geo, doubleSided(material));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function buildHouse(scene: THREE.Object3D, p: Place, index: number) {
  const g = new THREE.Group();
  g.name = `village-building-${p.id}`;
  g.position.set(p.x, 0, p.z);
  scene.add(g);
  const palette = [
    '#e6b59b',
    '#d9bd84',
    '#a9c3a1',
    '#a8beca',
    '#d6a8ae',
    '#d2c18d',
    '#c3aa91',
  ];
  const wall = mat(p.color || palette[index]);
  const roof = mat(p.roofColor || '#bd7959'),
    accent = [M.roofG, M.roofA, M.roofF, M.roofB, M.roofD, M.roofE, M.roofC][
      index
    ];
  const w = 4.65,
    d = 4.3,
    front = d / 2;
  // Raised stone footing and warm plaster walls.
  box(g, M.stoneDark, 0, 0.22, 0, 4.95, 0.42, 4.58);
  box(g, M.stone, 0, 0.39, 0, 4.8, 0.16, 4.46);
  box(g, wall, 0, 1.78, 0, w, 2.7, d);
  // Gable ends and steep handmade roof planes, with softened eaves.
  roofPanel(g, wall, [
    [-w / 2, 3.1, front - 0.04],
    [w / 2, 3.1, front - 0.04],
    [0, 4.55, front - 0.04],
    [0, 3.1, front - 0.04],
  ]);
  roofPanel(g, wall, [
    [-w / 2, 3.1, -front + 0.04],
    [w / 2, 3.1, -front + 0.04],
    [0, 4.55, -front + 0.04],
    [0, 3.1, -front + 0.04],
  ]);
  roofPanel(g, roof, [
    [-w / 2 - 0.3, 3.08, -front - 0.23],
    [0, 4.72, -front - 0.23],
    [0, 4.72, front + 0.23],
    [-w / 2 - 0.3, 3.08, front + 0.23],
  ]);
  roofPanel(g, accent, [
    [0, 4.72, -front - 0.23],
    [w / 2 + 0.3, 3.08, -front - 0.23],
    [w / 2 + 0.3, 3.08, front + 0.23],
    [0, 4.72, front + 0.23],
  ]);
  box(g, M.wood, 0, 4.72, 0, 0.15, 0.16, d + 0.65);
  // Tile courses add craft and color without individual shingles.
  for (let row = 0; row < 4; row++) {
    const y = 3.27 + row * 0.33,
      off = (4.72 - y) * 0.7;
    for (const side of [-1, 1]) {
      const x = side * (off + 0.04),
        zdepth = d + 0.38;
      box(
        g,
        side < 0 ? accent : roof,
        x,
        y,
        0,
        0.12,
        0.09,
        zdepth,
        side * -0.61,
      );
    }
  }
  // Chimney, cap, and a little moss-colored side ornament.
  box(g, M.cream, 1.36, 3.72, -1.03, 0.56, 1.58, 0.62);
  box(g, M.roofC, 1.36, 4.53, -1.03, 0.7, 0.16, 0.74);
  box(g, accent, -2.08, 2.98, 0, 0.42, 0.2, 3.5);
  // Centered front door and tiny canopy.
  box(g, M.wood, 0, 1.3, front + 0.055, 1.02, 1.92, 0.16);
  box(g, M.woodLight, 0, 1.36, front + 0.15, 0.78, 1.59, 0.08);
  box(g, M.gold, 0.25, 1.33, front + 0.21, 0.07, 0.07, 0.06);
  box(g, M.white, 0, 2.33, front + 0.12, 1.55, 0.12, 0.55);
  box(g, M.wood, 0, 2.41, front + 0.12, 1.65, 0.12, 0.61);
  // Matched pair of deep-set windows with cross muntins and flower troughs.
  for (const x of [-1.48, 1.48]) {
    box(g, M.wood, x, 2.02, front + 0.07, 0.92, 1.0, 0.16);
    box(g, M.glass, x, 2.02, front + 0.17, 0.7, 0.78, 0.055);
    box(g, M.white, x, 2.02, front + 0.207, 0.075, 0.78, 0.035);
    box(g, M.white, x, 2.02, front + 0.209, 0.7, 0.065, 0.035);
    box(g, accent, x, 1.45, front + 0.28, 1.02, 0.16, 0.34);
    box(g, M.woodLight, x, 1.33, front + 0.29, 1.06, 0.1, 0.38);
    for (let j = 0; j < 3; j++)
      sphere(
        g,
        [M.flowerPink, M.flowerYellow, M.flowerBlue][(j + index) % 3],
        x - 0.31 + j * 0.31,
        1.61,
        front + 0.3,
        0.1,
        0.74,
      );
  }
  // Numbered colored name plaque and a little postbox identify each resident home.
  box(g, M.cream, 0, 3.0, front + 0.14, 0.8, 0.36, 0.11);
  box(g, accent, 0, 3.01, front + 0.22, 0.48, 0.13, 0.035);
  return g;
}

function buildCivicHall(scene: THREE.Object3D, p: Place, casino = false) {
  const g = new THREE.Group();
  g.name = casino ? 'village-building-casino' : 'village-building-hall';
  g.position.set(p.x, 0, p.z);
  scene.add(g);
  const wall = casino ? mat('#e7d0a4') : mat('#e8dfc5'),
    roof = casino ? mat('#668e72') : mat('#bd7959');
  box(g, M.stoneDark, 0, 0.26, 0, 8.6, 0.48, 6.55);
  box(g, M.stone, 0, 0.48, 0, 8.35, 0.17, 6.32);
  box(g, wall, 0, 2.15, 0, 8.05, 3.2, 6.05);
  for (const x of [-3.72, 3.72])
    box(g, M.cream, x, 2.15, 3.04, 0.48, 3.23, 0.18);
  // Broad hipped silhouette and front gable.
  roofPanel(g, roof, [
    [-4.4, 3.72, -3.35],
    [0, 5.1, -3.35],
    [0, 5.1, 3.35],
    [-4.4, 3.72, 3.35],
  ]);
  roofPanel(g, M.roofC, [
    [0, 5.1, -3.35],
    [4.4, 3.72, -3.35],
    [4.4, 3.72, 3.35],
    [0, 5.1, 3.35],
  ]);
  box(g, M.gold, 0, 5.09, 0, 0.13, 0.14, 6.9);
  box(g, M.wood, 0, 1.55, 3.13, 1.42, 2.1, 0.2);
  box(g, M.woodLight, 0, 1.62, 3.27, 1.12, 1.74, 0.09);
  box(g, M.gold, 0.36, 1.6, 3.33, 0.08, 0.08, 0.04);
  for (const x of [-2.65, -1.45, 1.45, 2.65]) {
    box(g, M.wood, x, 2.24, 3.12, 0.78, 1.45, 0.16);
    box(g, M.glass, x, 2.24, 3.22, 0.57, 1.17, 0.06);
    box(g, M.white, x, 2.24, 3.27, 0.07, 1.17, 0.04);
    box(g, M.white, x, 2.24, 3.27, 0.57, 0.07, 0.04);
  }
  if (casino) {
    // Distinct marquee, vertical bays and inviting warm lamps.
    box(g, M.roofG, 0, 3.5, 3.22, 5.4, 0.44, 0.24);
    box(g, M.gold, 0, 3.5, 3.38, 4.72, 0.1, 0.08);
    box(g, mat('#5d815f'), 0, 0.92, 3.2, 5.6, 0.56, 0.21);
    for (const x of [-2.52, -1.68, -0.84, 0, 0.84, 1.68, 2.52])
      sphere(g, M.gold, x, 3.51, 3.4, 0.11);
    for (const x of [-3.25, 3.25]) {
      cylinder(g, M.gold, x, 3.0, 3.4, 0.09, 0.09, 2.2, 8);
      sphere(g, M.flowerYellow, x, 4.16, 3.4, 0.28, 0.7);
    }
  } else {
    // Hall clock in a small tower with a bell under the cupola.
    box(g, wall, 0, 5.2, -0.65, 1.8, 2.3, 1.8);
    box(g, roof, 0, 6.42, -0.65, 2.2, 0.22, 2.2);
    cylinder(g, M.roofC, 0, 6.95, -0.65, 0.72, 0.92, 0.92, 8);
    sphere(g, M.gold, 0, 7.51, -0.65, 0.18, 1.2);
    cylinder(g, M.white, 0, 5.64, 0.32, 0.63, 0.63, 0.12, 20);
    cylinder(g, M.gold, 0, 5.64, 0.4, 0.48, 0.48, 0.05, 20);
    box(g, M.stoneDark, 0, 5.72, 0.44, 0.055, 0.27, 0.035);
    box(g, M.stoneDark, 0.12, 5.59, 0.44, 0.24, 0.055, 0.035);
  }
  return g;
}

function buildWardrobeShop(scene: THREE.Object3D, p: Place) {
  const g = new THREE.Group();
  g.name = 'village-building-wardrobe';
  g.position.set(p.x, 0, p.z);
  scene.add(g);
  const wall = mat('#e4d4b6');
  box(g, M.stoneDark, 0, 0.23, 0, 8.4, 0.42, 5.5);
  box(g, M.stone, 0, 0.43, 0, 8.2, 0.16, 5.32);
  box(g, wall, 0, 1.9, 0, 7.9, 2.85, 5.15);
  roofPanel(g, M.roofD, [
    [-4.35, 3.2, -2.95],
    [0, 4.48, -2.95],
    [0, 4.48, 2.95],
    [-4.35, 3.2, 2.95],
  ]);
  roofPanel(g, M.roofE, [
    [0, 4.48, -2.95],
    [4.35, 3.2, -2.95],
    [4.35, 3.2, 2.95],
    [0, 4.48, 2.95],
  ]);
  box(g, M.gold, 0, 4.48, 0, 0.13, 0.14, 6.15);
  box(g, mat('#a5c3c4'), 0, 2.15, 2.68, 4.8, 1.52, 0.13);
  box(g, M.white, 0, 2.15, 2.78, 4.45, 1.24, 0.07);
  // Tailor's striped canopy and scalloped valance.
  box(g, M.wood, 0, 2.92, 3.06, 5.8, 0.16, 1.12, 0.18);
  for (let i = 0; i < 8; i++)
    box(
      g,
      i % 2 ? M.cream : mat('#c96d69'),
      -2.48 + i * 0.71,
      3.0,
      3.42,
      0.36,
      0.14,
      0.46,
      0.18,
    );
  box(g, M.wood, 0, 3.52, 3.0, 5.3, 0.48, 0.18);
  for (let x = -2.3; x <= 2.31; x += 0.77)
    box(g, M.white, x, 3.52, 3.12, 0.34, 0.47, 0.035);
  box(g, M.wood, 0, 1.35, 2.72, 1.1, 1.95, 0.16);
  box(g, M.woodLight, 0, 1.43, 2.83, 0.82, 1.62, 0.07);
  for (const x of [-3.1, 3.1]) {
    box(g, M.wood, x, 2.1, 2.7, 0.88, 1.45, 0.14);
    box(g, M.glass, x, 2.1, 2.8, 0.65, 1.17, 0.055);
    box(g, M.gold, x, 1.28, 2.94, 1.0, 0.18, 0.32);
  }
  for (let i = 0; i < 6; i++)
    sphere(
      g,
      [M.flowerPink, M.flowerBlue, M.flowerYellow][i % 3],
      -2.1 + i * 0.84,
      1.4,
      3.02,
      0.13,
      0.8,
    );
  return g;
}

/**
 * Collects repeated decor parts and emits one InstancedMesh per
 * geometry/material pair, so 30+ trees, lamps, hedges, fences and flower
 * beds cost a handful of draw calls instead of hundreds.
 */
class Instancer {
  private groups = new Map<
    string,
    {
      geometry: THREE.BufferGeometry;
      material: THREE.Material;
      matrices: THREE.Matrix4[];
      cast: boolean;
    }
  >();
  private parent = new THREE.Matrix4();
  private readonly local = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly e = new THREE.Euler();
  private readonly v = new THREE.Vector3();
  private readonly sv = new THREE.Vector3();
  /** Subsequent parts are placed relative to this origin (x, z, yaw, uniform scale). */
  at(x: number, z: number, rotationY = 0, scale = 1) {
    this.parent.compose(
      this.v.set(x, 0, z),
      this.q.setFromEuler(this.e.set(0, rotationY, 0)),
      this.sv.set(scale, scale, scale),
    );
    return this;
  }
  add(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    rotationZ = 0,
    cast = true,
    rotationY = 0,
  ) {
    const key = geometry.uuid + '|' + material.uuid + '|' + Number(cast);
    let group = this.groups.get(key);
    if (!group) {
      group = { geometry, material, matrices: [], cast };
      this.groups.set(key, group);
    }
    this.local.compose(
      this.v.set(x, y, z),
      this.q.setFromEuler(this.e.set(0, rotationY, rotationZ)),
      this.sv.set(sx, sy, sz),
    );
    group.matrices.push(this.parent.clone().multiply(this.local));
  }
  box(
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rotationZ = 0,
  ) {
    this.add(boxGeo, material, x, y, z, w, h, d, rotationZ, h > 0.18);
  }
  sphere(
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    r: number,
    scaleY = 1,
  ) {
    this.add(sphereGeo, material, x, y, z, r, r * scaleY, r);
  }
  cylinder(
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    rTop: number,
    rBottom: number,
    h: number,
    sides = 8,
  ) {
    // Unit-height tapered cylinders keep radii exact while sharing geometry.
    const key = `${(rTop / rBottom).toFixed(3)}|${sides}`;
    let geometry = taperedCylinders.get(key);
    if (!geometry) {
      geometry = new THREE.CylinderGeometry(rTop / rBottom, 1, 1, sides);
      taperedCylinders.set(key, geometry);
    }
    this.add(geometry, material, x, y, z, rBottom, h, rBottom);
  }
  cone(
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    rx: number,
    h: number,
    rz: number,
  ) {
    this.add(coneGeo, material, x, y, z, rx, h, rz);
  }
  flush(parent: THREE.Object3D) {
    for (const group of this.groups.values()) {
      const mesh = new THREE.InstancedMesh(
        group.geometry,
        group.material,
        group.matrices.length,
      );
      group.matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = group.cast;
      mesh.receiveShadow = true;
      parent.add(mesh);
    }
    this.groups.clear();
  }
}
const taperedCylinders = new Map<string, THREE.CylinderGeometry>();
const glowMaterial = new THREE.MeshBasicMaterial({ color: '#ffe2a3' });
/** Shared lamp-glow material; the life layer brightens it at night. */
export const VILLAGE_LAMP_GLOW = glowMaterial;

function tree(set: Instancer, x: number, z: number, scale = 1, variant = 0) {
  set.at(x, z, 0, scale);
  set.cylinder(M.wood, 0, 0.85, 0, 0.24, 0.33, 1.7, 7);
  const greens = [M.leaf, M.leafLight, M.leafDark];
  for (let i = 0; i < 3; i++)
    set.cone(
      greens[(i + variant) % greens.length],
      i === 1 ? 0.17 : 0,
      2.05 + i * 0.62,
      i === 2 ? -0.08 : 0,
      1.08 - i * 0.15,
      1.5 - i * 0.16,
      1.0 - i * 0.12,
    );
  set.sphere(greens[(variant + 1) % 3], 0.24, 2.64, 0.08, 0.46, 0.86);
}
function shrub(set: Instancer, x: number, z: number, color = M.leaf) {
  set.at(x, z);
  for (let i = 0; i < 3; i++)
    set.sphere(
      i === 1 ? M.leafLight : color,
      (i - 1) * 0.34,
      0.43 + (i % 2) * 0.07,
      i === 1 ? -0.08 : 0.04,
      0.48,
      0.77,
    );
}
function flowers(set: Instancer, x: number, z: number, count = 6, seed = 0) {
  set.at(x, z);
  const colors = [M.flowerPink, M.flowerYellow, M.flowerBlue];
  for (let i = 0; i < count; i++) {
    const a = seed + i * 2.399,
      r = 0.18 + 0.34 * (((i * 7) % 5) / 5),
      px = Math.cos(a) * r,
      pz = Math.sin(a) * r;
    set.add(cylinderGeo, M.leaf, px, 0.14, pz, 0.025, 0.14, 0.025);
    set.add(sphereGeo, colors[(i + seed) % 3], px, 0.29, pz, 0.105, 0.076, 0.105);
  }
}
function lamp(set: Instancer, x: number, z: number) {
  set.at(x, z);
  set.cylinder(M.stoneDark, 0, 0.78, 0, 0.09, 0.12, 1.55, 8);
  set.box(M.gold, 0, 1.5, 0, 0.4, 0.12, 0.4);
  set.box(M.wood, 0, 1.82, 0, 0.3, 0.48, 0.3);
  set.box(M.glass, 0, 1.82, 0.17, 0.19, 0.35, 0.035);
  set.add(sphereGeo, glowMaterial, 0, 1.82, 0.2, 0.12, 0.12, 0.12, 0, false);
}
function bench(set: Instancer, x: number, z: number, rotation = 0) {
  set.at(x, z, rotation);
  set.box(M.woodLight, 0, 0.55, 0, 1.6, 0.16, 0.48);
  set.box(M.wood, 0, 0.9, -0.19, 1.6, 0.62, 0.12);
  for (const x0 of [-0.62, 0.62]) {
    set.box(M.stoneDark, x0, 0.28, 0, 0.12, 0.52, 0.12);
    set.box(M.gold, x0, 0.22, 0, 0.22, 0.08, 0.22);
  }
}
function mailbox(set: Instancer, x: number, z: number, accent: THREE.Material) {
  set.at(x, z);
  set.cylinder(M.wood, 0, 0.7, 0, 0.08, 0.08, 1.4, 7);
  set.box(accent, 0, 1.48, 0, 0.48, 0.38, 0.36);
  set.box(M.gold, 0, 1.55, 0.2, 0.23, 0.035, 0.03);
}
function fence(set: Instancer, x: number, z: number, length: number) {
  set.at(x, z);
  set.box(M.woodLight, 0, 0.34, 0, 0.12, 0.11, length);
  for (let k = -length / 2 + 0.2; k <= length / 2 - 0.1; k += 0.55)
    set.box(M.white, 0, 0.47, k, 0.12, 0.38, 0.09);
}

export function batchDirectMeshes(parent: THREE.Object3D, excludedName = '') {
  const batches = new Map<
    string,
    {
      material: THREE.Material;
      cast: boolean;
      receive: boolean;
      geometries: THREE.BufferGeometry[];
      meshes: THREE.Mesh[];
    }
  >();
  parent.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4();
  if (parent instanceof THREE.Group || parent instanceof THREE.Scene)
    inverse.copy(parent.matrixWorld).invert();
  // oxlint-disable-next-line unicorn/no-useless-spread -- Keep a stable snapshot because this batch removes children.
  for (const child of [...parent.children]) {
    const mesh = child as THREE.Mesh;
    if (
      !mesh.isMesh ||
      (excludedName && mesh.name === excludedName) ||
      (mesh as THREE.InstancedMesh).isInstancedMesh
    )
      continue;
    if (Array.isArray(mesh.material)) continue;
    const material = mesh.material;
    const cast = mesh.castShadow,
      receive = mesh.receiveShadow;
    const key = `${material.uuid}|${cast ? 1 : 0}|${receive ? 1 : 0}`;
    let batch = batches.get(key);
    if (!batch) {
      batch = { material, cast, receive, geometries: [], meshes: [] };
      batches.set(key, batch);
    }
    const geometry = mesh.geometry.clone();
    mesh.updateMatrix();
    const local = new THREE.Matrix4().multiplyMatrices(
      inverse,
      mesh.matrixWorld,
    );
    geometry.applyMatrix4(local);
    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
    batch.geometries.push(nonIndexed);
    batch.meshes.push(mesh);
  }
  for (const [key, batch] of batches) {
    if (batch.geometries.length < 2) {
      for (const geometry of batch.geometries) geometry.dispose();
      batches.delete(key);
      continue;
    }
    const positions: number[] = [],
      normals: number[] = [];
    for (const geometry of batch.geometries) {
      const p = geometry.getAttribute('position'),
        n = geometry.getAttribute('normal');
      if (!p) continue;
      for (let i = 0; i < p.count; i++)
        positions.push(p.getX(i), p.getY(i), p.getZ(i));
      if (n)
        for (let i = 0; i < n.count; i++)
          normals.push(n.getX(i), n.getY(i), n.getZ(i));
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    if (normals.length === positions.length)
      merged.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(normals, 3),
      );
    else merged.computeVertexNormals();
    const mergedMesh = new THREE.Mesh(merged, batch.material);
    mergedMesh.castShadow = batch.cast;
    mergedMesh.receiveShadow = batch.receive;
    parent.add(mergedMesh);
    for (const mesh of batch.meshes) mesh.removeFromParent();
    for (const geometry of batch.geometries) geometry.dispose();
  }
}
function fountain(scene: THREE.Object3D) {
  const g = new THREE.Group();
  g.position.set(0, 0, 0);
  scene.add(g);
  cylinder(g, M.stoneDark, 0, 0.2, 0, 2.12, 2.18, 0.34, 20);
  cylinder(g, M.cream, 0, 0.39, 0, 1.91, 1.98, 0.18, 20);
  cylinder(g, M.glass, 0, 0.5, 0, 1.65, 1.72, 0.1, 20);
  cylinder(g, M.stone, 0, 0.83, 0, 0.58, 0.72, 0.63, 12);
  cylinder(g, M.gold, 0, 1.22, 0, 0.25, 0.32, 0.28, 10);
  sphere(g, M.glass, 0, 1.66, 0, 0.21, 1.3);
  const spray = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, 0.78, 7),
    mat('#d5f0e6', 0.2, { transparent: true, opacity: 0.75 }),
  );
  spray.position.set(0, 1.91, 0);
  g.add(spray);
  return g;
}
function kitchenGarden(scene: THREE.Object3D) {
  const g = new THREE.Group();
  g.name = 'village-farmland';
  g.position.set(VILLAGE_FARMLAND.x, 0, VILLAGE_FARMLAND.z);
  scene.add(g);
  const soil = mat('#76533a'),
    soilLight = mat('#916744'),
    stake = mat('#8b633e');
  const leaf = mat('#6c9b50'),
    cabbage = mat('#8db867'),
    pepper = mat('#d6824d');
  const w = VILLAGE_FARMLAND.width,
    d = VILLAGE_FARMLAND.depth;
  box(g, M.grassLight, 0, 0.045, 0, w + 0.24, 0.09, d + 0.22);
  box(g, soil, 0, 0.11, 0, w - 0.24, 0.12, d - 0.24);
  // Four short, raised beds with furrows and alternating leafy vegetables.
  const rowZ = [-0.88, -0.29, 0.3, 0.89];
  for (let row = 0; row < rowZ.length; row++) {
    const z = rowZ[row];
    box(g, row % 2 ? soilLight : soil, 0, 0.19, z, w - 0.92, 0.18, 0.47);
    for (let groove = -1; groove <= 1; groove++)
      box(g, M.woodLight, 0, 0.29, z + groove * 0.13, w - 1.2, 0.035, 0.035);
    for (let plant = 0; plant < 5; plant++) {
      const x = -1.75 + plant * 0.87;
      cylinder(g, M.leaf, x, 0.57, z, 0.07, 0.07, 0.62, 6);
      sphere(g, row % 2 ? cabbage : leaf, x - 0.18, 0.46, z - 0.06, 0.25, 0.75);
      sphere(g, row % 2 ? leaf : cabbage, x + 0.17, 0.46, z + 0.06, 0.25, 0.75);
      if (row === 0 && plant % 2 === 0)
        sphere(g, pepper, x, 0.52, z, 0.115, 1.18);
    }
  }
  // Low post-and-rail enclosure, open at the south gate.
  for (const side of [-1, 1]) {
    const x = side * (w / 2 - 0.16);
    box(g, stake, x, 0.43, 0, 0.13, 0.72, d);
    for (const z of [-1.22, -0.62, 0, 0.62, 1.22])
      box(g, M.woodLight, x, 0.3, z, 0.16, 0.12, 0.12);
    box(g, M.woodLight, x, 0.62, 0, 0.16, 0.12, d);
  }
  const backZ = d / 2 - 0.12,
    frontZ = -d / 2 + 0.12,
    sideRun = (w - 1.45) / 2,
    sideX = (w + 1.45) / 4;
  box(g, stake, 0, 0.43, backZ, w - 0.25, 0.72, 0.13);
  box(g, M.woodLight, 0, 0.62, backZ, w - 0.25, 0.12, 0.16);
  box(g, M.woodLight, 0, 0.3, backZ, w - 0.25, 0.12, 0.16);
  for (const side of [-1, 1]) {
    const cx = side * sideX;
    box(g, stake, cx, 0.43, frontZ, sideRun, 0.72, 0.13);
    box(g, M.woodLight, cx, 0.62, frontZ, sideRun, 0.12, 0.16);
    box(g, M.woodLight, cx, 0.3, frontZ, sideRun, 0.12, 0.16);
  }
  for (const x of [-0.72, 0.72]) {
    box(g, stake, x, 0.42, frontZ, 0.12, 0.7, 0.14);
    box(g, M.woodLight, x, 0.63, frontZ, 0.19, 0.12, 0.2);
  }
  // Simple scarecrow, rain barrel and produce crates.
  box(g, M.wood, -1.92, 0.98, 0.98, 0.13, 1.32, 0.13);
  box(g, M.woodLight, -1.92, 1.38, 0.98, 0.94, 0.13, 0.13);
  sphere(g, mat('#d7b98d'), -1.92, 1.78, 0.98, 0.25, 0.9);
  box(g, mat('#e0bd78'), -1.92, 1.78, 0.98, 0.57, 0.11, 0.55);
  for (const side of [-1, 1])
    box(g, mat('#a77855'), -1.92 + side * 0.32, 1.09, 0.98, 0.48, 0.18, 0.42);
  cylinder(g, mat('#879b94'), 2.03, 0.48, 1.02, 0.32, 0.37, 0.82, 10);
  cylinder(g, M.woodLight, 2.03, 0.9, 1.02, 0.38, 0.38, 0.12, 10);
  box(g, M.woodLight, 1.54, 0.34, 1.11, 0.62, 0.52, 0.58);
  box(g, stake, 1.54, 0.34, 1.11, 0.64, 0.04, 0.6);
  box(g, stake, 1.54, 0.34, 1.11, 0.04, 0.54, 0.6);
  const entryX = VILLAGE_FARMLAND_ENTRY.x - VILLAGE_FARMLAND.x;
  box(g, M.gold, entryX - 0.52, 0.18, frontZ, 0.26, 0.06, 0.16);
  box(g, M.gold, entryX + 0.52, 0.18, frontZ, 0.26, 0.06, 0.16);
  return g;
}

function waterTexture() {
  // A pale ripple strip multiplied by the water tint; its offset scrolls each frame.
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgb(232,244,244)';
  ctx.fillRect(0, 0, 128, 32);
  for (let i = 0; i < 9; i++) {
    const y = 3 + ((i * 11) % 28),
      x = (i * 37) % 128;
    ctx.strokeStyle = i % 3 ? 'rgba(255,255,255,0.9)' : 'rgba(205,228,228,0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) {
      const px = x + k,
        py = y + Math.sin(k / 6) * 1.2;
      if (k === 0) ctx.moveTo(px % 128, py);
      else ctx.lineTo(px % 128, py);
    }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(26, 1.2);
  return texture;
}

export type VillageWorld = {
  /** Scroll these offsets over time to animate the stream. */
  water: THREE.Texture[];
  decorations: THREE.Object3D[];
};

/** Builds the static village into `scene` (any Object3D root). */
export function buildVillageWorld(scene: THREE.Object3D): VillageWorld {
  const water: THREE.Texture[] = [],
    decorations: THREE.Object3D[] = [];
  const set = new Instancer();
  const bw = VILLAGE_BOUNDS.width,
    bd = VILLAGE_BOUNDS.depth;
  // Layered beveled-looking island plinth with a fine inset grass lip.
  box(scene, M.edge, 0, -0.48, 0, bw, 0.88, bd);
  box(scene, M.bank, 0, -0.16, 0, bw - 0.18, 0.16, bd - 0.18);
  box(scene, M.grass, 0, -0.055, 0, bw - 0.52, 0.12, bd - 0.52);
  box(scene, M.grassLight, 0, 0.008, 0, bw - 0.9, 0.035, bd - 0.9);

  // Stream bends through the north end; lighter banks and gravel edges frame it.
  const riverCenterZ = (VILLAGE_RIVER.minZ + VILLAGE_RIVER.maxZ) / 2;
  const riverDepth = VILLAGE_RIVER.maxZ - VILLAGE_RIVER.minZ;
  box(scene, M.bank, 0, 0.09, riverCenterZ, bw - 0.6, 0.15, riverDepth + 1.7);
  if (!M.water.map) M.water.map = waterTexture();
  water.push(M.water.map);
  const stream = box(
    scene,
    M.water,
    0,
    0.13,
    riverCenterZ,
    bw - 1.2,
    0.12,
    riverDepth + 0.25,
  );
  stream.name = 'village-water';
  // Pebbles line both banks without touching the bridge decks.
  for (const x of Array.from({ length: 40 }, (_, index) => -38.5 + index * 2)) {
    if (VILLAGE_RIVER.bridges.some((bridge) => Math.abs(x - bridge.x) < 3.2))
      continue;
    set.at(x, riverCenterZ + Math.sin(x * 0.42) * 0.18);
    set.add(
      sphereGeo,
      Math.round((x + 38.5) / 2) % 2 ? M.stone : M.cream,
      0,
      0.2,
      0,
      0.32,
      0.12,
      0.18,
      0,
      false,
    );
  }
  // Three bridges align to the exact crossings used by player collision.
  for (const { x: centerX, halfWidth } of VILLAGE_RIVER.bridges) {
    const halfDeck = halfWidth + 0.3;
    box(
      scene,
      M.wood,
      centerX,
      0.38,
      riverCenterZ,
      halfDeck * 2,
      0.34,
      riverDepth + 1.05,
    );
    box(
      scene,
      M.woodLight,
      centerX,
      0.59,
      riverCenterZ,
      halfDeck * 2 - 0.4,
      0.12,
      riverDepth + 0.72,
    );
    for (
      let x = centerX - halfWidth + 0.15;
      x <= centerX + halfWidth;
      x += 0.48
    )
      box(scene, M.wood, x, 0.67, riverCenterZ, 0.1, 0.1, riverDepth + 0.75);
    for (const side of [-1, 1]) {
      const railX = centerX + side * (halfWidth - 0.05);
      box(
        scene,
        M.wood,
        railX,
        0.98,
        riverCenterZ,
        0.16,
        0.82,
        riverDepth + 1.08,
      );
      box(
        scene,
        M.woodLight,
        railX,
        1.4,
        riverCenterZ,
        0.25,
        0.16,
        riverDepth + 1.18,
      );
      for (const z of [
        VILLAGE_RIVER.minZ - 0.18,
        riverCenterZ,
        VILLAGE_RIVER.maxZ + 0.18,
      ])
        box(scene, M.woodLight, railX, 1.13, z, 0.1, 0.45, 0.1);
    }
  }
  // Main walk network (shared with collision tests and the minimap).
  for (const [x1, z1, x2, z2, w] of VILLAGE_PATHS) {
    line(scene, M.path, x1, z1, x2, z2, w, 0.105);
    // Broken light stone insets make the main routes read as hand-laid paving.
    if (w > 1.6) {
      const dx = x2 - x1,
        dz = z2 - z1,
        len = Math.hypot(dx, dz),
        n = Math.floor(len / 1.25);
      set.at(0, 0);
      for (let i = 0; i <= n; i++) {
        const t = n ? i / n : 0.5;
        set.add(
          boxGeo,
          M.pathLight,
          x1 + dx * t,
          0.171,
          z1 + dz * t,
          w * 0.48,
          0.035,
          0.2,
          0,
          false,
          Math.atan2(dx, dz),
        );
      }
    }
  }
  // Tidy timber deck for the café seating beside the river crossing.
  const terraceX = VILLAGE_TERRACE.x,
    terraceZ = VILLAGE_TERRACE.z;
  box(
    scene,
    M.wood,
    terraceX,
    0.17,
    terraceZ,
    VILLAGE_TERRACE.width + 0.4,
    0.24,
    VILLAGE_TERRACE.depth + 0.35,
  );
  box(
    scene,
    M.woodLight,
    terraceX,
    0.31,
    terraceZ,
    VILLAGE_TERRACE.width + 0.13,
    0.1,
    VILLAGE_TERRACE.depth + 0.1,
  );
  for (
    let x = terraceX - VILLAGE_TERRACE.width / 2 + 0.2;
    x <= terraceX + VILLAGE_TERRACE.width / 2 - 0.2;
    x += 0.53
  )
    box(scene, M.wood, x, 0.37, terraceZ, 0.07, 0.055, VILLAGE_TERRACE.depth);
  for (const side of [-1, 1]) {
    const x = terraceX + side * (VILLAGE_TERRACE.width / 2 + 0.22);
    for (const z of [terraceZ - 0.9, terraceZ + 0.9])
      box(scene, M.wood, x, 0.64, z, 0.12, 0.62, 0.12);
    box(scene, M.woodLight, x, 0.96, terraceZ, 0.16, 0.14, 2.0);
  }
  // Pale parasol at the north-east corner leaves furniture footprints visible.
  cylinder(
    scene,
    M.woodLight,
    terraceX + 1.85,
    1.1,
    terraceZ + 0.78,
    0.075,
    0.075,
    1.55,
    8,
  );
  const umbrella = new THREE.Mesh(
    new THREE.ConeGeometry(1.18, 0.48, 10),
    mat('#fff0cf'),
  );
  umbrella.position.set(terraceX + 1.85, 1.98, terraceZ + 0.78);
  umbrella.rotation.y = 0.18;
  umbrella.castShadow = true;
  scene.add(umbrella);

  // Civic buildings and resident cottages use the coordinates from the shared layout.
  const homes = VILLAGE_PLACES.filter((p) => p.kind === 'home');
  homes.forEach((p, i) => decorations.push(buildHouse(scene, p, i)));
  const hall = VILLAGE_PLACES.find((p) => p.kind === 'hall');
  if (hall) decorations.push(buildCivicHall(scene, hall, false));
  const casino = VILLAGE_PLACES.find((p) => p.kind === 'casino');
  if (casino) decorations.push(buildCivicHall(scene, casino, true));
  const tailor = VILLAGE_PLACES.find((p) => p.kind === 'wardrobe');
  if (tailor) decorations.push(buildWardrobeShop(scene, tailor));
  decorations.push(kitchenGarden(scene));

  // Fountain plaza with alternating paving arcs.
  decorations.push(fountain(scene));
  set.at(0, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6,
      r = 2.62;
    set.add(
      boxGeo,
      i % 2 ? M.pathLight : M.stone,
      Math.sin(a) * r,
      0.12,
      Math.cos(a) * r,
      0.76,
      0.12,
      0.42,
      0,
      false,
      a,
    );
  }

  // Every decoration below comes from VILLAGE_DECOR, the same list collision uses.
  const accents = [
    M.roofG,
    M.roofA,
    M.roofF,
    M.roofB,
    M.roofD,
    M.roofE,
    M.roofC,
  ];
  for (const item of VILLAGE_DECOR) {
    if (item.kind === 'tree')
      tree(set, item.x, item.z, item.scale ?? 1, item.variant ?? 0);
    else if (item.kind === 'lamp') lamp(set, item.x, item.z);
    else if (item.kind === 'bench') bench(set, item.x, item.z, item.rotation);
    else if (item.kind === 'shrub')
      shrub(set, item.x, item.z, (item.variant ?? 0) % 3 ? M.leaf : M.leafLight);
    else if (item.kind === 'flowers')
      flowers(set, item.x, item.z, item.scale ?? 6, item.variant ?? 0);
    else if (item.kind === 'mailbox')
      mailbox(set, item.x, item.z, accents[item.home ?? 0] ?? M.roofA);
    else if (item.kind === 'fence' && item.collider?.shape === 'box')
      fence(set, item.x, item.z, item.collider.d);
    // Hydrangeas are kArchive models placed by the component; rails below.
  }

  // Short timber promenade at the eastern garden edge.
  const { x1, x2, z: deckZ, railZ } = VILLAGE_BOARDWALK;
  line(scene, M.woodLight, x1, deckZ, x2, deckZ, 1.7, 0.22);
  for (const z of railZ) line(scene, M.wood, x1, z, x2, z, 0.12, 0.3);
  for (let x = x1; x <= x2; x += 0.9)
    box(scene, M.wood, x, 0.34, deckZ, 0.1, 0.08, 1.62);
  for (const x of [29.2, 31.4, 33.6, 35.8, 38])
    for (const z of railZ) {
      set.at(x, z);
      set.box(M.wood, 0, 0.62, 0, 0.1, 0.62, 0.1);
      set.box(M.woodLight, 0, 0.94, 0, 0.1, 0.1, 0.1);
    }
  set.flush(scene);

  // Fold repeated static meshes into material batches while leaving the
  // animated stream and instanced decor independently addressable.
  // oxlint-disable-next-line unicorn/no-useless-spread -- Batching replaces some top-level children during this pass.
  for (const child of [...scene.children])
    if (child instanceof THREE.Group) batchDirectMeshes(child);
  batchDirectMeshes(scene, 'village-water');
  return { water, decorations };
}

/**
 * Shared ground and foliage materials the seasonal layer re-tints (spring
 * blossom, summer green, autumn gold, winter frost). Base colours are kept so
 * a season can always be derived from the original look.
 */
export const VILLAGE_SEASON_MATERIALS = {
  grass: M.grass,
  grassLight: M.grassLight,
  leaf: M.leaf,
  leafLight: M.leafLight,
  leafDark: M.leafDark,
  bank: M.bank,
} as const;
