'use client';
// HUD pieces of the friend-life features:
// - "마을 적응하기" (C-10): optional follow-up steps after the first-day
//   tutorial (sell, fish, the board, a table / solo game), each with a small
//   reward claimed on the server. Collapsible; hidden for good once all are
//   claimed or when the player hides it (per device).
// - The festival banner (C-6): on festival days, where to go and a button
//   that opens the festival panel.
import { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Gift, ListChecks, MapPin, PartyPopper, X } from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { ADAPT_STEPS, FETES, type AdaptStepId } from '../lounge-social-defs';
import { FURNITURE_BY_REF } from '../lounge-items';
import { formatBeom } from '../lounge-text';
import { recall, remember } from '../lounge-settings';
import type { Notify } from './Toast';
import { useLifeAction } from './LifePanels';
import './social.css';

const LOCAL_KEY = 'bumtadew-adapt-local-v1';
const HIDE_KEY = 'bumtadew-adapt-hidden-v1';
const FOLD_KEY = 'bumtadew-adapt-folded-v1';

/** Steps the server cannot see (board opened, table sat at): remembered per device. */
export function markAdaptLocal(step: 'board' | 'table') {
  try {
    const raw = JSON.parse(recall(LOCAL_KEY) ?? '{}');
    if (raw[step]) return;
    remember(LOCAL_KEY, JSON.stringify({ ...raw, [step]: true }));
    window.dispatchEvent(new CustomEvent('bumtadew:adapt'));
  } catch {}
}
function localDone(): Record<string, boolean> {
  try {
    const raw = JSON.parse(recall(LOCAL_KEY) ?? '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

export function AdaptChecklist({ room, view, notify, hidden }: { room: CloudRoom; view: CloudRoomView; notify: Notify; hidden?: boolean }) {
  const life = view.life;
  const [run, busy] = useLifeAction(room, notify);
  const [dismissed, setDismissed] = useState(() => recall(HIDE_KEY) === '1');
  const [folded, setFolded] = useState(() => recall(FOLD_KEY) === '1');
  const [, setTick] = useState(0);
  useEffect(() => {
    const again = () => setTick((t) => t + 1);
    window.addEventListener('bumtadew:adapt', again);
    return () => window.removeEventListener('bumtadew:adapt', again);
  }, []);
  const social = life?.social;
  if (hidden || dismissed || !life || !social) return null;
  const claimed = new Set(social.adapt);
  if (ADAPT_STEPS.every((s) => claimed.has(s.id))) return null;
  const local = localDone();
  const stats = life.me.stats ?? {};
  const done = (id: AdaptStepId) =>
    claimed.has(id) || (id === 'sell' ? (stats.earned ?? 0) > 0 : id === 'fish' ? (stats.fish ?? 0) > 0 : !!local[id]);
  const count = ADAPT_STEPS.filter((s) => claimed.has(s.id)).length;
  return (
    <section className="l-adapt" aria-label="마을 적응하기" data-testid="adapt-checklist" data-folded={folded || undefined}>
      <header>
        <ListChecks size={16} aria-hidden="true" />
        <strong>마을 적응하기</strong>
        <small>
          {count}/{ADAPT_STEPS.length}
        </small>
        <button
          type="button"
          className="l-adapt-icon"
          aria-expanded={!folded}
          aria-label={folded ? '펼치기' : '접기'}
          onClick={() => {
            setFolded(!folded);
            remember(FOLD_KEY, folded ? null : '1');
          }}
        >
          {folded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
        <button
          type="button"
          className="l-adapt-icon"
          aria-label="마을 적응하기 숨기기"
          onClick={() => {
            setDismissed(true);
            remember(HIDE_KEY, '1');
          }}
        >
          <X size={15} />
        </button>
      </header>
      {!folded && (
        <>
          <ol>
            {ADAPT_STEPS.map((s) => {
              const isClaimed = claimed.has(s.id),
                isDone = done(s.id);
              return (
                <li key={s.id} data-done={isDone || undefined} data-claimed={isClaimed || undefined}>
                  <span className="l-adapt-check" aria-hidden="true">
                    {isDone ? <Check size={13} /> : null}
                  </span>
                  <span className="l-adapt-text">
                    <b>{s.title}</b>
                    <small>{isClaimed ? '보상을 받았어요' : isDone ? `보상 ${formatBeom(s.reward)}을 받을 수 있어요` : s.hint}</small>
                  </span>
                  {isDone && !isClaimed && (
                    <button
                      type="button"
                      className="l-primary l-adapt-claim"
                      disabled={busy}
                      onClick={() => void run({ kind: 'adapt', step: s.id }, `${s.title} 완료! +${formatBeom(s.reward)}`)}
                      data-testid={`adapt-claim-${s.id}`}
                    >
                      <Gift size={13} /> 받기
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="l-adapt-foot">모두 마치면 {FURNITURE_BY_REF['furn-radio']?.name ?? '가구'}를 선물로 받아요.</p>
        </>
      )}
    </section>
  );
}

/** Festival day banner: what's on and a button to the festival booth. */
export function FeteBanner({ view, onOpen, onGo }: { view: CloudRoomView; onOpen: () => void; onGo: () => void }) {
  const fete = view.life?.social?.fete;
  if (!fete?.active) return null;
  const def = FETES[fete.kind];
  return (
    <section className="l-fete-banner" aria-label="오늘의 축제" data-testid="fete-banner" data-kind={fete.kind}>
      <PartyPopper size={16} aria-hidden="true" />
      <span>
        <b>오늘은 {def.name}</b>
        <small>
          {def.game} · {def.extra}
        </small>
      </span>
      <button type="button" className="l-secondary" onClick={onGo}>
        <MapPin size={13} /> 가 보기
      </button>
      <button type="button" className="l-primary" onClick={onOpen} data-testid="fete-open">
        참여하기
      </button>
    </section>
  );
}
