'use client';
import { useRef, useState } from 'react';
import { PORTALS, portalAt, portalHint, portalOpen, type PortalArea, type PortalContext } from '../lounge-portals';
import { GameButton } from '../ui/GameButton';
import { Glyph } from '../ui/Glyph';
import { Modal } from './Modal';
import './portal.css';

/** Only opened by E at a waystone. The server checks the pad again on departure. */
export function PortalPanel({ area, context, blockedReason, onTravel, onClose }: {
  area: PortalArea;
  context: PortalContext;
  blockedReason?: string;
  onTravel: (to: PortalArea) => Promise<boolean>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<PortalArea | null>(null);
  const sending = useRef(false);
  const travel = async (to: PortalArea) => {
    if (sending.current || blockedReason || to === area || !portalOpen(to, context)) return;
    sending.current = true;
    setPending(to);
    try { await onTravel(to); }
    finally { sending.current = false; setPending(null); }
  };
  return <Modal title="마을 포탈" onClose={onClose} closable={!pending} className="l-portals" wide>
    <div data-testid="portal-panel" data-from={area} aria-busy={!!pending}>
      <p className="l-portal-intro"><Glyph name="compass" /> {portalAt(area)?.name}의 바닥돌 위에 서 있어요. 갈 곳의 포탈 앞으로 이동해요.</p>
      <p className="l-portal-note">열린 구역끼리 이어져 있어요. 광산 안이나 먼바다로는 갈 수 없어요.</p>
      {blockedReason && <output className="l-portal-note">{blockedReason}</output>}
      <ul className="l-portal-list">
        {PORTALS.map((p) => {
          const here = p.area === area, open = portalOpen(p.area, context);
          const reason = here ? '지금 서 있는 곳이에요.' : !open ? portalHint(p.area) : blockedReason;
          return <li key={p.area} className="l-portal-stop" data-current={here || undefined}>
            <div><strong>{p.name}</strong><span>{here ? '현재 위치' : open ? '포탈 앞에 도착해요.' : portalHint(p.area)}</span></div>
            <GameButton data-testid={`portal-to-${p.area}`} glyph={here ? 'check' : 'compass'}
              disabled={!!pending || here || !open || !!blockedReason} disabledReason={reason}
              variant={!here && open ? 'primary' : 'secondary'} onClick={() => void travel(p.area)}>
              {pending === p.area ? '이동 중…' : here ? '여기' : open ? '이동하기' : '아직 닫힘'}
            </GameButton>
          </li>;
        })}
      </ul>
    </div>
  </Modal>;
}
