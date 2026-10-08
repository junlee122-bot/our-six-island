'use client';
// 내 취향 (lounge-friend-tastes.ts): pick up to 3 좋아하는 것 and 2 싫어하는 것
// — whole categories or single items from a searchable catalog — and a short
// note. Friends see it on my card and in their gift picker. One change per
// KST day; the window says when the next one opens.
import { useMemo, useState } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { ItemCategory } from '../lounge-calendar';
import { itemName } from '../lounge-life-plus';
import {
  TASTE_CATEGORIES,
  TASTE_DISLIKES_MAX,
  TASTE_LIKES_MAX,
  TASTE_NOTE_MAX,
  catalogByCategory,
  categoryPick,
  matchesQuery,
  pickCategory,
  pickName,
  tasteCategoryName,
  type TastePick,
  type TasteView,
} from '../lounge-friend-tastes';
import { Glyph, type GlyphName } from '../ui/Glyph';
import { GameButton } from '../ui/GameButton';
import { Tabs, tabPanelProps } from '../ui/Tabs';
import { Modal } from './Modal';
import { ItemIcon } from './ItemIcon';
import type { Notify } from './Toast';
import { useLifeAction } from './LifePanels';
import './friend-tastes.css';

export const CATEGORY_GLYPH: Record<ItemCategory, GlyphName> = {
  crop: 'wheat',
  fruit: 'apple',
  fish: 'fish',
  bug: 'bug',
  forage: 'mushroom',
  flower: 'flower',
  material: 'log',
  dish: 'chef',
};

/** A pick's picture: the item's own icon, or the category glyph on a plate. */
export function PickIcon({ pick, size = 32 }: { pick: TastePick; size?: number }) {
  const cat = pickCategory(pick);
  if (cat)
    return (
      <span className="l-taste-cat" style={{ width: size, height: size }} aria-hidden="true">
        <Glyph name={CATEGORY_GLYPH[cat]} size={Math.round(size * 0.66)} />
      </span>
    );
  return <ItemIcon id={pick} size={size} />;
}

/** "도원은 아직 안 정했어요" or the friend's picks as small chips (friend card, gift picker). */
export function TasteSummary({ tastes, compact = false }: { tastes: TasteView; compact?: boolean }) {
  const chips = (list: TastePick[], tone: 'like' | 'dislike') =>
    list.length ? (
      <ul className="l-taste-chips" data-tone={tone}>
        {list.map((p) => (
          <li key={p}>
            <PickIcon pick={p} size={compact ? 22 : 26} />
            <span>{pickName(p, itemName)}</span>
          </li>
        ))}
      </ul>
    ) : (
      <span className="l-taste-none">없어요</span>
    );
  return (
    <div className="l-taste-summary" data-testid="taste-summary">
      {!tastes.set && <p className="l-taste-unset">아직 안 정했어요 · 지금은 임시 취향으로 쳐요</p>}
      <dl>
        <dt>
          <Glyph name="heart" size={16} /> 좋아하는 것
        </dt>
        <dd>{chips(tastes.l, 'like')}</dd>
        <dt>
          <Glyph name="close" size={16} /> 싫어하는 것
        </dt>
        <dd>{chips(tastes.d, 'dislike')}</dd>
      </dl>
      {tastes.n && <p className="l-taste-note">“{tastes.n}”</p>}
    </div>
  );
}

