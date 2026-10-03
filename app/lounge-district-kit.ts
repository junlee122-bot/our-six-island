// 구역 공통 규격 — the shared base of every separate district's 3D set
// (시장 거리, 항구, 언덕 and the ones to come), taken from ① 시장 거리, the look
// players found easiest to move in (2026-09-30; handover/STYLE-AND-SOURCES.md):
//
//   ground   flat grass plane on a far ground, flat paving strips (road,
//            plaza, stone, wood) — no raised plinth or kerbs
//   models   kArchive buildings and props fitted into their lots (largest
//            scale that fits w × h × d), streamed through
//            lounge-district-models.ts
//   trees    kArchive broadleaf / pine models, a ring just outside the map
//   signs    hand-lettered canvas boards on posts, tipped toward the camera
//   night    lantern glows brighten and a few warm point lights come on
//
// The camera, figures, walking and light rig are lounge-village-camera.ts /
// lounge-village-view.ts (used by lounge-area-3d.tsx and the hub alike).
import * as THREE from 'three';
import { districtModel } from './lounge-district-models';
import type { DistrictId } from './lounge-districts';

/** Height between stacked paving strips (well above the depth buffer's step at the area cameras' range). */
const PAVE_STEP = 0.002;
export const DISTRICT_FONT = '"Jua", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
export type SignColors = { bg: string; ink: string; line: string };
export const districtMat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...extra });
export function rnd(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}
export function shadowed<T extends THREE.Object3D>(o: T, cast = true) {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = cast;
      c.receiveShadow = true;
    }
  });
  return o;
}
/** A hand-lettered board (canvas): name and one line under it. */
export function signTexture(text: string, sub: string, colors: SignColors) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const c = canvas.getContext('2d');
  if (c) {
    c.fillStyle = colors.bg;
    c.fillRect(0, 0, 512, 160);
    c.strokeStyle = colors.line;
    c.lineWidth = 10;
    c.strokeRect(6, 6, 500, 148);
    c.fillStyle = colors.ink;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `64px ${DISTRICT_FONT}`;
    c.fillText(text, 256, sub ? 64 : 80);
    if (sub) {
      c.font = `30px ${DISTRICT_FONT}`;
      c.fillText(sub, 256, 124);
    }
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Paving tones (canvas colours for flat strips; tokens are CSS-only). */
export const PAVING = { road: '#b8a07c', plaza: '#d2bf98', stone: '#a59a88', quay: '#c8b894', wood: '#9c7550', lane: '#c9b58f' } as const;
export type DistrictUpdate = {
  marketDay: boolean;
  night: boolean;
  /** 항구: 샹크스's boat is out at sea; he stands at the pier in sailing hours. */
  boatOut?: boolean;
  captain?: boolean;
};

export class DistrictSet {
  readonly root = new THREE.Group();
  protected disposables: { dispose: () => void }[] = [];
  protected glows: { mesh: THREE.Mesh; base: THREE.Color }[] = [];
  protected lights: THREE.PointLight[] = [];
  protected state: DistrictUpdate = { marketDay: false, night: false };
  protected water: THREE.Texture[] = [];
  onChange: () => void = () => {};

  constructor(
    readonly district: DistrictId,
    protected urls: Readonly<Record<string, string>>,
  ) {
    this.root.name = 'district-' + district;
  }

  protected own<T extends { dispose: () => void }>(x: T) {
    this.disposables.push(x);
    return x;
  }
  protected plane(w: number, d: number, color: string, y: number) {
    const m = new THREE.Mesh(this.own(new THREE.PlaneGeometry(w, d)), this.own(districtMat(color)));
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    m.receiveShadow = true;
    return m;
  }
  protected box(w: number, h: number, d: number, color: string, extra: THREE.MeshStandardMaterialParameters = {}) {
    return new THREE.Mesh(this.own(new THREE.BoxGeometry(w, h, d)), this.own(districtMat(color, extra)));
  }
  /** Grass on a far ground (the market's). */
  protected ground(w: number, d: number, look: { ground: string; groundFar: string }) {
    this.root.add(this.plane(w + 70, d + 70, look.groundFar, -0.02));
    this.root.add(this.plane(w, d, look.ground, 0));
  }
  /**
   * Paving strips laid so far: each later strip sits a hair higher, so where
   * a road crosses a yard the two never share a depth (they flickered there).
   */
  private paved = 0;
  /** A flat paving strip (later strips draw on top of earlier ones). */
  protected pave(p: { x: number; z: number; w: number; d: number }, color: string, y = 0.012) {
    const at = y + Math.min(this.paved++, 40) * PAVE_STEP;
    const m = this.plane(p.w, p.d, color, at);
    m.position.set(p.x, at, p.z);
    this.root.add(m);
    return m;
  }
  /** Water: a flat sheet with a scrolling ripple texture. */
  protected sea(p: { x: number; z: number; w: number; d: number }, color = '#6fb3c4') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const c = canvas.getContext('2d');
    if (c) {
      c.fillStyle = '#ffffff';
      c.fillRect(0, 0, 128, 128);
      c.strokeStyle = 'rgba(40, 90, 110, 0.18)';
      c.lineWidth = 3;
      for (let y = 8; y < 128; y += 16) {
        c.beginPath();
        for (let x = 0; x <= 128; x += 8) c.lineTo(x, y + Math.sin((x + y) / 11) * 3);
        c.stroke();
      }
    }
    const tex = this.own(new THREE.CanvasTexture(canvas));
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(p.w / 8, p.d / 8);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.water.push(tex);
    const m = new THREE.Mesh(this.own(new THREE.PlaneGeometry(p.w, p.d)), this.own(districtMat(color, { map: tex, roughness: 0.3, metalness: 0.05 })));
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x, 0.006, p.z);
    m.receiveShadow = true;
    m.name = 'district-water';
    this.root.add(m);
    return m;
  }
  /** A kArchive model fitted into a w × h × d box standing at (x, z), front (+z) facing the camera. */
  protected place(model: string, x: number, z: number, size: { w: number; h: number; d: number }, rot = 0, name: string = model) {
    const holder = new THREE.Group();
    holder.name = name;
    holder.position.set(x, 0, z);
    this.root.add(holder);
    const url = this.urls[model];
    if (!url) return holder;
    void districtModel(this.district, url).then(
      (source) => {
        const o = source.clone(true);
        o.rotation.y = rot;
        o.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(o),
          m = b.getSize(new THREE.Vector3());
        const s = Math.min(size.w / (m.x || 1), size.h / (m.y || 1), size.d / (m.z || 1));
        if (!Number.isFinite(s) || s <= 0) return;
        o.scale.multiplyScalar(s);
        o.updateMatrixWorld(true);
        const b2 = new THREE.Box3().setFromObject(o),
          c = b2.getCenter(new THREE.Vector3());
        o.position.x -= c.x;
        o.position.z -= c.z;
        o.position.y -= b2.min.y - 0.02;
        holder.add(shadowed(o));
        this.onChange();
      },
      () => {},
    );
    return holder;
  }
  /** A standing signboard: big enough to read from the high camera, tipped back toward it. */
  protected signpost(text: string, sub: string, colors: SignColors, x: number, z: number, opts: { w?: number; h?: number; name?: string } = {}) {
    const w = opts.w ?? 2.8,
      h = opts.h ?? 2.7;
    const post = this.box(0.12, h, 0.12, '#6d4f33');
    post.position.set(x, h / 2, z);
    const board = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(w, w * 0.31)),
      this.own(new THREE.MeshBasicMaterial({ map: this.own(signTexture(text, sub, colors)), toneMapped: false })),
    );
    board.position.set(x, h + 0.05, z + 0.15);
    board.rotation.x = -0.55;
    board.name = opts.name ?? 'sign';
    this.root.add(shadowed(post), board);
    return board;
  }
  /** A post lantern that glows at night (the first few also light the ground). */
  protected lantern(x: number, z: number, color: string, h: number) {
    const post = this.box(0.08, h, 0.08, '#4a3a2c');
    post.position.set(x, h / 2, z);
    const glow = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.16, 12, 10)), this.own(new THREE.MeshBasicMaterial({ color })));
    glow.position.set(x, h + 0.1, z);
    this.glows.push({ mesh: glow, base: new THREE.Color(color) });
    this.root.add(shadowed(post), glow);
    this.pointLight(x, h, z + 0.3, color);
  }
  /** A garden lantern model with a warm glow. */
  protected gardenLamp(x: number, z: number, i: number) {
    this.place('gardenLantern', x, z, { w: 0.6, h: 1.8, d: 0.6 }, 0, `${this.district}-lamp-${i}`);
    const glow = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.12, 10, 8)), this.own(new THREE.MeshBasicMaterial({ color: '#ffd98a' })));
    glow.position.set(x, 1.62, z);
    this.glows.push({ mesh: glow, base: new THREE.Color('#ffd98a') });
    this.root.add(glow);
    if (i < 3) this.pointLight(x, 1.8, z + 0.3, '#ffc27a');
  }
  protected pointLight(x: number, y: number, z: number, color: string) {
    if (this.lights.length >= 7) return;
    const light = new THREE.PointLight(color, 0, 8, 1.6);
    light.position.set(x, y, z);
    this.lights.push(light);
    this.root.add(light);
  }
  protected tree(x: number, z: number, s: number, pine: boolean, i: number | string) {
    this.place(pine ? 'smallPine' : 'broadleafTree', x, z, { w: 1.9 * s, h: 1.9 * s, d: 1.9 * s }, rnd(`${this.district}t${i}`) * 6.28, `${this.district}-tree-${i}`);
  }
  /** A ring of trees just outside the walkable edge, open where a road leaves (west gap at `gapZ`). */
  protected ring(w: number, d: number, gap: { side: 'w' | 'e'; z: number } | null) {
    const pts: [number, number][] = [];
    for (let x = -w / 2 - 1.5; x <= w / 2 + 1.5; x += 2.6) pts.push([x, -d / 2 - 1.3 - rnd('n' + x) * 2]);
    for (let z = -d / 2; z <= d / 2 + 1; z += 2.7) {
      if (!(gap?.side === 'w' && Math.abs(z - gap.z) <= 2.6)) pts.push([-w / 2 - 1.2 - rnd('w' + z) * 1.8, z]);
      if (!(gap?.side === 'e' && Math.abs(z - gap.z) <= 2.6)) pts.push([w / 2 + 1.2 + rnd('e' + z) * 1.8, z]);
    }
    for (let x = -w / 2 - 1.5; x <= w / 2 + 1.5; x += 3.4) pts.push([x, d / 2 + 1.4 + rnd('s' + x) * 1.2]);
    return pts;
  }
  protected plantRing(pts: readonly [number, number][]) {
    pts.forEach(([x, z], i) => {
      const k = rnd(`ring:${x.toFixed(1)}:${z.toFixed(1)}`);
      const pine = k < 0.4;
      const s = pine ? 2.2 + k : 2 + k * 0.8;
      this.place(pine ? 'smallPine' : 'broadleafTree', x, z, { w: 1.9 * s, h: 1.9 * s, d: 1.9 * s }, k * 6.28, `${this.district}-ring-${i}`);
    });
  }

  update(u: DistrictUpdate) {
    this.state = u;
    for (const g of this.glows) (g.mesh.material as THREE.MeshBasicMaterial).color.copy(g.base).multiplyScalar(u.night ? 1 : 0.6);
    for (const l of this.lights) l.intensity = u.night ? 1.3 : 0;
  }
  tick(t: number) {
    for (const w of this.water) w.offset.set((t / 30000) % 1, (t / 70000) % 1);
  }
  current() {
    return this.state;
  }
  dispose() {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    this.root.removeFromParent();
  }
}
