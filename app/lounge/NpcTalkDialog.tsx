'use client';
// Talking to a resident where they stand (E next to them in the hub or in
// 시장 거리). The lines come from their dialogue file (lounge-npc-dialog.ts,
// the same on every screen); "이야기 나누기" and gifts go through the server
// like the notebook (the server checks they are really here).
import { useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { itemName } from '../lounge-life-plus';
import { NPCS, assertNpcSocialContext, npcGiftReaction, type NpcId, type NpcRelations, type NpcSocialAction } from '../lounge-romance';
import { npcSpot } from '../lounge-npc-schedule';
import { npcGiftLine, npcTalk } from '../lounge-npc-dialog';
import { npcRequestsOn } from '../lounge-npc-requests';
import { kstDay } from '../lounge-economy';
import { ACTORS } from '../lounge-roster';
import { GameButton } from '../ui/GameButton';
import { Modal } from './Modal';
import { ItemIcon } from './ItemIcon';
import { NpcPortrait } from './NpcPortrait';
import { giftOptions } from './npc-gifts';
import type { Notify } from './Toast';
import { useNow } from './use-now';
import './npc-relations.css';

export function NpcTalkDialog({ npc, room, view, notify, onClose, onBook, onBoard }: {
  npc: NpcId;
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
  /** Opens the residents' notebook on this resident. */
  onBook: () => void;
  /** Opens the request board (when they have a request today). */
  onBoard?: () => void;
}) {
  const now = useNow(true, 5000) + view.clockOffset;
  const [opened] = useState(() => Date.now() + view.clockOffset);
  const me = view.players.find((p) => p.id === view.self);
  const myName = me ? ACTORS[me.actor] ?? '친구' : '친구';
  const rows = view.life?.me.npcRelations ?? [];
  const row = rows.find((r) => r.npc === npc) ?? { npc, points: 0, talked: false, gifted: false, level: '인사하는 사이', lastGift: undefined };
  const relations: NpcRelations = Object.fromEntries(rows.map((r) => [r.npc, r]));
  const spot = npcSpot(npc, opened);
  const [lines, setLines] = useState(() =>
    npcTalk({ npc, me: myName, who: me?.actor ?? 0, now: opened, points: row.points, talkedToday: row.talked, spot, lastGiftName: row.lastGift ? itemName(row.lastGift) : undefined }).lines,
  );
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const gifts = giftOptions(view.life);
  const [giftKey, setGiftKey] = useState('');
  const chosen = gifts.find((g) => g.key === giftKey) ?? gifts[0];
  const context = { area: me?.area ?? '', home: me?.home, actor: me?.actor ?? -1, fishing: !!view.life?.me.fishing.pending, x: me?.x, y: me?.y };
  const blocked = (action: NpcSocialAction) => {
    if (!me) return '마을에 연결되면 이야기할 수 있어요.';
    try {
      assertNpcSocialContext(action, relations, context, now);
      return '';
    } catch (e) {
      return e instanceof Error ? e.message : '지금은 할 수 없어요.';
    }
  };
  const run = async (action: NpcSocialAction, say: string[]) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (await room.life(action)) setLines(say);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const talkAction: NpcSocialAction = { kind: 'npcSocial', npc, op: 'talk' };
  const talkBlock = blocked(talkAction);
  const request = npcRequestsOn(kstDay(now)).find((r) => r.npc === npc);
  const requestDone = view.life?.me.npcBoard?.requests.find((r) => r.id === request?.id)?.done;
  const info = NPCS[npc];
  return (
    <Modal title={info.name} onClose={onClose} className="l-npc-talk">
      <div className="l-npc-talk-head">
        <NpcPortrait npc={npc} mood="smile" className="is-large" />
        <div>
          <strong>{info.role}</strong>
          <small>{spot.label} · {row.level} · {row.points}</small>
        </div>
      </div>
      <blockquote className="l-npc-talk-lines" aria-live="polite">
        {lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </blockquote>
      {talkBlock && <p className="l-npc-location">{talkBlock}</p>}
      <div className="l-npc-actions">
        <GameButton
          disabled={busy || row.talked || !!talkBlock}
          onClick={() => {
            const next = npcTalk({ npc, me: myName, who: me?.actor ?? 0, now: now + 60_000, points: row.points + 6, talkedToday: false, spot, lastGiftName: row.lastGift ? itemName(row.lastGift) : undefined }).lines;
            void run(talkAction, next.slice(-1));
          }}
        >
          {row.talked ? '오늘 대화 완료' : '이야기 나누기 · +6'}
        </GameButton>
        {request && !requestDone && onBoard && (
          <GameButton onClick={onBoard}>의뢰 보기 · {itemName(request.item)} {request.n}개</GameButton>
        )}
        <GameButton onClick={onBook}>주민 수첩</GameButton>
      </div>
      <div className="l-npc-gift">
        {chosen && <ItemIcon id={chosen.item} size={34} />}
        <label>
          선물
          <select value={chosen?.key ?? ''} onChange={(e) => setGiftKey(e.target.value)} disabled={busy || !gifts.length || row.gifted}>
            {!gifts.length && <option value="">주머니에 선물할 물건이 없어요</option>}
            {gifts.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <GameButton
          disabled={busy || row.gifted || !chosen || !!talkBlock}
          onClick={() => {
            if (!chosen) return;
            const reaction = npcGiftReaction(npc, chosen.item, chosen.q);
            const line = npcGiftLine(npc, reaction, { me: myName, item: itemName(chosen.item), who: me?.actor ?? 0, now });
            void run({ kind: 'npcSocial', npc, op: 'gift', item: chosen.item, ...(chosen.q ? { q: chosen.q } : {}) }, [line]).then(() => notify(`${info.name}: ${line}`));
          }}
        >
          {row.gifted ? '오늘 선물 완료' : '건네기'}
        </GameButton>
      </div>
    </Modal>
  );
}
