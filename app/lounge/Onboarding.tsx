'use client';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ONBOARDING_KEY, recall, remember } from '../lounge-settings';

/** Phones say "눌러서", keyboards say "E". */
const touch = () => {
  try {
    return matchMedia('(hover: none) and (pointer: coarse)').matches;
  } catch {
    return false;
  }
};
type Step = {
  target: string;
  title: string;
  text: (touch: boolean) => string;
  /** Optional extra action shown on the card. */
  action?: { label: string; event: string };
};
const STEPS: readonly Step[] = [
  {
    target: '.l-village-world, .l-simple-village',
    title: '마을을 걸어요',
    text: (t) =>
      t
        ? '바닥을 누르면 그곳까지 걸어가요. 건물 이름을 누르면 문 앞까지 가요.'
        : '건물 이름을 누르면 문 앞까지 걸어가요. 키보드는 방향키나 WASD를 써요.',
  },
  {
    target: '[data-coach="presence"]',
    title: '친구들은 여기 모여요',
    text: () => '로그인한 친구는 모두 같은 마을에 들어와요. 누가 있는지 여기서 봐요.',
  },
  {
    target: '[data-coach="invite"]',
    title: '게임에 초대해요',
    text: () => '게임과 친구를 고르면 초대장이 가요. 수락하면 함께 게임으로 이동해요.',
  },
  {
    target: '[data-farm-label="mine"], [data-testid="simple-farm"]',
    title: '내 집 앞 텃밭',
    text: (t) =>
      `금색 테두리가 내 텃밭 6칸이에요. 가까이 가서 ${t ? '“텃밭 돌보기”를 누르면' : 'E를 누르면'} 씨앗을 심고 물을 줄 수 있어요. 광장 옆 큰 밭은 마을 공동 밭이에요.`,
    action: { label: '내 텃밭으로 가 보기', event: 'bumtadew:guide-farm' },
  },
  {
    target: '[data-testid="dock-bag"]',
    title: '가방 · 상점 · 친구 집',
    text: (t) =>
      `수확물은 가방에서 팔고, 광장 옆 범타듀 상점에서 씨앗과 희귀 소품을 사요. 친구 집 앞에서 ${t ? '“놀러 가기”를 누르면' : 'E를 누르면'} 놀러 가서 방명록을 남길 수 있어요.`,
  },
];

type Rect = { top: number; left: number; width: number; height: number };

export function shouldOnboard() {
  return recall(ONBOARDING_KEY) !== 'done';
}

/** First-login coach marks (walk → 친구 모이기 → 게임 초대 → 텃밭·상점·친구 집), stored in localStorage. */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const current = STEPS[step];
  const finish = () => {
    remember(ONBOARDING_KEY, 'done');
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
          {step + 1} / {STEPS.length}
        </small>
        <h2 id="l-coach-title">{current.title}</h2>
        <p>{current.text(touch())}</p>
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
              step + 1 < STEPS.length ? setStep(step + 1) : finish()
            }
          >
            {step + 1 < STEPS.length ? '다음' : '시작하기'}
          </button>
        </div>
      </div>
    </aside>
  );
}
