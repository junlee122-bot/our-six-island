'use client';
// 라이어 게임 table (friends only, no dealer, no 범). My role card (the word,
// or "라이어" with only the category), everyone's one-line hints, the table
// chat for the discussion, the vote, the liar's last guess and the reveal.
// The server's view never holds the word for the liar or watchers, nor the
// liar's seat before it is public (lounge-liar.ts liarView).
import { useEffect, useRef, useState } from 'react';
import { Check, Crown, Eye, MessageCircle, Send, Vote } from 'lucide-react';
import {
  LIAR_HINT_MAX,
  LIAR_LIMIT_MS,
  LIAR_PASS,
  type LiarAction,
  type LiarView,
} from './lounge-liar';
import type { TurnTiming } from './lounge-room';
import { AWAY_LABEL, TurnTimer, awaitAnswer, useSecondsLeft } from './lounge-turn-timer';
import { loungeAudio } from './lounge-audio';
import { FriendHost } from './lounge-friend-host';
import { SeatPortrait, type SeatFigure } from './lounge-dealer-host';
import { ChatPanel } from './lounge/ChatPanel';
import type { CloudRoom, CloudRoomView } from './lounge-cloud-room';
import { josa } from './lounge-text';
import './lounge-liar-table.css';

const PHASE_LABEL: Record<LiarView['phase'], string> = {
  hint: '힌트',
  discuss: '토론',
  vote: '투표',
  guess: '정답 맞히기',
  over: '결과',
};

