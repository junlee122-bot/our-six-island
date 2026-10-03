'use client';
// 시간 체계 P1 (handover/design/design-time-and-endgame.md §1-6): my bed.
// At game night it offers 하루 마감 (오늘 n번 남음); by day it says when, and
// a short rest is always there. After 하루 마감 the screen dims for a moment,
// a music-box jingle plays and the 결산 card shows what the day brought; any
// key closes it. The rules live in lounge-myday.ts (the server checks again).
import { useEffect, useRef, useState } from 'react';
import { Coins, Moon, Sparkles, Sprout, Sun } from '../ui/icons';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { EXTRA_DAYS_PER_REAL_DAY, MYDAY_REJECT, NIGHT_FROM, SLEEP_GROW_MS, isGameNight, type DayEndReport } from '../lounge-myday';
import { MOOD_TIER_BY_ID, REST_GAIN } from '../lounge-mood-data';
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
  if (phase === 'card' && md?.r) return <DayEndCard report={md.r} left={left} onClose={onClose} />;
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

/** The 결산 card (any key or click closes it). */
export function DayEndCard({ report, left, onClose }: { report: DayEndReport; left: number; onClose: () => void }) {
  const opened = useRef(Date.now());
  useEffect(() => {
    const key = () => {
      // The key that opened the card (E at the bed) does not close it at once.
      if (Date.now() - opened.current > 400) onClose();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  const mood = report.mood && Object.hasOwn(MOOD_TIER_BY_ID, report.mood) ? MOOD_TIER_BY_ID[report.mood as keyof typeof MOOD_TIER_BY_ID] : null;
  return (
    <Modal title="하루 결산" onClose={onClose} className="l-life-modal l-dayend-card" panel="note">
      <p className="l-modal-intro" data-testid="dayend-card">
        <Sparkles size={15} aria-hidden="true" /> 수고했어요! 나의 하루가 한 장 넘어갔어요.
      </p>
      <ul className="l-dayend-lines">
        <li>
          <Coins size={16} aria-hidden="true" />
          <span>출하 수입</span>
          <b>{report.ship ? `${formatBeom(report.ship)} · ${report.sold}개` : '없어요'}</b>
        </li>
        <li>
          <Sprout size={16} aria-hidden="true" />
          <span>자란 작물</span>
          <b>{report.grew ? `${report.grew}칸이 자랐어요 · 다 자란 칸 ${report.ripe}` : report.ripe ? `다 자란 칸 ${report.ripe}` : '촉촉한 작물이 없었어요'}</b>
        </li>
        {(report.fruit || report.manure) && (
          <li>
            <Sprout size={16} aria-hidden="true" />
            <span>농장</span>
            <b>{[report.fruit ? `과일 ${report.fruit}개` : '', report.manure ? `거름 ${report.manure}개` : ''].filter(Boolean).join(' · ')}</b>
          </li>
        )}
        <li>
          <Sparkles size={16} aria-hidden="true" />
          <span>오른 기술</span>
          <b>{report.lv?.length ? report.lv.map((u) => `${SKILL_INFO[u.s]?.name ?? u.s} Lv${u.lv}`).join(' · ') : '오늘은 차곡차곡 쌓았어요'}</b>
        </li>
        <li>
          <Moon size={16} aria-hidden="true" />
          <span>오늘의 기분</span>
          <b>{mood?.name ?? '평온해요'}</b>
        </li>
      </ul>
      {report.rest && <p className="l-help-text">푹 쉬고 왔어요: 다음 XP 2배</p>}
      {report.mk && <p className="l-help-text">이번 주 밀린 기회를 하루 썼어요.</p>}
      <p className="l-help-text">
        {left > 0 ? `오늘은 ${left}번 더 마감할 수 있어요.` : '오늘은 충분히 잤어요.'} 아무 키나 누르면 닫혀요.
      </p>
    </Modal>
  );
}
