'use client';
/* Static GitHub Pages serves these versioned game assets without a Next image service. */
/* oxlint-disable next/no-img-element */
import { useId, useState } from 'react';
import { Check, Bookmark, Download, RotateCcw, ArrowRight } from 'lucide-react';
import { AvatarView } from './avatar-view';
import { ACTORS, ACTOR_COLORS } from './theater-data';
import {
  COLLECTIONS,
  HAIR_COLORS,
  TOP_COLORS,
  collectionsFor,
  hatsFor,
  DAOWON_COLLECTIONS,
  COSTUME_COLLECTIONS,
  GLASSES,
  defaultLook,
  readLook,
  type LoungeSave,
  type Look,
} from './lounge-look';
import {
  colorRgb,
  rgbColor,
  readColorHex,
  DEFAULT_SKIN_COLOR,
} from './lounge-color';
import { loungeSprites } from './lounge-sprites';
import { LOUNGE_ASSETS } from './lounge-assets';
import type { Motion } from './character-style';
import './lounge-wardrobe-club.css';

const WARDROBE_CATEGORIES = [
  ['outfit', '옷'],
  ['hair', '머리'],
  ['skin', '피부'],
  ['extras', '소품'],
  ['saved', '보관함'],
] as const;

function RgbChannel({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const invalid =
    draft !== null &&
    draft !== '' &&
    (!/^\d{1,3}$/.test(draft) || Number(draft) > 255);
  return (
    <label className="l-rgb-channel">
      <span>{label}</span>
      <input
        type="number"
        min={0}
        max={255}
        step={1}
        inputMode="numeric"
        aria-invalid={invalid || undefined}
        value={draft ?? value}
        onFocus={() => setDraft(String(value))}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (/^\d{1,3}$/.test(next) && Number(next) <= 255)
            onChange(Number(next));
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  );
}

function ColorEditor({
  label,
  color,
  custom,
  resetLabel,
  onChange,
  onReset,
}: {
  label: string;
  color: string;
  custom: boolean;
  resetLabel: string;
  onChange: (value: string) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const rgb = colorRgb(color);
  const validDraft =
    draft === null
      ? color
      : readColorHex(draft.startsWith('#') ? draft : '#' + draft);
  return (
    <fieldset className="l-color-editor">
      <legend>{label}</legend>
      <p>
        {custom
          ? '직접 지정한 색을 입고 있어요.'
          : '원래 색을 입고 있어요. 원하는 색을 직접 골라 보세요.'}
      </p>
      <div className="l-color-inputs">
        <label className="l-color-picker">
          <span>색상</span>
          <input
            type="color"
            value={color}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>
        <label className="l-color-hex">
          <span>HEX</span>
          <input
            type="text"
            value={draft ?? color.toUpperCase()}
            maxLength={7}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!validDraft || undefined}
            onFocus={() => setDraft(color.toUpperCase())}
            onChange={(event) => {
              const next = event.target.value;
              setDraft(next);
              const valid = readColorHex(
                next.startsWith('#') ? next : '#' + next,
              );
              if (valid) onChange(valid);
            }}
            onBlur={() => setDraft(null)}
          />
        </label>
        {(['R', 'G', 'B'] as const).map((channel, index) => (
          <RgbChannel
            key={channel}
            label={channel}
            value={rgb[index]}
            onChange={(value) => {
              const next = [...rgb];
              next[index] = value;
              onChange(rgbColor(next));
            }}
          />
        ))}
      </div>
      <div className="l-color-editor-footer">
        <span>
          {validDraft
            ? 'R · G · B는 0~255 사이로 입력하세요.'
            : 'HEX는 #과 여섯 자리 숫자·A~F로 입력하세요.'}
        </span>
        <button type="button" disabled={!custom} onClick={onReset}>
          <RotateCcw size={14} />
          {resetLabel}
        </button>
      </div>
    </fieldset>
  );
}

export function Wardrobe({
  save,
  onChange,
  locked,
  entry,
  onEnter,
  notice,
}: {
  save: LoungeSave;
  onChange: (save: LoungeSave) => void;
  locked: boolean;
  entry: boolean;
  onEnter: () => void;
  notice: (s: string) => void;
}) {
  const actor = save.actor,
    look = save.looks[actor],
    currentCollection = COLLECTIONS.find((c) => c.id === look.collection)!,
    savedCount = save.saved.filter((s) => s.actor === actor).length,
    tabsId = useId(),
    [category, setCategory] =
      useState<(typeof WARDROBE_CATEGORIES)[number][0]>('outfit'),
    [outfitGroup, setOutfitGroup] = useState('all'),
    [motion, setMotion] = useState<Motion>('idle'),
    visibleOutfitGroup =
      actor !== 0 && outfitGroup === 'pants' ? 'all' : outfitGroup;
  const change = (patch: Partial<Look>) =>
    onChange({
      ...save,
      looks: save.looks.map((l, i) =>
        i === actor ? readLook({ ...l, ...patch }, i) : l,
      ),
    });
  const replaceLook = (next: Look) =>
    change({
      ...next,
      hairColor: next.hairColor,
      skinColor: next.skinColor,
    });
  const bookmark = () => {
    if (
      save.saved.some(
        (s) =>
          s.actor === actor && JSON.stringify(s.look) === JSON.stringify(look),
      )
    ) {
      notice('이미 보관한 코디예요.');
      return;
    }
    onChange({
      ...save,
      saved: [
        {
          id: crypto.randomUUID(),
          actor,
          look: { ...look },
          name: `${ACTORS[actor]}의 ${COLLECTIONS.find((c) => c.id === look.collection)!.name}`,
        },
        ...save.saved,
      ].slice(0, 28),
    });
    notice('이 코디를 보관했어요.');
  };
  const download = async () => {
    try {
      const c = document.createElement('canvas');
      c.width = 1000;
      c.height = 1200;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#e7e6e0';
      ctx.fillRect(0, 0, 1000, 1200);
      const a = document.createElement('canvas');
      a.width = 780;
      a.height = 900;
      (await loungeSprites()).draw(a, actor, look, motion, 0);
      ctx.drawImage(a, 110, 95);
      ctx.fillStyle = '#202c3d';
      ctx.font = 'bold 52px "Malgun Gothic",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ACTORS[actor], 500, 1095);
      ctx.font = '22px "Malgun Gothic",sans-serif';
      ctx.fillText('호현지방 · 오늘의 나', 500, 1140);
      const blob = await new Promise<Blob>((resolve, reject) =>
        c.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error('PNG export failed')),
          'image/png',
        ),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `호현지방-${ACTORS[actor]}-코디.png`;
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      notice('코디 사진을 저장했어요.');
    } catch {
      notice('사진을 저장하지 못했어요. 다시 시도해 주세요.');
    }
  };
  return (
    <section className="l-wardrobe">
      <div className="l-section-title">
        <div>
          <h1>분장실</h1>
          <p>
            {entry
              ? '오늘 입을 옷을 고르면, 친구들을 만나러 가요.'
              : '입어 보고, 마음에 드는 코디를 보관하세요.'}
          </p>
        </div>
      </div>
      <div
        className={
          'l-wardrobe-grid' + (actor === 0 ? ' l-daowon-wardrobe' : '')
        }
      >
        <aside
          className={'l-friend-picker' + (locked ? ' is-locked' : '')}
          aria-label={locked ? '내 캐릭터' : '캐릭터 선택'}
        >
          {ACTORS.map((name, i) => (
            <button
              key={name}
              className={actor === i ? 'selected' : ''}
              aria-pressed={actor === i}
              disabled={locked && actor !== i}
              onClick={() => onChange({ ...save, actor: i })}
            >
              <span
                className="l-face"
                style={{ background: ACTOR_COLORS[i] + '33' }}
              >
                <AvatarView actor={i} look={save.looks[i]} portrait />
              </span>
              <strong>{name}</strong>
              {actor === i && <Check size={15} />}
            </button>
          ))}
          {locked && (
            <small>이 계정은 {ACTORS[actor]}의 옷장을 사용해요.</small>
          )}
        </aside>
        <div className="l-mirror">
          <div className="l-mirror-top">
            <strong>{ACTORS[actor]}의 착용 미리보기</strong>
            <span>{currentCollection.name}</span>
          </div>
          <div className="l-avatar-stage">
            <img
              className="l-wardrobe-backdrop"
              src={LOUNGE_ASSETS.wardrobe}
              alt=""
              draggable={false}
            />
            <div className="l-stage-oval" />
            <AvatarView actor={actor} look={look} motion={motion} animated />
          </div>
          <div className="l-pose-bar">
            {(
              [
                ['idle', '가만히'],
                ['walk', '걸어 보기'],
                ['wave', '인사하기'],
              ] as [Motion, string][]
            ).map(([id, name]) => (
              <button
                key={id}
                aria-pressed={motion === id}
                className={motion === id ? 'selected' : ''}
                onClick={() => setMotion(id)}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="l-look-tools">
            <button onClick={bookmark}>
              <Bookmark size={16} />
              코디 보관
            </button>
            <button onClick={download}>
              <Download size={16} />
              사진 저장
            </button>
            <button
              title="이 친구의 기본 모습"
              aria-label="이 친구의 기본 모습"
              onClick={() => replaceLook(defaultLook(actor))}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
        <div className="l-closet">
          <div className="l-closet-header">
            <h2>내 옷장</h2>
            <span className="l-current-look">
              <small>착용 중</small>
              <strong>{currentCollection.name}</strong>
            </span>
          </div>
          <div className="l-tabs" role="tablist" aria-label="옷장 분류">
            {WARDROBE_CATEGORIES.map(([id, name], index) => (
              <button
                id={`${tabsId}-${id}`}
                role="tab"
                aria-selected={category === id}
                aria-controls={`${tabsId}-panel`}
                tabIndex={category === id ? 0 : -1}
                key={id}
                onClick={() => setCategory(id)}
                onKeyDown={(event) => {
                  const nextIndex =
                    event.key === 'ArrowRight'
                      ? (index + 1) % WARDROBE_CATEGORIES.length
                      : event.key === 'ArrowLeft'
                        ? (index + WARDROBE_CATEGORIES.length - 1) %
                          WARDROBE_CATEGORIES.length
                        : event.key === 'Home'
                          ? 0
                          : event.key === 'End'
                            ? WARDROBE_CATEGORIES.length - 1
                            : null;
                  if (nextIndex === null) return;
                  event.preventDefault();
                  const next = WARDROBE_CATEGORIES[nextIndex][0];
                  setCategory(next);
                  document.getElementById(`${tabsId}-${next}`)?.focus();
                }}
              >
                {name}
                {id === 'saved' && savedCount > 0 && (
                  <small>{savedCount}</small>
                )}
              </button>
            ))}
          </div>
          <div
            className="l-closet-panel"
            role="tabpanel"
            id={`${tabsId}-panel`}
            aria-labelledby={`${tabsId}-${category}`}
            tabIndex={0}
          >
            {category === 'outfit' && (
              <>
                <div className="l-outfit-filters" aria-label="의상 종류">
                  {[
                    ['all', '전체'],
                    ['pants', '바지'],
                    ['costume', '코스튬'],
                  ]
                    .filter(([id]) => actor === 0 || id !== 'pants')
                    .map(([id, name]) => (
                      <button
                        key={id}
                        aria-pressed={visibleOutfitGroup === id}
                        onClick={() => setOutfitGroup(id)}
                      >
                        {name}
                      </button>
                    ))}
                </div>
                <div className="l-outfits">
                  {collectionsFor(actor)
                    .filter(
                      (c) =>
                        visibleOutfitGroup === 'all' ||
                        (visibleOutfitGroup === 'pants'
                          ? c.id === 'wide-pants' || c.id === 'denim'
                          : COSTUME_COLLECTIONS.includes(c.id)),
                    )
                    .sort(
                      (a, b) =>
                        Number(DAOWON_COLLECTIONS.includes(b.id)) -
                        Number(DAOWON_COLLECTIONS.includes(a.id)),
                    )
                    .map((c) => (
                      <button
                        key={c.id}
                        className={look.collection === c.id ? 'selected' : ''}
                        aria-pressed={look.collection === c.id}
                        aria-label={`${c.name}${look.collection === c.id ? ' · 착용 중' : ''}`}
                        onClick={() => change({ collection: c.id })}
                      >
                        <span className="l-outfit-art" aria-hidden="true">
                          <AvatarView
                            actor={actor}
                            look={{ ...look, collection: c.id }}
                          />
                        </span>
                        <span className="l-outfit-caption">
                          <strong>{c.name}</strong>
                          <small>{c.note}</small>
                        </span>
                        {look.collection === c.id && (
                          <span className="l-outfit-selected">
                            <Check size={13} /> 착용 중
                          </span>
                        )}
                      </button>
                    ))}
                </div>
                {look.collection === 'original' && (
                  <div className="l-colors">
                    <h3>상의 색</h3>
                    {TOP_COLORS.map((c) => (
                      <button
                        key={c.id}
                        aria-label={c.name}
                        title={c.name}
                        aria-pressed={look.top === c.id}
                        style={{ background: c.hex }}
                        onClick={() => change({ top: c.id })}
                      >
                        {look.top === c.id && <Check size={17} />}
                      </button>
                    ))}
                  </div>
                )}
                <p className="l-help-text">
                  {actor === 0
                    ? '머리 탭에서 만두머리, 소품 탭에서 응원 머리띠를 함께 골라 보세요.'
                    : '‘처음 만난 우리’에는 익숙한 원래 그림과 걷기·인사 모션이 담겨 있어요.'}
                </p>
              </>
            )}
            {category === 'hair' && (
              <>
                {actor === 0 && (
                  <div className="l-hairstyles" aria-label="도원의 머리 모양">
                    {(
                      [
                        ['signature', '기본 단발'],
                        ['buns', '만두머리'],
                      ] as const
                    ).map(([id, name]) => (
                      <button
                        key={id}
                        aria-pressed={look.hairstyle === id}
                        onClick={() => change({ hairstyle: id })}
                      >
                        <AvatarView
                          actor={actor}
                          look={{
                            ...look,
                            hairstyle: id,
                            hat: 'none',
                            glasses: 'none',
                            clip: false,
                          }}
                          portrait
                        />
                        <span>{name}</span>
                        {look.hairstyle === id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                )}
                <div className="l-hair-options">
                  <h3>머리 색을 골라 주세요</h3>
                  <div>
                    {HAIR_COLORS.map((c) => (
                      <button
                        key={c.id}
                        aria-pressed={!look.hairColor && look.hair === c.id}
                        onClick={() =>
                          change({ hair: c.id, hairColor: undefined })
                        }
                      >
                        <span style={{ background: c.hex }}>
                          {!look.hairColor && look.hair === c.id && (
                            <Check size={18} />
                          )}
                        </span>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <ColorEditor
                  key={`hair-${actor}`}
                  label="나만의 머리 색"
                  color={
                    look.hairColor ??
                    HAIR_COLORS.find((c) => c.id === look.hair)!.hex
                  }
                  custom={!!look.hairColor}
                  resetLabel="선택한 기본 색으로"
                  onChange={(hairColor) => change({ hairColor })}
                  onReset={() => change({ hairColor: undefined })}
                />
              </>
            )}
            {category === 'skin' && (
              <>
                <ColorEditor
                  key={`skin-${actor}`}
                  label="피부 색"
                  color={look.skinColor ?? DEFAULT_SKIN_COLOR}
                  custom={!!look.skinColor}
                  resetLabel="원래 피부색으로"
                  onChange={(skinColor) => change({ skinColor })}
                  onReset={() => change({ skinColor: undefined })}
                />
                <p className="l-help-text">
                  얼굴과 드러난 팔·다리의 색을 함께 바꿔요. 원래 피부색으로
                  돌아가면 그림의 본래 색을 그대로 입어요.
                </p>
              </>
            )}
            {category === 'extras' && (
              <div className="l-extra-options">
                <h3>{actor === 0 ? '모자 · 머리띠' : '모자'}</h3>
                <div>
                  {hatsFor(actor).map((c) => (
                    <button
                      key={c.id}
                      aria-pressed={look.hat === c.id}
                      onClick={() => change({ hat: c.id })}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <h3>안경</h3>
                <div>
                  {GLASSES.map((c) => (
                    <button
                      key={c.id}
                      aria-pressed={look.glasses === c.id}
                      onClick={() => change({ glasses: c.id })}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
                <h3>작은 포인트</h3>
                <button
                  aria-pressed={look.clip}
                  onClick={() => change({ clip: !look.clip })}
                >
                  꽃 머리핀 {look.clip ? '✓' : ''}
                </button>
              </div>
            )}
            {category === 'saved' && (
              <div className="l-saved-looks">
                {!save.saved.some((s) => s.actor === actor) && (
                  <p>
                    마음에 드는 모습을 찾으면
                    <br />
                    ‘코디 보관’을 눌러 주세요.
                  </p>
                )}
                {save.saved
                  .filter((s) => s.actor === actor)
                  .map((s) => (
                    <div key={s.id}>
                      <button
                        aria-pressed={
                          JSON.stringify(s.look) === JSON.stringify(look)
                        }
                        onClick={() => replaceLook(s.look)}
                      >
                        <AvatarView actor={actor} look={s.look} />
                        <strong>{s.name}</strong>
                      </button>
                      <button
                        className="l-text"
                        onClick={() =>
                          onChange({
                            ...save,
                            saved: save.saved.filter((v) => v.id !== s.id),
                          })
                        }
                      >
                        삭제
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div className="l-closet-bottom">
            <span>
              <Check size={14} />
              자동으로 저장돼요
            </span>
            <button className="l-primary" onClick={onEnter}>
              {entry ? '이 모습으로 입장' : '라운지로 돌아가기'}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
