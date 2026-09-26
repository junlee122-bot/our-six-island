'use client';
// The table hosts on screen: 루미 (별빛 카지노 딜러) and 매화 (화투방 진행자).
// A small round portrait cut from the host's pose sheet (DealerMood), the
// host's line in a speech bubble, and a few table hooks (per-table memory for
// streak lines, sticker replies, card sounds, the beginner-tip toggle).
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import { AvatarView } from './avatar-view';
import type { Look } from './lounge-look';
import {
  HOSTS,
  reactionLine,
  rememberRound,
  newTableMemory,
  type DealerLine,
  type DealerMood,
  type TableMemory,
  type TableReaction,
} from './lounge-dealer-lines';
import { HOST_CELL, HOST_PORTRAIT, HOST_SHEET, hostCell, type HostId } from './lounge-host-sprites';
import { loungeAudio } from './lounge-audio';
import type { StingKind } from './lounge-music-score';
import { recall, remember } from './lounge-settings';
import './lounge-dealer-host.css';

export type { HostId };

/**
 * Small round portrait: the host's head and shoulders cropped from the pose
 * sheet (lounge-host-sprites.ts), so the face changes with the moment.
 */
export function DealerAvatar({
  host,
  mood,
}: {
  host: HostId;
  mood: DealerMood;
}) {
  const clip = 'dh-clip' + useId().replace(/[^\w-]/g, '');
  const cell = hostCell(mood);
  const k = 64 / HOST_PORTRAIT.size;
  return (
    <svg
      className={'dh-face mood-' + mood}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="32" cy="32" r="31" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="31" className="dh-backdrop" />
      <image
        href={HOST_SHEET[host]}
        x={-(cell.x + HOST_PORTRAIT.x) * k}
        y={-(cell.y + HOST_PORTRAIT.y) * k}
        width={HOST_CELL.w * HOST_CELL.cols * k}
        height={HOST_CELL.h * HOST_CELL.rows * k}
        preserveAspectRatio="none"
        clipPath={`url(#${clip})`}
      />
    </svg>
  );
}

/** A seated friend's figure for the table's portraits (null: AI or gone). */
export type SeatFigure = { actor: number; look: Look } | null;

/**
 * A seat's round portrait: the friend's current chibi face (as in the
 * header, the menus and the ready check); a letter only when there is no
 * figure (an AI seat, a friend who left).
 */
export function SeatPortrait({
  figure,
  name,
  className = '',
}: {
  figure?: SeatFigure;
  name: string;
  className?: string;
}) {
  return (
    <span className={'dh-seat-face ' + className} aria-hidden="true">
      {figure ? (
        <AvatarView actor={figure.actor} look={figure.look} portrait />
      ) : (
        <b>{name.slice(0, 1)}</b>
      )}
    </span>
  );
}

