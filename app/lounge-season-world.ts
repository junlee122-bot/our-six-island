// Season and weather for every outdoor map (I2-world D1, D3): the hub
// (lounge-village-season-3d.ts) and the district kit (lounge-district-kit.ts)
// share this module, so 우리 농장, 시장 거리, 항구, 목장, 언덕, 산기슭 and the hub
// all turn with the same calendar:
//
//   seasonMix        how far grass and foliage lean toward the season's tint
//   SeasonPalette    re-tints a set's grass, far ground, paving and the leaf
//                    texels of its tree models (one tiny shader patch)
//   groundPattern    cheap canvas patterns (grass blades, soil furrows,
//                    gravel) multiplied over flat floors
//   mottle           large soft colour patches baked into a ground plane's
//                    vertex colours (no texture, so they never tile)
//   WeatherParticles rain, snow, autumn leaves and spring petals: one
//                    THREE.Points that follows the camera (one draw call)
//
// Everything here is cheap: the patterns are three shared 256² canvases,
// the palette only touches colours and two uniforms when the day changes.
import * as THREE from 'three';
import type { Season, Weather } from './lounge-calendar.ts';
import { SEASON_TINT, ambienceOf } from './lounge-life-ui.ts';

export type Ambience = 'rain' | 'snow' | 'leaves' | 'petals';
export { ambienceOf };

/**
 * How far the hub's and the districts' grass (and foliage) lean toward
 * SEASON_TINT. Winter goes far enough that no meadow stays green (it read
 * "겨울인데 풀이 초록" in the market), and fresh snow covers it almost white.
 */
export function seasonMix(season: Season, weather: Weather) {
  const grass = season === 'summer' ? 0.25 : season === 'winter' ? (weather === 'snow' ? 0.85 : 0.68) : 0.5;
  return {
    grass,
    leaf: season === 'summer' ? 0.2 : 0.55,
    leafLight: season === 'summer' ? 0.2 : 0.6,
    leafDark: season === 'summer' ? 0.1 : 0.4,
  };
}
/** Snow lying on the ground (winter, a snowy day). */
export const SNOW_GROUND = '#eef3f2';

// ---------------------------------------------------------------- patterns

export type GroundPattern = 'grass' | 'furrow' | 'gravel';
/** World units one grass / gravel tile covers (the furrow pattern spans one field tile). */
export const PATTERN_SPAN: Record<GroundPattern, number> = { grass: 7, furrow: 1, gravel: 5 };
const patterns = new Map<GroundPattern, THREE.CanvasTexture>();
/** Small deterministic random (patterns look the same on every screen). */
function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909);
    s ^= s >>> 16;
    return (s >>> 0) / 4294967296;
  };
}
/**
 * A shared pattern texture (white with darker marks, so it multiplies over a
 * material's colour and the season palette keeps working). Null outside the
 * browser. Never disposed: three canvases for the whole session.
 */
