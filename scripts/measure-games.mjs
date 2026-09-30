// Measures the per-game world row and response payload with 7 friends in one
// room (server engine, no network). Used by the games audit:
//   node --experimental-strip-types --no-warnings scripts/measure-games.mjs poker
import { cloudTransition, commandHash } from '../app/lounge-cloud-engine.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { ACCOUNT_IDS } from '../app/lounge-accounts.ts';

const member = (actor) => ({ id: crypto.randomUUID(), actor, username: ACCOUNT_IDS[actor], connection: crypto.randomUUID(), sequence: 0, epoch: 0, code: '' });
let world = { schema: 1, ledger: newLoungeLedger(), rooms: {}, receipts: {} };
const now = Date.now();
async function run(p, op, extra = {}) {
  const c = {
    op,
    connection: p.connection,
    code: p.code,
    ...(!['read', 'wallet'].includes(op) ? { requestId: crypto.randomUUID(), sequence: ++p.sequence } : {}),
    ...(['open', 'join'].includes(op) ? { epoch: p.epoch } : {}),
    ...extra,
  };
  const hash = await commandHash(c);
  const t0 = performance.now();
  const r = cloudTransition(world, p, c, hash, now);
  const ms = performance.now() - t0;
  world = r.state;
  p.epoch = r.response.epoch;
  if (r.response.code) p.code = r.response.code;
  return { ...r, ms };
}
const kind = process.argv[2] || 'poker';
const stake = { poker: 10000, blackjack: 1000, seotda: 10000, yacht: 1000, liarsbar: 1000, liar: 0, gostop: 10000, chess: 1000 }[kind];
const n = { poker: 7, blackjack: 7, seotda: 7, yacht: 4, liarsbar: 4, liar: 7, gostop: 3, chess: 2 }[kind];
const area = { poker: 'casino', blackjack: 'casino', chess: 'casino', seotda: 'lounge', gostop: 'lounge', yacht: 'lounge', liarsbar: 'tavern', liar: 'lounge' }[kind];
const ps = [0, 1, 2, 3, 4, 5, 6].map(member);
await run(ps[0], 'open');
for (const p of ps.slice(1)) {
  p.code = ps[0].code;
  await run(p, 'join');
}
for (const p of ps) await run(p, 'action', { action: { kind: 'area', area } });
let r = await run(ps[0], 'action', {
  action: { kind: 'invite', game: kind, players: ps.slice(1, n).map((p) => p.id), stake, required: n, ...(kind === 'liar' ? { party: true } : {}) },
});
if (!r.response.ok) console.log('invite error', r.response.error);
const inv = r.response.packet.invites.at(-1);
for (const p of ps.slice(1, n)) {
  r = await run(p, 'action', { action: { kind: 'reply', id: inv.id, accept: true } });
  if (!r.response.ok) console.log(r.response.error);
}
r = await run(ps[1], 'read');
const size = (o) => new TextEncoder().encode(JSON.stringify(o ?? null)).length;
const resp = r.response;
const out = {
  kind,
  started: !!resp.packet?.[kind],
  worldRow: size(world),
  roomSnapshot: size(world.rooms[ps[0].code].snapshot),
  ledger: size(world.ledger),
  life: size(world.life),
  response: size(resp),
  packet: size(resp.packet),
  packetLife: size(resp.packet?.life),
  responseLife: size(resp.life),
  finance: size(resp.finance),
  gameView: size(resp.packet?.[kind]),
  players: size(resp.packet?.players),
  readMs: Number(r.ms.toFixed(2)),
};
// A later poll that already holds this life view (the client sends lifeHash).
if (resp.lifeHash) out.pollWithLifeHash = size((await run(ps[1], 'read', { lifeHash: resp.lifeHash })).response);
console.log(JSON.stringify(out));
