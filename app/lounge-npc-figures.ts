// Residents drawn in a 3D scene (the hub, 시장 거리, the tavern): one
// camera-facing sprite each (the pose sheet's calm cell or the single keyed
// image), a soft shadow, a DOM name tag and speech bubble. Walking uses the
// same procedural idea as the friends' gait (lounge-gait.ts) on a single
// picture: a heel-strike bob, a small sway and a lean into the step, and the
// sprite flips to face where they walk. Gestures from lounge-npc-behavior.ts
// (wave, nod, look, stretch, shiver, talk) are small hops, tilts and squashes.
import * as THREE from 'three';
import { HOST_CELL, HOST_SHEET, hostCell } from './lounge-host-sprites';
import { NPCS, type NpcId } from './lounge-npc-data';
import { npcChibi } from './lounge-npc-chibi';
import type { ResidentFrame } from './lounge-npc-behavior';
import { GAIT_CYCLES_PER_PHASE } from './lounge-gait';
import { setNpcViewShift } from './lounge-npc-schedule';

if (typeof window !== 'undefined')
  window.addEventListener('bumtadew:npc-clock', (e) => setNpcViewShift(Number((e as CustomEvent<number>).detail) || 0));

const loader = new THREE.TextureLoader();
const textureCache = new Map<string, Promise<THREE.Texture>>();
function texture(url: string) {
  let job = textureCache.get(url);
  if (!job) {
    job = loader.loadAsync(url).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      return t;
    });
    job.catch(() => textureCache.delete(url));
    textureCache.set(url, job);
  }
  return job;
}

type Figure = {
  id: NpcId;
  root: THREE.Group;
  sprite: THREE.Mesh;
  shadow: THREE.Mesh;
  tag: HTMLElement;
  bubble: HTMLElement;
  bubbleText: string;
  pos: THREE.Vector3;
  phase: number;
  flip: number;
  last: { x: number; z: number };
  /** Height of the head top above the feet (tags and bubbles sit above it). */
  top: number;
};

/**
 * Speech bubbles only, for residents another scene already draws (the
 * dealers, 허 선장, 로제, 냐모, 그웬 at their posts): greetings, idle lines and
 * chats from lounge-npc-behavior.ts over their heads.
 */
export class PostBubbles {
  private bubbles = new Map<NpcId, { el: HTMLElement; text: string; x: number; z: number }>();
  constructor(
    private labels: HTMLElement,
    private height: number,
  ) {}
  update(frames: readonly ResidentFrame[]) {
    for (const f of frames) {
      let b = this.bubbles.get(f.id);
      if (!b) {
        const el = document.createElement('span');
        el.className = 'rn-bubble';
        el.hidden = true;
        el.dataset.npc = f.id;
        this.labels.appendChild(el);
        b = { el, text: '', x: f.x, z: f.z };
        this.bubbles.set(f.id, b);
      }
      b.x = f.x;
      b.z = f.z;
      const text = f.bubble ?? '';
      if (text !== b.text) {
        b.text = text;
        b.el.textContent = text;
        b.el.hidden = !text;
      }
    }
  }
  project(camera: THREE.Camera, width: number, height: number) {
    const v = new THREE.Vector3();
    for (const b of this.bubbles.values()) {
      if (!b.text) continue;
      v.set(b.x, this.height + 0.45, b.z).project(camera);
      b.el.style.transform = `translate(${((v.x + 1) / 2) * width}px, ${((1 - v.y) / 2) * height}px) translate(-50%, -100%)`;
    }
  }
  dispose() {
    for (const b of this.bubbles.values()) b.el.remove();
    this.bubbles.clear();
  }
}

export type ResidentLayerOptions = {
  /** Standing height of the figure (world units). */
  height: number;
  /** Tilt the sprite back by the camera pitch (orthographic top-down scenes) or keep it upright facing the camera. */
  billboard: 'screen' | 'upright';
  /** Ground height. */
  y?: number;
  /** Walking speed used for the stride (world units / s). */
  speed?: number;
  /**
   * Chibi residents stand exactly as tall as a walking friend: the vertical
   * height of a friend's sprite plane in this scene and the camera-up y that
   * friend planes use for their width (lounge-npc-chibi.ts).
   */
  chibi?: { plane: number; upY: number };
  /** Colour multiplied into every sprite (a dark room's warm dimness). */
  tint?: string;
  /**
   * A spot where a standing-still resident sits (a shop's far-side café
   * chair): the figure sinks by `sitDrop` so the table hides the legs.
   */
  sit?: (x: number, z: number) => boolean;
  sitDrop?: number;
};

export class ResidentLayer {
  readonly root = new THREE.Group();
  private figures = new Map<NpcId, Figure>();
  private geos = new Map<string, THREE.PlaneGeometry>();
  private mats = new Map<NpcId, THREE.MeshBasicMaterial>();
  private shadowGeo = new THREE.CircleGeometry(0.34, 20);
  private shadowMat = new THREE.MeshBasicMaterial({ color: '#2d2418', transparent: true, opacity: 0.26, depthWrite: false });
  private labels: HTMLElement;
  private opts: Required<Omit<ResidentLayerOptions, 'chibi' | 'tint' | 'sit'>> & Pick<ResidentLayerOptions, 'chibi' | 'tint' | 'sit'>;
  private disposed = false;
  /** Called when a texture arrives (the scene redraws). */
  onChange: () => void = () => {};

