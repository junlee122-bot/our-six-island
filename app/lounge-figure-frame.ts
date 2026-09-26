/**
 * Where loungeSprites.draw puts a composed figure on its target canvas.
 *
 * The body (the figure without glasses or clip) alone sets the scale and the
 * anchor, so putting on an accessory never shrinks the character or slides it
 * sideways. Figures wear no hats, so no canvas keeps a band free above the
 * head: the body fills the canvas as it did before accessories existed.
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

export type FrameOptions = {
  portrait?: boolean;
  /**
   * Fixed source→canvas scale (walk/run strips use the idle figure's, so the
   * character never changes size when it starts or stops moving).
   */
  scale?: number;
};

export function figureFrame(
  target: { width: number; height: number },
  body: FrameBox,
  piece: FrameBox,
  options: FrameOptions = {},
): FigureFrame {
  const W = target.width,
    H = target.height,
    centre = body.x + body.w / 2,
    above = Math.max(0, body.y - piece.y);
  if (options.portrait) {
    // Head-and-shoulders: the body's width fills the frame and the hair top
    // sits at 8%, so the face stays in round avatar crops.
    const scale = W / (body.w * 0.94);
    return {
      scale,
      anchorX: W / 2,
      anchorY: H * 0.08,
      dx: (piece.x - centre) * scale,
      dy: (piece.y - body.y) * scale,
    };
  }
  let scale =
    options.scale ?? Math.min((W * 0.92) / body.w, (H * 0.94) / body.h);
  // An accessory reaching past the body (a clip above the hair) shrinks the
  // figure just enough to keep it inside the canvas.
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
