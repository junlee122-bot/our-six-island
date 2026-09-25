'use client';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ONBOARDING_KEY, getSettings, recall, remember } from '../lounge-settings';
import { keyLabel } from '../lounge-keybinds';

/** The action key as the player bound it (E by default). */
const actionKey = () => keyLabel(getSettings().keys.action);
type Step = {
  target: string;
  title: string;
  text: (key: string) => string;
  /** Optional extra action shown on the card. */
  action?: { label: string; event: string };
};
/** The day starts in my room: two short marks before the first walk outside. */
const ROOM_STEPS: readonly Step[] = [
  {
    target: '[data-testid="bedroom-3d"]',
    title: '내 방에서 하루를 시작해요',
    text: () =>
      '바닥을 클릭하거나 방향키·WASD로 걸어요. 왼쪽 문으로 걸어 나가면 마을이에요. Esc를 누르면 메뉴가 열려요.',
  },
  {
    target: '[data-testid="action-button"]',
    title: '할 수 있는 일은 버튼 하나로',
    text: (key) =>
      `오른쪽 아래 버튼이 가까이 있는 것에 맞춰 바뀌어요. 문 앞에서는 “나가기”, 방 안에서는 “꾸미기”. 키보드는 언제나 ${key}예요.`,
  },
];
const STEPS: readonly Step[] = [
  {
    target: '.l-village-world, .l-simple-village',
    title: '마을을 걸어요',
    text: (key) =>
      `바닥을 클릭하거나 방향키·WASD로 걸어요. 문 앞이나 밭 앞에 서면 오른쪽 아래 버튼이 바뀌고, ${key}로 눌러요. F1은 조작 안내예요.`,
  },
  {
    target: '[data-coach="presence"]',
    title: '친구들은 여기 모여요',
    text: () => '로그인한 친구는 모두 같은 마을에 들어와요. 누가 있는지 여기서 봐요.',
  },
  {
    target: '[data-coach="invite"]',
    title: '테이블에 앉아 한 판',
    text: () => '게임을 고르면 회관이나 카지노의 그 테이블로 가요. 앉은 뒤 친구를 부르고, 자리가 차면 바로 시작해요.',
  },
  {
    target: '[data-farm-label="mine"], [data-testid="simple-farm"]',
    title: '내 집 앞 텃밭',
    text: (key) =>
      `금색 테두리가 내 텃밭 6칸이에요. 가까이 가서 ${key}를 누르면 씨앗을 심고 물을 줄 수 있어요. 광장 옆 큰 밭은 마을 공동 밭이에요.`,
    action: { label: '내 텃밭으로 가 보기', event: 'bumtadew:guide-farm' },
  },
  {
    target: '[data-testid="dock-bag"]',
    title: '가방 · 상점 · 친구 집',
    text: (key) =>
      `수확물은 가방(I)에서 팔고, 광장 옆 범타듀 상점에서 씨앗과 희귀 소품을 사요. 친구 집 앞에서 ${key}를 누르면 놀러 가서 방명록을 남길 수 있어요.`,
  },
];

type Rect = { top: number; left: number; width: number; height: number };

export function shouldOnboard() {
  return recall(ONBOARDING_KEY) !== 'done';
}
const ROOM_ONBOARDING_KEY = 'bumtadew-onboarding-room-v1';
export function shouldOnboardRoom() {
  return recall(ROOM_ONBOARDING_KEY) !== 'done';
}

/** First-login coach marks (walk → 친구 모이기 → 게임 초대 → 텃밭·상점·친구 집), stored in localStorage. */
export function Onboarding({
  onDone,
  place = 'village',
}: {
  onDone: () => void;
  /** 'room': the two marks in my room at the start of the day. */
  place?: 'village' | 'room';
}) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const steps = place === 'room' ? ROOM_STEPS : STEPS;
  const current = steps[step];
  const finish = () => {
    remember(place === 'room' ? ROOM_ONBOARDING_KEY : ONBOARDING_KEY, 'done');
    onDone();
  };
  useLayoutEffect(() => {
    const measure = () => {
      const el = [...document.querySelectorAll(current.target)].find(
        (node) => getComputedStyle(node).visibility !== 'hidden',
      );
      if (!el) return setRect(null);
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [current.target]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const big = rect && rect.height > window.innerHeight * 0.5;
  const below =
    rect && !big && rect.top + rect.height < window.innerHeight * 0.55;
  // A target in the lower part of the screen (the bag button on phones) gets
  // the card above it so the card never covers what it points at.
  const above = rect && !big && !below;
  return (
    <aside className="l-coach" aria-labelledby="l-coach-title">
      {rect && !big && (
        <span
          className="l-coach-ring"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
          aria-hidden="true"
        />
      )}
      <div
        className="l-coach-card"
        style={
          below
            ? {
                top: Math.min(
                  rect!.top + rect!.height + 14,
                  window.innerHeight - 200,
                ),
              }
            : above
              ? { bottom: Math.max(24, window.innerHeight - rect!.top + 14) }
              : { bottom: 'calc(24px + env(safe-area-inset-bottom))' }
        }
      >
        <small>
          {step + 1} / {steps.length}
        </small>
        <h2 id="l-coach-title">{current.title}</h2>
        <p>{current.text(actionKey())}</p>
        {current.action && (
          <button
            className="l-secondary l-coach-action"
            onClick={() => {
              window.dispatchEvent(new Event(current.action!.event));
              setStep(step + 1);
            }}
          >
            {current.action.label}
          </button>
        )}
        <div>
          <button className="l-text" onClick={finish}>
            건너뛰기
          </button>
          <button
            className="l-primary"
            onClick={() =>
              step + 1 < steps.length ? setStep(step + 1) : finish()
            }
          >
            {step + 1 < steps.length ? '다음' : '시작하기'}
          </button>
        </div>
      </div>
    </aside>
  );
}
