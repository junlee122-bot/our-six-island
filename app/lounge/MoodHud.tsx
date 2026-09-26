'use client';
// 무드 HUD: the round face beside the wallet with up to three moodle squares
// (hover or focus for the tooltip, click or U for the panel), the
// inspiration ribbon with its chime, quiet toasts for cheers and the 촌장님
// 찻잔, the small face badge on friends' portraits, and the 내 기분 자세히
// 보여 주기 switch for the settings.
import { useEffect, useId, useRef, useState } from 'react';
import type { CloudRoom } from '../lounge-cloud-room';
import type { LifeView } from '../lounge-life';
import { CHEER_LABEL, INSPIRATIONS, MOOD_TIER_BY_ID, type MoodTier } from '../lounge-mood-data';
import type { MoodFace } from '../lounge-mood';
import { moodles, signed, timeLeft } from '../lounge-mood-ui';
import { ACTORS } from '../lounge-roster';
import { josa } from '../lounge-text';
import { keyLabel } from '../lounge-keybinds';
import { useSettings } from '../lounge-settings';
import { lifeSfx } from '../lounge-audio-life';
import { MoodFaceIcon, MoodGlyph } from './mood-glyphs';
import { useNow } from './use-now';
import type { Notify } from './Toast';
import './mood.css';

/** The HUD chip: face + three moodles + tooltip. */
export function MoodHud({ life, clockOffset, onOpen }: { life: LifeView | null | undefined; clockOffset: number; onOpen: () => void }) {
  const [settings] = useSettings();
  const now = useNow(true, 30_000) + clockOffset;
  const tipId = useId();
  const m = life?.mood;
  if (!m || !settings.moodHud) return null;
  const list = moodles(m);
  const tier = MOOD_TIER_BY_ID[m.tier];
  const key = keyLabel(settings.keys.mood);
  return (
    <span className="l-mood-hud" data-testid="mood-hud" data-tier={m.tier}>
      <button
        type="button"
        className="l-mood-chip"
        onClick={onOpen}
        aria-describedby={tipId}
        style={{ ['--mood-c' as string]: tier.color }}
      >
        {/* Visible-to-readers text keeps the shared icon tooltip away (ours is richer). */}
        <span className="sr-only">
          기분 {tier.name} {m.v}. 기분 창 열기{key && key !== '없음' ? ` (${key})` : ''}
        </span>
        <span className="l-mood-chip-face">
          <MoodFaceIcon tier={m.tier} size={28} />
          {m.insp && (
            <i className="l-mood-chip-spark" aria-hidden="true">
              <MoodGlyph name="spark" size={13} />
            </i>
          )}
          {m.cup && <i className="l-mood-chip-dot" aria-hidden="true" />}
        </span>
        <span className="l-mood-moodles" aria-hidden="true">
          {list.map((x) => (
            <span key={x.key} className="l-mood-moodle" data-sign={x.value < 0 ? 'neg' : 'pos'} data-level={x.level}>
              <MoodGlyph name={x.icon} size={14} />
            </span>
          ))}
        </span>
      </button>
      <span role="tooltip" id={tipId} className="l-mood-tip">
        <strong>
          {tier.name} <b>{m.v}</b>
          {m.xp !== 1 && <small> · 기술 XP {m.xp > 1 ? '+' : '−'}{Math.round(Math.abs(m.xp - 1) * 100)}%</small>}
        </strong>
        {list.map((x) => (
          <span key={x.key} data-sign={x.value < 0 ? 'neg' : 'pos'}>
            {x.label} <b>{signed(x.value)}</b>
            {x.until ? <small> · {timeLeft(x.until, now)}</small> : null}
          </span>
        ))}
        {m.insp && (
          <span data-sign="pos">
            {m.insp.name} · <small>{timeLeft(m.insp.until, now)}</small>
          </span>
        )}
        {m.cup && <span>촌장님 찻잔이 와 있어요</span>}
        <em>{key && key !== '없음' ? `${key} 키로 자세히 보기` : '눌러서 자세히 보기'}</em>
      </span>
    </span>
  );
}

/** A small face on a friend's portrait (tier only; no numbers). */
export function FriendMoodBadge({ face, className = '' }: { face: MoodFace | undefined; className?: string }) {
  if (!face) return null;
  return (
    <span
      className={`l-mood-badge ${className}`}
      data-tier={face.tier}
      title={`기분: ${MOOD_TIER_BY_ID[face.tier].name}${face.insp ? ' · 영감을 받았어요' : ''}${face.away ? ' · 쉬는 중' : ''}`}
    >
      <MoodFaceIcon tier={face.tier} size={16} />
      {face.insp && (
        <i aria-hidden="true">
          <MoodGlyph name="spark" size={9} />
        </i>
      )}
    </span>
  );
}
export const moodTierLabel = (tier: MoodTier) => MOOD_TIER_BY_ID[tier].name;

