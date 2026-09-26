'use client';
// Participatory festivals (C-6): the festival booth in the plaza (or on the
// 축제 무대 once it is built) opens this panel. 추석 한가위 잔치: 송편 빚기
// (a timing game, best of 5 tries on the leaderboard) and 달맞이 등 (a wish
// after dark). 봄 꽃놀이: 화관 만들기 (3 flowers from the bag, scored) and
// the 꽃길 단체 사진. The first activity gives the participation reward; the
// best score when the festival ends wins the trophy. All judged on the server
// (lounge-life-social.ts feteAction).
import { useEffect, useRef, useState } from 'react';
import { Camera, Crown, Flame, Moon, PartyPopper, Trophy } from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { ACTORS } from '../lounge-roster';
import { AvatarView } from '../avatar-view';
import { formatBeom } from '../lounge-text';
import { FURNITURE_BY_REF, ITEM_BY_ID } from '../lounge-items';
import { actionForCode } from '../lounge-keybinds';
import { getSettings } from '../lounge-settings';
import { timeOfDay, hash32 } from '../lounge-calendar';
import {
  CROWN_FLOWERS,
  FETES,
  LANTERN_TEXT_MAX,
  SONGPYEON_MISS_MS,
  SONGPYEON_ROUNDS,
  SONGPYEON_ROUND_MS,
  songpyeonRound,
} from '../lounge-social-defs';
import { lifeSfx } from '../lounge-audio-life';
import { Modal } from './Modal';
import type { Notify } from './Toast';
import { ItemIcon } from './ItemIcon';
import { lookFor } from './friend-looks';
import { useLifeAction } from './LifePanels';
import './social.css';

