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
  FETE_REACH,
  FISH_REACH,
  feteDistance,
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
import { farmToolAction, plantsAnySeason } from './lounge-life-ui.ts';
import { FORGE_REACH, NODE_REACH, forgeDistance, nearestNode } from './lounge-village-growth.ts';
import { NODE_INFO, type NodeKind } from './lounge-growth-data.ts';
import { VILLAGE_GATE, villageGateDistance } from './lounge-areas.ts';
import { DISTRICTS, DISTRICT_IDS, HUB_SIGNPOST, districtOpen, gateDistance, type DistrictId } from './lounge-districts.ts';
import { NPCS, type NpcId } from './lounge-npc-data.ts';
import { josa } from './lounge-text.ts';
import { BIRTHDAY_CAKE_POINT } from './lounge-birthday.ts';

/** How close to the plaza cake the action button offers it (world units). */
export const CAKE_REACH = 1.4;

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
  | { kind: 'fountain' }
  /** Today's festival booth (C-6). */
  | { kind: 'fete' }
  /** 생일 잔치: the plaza birthday cake and its 축하 방명록. */
  | { kind: 'cake' }
  /** 성장 P1: the blacksmith (ruined until 마을 개척 “대장간 재건”). */
  | { kind: 'forge' }
  /** 성장 P1: today's bush / log / rock at the village edge. */
  | { kind: 'node'; id: string; node: NodeKind }
  /** 성장 P2: the north gate up to 뒷산 (open after 마을 개척 “산길 정비”). */
  | { kind: 'gate' }
  /** A district gate on the rim (lounge-districts.ts); a closed one says what opens it. */
  | { kind: 'district'; id: DistrictId }
  /** 친구에게 가기: fast travel to a friend's district gate (visited districts only). */
  | { kind: 'signpost' }
  /** A resident walking about the hub (lounge-npc-schedule.ts). */
  | { kind: 'resident'; npc: NpcId };

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
    residents = [],
    canVisit = true,
    tool = '',
  }: {
    life?: LifeView | null;
    now: number;
    npcs?: readonly { actor: number; point: VillagePoint }[];
    /** Residents drawn in the hub right now (id and where). */
    residents?: readonly { id: NpcId; x: number; z: number }[];
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
        plantsAnySeason(life),
      )
    : null;
  candidates.push({
    kind: quick ? (quick.kind === 'fertilize' || quick.kind === 'till' ? 'tend' : quick.kind) : farmAction(life?.me.farm ?? [], now),
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
  // 생일 잔치: the cake stands only on a friend's birthday; sign it (or, for
  // the birthday friend and once signed, look at the 방명록).
  const bday = life?.birthday;
  if (bday?.today.length) {
    const open = bday.today.filter((a) => a !== actor && !bday.books[a]?.includes(actor));
    labels.set('cake', { label: open.length ? '생일 축하하기' : '생일 방명록 보기' });
    candidates.push({
      kind: 'cake',
      distance: Math.max(0, Math.hypot(point.x - BIRTHDAY_CAKE_POINT.x, point.z - BIRTHDAY_CAKE_POINT.z) - 0.5),
      reach: CAKE_REACH,
      target: { type: 'spot', spot: { kind: 'cake' } },
    });
  }
  if (life?.social?.fete?.active)
    candidates.push({
      kind: 'fete',
      distance: feteDistance(point, life.flags ?? []),
      reach: FETE_REACH,
      target: { type: 'spot', spot: { kind: 'fete' } },
    });
  // 성장 P1: the blacksmith's door and today's material nodes.
  if (life?.growth) {
    const ready = life.growth.forge?.ready;
    labels.set('forge', {
      label: !life.growth.forgeOpen ? '무너진 공방 보기' : ready ? '도구 찾기' : '대장간',
    });
    candidates.push({
      kind: 'forge',
      distance: forgeDistance(point),
      reach: FORGE_REACH,
      target: { type: 'spot', spot: { kind: 'forge' } },
    });
    labels.set('gate', { label: life.growth.regions?.hill.open ? '뒷산 오르기' : '뒷산 가는 길 · 산길 정비 필요' });
    candidates.push({
      kind: 'enter',
      distance: villageGateDistance(point),
      reach: VILLAGE_GATE.reach,
      target: { type: 'spot', spot: { kind: 'gate' } },
    });
    const node = nearestNode(point, life.growth.nodes, NODE_REACH);
    if (node) {
      labels.set('node:' + node.id, { label: `${NODE_INFO[node.kind].name} ${NODE_INFO[node.kind].verb}` });
      candidates.push({
        kind: node.kind === 'rock' ? 'smash' : 'chop',
        distance: node.distance,
        reach: NODE_REACH,
        target: { type: 'spot', spot: { kind: 'node', id: node.id, node: node.kind } },
      });
    }
  }
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
  for (const r of residents) {
    labels.set('resident:' + r.id, { label: `${josa(NPCS[r.id].name, '과/와')} 이야기하기` });
    candidates.push({
      kind: 'talk',
      distance: Math.hypot(r.x - point.x, r.z - point.z) - 0.2,
      reach: NPC_TALK_REACH + 0.3,
      target: { type: 'spot', spot: { kind: 'resident', npc: r.id } },
    });
  }
  labels.set('signpost', { label: '친구에게 가기' });
  candidates.push({
    kind: 'board',
    distance: Math.hypot(point.x - HUB_SIGNPOST.x, point.z - HUB_SIGNPOST.z),
    reach: HUB_SIGNPOST.reach,
    target: { type: 'spot', spot: { kind: 'signpost' } },
  });
  for (const id of DISTRICT_IDS) {
    const d = DISTRICTS[id];
    labels.set('district:' + id, { label: districtOpen(id, { flags: life?.flags, pass: life?.districts?.pass }) ? `${josa(d.name, '으로/로')} 가기` : `${d.name} · 아직 닫혀 있어요` });
    candidates.push({
      kind: 'enter',
      distance: gateDistance(id, point),
      reach: d.gate.reach,
      target: { type: 'spot', spot: { kind: 'district', id } },
    });
  }
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
            : t.spot.kind === 'node'
              ? 'node:' + t.spot.id
              : t.spot.kind === 'district'
                ? 'district:' + t.spot.id
                : t.spot.kind === 'resident'
                  ? 'resident:' + t.spot.npc
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
