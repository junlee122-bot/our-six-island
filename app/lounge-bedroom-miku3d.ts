/**
 * True 3D versions of the 미쿠 테마 props (three.js primitives + the flat
 * prints from lounge-bedroom-collection.ts). Each builder returns a group in
 * catalog units at scale 1: centred on x/z, standing on y = 0, front facing +z.
 * Wall items are centred on their wall span with the back at z = 0.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MIKU_PRINTS, MINT } from './lounge-bedroom-collection';

type TextureFor = (url: string) => THREE.Texture;
const mats = new Map<string, THREE.Material>();
/** Shared matte materials (never disposed; a room has a handful). */
function matte(color: string, extra: THREE.MeshStandardMaterialParameters = {}) {
  const key = color + JSON.stringify(extra, (k, v) => (v instanceof THREE.Texture ? v.uuid : v));
  let m = mats.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...extra });
    m.userData.shared = true;
    mats.set(key, m);
  }
  return m;
}
function mesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  parent: THREE.Object3D,
  x = 0,
  y = 0,
  z = 0,
) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
const printMat = (texture: THREE.Texture, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.85,
    transparent: true,
    alphaTest: 0.05,
    ...extra,
  });

/** A small collectible figure of the singer (≈0.34 tall at s = 1). */
export function singerFigure(s = 1, hair: string = MINT.hair) {
  const g = new THREE.Group();
  g.scale.setScalar(s);
  const skin = matte(MINT.skin),
    hairM = matte(hair),
    navy = matte(MINT.navy),
    coat = matte('#f1ebdf');
  mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.018, 24), matte('#cfeee7', { transparent: true, opacity: 0.85 }), g, 0, 0.009);
  for (const side of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.012, 0.011, 0.07, 8), navy, g, side * 0.02, 0.055);
    const tail = mesh(new THREE.CapsuleGeometry(0.026, 0.17, 4, 10), hairM, g, side * 0.075, 0.2, -0.012);
    tail.rotation.z = side * 0.18;
    mesh(new THREE.BoxGeometry(0.02, 0.028, 0.02), matte(MINT.tie), g, side * 0.056, 0.285, 0);
  }
  const skirt = mesh(new THREE.ConeGeometry(0.058, 0.06, 16, 1, true), navy, g, 0, 0.115);
  skirt.material = matte(MINT.navy, { side: THREE.DoubleSide });
  mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.07, 12), coat, g, 0, 0.17);
  mesh(new THREE.BoxGeometry(0.012, 0.04, 0.006), matte(MINT.hairDeep), g, 0, 0.17, 0.036);
  mesh(new THREE.SphereGeometry(0.052, 18, 14), skin, g, 0, 0.245);
  const cap = mesh(new THREE.SphereGeometry(0.056, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM, g, 0, 0.25, -0.004);
  cap.rotation.x = -0.25;
  for (const side of [-1, 1])
    mesh(new THREE.SphereGeometry(0.008, 8, 6), matte(MINT.eye), g, side * 0.018, 0.242, 0.049);
  return g;
}

