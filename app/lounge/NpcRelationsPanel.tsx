'use client';
// 주민 수첩: every resident, where they are right now ("신짜장 · 항구로 배달
// 중"), my points with them, gifts they like, and what I can do here. Talking
// and giving only work where they are (the server checks the same rule with
// npcSpot); invitations and dates happen in my own room.
import { useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { itemName } from '../lounge-life-plus';
import { NPCS, NPC_IDS, NPC_INVITE_POINTS, NPC_DATE_POINTS, NPC_DATING_POINTS, NPC_PROPOSE_POINTS, NPC_DATING_DAYS, NPC_BREAKUP, NPC_DIVORCE, assertNpcSocialContext, npcGiftReaction, npcReply, spouseGiftOf, type NpcId, type NpcLove, type NpcSocialAction, type NpcRelations, type NpcRelationView } from '../lounge-romance';
import { fillLoveLine, npcLoveLine, npcWeddingLines } from '../lounge-npc-love';
import { npcLoveStatus, npcLoveTalk } from '../lounge-npc-speech';
import { kstDay } from '../lounge-economy';
import { josa } from '../lounge-text';
import { npcSpouseOf } from '../lounge-npc-data';
import { chapterLabel, chaptersDone, memoryLines, nextChapter, npcTalkBook } from '../lounge-npc-talk';
import { npcHearts } from '../lounge-npc-speech';
import { Hearts } from './Hearts';
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
import { NPC_FRIEND_TIES, npcTiesOf, npcTieWord, NPC_TIES } from '../lounge-npc-social-ties';
import { npcSocialOf, npcSulkingWith, NPC_SOCIAL_WORD } from '../lounge-npc-social';
import { npcTieKnown } from './npc-ties-seen';
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
  const [parting, setParting] = useState<NpcId | null>(null);
  const now = useNow(true, 1000) + view.clockOffset;
  const me = view.players.find((p) => p.id === view.self);
  const rows = view.life?.me.npcRelations ?? [];
  const byId = Object.fromEntries(rows.map((row) => [row.npc, row]));
  const relations: NpcRelations = byId;
  // 주민 관계도: the pairs I overheard or joined, kept with my account.
  const seenTies = new Set(view.life?.me.npcTiesSeen ?? []);
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
        setParting(null);
        notify(`${NPCS[action.npc].name}: ${lines[0] ?? npcReply(action.npc, action.op)}`);
      }
    } finally { busyRef.current = false; setBusy(false); }
  };
  const row = byId[selected] ?? { npc: selected, points: 0, level: '인사하는 사이', talked: false, gifted: false, dated: false, visiting: false };
  const info = NPCS[selected];
  const spot = npcSpot(selected, now);
  const visiting = (row.invitedUntil ?? 0) > now;
  const chosen = gifts.find((g) => g.key === giftKey) ?? gifts[0];
  const action = (op: Exclude<NpcSocialAction['op'], 'gift' | 'join' | 'overhear'>): NpcSocialAction => ({ kind: 'npcSocial', npc: selected, op });
  const location = blocked(action('talk'));
  const who = me?.actor ?? 0;
  const day = kstDay(now);
  const talkLines = () => npcTalk({ npc: selected, me: myName, who, now, points: row.points, talkedToday: false, spot, lastGiftName: row.lastGift ? itemName(row.lastGift) : undefined, ...npcLoveTalk(rows, selected, day) }).lines;
  // 연애·결혼 (handover/design/design-romance.md).
  const inv = view.life?.me.inv ?? {};
  const partner = rows.find((r) => r.love);
  const takenBy = view.life?.npcSpouses?.[selected];
  const taken = takenBy !== undefined && takenBy !== who;
  // 신형만 · 봉미선 are married to each other.
  const spouse = npcSpouseOf(selected);
  const wed = spouse ? `${josa(NPCS[spouse].name, '과/와')} 결혼한 사이예요.` : '';
  const loveSay = (line: string, vars: Record<string, string> = {}) => fillLoveLine(line, { me: myName, ...vars }, selected);
  const loveKey = `${who}:${day}`;
  const loveStatus = npcLoveStatus(row, day);
  const hasBook = !!npcTalkBook(selected);
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
                  <em>{storyShort(id, r)}</em>
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
          {loveStatus && <p className="l-npc-love" data-testid="npc-love-status">{loveStatus}</p>}
          <NpcTiesSection npc={selected} now={now} me={myName} seen={seenTies} points={(id) => byId[id]?.points ?? 0} onPick={setSelected} />
          <NpcStory npc={selected} row={row} inv={view.life?.me.inv ?? {}} />
          <small>좋아하는 것: {info.likesText} · 싫어하는 것: {info.dislikesText}</small>
          <small>친해지면 내 방에 초대하고, 더 가까워지면 데이트와 꽃다발을 건넬 수 있어요.{row.lastGift ? ` 지난 선물: ${itemName(row.lastGift)}` : ''}</small>
          {shown.length > 0 && <blockquote aria-live="polite">{shown.map((line, i) => <span key={i}>{line}</span>)}</blockquote>}
          {location && <p className="l-npc-location">{location}</p>}
          <div className="l-npc-actions">
            {/* A resident with a talk book is talked to where they stand (the choice talk). */}
            {button(hasBook ? '곁에서 말을 걸면 이야기해요' : row.talked ? '오늘 대화 완료' : '이야기 나누기', 'talk', row.talked || hasBook)}
            {button(visiting ? '방문 중' : '내 방에 초대하기', 'invite', row.points < NPC_INVITE_POINTS || visiting)}
            {visiting && button('배웅하기', 'dismiss')}
            {button(row.dated ? '오늘 데이트 완료' : '데이트 제안하기', 'date', row.points < NPC_DATE_POINTS || row.dated || !visiting)}
          </div>
          <NpcLoveActions
            love={row.love}
            parting={parting === selected}
            busy={busy}
            reasons={{
              ask: wed || (partner ? `${josa(NPCS[partner.npc].name, '과/와')} 함께하는 중이에요.` : taken ? '이미 다른 친구와 약속한 주민이에요.' : !inv.bouquet ? '꽃다발은 등불 잡화점에서 팔아요.' : row.points < NPC_DATING_POINTS ? '조금 더 가까워지면 꽃다발을 받아 줘요.' : blocked(action('ask'))),
              propose: wed || (taken ? '이미 다른 친구와 약속한 주민이에요.' : !inv['pledge-ring'] ? '청혼 반지는 등불 잡화점에서 팔아요.' : row.points < NPC_PROPOSE_POINTS ? '마음이 더 깊어지면 청혼할 수 있어요.' : day - (row.since ?? day) < NPC_DATING_DAYS ? `사귄 지 ${NPC_DATING_DAYS}일이 지나면 청혼할 수 있어요.` : blocked(action('propose'))),
              wedding: day < (row.weddingDay ?? day) ? `결혼식은 ${(row.weddingDay ?? day) - day}일 뒤예요.` : blocked(action('wedding')),
              homeGift: row.homeGifted ? '내일 아침에 또 챙겨 줘요.' : !row.atHome ? '배우자가 일하러 나갔어요. 밤이나 아침에 집에서 받아요.' : blocked(action('homeGift')),
              breakup: '',
            }}
            homeGifted={!!row.homeGifted}
            onPart={() => setParting(selected)}
            onLove={(op) => void run(action(op), () => {
              if (op === 'wedding') return npcWeddingLines(selected, myName).map((line) => loveSay(line));
              if (op === 'homeGift') return [loveSay(npcLoveLine(selected, 'gift', loveKey), { item: view.self ? itemName(spouseGiftOf(selected, view.self, day)) : '' })];
              return [loveSay(npcLoveLine(selected, op === 'ask' ? 'ask-accept' : op === 'propose' ? 'propose-accept' : 'breakup', loveKey, myName))];
            })}
          />
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

