// Location music slots for 별빛 카지노 and 범마을 회관 (ASSETS.md → 장소 배경음).
// A slot plays a looping audio file when one is dropped into
// public/assets/lounge/music/; with no file (or while it loads) the room's
// generative piece plays instead (lounge-music-score.ts / lounge-music-synth.ts).
// The village and rooms keep the music box.
// scripts/build-standalone.mjs content-hashes the files that exist and blanks the
// paths that do not, so the standalone build never references a missing file.
// Pure helpers only (no AudioContext here): lounge-audio.ts does the playback.

export type MusicPlace = 'casino' | 'hall' | 'tavern';
export const MUSIC_PLACES: readonly MusicPlace[] = ['casino', 'hall', 'tavern'];

export type MusicTrack = {
  /** Candidate files, best first; the first one the browser can play is fetched. */
  files: readonly string[];
  /** Optional loop points in seconds (default: the whole file). */
  loopStart?: number;
  loopEnd?: number;
};

export const MUSIC_TRACKS: Record<MusicPlace, MusicTrack> = {
  casino: {
    files: ['/assets/lounge/music/casino.ogg', '/assets/lounge/music/casino.mp3'],
  },
  hall: {
    files: ['/assets/lounge/music/hall.ogg', '/assets/lounge/music/hall.mp3'],
  },
  // 허풍 주점 (no file yet: the swing shuffle in lounge-music-score.ts plays).
  tavern: {
    files: ['/assets/lounge/music/tavern.ogg', '/assets/lounge/music/tavern.mp3'],
  },
};

/**
 * Level of a location track under the music channel, so a file mastered to
 * about -16 LUFS sits at the music box's loudness (-22 dB: the day box
 * measures about -39 LUFS at its 0.2 channel level; see ASSETS.md).
 */
export const TRACK_LEVEL = 0.08;
/**
 * Level of the generative room pieces (they render at about -23 LUFS, so this
 * puts them near -37 LUFS, a touch above the music box).
 */
export const PIECE_LEVEL = 0.2;
/** Music level at a casino / hall game table with 게임 중 배경음 on. */
export const GAME_MUSIC_LEVEL = 0.4;
/** Decoded tracks not heard for this long are released (memory). */
export const TRACK_RELEASE_MS = 90_000;

const MIME: Record<string, string> = {
  ogg: 'audio/ogg; codecs="vorbis"',
  opus: 'audio/ogg; codecs="opus"',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4; codecs="mp4a.40.2"',
  wav: 'audio/wav',
};

/**
 * The candidate files to try, in order: blank paths (files absent from the
 * build) are dropped, and formats the browser says it cannot play go last.
 */
export function trackCandidates(
  track: MusicTrack,
  canPlay: (mime: string) => string,
): string[] {
  const files = track.files.filter((file) => !!file);
  const playable = (file: string) => {
    const mime = MIME[file.split('?')[0].split('.').pop()?.toLowerCase() ?? ''];
    return !mime || canPlay(mime) !== '';
  };
  return [...files.filter(playable), ...files.filter((f) => !playable(f))];
}

/** Loop points clamped to the decoded length (0/0 = the whole buffer). */
export function loopPoints(track: MusicTrack, duration: number) {
  const start = Math.max(0, Math.min(duration, track.loopStart ?? 0));
  const end = Math.max(0, Math.min(duration, track.loopEnd ?? 0));
  return end > start + 1 ? { start, end } : { start: 0, end: 0 };
}

export type MusicMix = {
  /** Music channel level before the music volume (and Esc duck). */
  channel: number;
  /** The village music box (outside the casino and the hall). */
  box: number;
  /** The location file that should be heard, or null. */
  track: MusicPlace | null;
  /** The generative piece that should be heard (no file, or still loading). */
  synth: MusicPlace | null;
};

/**
 * What the music channel plays. In the casino / hall the place's file wins
 * once it is loaded, otherwise its generative piece plays; elsewhere the music
 * box. At a game table the music continues at GAME_MUSIC_LEVEL when
 * 게임 중 배경음 is on, else it steps aside.
 */
export function musicMix(
  scene: { place: MusicPlace | null; game: boolean; night: boolean },
  gameMusic: boolean,
  ready: (place: MusicPlace) => boolean,
): MusicMix {
  const place = scene.place;
  const channel = scene.game ? (place && gameMusic ? GAME_MUSIC_LEVEL : 0) : 1;
  const on = channel > 0 ? place : null;
  const track = on && ready(on) ? on : null;
  const synth = on && !track ? on : null;
  const box = channel > 0 && !place ? (scene.night ? 0.16 : 0.2) : 0;
  return { channel, box, track, synth };
}