type Base = { room: CloudRoom; view: CloudRoomView; notify: Notify; onClose: () => void; selfActor: number };
const dayText = (day: number) => {
  const d = new Date(day * 86_400_000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
};
const reducedMotion = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export function FestivalPanel({ room, view, notify, onClose, selfActor }: Base) {
  const life = view.life;
  const fete = life?.social?.fete ?? null;
  const [run, busy] = useLifeAction(room, notify);
  const [playing, setPlaying] = useState<{ token: string } | null>(null);
  if (!life || !fete)
    return (
      <Modal title="마을 축제" onClose={onClose} className="l-life-modal l-fete">
        <p className="l-help-text" data-testid="fete-none">
          {life?.social?.nextFete
            ? `다음 축제는 ${dayText(life.social.nextFete.start)} ${life.social.nextFete.name}이에요. 그날 광장에서 만나요.`
            : '지금은 열린 축제가 없어요.'}
        </p>
      </Modal>
    );
  const def = FETES[fete.kind];
  const now = Date.now() + view.clockOffset;
  const night = ['evening', 'night'].includes(timeOfDay(now));
  const board = fete.board;
  const start = async () => {
    const ok = await run({ kind: 'fete', op: 'start' }, '');
    const token = room.snapshot().life?.social?.fete?.play?.token;
    if (ok && token) setPlaying({ token });
  };
  return (
    <Modal title={def.name} onClose={onClose} className="l-life-modal l-fete" wide>
      <p className="l-modal-intro">
        <PartyPopper size={15} aria-hidden="true" /> {dayText(fete.start)}
        {fete.end > fete.start ? `~${dayText(fete.end)}` : ''} ·{' '}
        {fete.active ? '지금 열려 있어요' : '끝난 축제예요. 결과를 확인해요'}
      </p>
      <div className="l-fete-body">
        <section className="l-fete-main" aria-label="축제 활동">
          {playing && fete.active ? (
            <SongpyeonGame
              token={playing.token}
              onDone={async (token, marks) => {
                const ok = await run({ kind: 'fete', op: 'finish', token, marks }, '');
                setPlaying(null);
                if (ok) {
                  lifeSfx('donate');
                  notify(`송편을 다 빚었어요! ${marks.reduce((s, m) => s + songpyeonRound(m), 0)}점`);
                }
              }}
              onCancel={() => setPlaying(null)}
            />
          ) : (
            <>
              <article className="l-fete-card">
                <h3>
                  {fete.kind === 'chuseok' ? <Moon size={17} aria-hidden="true" /> : <Crown size={17} aria-hidden="true" />} {def.game}
                </h3>
                <p className="l-help-text">{def.gameHelp}</p>
                <p className="l-fete-tries">남은 기회 {fete.triesLeft}번</p>
                {fete.kind === 'chuseok' ? (
                  <button
                    type="button"
                    className="l-primary"
                    disabled={busy || !fete.active || fete.triesLeft < 1}
                    onClick={() => void start()}
                    data-testid="fete-start"
                  >
                    송편 빚기 시작
                  </button>
                ) : (
                  <CrownMaker
                    inv={life.me.inv ?? {}}
                    disabled={busy || !fete.active || fete.triesLeft < 1}
                    onMake={(items) =>
                      void run({ kind: 'fete', op: 'crown', items }, '화관을 엮었어요! 순위표를 확인해 봐요.').then((ok) => ok && lifeSfx('donate'))
                    }
                  />
                )}
              </article>
              <article className="l-fete-card">
                <h3>
                  {fete.kind === 'chuseok' ? <Flame size={17} aria-hidden="true" /> : <Camera size={17} aria-hidden="true" />} {def.extra}
                </h3>
                <p className="l-help-text">{def.extraHelp}</p>
                {fete.kind === 'chuseok' ? (
                  <LanternForm
                    done={fete.lanterns.some((l) => l.actor === selfActor)}
                    disabled={busy || !fete.active || !night}
                    night={night}
                    onSend={(text) => run({ kind: 'fete', op: 'lantern', text }, '소원을 담은 등이 하늘로 올라가요.')}
                  />
                ) : (
                  <button
                    type="button"
                    className="l-primary"
                    disabled={busy || !fete.active || fete.photo.includes(selfActor)}
                    onClick={() => void run({ kind: 'fete', op: 'photo' }, '찰칵! 단체 사진에 들어갔어요.').then((ok) => ok && lifeSfx('pickup'))}
                    data-testid="fete-photo"
                  >
                    <Camera size={15} /> {fete.photo.includes(selfActor) ? '사진에 들어갔어요' : '사진에 들어가기'}
                  </button>
                )}
                {fete.kind === 'chuseok' ? (
                  <ul className="l-fete-lanterns" aria-label="띄운 등">
                    {fete.lanterns.map((l) => (
                      <li key={l.actor}>
                        <strong>{ACTORS[l.actor]}</strong> {l.text}
                      </li>
                    ))}
                    {!fete.lanterns.length && <li className="l-help-text">아직 띄운 등이 없어요.</li>}
                  </ul>
                ) : (
                  <div className="l-fete-photo" aria-label="단체 사진" data-testid="fete-photo-frame">
                    {fete.photo.length ? (
                      fete.photo.map((a) => (
                        <figure key={a}>
                          <span className="l-bond-face" aria-hidden="true">
                            <AvatarView actor={a} look={lookFor(a)} portrait />
                          </span>
                          <figcaption>{ACTORS[a]}</figcaption>
                        </figure>
                      ))
                    ) : (
                      <p className="l-help-text">아직 사진에 들어간 친구가 없어요.</p>
                    )}
                  </div>
                )}
              </article>
            </>
          )}
        </section>
        <aside className="l-fete-side">
          <h3>
            <Trophy size={16} aria-hidden="true" /> 순위표
          </h3>
          <ol className="l-fete-board" data-testid="fete-board">
            {board.map((r, i) => (
              <li key={r.actor} data-me={r.actor === selfActor || undefined}>
                <span className="l-fete-rank">{i + 1}</span>
                <span className="l-bond-face small" aria-hidden="true">
                  <AvatarView actor={r.actor} look={lookFor(r.actor)} portrait />
                </span>
                <span>{ACTORS[r.actor]}</span>
                <strong>{r.score}점</strong>
              </li>
            ))}
            {!board.length && <li className="l-help-text">첫 기록을 남겨 보세요.</li>}
          </ol>
          <dl className="l-fete-rewards">
            <dt>참여 선물</dt>
            <dd>
              {FURNITURE_BY_REF[def.joinFurniture]?.name}
              {def.joinItem ? `, ${ITEM_BY_ID[def.joinItem[0]]?.name} ${def.joinItem[1]}개` : ''}, {formatBeom(def.joinBeom)}
              {fete.joined ? ' · 받았어요' : ''}
            </dd>
            <dt>1등 선물</dt>
            <dd>{FURNITURE_BY_REF[def.winnerFurniture]?.name} · 축제가 끝나면 추억 앨범에 남아요</dd>
          </dl>
        </aside>
      </div>
    </Modal>
  );
}

function LanternForm({
  done,
  disabled,
  night,
  onSend,
}: {
  done: boolean;
  disabled: boolean;
  night: boolean;
  onSend: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState('');
  if (done) return <p className="l-fete-done">내 등은 이미 하늘에 떴어요.</p>;
  return (
    <form
      className="l-fete-lantern"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) void onSend(text.trim()).then((ok) => ok && setText(''));
      }}
    >
      <label>
        <span className="sr-only">등에 적을 소원</span>
        <input
          value={text}
          maxLength={LANTERN_TEXT_MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder={night ? '소원 한 줄 (24자)' : '해가 지면 띄울 수 있어요'}
          disabled={disabled}
          data-testid="fete-lantern-text"
        />
      </label>
      <button type="submit" className="l-primary" disabled={disabled || !text.trim()} data-testid="fete-lantern">
        등 띄우기
      </button>
    </form>
  );
}

