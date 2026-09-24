'use client';

/* Static exported assets must remain plain images; this app does not use the Next image server. */
/* eslint-disable next/no-img-element */
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  FlipHorizontal2,
  Plus,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { AvatarView } from './avatar-view';
import { BEDROOM_ART } from './lounge-bedroom-art';
import {
  BEDROOM_LIMITS,
  ROOM_PROPS,
  ROOM_PROP_BY_ID,
  defaultBedroom,
  readBedroom,
  roomItemBounds,
  type Bedroom,
  type RoomCategory,
  type RoomItem,
  type RoomPropId,
} from './lounge-bedroom-data';
import type { LoungeSave } from './lounge-look';
import { ACTORS } from './theater-data';
import { Bedroom3D } from './lounge-bedroom-3d';
import './lounge-bedroom.css';

type CatalogFilter = 'all' | 'miku' | RoomCategory;
const CATEGORIES: readonly [CatalogFilter, string][] = [
  ['all', '전체'],
  ['miku', '미쿠 컬렉션'],
  ['furniture', '가구'],
  ['soft', '패브릭·인형'],
  ['music', '음악'],
  ['small', '작은 소품'],
  ['wall', '벽 장식'],
];
const WALLS: readonly [Bedroom['wall'], string, string][] = [
  ['cream', '크림', '#eee6d7'],
  ['sage', '세이지', '#b2bea7'],
  ['blush', '연분홍', '#dbb5b0'],
  ['blue', '하늘색', '#afc2d4'],
];
const FLOORS: readonly [Bedroom['floor'], string, string][] = [
  ['oak', '내추럴 오크', '#c5a375'],
  ['walnut', '짙은 월넛', '#84634e'],
  ['pale', '밝은 나무', '#eee0c8'],
];
type History = { past: Bedroom[]; future: Bedroom[] };
type Drag = {
  pointer: number;
  clientX: number;
  clientY: number;
  rect: DOMRect;
  item: RoomItem;
  target: HTMLButtonElement;
};
const roomKey = (room: Bedroom) => JSON.stringify(room);
function position(item: RoomItem): CSSProperties {
  const prop = ROOM_PROP_BY_ID[item.prop];
  return {
    left: `${item.x}%`,
    top: `${item.y}%`,
    width: `${prop.width * item.scale}%`,
    transform: `translate(-50%, ${prop.placement === 'wall' ? '-50%' : '-100%'})`,
  };
}
function moved(item: RoomItem, x: number, y: number): RoomItem {
  const bounds = roomItemBounds(item.prop);
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    ...item,
    x: round(Math.max(bounds.minX, Math.min(bounds.maxX, x))),
    y: round(Math.max(bounds.minY, Math.min(bounds.maxY, y))),
  };
}

function ResetBedroom({
  onClose,
  onReset,
}: {
  onClose: () => void;
  onReset: () => void;
}) {
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
      className="b-reset-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <h2 id={`${id}-title`}>새 스튜디오 배치를 적용할까요?</h2>
      <p id={`${id}-description`}>
        지금 배치를 새 가구와 소품 배치로 바꿔요. 적용 후 실행 취소로 돌아갈 수
        있어요. 입은 옷과 보관한 코디는 그대로예요.
      </p>
      <div>
        <button type="button" data-cancel onClick={onClose}>
          취소
        </button>
        <button type="button" className="b-primary" onClick={onReset}>
          새 디자인 적용
        </button>
      </div>
    </dialog>
  );
}

