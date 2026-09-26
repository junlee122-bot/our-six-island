// The village buildings of 허풍 주점, 범마을 부동산 and 나무결 가구점 (three.js).
// Each is a kArchive building (자료: kArchive · 출처: 쓰레드 dogfooter;
// public/models/village/{tavern,shops}/assets.json) fitted into its lot
// (lounge-village-shops-layout.ts), swapped for its upgraded exterior once
// the shop's 외관 tier is done (lounge-venue-data.ts venueLook), plus
// procedural signage: a hanging board with the shop's name, the tavern's 酒
// flag and hanji lanterns that glow at night, and the shops' small tier-1
// props. A low placeholder block stands on each lot until the model loads.
import * as THREE from 'three';
import { SHOP_MODELS, VALLEY_MODELS, type ShopModel } from './lounge-model-assets';
import {
  GRILL_STALL,
  SHOP_LOTS,
  SHOP_MODEL_SIZE,
  TAVERN_FRONT,
  shopFit,
  type ShopBuildingModel,
  type ShopLot,
} from './lounge-village-shops-layout';
import { VALLEY_MODEL_SIZE } from './lounge-village-layout';
import { venueLook, type VenueUpgradeState } from './lounge-venue-data';

type Loader = (url: string) => Promise<THREE.Group>;
const GROUND_Y = 0.03;
const FONT = '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';
export type ShopsUpdate = {
  venues: { venues?: Record<string, VenueUpgradeState> };
  night: boolean;
};

