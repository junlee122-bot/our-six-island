// What the village's single action button does where you stand (pure).
import {
  farmAction,
  pickAction,
  type ActionCandidate,
  type ActionKind,
} from './lounge-flow.ts';
import {
  villageNearbyEntrance,
  VILLAGE_ENTRY_RADIUS,
  type NearbyVillageEntrance,
} from './lounge-village-entrance.ts';
import {
  COMMONS_REACH,
  FARM_REACH,
  MAILBOX_REACH,
  MARKET_REACH,
  NPC_TALK_REACH,
  TREE_REACH,
  commonsDistance,
  farmDistance,
  mailboxDistance,
  marketDistance,
  nearestFruitTree,
} from './lounge-village-life.ts';
import type { VillagePoint } from './lounge-village-layout.ts';
import type { LifeView } from './lounge-life.ts';

/** Something "범타듀의 하루" you can do where you stand (E / action button). */
export type VillageSpot =
  | { kind: 'farm' }
  /** The decorative shared field by the plaza: points to my own plots. */
  | { kind: 'commons' }
  | { kind: 'tree'; id: string; readyAt: number }
  | { kind: 'market' }
  | { kind: 'npc'; actor: number }
  | { kind: 'mailbox' };

export type VillageTarget =
  | { type: 'door'; entrance: NearbyVillageEntrance }
  | { type: 'spot'; spot: VillageSpot };

export type VillageAction = {
  kind: ActionKind;
  target: VillageTarget;
};

export function villageAction(
  point: VillagePoint,
  actor: number,
  {
    life,
    now,
    npcs = [],
    canVisit = true,
  }: {
    life?: LifeView | null;
    now: number;
    npcs?: readonly { actor: number; point: VillagePoint }[];
    /** Friends' doors lead to their rooms ('놀러 가기'). */
    canVisit?: boolean;
  },
): VillageAction | null {
  const candidates: (ActionCandidate<VillageTarget> | null)[] = [];
  const entrance = villageNearbyEntrance(point, actor);
  if (entrance && (entrance.canEnter || (canVisit && entrance.place.kind === 'home')))
    candidates.push({
      kind: 'enter',
      distance: entrance.distance,
      reach: VILLAGE_ENTRY_RADIUS,
      door: true,
      target: { type: 'door', entrance },
    });
  candidates.push({
    kind: farmAction(life?.me.farm ?? [], now),
    distance: farmDistance(point, actor),
    reach: FARM_REACH,
    target: { type: 'spot', spot: { kind: 'farm' } },
  });
  candidates.push({
    kind: 'mail',
    distance: mailboxDistance(point, actor),
    reach: MAILBOX_REACH,
    target: { type: 'spot', spot: { kind: 'mailbox' } },
  });
  candidates.push({
    kind: 'look',
    distance: marketDistance(point),
    reach: MARKET_REACH,
    target: { type: 'spot', spot: { kind: 'market' } },
  });
  candidates.push({
    kind: 'guide',
    distance: commonsDistance(point),
    reach: COMMONS_REACH,
    target: { type: 'spot', spot: { kind: 'commons' } },
  });
  const tree = nearestFruitTree(point);
  if (tree)
    candidates.push({
      kind: 'pick',
      distance: tree.distance,
      reach: TREE_REACH,
      target: {
        type: 'spot',
        spot: {
          kind: 'tree',
          id: tree.id,
          readyAt: life?.me.fruitReadyAt?.[tree.id] ?? 0,
        },
      },
    });
  for (const npc of npcs)
    candidates.push({
      kind: 'talk',
      distance: Math.hypot(npc.point.x - point.x, npc.point.z - point.z),
      reach: NPC_TALK_REACH,
      target: { type: 'spot', spot: { kind: 'npc', actor: npc.actor } },
    });
  const best = pickAction(candidates);
  return best?.target ? { kind: best.kind, target: best.target } : null;
}

/** Stable identity of an action (re-render only when it changes). */
export function villageActionKey(action: VillageAction | null) {
  if (!action) return '';
  const t = action.target;
  return (
    action.kind +
    ':' +
    (t.type === 'door' ? 'door:' + t.entrance.place.id : JSON.stringify(t.spot))
  );
}
