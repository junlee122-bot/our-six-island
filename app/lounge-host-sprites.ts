// The table hosts' illustrated sprite sheets (루미 in the casino, 매화 in the
// hall): six full-body poses per host in one 3×2 sheet, already keyed to real
// transparency (public/assets/lounge/host-*.png, prompts next to them). The 3D
// interiors stand them behind their tables as billboards and the dealer
// strip crops its round portrait from the same cells.
import { LOUNGE_ASSETS } from './lounge-assets.ts';
import type { DealerMood, HOSTS } from './lounge-dealer-lines.ts';
import type { TablePhase } from './lounge-table-state.ts';

export type HostId = keyof typeof HOSTS;
/** The five dealer moods plus the dealing gesture. */
export type HostPose = DealerMood | 'deal';

export const HOST_SHEET: Record<HostId, string> = {
  lumi: LOUNGE_ASSETS.hostLumi,
  maehwa: LOUNGE_ASSETS.hostMaehwa,
};

/**
 * Sheet geometry in pixels: 3 columns × 2 rows of 440 × 660 cells, every
 * figure's soles on the cell's 648 px line, the calm figure 600 px tall.
 */
export const HOST_CELL = { w: 440, h: 660, cols: 3, rows: 2, foot: 648, figure: 600 } as const;
const ORDER: readonly HostPose[] = ['calm', 'smile', 'deal', 'focus', 'wow', 'sorry'];

/** Top-left corner (px) of a pose's cell. */
export function hostCell(pose: HostPose) {
  const i = Math.max(0, ORDER.indexOf(pose));
  return { x: (i % HOST_CELL.cols) * HOST_CELL.w, y: Math.floor(i / HOST_CELL.cols) * HOST_CELL.h };
}

/** The head-and-shoulders square inside every cell (px), for round portraits. */
export const HOST_PORTRAIT = { x: 90, y: 40, size: 260 } as const;

/**
 * What the host at a table is doing now: calm at an empty table (a smile now
 * and then), welcoming while it fills, focused and dealing during a match, a
 * surprised beat when the match ends and then a happy face over the results.
 * `t` is a clock in ms; `since` is when the table's phase last changed.
 */
export function hostPose(phase: TablePhase, t: number, since: number, seed = 0): HostPose {
  const cycle = (period: number, on: number) => (t + seed * 977) % period < on;
  switch (phase) {
    case 'playing':
      if (t - since < 1600) return 'deal';
      return cycle(5200, 1300) ? 'deal' : 'focus';
    case 'retained':
      return t - since < 1500 ? 'wow' : 'smile';
    case 'forming':
      return cycle(6400, 4200) ? 'smile' : 'calm';
    default:
      return cycle(9000, 1800) ? 'smile' : 'calm';
  }
}
