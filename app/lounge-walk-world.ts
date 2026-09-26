// Walking in a rectangular region with round and box obstacles (성장 P2
// regions: 뒷산, 숲 깊은 곳, 광산 floors). The village keeps its own tuned
// walker (lounge-village-layout.ts: rivers, bridges, slide substeps); this is
// the same idea for smaller places, built from data: `makeWalkWorld(bounds,
// colliders)` gives canWalk / step (slides along walls) / path (grid A* on a
// 0.5 grid with line-of-sight smoothing). Pure; no DOM, no three.js.

export type WalkPoint = { x: number; z: number };
export type WalkCollider =
  | { shape: 'circle'; x: number; z: number; r: number }
  | { shape: 'box'; x: number; z: number; w: number; d: number };
export type WalkBounds = { w: number; d: number; margin?: number };
export type WalkWorld = {
  bounds: WalkBounds;
  canWalk: (p: WalkPoint) => boolean;
  /** Moves by (dx, dz) as far as it can, sliding along what blocks it. */
  step: (from: WalkPoint, dx: number, dz: number) => WalkPoint;
  /** Waypoints from `from` to (near) `to`; [] when unreachable. */
  path: (from: WalkPoint, to: WalkPoint) => WalkPoint[];
  /** Nearest walkable point to `p` (spiral search). */
  near: (p: WalkPoint) => WalkPoint;
};

const RADIUS = 0.32;
const CELL = 0.5;

export function makeWalkWorld(bounds: WalkBounds, colliders: readonly WalkCollider[]): WalkWorld {
  const hw = bounds.w / 2 - (bounds.margin ?? 0.4),
    hd = bounds.d / 2 - (bounds.margin ?? 0.4);
  const canWalk = (p: WalkPoint) => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.z)) return false;
    if (Math.abs(p.x) > hw || Math.abs(p.z) > hd) return false;
    for (const c of colliders) {
      if (c.shape === 'circle') {
        if (Math.hypot(p.x - c.x, p.z - c.z) < c.r + RADIUS) return false;
      } else if (Math.abs(p.x - c.x) < c.w / 2 + RADIUS && Math.abs(p.z - c.z) < c.d / 2 + RADIUS) return false;
    }
    return true;
  };
  const step = (from: WalkPoint, dx: number, dz: number): WalkPoint => {
    const len = Math.hypot(dx, dz);
    if (!len) return { ...from };
    // Substeps so a fast frame never tunnels through a thin wall.
    const n = Math.max(1, Math.ceil(len / 0.15));
    let p = { ...from };
    for (let i = 0; i < n; i++) {
      const sx = dx / n,
        sz = dz / n;
      const full = { x: p.x + sx, z: p.z + sz };
      if (canWalk(full)) p = full;
      else {
        const onlyX = { x: p.x + sx, z: p.z },
          onlyZ = { x: p.x, z: p.z + sz };
        if (Math.abs(sx) >= Math.abs(sz) && canWalk(onlyX)) p = onlyX;
        else if (canWalk(onlyZ)) p = onlyZ;
        else if (canWalk(onlyX)) p = onlyX;
        else break;
      }
    }
    return { x: Math.round(p.x * 1000) / 1000, z: Math.round(p.z * 1000) / 1000 };
  };
  const cols = Math.floor((hw * 2) / CELL) + 1,
    rows = Math.floor((hd * 2) / CELL) + 1;
  const toCell = (p: WalkPoint) => ({
    c: Math.max(0, Math.min(cols - 1, Math.round((p.x + hw) / CELL))),
    r: Math.max(0, Math.min(rows - 1, Math.round((p.z + hd) / CELL))),
  });
  const cellPoint = (c: number, r: number) => ({ x: -hw + c * CELL, z: -hd + r * CELL });
  let open: Uint8Array | null = null;
  const grid = () => {
    if (open) return open;
    open = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) open[r * cols + c] = canWalk(cellPoint(c, r)) ? 1 : 0;
    return open;
  };
  const clear = (a: WalkPoint, b: WalkPoint) => {
    const d = Math.hypot(b.x - a.x, b.z - a.z),
      n = Math.max(1, Math.ceil(d / 0.2));
    for (let i = 1; i <= n; i++) if (!canWalk({ x: a.x + ((b.x - a.x) * i) / n, z: a.z + ((b.z - a.z) * i) / n })) return false;
    return true;
  };
  const near = (p: WalkPoint): WalkPoint => {
    if (canWalk(p)) return { ...p };
    for (let rad = 0.25; rad <= 6; rad += 0.25)
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const q = { x: p.x + Math.cos(a) * rad, z: p.z + Math.sin(a) * rad };
        if (canWalk(q)) return { x: Math.round(q.x * 100) / 100, z: Math.round(q.z * 100) / 100 };
      }
    return { ...p };
  };
  const path = (from: WalkPoint, rawTo: WalkPoint): WalkPoint[] => {
    const to = near(rawTo);
    if (clear(from, to)) return [to];
    const g = grid();
    const s = toCell(from),
      e = toCell(to);
    const start = s.r * cols + s.c,
      end = e.r * cols + e.c;
    const cost = new Float64Array(cols * rows).fill(Infinity),
      prev = new Int32Array(cols * rows).fill(-1);
    const heap: [number, number][] = [];
    const push = (i: number, f: number) => {
      heap.push([f, i]);
      let k = heap.length - 1;
      while (k > 0) {
        const p = (k - 1) >> 1;
        if (heap[p][0] <= heap[k][0]) break;
        [heap[p], heap[k]] = [heap[k], heap[p]];
        k = p;
      }
    };
    const pop = () => {
      const top = heap[0],
        last = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        let k = 0;
        for (;;) {
          const l = 2 * k + 1,
            r = l + 1;
          let m = k;
          if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
          if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
          if (m === k) break;
          [heap[m], heap[k]] = [heap[k], heap[m]];
          k = m;
        }
      }
      return top;
    };
    cost[start] = 0;
    push(start, 0);
    const hx = (i: number) => Math.hypot((i % cols) - e.c, Math.floor(i / cols) - e.r);
    while (heap.length) {
      const [, i] = pop();
      if (i === end) break;
      const c = i % cols,
        r = Math.floor(i / cols);
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nc = c + dc,
            nr = r + dr;
          if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
          const j = nr * cols + nc;
          if (!g[j] && j !== end) continue;
          if (dr && dc && (!g[r * cols + nc] || !g[nr * cols + c])) continue;
          const nextCost = cost[i] + (dr && dc ? Math.SQRT2 : 1);
          if (nextCost < cost[j]) {
            cost[j] = nextCost;
            prev[j] = i;
            push(j, nextCost + hx(j));
          }
        }
    }
    if (prev[end] < 0 && start !== end) return [];
    const cells: WalkPoint[] = [];
    for (let i = end; i !== start && i >= 0; i = prev[i]) cells.push(cellPoint(i % cols, Math.floor(i / cols)));
    cells.reverse();
    cells[cells.length - 1] = to;
    // String pulling: keep only the corners.
    const out: WalkPoint[] = [];
    let anchor = from;
    for (let k = 0; k < cells.length; k++) {
      const nextOne = cells[k + 1];
      if (nextOne && clear(anchor, nextOne)) continue;
      out.push(cells[k]);
      anchor = cells[k];
    }
    return out;
  };
  return { bounds, canWalk, step, path, near };
}
