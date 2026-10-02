// 먼바다 in three.js (design-sea-fishing.md §7): 허 선장's boat
// (lounge-boat-model.ts) on a sea that fills the screen. The sea is one shader
// (lounge-offshore-water): waves that move with time, deep navy far out and
// teal by the hull, foam on the crests and along the hull, the sun's glitter
// and a moon path at night, fading at the top of the screen into a horizon
// card that rides with the camera (sky by the KST clock, haze, the village
// island with its lighthouse far away). Gulls wheel overhead, Kenney boats
// (CC0) pass on either side, now and then dolphins jump or a whale's back
// rolls by, and rain falls on rainy days. `ship` carries the boat and the
// friends standing on it, so the swell moves them together.
// Low graphics: no foam, glitter, passing boats or gulls. No React.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { WATERCRAFT_MODELS, type WatercraftModel } from './lounge-model-assets';
import { buildFishingBoat, type FishingBoat } from './lounge-boat-model';
import { DISTRICT_FONT } from './lounge-district-kit';
import type { Weather } from './lounge-calendar';
import type { FishingFramePhase } from './lounge-fishing-frames';

/** The water line in world units (the deck is y = 0). */
export const SEA_Y = -0.9;

const VERT = /* glsl */ `
uniform float uTime;
uniform float uAmp;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vCrest;
varying float vScreenY;
// Four travelling waves: height and its slopes (for the normal).
void wave(vec2 p, vec2 dir, float k, float speed, float a, inout float h, inout vec2 d) {
  float ph = dot(dir, p) * k + uTime * speed;
  h += a * sin(ph);
  d += a * k * cos(ph) * dir;
}
void main() {
  vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
  float h = 0.0;
  vec2 d = vec2(0.0);
  wave(p.xz, normalize(vec2(0.8, 0.6)), 0.55, 1.1, 0.10 * uAmp, h, d);
  wave(p.xz, normalize(vec2(-0.4, 0.9)), 0.9, 1.6, 0.06 * uAmp, h, d);
  wave(p.xz, normalize(vec2(0.95, -0.3)), 1.7, 2.3, 0.03 * uAmp, h, d);
  wave(p.xz, normalize(vec2(-0.7, -0.7)), 2.9, 3.1, 0.015 * uAmp, h, d);
  p.y += h;
  vWorld = p;
  vNormal = normalize(vec3(-d.x, 1.0, -d.y));
  vCrest = h / max(0.0001, 0.21 * uAmp);
  vec4 clip = projectionMatrix * viewMatrix * vec4(p, 1.0);
  vScreenY = clip.y / clip.w;
  gl_Position = clip;
}`;
const FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uNear;
uniform vec3 uSun;
uniform vec3 uSunDir;
uniform vec3 uFog;
uniform vec3 uFoam;
uniform float uGlitter;
uniform float uFoamOn;
uniform float uMoon;
uniform float uHorizon;
uniform vec2 uShip;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vCrest;
varying float vScreenY;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 rel = vWorld.xz - uShip;
  float dist = length(rel * vec2(1.0, 0.7));
  vec3 col = mix(uNear, uDeep, smoothstep(5.0, 22.0, dist));
  vec3 n = normalize(vNormal);
  vec3 L = normalize(uSunDir);
  col *= 0.72 + 0.38 * clamp(dot(n, L), 0.0, 1.0);
  // The orthographic camera always looks down the same way.
  vec3 V = normalize(vec3(0.0, 0.788, 0.616));
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(n, H), 0.0), 120.0);
  float sparkle = step(0.992, hash(floor(vWorld.xz * 16.0) + floor(uTime * 4.0))) * step(0.2, spec);
  col += uSun * (spec * 1.2 + sparkle * 2.5) * uGlitter;
  // Foam: wave crests, and a lapping band along the hull.
  // Crest foam in thin streaks (noise along the wave), never whole patches.
  float streak = smoothstep(0.55, 0.9, hash(floor(vWorld.xz * vec2(3.0, 9.0))));
  float crest = smoothstep(0.82, 1.0, vCrest) * streak * uFoamOn;
  float e = length(vec2(rel.x / 3.45, (rel.y + 0.48) / 7.95));
  float lap = smoothstep(1.09, 1.0, e) * (0.5 + 0.5 * sin(uTime * 2.4 + vWorld.z * 2.7 + vWorld.x * 1.3));
  col = mix(col, uFoam, clamp(crest * 0.45 + lap * 0.55, 0.0, 1.0));
  // The moon's path toward the horizon.
  float path = smoothstep(1.4, 0.0, abs(vWorld.x - 1.5 + sin(vWorld.z * 1.1 + uTime * 0.6) * 0.35));
  col += uMoon * vec3(0.62, 0.68, 0.85) * path * smoothstep(2.0, -10.0, vWorld.z) * (0.25 + spec * 3.0 + sparkle * 0.8);
  // Haze far out, then the horizon card shows through at the top of the screen.
  col = mix(col, uFog, smoothstep(-2.0, -9.0, vWorld.z) * 0.55);
  float alpha = 1.0 - smoothstep(uHorizon - 0.1, uHorizon, vScreenY);
  gl_FragColor = vec4(col, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Where the horizon card starts (NDC y) and where the sea has faded out. */
const CARD_FROM = 0.58,
  HORIZON_NDC = 0.74;

type Swimmer = { group: THREE.Group; next: number; start: number; dur: number; x: number; z: number; kind: 'dolphins' | 'whale' };
type Passer = { object: THREE.Object3D; x: number; speed: number; z: number; start: number };

export type OffshoreLook = {
  sky: string;
  sun: string;
  /** 0 day … 1 night (lounge-village-life Palette.lamps). */
  lamps: number;
  phase: 'morning' | 'day' | 'evening' | 'night';
  weather: Weather;
  /** Graphics quality 'low': no foam, glitter, gulls or passing boats. */
  low: boolean;
  /** Swell size (lounge-boat-model SWELL_AMP) for the sea's waves. */
  swell: number;
};

export class OffshoreSet {
  readonly root = new THREE.Group();
  /** The boat and whoever stands on it (the scene puts the friends in here). */
  readonly ship = new THREE.Group();
  onChange: () => void = () => {};
  private boat: FishingBoat;
  private sea: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private card: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private cardCanvas = document.createElement('canvas');
  private cardTex: THREE.CanvasTexture;
  private cardKey = '';
  private gulls = new THREE.Group();
  private gullWings: THREE.Mesh[] = [];
  private rain: THREE.LineSegments | null = null;
  private passers: Passer[] = [];
  private swimmers: Swimmer[] = [];
  private loader = new GLTFLoader();
  private owned: { dispose: () => void }[] = [];
  private look: OffshoreLook | null = null;
  private disposed = false;
  // Fishing from a rail: the line, the bobber on the swell, a splash ring and a big fish's jump.
  private line: THREE.Line;
  private bobber: THREE.Mesh;
  private splash: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private jumper: THREE.Mesh;
  private cast: { phase: FishingFramePhase; x: number; z: number; side: number; since: number } | null = null;
  private splashAt = -1e9;
  private jumpAt = -1e9;
  private jumpKey = 0;
  private tip = new THREE.Vector3();

  constructor() {
    this.root.name = 'offshore';
    this.boat = buildFishingBoat();
    this.ship.add(this.boat.group);
    this.root.add(this.ship);
    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: 1 },
      uDeep: { value: new THREE.Color('#0e3a63') },
      uNear: { value: new THREE.Color('#1f8c98') },
      uSun: { value: new THREE.Color('#fff2cf') },
      uSunDir: { value: new THREE.Vector3(-0.5, 0.8, -0.4) },
      uFog: { value: new THREE.Color('#b9d2de') },
      uFoam: { value: new THREE.Color('#f4fbff') },
      uGlitter: { value: 1 },
      uFoamOn: { value: 1 },
      uMoon: { value: 0 },
      uHorizon: { value: HORIZON_NDC },
      uShip: { value: new THREE.Vector2(0, 0) },
    };
    const seaMat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true });
    this.sea = new THREE.Mesh(new THREE.PlaneGeometry(80, 64, 160, 128), seaMat);
    this.sea.geometry.rotateX(-Math.PI / 2);
    this.sea.position.set(0, SEA_Y, -4);
    this.sea.renderOrder = 1;
    this.root.add(this.sea);
    this.owned.push(this.sea.geometry, seaMat);
    // Horizon card: drawn first, behind everything (it rides with the camera).
    this.cardCanvas.width = 1024;
    this.cardCanvas.height = 256;
    this.cardTex = new THREE.CanvasTexture(this.cardCanvas);
    this.cardTex.colorSpace = THREE.SRGBColorSpace;
    const cardMat = new THREE.MeshBasicMaterial({ map: this.cardTex, depthTest: false, depthWrite: false, toneMapped: false, fog: false });
    this.card = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), cardMat);
    this.card.renderOrder = -10;
    this.card.frustumCulled = false;
    this.owned.push(this.card.geometry, cardMat, this.cardTex);
    this.buildGulls();
    this.root.add(this.gulls);
    this.swimmers = [this.makeDolphins(), this.makeWhale()];
    for (const s of this.swimmers) this.root.add(s.group);
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const lineMat = new THREE.LineBasicMaterial({ color: '#f4f1e8', transparent: true, opacity: 0.85 });
    this.line = new THREE.Line(lineGeo, lineMat);
    this.line.frustumCulled = false;
    const bobGeo = new THREE.SphereGeometry(0.11, 10, 8);
    const bobMat = new THREE.MeshStandardMaterial({ color: '#e8452f', emissive: '#5a120a', roughness: 0.4 });
    this.bobber = new THREE.Mesh(bobGeo, bobMat);
    const ringGeo = new THREE.RingGeometry(0.2, 0.32, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 });
    this.splash = new THREE.Mesh(ringGeo, ringMat);
    const fishGeo = new THREE.SphereGeometry(0.35, 12, 8);
    const fishMat = new THREE.MeshStandardMaterial({ color: '#b9c7d2', metalness: 0.4, roughness: 0.35 });
    this.jumper = new THREE.Mesh(fishGeo, fishMat);
    this.jumper.scale.set(0.45, 0.5, 1.8);
    for (const o of [this.line, this.bobber, this.splash, this.jumper]) {
      o.visible = false;
      this.root.add(o);
    }
    this.owned.push(lineGeo, lineMat, bobGeo, bobMat, ringGeo, ringMat, fishGeo, fishMat);
  }

  /**
   * What the angler on the deck is doing (the fishing window's phase) and at
   * which rail (x, z, side −1 port / +1 starboard); null when nobody fishes.
   */
  setFishing(phase: FishingFramePhase | null, rail: { x: number; z: number; side: number } | null, t: number) {
    if (!phase || !rail || !rail.side) {
      this.cast = null;
      return;
    }
    if (!this.cast || this.cast.x !== rail.x || this.cast.z !== rail.z || (this.cast.phase !== phase && phase === 'casting')) this.cast = { phase, ...rail, since: t };
    else if (this.cast.phase !== phase) {
      if (phase === 'bite' || phase === 'fight') this.splashAt = t;
      this.cast = { ...this.cast, phase, since: t };
    }
  }
  /** A big catch jumps once out of the water by the bobber (`key` changes per catch). */
  jump(key: number, t: number) {
    if (!key || key === this.jumpKey) return;
    this.jumpKey = key;
    this.jumpAt = t;
    this.splashAt = t;
  }
  private fishTick(t: number) {
    const c = this.cast;
    const show = !!c && c.phase !== 'result';
    this.line.visible = this.bobber.visible = show;
    const s = t / 1000;
    let bx = 0,
      bz = 0;
    if (c) {
      // Rod tip over the rail (ship space → world), the bobber three units out on the water.
      this.tip.set(c.x + c.side * 1.95, 2.05, c.z + 0.5);
      this.ship.localToWorld(this.tip);
      bx = c.x + c.side * 4.2;
      bz = c.z + 0.6;
      const k = c.phase === 'casting' ? Math.min(1, (t - c.since) / 600) : 1;
      const swell = Math.sin(s * 1.7 + bx) * 0.07 + Math.sin(s * 2.9) * 0.03;
      const dip = c.phase === 'bite' ? -0.16 + Math.sin(s * 20) * 0.04 : c.phase === 'fight' || c.phase === 'reeling' ? Math.sin(s * 9) * 0.08 - 0.08 : 0;
      const jerk = c.phase === 'fight' ? Math.sin(s * 6.3) * 0.35 : 0;
      const x = this.tip.x + (bx + jerk - this.tip.x) * k,
        z = this.tip.z + (bz - this.tip.z) * k,
        y = this.tip.y + (SEA_Y + 0.05 + swell + dip - this.tip.y) * k + Math.sin(k * Math.PI) * 1.2;
      this.bobber.position.set(x, y, z);
      const pos = this.line.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, this.tip.x, this.tip.y, this.tip.z);
      pos.setXYZ(1, x, y, z);
      pos.needsUpdate = true;
    }
    const sp = (t - this.splashAt) / 900;
    this.splash.visible = sp >= 0 && sp < 1 && !!c;
    if (this.splash.visible) {
      this.splash.position.set(this.bobber.position.x, SEA_Y + 0.06, this.bobber.position.z);
      this.splash.scale.setScalar(1 + sp * 2.4);
      this.splash.material.opacity = 0.8 * (1 - sp);
    }
    const j = (t - this.jumpAt) / 1400;
    this.jumper.visible = j >= 0 && j < 1 && !!c;
    if (this.jumper.visible && c) {
      const arc = Math.sin(j * Math.PI);
      this.jumper.position.set(bx + c.side * (j - 0.5) * 1.6, SEA_Y + arc * 1.6, bz);
      this.jumper.rotation.set(0, Math.PI / 2, -c.side * (j - 0.5) * 2.4);
    }
  }

  // ---------------------------------------------------------- pieces
  private buildGulls() {
    const wing = new THREE.BufferGeometry();
    wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.55, 0.08, -0.1, 0.2, 0, 0.18], 3));
    wing.computeVertexNormals();
    const m = new THREE.MeshBasicMaterial({ color: '#f7f7f2', side: THREE.DoubleSide });
    const tip = new THREE.MeshBasicMaterial({ color: '#3c4148', side: THREE.DoubleSide });
    this.owned.push(wing, m, tip);
    for (let i = 0; i < 7; i++) {
      const bird = new THREE.Group();
      for (const side of [-1, 1]) {
        const w = new THREE.Mesh(wing, i % 3 ? m : tip);
        w.scale.x = side;
        bird.add(w);
        this.gullWings.push(w);
      }
      bird.userData = { phase: i * 0.9, r: 4 + (i % 3) * 2.2, h: 3.4 + (i % 4) * 0.6, speed: 0.22 + (i % 3) * 0.05, cx: i < 4 ? 0 : -3, cz: i < 4 ? -2 : 1 };
      this.gulls.add(bird);
    }
  }
  private makeDolphins(): Swimmer {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: '#56677a', roughness: 0.5 });
    const body = new THREE.SphereGeometry(0.42, 12, 8);
    const fin = new THREE.ConeGeometry(0.13, 0.36, 4);
    this.owned.push(mat, body, fin);
    for (let i = 0; i < 3; i++) {
      const d = new THREE.Group();
      const b = new THREE.Mesh(body, mat);
      b.scale.set(0.8, 0.75, 2.4);
      const f = new THREE.Mesh(fin, mat);
      f.position.set(0, 0.42, -0.15);
      f.scale.setScalar(1.4);
      d.add(b, f);
      d.userData.lag = i * 0.35;
      d.userData.dx = (i - 1) * 0.9;
      group.add(d);
    }
    group.visible = false;
    return { group, next: 9_000, start: 0, dur: 4_200, x: 7, z: -2, kind: 'dolphins' };
  }
  private makeWhale(): Swimmer {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: '#3a4656', roughness: 0.6 });
    const back = new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const spout = new THREE.ConeGeometry(0.3, 1.4, 8, 1, true);
    const spoutMat = new THREE.MeshBasicMaterial({ color: '#eef6fb', transparent: true, opacity: 0.7 });
    this.owned.push(mat, back, spout, spoutMat);
    const b = new THREE.Mesh(back, mat);
    b.scale.set(1.4, 0.7, 4.2);
    const s = new THREE.Mesh(spout, spoutMat);
    s.position.set(0, 1.1, -1.6);
    s.rotation.x = Math.PI;
    s.name = 'spout';
    group.add(b, s);
    group.visible = false;
    return { group, next: 70_000, start: 0, dur: 9_000, x: -9, z: 2, kind: 'whale' };
  }
  private loadPasser(model: WatercraftModel, x: number, z: number, speed: number, scale: number) {
    this.loader.loadAsync(WATERCRAFT_MODELS[model]).then(
      (g) => {
        if (this.disposed) return;
        const o = g.scene;
        o.scale.setScalar(scale);
        o.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) c.castShadow = true;
        });
        o.rotation.y = speed > 0 ? Math.PI : 0;
        this.root.add(o);
        this.passers.push({ object: o, x, speed, z, start: z });
        this.onChange();
      },
      () => {},
    );
  }

  // ---------------------------------------------------------- the horizon card
  private drawCard(look: OffshoreLook) {
    const key = [look.sky, look.sun, look.phase, look.weather, Math.round(look.lamps * 10)].join('|');
    if (key === this.cardKey) return;
    this.cardKey = key;
    const c = this.cardCanvas,
      g = c.getContext('2d')!,
      W = c.width,
      H = c.height;
    // The horizon line sits where the sea fades out.
    const hy = Math.round(H * (1 - (HORIZON_NDC - CARD_FROM) / (1.04 - CARD_FROM)));
    const rainy = look.weather === 'rain' || look.weather === 'storm' || look.weather === 'snow';
    const sky = new THREE.Color(look.sky);
    if (rainy) sky.lerp(new THREE.Color('#8f9aa3'), 0.55);
    const top = sky.clone().multiplyScalar(look.phase === 'night' ? 0.55 : 0.82);
    const low =
      look.phase === 'morning'
        ? new THREE.Color('#f6c6c9')
        : look.phase === 'evening'
          ? new THREE.Color('#f3b768')
          : look.phase === 'night'
            ? new THREE.Color('#2c3a5c')
            : sky.clone().lerp(new THREE.Color('#ffffff'), 0.45);
    if (rainy) low.lerp(new THREE.Color('#a5adb3'), 0.6);
    const grad = g.createLinearGradient(0, 0, 0, hy);
    grad.addColorStop(0, '#' + top.getHexString());
    grad.addColorStop(1, '#' + low.getHexString());
    g.fillStyle = grad;
    g.fillRect(0, 0, W, hy);
    // Sun low at dawn and dusk; the moon at night.
    if (!rainy) {
      if (look.phase === 'night') {
        g.fillStyle = '#f4f1dc';
        g.beginPath();
        g.arc(W * 0.56, hy * 0.45, 16, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.8)';
        for (let i = 0; i < 40; i++) g.fillRect((i * 263) % W, ((i * 97) % Math.max(1, hy - 20)) + 2, 2, 2);
      } else if (look.phase !== 'day') {
        g.fillStyle = look.phase === 'morning' ? '#ffd9b0' : '#ffc061';
        g.beginPath();
        g.arc(W * (look.phase === 'morning' ? 0.3 : 0.72), hy - 6, 26, Math.PI, 0);
        g.fill();
      }
    }
    // Far haze, then the sea's colour below the line (the sea fades into it).
    const fog = new THREE.Color(look.sky).lerp(new THREE.Color(look.phase === 'night' ? '#0d2238' : '#9ec3d3'), 0.6);
    if (rainy) fog.lerp(new THREE.Color('#7c8a93'), 0.5);
    g.fillStyle = '#' + fog.getHexString();
    g.fillRect(0, hy, W, H - hy);
    // The village island and its lighthouse, far away on the left; a smaller islet right.
    const ink = sky.clone().lerp(new THREE.Color(look.phase === 'night' ? '#05080f' : '#3f5a6a'), 0.55);
    g.fillStyle = '#' + ink.getHexString();
    g.beginPath();
    g.moveTo(40, hy);
    g.bezierCurveTo(80, hy - 26, 150, hy - 40, 210, hy - 30);
    g.bezierCurveTo(250, hy - 22, 290, hy - 34, 330, hy - 20);
    g.lineTo(380, hy);
    g.closePath();
    g.fill();
    for (let i = 0; i < 6; i++) g.fillRect(150 + i * 22, hy - 30 - (i % 2) * 4, 12, 10);
    g.fillRect(352, hy - 44, 7, 30);
    g.fillStyle = look.lamps > 0.5 ? '#ffe28a' : '#' + ink.getHexString();
    g.fillRect(350, hy - 49, 11, 6);
    g.fillStyle = '#' + ink.getHexString();
    g.beginPath();
    g.moveTo(760, hy);
    g.quadraticCurveTo(800, hy - 16, 850, hy);
    g.fill();
    // A tiny cargo ship on the line.
    g.fillRect(560, hy - 6, 34, 5);
    g.fillRect(570, hy - 11, 10, 5);
    // Soft haze across the line.
    const haze = g.createLinearGradient(0, hy - 18, 0, hy + 10);
    haze.addColorStop(0, 'rgba(255,255,255,0)');
    haze.addColorStop(0.6, `rgba(255,255,255,${rainy ? 0.35 : 0.22})`);
    haze.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = haze;
    g.fillRect(0, hy - 18, W, 28);
    g.font = `12px ${DISTRICT_FONT}`;
    this.cardTex.needsUpdate = true;
  }
  /** Keeps the horizon card glued to the top of the camera's view (call after framing). */
  onCamera(camera: THREE.OrthographicCamera, scene: THREE.Scene) {
    if (this.card.parent !== camera) {
      camera.add(this.card);
      if (camera.parent !== scene) scene.add(camera);
    }
    const w = camera.right - camera.left,
      top = camera.top;
    const y0 = CARD_FROM * top,
      y1 = 1.04 * top;
    this.card.scale.set(w * 1.02, y1 - y0, 1);
    this.card.position.set((camera.right + camera.left) / 2, (y0 + y1) / 2, -(camera.far - 2));
  }

  // ---------------------------------------------------------- state
  setLook(look: OffshoreLook) {
    const first = !this.look;
    this.look = look;
    const u = this.sea.material.uniforms;
    const night = look.phase === 'night';
    const rainy = look.weather === 'rain' || look.weather === 'storm';
    const deep = new THREE.Color(night ? '#061a30' : look.phase === 'evening' ? '#1b3157' : look.phase === 'morning' ? '#283f6c' : '#0e3a63');
    const near = new THREE.Color(night ? '#0f3446' : look.phase === 'evening' ? '#3d8487' : look.phase === 'morning' ? '#4d97a8' : '#1f8c98');
    if (rainy) {
      deep.lerp(new THREE.Color('#2d3b46'), 0.45);
      near.lerp(new THREE.Color('#4f6670'), 0.4);
    }
    u.uDeep.value.copy(deep);
    u.uNear.value.copy(near);
    u.uSun.value.set(look.sun);
    u.uFog.value.copy(new THREE.Color(look.sky).lerp(new THREE.Color(night ? '#0d2238' : '#9ec3d3'), 0.6));
    u.uGlitter.value = look.low || rainy ? 0 : night ? 0.3 : look.phase === 'day' ? 1 : 0.8;
    u.uFoamOn.value = look.low ? 0 : 1;
    u.uMoon.value = night && !rainy ? 1 : 0;
    u.uAmp.value = 0.6 + look.swell * 0.5;
    u.uSunDir.value.set(look.phase === 'evening' ? 0.6 : -0.5, look.phase === 'day' ? 0.85 : 0.35, -0.45);
    this.boat.setNight(look.lamps > 0.5);
    this.gulls.visible = !look.low && !night;
    this.drawCard(look);
    this.setRain(rainy || look.weather === 'snow', look.low, look.weather === 'snow');
    if (first && !look.low) {
      // Boats passing on either side, far enough not to cross the deck.
      this.loadPasser('boatFishing', -11, -14, 0.0011, 1.1);
      this.loadPasser('boatTug', 11.5, 16, -0.0008, 0.85);
    }
    this.onChange();
  }
  private setRain(on: boolean, low: boolean, snow: boolean) {
    if (!on) {
      if (this.rain) this.rain.visible = false;
      return;
    }
    if (!this.rain) {
      const n = low ? 160 : 520;
      const pos = new Float32Array(n * 6);
      for (let i = 0; i < n; i++) {
        const x = (Math.random() - 0.5) * 30,
          y = Math.random() * 10,
          z = (Math.random() - 0.5) * 26;
        pos.set([x, y, z, x + 0.05, y - (snow ? 0.06 : 0.5), z + 0.04], i * 6);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.LineBasicMaterial({ color: snow ? '#ffffff' : '#c8d6e0', transparent: true, opacity: snow ? 0.85 : 0.45 });
      this.rain = new THREE.LineSegments(g, m);
      this.rain.frustumCulled = false;
      this.owned.push(g, m);
      this.root.add(this.rain);
    }
    this.rain.visible = true;
  }

  // ---------------------------------------------------------- animation
  /** Advances the sea, gulls, passers and visitors (`t` ms, performance clock). */
  tick(t: number) {
    const u = this.sea.material.uniforms;
    u.uTime.value = t / 1000;
    const s = t / 1000;
    for (const bird of this.gulls.children) {
      const d = bird.userData as { phase: number; r: number; h: number; speed: number; cx: number; cz: number };
      const a = s * d.speed + d.phase;
      bird.position.set(d.cx + Math.cos(a) * d.r, d.h + Math.sin(a * 2.3) * 0.25, d.cz + Math.sin(a) * d.r * 0.7);
      bird.rotation.y = -a;
    }
    const flap = Math.sin(s * 7) * 0.5;
    this.gullWings.forEach((w, i) => (w.rotation.z = (i % 2 ? -1 : 1) * flap));
    for (const p of this.passers) {
      // Down one side and round again (the lane is 34 units long, past both screen edges).
      p.z = ((((p.start + 16 + t * p.speed) % 34) + 34) % 34) - 16;
      p.object.position.set(p.x, SEA_Y - 0.1 + Math.sin(s * 0.9 + p.x) * 0.06, p.z);
      p.object.rotation.z = Math.sin(s * 0.8 + p.x) * 0.03;
    }
    if (this.rain?.visible) {
      this.rain.position.y = -((s * (this.look?.weather === 'snow' ? 1.2 : 9)) % 10) + 5;
    }
    for (const sw of this.swimmers) this.swim(sw, t);
    this.fishTick(t);
  }
  private swim(sw: Swimmer, t: number) {
    if (this.look?.low && sw.kind === 'whale') return;
    if (!sw.group.visible) {
      if (t < sw.next) return;
      sw.start = t;
      const side = Math.floor(t / 1000) % 2 ? 1 : -1;
      sw.x = side * (sw.kind === 'whale' ? 9 + (t % 3) : 5.5 + (t % 4));
      sw.z = ((t / 100) % 10) - 6;
      sw.group.visible = true;
    }
    const k = (t - sw.start) / sw.dur;
    if (k >= 1) {
      sw.group.visible = false;
      sw.next = t + (sw.kind === 'whale' ? 150_000 + (t % 90_000) : 40_000 + (t % 30_000));
      this.onChange();
      return;
    }
    if (sw.kind === 'dolphins') {
      sw.group.position.set(sw.x, SEA_Y, sw.z + k * 4);
      for (const d of sw.group.children) {
        const kk = Math.min(1, Math.max(0, (k - (d.userData.lag as number) * 0.25) * 1.6));
        const arc = Math.sin(kk * Math.PI * 2);
        d.position.set(d.userData.dx as number, Math.max(-0.6, arc * 0.9), kk * 3 - 1.5);
        d.rotation.x = -Math.cos(kk * Math.PI * 2) * 0.9;
        d.visible = kk > 0 && kk < 1;
      }
    } else {
      // A slow rise, a spout, and down again.
      const rise = Math.sin(Math.min(1, k) * Math.PI);
      sw.group.position.set(sw.x, SEA_Y - 0.7 + rise * 0.75, sw.z + k * 3);
      const spout = sw.group.getObjectByName('spout');
      if (spout) spout.visible = k > 0.35 && k < 0.6;
    }
  }
  /** Something visible changes every frame out here. */
  get animated() {
    return true;
  }
  dispose() {
    this.disposed = true;
    this.card.parent?.remove(this.card);
    this.boat.dispose();
    for (const d of this.owned) d.dispose();
    for (const p of this.passers)
      p.object.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
        }
      });
  }
}
