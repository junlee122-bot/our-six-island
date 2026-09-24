'use client';
/* Catalog images are local static files or inline SVG; no Next image server. */
/* eslint-disable next/no-img-element */
import { useEffect, useId, useRef, useState } from 'react';
import {
  Check,
  Copy,
  FlipHorizontal2,
  Lock,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Trash2,
  Undo2,
  Users,
  X,
} from 'lucide-react';
import {
  BEDROOM_LIMITS,
  FLOOR_KINDS,
  ROOM_CATALOG,
  WALL_COLORS,
  catalogEntry,
  type Bedroom,
  type RoomAccess,
  type RoomCategory,
  type RoomItem,
} from './lounge-bedroom-data';
import { BEDROOM_THEMES } from './lounge-bedroom-themes';
import { THUMBNAILS } from './lounge-bedroom-art';
import { BEDROOM_FLOOR_COLOR, BEDROOM_WALL_COLOR } from './lounge-bedroom-scene';
import { scaleRange } from './lounge-bedroom-edit';
import { josa, particle } from './lounge-text';

export const CATEGORY_NAMES: readonly [RoomCategory | 'all', string][] = [
  ['all', '전체'],
  ['furniture', '가구'],
  ['miku', '미쿠 테마'],
  ['soft', '패브릭·인형'],
  ['plant', '식물'],
  ['music', '음악'],
  ['small', '작은 소품'],
  ['wall', '벽 장식'],
  ['rare', '희귀 소품'],
];
export const WALL_NAMES: Record<Bedroom['wall'], string> = {
  cream: '크림',
  sage: '세이지',
  blush: '연분홍',
  blue: '하늘색',
  mint: '민트',
  dusk: '밤보라',
};
export const FLOOR_NAMES: Record<Bedroom['floor'], string> = {
  oak: '내추럴 오크',
  walnut: '짙은 월넛',
  pale: '밝은 나무',
  ash: '회색 애쉬',
};
export const ACCESS_NAMES: Record<RoomAccess, [string, string]> = {
  public: ['활짝 열기', '누구나 편하게 놀러 와요. 친구 목록에 “놀러 오세요”가 떠요.'],
  friends: ['친구만', '일곱 친구 모두 놀러 올 수 있어요.'],
  closed: ['닫기', '지금은 아무도 들어올 수 없어요.'],
};

export function EditCatalog({
  room,
  unlocks,
  onAdd,
  onClose,
}: {
  room: Bedroom;
  unlocks: readonly string[];
  onAdd: (ref: string) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<RoomCategory | 'all'>('all');
  const owned = ROOM_CATALOG.filter((e) => !e.unlock || unlocks.includes(e.unlock));
  const visible = owned.filter((e) => category === 'all' || e.category === category);
  const full = room.items.length >= BEDROOM_LIMITS.maxItems;
  return (
    <section className="b3-catalog" aria-label="방에 놓을 것들" data-testid="room-catalog">
      <header>
        <div>
          <h2>방에 놓을 것들</h2>
          <p>
            고르면 내 앞에 놓여요 · {room.items.length}/{BEDROOM_LIMITS.maxItems}
          </p>
        </div>
        <button type="button" className="b3-icon-button" aria-label="목록 닫기" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <fieldset className="b3-categories" aria-label="소품 종류">
        {CATEGORY_NAMES.map(([id, name]) => (
          <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}>
            {name}
          </button>
        ))}
      </fieldset>
      <div className="b3-catalog-grid">
        {visible.map((entry) => (
          <button
            key={entry.ref}
            type="button"
            disabled={full}
            aria-label={`${entry.name} 놓기`}
            data-ref={entry.ref}
            data-kind={entry.kind}
            onClick={() => onAdd(entry.ref)}
          >
            <span className="b3-thumb">
              <img src={THUMBNAILS[entry.ref]} alt="" loading="lazy" draggable={false} />
              {entry.kind === 'model' && <em>3D</em>}
            </span>
            <span className="b3-thumb-name">
              {entry.name}
              <Plus size={14} aria-hidden="true" />
            </span>
          </button>
        ))}
        {category === 'rare' && !visible.length && (
          <p className="b3-empty-note">
            아직 희귀 소품이 없어요. 마을 광장 옆 범타듀 상점에서 트로피와 과일 바구니를 살 수 있어요.
          </p>
        )}
      </div>
      {full && <output className="b3-limit">방이 가득 찼어요. 하나를 치우면 더 놓을 수 있어요.</output>}
    </section>
  );
}

