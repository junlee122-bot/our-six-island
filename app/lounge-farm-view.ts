// 우리 농장 on screen (pure): what the farm scene draws from the life view
// (every friend's field, its crops, fixtures and giant beds, the house tiers)
// and what E reaches where I stand (my field, a friend's field, the house
// doors, the shipping bin, the mailbox, the farm board, the spots marked for
// later). lounge-farm-scene.ts draws, lounge-area-3d.tsx asks; the tests
// check the touches without a renderer.
import type { LifeView } from './lounge-life.ts';
import type { FixtureKind, MachineKind } from './lounge-farm-data.ts';
import { FIELD_TIERS, GRID_TILES, fieldBlock, tileAt, tileOpen, tileRC } from './lounge-farm-data.ts';
import { maskHas } from './lounge-farm-soil.ts';
import { farmTileAction, plantsAnySeason } from './lounge-life-ui.ts';
import {
  FARM_BIN,
  FARM_BOARD,
  FARM_FIELDS,
  FARM_HOUSES,
  FARM_LATER,
  FARM_MAILBOX,
  FIELD_REACH,
  HOUSE_DOOR_REACH,
  LATER_REACH,
  fieldDistance,
  fieldTileAt,
  type FarmField,
  type FarmLater,
} from './lounge-farm-layout.ts';
import type { WalkPoint } from './lounge-walk-world.ts';
import { farmAction, type ActionKind } from './lounge-flow.ts';
import { ACTORS } from './lounge-roster.ts';

export type FarmPlotDraw = { tile: number; crop: string | null; growth: 0 | 1 | 2 | 3 | 4; wet?: boolean; dead?: string; tilled?: boolean };
export type FarmFieldDraw = {
  actor: number;
  /** Open tiles (24 / 48 / 80). */
  size: number;
  plots: FarmPlotDraw[];
  fx: [number, FixtureKind][];
  /** F2: front-yard spots holding a scarecrow or a bee house (spot, kind). */
  yard: [number, FixtureKind][];
  /** F2: 덩굴 시렁 anchors (each over its tile and the next two east). */
  trellis: number[];
  /** Work-yard machines (slot, kind, working). */
  mach: [number, MachineKind, boolean][];
  giants: number[];
};
export type FarmSceneState = { fields: FarmFieldDraw[]; houses: Record<number, number> };

const SMALLEST = FIELD_TIERS[0].size;
/** A friend's plots to draw: their crops, and (F2) their tilled empty tiles from the mask. */
function friendPlots(list: NonNullable<LifeView['housesPlotsPublic']>[string], mask: string | undefined): FarmPlotDraw[] {
  const out: FarmPlotDraw[] = list.map((p) => ({
    tile: p.tile,
    crop: p.crop,
    growth: (p.growth ?? 0) as FarmPlotDraw['growth'],
    tilled: true,
    ...(p.wet ? { wet: true } : {}),
    ...(p.dead ? { dead: p.dead } : {}),
  }));
  // Older servers send no mask: only the tiles with something on them are soil.
  if (mask === undefined) return out;
  const listed = new Set(list.map((p) => p.tile));
  for (let tile = 0; tile < GRID_TILES; tile++) if (!listed.has(tile) && maskHas(mask, tile)) out.push({ tile, crop: null, growth: 0, tilled: true });
  return out;
}
/** Every friend's field as the farm draws it (friends with no life yet: an empty small field). */
export function farmSceneState(life: LifeView | null | undefined, me: number): FarmSceneState {
  const byActor = new Map<number, string>();
  for (const [uid, a] of Object.entries(life?.actors ?? {})) byActor.set(a, uid);
  const fields = FARM_FIELDS.map((f): FarmFieldDraw => {
    const uid = byActor.get(f.actor);
    const pub = uid ? life?.farmsPublic?.[uid] : undefined;
    const base = { actor: f.actor, fx: pub?.fx ?? [], yard: pub?.yard ?? [], trellis: pub?.tr ?? [], mach: pub?.mach ?? [], giants: pub?.giants ?? [] };
    if (f.actor === me && life) {
      return {
        ...base,
        size: life.me.plots ?? SMALLEST,
        // My own view has fixtures and giants too (fresher than the public lists).
        fx: (life.farmx?.fixtures ?? []).map((x) => [x.tile, x.kind] as [number, FixtureKind]),
        yard: (life.farmx?.yard ?? []).map((x) => [x.spot, x.kind] as [number, FixtureKind]),
        trellis: life.farmx?.trellises ?? base.trellis,
        mach: (life.farmx?.machines ?? []).map((m) => [m.slot, m.kind, !!m.out] as [number, MachineKind, boolean]),
        giants: life.farmx?.giants ?? base.giants,
        plots: life.me.farm.flatMap((p, tile) =>
          p.crop || p.dead || p.t
            ? [
                {
                  tile,
                  crop: p.crop,
                  growth: (p.crop ? (p.growth ?? 0) : 0) as FarmPlotDraw['growth'],
                  tilled: true,
                  ...(p.crop && (p.wateredAt !== null || p.rained) ? { wet: true } : {}),
                  ...(p.dead ? { dead: p.dead } : {}),
                },
              ]
            : [],
        ),
      };
    }
    return {
      ...base,
      size: (uid && life?.fieldSizes?.[uid]) || SMALLEST,
      plots: friendPlots(uid ? (life?.housesPlotsPublic?.[uid] ?? []) : [], uid ? life?.fieldTilled?.[uid] : undefined),
    };
  });
  return { fields, houses: { ...life?.houses } };
}

