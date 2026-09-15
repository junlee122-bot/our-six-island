'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Expand, Layers, X, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { LOUNGE_ASSETS } from './lounge-assets';
import {
  cardInfo,
  goScore,
  junkValue,
  MONTHS,
  type GoAction,
  type GoView,
} from './lounge-gostop';
import { playGoMotion } from './lounge-go-motion';
const groups = [
  ['bright', '광'],
  ['animal', '열끗'],
  ['ribbon', '띠'],
  ['junk', '피'],
] as const;
const label = (id: string) => {
  const c = cardInfo(id);
  return `${c.month}월 ${MONTHS[c.month - 1]} · ${c.type === 'bright' ? '광' : c.type === 'animal' ? '열끗' : c.type === 'ribbon' ? '띠' : junkValue(id) === 2 ? '쌍피' : '피'}`;
};
function Card({
  id,
  onClick,
  disabled = false,
  selected = false,
}: {
  id: string;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
}) {
  const inner = (
    <>
      <img
        src={(LOUNGE_ASSETS as Record<string, string>)[id]}
        alt={onClick ? '' : label(id)}
        draggable={false}
      />
      <small>{cardInfo(id).month}</small>
    </>
  );
  return onClick ? (
    <button
      data-card-id={id}
      className={'g-card ' + (selected ? 'selected' : '')}
      onClick={onClick}
      disabled={disabled}
      aria-label={label(id)}
      title={label(id)}
    >
      {inner}
    </button>
  ) : (
    <span data-card-id={id} className="g-card" title={label(id)}>
      {inner}
    </span>
  );
}
function Captures({
  g,
  player,
  name,
  mine,
  active,
  onInspect,
}: {
  g: GoView;
  player: number;
  name: string;
  mine: boolean;
  active: boolean;
  onInspect: () => void;
}) {
  const score = goScore(g.captured[player]);
  return (
    <section
      className={
        'g-player-area ' + (active ? 'active' : '') + (mine ? ' mine' : '')
      }
      aria-label={`${name}의 공개 획득패`}
    >
      <header>
        <div>
          <span className="g-seat-label">
            {mine ? 'MY SEAT' : `PLAYER ${player + 1}`}
          </span>
          <strong>
            {name}
            {mine && <small>나</small>}
            {active && <i />}
          </strong>
        </div>
        <div className="g-score">
          <b>{score.total}</b>
          <span>점 · {g.go[player]}고</span>
        </div>
        <button
          onClick={onInspect}
          aria-label={`${name}의 획득패 크게 보기`}
          title="획득패 크게 보기"
        >
          <Expand size={16} />
        </button>
      </header>
      {!mine && (
        <div
          className="g-opponent-hand g-hand-origin"
          data-seat={player}
          aria-label={`${name}의 손패 ${g.handCounts[player]}장, 뒷면`}
        >
          <div>
            {Array.from({ length: g.handCounts[player] }, (_, i) => (
              <span
                key={i}
                className="g-card-back"
                style={{
                  transform: `rotate(${(i - (g.handCounts[player] - 1) / 2) * 3}deg)`,
                }}
              >
                花
              </span>
            ))}
          </div>
          <small>손패 {g.handCounts[player]}장</small>
        </div>
      )}
      <div className="g-capture-zone" data-seat={player}>
        {groups.map(([type, title]) => {
          const cards = g.captured[player].filter(
              (c) => cardInfo(c).type === type,
            ),
            count = type === 'junk' ? score.junkCount : cards.length;
          return (
            <div key={type} className="g-capture-category" data-category={type}>
              <div>
                <span>{title}</span>
                <b>{count}</b>
              </div>
              <div
                className="g-capture-stack"
                style={
                  { '--count': Math.max(1, cards.length) } as CSSProperties
                }
              >
                {cards.map((c) => (
                  <Card key={c} id={c} />
                ))}
                {!cards.length && <span className="g-empty-pile" />}
              </div>
            </div>
          );
        })}
      </div>
      {score.sets.length > 0 && (
        <div className="g-sets">
          {score.sets.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
      )}
    </section>
  );
}
function Inspect({
  g,
  seat,
  name,
  onClose,
}: {
  g: GoView;
  seat: number;
  name: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      className="g-inspect l-modal"
      ref={ref}
      aria-label={`${name}의 획득패`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <h2>{name}의 획득패</h2>
        <button className="l-icon" aria-label="닫기" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      {groups.map(([type, title]) => (
        <section key={type}>
          <h3>{title}</h3>
          <div>
            {g.captured[seat]
              .filter((c) => cardInfo(c).type === type)
              .map((c) => (
                <Card id={c} key={c} />
              ))}
          </div>
          {!g.captured[seat].some((c) => cardInfo(c).type === type) && (
            <p>아직 가져온 패가 없어요.</p>
          )}
        </section>
      ))}
    </dialog>
  );
}
export function GoBoard({
  match: g,
  seat,
  onAction,
  names,
  onDisplayChange,
}: {
  match: GoView;
  seat: number;
  onAction: (a: GoAction) => void;
  names: string[];
  onDisplayChange?: (revision: number) => void;
}) {
  const [shown, setShown] = useState(g),
    [playing, setPlaying] = useState(false),
    [actionText, setActionText] = useState(''),
    [rules, setRules] = useState(false),
    [inspect, setInspect] = useState<number | null>(null),
    [sound, setSound] = useState(false),
    stage = useRef<HTMLDivElement>(null),
    current = useRef(g),
    latest = useRef(g),
    seen = useRef(`${g.id}:${g.revision}`),
    queue = useRef<GoView[]>([]),
    running = useRef(false),
    controller = useRef<AbortController | null>(null),
    generation = useRef(0),
    soundRef = useRef(false),
    audio = useRef<AudioContext | null>(null);
  latest.current = g;
  soundRef.current = sound;
  const snap = (value: GoView) => {
    current.current = value;
    setShown(value);
  };
  const tap = () => {
    if (!soundRef.current) return;
    try {
      const ac = audio.current ?? new AudioContext();
      audio.current = ac;
      void ac.resume();
      const o = ac.createOscillator(),
        gain = ac.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(310, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(100, ac.currentTime + 0.075);
      gain.gain.setValueAtTime(0.055, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.09);
      o.connect(gain).connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.1);
    } catch {}
  };
  useEffect(() => {
    const id = `${g.id}:${g.revision}`;
    if (id === seen.current) return;
    seen.current = id;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (
      g.id !== current.current.id ||
      document.hidden ||
      reduced ||
      (g.phase === 'over' && g.motion?.steps.length === 0)
    ) {
      generation.current++;
      controller.current?.abort();
      queue.current = [];
      running.current = false;
      setPlaying(false);
      setActionText('');
      snap(g);
      return;
    }
    queue.current.push(g);
    if (running.current) return;
    running.current = true;
    const epoch = generation.current;
    void (async () => {
      setPlaying(true);
      try {
        while (queue.current.length && epoch === generation.current) {
          const next = queue.current.shift()!;
          if (
            next.revision === current.current.revision + 1 &&
            next.motion &&
            stage.current
          ) {
            const c = new AbortController();
            controller.current = c;
            await playGoMotion(
              stage.current,
              next.motion,
              names,
              c.signal,
              (text) => {
                if (epoch !== generation.current) return;
                setActionText(text);
                tap();
              },
            );
          }
          if (epoch !== generation.current) return;
          snap(next);
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
        }
      } catch {
        if (epoch === generation.current) {
          queue.current = [];
          snap(latest.current);
        }
      } finally {
        if (epoch === generation.current) {
          running.current = false;
          setPlaying(false);
          setActionText('');
        }
      }
    })();
  }, [g.id, g.revision]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) {
        generation.current++;
        controller.current?.abort();
        queue.current = [];
        running.current = false;
        current.current = latest.current;
        setShown(latest.current);
        setPlaying(false);
        setActionText('');
      }
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      generation.current++;
      controller.current?.abort();
      queue.current = [];
      document.removeEventListener('visibilitychange', hidden);
      void audio.current?.close();
    };
  }, []);
  useEffect(() => {
    onDisplayChange?.(shown.revision);
  }, [shown.revision, onDisplayChange]);
  const anchor = seat >= 0 ? seat : 0,
    left = (anchor + 1) % 3,
    right = (anchor + 2) % 3,
    ready = !playing && shown.revision === g.revision,
    active = ready && shown.turn === seat && shown.phase !== 'over',
    waiting = shown.phase === 'choose',
    picked = shown.pending
      ? [
          shown.pending.played,
          ...(shown.pending.drawn ? [shown.pending.drawn] : []),
        ].filter(
          (c) =>
            !shown.floor.includes(c) &&
            !shown.captured.some((p) => p.includes(c)),
        )
      : [],
    floorCards = [...shown.floor, ...picked];
  const status = playing
    ? actionText || '패를 정리하고 있어요'
    : shown.phase === 'over'
      ? shown.reason
      : shown.phase === 'choose'
        ? `${names[shown.turn]} · 가져올 패를 골라 주세요`
        : shown.phase === 'decide'
          ? `${names[shown.turn]} · 고, 아니면 스톱?`
          : `${names[shown.turn]}의 차례`;
  return (
    <div className="g-game l-go-layout">
      <div className="g-game-top">
        <div className="l-game-status" aria-live="polite">
          <span className={playing ? 'g-status-moving' : ''} />
          {status}
        </div>
        <button
          className="g-sound"
          aria-label={sound ? '패 효과음 끄기' : '패 효과음 켜기'}
          onClick={() => {
            setSound(!sound);
            if (!sound) {
              soundRef.current = true;
              tap();
            }
          }}
        >
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>
      <div className="g-table-shell" ref={stage} aria-busy={playing}>
        <div className="g-opponents">
          <Captures
            g={shown}
            player={left}
            name={names[left]}
            mine={false}
            active={shown.turn === left && shown.phase !== 'over'}
            onInspect={() => setInspect(left)}
          />
          <Captures
            g={shown}
            player={right}
            name={names[right]}
            mine={false}
            active={shown.turn === right && shown.phase !== 'over'}
            onInspect={() => setInspect(right)}
          />
        </div>
        <div className="g-middle">
          <div className="g-deck">
            <div className="g-card-back">花</div>
            <strong>
              {shown.deckCount}
              <small>장</small>
            </strong>
            <span>남은 더미</span>
          </div>
          <div
            className="g-floor-layout l-floor-cards"
            aria-label="공용 바닥패"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const month = i + 1,
                cards = floorCards.filter((c) => cardInfo(c).month === month);
              return (
                <div
                  key={month}
                  className={
                    'g-month-group ' + (cards.length ? 'has-cards' : '')
                  }
                  data-month={month}
                >
                  <span className="g-month-label">{month}월</span>
                  <div>
                    {cards.map((c) => (
                      <Card
                        id={c}
                        key={c}
                        selected={
                          active && waiting && shown.options.includes(c)
                        }
                        disabled={!active || !waiting}
                        onClick={
                          active && waiting && shown.options.includes(c)
                            ? () => onAction({ kind: 'pick', card: c })
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="g-action-caption" aria-live="polite">
          {playing ? (
            <>
              <Layers size={15} />
              {actionText}
            </>
          ) : (
            <>
              {shown.events.at(-1)}
              <span>
                {shown.phase !== 'over' && (
                  <>
                    {names[shown.turn]}
                    <ArrowRight size={12} />
                    다음 {names[(shown.turn + 1) % 3]}
                  </>
                )}
              </span>
            </>
          )}
        </div>
        <div className="g-bottom">
          <div className="g-my-play">
            <div className="l-hand-title">
              <strong>
                {seat >= 0 ? '내 손패' : `${names[anchor]}의 자리 · 관전 중`}
              </strong>
              <span>
                {playing
                  ? '패가 움직이는 중이에요'
                  : active
                    ? waiting
                      ? '빛나는 바닥패를 선택하세요'
                      : '낼 패를 골라 주세요'
                    : '친구의 차례를 기다려 주세요'}
              </span>
            </div>
            {seat >= 0 ? (
              <div className="l-go-hand g-hand-origin" data-seat={anchor}>
                {[...shown.hand]
                  .sort((a, b) => cardInfo(a).month - cardInfo(b).month)
                  .map((c) => (
                    <Card
                      key={c}
                      id={c}
                      disabled={!active || shown.phase !== 'play'}
                      selected={
                        active &&
                        shown.phase === 'play' &&
                        shown.floor.some(
                          (f) => cardInfo(f).month === cardInfo(c).month,
                        )
                      }
                      onClick={() => onAction({ kind: 'play', card: c })}
                    />
                  ))}
              </div>
            ) : (
              <div
                className="g-spectator-hand g-hand-origin"
                data-seat={anchor}
              >
                {Array.from({ length: shown.handCounts[anchor] }, (_, i) => (
                  <span key={i} className="g-card-back">
                    花
                  </span>
                ))}
                <small>손패는 공개되지 않습니다</small>
              </div>
            )}
            {active && shown.phase === 'decide' && (
              <div className="l-go-decision">
                <button
                  className="l-primary"
                  onClick={() => onAction({ kind: 'stop' })}
                >
                  스톱 · {goScore(shown.captured[seat]).total}점으로 마치기
                </button>
                <button
                  className="l-secondary"
                  onClick={() => onAction({ kind: 'go' })}
                >
                  고! 한 번 더
                </button>
              </div>
            )}
          </div>
          <Captures
            g={shown}
            player={anchor}
            name={names[anchor]}
            mine={seat >= 0}
            active={shown.turn === anchor && shown.phase !== 'over'}
            onInspect={() => setInspect(anchor)}
          />
        </div>
      </div>
      {shown.phase === 'over' && (
        <div className="l-go-result">
          {shown.result.map((score, i) => (
            <span key={i}>
              {names[i]}{' '}
              <b>
                {score > 0 ? '+' : ''}
                {score}점
              </b>
            </span>
          ))}
        </div>
      )}
      <div className="g-table-footer">
        <button className="l-text" onClick={() => setRules(!rules)}>
          {rules ? '규칙 접기' : '3인 고스톱 · 기본 룰 보기'}
        </button>
        <span>상대가 모은 패는 공개 · 손패는 뒷면</span>
      </div>
      {rules && (
        <div className="l-rules">
          <p>
            손패 7장, 바닥 6장. 같은 월의 패를 가져와 3점부터 고 또는 스톱을
            선택합니다. 다시 고를 외치려면 기본 점수가 올라야 해요.
          </p>
          <p>
            광 · 열끗 · 띠 · 피, 고도리, 홍단/청단/초단, 쪽/뻑/따닥/쓸,
            피박/광박/멍따를 반영합니다. 국진의 술잔은 열끗으로 고정합니다.
          </p>
          <p>
            1·2고는 각 1점 추가, 3고부터 배수를 적용합니다. 흔들기 · 폭탄 · 고박
            · 나가리 다음 판 배수는 적용하지 않습니다. 총통은 5점씩, 피박은 피
            1~5장입니다. 개인의 마지막 손패에는 특수 피 빼앗기 보너스가
            없습니다. 점수만 주고받는 친선 게임입니다.
          </p>
        </div>
      )}
      {inspect !== null && (
        <Inspect
          g={shown}
          seat={inspect}
          name={names[inspect]}
          onClose={() => setInspect(null)}
        />
      )}
    </div>
  );
}