export function EditToolbar({
  item,
  conflict,
  busy,
  onRotate,
  onRotation,
  onRotationEnd,
  onScale,
  onScaleEnd,
  onDuplicate,
  onDelete,
  onDeselect,
}: {
  item: RoomItem;
  conflict: string | null;
  busy: boolean;
  onRotate: (degrees: number) => void;
  onRotation: (degrees: number) => void;
  onRotationEnd: () => void;
  onScale: (scale: number) => void;
  onScaleEnd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDeselect: () => void;
}) {
  const entry = catalogEntry(item.ref)!;
  const range = scaleRange(item.ref);
  const card = entry.kind === 'prop' && entry.mount !== 'rug';
  const wall = entry.mount === 'wall';
  return (
    <section className="b3-toolbar" aria-label="고른 소품 조절" data-testid="room-toolbar">
      <div className="b3-toolbar-title">
        <strong>{entry.name}</strong>
        {conflict ? (
          <output className="b3-conflict">{conflict}</output>
        ) : (
          <span className="b3-ok">
            <Check size={13} /> {wall ? '벽에 딱 붙었어요' : '끌어서 옮겨요'}
          </span>
        )}
        <button type="button" className="b3-icon-button" aria-label="선택 해제" onClick={onDeselect}>
          <X size={18} />
        </button>
      </div>
      <div className="b3-toolbar-row">
        {!wall &&
          (card ? (
            <button type="button" disabled={busy} onClick={() => onRotate(180)} data-testid="room-flip">
              <FlipHorizontal2 size={18} /> 뒤집기
            </button>
          ) : (
            <>
              <button type="button" disabled={busy} aria-label="왼쪽으로 90도 돌리기" onClick={() => onRotate(-90)} data-testid="room-rotate-left">
                <RotateCcw size={18} /> 90°
              </button>
              <button type="button" disabled={busy} aria-label="오른쪽으로 90도 돌리기" onClick={() => onRotate(90)} data-testid="room-rotate">
                <RotateCw size={18} /> 90°
              </button>
            </>
          ))}
        <button type="button" disabled={busy} onClick={onDuplicate}>
          <Copy size={18} /> 하나 더
        </button>
        <button type="button" className="b3-danger" disabled={busy} onClick={onDelete} data-testid="room-delete">
          <Trash2 size={18} /> 치우기
        </button>
      </div>
      <div className="b3-sliders">
        {!wall && !card && (
          <label>
            <span>
              방향 <output>{Math.round(item.rotY)}°</output>
            </span>
            <input
              type="range"
              min={0}
              max={355}
              step={5}
              value={Math.round(item.rotY / 5) * 5 % 360}
              aria-label="방향 자유 회전"
              onChange={(e) => onRotation(Number(e.currentTarget.value))}
              onPointerUp={onRotationEnd}
              onKeyUp={onRotationEnd}
              onBlur={onRotationEnd}
            />
          </label>
        )}
        <label>
          <span>
            크기 <output>{Math.round(item.scale * 100)}%</output>
          </span>
          <input
            type="range"
            min={range.min}
            max={range.max}
            step={0.05}
            value={item.scale}
            aria-label="크기"
            onChange={(e) => onScale(Number(e.currentTarget.value))}
            onPointerUp={onScaleEnd}
            onKeyUp={onScaleEnd}
            onBlur={onScaleEnd}
          />
        </label>
      </div>
    </section>
  );
}