/** Something E reaches on the farm. */
export type FarmTouch =
  /** My stage-1 field (24 tiles): the whole field at once. */
  | { kind: 'field' }
  /** F2: the tile of my bigger field I face (E works it, and keeps working while held). */
  | { kind: 'tile'; tile: number }
  | { kind: 'friendField'; actor: number }
  | { kind: 'home'; actor: number }
  | { kind: 'bin' }
  | { kind: 'mailbox' }
  | { kind: 'board' }
  | { kind: 'later'; id: FarmLater['id'] };
export type FarmReach = { d: number; touch: FarmTouch; label: string; action: ActionKind; disabled?: boolean };

/** Grid direction from a walking direction (the larger axis wins; none: facing the camera, south). */
export function faceStep(face: WalkPoint | null | undefined): { dr: number; dc: number } {
  if (!face || (!face.x && !face.z)) return { dr: 1, dc: 0 };
  return Math.abs(face.x) > Math.abs(face.z) ? { dr: 0, dc: Math.sign(face.x) } : { dr: Math.sign(face.z), dc: 0 };
}
/**
 * F2: the tile of field `f` (size `size`) I face standing at `p`: the open
 * tile one step ahead of the one under me; else the one under me; else (at
 * the field's edge) the nearest open tile. null when none is in reach.
 */
export function facedTile(f: FarmField, size: number, p: WalkPoint, face?: WalkPoint | null): number | null {
  const step = faceStep(face),
    b = fieldBlock(size);
  const under = fieldTileAt(f, p);
  if (under !== null && tileOpen(size, under)) {
    const { r, c } = tileRC(under),
      ahead = tileAt(r + step.dr, c + step.dc);
    return ahead !== null && tileOpen(size, ahead) ? ahead : under;
  }
  if (fieldDistance(f, size, p) > FIELD_REACH) return null;
  const c = Math.max(0, Math.min(b.cols - 1, Math.floor(p.x - f.x0))),
    r = Math.max(0, Math.min(b.rows - 1, Math.floor(p.z - f.z0)));
  return tileAt(r, c);
}
const TILE_ACT: Record<'harvest' | 'till' | 'plant' | 'fertilize' | 'water', ActionKind> = {
  harvest: 'harvest',
  till: 'tend',
  plant: 'plant',
  fertilize: 'tend',
  water: 'water',
};
const tileName = (tile: number) => `${tileRC(tile).r + 1}줄 ${tileRC(tile).c + 1}칸`;

/**
 * What E can do at `p` on the farm (nearest first is the caller's job): my
 * field (a stage-1 field all at once like the hub's yard used to; a bigger
 * one on the tile I face, F2), a friend's field (water once a day), house
 * doors (mine: go in; a friend's: visit), the shipping bin, the mailbox, the
 * farm board, and the marked-out spots. `face`: which way I walk; `tool`:
 * the hotbar item in hand.
 */