function BedroomDecorator({
  save,
  onChange,
  notice,
}: {
  save: LoungeSave;
  onChange: (save: LoungeSave) => void;
  notice: (message: string) => void;
}) {
  const room = save.bedroom ?? defaultBedroom(save.actor);
  const key = roomKey(room),
    editorId = useId();
  const [category, setCategory] = useState<CatalogFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<RoomItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const [history, setHistory] = useState<History>({ past: [], future: [] });
  const [resetOpen, setResetOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const editorRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef(save);
  useLayoutEffect(() => {
    saveRef.current = save;
  }, [save]);
  const imageRatios = useRef<Partial<Record<RoomPropId, number>>>({});
  const historyRef = useRef(history);
  const previewRef = useRef<RoomItem | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const scalingRef = useRef(false);
  const expected = useRef({ actor: save.actor, key });

  const setDraft = (item: RoomItem | null) => {
    previewRef.current = item;
    setPreview(item);
  };
  const setRoomHistory = (next: History) => {
    historyRef.current = next;
    setHistory(next);
  };
  const cancelInteraction = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    scalingRef.current = false;
    if (drag?.target.hasPointerCapture(drag.pointer))
      drag.target.releasePointerCapture(drag.pointer);
    setDragging(false);
    setDraft(null);
  };

  // An account switch or a server-side replacement starts a new local history.
  // Ordinary saves of our own edits leave the twenty-step undo stack intact.
  useEffect(() => {
    if (expected.current.actor !== save.actor || expected.current.key !== key) {
      cancelInteraction();
      setRoomHistory({ past: [], future: [] });
      setSelectedId(null);
      setResetOpen(false);
      expected.current = { actor: save.actor, key };
    }
  }, [save.actor, key]);

  const currentRoom = () =>
    saveRef.current.bedroom ?? defaultBedroom(saveRef.current.actor);
  const rememberSize = (propId: RoomPropId, image: HTMLImageElement) => {
    if (image.naturalWidth)
      imageRatios.current[propId] = image.naturalHeight / image.naturalWidth;
  };
  const fitItem = (item: RoomItem) => {
    const prop = ROOM_PROP_BY_ID[item.prop],
      bounds = roomItemBounds(item.prop);
    const width = prop.width * item.scale;
    // The scene is 3:2, so width-percent and height-percent use different units.
    const height = width * (imageRatios.current[item.prop] ?? 1) * 1.5;
    const minX = Math.max(bounds.minX, width / 2),
      maxX = Math.min(bounds.maxX, 100 - width / 2);
    const minY = Math.min(
      bounds.maxY,
      Math.max(bounds.minY, prop.placement === 'wall' ? height / 2 : height),
    );
    const maxY =
      prop.placement === 'wall'
        ? Math.max(minY, Math.min(bounds.maxY, 100 - height / 2))
        : bounds.maxY;
    return moved(
      item,
      Math.max(minX, Math.min(maxX, item.x)),
      Math.max(minY, Math.min(maxY, item.y)),
    );
  };
  const applyRoom = (next: Bedroom, message: string) => {
    const nextSave = { ...saveRef.current, bedroom: next };
    expected.current = { actor: nextSave.actor, key: roomKey(next) };
    saveRef.current = nextSave;
    onChange(nextSave);
    setAnnouncement(message);
    setDraft(null);
  };
  const commit = (value: Bedroom, message: string) => {
    const next = readBedroom(value, saveRef.current.actor),
      previous = currentRoom();
    if (roomKey(next) === roomKey(previous)) {
      setDraft(null);
      return;
    }
    setRoomHistory({
      past: [...historyRef.current.past, previous].slice(-20),
      future: [],
    });
    applyRoom(next, message);
  };
  const updateItem = (item: RoomItem, message: string) => {
    const current = currentRoom();
    if (!current.items.some((value) => value.id === item.id)) return;
    commit(
      {
        ...current,
        items: current.items.map((value) =>
          value.id === item.id ? item : value,
        ),
      },
      message,
    );
  };
  const clearSelection = () => {
    cancelInteraction();
    setSelectedId(null);
  };
  const undo = () => {
    const state = historyRef.current,
      previous = state.past.at(-1);
    if (!previous) return;
    cancelInteraction();
    setRoomHistory({
      past: state.past.slice(0, -1),
      future: [currentRoom(), ...state.future].slice(0, 20),
    });
    applyRoom(previous, '마지막 변경을 되돌렸어요.');
    if (!previous.items.some((item) => item.id === selectedId))
      setSelectedId(null);
  };
  const redo = () => {
    const state = historyRef.current,
      next = state.future[0];
    if (!next) return;
    cancelInteraction();
    setRoomHistory({
      past: [...state.past, currentRoom()].slice(-20),
      future: state.future.slice(1),
    });
    applyRoom(next, '변경을 다시 적용했어요.');
    if (!next.items.some((item) => item.id === selectedId)) setSelectedId(null);
  };
  const add = (propId: RoomPropId) => {
    const current = currentRoom(),
      prop = ROOM_PROP_BY_ID[propId];
    if (current.items.length >= BEDROOM_LIMITS.maxItems) {
      notice(
        `소품은 ${BEDROOM_LIMITS.maxItems}개까지 놓을 수 있어요. 하나를 치운 뒤 놓아 주세요.`,
      );
      return;
    }
    const offset =
      (current.items.filter((item) => item.prop === propId).length % 3) * 3;
    const item: RoomItem = fitItem({
      id: crypto.randomUUID(),
      prop: propId,
      x: 50 + offset,
      y:
        (prop.placement === 'wall' ? 27 : prop.placement === 'rug' ? 81 : 77) +
        offset,
      scale: 1,
      flip: false,
    });
    commit(
      { ...current, items: [...current.items, item] },
      `${prop.name}을 놓았어요. 위치를 옮겨 보세요.`,
    );
    setSelectedId(item.id);
    requestAnimationFrame(() =>
      document
        .getElementById(`${editorId}-${item.id}`)
        ?.focus({ preventScroll: true }),
    );
  };
  const selected =
    (preview?.id === selectedId
      ? preview
      : room.items.find((item) => item.id === selectedId)) ?? null;
  const selectedProp = selected ? ROOM_PROP_BY_ID[selected.prop] : null;
  const sameLayer = selected
    ? room.items.filter(
        (item) =>
          ROOM_PROP_BY_ID[item.prop].layer ===
          ROOM_PROP_BY_ID[selected.prop].layer,
      )
    : [];
  const layerIndex = sameLayer.findIndex((item) => item.id === selectedId);
  const shiftLayer = (direction: 1 | -1) => {
    if (!selected) return;
    const current = currentRoom(),
      items = [...current.items];
    const layer = ROOM_PROP_BY_ID[selected.prop].layer;
    const peers = items
      .map((item, index) =>
        ROOM_PROP_BY_ID[item.prop].layer === layer ? index : -1,
      )
      .filter((index) => index >= 0);
    const from = peers.findIndex((index) => items[index].id === selected.id),
      to = from + direction;
    if (from < 0 || to < 0 || to >= peers.length) return;
    [items[peers[from]], items[peers[to]]] = [
      items[peers[to]],
      items[peers[from]],
    ];
    commit(
      { ...current, items },
      direction === 1
        ? '소품을 한 단계 앞으로 옮겼어요.'
        : '소품을 한 단계 뒤로 옮겼어요.',
    );
  };
  const remove = (id: string) => {
    const current = currentRoom();
    commit(
      { ...current, items: current.items.filter((item) => item.id !== id) },
      '소품을 치웠어요. 목록에서 다시 놓을 수 있어요.',
    );
    setSelectedId(null);
    stageRef.current?.focus({ preventScroll: true });
  };
  const startDrag = (
    event: PointerEvent<HTMLButtonElement>,
    item: RoomItem,
  ) => {
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      dragRef.current ||
      !stageRef.current
    )
      return;
    event.preventDefault();
    setSelectedId(item.id);
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointer: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      rect: stageRef.current.getBoundingClientRect(),
      item,
      target: event.currentTarget,
    };
    setDraft(item);
    setDragging(true);
  };
  const dragMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointer) return;
    const next = fitItem(
      moved(
        drag.item,
        drag.item.x + ((event.clientX - drag.clientX) / drag.rect.width) * 100,
        drag.item.y + ((event.clientY - drag.clientY) / drag.rect.height) * 100,
      ),
    );
    setDraft(next);
  };
  const dragEnd = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointer) return;
    const item = previewRef.current ?? drag.item;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    updateItem(item, `${ROOM_PROP_BY_ID[item.prop].name} 위치를 바꿨어요.`);
    setDraft(null);
  };
  const finishScale = () => {
    const item = previewRef.current;
    scalingRef.current = false;
    if (item) updateItem(item, '소품 크기를 바꿨어요.');
    setDraft(null);
  };
  const visibleProps = ROOM_PROPS.filter(
    (prop) =>
      category === 'all' ||
      (category === 'miku'
        ? prop.id.startsWith('miku-') || prop.id === 'twin-tail-figure'
        : prop.category === category),
  );
  useEffect(() => {
    const editor = editorRef.current;
    const handleHistoryKey = (event: KeyboardEvent) => {
      if (resetOpen || !(event.ctrlKey || event.metaKey) || event.altKey)
        return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
    };
    editor?.addEventListener('keydown', handleHistoryKey);
    return () => editor?.removeEventListener('keydown', handleHistoryKey);
  });

  return (
    <section ref={editorRef} className="l-bedroom" aria-label="내 방 꾸미기">
      <header className="b-heading">
        <div>
          <span>BEOMDEW ATELIER / 나만의 컬렉션</span>
          <h1>{ACTORS[save.actor]}의 방</h1>
          <p>소품을 골라 옮기고, 좋아하는 것들로 나만의 공간을 완성해요.</p>
        </div>
        <button
          type="button"
          className="b-reset"
          onClick={() => {
            clearSelection();
            setResetOpen(true);
          }}
        >
          <RotateCcw size={15} />새 디자인 적용
        </button>
      </header>
      <div className="b-layout">
        <div className="b-workspace">
          <div className="b-room-frame">
            <div className="b-room-topbar">
              <span>
                <Check size={14} />
                변경하면 자동 저장돼요
              </span>
              <div className="b-history">
                <button
                  type="button"
                  aria-label="실행 취소"
                  title="실행 취소 (Ctrl+Z)"
                  disabled={!history.past.length || dragging}
                  onClick={undo}
                >
                  <Undo2 size={17} />
                </button>
                <button
                  type="button"
                  aria-label="다시 실행"
                  title="다시 실행 (Ctrl+Shift+Z)"
                  disabled={!history.future.length || dragging}
                  onClick={redo}
                >
                  <Redo2 size={17} />
                </button>
              </div>
            </div>
            <div
              ref={stageRef}
              className={'b-room-stage' + (dragging ? ' is-dragging' : '')}
              data-wall={room.wall}
              data-floor={room.floor}
              // Keyboard focus can return to this interactive canvas after clearing a prop.
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
              role="application"
              aria-label="내 방. 소품을 선택해 옮길 수 있어요."
              aria-describedby={`${editorId}-help`}
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) clearSelection();
              }}
            >
              <img
                className="b-room-background"
                src={BEDROOM_ART.background}
                alt=""
                draggable={false}
              />
              <div className="b-wall-tint" aria-hidden="true" />
              <div className="b-floor-tint" aria-hidden="true" />
              {room.items.map((savedItem, index) => {
                const item = preview?.id === savedItem.id ? preview : savedItem;
                const prop = ROOM_PROP_BY_ID[item.prop],
                  active = item.id === selectedId;
                return (
                  <button
                    type="button"
                    id={`${editorId}-${item.id}`}
                    key={item.id}
                    className={'b-room-item' + (active ? ' selected' : '')}
                    data-item-id={item.id}
                    data-prop={item.prop}
                    data-placement={prop.placement}
                    aria-label={`${prop.name} 선택`}
                    aria-pressed={active}
                    aria-describedby={active ? `${editorId}-help` : undefined}
                    style={{
                      ...position(item),
                      zIndex: 10 + prop.layer * 100 + index,
                    }}
                    onFocus={() => {
                      if (!dragRef.current) setSelectedId(item.id);
                    }}
                    onClick={() => setSelectedId(item.id)}
                    onPointerDown={(event) => startDrag(event, item)}
                    onPointerMove={dragMove}
                    onPointerUp={dragEnd}
                    onPointerCancel={cancelInteraction}
                    onLostPointerCapture={() => {
                      if (dragRef.current?.item.id === item.id)
                        cancelInteraction();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        clearSelection();
                        stageRef.current?.focus();
                        return;
                      }
                      if (event.key === 'Delete' || event.key === 'Backspace') {
                        event.preventDefault();
                        remove(item.id);
                        return;
                      }
                      const offsets: Record<string, [number, number]> = {
                        ArrowLeft: [-1, 0],
                        ArrowRight: [1, 0],
                        ArrowUp: [0, -1],
                        ArrowDown: [0, 1],
                      };
                      const offset = offsets[event.key];
                      if (
                        !offset ||
                        event.ctrlKey ||
                        event.metaKey ||
                        event.altKey
                      )
                        return;
                      event.preventDefault();
                      const step = event.shiftKey ? 10 : 1;
                      updateItem(
                        fitItem(
                          moved(
                            item,
                            item.x + offset[0] * step,
                            item.y + offset[1] * step,
                          ),
                        ),
                        `${prop.name} 위치를 바꿨어요.`,
                      );
                    }}
                  >
                    <img
                      src={BEDROOM_ART.props[item.prop]}
                      alt=""
                      draggable={false}
                      onLoad={(event) =>
                        rememberSize(item.prop, event.currentTarget)
                      }
                      style={{
                        transform: item.flip ? 'scaleX(-1)' : undefined,
                      }}
                    />
                    {active && (
                      <span className="b-item-handle" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
              <div className="b-room-avatar" data-actor={save.actor}>
                <span className="b-avatar-shadow" />
                <AvatarView actor={save.actor} look={save.looks[save.actor]} />
                <span className="b-avatar-name">{ACTORS[save.actor]}</span>
              </div>
            </div>
            <p id={`${editorId}-help`} className="b-room-help">
              소품을 끌어 옮겨요 · 방향키로 조금씩, Shift와 함께 크게 · 빈 곳을
              눌러 선택 해제
            </p>
          </div>
          <div
            className={'b-selection-tools' + (selected ? ' has-selection' : '')}
            aria-label="선택한 소품 조절"
          >
            {selected && selectedProp ? (
              <>
                <div className="b-selection-title">
                  <strong>{selectedProp.name}</strong>
                  <button
                    type="button"
                    aria-label="선택 해제"
                    onClick={clearSelection}
                  >
                    <X size={17} />
                  </button>
                </div>
                <label className="b-scale">
                  <span>
                    크기 <output>{Math.round(selected.scale * 100)}%</output>
                  </span>
                  <input
                    type="range"
                    aria-label="소품 크기"
                    min={BEDROOM_LIMITS.minScale}
                    max={BEDROOM_LIMITS.maxScale}
                    step="0.05"
                    value={selected.scale}
                    disabled={dragging}
                    onPointerDown={(event) => {
                      scalingRef.current = true;
                      event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onChange={(event) => {
                      const item = fitItem({
                        ...selected,
                        scale: Number(event.currentTarget.value),
                      });
                      if (scalingRef.current) setDraft(item);
                      else updateItem(item, '소품 크기를 바꿨어요.');
                    }}
                    onPointerUp={finishScale}
                    onPointerCancel={() => {
                      scalingRef.current = false;
                      setDraft(null);
                    }}
                    onBlur={finishScale}
                  />
                </label>
                <div className="b-item-actions">
                  <button
                    type="button"
                    aria-label="좌우 뒤집기"
                    aria-pressed={selected.flip}
                    disabled={dragging}
                    onClick={() =>
                      updateItem(
                        { ...selected, flip: !selected.flip },
                        '소품 방향을 바꿨어요.',
                      )
                    }
                  >
                    <FlipHorizontal2 size={16} />
                    뒤집기
                  </button>
                  <button
                    type="button"
                    aria-label="뒤로"
                    disabled={dragging || layerIndex <= 0}
                    onClick={() => shiftLayer(-1)}
                  >
                    <ArrowDown size={16} />
                    뒤로
                  </button>
                  <button
                    type="button"
                    aria-label="앞으로"
                    disabled={dragging || layerIndex >= sameLayer.length - 1}
                    onClick={() => shiftLayer(1)}
                  >
                    <ArrowUp size={16} />
                    앞으로
                  </button>
                  <button
                    type="button"
                    className="b-remove"
                    aria-label="소품 치우기"
                    disabled={dragging}
                    onClick={() => remove(selected.id)}
                  >
                    <Trash2 size={16} />
                    치우기
                  </button>
                </div>
              </>
            ) : (
              <p>방 안의 소품을 선택하면 크기와 방향을 바꿀 수 있어요.</p>
            )}
          </div>
          <div className="b-finishes" aria-label="방 색상">
            <fieldset>
              <legend>벽색</legend>
              <div>
                {WALLS.map(([id, name, color]) => (
                  <button
                    type="button"
                    key={id}
                    aria-label={`벽색 ${name}`}
                    aria-pressed={room.wall === id}
                    disabled={dragging}
                    onClick={() =>
                      commit(
                        { ...currentRoom(), wall: id },
                        `벽색을 ${name}으로 바꿨어요.`,
                      )
                    }
                  >
                    <i style={{ background: color }}>
                      {room.wall === id && <Check size={14} />}
                    </i>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>바닥</legend>
              <div>
                {FLOORS.map(([id, name, color]) => (
                  <button
                    type="button"
                    key={id}
                    aria-label={`바닥 ${name}`}
                    aria-pressed={room.floor === id}
                    disabled={dragging}
                    onClick={() =>
                      commit(
                        { ...currentRoom(), floor: id },
                        `바닥을 ${name}로 바꿨어요.`,
                      )
                    }
                  >
                    <i style={{ background: color }}>
                      {room.floor === id && <Check size={14} />}
                    </i>
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
        <aside className="b-catalog-panel" aria-label="방 소품 목록">
          <header>
            <div>
              <h2>방에 놓을 것들</h2>
              <p>소품 {ROOM_PROPS.length}종 · 모두 자유롭게</p>
            </div>
            <span
              aria-label={`배치한 소품 ${room.items.length}개, 최대 ${BEDROOM_LIMITS.maxItems}개`}
            >
              {room.items.length}
              <small>/{BEDROOM_LIMITS.maxItems}</small>
            </span>
          </header>
          <div className="b-categories" aria-label="소품 종류">
            {CATEGORIES.map(([id, name]) => (
              <button
                type="button"
                key={id}
                aria-pressed={category === id}
                onClick={() => setCategory(id)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="b-prop-catalog">
            {visibleProps.map((prop) => (
              <button
                type="button"
                key={prop.id}
                aria-label={`${prop.name} 놓기`}
                disabled={
                  dragging || room.items.length >= BEDROOM_LIMITS.maxItems
                }
                onClick={() => add(prop.id)}
              >
                <span className="b-prop-art">
                  <img
                    src={BEDROOM_ART.props[prop.id]}
                    alt=""
                    loading="lazy"
                    draggable={false}
                    onLoad={(event) =>
                      rememberSize(prop.id, event.currentTarget)
                    }
                  />
                </span>
                <span className="b-prop-name">
                  {prop.name}
                  <Plus size={15} aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
          {room.items.length >= BEDROOM_LIMITS.maxItems && (
            <output className="b-limit">
              방이 가득 찼어요. 소품을 하나 치우면 더 놓을 수 있어요.
            </output>
          )}
        </aside>
      </div>
      <output className="b-sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </output>
      {resetOpen && (
        <ResetBedroom
          onClose={() => setResetOpen(false)}
          onReset={() => {
            commit(
              defaultBedroom(saveRef.current.actor),
              '새 스튜디오 배치를 적용했어요. 실행 취소로 돌아갈 수 있어요.',
            );
            setSelectedId(null);
            setResetOpen(false);
            notice('새 스튜디오 배치를 적용했어요.');
          }}
        />
      )}
    </section>
  );
}

export function BedroomEditor(props: {
  save: LoungeSave;
  onChange: (save: LoungeSave) => void;
  notice: (message: string) => void;
}) {
  const [view, setView] = useState<'walk' | 'decorate'>('walk');
  return (
    <div className="b-bedroom-experience">
      <nav className="b-bedroom-mode" aria-label="내 방 보기">
        <button
          type="button"
          aria-pressed={view === 'walk'}
          onClick={() => setView('walk')}
        >
          방 산책
        </button>
        <button
          type="button"
          aria-pressed={view === 'decorate'}
          onClick={() => setView('decorate')}
        >
          내 방 꾸미기
        </button>
      </nav>
      {view === 'walk' ? (
        <Bedroom3D
          key={props.save.actor}
          save={props.save}
          onDecorate={() => setView('decorate')}
        />
      ) : (
        <BedroomDecorator {...props} />
      )}
    </div>
  );
}
