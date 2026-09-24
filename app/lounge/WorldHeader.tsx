'use client';
import {
  ArrowLeft,
  Backpack,
  Coins,
  Mail,
  Menu,
  Send,
  Trees,
  RotateCcw,
} from 'lucide-react';
import { AvatarView } from '../avatar-view';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { LoungeSave } from '../lounge-look';
import { ACTORS } from '../lounge-roster';
import { formatBeom, NAMES, josa } from '../lounge-text';
import { DailyButton } from './WalletModal';
import type { Notify } from './Toast';

export type Tab = 'village' | 'lounge' | 'wardrobe' | 'casino' | 'bedroom';

export const TAB_TITLES: Record<Tab, string> = {
  village: NAMES.village,
  lounge: NAMES.hall,
  casino: NAMES.casino,
  wardrobe: NAMES.wardrobe,
  bedroom: NAMES.home,
};

/** "지금 마을에 있는 친구" avatar row with count. */
export function PresenceRow({
  view,
  onClick,
}: {
  view: CloudRoomView;
  onClick: () => void;
}) {
  const connected = view.status === 'connected';
  const others = connected
    ? view.players.filter((p) => p.id !== view.self)
    : [];
  const label = connected
    ? others.length
      ? `지금 마을에 있는 친구 ${others.length}명: ${others.map((p) => ACTORS[p.actor]).join(', ')}`
      : '지금 마을에 있는 친구 없음'
    : view.status === 'connecting'
      ? '마을에 들어가는 중'
      : '마을에 연결되지 않음';
  return (
    <button
      className={'l-presence' + (connected ? '' : ' is-offline')}
      onClick={onClick}
      aria-label={label}
      data-coach="presence"
    >
      <span className="l-presence-label" aria-hidden="true">
        <small>지금 마을에</small>
        <b>
          {connected
            ? `${others.length}명`
            : view.status === 'connecting'
              ? '…'
              : '끊김'}
        </b>
      </span>
      <span className="l-presence-faces" aria-hidden="true">
        {others.slice(0, 5).map((p) => (
          <span key={p.id} className="l-presence-face" title={ACTORS[p.actor]}>
            <AvatarView actor={p.actor} look={p.look} portrait />
          </span>
        ))}
        {others.length > 5 && (
          <span className="l-presence-more">+{others.length - 5}</span>
        )}
        {!connected && <RotateCcw size={16} />}
      </span>
    </button>
  );
}

export function WorldHeader({
  tab,
  save,
  room,
  view,
  notify,
  onBrand,
  onPresence,
  onInvite,
  onWallet,
  onAccount,
  onMenu,
  onMail,
  onBag,
  backTo = NAMES.village,
}: {
  tab: Tab;
  save: LoungeSave;
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onBrand: () => void;
  onPresence: () => void;
  onInvite: () => void;
  onWallet: () => void;
  onAccount: () => void;
  onMenu: () => void;
  onMail?: () => void;
  onBag?: () => void;
  /** Where the interior's 나가기 leads (마을, or 내 방 from the wardrobe). */
  backTo?: string;
}) {
  const village = tab === 'village';
  const unread = view.life?.me.mailUnread ?? 0;
  return (
    <header className="l-header l-world-header">
      <button
        className="l-brand"
        onClick={onBrand}
        data-testid={village ? 'village-menu-brand' : 'village-return'}
        aria-label={
          village
            ? `${NAMES.app} 메뉴`
            : `나가기 · ${josa(backTo, '으로/로')} (Esc)`
        }
      >
        <span className="l-brand-icon">
          {village ? <Trees size={24} /> : <ArrowLeft size={22} />}
        </span>
        <span>
          <strong>
            {village ? NAMES.app : '나가기'}
          </strong>
          <small>
            {village
              ? '일곱 친구가 사는 마을'
              : `${tab === 'bedroom' ? `${ACTORS[save.actor]}의 집` : TAB_TITLES[tab]} → ${backTo}`}
          </small>
        </span>
      </button>
      <div className="l-header-right">
        <PresenceRow view={view} onClick={onPresence} />
        <button
          className="l-invite-button"
          onClick={onInvite}
          data-coach="invite"
          aria-label="게임 초대하기"
        >
          <Send size={17} aria-hidden="true" />
          <span>게임 초대</span>
        </button>
        <span className="l-wallet-group">
          <button
            className="l-wallet-button"
            onClick={onWallet}
            aria-label={`내 범 지갑 ${formatBeom(view.wallet.balance)}`}
          >
            <Coins size={16} aria-hidden="true" />
            {formatBeom(view.wallet.balance)}
          </button>
          <DailyButton room={room} view={view} notify={notify} compact />
        </span>
        {onBag && (
          <button
            className="l-header-icon l-bag-button"
            onClick={onBag}
            aria-label="가방 열기"
            title="가방"
            data-coach="life"
          >
            <Backpack size={19} aria-hidden="true" />
          </button>
        )}
        {onMail && (
          <button
            className="l-header-icon l-mail-button"
            onClick={onMail}
            aria-label={unread ? `우편함, 읽지 않은 편지 ${unread}통` : '우편함'}
            title="우편함"
            data-testid="header-mail"
          >
            <Mail size={19} aria-hidden="true" />
            {unread > 0 && (
              <b className="l-header-badge" aria-hidden="true">
                {unread > 9 ? '9+' : unread}
              </b>
            )}
          </button>
        )}
        <button
          className="l-profile"
          onClick={onAccount}
          title="내 계정"
          aria-label="내 계정"
        >
          <AvatarView
            actor={save.actor}
            look={save.looks[save.actor]}
            portrait
          />
          <span>{ACTORS[save.actor]}</span>
        </button>
        <button
          className="l-world-menu-button"
          aria-label="메뉴"
          onClick={onMenu}
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
