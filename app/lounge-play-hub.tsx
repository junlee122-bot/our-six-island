'use client';

import {
  GAME_INFO,
  GAME_KINDS,
  type GameKind,
  type LoungeView,
} from './lounge-room';
import { gameFlow } from './lounge-game-flow';
import './lounge-play-hub.css';

export type LoungePlayHubProps = {
  view: LoungeView;
  onOpen: (kind: GameKind) => void;
  onRequest: (kind: GameKind) => void;
  onWaiting?: () => void;
  kinds?: readonly GameKind[];
};

const HubCard = ({
  view,
  kind,
  onOpen,
  onRequest,
  onWaiting,
}: LoungePlayHubProps & { kind: GameKind }) => {
  const flow = gameFlow(view, kind);
  const info = GAME_INFO[kind];
  const isOwned = flow.ownTable || flow.ownSeat;
  const seated = Math.max(flow.occupiedSeats, flow.table?.members.length ?? 0);
  const action = flow.canOpen ? (
    <button
      type="button"
      className="l-play-hub-action"
      onClick={() => onOpen(kind)}
    >
      {flow.actionLabel}
    </button>
  ) : flow.canShowInvitations ? (
    <button
      type="button"
      className="l-play-hub-action l-play-hub-secondary"
      onClick={onWaiting}
      disabled={!onWaiting}
    >
      {flow.actionLabel}
    </button>
  ) : flow.canRequest ? (
    <button
      type="button"
      className="l-play-hub-action"
      onClick={() => onRequest(kind)}
    >
      {flow.actionLabel}
    </button>
  ) : null;

  return (
    <article
      className={`l-play-hub-card${isOwned ? ' is-owned' : ''}`}
      data-testid={`play-hub-${kind}`}
      data-status={flow.status}
      aria-label={`${info.name}: ${flow.statusLabel}`}
    >
      <div className="l-play-hub-card-heading">
        <span className="l-play-hub-symbol" aria-hidden="true">
          {info.symbol}
        </span>
        <div>
          <h3>{info.name}</h3>
          <p className={`l-play-hub-status is-${flow.status}`}>
            {flow.statusLabel}
          </p>
        </div>
        {isOwned && <span className="l-play-hub-owned">내 자리</span>}
      </div>
      <p className="l-play-hub-detail">{flow.detail}</p>
      <div className="l-play-hub-meta" aria-label="테이블 현황">
        <span>
          자리 {seated}/{flow.required}
        </span>
        {flow.table && (
          <span>
            준비 {flow.readyCount}/{flow.table.members.length}
          </span>
        )}
        {flow.invite && (
          <span>
            초대 수락 {flow.invite.accepted.length}/{flow.invite.required}
          </span>
        )}
      </div>
      {flow.disabledReason && flow.status !== 'retained' && (
        <p className="l-play-hub-reason">{flow.disabledReason}</p>
      )}
      {flow.status === 'retained' && (
        <p className="l-play-hub-reason">{flow.disabledReason}</p>
      )}
      {action}
    </article>
  );
};

/** Status-first game chooser; all state changes are delegated to callbacks. */
export const LoungePlayHub = ({
  view,
  onOpen,
  onRequest,
  onWaiting,
  kinds = GAME_KINDS,
}: LoungePlayHubProps) => (
  <section className="l-play-hub" aria-labelledby="l-play-hub-title">
    <header className="l-play-hub-intro">
      <div>
        <h2 id="l-play-hub-title">게임 현황</h2>
        <p>참가 중인 테이블과 친구 초대를 한곳에서 확인해요.</p>
      </div>
      <span className="l-play-hub-balance">
        사용 가능 {view.wallet.balance.toLocaleString('ko-KR')}범
      </span>
    </header>
    <div className="l-play-hub-grid">
      {kinds.map((kind) => (
        <HubCard
          key={kind}
          view={view}
          kind={kind}
          onOpen={onOpen}
          onRequest={onRequest}
          onWaiting={onWaiting}
        />
      ))}
    </div>
  </section>
);
