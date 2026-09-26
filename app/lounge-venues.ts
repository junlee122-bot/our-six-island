// Venue registry: every walkable interior with game tables (회관, 카지노,
// 허풍 주점) in one place. Pure data shared by the server (lounge-games.ts
// areas), the 3D interiors, the flat scene, the game screens, music and the
// menus, so a new interior plugs in by adding one entry here instead of
// widening `area === 'casino' ? … : …` forks across the app.
import { NAMES } from './lounge-text.ts';

/** Server areas that are table interiors ('lounge' is the hall). */
export type InteriorArea = 'lounge' | 'casino' | 'tavern';
export const INTERIOR_AREAS: readonly InteriorArea[] = ['lounge', 'casino', 'tavern'];
export const isInteriorArea = (a: unknown): a is InteriorArea =>
  typeof a === 'string' && (INTERIOR_AREAS as readonly string[]).includes(a);

/** Music slot of a place (lounge-music-tracks.ts); the hall's is 'hall'. */
export type VenueMusic = 'hall' | 'casino' | 'tavern';
/** Table look (GameScreen `data-venue`, lounge-table-venue.css). */
export type TableVenue = 'hall' | 'casino' | 'tavern';

export type Venue = {
  area: InteriorArea;
  /** Full name ("범마을 회관"). */
  name: string;
  /** Short name for banners ("회관"). */
  short: string;
  /** Its VILLAGE_PLACES id (the door you walk through). */
  place: 'hall' | 'casino' | 'tavern';
  music: VenueMusic;
  venue: TableVenue;
  /** Its own chat ("회관 수다"). */
  chat: string;
  /** Renderer exposure of the 3D room. */
  exposure: number;
  /** Two-word tagline for the flat scene's plate. */
  tagline: string;
};

export const VENUES: Record<InteriorArea, Venue> = {
  lounge: {
    area: 'lounge',
    name: NAMES.hall,
    short: '회관',
    place: 'hall',
    music: 'hall',
    venue: 'hall',
    chat: NAMES.chatHall,
    exposure: 1.05,
    tagline: '일곱 친구의 아지트',
  },
  casino: {
    area: 'casino',
    name: NAMES.casino,
    short: '카지노',
    place: 'casino',
    music: 'casino',
    venue: 'casino',
    chat: NAMES.chatCasino,
    exposure: 1.12,
    tagline: '오늘 밤의 한 판',
  },
  tavern: {
    area: 'tavern',
    name: NAMES.tavern,
    short: '주점',
    place: 'tavern',
    music: 'tavern',
    venue: 'tavern',
    chat: NAMES.chatTavern,
    exposure: 1.08,
    tagline: '허풍 카드 · 뻥총 룰렛',
  },
};

/** The interior an area names, or null outside (village, rooms, wardrobe). */
export const venueOf = (area: unknown): Venue | null => (isInteriorArea(area) ? VENUES[area] : null);
