// kArchive (쓰레드 dogfooter) and 3DAssets.dev (CC0).
// Exact sources and licenses: public/models/lounge/ATTRIBUTION.md. These paths are the
// web-optimized copies (quantized geometry, WebP textures — both decoded natively by
// three's GLTFLoader); byte-exact originals live in public/models/_originals/.
// Standalone builds rewrite these to content-hashed relative URLs for Pages.
export const LOUNGE_MODELS = {
  sofa: '/models/lounge/sofa.glb',
  tulips: '/models/lounge/tulips.glb',
  bed: '/models/lounge/furniture/bed.glb',
  desk: '/models/lounge/furniture/desk.glb',
  bookshelf: '/models/lounge/furniture/bookshelf.glb',
  rug: '/models/lounge/furniture/rug.glb',
  chair: '/models/lounge/furniture/chair.glb',
  lamp: '/models/lounge/furniture/lamp.glb',
  nightstand: '/models/lounge/furniture/nightstand.glb',
  wardrobe: '/models/lounge/furniture/wardrobe.glb',
  coffeeTable: '/models/lounge/furniture/coffee-table.glb',
  curtains: '/models/lounge/furniture/curtains.glb',
  cushions: '/models/lounge/furniture/cushions.glb',
  cottage: '/models/village/cottage.glb',
  cornerHouse: '/models/village/cornerHouse.glb',
  courtyardHouse: '/models/village/courtyardHouse.glb',
  fruitTree: '/models/village/fruitTree.glb',
  hydrangea: '/models/village/hydrangea.glb',
  picnicTable: '/models/village/expansion/picnicTable.glb',
  parkBench: '/models/village/expansion/parkBench.glb',
  gardenLantern: '/models/village/expansion/gardenLantern.glb',
  archiveBookcase: '/models/lounge/redesign/archiveBookcase.glb',
  plantStand: '/models/lounge/redesign/plantStand.glb',
  teaTable: '/models/lounge/redesign/teaTable.glb',
  rockingChair: '/models/lounge/redesign/rockingChair.glb',
  // kArchive civic set (2026-09-25): village buildings and props, placed by
  // lounge-village-karchive.ts; hall/casino furniture in lounge-interior-scene.ts.
  greenhouse: '/models/village/civic/greenhouse.glb',
  noticeBoard: '/models/village/civic/noticeBoard.glb',
  museumLibrary: '/models/village/civic/museumLibrary.glb',
  hanokHall: '/models/village/civic/hanokHall.glb',
  festivalStage: '/models/village/civic/festivalStage.glb',
  wisteriaPergola: '/models/village/civic/wisteriaPergola.glb',
  vegetableBed: '/models/village/civic/vegetableBed.glb',
  timberDeck: '/models/village/civic/timberDeck.glb',
  harborFence: '/models/village/civic/harborFence.glb',
  picketFence: '/models/village/civic/picketFence.glb',
  cardTable: '/models/lounge/club/cardTable.glb',
  banquetChair: '/models/lounge/club/banquetChair.glb',
  barStool: '/models/lounge/club/barStool.glb',
  queueRope: '/models/lounge/club/queueRope.glb',
  // 야추 · 라이어 게임 tables in the hall (kArchive, 2026-09-26; lounge/friends/assets.json).
  ovalTable: '/models/lounge/friends/ovalTable.glb',
  serviceBell: '/models/lounge/friends/serviceBell.glb',
  serviceBellPressed: '/models/lounge/friends/serviceBellPressed.glb',
  lectern: '/models/lounge/friends/lectern.glb',
  ballotBox: '/models/lounge/friends/ballotBox.glb',
  deskCalendar: '/models/lounge/friends/deskCalendar.glb',
  pencil: '/models/lounge/friends/pencil.glb',
  // 성장 P1 blacksmith (kArchive, 2026-09-26; village/forge/assets.json): ruined → rebuilt.
  forgeWorkshop: '/models/village/forge/workshop.glb',
  forgeRuin: '/models/village/forge/workshopRuin.glb',
} as const;

/**
 * VILL-2 valley set (kArchive, 2026-09-26): friends' yard props, fishing-spot
 * props, nature filler, stone walls, pavers and the 팔각정. Placed by
 * lounge-village-valley.ts from VILLAGE_VALLEY_PROPS (lounge-village-layout.ts);
 * sources in public/models/village/valley/assets.json.
 */
