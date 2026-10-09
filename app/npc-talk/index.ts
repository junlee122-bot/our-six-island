// 주민과 진짜 대화: every resident's talk book (one file per resident, format
// in ./types.ts, guide in handover/design/npc-talk-content-guide.md). A
// resident without a book keeps the old talk (one line, no choices) until
// their file is added here. tests/lounge-npc-talk.test.mjs checks every book.
import type { NpcId } from '../lounge-npc-data.ts';
import type { NpcTalkBook } from './types.ts';
import { CAPTAIN_TALK } from './captain.ts';
import { FRIEREN_TALK } from './frieren.ts';
import { LUMI_TALK } from './lumi.ts';
import { MAEHWA_TALK } from './maehwa.ts';
import { ROSE_TALK } from './rose.ts';

export const NPC_TALK: Partial<Record<NpcId, NpcTalkBook>> = {
  captain: CAPTAIN_TALK,
  maehwa: MAEHWA_TALK,
  lumi: LUMI_TALK,
  rose: ROSE_TALK,
  frieren: FRIEREN_TALK,
};
