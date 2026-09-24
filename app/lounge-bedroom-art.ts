import { LOUNGE_ASSETS } from './lounge-assets';
import { LOUNGE_MODELS } from './lounge-model-assets';
import { MIKU_ROOM_ART } from './lounge-bedroom-collection';
import { TROPHY_ART } from './lounge-trophy-art';

/** Images drawn as upright cards (or flat rugs / wall art) in the room. */
export const PROP_ART: Record<string, string> = {
  vanity: LOUNGE_ASSETS.bedroom_vanity,
  'clothes-rack': LOUNGE_ASSETS.bedroom_clothes_rack,
  armchair: LOUNGE_ASSETS.bedroom_armchair,
  'floor-lamp': LOUNGE_ASSETS.bedroom_floor_lamp,
  mirror: LOUNGE_ASSETS.bedroom_mirror,
  'round-rug': LOUNGE_ASSETS.bedroom_rug,
  'cat-plush': LOUNGE_ASSETS.bedroom_cat_plush,
  'bunny-plush': LOUNGE_ASSETS.bedroom_bunny_plush,
  'heart-cushion': LOUNGE_ASSETS.bedroom_heart_cushion,
  'record-player': LOUNGE_ASSETS.bedroom_record_player,
  speaker: LOUNGE_ASSETS.bedroom_speaker,
  plant: LOUNGE_ASSETS.bedroom_plant,
  flowers: LOUNGE_ASSETS.bedroom_flowers,
  books: LOUNGE_ASSETS.bedroom_books,
  'tea-set': LOUNGE_ASSETS.bedroom_tea_set,
  'twin-tail-figure': LOUNGE_ASSETS.bedroom_twin_tail_figure,
  'headband-display': LOUNGE_ASSETS.bedroom_headband_display,
  'instant-camera': LOUNGE_ASSETS.bedroom_instant_camera,
  'music-poster': LOUNGE_ASSETS.bedroom_music_poster,
  'photo-string': LOUNGE_ASSETS.bedroom_photo_string,
  'wall-clock': LOUNGE_ASSETS.bedroom_wall_clock,
  'star-lights': LOUNGE_ASSETS.bedroom_star_lights,
  'miku-poster': MIKU_ROOM_ART['miku-poster'],
  'miku-banner': MIKU_ROOM_ART['miku-banner'],
  ...TROPHY_ART,
};

/** GLB furniture (kArchive and 3DAssets.dev CC0). */
export const MODEL_FILES: Record<string, string> = {
  bed: LOUNGE_MODELS.bed,
  desk: LOUNGE_MODELS.desk,
  chair: LOUNGE_MODELS.chair,
  bookcase: LOUNGE_MODELS.bookshelf,
  'low-bookcase': LOUNGE_MODELS.archiveBookcase,
  wardrobe: LOUNGE_MODELS.wardrobe,
  nightstand: LOUNGE_MODELS.nightstand,
  'coffee-table': LOUNGE_MODELS.coffeeTable,
  'tea-table': LOUNGE_MODELS.teaTable,
  sofa: LOUNGE_MODELS.sofa,
  'wool-rug': LOUNGE_MODELS.rug,
  'table-lamp': LOUNGE_MODELS.lamp,
  cushions: LOUNGE_MODELS.cushions,
  'plant-stand': LOUNGE_MODELS.plantStand,
  tulips: LOUNGE_MODELS.tulips,
};

/** Catalog thumbnails: rendered previews of the 3D models, and the prop art itself. */
export const THUMBNAILS: Record<string, string> = {
  ...PROP_ART,
  ...MIKU_ROOM_ART,
  bed: LOUNGE_ASSETS.bedroom_thumb_bed,
  desk: LOUNGE_ASSETS.bedroom_thumb_desk,
  chair: LOUNGE_ASSETS.bedroom_thumb_chair,
  bookcase: LOUNGE_ASSETS.bedroom_thumb_bookcase,
  'low-bookcase': LOUNGE_ASSETS.bedroom_thumb_low_bookcase,
  wardrobe: LOUNGE_ASSETS.bedroom_thumb_wardrobe,
  nightstand: LOUNGE_ASSETS.bedroom_thumb_nightstand,
  'coffee-table': LOUNGE_ASSETS.bedroom_thumb_coffee_table,
  'tea-table': LOUNGE_ASSETS.bedroom_thumb_tea_table,
  sofa: LOUNGE_ASSETS.bedroom_thumb_sofa,
  'wool-rug': LOUNGE_ASSETS.bedroom_thumb_wool_rug,
  'table-lamp': LOUNGE_ASSETS.bedroom_thumb_table_lamp,
  cushions: LOUNGE_ASSETS.bedroom_thumb_cushions,
  'plant-stand': LOUNGE_ASSETS.bedroom_thumb_plant_stand,
  tulips: LOUNGE_ASSETS.bedroom_thumb_tulips,
};
