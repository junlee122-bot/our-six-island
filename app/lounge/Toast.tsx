'use client';
// One top banner at a time: success/info/error messages and game events
// (invites, my turn, mail, guests, the daily grant) share one queue
// (app/lounge-flow.ts), so nothing ever stacks.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Check,
  CircleAlert,
  Gift,
  Info,
  Mail,
  Spade,
  Timer,
  UserRound,
  X,
} from 'lucide-react';
import { playCue } from './feedback';
import {
  bannerDuration,
  dropBanners,
  EMPTY_BANNERS,
  nextBanner,
  pushBanner,
  type Banner,
  type BannerKind,
  type BannerQueue,
} from '../lounge-flow';

export type ToastKind = 'success' | 'error' | 'info';
export type Notify = (text: string, kind?: ToastKind) => void;
export type BannerOptions = {
  key?: string;
  /** Button label ([가기], [보기], [받기]…) and what it does. */
  action?: { label: string; run: () => void };
};
export type PushBanner = (
  kind: BannerKind,
  text: string,
  options?: BannerOptions,
) => void;

export type Banners = {
  state: BannerQueue;
  notify: Notify;
  push: PushBanner;
  /** The shown banner is done (closed, acted on or timed out). */
  done: (id: number) => void;
  /** Its subject is gone (an answered invite…): remove it wherever it is. */
  drop: (key: string) => void;
  run: (id: number) => void;
};

export function useBanners(): Banners {
  const [state, setState] = useState<BannerQueue>(EMPTY_BANNERS);
  const seq = useRef(0);
  const actions = useRef(new Map<number, () => void>());
  const push = useCallback<PushBanner>((kind, text, options) => {
    if (!text) return;
    const id = ++seq.current;
    if (options?.action) actions.current.set(id, options.action.run);
    if (kind === 'error') playCue('error');
    setState((s) => {
      const banner: Banner = {
        id,
        kind,
        text,
        key: options?.key,
        action: options?.action?.label,
      };
      return pushBanner(s, banner);
    });
  }, []);
  const notify = useCallback<Notify>(
    (text, kind = 'success') => push(kind, text),
    [push],
  );
  const done = useCallback((id: number) => {
    actions.current.delete(id);
    setState((s) => nextBanner(s, id));
  }, []);
  const drop = useCallback(
    (key: string) => setState((s) => dropBanners(s, key)),
    [],
  );
  const run = useCallback(
    (id: number) => {
      const action = actions.current.get(id);
      done(id);
      action?.();
    },
    [done],
  );
  // The shown banner leaves after its time; the next one follows.
  const current = state.current;
  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => done(current.id), bannerDuration(current.kind));
    return () => clearTimeout(timer);
  }, [current, done]);
  return { state, notify, push, done, drop, run };
}

const ICONS: Record<BannerKind, typeof Check> = {
  success: Check,
  info: Info,
  error: CircleAlert,
  invite: Spade,
  turn: Timer,
  mail: Mail,
  guest: UserRound,
  daily: Gift,
};

/** The one top banner (manual popover: stays above open dialogs). */
export function Toast({ banners }: { banners: Banners }) {
  const ref = useRef<HTMLDivElement>(null);
  const banner = banners.state.current;
  useLayoutEffect(() => {
    const el = ref.current as
      | (HTMLDivElement & { showPopover?: () => void })
      | null;
    try {
      el?.showPopover?.();
    } catch {}
  }, [banner?.id]);
  if (!banner) return null;
  const Icon = ICONS[banner.kind];
  const waiting = banners.state.queue.length;
  const tone =
    banner.kind === 'error'
      ? 'error'
      : banner.kind === 'success'
        ? 'success'
        : 'info';
  return (
    <div
      key={banner.id}
      ref={ref}
      popover="manual"
      className={`l-toast l-banner is-${tone} is-${banner.kind}`}
      role={banner.kind === 'error' ? 'alert' : 'status'}
      aria-live={banner.kind === 'error' ? 'assertive' : 'polite'}
      data-testid="banner"
      data-kind={banner.kind}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{banner.text}</span>
      {waiting > 0 && (
        <small className="l-banner-more" aria-label={`알림 ${waiting}개 더`}>
          +{waiting}
        </small>
      )}
      {banner.action && (
        <button
          type="button"
          className="l-banner-action"
          onClick={() => banners.run(banner.id)}
          data-testid="banner-action"
        >
          {banner.action}
        </button>
      )}
      <button
        type="button"
        className="l-banner-close"
        aria-label={waiting ? '닫고 다음 알림 보기' : '알림 닫기'}
        onClick={() => banners.done(banner.id)}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