function shadowed(object: THREE.Object3D) {
  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) child.castShadow = child.receiveShadow = true;
  });
  return object;
}
function signTexture(text: string, sub: string, colors: { bg: string; ink: string; line: string }) {
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
    c.font = `900 64px ${FONT}`;
    c.fillText(text, 256, 66);
    c.font = `700 28px ${FONT}`;
    c.fillText(sub, 256, 124);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const LOT_BASE: Record<ShopLot, ShopBuildingModel> = {
  tavern: 'tavernStall',
  realty: 'realtyOffice',
  furniture: 'furnitureShop',
};
const SIGNS: Record<ShopLot, { text: string; sub: string; bg: string; ink: string; line: string }> = {
  tavern: { text: '허풍 주점', sub: '허풍 카드 · 뻥총 룰렛', bg: '#3a2418', ink: '#f6e3bf', line: '#d19a4a' },
  realty: { text: '범마을 부동산', sub: '집 확장 상담', bg: '#f6efe0', ink: '#2f4a6b', line: '#4d6f9c' },
  furniture: { text: '나무결 가구점', sub: '오늘의 가구 · 명품관', bg: '#f1e6d6', ink: '#5a3b22', line: '#8e6540' },
};

export class VillageShopsLayer {
  readonly root = new THREE.Group();
  private sources = new Map<ShopModel, THREE.Group | 'loading'>();
  private buildings = new Map<ShopLot, { model: ShopModel | null; object: THREE.Object3D | null }>();
  private placeholders = new Map<ShopLot, THREE.Mesh>();
  private load: Loader | null = null;
  private placed: ((id: string) => void) | null = null;
  private state: ShopsUpdate = { venues: {}, night: false };
  private glow: THREE.MeshStandardMaterial;
  private lanterns: THREE.Group;
  private light: THREE.PointLight;
  private extras = new Map<string, THREE.Object3D>();
  private grillSite: THREE.Group;
  private flag: THREE.Mesh;
  private lastKey = '';
  private textures: THREE.Texture[] = [];

  constructor(scene: THREE.Object3D) {
    this.root.name = 'village-shops';
    scene.add(this.root);
    const stone = new THREE.MeshStandardMaterial({ color: '#b9ab94', roughness: 0.95 });
    for (const lot of Object.keys(SHOP_LOTS) as ShopLot[]) {
      const l = SHOP_LOTS[lot];
      const block = new THREE.Mesh(new THREE.BoxGeometry(l.w * 0.9, 0.5, l.d * 0.9), stone);
      block.position.set(l.x, 0.25, l.z);
      block.name = 'shop-placeholder-' + lot;
      this.root.add(shadowed(block));
      this.placeholders.set(lot, block);
      this.buildings.set(lot, { model: null, object: null });
      // Hanging sign in front of the door (above head height).
      const sign = SIGNS[lot];
      const texture = signTexture(sign.text, sign.sub, sign);
      this.textures.push(texture);
      const board = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 0.81),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85, emissive: '#ffffff', emissiveMap: texture, emissiveIntensity: 0.12 }),
      );
      board.name = 'shop-sign-' + lot;
      board.position.set(l.x + (lot === 'tavern' ? 1.4 : 0), lot === 'tavern' ? 3.05 : 2.95, l.z + l.d / 2 + 0.35);
      this.root.add(board);
      for (const dx of [-1.05, 1.05]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), new THREE.MeshStandardMaterial({ color: '#3a2418' }));
        post.position.set(board.position.x + dx, board.position.y + 0.42, l.z + l.d / 2 + 0.07);
        this.root.add(post);
      }
    }
    // The tavern's 酒 flag (a white cloth on a pole; it sways a little).
    const flagTexture = (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 256;
      const c = canvas.getContext('2d');
      if (c) {
        c.fillStyle = '#f6f1e4';
        c.fillRect(0, 0, 128, 256);
        c.fillStyle = '#b3452f';
        c.fillRect(0, 0, 128, 18);
        c.fillStyle = '#2a1d17';
        c.font = `900 96px ${FONT}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('酒', 64, 140);
      }
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();
    this.textures.push(flagTexture);
    const f = TAVERN_FRONT.flag;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, f.height, 8), new THREE.MeshStandardMaterial({ color: '#6b4226' }));
    pole.position.set(f.x, f.height / 2 + GROUND_Y, f.z);
    this.root.add(shadowed(pole));
    this.flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 1.2),
      new THREE.MeshStandardMaterial({ map: flagTexture, side: THREE.DoubleSide, roughness: 0.9 }),
    );
    this.flag.geometry.translate(0.33, 0, 0);
    this.flag.position.set(f.x, f.height - 0.7, f.z);
    this.flag.rotation.y = -0.35;
    this.root.add(this.flag);
    // Lanterns at the tavern door (paper spheres; the kArchive hanji lantern replaces them).
    this.glow = new THREE.MeshStandardMaterial({ color: '#fff1d6', emissive: '#ffb45c', emissiveIntensity: 0.2 });
    this.lanterns = new THREE.Group();
    for (const p of TAVERN_FRONT.lanterns) {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), this.glow);
      ball.scale.set(1, 1.3, 1);
      ball.position.set(p.x, 2.1, p.z);
      this.lanterns.add(ball);
    }
    this.root.add(this.lanterns);
    this.light = new THREE.PointLight('#ffb266', 0, 9, 1.8);
    this.light.position.set(SHOP_LOTS.tavern.x, 2.2, SHOP_LOTS.tavern.z + 3.2);
    this.root.add(this.light);
    // The grill stall's reserved lot on the beach: a sand patch and a small sign.
    this.grillSite = new THREE.Group();
    const patch = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.06, 2.2),
      new THREE.MeshStandardMaterial({ color: '#d8c08e', roughness: 1 }),
    );
    patch.position.set(GRILL_STALL.x, GROUND_Y + 0.03, GRILL_STALL.z);
    this.grillSite.add(patch);
    for (const [dx, dz] of [[-1.1, -1], [1.1, -1], [-1.1, 1], [1.1, 1]] as const) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), new THREE.MeshStandardMaterial({ color: '#8e6540' }));
      post.position.set(GRILL_STALL.x + dx, 0.35, GRILL_STALL.z + dz);
      this.grillSite.add(shadowed(post));
    }
    const siteSign = signTexture('구이 좌판 자리', '허풍 주점 외관 3단계', { bg: '#fff3cf', ink: '#6a3f23', line: '#8e6540' });
    this.textures.push(siteSign);
    const siteBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.44), new THREE.MeshStandardMaterial({ map: siteSign, roughness: 0.9 }));
    siteBoard.position.set(GRILL_STALL.x, 0.9, GRILL_STALL.z + 1.05);
    this.grillSite.add(siteBoard);
    this.root.add(this.grillSite);
  }

  /** Starts the base downloads; each promise settles once its model is placed. */
  loadAll(load: Loader, placed: (id: string) => void): Promise<void>[] {
    this.load = load;
    this.placed = placed;
    const jobs: Promise<void>[] = (Object.keys(LOT_BASE) as ShopLot[]).map((lot) => this.fetch(LOT_BASE[lot]));
    jobs.push(
      load(VALLEY_MODELS.hanjiLantern).then((source) => {
        this.lanterns.clear();
        const s = 1.1 / VALLEY_MODEL_SIZE.hanjiLantern.h;
        for (const p of TAVERN_FRONT.lanterns) {
          const copy = source.clone(true);
          copy.scale.setScalar(s);
          copy.position.set(p.x, 1.35, p.z);
          copy.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (!mesh.isMesh) return;
            const m = (mesh.material as THREE.MeshStandardMaterial).clone();
            m.emissive = new THREE.Color('#ffb45c');
            mesh.material = m;
          });
          this.lanterns.add(copy);
        }
        this.apply(true);
        placed('shopLanterns');
      }),
    );
    return jobs;
  }

  private fetch(model: ShopModel): Promise<void> {
    const have = this.sources.get(model);
    if (have || !this.load) return Promise.resolve();
    this.sources.set(model, 'loading');
    return this.load(SHOP_MODELS[model]).then(
      (source) => {
        this.sources.set(model, source);
        this.apply(true);
        this.placed?.('shop' + model[0].toUpperCase() + model.slice(1));
      },
      () => {
        this.sources.delete(model);
      },
    );
  }

  private source(model: ShopModel) {
    const s = this.sources.get(model);
    return s && s !== 'loading' ? s : null;
  }

  /** Fits a building model into a lot (front wall on the lot's front edge). */
  private fitted(lot: ShopLot, model: ShopBuildingModel) {
    const source = this.source(model);
    if (!source) return null;
    const fit = shopFit(lot, model);
    const holder = new THREE.Group();
    holder.name = `shop-${lot}-${model}`;
    holder.add(source.clone(true));
    holder.scale.setScalar(fit.scale);
    holder.position.set(fit.x, GROUND_Y, fit.z);
    holder.rotation.y = fit.rot;
    return shadowed(holder);
  }

  /** Upgrades and day/night; true when something visible changed. */
  update(u: ShopsUpdate) {
    this.state = u;
    return this.apply(false);
  }

  /** Per-frame life (the flag sways). */
  tick(t: number) {
    this.flag.rotation.y = -0.35 + Math.sin(t * 1.3) * 0.12;
  }

  private extra(id: string, make: () => THREE.Object3D | null, on: boolean) {
    let object = this.extras.get(id) ?? null;
    if (!object && on) {
      object = make();
      if (object) {
        this.extras.set(id, object);
        this.root.add(object);
      }
    }
    if (object) object.visible = on;
  }

  private apply(force: boolean) {
    const u = this.state;
    const looks = {
      tavern: venueLook(u.venues, 'tavern'),
      realty: venueLook(u.venues, 'realty'),
      furniture: venueLook(u.venues, 'furniture'),
    };
    const key = JSON.stringify([
      u.night,
      looks.tavern.building,
      looks.tavern.outside,
      looks.realty.building,
      looks.realty.tiers,
      looks.furniture.building,
      looks.furniture.tiers,
      [...this.sources.values()].filter((s) => s !== 'loading').length,
    ]);
    if (!force && key === this.lastKey) return false;
    this.lastKey = key;
    for (const lot of Object.keys(SHOP_LOTS) as ShopLot[]) {
      const want = looks[lot].building as ShopBuildingModel;
      void this.fetch(want);
      const current = this.buildings.get(lot)!;
      // Keep showing the base building until the upgraded one has loaded.
      const model = this.source(want) ? want : this.source(LOT_BASE[lot]) ? LOT_BASE[lot] : null;
      if (model && current.model !== model) {
        if (current.object) this.root.remove(current.object);
        const object = this.fitted(lot, model);
        if (object) this.root.add(object);
        this.buildings.set(lot, { model, object });
      }
      this.placeholders.get(lot)!.visible = !model;
    }
    // Tavern extras: the chalkboard (tier 1) and the harbor grill stall (tier 3).
    const outside = new Set(looks.tavern.outside);
    void (outside.has('menuBoard') && this.fetch('menuBoard'));
    void (outside.has('grillHut') && this.fetch('grillHut'));
    this.extra(
      'menuBoard',
      () => {
        const source = this.source('menuBoard');
        if (!source) return null;
        const b = TAVERN_FRONT.board;
        const copy = shadowed(source.clone(true));
        copy.scale.setScalar(b.scale);
        copy.position.set(b.x, GROUND_Y, b.z);
        copy.rotation.y = 0.25;
        return copy;
      },
      outside.has('menuBoard'),
    );
    this.extra(
      'grillHut',
      () => {
        const source = this.source('grillHut');
        if (!source) return null;
        const copy = shadowed(source.clone(true));
        copy.scale.setScalar(GRILL_STALL.scale);
        copy.position.set(GRILL_STALL.x, GROUND_Y, GRILL_STALL.z);
        return copy;
      },
      outside.has('grillHut') && !!this.source('grillHut'),
    );
    this.grillSite.visible = !(outside.has('grillHut') && this.source('grillHut'));
    // Realty / furniture tier 1: planters and an A-frame board by the door.
    for (const lot of ['realty', 'furniture'] as const) {
      const l = SHOP_LOTS[lot];
      this.extra(
        lot + '-front',
        () => {
          const g = new THREE.Group();
          const pot = new THREE.MeshStandardMaterial({ color: lot === 'realty' ? '#b5673f' : '#8e6540' });
          const leaf = new THREE.MeshStandardMaterial({ color: '#5c8a4f', flatShading: true });
          for (const dx of [-l.w / 2 + 0.45, l.w / 2 - 0.45]) {
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.45, 12), pot);
            p.position.set(l.x + dx, 0.25, l.z + l.d / 2 + 0.45);
            const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0), leaf);
            bush.position.set(l.x + dx, 0.72, l.z + l.d / 2 + 0.45);
            g.add(shadowed(p), shadowed(bush));
          }
          return g;
        },
        (looks[lot].tiers.exterior ?? 0) >= 1,
      );
    }
    // Night: the tavern's lanterns and door light come on.
    this.glow.emissiveIntensity = u.night ? 1.4 : 0.2;
    this.lanterns.traverse((child) => {
      const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m && 'emissiveIntensity' in m) m.emissiveIntensity = u.night ? 1.2 : 0.1;
    });
    this.light.intensity = u.night ? 6 : 0;
    return true;
  }

  dispose() {
    for (const t of this.textures) t.dispose();
  }
}

/** Every building model's measured size (tests). */
export const SHOP_BUILDING_SIZES = SHOP_MODEL_SIZE;
