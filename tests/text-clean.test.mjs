// Shared text sanitizer (audit D-9).
import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, clipText, hasUnsafeText, textLength } from '../app/text-clean.ts';
import { LoungeRoom } from '../app/lounge-room.ts';
import { newLoungeLedger } from '../app/lounge-economy.ts';
import { defaultLook } from '../app/lounge-look.ts';
import { lifeText, LIFE_REJECT } from '../app/lounge-life.ts';

const LONE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const jsonbSafe = (s) => !LONE.test(s) && !/\\u[dD][89abAB]/.test(JSON.stringify(s));

test('an emoji at the cut is never split into a lone surrogate', () => {
  const text = 'a'.repeat(119) + '😀';
  assert.ok(!jsonbSafe(text.slice(0, 120)), 'the old UTF-16 slice was unsafe');
  const clipped = cleanText(text, 120);
  assert.equal(clipped, text, '120 code points fit whole');
  assert.ok(jsonbSafe(cleanText('a'.repeat(120) + '😀', 120)));
  assert.equal(cleanText('a'.repeat(120) + '😀', 120), 'a'.repeat(120));
  assert.equal(clipText('ab😀cd', 3), 'ab😀');
  assert.equal(textLength('ab😀'), 3);
});

test('graphemes (ZWJ families, flags) are kept whole or dropped whole', () => {
  const family = '👨‍👩‍👧'; // 5 code points joined by ZWJ
  assert.equal(cleanText('hi ' + family, 5), 'hi');
  assert.equal(cleanText('hi ' + family, 8), 'hi ' + family);
  assert.equal(cleanText('🇰🇷🇰🇷', 3), '🇰🇷');
});

test('controls, bidi overrides, zero-width and lone surrogates are removed; whitespace collapses', () => {
  assert.equal(cleanText('  안녕\n\t친구  ', 50), '안녕 친구');
  assert.equal(cleanText('abc‮evil‬', 50), 'abcevil');
  assert.equal(cleanText('x\u0000y\u007f\u0085z​⁦﻿', 50), 'xyz');
  assert.equal(cleanText('half \ud83d', 50), 'half');
  assert.equal(cleanText('\udc00tail', 50), 'tail');
  assert.equal(cleanText(42, 10), '');
  assert.equal(cleanText('‮', 10), '');
  assert.ok(hasUnsafeText('a‮b'));
  assert.ok(hasUnsafeText('a\ud83d'));
  assert.ok(!hasUnsafeText('정상 😀 👨‍👩‍👧'));
});

test('guestbook/mail/status reject what chat strips (same character set)', () => {
  assert.throws(() => lifeText('hi‮', 40), new RegExp(LIFE_REJECT.text));
  assert.throws(() => lifeText('hi \ud83d', 40), new RegExp(LIFE_REJECT.text));
  assert.equal(lifeText('  안녕   친구 😀 ', 40), '안녕 친구 😀');
  assert.throws(() => lifeText('가'.repeat(41), 40), new RegExp(LIFE_REJECT.textLong));
});

test('room chat stores sanitized, jsonb-safe text', () => {
  const now = Date.parse('2026-09-23T03:00:00Z');
  const id = crypto.randomUUID();
  const r = LoungeRoom.hosted(null, newLoungeLedger(), 'ABCDEFGHJK', id);
  r.hostedJoin(id, 0, defaultLook(0));
  assert.equal(r.hostedAttempt(id, { kind: 'chat', text: 'a'.repeat(119) + '😀😀' }, now), '');
  assert.equal(r.hostedAttempt(id, { kind: 'chat', text: 'x‮y\n z' }, now + 1000), '');
  assert.notEqual(r.hostedAttempt(id, { kind: 'chat', text: '‮\u0000' }, now + 2000), '');
  const chat = r.hostedPacket(id).view?.chat ?? r.hostedSnapshot().view?.chat ?? r.hostedSnapshot().chat;
  const texts = (chat ?? []).map((c) => c.text);
  assert.deepEqual(texts.slice(-2), ['a'.repeat(119) + '😀', 'xy z']);
  for (const t of texts) assert.ok(jsonbSafe(t));
});
