import {
  ACCOUNT_IDS,
  friendVisitView,
  VISIT_BAD_OWNER,
  visitOwnerValid,
  AccountSaveError,
  casBackoffMs,
  lifeUnlocksOf,
  jsonbTextBytes,
  PROFILE_SAVE_MAX_BYTES,
  SAVE_TOO_LARGE,
  serverAccountSave,
} from '../../../app/lounge-accounts.ts';
import {
  cloudTransition,
  commandHash,
  CloudError,
} from '../../../app/lounge-cloud-engine.ts';
import {
  HttpError,
  key,
  log,
  member,
  profile,
  rate,
  rpc,
  serve,
  url,
} from '../_shared/server.ts';
declare const EdgeRuntime: { waitUntil: (task: Promise<unknown>) => void };
const CAS_ATTEMPTS = 12;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
serve('hohyeon-api', async (b, req, ctx) => {
  const { m } = await member(req);
  await rate('api:' + m.user_id, 300);
  if (b.op === 'profile') return { profile: profile(m) };
  if (b.op === 'visit') {
    // Read-only friend room visit: bedroom + look from the friend's profile
    // save, guestbook/status from the world. Only the 7 roster members exist.
    if (!visitOwnerValid(b.owner)) throw new HttpError(VISIT_BAD_OWNER);
    const friend = await rpc('hh_member', {
        p_username: ACCOUNT_IDS[b.owner],
      }),
      world = await rpc('hh_world_read');
    return {
      visit: friendVisitView(
        b.owner,
        friend?.activated ? friend.save : null,
        world?.state?.life,
      ),
    };
  }
  if (b.op === 'save') {
    if (
      !Number.isSafeInteger(b.revision) ||
      b.revision < 0 ||
      !b.save ||
      typeof b.save !== 'object' ||
      Array.isArray(b.save)
    )
      throw new HttpError('저장 정보를 확인해 주세요.');
    // Shop unlocks live in the world's life state; rare room props need them.
    const world = await rpc('hh_world_read'),
      unlocks = lifeUnlocksOf(world?.state?.life, m.user_id);
    let save;
    try {
      // Fail closed: an unreadable or unknown-version save is rejected (409),
      // never normalized into a blank save that would overwrite the account.
      save = serverAccountSave(b.save, m.actor, m.save, unlocks);
    } catch (e) {
      if (e instanceof AccountSaveError) {
        log('warn', 'save_rejected', {
          ...ctx,
          uid: m.user_id,
          version: (b.save as { version?: unknown }).version,
        });
        throw new HttpError(e.message, e.status);
      }
      throw e;
    }
    if (jsonbTextBytes(save) > PROFILE_SAVE_MAX_BYTES)
      throw new HttpError(SAVE_TOO_LARGE, 413);
    // hh_profile_save also appends to hohyeon.profile_history (last 20).
    return await rpc('hh_profile_save', {
      p_uid: m.user_id,
      p_expected: b.revision,
      p_save: save,
    });
  }
  if (
    b.op !== 'world' ||
    !b.command ||
    typeof b.command !== 'object' ||
    Array.isArray(b.command)
  )
    throw new HttpError('지원하지 않는 요청입니다.');
  const code = (b.command as { code?: unknown }).code;
  if (
    code !== undefined &&
    code !== null &&
    (typeof code !== 'string' || code.length > 512)
  )
    throw new HttpError('방 코드를 확인해 주세요.');
  const hash = await commandHash(b.command);
  for (let attempt = 0; attempt < CAS_ATTEMPTS; attempt++) {
    if (attempt) await sleep(casBackoffMs(attempt - 1));
    const row = await rpc('hh_world_read');
    let transition;
    try {
      transition = cloudTransition(
        row.state,
        { id: m.user_id, actor: m.actor, username: m.username },
        b.command,
        hash,
        row.now,
      );
    } catch (e) {
      if (e instanceof CloudError) throw new HttpError(e.message, e.status);
      // D-8: an engine bug (TypeError…) is never stored as a receipt nor
      // committed; log what was attempted (no tokens, no payload text) and let
      // serve() answer a generic 500 with the stack in its own log line.
      const action = b.command?.action;
      log('error', 'engine_unexpected', {
        ...ctx,
        actor: m.actor,
        op: typeof b.command?.op === 'string' ? b.command.op.slice(0, 16) : null,
        kind:
          action && typeof action.kind === 'string'
            ? action.kind.slice(0, 32)
            : null,
        revision: row.revision,
        name: e instanceof Error ? e.name : typeof e,
        message: e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200),
      });
      throw e;
    }
    const revision = transition.changed
      ? await rpc('hh_world_commit', {
          p_expected: row.revision,
          p_state: transition.state,
        })
      : row.revision;
    if (revision === null) continue;
    if (attempt >= 3)
      log('warn', 'cas_contention', { ...ctx, attempts: attempt + 1 });
    if (transition.notifications.length) {
      // A hint only. Clients fetch their own authenticated, redacted snapshot.
      // Private channel: only authenticated members of the room may receive it
      // (RLS on realtime.messages, see *_hohyeon_hardening.sql), and clients
      // cannot publish. Clients must subscribe with { config: { private: true } }.
      const task = fetch(url + '/realtime/v1/api/broadcast', {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: 'Bearer ' + key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: transition.notifications.map((code) => ({
            topic: 'hh-cloud-' + code,
            event: 'revision',
            payload: { revision },
            private: true,
          })),
        }),
      })
        .then((r) => {
          if (!r.ok)
            log('warn', 'broadcast_failed', { ...ctx, status: r.status });
        })
        .catch((e) =>
          log('warn', 'broadcast_failed', {
            ...ctx,
            message: e instanceof Error ? e.message : String(e),
          }),
        );
      if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(task);
      else await task;
    }
    return { ...transition.response, revision };
  }
  log('warn', 'cas_exhausted', { ...ctx, attempts: CAS_ATTEMPTS });
  throw new HttpError(
    '다른 친구의 요청을 반영 중이에요. 다시 시도해 주세요.',
    503,
  );
});
