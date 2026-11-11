// Read-only dialogue inventory and structural audit. No server/account access.
// node --experimental-strip-types scripts/audit-dialogue.mjs [--out report.json]
import fs from 'node:fs';
import path from 'node:path';
import { NPC_IDS, NPC_SPOUSES } from '../app/lounge-npc-data.ts';
import { NPC_TALK } from '../app/npc-talk/index.ts';
import { condHolds, isMemoryTag } from '../app/lounge-npc-talk.ts';
import { NPC_LINES } from '../app/lounge-npc-dialog.ts';
import { NPC_EXTRA } from '../app/lounge-npc-extra.ts';
import { COMPANION_LINES } from '../app/lounge-npc-companion-lines.ts';
import { NPC_LOVE, NPC_LOVE_MARRIED, NPC_LOVE_BANTER } from '../app/lounge-npc-love.ts';
import { NPC_BANTER } from '../app/lounge-npc-banter.ts';
import { allNpcBirthdayLines } from '../app/lounge-npc-birthday.ts';
import { FRIEND_LINES } from '../app/lounge-friend-lines.ts';
import { allPoolLines } from '../app/lounge-dealer-lines.ts';
import { allCaptainLines } from '../app/lounge-liarsbar-lines.ts';
import { BROKER_LINES } from '../app/lounge-broker-voice.ts';

const stages = ['dating', 'engaged', 'married'];
const list = (v) => v === undefined ? [] : Array.isArray(v) ? v : [v];
const errors = [];
const warnings = [];
const vars = new Set(['me', 'name', 'season', 'weather', 'fish', 'taste', 'other', 'days']);
const rows = [];
// Match the existing content tests' Unicode code-point limit (emoji are refused).
const characterCount = (value) => Array.from(value).length;

function textRecords(value, prefix = '') {
  const records = [];
  if (typeof value === 'string') {
    if (/[가-힣]/.test(value)) records.push({ path: prefix, text: value });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => records.push(...textRecords(v, `${prefix}[${i}]`)));
  } else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) records.push(...textRecords(v, prefix ? `${prefix}.${key}` : key));
  }
  return records;
}

function checkText(npc, where, text, button = false) {
  const label = `${npc}:${where}`;
  if (typeof text !== 'string' || !text.trim()) return errors.push(`${label}: empty text`);
  if (characterCount(text) > (button ? 30 : 60)) errors.push(`${label}: text exceeds ${button ? 30 : 60} characters`);
  if (/\p{Extended_Pictographic}/u.test(text)) errors.push(`${label}: emoji`);
  if (/[A-Za-z\d]/.test(text.replace(/\{\w+\}/g, ''))) errors.push(`${label}: English/digits in displayed text`);
  if (/\{(me|name|other|fish|taste)\}[이가을를은는과와의도로]/.test(text)) errors.push(`${label}: particle immediately follows a name tag`);
  for (const [, variable] of text.matchAll(/\{(\w+)\}/g)) if (!vars.has(variable)) errors.push(`${label}: unknown placeholder ${variable}`);
}

for (const npc of NPC_IDS) {
  const book = NPC_TALK[npc];
  if (!book || !NPC_LINES[npc] || !NPC_EXTRA[npc] || !COMPANION_LINES[npc]) {
    errors.push(`${npc}: missing a registered dialogue family`);
    continue;
  }
  if (!(NPC_SPOUSES[npc] ? NPC_LOVE_MARRIED[npc] : NPC_LOVE[npc])) errors.push(`${npc}: missing love/friendship line set`);
  const entries = [...book.talks, ...book.openers, ...book.callbacks];
  const ids = entries.map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) errors.push(`${npc}: duplicate dialogue id`);
  const produced = new Set(entries.flatMap((entry) => entry.replies.map((reply) => reply.remember).filter(Boolean)));
  for (const chapter of book.chapters) for (const reply of chapter.replies) if (reply.remember) produced.add(reply.remember);
  for (const entry of entries) {
    for (const memory of [...list(entry.when?.mem), ...list(entry.use)]) {
      if (!memory.startsWith('@') && !produced.has(memory)) errors.push(`${npc}:${entry.id}: unreachable memory ${memory}`);
    }
    if (!entry.replies.some((reply) => reply.tier === 'great')) errors.push(`${npc}:${entry.id}: no positive reply`);
  }
  for (const memory of produced) {
    if (!isMemoryTag(memory) || !book.memories[memory]) errors.push(`${npc}: invalid/undocumented memory ${memory}`);
  }

  const expanded = entries.filter((entry) => entry.id.startsWith('lv-'));
  const expandedTalks = book.talks.filter((entry) => entry.id.startsWith('lv-'));
  const expandedCallbacks = book.callbacks.filter((entry) => entry.id.startsWith('lv-'));
  const count = Object.fromEntries(stages.map((stage) => [stage, expandedTalks.filter((entry) => entry.when?.love === stage).length]));
  if (NPC_SPOUSES[npc]) {
    if (expanded.length || book.chapters.some((chapter) => chapter.need.love)) errors.push(`${npc}: existing married couple must remain friendship-only`);
  } else {
    for (const stage of stages) if (count[stage] < 2) errors.push(`${npc}: fewer than two new ${stage} conversations`);
    if (expandedCallbacks.length < 2) errors.push(`${npc}: fewer than two new memory callbacks`);
  }

  for (const entry of expanded) {
    list(entry.open).forEach((line, i) => checkText(npc, `${entry.id}.open${i}`, line));
    if (entry.replies.length !== 3) errors.push(`${npc}:${entry.id}: expected three choices`);
    for (const [i, reply] of entry.replies.entries()) {
      checkText(npc, `${entry.id}.reply${i}`, reply.say, true);
      list(reply.answer).forEach((line, j) => checkText(npc, `${entry.id}.answer${i}.${j}`, line));
      // Saying no, needing rest or choosing space is a valid relationship choice.
      if (reply.tier === 'meh' && /혼자|쉬|나중|천천히|오늘은|어렵|힘들|말하기/.test(reply.say)) warnings.push(`${npc}:${entry.id}: review the lower-scored boundary/rest choice`);
    }
    const facts = { love: entry.when?.love === 'any' ? 'dating' : entry.when?.love ?? null, ch: book.chapters.length, mem: list(entry.when?.mem).filter((m) => !m.startsWith('@')), virtual: list(entry.when?.mem).filter((m) => m.startsWith('@')) };
    if (!condHolds(entry.when, facts)) errors.push(`${npc}:${entry.id}: contradictory relationship/memory conditions`);
  }
  rows.push({ npc, romanceable: !NPC_SPOUSES[npc], talks: book.talks.length, openers: book.openers.length, callbacks: book.callbacks.length, chapters: book.chapters.length, expandedTalks: expandedTalks.length, expandedCallbacks: expandedCallbacks.length, expandedStages: count, expandedDisplayLines: expanded.reduce((n, entry) => n + list(entry.open).length + entry.replies.reduce((m, reply) => m + 1 + list(reply.answer).length, 0), 0) });
}

