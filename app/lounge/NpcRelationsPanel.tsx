'use client';
import { useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { DealerAvatar } from '../lounge-dealer-host';
import { itemName } from '../lounge-life-plus';
import { NPCS, NPC_INVITE_POINTS, NPC_DATE_POINTS, NPC_POINTS_MAX, assertNpcSocialContext, npcGiftable, npcReply, type NpcId, type NpcSocialAction, type NpcRelations } from '../lounge-romance';
import { GameButton } from '../ui/GameButton';
import { Modal } from './Modal';
import { ItemIcon } from './ItemIcon';
import type { Notify } from './Toast';
import { useNow } from './use-now';
import './npc-relations.css';

export function NpcRelationsPanel({ room, view, notify, onClose }: {
  room: CloudRoom; view: CloudRoomView; notify: Notify; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [gifts, setGifts] = useState<Record<NpcId, string>>({ lumi: '', maehwa: '' });
  const [reply, setReply] = useState<Partial<Record<NpcId, string>>>({});
  const now = useNow(true, 1000) + view.clockOffset;
  const me = view.players.find((p) => p.id === view.self);
  const rows = view.life?.me.npcRelations ?? [];
  const relations: NpcRelations = Object.fromEntries(rows.map((row) => [row.npc, row]));
  const inventory = Object.entries(view.life?.me.inv ?? {}).filter(([id, n]) => n > 0 && npcGiftable(id));
  const context = { area: me?.area ?? '', home: me?.home, actor: me?.actor ?? -1, fishing: !!view.life?.me.fishing.pending };
  const blocked = (action: NpcSocialAction) => {
    if (!me) return '마을에 연결되면 만날 수 있어요.';
    try { assertNpcSocialContext(action, relations, context, now); return ''; }
    catch (error) { return error instanceof Error ? error.message : '지금은 할 수 없어요.'; }
  };
  const run = async (action: NpcSocialAction) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (await room.life(action)) {
        const line = npcReply(action.npc, action.op);
        setReply((current) => ({ ...current, [action.npc]: line }));
        notify(`${NPCS[action.npc].name}: ${line}`);
      }
    } finally { busyRef.current = false; setBusy(false); }
  };
  return <Modal title="마을 주민과의 인연" wide onClose={onClose} className="l-npc-relations">
    <p>루미와 매화는 마을의 성인 NPC예요. 일곱 친구와의 우정과 별도로, 나만의 관계가 저장돼요.</p>
    <div className="l-npc-cards" aria-busy={busy}>
      {!rows.length && <p role="status">주민 수첩을 불러오는 중이에요.</p>}
      {rows.map((row) => {
        const info = NPCS[row.npc];
        const visiting = (row.invitedUntil ?? 0) > now;
        const chosen = inventory.some(([id]) => id === gifts[row.npc]) ? gifts[row.npc] : inventory[0]?.[0] ?? '';
        const action = (op: 'talk' | 'date' | 'invite' | 'dismiss'): NpcSocialAction => ({ kind: 'npcSocial', npc: row.npc, op });
        const location = blocked(action('talk'));
        const button = (label: string, op: 'talk' | 'date' | 'invite' | 'dismiss', off = false) => <GameButton disabled={busy || off || !!blocked(action(op))} title={blocked(action(op)) || undefined} onClick={() => void run(action(op))}>{label}</GameButton>;
        return <article className="l-npc-card" key={row.npc} data-testid={`npc-${row.npc}`}>
          <header><DealerAvatar host={row.npc} mood={visiting ? 'smile' : 'calm'} /><div><h3>{info.name} <small>{info.age}세 · NPC</small></h3><p>{visiting ? `내 방에 방문 중 · ${Math.max(1, Math.ceil(((row.invitedUntil ?? now) - now) / 60000))}분 남음` : info.place}</p></div></header>
          <p>{info.intro}</p>
          <label className="l-npc-progress">{row.level} <strong>{row.points}/{NPC_POINTS_MAX}</strong><progress max={NPC_POINTS_MAX} value={row.points} aria-label={`${info.name} 친밀도`} /></label>
          <small>좋아하는 선물: {info.likes} · 초대 {NPC_INVITE_POINTS} · 데이트 {NPC_DATE_POINTS}</small>
          <blockquote aria-live="polite">{reply[row.npc] ?? (visiting ? '편하게 이야기 나누자. 네 방이 참 아늑하네.' : '반가워! 시간 날 때 잠깐 이야기할래?')}</blockquote>
          {location && <p className="l-npc-location">{location}</p>}
          <div className="l-npc-actions">
            {button(row.talked ? '오늘 대화 완료' : '이야기 나누기 · +6', 'talk', row.talked)}
            {button(visiting ? '방문 중' : '내 방에 초대하기', 'invite', row.points < NPC_INVITE_POINTS || visiting)}
            {visiting && button('배웅하기', 'dismiss')}
            {button(row.dated ? '오늘 데이트 완료' : '데이트 제안하기 · +10', 'date', row.points < NPC_DATE_POINTS || row.dated || !visiting)}
          </div>
          <div className="l-npc-gift">
            {chosen && <ItemIcon id={chosen} size={34} />}
            <label>선물 고르기<select value={chosen} onChange={(e) => setGifts((old) => ({ ...old, [row.npc]: e.target.value }))} disabled={busy || !inventory.length || row.gifted}>
              {!inventory.length && <option value="">주머니에 꽃이나 요리가 없어요</option>}
              {inventory.map(([id, n]) => <option key={id} value={id}>{itemName(id)} · {n}개</option>)}
            </select></label>
            <GameButton disabled={busy || row.gifted || !chosen || !!location} onClick={() => void run({ kind: 'npcSocial', npc: row.npc, op: 'gift', item: chosen })}>{row.gifted ? '오늘 선물 완료' : '1개 선물하기'}</GameButton>
          </div>
          <small>대화·선물·데이트는 하루 한 번씩 · 좋아하는 선물 +12, 다른 선물 +8 · {row.dates ?? 0}번의 데이트</small>
        </article>;
      })}
    </div>
  </Modal>;
}
