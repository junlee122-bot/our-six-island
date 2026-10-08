'use client';
// HUD 다이어트 (D2): 가방 and 우편 hang beside the hotbar, in the same spot in
// every space (the hub, the districts, my room and the shops). They used to
// sit in the top-right row, and 가방 a second time beside 수다 out in the
// districts. Where there is no hotbar (rooms), the dock keeps the same place.
import { Backpack, Mail } from '../ui/icons';
import { KeyHint } from '../ui/KeyHint';
import './hud.css';

export function PocketDock({
  unread,
  onBag,
  onMail,
}: {
  unread: number;
  onBag: () => void;
  onMail: () => void;
}) {
  return (
    <div className="l-pocket-row">
      <nav
        className="l-pocket-dock"
        aria-label="가방과 우편"
        data-testid="pocket-dock"
      >
        <button
          type="button"
          className="l-pocket-button"
          onClick={onBag}
          aria-label="가방 열기"
          data-bind="inventory"
          data-coach="life"
          data-testid="pocket-bag"
        >
          <KeyHint action="inventory" />
          <Backpack size={22} aria-hidden="true" />
          <span aria-hidden="true">가방</span>
        </button>
        <button
          type="button"
          className="l-pocket-button"
          onClick={onMail}
          aria-label={unread ? `우편함, 읽지 않은 편지 ${unread}통` : '우편함'}
          data-tip={unread ? `우편함 · 읽지 않은 편지 ${unread}통` : '우편함'}
          data-testid="pocket-mail"
        >
          <Mail size={22} aria-hidden="true" />
          <span aria-hidden="true">우편</span>
          {unread > 0 && (
            <b className="l-pocket-badge" aria-hidden="true">
              {unread > 9 ? '9+' : unread}
            </b>
          )}
        </button>
      </nav>
    </div>
  );
}
