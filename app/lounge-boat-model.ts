// 샹크스's fishing boat in three.js (design-sea-fishing.md §7), built in code
// so its deck is exactly the walkable 6 × 14 of lounge-voyage-data.ts: a
// curved hull (white topsides, a blue sheer stripe, red antifouling below the
// waterline), a low bulwark with a rail on posts, the wheelhouse amidships
// with windows, a mast with the squid-boat lamp string (집어등) and a little
// antenna, the ice box and the bait tub beside it, a net pile at the stern,
// orange buoys, a life ring, rod holders at the four fishing places and the
// name board "범마을호". The deck top is y = 0; bow toward −z.
// Shared by the offshore deck scene and the boat moored in the harbor. No React.
import * as THREE from 'three';
import { DECK_D, DECK_RAILS, DECK_W } from './lounge-voyage-data.ts';
import { DISTRICT_FONT } from './lounge-district-kit.ts';

const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...extra });

/** Hull outline (x, z) of the deck edge, stern (+z) to bow (−z). */
export function hullOutline(): THREE.Vector2[] {
  const hw = DECK_W / 2 + 0.25,
    stern = DECK_D / 2 + 0.25,
    shoulder = -2.2,
    bow = -DECK_D / 2 - 1.3;
  const pts: THREE.Vector2[] = [];
  // Starboard side from the stern corner forward, the curved bow, back down port.
  pts.push(new THREE.Vector2(hw - 0.35, stern), new THREE.Vector2(hw, stern - 0.45), new THREE.Vector2(hw, shoulder));
  const n = 14;
  for (let i = 1; i < n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(hw * Math.cos(a), shoulder + (bow - shoulder) * Math.sin(a)));
  }
  pts.push(new THREE.Vector2(0, bow));
  for (let i = n - 1; i >= 1; i--) {
    const a = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(-hw * Math.cos(a), shoulder + (bow - shoulder) * Math.sin(a)));
  }
  pts.push(new THREE.Vector2(-hw, shoulder), new THREE.Vector2(-hw, stern - 0.45), new THREE.Vector2(-hw + 0.35, stern));
  return pts;
}

