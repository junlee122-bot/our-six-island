// 점검 중 ("범타듀 밸리가 예뻐지는 중"): the server's maintenance switch and
// the client's copy of it. The Edge functions read HH_MAINTENANCE (an Edge
// secret, so it flips without a deploy): empty, "0" or "off" is off; "1" or a
// JSON object {"until": ISO time, "note": text} is on. While it is on, every
// request but the `status` ping answers 503 with `maintenance`, so the web and
// desktop apps show the maintenance page instead of "연결 끊김".

export type Maintenance = {
  /** When it should be over (ISO time), if known. */
  until?: string;
  /** One line for players ("새 지역을 다듬고 있어요"). */
  note?: string;
};

/** The switch's value → the notice, or null when off. Never throws. */
export function readMaintenance(raw: string | null | undefined): Maintenance | null {
  const text = (raw ?? '').trim();
  if (!text || text === '0' || text.toLowerCase() === 'off' || text.toLowerCase() === 'false') return null;
  try {
    const v: unknown = JSON.parse(text);
    if (v === false || v === 0 || v === null) return null;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const o = v as { until?: unknown; note?: unknown };
      const until = typeof o.until === 'string' && Number.isFinite(Date.parse(o.until)) ? new Date(o.until).toISOString() : undefined;
      const note = typeof o.note === 'string' ? o.note.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 120) : '';
      return { ...(until ? { until } : {}), ...(note ? { note } : {}) };
    }
  } catch {
    // Not JSON ("1", "on"): on, with nothing to say.
  }
  return {};
}

/** The message every refused request carries (also shown as an error where the page is not up). */
export const MAINTENANCE_ERROR = '범타듀 밸리가 예뻐지는 중이에요. 잠시 뒤에 다시 만나요!';

/** A maintenance notice in a server answer, or null. */
export function maintenanceOf(body: unknown): Maintenance | null {
  if (!body || typeof body !== 'object') return null;
  const m = (body as { maintenance?: unknown }).maintenance;
  if (!m || typeof m !== 'object' || Array.isArray(m)) return null;
  const o = m as { until?: unknown; note?: unknown };
  return {
    ...(typeof o.until === 'string' && Number.isFinite(Date.parse(o.until)) ? { until: o.until } : {}),
    ...(typeof o.note === 'string' && o.note ? { note: o.note.slice(0, 120) } : {}),
  };
}

/** "오후 3:20쯤" for the page (KST), or '' when unknown or already past. */
export function maintenanceUntilText(m: Maintenance | null, now = Date.now()): string {
  const t = m?.until ? Date.parse(m.until) : NaN;
  if (!Number.isFinite(t) || t <= now) return '';
  const kst = new Date(t + 9 * 3_600_000);
  const h = kst.getUTCHours(), min = kst.getUTCMinutes();
  const sameDay = Math.floor((t + 9 * 3_600_000) / 86_400_000) === Math.floor((now + 9 * 3_600_000) / 86_400_000);
  const day = sameDay ? '' : `${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일 `;
  return `${day}${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(min).padStart(2, '0')}쯤`;
}

// ---------------------------------------------------------------- client store
let current: Maintenance | null = null;
const listeners = new Set<() => void>();
/** Set from every server answer: a notice turns the page on, any normal answer turns it off. */
export function setMaintenance(next: Maintenance | null) {
  if (JSON.stringify(next) === JSON.stringify(current)) return;
  current = next;
  for (const fn of listeners) fn();
}
export const maintenanceNow = () => current;
export function subscribeMaintenance(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
