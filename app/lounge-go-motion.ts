import { LOUNGE_ASSETS } from './lounge-assets';
import { cardInfo, type GoMotion } from './lounge-gostop';
type Point = { x: number; y: number };
type Flying = { el: HTMLDivElement; x: number; y: number; angle: number };
export async function playGoMotion(
  root: HTMLElement,
  motion: GoMotion,
  names: string[],
  signal: AbortSignal,
  onLabel: (text: string) => void,
) {
  const overlay = document.createElement('div');
  overlay.className = 'g-motion-layer';
  overlay.setAttribute('aria-hidden', 'true');
  root.appendChild(overlay);
  const cards = new Map<string, Flying>(),
    hidden = new Map<HTMLElement, string>(),
    animations = new Set<Animation>();
  const size =
    parseFloat(getComputedStyle(root).getPropertyValue('--card-size')) || 65;
  const center = (el: Element | null): Point => {
    const r = (el ?? root).getBoundingClientRect(),
      b = root.getBoundingClientRect();
    return {
      x: r.left - b.left - root.clientLeft + r.width / 2,
      y: r.top - b.top - root.clientTop + r.height / 2,
    };
  };
  const node = (query: string) => root.querySelector(query);
  const floor = (card: string) =>
    center(node(`.g-month-group[data-month="${cardInfo(card).month}"]`));
  const pile = (seat: number, card: string) =>
    center(
      node(
        `.g-capture-zone[data-seat="${seat}"] [data-category="${cardInfo(card).type}"]`,
      ),
    );
  const hand = (seat: number) =>
    center(node(`.g-hand-origin[data-seat="${seat}"]`));
  const hide = (el: Element | null) => {
    if (el instanceof HTMLElement && !hidden.has(el)) {
      hidden.set(el, el.style.visibility);
      el.style.visibility = 'hidden';
    }
  };
  const abort = () => {
    for (const a of animations) a.cancel();
  };
  signal.addEventListener('abort', abort, { once: true });
  const animate = async (
    el: HTMLElement,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
  ) => {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const a = el.animate(frames, { ...options, fill: 'forwards' });
    animations.add(a);
    try {
      await a.finished;
    } finally {
      animations.delete(a);
    }
  };
  const create = (card: string, from: Point, back = false) => {
    if (cards.has(card)) return cards.get(card)!;
    const el = document.createElement('div');
    el.className = 'g-flying-card';
    el.style.width = size + 'px';
    el.style.height = size * 1.6 + 'px';
    const inner = document.createElement('div');
    inner.className = 'g-flying-inner';
    const front = document.createElement('img');
    front.className = 'g-flying-front';
    front.src = (LOUNGE_ASSETS as Record<string, string>)[card];
    front.alt = '';
    const reverse = document.createElement('span');
    reverse.className = 'g-flying-back';
    reverse.textContent = '花';
    inner.appendChild(front);
    inner.appendChild(reverse);
    if (back) inner.style.transform = 'rotateY(180deg)';
    el.appendChild(inner);
    overlay.appendChild(el);
    el.style.transform = `translate(${from.x - size / 2}px,${from.y - size * 0.8}px)`;
    const f = { el, ...from, angle: 0 };
    cards.set(card, f);
    return f;
  };
  const fly = async (
    f: Flying,
    to: Point,
    ms: number,
    angle = 0,
    shrink = false,
  ) => {
    const transform = (x: number, y: number, rotate: number, scale = 1) =>
      `translate(${x - size / 2}px,${y - size * 0.8}px) rotate(${rotate}deg) scale(${scale})`;
    await animate(
      f.el,
      [
        { transform: transform(f.x, f.y, f.angle), opacity: 1 },
        {
          transform: transform(
            (f.x + to.x) / 2,
            (f.y + to.y) / 2 - 27,
            (f.angle + angle) / 2,
            1.08,
          ),
          offset: 0.5,
        },
        {
          transform: transform(to.x, to.y, angle, shrink ? 0.66 : 1),
          opacity: 1,
        },
      ],
      { duration: ms, easing: 'cubic-bezier(.22,.64,.28,1)' },
    );
    f.x = to.x;
    f.y = to.y;
    f.angle = angle;
  };
  try {
    for (const step of motion.steps) {
      if (signal.aborted) break;
      overlay.dataset.step = step.kind;
      if (step.kind === 'play') {
        onLabel(`${names[motion.actor]} · 패를 냅니다`);
        const own = node(`.l-go-hand [data-card-id="${step.card}"]`),
          from = own ? center(own) : hand(motion.actor);
        hide(own);
        const f = create(step.card, from);
        await fly(f, floor(step.card), 340, -5);
      } else if (step.kind === 'draw') {
        onLabel(`${names[motion.actor]} · 더미를 뒤집습니다`);
        const f = create(step.card, center(node('.g-deck')), true),
          to = floor(step.card);
        to.x += 13;
        await Promise.all([
          fly(f, to, 470, 5),
          animate(
            f.el.firstElementChild as HTMLElement,
            [{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(0deg)' }],
            { duration: 470, easing: 'ease-in-out' },
          ),
        ]);
      } else if (step.kind === 'collect') {
        onLabel(`${names[motion.actor]} · 짝을 가져옵니다`);
        await Promise.all(
          step.cards.map((card, i) => {
            const existing = node(`.g-floor-layout [data-card-id="${card}"]`);
            hide(existing);
            const f =
              cards.get(card) ??
              create(card, existing ? center(existing) : floor(card));
            return fly(
              f,
              pile(motion.actor, card),
              450 + i * 35,
              i % 2 ? 5 : -5,
              true,
            );
          }),
        );
      } else if (step.kind === 'steal') {
        onLabel(`${names[motion.actor]} · 피를 가져옵니다`);
        await Promise.all(
          step.cards.map(({ card, from }, i) => {
            const existing = node(
              `.g-capture-zone[data-seat="${from}"] [data-card-id="${card}"]`,
            );
            hide(existing);
            const f = create(
              card,
              existing ? center(existing) : pile(from, card),
            );
            f.el.classList.add('stolen');
            return fly(f, pile(motion.actor, card), 620 + i * 45, 0, true);
          }),
        );
      } else if (step.kind === 'announce') {
        onLabel(`${names[motion.actor]} · ${step.text}`);
        await animate(overlay, [{ opacity: 1 }, { opacity: 1 }], {
          duration: 500,
        });
      }
    }
  } catch (error) {
    if (
      !signal.aborted &&
      !(error instanceof DOMException && error.name === 'AbortError')
    )
      throw error;
  } finally {
    signal.removeEventListener('abort', abort);
    abort();
    overlay.remove();
    for (const [el, visibility] of hidden) el.style.visibility = visibility;
  }
}
