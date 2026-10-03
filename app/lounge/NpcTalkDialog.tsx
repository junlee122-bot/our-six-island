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
import { NPCS, assertNpcSocialContext, birthdayGiftOf, npcGiftReaction, spouseGiftOf, type NpcId, type NpcRelations, type NpcSocialAction } from '../lounge-romance';
import { NPC_TALK_POINTS, npcSpouseOf } from '../lounge-npc-data';
import { fillLoveLine, npcLoveLine, npcWeddingLines } from '../lounge-npc-love';
import { npcSpot } from '../lounge-npc-schedule';
import { npcBirthdayGiftLine } from '../lounge-npc-birthday';
import { npcGiftLine, npcTalk, npcTalkReply } from '../lounge-npc-dialog';
import { npcRequestsOn } from '../lounge-npc-requests';
import { npcHearts, npcLoveChoices, npcLoveRefusal, npcLoveStatus, npcLoveTalk, npcTalkChoices, npcTalkFocus, npcTalkStatus, type NpcLoveChoice } from '../lounge-npc-speech';
import { kstDay } from '../lounge-economy';
import { ACTORS } from '../lounge-roster';
import { actionForCode } from '../lounge-keybinds';
import { getSettings } from '../lounge-settings';
import { formatBeom, josa } from '../lounge-text';
import { MessageCircle } from '../ui/icons';
import { ItemIcon } from './ItemIcon';
import { NpcFigure } from './NpcPortrait';
import { SpeechBox } from './SpeechBox';
import { giftOptions, type GiftOption } from './npc-gifts';
import { useNow } from './use-now';
import { PILL_PRICE, PILL_SELLERS, VOYAGE_LINES } from '../lounge-voyage-data';
import { isNpcId } from '../lounge-npc-data';
import { npcJoinLines, npcSocialExchange, npcSocialOf, type NpcSaid } from '../lounge-npc-social';
import { npcRecentKinds } from '../lounge-npc-recent';
import { NPC_TIE_KEYS, pairKey } from '../lounge-npc-social-ties';
import { COMPANION_REJECT, companionWhyNot, companionWhyShort } from '../lounge-companion';
import { companionBusyLine } from '../lounge-npc-companion-lines';
import './npc-relations.css';