export function EditBar({
  canUndo,
  canRedo,
  conflicts,
  onUndo,
  onRedo,
  onCatalog,
  onSettings,
  onDone,
}: {
  canUndo: boolean;
  canRedo: boolean;
  conflicts: number;
  onUndo: () => void;
  onRedo: () => void;
  onCatalog: () => void;
  onSettings: () => void;
  onDone: () => void;
}) {
  return (
    <div className="b3-editbar" role="toolbar" aria-label="꾸미기 도구">
      <button type="button" className="b3-primary" onClick={onCatalog} data-testid="room-add">
        <Plus size={18} /> 놓기
      </button>
      <button type="button" aria-label="실행 취소" title="실행 취소 (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} data-testid="room-undo">
        <Undo2 size={18} />
      </button>
      <button type="button" aria-label="다시 실행" title="다시 실행 (Ctrl+Shift+Z)" disabled={!canRedo} onClick={onRedo} data-testid="room-redo">
        <Redo2 size={18} />
      </button>
      <button type="button" onClick={onSettings} data-testid="room-settings">
        벽·바닥
      </button>
      {conflicts > 0 && (
        <output className="b3-conflict-count">겹친 곳 {conflicts}</output>
      )}
      <button type="button" className="b3-done" onClick={onDone} data-testid="room-done">
        <Check size={18} /> 다 됐어요
      </button>
    </div>
  );
}

export function RoomSettings({
  room,
  onChange,
  onReset,
  onClose,
}: {
  room: Bedroom;
  onChange: (next: Bedroom, message: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <section className="b3-settings" aria-label="방 설정" data-testid="room-settings-panel">
      <header>
        <h2>방 설정</h2>
        <button type="button" className="b3-icon-button" aria-label="방 설정 닫기" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <fieldset>
        <legend>벽</legend>
        <div className="b3-swatches">
          {WALL_COLORS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={room.wall === id}
              onClick={() => onChange({ ...room, wall: id }, `벽을 ${josa(WALL_NAMES[id], '으로/로')} 바꿨어요.`)}
            >
              <i style={{ background: BEDROOM_WALL_COLOR[id] }}>{room.wall === id && <Check size={14} />}</i>
              {WALL_NAMES[id]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>바닥</legend>
        <div className="b3-swatches">
          {FLOOR_KINDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={room.floor === id}
              onClick={() => onChange({ ...room, floor: id }, `바닥을 ${josa(FLOOR_NAMES[id], '으로/로')} 바꿨어요.`)}
            >
              <i style={{ background: BEDROOM_FLOOR_COLOR[id] }}>{room.floor === id && <Check size={14} />}</i>
              {FLOOR_NAMES[id]}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>방 이름표</legend>
        <select
          value={room.theme}
          aria-label="방 테마"
          onChange={(e) => {
            const theme = BEDROOM_THEMES.find((t) => t.id === e.currentTarget.value);
            if (theme) onChange({ ...room, theme: theme.id }, `방 이름표를 ‘${theme.title}’${particle(theme.title, '으로/로')} 바꿨어요.`);
          }}
        >
          {BEDROOM_THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </fieldset>
      <fieldset>
        <legend>
          <Users size={14} /> 방문
        </legend>
        <div className="b3-access">
          {(Object.keys(ACCESS_NAMES) as RoomAccess[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={(room.access ?? 'friends') === id}
              data-testid={'room-access-' + id}
              onClick={() => onChange({ ...room, access: id }, `방문 설정을 ‘${ACCESS_NAMES[id][0]}’${particle(ACCESS_NAMES[id][0], '으로/로')} 바꿨어요.`)}
            >
              {id === 'closed' && <Lock size={13} />}
              <strong>{ACCESS_NAMES[id][0]}</strong>
              <small>{ACCESS_NAMES[id][1]}</small>
            </button>
          ))}
        </div>
      </fieldset>
      <button type="button" className="b3-reset" onClick={onReset}>
        <RotateCcw size={15} /> 처음 배치로 되돌리기
      </button>
    </section>
  );
}

export function ResetRoomDialog({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('[data-cancel]')?.focus();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="b3-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 id={`${id}-title`}>처음 배치로 되돌릴까요?</h2>
      <p id={`${id}-description`}>
        지금 방을 처음 받은 배치로 바꿔요. 되돌린 뒤에도 실행 취소로 돌아갈 수 있어요.
      </p>
      <div>
        <button type="button" data-cancel onClick={onClose}>
          취소
        </button>
        <button type="button" className="b3-primary" onClick={onReset}>
          되돌리기
        </button>
      </div>
    </dialog>
  );
}
