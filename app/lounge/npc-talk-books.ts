/// <reference types="vite/client" />
// 주민과 진짜 대화 on the client: each resident's talk book (app/npc-talk/<id>.ts)
// is its own chunk, loaded the first time it is needed (I walk up to them,
// open the talk box or their page in 주민 수첩) and then registered with the
// engine (lounge-npc-talk.ts registerTalkBooks), so npcTalkBook reads it like
// the server does. A book is found by its file name, nothing to list here:
// adding app/npc-talk/<id>.ts (and its line in index.ts for the server) is
// enough. A book that fails to load leaves the old one-line talk.
import { useEffect, useState } from 'react';
import { isNpcId, type NpcId } from '../lounge-npc-data';
import { npcTalkBook, registerTalkBooks, type NpcTalkBook } from '../lounge-npc-talk';

const LOADERS: Partial<Record<NpcId, () => Promise<Record<string, unknown>>>> = {};
for (const [path, load] of Object.entries(import.meta.glob(['../npc-talk/*.ts', '!../npc-talk/index.ts', '!../npc-talk/types.ts']))) {
  const id = path.slice(path.lastIndexOf('/') + 1, -'.ts'.length);
  if (isNpcId(id)) LOADERS[id] = load as () => Promise<Record<string, unknown>>;
}

/** This resident has a book (loaded or not). */
export const talkBookExists = (npc: NpcId) => !!LOADERS[npc] || !!npcTalkBook(npc);

const loading: Partial<Record<NpcId, Promise<NpcTalkBook | undefined>>> = {};
const failed = new Set<NpcId>();
const listeners = new Set<() => void>();

/** Loads (once) and registers a resident's book; undefined when there is none or it failed. */
export function loadTalkBook(npc: NpcId): Promise<NpcTalkBook | undefined> {
  const have = npcTalkBook(npc);
  if (have) return Promise.resolve(have);
  const load = LOADERS[npc];
  if (!load) return Promise.resolve(undefined);
  if (!loading[npc]) failed.delete(npc);
  loading[npc] ??= load().then(
    (mod) => {
      const book = Object.values(mod).find((v): v is NpcTalkBook => !!v && typeof v === 'object' && (v as NpcTalkBook).npc === npc);
      if (book) registerTalkBooks({ [npc]: book });
      else failed.add(npc);
      for (const f of listeners) f();
      return book;
    },
    () => {
      // A later try may work (a dropped connection); this time, the old talk.
      delete loading[npc];
      failed.add(npc);
      for (const f of listeners) f();
      return undefined;
    },
  );
  return loading[npc]!;
}

/**
 * Loads these residents' books and re-renders when one arrives. Returns the
 * ones still on their way (a talk box waits for its book a moment).
 */
export function useTalkBooks(npcs: readonly NpcId[]): ReadonlySet<NpcId> {
  const [, bump] = useState(0);
  const key = npcs.join(',');
  useEffect(() => {
    const f = () => bump((n) => n + 1);
    listeners.add(f);
    for (const npc of key.split(',')) if (isNpcId(npc) && !npcTalkBook(npc)) void loadTalkBook(npc);
    return () => void listeners.delete(f);
  }, [key]);
  return new Set(npcs.filter((npc) => !!LOADERS[npc] && !npcTalkBook(npc) && !failed.has(npc)));
}

/** Renders nothing; starts loading a resident's book while I stand near them. */
export function TalkBookPreload({ npc }: { npc: NpcId }) {
  useTalkBooks([npc]);
  return null;
}
