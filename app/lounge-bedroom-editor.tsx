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
  RotateCcw,
  RotateCw,
  Trash2,
  Users,
  X,
} from './ui/icons';
import { GameButton } from './ui/GameButton';
import {
  BEDROOM_LIMITS,
  FLOOR_KINDS,
  ROOM_CATALOG,
  STYLE_UNLOCK,
  WALL_COLORS,
  catalogEntry,
  type Bedroom,
  type RoomAccess,
  type RoomCategory,
  type RoomItem,
} from './lounge-bedroom-data';
import { BEDROOM_THEMES } from './lounge-bedroom-themes';
import { THUMBNAILS } from './lounge-bedroom-art';
import { BEDROOM_FLOOR_COLOR, BEDROOM_WALL_COLOR } from './lounge-bedroom-styles';
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
export { WALL_NAMES, FLOOR_NAMES } from './lounge-bedroom-styles';
import { WALL_NAMES, FLOOR_NAMES } from './lounge-bedroom-styles';
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
  const [category, setCategory] = useState<RoomCategory | 'all' | 'premium'>('all');
  // 새 방: only what I own (bought at 나무결 가구점, crafted or given) and my free bed.
  const owned = ROOM_CATALOG.filter((e) => !e.unlock || unlocks.includes(e.unlock));
  const visible = owned.filter((e) =>
    category === 'all' ? true : category === 'premium' ? !!e.premium : e.category === category,
  );
  // Premium furniture: only as many copies as I own (one unlock entry per copy).
  const copiesLeft = (ref: string) =>
    unlocks.filter((u) => u === ref).length - room.items.filter((i) => i.ref === ref).length;
  const hasPremium = owned.some((e) => e.premium);
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
        {hasPremium && (
          <button type="button" aria-pressed={category === 'premium'} onClick={() => setCategory('premium')} data-testid="catalog-premium">
            내 가구
          </button>
        )}
      </fieldset>
      <div className="b3-catalog-grid">
        {visible.map((entry) => {
          const left = entry.premium ? copiesLeft(entry.ref) : null;
          return (
            <button
              key={entry.ref}
              type="button"
              disabled={full || (left !== null && left <= 0)}
              aria-label={`${entry.name} 놓기${left !== null ? ` · ${left > 0 ? `${left}개 남음` : '모두 놓았어요'}` : ''}`}
              data-ref={entry.ref}
              data-kind={entry.kind}
              data-left={left ?? undefined}
              onClick={() => onAdd(entry.ref)}
            >
              <span className="b3-thumb">
                <img src={THUMBNAILS[entry.ref]} alt="" loading="lazy" draggable={false} />
                {entry.kind === 'model' && <em>3D</em>}
                {left !== null && <em className="b3-copies">{left > 0 ? `${left}개` : '다 놓음'}</em>}
              </span>
              <span className="b3-thumb-name">
                {entry.name}
                <Plus size={14} aria-hidden="true" />
              </span>
            </button>
          );
        })}
        {category === 'premium' && (
          <p className="b3-empty-note">
            나무결 가구점에서 산 가구와 공방에서 만든 가구예요. 가진 개수만큼 놓을 수 있어요.
          </p>
        )}
        {!visible.length && category !== 'rare' && (
          <p className="b3-empty-note" data-testid="catalog-empty">
            아직 놓을 가구가 없어요. 나무결 가구점에서 가구를 사면 여기에 나와요.
          </p>
        )}
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
      <GameButton variant="primary" glyph="plus" onClick={onCatalog} data-testid="room-add">
        놓기
      </GameButton>
      <GameButton glyph="undo" iconOnly title="실행 취소 (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} data-testid="room-undo">
        실행 취소
      </GameButton>
      <GameButton glyph="redo" iconOnly title="다시 실행 (Ctrl+Shift+Z)" disabled={!canRedo} onClick={onRedo} data-testid="room-redo">
        다시 실행
      </GameButton>
      <GameButton onClick={onSettings} data-testid="room-settings">
        벽·바닥
      </GameButton>
      {conflicts > 0 && (
        <output className="b3-conflict-count">겹친 곳 {conflicts}</output>
      )}
      <GameButton
        variant="primary"
        className="b3-done"
        glyph="check"
        keyLabel="Esc"
        aria-keyshortcuts="Escape"
        onClick={onDone}
        data-testid="room-done"
      >
        다 됐어요
      </GameButton>
    </div>
  );
}

/** A style is usable when unlocked (house tier or bought model-house style) or already in the room. */
const styleOpen = (id: string, current: string, unlocks: readonly string[]) =>
  !Object.hasOwn(STYLE_UNLOCK, id) || unlocks.includes(STYLE_UNLOCK[id]) || id === current;
const styleWhere = (id: string) => {
  const need = STYLE_UNLOCK[id] ?? '';
  return need.startsWith('house-')
    ? `범마을 부동산 집 확장 ${need.replace('house-', '')}단계에서 열려요`
    : '범마을 부동산 모델하우스에서 살 수 있어요';
};

export function RoomSettings({
  room,
  unlocks = [],
  onChange,
  onReset,
  onClose,
}: {
  room: Bedroom;
  unlocks?: readonly string[];
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
              disabled={!styleOpen(id, room.wall, unlocks)}
              title={styleOpen(id, room.wall, unlocks) ? undefined : styleWhere(id)}
              data-locked={styleOpen(id, room.wall, unlocks) ? undefined : true}
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
              disabled={!styleOpen(id, room.floor, unlocks)}
              title={styleOpen(id, room.floor, unlocks) ? undefined : styleWhere(id)}
              data-locked={styleOpen(id, room.floor, unlocks) ? undefined : true}
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
        <RotateCcw size={15} /> 가구 모두 치우기
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
      <h2 id={`${id}-title`}>가구를 모두 치울까요?</h2>
      <p id={`${id}-description`}>
        침대 하나만 남기고 가구를 모두 치워요. 치운 가구는 없어지지 않고 “방에 놓을 것들”로 돌아가요. 실행 취소로 되돌릴 수도 있어요.
      </p>
      <div>
        <button type="button" data-cancel onClick={onClose}>
          취소
        </button>
        <button type="button" className="b3-primary" onClick={onReset}>
          치우기
        </button>
      </div>
    </dialog>
  );
}
