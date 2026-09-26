'use client';
import {
  ArrowLeft,
  ArrowUpFromLine,
  Keyboard,
  LogOut,
  Maximize,
  Minimize,
  Play,
  Power,
  Settings,
  House,
  LayoutGrid,
} from 'lucide-react';
import { useSettings } from '../lounge-settings';
import { BIND_GROUPS, bindingLabel, keyLabel, type Keybinds } from '../lounge-keybinds';
import { isDesktopApp } from '../desktop-bridge';
import { josa } from '../lounge-text';
import { Modal } from './Modal';
import './pc.css';

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
  onLeaveRoom,
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
  /** In my room: walk out to the village. */
  onLeaveRoom?: () => void;
  onLogout: () => void;
  /** Desktop app only: close the game window (saves first). */
  onQuit?: () => void;
  /** At a game table: step back to the hall/casino (seat kept) or stand up. */
  table?: { place: string; onBack: () => void; onStand: () => void };
}) {
  const [settings] = useSettings();
  const desktop = isDesktopApp();
  return (
    <Modal title="메뉴" onClose={onClose} className="l-system-menu">
      <p className="l-modal-intro l-system-note">
        {table
          ? '메뉴를 열어 둬도 게임은 이어져요. 내 차례 시간도 흘러가니 금방 돌아와 주세요.'
          : '마을은 친구들과 함께 쓰는 곳이라 메뉴를 열어 둬도 시간은 흘러가요. 내 캐릭터만 잠시 멈춰요.'}
      </p>
      <div className="l-system-list" data-testid="system-menu">
        <button type="button" className="l-system-primary" onClick={onClose} data-testid="system-resume">
          <Play size={18} aria-hidden="true" />
          <span>계속하기</span>
          <kbd>Esc</kbd>
        </button>
        {table && (
          <>
            <button type="button" onClick={table.onBack} data-testid="system-table-back">
              <ArrowLeft size={18} aria-hidden="true" />
              <span>{josa(table.place, '으로/로')} 돌아가기 · 자리 유지</span>
            </button>
            <button type="button" onClick={table.onStand} data-testid="system-table-stand">
              <ArrowUpFromLine size={18} aria-hidden="true" />
              <span>테이블에서 일어나기</span>
            </button>
          </>
        )}
        <button type="button" onClick={onVillageMenu}>
          <LayoutGrid size={18} aria-hidden="true" />
          <span>마을 메뉴</span>
        </button>
        {onLeaveRoom && (
          <button type="button" onClick={onLeaveRoom}>
            <House size={18} aria-hidden="true" />
            <span>마을로 나가기</span>
          </button>
        )}
        <button type="button" onClick={onSettings} data-testid="system-settings">
          <Settings size={18} aria-hidden="true" />
          <span>설정</span>
        </button>
        <button type="button" onClick={onHelp} data-testid="system-help">
          <Keyboard size={18} aria-hidden="true" />
          <span>조작 안내</span>
          <kbd>{keyLabel(settings.keys.help) || 'F1'}</kbd>
        </button>
        <button type="button" onClick={onFullscreen} data-testid="system-fullscreen">
          {settings.fullscreen ? (
            <Minimize size={18} aria-hidden="true" />
          ) : (
            <Maximize size={18} aria-hidden="true" />
          )}
          <span>{settings.fullscreen ? '창 모드로 전환' : '전체 화면으로 전환'}</span>
          <kbd>F11</kbd>
        </button>
        <button type="button" onClick={onLogout} data-testid="system-logout">
          <LogOut size={18} aria-hidden="true" />
          <span>로그아웃</span>
        </button>
        {desktop && onQuit && (
          <button type="button" className="l-system-danger" onClick={onQuit} data-testid="system-quit">
            <Power size={18} aria-hidden="true" />
            <span>게임 끝내기</span>
          </button>
        )}
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
        <button type="button" className="l-secondary" onClick={onEdit} data-testid="help-edit-keys">
          키 바꾸기
        </button>
        <button type="button" className="l-primary" onClick={onClose}>
          알겠어요
        </button>
      </div>
    </Modal>
  );
}
