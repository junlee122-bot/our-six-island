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
import {
  BOARD_REACH,
  FISH_REACH,
  FOUNTAIN_REACH,
  MUSEUM_REACH,
  SPAWN_REACH,
  boardDistance,
  fountainDistance,
  museumDistance,
  nearestFishSpot,
  nearestSpawn,
} from './lounge-village-spots.ts';
import type { Spot } from './lounge-items.ts';
import { itemName, spotBlock } from './lounge-life-plus.ts';
import { farmToolAction } from './lounge-life-ui.ts';

/** Something "범타듀의 하루" you can do where you stand (E / action button). */
export type VillageSpot =
  | { kind: 'farm' }
  /** The decorative shared field by the plaza: points to my own plots. */
  | { kind: 'commons' }
  | { kind: 'tree'; id: string; readyAt: number }
  | { kind: 'market' }
  | { kind: 'npc'; actor: number }
  | { kind: 'mailbox' }
  // Life expansion (LIFE-B).
  | { kind: 'fish'; spot: Spot }
  | { kind: 'spawn'; spot: string; item: string; mode: 'forage' | 'bug' }
  | { kind: 'museum' }
  | { kind: 'board' }
  | { kind: 'friendFarm'; actor: number }
  | { kind: 'fountain' };

export type VillageTarget =
  | { type: 'door'; entrance: NearbyVillageEntrance }
  | { type: 'spot'; spot: VillageSpot };

export type VillageAction = {
  kind: ActionKind;
  target: VillageTarget;
  /** Overrides the default label ("붕어 잡기", "토마토 심기 (3)"…). */
  label?: string;
  /** Shown but not usable right now (e.g. already watered today). */
  disabled?: boolean;
};

export function villageAction(
  point: VillagePoint,
  actor: number,
  {
    life,
    now,
    npcs = [],
    canVisit = true,
    tool = '',
  }: {
    life?: LifeView | null;
    now: number;
    npcs?: readonly { actor: number; point: VillagePoint }[];
    /** Friends' doors lead to their rooms ('놀러 가기'). */
    canVisit?: boolean;
    /** The selected hotbar item (seed / fertilizer / watering can). */
    tool?: string;
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
  // Ripe crops come first: E gathers them whatever the hotbar holds (VILL-2).
  const ripe = life?.me.farm.filter((p) => p.crop && (p.readyAt ?? Infinity) <= now).length ?? 0;
  const quick = ripe
    ? null
    : life
    ? farmToolAction(
        life.me.farm,
        life.me,
        tool,
        now,
        life.calendar?.season ?? 'spring',
        !!life.flags?.includes('greenhouse'),
      )
    : null;
  candidates.push({
    kind: quick ? (quick.kind === 'fertilize' ? 'tend' : quick.kind) : farmAction(life?.me.farm ?? [], now),
    distance: farmDistance(point, actor),
    reach: FARM_REACH,
    target: { type: 'spot', spot: { kind: 'farm' } },
  });
  const labels = new Map<string, { label?: string; disabled?: boolean }>();
  if (quick) labels.set('farm', { label: quick.label });
  else if (ripe) labels.set('farm', { label: `거두기 (${ripe})` });
  // Friends' farms: 물 주기 once per friend per day (their plots are public).
  if (life)
    for (const [id, plots] of Object.entries(life.housesPlotsPublic ?? {})) {
      const owner = life.actors?.[id];
      if (owner === undefined || owner === actor) continue;
      const done = !!life.me.waterFriend?.includes(owner),
        needs = plots.filter((p) => p.needsWater).length;
      if (!done && !needs) continue;
      const key = 'friendFarm:' + owner;
      labels.set(key, done ? { label: '오늘 물 줬어요', disabled: true } : { label: '물 주기 (오늘 1번)' });
      candidates.push({
        kind: 'waterFriend',
        distance: farmDistance(point, owner),
        reach: FARM_REACH,
        target: { type: 'spot', spot: { kind: 'friendFarm', actor: owner } },
      });
    }
  const fishing = nearestFishSpot(point, FISH_REACH);
  if (fishing) {
    const block = spotBlock(fishing.spot, life?.flags ?? [], life?.me.fishing?.rod ?? 1, now);
    if (block)
      labels.set('fish:' + fishing.spot, {
        label: block === 'rod' ? '낚싯대 2단계가 필요해요' : block === 'night' ? '해가 지면 열려요' : '데크 수리가 필요해요',
        disabled: true,
      });
    candidates.push({
      kind: 'fish',
      distance: fishing.distance,
      reach: FISH_REACH,
      target: { type: 'spot', spot: { kind: 'fish', spot: fishing.spot } },
    });
  }
  const spawn = life ? nearestSpawn(point, life.me.spawns ?? [], SPAWN_REACH) : null;
  if (spawn) {
    labels.set('spawn:' + spawn.spot, {
      label: `${itemName(spawn.item)} ${spawn.kind === 'bug' ? '잡기' : '줍기'}`,
    });
    candidates.push({
      kind: spawn.kind === 'bug' ? 'catch' : 'forage',
      distance: spawn.distance,
      reach: SPAWN_REACH,
      target: { type: 'spot', spot: { kind: 'spawn', spot: spawn.spot, item: spawn.item, mode: spawn.kind } },
    });
  }
  candidates.push({
    kind: 'museum',
    distance: museumDistance(point),
    reach: MUSEUM_REACH,
    target: { type: 'spot', spot: { kind: 'museum' } },
  });
  candidates.push({
    kind: 'board',
    distance: boardDistance(point),
    reach: BOARD_REACH,
    target: { type: 'spot', spot: { kind: 'board' } },
  });
  if (life?.flags?.includes('fountain') && !life.me.wished)
    candidates.push({
      kind: 'wish',
      distance: fountainDistance(point),
      reach: FOUNTAIN_REACH,
      target: { type: 'spot', spot: { kind: 'fountain' } },
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
  if (!best?.target) return null;
  const t = best.target;
  const key =
    t.type === 'door'
      ? ''
      : t.spot.kind === 'friendFarm'
        ? 'friendFarm:' + t.spot.actor
        : t.spot.kind === 'fish'
          ? 'fish:' + t.spot.spot
          : t.spot.kind === 'spawn'
            ? 'spawn:' + t.spot.spot
            : t.spot.kind;
  return { kind: best.kind, target: t, ...labels.get(key) };
}

/** Stable identity of an action (re-render only when it changes). */
export function villageActionKey(action: VillageAction | null) {
  if (!action) return '';
  const t = action.target;
  return (
    action.kind +
    ':' +
    (t.type === 'door' ? 'door:' + t.entrance.place.id : JSON.stringify(t.spot)) +
    ':' +
    (action.label ?? '') +
    (action.disabled ? ':off' : '')
  );
}
