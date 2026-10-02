// In-world chibi sprites of the residents (friends' proportions, user decision
// 2026-09-30): wherever a resident stands or walks — the hub, the districts,
// the tavern, the casino/bank/salon counters, my room — they are drawn with
// these at a friend's height and feet line. The tall art (NpcDef.art) stays
// for dialogue portraits and illustrations. Canvas sizes are those written by
// scripts/optimize-assets.mjs chibi (figure at 94% of the height, feet on the
// 97% line, like lounge-figure-frame.ts places a friend).
import { LOUNGE_ASSETS as A } from './lounge-assets.ts';
import type { NpcId } from './lounge-npc-data.ts';

export type NpcChibi = { asset: string; w: number; h: number };
export const NPC_CHIBI: Partial<Record<NpcId, NpcChibi>> = {
  frieren: { asset: A.chibi_frieren, w: 512, h: 640 },
  nasera: { asset: A.chibi_nasera, w: 512, h: 640 },
  rose: { asset: A.chibi_rose, w: 512, h: 640 },
  gwen: { asset: A.chibi_gwen, w: 512, h: 640 },
  nyamo: { asset: A.chibi_nyamo, w: 512, h: 640 },
  thresh: { asset: A.chibi_thresh, w: 512, h: 640 },
  sinjjajang: { asset: A.chibi_sinjjajang, w: 512, h: 640 },
  volibas: { asset: A.chibi_volibas, w: 512, h: 640 },
  janna: { asset: A.chibi_janna, w: 512, h: 640 },
  gabung: { asset: A.chibi_gabung, w: 512, h: 640 },
  lux: { asset: A.chibi_lux, w: 512, h: 640 },
  himmel: { asset: A.chibi_himmel, w: 512, h: 640 },
  beatrice: { asset: A.chibi_beatrice, w: 512, h: 640 },
  bocchi: { asset: A.chibi_bocchi, w: 512, h: 640 },
  tsunade: { asset: A.chibi_tsunade, w: 512, h: 640 },
  makima: { asset: A.chibi_makima, w: 512, h: 640 },
  yanineko: { asset: A.chibi_yanineko, w: 512, h: 640 },
  realtor: { asset: A.chibi_shinhyungman, w: 512, h: 640 },
  misun: { asset: A.chibi_bongmison, w: 512, h: 640 },
  carpenter: { asset: A.chibi_valkyrie, w: 512, h: 640 },
  nilah: { asset: A.chibi_nilah, w: 512, h: 640 },
  haku: { asset: A.chibi_haku, w: 512, h: 640 },
  ornn: { asset: A.chibi_ornn, w: 512, h: 640 },
  mercy: { asset: A.chibi_mercy, w: 512, h: 640 },
  shinichi: { asset: A.chibi_shinichi, w: 512, h: 640 },
};
export const npcChibi = (id: NpcId): NpcChibi | undefined => NPC_CHIBI[id];
