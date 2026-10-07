// 성장 P1 in the village (pure geometry, no three.js): where the blacksmith's
// door is and how close you must be to a material node (bush, log, rock) to
// use it. The forge footprint lives in lounge-village-karchive-layout.ts
// (KARCHIVE_FORGE, a walk collider); the nodes' spots in lounge-growth-data.ts
// (NODE_SPOTS, no collider: they never block a route).
import { KARCHIVE_FORGE } from './lounge-village-karchive-layout.ts';
import { walkableNear } from './lounge-village-life.ts';
import type { VillagePoint } from './lounge-village-layout.ts';
import type { NodeKind } from './lounge-growth-data.ts';

/** Where you stand to talk to the blacksmith (in front of the door, +z). */
export const FORGE_FRONT: VillagePoint = walkableNear({ x: KARCHIVE_FORGE.x, z: KARCHIVE_FORGE.z + KARCHIVE_FORGE.d / 2 + 0.7 });
export const FORGE_REACH = 1.6;
export const forgeDistance = (p: VillagePoint) => {
  const dx = Math.max(0, Math.abs(p.x - KARCHIVE_FORGE.x) - KARCHIVE_FORGE.w / 2),
    dz = Math.max(0, Math.abs(p.z - KARCHIVE_FORGE.z) - KARCHIVE_FORGE.d / 2);
  return Math.hypot(dx, dz);
};

export const NODE_REACH = 1.35;
/** The nearest untaken node within reach. */
export function nearestNode<T extends { id: string; kind: NodeKind; x: number; z: number; taken: boolean }>(
  p: VillagePoint,
  nodes: readonly T[],
  reach = NODE_REACH,
): (T & { distance: number }) | null {
  let best: (T & { distance: number }) | null = null;
  for (const n of nodes) {
    if (n.taken) continue;
    const distance = Math.hypot(p.x - n.x, p.z - n.z);
    if (distance <= reach && (!best || distance < best.distance)) best = { ...n, distance };
  }
  return best;
}
/** A walkable point beside a node (the directory's "가 보기"). */
export const nodeFront = (n: { x: number; z: number }): VillagePoint => walkableNear({ x: n.x, z: n.z + 0.9 });

/**
 * 성장 수첩 "오늘의 재료": one row per kind instead of one per node — how many
 * are left, how many there were, and the untaken one nearest `from` (the
 * avatar, or the village start). Kinds keep the order they first appear in.
 */
export function groupNodes<T extends { id: string; kind: NodeKind; x: number; z: number; taken: boolean }>(
  nodes: readonly T[],
  from: VillagePoint,
): { kind: NodeKind; total: number; left: number; nearest: T | null }[] {
  const out = new Map<NodeKind, { kind: NodeKind; total: number; left: number; nearest: T | null }>();
  for (const n of nodes) {
    const g = out.get(n.kind) ?? { kind: n.kind, total: 0, left: 0, nearest: null };
    out.set(n.kind, g);
    g.total += 1;
    if (n.taken) continue;
    g.left += 1;
    if (!g.nearest || Math.hypot(from.x - n.x, from.z - n.z) < Math.hypot(from.x - g.nearest.x, from.z - g.nearest.z)) g.nearest = n;
  }
  return [...out.values()];
}
