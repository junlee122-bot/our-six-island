// 친구 공동 주문서: one choice per KST week, partial deliveries and one
// non-cash keepsake per actual contributor. All mutations run on a cloned
// LifeState inside the existing world CAS/receipt transaction.
import {
  CROPS,
  LifeError,
  type LifeState,
  type Quality,
} from './lounge-life.ts';
import {
  itemCount,
  takeItem,
  addMemory,
  addNews,
  grantFurniture,
} from './lounge-life-plus.ts';
import { isGoodId } from './lounge-farm-data.ts';
import { stockCount, stockKey } from './lounge-farm.ts';
import { storeCountAtLeast, takeStore } from './lounge-farm-sites.ts';
import { ACTOR_COUNT, isActor, isActorKey } from './lounge-roster.ts';
import { kstDay } from './lounge-economy.ts';
import { dayStart } from './lounge-calendar.ts';
import { josa } from './lounge-text.ts';
import {
  communityOrderCandidates,
  communityOrderById,
  communityOrderDefinition,
  type CommunityOrderDef,
} from './lounge-community-orders-data.ts';

export const COMMUNITY_ORDER_HISTORY_WEEKS = 3;
export const COMMUNITY_ORDER_LOG_MAX = 24;
export const COMMUNITY_ORDER_MAX_DELIVERY = 9_999;
const QUALITIES: Quality[] = [0, 1, 2, 3];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const safe = (v: unknown): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const at = (v: unknown): v is number => safe(v) && v > 0;
const fail = (text: string): never => {
  throw new LifeError(text);
};
export const communityOrderWeek = (now: number) =>
  Math.floor((kstDay(now) + 3) / 7);
export const communityOrderStartsAt = (week: number) => dayStart(week * 7 - 3);

export type CommunityOrderAction =
  | { kind: 'communityOrder'; op: 'choose'; week: number; order: string }
  | {
      kind: 'communityOrder';
      op: 'assign';
      week: number;
      line: number;
      assigned: boolean;
    }
  | {
      kind: 'communityOrder';
      op: 'deliver';
      week: number;
      line: number;
      n: number;
      source: 'personal' | 'shared';
      confirmShared?: true;
    }
  | { kind: 'communityOrder'; op: 'claim'; week: number };
type Contribution = { n: number[]; s: number[] };
export type CommunityOrderLog = {
  actor: number;
  line: number;
  n: number;
  source: 'personal' | 'shared';
  at: number;
};
export type CommunityOrderRecord = {
  week: number;
  order: string;
  chosenBy: number;
  chosenAt: number;
  assigned: (number | null)[];
  /** Actor keys are stable roster identities; n includes the shared subset s. */
  by: Record<string, Contribution>;
  claimed: number[];
  completedAt?: number;
  log: CommunityOrderLog[];
};
export type CommunityOrdersExt = {
  communityOrders?: { records: CommunityOrderRecord[] };
};
export type CommunityOrderLineView = {
  line: number;
  item: string;
  n: number;
  q: Quality;
  delivered: number;
  remaining: number;
  assigned?: number;
  have: { personal: number; shared: number };
};
export type CommunityOrderView = {
  week: number;
  order: CommunityOrderDef;
  chosenBy: number;
  chosenAt: number;
  lines: CommunityOrderLineView[];
  contributions: {
    actor: number;
    total: number;
    items: number[];
    shared: number[];
  }[];
  log: CommunityOrderLog[];
  completedAt?: number;
  expired: boolean;
  participated: boolean;
  claimed: boolean;
  canClaim: boolean;
};
export type CommunityOrdersView = {
  week: number;
  startsAt: number;
  endsAt: number;
  historyWeeks: number;
  candidates: (CommunityOrderDef & { lockedReason?: string })[];
  active: CommunityOrderView | null;
  previous: CommunityOrderView[];
};

const totals = (record: CommunityOrderRecord, n: number) =>
  Array.from({ length: n }, (_, i) =>
    Object.values(record.by).reduce((sum, u) => sum + u.n[i], 0),
  );
const complete = (record: CommunityOrderRecord, def: CommunityOrderDef) =>
  totals(record, def.needs.length).every((n, i) => n === def.needs[i].n);

