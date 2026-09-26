'use client';
// 파티 판 bar (side column of a no-범 table): the crops in my bag that do
// something at this table, one per round, and the table's party log. A peek
// (딸기) shows the card only to me; everyone reads that I peeked.
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { LOUNGE_ASSETS } from './lounge-assets';
import {
  PARTY_ITEMS,
  PARTY_ITEM_IDS,
  partyCount,
  type PartyItem,
} from './lounge-party';
import type { GameKind } from './lounge-games';
import type { CloudRoom, CloudRoomView } from './lounge-cloud-room';
import { useSecondsLeft } from './lounge-turn-timer';
import './lounge-party-bar.css';

export function PartyBar({
  kind,
  view,
  room,
  seat,
  names,
}: {
  kind: GameKind;
  view: CloudRoomView;
  room: CloudRoom;
  seat: number;
  names: string[];
}) {
  const [choose, setChoose] = useState<{ item: PartyItem; key: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const match = (kind === 'gostop' ? view.gostop : view[kind]) as
    | { id: string; turn?: number; rolls?: number; dice?: number[] }
    | null;
  const party = view.party?.[kind];
  const state = party && match && party.matchId === match.id ? party : undefined;
  const peek = state?.peek;
  const peekLeft = useSecondsLeft(peek?.until);
  if (!match) return null;
  const items = PARTY_ITEM_IDS.filter((i) => PARTY_ITEMS[i].games.includes(kind));
  const used = !!state?.used.includes(view.self);
  const bag = view.life?.me.bag;
  const key = `${match.id}:${(match as { revision?: number }).revision ?? ''}`;
  const use = async (item: PartyItem, extra: { target?: number; die?: number } = {}) => {
    if (busy) return;
    setBusy(true);
    try {
      await room.action({ kind: 'party', game: kind, id: match.id, item, ...extra });
      setChoose(null);
    } finally {
      setBusy(false);
    }
  };
  const opponents = names.map((n, i) => ({ n, i })).filter((o) => o.i !== seat);
  const dice = kind === 'yacht' ? (match.dice ?? []) : [];
  const myTurn =
    kind === 'chess'
      ? ((match as { moves?: unknown[] }).moves?.length ?? -1) % 2 === seat
      : match.turn === seat;
  const ready = (item: PartyItem) =>
    item === 'carrot' ? myTurn && (match.rolls ?? 0) > 0 : item === 'watermelon' ? kind === 'liar' || myTurn : true;
  return (
    <section className="l-party-bar" aria-label="파티 판" data-testid="party-bar">
      <h3>
        <Sparkles size={15} aria-hidden="true" /> 파티 판 · 작물 먹기
        <small>{used ? '이번 판엔 먹었어요' : '한 판에 하나'}</small>
      </h3>
      <ul className="l-party-items">
        {items.map((item) => {
          const info = PARTY_ITEMS[item];
          const n = partyCount(bag, item);
          const off = used || n < 1 || busy || seat < 0 || !ready(item);
          return (
            <li key={item}>
              <button
                type="button"
                disabled={off}
                title={`${info.name}: ${info.effect}`}
                onClick={() =>
                  item === 'watermelon' ? void use(item) : setChoose(choose?.item === item ? null : { item, key })
                }
                aria-pressed={choose?.item === item && choose.key === key}
                data-testid={`party-${item}`}
              >
                <span className="l-party-emoji" aria-hidden="true">
                  {info.emoji}
                </span>
                <span>
                  <strong>
                    {info.name} <em>×{n}</em>
                  </strong>
                  <small>{info.effect}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {choose && choose.key === key && choose.item === 'carrot' && (
        <div className="l-party-choose" role="group" aria-label="다시 굴릴 주사위">
          <small>다시 굴릴 주사위</small>
          {dice.map((d, i) => (
            <button key={i} type="button" onClick={() => void use('carrot', { die: i })} disabled={busy}>
              {d}
            </button>
          ))}
        </div>
      )}
      {choose && choose.key === key && choose.item === 'strawberry' && (
        <div className="l-party-choose" role="group" aria-label="훔쳐볼 사람">
          <small>누구 패를 볼까요?</small>
          {opponents.map((o) => (
            <button key={o.i} type="button" onClick={() => void use('strawberry', { target: o.i })} disabled={busy}>
              {o.n}
            </button>
          ))}
        </div>
      )}
      {peek && peekLeft !== null && peekLeft > 0 && (
        <div className="l-party-peek" data-testid="party-peek" aria-live="polite">
          {peek.card ? (
            <>
              <img src={LOUNGE_ASSETS[peek.card as keyof typeof LOUNGE_ASSETS]} alt={`${names[peek.seat]}의 패 한 장`} />
              <span>
                <strong>{names[peek.seat]}의 패 한 장</strong>
                <small>나만 보여요 · {peekLeft}초</small>
              </span>
            </>
          ) : (
            <span>
              👀 {names[peek.seat]}의 패를 누가 훔쳐보는 중… {peekLeft}초
            </span>
          )}
        </div>
      )}
      {!!state?.log.length && (
        <ol className="l-party-log" aria-label="테이블 기록">
          {state.log.slice(-4).map((l) => (
            <li key={l.at + l.text}>{l.text}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
