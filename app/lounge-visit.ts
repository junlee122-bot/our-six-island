// Client helper for read-only friend room visits (hohyeon-api `{op:'visit'}`).
import { cloudCall, AccountError } from './lounge-auth';
import { visitOwnerValid, VISIT_BAD_OWNER, type FriendVisit } from './lounge-accounts';
export type { FriendVisit } from './lounge-accounts';
/**
 * Loads a friend's saved bedroom, look, guestbook and status. `actor` is the
 * roster index 0..6 (your own index works too). Throws AccountError with a
 * Korean message on failure.
 */
export async function visitFriend(actor: number): Promise<FriendVisit> {
  if (!visitOwnerValid(actor)) throw new AccountError(VISIT_BAD_OWNER, 400);
  const result = await cloudCall<{ visit: FriendVisit }>('hohyeon-api', {
    op: 'visit',
    owner: actor,
  });
  if (!result?.visit)
    throw new AccountError('친구 방을 불러오지 못했어요. 다시 시도해 주세요.', 503);
  return result.visit;
}
