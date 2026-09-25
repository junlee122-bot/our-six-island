'use client';
// The table hosts on screen: 루미 (별빛 카지노 딜러) and 매화 (화투방 진행자).
// A small inline-SVG portrait whose face follows the moment (DealerMood), the
// host's line in a speech bubble, and a few table hooks (per-table memory for
// streak lines, sticker replies, card sounds, the beginner-tip toggle).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
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
import { loungeAudio } from './lounge-audio';
import { recall, remember } from './lounge-settings';
import './lounge-dealer-host.css';

export type HostId = keyof typeof HOSTS;

const EYES: Record<DealerMood, ReactNode> = {
  calm: (
    <>
      <ellipse cx="25" cy="34" rx="2.1" ry="2.6" />
      <ellipse cx="39" cy="34" rx="2.1" ry="2.6" />
    </>
  ),
  smile: (
    <g fill="none" strokeWidth="2" strokeLinecap="round">
      <path d="M22.5 34.5q2.5-3 5 0" />
      <path d="M36.5 34.5q2.5-3 5 0" />
    </g>
  ),
  wow: (
    <>
      <circle cx="25" cy="33.5" r="3" />
      <circle cx="39" cy="33.5" r="3" />
      <circle cx="26" cy="32.5" r="0.9" fill="#fff" />
      <circle cx="40" cy="32.5" r="0.9" fill="#fff" />
    </>
  ),
  sorry: (
    <>
      <ellipse cx="25" cy="35" rx="1.9" ry="2.1" />
      <ellipse cx="39" cy="35" rx="1.9" ry="2.1" />
      <g fill="none" strokeWidth="1.5" strokeLinecap="round">
        <path d="M21.5 29.5l5.5-1.8" />
        <path d="M42.5 29.5l-5.5-1.8" />
      </g>
    </>
  ),
  focus: (
    <>
      <ellipse cx="25" cy="34.5" rx="2" ry="2.2" />
      <ellipse cx="39" cy="34.5" rx="2" ry="2.2" />
      <g fill="none" strokeWidth="1.5" strokeLinecap="round">
        <path d="M21.5 29.5h6" />
        <path d="M36.5 29.5h6" />
      </g>
    </>
  ),
};
const MOUTH: Record<DealerMood, ReactNode> = {
  calm: <path d="M28.5 41.5q3.5 2.6 7 0" />,
  smile: <path d="M27 40.5q5 5 10 0" />,
  wow: <ellipse cx="32" cy="42" rx="2.2" ry="2.6" />,
  sorry: <path d="M28.5 43q3.5-2.4 7 0" />,
  focus: <path d="M29 42h6" />,
};

/** Small portrait: the face changes with the moment (no image assets). */
export function DealerAvatar({
  host,
  mood,
}: {
  host: HostId;
  mood: DealerMood;
}) {
  const lumi = host === 'lumi';
  return (
    <svg
      className={'dh-face mood-' + mood}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="32" cy="32" r="31" className="dh-backdrop" />
      {/* hair behind */}
      {lumi ? (
        <path
          d="M12 38c-2-17 7-27 20-27s22 10 20 27c-1 7-4 13-6 16H18c-2-3-5-9-6-16z"
          fill="#2e2c52"
        />
      ) : (
        <>
          <circle cx="32" cy="10.5" r="7" fill="#231a1c" />
          <path
            d="M13 36c-1-15 7-24 19-24s20 9 19 24c-1 6-3 10-4 12H17c-1-2-3-6-4-12z"
            fill="#231a1c"
          />
        </>
      )}
      {/* shoulders */}
      {lumi ? (
        <>
          <path d="M10 64c2-10 11-14 22-14s20 4 22 14z" fill="#1f2c3f" />
          <path d="M26 50l6 7 6-7z" fill="#f4efe3" />
          <path d="M28.5 55.5l3.5 2 3.5-2-3.5 3z" fill="#a23b4a" />
        </>
      ) : (
        <>
          <path d="M10 64c2-10 11-14 22-14s20 4 22 14z" fill="#e7b7c3" />
          <path d="M24 50l8 10 8-10" fill="none" stroke="#fff6ef" strokeWidth="3" />
        </>
      )}
      {/* face */}
      <ellipse cx="32" cy="35" rx="14.5" ry="15.5" fill="#f7dfcc" />
      {/* bangs */}
      {lumi ? (
        <path
          d="M17 31c1-10 7-15 15-15 8 0 14 5 15 15-4-3-7-7-8-10-3 4-9 7-15 8-3 0-5 1-7 2z"
          fill="#2e2c52"
        />
      ) : (
        <path
          d="M17.5 31c1-9 7-14 14.5-14s13.5 5 14.5 14c-5-2-10-6-14.5-10-4 4-9.5 8-14.5 10z"
          fill="#231a1c"
        />
      )}
      {/* hair ornament: a gold star (루미) or a plum blossom (매화) */}
      {lumi ? (
        <path
          d="M44 16.5l1.6 3.2 3.5.5-2.5 2.5.6 3.5-3.2-1.7-3.1 1.7.6-3.5-2.6-2.5 3.6-.5z"
          fill="#e9c46a"
          stroke="#8a6a2b"
          strokeWidth=".6"
        />
      ) : (
        <g fill="#f08aa5" stroke="#b44d6b" strokeWidth=".5">
          <circle cx="44" cy="15" r="2.2" />
          <circle cx="47.5" cy="17.5" r="2.2" />
          <circle cx="46.2" cy="21.4" r="2.2" />
          <circle cx="41.8" cy="21.4" r="2.2" />
          <circle cx="40.5" cy="17.5" r="2.2" />
          <circle cx="44" cy="18.6" r="1.2" fill="#f6d36b" stroke="none" />
        </g>
      )}
      {(mood === 'smile' || mood === 'wow') && (
        <g fill="#f29a9a" opacity=".45">
          <ellipse cx="21.5" cy="40" rx="3" ry="1.8" />
          <ellipse cx="42.5" cy="40" rx="3" ry="1.8" />
        </g>
      )}
      <g fill="#3a2830" stroke="#3a2830">
        {EYES[mood]}
      </g>
      <g
        fill={mood === 'wow' ? '#7b3a3f' : 'none'}
        stroke="#7b3a3f"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        {MOUTH[mood]}
      </g>
    </svg>
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
  /** Right-hand label, e.g. { number: 3, game: '블랙잭' } → '3번 테이블'. */
  table?: { number: number; game: string };
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
              {table.game}
              <b>{table.number}번 테이블</b>
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
 * render (joining mid-round is silent).
 */
export function useTableSounds(state: {
  id: string;
  cards: number;
  flips: number;
  payout: boolean;
}) {
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
