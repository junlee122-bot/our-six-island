// 우리 농장 F5 engine: the 품종 개량소 (seedLab, design-our-farm.md §11-3).
// Five crops of one kind go in and one improved seed of it comes out after
// SEEDLAB_MS, at most SEEDLAB_PER_DAY batches a KST day, two batches at once.
// Improved seeds wait with my farm (lounge-farm.ts improvedSeeds) and are
// planted with `plant { improved: true }`: more gold-star points, and a bed of
// six planted together turns giant twice as often (lounge-farm-data numbers).
//
// State (`site.state.lab`): the batches in the lab (crop, when done) and how
// many were started on KST day `d`. Cycle-safe like lounge-farm-sites.ts.
import { SEEDLAB_INPUT, SEEDLAB_MS, SEEDLAB_PER_DAY } from './lounge-farm-data.ts';
import { CROPS, LifeError, type Crop, type LifeState } from './lounge-life.ts';
import { itemCount, takeCrop } from './lounge-life-plus.ts';
import { gainXp, growthMods } from './lounge-growth.ts';
import { addImprovedSeeds } from './lounge-farm.ts';

const safe = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const isCrop = (c: unknown): c is Crop => typeof c === 'string' && (CROPS as string[]).includes(c);
function fail(message: string): never {
  throw new LifeError(message);
}

export type LabBatch = { c: Crop; done: number };
export type LabState = { q?: LabBatch[]; d?: number; k?: number };
export type LabAction = { kind: 'labLoad'; site: string; crop: Crop } | { kind: 'labCollect'; site: string };
export const LAB_ACTIONS = ['labLoad', 'labCollect'] as const;

export const LAB_REJECT = {
  crop: '개량할 작물을 확인해 주세요.',
  few: `같은 작물 ${SEEDLAB_INPUT}개가 있어야 해요.`,
  busy: '개량소가 꽉 찼어요. 다 된 씨앗을 먼저 거둬 주세요.',
  today: `품종 개량은 하루 ${SEEDLAB_PER_DAY}번까지예요. 내일 또 해요.`,
  nothing: '아직 다 된 개량 씨앗이 없어요.',
} as const;

/** Reads a stored lab (at most `slots` batches). */
export function readLab(v: unknown, slots: number): LabState | undefined {
  const x = obj(v),
    out: LabState = {};
  const q = (Array.isArray(x.q) ? x.q : [])
    .slice(0, slots)
    .map((b) => obj(b))
    .filter((b) => isCrop(b.c) && safe(b.done) && b.done > 0)
    .map((b): LabBatch => ({ c: b.c as Crop, done: b.done as number }));
  if (q.length) out.q = q;
  if (safe(x.d) && x.d > 0 && safe(x.k) && x.k > 0) {
    out.d = x.d;
    out.k = Math.min(SEEDLAB_PER_DAY, x.k);
  }
  return Object.keys(out).length ? out : undefined;
}

/** Batches started on KST day `day` so far. */
export const labToday = (lab: LabState | undefined, day: number) => (lab?.d === day ? (lab.k ?? 0) : 0);

export function labAction(life: LifeState, uid: string, slots: number, state: { lab?: LabState }, a: LabAction, now: number, day: number) {
  const lab = (state.lab ??= {});
  if (a.kind === 'labLoad') {
    if (!isCrop(a.crop)) fail(LAB_REJECT.crop);
    if ((lab.q?.length ?? 0) >= slots) fail(LAB_REJECT.busy);
    if (labToday(lab, day) >= SEEDLAB_PER_DAY) fail(LAB_REJECT.today);
    if (itemCount(life, uid, a.crop) < SEEDLAB_INPUT) fail(LAB_REJECT.few);
    takeCrop(life, uid, a.crop, SEEDLAB_INPUT);
    // 재능 손이 빠른 shortens the lab like the machines.
    const ms = Math.round(SEEDLAB_MS * (1 - Math.min(0.9, growthMods(life, uid).machineFast)));
    lab.q = [...(lab.q ?? []), { c: a.crop, done: now + ms }];
    lab.k = labToday(lab, day) + 1;
    lab.d = day;
    gainXp(life, uid, 'farm', 6, now);
  } else {
    const ready = (lab.q ?? []).filter((b) => b.done <= now);
    if (!ready.length) fail(LAB_REJECT.nothing);
    for (const b of ready) addImprovedSeeds(life, uid, b.c, 1);
    lab.q = (lab.q ?? []).filter((b) => b.done > now);
    if (!lab.q.length) delete lab.q;
    gainXp(life, uid, 'farm', 4 * ready.length, now);
  }
  if (!Object.keys(lab).length) delete state.lab;
}

export type LabView = { q: LabBatch[]; today: number; perDay: number; input: number };
export const labView = (lab: LabState | undefined, day: number): LabView => ({
  q: [...(lab?.q ?? [])],
  today: labToday(lab, day),
  perDay: SEEDLAB_PER_DAY,
  input: SEEDLAB_INPUT,
});