export function NpcTalkDialog({ npc, room, view, onClose, onBook, onBoard, shop }: {
  npc: NpcId;
  room: CloudRoom;
  view: CloudRoomView;
  onClose: () => void;
  /** Opens the residents' notebook on this resident. */
  onBook: () => void;
  /** Opens the request board (when they have a request today). */
  onBoard?: () => void;
  /** Their counter opened from the talk (label and opener), e.g. 신이치's 운세 보기. */
  shop?: { label: string; open: () => void };
}) {
  const now = useNow(true, 5000) + view.clockOffset;
  const [opened] = useState(() => Date.now() + view.clockOffset);
  const me = view.players.find((p) => p.id === view.self);
  const myName = me ? ACTORS[me.actor] ?? '친구' : '친구';
  const who = me?.actor ?? 0;
  const rows = view.life?.me.npcRelations ?? [];
  const row = rows.find((r) => r.npc === npc) ?? { npc, points: 0, talked: false, gifted: false, level: '인사하는 사이', lastGift: undefined, love: undefined, since: undefined, weddingDay: undefined };
  const today = kstDay(now);
  const loveTalk = npcLoveTalk(rows, npc, kstDay(opened));
  const relations: NpcRelations = Object.fromEntries(rows.map((r) => [r.npc, r]));
  const spot = npcSpot(npc, opened);
  const lastGiftName = row.lastGift ? itemName(row.lastGift) : undefined;
  // What I did lately that they may bring up (lounge-npc-recent.ts).
  const recent = npcRecentKinds({
    now: opened,
    actor: who,
    fished: view.life?.angling?.me.last,
    voyage: view.life?.voyage,
    stocks: view.stocks?.me,
    tables: view.tableStats?.week,
    museum: view.life?.museum,
  });
  // 생일 잔치: on my birthday every resident opens with a birthday line.
  const birthday = !!view.life?.birthday?.today.includes(who);
  // Pages: their lines, then (after a talk or a gift) what they answer.
  const [pages, setPages] = useState(() => npcTalk({ npc, me: myName, who, now: opened, points: row.points, talkedToday: row.talked, spot, lastGiftName, recent, birthday, ...loveTalk }).lines);
  const [page, setPage] = useState(0);
  // Everything said so far, so the talk's answer never repeats a page.
  const said = useRef(pages);
  const [picking, setPicking] = useState(false);
  const [focusAfter, setFocusAfter] = useState<'open' | 'reply' | 'picker'>('open');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const gifts = giftOptions(view.life);
  const context = { area: me?.area ?? '', home: me?.home, actor: me?.actor ?? -1, fishing: !!view.life?.me.fishing.pending, x: me?.x, y: me?.y, companion: view.life?.companion?.me.out?.npc ?? null };
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
  const inv = view.life?.me.inv ?? {};
  const love = npcLoveChoices({ npc, rows, day: today, bouquets: inv.bouquet ?? 0, rings: inv['pledge-ring'] ?? 0, area: me?.area ?? '', birthday });
  // 주민끼리 어울리기: they are with another resident right now (lounge-npc-social.ts).
  const meeting = npcSocialOf(npc, now);
  const otherId = meeting ? (meeting.a === npc ? meeting.b : meeting.a) : null;
  const joinAction: NpcSocialAction | null = otherId ? { kind: 'npcSocial', npc, op: 'join', with: otherId } : null;
  const otherJoined = otherId ? rows.find((r) => r.npc === otherId)?.joinedDay === today : false;
  // 주민 동행: "같이 다닐래요?" with why not (hearts, their shop, another friend, my own companion).
  const companions = view.life?.companion;
  const holderUid = Object.entries(companions?.all ?? {}).find(([uid, c]) => c.npc === npc && uid !== view.self)?.[0];
  const holder = holderUid ? ACTORS[companions!.all[holderUid].actor] ?? '친구' : null;
  const mine = companions?.me.out?.npc ?? null;
  const flags = view.life?.flags ?? [];
  const companionWhy = companions
    ? companionWhyNot({ npc, points: row.points, mine, holder, now, world: { hill: flags.includes('district-hillside'), ranch: flags.includes('district-ranch'), foothill: flags.includes('district-foothill') } })
    : '';
  const choices = npcTalkChoices({
    talked: row.talked,
    gifted: row.gifted,
    busy,
    blocked: talkBlock,
    request: request && !requestDone && onBoard ? `${itemName(request.item)} ${request.n}개` : null,
    love,
    shop: shop?.label ?? null,
    // 먼바다 낚싯배: 츠나데 (텃밭) and 메르시 (inside her 의원) sell the 멀미약 where they work.
    social: otherId && joinAction
      ? { other: josa(NPCS[otherId].name, '과/와'), joined: (row as { joinedDay?: number }).joinedDay === today && otherJoined, joinOff: blocked(joinAction) }
      : null,
    companion: companions ? { why: companionWhyShort(companionWhy, npc, holder) } : null,
    pill:
      PILL_SELLERS.some((p) => p.npc === npc && isNpcId(p.npc) && (me?.area ?? '') === p.area) ? `멀미약 사기 · ${formatBeom(PILL_PRICE)}` : null,
  });
  const buyPill = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (await room.life({ kind: 'pillBuy', from: npc })) {
        const lines = (VOYAGE_LINES as Record<string, { pill?: readonly string[] }>)[npc]?.pill ?? ['멀미약이에요. 배 타기 전에 드세요.'];
        const line = lines[today % lines.length];
        said.current = [...said.current, line];
        setPages([line]);
        setPage(0);
        setFocusAfter('reply');
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const talk = () => {
    const reply = npcTalkReply({ npc, me: myName, who, now, points: row.points + NPC_TALK_POINTS, spot, lastGiftName, recent, ...loveTalk }, said.current);
    void run(talkAction, [reply]);
  };
  const say = (line: string, vars: Record<string, string | number> = {}) => fillLoveLine(line, { me: myName, ...vars }, npc);
  // Their answer to a 꽃다발 or a ring shows either way; only a yes goes to the server (and takes the item).
  const answer = (lines: string[]) => {
    said.current = [...said.current, ...lines];
    setPages(lines);
    setPage(0);
    setFocusAfter('reply');
  };
  const takenBy = view.life?.npcSpouses?.[npc];
  const loveKey = `${who}:${today}`;
  const doLove = (id: NpcLoveChoice) => {
    if (busy) return;
    const op: NpcSocialAction = { kind: 'npcSocial', npc, op: id };
    // 신형만 · 봉미선 are married to each other: they turn it down (no server call, the item stays).
    if ((id === 'ask' || id === 'propose') && npcSpouseOf(npc)) return answer([say(npcLoveLine(npc, id === 'ask' ? 'ask-decline' : 'propose-decline', loveKey))]);
    if (id === 'ask' || id === 'propose') {
      const coolUntil = Math.max(0, ...rows.map((r) => r.coolUntil ?? 0));
      const refusal = npcLoveRefusal({ op: id, points: row.points, since: row.since, day: today, coolUntil, takenByOther: takenBy !== undefined && takenBy !== who });
      if (refusal) return answer([say(npcLoveLine(npc, refusal, loveKey, myName))]);
      return void run(op, [say(npcLoveLine(npc, id === 'ask' ? 'ask-accept' : 'propose-accept', loveKey, myName))]);
    }
    if (id === 'wedding') return void run(op, npcWeddingLines(npc, myName).map((line) => say(line)));
    if (id === 'bdayGift') {
      const item = view.self ? birthdayGiftOf(npc, view.self, today) : '';
      return void run(op, [say(npcBirthdayGiftLine(npc, loveKey), { item: item ? itemName(item) : '' })]);
    }
    const item = view.self ? spouseGiftOf(npc, view.self, today) : '';
    return void run(op, [say(npcLoveLine(npc, 'gift', loveKey), { item: item ? itemName(item) : '' })]);
  };
  const give = (gift: GiftOption) => {
    if (busy || row.gifted || talkBlock) return;
    const reaction = npcGiftReaction(npc, gift.item, gift.q);
    const line = npcGiftLine(npc, reaction, { me: myName, item: itemName(gift.item), who, now });
    void run({ kind: 'npcSocial', npc, op: 'gift', item: gift.item, ...(gift.q ? { q: gift.q } : {}) }, [line]);
  };
  const spoken = (lines: readonly NpcSaid[]) => lines.map((l) => `${NPCS[l.who].name}: ${l.text}`);
  const overhear = () => {
    if (!meeting || !otherId) return;
    answer(spoken(npcSocialExchange(meeting)));
    // The server notes the pair on my 관계 page (same meeting and reach check as 끼어들기).
    const action: NpcSocialAction = { kind: 'npcSocial', npc, op: 'overhear', with: otherId };
    const key = pairKey(npc, otherId);
    if (NPC_TIE_KEYS.has(key) && !view.life?.me.npcTiesSeen?.includes(key) && !blocked(action)) void room.life(action);
  };
  const join = () => {
    if (!meeting || !otherId || !joinAction) return;
    void run(joinAction, spoken(npcJoinLines({ ...meeting, a: npc, b: otherId }, myName)));
  };
  const invite = () => {
    if (busyRef.current) return;
    // Not now: their answer says why (a shopkeeper in character, the rest plainly).
    if (companionWhy) return answer([companionWhy === COMPANION_REJECT.shop || companionWhy === COMPANION_REJECT.night ? companionBusyLine(npc, myName, now) : companionWhy]);
    busyRef.current = true;
    setBusy(true);
    // A yes: the companion talk takes over at once and opens with their accept line.
    void Promise.resolve(room.life({ kind: 'companion', op: 'invite', npc }))
      .finally(() => {
        busyRef.current = false;
        setBusy(false);
      });
  };
  const choose = (index: number) => {
    const choice = choices[index];
    if (!choice || choice.disabled) return;
    if (choice.id === 'companion') return invite();
    if (choice.id === 'talk') talk();
    else if (choice.id === 'gift') setPicking(true);
    else if (choice.id === 'overhear') overhear();
    else if (choice.id === 'join') join();
    else if (choice.id === 'ask' || choice.id === 'propose' || choice.id === 'wedding' || choice.id === 'homeGift' || choice.id === 'bdayGift') doLove(choice.id);
    else if (choice.id === 'book') onBook();
    else if (choice.id === 'request') onBoard?.();
    else if (choice.id === 'shop') shop?.open();
    else if (choice.id === 'pill') void buyPill();
    else onClose();
  };
  return (
    <SpeechBox
      label={`${josa(info.name, '과/와')} 이야기`}
      testId="npc-dialog"
      textTestId="npc-dialog-text"
      portrait={<NpcFigure npc={npc} mood="smile" />}
      tall
      name={info.name}
      hearts={npcHearts(row.points)}
      level={npcLoveStatus(row, today) ?? row.level}
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
                <span className="l-talk-item-name">{gift.name}</span>
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
 * focused button themselves; with nothing in the picker focused (after a
 * click on the text), E / Space / Enter only move to the first item, never
 * give. Esc closes the box like everywhere else.
 */
function pickerKeys(e: KeyboardEvent<HTMLDialogElement>) {
  const box = e.currentTarget;
  const items = [...box.querySelectorAll<HTMLButtonElement>('.l-talk-item')];
  const back = box.querySelector<HTMLButtonElement>('.l-talk-back');
  const all = back ? [...items, back] : items;
  if (!all.length) return false;
  const at = all.findIndex((b) => b === document.activeElement);
  const press = e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter';
  if (actionForCode(getSettings().keys, e.code) === 'action' || (press && at < 0)) {
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
