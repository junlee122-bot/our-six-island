import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setup } from '../scripts/ui-harness.mjs';

// No browser or network is needed to exercise the fixture's shared state.
async function fixture() {
  let route;
  const context = {
    async addInitScript() {}, async routeWebSocket() {}, async close() {},
    async newPage() { return { on() {} }; },
    async route(_pattern, handler) { route = handler; },
  };
  const harness = await setup({ browser: { async newContext() { return context; } }, base: 'http://127.0.0.1:1' });
  const request = async (command) => {
    let response;
    await route({
      request: () => ({ url: () => 'https://synthetic.test/functions/v1/hohyeon-api', postData: () => JSON.stringify({ command }) }),
      fulfill: async ({ body }) => { response = JSON.parse(body); },
    });
    return response;
  };
  const areas = () => new Map(harness.world().rooms.BEMTADUVLY.snapshot.players.map((p) => [p.actor, p.area]));
  return { harness, request, areas };
}

test('mock bot commands retain both concurrent state transitions', async () => {
  const { harness: h, areas } = await fixture();
  try {
    const results = await Promise.all([
      h.run(h.bots[0], 'action', { action: { kind: 'area', area: 'casino' } }),
      h.run(h.bots[1], 'action', { action: { kind: 'area', area: 'wardrobe' } }),
    ]);
    for (const response of results) assert.equal(response.ok, true);
    assert.equal(areas().get(0), 'casino');
    assert.equal(areas().get(6), 'wardrobe');
  } finally { await h.close(); }
});

test('mock API request and bot command do not restore stale world state', async () => {
  const { harness: h, request, areas } = await fixture();
  const connection = randomUUID();
  let sequence = 0;
  const command = (op, extra = {}) => ({ op, code: 'BEMTADUVLY', connection, sequence: ++sequence, requestId: randomUUID(), ...extra });
  try {
    const wallet = await request(command('wallet'));
    const opened = await request(command('open', { epoch: wallet.epoch }));
    assert.equal(opened.ok, true, opened.error);
    // Start the API digest before a bot digest, just as a heartbeat can overlap
    // a browser click. Both updates must survive regardless of completion order.
    const results = await Promise.all([
      request(command('action', { action: { kind: 'area', area: 'casino' } })),
      h.run(h.bots[0], 'action', { action: { kind: 'area', area: 'wardrobe' } }),
    ]);
    for (const response of results) assert.equal(response.ok, true);
    assert.equal(areas().get(3), 'casino');
    assert.equal(areas().get(0), 'wardrobe');
  } finally { await h.close(); }
});
