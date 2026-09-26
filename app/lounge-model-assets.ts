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
