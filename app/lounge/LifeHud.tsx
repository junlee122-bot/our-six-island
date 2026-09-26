'use client';
// Life HUD (LIFE-B): the calendar / season / weather chip with a forecast
// tooltip, today's dish buff, and the 1–9 hotbar. Desktop first: hover and
// keyboard focus show the details; nothing here blocks the world below.
import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { hotbarIndexForCode, keyLabel, type BindAction } from '../lounge-keybinds';
import { getSettings, useSettings } from '../lounge-settings';
import { globalKeyTarget } from '../lounge-scene-keys';
import {
  CalendarDays,
  Cloud,
  CloudLightning,
  CloudRain,
  Flower2,
  Leaf,
  Snowflake,
  Sparkles,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import type { LifeView } from '../lounge-life';
import type { Season, Weather } from '../lounge-calendar';
import { SEASON_INFO, WEATHER_INFO } from '../lounge-calendar';
import {
  HOTBAR_KEY,
  HOTBAR_SIZE,
  calendarLine,
  hotbarCount,
  hotbarName,
  placeInHotbar,
  readHotbar,
} from '../lounge-life-ui';
import { ItemIcon } from './ItemIcon';
import { useNow } from './use-now';
import './life-plus.css';

export const SEASON_ICON: Record<Season, LucideIcon> = {
  spring: Flower2,
  summer: Sun,
  autumn: Leaf,
  winter: Snowflake,
};
export const WEATHER_ICON: Record<Weather, LucideIcon> = {
  sunny: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  snow: Snowflake,
};
const WEATHER_TIP: Record<Weather, string> = {
  sunny: '맑아요. 물 주기를 잊지 마세요.',
  cloudy: '흐려요. 낚시하기 좋은 날씨예요.',
  rain: '비가 와요. 밭에 따로 물을 주지 않아도 돼요.',
  storm: '폭풍우예요. 전설의 물고기가 나타날지도 몰라요.',
  snow: '눈이 와요. 겨울 채집물이 반짝여요.',
};

function hoursLeft(until: number, now: number) {
  const h = Math.max(0, Math.ceil((until - now) / 3_600_000));
  return h >= 24 ? `${Math.ceil(h / 24)}일` : `${h}시간`;
}

/** Top HUD chip: "2년차 가을 5일 · 금요일 · 맑음" with today/tomorrow forecast. */
export function CalendarChip({
  life,
  clockOffset,
  onOpen,
}: {
  life: LifeView | null | undefined;
  clockOffset: number;
  /** Opens the events / digest card. */
  onOpen?: () => void;
}) {
  const tipId = useId();
  const [open, setOpen] = useState(false);
  const now = useNow(true, 60_000) + clockOffset;
  const cal = life?.calendar;
  if (!cal || !life?.weather) return null;
  const SeasonIcon = SEASON_ICON[cal.season];
  const TodayIcon = WEATHER_ICON[life.weather.today];
  const TomorrowIcon = WEATHER_ICON[life.weather.tomorrow];
  const events = cal.events.filter((e) => e.kind !== 'weekly' || e.active !== false);
  const buff = life.me.buff && life.me.buff.until > now ? life.me.buff : null;
  return (
    <div
      className="l-hud-calendar"
      data-season={cal.season}
      data-testid="hud-calendar"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="l-hud-chip"
        aria-describedby={tipId}
        aria-expanded={open}
        onClick={() => (onOpen ? onOpen() : setOpen((v) => !v))}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <SeasonIcon size={17} aria-hidden="true" className="l-hud-season" />
        <span className="l-hud-date">
          <strong>
            {SEASON_INFO[cal.season].name} {cal.seasonDay}일
          </strong>
          <small>{calendarLine(cal).split(' · ')[1]}</small>
        </span>
        <span className="l-hud-weather" data-weather={life.weather.today}>
          <TodayIcon size={17} aria-hidden="true" />
          {WEATHER_INFO[life.weather.today].name}
        </span>
        {events.length > 0 && (
          <span className="l-hud-event-dot" aria-label={`오늘의 행사 ${events.length}개`}>
            <Sparkles size={13} aria-hidden="true" />
            {events[0].name}
          </span>
        )}
        {buff && (
          <span className="l-hud-buff" data-testid="hud-buff" title={buff.text}>
            <Sparkles size={13} aria-hidden="true" /> {buff.name}
          </span>
        )}
      </button>
      <div id={tipId} role="tooltip" className="l-hud-tip" data-open={open || undefined} data-testid="hud-tip">
        <p className="l-hud-tip-title">
          <CalendarDays size={15} aria-hidden="true" /> {cal.date} · {calendarLine(cal)}
        </p>
        <ul className="l-hud-forecast">
          <li>
            <TodayIcon size={18} aria-hidden="true" />
            <span>
              <b>오늘 {WEATHER_INFO[life.weather.today].name}</b>
              <small>{WEATHER_TIP[life.weather.today]}</small>
            </span>
          </li>
          <li data-testid="hud-tomorrow">
            <TomorrowIcon size={18} aria-hidden="true" />
            <span>
              <b>내일 {WEATHER_INFO[life.weather.tomorrow].name}</b>
              <small>{WEATHER_INFO[life.weather.tomorrow].waters ? '내일은 비가 밭에 물을 줘요.' : WEATHER_TIP[life.weather.tomorrow]}</small>
            </span>
          </li>
        </ul>
        <p className="l-hud-tip-line">
          {cal.seasonNote ?? `${SEASON_INFO[cal.season].name}이 ${hoursLeft(cal.seasonEndsAt, now)} 뒤에 끝나요 · 한 계절은 7일이에요.`}
        </p>
        {events.length > 0 && (
          <ul className="l-hud-events">
            {events.map((e) => (
              <li key={e.id}>
                <Sparkles size={13} aria-hidden="true" />
                <b>{e.name}</b> <small>{e.text}</small>
              </li>
            ))}
          </ul>
        )}
        {buff && (
          <p className="l-hud-tip-line">
            <Sparkles size={13} aria-hidden="true" /> 오늘의 효과 <b>{buff.name}</b> · {buff.text}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ hotbar */

function loadHotbar() {
  try {
    return readHotbar(globalThis.localStorage?.getItem(HOTBAR_KEY));
  } catch {
    return readHotbar(null);
  }
}
function saveHotbar(slots: string[]) {
  try {
    globalThis.localStorage?.setItem(HOTBAR_KEY, JSON.stringify(slots));
  } catch {}
}
export const HOTBAR_DRAG_TYPE = 'text/x-bumtadew-item';

/** Hotbar slots (per device) + the selected slot, shared by the HUD and the inventory. */
export function useHotbar() {
  const [slots, setSlots] = useState<string[]>(loadHotbar);
  const [selected, setSelected] = useState(0);
  const put = (i: number, ref: string) =>
    setSlots((prev) => {
      const next = placeInHotbar(prev, i, ref);
      saveHotbar(next);
      return next;
    });
  const clear = (i: number) =>
    setSlots((prev) => {
      const next = prev.map((s, j) => (j === i ? '' : s));
      saveHotbar(next);
      return next;
    });
  return { slots, selected, setSelected, put, clear, tool: slots[selected] ?? '' };
}
export type HotbarState = ReturnType<typeof useHotbar>;

/** Bottom-centre hotbar: 1–9 select, drop items from the inventory, right-click clears. */
export function Hotbar({
  hotbar,
  life,
  onUse,
  className = '',
}: {
  hotbar: HotbarState;
  life: LifeView | null | undefined;
  /** A second press / click on a selected usable slot (eat a dish). */
  onUse?: (ref: string) => void;
  className?: string;
}) {
  const [over, setOver] = useState<number | null>(null);
  const drop = (i: number) => (e: DragEvent) => {
    e.preventDefault();
    setOver(null);
    const ref = e.dataTransfer.getData(HOTBAR_DRAG_TYPE);
    if (ref) {
      hotbar.put(i, ref);
      hotbar.setSelected(i);
    }
  };
  const me = life?.me;
  const [{ keys }] = useSettings();
  // The selected item's name shows for a moment after picking a slot, then
  // steps aside (it sat over the place card and door prompts).
  const [nameShown, setNameShown] = useState(false);
  const firstSelect = useRef(true);
  useEffect(() => {
    if (firstSelect.current) {
      firstSelect.current = false;
      return;
    }
    setNameShown(true);
    const t = setTimeout(() => setNameShown(false), 1600);
    return () => clearTimeout(t);
  }, [hotbar.selected, hotbar.tool]);
  const toolCount = hotbarCount(me, hotbar.tool);
  return (
    <div className={`l-hotbar ${className}`} role="toolbar" aria-label="핫바" data-testid="hotbar">
      {Array.from({ length: HOTBAR_SIZE }, (_, i) => {
        const stored = hotbar.slots[i] ?? '';
        const storedCount = hotbarCount(me, stored);
        // Used up (0 left): the slot shows as empty; the item comes back to
        // the same slot when I have it again.
        const ref = me && storedCount === 0 ? '' : stored;
        const count = ref ? storedCount : null;
        const name = hotbarName(ref);
        const active = hotbar.selected === i;
        return (
          <button
            key={i}
            type="button"
            className="l-hotbar-slot"
            aria-pressed={active}
            aria-label={`${i + 1}번 칸${name ? ` · ${name}` : ' · 비어 있음'}${count !== null ? ` · ${count}개` : ''}`}
            data-tip={name ? `${name}${count !== null ? ` · ${count}개` : ''}` : '가방에서 끌어다 놓아요'}
            data-bind={`hotbar${i + 1}`}
            data-slot={i}
            data-ref={ref}
            data-over={over === i || undefined}
            data-empty={!ref || undefined}
            onClick={() => {
              if (active && ref) onUse?.(ref);
              hotbar.setSelected(i);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (ref) hotbar.clear(i);
            }}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(HOTBAR_DRAG_TYPE)) {
                e.preventDefault();
                setOver(i);
              }
            }}
            onDragLeave={() => setOver((o) => (o === i ? null : o))}
            onDrop={drop(i)}
          >
            <kbd aria-hidden="true">{keyLabel(keys[`hotbar${i + 1}` as BindAction])}</kbd>
            {ref ? <ItemIcon id={ref} size={28} /> : null}
            {count !== null ? <b className="l-hotbar-count">{count}</b> : null}
          </button>
        );
      })}
      <output className="l-hotbar-name" aria-live="polite" data-show={nameShown || undefined}>
        {(me && toolCount === 0 ? '' : hotbarName(hotbar.tool)) || '빈 칸'}
      </output>
    </div>
  );
}

/** 1–9 select hotbar slots (ignored while typing or inside a dialog). */
export function useHotbarKeys(hotbar: HotbarState, enabled: boolean, onUse?: (ref: string) => void) {
  const ref = useRef({ hotbar, onUse });
  useEffect(() => {
    ref.current = { hotbar, onUse };
  });
  useEffect(() => {
    if (!enabled) return;
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      // Slot keys follow 설정 → 조작 (1–9 by default).
      const i = hotbarIndexForCode(getSettings().keys, e.code);
      if (i < 0) return;
      if (document.querySelector('.l-coach') || !globalKeyTarget(e)) return;
      const { hotbar: h, onUse: runSlot } = ref.current;
      const slot = h.slots[i];
      if (h.selected === i && slot) runSlot?.(slot);
      h.setSelected(i);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [enabled]);
}