export function LiarTable({
  match: g,
  seat,
  names,
  figures = [],
  onAction,
  room,
  view,
}: {
  match: LiarView & TurnTiming;
  seat: number;
  names: string[];
  figures?: SeatFigure[];
  onAction: (a: LiarAction) => void | Promise<boolean>;
  room: CloudRoom;
  view: CloudRoomView;
  round?: number;
  reaction?: unknown;
}) {
  const over = g.phase === 'over';
  const version = `${g.id}:${g.revision}`;
  const [sent, setSent] = useState<string | null>(null);
  const inFlight = useRef<string | null>(null);
  const locked = sent === version;
  const [hint, setHint] = useState('');
  const hintRef = useRef<HTMLInputElement>(null);
  const act = (a: LiarAction) => {
    if (locked || inFlight.current === version) return;
    if (a.kind === 'vote') loungeAudio.sample('drop');
    inFlight.current = version;
    setSent(version);
    awaitAnswer(onAction(a), () => {
      inFlight.current = null;
      setSent(null);
    });
  };
  // Table sounds: the cards go out, a turn passes, the vote opens / closes,
  // my ballot drops, the reveal; the last seconds of my own clock tick.
  const cue = useRef({ id: '', turn: g.turn, phase: g.phase, ballots: g.ballots.length });
  useEffect(() => {
    const was = cue.current;
    cue.current = { id: g.id, turn: g.turn, phase: g.phase, ballots: g.ballots.length };
    if (was.id !== g.id) {
      loungeAudio.sample('card-slide', () => loungeAudio.table('deal', 2));
      return;
    }
    if (g.phase === 'over' && was.phase !== 'over')
      loungeAudio.sample('card-place', () => loungeAudio.table('flip', 2));
    else if (g.ballots.length > was.ballots) loungeAudio.sample('confirm');
    else if (g.phase === 'vote' && was.phase !== 'vote') loungeAudio.sample('question');
    else if (g.phase === 'hint' && g.turn !== was.turn) loungeAudio.sample('bong');
  }, [g.id, g.turn, g.phase, g.ballots.length]);
  const left = useSecondsLeft(g.legal.enabled && !over ? g.turnDeadline : undefined);
  useEffect(() => {
    if (left !== null && left > 0 && left <= 5) loungeAudio.sample('tick');
  }, [left]);
  // My hint turn: focus the line.
  useEffect(() => {
    if (g.legal.hint) hintRef.current?.focus({ preventScroll: true });
  }, [g.legal.hint]);
  const away = (i: number) => !!g.away?.includes(i);
  const turnName = g.turn >= 0 ? names[g.turn] : '';
  const readyCount = g.ready.filter(Boolean).length;
  const votedCount = g.voted.filter(Boolean).length;
  const lastBallot = g.ballots[g.ballots.length - 1];
  const liarName = g.liar !== null ? names[g.liar] : '';
  const iWon =
    over && seat >= 0 && ((g.winner === 'liar') === (g.role === 'liar'));
  const line = over
    ? g.winner === 'liar'
      ? `라이어 ${liarName} 님의 승리! ${g.reason}`
      : `시민 승리! ${g.reason}`
    : g.phase === 'hint'
      ? g.legal.hint
        ? g.role === 'liar'
          ? `내 차례예요. 들키지 않게 '${g.category}'에 어울리는 힌트를 한 줄 적어요.`
          : '내 차례예요. 제시어를 직접 말하지 말고 한 줄로 설명해요.'
        : away(g.turn)
          ? `${turnName} 님은 ${AWAY_LABEL} · 힌트를 넘겨요.`
          : `${turnName} 님이 힌트를 적는 중이에요.`
      : g.phase === 'discuss'
        ? `토론 시간! 채팅으로 이야기하고 준비되면 '투표로'를 눌러요 (${readyCount}/${g.n}).`
        : g.phase === 'vote'
          ? g.voteRound === 2
            ? `동점이라 다시 투표해요. ${g.candidates.map((c) => names[c]).join('·')} 중에서 골라요 (${votedCount}/${g.n}).`
            : `라이어라고 생각하는 친구를 골라요 (${votedCount}/${g.n}).`
          : g.role === 'liar'
            ? '들켰어요! 제시어를 맞히면 역전승이에요. 아래에서 하나를 골라요.'
            : `${liarName} 님이 라이어였어요! 제시어를 맞히는지 지켜봐요.`;
  const clockLabel =
    g.phase === 'hint' ? (g.legal.hint ? '내 힌트' : `${turnName} 힌트`) : PHASE_LABEL[g.phase];
  const total = g.phase === 'over' ? 1 : LIAR_LIMIT_MS[g.phase];
  const tallyOf = (i: number) => lastBallot?.tally[i] ?? 0;
  return (
    <div className="lg-club" data-testid="liar-table" data-phase={g.phase} data-role={g.role}>
      <FriendHost
        symbol="?"
        game="라이어 게임"
        line={line}
        aside={g.log.length ? g.log[g.log.length - 1].text : undefined}
        tone={over ? (iWon ? 'win' : 'calm') : g.legal.enabled ? 'turn' : g.phase === 'guess' ? 'alert' : 'calm'}
        side={
          <div className="lg-host-side">
            <ol className="lg-phases" aria-label="진행 단계">
              {(['hint', 'discuss', 'vote', 'guess', 'over'] as const).map((p) => (
                <li key={p} className={p === g.phase ? 'is-now' : ''}>
                  {PHASE_LABEL[p]}
                </li>
              ))}
            </ol>
            {!over && (
              <TurnTimer deadline={g.turnDeadline} total={total} label={clockLabel} mine={g.legal.enabled} />
            )}
          </div>
        }
      />
      <div className="lg-layout">
        <div className="lg-main">
          <section
            className={'lg-role is-' + g.role + (over ? ' is-over' : '')}
            data-testid="liar-role"
            aria-label="내 역할"
          >
            {g.role === 'liar' ? (
              <>
                <small>당신은</small>
                <strong className="lg-role-liar">라이어</strong>
                <span>
                  카테고리 <b>{g.category}</b> · 제시어는 몰라요
                </span>
              </>
            ) : g.role === 'citizen' ? (
              <>
                <small>카테고리 {g.category} · 제시어</small>
                <strong>{g.word}</strong>
                <span>라이어는 이 단어를 몰라요. 들키지 않게 설명해요.</span>
              </>
            ) : (
              <>
                <small>
                  <Eye size={13} aria-hidden="true" /> 구경 중 · 카테고리
                </small>
                <strong>{g.category}</strong>
                <span>{over ? `제시어는 '${g.word}'였어요.` : '제시어와 라이어는 끝나면 공개돼요.'}</span>
              </>
            )}
          </section>
          <ol className="lg-seats" aria-label="힌트와 자리">
            {names.map((n, i) => {
              const isLiar = g.liar === i;
              const votable = g.legal.vote && i !== seat && g.candidates.includes(i);
              const mineVote = g.myVote === i;
              const content = (
                <>
                  <SeatPortrait figure={figures[i]} name={n} />
                  <span className="lg-seat-body">
                    <strong>
                      {n}
                      {i === seat && <em>나</em>}
                      {isLiar && <em className="lg-tag-liar">라이어</em>}
                      {g.accused === i && !isLiar && <em className="lg-tag-wrong">지목</em>}
                    </strong>
                    <span className={'lg-hint' + (g.hints[i] === LIAR_PASS ? ' is-pass' : '')}>
                      {g.hints[i] ??
                        (g.phase === 'hint' && g.turn === i
                          ? away(i)
                            ? AWAY_LABEL
                            : '힌트를 적는 중…'
                          : '—')}
                    </span>
                  </span>
                  <span className="lg-seat-side">
                    {g.phase === 'discuss' && g.ready[i] && <Check size={16} aria-label="투표 준비" />}
                    {g.phase === 'vote' && g.voted[i] && <Check size={16} aria-label="투표함" />}
                    {lastBallot && (g.phase !== 'vote' || g.voteRound === 2) && (
                      <b className="lg-tally" title="받은 표">
                        {tallyOf(i)}표
                      </b>
                    )}
                    {over && g.points[i] > 0 && <b className="lg-points">+{g.points[i]}</b>}
                  </span>
                </>
              );
              return (
                <li
                  key={i}
                  className={
                    (g.phase === 'hint' && g.turn === i ? 'is-turn ' : '') +
                    (isLiar ? 'is-liar ' : '') +
                    (mineVote ? 'is-my-vote ' : '') +
                    (away(i) ? 'is-away ' : '')
                  }
                >
                  {votable ? (
                    <button
                      type="button"
                      className="lg-vote-target"
                      onClick={() => act({ kind: 'vote', target: i })}
                      disabled={locked}
                      data-testid={`liar-vote-${i}`}
                      aria-label={`${n} 님을 라이어로 지목`}
                    >
                      {content}
                      <span className="lg-vote-cta">
                        <Vote size={15} aria-hidden="true" /> 지목
                      </span>
                    </button>
                  ) : (
                    <div className="lg-seat">{content}</div>
                  )}
                </li>
              );
            })}
          </ol>
          {g.legal.hint && (
            <form
              className="lg-hint-form"
              onSubmit={(e) => {
                e.preventDefault();
                const text = hint.trim();
                if (!text) return;
                act({ kind: 'hint', text });
                setHint('');
              }}
            >
              <input
                ref={hintRef}
                value={hint}
                maxLength={LIAR_HINT_MAX}
                onChange={(e) => setHint(e.target.value)}
                placeholder={g.role === 'liar' ? `'${g.category}'에 어울리는 한 줄 (들키지 않게!)` : '제시어를 설명하는 한 줄'}
                aria-label="내 힌트"
                data-testid="liar-hint-input"
              />
              <button type="submit" className="l-primary" disabled={locked || !hint.trim()} data-testid="liar-hint-send">
                <Send size={16} aria-hidden="true" /> 힌트 내기
              </button>
            </form>
          )}
          {g.phase === 'discuss' && seat >= 0 && (
            <div className="lg-bar">
              <p>
                <MessageCircle size={16} aria-hidden="true" /> 오른쪽 채팅으로 토론해요. 모두 &lsquo;투표로&rsquo;를 누르거나 시간이 끝나면 투표해요.
              </p>
              <button
                type="button"
                className="l-primary"
                onClick={() => act({ kind: 'ready' })}
                disabled={!g.legal.ready || locked}
                data-testid="liar-ready"
              >
                <Vote size={16} aria-hidden="true" />
                {g.legal.ready ? '투표로' : `기다리는 중 ${readyCount}/${g.n}`}
              </button>
            </div>
          )}
          {g.phase === 'vote' && seat >= 0 && (
            <p className="lg-bar-note" data-testid="liar-vote-note">
              {g.legal.vote
                ? '위에서 라이어라고 생각하는 친구를 눌러 지목해요. 한 번 고르면 바꿀 수 없어요.'
                : g.myVote !== null && g.myVote >= 0
                  ? `${josa(names[g.myVote], '을/를')} 지목했어요. 다른 친구를 기다려요 (${votedCount}/${g.n}).`
                  : `투표를 기다려요 (${votedCount}/${g.n}).`}
            </p>
          )}
          {g.phase === 'guess' && (
            <section className="lg-guess" aria-label="라이어의 마지막 답">
              <h3>
                {g.role === 'liar'
                  ? `제시어는 뭘까요? (${g.category})`
                  : `${liarName} 님이 '${g.category}' 중에서 제시어를 고르는 중…`}
              </h3>
              {g.choices && (
                <div className="lg-choices">
                  {g.choices.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => act({ kind: 'guess', word: w })}
                      disabled={locked}
                      data-testid="liar-guess"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
          {over && (
            <section className={'lg-reveal is-' + g.winner} data-testid="liar-reveal" aria-label="결과">
              <div className="lg-reveal-word">
                <small>제시어</small>
                <strong>{g.word}</strong>
                <span>{g.category}</span>
              </div>
              <div className="lg-reveal-liar">
                <small>라이어</small>
                <strong>{liarName}</strong>
                <span>{g.guess ? `마지막 답: ${g.guess}` : g.accused === null ? '지목되지 않았어요' : g.accused === g.liar ? '답하지 못했어요' : `지목된 사람: ${names[g.accused]}`}</span>
              </div>
              <div className="lg-reveal-score">
                <small>누적 점수</small>
                <ol>
                  {g.totals
                    .map((t, i) => ({ t, i }))
                    .sort((a, b) => b.t - a.t || a.i - b.i)
                    .map(({ t, i }, place) => (
                      <li key={i}>
                        {place === 0 && t > 0 && <Crown size={13} aria-label="1등" />}
                        <span>{names[i]}</span>
                        <b>{t}점</b>
                      </li>
                    ))}
                </ol>
              </div>
            </section>
          )}
          {g.ballots.length > 0 && (over || g.phase === 'guess' || g.voteRound === 2) && (
            <details className="lg-ballots">
              <summary>누가 누구를 지목했나요?</summary>
              {g.ballots.map((b) => (
                <p key={b.round}>
                  <b>{b.round}차 투표</b>{' '}
                  {b.votes
                    .map((v, i) => `${names[i]} → ${v !== null && v >= 0 ? names[v] : '기권'}`)
                    .join(' · ')}
                </p>
              ))}
            </details>
          )}
        </div>
        <aside className="lg-chat" aria-label="테이블 수다">
          <ChatPanel room={room} view={view} title="테이블 수다" className="lg-chat-panel" />
          <p className="lg-rules">
            힌트 {LIAR_LIMIT_MS.hint / 1000}초 · 토론 {LIAR_LIMIT_MS.discuss / 1000}초 · 투표 {LIAR_LIMIT_MS.vote / 1000}초.
            라이어가 이기면 2점, 시민이 이기면 시민 모두 1점.
          </p>
        </aside>
      </div>
    </div>
  );
}