/** Bounded restoration. Totals are derived from contributions, never a second mutable counter. */
export function readCommunityOrders(value: unknown): CommunityOrdersExt {
  const raw = obj(value).records;
  if (!Array.isArray(raw)) return {};
  const records: CommunityOrderRecord[] = [],
    seen = new Set<number>();
  for (const row of raw.slice(0, 16)) {
    const x = obj(row);
    if (
      !safe(x.week) ||
      seen.has(x.week) ||
      typeof x.order !== 'string' ||
      !isActor(x.chosenBy) ||
      !at(x.chosenAt) ||
      communityOrderWeek(x.chosenAt) !== x.week
    )
      continue;
    const def = communityOrderDefinition(x.order);
    if (!def) continue;
    const len = def.needs.length,
      by: Record<string, Contribution> = {};
    let invalid = false;
    for (const [key, value] of Object.entries(obj(x.by)).slice(
      0,
      ACTOR_COUNT * 2,
    )) {
      if (!isActorKey(key)) continue;
      const u = obj(value);
      if (
        !Array.isArray(u.n) ||
        !Array.isArray(u.s) ||
        u.n.length !== len ||
        u.s.length !== len ||
        u.n.some((v, i) => !safe(v) || v > def.needs[i].n) ||
        u.s.some((v, i) => !safe(v) || v > (u.n as number[])[i])
      ) {
        invalid = true;
        break;
      }
      if (u.n.some((n) => n > 0))
        by[key] = { n: [...u.n] as number[], s: [...u.s] as number[] };
    }
    if (invalid) continue;
    const record: CommunityOrderRecord = {
      week: x.week,
      order: x.order,
      chosenBy: x.chosenBy,
      chosenAt: x.chosenAt,
      assigned: Array.from({ length: len }, (_, i) =>
        Array.isArray(x.assigned) && isActor(x.assigned[i])
          ? x.assigned[i]
          : null,
      ),
      by,
      claimed: [],
      log: [],
    };
    if (totals(record, len).some((n, i) => n > def.needs[i].n)) continue;
    if (
      complete(record, def) &&
      at(x.completedAt) &&
      x.completedAt >= x.chosenAt &&
      communityOrderWeek(x.completedAt) === x.week
    )
      record.completedAt = x.completedAt;
    if (record.completedAt && Array.isArray(x.claimed))
      record.claimed = [
        ...new Set(
          x.claimed.filter((actor) => isActor(actor) && !!by[String(actor)]),
        ),
      ];
    const chosenAt = record.chosenAt;
    if (Array.isArray(x.log))
      record.log = x.log.slice(-COMMUNITY_ORDER_LOG_MAX).flatMap((v) => {
        const l = obj(v);
        return isActor(l.actor) &&
          !!by[String(l.actor)] &&
          safe(l.line) &&
          l.line < len &&
          safe(l.n) &&
          l.n > 0 &&
          l.n <= def.needs[l.line].n &&
          (l.source === 'personal' || l.source === 'shared') &&
          at(l.at) &&
          l.at >= chosenAt &&
          communityOrderWeek(l.at) === x.week
          ? [
              {
                actor: l.actor,
                line: l.line,
                n: l.n,
                source: l.source,
                at: l.at,
              } as CommunityOrderLog,
            ]
          : [];
      });
    seen.add(x.week);
    records.push(record);
  }
  records.sort((a, b) => b.week - a.week);
  return records.length
    ? {
        communityOrders: {
          records: records.slice(0, COMMUNITY_ORDER_HISTORY_WEEKS + 1),
        },
      }
    : {};
}

/** Counts only this member's real storage, never another player's bag. */
export function communityOrderHave(
  life: LifeState,
  uid: string,
  item: string,
  q: Quality = 0,
) {
  const personal = isGoodId(item)
    ? QUALITIES.filter((t) => t >= q).reduce<number>(
        (sum, t) => sum + stockCount(life, uid, item, t),
        0,
      )
    : itemCount(life, uid, item, q);
  // The existing shared store accepts crops only, not fish or artisan goods.
  return {
    personal,
    shared: (CROPS as readonly string[]).includes(item)
      ? storeCountAtLeast(life, item, q)
      : 0,
  };
}
function takePersonal(
  life: LifeState,
  uid: string,
  item: string,
  n: number,
  q: Quality,
) {
  if (!isGoodId(item)) return takeItem(life, uid, item, n, q);
  let left = n;
  const goods = life.farmx?.[uid]?.goods;
  if (!goods) fail('내 저장고의 가공품이 부족해요.');
  for (const quality of QUALITIES) {
    if (quality < q || !left) continue;
    const key = stockKey(item, quality),
      took = Math.min(left, goods![key] ?? 0);
    if (!took) continue;
    goods![key] -= took;
    if (!goods![key]) delete goods![key];
    left -= took;
  }
  if (left) fail('내 저장고의 가공품이 부족해요.');
  if (!Object.keys(goods!).length) delete life.farmx![uid].goods;
}
function lockedReason(
  life: LifeState,
  def: CommunityOrderDef,
): string | undefined {
  return def.gate?.machine &&
    !Object.values(life.farmx ?? {}).some((yard) =>
      Object.values(yard.mach ?? {}).some((m) => m.k === def.gate!.machine),
    )
    ? '마을 친구 중 한 명이 옹기를 놓으면 고를 수 있어요.'
    : undefined;
}

