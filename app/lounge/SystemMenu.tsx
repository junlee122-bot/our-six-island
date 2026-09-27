'use client';
import { Glyph, type GlyphName } from '../ui/Glyph';
import { GameButton } from '../ui/GameButton';
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from 'react';
import { useSettings } from '../lounge-settings';
import { BIND_GROUPS, bindingLabel, keyLabel, type Keybinds } from '../lounge-keybinds';
import { isDesktopApp } from '../desktop-bridge';
import { josa } from '../lounge-text';
import { Modal } from './Modal';
import './pc.css';

/**
 * Arrow keys move focus between a menu's buttons by where they sit on
 * screen (down/up to the nearest button in the next row, left/right within
 * a row); Home / End jump to the first / last. Tab still works as usual.
 */
export function menuArrows(e: ReactKeyboardEvent<HTMLElement>) {
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (!keys.includes(e.key)) return;
  const items = [
    ...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), summary'),
  ].filter((b) => b.getClientRects().length > 0);
  if (!items.length) return;
  const current = document.activeElement as HTMLElement | null;
  const at = current ? items.indexOf(current) : -1;
  let next: HTMLElement | undefined;
  if (e.key === 'Home') next = items[0];
  else if (e.key === 'End') next = items.at(-1);
  else if (at < 0) next = items[0];
  else {
    const r = items[at].getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let best = Infinity;
    for (const item of items) {
      if (item === items[at]) continue;
      const q = item.getBoundingClientRect();
      const x = q.left + q.width / 2;
      const y = q.top + q.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const along =
        e.key === 'ArrowDown' ? dy : e.key === 'ArrowUp' ? -dy : e.key === 'ArrowRight' ? dx : -dx;
      const across = e.key === 'ArrowDown' || e.key === 'ArrowUp' ? Math.abs(dx) : Math.abs(dy);
      if (along < 4) continue;
      // Same row / column first, then the closest.
      const score = along + across * 3;
      if (score < best) {
        best = score;
        next = item;
      }
    }
    // Left/right at a row's end wrap to the next / previous button.
    next ??= e.key === 'ArrowRight' ? items[at + 1] : e.key === 'ArrowLeft' ? items[at - 1] : undefined;
  }
  if (!next) return;
  e.preventDefault();
  next.focus();
  next.scrollIntoView({ block: 'nearest' });
}

/**
 * The dialog opens with focus on itself: the first arrow key press steps
 * into the menu's list (then menuArrows moves along it).
 */
function useArrowEntry(list: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const el = list.current;
      const active = document.activeElement;
      if (!el || e.defaultPrevented || (active && el.contains(active))) return;
      const dialog = el.closest('dialog');
      if (!dialog || !active || !dialog.contains(active)) return;
      if (active.closest('input, textarea, select')) return;
      e.preventDefault();
      el.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [list]);
}

export type MenuEntry = {
  id: string;
  label: string;
  glyph: GlyphName;
  onClick: () => void;
  /** Shortcut shown on the right (from 설정 → 조작). */
  kbd?: string;
  /** Unread count and the like. */
  badge?: number;
};

/**
 * The ☰ menu (마을 메뉴): the same list style as the Esc menu, grouped
 * (내 마을 / 친구 / 설정·도움말 / 계정). Actions that cannot be undone sit in
 * a closed '되돌릴 수 없는 일' area at the end and still ask before acting.
 */
