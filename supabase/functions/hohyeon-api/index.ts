import { accountSave } from '../../../app/lounge-accounts.ts';
import {
  cloudTransition,
  commandHash,
  CloudError,
} from '../../../app/lounge-cloud-engine.ts';
import {
  HttpError,
  key,
  member,
  profile,
  rate,
  rpc,
  serve,
  url,
} from '../_shared/server.ts';
declare const EdgeRuntime: { waitUntil: (task: Promise<unknown>) => void };
serve(async (b, req) => {
  const { m } = await member(req);
  await rate('api:' + m.user_id, 300);
  if (b.op === 'profile') return { profile: profile(m) };
  if (b.op === 'save') {
    if (
      !Number.isSafeInteger(b.revision) ||
      b.revision < 0 ||
      !b.save ||
      typeof b.save !== 'object'
    )
      throw new HttpError('저장 정보를 확인해 주세요.');
    return await rpc('hh_profile_save', {
      p_uid: m.user_id,
      p_expected: b.revision,
      p_save: accountSave(b.save, m.actor, m.save),
    });
  }
  if (b.op !== 'world' || !b.command || typeof b.command !== 'object')
    throw new HttpError('지원하지 않는 요청입니다.');
  const hash = await commandHash(b.command);
  for (let attempt = 0; attempt < 12; attempt++) {
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
      throw e;
    }
    const revision = transition.changed
      ? await rpc('hh_world_commit', {
          p_expected: row.revision,
          p_state: transition.state,
        })
      : row.revision;
    if (revision === null) continue;
    if (transition.notifications.length) {
      // A hint only. Clients fetch their own authenticated, redacted snapshot.
      const task = fetch(url + '/realtime/v1/api/broadcast', {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: transition.notifications.map((code) => ({
            topic: 'hh-cloud-' + code,
            event: 'revision',
            payload: { revision },
            private: false,
          })),
        }),
      }).catch(() => {});
      if (typeof EdgeRuntime !== 'undefined') EdgeRuntime.waitUntil(task);
      else await task;
    }
    return { ...transition.response, revision };
  }
  throw new HttpError(
    '다른 친구의 요청을 반영 중이에요. 다시 시도해 주세요.',
    503,
  );
});
