'use client';
// Talking to a resident where they stand (E next to them in the hub, in
// 시장 거리 or the tavern), in the same speech box as a resting friend
// (SpeechBox.tsx). Their lines come from their dialogue file
// (lounge-npc-dialog.ts, the same on every screen), page by page; then the
// choices: talk (once a day), a gift (an item picker inside the box, then
// their reaction as the next page), 주민 수첩, today's request, leave. Talks
// and gifts go through the server like the notebook (the server checks they
// are really here). What the box shows is in lounge-npc-speech.ts.
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { itemName } from '../lounge-life-plus';
import { NPCS, assertNpcSocialContext, npcGiftReaction, type NpcId, type NpcRelations, type NpcSocialAction } from '../lounge-romance';
import { NPC_TALK_POINTS } from '../lounge-npc-data';
import { npcSpot } from '../lounge-npc-schedule';
import { npcGiftLine, npcTalk, npcTalkReply } from '../lounge-npc-dialog';
import { npcRequestsOn } from '../lounge-npc-requests';
import { npcHearts, npcTalkChoices, npcTalkFocus, npcTalkStatus } from '../lounge-npc-speech';
import { kstDay } from '../lounge-economy';
import { ACTORS } from '../lounge-roster';
import { actionForCode } from '../lounge-keybinds';
import { getSettings } from '../lounge-settings';
import { josa } from '../lounge-text';
import { MessageCircle } from '../ui/icons';
import { ItemIcon } from './ItemIcon';
import { NpcPortrait } from './NpcPortrait';
import { SpeechBox } from './SpeechBox';
import { giftOptions, type GiftOption } from './npc-gifts';
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
  const who = me?.actor ?? 0;
  const rows = view.life?.me.npcRelations ?? [];
  const row = rows.find((r) => r.npc === npc) ?? { npc, points: 0, talked: false, gifted: false, level: '인사하는 사이', lastGift: undefined };
  const relations: NpcRelations = Object.fromEntries(rows.map((r) => [r.npc, r]));
  const spot = npcSpot(npc, opened);
  const lastGiftName = row.lastGift ? itemName(row.lastGift) : undefined;
  // Pages: their lines, then (after a talk or a gift) what they answer.
  const [pages, setPages] = useState(() => npcTalk({ npc, me: myName, who, now: opened, points: row.points, talkedToday: row.talked, spot, lastGiftName }).lines);
  const [page, setPage] = useState(0);
  // Everything said so far, so the talk's answer never repeats a page.
  const said = useRef(pages);
  const [picking, setPicking] = useState(false);
  const [focusAfter, setFocusAfter] = useState<'open' | 'reply' | 'picker'>('open');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const gifts = giftOptions(view.life);
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
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try {
      const ok = await room.life(action);
      if (ok) {
        said.current = [...said.current, ...say];
        setPages(say);
        setPage(0);
        setPicking(false);
        setFocusAfter('reply');
      }
      return ok;
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
  const choices = npcTalkChoices({
    talked: row.talked,
    gifted: row.gifted,
    busy,
    blocked: talkBlock,
    request: request && !requestDone && onBoard ? `${itemName(request.item)} ${request.n}개` : null,
  });
  const talk = () => {
    const reply = npcTalkReply({ npc, me: myName, who, now, points: row.points + NPC_TALK_POINTS, spot, lastGiftName }, said.current);
    void run(talkAction, [reply]);
  };
  const give = (gift: GiftOption) => {
    if (busy || row.gifted || talkBlock) return;
    const reaction = npcGiftReaction(npc, gift.item, gift.q);
    const line = npcGiftLine(npc, reaction, { me: myName, item: itemName(gift.item), who, now });
    void run({ kind: 'npcSocial', npc, op: 'gift', item: gift.item, ...(gift.q ? { q: gift.q } : {}) }, [line]).then((ok) => {
      if (ok) notify(`${info.name}: ${line}`);
    });
  };
  const choose = (index: number) => {
    const choice = choices[index];
    if (!choice || choice.disabled) return;
    if (choice.id === 'talk') talk();
    else if (choice.id === 'gift') setPicking(true);
    else if (choice.id === 'book') onBook();
    else if (choice.id === 'request') onBoard?.();
    else onClose();
  };
  return (
    <SpeechBox
      label={`${josa(info.name, '과/와')} 이야기`}
      testId="npc-dialog"
      textTestId="npc-dialog-text"
      portrait={<NpcPortrait npc={npc} mood="smile" />}
      name={info.name}
      hearts={npcHearts(row.points)}
      level={row.level}
      status={npcTalkStatus(npc, spot)}
      pages={pages}
      page={page}
      choices={choices.map((c) => ({ label: c.label, kind: c.id, disabled: c.disabled, testId: `npc-choice-${c.id}` }))}
      choicesLabel="할 일 고르기"
      focusChoice={npcTalkFocus(choices, focusAfter)}
      note={talkBlock}
      onChoose={choose}
      onNext={() => setPage((p) => Math.min(p + 1, pages.length - 1))}
      onClose={onClose}
      onKeys={pickerKeys}
    >
      {picking && (
        <GiftPicker
          gifts={gifts}
          off={busy || row.gifted || !!talkBlock}
          onGive={give}
          onBack={() => {
            setPicking(false);
            setFocusAfter('picker');
          }}
        />
      )}
    </SpeechBox>
  );
}

