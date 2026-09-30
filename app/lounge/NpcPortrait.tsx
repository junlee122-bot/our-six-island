'use client';
// A resident's round portrait: the pose sheet's head crop for the dealers and
// shopkeepers (DealerAvatar), the keyed head-and-shoulders image for the
// stage-1 residents, and a top crop of the full-body image for the rest.
// NpcFigure is the tall one for the speech box: head to waist from the same
// full-body art (the pose sheet's cell or the keyed 660×990 image).
import { DealerAvatar } from '../lounge-dealer-host';
import type { DealerMood } from '../lounge-dealer-lines';
import { HOST_CELL, HOST_SHEET, hostCell } from '../lounge-host-sprites';
import { NPCS, type NpcId } from '../lounge-npc-data';

export function NpcPortrait({ npc, mood = 'calm', className = '' }: { npc: NpcId; mood?: DealerMood; className?: string }) {
  const art = NPCS[npc].art;
  if (art.kind === 'sheet')
    return (
      <span className={`l-npc-face ${className}`} aria-hidden="true">
        <DealerAvatar host={art.host} mood={mood} />
      </span>
    );
  // Stage-2 residents wait for their pictures: a plain round face card.
  if (art.kind === 'pending')
    return <span className={`l-npc-face is-pending ${className}`} aria-hidden="true" />;
  return (
    <span className={`l-npc-face ${art.portrait ? '' : 'is-crop'} ${className}`} aria-hidden="true">
      <img src={art.portrait ?? art.asset} alt="" loading="lazy" decoding="async" />
    </span>
  );
}

/** Head to waist of a sheet cell (px inside the 440 × 660 cell), 2:3 like the frame. */
const SHEET_FIGURE = { x: 70, y: 30, w: 300, h: 450 } as const;

/** A resident standing tall in a 2:3 frame (the speech box's portrait). */
export function NpcFigure({ npc, mood = 'calm' }: { npc: NpcId; mood?: DealerMood }) {
  const art = NPCS[npc].art;
  if (art.kind === 'sheet') {
    const cell = hostCell(mood);
    return (
      <span className="l-npc-figure" aria-hidden="true">
        <svg viewBox={`${cell.x + SHEET_FIGURE.x} ${cell.y + SHEET_FIGURE.y} ${SHEET_FIGURE.w} ${SHEET_FIGURE.h}`} focusable="false">
          <image href={HOST_SHEET[art.host]} width={HOST_CELL.w * HOST_CELL.cols} height={HOST_CELL.h * HOST_CELL.rows} />
        </svg>
      </span>
    );
  }
  return (
    <span className="l-npc-figure is-image" aria-hidden="true">
      <img src={art.asset} alt="" decoding="async" />
    </span>
  );
}
