/**
 * Where loungeSprites.draw puts a composed figure on its target canvas.
 *
 * The body (the figure without hat, glasses or clip) alone sets the scale and
 * the anchor, so putting on a hat never shrinks the character or slides it
 * sideways (a headband's knot, a straw brim). Accessories extend past the
 * body; `headroom` is the top share of a world canvas kept free for them.
 * Pure: unit-tested in tests/lounge-accessories.test.mjs.
 */
export type FrameBox = { x: number; y: number; w: number; h: number };
export type FigureFrame = {
  scale: number;
  /** Canvas point the figure is anchored at (before lift/tilt). */
  anchorX: number;
  anchorY: number;
  /** Offset of the composite's top-left corner from the anchor, canvas px. */
  dx: number;
  dy: number;
};

/**
 * Top share of a world figure canvas reserved for hats. The tallest hat
 * (a beanie on 민서) rises ~29% of the body height above the hair.
 */
export const HAT_HEADROOM = 0.24;
/** Canvas height that shows a `bodyHeight`-tall body canvas plus HAT_HEADROOM. */
export const withHatHeadroom = (bodyHeight: number) =>
  Math.round(bodyHeight / (1 - HAT_HEADROOM));

export function figureFrame(
  target: { width: number; height: number },
  body: FrameBox,
  piece: FrameBox,
  portrait = false,
  headroom = 0,
): FigureFrame {
  const W = target.width,
    H = target.height,
    centre = body.x + body.w / 2,
    above = Math.max(0, body.y - piece.y);
  if (portrait) {
    // Head-and-shoulders: the body's width fills the frame and the hair top
    // sits at 8%. A hat pushes the face down a little (never more than 8%)
    // and may be cut at the top, so the face stays in round avatar crops.
    const scale = W / (body.w * 0.94),
      shift = Math.min(0.08 * H, Math.max(0, above * scale - 0.06 * H));
    return {
      scale,
      anchorX: W / 2,
      anchorY: H * 0.08 + shift,
      dx: (piece.x - centre) * scale,
      dy: (piece.y - body.y) * scale,
    };
  }
  const room = Math.max(0, Math.min(0.9, headroom));
  let scale = Math.min(
    (W * 0.92) / body.w,
    (H * 0.94 * (1 - room)) / body.h,
  );
  // An accessory that still does not fit (no headroom, or an unusually tall
  // hat) shrinks the figure just enough to keep it inside the canvas.
  const half = Math.max(centre - piece.x, piece.x + piece.w - centre);
  scale = Math.min(
    scale,
    (H * 0.96) / (body.h + above),
    half > 0 ? (W * 0.49) / half : scale,
  );
  return {
    scale,
    anchorX: W / 2,
    anchorY: H * 0.97,
    dx: (piece.x - centre) * scale,
    dy: (piece.y - (body.y + body.h)) * scale,
  };
}
