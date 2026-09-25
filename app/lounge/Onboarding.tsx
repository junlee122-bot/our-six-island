'use client';
// First-day tutorial: four things to actually do, each finished by doing it
// (not by reading): walk, go through a door, open the bag, plant one seed.
// A small card under the header says what to press using the player's own
// key bindings (lounge-keybinds.ts); the scene keeps every key, so nothing
// blocks the step it asks for. Skippable at any time.
import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { ONBOARDING_KEY, getSettings, recall, remember } from '../lounge-settings';
import { actionForCode, keyLabel } from '../lounge-keybinds';
import {
  TUTORIAL_STEPS,
  tutorialNext,
  tutorialStepDone,
  type TutorialStep,
} from '../lounge-tutorial';

const ROOM_ONBOARDING_KEY = 'bumtadew-onboarding-room-v1';

export function shouldOnboard() {
  return recall(ONBOARDING_KEY) !== 'done';
}
export function shouldOnboardRoom() {
  return recall(ROOM_ONBOARDING_KEY) !== 'done';
}
/** Done or skipped: never start again on this device (menu can replay it). */
function markDone() {
  remember(ONBOARDING_KEY, 'done');
  remember(ROOM_ONBOARDING_KEY, 'done');
}

const MOVES = new Set(['up', 'down', 'left', 'right']);
const ARROWS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

function Kbd({ children }: { children: string }) {
  return <kbd className="l-tutorial-key">{children}</kbd>;
}

export function Onboarding({
  place,
  bagOpen,
  hidden,
  planted,
  onGoFarm,
  onDone,
}: {
  /** Where I am: 'bedroom' (my room), 'village', or an interior. */
  place: string;
  /** The bag window is open (step 3 is done by opening it). */
  bagOpen: boolean;
  /** Another window covers the scene: keep tracking, show nothing. */
  hidden: boolean;
  /** Plots on my farm with a crop (step 4 is done when this goes up). */
  planted: number;
  /** "내 텃밭으로 가기" on the last step. */
  onGoFarm?: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<TutorialStep>('move');
  const [cheer, setCheer] = useState(false);
  const [moved, setMoved] = useState(false);
  const index = TUTORIAL_STEPS.indexOf(step);
  // Where the current step began (a door step is "somewhere else than here").
  const [start, setStart] = useState({ place, planted });
  const finish = () => {
    markDone();
    onDone();
  };
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });
  const snapshot = { moved, place, bagOpen, planted };
  const stepDone = tutorialStepDone(step, snapshot, start);
  // A finished step shows "잘했어요!" briefly, then the next one starts from
  // the state at that moment.
  const latest = useRef(snapshot);
  useEffect(() => {
    latest.current = { moved, place, bagOpen, planted };
  });
  useEffect(() => {
    if (!stepDone) return;
    const cheerTimer = setTimeout(() => setCheer(true), 0);
    const timer = setTimeout(() => {
      setCheer(false);
      const next = tutorialNext(step);
      if (!next) {
        markDone();
        doneRef.current();
        return;
      }
      setStart({ place: latest.current.place, planted: latest.current.planted });
      setStep(next);
    }, 800);
    return () => {
      clearTimeout(cheerTimer);
      clearTimeout(timer);
    };
  }, [stepDone, step]);
  // Step 1: any walking input (bound keys, arrows, or a click on the floor).
  useEffect(() => {
    if (step !== 'move' || moved) return;
    const key = (e: KeyboardEvent) => {
      const action = actionForCode(getSettings().keys, e.code);
      if ((action && MOVES.has(action)) || ARROWS.has(e.code)) setMoved(true);
    };
    const click = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t?.closest?.('[data-testid=village-3d] canvas, [data-testid=bedroom-3d] canvas'))
        setMoved(true);
    };
    window.addEventListener('keydown', key);
    window.addEventListener('pointerdown', click);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('pointerdown', click);
    };
  }, [step, moved]);

  if (hidden) return null;
  const keys = getSettings().keys;
  const act = keyLabel(keys.action),
    bag = keyLabel(keys.inventory),
    walk = [keys.up, keys.left, keys.down, keys.right].map(keyLabel).join('');
  const inRoom = place === 'bedroom';
  const body =
    step === 'move' ? (
      <>
        <Kbd>{walk}</Kbd> 또는 방향키로 걸어 보세요. 바닥을 클릭해도 걸어가요.{' '}
        <Kbd>Shift</Kbd>를 누르고 있으면 달려요.
      </>
    ) : step === 'door' ? (
      inRoom ? (
        <>
          왼쪽 문 앞까지 걸어가서 <Kbd>{act}</Kbd>를 눌러 마을로 나가요.
          오른쪽 아래 버튼이 “나가기”로 바뀌면 문 앞이에요.
        </>
      ) : (
        <>
          아무 집이나 건물 문 앞에 서서 <Kbd>{act}</Kbd>를 눌러 들어가 보세요.
          <Kbd>Esc</Kbd> 메뉴나 “나가기”로 언제든 돌아와요.
        </>
      )
    ) : step === 'bag' ? (
      <>
        <Kbd>{bag}</Kbd>를 눌러 가방을 열어요. 씨앗과 수확물이 여기 모여요.
        다 보면 <Kbd>Esc</Kbd>로 닫아요.
      </>
    ) : (
      <>
        내 집 앞 금색 테두리 텃밭으로 가서 <Kbd>{act}</Kbd>를 누르고 씨앗을 하나
        심어요.
      </>
    );
  const title =
    step === 'move'
      ? '걸어 보기'
      : step === 'door'
        ? inRoom
          ? '문으로 나가기'
          : '문으로 들어가기'
        : step === 'bag'
          ? '가방 열기'
          : '씨앗 하나 심기';
  return (
    <aside
      className="l-tutorial"
      aria-labelledby="l-tutorial-title"
      data-testid="tutorial"
      data-step={step}
      data-cheer={cheer || undefined}
    >
      <div className="l-tutorial-head">
        <small>
          처음 해 보기 · {index + 1}/{TUTORIAL_STEPS.length}
        </small>
        <ol className="l-tutorial-dots" aria-hidden="true">
          {TUTORIAL_STEPS.map((s, i) => (
            <li key={s} data-state={i < index ? 'done' : i === index ? 'now' : 'next'} />
          ))}
        </ol>
      </div>
      <h2 id="l-tutorial-title">
        {cheer && <Check size={18} aria-hidden="true" />}
        {cheer ? '잘했어요!' : title}
      </h2>
      <p aria-live="polite">{body}</p>
      <div className="l-tutorial-actions">
        {step === 'plant' && onGoFarm && !cheer && (
          <button className="l-secondary" onClick={onGoFarm} data-testid="tutorial-farm">
            내 텃밭으로 가기
          </button>
        )}
        <button className="l-text" onClick={finish} data-testid="tutorial-skip">
          건너뛰기
        </button>
      </div>
    </aside>
  );
}
