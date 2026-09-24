import type { Motion } from './character-style';

/** A bounded animation clock shared by generated strips and costume deformation. */
export function gaitFrame(
  motion: Motion,
  seconds: number,
  count = 6,
  reduced = false,
) {
  if (reduced || (motion !== 'walk' && motion !== 'run')) return 0;
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  // Locomotion clocks advance with distance; running already moves them 1.65x faster.
  return Math.floor(time * (motion === 'run' ? 9 : 8)) % count;
}

export function costumeGaitPoint(
  x: number,
  y: number,
  frame: number,
  run: boolean,
  robe: boolean,
) {
  const phase = (frame / 8) * Math.PI * 2;
  const side = Math.tanh((x - 0.5) * 14);
  const stride = Math.sin(phase) * side;
  const start = robe ? 0.85 : 0.65;
  const leg = Math.max(0, (y - start) / (1 - start));
  const lift = Math.max(0, stride) * leg * leg * (run ? 0.085 : 0.04);
  // Continuous deformation keeps trousers, long hems and skin attached at the hips.
  const step = stride * leg * (run ? 0.035 : 0.018);
  const arm =
    Math.max(0, 1 - Math.abs(y - 0.61) / 0.19) *
    Math.max(0, (Math.abs(x - 0.5) - 0.2) / 0.3);
  return {
    x: x + step + Math.sin(phase) * arm * (run ? 0.022 : 0.01),
    y: y - lift,
  };
}

/** Deform the existing customized artwork, never substitute its clothing or colors. */
export function drawCostumeGait(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  rect: { x: number; y: number; w: number; h: number },
  frame: number,
  run: boolean,
  robe: boolean,
) {
  const columns = 6,
    rows = 12,
    bodyStart = 0.4;
  // The head is rigid: one draw preserves its detail and removes over half
  // the clipped triangles needed to generate a customized walking pose.
  ctx.drawImage(
    source,
    rect.x,
    rect.y,
    rect.w,
    rect.h * bodyStart,
    0,
    0,
    rect.w,
    rect.h * bodyStart,
  );
  const point = (x: number, y: number) => {
    const p = costumeGaitPoint(
      x / columns,
      bodyStart + (y / rows) * (1 - bodyStart),
      frame,
      run,
      robe,
    );
    return { x: p.x * rect.w, y: p.y * rect.h };
  };
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < columns; x++) {
      const sx = rect.x + (x * rect.w) / columns,
        sy = rect.y + (bodyStart + (y / rows) * (1 - bodyStart)) * rect.h;
      const sw = rect.w / columns,
        sh = (rect.h * (1 - bodyStart)) / rows;
      const tl = point(x, y),
        tr = point(x + 1, y),
        bl = point(x, y + 1),
        br = point(x + 1, y + 1);
      for (const second of [false, true]) {
        const a = second ? br : tl,
          b = second ? bl : tr,
          c = second ? tr : bl;
        ctx.save();
        // Overlap the clip itself: stretching only the source leaves hairline gaps
        // where Canvas antialiases two adjacent triangle boundaries.
        const center = { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
        const expand = (p: { x: number; y: number }) => {
          const distance = Math.hypot(p.x - center.x, p.y - center.y);
          const amount = 1 + 0.8 / Math.max(distance, 1);
          return {
            x: center.x + (p.x - center.x) * amount,
            y: center.y + (p.y - center.y) * amount,
          };
        };
        const ea = expand(a),
          eb = expand(b),
          ec = expand(c);
        ctx.beginPath();
        ctx.moveTo(ea.x, ea.y);
        ctx.lineTo(eb.x, eb.y);
        ctx.lineTo(ec.x, ec.y);
        ctx.closePath();
        ctx.clip();
        if (!second)
          ctx.transform(
            (tr.x - tl.x) / sw,
            (tr.y - tl.y) / sw,
            (bl.x - tl.x) / sh,
            (bl.y - tl.y) / sh,
            tl.x,
            tl.y,
          );
        else
          ctx.transform(
            (br.x - bl.x) / sw,
            (br.y - bl.y) / sw,
            (br.x - tr.x) / sh,
            (br.y - tr.y) / sh,
            bl.x + tr.x - br.x,
            bl.y + tr.y - br.y,
          );
        // Draw the full source through the local transform so overlap samples the
        // correct neighboring pixels instead of stretching each cell's edge.
        ctx.drawImage(source, -sx, -sy);
        ctx.restore();
      }
    }
}
