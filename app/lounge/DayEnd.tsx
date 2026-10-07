'use client';
// 시간 체계 P1 (handover/design/design-time-and-endgame.md §1-6): my bed.
// At game night it offers 하루 마감 (오늘 n번 남음); by day it says when, and
// a short rest is always there. After 하루 마감 the screen dims for a moment,
// a music-box jingle plays and the 결산 card shows what the day brought; any
// key closes it. The rules live in lounge-myday.ts (the server checks again).
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Cloud, CloudLightning, CloudRain, Coins, Gift, Moon, PartyPopper, Snowflake, Sparkles, Sprout, Store, Sun } from '../ui/icons';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { EXTRA_DAYS_PER_REAL_DAY, MYDAY_REJECT, NIGHT_FROM, SLEEP_GROW_MS, isGameNight, type DayEndReport } from '../lounge-myday';
import { GOOD_MOOD_CAP_BONUS, MOOD_TIER_BY_ID, REST_GAIN } from '../lounge-mood-data';
import { forecastOf } from '../lounge-forecast';
import { SKILL_INFO } from '../lounge-growth-data';
import { formatBeom } from '../lounge-text';
import { loungeAudio } from '../lounge-audio';
import { GameButton } from '../ui/GameButton';
import { Modal } from './Modal';
import type { Notify } from './Toast';
import { useNow } from './use-now';
import './day-end.css';

/** How long the screen stays dark before the card. */
const FADE_MS = 1_400;

export function DayEndPanel({ room, view, notify, onClose }: { room: CloudRoom; view: CloudRoomView; notify: Notify; onClose: () => void }) {
  const now = useNow(true, 5_000) + view.clockOffset;
  const md = view.life?.myday;
  const [phase, setPhase] = useState<'ask' | 'fade' | 'card'>('ask');
  const [busy, setBusy] = useState(false);
  const night = isGameNight(now),
    left = md?.left ?? 0;
  const restWait = (view.life?.mood?.restAt ?? 0) > now;
  useEffect(() => {
    if (phase !== 'fade') return;
    const t = setTimeout(() => setPhase('card'), FADE_MS);
    return () => clearTimeout(t);
  }, [phase]);
  const endDay = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (await room.endDay()) {
        loungeAudio.chime('dayEnd');
        setPhase('fade');
      }
    } finally {
      setBusy(false);
    }
  };
  const rest = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (await room.life({ kind: 'bedRest' })) notify(`폭신한 침대에서 잠깐 쉬었어요. 휴식 +${REST_GAIN}`);
    } finally {
      setBusy(false);
    }
  };
  if (phase === 'fade') return <div className="l-dayend-fade" data-testid="dayend-fade" aria-hidden="true" />;
  if (phase === 'card' && md?.r) return <DayEndCard report={md.r} left={left} onClose={onClose} now={now} />;
  const why = !night ? `밤 ${NIGHT_FROM - 12}시부터 할 수 있어요` : left <= 0 ? MYDAY_REJECT.enough : undefined;
  return (
    <Modal title="포근한 침대" onClose={onClose} className="l-life-modal l-dayend" panel="note">
      <p className="l-modal-intro">
        {night ? <Moon size={15} aria-hidden="true" /> : <Sun size={15} aria-hidden="true" />}{' '}
        {night ? '밤이 깊었어요. 오늘 하루를 마감할까요?' : '아직 낮이에요. 하루 마감은 밤에 할 수 있어요.'}
      </p>
      <div className="l-dayend-actions">
        <GameButton variant="primary" data-testid="dayend-go" disabled={busy || !night || left <= 0} disabledReason={why} onClick={() => void endDay()}>
          <Moon size={16} aria-hidden="true" /> 하루 마감하기 {night && left > 0 ? `(오늘 ${left}번 남음)` : ''}
        </GameButton>
        <GameButton data-testid="dayend-rest" disabled={busy || restWait} disabledReason={restWait ? '조금 전에 쉬었어요' : undefined} onClick={() => void rest()}>
          잠깐 쉬기 · 휴식 +{REST_GAIN}
        </GameButton>
      </div>
      {why && (
        <p className="l-help-text" data-testid="dayend-why">
          {why}
        </p>
      )}
      <ul className="l-dayend-rules">
        <li>나의 하루가 하루 지나요. 채집·광석·대화·선물·동물 돌보기를 다시 할 수 있어요.</li>
        <li>내 밭에서 촉촉한 작물은 {SLEEP_GROW_MS / 3_600_000}시간 더 자라요. 마른 작물은 물을 기다려요.</li>
        <li>출하 상자를 바로 정산해요. 하루에 팔 수 있는 한도는 그대로예요.</li>
        <li>
          마을 시계는 그대로 흘러요. 실제 하루에 {EXTRA_DAYS_PER_REAL_DAY}번까지{md?.mk ? ` · 이번 주 밀린 기회 ${md.mk}번` : ''}.
        </li>
      </ul>
    </Modal>
  );
}

/** Count-up (Stardew-style): each line rolls from 0 after `delay`; reduced motion shows it at once. */
const COUNT_MS = 650,
  LINE_GAP_MS = 220;
const reducedMotion = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};
function useCountUp(target: number, delay: number, instant: boolean) {
  const still = instant || target <= 0;
  const [v, setV] = useState(0);
  useEffect(() => {
    if (still) return;
    let raf = 0;
    const t0 = performance.now() + delay;
    const tick = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - t0) / COUNT_MS));
      setV(Math.round(target * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, still]);
  return still ? target : v;
}
function Num({ n, i, instant, fmt = String }: { n: number; i: number; instant: boolean; fmt?: (n: number) => string }) {
  return <span className="l-dayend-num">{fmt(useCountUp(n, i * LINE_GAP_MS, instant))}</span>;
}
const WEATHER_ICON = { sunny: Sun, cloudy: Cloud, rain: CloudRain, storm: CloudLightning, snow: Snowflake } as const;

