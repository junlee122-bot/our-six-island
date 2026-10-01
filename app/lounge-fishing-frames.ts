// While the fishing overlay is open the 3D scene behind it only needs an
// occasional frame: the overlay covers the angler and the bobber, and every
// frame the scene draws competes with the bite reaction and the reel fight for
// the main thread. On a software GPU one frame of the village is ~0.9 s of
// rasterizing, so drawing it at the normal rate kept the page below 1 fps.
// The scene loops (lounge-village.tsx, lounge-area-3d.tsx) skip their whole
// update (movement, residents, sprites, labels) on frames this says no to.

export type FishingFramePhase = 'casting' | 'wait' | 'bite' | 'reeling' | 'fight' | 'result';

/** Behind the overlay: at most ~30 frames a second (half a 60 Hz display). */
export const FISHING_FRAME_MS = 33;
/** …and at most this share of the time spent drawing, however slow a frame is. */
export const FISHING_DRAW_SHARE = 0.12;
/** A frame slower than this counts as a slow GPU (bite frames wait for the hook). */
export const FISHING_SLOW_FRAME_MS = 50;

/**
 * Whether the scene behind the fishing overlay should draw (and update) now.
 * `drawMs` is the measured cost of one drawn frame (see `FrameCost`); a phase
 * change draws at once, except that a slow GPU never starts a frame while a
 * bite waits for the hook or the hook is on its way.
 */
export function fishingFrameDue(phase: FishingFramePhase, now: number, lastDraw: number, drawMs: number, phaseChanged: boolean): boolean {
  const slow = drawMs > FISHING_SLOW_FRAME_MS;
  if (slow && (phase === 'bite' || phase === 'reeling')) return false;
  if (phaseChanged) return true;
  return now - lastDraw >= Math.max(FISHING_FRAME_MS, drawMs / FISHING_DRAW_SHARE);
}

/** One display frame at 60 Hz: the shortest gap an animation frame can have. */
export const DISPLAY_FRAME_MS = 1000 / 60;

/**
 * The cost of a drawn frame, read from the animation-frame gap that follows
 * it (less one display frame): WebGL work is flushed when the frame is
 * presented, so timing `renderer.render` itself only sees the command
 * queueing (a few ms).
 */
export class FrameCost {
  ms = 0;
  private drewAt = -1;
  private measured = false;
  /** Call first thing in every animation frame. */
  frame(now: number) {
    if (this.drewAt < 0) return;
    const gap = Math.max(0, now - this.drewAt - DISPLAY_FRAME_MS);
    this.drewAt = -1;
    this.ms = this.measured ? this.ms * 0.7 + gap * 0.3 : gap;
    this.measured = true;
  }
  /** Call right after a frame draws. */
  drew(now: number) {
    this.drewAt = now;
  }
}
