/**
 * 허풍 주점 interior (three.js): the walnut plank room's own furnishings on
 * top of the shared interior shell (lounge-interior-scene.ts). kArchive props
 * (자료: kArchive · 출처: 쓰레드 dogfooter; lounge/tavern/assets.json) load
 * only here, per upgrade tier (lounge-venue-upgrades.ts venueLook): the base
 * set first, each finished upgrade's props when it is in the list. Procedural
 * pieces fill what kArchive does not have: the toy cork gun (뻥총) on the
 * table, a dartboard, a gramophone, wanted-style posters, the oval rug and
 * the hanji lanterns' light. Everything is disposed with the scene.
 */
import * as THREE from 'three';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LOUNGE_MODELS, VALLEY_MODELS, tavernModelUrl, type TavernModel } from './lounge-model-assets';
import { FRIEND_MODELS, FRIEND_PROP_SIZE } from './lounge-friend-props';
import { TAVERN_DECOR, TAVERN_MODEL_SIZE, TAVERN_SPOTS } from './lounge-tavern-layout';
import { VALLEY_MODEL_SIZE } from './lounge-village-layout';
import { INTERIOR_ROOM } from './lounge-interior-layout';

type Kit = {
  root: THREE.Group;
  loader: GLTFLoader;
  surface: (color: string, extra?: THREE.MeshStandardMaterialParameters) => THREE.MeshStandardMaterial;
  box: (w: number, h: number, d: number, x: number, y: number, z: number, m: string | THREE.Material, parent?: THREE.Object3D, shadow?: boolean) => THREE.Mesh;
  cylinder: (rt: number, rb: number, h: number, x: number, y: number, z: number, m: string | THREE.Material, parent?: THREE.Object3D, seg?: number) => THREE.Mesh;
  canvasTexture: (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => THREE.CanvasTexture;
  textures: THREE.Texture[];
  geometries: THREE.BufferGeometry[];
  /** A loaded GLB scene the kit owns (disposed with the scene). */
  own: (model: THREE.Group) => void;
  isDisposed: () => boolean;
  /** A model was placed: the view should re-render. */
  changed: () => void;
  /** A tavern model arrived (the scene swaps the table and chairs in). */
  arrived: (key: TavernModel) => void;
  font: string;
};

/** Copy of a loaded model, shadows on. */
function copyOf(source: THREE.Group, scale: number, rot = 0) {
  const copy = source.clone(true);
  copy.scale.setScalar(scale);
  copy.rotation.y = rot;
  copy.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) child.castShadow = child.receiveShadow = true;
  });
  return copy;
}

/** The toy revolver (뻥총): ~400 triangles, brass and walnut, a cork in the muzzle. */
export function buildCorkGun(kit: Pick<Kit, 'surface' | 'geometries'>) {
  const gun = new THREE.Group();
  gun.name = 'cork-gun';
  const brass = kit.surface('#c8a24a', { roughness: 0.45, metalness: 0.3 }),
    walnut = kit.surface('#6b4226'),
    cork = kit.surface('#d9b27a'),
    ribbon = kit.surface('#b3452f');
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
    kit.geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    gun.add(mesh);
    return mesh;
  };
  add(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 10), brass, 0.11, 0.05, 0, 0, 0, Math.PI / 2);
  add(new THREE.CylinderGeometry(0.022, 0.02, 0.03, 10), cork, 0.235, 0.05, 0, 0, 0, Math.PI / 2);
  add(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 6), brass, -0.01, 0.05, 0, 0, 0, Math.PI / 2);
  add(new THREE.BoxGeometry(0.05, 0.12, 0.04), walnut, -0.07, -0.01, 0, 0, 0, 0.45);
  add(new THREE.TorusGeometry(0.03, 0.006, 6, 12, Math.PI), brass, -0.02, -0.005, 0, 0, 0, Math.PI);
  add(new THREE.BoxGeometry(0.03, 0.014, 0.012), ribbon, -0.08, 0.03, 0.022);
  return gun;
}