/** The 결산 card (any key or click closes it). */
export function DayEndCard({ report, left, onClose, now }: { report: DayEndReport; left: number; onClose: () => void; now: number }) {
  const opened = useRef(0);
  const [instant] = useState(reducedMotion);
  useEffect(() => {
    opened.current = Date.now();
    const key = () => {
      // The key that opened the card (E at the bed) does not close it at once.
      if (Date.now() - opened.current > 400) onClose();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  const mood = report.mood && Object.hasOwn(MOOD_TIER_BY_ID, report.mood) ? MOOD_TIER_BY_ID[report.mood as keyof typeof MOOD_TIER_BY_ID] : null;
  const moodEffect = !mood
    ? ''
    : mood.xp > 1
      ? `XP ×${mood.xp} · 하루 XP 한도 +${Math.round(GOOD_MOOD_CAP_BONUS * 100)}%`
      : mood.xp < 1
        ? `XP ×${mood.xp} · 푹 쉬면 나아져요`
        : `기분이 좋으면 하루 XP 한도 +${Math.round(GOOD_MOOD_CAP_BONUS * 100)}%`;
  const fc = forecastOf(now),
    WeatherIcon = WEATHER_ICON[fc.weather];
  return (
    <Modal title="하루 결산" onClose={onClose} className="l-life-modal l-dayend-card" panel="note">
      <p className="l-modal-intro" data-testid="dayend-card">
        <Sparkles size={15} aria-hidden="true" /> 수고했어요! 나의 하루가 한 장 넘어갔어요.
      </p>
      <ul className="l-dayend-lines">
        <li>
          <Coins size={16} aria-hidden="true" />
          <span>출하 수입</span>
          <b>
            {report.ship ? (
              <>
                <Num n={report.ship} i={0} instant={instant} fmt={formatBeom} /> · <Num n={report.sold} i={0} instant={instant} />개
              </>
            ) : (
              '없어요'
            )}
          </b>
        </li>
        <li style={{ animationDelay: `${LINE_GAP_MS}ms` }}>
          <Sprout size={16} aria-hidden="true" />
          <span>자란 작물</span>
          <b>
            {report.grew ? (
              <>
                <Num n={report.grew} i={1} instant={instant} />칸이 자랐어요 · 다 자란 칸 <Num n={report.ripe} i={1} instant={instant} />
              </>
            ) : report.ripe ? (
              <>
                다 자란 칸 <Num n={report.ripe} i={1} instant={instant} />
              </>
            ) : (
              '촉촉한 작물이 없었어요'
            )}
          </b>
        </li>
        {(report.fruit || report.manure) && (
          <li style={{ animationDelay: `${LINE_GAP_MS * 2}ms` }}>
            <Sprout size={16} aria-hidden="true" />
            <span>농장</span>
            <b>
              {report.fruit ? (
                <>
                  과일 <Num n={report.fruit} i={2} instant={instant} />개
                </>
              ) : null}
              {report.fruit && report.manure ? ' · ' : null}
              {report.manure ? (
                <>
                  거름 <Num n={report.manure} i={2} instant={instant} />개
                </>
              ) : null}
            </b>
          </li>
        )}
        <li style={{ animationDelay: `${LINE_GAP_MS * 3}ms` }}>
          <Sparkles size={16} aria-hidden="true" />
          <span>오른 기술</span>
          <b>{report.lv?.length ? report.lv.map((u) => `${SKILL_INFO[u.s]?.name ?? u.s} Lv${u.lv}`).join(' · ') : '오늘은 차곡차곡 쌓았어요'}</b>
        </li>
        <li style={{ animationDelay: `${LINE_GAP_MS * 4}ms` }}>
          <Moon size={16} aria-hidden="true" />
          <span>오늘의 기분</span>
          <b>
            {mood?.name ?? '평온해요'}
            {moodEffect && (
              <small className="l-dayend-effect" data-testid="dayend-mood-effect">
                {moodEffect}
              </small>
            )}
          </b>
        </li>
      </ul>
      <section className="l-dayend-tomorrow" aria-label="내일 예고" data-testid="dayend-tomorrow">
        <h3>
          <CalendarDays size={15} aria-hidden="true" /> 내일 · {fc.date}
        </h3>
        <ul>
          <li>
            <WeatherIcon size={15} aria-hidden="true" />
            {fc.weatherName}
            {fc.waters ? ' · 밭에 물을 안 줘도 돼요' : ''}
          </li>
          {report.soon ? (
            <li>
              <Sprout size={15} aria-hidden="true" />
              물 주면 익을 작물 {report.soon}칸
            </li>
          ) : null}
          {fc.events.map((e) => (
            <li key={e.id}>
              {e.kind === 'birthday' ? <Gift size={15} aria-hidden="true" /> : e.kind === 'stall' || e.kind === 'weekly' ? <Store size={15} aria-hidden="true" /> : <PartyPopper size={15} aria-hidden="true" />}
              {e.name}
            </li>
          ))}
        </ul>
      </section>
      {report.rest && <p className="l-help-text">푹 쉬고 왔어요: 다음 XP 2배</p>}
      {report.mk && <p className="l-help-text">이번 주 밀린 기회를 하루 썼어요.</p>}
      <p className="l-help-text">
        {left > 0 ? `오늘은 ${left}번 더 마감할 수 있어요.` : '오늘은 충분히 잤어요.'} 아무 키나 누르면 닫혀요.
      </p>
    </Modal>
  );
}
