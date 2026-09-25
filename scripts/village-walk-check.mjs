// Village walk check: walks every route between the houses, public buildings
// and districts the way players do — holding 8-way movement keys toward the
// next bend of the road, and clicking a destination (click-to-walk) — using
// the same stepping as app/lounge-village.tsx at 60 frames per second.
//
// A "stall" is a frame where input is held (a key, or a click route that is
// still being followed) but the walker moved less than a quarter of a normal
// step. "Stuck" routes never reached their destination.
//
//   node --experimental-strip-types scripts/village-walk-check.mjs
// VILLAGE_LAYOUT points at another copy of the layout (e.g. the previous
// commit's) to compare before/after numbers with the same walker.
const {
  VILLAGE_DISTRICTS,
  VILLAGE_PLACES,
  villagePath,
  villageStep,
} = await import(process.env.VILLAGE_LAYOUT ?? '../app/lounge-village-layout.ts');

// Mirrors app/lounge-village.tsx (WALK_SPEED) and the camera-relative keys.
const WALK_SPEED = 5.2;
const DT = 1 / 60;
const FRAME = WALK_SPEED * DT;
const STALL = FRAME * 0.25;
const ARRIVE = 0.3;

export function walkTargets() {
  return [
    ...VILLAGE_PLACES.map((place) => ({ id: place.id, point: place.entry })),
    ...VILLAGE_DISTRICTS.map((d) => ({ id: d.id, point: d.point })),
  ];
}

const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/** Click-to-walk: the same follow loop as the village (budgeted steps, give up on no progress). */
function clickWalk(from, to) {
  let position = { ...from },
    path = villagePath(position, to),
    stalls = 0,
    frames = 0;
  if (!path.length) return { stalls, frames, arrived: false };
  while (path.length && frames < 60 * 60) {
    frames++;
    const before = position;
    let budget = FRAME;
    while (path.length && budget > 0) {
      const target = path[0],
        dx = target.x - position.x,
        dz = target.z - position.z,
        d = Math.hypot(dx, dz);
      if (d < 0.06) {
        path.shift();
        continue;
      }
      const step = Math.min(d, budget);
      const next = villageStep(position, (dx / d) * step, (dz / d) * step);
      budget -= step;
      if (Math.hypot(next.x - position.x, next.z - position.z) < Math.min(1e-4, step * 0.5)) {
        path = [];
        break;
      }
      position = next;
    }
    if (distance(before, position) < STALL && path.length) stalls++;
    if (!path.length && distance(position, to) > ARRIVE) stalls++;
  }
  return { stalls, frames, arrived: distance(position, to) <= ARRIVE };
}

// Screen-relative keys: (h, v) -> world (h*0.837 + v*0.547, v*0.837 - h*0.547).
function keysToward(from, to) {
  const wx = to.x - from.x,
    wz = to.z - from.z;
  const h = 0.837 * wx - 0.547 * wz,
    v = 0.547 * wx + 0.837 * wz;
  // A player holds one of eight key combinations: the nearest 45° sector.
  const sector = Math.round(Math.atan2(v, h) / (Math.PI / 4));
  const angle = (sector * Math.PI) / 4;
  return { h: Math.round(Math.cos(angle)), v: Math.round(Math.sin(angle)) };
}

/** Points every 0.4 along the planned (clear) route. */
function densify(from, route) {
  const out = [];
  let a = from;
  for (const b of route) {
    const n = Math.max(1, Math.ceil(distance(a, b) / 0.4));
    for (let i = 1; i <= n; i++)
      out.push({ x: a.x + ((b.x - a.x) * i) / n, z: a.z + ((b.z - a.z) * i) / n });
    a = b;
  }
  return out;
}

/**
 * Keyboard: the player holds the 8-way key toward a point about one metre
 * ahead on the road (pure pursuit), so 45° key directions brush whatever
 * stands beside the route — exactly where snagging happens.
 */
function keyWalk(from, to) {
  const route = densify(from, villagePath(from, to));
  let position = { ...from },
    index = 0,
    stalls = 0,
    frames = 0,
    stuck = 0;
  if (!route.length) return { stalls, frames, arrived: false };
  const last = route.length - 1;
  while (frames < 60 * 60) {
    // Advance the look-ahead: the first route point at least 1 m away.
    while (index < last && distance(position, route[index]) < 1) index++;
    const goal = route[index];
    if (index === last && distance(position, goal) < 0.12) break;
    frames++;
    const { h, v } = keysToward(position, goal);
    const len = Math.hypot(h, v),
      speed = FRAME / len;
    const next = villageStep(
      position,
      (h * 0.837 + v * 0.547) * speed,
      (v * 0.837 - h * 0.547) * speed,
    );
    const moved = distance(position, next);
    position = next;
    if (moved < STALL) {
      stalls++;
      // A player stuck for two seconds steers around by hand: look further
      // down the road (the stall frames are already counted).
      if (++stuck > 120) {
        index = Math.min(last, index + 3);
        stuck = 0;
      }
    } else stuck = 0;
  }
  return { stalls, frames, arrived: distance(position, to) <= ARRIVE };
}

export function villageWalkCheck() {
  const targets = walkTargets();
  const result = {
    routes: 0,
    key: { stalls: 0, frames: 0, stuck: 0, stalledRoutes: 0 },
    click: { stalls: 0, frames: 0, stuck: 0, stalledRoutes: 0 },
    worst: [],
  };
  for (const a of targets)
    for (const b of targets) {
      if (a === b) continue;
      result.routes++;
      const k = keyWalk(a.point, b.point),
        c = clickWalk(a.point, b.point);
      for (const [mode, r] of [
        ['key', k],
        ['click', c],
      ]) {
        const sum = result[mode];
        sum.stalls += r.stalls;
        sum.frames += r.frames;
        if (!r.arrived) sum.stuck++;
        if (r.stalls) sum.stalledRoutes++;
        if (r.stalls || !r.arrived)
          result.worst.push({ mode, from: a.id, to: b.id, stalls: r.stalls, arrived: r.arrived });
      }
    }
  result.worst.sort((x, y) => y.stalls - x.stalls);
  result.worst = result.worst.slice(0, 12);
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = villageWalkCheck();
  console.log(
    `routes ${r.routes}\n` +
      `keyboard: stall frames ${r.key.stalls} / ${r.key.frames} (routes with stalls ${r.key.stalledRoutes}, not arrived ${r.key.stuck})\n` +
      `click:    stall frames ${r.click.stalls} / ${r.click.frames} (routes with stalls ${r.click.stalledRoutes}, not arrived ${r.click.stuck})`,
  );
  for (const w of r.worst) console.log('  ', w.mode, w.from, '->', w.to, 'stalls', w.stalls, w.arrived ? '' : 'NOT ARRIVED');
}