/** The list's small word: the chapter reached (a book), else the level ("단골"). */
function storyShort(npc: NpcId, r: { points: number; ch?: number; level?: string } | undefined) {
  const book = npcTalkBook(npc);
  if (!book) return r?.level ?? '인사하는 사이';
  const done = chaptersDone(book, r ?? { points: 0, ch: 0 });
  return done ? `이야기 ${done}장` : '이야기 전';
}

/**
 * 주민과 진짜 대화: "이야기 2장 · 뒷산의 노을", what opens the next chapter,
 * and the newest memories they keep of me. Hearts only under 자세히.
 */
function NpcStory({ npc, row, inv }: { npc: NpcId; row: NpcRelationView | { npc: NpcId; points: number; level: string }; inv: Record<string, number> }) {
  const book = npcTalkBook(npc);
  const hearts = (
    <details className="l-npc-details">
      <summary>자세히</summary>
      <span className="l-npc-hearts">
        {row.level} <Hearts level={npcHearts(row.points)} size={12} />
      </span>
    </details>
  );
  if (!book) return <section className="l-npc-story" data-testid="npc-story">{hearts}</section>;
  const label = chapterLabel(book, row);
  const next = nextChapter(book, row, (item) => inv[item] ?? 0);
  const memories = memoryLines(book, (row as { mem?: string[] }).mem, 3);
  return (
    <section className="l-npc-story" aria-label={`${josa(NPCS[npc].name, '과/와')}의 이야기`} data-testid="npc-story">
      <h4>{label ?? '아직 이야기 전'}</h4>
      {next.chapter && (
        <p className="l-npc-next">
          {next.open ? `다음 이야기 「${next.chapter.title}」. 곁에서 말을 걸면 들을 수 있어요.` : next.chapter.hint}
        </p>
      )}
      {!next.chapter && <p className="l-npc-next">함께한 이야기를 모두 봤어요.</p>}
      {memories.length > 0 && (
        <ul className="l-npc-memories" aria-label="기억하는 것">
          {memories.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
      {hearts}
    </section>
  );
}

type LoveOp = 'ask' | 'propose' | 'wedding' | 'homeGift' | 'breakup';
/** 연애·결혼 buttons of the notebook card; a disabled button says why in its tooltip. */
function NpcLoveActions({ love, parting, busy, reasons, homeGifted, onPart, onLove }: {
  love?: NpcLove; parting: boolean; busy: boolean; reasons: Record<LoveOp, string>; homeGifted: boolean;
  onPart: () => void; onLove: (op: LoveOp) => void;
}) {
  const button = (label: string, op: LoveOp) => (
    <GameButton disabled={busy || !!reasons[op]} title={reasons[op] || undefined} data-testid={`npc-love-${op}`} onClick={() => onLove(op)}>
      {label}
    </GameButton>
  );
  return (
    <>
      <div className="l-npc-actions" aria-label="연애와 결혼">
        {!love && button('꽃다발 건네기', 'ask')}
        {love === 'dating' && button('청혼 반지 건네기', 'propose')}
        {love === 'engaged' && button('결혼식 올리기', 'wedding')}
        {love === 'married' && button(homeGifted ? '오늘 아침 선물 받음' : '아침 선물 받기', 'homeGift')}
        {love && (parting
          ? button('정말 헤어지기', 'breakup')
          : <GameButton disabled={busy} onClick={onPart} data-testid="npc-love-part">{love === 'dating' ? '헤어지기' : love === 'engaged' ? '약혼 깨기' : '이혼하기'}</GameButton>)}
      </div>
      {parting && love && (
        <p className="l-npc-location">
          {love === 'dating'
            ? `헤어지면 사이가 꽤 멀어지고 ${NPC_BREAKUP.days}일 동안 꽃다발을 건넬 수 없어요.`
            : `사이가 많이 멀어지고 ${NPC_DIVORCE.days}일 동안 꽃다발을 건넬 수 없어요. 반지는 돌아오지 않아요.`}
        </p>
      )}
    </>
  );
}

/**
 * 관계: who this resident is to the others (lounge-npc-social-ties.ts). A tie
 * shows once found out (overheard or joined, or friends with either of them);
 * the rest are question marks. Today's quarrel or meeting is noted beside it.
 */
function NpcTiesSection({ npc, now, me, seen, points, onPick }: { npc: NpcId; now: number; me: string; seen: ReadonlySet<string>; points: (id: NpcId) => number; onPick: (id: NpcId) => void }) {
  const ties = npcTiesOf(npc);
  const known = ties.filter(({ other }) => npcTieKnown(npc, other, points, seen));
  const day = kstDay(now);
  const sulk = npcSulkingWith(npc, day);
  const meeting = npcSocialOf(npc, now);
  const friends = NPC_FRIEND_TIES.filter((t) => t.npc === npc);
  const allKnown = NPC_TIES.filter((t) => npcTieKnown(t.a, t.b, points, seen)).length;
  return (
    <section className="l-npc-ties" aria-label="주민 관계" data-testid="npc-ties">
      <h4>
        관계 <small>알아낸 관계 {known.length}/{ties.length} · 마을 전체 {allKnown}/{NPC_TIES.length}</small>
      </h4>
      <ul>
        {friends.map((t) => (
          <li key={t.friend} data-kind={t.kind} className={t.friend === me ? 'is-me' : undefined}>
            <strong>{t.friend}</strong>
            <em>언니</em>
            <span>{t.note}</span>
          </li>
        ))}
        {ties.map(({ other, tie }) =>
          known.some((k) => k.other === other) ? (
            <li key={other} data-kind={tie.kind}>
              <button type="button" className="l-npc-tie-name" onClick={() => onPick(other)}>
                {NPCS[other].name}
              </button>
              <em>{npcTieWord(tie, npc)}</em>
              <span>
                {tie.note}
                {sulk === other ? ' · 오늘은 서먹한 사이' : meeting && (meeting.a === other || meeting.b === other) ? ` · 지금 ${NPC_SOCIAL_WORD[meeting.kind]}` : ''}
              </span>
            </li>
          ) : (
            <li key={other} className="is-unknown">
              <strong>???</strong>
              <span>둘이 이야기하는 걸 엿듣거나, 둘 중 한 명과 친구가 되면 알 수 있어요.</span>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