export function groundPattern(kind: GroundPattern): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const known = patterns.get(kind);
  if (known) return known;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const c = canvas.getContext('2d');
  if (!c) return null;
  const r = seeded(kind === 'grass' ? 11 : kind === 'furrow' ? 23 : 37);
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, size, size);
  // Draws a mark and its copies across the edges (the pattern tiles seamlessly).
  const wrap = (draw: (dx: number, dy: number) => void) => {
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) draw(dx, dy);
  };
  if (kind === 'grass') {
    // Soft clumps, then short blades in two greens and a few dry ones.
    for (let i = 0; i < 70; i++) {
      const x = r() * size,
        y = r() * size,
        rad = 6 + r() * 16;
      wrap((dx, dy) => {
        const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
        g.addColorStop(0, `rgba(70, 100, 40, ${0.05 + r() * 0.05})`);
        g.addColorStop(1, 'rgba(70, 100, 40, 0)');
        c.fillStyle = g;
        c.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
      });
    }
    c.lineCap = 'round';
    for (let i = 0; i < 900; i++) {
      const x = r() * size,
        y = r() * size,
        len = 3 + r() * 5,
        lean = (r() - 0.5) * 3;
      const dry = r() < 0.12;
      c.strokeStyle = dry ? `rgba(150, 120, 50, ${0.18 + r() * 0.12})` : `rgba(30, 70, 20, ${0.12 + r() * 0.14})`;
      c.lineWidth = 1 + r() * 0.8;
      wrap((dx, dy) => {
        c.beginPath();
        c.moveTo(x + dx, y + dy);
        c.lineTo(x + dx + lean, y + dy - len);
        c.stroke();
      });
    }
  } else if (kind === 'furrow') {
    // Four ridges across the tile: a dark trough, a lit ridge, crumbs of soil.
    const rows = 4,
      step = size / rows;
    for (let k = 0; k < rows; k++) {
      const y = k * step;
      const g = c.createLinearGradient(0, y, 0, y + step);
      g.addColorStop(0, 'rgba(0, 0, 0, 0.32)');
      g.addColorStop(0.22, 'rgba(0, 0, 0, 0.08)');
      g.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
      g.addColorStop(0.78, 'rgba(0, 0, 0, 0.1)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
      c.fillStyle = g;
      c.fillRect(0, y, size, step);
    }
    for (let i = 0; i < 500; i++) {
      c.fillStyle = `rgba(0, 0, 0, ${0.08 + r() * 0.16})`;
      const s = 1 + r() * 2.5;
      c.fillRect(r() * size, r() * size, s, s);
    }
  } else {
    // Gravel: small stones and a few cracks.
    for (let i = 0; i < 1100; i++) {
      const x = r() * size,
        y = r() * size,
        s = 1 + r() * 3;
      c.fillStyle = `rgba(40, 30, 20, ${0.07 + r() * 0.13})`;
      wrap((dx, dy) => {
        c.beginPath();
        c.ellipse(x + dx, y + dy, s, s * (0.6 + r() * 0.4), r() * 3, 0, Math.PI * 2);
        c.fill();
      });
    }
    for (let i = 0; i < 8; i++) {
      c.strokeStyle = 'rgba(40, 30, 20, 0.12)';
      c.lineWidth = 1;
      let x = r() * size,
        y = r() * size;
      c.beginPath();
      c.moveTo(x, y);
      for (let k = 0; k < 4; k++) c.lineTo((x += (r() - 0.5) * 30), (y += (r() - 0.5) * 30));
      c.stroke();
    }
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  patterns.set(kind, t);
  return t;
}

const hash2 = (x: number, z: number, seed: number) => {
  let h = Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263) + Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
/** Smooth value noise in 0..1. */
function noise(x: number, z: number, seed: number) {
  const x0 = Math.floor(x),
    z0 = Math.floor(z),
    fx = x - x0,
    fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx),
    sz = fz * fz * (3 - 2 * fz);
  const a = hash2(x0, z0, seed),
    b = hash2(x0 + 1, z0, seed),
    c = hash2(x0, z0 + 1, seed),
    d = hash2(x0 + 1, z0 + 1, seed);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}
/** Ground mottling at a world point: brightness and warmth (dry patches) in about ±6 %. */
export function mottleAt(x: number, z: number, seed = 1) {
  const n = noise(x / 9, z / 9, seed) * 0.65 + noise(x / 3.2, z / 3.2, seed + 7) * 0.35;
  const warm = noise(x / 13 + 40, z / 13, seed + 3);
  return { light: 0.92 + n * 0.12, warm: (warm - 0.5) * 0.08 };
}
/**
 * A flat ground plane with soft colour patches in its vertex colours (pair it
 * with `vertexColors: true`). Lying flat (rotated -90° about x) at `at`.
 */
