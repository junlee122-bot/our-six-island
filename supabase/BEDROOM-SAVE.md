# Personal bedroom persistence

`LoungeSave.bedroom` is a versioned object in the existing account `save` jsonb.
The catalog/validator lives in `app/lounge-bedroom-data.ts` and has no browser or
asset dependencies. Room items contain only allowlisted prop IDs, bounded numeric
coordinates/scale, boolean flip, and unique ASCII IDs. No asset URLs or HTML are
accepted. Up to 48 items are retained, preserving order within each catalog layer.

The server path is `hohyeon-api` → `accountSave(b.save, m.actor, m.save)` →
`hh_profile_save`. The actor comes from the authenticated membership record and
must be an integer from 0 through 6. Incoming saved actor values cannot override it.

Compatibility rules:

- Existing saves without a room get an actor-appropriate starter when read.
- An older client posting no `bedroom` own property preserves the stored server
  bedroom. This also preserves a deliberately empty room.
- Explicit null/invalid room data resets through the validator; a valid room with
  `items: []` remains empty. The editor's room reset sends `defaultBedroom(actor)`.
- The existing revision check still protects concurrent saves. Room edits do not
  read or mutate the shared currency ledger or gameplay state.

No schema migration, new table, RLS policy, or grant is needed. The current
`hh_profile_save` function already stores arbitrary JSON objects, checks the
authenticated member, enforces revision matching, and bounds jsonb text to 65,536
bytes. A test covers the worst-case sanitized 48-item room plus 28 saved outfits.

## Required release order

Deploy the updated **hohyeon-api** Edge Function before releasing the bedroom UI.
An old deployed function strips the new bedroom field through its older
`readLounge`, so frontend-only deployment would silently lose room edits.
Include the new `app/lounge-bedroom-data.ts` in the function dependency closure.
The existing `work/collect-account-function.mjs hohyeon-api` collector follows
relative imports and includes it automatically. Keep current JWT verification and
the existing `supabase/functions/deno.json` import map unchanged.

Other Edge Functions do not process profile saves and need no deployment for this
feature. On 2026-09-18, `hohyeon-api` version 3 was deployed with JWT verification
enabled; all 25 deployed source files were verified byte-for-byte against the
upload package. No production account credentials or saved profiles were accessed
or changed for testing.

Local validation: `node --experimental-strip-types --test
tests/lounge-bedroom.test.mjs tests/lounge.test.mjs tests/lounge-cloud.test.mjs`.
After the authorized release, verify a room save/reload, an outfit-only legacy save,
and a stale-revision conflict using synthetic fixtures or an explicitly authorized
test account. Never reset real accounts to test migration.

Reference: [Supabase Edge Function deployment](https://supabase.com/docs/guides/functions/deploy).