export const VALLEY_MODELS = {
  waterPump: '/models/village/valley/waterPump.glb',
  picketGate: '/models/village/valley/picketGate.glb',
  toolShed: '/models/village/valley/toolShed.glb',
  onggi: '/models/village/valley/onggi.glb',
  produceCrate: '/models/village/valley/produceCrate.glb',
  firewood: '/models/village/valley/firewood.glb',
  scarecrow: '/models/village/valley/scarecrow.glb',
  campChair: '/models/village/valley/campChair.glb',
  volcanicRock: '/models/village/valley/volcanicRock.glb',
  graniteBoulder: '/models/village/valley/graniteBoulder.glb',
  cattail: '/models/village/valley/cattail.glb',
  hanjiLantern: '/models/village/valley/hanjiLantern.glb',
  valleyRocks: '/models/village/valley/valleyRocks.glb',
  ropeFence: '/models/village/valley/ropeFence.glb',
  broadleafTree: '/models/village/valley/broadleafTree.glb',
  smallPine: '/models/village/valley/smallPine.glb',
  meadowGrass: '/models/village/valley/meadowGrass.glb',
  shrub: '/models/village/valley/shrub.glb',
  treeStump: '/models/village/valley/treeStump.glb',
  cobbleWall: '/models/village/valley/cobbleWall.glb',
  pavilion: '/models/village/valley/pavilion.glb',
  stonePaver: '/models/village/valley/stonePaver.glb',
} as const;
export type ValleyModel = keyof typeof VALLEY_MODELS;

/**
 * 허풍 주점 (kArchive, 2026-09-26; lounge/tavern/assets.json): the interior's
 * base set and every upgrade tier's props (lounge-venue-upgrades.ts). Loaded
 * only inside the tavern (lounge-tavern-interior.ts).
 */
export const TAVERN_MODELS = {
  barCounter: '/models/lounge/tavern/barCounter.glb',
  wallShelf: '/models/lounge/tavern/wallShelf.glb',
  bottle: '/models/lounge/tavern/bottle.glb',
  keg: '/models/lounge/tavern/keg.glb',
  cafeTable: '/models/lounge/tavern/cafeTable.glb',
  saddleStool: '/models/lounge/tavern/saddleStool.glb',
  fireplace: '/models/lounge/tavern/fireplace.glb',
  glass: '/models/lounge/tavern/glass.glb',
  cupTree: '/models/lounge/tavern/cupTree.glb',
  bottleCrate: '/models/lounge/tavern/bottleCrate.glb',
  cornerCabinet: '/models/lounge/tavern/cornerCabinet.glb',
  teaSideboard: '/models/lounge/tavern/teaSideboard.glb',
  glassRack: '/models/lounge/tavern/glassRack.glb',
  sodaTap: '/models/lounge/tavern/sodaTap.glb',
  beverageBar: '/models/lounge/tavern/beverageBar.glb',
  boothBench: '/models/lounge/tavern/boothBench.glb',
  shelterBench: '/models/lounge/tavern/shelterBench.glb',
  soban: '/models/lounge/tavern/soban.glb',
  stringLights: '/models/lounge/tavern/stringLights.glb',
  starLamp: '/models/lounge/tavern/starLamp.glb',
  floorLamp: '/models/lounge/tavern/floorLamp.glb',
  coatStand: '/models/lounge/tavern/coatStand.glb',
  bambooPlanter: '/models/lounge/tavern/bambooPlanter.glb',
  doorway: '/models/lounge/tavern/doorway.glb',
  windowFrame: '/models/lounge/tavern/windowFrame.glb',
  audioConsole: '/models/lounge/tavern/audioConsole.glb',
  ticketRail: '/models/lounge/tavern/ticketRail.glb',
  cauldron: '/models/lounge/tavern/cauldron.glb',
  stove: '/models/lounge/tavern/stove.glb',
  teaUrn: '/models/lounge/tavern/teaUrn.glb',
  register: '/models/lounge/tavern/register.glb',
  storageShelf: '/models/lounge/tavern/storageShelf.glb',
  barrelRack: '/models/lounge/tavern/barrelRack.glb',
  chestnutRoaster: '/models/lounge/tavern/chestnutRoaster.glb',
} as const;
/** Tavern props; 'bookcase' reuses the room's archive bookcase (same kArchive model). */
export type TavernModel = keyof typeof TAVERN_MODELS | 'bookcase';
export const tavernModelUrl = (key: TavernModel): string =>
  key === 'bookcase' ? LOUNGE_MODELS.archiveBookcase : TAVERN_MODELS[key];

/**
 * Village buildings of the tavern, 범마을 부동산 and 나무결 가구점 with their
 * exterior upgrade variants (village/tavern and village/shops assets.json).
 * Placed by lounge-village-shops.ts.
 */
export const SHOP_MODELS = {
  tavernStall: '/models/village/tavern/tavernStall.glb',
  menuBoard: '/models/village/tavern/menuBoard.glb',
  dumplingShop: '/models/village/tavern/dumplingShop.glb',
  stallHeritage: '/models/village/tavern/stallHeritage.glb',
  grillHut: '/models/village/tavern/grillHut.glb',
  realtyOffice: '/models/village/shops/realtyOffice.glb',
  realtyDuplex: '/models/village/shops/realtyDuplex.glb',
  furnitureShop: '/models/village/shops/furnitureShop.glb',
  furnitureShowroom: '/models/village/shops/furnitureShowroom.glb',
} as const;
export type ShopModel = keyof typeof SHOP_MODELS;
