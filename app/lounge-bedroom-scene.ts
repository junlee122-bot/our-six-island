import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LOUNGE_MODELS } from './lounge-model-assets';
import { LOUNGE_ASSETS } from './lounge-assets';
import { bedroomTheme, bedroomThemePoster } from './lounge-bedroom-themes';
import { MIKU_ROOM_ART } from './lounge-bedroom-collection';
import { WALK_FURNITURE } from './lounge-bedroom-navigation';
import { defaultBedroom } from './lounge-bedroom-data';
import type { LoungeSave } from './lounge-look';

export const BEDROOM_WALL_COLOR = {
  cream: '#eee6d7',
  sage: '#cbd1bd',
  blush: '#e3ccc2',
  blue: '#c9d8d6',
};
export const BEDROOM_FLOOR_COLOR = {
  oak: '#c3a579',
  walnut: '#8d7057',
  pale: '#e0d1b7',
};

/** A curated walkable studio. Its architectural layout never rewrites the saved decoration canvas. */
export function createBedroomScene(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  save: LoungeSave,
  host: HTMLElement,
  isDisposed: () => boolean,
) {
  const room = save.bedroom ?? defaultBedroom(save.actor),
    miku = save.actor === 0,
    theme = bedroomTheme(save.actor);
  host.dataset.theme = theme.tag;
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const surface = (color: string) => {
    let value = materials.get(color);
    if (!value) {
      value = new THREE.MeshStandardMaterial({ color, roughness: 0.84 });
      materials.set(color, value);
    }
    return value;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    color: string | THREE.Material,
    parent: THREE.Object3D = scene,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      typeof color === 'string' ? surface(color) : color,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (
    r: number,
    height: number,
    x: number,
    y: number,
    z: number,
    color: string,
    parent: THREE.Object3D = scene,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, height, 20),
      surface(color),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const sphere = (
    r: number,
    x: number,
    y: number,
    z: number,
    color: string,
    parent: THREE.Object3D = scene,
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 16, 12),
      surface(color),
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const promises: Promise<unknown>[] = [];
  const fallback = new Map<string, THREE.Group>();
  const placeholder = (id: string) => {
    const g = new THREE.Group();
    scene.add(g);
    fallback.set(id, g);
    return g;
  };
  const furniture = Object.fromEntries(
    WALK_FURNITURE.map((item) => [item.id, item]),
  );
  const wall = new THREE.MeshStandardMaterial({
    color: BEDROOM_WALL_COLOR[room.wall],
    roughness: 1,
  });
  const floors = Array.from(
    { length: 5 },
    (_, index) =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(BEDROOM_FLOOR_COLOR[room.floor]).offsetHSL(
          0,
          0,
          ((index % 3) - 1) * 0.018,
        ),
        roughness: 0.91,
      }),
  );
  scene.add(new THREE.HemisphereLight('#fff7e7', '#928e79', 2));
  const sun = new THREE.DirectionalLight('#ffefd5', 2.3);
  sun.position.set(-4, 9, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -8,
    right: 8,
    top: 8,
    bottom: -8,
    near: 0.1,
    far: 30,
  });
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.00015;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#e4eee6', 1.1);
  fill.position.set(7, 5, 1);
  scene.add(fill);

  // Light oak planks, wainscoting and a picture rail make one coherent shell.
  box(10.28, 0.3, 8.48, 0, -0.2, 0, '#937a5a');
  const plankGeometry = new THREE.BoxGeometry(1.99, 0.065, 0.29);
  floors.forEach((material, color) => {
    const matrices: THREE.Matrix4[] = [];
    for (let row = 0; row < 28; row++)
      for (let col = 0; col < 5; col++)
        if ((row + col * 2) % floors.length === color)
          matrices.push(
            new THREE.Matrix4().makeTranslation(
              -4 + col * 2,
              -0.016,
              -4.2 + row * 0.3 + 0.15,
            ),
          );
    const planks = new THREE.InstancedMesh(
      plankGeometry,
      material,
      matrices.length,
    );
    matrices.forEach((matrix, index) => planks.setMatrixAt(index, matrix));
    planks.receiveShadow = true;
    scene.add(planks);
  });
  box(10.23, 3.8, 0.16, 0, 1.85, -4.17, wall);
  box(0.16, 3.8, 8.3, -5.08, 1.85, 0, wall);
  box(10.1, 0.77, 0.055, 0, 0.47, -4.045, '#d8d9c8');
  box(0.055, 0.77, 8.16, -4.955, 0.47, 0, '#d8d9c8');
  for (const y of [0.13, 0.88, 3.68]) {
    box(10.16, 0.07, 0.13, 0, y, -4.03, '#f4eddf');
    box(0.13, 0.07, 8.23, -4.95, y, 0, '#f4eddf');
  }
  for (let i = 0; i < 12; i++)
    box(0.027, 0.67, 0.07, -4.8 + i * 0.85, 0.49, -4.005, '#c3c7b4');
  for (let i = 0; i < 10; i++)
    box(0.07, 0.67, 0.027, -4.915, 0.49, -3.85 + i * 0.83, '#c3c7b4');
  // The window stays directly over the seating nook; all circulation is in front.
  box(2.95, 1.9, 0.12, -2.1, 2.49, -4.045, '#ac9471');
  box(
    2.7,
    1.64,
    0.13,
    -2.1,
    2.49,
    -3.97,
    new THREE.MeshBasicMaterial({ color: '#d4e5d3' }),
  );
  for (const x of [-3.46, -2.1, -0.74])
    box(0.065, 1.77, 0.16, x, 2.49, -3.89, '#faf2df');
  for (const y of [1.65, 2.49, 3.33])
    box(2.8, 0.065, 0.16, -2.1, y, -3.89, '#faf2df');
  box(3.15, 0.1, 0.36, -2.1, 1.56, -3.83, '#f3e8d2');
  const curtainGroup = placeholder('curtains');
  for (const side of [-3.73, -0.66])
    for (let fold = 0; fold < 4; fold++)
      cylinder(
        0.07,
        2.13,
        side + fold * 0.09,
        2.4,
        -3.82,
        '#e8dcc5',
        curtainGroup,
      );
  box(3.63, 0.06, 0.08, -2.08, 3.49, -3.77, '#9b805a', curtainGroup);
  // Recessed entry door at the open front end of the left wall.
  box(0.1, 2.63, 1.23, -4.93, 1.37, 2.94, '#a98e6a');
  box(0.11, 2.43, 1.04, -4.86, 1.28, 2.94, '#c9b58f');
  for (const y of [0.68, 1.72])
    box(0.015, 0.8, 0.78, -4.795, y, 2.94, '#dfcdaa');
  sphere(0.052, -4.72, 1.23, 3.28, '#b09557');

  const {
    sofa,
    bed,
    desk,
    table,
    shelf,
    chair,
    nightstand,
    wardrobe,
    display,
    plant,
  } = furniture;
  const fallbackSpecs = [
    ['sofa', sofa, 1.03, '#a1b6a4'],
    ['bed', bed, 0.67, '#c8bbb0'],
    ['desk', desk, 0.77, '#c5a477'],
    ['bookshelf', shelf, 1.85, '#c2a67f'],
    ['coffeeTable', table, 0.55, '#baa17b'],
    ['chair', chair, 0.62, '#859582'],
    ['nightstand', nightstand, 0.62, '#d4c5aa'],
    ['wardrobe', wardrobe, 2.12, '#e8e2d2'],
    ['plantStand', plant, 0.77, '#9faf83'],
  ] as const;
  for (const [id, point, height, color] of fallbackSpecs)
    box(
      point.width,
      height,
      point.depth,
      point.x,
      height / 2 + 0.04,
      point.z,
      color,
      placeholder(id),
    );
  box(4.3, 0.025, 3.2, 0.2, 0.029, 1.27, '#d3d9c1', placeholder('rug'));
  const rugStripe = surface('#b5bea4');
  for (const x of [-1.75, 2.15])
    box(0.035, 0.012, 2.85, x, 0.056, 1.27, rugStripe);

  const loader = new GLTFLoader();
  const disposeLoaded = (root: THREE.Object3D) => {
    const textures = new Set<THREE.Texture>();
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      for (const material of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]) {
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) textures.add(value);
        material.dispose();
      }
    });
    for (const texture of textures) {
      texture.dispose();
      const image = texture.source.data;
      if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap)
        image.close();
    }
  };
  const model = (
    key: keyof typeof LOUNGE_MODELS,
    id: string,
    x: number,
    z: number,
    width: number,
    depth: number,
    height: number,
    y = 0.05,
    rotation = 0,
    stretch = false,
  ) => {
    promises.push(
      loader.loadAsync(LOUNGE_MODELS[key]).then((gltf) => {
        const object = gltf.scene;
        if (isDisposed()) {
          disposeLoaded(object);
          return;
        }
        object.rotation.y = rotation;
        object.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(object),
          size = bounds.getSize(new THREE.Vector3());
        const ratio = new THREE.Vector3(
          width / Math.max(size.x, 0.001),
          height / Math.max(size.y, 0.001),
          depth / Math.max(size.z, 0.001),
        );
        if (stretch) object.scale.multiply(ratio);
        else object.scale.multiplyScalar(Math.min(ratio.x, ratio.y, ratio.z));
        object.updateMatrixWorld(true);
        const fitted = new THREE.Box3().setFromObject(object),
          center = fitted.getCenter(new THREE.Vector3());
        object.position.add(
          new THREE.Vector3(x - center.x, y - fitted.min.y, z - center.z),
        );
        object.name = id;
        object.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        scene.add(object);
        if (fallback.has(id)) fallback.get(id)!.visible = false;
        renderer.shadowMap.needsUpdate = true;
        host.dataset[id] = 'loaded';
        host.dataset.modelsLoaded = String(
          Number(host.dataset.modelsLoaded ?? 0) + 1,
        );
      }),
    );
  };
  model('sofa', 'sofa', sofa.x, sofa.z, sofa.width, sofa.depth, 1.28);
  model('bed', 'bed', bed.x, bed.z, bed.width, bed.depth, 1.4);
  model('desk', 'desk', desk.x, desk.z, desk.width, desk.depth, 0.74);
  model(
    'archiveBookcase',
    'bookshelf',
    shelf.x,
    shelf.z,
    shelf.width,
    shelf.depth,
    2.12,
    0.05,
    Math.PI / 2,
  );
  model(
    'teaTable',
    'coffeeTable',
    table.x,
    table.z,
    table.width,
    table.depth,
    0.66,
  );
  model(
    'plantStand',
    'plantStand',
    plant.x,
    plant.z,
    plant.width,
    plant.depth,
    1.45,
    0.05,
    -0.18,
  );
  model(
    'chair',
    'chair',
    chair.x,
    chair.z,
    chair.width,
    chair.depth,
    1.06,
    0.05,
    Math.PI,
  );
  model(
    'nightstand',
    'nightstand',
    nightstand.x,
    nightstand.z,
    nightstand.width,
    nightstand.depth,
    0.66,
  );
  model(
    'wardrobe',
    'wardrobe',
    wardrobe.x,
    wardrobe.z,
    wardrobe.width,
    wardrobe.depth,
    2.1,
  );
  model('rug', 'rug', 0.2, 1.27, 4.3, 3.2, 0.025, 0.025, 0, true);
  model('curtains', 'curtains', -2.07, -3.82, 3.63, 0.18, 2.2, 1.3, 0, true);
  model('lamp', 'deskLamp', desk.x - 0.52, desk.z - 0.13, 0.3, 0.3, 0.44, 0.79);
  model(
    'lamp',
    'bedsideLamp',
    nightstand.x,
    nightstand.z,
    0.33,
    0.33,
    0.46,
    0.7,
  );
  model(
    'cushions',
    'cushions',
    bed.x + 0.15,
    bed.z + 0.72,
    0.88,
    0.5,
    0.4,
    0.8,
  );
  model('tulips', 'tulips', -2.9, -3.82, 0.36, 0.33, 0.49, 1.58);
  const bedside = new THREE.PointLight('#ffddb0', 1.15, 2.8);
  bedside.position.set(nightstand.x, 1.15, nightstand.z);
  scene.add(bedside);
  // A low oak collector's cabinet is also a physical edge, never in the central aisle.
  box(
    display.width,
    0.12,
    display.depth,
    display.x,
    0.16,
    display.z,
    '#ab9270',
  );
  box(
    display.width,
    0.12,
    display.depth,
    display.x,
    0.86,
    display.z,
    '#d5c3a0',
  );
  box(display.width, 0.07, display.depth, display.x, 0.5, display.z, '#d5c3a0');
  box(display.width, 0.73, 0.055, display.x, 0.48, display.z - 0.3, '#ccdbcf');
  for (const dx of [-0.86, 0.86])
    box(0.075, 0.77, display.depth, display.x + dx, 0.48, display.z, '#baa17b');
  const recordColors = ['#a4c7b9', '#d2b69b', '#ceaea2', '#788d8c'];
  for (let i = 0; i < 8; i++)
    box(
      0.07,
      0.23,
      0.29,
      display.x - 0.64 + i * 0.11,
      0.33,
      display.z + 0.02,
      recordColors[i % 4],
    );

  const art = (
    url: string,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
    rotation = 0,
  ) => {
    promises.push(
      new THREE.TextureLoader().loadAsync(url).then((texture) => {
        if (isDisposed()) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        const image = new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.04,
            roughness: 1,
            side: THREE.DoubleSide,
          }),
        );
        image.position.set(x, y, z);
        image.rotation.y = rotation;
        scene.add(image);
      }),
    );
  };
  // A real shelf of small collectible figures, with sculpted twin tails and costume details.
  const figure = (
    x: number,
    y: number,
    z: number,
    scale: number,
    hair = '#65bbae',
  ) => {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.scale.setScalar(scale);
    scene.add(group);
    cylinder(0.18, 0.04, 0, 0.02, 0, '#c5ded2', group);
    for (const side of [-1, 1]) {
      box(0.045, 0.2, 0.055, side * 0.058, 0.15, 0, '#394b50', group);
      box(0.062, 0.038, 0.09, side * 0.058, 0.053, 0.02, '#293d43', group);
      const tail = sphere(0.11, side * 0.18, 0.47, -0.03, hair, group);
      tail.scale.set(0.52, 2.05, 0.55);
      tail.rotation.z = side * 0.17;
      box(0.065, 0.025, 0.065, side * 0.15, 0.63, 0, '#c6859a', group);
    }
    const skirt = cylinder(0.145, 0.135, 0, 0.26, 0, '#384b4d', group);
    skirt.scale.set(1, 1, 0.65);
    box(0.18, 0.16, 0.105, 0, 0.37, 0, '#e6ded1', group);
    box(0.027, 0.13, 0.012, 0, 0.37, 0.059, hair, group);
    sphere(0.116, 0, 0.56, 0, '#f1d4b9', group);
    const crown = sphere(0.123, 0, 0.612, -0.022, hair, group);
    crown.scale.set(1, 0.67, 1);
    for (const side of [-1, 1]) {
      box(0.012, 0.027, 0.014, side * 0.04, 0.557, 0.11, '#355859', group);
      const arm = box(
        0.042,
        0.19,
        0.045,
        side * 0.126,
        0.36,
        0,
        '#495e61',
        group,
      );
      arm.rotation.z = side * -0.28;
    }
    return group;
  };
  if (miku) {
    host.dataset.collection = 'miku';
    host.dataset.collectionProps = '18';
    // Framed key art and two sleeve designs form a single gallery over the bed.
    art(MIKU_ROOM_ART['miku-poster'], 1.12, 1.5, 3.02, 2.66, -4.055);
    art(MIKU_ROOM_ART['miku-records'], 1.1, 0.95, 1.5, 2.73, -4.04);
    art(MIKU_ROOM_ART['miku-banner'], 0.68, 0.83, 4.33, 2.75, -4.04);
    art(
      MIKU_ROOM_ART['miku-banner'],
      0.76,
      0.95,
      -4.97,
      2.52,
      0.06,
      Math.PI / 2,
    );
    figure(display.x - 0.56, 0.93, display.z, 1.04);
    figure(display.x, 0.93, display.z, 0.88, '#72c9bc');
    figure(display.x + 0.58, 0.93, display.z, 0.97, '#78b6b3');
    // Acrylic stand on the desk, paired light sticks and a headphone stand.
    art(
      MIKU_ROOM_ART['miku-acrylic'],
      0.48,
      0.48,
      desk.x + 0.43,
      1.04,
      desk.z - 0.13,
    );
    cylinder(0.105, 0.028, desk.x + 0.41, 0.8, desk.z - 0.13, '#bad4c3');
    cylinder(0.085, 0.075, desk.x + 0.05, 0.83, desk.z - 0.17, '#f0e5ce');
    for (const dx of [-0.04, 0.04]) {
      const stick = cylinder(
        0.023,
        0.29,
        desk.x + 0.05 + dx,
        1.01,
        desk.z - 0.17,
        '#84d4b5',
      );
      stick.rotation.z = dx * 2;
    }
    cylinder(0.11, 0.027, desk.x - 0.15, 0.8, desk.z + 0.03, '#a6b5a3');
    box(0.025, 0.3, 0.025, desk.x - 0.15, 0.96, desk.z + 0.03, '#7e8b7b');
    const headphones = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.023, 8, 20, Math.PI),
      surface('#4d7772'),
    );
    headphones.position.set(desk.x - 0.15, 1.065, desk.z + 0.03);
    scene.add(headphones);
    for (const side of [-1, 1])
      box(
        0.052,
        0.1,
        0.055,
        desk.x - 0.15 + side * 0.115,
        1.04,
        desk.z + 0.03,
        '#8ccdbc',
      );
    box(0.72, 0.016, 0.33, desk.x + 0.12, 0.8, desk.z + 0.11, '#8db9a5');
    for (let i = 0; i < 10; i++)
      box(
        0.043,
        0.012,
        0.17,
        desk.x - 0.15 + i * 0.061,
        0.815,
        desk.z + 0.1,
        i % 3 ? '#eee7d6' : '#496766',
      );
    const cushion = sphere(0.24, bed.x - 0.2, 0.89, bed.z + 0.4, '#80b5a2');
    cushion.scale.set(1, 0.35, 0.8);
    art(
      MIKU_ROOM_ART['miku-cushion'],
      0.45,
      0.45,
      bed.x - 0.2,
      1.01,
      bed.z + 0.5,
    );
    // A soft gallery rail and small hanging lights echo concert colours without glare.
    box(3.9, 0.04, 0.075, 2.9, 1.7, -3.96, '#6c9c8a');
    const bulbMaterial = new THREE.MeshStandardMaterial({
      color: '#c7e8c6',
      emissive: '#82b79c',
      emissiveIntensity: 0.32,
    });
    for (let i = 0; i < 9; i++) {
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 6),
        bulbMaterial,
      );
      bulb.position.set(1.04 + i * 0.46, 1.62, -3.94);
      scene.add(bulb);
    }
  } else {
    art(bedroomThemePoster(save.actor), 1.14, 1.52, 3.2, 2.65, -4.04);
    art(LOUNGE_ASSETS.bedroom_photo_string, 1.5, 0.66, 1.4, 2.7, -4.04);
    art(
      LOUNGE_ASSETS.bedroom_photo_string,
      1.55,
      0.68,
      -4.97,
      2.38,
      0.02,
      Math.PI / 2,
    );
    for (let i = 0; i < 3; i++)
      box(
        0.26,
        0.34,
        0.11,
        display.x - 0.6 + i * 0.6,
        1.09,
        display.z,
        recordColors[i],
      );
    cylinder(0.1, 0.18, desk.x + 0.5, 0.9, desk.z - 0.1, '#e1c9aa');
    box(0.55, 0.015, 0.33, desk.x + 0.1, 0.8, desk.z + 0.1, '#93a890');
    box(0.23, 0.025, 0.27, desk.x + 0.1, 0.824, desk.z + 0.1, '#f5ecd9');
  }
  // Distinct objects make each friend's studio recognizable beyond wall colour.
  const potted = (x: number, y: number, z: number, scale = 1) => {
    cylinder(0.115 * scale, 0.17 * scale, x, y + 0.085 * scale, z, '#c8ad89');
    for (let i = 0; i < 4; i++) {
      const leaf = sphere(
        0.09 * scale,
        x + Math.cos(i * 2.2) * 0.07 * scale,
        y + 0.24 * scale + (i % 2) * 0.1 * scale,
        z + Math.sin(i * 2.2) * 0.06 * scale,
        '#839d70',
      );
      leaf.scale.set(0.7, 1.4, 0.65);
    }
  };
  const turntable = () => {
    box(0.57, 0.065, 0.39, desk.x + 0.12, 0.84, desk.z, '#9a7a5d');
    cylinder(0.148, 0.012, desk.x + 0.06, 0.881, desk.z, '#344448');
    cylinder(0.039, 0.014, desk.x + 0.06, 0.89, desk.z, theme.accent);
    const arm = box(
      0.017,
      0.019,
      0.25,
      desk.x + 0.3,
      0.891,
      desk.z + 0.03,
      '#b8bca7',
    );
    arm.rotation.y = 0.4;
    for (const dx of [-0.67, 0.67]) {
      box(0.2, 0.29, 0.18, desk.x + dx, 0.94, desk.z - 0.16, '#72695b');
      const cone = new THREE.Mesh(
        new THREE.CircleGeometry(0.059, 20),
        surface('#344447'),
      );
      cone.position.set(desk.x + dx, 0.95, desk.z - 0.063);
      scene.add(cone);
    }
  };
  if (save.actor === 1 || save.actor === 4) {
    turntable();
    for (let i = 0; i < 3; i++) {
      box(
        0.33,
        0.36,
        0.035,
        display.x - 0.57 + i * 0.56,
        1.08,
        display.z,
        recordColors[i],
      );
      const record = new THREE.Mesh(
        new THREE.CircleGeometry(0.107, 24),
        surface('#435257'),
      );
      record.position.set(display.x - 0.57 + i * 0.56, 1.09, display.z + 0.022);
      scene.add(record);
    }
    if (save.actor === 4) {
      const warm = new THREE.PointLight('#e6b3a3', 0.6, 3.1);
      warm.position.set(display.x, 1.6, display.z);
      scene.add(warm);
    }
  }
  if (save.actor === 2) {
    potted(display.x - 0.6, 0.93, display.z, 0.85);
    potted(display.x, 0.93, display.z, 1.2);
    potted(display.x + 0.6, 0.93, display.z, 0.85);
    potted(desk.x + 0.4, 0.82, desk.z, 1.0);
    potted(-3.1, 1.61, -3.82, 0.75);
  }
  if (save.actor === 3) {
    for (let i = 0; i < 5; i++)
      box(
        0.38,
        0.055,
        0.28,
        display.x - 0.45,
        0.95 + i * 0.055,
        display.z,
        recordColors[i % 4],
      );
    box(0.63, 0.025, 0.33, desk.x + 0.07, 0.82, desk.z, '#eee4ce');
    box(0.012, 0.03, 0.33, desk.x + 0.07, 0.843, desk.z, '#aabbaa');
    cylinder(0.07, 0.11, desk.x + 0.61, 0.867, desk.z + 0.1, '#eee2c9');
    potted(display.x + 0.48, 0.93, display.z, 0.9);
  }
  if (save.actor === 5) {
    box(0.35, 0.23, 0.15, display.x, 0.99, display.z, '#5e665b');
    const lens = cylinder(
      0.075,
      0.09,
      display.x,
      1,
      display.z + 0.11,
      '#344c4a',
    );
    lens.rotation.x = Math.PI / 2;
    for (const dx of [-0.6, 0.6])
      box(
        0.27,
        0.33,
        0.045,
        display.x + dx,
        1.07,
        display.z,
        dx < 0 ? '#d5be8e' : '#97b69d',
      );
    box(0.38, 0.06, 0.28, desk.x + 0.26, 0.837, desk.z, '#b79f78');
    box(0.31, 0.022, 0.24, desk.x + 0.25, 0.88, desk.z, '#e9e0c8');
    potted(display.x + 0.7, 0.93, display.z, 0.6);
  }
  if (save.actor === 6) {
    const board = box(
      0.63,
      0.04,
      0.45,
      display.x - 0.32,
      0.95,
      display.z,
      '#c5b288',
    );
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 6; col++)
        if ((row + col) % 2 === 0)
          box(
            0.101,
            0.003,
            0.109,
            board.position.x - 0.25 + col * 0.1,
            0.972,
            display.z - 0.168 + row * 0.111,
            '#697e70',
          );
    for (const dx of [-0.18, 0, 0.18]) {
      cylinder(
        0.032,
        0.09,
        display.x - 0.32 + dx,
        1.02,
        display.z + 0.11,
        '#ece0bc',
      );
      sphere(0.032, display.x - 0.32 + dx, 1.075, display.z + 0.11, '#ece0bc');
    }
    const controller = box(
      0.34,
      0.08,
      0.17,
      desk.x + 0.2,
      0.854,
      desk.z,
      '#e4e1cd',
    );
    controller.rotation.y = 0.1;
    for (const dx of [-0.12, 0.12]) {
      const handle = sphere(
        0.08,
        desk.x + 0.2 + dx,
        0.836,
        desk.z + 0.06,
        theme.accent,
      );
      handle.scale.set(0.8, 0.7, 1.35);
    }
    cylinder(0.026, 0.025, desk.x + 0.3, 0.912, desk.z, '#ad888c');
    box(0.048, 0.015, 0.048, desk.x + 0.1, 0.906, desk.z, '#65867a');
  }
  // Wall clock, two botanical stems, and a plain cotton throw finish the room.
  const clock = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 32),
    surface('#f4edda'),
  );
  clock.position.set(-0.24, 2.75, -4.045);
  scene.add(clock);
  box(0.019, 0.15, 0.018, -0.24, 2.81, -4.02, '#6e7767');
  box(0.12, 0.019, 0.018, -0.19, 2.75, -4.02, '#6e7767');
  box(0.84, 0.045, 0.91, bed.x + 0.49, 0.77, bed.z + 0.85, theme.accent);
  host.dataset.design = 'studio-v2';
  return { promises, paint: { wall, floor: floors }, sun };
}
