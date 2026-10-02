// Every generative piece by music slot (lounge-music-tracks.ts MusicPlace):
// the rooms (lounge-music-score.ts) and the districts
// (lounge-music-districts.ts). A new place adds its PieceSpec here.
import { CASINO, HALL, TAVERN, type PieceSpec } from './lounge-music-score.ts';
import { HARBOR, HILLSIDE, MARKET, OFFSHORE } from './lounge-music-districts.ts';
import type { MusicPlace } from './lounge-music-tracks.ts';

export const PIECES: Record<MusicPlace, PieceSpec> = {
  casino: CASINO,
  hall: HALL,
  tavern: TAVERN,
  market: MARKET,
  harbor: HARBOR,
  hillside: HILLSIDE,
  offshore: OFFSHORE,
};
