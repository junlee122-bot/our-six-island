'use client';
// 동행 대화 (design-npc-companion.md 결정됨): E beside the resident walking
// with me opens this instead of their usual talk box. One line at a time from
// their companion file (lounge-npc-companion-lines.ts companionTalk): a
// one-off moment when one is due (the server notes it so it is never said
// again), otherwise where we are, what I just did, the time or the weather,
// our small talk, a suggestion toward a nearby spot, a word about a friend
// nearby, the love lines with a partner. Then: talk more, their usual talk
// box (gifts, the notebook), 보내기, or leave.
import { useEffect, useRef, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { NPCS, type NpcId } from '../lounge-npc-data';
import { npcHearts } from '../lounge-npc-speech';
import { companionAcceptLine, companionTalk, type CompanionTalkLine } from '../lounge-npc-companion-lines';
import type { CompanionActivity, CompanionReact } from '../lounge-npc-companion-line-types';
import { COMPANION_EFFECTS } from '../lounge-companion-data';
import { VILLAGE_DISTRICTS } from '../lounge-village-layout';
import { ACTORS } from '../lounge-roster';
import { josa } from '../lounge-text';
import { NpcFigure } from './NpcPortrait';
import { SpeechBox } from './SpeechBox';
import './npc-relations.css';

const ACTIVITY_OF: Record<CompanionReact, CompanionActivity | null> = {
  bite: 'fish',
  bigFish: 'fish',
  treasure: 'fish',
  harvest: 'farm',
  goldStar: 'farm',
  mineFloor: 'mine',
  cook: 'cook',
  idle: null,
};
const DISTRICT_NAME: Record<string, string> = Object.fromEntries(VILLAGE_DISTRICTS.map((d) => [d.id, d.name]));
/** An outing this fresh opens with their accept line. */
const ACCEPT_FRESH_MS = 20_000;
/** Presses of E this outing (the talk walks through its kinds), per outing. */
const turns = new Map<string, number>();

export function CompanionTalk({ npc, room, view, onClose, onUsual }: {
  npc: NpcId;
  room: CloudRoom;
  view: CloudRoomView;
  onClose: () => void;
  /** Their usual talk box (gifts, 주민 수첩, today's talk). */
  onUsual: () => void;
}) {
  const me = view.players.find((p) => p.id === view.self);
  const myName = me ? ACTORS[me.actor] ?? '친구' : '친구';
  const c = view.life?.companion?.me;
  const out = c?.out;
  const row = view.life?.me.npcRelations.find((r) => r.npc === npc);
  const outing = `${npc}:${out?.at ?? 0}`;
  // A friend within a few steps (the {friend} lines).
  const friend = view.players.find((p) => p.id !== view.self && me && p.area === me.area && Math.hypot(p.x - me.x, p.y - me.y) < 12);
  const spawn = view.life?.me.spawns.find((s) => s.kind === 'forage' && !s.taken);
  const lineAt = (turn: number, at: number, said: readonly string[]): CompanionTalkLine =>
    companionTalk({
      npc,
      me: myName,
      actor: me?.actor ?? 0,
      now: at,
      area: me?.area,
      activity: c?.ev ? ACTIVITY_OF[c.ev.k] : null,
      love: !!row?.love,
      lowMood: (view.life?.mood?.xp ?? 1) < 1,
      said,
      pend: c?.pend ?? [],
      friend: friend ? ACTORS[friend.actor] : undefined,
      forageSpot: me?.area === 'village' && spawn ? DISTRICT_NAME[spawn.district] : undefined,
      turn,
    });
  /** The next line; a one-off moment is added to what was said (the effect below tells the server). */
  const nextTalk = (said: readonly string[]) => {
    const turn = (turns.get(outing) ?? 0) + 1;
    turns.set(outing, turn);
    const at = Date.now() + view.clockOffset;
    // Just said yes (the talk box hands over to this one): their accept line first.
    if (turn === 1 && out && at - out.at < ACCEPT_FRESH_MS)
      return { pages: [companionAcceptLine(npc, { first: !!out.f, love: !!row?.love, me: myName, now: out.at })], moment: null, said: [...said] };
    const line = lineAt(turn, at, said);
    return { pages: [line.text], moment: line.moment ?? null, said: line.moment ? [...said, `${npc}:${line.moment}`] : [...said] };
  };
  const [talk, setTalk] = useState(() => nextTalk(c?.said ?? []));
  const pages = talk.pages;
  // A one-off moment: the server notes it (it checks it is really due), once.
  const told = useRef(new Set<string>());
  useEffect(() => {
    if (!talk.moment || told.current.has(talk.moment)) return;
    told.current.add(talk.moment);
    void room.life({ kind: 'companion', op: 'moment', moment: talk.moment });
  }, [talk.moment, room]);
  const [busy, setBusy] = useState(false);
  const info = NPCS[npc];
  const choices = [
    { label: '또 이야기하기', kind: 'talk', testId: 'companion-choice-more' },
    { label: '평소처럼 이야기하기 (선물·수첩)', kind: 'book', testId: 'companion-choice-usual' },
    { label: '보내기', kind: 'request', disabled: busy, testId: 'companion-choice-dismiss' },
    { label: '그만 가기', kind: 'bye', testId: 'companion-choice-bye' },
  ];
  const choose = async (i: number) => {
    if (i === 0) setTalk(nextTalk(talk.said));
    else if (i === 1) onUsual();
    else if (i === 2) {
      if (busy) return;
      setBusy(true);
      const ok = await room.life({ kind: 'companion', op: 'dismiss' });
      setBusy(false);
      // Their parting line comes as the HUD's toast; the box closes.
      if (ok) onClose();
    } else onClose();
  };
  return (
    <SpeechBox
      label={`${josa(info.name, '과/와')} 동행 이야기`}
      testId="companion-dialog"
      textTestId="companion-dialog-text"
      portrait={<NpcFigure npc={npc} mood="smile" />}
      tall
      name={info.name}
      hearts={npcHearts(row?.points ?? 0)}
      level={out ? '같이 다니는 중' : '동행 끝'}
      status={`${COMPANION_EFFECTS[npc].activity}에 함께`}
      pages={pages}
      page={0}
      choices={out ? choices : [choices[3]]}
      choicesLabel="할 일 고르기"
      onChoose={(i) => void choose(out ? i : 3)}
      onNext={() => {}}
      onClose={onClose}
    />
  );
}
