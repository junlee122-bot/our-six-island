'use client';
// A resident's round portrait: the pose sheet's head crop for the dealers and
// shopkeepers (DealerAvatar), the keyed head-and-shoulders image for the
// stage-1 residents, and a top crop of the full-body image for the rest.
import { DealerAvatar } from '../lounge-dealer-host';
import type { DealerMood } from '../lounge-dealer-lines';
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
