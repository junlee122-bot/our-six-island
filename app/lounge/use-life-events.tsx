'use client';
// Life-expansion news in the banner queue: today's holidays / birthdays /
// weekly events (once per day, with [받기] for claimable gifts), achievements
// as they complete, village restorations (a small celebration), and the
// "어제 마을 소식" digest on the first login of the day.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PartyPopper } from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { ACHIEVEMENT_BY_ID, BUNDLES, VILLAGE_FLAGS } from '../lounge-items';
import { ACTORS } from '../lounge-roster';
import { formatBeom, josa } from '../lounge-text';
import { recall, remember } from '../lounge-settings';
import { lifeSfx } from '../lounge-audio-life';
import type { Notify, PushBanner } from './Toast';

const EVENTS_KEY = 'bumtadew-life-events-v1';
export const DIGEST_KEY = 'bumtadew-digest-seen-v1';

export function useLifeEvents({
  view,
  room,
  push,
  notify,
  selfActor,
  onAchievements,
  onGiftTo,
}: {
  view: CloudRoomView;
  room: CloudRoom;
  push: PushBanner;
  notify: Notify;
  selfActor: number;
  onAchievements: () => void;
  onGiftTo: (actor: number) => void;
}) {
  const life = view.life;
  const cb = useRef({ onAchievements, onGiftTo, push, notify });
  useEffect(() => {
    cb.current = { onAchievements, onGiftTo, push, notify };
  });

  // Today's events: one banner each per day and device.
  const day = life?.calendar?.day;
  useEffect(() => {
    if (day === undefined) return;
    const timer = setTimeout(() => {
      let seen: { day: number; ids: string[] } = { day, ids: [] };
      try {
        const raw = JSON.parse(recall(EVENTS_KEY) ?? 'null');
        if (raw?.day === day && Array.isArray(raw.ids)) seen = raw;
      } catch {}
      const snapshot = room.snapshot().life;
      for (const e of snapshot?.calendar?.events ?? []) {
        if (seen.ids.includes(e.id)) continue;
        if (e.kind === 'weekly' && e.active === false) continue;
        seen.ids.push(e.id);
        const mine = e.kind === 'birthday' && e.actor === selfActor;
        const claimable = !!e.claim && (e.kind !== 'birthday' || mine) && !snapshot?.me.claimed?.includes(e.id);
        const text =
          e.kind === 'birthday'
            ? mine
              ? `생일 축하해요! 마을이 ${formatBeom(e.claim ?? 0)}을 준비했어요.`
              : `오늘은 ${e.name}이에요! 선물은 추억이 세 배예요.`
            : `오늘은 ${e.name} · ${e.text}`;
        cb.current.push('daily', text, {
          key: 'event-' + e.id,
          action: claimable
            ? {
                label: '받기',
                run: () =>
                  void room.life({ kind: 'claimEvent', event: e.id }).then((ok) => {
                    if (ok) {
                      cb.current.notify(`${e.name} 선물 ${josa(formatBeom(e.claim ?? 0), '을/를')} 받았어요.`);
                      lifeSfx('fanfare');
                    }
                  }),
              }
            : e.kind === 'birthday' && e.actor !== undefined && !mine
              ? { label: '선물하기', run: () => cb.current.onGiftTo(e.actor!) }
              : undefined,
        });
      }
      remember(EVENTS_KEY, JSON.stringify(seen));
    }, 2600);
    return () => clearTimeout(timer);
  }, [day, room, selfActor]);

  // Achievements that just completed.
  const achievements = life?.me.achievements;
  const doneRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!achievements) return;
    const done = new Set(achievements.filter((a) => a.done).map((a) => a.id));
    if (doneRef.current)
      for (const id of done)
        if (!doneRef.current.has(id)) {
          const a = ACHIEVEMENT_BY_ID[id];
          if (!a) continue;
          cb.current.push('success', `업적 달성! ${a.name} · +${formatBeom(a.reward)}`, {
            key: 'ach-' + id,
            action: { label: '보기', run: () => cb.current.onAchievements() },
          });
          lifeSfx('fanfare');
        }
    doneRef.current = done;
  }, [achievements]);

  // Village restorations: a short celebration when a bundle completes.
  const flags = life?.flags;
  const flagsRef = useRef<string[] | null>(null);
  const [celebration, setCelebration] = useState<{ flag: string; name: string; text: string } | null>(null);
  useEffect(() => {
    if (!flags) return;
    if (flagsRef.current)
      for (const flag of flags)
        if (!flagsRef.current.includes(flag)) {
          const bundle = BUNDLES.find((b) => b.flag === flag);
          const text = VILLAGE_FLAGS[flag] ?? '';
          setCelebration({ flag, name: bundle?.reward ?? flag, text });
          cb.current.push('success', `마을 복원! ${bundle?.name ?? ''} 완성 · ${bundle?.reward ?? ''}`, { key: 'flag-' + flag });
          lifeSfx('fanfare');
        }
    flagsRef.current = [...flags];
  }, [flags]);
  useEffect(() => {
    if (!celebration) return;
    const t = setTimeout(() => setCelebration(null), 3200);
    return () => clearTimeout(t);
  }, [celebration]);

  // "어제 마을 소식": due once per KST day (per device).
  const digestDay = life?.digest?.day;
  const digestDue = digestDay !== undefined && recall(DIGEST_KEY) !== String(digestDay) && (life?.digest?.lines.length ?? 0) > 0;
  const markDigest = () => {
    if (digestDay !== undefined) remember(DIGEST_KEY, String(digestDay));
  };
  return { celebration, digestDue, markDigest };
}

/** The restoration celebration card (confetti off under reduced motion). */
export function Celebration({ name, text }: { name: string; text: string }) {
  const colors = ['#e2574c', '#f2c14e', '#5b8fb9', '#6aa84f', '#b07ab9'];
  // A manual popover: shown above any open dialog (the board stays open).
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    try {
      (ref.current as (HTMLDivElement & { showPopover?: () => void }) | null)?.showPopover?.();
    } catch {}
  }, []);
  return (
    <div ref={ref} popover="manual" className="l-celebrate" role="status" aria-live="polite" data-testid="celebration">
      {Array.from({ length: 28 }, (_, i) => (
        <i
          key={i}
          aria-hidden="true"
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 7) * 0.12}s`,
          }}
        />
      ))}
      <div className="l-celebrate-card">
        <PartyPopper size={34} aria-hidden="true" />
        <strong>마을 복원! {name}</strong>
        <small>{text}</small>
        <small>함께한 친구들 덕분이에요 · {ACTORS.length}명의 마을</small>
      </div>
    </div>
  );
}
