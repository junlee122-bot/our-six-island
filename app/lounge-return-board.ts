// 돌아온 오늘: a read-only index into the existing farm, story and day-end
// actions. Completion belongs to those systems; this keeps no task/reward state.
import type { LifeView } from './lounge-life.ts';
import { needHave } from './lounge-life-ui.ts';
import { stockName } from './lounge-farm.ts';
import { FACILITY_BY_ID } from './lounge-farm-sites-data.ts';
import { NPCS, type NpcId } from './lounge-npc-data.ts';
import { nextChapter, npcTalkBook } from './lounge-npc-talk.ts';
import { npcSocialPresent } from './lounge-npc-social.ts';
import { isGameNight } from './lounge-myday.ts';
import { kstDay } from './lounge-economy.ts';
import { isActor } from './lounge-roster.ts';

export type ReturnBoardOpen =
  | { kind: 'farm'; page: 'ledger' | 'works' }
  | { kind: 'site'; site: string }
  | { kind: 'commonField' }
  /** Opens the notebook, never a remote story action. */
  | { kind: 'npc'; npc: NpcId }
  | { kind: 'dayEnd' };

/** Semantic destinations: the shell uses its existing walking/guide flow. */
export type ReturnBoardDestination =
  | { kind: 'field'; actor: number }
  | { kind: 'site'; site: string }
  | { kind: 'commonField' }
  | { kind: 'npc'; npc: NpcId }
  | { kind: 'bed'; actor: number };

export type ReturnBoardItem = {
  id: string;
  kind: 'harvest' | 'processing' | 'story' | 'makeup';
  title: string;
  detail: string;
  /** Ready plots, finished machines, chapters or remaining makeup chances. */
  count: number;
  open: ReturnBoardOpen;
  destination: ReturnBoardDestination;
};

/** Only load books for residents this player has already met. No eager book import. */
export function returnBoardStoryNpcs(
  life: LifeView | null | undefined,
): NpcId[] {
  if (!life) return [];
  const flags = life.flags ?? [];
  const present = npcSocialPresent({
    hill: flags.includes('district-hillside'),
    ranch: flags.includes('district-ranch'),
    foothill: flags.includes('district-foothill'),
  });
  return (life.me.npcRelations ?? [])
    .filter(
      (r) =>
        present(r.npc) &&
        (r.points > 0 || (r.tc ?? 0) > 0 || (r.ch ?? 0) > 0 || !!r.love),
    )
    .map((r) => r.npc);
}

/**
 * `now` is server time (use view.clockOffset on the client). Harvests use
 * the server's projected ready flags, not a local growth estimate: dry,
 * withered and locked plots must not become pretend harvests while offline.
 * Machines have fixed server deadlines and can become ready between polls.
 */
export function returnBoardItems(
  life: LifeView | null | undefined,
  actor: number,
  now: number,
): ReturnBoardItem[] {
  if (!life || !isActor(actor) || !Number.isFinite(now) || now <= 0) return [];
  const items: ReturnBoardItem[] = [];
  const own = life.me.farm.filter(
    (p) =>
      p.crop &&
      p.ready &&
      !p.locked &&
      !p.dead &&
      (p.witherAt == null || p.witherAt > now),
  ).length;
  if (own)
    items.push({
      id: 'harvest-field',
      kind: 'harvest',
      count: own,
      title: `내 밭에 익은 작물 ${own}칸`,
      detail: '우리 농장 내 밭에서 거둘 수 있어요.',
      open: { kind: 'farm', page: 'ledger' },
      destination: { kind: 'field', actor },
    });
  const common =
    life.farmSites?.field.p.filter((p) => p.c && p.r === 1 && !p.d).length ?? 0;
  if (common)
    items.push({
      id: 'harvest-common',
      kind: 'harvest',
      count: common,
      title: `공동 밭에 익은 작물 ${common}칸`,
      detail: '함께 거두면 공동 창고에 들어가요.',
      open: { kind: 'commonField' },
      destination: { kind: 'commonField' },
    });
  for (const site of life.farmSites?.sites ?? []) {
    if (site.t < 1 || !['greenhouse', 'greenhouseMini'].includes(site.k))
      continue;
    if (site.k === 'greenhouseMini' && site.o !== actor) continue;
    if (site.o !== undefined && site.o !== actor) continue;
    const count =
      site.p?.filter(
        (p) =>
          p.c &&
          p.r === 1 &&
          !p.d &&
          (site.k !== 'greenhouse' || p.o === undefined || p.o === actor),
      ).length ?? 0;
    if (!count) continue;
    const name = FACILITY_BY_ID[site.k].name;
    items.push({
      id: `harvest-site-${site.id}`,
      kind: 'harvest',
      count,
      title: `${name}에 익은 작물 ${count}칸`,
      detail:
        site.k === 'greenhouse'
          ? '내 작물과 공동 작물만 안내해요. 공동 작물은 공동 창고로 가요.'
          : '내 온실에서 거둘 수 있어요.',
      open: { kind: 'site', site: site.id },
      destination: { kind: 'site', site: site.id },
    });
  }
  const yard = life.farmSites?.sites.find(
    (site) => site.k === 'machineYard' && site.t >= 1,
  );
  for (const machine of life.farmx?.machines ?? []) {
    if (
      !machine.out ||
      !Number.isFinite(machine.doneAt) ||
      (machine.doneAt ?? 0) <= 0 ||
      machine.doneAt! > now ||
      (machine.n ?? 1) <= 0
    )
      continue;
    items.push({
      id: `processing-${machine.slot}`,
      kind: 'processing',
      count: 1,
      title: `${stockName(machine.out)} ${machine.n ?? 1}개 가공 완료`,
      detail: `${machine.slot + 1}번 가공기에서 받아 저장고에 넣을 수 있어요.`,
      open: { kind: 'farm', page: 'works' },
      destination: yard
        ? { kind: 'site', site: yard.id }
        : { kind: 'field', actor },
    });
  }
  const candidates = new Set(returnBoardStoryNpcs(life));
  for (const row of life.me.npcRelations ?? []) {
    if (!candidates.has(row.npc)) continue;
    const book = npcTalkBook(row.npc);
    if (!book) continue;
    const next = nextChapter(book, row, (item) => needHave(life.me, { item }));
    if (!next.open || !next.chapter) continue;
    items.push({
      id: `story-${row.npc}`,
      kind: 'story',
      count: 1,
      title: `${NPCS[row.npc].name}의 이어갈 이야기`,
      detail: `${next.n}장 · ${next.chapter.title}. 수첩을 확인하고 주민 곁에서 말을 걸어 보세요.`,
      open: { kind: 'npc', npc: row.npc },
      destination: { kind: 'npc', npc: row.npc },
    });
  }
  // The server already excludes days before a new player's first visit.
  // Do not turn an old snapshot into new makeup chances at midnight/week rollover.
  const md = life.myday;
  const makeup =
    md && kstDay(now) === kstDay(life.serverNow) ? Math.min(md.mk, md.left) : 0;
  if (makeup > 0)
    items.push({
      id: 'makeup',
      kind: 'makeup',
      count: makeup,
      title: `밀린 하루 마감 기회 ${makeup}번`,
      detail: isGameNight(now)
        ? '밤이에요. 내 방 침대에서 하루를 마감할 수 있어요.'
        : '밤 여덟 시부터 새벽 여섯 시 전까지 내 방 침대에서 쓸 수 있어요.',
      open: { kind: 'dayEnd' },
      destination: { kind: 'bed', actor },
    });
  return items;
}