export function mottledPlane(w: number, d: number, at: { x: number; z: number } = { x: 0, z: 0 }, cell = 2.5, seed = 1) {
  const geo = new THREE.PlaneGeometry(w, d, Math.max(1, Math.ceil(w / cell)), Math.max(1, Math.ceil(d / cell)));
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    // The plane is rotated onto the ground: local y is world -z.
    const m = mottleAt(at.x + pos.getX(i), at.z - pos.getY(i), seed);
    colors[i * 3] = m.light * (1 + m.warm);
    colors[i * 3 + 1] = m.light;
    colors[i * 3 + 2] = m.light * (1 - m.warm * 1.5);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

// ---------------------------------------------------------------- palette

export type PaletteRole = 'grass' | 'grassFar' | 'paving';
type FoliageUniforms = { tint: { value: THREE.Color }; mix: { value: number } };

/**
 * Leaf texels of a textured tree model lean toward the season's foliage
 * colour (green texels only: trunks, flowers and stones keep theirs).
 */
function foliageMaterial(source: THREE.Material, u: FoliageUniforms) {
  const material = source.clone();
  material.onBeforeCompile = (shader) => {
    shader.uniforms.swTint = u.tint;
    shader.uniforms.swMix = u.mix;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 swTint;\nuniform float swMix;')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        {
          vec3 c = diffuseColor.rgb;
          float leaf = smoothstep(0.004, 0.05, c.g - max(c.r, c.b));
          float lum = dot(c, vec3(0.299, 0.587, 0.114));
          diffuseColor.rgb = mix(c, swTint * (0.45 + 2.2 * lum), leaf * swMix);
        }`,
      );
  };
  material.customProgramCacheKey = () => 'sw-foliage';
  return material;
}

/**
 * One map's seasonal colours: grass and far-ground materials lean toward the
 * season's tint, paving takes a little snow, tree models' leaves turn. Call
 * `apply` whenever the season or the weather changes (cheap: colours and two
 * uniforms, no new shaders).
 */
export class SeasonPalette {
  private list: { mat: THREE.MeshStandardMaterial; base: THREE.Color; role: PaletteRole }[] = [];
  private foliage: FoliageUniforms = { tint: { value: new THREE.Color('#ffffff') }, mix: { value: 0 } };
  private clones = new Map<THREE.Material, THREE.Material>();
  private key = '';

  add(mat: THREE.MeshStandardMaterial, role: PaletteRole) {
    this.list.push({ mat, base: mat.color.clone(), role });
    if (this.key) {
      const [season, weather] = this.key.split('|') as [Season, Weather];
      this.key = '';
      this.apply(season, weather);
    }
    return mat;
  }
  /** Gives a tree model's meshes seasonal leaf materials (one clone per source material, kept in `own`). */
  foliageOf(o: THREE.Object3D, own: (m: THREE.Material) => void) {
    o.traverse((c) => {
      const mesh = c as THREE.Mesh;
      if (!mesh.isMesh) return;
      const swap = (m: THREE.Material) => {
        let next = this.clones.get(m);
        if (!next) {
          next = foliageMaterial(m, this.foliage);
          own(next);
          this.clones.set(m, next);
        }
        return next;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    });
  }
  apply(season: Season, weather: Weather) {
    const key = season + '|' + weather;
    if (key === this.key) return false;
    this.key = key;
    const tint = SEASON_TINT[season];
    const k = seasonMix(season, weather);
    const snowy = season === 'winter' && weather === 'snow';
    const grass = new THREE.Color(snowy ? SNOW_GROUND : tint.grass);
    const far = grass.clone().multiplyScalar(0.84);
    for (const e of this.list) {
      if (e.role === 'paving') {
        // Snow settles on roads and yards too (lightly: they stay readable as paths).
        const amount = snowy ? 0.32 : season === 'winter' ? 0.08 : 0;
        e.mat.color.copy(e.base).lerp(new THREE.Color(SNOW_GROUND), amount);
      } else e.mat.color.copy(e.base).lerp(e.role === 'grass' ? grass : far, k.grass);
    }
    this.foliage.tint.value.set(season === 'winter' ? (snowy ? '#e6eeec' : '#b9c9c3') : tint.leaf);
    this.foliage.mix.value = season === 'summer' ? 0 : season === 'spring' ? 0.12 : season === 'autumn' ? 0.62 : snowy ? 0.7 : 0.5;
    return true;
  }
}

// ---------------------------------------------------------------- weather

const AMBIENCE_COUNT: Record<Ambience, number> = { rain: 700, snow: 420, leaves: 90, petals: 110 };
/** The box of air the particles fill around the camera's aim. */
const AREA = { x: 64, y: 22, z: 64 };

function particleTexture(kind: Ambience) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const c = canvas.getContext('2d')!;
  if (kind === 'rain') {
    const g = c.createLinearGradient(16, 0, 16, 32);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    c.fillStyle = g;
    c.fillRect(14.5, 0, 3, 32);
  } else if (kind === 'snow') {
    const g = c.createRadialGradient(16, 16, 1, 16, 16, 12);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
  } else {
    c.fillStyle = '#ffffff';
    c.beginPath();
    if (kind === 'leaves') {
      c.moveTo(16, 3);
      c.bezierCurveTo(28, 10, 26, 24, 16, 29);
      c.bezierCurveTo(6, 24, 4, 10, 16, 3);
    } else c.ellipse(16, 16, 9, 6, 0.6, 0, Math.PI * 2);
    c.fill();
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Cheap weather particles (rain, snow, falling leaves, spring petals): one
 * THREE.Points that follows the camera's aim, animated at ~30 fps. Hidden under
 * reduced motion; `density` (0..1) thins it for lower graphics settings.
 */
export class WeatherParticles {
  private particles: { kind: Ambience; density: number; points: THREE.Points; speed: Float32Array; phase: Float32Array } | null = null;
  private lastTick = 0;
  private reducedQuery: MediaQueryList | null = null;
  private parent: THREE.Object3D;

  constructor(parent: THREE.Object3D) {
    this.parent = parent;
    try {
      this.reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
    } catch {}
  }
  get reduced() {
    return !!this.reducedQuery?.matches;
  }
  get kind() {
    return this.particles?.kind ?? null;
  }
  /** Shows `kind` (null: none). Returns true when what is drawn changed. */
  set(kind: Ambience | null, color: string, density = 1) {
    const want = kind && !this.reduced ? kind : null;
    if (this.particles?.kind === want && (!want || this.particles?.density === density)) return false;
    this.clear();
    if (want) this.particles = this.build(want, color, density);
    return true;
  }
  /** Shows the ambience of a season and weather (`effects` off: none). */
  setFor(season: Season, weather: Weather, effects: boolean, density = 1) {
    return this.set(effects ? ambienceOf(season, weather) : null, SEASON_TINT[season].particle, density);
  }
  private build(kind: Ambience, color: string, density: number) {
    const n = Math.max(8, Math.round(AMBIENCE_COUNT[kind] * density));
    const positions = new Float32Array(n * 3),
      speed = new Float32Array(n),
      phase = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      positions[i * 3] = (Math.random() - 0.5) * AREA.x;
      positions[i * 3 + 1] = Math.random() * AREA.y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * AREA.z;
      speed[i] = kind === 'rain' ? 16 + Math.random() * 6 : kind === 'snow' ? 1.2 + Math.random() * 1 : 1 + Math.random() * 0.8;
      phase[i] = Math.random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      map: particleTexture(kind),
      color: kind === 'rain' ? '#b9d3e6' : color,
      size: kind === 'rain' ? 22 : kind === 'snow' ? 7 : 10,
      sizeAttenuation: false,
      transparent: true,
      depthWrite: false,
      opacity: kind === 'rain' ? 0.75 : 0.95,
      toneMapped: false,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 30;
    points.name = 'weather-' + kind;
    this.parent.add(points);
    return { kind, density, points, speed, phase };
  }
  /** Moves the particles (at most ~30 times a second); true when a frame should render. */
  tick(now: number, dt: number, center: { x: number; z: number }) {
    const p = this.particles;
    if (!p) return false;
    if (this.reduced) {
      p.points.visible = false;
      return false;
    }
    p.points.visible = true;
    if (now - this.lastTick < 33) return false;
    const step = Math.min(0.1, this.lastTick ? (now - this.lastTick) / 1000 : dt);
    this.lastTick = now;
    const t = now / 1000;
    const { kind, points, speed, phase } = p;
    const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
    const a = attr.array as Float32Array;
    for (let i = 0; i < speed.length; i++) {
      const j = i * 3;
      a[j + 1] -= speed[i] * step;
      if (kind !== 'rain') {
        a[j] += Math.sin(t * 1.3 + phase[i]) * step * (kind === 'snow' ? 0.4 : 1.1) + (kind === 'leaves' ? step * 0.5 : 0);
        a[j + 2] += Math.cos(t * 0.9 + phase[i]) * step * 0.3;
      } else a[j] += step * 1.5;
      if (a[j + 1] < 0) {
        a[j + 1] += AREA.y;
        a[j] = (Math.random() - 0.5) * AREA.x;
        a[j + 2] = (Math.random() - 0.5) * AREA.z;
      }
    }
    attr.needsUpdate = true;
    points.position.set(center.x, 0, center.z);
    return true;
  }
  private clear() {
    const p = this.particles;
    if (!p) return;
    this.parent.remove(p.points);
    p.points.geometry.dispose();
    const m = p.points.material as THREE.PointsMaterial;
    m.map?.dispose();
    m.dispose();
    this.particles = null;
  }
  dispose() {
    this.clear();
  }
}
