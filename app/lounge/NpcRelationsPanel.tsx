'use client';
// 주민 수첩: every resident, where they are right now ("신짜장 · 항구로 배달
// 중"), my points with them, gifts they like, and what I can do here. Talking
// and giving only work where they are (the server checks the same rule with
// npcSpot); invitations and dates happen in my own room.
import { useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { itemName } from '../lounge-life-plus';
import { NPCS, NPC_IDS, NPC_INVITE_POINTS, NPC_DATE_POINTS, NPC_POINTS_MAX, assertNpcSocialContext, npcGiftReaction, npcReply, type NpcId, type NpcSocialAction, type NpcRelations } from '../lounge-romance';
import { NPC_REGULAR_POINTS, NPC_SPECIAL_POINTS } from '../lounge-npc-data';
import { npcSpot } from '../lounge-npc-schedule';
import { npcGiftLine, npcTalk, npcVisitLine } from '../lounge-npc-dialog';
import { ACTORS } from '../lounge-roster';
import { GameButton } from '../ui/GameButton';
import { Modal } from './Modal';
import { ItemIcon } from './ItemIcon';
import { NpcPortrait } from './NpcPortrait';
import { giftOptions } from './npc-gifts';
import type { Notify } from './Toast';
import { useNow } from './use-now';
import './npc-relations.css';

const REACTION_WORD = { loved: '아주 좋아해요', liked: '좋아해요', neutral: '무난해요', disliked: '싫어해요' } as const;

export function NpcRelationsPanel({ room, view, notify, onClose, initial }: {
  room: CloudRoom; view: CloudRoomView; notify: Notify; onClose: () => void;
  /** Open on this resident (from a talk in the world). */
  initial?: NpcId;
}) {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [selected, setSelected] = useState<NpcId>(initial ?? 'nasera');
  const [giftKey, setGiftKey] = useState('');
  const [reply, setReply] = useState<Partial<Record<NpcId, string[]>>>({});
  const now = useNow(true, 1000) + view.clockOffset;
  const me = view.players.find((p) => p.id === view.self);
  const rows = view.life?.me.npcRelations ?? [];
  const byId = Object.fromEntries(rows.map((row) => [row.npc, row]));
  const relations: NpcRelations = byId;
  const gifts = giftOptions(view.life);
  const myName = me ? ACTORS[me.actor] ?? '친구' : '친구';
  const context = { area: me?.area ?? '', home: me?.home, actor: me?.actor ?? -1, fishing: !!view.life?.me.fishing.pending, x: me?.x, y: me?.y };
  const blocked = (action: NpcSocialAction) => {
    if (!me) return '마을에 연결되면 만날 수 있어요.';
    try { assertNpcSocialContext(action, relations, context, now); return ''; }
    catch (error) { return error instanceof Error ? error.message : '지금은 할 수 없어요.'; }
  };
  const run = async (action: NpcSocialAction, say: () => string[]) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const lines = say();
      if (await room.life(action)) {
        setReply((current) => ({ ...current, [action.npc]: lines }));
        notify(`${NPCS[action.npc].name}: ${lines[0] ?? npcReply(action.npc, action.op)}`);
      }
    } finally { busyRef.current = false; setBusy(false); }
  };
  const row = byId[selected] ?? { npc: selected, points: 0, level: '인사하는 사이', talked: false, gifted: false, dated: false, visiting: false };
  const info = NPCS[selected];
  const spot = npcSpot(selected, now);
  const visiting = (row.invitedUntil ?? 0) > now;
  const chosen = gifts.find((g) => g.key === giftKey) ?? gifts[0];
  const action = (op: 'talk' | 'date' | 'invite' | 'dismiss'): NpcSocialAction => ({ kind: 'npcSocial', npc: selected, op });
  const location = blocked(action('talk'));
  const who = me?.actor ?? 0;
  const talkLines = () => npcTalk({ npc: selected, me: myName, who, now, points: row.points, talkedToday: false, spot, lastGiftName: row.lastGift ? itemName(row.lastGift) : undefined }).lines;
  const button = (label: string, op: 'talk' | 'date' | 'invite' | 'dismiss', off = false) => (
    <GameButton
      disabled={busy || off || !!blocked(action(op))}
      title={blocked(action(op)) || undefined}
      onClick={() => void run(action(op), () => (op === 'talk' ? talkLines() : [npcVisitLine(selected, op, { me: myName, who, now })]))}
    >
      {label}
    </GameButton>
  );
  const reaction = chosen ? npcGiftReaction(selected, chosen.item, chosen.q) : null;
  const shown = reply[selected] ?? (visiting ? [npcVisitLine(selected, 'invite', { me: myName, who, now })] : row.talked ? [] : []);
  return (
    <Modal title="주민 수첩" wide onClose={onClose} className="l-npc-relations">
      <p>마을 주민 {NPC_IDS.length}명과의 사이예요. 일곱 친구와의 우정과 따로, 나만의 관계가 저장돼요. 이야기와 선물은 주민이 있는 곳에서 해요.</p>
      <div className="l-npc-book" aria-busy={busy}>
        <ul className="l-npc-list" aria-label="주민 목록">
          {NPC_IDS.map((id) => {
            const r = byId[id];
            const s = npcSpot(id, now);
            return (
              <li key={id}>
                <button type="button" className="l-npc-row" aria-pressed={id === selected} onClick={() => setSelected(id)} data-testid={`npc-${id}`}>
                  <NpcPortrait npc={id} />
                  <span>
                    <strong>{NPCS[id].name}</strong>
                    <small>{s.label}</small>
                  </span>
                  <em>{r?.points ?? 0}</em>
                </button>
              </li>
            );
          })}
        </ul>
        <article className="l-npc-card" data-testid={`npc-card-${selected}`}>
          <header>
            <NpcPortrait npc={selected} mood={visiting ? 'smile' : 'calm'} className="is-large" />
            <div>
              <h3>{info.name} <small>{info.age}세 · {info.role}</small></h3>
              <p>{visiting ? `내 방에 방문 중 · ${Math.max(1, Math.ceil(((row.invitedUntil ?? now) - now) / 60000))}분 남음` : `지금 · ${spot.label}`}</p>
            </div>
          </header>
          <p>{info.intro}</p>
          <label className="l-npc-progress">{row.level} <strong>{row.points}/{NPC_POINTS_MAX}</strong><progress max={NPC_POINTS_MAX} value={row.points} aria-label={`${info.name} 친밀도`} /></label>
          <small>좋아하는 것: {info.likesText} · 싫어하는 것: {info.dislikesText}</small>
          <small>초대 {NPC_INVITE_POINTS} · 단골 선물 {NPC_REGULAR_POINTS} · 데이트 {NPC_DATE_POINTS} · 특별한 선물 {NPC_SPECIAL_POINTS}{row.lastGift ? ` · 지난 선물: ${itemName(row.lastGift)}` : ''}</small>
          {shown.length > 0 && <blockquote aria-live="polite">{shown.map((line, i) => <span key={i}>{line}</span>)}</blockquote>}
          {location && <p className="l-npc-location">{location}</p>}
          <div className="l-npc-actions">
            {button(row.talked ? '오늘 대화 완료' : '이야기 나누기 · +6', 'talk', row.talked)}
            {button(visiting ? '방문 중' : '내 방에 초대하기', 'invite', row.points < NPC_INVITE_POINTS || visiting)}
            {visiting && button('배웅하기', 'dismiss')}
            {button(row.dated ? '오늘 데이트 완료' : '데이트 제안하기 · +10', 'date', row.points < NPC_DATE_POINTS || row.dated || !visiting)}
          </div>
          <div className="l-npc-gift">
            {chosen && <ItemIcon id={chosen.item} size={34} />}
            <label>선물 고르기<select value={chosen?.key ?? ''} onChange={(e) => setGiftKey(e.target.value)} disabled={busy || !gifts.length || row.gifted}>
              {!gifts.length && <option value="">주머니에 선물할 물건이 없어요</option>}
              {gifts.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
            </select></label>
            <GameButton
              disabled={busy || row.gifted || !chosen || !!location}
              onClick={() => chosen && void run({ kind: 'npcSocial', npc: selected, op: 'gift', item: chosen.item, ...(chosen.q ? { q: chosen.q } : {}) }, () => [npcGiftLine(selected, npcGiftReaction(selected, chosen.item, chosen.q), { me: myName, item: itemName(chosen.item), who, now })])}
            >
              {row.gifted ? '오늘 선물 완료' : '1개 선물하기'}
            </GameButton>
          </div>
          <small>{reaction && chosen ? `${itemName(chosen.item)}: ${REACTION_WORD[reaction]}` : '대화·선물·데이트는 하루 한 번씩'} · {row.dates ?? 0}번의 데이트</small>
        </article>
      </div>
    </Modal>
  );
}
