/** Shared allowlist: clients send an ID, never image URLs or arbitrary markup. */
export const REACTIONS = [
  { id: 'laugh', label: 'ㅋㅋㅋ', description: '너무 웃겨!' },
  { id: 'wow', label: '헉!', description: '이게 된다고?' },
  { id: 'cry', label: '엉엉', description: '눈물이 난다…' },
  { id: 'love', label: '하트', description: '마음을 받아 줘' },
  { id: 'cheer', label: '나이스!', description: '잘했어, 최고야!' },
  { id: 'think', label: '음…', description: '잠깐 생각 중' },
  { id: 'sorry', label: '미안!', description: '다음엔 잘할게' },
  { id: 'hello', label: '안녕!', description: '반가워, 친구야' },
] as const;
export type ReactionId = (typeof REACTIONS)[number]['id'];
export type ReactionScope =
  | 'lounge'
  | 'casino'
  | 'chess'
  | 'gostop'
  | 'poker'
  | 'blackjack'
  | 'seotda';
export type Reaction = {
  id: ReactionId;
  at: number;
  scope: ReactionScope;
  matchId?: string;
  /** Browser-local expiry; never accepted from an action. */
  expiresAt?: number;
};
export const REACTION_TTL = 6000;
export const REACTION_COOLDOWN = 1800;
export function reactionId(value: unknown): value is ReactionId {
  return REACTIONS.some((r) => r.id === value);
}
export function readReaction(value: unknown): Reaction | undefined {
  if (!value || typeof value !== 'object') return;
  const r = value as Partial<Reaction>;
  if (
    !reactionId(r.id) ||
    !Number.isSafeInteger(r.at) ||
    Number(r.at) <= 0 ||
    ![
      'lounge',
      'casino',
      'chess',
      'gostop',
      'poker',
      'blackjack',
      'seotda',
    ].includes(r.scope ?? '')
  )
    return;
  const game = r.scope !== 'lounge' && r.scope !== 'casino';
  if (
    game &&
    (typeof r.matchId !== 'string' || !r.matchId || r.matchId.length > 100)
  )
    return;
  return {
    id: r.id,
    at: r.at!,
    scope: r.scope!,
    ...(game ? { matchId: r.matchId } : {}),
  };
}
/** Repeated room polls must not restart a sticker, including on skewed clocks. */
export function receiveReaction(
  value: unknown,
  previous: Reaction | undefined,
  serverNow: number,
  localNow: number,
): Reaction | undefined {
  const r = readReaction(value);
  if (!r || !Number.isFinite(serverNow)) return;
  const age = serverNow - r.at;
  const expiresAt = localNow + (age < 0 ? 0 : Math.max(0, REACTION_TTL - age));
  const same =
    previous?.at === r.at &&
    previous.id === r.id &&
    previous.scope === r.scope &&
    previous.matchId === r.matchId;
  return {
    ...r,
    expiresAt: same
      ? Math.min(previous.expiresAt ?? expiresAt, expiresAt)
      : expiresAt,
  };
}
export function reactionVisible(
  r: Reaction | undefined,
  scope: ReactionScope,
  matchId: string | undefined,
  now: number,
) {
  return (
    !!r &&
    r.scope === scope &&
    r.matchId === matchId &&
    now < (r.expiresAt ?? r.at + REACTION_TTL)
  );
}
