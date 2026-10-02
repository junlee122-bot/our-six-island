// What a friend did lately that residents talk about (NpcExtraLines.react):
// fished or went out on the boat today, made or lost money on 범마을 증권
// today, won or lost at the tables this week, gave the museum something
// today. Read from what the client already has (life, stocks, table stats);
// nothing new is stored. Pure: the caller passes the pieces of its view.
import { kstDay } from './lounge-economy.ts';
import type { NpcRecentKind } from './lounge-npc-extra-types.ts';

export type NpcRecentFacts = {
  now: number;
  actor: number;
  /** Last cast (angling view me.last). */
  fished?: { ok: boolean; at: number } | null;
  /** 먼바다 낚싯배: sailed today, or on a trip now. */
  voyage?: { sailedToday: boolean; trip: unknown } | null;
  /** 범마을 증권: my trade log and total profit. */
  stocks?: { log: readonly { at: number }[]; profit: number } | null;
  /** This week's table rows per game (table stats view week). */
  tables?: Partial<Record<string, readonly { actor: number; net: number; n: number }[]>> | null;
  /** Museum donations (life museum: item → donor actor, when). */
  museum?: Readonly<Record<string, { actor: number; at: number }>> | null;
};

/** The things a resident may bring up, most recent / notable first. */
export function npcRecentKinds(f: NpcRecentFacts): NpcRecentKind[] {
  const day = kstDay(f.now);
  const today = (at: number | undefined) => typeof at === 'number' && kstDay(at) === day;
  const out: NpcRecentKind[] = [];
  if (f.voyage && (f.voyage.sailedToday || f.voyage.trip)) out.push('voyage');
  else if (f.fished?.ok && today(f.fished.at)) out.push('fishing');
  if (f.stocks && f.stocks.log.some((l) => today(l.at)) && f.stocks.profit !== 0) out.push(f.stocks.profit > 0 ? 'stockUp' : 'stockDown');
  if (f.museum && Object.values(f.museum).some((m) => m.actor === f.actor && today(m.at))) out.push('museum');
  if (f.tables) {
    let net = 0,
      n = 0;
    for (const rows of Object.values(f.tables))
      for (const r of rows ?? [])
        if (r.actor === f.actor) {
          net += r.net;
          n += r.n;
        }
    if (n > 0 && net !== 0) out.push(net > 0 ? 'casinoWin' : 'casinoLose');
  }
  return out;
}