  constructor(scene: THREE.Object3D, labels: HTMLElement, opts: ResidentLayerOptions) {
    this.opts = { y: 0.02, speed: 2.1, sitDrop: 0.28, ...opts };
    this.labels = labels;
    this.root.name = 'residents';
    scene.add(this.root);
  }

  private geometry(id: NpcId) {
    const chibi = this.opts.chibi && npcChibi(id);
    if (chibi && this.opts.chibi) {
      const { plane, upY } = this.opts.chibi;
      const key = `chibi:${chibi.w}x${chibi.h}`;
      let g = this.geos.get(key);
      if (!g) {
        g = new THREE.PlaneGeometry(plane * upY * (chibi.w / chibi.h), plane);
        // Feet on the 97% line, like a friend's canvas.
        g.translate(0, plane * 0.47, 0);
        this.geos.set(key, g);
      }
      return g;
    }
    const art = NPCS[id].art;
    const foot = art.kind === 'image' ? art.foot : 0.985;
    const key = art.kind === 'sheet' ? 'sheet' : `img:${foot}`;
    let g = this.geos.get(key);
    if (g) return g;
    const H = this.opts.height;
    if (art.kind === 'sheet') {
      const h = (H * HOST_CELL.h) / HOST_CELL.figure;
      g = new THREE.PlaneGeometry((h * HOST_CELL.w) / HOST_CELL.h, h);
      g.translate(0, h / 2 - (h * (HOST_CELL.h - HOST_CELL.foot)) / HOST_CELL.h, 0);
      const cell = hostCell('calm'),
        uv = g.attributes.uv as THREE.BufferAttribute;
      const l = cell.x / (HOST_CELL.w * HOST_CELL.cols),
        r = (cell.x + HOST_CELL.w) / (HOST_CELL.w * HOST_CELL.cols);
      const t = 1 - cell.y / (HOST_CELL.h * HOST_CELL.rows),
        b = 1 - (cell.y + HOST_CELL.h) / (HOST_CELL.h * HOST_CELL.rows);
      uv.setXY(0, l, t);
      uv.setXY(1, r, t);
      uv.setXY(2, l, b);
      uv.setXY(3, r, b);
    } else {
      // 660 × 990 images: the figure fills about 95% of the height.
      const h = H / 0.95;
      g = new THREE.PlaneGeometry((h * 2) / 3, h);
      g.translate(0, h * (foot - 0.5), 0);
    }
    this.geos.set(key, g);
    return g;
  }
  private material(id: NpcId) {
    let m = this.mats.get(id);
    if (m) return m;
    m = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.12, toneMapped: false, visible: false, side: THREE.DoubleSide });
    if (this.opts.tint) m.color.set(this.opts.tint);
    this.mats.set(id, m);
    const art = NPCS[id].art;
    const chibi = this.opts.chibi && npcChibi(id);
    // Residents without a picture yet are never drawn.
    if (art.kind === 'pending' && !chibi) return m;
    void texture(chibi ? chibi.asset : art.kind === 'sheet' ? HOST_SHEET[art.host] : art.kind === 'image' ? art.asset : '').then(
      (t) => {
        if (this.disposed) return;
        m!.map = t;
        m!.visible = true;
        m!.needsUpdate = true;
        this.onChange();
      },
      () => {},
    );
    return m;
  }
  private make(id: NpcId, f: ResidentFrame): Figure {
    const root = new THREE.Group();
    root.name = 'resident-' + id;
    const sprite = new THREE.Mesh(this.geometry(id), this.material(id));
    sprite.userData.npc = id;
    const shadow = new THREE.Mesh(this.shadowGeo, this.shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    root.add(sprite, shadow);
    this.root.add(root);
    const tag = document.createElement('span');
    tag.className = 'rn-tag';
    tag.textContent = NPCS[id].name;
    tag.dataset.npc = id;
    const bubble = document.createElement('span');
    bubble.className = 'rn-bubble';
    bubble.hidden = true;
    this.labels.appendChild(tag);
    this.labels.appendChild(bubble);
    const top = this.opts.chibi && npcChibi(id) ? this.opts.chibi.plane * 0.94 : this.opts.height;
    return { id, root, sprite, shadow, tag, bubble, bubbleText: '', pos: new THREE.Vector3(f.x, this.opts.y, f.z), phase: 0, flip: 1, last: { x: f.x, z: f.z }, top };
  }

  /**
   * Places everyone for this frame; returns true while anything moves (the
   * scene should keep drawing). `camera` orients the sprites; `dt` in seconds.
   */
  update(frames: readonly ResidentFrame[], t: number, dt: number, camera: THREE.Camera): boolean {
    const seen = new Set<NpcId>();
    let moving = false;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const back = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2);
    for (const f of frames) {
      seen.add(f.id);
      let fig = this.figures.get(f.id);
      if (!fig) {
        fig = this.make(f.id, f);
        this.figures.set(f.id, fig);
      }
      // Ease toward the target (the schedule moves in steps of a frame; nudges are smooth).
      const k = 1 - Math.exp(-dt * 10);
      const jump = Math.hypot(f.x - fig.pos.x, f.z - fig.pos.z) > 3;
      if (jump) fig.pos.set(f.x, this.opts.y, f.z);
      else fig.pos.lerp(new THREE.Vector3(f.x, this.opts.y, f.z), k);
      const moved = Math.hypot(fig.pos.x - fig.last.x, fig.pos.z - fig.last.z);
      fig.last = { x: fig.pos.x, z: fig.pos.z };
      if (f.walking) fig.phase += moved / this.opts.speed;
      // Facing: flip the picture when they face (or walk) left on screen.
      const dir = new THREE.Vector3(Math.sin(f.facing), 0, Math.cos(f.facing));
      const side = dir.dot(right);
      if (Math.abs(side) > 0.35) fig.flip = side < 0 ? -1 : 1;
      // Gait on one picture: bob on each heel strike, sway, lean into the step.
      const cyc = fig.phase * GAIT_CYCLES_PER_PHASE.walk * Math.PI * 2;
      let bob = 0,
        tilt = 0,
        squash = 1;
      if (f.walking) {
        bob = Math.abs(Math.sin(cyc)) * 0.045;
        tilt = Math.sin(cyc) * 0.035 - fig.flip * 0.05;
      } else {
        const breath = Math.sin(t / 900 + f.id.length);
        squash = 1 + breath * 0.006;
        switch (f.gesture) {
          case 'wave':
            bob = Math.max(0, Math.sin(t / 110)) * 0.06;
            tilt = Math.sin(t / 160) * 0.06;
            break;
          case 'nod':
            squash = 1 - Math.max(0, Math.sin(t / 180)) * 0.03;
            break;
          case 'talk':
            squash = 1 + Math.sin(t / 95) * 0.012;
            tilt = Math.sin(t / 400) * 0.02;
            break;
          case 'look':
            tilt = fig.flip * 0.03;
            break;
          case 'stretch':
            squash = 1 + Math.max(0, Math.sin(t / 500)) * 0.04;
            break;
          case 'shiver':
            tilt = Math.sin(t / 45) * 0.012;
            break;
        }
      }
      fig.root.position.copy(fig.pos);
      const seated = !f.walking && !!this.opts.sit?.(f.x, f.z);
      fig.sprite.position.y = bob - (seated ? this.opts.sitDrop : 0);
      fig.shadow.visible = !seated;
      if (this.opts.billboard === 'screen') fig.sprite.quaternion.copy(camera.quaternion);
      else fig.sprite.rotation.set(0, Math.atan2(back.x, back.z), 0);
      fig.sprite.rotateZ(tilt);
      fig.sprite.scale.set(fig.flip, squash, 1);
      if (f.walking || f.gesture !== 'none' || moved > 1e-4) moving = true;
      const text = f.bubble ?? '';
      if (text !== fig.bubbleText) {
        fig.bubbleText = text;
        fig.bubble.textContent = text;
        fig.bubble.hidden = !text;
      }
      fig.tag.title = f.label;
    }
    for (const [id, fig] of this.figures)
      if (!seen.has(id)) {
        this.root.remove(fig.root);
        fig.tag.remove();
        fig.bubble.remove();
        this.figures.delete(id);
        moving = true;
      }
    return moving;
  }

  /** Moves the DOM tags over the heads (call after the camera moved). */
  project(camera: THREE.Camera, width: number, height: number) {
    const v = new THREE.Vector3();
    for (const fig of this.figures.values()) {
      v.set(fig.pos.x, fig.pos.y + fig.top + 0.35, fig.pos.z).project(camera);
      const x = ((v.x + 1) / 2) * width,
        y = ((1 - v.y) / 2) * height;
      const off = v.z > 1 || v.z < -1;
      fig.tag.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      fig.tag.hidden = off;
      fig.bubble.style.transform = `translate(${x}px, ${y - 22}px) translate(-50%, -100%)`;
      if (off) fig.bubble.hidden = true;
    }
  }
  /** Which resident a ray hits (for click-to-talk). */
  hit(raycaster: THREE.Raycaster): NpcId | null {
    const meshes = [...this.figures.values()].map((f) => f.sprite).filter((m) => (m.material as THREE.MeshBasicMaterial).visible);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    return (hit?.object.userData.npc as NpcId) ?? null;
  }
  /** Where each resident is drawn right now (for talk reach). */
  positions(): { id: NpcId; x: number; z: number }[] {
    return [...this.figures.values()].map((f) => ({ id: f.id, x: f.pos.x, z: f.pos.z }));
  }
  dispose() {
    this.disposed = true;
    for (const fig of this.figures.values()) {
      fig.tag.remove();
      fig.bubble.remove();
    }
    this.figures.clear();
    this.root.removeFromParent();
    for (const g of this.geos.values()) g.dispose();
    for (const m of this.mats.values()) m.dispose();
    this.shadowGeo.dispose();
    this.shadowMat.dispose();
  }
}