/** The host strip above a table: portrait, name, title and the line. */
export function DealerHost({
  host,
  line,
  table,
  tips,
  aside,
  className = '',
  compact = false,
  side,
  children,
}: {
  host: HostId;
  line: DealerLine;
  /**
   * Right-hand label: { game: '블랙잭' } → '블랙잭 테이블'. A number is shown
   * only when a venue has several tables of the same game ('2번 테이블').
   */
  table?: { number?: number; game: string };
  /** Beginner-tip toggle (off by default, remembered per device). */
  tips?: { on: boolean; toggle: () => void };
  /** A short extra line (sticker reply) shown under the main line. */
  aside?: string;
  className?: string;
  compact?: boolean;
  /** Extra content at the right edge (e.g. a redeal counter). */
  side?: ReactNode;
  children?: ReactNode;
}) {
  const info = HOSTS[host];
  return (
    <div
      className={
        'dh-host dh-' + host + (compact ? ' compact' : '') + ' ' + className
      }
      data-mood={line.mood}
      data-testid="dealer-host"
    >
      <span className="dh-portrait">
        <DealerAvatar host={host} mood={line.mood} />
      </span>
      <div className="dh-body">
        <small className="dh-name">
          {info.name} <span>{info.title}</span>
        </small>
        <p className="dh-line" aria-live="polite" key={line.text}>
          {line.text}
        </p>
        {aside && (
          <p className="dh-aside" key={aside}>
            {aside}
          </p>
        )}
        {children}
      </div>
      {side}
      {(tips || table) && (
        <div className="dh-side">
          {table && (
            <span className="dh-table-number">
              {table.number ? table.game : null}
              <b>{table.number ? `${table.number}번 테이블` : `${table.game} 테이블`}</b>
            </span>
          )}
          {tips && (
            <button
              type="button"
              className={'dh-tips' + (tips.on ? ' on' : '')}
              aria-pressed={tips.on}
              onClick={tips.toggle}
              title="초보자 팁을 딜러의 말에 덧붙여요"
            >
              <Lightbulb size={13} aria-hidden="true" />
              초보 팁 {tips.on ? '켜짐' : '꺼짐'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const TIPS_KEY = 'bumtadew-dealer-tips';
/** Beginner tips toggle: off unless this device turned it on. */
export function useDealerTips() {
  const [on, setOn] = useState(() => recall(TIPS_KEY) === 'on');
  return {
    on,
    toggle: () =>
      setOn((v) => {
        remember(TIPS_KEY, v ? null : 'on');
        return !v;
      }),
  };
}

// Per-table memory for streak lines. Lives in this tab only (a friend who
// joins later simply starts without a streak); keyed by game and seats.
const memories = new Map<string, TableMemory>();
/**
 * Folds each finished round into the table memory once and returns the
 * memory as it was *including* this round (for the result line).
 */
export function useTableMemory(
  game: string,
  names: string[],
  round: { id: string; over: boolean; results: number[]; dealerBust?: boolean },
): TableMemory {
  const key = game + ':' + names.join(',');
  const before = memories.get(key) ?? newTableMemory();
  const after =
    round.over && !before.seen.includes(round.id)
      ? rememberRound(before, round.id, names, round.results, round.dealerBust)
      : before;
  useEffect(() => {
    if (after !== before) memories.set(key, after);
  }, [key, after, before]);
  return after;
}

/**
 * A host reply to the newest sticker at this table: the same line on every
 * client, shown for a few seconds, at most one reply every 10 seconds.
 */
export function useReactionReply(
  matchId: string,
  reaction: TableReaction | null | undefined,
  names: string[],
): string {
  const [shown, setShown] = useState<{ key: string; text: string } | null>(
    null,
  );
  const key = reaction ? `${reaction.seat}:${reaction.id}:${reaction.at}` : '';
  // A sticker already showing when the table opens gets no reply.
  const last = useRef({ key, at: -Infinity });
  // The newest arguments, read when the sticker key changes (the view hands
  // over new arrays every render; only a new sticker should restart this).
  const args = useRef({ matchId, reaction, names });
  useEffect(() => {
    args.current = { matchId, reaction, names };
  });
  useEffect(() => {
    const { matchId, reaction, names } = args.current;
    if (!reaction || key === last.current.key) return;
    const now = Date.now();
    if (now - last.current.at < 10000) {
      last.current.key = key;
      return;
    }
    const text = reactionLine(matchId, reaction, names);
    last.current = { key, at: now };
    if (!text) return;
    const show = setTimeout(() => setShown({ key, text }), 0);
    const hide = setTimeout(
      () => setShown((s) => (s?.key === key ? null : s)),
      4500,
    );
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [key]);
  return shown?.text ?? '';
}

/**
 * Card-table sounds driven by what is on the table: new cards dealt, hole
 * cards flipped, chips moving to a winner. Nothing plays for the first
 * render (joining mid-round is silent). While a hand is live (`live`, by
 * default cards out and no payout yet) the room music adds its tension layer;
 * a new `big` moment (all-in, blackjack, a big win) plays a short sting.
 */
export function useTableSounds(state: {
  id: string;
  cards: number;
  flips: number;
  payout: boolean;
  live?: boolean;
  big?: StingKind | null;
}) {
  const live = state.live ?? (state.cards > 0 && !state.payout);
  useEffect(() => loungeAudio.tableTension(live), [live]);
  useEffect(() => () => loungeAudio.tableTension(false), []);
  const moment = state.big ? state.id + ':' + state.big : '';
  const lastMoment = useRef(moment);
  useEffect(() => {
    if (moment && moment !== lastMoment.current && state.big) loungeAudio.sting(state.big);
    lastMoment.current = moment;
  }, [moment, state.big]);
  const prev = useRef<typeof state | null>(null);
  useEffect(() => {
    const p = prev.current;
    prev.current = state;
    if (!p || p.id !== state.id) {
      // A new deal: the opening cards go out one by one.
      if (p && state.cards > 0) loungeAudio.table('deal', state.cards);
      return;
    }
    if (state.flips > p.flips) loungeAudio.table('flip', state.flips - p.flips);
    if (state.cards > p.cards) loungeAudio.table('deal', state.cards - p.cards);
    if (state.payout && !p.payout) loungeAudio.table('chips', 4);
  });
}