type Slot = 'like' | 'dislike';
const NEXT_TEXT = (at: number) => {
  const d = new Date(at + 9 * 3_600_000);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 0시`;
};

export function TastesWindow({
  room,
  view,
  notify,
  selfActor,
  onClose,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  selfActor: number;
  onClose: () => void;
}) {
  const life = view.life;
  const saved = life?.tastes?.all[selfActor];
  const nextAt = life?.tastes?.nextAt ?? 0;
  const locked = nextAt > (life?.serverNow ?? 0);
  const [likes, setLikes] = useState<TastePick[]>(() => (saved?.set ? saved.l : []));
  const [dislikes, setDislikes] = useState<TastePick[]>(() => (saved?.set ? saved.d : []));
  const [note, setNote] = useState(saved?.n ?? '');
  const [slot, setSlot] = useState<Slot>('like');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<ItemCategory | 'all'>('all');
  const [run, busy] = useLifeAction(room, notify);
  const catalog = useMemo(() => catalogByCategory(), []);

  if (!life)
    return (
      <Modal title="내 취향" onClose={onClose}>
        <p className="l-help-text">마을에 연결되면 취향을 정할 수 있어요.</p>
      </Modal>
    );

  const max = slot === 'like' ? TASTE_LIKES_MAX : TASTE_DISLIKES_MAX;
  const mine = slot === 'like' ? likes : dislikes;
  const toggle = (p: TastePick) => {
    if (locked) return;
    const setMine = slot === 'like' ? setLikes : setDislikes;
    const setOther = slot === 'like' ? setDislikes : setLikes;
    if (mine.includes(p)) {
      setMine(mine.filter((x) => x !== p));
      return;
    }
    if (mine.length >= max) {
      notify(`${slot === 'like' ? '좋아하는 것' : '싫어하는 것'}은 ${max}개까지예요. 하나를 빼고 골라 주세요.`, 'info');
      return;
    }
    setOther((o) => o.filter((x) => x !== p));
    setMine([...mine, p]);
  };
  const changed =
    !saved?.set ||
    saved.l.join() !== likes.join() ||
    saved.d.join() !== dislikes.join() ||
    (saved.n ?? '') !== note.trim().replace(/\s+/g, ' ');
  const save = () =>
    void run(
      { kind: 'setTastes', likes, dislikes, ...(note.trim() ? { note: note.trim() } : {}) },
      '내 취향을 정했어요. 친구들이 선물 고를 때 볼 수 있어요.',
      'mail',
    );
  const cats = cat === 'all' ? TASTE_CATEGORIES : [cat];
  const reason = locked
    ? `${NEXT_TEXT(nextAt)}부터 다시 바꿀 수 있어요`
    : !likes.length
      ? '좋아하는 것을 하나 이상 골라 주세요'
      : !changed
        ? '바뀐 게 없어요'
        : undefined;

  const slots = (list: TastePick[], n: number, which: Slot) => (
    <ol className="l-taste-slots" data-tone={which} aria-label={which === 'like' ? '좋아하는 것' : '싫어하는 것'}>
      {Array.from({ length: n }, (_, i) => {
        const p = list[i];
        return (
          <li key={i} data-empty={!p || undefined}>
            {p ? (
              <>
                <PickIcon pick={p} size={34} />
                <span className="l-taste-slot-name">{pickName(p, itemName)}</span>
                {!locked && (
                  <button
                    type="button"
                    className="l-icon l-taste-remove"
                    aria-label={`${pickName(p, itemName)} 빼기`}
                    onClick={() => (which === 'like' ? setLikes : setDislikes)(list.filter((x) => x !== p))}
                  >
                    <Glyph name="close" size={16} />
                  </button>
                )}
              </>
            ) : (
              <span className="l-taste-slot-name">빈 칸</span>
            )}
          </li>
        );
      })}
    </ol>
  );

  const markOf = (p: TastePick) => (likes.includes(p) ? 'like' : dislikes.includes(p) ? 'dislike' : undefined);
  const groups = cats
    .map((c) => ({ c, ids: catalog[c].filter((id) => matchesQuery(itemName(id), query)) }))
    .filter((g) => g.ids.length || matchesQuery(tasteCategoryName(g.c), query));

  return (
    <Modal title="내 취향" onClose={onClose} className="l-life-modal l-tastes" wide>
      <p className="l-modal-intro">
        친구들이 선물 고를 때 내 취향을 봐요. 고른 물건은 추억이 두 배, 좋아하는 종류도 두 배, 싫어하는 건 조금만 쌓여요.
      </p>
      <div className="l-tastes-body" data-testid="tastes-window">
        <section className="l-tastes-mine" aria-label="내가 고른 것">
          <h3>
            <Glyph name="heart" size={18} /> 좋아하는 것 <small>{likes.length}/{TASTE_LIKES_MAX}</small>
          </h3>
          {slots(likes, TASTE_LIKES_MAX, 'like')}
          <h3>
            <Glyph name="close" size={18} /> 싫어하는 것 <small>{dislikes.length}/{TASTE_DISLIKES_MAX}</small>
          </h3>
          {slots(dislikes, TASTE_DISLIKES_MAX, 'dislike')}
          <label className="l-taste-note-field">
            <span>한마디 (선택)</span>
            <input
              value={note}
              maxLength={TASTE_NOTE_MAX}
              placeholder="예: 달달한 건 뭐든 좋아요"
              disabled={locked}
              onChange={(e) => setNote(e.target.value)}
              data-testid="tastes-note"
            />
          </label>
          <p className="l-taste-next" data-testid="tastes-next">
            <Glyph name="calendar" size={16} />{' '}
            {locked ? `오늘 바꿨어요. ${NEXT_TEXT(nextAt)}부터 다시 바꿀 수 있어요.` : '하루에 한 번 바꿀 수 있어요. 지금 바꿀 수 있어요.'}
          </p>
          <GameButton variant="primary" glyph="check" disabled={busy || !!reason} disabledReason={reason} onClick={save} data-testid="tastes-save">
            {saved?.set ? '취향 바꾸기' : '취향 정하기'}
          </GameButton>
        </section>
        <section className="l-tastes-pick" aria-label="고르기">
          <Tabs<Slot>
            label="어디에 담을까요"
            idBase="tastes-slot"
            value={slot}
            onChange={setSlot}
            items={[
              { id: 'like', label: `좋아하는 것에 담기 ${likes.length}/${TASTE_LIKES_MAX}`, glyph: 'heart' },
              { id: 'dislike', label: `싫어하는 것에 담기 ${dislikes.length}/${TASTE_DISLIKES_MAX}`, glyph: 'close' },
            ]}
          />
          <div {...tabPanelProps('tastes-slot', slot)} className="l-tastes-panel">
            <div className="l-taste-filters">
              <input
                type="search"
                value={query}
                placeholder="이름으로 찾기"
                aria-label="선물 이름으로 찾기"
                onChange={(e) => setQuery(e.target.value)}
                data-testid="tastes-search"
              />
              <div className="l-taste-cats" role="group" aria-label="종류">
                {(['all', ...TASTE_CATEGORIES] as const).map((c) => (
                  <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>
                    {c === 'all' ? '전체' : tasteCategoryName(c)}
                  </button>
                ))}
              </div>
            </div>
            <div className="l-taste-catalog" data-testid="tastes-catalog">
              {groups.length === 0 && <p className="l-help-text">찾는 선물이 없어요. 다른 이름으로 찾아봐요.</p>}
              {groups.map(({ c, ids }) => {
                const whole = categoryPick(c);
                return (
                  <section key={c} className="l-taste-group">
                    <h4>
                      <Glyph name={CATEGORY_GLYPH[c]} size={18} /> {tasteCategoryName(c)}
                      <button
                        type="button"
                        className="l-taste-whole"
                        aria-pressed={!!markOf(whole)}
                        data-mark={markOf(whole)}
                        disabled={locked}
                        onClick={() => toggle(whole)}
                      >
                        {tasteCategoryName(c)} 전부
                      </button>
                    </h4>
                    <ul>
                      {ids.map((id) => {
                        const mark = markOf(id);
                        return (
                          <li key={id}>
                            <button
                              type="button"
                              aria-pressed={!!mark}
                              data-mark={mark}
                              disabled={locked}
                              onClick={() => toggle(id)}
                              title={itemName(id)}
                            >
                              <ItemIcon id={id} size={30} />
                              <span>{itemName(id)}</span>
                              {mark && <em>{mark === 'like' ? '좋아요' : '싫어요'}</em>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
