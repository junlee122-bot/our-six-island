// Pure game-flow helpers (no DOM, no React): the one contextual action button
// and the one-at-a-time notification banner queue.

/* ------------------------------------------------------------ actions */

/** What the single bottom-right action button does right now. */
export type ActionKind =
  | 'enter'
  | 'exit'
  | 'talk'
  | 'plant'
  | 'water'
  | 'harvest'
  | 'tend'
  | 'pick'
  | 'mail'
  | 'look'
  | 'dress'
  | 'decorate'
  | 'guide'
  // Interior tables (step 2): games start by sitting down.
  | 'sit'
  | 'join'
  | 'watch'
  | 'resume'
  | 'stand'
  // Life expansion (LIFE-B): fishing, foraging, bugs, museum, bundles, kitchen.
  | 'fish'
  | 'forage'
  | 'catch'
  | 'museum'
  | 'board'
  | 'waterFriend'
  | 'cook'
  | 'wish';

export const ACTION_LABEL: Record<ActionKind, string> = {
  enter: '들어가기',
  exit: '나가기',
  talk: '말 걸기',
  plant: '심기',
  water: '물 주기',
  harvest: '수확',
  tend: '돌보기',
  pick: '따기',
  mail: '편지 보기',
  look: '둘러보기',
  dress: '옷 갈아입기',
  decorate: '꾸미기',
  guide: '내 텃밭 가기',
  sit: '앉기',
  join: '자리 잡기',
  watch: '구경하기',
  resume: '이어하기',
  stand: '일어나기',
  fish: '낚시하기',
  forage: '줍기',
  catch: '잡기',
  museum: '박물관 둘러보기',
  board: '게시판 보기',
  waterFriend: '물 주기 (오늘 1번)',
  cook: '요리·만들기',
  wish: '소원 빌기',
};

/** One thing within reach. `distance` and `reach` share a unit (world units). */
export type ActionCandidate<T = unknown> = {
  kind: ActionKind;
  distance: number;
  reach: number;
  /** Doors (buildings, room exits) win ties. */
  door?: boolean;
  /** Always-available fallback (e.g. 꾸미기 in my room): only when nothing is near. */
  fallback?: boolean;
  target?: T;
};

/** Relative closeness closer than this counts as a tie (then doors win). */
export const ACTION_TIE = 0.08;

/**
 * The action the button shows: the closest candidate within its reach wins
 * (closeness = distance / reach, so a 2 m tree and a 1.3 m farm compare fairly);
 * within ACTION_TIE of each other a door wins. Fallbacks only apply when
 * nothing else is in reach.
 */
