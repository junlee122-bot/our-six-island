'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  DEFAULT_KEYBINDS,
  BIND_GROUPS,
  BIND_LABEL,
  bindingLabel,
  keyLabel,
  rebind,
  type BindAction,
} from '../lounge-keybinds';
import {
  FPS_CAPS,
  TEXT_SCALES,
  UI_SCALES,
  useSettings,
  type GraphicsQuality,
  type LoungeSettings,
} from '../lounge-settings';
import { isDesktopApp, requestDesktopNotificationPermission } from '../desktop-bridge';
import { setFullscreen } from '../lounge-display';
import { lifeSfx } from '../lounge-audio-life';
import { playCue, requestNotifications } from './feedback';
import { Modal } from './Modal';
import './pc.css';

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="l-setting" aria-label={label}>
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

/** A labelled row of choice buttons (radio group, arrow keys move). */
function Choice<T extends string | number>({
  label,
  hint,
  value,
  options,
  onChange,
  name,
}: {
  label: string;
  hint?: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  name: string;
}) {
  return (
    <fieldset className="l-setting l-setting-choice">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden="true">
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <div className="l-segment" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <label key={String(o.value)} data-checked={o.value === value}>
            <input
              type="radio"
              name={name}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Volume({
  label,
  value,
  disabled,
  onChange,
  onRelease,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  onRelease?: () => void;
}) {
  return (
    <label className="l-setting l-setting-range" aria-label={label}>
      <span>
        <strong>{label}</strong>
      </span>
      <span className="l-range-row">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={onRelease}
          onKeyUp={onRelease}
        />
        <output>{Math.round(value * 100)}%</output>
      </span>
    </label>
  );
}

type Tab = 'graphics' | 'display' | 'sound' | 'controls' | 'alerts';
const TABS: { id: Tab; label: string }[] = [
  { id: 'graphics', label: '그래픽' },
  { id: 'display', label: '화면' },
  { id: 'sound', label: '소리' },
  { id: 'controls', label: '조작' },
  { id: 'alerts', label: '알림' },
];

const QUALITY: { value: GraphicsQuality; label: string }[] = [
  { value: 'low', label: '낮음' },
  { value: 'mid', label: '중간' },
  { value: 'high', label: '높음' },
];

/** The 조작 tab: click a key, press the new one (Esc cancels). */
function KeyTable({
  settings,
  update,
}: {
  settings: LoungeSettings;
  update: (patch: Partial<LoungeSettings>) => void;
}) {
  const [listening, setListening] = useState<BindAction | null>(null);
  const [note, setNote] = useState('');
  const keys = settings.keys;
  const latest = useRef({ keys, update });
  useEffect(() => {
    latest.current = { keys, update };
  });
  useEffect(() => {
    if (!listening) return;
    const capture = (e: KeyboardEvent) => {
      // Capture phase on window: the dialog's own Esc handling never sees it.
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat) return;
      if (e.code === 'Escape' && listening !== 'menu') {
        setListening(null);
        setNote('바꾸지 않았어요.');
        return;
      }
      const result = rebind(latest.current.keys, listening, e.code);
      if (!result.ok) {
        setNote(`${keyLabel(e.code) || e.key}은(는) 쓸 수 없는 키예요. 다른 키를 눌러 주세요.`);
        return;
      }
      latest.current.update({ keys: result.binds });
      setNote(
        result.swapped
          ? `${keyLabel(e.code)} 키는 ‘${BIND_LABEL[result.swapped]}’에 쓰이고 있었어요. 두 키를 서로 바꿨어요.`
          : `‘${BIND_LABEL[listening]}’ 키를 ${keyLabel(e.code)}(으)로 바꿨어요.`,
      );
      setListening(null);
    };
    window.addEventListener('keydown', capture, true);
    return () => window.removeEventListener('keydown', capture, true);
  }, [listening]);
  return (
    <div className="l-keys" data-testid="settings-keys">
      <p className="l-help-text l-keys-intro">
        바꿀 키를 누른 뒤 새 키를 눌러요. 이미 쓰는 키를 고르면 두 키가 서로 바뀌어요. 방향키는 늘 걷기, Shift는 달리기, F11은 전체 화면이에요.
      </p>
      {BIND_GROUPS.map((group) => (
        <section key={group.title} className="l-keys-group">
          <h3>{group.title}</h3>
          <ul>
            {group.actions.map(({ action, label }) => (
              <li key={action}>
                <span>{label}</span>
                <button
                  type="button"
                  className="l-keycap-button"
                  aria-label={`${label}: ${bindingLabel(keys, action)}. 눌러서 바꾸기`}
                  aria-pressed={listening === action}
                  data-testid={`bind-${action}`}
                  onClick={() => {
                    setNote('');
                    setListening(listening === action ? null : action);
                  }}
                >
                  {listening === action ? '새 키를 눌러요…' : <kbd>{bindingLabel(keys, action)}</kbd>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="l-keys-foot">
        <output className="l-keys-note" aria-live="polite">
          {note}
        </output>
        <button
          type="button"
          className="l-secondary"
          data-testid="bind-reset"
          onClick={() => {
            update({ keys: { ...DEFAULT_KEYBINDS } });
            setListening(null);
            setNote('모든 키를 처음 설정으로 되돌렸어요.');
          }}
        >
          <RotateCcw size={15} aria-hidden="true" /> 기본값으로
        </button>
      </div>
    </div>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <div className="l-settings">{children}</div>;
}

/** Tabbed PC settings (saved on this device): graphics, display, sound, keys and alerts. */
export function SettingsModal({
  onClose,
  initialTab = 'graphics',
}: {
  onClose: () => void;
  initialTab?: Tab;
}) {
  const [settings, update] = useSettings();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [notice, setNotice] = useState('');
  const desktop = isDesktopApp();
  const supported = desktop || typeof Notification !== 'undefined';
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <Modal title="설정" onClose={onClose} className="l-settings-modal" wide>
      <div className="l-settings-layout">
        <div
          className="l-settings-tabs"
          role="tablist"
          aria-label="설정 종류"
          aria-orientation="vertical"
        >
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`settings-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`settings-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              data-testid={`settings-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => {
                const step =
                  e.key === 'ArrowDown' || e.key === 'ArrowRight'
                    ? 1
                    : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
                      ? -1
                      : 0;
                if (!step) return;
                e.preventDefault();
                const next = (i + step + TABS.length) % TABS.length;
                setTab(TABS[next].id);
                tabRefs.current[next]?.focus();
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div
          className="l-settings-panel"
          role="tabpanel"
          id={`settings-panel-${tab}`}
          aria-labelledby={`settings-tab-${tab}`}
        >
          {tab === 'graphics' && (
            <Section>
              <Choice
                name="quality"
                label="그래픽 품질"
                hint="낮음은 그림자와 날씨 효과를 끄고 해상도를 낮춰요. 높음은 고해상도 화면에서 가장 선명해요."
                value={settings.quality}
                options={QUALITY}
                onChange={(quality) => update({ quality })}
              />
              <Choice
                name="fps"
                label="프레임 제한"
                hint="노트북 배터리와 발열을 줄이고 싶으면 30이나 60으로 제한해요."
                value={settings.fpsCap}
                options={FPS_CAPS.map((v) => ({ value: v, label: v ? `${v}` : '제한 없음' }))}
                onChange={(fpsCap) => update({ fpsCap })}
              />
              <Toggle
                label="계절 효과"
                hint="마을에 비·눈이 내리고 가을엔 낙엽이, 봄엔 꽃잎이 날려요. 품질이 낮음이거나 동작 줄이기 설정이면 꺼져요."
                checked={settings.seasonFx}
                disabled={settings.quality === 'low'}
                onChange={(seasonFx) => update({ seasonFx })}
              />
              <Toggle
                label="낮과 밤"
                hint="마을 조명이 한국 시간에 맞춰 아침·낮·저녁·밤으로 바뀌어요."
                checked={settings.dayNight}
                onChange={(dayNight) => update({ dayNight })}
              />
              <Toggle
                label="간단 그래픽 (2D 마을)"
                hint="입체 마을 대신 가벼운 안내판으로 이동해요. 그래픽 카드가 약한 컴퓨터에 좋아요."
                checked={settings.simpleGraphics}
                onChange={(simpleGraphics) => update({ simpleGraphics })}
              />
            </Section>
          )}
          {tab === 'display' && (
            <Section>
              <Choice
                name="window"
                label="화면 모드"
                hint={desktop ? '전체 화면은 F11로도 바꿀 수 있어요.' : '전체 화면은 F11로도 바꿀 수 있어요. Esc를 누르면 창으로 돌아와요.'}
                value={settings.fullscreen ? 'full' : 'window'}
                options={[
                  { value: 'window', label: '창 모드' },
                  { value: 'full', label: '전체 화면' },
                ]}
                onChange={(mode) => {
                  void setFullscreen(mode === 'full').then((on) => {
                    setNotice(on === null ? '전체 화면으로 바꾸지 못했어요. F11을 눌러 보세요.' : '');
                  });
                }}
              />
              <Choice
                name="ui-scale"
                label="UI 크기"
                hint="머리글, 버튼, 핫바와 창의 크기예요. 마을 화면 자체는 그대로예요."
                value={settings.uiScale}
                options={UI_SCALES.map((v) => ({ value: v, label: `${v}%` }))}
                onChange={(uiScale) => update({ uiScale })}
              />
              <Choice
                name="text-scale"
                label="글자 크기"
                hint="가방·도감·편지 같은 창의 글자를 더 크게 보여줘요."
                value={settings.textScale}
                options={TEXT_SCALES.map((v) => ({
                  value: v,
                  label: v === 100 ? '보통' : v === 115 ? '크게' : '아주 크게',
                }))}
                onChange={(textScale) => update({ textScale })}
              />
              <Toggle
                label="친구 스티커 숨기기"
                hint="마을과 게임 화면의 스티커를 가려요."
                checked={settings.reactionsHidden}
                onChange={(reactionsHidden) => update({ reactionsHidden })}
              />
            </Section>
          )}
          {tab === 'sound' && (
            <Section>
              <Toggle
                label="소리 켜기"
                hint="모든 게임 소리를 켜고 꺼요."
                checked={settings.sound}
                onChange={(sound) => {
                  update({ sound });
                  if (sound) setTimeout(() => playCue('invite'), 0);
                }}
              />
              <Volume
                label="전체 소리"
                value={settings.volume}
                disabled={!settings.sound}
                onChange={(volume) => update({ volume })}
                onRelease={() => playCue('turn')}
              />
              <Toggle
                label="배경 음악과 자연의 소리"
                hint="오르골 음악, 물소리·새소리, 발소리를 들려줘요."
                checked={settings.music}
                disabled={!settings.sound}
                onChange={(music) => update({ music })}
              />
              <Volume
                label="음악"
                value={settings.musicVolume}
                disabled={!settings.sound || !settings.music}
                onChange={(musicVolume) => update({ musicVolume })}
              />
              <Volume
                label="효과음"
                value={settings.effectsVolume}
                disabled={!settings.sound}
                onChange={(effectsVolume) => update({ effectsVolume })}
                onRelease={() => lifeSfx('pickup')}
              />
              <Volume
                label="알림·버튼 소리"
                value={settings.uiVolume}
                disabled={!settings.sound}
                onChange={(uiVolume) => update({ uiVolume })}
                onRelease={() => playCue('turn')}
              />
            </Section>
          )}
          {tab === 'controls' && <KeyTable settings={settings} update={update} />}
          {tab === 'alerts' && (
            <Section>
              <Toggle
                label="데스크톱 알림"
                hint={
                  supported
                    ? '게임 창이 뒤에 있거나 최소화돼 있을 때 초대와 내 차례를 알려요.'
                    : '이 환경에서는 알림을 보낼 수 없어요.'
                }
                checked={settings.notifications}
                disabled={!supported}
                onChange={async (on) => {
                  if (!on) {
                    update({ notifications: false });
                    return;
                  }
                  const granted = desktop
                    ? await requestDesktopNotificationPermission()
                    : await requestNotifications();
                  update({ notifications: granted });
                  setNotice(
                    granted
                      ? ''
                      : desktop
                        ? '알림이 꺼져 있어요. 컴퓨터의 알림 설정에서 범타듀 밸리를 허용해 주세요.'
                        : '알림이 차단돼 있어요. 주소창의 사이트 설정에서 허용해 주세요.',
                  );
                }}
              />
              <Toggle
                label="작업 표시줄 깜빡임"
                hint="창이 뒤에 있을 때 초대와 내 차례에 작업 표시줄(맥은 Dock) 아이콘으로 알려요."
                checked={settings.attention}
                onChange={(attention) => update({ attention })}
              />
            </Section>
          )}
        </div>
      </div>
      {notice && (
        <p className="l-error" role="alert">
          {notice}
        </p>
      )}
      <p className="l-help-text">설정은 이 컴퓨터에만 저장돼요.</p>
    </Modal>
  );
}

export type SettingsTab = Tab;