/** Runs only on a cloned state. No ledger or automatic production is involved. */
export function communityOrderAction(
  life: LifeState,
  member: { id: string; actor: number },
  action: CommunityOrderAction,
  now: number,
): void {
  const invalid = '공동 주문 요청을 확인한 뒤 다시 골라 주세요.';
  if (
    !UUID.test(member.id) ||
    !isActor(member.actor) ||
    life.actors[member.id] !== member.actor ||
    !at(now) ||
    !safe(action.week)
  )
    fail(invalid);
  const keys: Record<string, string[]> = {
    choose: ['kind', 'op', 'week', 'order'],
    assign: ['kind', 'op', 'week', 'line', 'assigned'],
    deliver: ['kind', 'op', 'week', 'line', 'n', 'source', 'confirmShared'],
    claim: ['kind', 'op', 'week'],
  };
  if (
    !Object.hasOwn(keys, action.op) ||
    Object.keys(action).some((key) => !keys[action.op].includes(key))
  )
    fail(invalid);
  const week = communityOrderWeek(now);
  if (action.op !== 'claim' && action.week !== week)
    fail('지난주 주문이에요. 이번 주 주문서를 다시 열어 주세요.');
  if (action.week > week || action.week < week - COMMUNITY_ORDER_HISTORY_WEEKS)
    fail('기념품 수령 기간이 지났어요. 최근 주문서를 확인해 주세요.');
  const records =
    readCommunityOrders(life.communityOrders).communityOrders?.records.filter(
      (r) => r.week >= week - COMMUNITY_ORDER_HISTORY_WEEKS && r.week <= week,
    ) ?? [];
  let record = records.find((r) => r.week === action.week);
  if (action.op === 'choose') {
    if (typeof action.order !== 'string') fail(invalid);
    const def = communityOrderById(week, action.order);
    if (!def) fail(invalid);
    if (record) {
      if (record.order !== action.order)
        fail(
          '친구가 이번 주 주문을 먼저 골랐어요. 선택한 주문은 바꿀 수 없어요.',
        );
    } else {
      const why = lockedReason(life, def!);
      if (why) fail(why);
      record = {
        week,
        order: def!.id,
        chosenBy: member.actor,
        chosenAt: now,
        assigned: def!.needs.map(() => null),
        by: {},
        claimed: [],
        log: [],
      };
      records.push(record);
    }
  } else {
    if (!record) fail('먼저 이번 주 공동 주문을 골라 주세요.');
    const current = record!,
      def = communityOrderDefinition(current.order)!;
    if (action.op === 'claim') {
      if (!current.completedAt || !complete(current, def))
        fail('주문을 모두 마치면 기념품을 받을 수 있어요.');
      if (!current.by[String(member.actor)]?.n.some((n) => n > 0))
        fail('직접 납품에 참여한 친구에게 드리는 기념품이에요.');
      if (current.claimed.includes(member.actor))
        fail('이 주문의 기념품은 이미 받았어요.');
      grantFurniture(life, member.id, def.reward.furniture);
      current.claimed.push(member.actor);
    } else {
      if (!safe(action.line) || action.line >= def.needs.length) fail(invalid);
      if (current.completedAt)
        fail('이미 마친 주문이에요. 기념품을 확인해 주세요.');
      const line = action.line,
        need = def.needs[line];
      if (action.op === 'assign') {
        if (typeof action.assigned !== 'boolean') fail(invalid);
        const owner = current.assigned[line];
        if (action.assigned) {
          if (owner !== null && owner !== member.actor)
            fail(
              '이 품목은 다른 친구가 맡고 있어요. 맡지 않아도 납품할 수 있어요.',
            );
          current.assigned[line] = member.actor;
        } else if (owner === member.actor) current.assigned[line] = null;
        else if (owner !== null) fail('내가 맡은 품목만 해제할 수 있어요.');
      } else {
        if (
          !safe(action.n) ||
          action.n < 1 ||
          action.n > COMMUNITY_ORDER_MAX_DELIVERY ||
          !['personal', 'shared'].includes(action.source) ||
          (action.confirmShared !== undefined && action.confirmShared !== true)
        )
          fail(invalid);
        if (action.source === 'shared' && action.confirmShared !== true)
          fail('공동 창고에서 꺼낼 수량을 먼저 확인해 주세요.');
        const remaining = need.n - totals(current, def.needs.length)[line];
        if (remaining <= 0) fail('이 품목은 필요한 만큼 모두 받았어요.');
        const n = Math.min(action.n, remaining),
          q = need.q ?? 0;
        const have = communityOrderHave(life, member.id, need.item, q);
        if (have[action.source] < n)
          fail(
            action.source === 'shared'
              ? '공동 창고의 재료가 부족해요. 수량을 다시 확인해 주세요.'
              : '내 재료가 부족해요. 요청한 납품 수량을 줄여 주세요.',
          );
        if (action.source === 'shared') takeStore(life, need.item, n, q);
        else takePersonal(life, member.id, need.item, n, q);
        const by = (current.by[String(member.actor)] ??= {
          n: def.needs.map(() => 0),
          s: def.needs.map(() => 0),
        });
        by.n[line] += n;
        if (action.source === 'shared') by.s[line] += n;
        current.log = [
          ...current.log,
          { actor: member.actor, line, n, source: action.source, at: now },
        ].slice(-COMMUNITY_ORDER_LOG_MAX);
        if (complete(current, def)) {
          current.completedAt = now;
          const helpers = Object.keys(current.by)
            .map(Number)
            .sort((a, b) => a - b);
          const text = `${def.title} 공동 주문을 함께 마쳤어요. ${josa(def.reward.label, '을/를')} 받을 수 있어요.`;
          addMemory(life, now, 'community-order', helpers, text);
          addNews(
            life,
            now,
            `community-order:${week}`,
            'community-order',
            text,
            helpers,
          );
        }
      }
    }
  }
  records.sort((a, b) => b.week - a.week);
  life.communityOrders = {
    records: records.slice(0, COMMUNITY_ORDER_HISTORY_WEEKS + 1),
  };
}