/** The room's own things. Returns the hooks the scene calls later. */
export function buildTavern(kit: Kit, options: { props: readonly TavernModel[] }) {
  const { root, surface, box, cylinder, canvasTexture, textures } = kit;
  const { minZ, maxX } = INTERIOR_ROOM;
  const groups = new Map<TavernModel, THREE.Group>();
  const loaded = new Map<TavernModel, THREE.Group | 'loading'>();
  let wanted = new Set<TavernModel>(options.props);

  // ---------------------------------------------------------- procedural decor
  // Oval rug under the table (oxblood border).
  const rugTexture = canvasTexture(256, 176, (c) => {
    c.fillStyle = '#5b2620';
    c.beginPath();
    c.ellipse(128, 88, 124, 84, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#d19a4a';
    c.lineWidth = 5;
    c.beginPath();
    c.ellipse(128, 88, 108, 70, 0, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = '#7a3a2c';
    c.beginPath();
    c.ellipse(128, 88, 96, 60, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#d19a4a';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      c.beginPath();
      c.arc(128 + Math.cos(a) * 82, 88 + Math.sin(a) * 51, 3, 0, Math.PI * 2);
      c.fill();
    }
  });
  textures.push(rugTexture);
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(6.2, 4.1),
    new THREE.MeshStandardMaterial({ map: rugTexture, roughness: 1, transparent: true, alphaTest: 0.05 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.02, -0.3);
  rug.receiveShadow = true;
  root.add(rug);
  // Posters: "이달의 허풍왕" (wanted-poster style) and a warning.
  for (const p of TAVERN_DECOR.posters) {
    const tex = canvasTexture(200, 260, (c) => {
      c.fillStyle = '#e8d2a4';
      c.fillRect(0, 0, 200, 260);
      c.strokeStyle = '#7a4e2c';
      c.lineWidth = 6;
      c.strokeRect(8, 8, 184, 244);
      c.fillStyle = '#5a3218';
      c.textAlign = 'center';
      c.font = `900 26px ${kit.font}`;
      c.fillText(p.title === '이달의 허풍왕' ? 'WANTED' : '주의', 100, 44);
      c.font = `800 24px ${kit.font}`;
      c.fillText(p.title, 100, 232);
      if (p.title === '이달의 허풍왕') {
        c.fillStyle = '#c9a877';
        c.beginPath();
        c.arc(100, 118, 54, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#5a3218';
        c.font = `900 64px ${kit.font}`;
        c.fillText('?', 100, 140);
        c.font = `700 18px ${kit.font}`;
        c.fillText('현상금 10,000범', 100, 196);
      } else {
        c.fillStyle = '#b3452f';
        c.font = `900 70px ${kit.font}`;
        c.fillText('뻥!', 100, 140);
        c.fillStyle = '#5a3218';
        c.font = `700 17px ${kit.font}`;
        c.fillText('사람에게 겨누지 마세요', 100, 196);
      }
    });
    textures.push(tex);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.91), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
    mesh.position.set(INTERIOR_ROOM.minX + 0.05, p.y, p.z);
    mesh.rotation.set(0, Math.PI / 2, p.z < -2 ? -0.03 : 0.04);
    root.add(mesh);
  }
  // Dartboard with three darts.
  {
    const tex = canvasTexture(128, 128, (c) => {
      const rings = ['#1d1512', '#e8d9b0', '#1d1512', '#b3452f', '#e8d9b0', '#2f6a3a', '#b3452f'];
      rings.forEach((color, i) => {
        c.fillStyle = color;
        c.beginPath();
        c.arc(64, 64, 62 - i * 9, 0, Math.PI * 2);
        c.fill();
      });
      c.strokeStyle = '#d19a4a';
      c.lineWidth = 1.5;
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        c.beginPath();
        c.moveTo(64, 64);
        c.lineTo(64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60);
        c.stroke();
      }
    });
    textures.push(tex);
    const board = new THREE.Mesh(new THREE.CircleGeometry(0.34, 28), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    board.position.set(TAVERN_DECOR.dartboard.x, TAVERN_DECOR.dartboard.y, minZ + 0.05);
    root.add(board);
    cylinder(0.36, 0.36, 0.04, TAVERN_DECOR.dartboard.x, TAVERN_DECOR.dartboard.y, minZ + 0.03, '#3a2418').rotation.x = Math.PI / 2;
    for (const [dx, dy] of [[0.05, 0.03], [-0.08, -0.06], [0.12, -0.1]] as const) {
      const dart = cylinder(0.006, 0.006, 0.16, TAVERN_DECOR.dartboard.x + dx, TAVERN_DECOR.dartboard.y + dy, minZ + 0.13, '#c8a24a');
      dart.rotation.x = Math.PI / 2;
    }
  }
  // Gramophone on a little cabinet (the horn turned toward the room).
  {
    const { x, z } = TAVERN_DECOR.gramophone;
    box(0.62, 0.7, 0.5, x, 0.35, z, '#6b4226');
    box(0.5, 0.12, 0.42, x, 0.76, z, '#3a2418');
    const disc = cylinder(0.17, 0.17, 0.015, x, 0.83, z, '#1d1512', root, 20);
    disc.name = 'gramophone-disc';
    const profile = [
      [0.012, 0],
      [0.02, 0.1],
      [0.05, 0.22],
      [0.12, 0.32],
      [0.2, 0.36],
    ].map(([a, b]) => new THREE.Vector2(a, b));
    const horn = new THREE.LatheGeometry(profile, 18);
    kit.geometries.push(horn);
    const hornMesh = new THREE.Mesh(horn, surface('#c8a24a', { roughness: 0.4, metalness: 0.35, side: THREE.DoubleSide }));
    hornMesh.position.set(x - 0.12, 0.84, z + 0.05);
    hornMesh.rotation.set(0.6, 0, 0.5);
    hornMesh.castShadow = true;
    root.add(hornMesh);
  }
  // Wall lamps (amber glass) along the back wall and the side walls.
  const amber = surface('#ffe2ad', { emissive: '#ffb45c', emissiveIntensity: 1.2 });
  for (const x of [-6.9, 2.0, 5.3]) {
    box(0.1, 0.3, 0.12, x, 2.55, minZ + 0.08, '#3a2418');
    const glass = cylinder(0.1, 0.13, 0.22, x, 2.72, minZ + 0.2, amber, root, 12);
    glass.castShadow = false;
  }
  // Hanji lanterns over the table: paper spheres until the kArchive lantern arrives.
  const lanternGroup = new THREE.Group();
  root.add(lanternGroup);
  const paper = surface('#fff1d6', { emissive: '#ffcf8a', emissiveIntensity: 1 });
  for (const x of TAVERN_DECOR.lanterns) {
    const cord = cylinder(0.01, 0.01, 1.0, x, 3.0, -0.3, '#3a2418', lanternGroup, 5);
    cord.castShadow = false;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 10), paper);
    ball.scale.set(1, 1.25, 1);
    ball.position.set(x, 2.35, -0.3);
    lanternGroup.add(ball);
  }
  // A small sign above the door inside: "허풍 주점".
  {
    const tex = canvasTexture(320, 90, (c) => {
      c.fillStyle = '#3a2418';
      c.fillRect(0, 0, 320, 90);
      c.strokeStyle = '#d19a4a';
      c.lineWidth = 5;
      c.strokeRect(5, 5, 310, 80);
      c.fillStyle = '#f1e4cc';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `900 46px ${kit.font}`;
      c.fillText('酒  허풍 주점', 160, 48);
    });
    textures.push(tex);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.42), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    plate.position.set(INTERIOR_ROOM.minX + 0.05, 2.75, 3.4);
    plate.rotation.y = Math.PI / 2;
    root.add(plate);
  }

  // ---------------------------------------------------------- kArchive props
  const place = (key: TavernModel, model: THREE.Group) => {
    const spots = TAVERN_SPOTS[key];
    if (!spots) return;
    const group = new THREE.Group();
    group.name = 'tavern-' + key;
    for (const s of spots) {
      const copy = copyOf(model, s.s, s.rot ?? 0);
      copy.position.set(s.x, s.y ?? 0, s.z);
      group.add(copy);
    }
    group.visible = wanted.has(key);
    root.add(group);
    groups.set(key, group);
  };
  // The café table and the saddle stools are placed by the scene (no spots).
  const sceneOwned = (key: TavernModel) => key === 'cafeTable' || key === 'saddleStool';
  const load = (key: TavernModel) => {
    if (loaded.has(key) || (!TAVERN_SPOTS[key] && !sceneOwned(key))) return;
    loaded.set(key, 'loading');
    kit.loader
      .loadAsync(tavernModelUrl(key))
      .then((gltf) => {
        if (kit.isDisposed()) return kit.own(gltf.scene);
        kit.own(gltf.scene);
        loaded.set(key, gltf.scene);
        place(key, gltf.scene);
        kit.arrived(key);
        kit.changed();
      })
      .catch(() => loaded.delete(key));
  };
  /** Shows the props of the finished upgrades (loads the new ones). */
  const setProps = (props: readonly TavernModel[]) => {
    wanted = new Set(props);
    let changed = false;
    for (const key of wanted) load(key);
    for (const [key, group] of groups) {
      const on = wanted.has(key);
      if (group.visible !== on) {
        group.visible = on;
        changed = true;
      }
    }
    return changed;
  };
  setProps(options.props);

  // Reused village props: 옹기 along the left wall, firewood by the fireplace.
  const reuse = (url: string, spots: { x: number; z: number; s: number; rot?: number }[]) =>
    kit.loader
      .loadAsync(url)
      .then((gltf) => {
        kit.own(gltf.scene);
        if (kit.isDisposed()) return;
        for (const s of spots) {
          const copy = copyOf(gltf.scene, s.s, s.rot ?? 0);
          copy.position.set(s.x, 0, s.z);
          root.add(copy);
        }
        kit.changed();
      })
      .catch(() => {});
  const onggiScale = 0.62 / VALLEY_MODEL_SIZE.onggi.h;
  void reuse(VALLEY_MODELS.onggi, [
    { x: -7.75, z: -2.2, s: onggiScale },
    { x: -7.7, z: -1.45, s: onggiScale * 0.8, rot: 0.6 },
  ]);
  void reuse(VALLEY_MODELS.firewood, [{ x: maxX - 0.6, z: -3.3, s: 0.28, rot: -Math.PI / 2 }]);
  // The kArchive hanji lanterns replace the paper spheres over the table.
  kit.loader
    .loadAsync(VALLEY_MODELS.hanjiLantern)
    .then((gltf) => {
      kit.own(gltf.scene);
      if (kit.isDisposed()) return;
      lanternGroup.clear();
      const s = 0.55 / VALLEY_MODEL_SIZE.hanjiLantern.h;
      for (const x of TAVERN_DECOR.lanterns) {
        const copy = copyOf(gltf.scene, s);
        copy.position.set(x, 2.05, -0.3);
        copy.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          const m = (mesh.material as THREE.MeshStandardMaterial).clone();
          m.emissive = new THREE.Color('#ffb45c');
          m.emissiveIntensity = 0.45;
          mesh.material = m;
          mesh.castShadow = false;
        });
        lanternGroup.add(copy);
        cylinder(0.008, 0.008, 1.2, x, 3.0, -0.3, '#3a2418', lanternGroup, 5).castShadow = false;
      }
      kit.changed();
    })
    .catch(() => {});

  return {
    setProps,
    /** The saddle stool (chairs at the table) once loaded, else null. */
    stool: () => {
      const s = loaded.get('saddleStool');
      return s && s !== 'loading' ? s : null;
    },
    /** The café table model once loaded (the scene scales it to the table). */
    table: () => {
      const t = loaded.get('cafeTable');
      return t && t !== 'loading' ? t : null;
    },
    /** A service bell for the 거짓말! bell (friends set), placed by the scene. */
    bellUrl: LOUNGE_MODELS.serviceBell,
    bellScale: FRIEND_PROP_SIZE.bell / Math.max(FRIEND_MODELS.serviceBell.w, FRIEND_MODELS.serviceBell.h),
    stoolSeat: TAVERN_MODEL_SIZE.saddleStool.h,
  };
}
export type TavernRoom = ReturnType<typeof buildTavern>;
