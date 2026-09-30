// Loading the districts' 3D models (design-village-2x-npcs.md §2 "불러오기
// 방식"): each district has its own model list; walking up to its gate in the
// hub starts fetching it (prefetchDistrict), the fade into it shows progress,
// and the parsed models of the two most recent districts stay in memory — a
// third one evicts the oldest (its geometries, materials and textures are
// freed). The hub keeps its own cache (lounge-village.tsx).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LOUNGE_MODELS, SHOP_MODELS, TAVERN_MODELS, VALLEY_MODELS } from './lounge-model-assets';
import type { MarketModel } from './lounge-market-layout';
import type { DistrictId } from './lounge-districts';

export const MARKET_MODEL_URLS: Record<MarketModel, string> = {
  realtyDuplex: SHOP_MODELS.realtyDuplex,
  furnitureShowroom: SHOP_MODELS.furnitureShowroom,
  dumplingShop: SHOP_MODELS.dumplingShop,
  realtyOffice: SHOP_MODELS.realtyOffice,
  tavernStall: SHOP_MODELS.tavernStall,
  grillHut: SHOP_MODELS.grillHut,
  stallHeritage: SHOP_MODELS.stallHeritage,
  menuBoard: SHOP_MODELS.menuBoard,
  cottage: LOUNGE_MODELS.cottage,
  cornerHouse: LOUNGE_MODELS.cornerHouse,
  noticeBoard: LOUNGE_MODELS.noticeBoard,
  parkBench: LOUNGE_MODELS.parkBench,
  gardenLantern: LOUNGE_MODELS.gardenLantern,
  picnicTable: LOUNGE_MODELS.picnicTable,
  cafeTable: TAVERN_MODELS.cafeTable,
  barrelRack: TAVERN_MODELS.barrelRack,
  produceCrate: VALLEY_MODELS.produceCrate,
  onggi: VALLEY_MODELS.onggi,
  broadleafTree: VALLEY_MODELS.broadleafTree,
  smallPine: VALLEY_MODELS.smallPine,
  shrub: VALLEY_MODELS.shrub,
};
/** Every model a district needs (built districts only). */
export const DISTRICT_MODEL_URLS: Partial<Record<DistrictId, readonly string[]>> = {
  market: [...new Set(Object.values(MARKET_MODEL_URLS))],
};
export const DISTRICT_CACHE_SIZE = 2;

let loader: GLTFLoader | null = null;
type Entry = { job: Promise<THREE.Group>; scene?: THREE.Group; owners: Set<DistrictId> };
const models = new Map<string, Entry>();
const progress = new Map<DistrictId, { done: number; total: number; job: Promise<void> }>();
/** Most recent first. */
const recent: DistrictId[] = [];

function touch(id: DistrictId) {
  const i = recent.indexOf(id);
  if (i >= 0) recent.splice(i, 1);
  recent.unshift(id);
  while (recent.length > DISTRICT_CACHE_SIZE) evict(recent.pop()!);
}
function evict(id: DistrictId) {
  progress.delete(id);
  for (const [url, e] of models) {
    e.owners.delete(id);
    if (e.owners.size) continue;
    models.delete(url);
    e.scene?.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.geometry.dispose();
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
        mat.dispose();
      }
    });
  }
}
/** A district model (parsed once per cached district). */
export function districtModel(id: DistrictId, url: string): Promise<THREE.Group> {
  let e = models.get(url);
  if (!e) {
    loader ??= new GLTFLoader();
    const entry: Entry = { job: loader.loadAsync(url).then((g) => (entry.scene = g.scene)), owners: new Set() };
    entry.job.catch(() => models.delete(url));
    models.set(url, entry);
    e = entry;
  }
  e.owners.add(id);
  return e.job;
}
/** Starts (or joins) fetching every model of a district; resolves when all settle. */
export function prefetchDistrict(id: DistrictId): Promise<void> {
  touch(id);
  const known = progress.get(id);
  if (known) return known.job;
  const urls = DISTRICT_MODEL_URLS[id] ?? [];
  const state = { done: 0, total: urls.length, job: Promise.resolve() };
  state.job = Promise.allSettled(
    urls.map((url) =>
      districtModel(id, url).finally(() => {
        state.done++;
      }),
    ),
  ).then(() => undefined);
  progress.set(id, state);
  return state.job;
}
/** 0…1 of a district's models fetched (1 when it has none or is done). */
export function districtProgress(id: DistrictId): number {
  const p = progress.get(id);
  if (!p) return 0;
  return p.total ? p.done / p.total : 1;
}
/** Which districts are cached, most recent first (tests / debug). */
export const cachedDistricts = () => [...recent];