/** Inside the box: what is in my bag that they could get (icon, name, count). */
function GiftPicker({ gifts, off, onGive, onBack }: { gifts: GiftOption[]; off: boolean; onGive: (gift: GiftOption) => void; onBack: () => void }) {
  const first = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const title = useId();
  useEffect(() => {
    (first.current ?? back.current)?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="l-talk-pick" data-testid="npc-gift-picker">
      <p className="l-talk-pick-title" id={title}>
        선물할 물건 고르기
      </p>
      {gifts.length ? (
        <ul className="l-talk-items" aria-labelledby={title}>
          {gifts.map((gift, i) => (
            <li key={gift.key}>
              <button
                type="button"
                ref={i === 0 ? first : undefined}
                className="l-talk-item"
                aria-disabled={off || undefined}
                onClick={() => {
                  if (!off) onGive(gift);
                }}
                data-testid={`npc-gift-${gift.key}`}
              >
                <ItemIcon id={gift.item} size={28} quality={gift.q || undefined} />
                <span>{gift.name}</span>
                <em>{gift.n}개</em>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="l-talk-empty">주머니에 선물할 물건이 없어요.</p>
      )}
      <div className="l-talk-pick-foot">
        <button type="button" ref={back} className="l-talk-back" onClick={onBack} data-testid="npc-gift-back">
          돌아가기
        </button>
        <p className="l-talk-hint">
          <MessageCircle size={13} aria-hidden="true" /> 방향키로 고르고 E·Space로 건네기
        </p>
      </div>
    </div>
  );
}

/**
 * Keys in the gift picker: arrows move over the grid (down from the last row
 * reaches "돌아가기"), E gives the focused item. Space / Enter press the
 * focused button themselves; Esc closes the box like everywhere else.
 */
function pickerKeys(e: KeyboardEvent<HTMLDialogElement>) {
  const box = e.currentTarget;
  const items = [...box.querySelectorAll<HTMLButtonElement>('.l-talk-item')];
  const back = box.querySelector<HTMLButtonElement>('.l-talk-back');
  const all = back ? [...items, back] : items;
  if (!all.length) return false;
  const at = all.findIndex((b) => b === document.activeElement);
  if (actionForCode(getSettings().keys, e.code) === 'action') {
    e.preventDefault();
    if (at >= 0) all[at].click();
    else all[0].focus();
    return true;
  }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return false;
  e.preventDefault();
  if (at < 0) {
    all[0].focus();
    return true;
  }
  const top = (b: HTMLElement) => Math.round(b.getBoundingClientRect().top);
  const cols = Math.max(1, items.filter((b) => top(b) === top(items[0])).length);
  const onBack = at === items.length;
  const lastRow = Math.floor((items.length - 1) / cols);
  let next: number;
  if (e.key === 'ArrowRight') next = (at + 1) % all.length;
  else if (e.key === 'ArrowLeft') next = (at - 1 + all.length) % all.length;
  else if (e.key === 'ArrowDown') {
    if (onBack) next = 0;
    else if (at + cols < items.length) next = at + cols;
    else if (Math.floor(at / cols) < lastRow) next = items.length - 1;
    else next = all.length - 1;
  } else if (onBack) next = Math.max(0, items.length - 1);
  else next = at - cols >= 0 ? at - cols : all.length - 1;
  all[next]?.focus();
  return true;
}