/** A hull band from y0 to y1 whose outline shrinks toward the keel (`k` 1 = the deck edge). */
function band(outline: THREE.Vector2[], y0: number, y1: number, k0: number, k1: number, material: THREE.Material) {
  const pos: number[] = [],
    idx: number[] = [];
  const ring = (y: number, k: number) => outline.map((p) => [p.x * k, y, p.y * (0.55 + 0.45 * k)]);
  const a = ring(y0, k0),
    b = ring(y1, k1);
  for (const v of [...a, ...b]) pos.push(v[0], v[1], v[2]);
  const n = outline.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    idx.push(i, j, n + i, j, n + j, n + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.material.side = THREE.DoubleSide;
  return m;
}

function nameBoard(text: string) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#f4efe2';
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#20405c';
  g.font = `40px ${DISTRICT_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type FishingBoat = {
  group: THREE.Group;
  /** The 집어등 bulbs (emissive at night) and the deck light. */
  lamps: THREE.MeshStandardMaterial;
  light: THREE.PointLight;
  /** Night on/off for the lamps. */
  setNight: (on: boolean) => void;
  dispose: () => void;
};

/**
 * Builds the boat. `detail` false drops the small props (the harbor's moored
 * copy and the low graphics setting).
 */
export function buildFishingBoat({ detail = true, name = '범마을호' } = {}): FishingBoat {
  const group = new THREE.Group();
  group.name = 'fishing-boat';
  const owned: { dispose: () => void }[] = [];
  const own = <T extends { dispose: () => void }>(x: T) => (owned.push(x), x);
  const white = own(mat('#f3f1ea')),
    blue = own(mat('#2f6fa8')),
    red = own(mat('#b8432f')),
    deckWood = own(mat('#b98e5e', { roughness: 0.9 })),
    plank = own(mat('#9c744a', { roughness: 0.95 })),
    steel = own(mat('#c9ced2', { metalness: 0.3, roughness: 0.5 })),
    glass = own(mat('#29465c', { roughness: 0.25, metalness: 0.2 })),
    orange = own(mat('#ef7d2f')),
    green = own(mat('#3f7a52')),
    icebox = own(mat('#e7eef2')),
    lamps = own(new THREE.MeshStandardMaterial({ color: '#fff4d2', emissive: '#ffe7a3', emissiveIntensity: 0.1, roughness: 0.4 }));
  const box = (w: number, h: number, d: number, m: THREE.Material) => {
    const geo = own(new THREE.BoxGeometry(w, h, d));
    const mesh = new THREE.Mesh(geo, m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };
  const cyl = (r0: number, r1: number, h: number, m: THREE.Material, seg = 10) => {
    const mesh = new THREE.Mesh(own(new THREE.CylinderGeometry(r0, r1, h, seg)), m);
    mesh.castShadow = true;
    return mesh;
  };

  // ---- hull: topsides (white), sheer stripe (blue), bottom (red) toward the keel.
  const outline = hullOutline();
  group.add(band(outline, 0.35, -0.25, 1, 0.99, white));
  group.add(band(outline, -0.25, -0.55, 0.99, 0.95, blue));
  group.add(band(outline, -0.55, -0.95, 0.95, 0.82, white));
  group.add(band(outline, -0.95, -1.5, 0.82, 0.35, red));
  // Deck: the outline filled, with planks.
  const shape = new THREE.Shape(outline.map((p) => new THREE.Vector2(p.x, -p.y)));
  const deckGeo = own(new THREE.ShapeGeometry(shape, 6));
  deckGeo.rotateX(-Math.PI / 2);
  const deck = new THREE.Mesh(deckGeo, deckWood);
  deck.position.y = -0.01;
  deck.receiveShadow = true;
  group.add(deck);
  for (let x = -DECK_W / 2 + 0.3; x < DECK_W / 2; x += 0.5) {
    const seam = box(0.03, 0.005, DECK_D - 0.6, plank);
    seam.position.set(x, 0.002, 0.4);
    seam.castShadow = false;
    group.add(seam);
  }
  // Bulwark cap and rail on posts.
  const railPts = outline.map((p) => new THREE.Vector3(p.x * 0.98, 0.78, p.y * 0.98));
  const rail = new THREE.Mesh(own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts, true), 160, 0.045, 6, true)), steel);
  rail.castShadow = true;
  group.add(rail);
  const capPts = outline.map((p) => new THREE.Vector3(p.x, 0.36, p.y));
  group.add(new THREE.Mesh(own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(capPts, true), 160, 0.08, 6, true)), blue));
  for (let i = 0; i < outline.length; i += 2) {
    const p = outline[i];
    const post = cyl(0.03, 0.03, 0.44, steel, 6);
    post.position.set(p.x * 0.98, 0.57, p.y * 0.98);
    group.add(post);
  }

  // ---- wheelhouse amidships (lounge-areas.ts DECK_COLLIDERS: 2.4 × 2.4 at z −0.2).
  const house = new THREE.Group();
  house.position.set(0, 0, -0.2);
  const walls = box(2.3, 1.9, 2.3, white);
  walls.position.y = 0.95;
  house.add(walls);
  for (const [x, z, ry] of [
    [0, -1.16, 0],
    [-1.16, 0, Math.PI / 2],
    [1.16, 0, Math.PI / 2],
  ] as const) {
    const win = box(1.7, 0.55, 0.04, glass);
    win.position.set(x, 1.45, z);
    win.rotation.y = ry;
    house.add(win);
  }
  const door = box(0.7, 1.4, 0.05, blue);
  door.position.set(0.4, 0.72, 1.16);
  house.add(door);
  const roof = box(2.7, 0.14, 2.8, blue);
  roof.position.y = 1.97;
  house.add(roof);
  const stripe = box(2.32, 0.12, 2.32, blue);
  stripe.position.y = 0.95;
  house.add(stripe);
  // Mast, the 집어등 string and an antenna.
  const mast = cyl(0.06, 0.07, 2.6, steel);
  mast.position.set(0, 3.2, 0.2);
  house.add(mast);
  const spar = box(3.6, 0.06, 0.06, steel);
  spar.position.set(0, 3.9, 0.2);
  house.add(spar);
  const bulbGeo = own(new THREE.SphereGeometry(0.11, 8, 6));
  for (let i = -3; i <= 3; i++) {
    const b = new THREE.Mesh(bulbGeo, lamps);
    b.position.set(i * 0.55, 3.78, 0.2);
    house.add(b);
  }
  const antenna = cyl(0.015, 0.015, 1.1, steel, 4);
  antenna.position.set(0.9, 2.6, -0.6);
  house.add(antenna);
  const flag = box(0.02, 0.3, 0.5, red);
  flag.position.set(0, 4.35, 0.45);
  house.add(flag);
  // Life ring on the back wall.
  const ring = new THREE.Mesh(own(new THREE.TorusGeometry(0.28, 0.08, 8, 16)), orange);
  ring.position.set(-0.6, 1.0, 1.2);
  house.add(ring);
  group.add(house);

  // ---- gear (DECK_COLLIDERS: ice box at (−1.7, 5.1), bait tub at (1.7, 5.1)).
  const ice = box(0.9, 0.62, 0.7, icebox);
  ice.position.set(-1.7, 0.31, 5.1);
  group.add(ice);
  const iceLid = box(0.94, 0.08, 0.74, blue);
  iceLid.position.set(-1.7, 0.66, 5.1);
  group.add(iceLid);
  const tub = cyl(0.42, 0.36, 0.5, green, 14);
  tub.position.set(1.7, 0.25, 5.1);
  group.add(tub);
  // Rod holders at the four fishing places, a rod leaning out over the side.
  const rodMat = own(mat('#2e2a26'));
  for (const r of DECK_RAILS) {
    const holder = cyl(0.04, 0.04, 0.3, steel, 6);
    holder.position.set(r.x + r.side * 0.6, 0.62, r.z + 0.5);
    group.add(holder);
    if (detail) {
      const rod = cyl(0.012, 0.022, 2.2, rodMat, 5);
      rod.position.set(r.x + r.side * 1.15, 1.25, r.z + 0.5);
      rod.rotation.z = -r.side * 0.75;
      group.add(rod);
    }
  }
  if (detail) {
    // Net pile at the stern, buoys tied along the wheelhouse, coiled rope at the bow.
    const netMat = own(mat('#3d6b5a', { roughness: 1 }));
    for (let i = 0; i < 5; i++) {
      const lump = new THREE.Mesh(own(new THREE.SphereGeometry(0.42, 8, 6)), netMat);
      lump.scale.set(1.3, 0.32, 1);
      lump.position.set(-0.9 + i * 0.45, 0.1, 6.2 + (i % 2) * 0.2);
      lump.castShadow = true;
      group.add(lump);
    }
    const buoyGeo = own(new THREE.SphereGeometry(0.16, 10, 8));
    for (const [x, y, z] of [
      [-1.25, 0.55, -0.9],
      [-1.25, 0.55, -0.4],
      [1.25, 0.55, -0.6],
      [-0.4, 0.18, 6.6],
      [0.6, 0.18, 6.5],
    ] as const) {
      const b = new THREE.Mesh(buoyGeo, orange);
      b.position.set(x, y, z);
      b.castShadow = true;
      group.add(b);
    }
    const rope = new THREE.Mesh(own(new THREE.TorusGeometry(0.32, 0.07, 6, 18)), own(mat('#d8c69a')));
    rope.rotation.x = Math.PI / 2;
    rope.position.set(0, 0.08, -6.2);
    group.add(rope);
    const bollard = cyl(0.12, 0.14, 0.35, steel, 8);
    bollard.position.set(0, 0.18, -7.2);
    group.add(bollard);
  }
  // Name boards on both bow quarters.
  const nameTex = own(nameBoard(name));
  const nameMat = own(new THREE.MeshStandardMaterial({ map: nameTex, roughness: 0.7 }));
  for (const side of [-1, 1]) {
    const board = new THREE.Mesh(own(new THREE.PlaneGeometry(1.8, 0.45)), nameMat);
    board.position.set(side * (DECK_W / 2 + 0.27), 0.05, -3.4);
    board.rotation.y = side * (Math.PI / 2);
    group.add(board);
  }
  // Deck light (on at night).
  const light = new THREE.PointLight('#ffe2a8', 0, 14, 1.4);
  light.position.set(0, 3.4, 0.4);
  group.add(light);
  return {
    group,
    lamps,
    light,
    setNight(on: boolean) {
      lamps.emissiveIntensity = on ? 2.4 : 0.1;
      light.intensity = on ? 6 : 0;
    },
    dispose() {
      for (const d of owned) d.dispose();
    },
  };
}

/**
 * The boat's motion on the swell (radians and world units) at time `t` (ms):
 * roll, pitch and heave, a few incommensurate waves so it never loops visibly.
 * `amp` 0 holds it still (멀미약, reduced motion).
 */
export function boatMotion(t: number, amp: number) {
  const s = t / 1000;
  return {
    roll: amp * (0.045 * Math.sin(s * 0.62) + 0.014 * Math.sin(s * 1.37 + 1.1)),
    pitch: amp * (0.022 * Math.sin(s * 0.47 + 0.7) + 0.006 * Math.sin(s * 1.9)),
    heave: amp * (0.11 * Math.sin(s * 0.71 + 0.3) + 0.03 * Math.sin(s * 1.6 + 2)),
  };
}
/** Swell size by today's sky (0 sunny … 1 rain): the boat's `amp`. */
export const SWELL_AMP = { sunny: 0.7, cloudy: 0.9, snow: 1.15, rain: 1.4, storm: 1.8 } as const;