export function pickAction<T>(
  candidates: readonly (ActionCandidate<T> | null | undefined | false)[],
): ActionCandidate<T> | null {
  let best: ActionCandidate<T> | null = null,
    bestScore = Infinity;
  let fallback: ActionCandidate<T> | null = null;
  for (const c of candidates) {
    if (!c) continue;
    if (c.fallback) {
      fallback ??= c;
      continue;
    }
    if (!Number.isFinite(c.distance) || !(c.reach > 0)) continue;
    if (c.distance > c.reach) continue;
    const score = Math.max(0, c.distance) / c.reach;
    if (!best) {
      best = c;
      bestScore = score;
      continue;
    }
    const tie = Math.abs(score - bestScore) <= ACTION_TIE;
    if (tie ? !!c.door && !best.door : score < bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return best ?? fallback;
}

/** Farm button label from my plots: 수확 > 심기 > 물 주기 > 돌보기. */
export function farmAction(
  plots: readonly { crop: string | null; readyAt?: number | null; wateredAt?: number | null }[],
  now: number,
): 'harvest' | 'plant' | 'water' | 'tend' {
  if (plots.some((p) => p.crop && (p.readyAt ?? Infinity) <= now)) return 'harvest';
  if (plots.some((p) => !p.crop)) return 'plant';
  if (plots.some((p) => p.crop && p.wateredAt === null && (p.readyAt ?? Infinity) > now))
    return 'water';
  return 'tend';
}

/* ------------------------------------------------------------ banners */

export type BannerKind =
  | 'invite'
  | 'turn'
  | 'mail'
  | 'guest'
  | 'daily'
  | 'success'
  | 'info'
  | 'error';

export type Banner = {
  /** Unique per shown banner (a repeated message gets a new id). */
  id: number;
  kind: BannerKind;
  text: string;
  /** Same key = same subject: a newer one replaces the queued/shown one. */
  key?: string;
  /** Optional action button, e.g. [가기] or [보기]. */
  action?: string;
};

export type BannerQueue = { current: Banner | null; queue: Banner[] };

export const EMPTY_BANNERS: BannerQueue = { current: null, queue: [] };
/** More than this many waiting banners drops the oldest low-priority one. */
export const BANNER_QUEUE_LIMIT = 6;

/** Higher shows first; equal priority keeps arrival order. */
export const BANNER_PRIORITY: Record<BannerKind, number> = {
  error: 3,
  turn: 2,
  invite: 2,
  mail: 1,
  guest: 1,
  daily: 1,
  success: 0,
  info: 0,
};

/** How long a banner stays before the next one (ms). */
export function bannerDuration(kind: BannerKind) {
  if (kind === 'invite' || kind === 'turn') return 8000;
  if (kind === 'error' || kind === 'mail' || kind === 'guest' || kind === 'daily') return 6000;
  return 4000;
}

/**
 * Adds a banner: it shows at once when nothing is shown, replaces a shown or
 * queued banner with the same key, and otherwise waits its turn by priority.
 * An error never waits behind a lower-priority banner: it takes the slot and
 * the interrupted banner goes back to the front of the queue.
 */
export function pushBanner(state: BannerQueue, banner: Banner): BannerQueue {
  if (!banner.text) return state;
  const same = (b: Banner) => !!banner.key && b.key === banner.key;
  if (state.current && same(state.current))
    return { current: banner, queue: state.queue.filter((b) => !same(b)) };
  let queue = state.queue.filter((b) => !same(b));
  if (!state.current) return { current: banner, queue };
  if (
    banner.kind === 'error' &&
    BANNER_PRIORITY[state.current.kind] < BANNER_PRIORITY.error
  )
    return { current: banner, queue: insert([state.current, ...queue], null) };
  queue = insert(queue, banner);
  while (queue.length > BANNER_QUEUE_LIMIT) {
    // Drop the oldest of the lowest priority.
    let drop = 0;
    for (let i = 1; i < queue.length; i++)
      if (BANNER_PRIORITY[queue[i].kind] < BANNER_PRIORITY[queue[drop].kind]) drop = i;
    queue = queue.filter((_, i) => i !== drop);
  }
  return { current: state.current, queue };
}

function insert(queue: Banner[], banner: Banner | null): Banner[] {
  if (!banner) return queue;
  const p = BANNER_PRIORITY[banner.kind];
  const at = queue.findIndex((b) => BANNER_PRIORITY[b.kind] < p);
  return at < 0 ? [...queue, banner] : [...queue.slice(0, at), banner, ...queue.slice(at)];
}

/** The shown banner is done (timer, close or action): the next one shows. */
export function nextBanner(state: BannerQueue, id?: number): BannerQueue {
  if (id !== undefined && state.current?.id !== id) return state;
  const [current = null, ...queue] = state.queue;
  return { current, queue };
}

/** Removes banners whose subject is gone (e.g. an invite that was answered). */
export function dropBanners(state: BannerQueue, key: string): BannerQueue {
  const queue = state.queue.filter((b) => b.key !== key);
  if (state.current?.key === key) return nextBanner({ ...state, queue });
  return queue.length === state.queue.length ? state : { ...state, queue };
}