export function communityOrdersView(
  life: LifeState,
  uid: string,
  actor: number,
  now: number,
): CommunityOrdersView {
  const week = communityOrderWeek(now);
  const recordView = (record: CommunityOrderRecord): CommunityOrderView => {
    const def = communityOrderDefinition(record.order)!;
    const got = totals(record, def.needs.length),
      mine = record.by[String(actor)];
    const participated = !!mine?.n.some((n) => n > 0),
      claimed = record.claimed.includes(actor);
    return {
      week: record.week,
      order: structuredClone(def),
      chosenBy: record.chosenBy,
      chosenAt: record.chosenAt,
      lines: def.needs.map((need, line) => ({
        line,
        item: need.item,
        n: need.n,
        q: need.q ?? 0,
        delivered: got[line],
        remaining: Math.max(0, need.n - got[line]),
        ...(record.assigned[line] !== null
          ? { assigned: record.assigned[line]! }
          : {}),
        have: communityOrderHave(life, uid, need.item, need.q ?? 0),
      })),
      contributions: Object.entries(record.by)
        .map(([key, value]) => ({
          actor: Number(key),
          total: value.n.reduce((sum, n) => sum + n, 0),
          items: [...value.n],
          shared: [...value.s],
        }))
        .sort((a, b) => a.actor - b.actor),
      log: record.log.map((log) => ({ ...log })),
      ...(record.completedAt ? { completedAt: record.completedAt } : {}),
      expired: record.week < week,
      participated,
      claimed,
      canClaim:
        isActor(actor) &&
        life.actors[uid] === actor &&
        !!record.completedAt &&
        participated &&
        !claimed,
    };
  };
  const records =
    readCommunityOrders(life.communityOrders).communityOrders?.records.filter(
      (r) => r.week <= week && r.week >= week - COMMUNITY_ORDER_HISTORY_WEEKS,
    ) ?? [];
  const active = records.find((r) => r.week === week);
  return {
    week,
    startsAt: communityOrderStartsAt(week),
    endsAt: communityOrderStartsAt(week + 1),
    historyWeeks: COMMUNITY_ORDER_HISTORY_WEEKS,
    candidates: communityOrderCandidates(week).map((def) => ({
      ...structuredClone(def),
      ...(lockedReason(life, def)
        ? { lockedReason: lockedReason(life, def) }
        : {}),
    })),
    active: active ? recordView(active) : null,
    previous: records
      .filter((r) => r.week < week)
      .sort((a, b) => b.week - a.week)
      .map(recordView),
  };
}