export function farmReach(
  p: WalkPoint,
  life: LifeView | null | undefined,
  me: number,
  now: number,
  face?: WalkPoint | null,
  tool = '',
): FarmReach[] {
  const out: FarmReach[] = [];
  const sizeOf = (actor: number) => {
    if (actor === me) return life?.me.plots ?? SMALLEST;
    const uid = Object.entries(life?.actors ?? {}).find(([, a]) => a === actor)?.[0];
    return (uid && life?.fieldSizes?.[uid]) || SMALLEST;
  };
  for (const f of FARM_FIELDS) {
    const d = fieldDistance(f, sizeOf(f.actor), p);
    if (d > FIELD_REACH) continue;
    if (f.actor === me) {
      const farm = life?.me.farm ?? [];
      const size = sizeOf(me);
      if (size > SMALLEST && life) {
        const tile = facedTile(f, size, p, face);
        if (tile === null) continue;
        const act = farmTileAction(farm[tile], life.me, tool, now, life.calendar?.season ?? 'spring', plantsAnySeason(life));
        out.push({
          d,
          touch: { kind: 'tile', tile },
          action: act.kind ? TILE_ACT[act.kind] : 'tend',
          label: `${tileName(tile)} · ${act.label}`,
          ...(act.kind ? {} : { disabled: true }),
        });
        continue;
      }
      const ripe = farm.filter((x) => x.crop && (x.readyAt ?? Infinity) <= now).length;
      out.push({ d, touch: { kind: 'field' }, action: farmAction(farm, now), label: ripe ? `거두기 (${ripe})` : '내 밭 가꾸기' });
      continue;
    }
    const uid = Object.entries(life?.actors ?? {}).find(([, a]) => a === f.actor)?.[0];
    if (!uid || !life) continue;
    const done = !!life.me.waterFriend?.includes(f.actor),
      needs = (life.housesPlotsPublic?.[uid] ?? []).filter((x) => x.needsWater).length;
    const name = ACTORS[f.actor] ?? '친구';
    out.push(
      done
        ? { d, touch: { kind: 'friendField', actor: f.actor }, action: 'waterFriend', label: '오늘 물 줬어요', disabled: true }
        : needs
          ? { d, touch: { kind: 'friendField', actor: f.actor }, action: 'waterFriend', label: `${name} 밭에 물 주기 (오늘 1번)` }
          : { d, touch: { kind: 'friendField', actor: f.actor }, action: 'look', label: `${name}의 밭 · 물 줄 칸이 없어요`, disabled: true },
    );
  }
  for (const h of FARM_HOUSES) {
    const d = Math.hypot(p.x - h.door.x, p.z - h.door.z);
    if (d > HOUSE_DOOR_REACH) continue;
    out.push({
      d: d - 0.3,
      touch: { kind: 'home', actor: h.actor },
      action: 'enter',
      label: h.actor === me ? '내 집 들어가기' : `${ACTORS[h.actor] ?? '친구'}네 집 놀러 가기`,
    });
  }
  const spot = (at: { x: number; z: number }, reach: number, touch: FarmTouch, label: string, action: ActionKind) => {
    const d = Math.hypot(p.x - at.x, p.z - at.z);
    if (d <= reach) out.push({ d, touch, label, action });
  };
  spot(FARM_BIN.front, FARM_BIN.reach, { kind: 'bin' }, '출하함 열기', 'board');
  spot(FARM_MAILBOX.front, FARM_MAILBOX.reach, { kind: 'mailbox' }, '우체통 열기', 'mail');
  spot(FARM_BOARD.front, FARM_BOARD.reach, { kind: 'board' }, '농장 게시판 보기', 'board');
  for (const l of FARM_LATER) {
    const d = Math.hypot(Math.max(0, Math.abs(p.x - l.x) - l.w / 2), Math.max(0, Math.abs(p.z - l.z) - l.d / 2));
    if (d <= LATER_REACH)
      out.push({ d: d + 0.4, touch: { kind: 'later', id: l.id }, action: 'look', label: `${l.name} · ${l.stage}`, disabled: true });
  }
  return out.sort((a, b) => a.d - b.d);
}
