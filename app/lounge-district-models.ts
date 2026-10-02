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
import type { HarborModel } from './lounge-harbor-layout';
import type { HillsideModel } from './lounge-hillside-layout';
import type { RanchModel } from './lounge-ranch-layout';
import type { FoothillModel } from './lounge-foothill-layout';
import type { DistrictId } from './lounge-districts';

export const MARKET_MODEL_URLS: Record<MarketModel, string> = {
  realtyDuplex: SHOP_MODELS.realtyDuplex,
  furnitureShowroom: SHOP_MODELS.furnitureShowroom,
  dumplingShop: SHOP_MODELS.dumplingShop,
  realtyOffice: SHOP_MODELS.realtyOffice,
  bankBuilding: SHOP_MODELS.bankBuilding,
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
export const HARBOR_MODEL_URLS: Record<HarborModel, string> = {
  cottage: LOUNGE_MODELS.cottage,
  cornerHouse: LOUNGE_MODELS.cornerHouse,
  grillHut: SHOP_MODELS.grillHut,
  tavernStall: SHOP_MODELS.tavernStall,
  stallHeritage: SHOP_MODELS.stallHeritage,
  noticeBoard: LOUNGE_MODELS.noticeBoard,
  parkBench: LOUNGE_MODELS.parkBench,
  gardenLantern: LOUNGE_MODELS.gardenLantern,
  produceCrate: VALLEY_MODELS.produceCrate,
  barrelRack: TAVERN_MODELS.barrelRack,
  harborFence: LOUNGE_MODELS.harborFence,
  timberDeck: LOUNGE_MODELS.timberDeck,
  smallPine: VALLEY_MODELS.smallPine,
  broadleafTree: VALLEY_MODELS.broadleafTree,
  shrub: VALLEY_MODELS.shrub,
  graniteBoulder: VALLEY_MODELS.graniteBoulder,
  valleyRocks: VALLEY_MODELS.valleyRocks,
  fishMackerel: LOUNGE_MODELS.fishMackerel,
  fishCod: LOUNGE_MODELS.fishCod,
  fishHairtail: LOUNGE_MODELS.fishHairtail,
  firewood: VALLEY_MODELS.firewood,
  onggi: VALLEY_MODELS.onggi,
};
export const HILLSIDE_MODEL_URLS: Record<HillsideModel, string> = {
  cottage: LOUNGE_MODELS.cottage,
  cornerHouse: LOUNGE_MODELS.cornerHouse,
  courtyardHouse: LOUNGE_MODELS.courtyardHouse,
  realtyDuplex: SHOP_MODELS.realtyDuplex,
  museumLibrary: LOUNGE_MODELS.museumLibrary,
  parkBench: LOUNGE_MODELS.parkBench,
  gardenLantern: LOUNGE_MODELS.gardenLantern,
  picnicTable: LOUNGE_MODELS.picnicTable,
  pavilion: VALLEY_MODELS.pavilion,
  wisteriaPergola: LOUNGE_MODELS.wisteriaPergola,
  picketFence: LOUNGE_MODELS.picketFence,
  vegetableBed: LOUNGE_MODELS.vegetableBed,
  scarecrow: VALLEY_MODELS.scarecrow,
  waterPump: VALLEY_MODELS.waterPump,
  toolShed: VALLEY_MODELS.toolShed,
  broadleafTree: VALLEY_MODELS.broadleafTree,
  smallPine: VALLEY_MODELS.smallPine,
  shrub: VALLEY_MODELS.shrub,
  hydrangea: LOUNGE_MODELS.hydrangea,
  noticeBoard: LOUNGE_MODELS.noticeBoard,
};
export const RANCH_MODEL_URLS: Record<RanchModel, string> = {
  toolShed: VALLEY_MODELS.toolShed,
  cottage: LOUNGE_MODELS.cottage,
  cornerHouse: LOUNGE_MODELS.cornerHouse,
  pavilion: VALLEY_MODELS.pavilion,
  fruitTree: LOUNGE_MODELS.fruitTree,
  ropeFence: VALLEY_MODELS.ropeFence,
  picketFence: LOUNGE_MODELS.picketFence,
  scarecrow: VALLEY_MODELS.scarecrow,
  waterPump: VALLEY_MODELS.waterPump,
  produceCrate: VALLEY_MODELS.produceCrate,
  barrelRack: TAVERN_MODELS.barrelRack,
  firewood: VALLEY_MODELS.firewood,
  onggi: VALLEY_MODELS.onggi,
  parkBench: LOUNGE_MODELS.parkBench,
  gardenLantern: LOUNGE_MODELS.gardenLantern,
  noticeBoard: LOUNGE_MODELS.noticeBoard,
  broadleafTree: VALLEY_MODELS.broadleafTree,
  smallPine: VALLEY_MODELS.smallPine,
  shrub: VALLEY_MODELS.shrub,
  meadowGrass: VALLEY_MODELS.meadowGrass,
  valleyRocks: VALLEY_MODELS.valleyRocks,
};
export const FOOTHILL_MODEL_URLS: Record<FoothillModel, string> = {
  forgeWorkshop: LOUNGE_MODELS.forgeWorkshop,
  courtyardHouse: LOUNGE_MODELS.courtyardHouse,
  cottage: LOUNGE_MODELS.cottage,
  barrelRack: TAVERN_MODELS.barrelRack,
  firewood: VALLEY_MODELS.firewood,
  onggi: VALLEY_MODELS.onggi,
  produceCrate: VALLEY_MODELS.produceCrate,
  parkBench: LOUNGE_MODELS.parkBench,
  gardenLantern: LOUNGE_MODELS.gardenLantern,
  noticeBoard: LOUNGE_MODELS.noticeBoard,
  smallPine: VALLEY_MODELS.smallPine,
  broadleafTree: VALLEY_MODELS.broadleafTree,
  shrub: VALLEY_MODELS.shrub,
  graniteBoulder: VALLEY_MODELS.graniteBoulder,
  valleyRocks: VALLEY_MODELS.valleyRocks,
  volcanicRock: VALLEY_MODELS.volcanicRock,
  stonePaver: VALLEY_MODELS.stonePaver,
  hydrangea: LOUNGE_MODELS.hydrangea,
};
/** Every model a district needs (built districts only). */
export const DISTRICT_MODEL_URLS: Partial<Record<DistrictId, readonly string[]>> = {
  market: [...new Set(Object.values(MARKET_MODEL_URLS))],
  harbor: [...new Set(Object.values(HARBOR_MODEL_URLS))],
  hillside: [...new Set(Object.values(HILLSIDE_MODEL_URLS))],
  ranch: [...new Set(Object.values(RANCH_MODEL_URLS))],
  foothill: [...new Set(Object.values(FOOTHILL_MODEL_URLS))],
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
  // The district scene's own code, too (Outdoor lazy-loads it).
  void import('./lounge-area-3d').catch(() => {});
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