export function VillageMenu({
  title,
  summary,
  intro,
  groups,
  danger,
  onClose,
}: {
  title: string;
  summary: ReactNode;
  intro?: string;
  groups: { title: string; items: MenuEntry[] }[];
  danger: { id: string; label: string; note: string; onClick: () => void }[];
  onClose: () => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  useArrowEntry(list);
  const [mine, ...rest] = groups;
  const group = (g: { title: string; items: MenuEntry[] }) => (
    <section key={g.title} className="l-village-menu-group" aria-label={g.title}>
      <h3>{g.title}</h3>
      <div className="l-system-list">
        {g.items.map((item) => (
          <MenuRow
            key={item.id}
            glyph={item.glyph}
            label={item.label}
            badge={item.badge}
            kbd={item.kbd}
            onClick={item.onClick}
            testId={'menu-' + item.id}
          />
        ))}
      </div>
    </section>
  );
  return (
    <Modal
      title={title}
      onClose={onClose}
      className="l-village-menu"
      wide
      keyHints={[
        { keys: [{ label: '↑↓←→' }], does: '고르기' },
        { keys: [{ code: 'Enter' }], does: '열기' },
      ]}
    >
      {/* Arrow-key focus moves are the menu's own keyboard help (see menuArrows). */}
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div ref={list} className="l-village-menu-groups" onKeyDown={menuArrows} data-testid="village-menu">
        <div className="l-menu-page">
          {summary}
          {intro && <p className="l-system-note">{intro}</p>}
          {mine && group(mine)}
        </div>
        <div className="l-menu-page">
          {rest.map(group)}
          {danger.length > 0 && (
            <details className="l-menu-danger" data-testid="menu-danger">
              <summary>
                <Glyph name="warn" size={18} />
                되돌릴 수 없는 일
              </summary>
              <div className="l-system-list">
                {danger.map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    className="l-system-danger"
                    onClick={d.onClick}
                    data-testid={'menu-' + d.id}
                  >
                    <span>
                      {d.label}
                      <small>{d.note}</small>
                    </span>
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </Modal>
  );
}

/** One line of a menu: glyph · name · dotted leader · keycap. */
function MenuRow({
  glyph,
  label,
  badge,
  kbd,
  onClick,
  testId,
  primary = false,
  danger = false,
}: {
  glyph: GlyphName;
  label: ReactNode;
  badge?: number;
  kbd?: string;
  onClick: () => void;
  testId?: string;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={primary ? 'l-system-primary' : danger ? 'l-system-danger' : undefined}
      onClick={onClick}
      data-testid={testId}
    >
      <Glyph name={glyph} size={20} />
      <span className="l-menu-label">
        {label}
        {badge ? <b className="l-menu-badge">{badge}</b> : null}
      </span>
      <i className="l-menu-leader" aria-hidden="true" />
      {kbd && <kbd>{kbd}</kbd>}
    </button>
  );
}

/**
 * The Esc menu (village, room, hall, casino and game tables). Opening it
 * stops my own walk and ducks the music; the village is shared online, so
 * the world itself goes on (a table's turn clock too).
 */
export function SystemMenu({
  onClose,
  onSettings,
  onHelp,
  onFullscreen,
  onVillageMenu,
  onGrowth,
  onMood,
  onLeaveRoom,
  leaveLabel = '마을로 나가기',
  onLogout,
  onQuit,
  table,
}: {
  onClose: () => void;
  onSettings: () => void;
  onHelp: () => void;
  onFullscreen: () => void;
  /** 마을 메뉴 (the hub with bag, shop, mail…). */
  onVillageMenu: () => void;
  /** 성장 수첩 (skills, tools, 마을 개척). */
  onGrowth?: () => void;
  /** 기분 창 (needs, thoughts, inspiration). */
  onMood?: () => void;
  /** In my room: walk out to the village. */
  onLeaveRoom?: () => void;
  /** The leave item's words ('내 방으로 나가기' from the wardrobe). */
  leaveLabel?: string;
  onLogout: () => void;
  /** Desktop app only: close the game window (saves first). */
  onQuit?: () => void;
  /** At a game table: step back to the hall/casino (seat kept) or stand up. */
  table?: { place: string; onBack: () => void; onStand: () => void };
}) {
  const [settings] = useSettings();
  const desktop = isDesktopApp();
  const list = useRef<HTMLDivElement>(null);
  useArrowEntry(list);
  return (
    <Modal
      title="메뉴"
      onClose={onClose}
      className="l-system-menu"
      keyHints={[
        { keys: [{ label: '↑↓' }], does: '고르기' },
        { keys: [{ code: 'Enter' }], does: '누르기' },
      ]}
    >
      <p className="l-system-note">
        {table
          ? '메뉴를 열어 둬도 게임은 이어져요. 내 차례 시간도 흘러가니 금방 돌아와 주세요.'
          : '마을은 친구들과 함께 쓰는 곳이라 메뉴를 열어 둬도 시간은 흘러가요. 내 캐릭터만 잠시 멈춰요.'}
      </p>
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div ref={list} className="l-system-list" data-testid="system-menu" onKeyDown={menuArrows}>
        <MenuRow primary glyph="play" label="계속하기" kbd="Esc" onClick={onClose} testId="system-resume" />
        {table && (
          <>
            <MenuRow glyph="arrow-left" label={`${josa(table.place, '으로/로')} 돌아가기 · 자리 유지`} onClick={table.onBack} testId="system-table-back" />
            <MenuRow glyph="stand" label="테이블에서 일어나기" onClick={table.onStand} testId="system-table-stand" />
          </>
        )}
        <MenuRow glyph="grid" label="마을 메뉴" onClick={onVillageMenu} />
        {onGrowth && <MenuRow glyph="spark" label="성장 수첩" kbd={keyLabel(settings.keys.growth) || 'T'} onClick={onGrowth} testId="system-growth" />}
        {onMood && <MenuRow glyph="sticker" label="기분" kbd={keyLabel(settings.keys.mood) || 'U'} onClick={onMood} testId="system-mood" />}
        {onLeaveRoom && <MenuRow glyph="house" label={leaveLabel} onClick={onLeaveRoom} />}
        <MenuRow glyph="gear" label="설정" onClick={onSettings} testId="system-settings" />
        <MenuRow glyph="keyboard" label="조작 안내" kbd={keyLabel(settings.keys.help) || 'F1'} onClick={onHelp} testId="system-help" />
        <MenuRow
          glyph={settings.fullscreen ? 'minimize' : 'maximize'}
          label={settings.fullscreen ? '창 모드로 전환' : '전체 화면으로 전환'}
          kbd="F11"
          onClick={onFullscreen}
          testId="system-fullscreen"
        />
        <MenuRow glyph="door" label="로그아웃" onClick={onLogout} testId="system-logout" />
        {desktop && onQuit && <MenuRow danger glyph="power" label="게임 끝내기" onClick={onQuit} testId="system-quit" />}
      </div>
    </Modal>
  );
}

const MOUSE: readonly [string, string][] = [
  ['클릭', '그곳으로 걷기 · 건물을 클릭하면 문 앞까지'],
  ['드래그', '마을 둘러보기'],
  ['휠', '마을 확대·축소'],
  ['마우스를 올리기', '버튼 이름과 단축키 보기'],
];

function fixedKeys(keys: Keybinds): [string, string][] {
  return [
    ['Shift', '누르고 있으면 달리기'],
    ['Enter', '행동 버튼 (장면에 초점이 있을 때)'],
    ['F11', '전체 화면 전환'],
    ['Tab', '버튼 사이 이동'],
    [bindingLabel(keys, 'menu'), '창 닫기 · 메뉴 열기'],
  ];
}

/** 조작 안내: the current bindings plus mouse and fixed keys. */
export function ControlsHelp({
  onClose,
  onEdit,
}: {
  onClose: () => void;
  /** Opens 설정 → 조작. */
  onEdit: () => void;
}) {
  const [settings] = useSettings();
  const keys = settings.keys;
  return (
    <Modal title="조작 안내" onClose={onClose} className="l-controls-help" wide>
      <div className="l-controls-grid" data-testid="controls-help">
        {BIND_GROUPS.filter((g) => g.title !== '핫바').map((group) => (
          <section key={group.title}>
            <h3>{group.title}</h3>
            <dl>
              {group.actions.map(({ action, label }) => (
                <div key={action}>
                  <dt>
                    <kbd>{bindingLabel(keys, action)}</kbd>
                  </dt>
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <section>
          <h3>마우스와 고정 키</h3>
          <dl>
            {MOUSE.map(([k, v]) => (
              <div key={k}>
                <dt>
                  <kbd>{k}</kbd>
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
            {fixedKeys(keys).map(([k, v]) => (
              <div key={k + v}>
                <dt>
                  <kbd>{k}</kbd>
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
            <div>
              <dt>
                <kbd>
                  {keyLabel(keys.hotbar1)}–{keyLabel(keys.hotbar9)}
                </kbd>
              </dt>
              <dd>핫바 칸 고르기 · 요리는 한 번 더 누르면 먹어요</dd>
            </div>
          </dl>
        </section>
        <section>
          <h3>방 꾸미기</h3>
          <dl>
            <div>
              <dt>
                <kbd>R</kbd>
              </dt>
              <dd>고른 소품 돌리기 (Shift+R 반대로)</dd>
            </div>
            <div>
              <dt>
                <kbd>방향키</kbd>
              </dt>
              <dd>조금씩 옮기기 (Shift는 크게)</dd>
            </div>
            <div>
              <dt>
                <kbd>Delete</kbd>
              </dt>
              <dd>치우기</dd>
            </div>
            <div>
              <dt>
                <kbd>Ctrl+Z</kbd>
              </dt>
              <dd>되돌리기 (Ctrl+Y 다시 하기)</dd>
            </div>
          </dl>
        </section>
      </div>
      <div className="l-modal-actions">
        <GameButton glyph="keyboard" onClick={onEdit} data-testid="help-edit-keys">
          키 바꾸기
        </GameButton>
        <GameButton variant="primary" onClick={onClose}>
          알겠어요
        </GameButton>
      </div>
    </Modal>
  );
}
