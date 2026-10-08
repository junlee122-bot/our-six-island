'use client';
// 주민과 진짜 대화: a story chapter can ask me to be somewhere at some time
// ("저녁 무렵 뒷산에 올라가 보세요"). While I stand in that area at that game
// hour, this tells the server once (`npcChat` `visit`; it checks where I
// really am and the clock) and says so in a toast. Renders nothing.
import { useEffect, useRef } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { gameHour } from '../lounge-calendar';
import { NPCS } from '../lounge-npc-data';
import { chaptersDone, npcTalkBook, visitDue } from '../lounge-npc-talk';
import { josa } from '../lounge-text';
import type { Notify } from './Toast';
import { useNow } from './use-now';

export function NpcTalkVisits({ room, view, notify }: { room: CloudRoom; view: CloudRoomView; notify: Notify }) {
  const now = useNow(true, 5000) + view.clockOffset;
  const sent = useRef(new Set<string>());
  const me = view.players.find((p) => p.id === view.self);
  const area = me?.area ?? '';
  const hour = gameHour(now);
  const rows = view.life?.me.npcRelations;
  useEffect(() => {
    if (!area || !rows) return;
    for (const row of rows) {
      const book = npcTalkBook(row.npc);
      if (!book || !visitDue(book, row, area, hour)) continue;
      const key = `${row.npc}:${chaptersDone(book, row) + 1}`;
      if (sent.current.has(key)) continue;
      sent.current.add(key);
      void Promise.resolve(room.life({ kind: 'npcChat', npc: row.npc, op: 'visit' })).then((ok) => {
        // Once per chapter and page load, whatever the answer (no retry storm).
        if (ok) notify(`${josa(NPCS[row.npc].name, '이/가')} 말한 곳에 와 봤어요. 다음에 만나면 이야기를 이어 갈 수 있어요.`, 'info');
      });
    }
  }, [area, hour, rows, room, notify]);
  return null;
}