const families = {
  npcBooks: NPC_TALK,
  npcEveryday: NPC_LINES,
  npcExtra: NPC_EXTRA,
  npcCompanion: COMPANION_LINES,
  npcLove: { ...NPC_LOVE, ...NPC_LOVE_MARRIED },
  npcBanter: NPC_BANTER,
  npcLoveBanter: NPC_LOVE_BANTER,
  npcBirthday: allNpcBirthdayLines(),
  restingFriends: FRIEND_LINES,
  tableDealers: allPoolLines(),
  tavernHost: allCaptainLines(),
  stockBroker: BROKER_LINES,
};
const corpus = Object.entries(families).flatMap(([family, value]) => textRecords(value, family));
const longLegacy = corpus.filter((record) => characterCount(record.text) > 60);
const emojiLegacy = corpus.filter((record) => /\p{Extended_Pictographic}/u.test(record.text));
const normalized = new Map();
for (const record of corpus) {
  if (characterCount(record.text) < 20) continue;
  const same = normalized.get(record.text) ?? [];
  same.push(record.path);
  normalized.set(record.text, same);
}
const duplicateGroups = [...normalized.entries()].filter(([, locations]) => locations.length > 1).map(([text, locations]) => ({ text, locations })).sort((a, b) => b.locations.length - a.locations.length);
const report = {
  scope: 'Registered static dialogue data: 29 NPC books, everyday/extra/companion/love, banter/birthday, resting friends, dealer/tavern/broker pools. Korean text records include choices, scene narration and notebook descriptions; these are not unique voiced utterances.',
  limits: 'Structural and deterministic condition checks do not prove literary quality, voice consistency, runtime pixel layout or that every legacy line can be reached in every save. Player-written lines and dynamically assembled UI text are not audited here. Existing long lines/duplicate prose are review candidates, not automatic defects.',
  totals: { npcs: rows.length, romanceable: rows.filter((row) => row.romanceable).length, textRecords: corpus.length, expandedTalks: rows.reduce((n, row) => n + row.expandedTalks, 0), expandedCallbacks: rows.reduce((n, row) => n + row.expandedCallbacks, 0), expandedDisplayLines: rows.reduce((n, row) => n + row.expandedDisplayLines, 0), duplicateGroupsAtLeast20Characters: duplicateGroups.length, longLegacyRecords: longLegacy.length, emojiLegacyRecords: emojiLegacy.length },
  families: Object.fromEntries(Object.entries(families).map(([family, value]) => [family, textRecords(value).length])),
  residents: rows,
  errors,
  warnings,
  legacyReview: { longLines: longLegacy.slice(0, 30), emoji: emojiLegacy.slice(0, 20), repeatedLongLines: duplicateGroups.slice(0, 30) },
};
const outIndex = process.argv.indexOf('--out');
if (outIndex >= 0) {
  const output = process.argv[outIndex + 1];
  if (!output) throw new Error('--out needs a path');
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ totals: report.totals, families: report.families, errors, warnings }, null, 2));
if (errors.length) process.exitCode = 1;
