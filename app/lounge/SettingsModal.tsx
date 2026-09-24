'use client';
import { useState } from 'react';
import { useSettings } from '../lounge-settings';
import { playCue, requestNotifications } from './feedback';
import { Modal } from './Modal';

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

/** One place for sound, stickers, notifications and graphics (saved on this device). */
export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [settings, update] = useSettings();
  const [notice, setNotice] = useState('');
  const supported = typeof Notification !== 'undefined';
  return (
    <Modal title="설정" onClose={onClose}>
      <div className="l-settings">
        <Toggle
          label="효과음"
          hint="초대, 내 차례, 게임 시작과 결과를 작은 소리로 알려요."
          checked={settings.sound}
          onChange={(sound) => {
            update({ sound });
            if (sound) setTimeout(() => playCue('invite'), 0);
          }}
        />
        <label className="l-setting l-setting-range" aria-label="소리 크기">
          <span>
            <strong>소리 크기</strong>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.volume}
            disabled={!settings.sound}
            onChange={(e) => update({ volume: Number(e.target.value) })}
            onPointerUp={() => playCue('turn')}
          />
        </label>
        <Toggle
          label="배경 음악과 자연의 소리"
          hint="오르골 음악, 물소리·새소리, 발소리를 들려줘요. 효과음을 켜야 들려요."
          checked={settings.music}
          disabled={!settings.sound}
          onChange={(music) => update({ music })}
        />
        <Toggle
          label="낮과 밤"
          hint="마을 조명이 한국 시간에 맞춰 아침·낮·저녁·밤으로 바뀌어요."
          checked={settings.dayNight}
          onChange={(dayNight) => update({ dayNight })}
        />
        <Toggle
          label="브라우저 알림"
          hint={
            supported
              ? '다른 창을 보고 있을 때 초대와 내 차례를 알려요.'
              : '이 브라우저는 알림을 지원하지 않아요.'
          }
          checked={settings.notifications}
          disabled={!supported}
          onChange={async (on) => {
            if (!on) {
              update({ notifications: false });
              return;
            }
            const granted = await requestNotifications();
            update({ notifications: granted });
            setNotice(
              granted
                ? ''
                : '브라우저에서 알림이 차단돼 있어요. 주소창의 사이트 설정에서 허용해 주세요.',
            );
          }}
        />
        <Toggle
          label="진동"
          hint="휴대폰에서 초대와 내 차례에 짧게 진동해요."
          checked={settings.vibrate}
          onChange={(vibrate) => update({ vibrate })}
        />
        <Toggle
          label="친구 스티커 숨기기"
          hint="마을과 게임 화면의 스티커를 가려요."
          checked={settings.reactionsHidden}
          onChange={(reactionsHidden) => update({ reactionsHidden })}
        />
        <Toggle
          label="간단 그래픽 (2D 마을)"
          hint="입체 마을 대신 가벼운 안내판으로 이동해요. 느린 기기에 좋아요."
          checked={settings.simpleGraphics}
          onChange={(simpleGraphics) => update({ simpleGraphics })}
        />
      </div>
      {notice && (
        <p className="l-error" role="alert">
          {notice}
        </p>
      )}
      <p className="l-help-text">설정은 이 기기에만 저장돼요.</p>
    </Modal>
  );
}
