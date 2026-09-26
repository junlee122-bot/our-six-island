import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_MUSIC_LEVEL,
  MUSIC_TRACKS,
  loopPoints,
  musicMix,
  trackCandidates,
} from '../app/lounge-music-tracks.ts';
import { DEFAULT_SETTINGS, readSettings } from '../app/lounge-settings.ts';

const ready = (places) => (place) => places.includes(place);
const scene = (patch) => ({ place: null, game: false, night: false, ...patch });

test('location music slots cover the casino and the hall under public/assets/lounge/music', () => {
  for (const place of ['casino', 'hall']) {
    assert.ok(MUSIC_TRACKS[place].files.length > 0);
    for (const file of MUSIC_TRACKS[place].files)
      assert.match(file, new RegExp(`^/assets/lounge/music/${place}\\.(ogg|mp3)$`));
  }
});

test('the music box plays until a place has a loaded track', () => {
  assert.deepEqual(musicMix(scene({}), true, ready([])), { channel: 1, box: 0.2, track: null });
  assert.equal(musicMix(scene({ night: true }), true, ready([])).box, 0.16);
  // In the casino without a file (or while it loads) the box stands in.
  assert.deepEqual(musicMix(scene({ place: 'casino' }), true, ready([])), {
    channel: 1,
    box: 0.2,
    track: null,
  });
  // Once loaded, the track takes over (the box fades out).
  assert.deepEqual(musicMix(scene({ place: 'casino' }), true, ready(['casino'])), {
    channel: 1,
    box: 0,
    track: 'casino',
  });
  // Another place's track does not play here.
  assert.equal(musicMix(scene({ place: 'hall' }), true, ready(['casino'])).track, null);
});

test('게임 중 배경음 keeps table music quiet, or lets it step aside', () => {
  const on = musicMix(scene({ place: 'hall', game: true }), true, ready(['hall']));
  assert.deepEqual(on, { channel: GAME_MUSIC_LEVEL, box: 0, track: 'hall' });
  assert.ok(GAME_MUSIC_LEVEL > 0 && GAME_MUSIC_LEVEL < 1);
  const off = musicMix(scene({ place: 'hall', game: true }), false, ready(['hall']));
  assert.deepEqual(off, { channel: 0, box: 0, track: null });
  // A table with no place (never expected) stays silent like before.
  assert.equal(musicMix(scene({ game: true }), true, ready([])).channel, 0);
  // No file: the box continues quietly at the table.
  assert.deepEqual(musicMix(scene({ place: 'casino', game: true }), true, ready([])), {
    channel: GAME_MUSIC_LEVEL,
    box: 0.2,
    track: null,
  });
});

test('track candidates skip blanked build paths and prefer playable formats', () => {
  const track = { files: ['/m/a.ogg', '', '/m/a.mp3'] };
  assert.deepEqual(trackCandidates(track, () => 'maybe'), ['/m/a.ogg', '/m/a.mp3']);
  // Safari-like: no Vorbis, so the mp3 goes first.
  assert.deepEqual(
    trackCandidates(track, (mime) => (mime.includes('ogg') ? '' : 'probably')),
    ['/m/a.mp3', '/m/a.ogg'],
  );
  assert.deepEqual(trackCandidates({ files: ['', ''] }, () => 'maybe'), []);
});

test('loop points are clamped to the decoded length', () => {
  assert.deepEqual(loopPoints({ files: [] }, 120), { start: 0, end: 0 });
  assert.deepEqual(loopPoints({ files: [], loopStart: 4.5, loopEnd: 100 }, 120), {
    start: 4.5,
    end: 100,
  });
  assert.deepEqual(loopPoints({ files: [], loopStart: 2, loopEnd: 999 }, 90), {
    start: 2,
    end: 90,
  });
  // A broken range falls back to the whole file.
  assert.deepEqual(loopPoints({ files: [], loopStart: 50, loopEnd: 10 }, 90), {
    start: 0,
    end: 0,
  });
});

test('게임 중 배경음 defaults on and survives storage', () => {
  assert.equal(DEFAULT_SETTINGS.gameMusic, true);
  assert.equal(readSettings(JSON.stringify({ gameMusic: false })).gameMusic, false);
  assert.equal(readSettings(JSON.stringify({ gameMusic: 'no' })).gameMusic, true);
});
