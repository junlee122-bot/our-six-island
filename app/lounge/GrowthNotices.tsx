'use client';
// 성장 P1 notices: the level-up banner (a ribbon that drops in with a chime,
// one per skill even when several levels came at once), and one-time toasts
// when a tool at the forge is ready or a 마을 개척 project is finished. What
// was already shown is remembered per account on this device.
import { useEffect, useRef, useState } from 'react';
import type { LifeView } from '../lounge-life';
import { LEVEL_PERKS, PROF_BY_ID, RESEARCH_BY_ID, SKILL_INFO, TOOL_INFO, type SkillId } from '../lounge-growth-data';
import { lifeSfx } from '../lounge-audio-life';
import { keyLabel } from '../lounge-keybinds';
import { getSettings } from '../lounge-settings';
import { Glyph } from './field-glyphs';
import { SKILL_GLYPH } from './growth-glyphs';
import type { Notify } from './Toast';
import './growth.css';

const KEY = 'bumtadew-growth-seen-v1';
type Seen = { ups: number; forge: number; research: string[] };
function readSeen(uid: string): Seen | null {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Seen>;
    const s = all[uid];
    return s && typeof s.ups === 'number' ? { ups: s.ups, forge: s.forge ?? 0, research: Array.isArray(s.research) ? s.research : [] } : null;
  } catch {
    return null;
  }
}
function writeSeen(uid: string, seen: Seen) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Seen>;
    all[uid] = seen;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Private mode: notices may repeat on the next visit.
  }
}

type Banner = { id: string; skill: SkillId; level: number };

export function GrowthNotices({
  life,
  uid,
  notify,
  onOpen,
  paused = false,
}: {
  life: LifeView | null;
  uid: string;
  notify: Notify;
  /** Opens the 성장 수첩 on a skill (the banner's button). */
  onOpen: (skill: SkillId) => void;
  /** A table game or a full-screen overlay is up: hold banners until it closes. */
  paused?: boolean;
}) {
  const g = life?.growth;
  const [queue, setQueue] = useState<Banner[]>([]);
  const seen = useRef<Seen | null>(null);
  useEffect(() => {
    if (!g || !uid) return;
    const now = life!.serverNow;
    if (!seen.current) {
      // First sight on this device: only level-ups from the last minute count.
      seen.current = readSeen(uid) ?? {
        ups: now - 60_000,
        forge: g.forge?.ready ? 0 : (g.forge?.at ?? 0),
        research: g.research.filter((r) => r.done).map((r) => r.id),
      };
    }
    const s = seen.current;
    let changed = false;
    const fresh = g.ups.filter((u) => u.at > s.ups);
    if (fresh.length) {
      // One banner per skill: its highest new level.
      const best = new Map<SkillId, number>();
      for (const u of fresh) best.set(u.s, Math.max(best.get(u.s) ?? 0, u.lv));
      setQueue((q) => [...q, ...[...best].map(([skill, level]) => ({ id: `${skill}-${level}-${Date.now()}`, skill, level }))]);
      s.ups = Math.max(...fresh.map((u) => u.at));
      changed = true;
    }
    if (g.forge?.ready && g.forge.at !== s.forge) {
      notify(`${TOOL_INFO[g.forge.tool].name}가 다 됐대요! 대장간에서 찾아가요.`, 'info');
      s.forge = g.forge.at;
      changed = true;
    }
    for (const r of g.research)
      if (r.done && !s.research.includes(r.id)) {
        notify(`마을 개척 “${RESEARCH_BY_ID[r.id]?.name}” 완공! ${RESEARCH_BY_ID[r.id]?.opens.split(' · ')[0]}이(가) 열렸어요.`, 'info');
        s.research = [...s.research, r.id].slice(-12);
        lifeSfx('fanfare');
        changed = true;
      }
    if (changed) writeSeen(uid, s);
  }, [g, uid, life, notify]);
  const current = paused ? undefined : queue[0];
  useEffect(() => {
    if (!current) return;
    lifeSfx('levelup');
    const timer = setTimeout(() => setQueue((q) => q.slice(1)), 4200);
    return () => clearTimeout(timer);
  }, [current]);
  if (!current) return null;
  const info = SKILL_INFO[current.skill];
  const perk = LEVEL_PERKS[current.skill].find((p) => p.level === current.level);
  const pick = current.level === 5 || current.level === 10;
  const mine = g?.skills.find((k) => k.id === current.skill)?.prof ?? [];
  return (
    <div className="l-levelup" role="status" aria-live="polite" style={{ ['--c' as string]: info.color }} data-testid="levelup-banner" key={current.id}>
      <span className="l-levelup-burst" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} style={{ ['--i' as string]: i }} />
        ))}
      </span>
      <span className="l-levelup-medal" aria-hidden="true">
        <Glyph name={SKILL_GLYPH[current.skill]} size={34} />
      </span>
      <span className="l-levelup-text">
        <small>레벨 업!</small>
        <strong>
          {info.name} Lv{current.level}
        </strong>
        <em>
          {pick && !mine.some((p) => PROF_BY_ID[p]?.level === current.level)
            ? '전문가를 고를 수 있어요'
            : perk
              ? `${perk.text}${perk.soon ? ` · ${perk.soon} 이후` : ''}`
              : '더 능숙해졌어요'}
        </em>
      </span>
      <button
        type="button"
        className="l-levelup-open"
        onClick={() => {
          setQueue((q) => q.slice(1));
          onOpen(current.skill);
        }}
      >
        성장 수첩 <kbd>{keyLabel(getSettings().keys.growth)}</kbd>
      </button>
    </div>
  );
}
