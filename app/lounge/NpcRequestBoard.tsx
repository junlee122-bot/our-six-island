'use client';
// 의뢰 게시판 in 시장 거리: today's two or three requests from the residents
// (lounge-npc-requests.ts). Handing one in takes the items and pays 범 (with a
// daily cap), points with the resident and sometimes a present; finishing one a
// friend already finished today adds a small co-op bonus.
import { useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { itemName } from '../lounge-life-plus';
import { NPCS } from '../lounge-npc-data';
import { npcRequestLine } from '../lounge-npc-dialog';
import { NPC_REQUEST_COOP_POINTS, type NpcRequestView } from '../lounge-npc-requests';
import { formatBeom } from '../lounge-text';
import { GameButton } from '../ui/GameButton';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from './Modal';
import { ItemIcon } from './ItemIcon';
import { NpcPortrait } from './NpcPortrait';
import type { Notify } from './Toast';
import './npc-relations.css';

const KIND_WORD = { gather: '작물', fish: '낚시', cook: '요리', deliver: '채집' } as const;

export function NpcRequestBoard({ room, view, notify, onClose }: { room: CloudRoom; view: CloudRoomView; notify: Notify; onClose: () => void }) {
  const board = view.life?.me.npcBoard;
  const me = view.players.find((p) => p.id === view.self);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const have = (r: NpcRequestView) => {
    const life = view.life;
    if (!life) return 0;
    const crop = life.me.bag.produce as Record<string, number | undefined>;
    return r.item in crop ? (crop[r.item] ?? 0) : r.item === 'fruit' ? life.me.bag.fruit : (life.me.inv[r.item] ?? 0);
  };
  const hand = async (r: NpcRequestView) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (await room.life({ kind: 'npcRequest', id: r.id }))
        notify(`${NPCS[r.npc].name}: ${npcRequestLine(r.npc, r.friends ? 'coop' : 'done', { item: itemName(r.item), n: r.n, key: r.id })}`);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const here = me?.area === 'market';
  return (
    <Modal title="의뢰 게시판" wide onClose={onClose} className="l-npc-board">
      <p>
        시장 거리 주민들이 오늘 붙인 부탁이에요. 끝내면 범과 친밀도를 받아요. 오늘 받은 의뢰 범 {formatBeom(board?.beomToday ?? 0)} / {formatBeom(board?.beomCap ?? 0)}.
      </p>
      {!board?.requests.length ? (
        <EmptyState glyph="news" title="오늘은 붙은 의뢰가 없어요" />
      ) : (
        <ul className="l-npc-requests">
          {board.requests.map((r) => {
            const n = have(r);
            return (
              <li key={r.id} className="l-npc-request" data-done={r.done || undefined} data-testid={`npc-request-${r.id}`}>
                <NpcPortrait npc={r.npc} />
                <div>
                  <strong>
                    {NPCS[r.npc].name} <small>{KIND_WORD[r.kind]}</small>
                  </strong>
                  <p>{npcRequestLine(r.npc, 'post', { item: itemName(r.item), n: r.n, key: r.id })}</p>
                  <small>
                    <ItemIcon id={r.item} size={20} /> {itemName(r.item)} {Math.min(n, r.n)}/{r.n} · {formatBeom(r.beom)} · 친밀도 +{r.points}
                    {r.bonus ? ` · ${itemName(r.bonus[0])} ${r.bonus[1]}개` : ''}
                    {r.friends ? ` · 친구 ${r.friends}명이 해결 · 같이 하면 +${NPC_REQUEST_COOP_POINTS}` : ''}
                  </small>
                </div>
                <GameButton disabled={busy || r.done || n < r.n || !here} title={!here ? '시장 거리 게시판 앞에서 전해요' : undefined} onClick={() => void hand(r)}>
                  {r.done ? '완료' : n < r.n ? '모자라요' : '전하기'}
                </GameButton>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