// ---------------------------------------------------------------- notices
const KEY = 'bumtadew-mood-seen-v1';
type Seen = { insp: number; cheer: number; cup: number; great: boolean };
function readSeen(uid: string): Seen | null {
  try {
    const s = (JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, Seen>)[uid];
    return s && typeof s.insp === 'number' ? { insp: s.insp, cheer: s.cheer ?? 0, cup: s.cup ?? 0, great: !!s.great } : null;
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
    // Private mode: a notice may repeat next time.
  }
}
const shared: { seen: Record<string, Seen>; banner: { id: string; at: number; kind: keyof typeof INSPIRATIONS } | null } = {
  seen: {},
  banner: null,
};

/**
 * One-time notices: the inspiration ribbon (with a chime), toasts for cheers
 * received and the 촌장님 찻잔, and the first 신나요 of this device.
 */
export function MoodNotices({
  life,
  uid,
  notify,
  onOpen,
  paused = false,
}: {
  life: LifeView | null | undefined;
  uid: string;
  notify: Notify;
  onOpen: () => void;
  paused?: boolean;
}) {
  const m = life?.mood;
  const [settings] = useSettings();
  const seen = useRef<Seen | null>(shared.seen[uid] ?? null);
  const [banner, setBanner] = useState(shared.banner);
  useEffect(() => {
    if (!m || !uid || !life) return;
    const now = life.serverNow;
    // First sight on this device: what already happened counts as seen.
    seen.current ??= readSeen(uid) ?? { insp: m.insp?.at ?? 0, cheer: now, cup: m.cup ?? 0, great: m.tier === 'great' };
    const s = seen.current;
    shared.seen[uid] = s;
    let changed = false;
    if (m.insp && m.insp.at > s.insp) {
      s.insp = m.insp.at;
      shared.banner = { id: `${m.insp.k}-${m.insp.at}`, at: Date.now(), kind: m.insp.k };
      setBanner(shared.banner);
      changed = true;
    }
    const fresh = m.cheers.filter((c) => c.at > s.cheer);
    if (fresh.length) {
      for (const c of fresh.slice(-2))
        notify(`${josa(ACTORS[c.actor] ?? '친구', '이/가')} 응원해 줬어요 · ${CHEER_LABEL[c.how]}`, 'info');
      lifeSfx('cheer');
      s.cheer = Math.max(...fresh.map((c) => c.at));
      changed = true;
    }
    if (m.cup && m.cup > s.cup) {
      notify('촌장님이 따뜻한 차를 보내 주셨어요. 기분 창에서 마실 수 있어요.', 'info');
      s.cup = m.cup;
      changed = true;
    }
    if (m.tier === 'great' && !s.great) {
      notify('신나요! 기분이 좋으면 기술 XP가 더 붙고, 영감 게이지가 빨리 차요.', 'info');
      s.great = true;
      changed = true;
    }
    if (changed) writeSeen(uid, s);
  }, [m, uid, life, notify]);
  const current = paused ? null : banner;
  useEffect(() => {
    if (!current) return;
    const first = current.at > Date.now() - 400;
    if (first) lifeSfx('inspire');
    const timer = setTimeout(() => {
      shared.banner = null;
      setBanner(null);
    }, Math.max(0, 6000 - (Date.now() - current.at)));
    return () => clearTimeout(timer);
  }, [current]);
  if (!current) return null;
  const def = INSPIRATIONS[current.kind];
  return (
    <output className="l-mood-insp" aria-live="polite" data-testid="mood-inspiration" key={current.id}>
      <span className="l-mood-insp-burst" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} style={{ ['--i' as string]: i }} />
        ))}
      </span>
      <span className="l-mood-insp-medal" aria-hidden="true">
        <MoodGlyph name={def.icon} size={30} />
        <MoodGlyph name="spark" size={16} className="l-mood-insp-spark" />
      </span>
      <span className="l-mood-insp-text">
        <small>영감을 받았어요!</small>
        <strong>{def.name}</strong>
        <em>{def.text}</em>
      </span>
      <button
        type="button"
        className="l-mood-insp-open"
        onClick={() => {
          shared.banner = null;
          setBanner(null);
          onOpen();
        }}
      >
        기분 창 <kbd>{keyLabel(settings.keys.mood)}</kbd>
      </button>
    </output>
  );
}

/** 설정 → 표시: share my top thoughts with friends (server-side, per account). */
export function MoodShareToggle({ room, life }: { room: CloudRoom; life: LifeView | null | undefined }) {
  const on = !!life?.mood?.pub;
  const [busy, setBusy] = useState(false);
  if (!life?.mood) return null;
  return (
    <label className="l-setting" aria-label="내 기분 자세히 보여 주기">
      <span>
        <strong>내 기분 자세히 보여 주기</strong>
        <small>친구들은 원래 내 얼굴 표정(기분 단계)만 봐요. 켜면 내 생각 세 가지도 볼 수 있어요. 숫자는 늘 나만 봐요.</small>
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-checked={on}
        checked={on}
        disabled={busy}
        onChange={(e) => {
          setBusy(true);
          void room.life({ kind: 'moodShare', on: e.target.checked }).finally(() => setBusy(false));
        }}
      />
    </label>
  );
}
