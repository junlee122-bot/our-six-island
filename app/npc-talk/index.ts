// 주민과 진짜 대화: every resident's talk book (one file per resident, format
// in ./types.ts, guide in handover/design/npc-talk-content-guide.md). A
// resident without a book keeps the old talk (one line, no choices) until
// their file is added here. tests/lounge-npc-talk.test.mjs checks every book.
import type { NpcId } from '../lounge-npc-data.ts';
import type { NpcTalkBook } from './types.ts';
import { CAPTAIN_TALK } from './captain.ts';
import { FRIEREN_TALK } from './frieren.ts';
import { HAKU_TALK } from './haku.ts';
import { MAKIMA_TALK } from './makima.ts';
import { YANINEKO_TALK } from './yanineko.ts';
import { MUZAN_TALK } from './muzan.ts';
import { NILAH_TALK } from './nilah.ts';
import { ORNN_TALK } from './ornn.ts';
import { MERCY_TALK } from './mercy.ts';
import { SHINICHI_TALK } from './shinichi.ts';
import { LUMI_TALK } from './lumi.ts';
import { MAEHWA_TALK } from './maehwa.ts';
import { ROSE_TALK } from './rose.ts';
import { REALTOR_TALK } from './realtor.ts';
import { MISUN_TALK } from './misun.ts';
import { CARPENTER_TALK } from './carpenter.ts';
import { NYAMO_TALK } from './nyamo.ts';
import { GWEN_TALK } from './gwen.ts';
import { NASERA_TALK } from './nasera.ts';
import { THRESH_TALK } from './thresh.ts';
import { SINJJAJANG_TALK } from './sinjjajang.ts';
import { VOLIBAS_TALK } from './volibas.ts';
import { JANNA_TALK } from './janna.ts';
import { GABUNG_TALK } from './gabung.ts';
import { LUX_TALK } from './lux.ts';
import { HIMMEL_TALK } from './himmel.ts';
import { BEATRICE_TALK } from './beatrice.ts';
import { BOCCHI_TALK } from './bocchi.ts';
import { TSUNADE_TALK } from './tsunade.ts';

export const NPC_TALK: Partial<Record<NpcId, NpcTalkBook>> = {
  captain: CAPTAIN_TALK,
  maehwa: MAEHWA_TALK,
  lumi: LUMI_TALK,
  rose: ROSE_TALK,
  frieren: FRIEREN_TALK,
  realtor: REALTOR_TALK,
  misun: MISUN_TALK,
  carpenter: CARPENTER_TALK,
  nyamo: NYAMO_TALK,
  gwen: GWEN_TALK,
  nasera: NASERA_TALK,
  thresh: THRESH_TALK,
  sinjjajang: SINJJAJANG_TALK,
  volibas: VOLIBAS_TALK,
  janna: JANNA_TALK,
  gabung: GABUNG_TALK,
  lux: LUX_TALK,
  himmel: HIMMEL_TALK,
  beatrice: BEATRICE_TALK,
  bocchi: BOCCHI_TALK,
  tsunade: TSUNADE_TALK,
  haku: HAKU_TALK,
  makima: MAKIMA_TALK,
  yanineko: YANINEKO_TALK,
  muzan: MUZAN_TALK,
  nilah: NILAH_TALK,
  ornn: ORNN_TALK,
  mercy: MERCY_TALK,
  shinichi: SHINICHI_TALK,
};