/** The builders below are modelled at 1/1.2 of the catalog size. */
const MIKU_SCALE = 1.2;
export function buildMiku(ref: string, texture: TextureFor): THREE.Group | null {
  const inner = buildMikuInner(ref, texture);
  if (!inner) return null;
  const outer = new THREE.Group();
  inner.scale.multiplyScalar(MIKU_SCALE);
  outer.add(inner);
  return outer;
}
function buildMikuInner(ref: string, texture: TextureFor): THREE.Group | null {
  const g = new THREE.Group();
  switch (ref) {
    case 'miku-records': {
      // A floating oak ledge with three sleeves leaning on the wall and a vinyl.
      const oak = matte(MINT.oak);
      mesh(new THREE.BoxGeometry(1.3, 0.05, 0.22), oak, g, 0, -0.26, 0.11);
      mesh(new THREE.BoxGeometry(1.3, 0.035, 0.02), matte(MINT.oakDeep), g, 0, -0.225, 0.215);
      for (const x of [-0.5, 0.5])
        mesh(new THREE.BoxGeometry(0.04, 0.12, 0.16), matte(MINT.oakDeep), g, x, -0.32, 0.08);
      const sleeves = MIKU_PRINTS.sleeves;
      const place = [
        { x: -0.4, size: 0.46, tilt: 0.1, z: 0.05, roll: 0.05 },
        { x: 0.3, size: 0.4, tilt: 0.14, z: 0.1, roll: -0.04 },
        { x: -0.02, size: 0.5, tilt: 0.12, z: 0.13, roll: 0.02 },
      ];
      place.forEach((p, i) => {
        const sleeve = mesh(
          new THREE.BoxGeometry(p.size, p.size, 0.012),
          [matte('#ddd6c8'), matte('#ddd6c8'), matte('#ddd6c8'), matte('#ddd6c8'), printMat(texture(sleeves[i]), { transparent: false, alphaTest: 0 }), matte('#ddd6c8')] as unknown as THREE.Material,
          g,
          p.x,
          -0.235 + p.size / 2,
          p.z,
        );
        sleeve.rotation.x = -p.tilt;
        sleeve.rotation.z = p.roll;
      });
      const vinyl = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.008, 40), matte('#26252b', { roughness: 0.35 }), g, 0.52, -0.02, 0.05);
      vinyl.rotation.x = Math.PI / 2 - 0.12;
      const label = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 24), matte(MINT.tie), g, 0.52, -0.02, 0.056);
      label.rotation.x = Math.PI / 2 - 0.12;
      return g;
    }
    case 'miku-acrylic': {
      const clear = matte('#e8fbf6', { transparent: true, opacity: 0.35, roughness: 0.12, metalness: 0 });
      mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.03, 36), matte('#9ad8cc', { transparent: true, opacity: 0.8, roughness: 0.2 }), g, 0, 0.015);
      mesh(new THREE.BoxGeometry(0.05, 0.03, 0.02), clear, g, 0, 0.045);
      const plate = mesh(new THREE.BoxGeometry(0.3, 0.4, 0.012), clear, g, 0, 0.24);
      plate.castShadow = false;
      const print = mesh(new THREE.PlaneGeometry(0.3, 0.35), printMat(texture(MIKU_PRINTS.acrylic)), g, 0, 0.235, 0.008);
      print.castShadow = false;
      return g;
    }
    case 'miku-light-sticks': {
      const cup = mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.12, 28), matte(MINT.oak), g, 0, 0.06);
      cup.castShadow = true;
      mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.01, 28), matte('#3b3a48'), g, 0, 0.118);
      const glow = new THREE.MeshStandardMaterial({ color: '#7fe8d2', emissive: '#2fc4a8', emissiveIntensity: 0.75, roughness: 0.35 });
      for (const [x, tilt] of [
        [-0.045, 0.16],
        [0.05, -0.12],
      ] as const) {
        const stick = new THREE.Group();
        stick.position.set(x, 0.07, 0);
        stick.rotation.z = tilt;
        g.add(stick);
        mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.14, 14), matte('#efede8'), stick, 0, 0.07);
        mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.02, 14), matte(MINT.hairDeep), stick, 0, 0.145);
        const tube = mesh(new THREE.CapsuleGeometry(0.02, 0.24, 4, 14), glow, stick, 0, 0.29);
        tube.castShadow = false;
        const halo = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, 0.3, 14, 1, true),
          new THREE.MeshBasicMaterial({ color: MINT.glow, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
        );
        halo.position.y = 0.29;
        stick.add(halo);
      }
      return g;
    }
    case 'miku-headphones': {
      const wood = matte(MINT.oak),
        dark = matte('#40485e'),
        mint = matte(MINT.hair),
        pad = matte('#efe8dc');
      mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.03, 30), wood, g, 0, 0.015);
      mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.36, 12), wood, g, 0, 0.2);
      const bar = mesh(new THREE.CapsuleGeometry(0.014, 0.1, 4, 8), wood, g, 0, 0.38);
      bar.rotation.z = Math.PI / 2;
      const band = mesh(new THREE.TorusGeometry(0.13, 0.018, 10, 32, Math.PI), dark, g, 0, 0.27);
      band.scale.set(1, 0.9, 1);
      const inner = mesh(new THREE.TorusGeometry(0.118, 0.008, 8, 32, Math.PI), mint, g, 0, 0.27, 0.012);
      inner.scale.set(1, 0.9, 1);
      for (const side of [-1, 1]) {
        const cup = mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.045, 24), mint, g, side * 0.14, 0.24);
        cup.rotation.z = Math.PI / 2;
        const cushion = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 20), pad, g, side * 0.11, 0.24);
        cushion.rotation.z = Math.PI / 2;
        const dot = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 16), matte(MINT.tie), g, side * 0.165, 0.24);
        dot.rotation.z = Math.PI / 2;
      }
      return g;
    }
    case 'miku-cushion': {
      // A plush cushion: cream body with a mint "hair" crown (vertex colours),
      // the singer's face printed on the front and twin tails at the sides.
      const geometry = new RoundedBoxGeometry(0.5, 0.42, 0.22, 6, 0.1);
      const pos = geometry.attributes.position,
        colors: number[] = [],
        c = new THREE.Color(),
        cream = new THREE.Color('#f3ece0'),
        hair = new THREE.Color(MINT.hair);
      for (let i = 0; i < pos.count; i++) {
        const t = THREE.MathUtils.smoothstep(pos.getY(i), 0.13, 0.16);
        c.copy(cream).lerp(hair, t);
        colors.push(c.r, c.g, c.b);
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }), g, 0, 0.21);
      const face = mesh(
        new THREE.PlaneGeometry(0.4, 0.4),
        printMat(texture(MIKU_PRINTS.cushionFeatures), { alphaTest: 0.3 }),
        g,
        0,
        0.19,
        0.1115,
      );
      face.castShadow = false;
      for (const side of [-1, 1]) {
        const tail = mesh(new THREE.CapsuleGeometry(0.065, 0.26, 4, 12), matte(MINT.hair), g, side * 0.29, 0.19, -0.02);
        tail.rotation.z = side * 0.22;
        tail.scale.set(1, 1, 0.55);
        const tie = mesh(new THREE.BoxGeometry(0.07, 0.08, 0.07), matte(MINT.tie), g, side * 0.26, 0.36, 0);
        tie.rotation.z = side * 0.3;
      }
      return g;
    }
    case 'miku-rug': {
      const top = texture(MIKU_PRINTS.rugTop);
      const rug = mesh(
        new THREE.CylinderGeometry(1.1, 1.1, 0.03, 72),
        [matte(MINT.hairShade), printMat(top, { transparent: false, alphaTest: 0 }), matte(MINT.hairShade)] as unknown as THREE.Material,
        g,
        0,
        0.015,
      );
      rug.castShadow = false;
      return g;
    }
    case 'miku-leek': {
      // A plush leek lying on its side: white stalk fading to green leaves, with a face.
      const lie = new THREE.Group();
      lie.rotation.z = Math.PI / 2;
      lie.position.y = 0.09;
      g.add(lie);
      const stalk = new THREE.CapsuleGeometry(0.085, 0.36, 6, 18);
      const colors: number[] = [],
        pos = stalk.attributes.position,
        c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const t = THREE.MathUtils.clamp((pos.getY(i) + 0.26) / 0.52, 0, 1);
        c.set('#fbf8ef').lerp(new THREE.Color('#9fd98c'), THREE.MathUtils.smoothstep(t, 0.55, 1));
        colors.push(c.r, c.g, c.b);
      }
      stalk.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      mesh(stalk, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), lie, 0, -0.04);
      const leaf = matte('#5fb567');
      for (const [a, len] of [
        [-0.35, 0.22],
        [0.05, 0.26],
        [0.4, 0.2],
      ] as const) {
        const blade = mesh(new THREE.CapsuleGeometry(0.035, len, 4, 8), leaf, lie, Math.sin(a) * 0.06, 0.28 + len / 2, 0);
        blade.rotation.z = -a;
        blade.scale.set(1, 1, 0.45);
      }
      for (const side of [-1, 1]) {
        mesh(new THREE.SphereGeometry(0.012, 8, 6), matte('#3b3a48'), lie, 0.083, -0.1 + side * 0.045, 0.02).scale.set(0.5, 1, 1);
        mesh(new THREE.SphereGeometry(0.016, 8, 6), matte(MINT.cheek), lie, 0.078, -0.13 + side * 0.07, 0.035).scale.set(0.3, 0.7, 1);
      }
      g.rotation.y = 0;
      return g;
    }
    case 'miku-figure-shelf': {
      // An oak display cabinet with glass shelves, a mint LED strip and figures.
      const oak = matte(MINT.oak),
        deep = matte(MINT.oakDeep),
        glass = new THREE.MeshStandardMaterial({ color: '#dff6f1', transparent: true, opacity: 0.2, roughness: 0.08, depthWrite: false });
      const W = 1,
        D = 0.44,
        H = 1.62;
      mesh(new THREE.BoxGeometry(W, 0.06, D), deep, g, 0, 0.07);
      mesh(new THREE.BoxGeometry(W + 0.04, 0.05, D + 0.03), oak, g, 0, H - 0.025);
      for (const x of [-W / 2 + 0.03, W / 2 - 0.03])
        mesh(new THREE.BoxGeometry(0.06, H - 0.05, D), oak, g, x, (H - 0.05) / 2);
      mesh(new THREE.BoxGeometry(W - 0.06, H - 0.1, 0.02), matte('#d8efe8'), g, 0, H / 2, -D / 2 + 0.012);
      for (const x of [-0.42, 0.42]) mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), deep, g, x, 0.02, 0.16);
      const shelves = [0.12, 0.62, 1.1];
      for (const y of shelves.slice(1)) {
        const shelf = mesh(new THREE.BoxGeometry(W - 0.12, 0.02, D - 0.06), glass, g, 0, y, 0);
        shelf.castShadow = false;
      }
      const led = new THREE.Mesh(new THREE.BoxGeometry(W - 0.14, 0.015, 0.02), new THREE.MeshStandardMaterial({ color: '#c9fff3', emissive: '#6fe3cf', emissiveIntensity: 1.2 }));
      led.position.set(0, H - 0.08, D / 2 - 0.05);
      g.add(led);
      const front = mesh(new THREE.BoxGeometry(W - 0.1, H - 0.12, 0.01), glass, g, 0, H / 2 + 0.01, D / 2 - 0.01);
      front.castShadow = false;
      front.renderOrder = 2;
      const hairs = [MINT.hair, '#7fd6c9', '#62c3b6'];
      [
        [-0.26, 0.64, 1.05, 0],
        [0.02, 0.64, 1.2, 1],
        [0.28, 0.64, 1.0, 2],
        [-0.14, 1.12, 1.1, 1],
        [0.2, 1.12, 1.0, 0],
      ].forEach(([x, y, s, h]) => {
        const f = singerFigure(s * 1.1, hairs[h]);
        f.position.set(x, y + 0.01, -0.02);
        g.add(f);
      });
      // Bottom shelf: a boxed figure and a light stick.
      const box = mesh(new THREE.BoxGeometry(0.24, 0.3, 0.16), [matte('#9fe6d9'), matte('#9fe6d9'), matte('#9fe6d9'), matte('#9fe6d9'), printMat(texture(MIKU_PRINTS.sleeves[0]), { transparent: false, alphaTest: 0 }), matte('#9fe6d9')] as unknown as THREE.Material, g, -0.22, 0.26, 0);
      box.rotation.y = 0.15;
      const stick = mesh(new THREE.CapsuleGeometry(0.025, 0.2, 4, 12), new THREE.MeshStandardMaterial({ color: '#b9fff0', emissive: '#5fe6cc', emissiveIntensity: 0.9 }), g, 0.2, 0.26, 0);
      stick.rotation.z = 0.5;
      return g;
    }
  }
  return null;
}
