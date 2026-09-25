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
} as const;
