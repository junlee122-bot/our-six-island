// Every resident's extra lines (lounge-npc-extra-<id>.ts): more greetings,
// weather, season and tier lines merged into their line file, reactions to
// what a friend did lately, and how they talk with other residents
// (lounge-npc-social.ts). The merge keeps the line file's own lines first.
import type { NpcLineSet } from './lounge-npc-line-types.ts';
import type { NpcExtraLines } from './lounge-npc-extra-types.ts';
import type { NpcId } from './lounge-npc-data.ts';
import { LUMI_EXTRA } from './lounge-npc-extra-lumi.ts';
import { MAEHWA_EXTRA } from './lounge-npc-extra-maehwa.ts';
import { CAPTAIN_EXTRA } from './lounge-npc-extra-captain.ts';
import { REALTOR_EXTRA } from './lounge-npc-extra-realtor.ts';
import { MISUN_EXTRA } from './lounge-npc-extra-misun.ts';
import { CARPENTER_EXTRA } from './lounge-npc-extra-carpenter.ts';
import { ROSE_EXTRA } from './lounge-npc-extra-rose.ts';
import { NYAMO_EXTRA } from './lounge-npc-extra-nyamo.ts';
import { GWEN_EXTRA } from './lounge-npc-extra-gwen.ts';
import { NASERA_EXTRA } from './lounge-npc-extra-nasera.ts';
import { FRIEREN_EXTRA } from './lounge-npc-extra-frieren.ts';
import { THRESH_EXTRA } from './lounge-npc-extra-thresh.ts';
import { SINJJAJANG_EXTRA } from './lounge-npc-extra-sinjjajang.ts';
import { VOLIBAS_EXTRA } from './lounge-npc-extra-volibas.ts';
import { JANNA_EXTRA } from './lounge-npc-extra-janna.ts';
import { GABUNG_EXTRA } from './lounge-npc-extra-gabung.ts';
import { LUX_EXTRA } from './lounge-npc-extra-lux.ts';
import { HIMMEL_EXTRA } from './lounge-npc-extra-himmel.ts';
import { BEATRICE_EXTRA } from './lounge-npc-extra-beatrice.ts';
import { BOCCHI_EXTRA } from './lounge-npc-extra-bocchi.ts';
import { TSUNADE_EXTRA } from './lounge-npc-extra-tsunade.ts';
import { MAKIMA_EXTRA } from './lounge-npc-extra-makima.ts';
import { YANINEKO_EXTRA } from './lounge-npc-extra-yanineko.ts';
import { MUZAN_EXTRA } from './lounge-npc-extra-muzan.ts';
import { NILAH_EXTRA } from './lounge-npc-extra-nilah.ts';
import { HAKU_EXTRA } from './lounge-npc-extra-haku.ts';
import { ORNN_EXTRA } from './lounge-npc-extra-ornn.ts';
import { MERCY_EXTRA } from './lounge-npc-extra-mercy.ts';
import { SHINICHI_EXTRA } from './lounge-npc-extra-shinichi.ts';

export const NPC_EXTRA: Record<NpcId, NpcExtraLines> = {
  lumi: LUMI_EXTRA,
  maehwa: MAEHWA_EXTRA,
  captain: CAPTAIN_EXTRA,
  realtor: REALTOR_EXTRA,
  misun: MISUN_EXTRA,
  carpenter: CARPENTER_EXTRA,
  rose: ROSE_EXTRA,
  nyamo: NYAMO_EXTRA,
  gwen: GWEN_EXTRA,
  nasera: NASERA_EXTRA,
  frieren: FRIEREN_EXTRA,
  thresh: THRESH_EXTRA,
  sinjjajang: SINJJAJANG_EXTRA,
  volibas: VOLIBAS_EXTRA,
  janna: JANNA_EXTRA,
  gabung: GABUNG_EXTRA,
  lux: LUX_EXTRA,
  himmel: HIMMEL_EXTRA,
  beatrice: BEATRICE_EXTRA,
  bocchi: BOCCHI_EXTRA,
  tsunade: TSUNADE_EXTRA,
  makima: MAKIMA_EXTRA,
  yanineko: YANINEKO_EXTRA,
  muzan: MUZAN_EXTRA,
  nilah: NILAH_EXTRA,
  haku: HAKU_EXTRA,
  ornn: ORNN_EXTRA,
  mercy: MERCY_EXTRA,
  shinichi: SHINICHI_EXTRA,
};

const merged = new Map<string, NpcLineSet>();
const join = (a: readonly string[] | undefined, b: readonly string[] | undefined) => [...(a ?? []), ...(b ?? [])];
/** A line file with the extra greetings, weather, season and tier lines added. */
export function withExtraLines(npc: NpcId, base: NpcLineSet): NpcLineSet {
  const hit = merged.get(npc);
  if (hit) return hit;
  const x = NPC_EXTRA[npc];
  const out: NpcLineSet = {
    ...base,
    greet: { dawn: join(base.greet.dawn, x.greet.dawn), day: join(base.greet.day, x.greet.day), evening: join(base.greet.evening, x.greet.evening), night: join(base.greet.night, x.greet.night) },
    weather: {
      rain: join(base.weather.rain, x.weather.rain),
      storm: join(base.weather.storm, x.weather.storm),
      snow: join(base.weather.snow, x.weather.snow),
      sunny: join(base.weather.sunny, x.weather.sunny),
      cloudy: join(base.weather.cloudy, x.weather.cloudy),
    },
    season: { spring: join(base.season.spring, x.season.spring), summer: join(base.season.summer, x.season.summer), autumn: join(base.season.autumn, x.season.autumn), winter: join(base.season.winter, x.season.winter) },
    tier: { 0: join(base.tier[0], x.tier[0]), 1: join(base.tier[1], x.tier[1]), 2: join(base.tier[2], x.tier[2]), 3: join(base.tier[3], x.tier[3]), 4: join(base.tier[4], x.tier[4]) },
  };
  merged.set(npc, out);
  return out;
}