function CrownMaker({ inv, disabled, onMake }: { inv: Record<string, number>; disabled: boolean; onMake: (items: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const flowers = Object.entries(inv)
    .filter(([id, n]) => ITEM_BY_ID[id]?.cat === 'flower' && n > 0)
    .sort(([a], [b]) => ITEM_BY_ID[a].sell - ITEM_BY_ID[b].sell);
  const left = (id: string) => (inv[id] ?? 0) - picked.filter((p) => p === id).length;
  const score = picked.reduce((s, id) => s + (ITEM_BY_ID[id]?.sell ?? 0), 0) + new Set(picked).size * 40;
  return (
    <div className="l-fete-crown">
      <div className="l-fete-slots" aria-label="고른 꽃">
        {Array.from({ length: CROWN_FLOWERS }, (_, i) => (
          <button
            key={i}
            type="button"
            className="l-fete-slot"
            disabled={!picked[i]}
            onClick={() => setPicked((p) => p.filter((_, j) => j !== i))}
            aria-label={picked[i] ? `${ITEM_BY_ID[picked[i]].name} 빼기` : '빈 자리'}
          >
            {picked[i] ? <ItemIcon id={picked[i]} size={34} /> : <span aria-hidden="true">+</span>}
          </button>
        ))}
        <span className="l-fete-score">예상 {score}점</span>
      </div>
      {flowers.length ? (
        <ul className="l-fete-flowers" aria-label="가방의 꽃">
          {flowers.map(([id]) => (
            <li key={id}>
              <button
                type="button"
                disabled={picked.length >= CROWN_FLOWERS || left(id) < 1}
                onClick={() => setPicked((p) => [...p, id])}
                data-testid={`crown-${id}`}
              >
                <ItemIcon id={id} size={30} count={left(id)} />
                <small>{ITEM_BY_ID[id].name}</small>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="l-help-text">가방에 꽃이 없어요. 풀밭과 숲에서 꽃을 주워 와요.</p>
      )}
      <button
        type="button"
        className="l-primary"
        disabled={disabled || picked.length !== CROWN_FLOWERS}
        onClick={() => {
          onMake(picked);
          setPicked([]);
        }}
        data-testid="fete-crown"
      >
        <Crown size={15} /> 화관 엮기
      </button>
    </div>
  );
}

/**
 * 송편 빚기: a marker sweeps the dough; press E / Space / Enter (or click)
 * when it is on the gold mark. Five rounds; each miss (ms from the mark) goes
 * to the server, which scores it. Reduced motion: the marker steps instead of
 * gliding.
 */
function SongpyeonGame({ token, onDone, onCancel }: { token: string; onDone: (token: string, marks: number[]) => void; onCancel: () => void }) {
  const [round, setRound] = useState(0);
  const [marks, setMarks] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const started = useRef(performance.now());
  const roundAt = useRef(performance.now());
  const sent = useRef(false);
  const stepped = useRef(reducedMotion());
  const target = 0.3 + (hash32(`${token}:${round}`) % 400) / 1000;
  const done = marks.length >= SONGPYEON_ROUNDS;
  // Marker: ping-pong 0 → 1 → 0, one way per SONGPYEON_ROUND_MS.
  useEffect(() => {
    if (done || flash) return;
    roundAt.current = performance.now();
    let raf = 0,
      timer = 0;
    const tick = () => {
      const t = (performance.now() - roundAt.current) / SONGPYEON_ROUND_MS;
      if (t > 4) {
        press(SONGPYEON_MISS_MS);
        return;
      }
      const p = t % 2 < 1 ? t % 1 : 1 - (t % 1);
      setPos(stepped.current ? Math.round(p * 10) / 10 : p);
    };
    if (stepped.current) timer = window.setInterval(tick, 140);
    else {
      const loop = () => {
        tick();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(timer);
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- restarts per round only.
  }, [round, done, flash]);
  // Everything scored: wait out the minimum time (steaming), then submit.
  useEffect(() => {
    if (!done || sent.current) return;
    sent.current = true;
    const wait = Math.max(0, SONGPYEON_ROUNDS * SONGPYEON_ROUND_MS - (performance.now() - started.current)) + 200;
    const t = setTimeout(() => onDone(token, marks), wait);
    return () => clearTimeout(t);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- once when done.
  }, [done]);
  function press(forced?: number) {
    if (done || flash) return;
    const miss = forced ?? Math.min(SONGPYEON_MISS_MS, Math.round(Math.abs(pos - target) * SONGPYEON_ROUND_MS));
    const s = songpyeonRound(miss);
    setMarks((m) => [...m, miss]);
    setFlash(s >= 90 ? '완벽해요!' : s >= 60 ? '예쁘게 빚었어요' : s > 0 ? '조금 삐뚤어요' : '터졌어요');
    setTimeout(() => {
      setFlash(null);
      setRound((r) => r + 1);
    }, 700);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const bound = actionForCode(getSettings().keys, e.code);
      if (e.code === 'Space' || e.code === 'Enter' || bound === 'action') {
        e.preventDefault();
        press();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const total = marks.reduce((s, m) => s + songpyeonRound(m), 0);
  return (
    <div className="l-songpyeon" data-testid="songpyeon">
      <div className="l-songpyeon-row" aria-label={`빚은 송편 ${marks.length}/${SONGPYEON_ROUNDS}`}>
        {Array.from({ length: SONGPYEON_ROUNDS }, (_, i) => {
          const s = marks[i] === undefined ? null : songpyeonRound(marks[i]);
          return <span key={i} className="l-songpyeon-cake" data-grade={s === null ? 'none' : s >= 90 ? 'gold' : s >= 60 ? 'good' : s > 0 ? 'ok' : 'miss'} />;
        })}
      </div>
      {done ? (
        <p className="l-songpyeon-status" aria-live="polite">
          송편을 찌는 중이에요… {total}점
        </p>
      ) : (
        <>
          <button type="button" className="l-songpyeon-track" onClick={() => press()} aria-label="지금 빚기 (E·Space)">
            <span className="l-songpyeon-mark" style={{ left: `${target * 100}%` }} aria-hidden="true" />
            <span className="l-songpyeon-dough" style={{ left: `${pos * 100}%` }} aria-hidden="true" />
          </button>
          <p className="l-songpyeon-status" aria-live="polite">
            {flash ?? `${round + 1}번째 송편 · 반죽이 금색 표시에 왔을 때 E·Space`}
          </p>
        </>
      )}
      <button type="button" className="l-secondary" onClick={onCancel} disabled={done}>
        그만하기
      </button>
    </div>
  );
}
