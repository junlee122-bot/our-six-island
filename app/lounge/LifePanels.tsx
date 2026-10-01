'use client';
// "범타듀의 하루" panels: farm, mail, guestbook and
// "오늘의 한마디". Every action goes through CloudRoom.life(), which works in
// and out of rooms; server rejections arrive as the usual error toast.
import { useState } from 'react';
import {
  Gift,
  Mail,
  MailOpen,
  Minus,
  Plus,
  Reply,
  Send,
} from '../ui/icons';
import { AvatarView } from '../avatar-view';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  CROPS,
  CROP_INFO,
  GUESTBOOK_TEXT_MAX,
  MAIL_TEXT_MAX,
  STATUS_TEXT_MAX,
  type Crop,
  type Gift as LifeGift,
  type LifeAction,
  type LifeView,
} from '../lounge-life';
import { itemName } from '../lounge-life-plus';
import { ITEM_BY_ID } from '../lounge-items';
import { giftTaste, tastesKnown } from '../lounge-life-ui';
import { REACTIONS, reactionInfo } from '../lounge-reactions';
import { ACTORS } from '../lounge-roster';
import { josa } from '../lounge-text';
import { loungeAudio } from '../lounge-audio';
import { defaultLook, type Look } from '../lounge-look';
import { Modal } from './Modal';
import type { Notify } from './Toast';
import { useNow } from './use-now';
import { lookFor } from './friend-looks';
import { FarmLedgerBody } from './FarmLedger';
import { FarmWorks, type FarmPage } from './FarmWorks';
import { Tabs, tabPanelProps } from '../ui/Tabs';
import type { VillagePoint } from '../lounge-village-layout';
import './life.css';
import { Glyph, type GlyphName } from '../ui/Glyph';

type Base = {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
};
type Chime = Parameters<typeof loungeAudio.chime>[0];

/** Sends a life action; on success shows `done` and plays a small chime. */
export function useLifeAction(room: CloudRoom, notify: Notify) {
  const [busy, setBusy] = useState(false);
  const run = async (action: LifeAction, done: string, chime?: Chime) => {
    if (busy) return false;
    setBusy(true);
    try {
      const ok = await room.life(action);
      if (ok) {
        if (done) notify(done);
        if (chime) loungeAudio.chime(chime);
      }
      return ok;
    } finally {
      setBusy(false);
    }
  };
  return [run, busy] as const;
}

function when(at: number, now: number) {
  const ago = now - at;
  if (ago < 60_000) return '방금';
  if (ago < 3_600_000) return `${Math.floor(ago / 60_000)}분 전`;
  if (ago < 86_400_000) return `${Math.floor(ago / 3_600_000)}시간 전`;
  return `${Math.floor(ago / 86_400_000)}일 전`;
}
/** A little hand-drawn face next to each sticker word in mail (no emoji). */
const STICKER_GLYPH: Record<string, GlyphName> = {
  laugh: 'sticker-laugh',
  wow: 'sticker-wow',
  cry: 'sticker-cry',
  love: 'sticker-love',
  cheer: 'sticker-cheer',
  think: 'sticker-think',
  sorry: 'sticker-sorry',
  hello: 'sticker-hello',
  jeje: 'sticker-jeje',
  yoi: 'sticker-yoi',
  eum: 'sticker-eum',
  aye: 'sticker-aye',
  nonono: 'sticker-nonono',
};
const stickerGlyph = (id: string) => <Glyph name={STICKER_GLYPH[id] ?? 'letter'} size={20} />;
export function giftText(gift: LifeGift | undefined) {
  if (!gift) return '';
  return gift.kind === 'fruit'
    ? `과일 ${gift.n}개`
    : gift.kind === 'item'
      ? `${itemName(gift.item)} ${gift.n}개`
      : `${CROP_INFO[gift.crop].name} ${gift.n}개`;
}

function NoLife() {
  return (
    <p className="l-help-text">
      마을에 연결되면 텃밭과 가방을 쓸 수 있어요. 잠시 후 다시 열어 주세요.
    </p>
  );
}

function Stepper({
  value,
  min = 1,
  max,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <span className="l-stepper">
      <button
        type="button"
        aria-label={`${label} 줄이기`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={15} />
      </button>
      <output aria-live="polite">{value}</output>
      <button
        type="button"
        aria-label={`${label} 늘리기`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={15} />
      </button>
    </span>
  );
}

/* ------------------------------------------------------------------ farm */

/**
 * 내 텃밭 (VILL-2 + 텃밭 확장): one window with four tabs — 텃밭 장부 (the
 * wooden notebook in FarmLedger.tsx), 밭 배치, 가공, 출하·품평회
 * (FarmWorks.tsx). My actor comes from the life view when the caller does
 * not pass it. It always opens on the ledger (E at the farm expects it).
 */
export function FarmModal({
  room,
  view,
  notify,
  onClose,
  onShop,
  onBag,
  onWalk,
  actor,
}: Base & {
  onShop: () => void;
  onBag?: () => void;
  onWalk?: (point: VillagePoint) => void;
  actor?: number;
}) {
  const [page, setPage] = useState<FarmPage>('ledger');
  const me = actor ?? view.life?.actors?.[view.self] ?? 0;
  const farmx = view.life?.farmx;
  const now = useNow(true, 15_000) + view.clockOffset;
  const ready =
    (farmx?.machines.filter((m) => m.out && (m.doneAt ?? Infinity) <= now).length ?? 0) +
    (farmx?.fixtures.filter((f) => f.kind === 'beehouse' && (f.readyAt ?? Infinity) <= now).length ?? 0);
  return (
    <Modal title={`${ACTORS[me] ?? ''}네 텃밭`} onClose={onClose} className="l-ledger l-farm" panel="plain" wide>
      <Tabs<FarmPage>
        className="l-farm-tabs"
        label="텃밭"
        idBase="farm"
        value={page}
        onChange={setPage}
        items={[
          { id: 'ledger', label: '텃밭 장부', glyph: 'sprout' },
          { id: 'layout', label: '밭 배치', glyph: 'grid' },
          { id: 'works', label: '가공', glyph: 'pot', badge: ready || undefined },
          { id: 'market', label: '출하·품평회', glyph: 'award', badge: farmx?.bin ? farmx.bin.items.length : undefined },
        ]}
      />
      <div {...tabPanelProps('farm', page)}>
        {page === 'ledger' ? (
          <FarmLedgerBody room={room} view={view} notify={notify} onClose={onClose} onShop={onShop} onBag={onBag} onWalk={onWalk} actor={me} onPage={setPage} />
        ) : (
          <FarmWorks page={page} room={room} view={view} notify={notify} />
        )}
      </div>
    </Modal>
  );
}

/*
 * The old 가방 (sell) and 범타듀 상점 windows are gone (가게 나누기, 2026-10):
 * the bag is lounge/Inventory.tsx, and each shop sells and buys its own goods
 * at its counter (lounge/TownPanel.tsx, lounge/ShopGoods.tsx).
 */

/* ------------------------------------------------------------------ mail */

const others = (self: number) =>
  ACTORS.map((name, actor) => ({ name, actor })).filter((f) => f.actor !== self);

export function MailModal({
  room,
  view,
  notify,
  onClose,
  selfActor,
  initialTo,
  initialGift,
}: Base & { selfActor: number; initialTo?: number; initialGift?: string }) {
  const life = view.life;
  const now = useNow(true, 30_000) + view.clockOffset;
  const [tab, setTab] = useState<'inbox' | 'write' | 'guestbook'>(
    initialTo === undefined && !initialGift ? 'inbox' : 'write',
  );
  const [to, setTo] = useState<number>(initialTo ?? others(selfActor)[0].actor);
  const [text, setText] = useState('');
  const [sticker, setSticker] = useState('');
  // 'none' | a crop id | 'fruit' | an inventory item id (fish, bugs, forage, dishes…).
  const [giftKind, setGiftKind] = useState<string>(initialGift ?? 'none');
  const [giftN, setGiftN] = useState(1);
  const [run, busy] = useLifeAction(room, notify);
  if (!life)
    return (
      <Modal title="우편함" onClose={onClose}>
        <NoLife />
      </Modal>
    );
  const mail = [...life.me.mail].reverse();
  const bag = life.me.bag;
  const isCropGift = (CROPS as string[]).includes(giftKind);
  const giftMax =
    giftKind === 'none'
      ? 0
      : giftKind === 'fruit'
        ? bag.fruit
        : isCropGift
          ? bag.produce[giftKind as Crop]
          : (life.me.inv?.[giftKind] ?? 0);
  const giftItems = Object.entries(life.me.inv ?? {}).filter(
    ([id, n]) => n > 0 && ITEM_BY_ID[id] && ITEM_BY_ID[id].kind !== 'tool',
  );
  const myBond = life.me.bonds?.find((b) => b.actor === to);
  const known = tastesKnown(myBond?.level ?? 0);
  const tasteMark = (id: string) => {
    if (!known) return '';
    const t = giftTaste(to, id);
    return t === 'like' ? ' · 좋아해요' : t === 'dislike' ? ' · 별로예요' : '';
  };
  const send = async () => {
    const n = Math.min(giftN, giftMax);
    const gift: LifeGift | undefined =
      giftKind === 'none'
        ? undefined
        : giftKind === 'fruit'
          ? { kind: 'fruit', n }
          : isCropGift
            ? { kind: 'produce', crop: giftKind as Crop, n }
            : { kind: 'item', item: giftKind, n };
    const ok = await run(
      {
        kind: 'mail',
        to,
        text,
        ...(sticker ? { sticker } : {}),
        ...(gift && gift.n > 0 ? { gift } : {}),
      },
      `${ACTORS[to]}에게 편지를 보냈어요.`,
      'mail',
    );
    if (ok) {
      setText('');
      setSticker('');
      setGiftKind('none');
      setGiftN(1);
      setTab('inbox');
    }
  };
  return (
    <Modal title="우편함" onClose={onClose} className="l-life-modal">
      <div className="l-mail-tabs" role="tablist" aria-label="우편함">
        <button
          role="tab"
          aria-selected={tab === 'inbox'}
          onClick={() => setTab('inbox')}
        >
          <Mail size={15} /> 받은 편지
          {life.me.mailUnread > 0 && <b className="l-badge">{life.me.mailUnread}</b>}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'write'}
          onClick={() => setTab('write')}
          data-testid="mail-write-tab"
        >
          <Send size={15} /> 편지 쓰기
        </button>
        <button
          role="tab"
          aria-selected={tab === 'guestbook'}
          onClick={() => setTab('guestbook')}
        >
          내 방명록
        </button>
      </div>
      {tab === 'guestbook' ? (
        <section className="l-guestbook" aria-label="내 방명록">
          {!life.me.guestbook.length && (
            <p className="l-help-text">
              아직 다녀간 친구가 없어요. 친구가 내 집에 놀러 오면 여기에 한 줄이 남아요.
            </p>
          )}
          <ul>
            {[...life.me.guestbook].reverse().map((e, i) => (
              <li key={`${e.at}-${i}`}>
                <b>{ACTORS[e.actor] ?? '친구'}</b>
                <span>{e.text}</span>
                <small>{when(e.at, now)}</small>
              </li>
            ))}
          </ul>
        </section>
      ) : tab === 'inbox' ? (
        <>
          {life.me.mailUnread > 0 && (
            <button
              className="l-secondary l-mail-all"
              disabled={busy}
              onClick={() => void run({ kind: 'readMail', id: 'all' }, '모두 읽음으로 표시했어요.')}
            >
              <MailOpen size={15} /> 모두 읽음으로 표시
            </button>
          )}
          {!mail.length && <p className="l-help-text">아직 받은 편지가 없어요.</p>}
          <ul className="l-mail-list">
            {mail.map((m) => {
              const reaction = reactionInfo(m.sticker);
              return (
                <li key={m.id} data-unread={!m.read || undefined} data-testid="mail-item">
                  <span className="l-mail-face" aria-hidden="true">
                    <AvatarView actor={m.actor} look={lookFor(m.actor)} portrait />
                  </span>
                  <div>
                    <strong>
                      {ACTORS[m.actor] ?? '친구'}
                      <small> · {when(m.at, now)}</small>
                      {!m.read && <em className="l-new">새 편지</em>}
                    </strong>
                    {m.text && <p>{m.text}</p>}
                    {(reaction || m.gift) && (
                      <p className="l-mail-extra">
                        {reaction && (
                          <span className="l-sticker-chip" title={reaction.description}>
                            {stickerGlyph(reaction.id)}{' '}
                            {reaction.label}
                          </span>
                        )}
                        {m.gift && (
                          <span className="l-gift-chip">
                            <Gift size={13} /> {giftText(m.gift)} 선물 · 가방에 들어왔어요
                          </span>
                        )}
                      </p>
                    )}
                    <div className="l-mail-actions">
                      {!m.read && (
                        <button
                          className="l-link"
                          disabled={busy}
                          onClick={() => void run({ kind: 'readMail', id: m.id }, '')}
                        >
                          읽음으로 표시
                        </button>
                      )}
                      <button
                        className="l-link"
                        onClick={() => {
                          setTo(m.actor);
                          setTab('write');
                          if (!m.read) void room.life({ kind: 'readMail', id: m.id });
                        }}
                      >
                        <Reply size={14} /> 답장
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <form
          className="l-mail-form"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label>
            <span>받는 친구</span>
            <select
              value={to}
              onChange={(e) => setTo(Number(e.target.value))}
              data-testid="mail-to"
            >
              {others(selfActor).map((f) => (
                <option key={f.actor} value={f.actor}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>
              편지 <small>{Array.from(text).length}/{MAIL_TEXT_MAX}</small>
            </span>
            <textarea
              value={text}
              maxLength={MAIL_TEXT_MAX}
              rows={3}
              required={!sticker && giftKind === 'none'}
              placeholder={
                sticker || giftKind !== 'none'
                  ? '글 없이 스티커나 선물만 보내도 돼요'
                  : `${ACTORS[to]}에게 한 줄 남겨 보세요`
              }
              onChange={(e) => setText(e.target.value)}
              data-testid="mail-text"
            />
          </label>
          <fieldset className="l-sticker-pick">
            <legend>스티커 (선택)</legend>
            <button type="button" aria-pressed={!sticker} onClick={() => setSticker('')}>
              없음
            </button>
            {REACTIONS.map((r) => (
              <button
                type="button"
                key={r.id}
                aria-pressed={sticker === r.id}
                onClick={() => setSticker(r.id)}
              >
                {stickerGlyph(r.id)} {r.label}
              </button>
            ))}
          </fieldset>
          <label>
            <span>선물 (선택)</span>
            <select
              value={giftKind}
              onChange={(e) => {
                setGiftKind(e.target.value as typeof giftKind);
                setGiftN(1);
              }}
              data-testid="mail-gift"
            >
              <option value="none">선물 없음</option>
              <optgroup label="작물·과일">
                {CROPS.filter((c) => bag.produce[c] > 0).map((c) => (
                  <option key={c} value={c}>
                    {CROP_INFO[c].name} ({bag.produce[c]}개){tasteMark(c)}
                  </option>
                ))}
                <option value="fruit" disabled={!bag.fruit}>
                  과일 ({bag.fruit}개){tasteMark('fruit')}
                </option>
              </optgroup>
              {giftItems.length > 0 && (
                <optgroup label="물고기·곤충·채집물·요리">
                  {giftItems.map(([id, n]) => (
                    <option key={id} value={id}>
                      {ITEM_BY_ID[id].name} ({n}개){tasteMark(id)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          <p className="l-help-text" data-testid="mail-tastes">
            {known
              ? `${josa(ACTORS[to], '은/는')} ${
                  giftKind !== 'none' && giftTaste(to, giftKind) === 'like'
                    ? '이 선물을 좋아해요. 추억이 두 배로 쌓여요.'
                    : giftKind !== 'none' && giftTaste(to, giftKind) === 'dislike'
                      ? '이 선물은 별로 안 좋아해요.'
                      : '어떤 선물을 좋아할까요? 좋아하는 선물은 추억이 두 배예요.'
                }`
              : `${ACTORS[to]}의 취향은 하트가 하나 생기면 알 수 있어요.`}
          </p>
          {giftKind !== 'none' && giftMax > 0 && (
            <Stepper label="선물 개수" value={Math.min(giftN, giftMax)} max={Math.min(99, giftMax)} onChange={setGiftN} />
          )}
          <button
            className="l-primary"
            type="submit"
            disabled={busy || (!text.trim() && !sticker && !(giftKind !== 'none' && giftMax > 0))}
            data-testid="mail-send"
          >
            <Send size={15} /> 보내기
          </button>
        </form>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ guestbook */

export function Guestbook({
  room,
  owner,
  entries,
  notify,
  now,
  onWritten,
}: {
  room: CloudRoom;
  owner: number;
  entries: { actor: number; text: string; at: number }[];
  notify: Notify;
  now: number;
  onWritten: () => void;
}) {
  const [text, setText] = useState('');
  const [run, busy] = useLifeAction(room, notify);
  return (
    <section className="l-guestbook" aria-label={`${ACTORS[owner]}의 방명록`}>
      <h2>{ACTORS[owner]}의 방명록</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await run(
              { kind: 'guestbook', owner, text },
              '방명록에 한 줄 남겼어요.',
              'mail',
            )
          ) {
            setText('');
            onWritten();
          }
        }}
      >
        <input
          value={text}
          maxLength={GUESTBOOK_TEXT_MAX}
          placeholder="다녀간 한 줄을 남겨요"
          aria-label="방명록 한 줄"
          onChange={(e) => setText(e.target.value)}
          data-testid="guestbook-text"
        />
        <button className="l-primary" disabled={busy || !text.trim()} data-testid="guestbook-send">
          남기기
        </button>
      </form>
      <small className="l-count">
        {Array.from(text).length}/{GUESTBOOK_TEXT_MAX}
      </small>
      {!entries.length && <p className="l-help-text">첫 번째로 방명록을 남겨 보세요.</p>}
      <ul>
        {[...entries].reverse().map((e, i) => (
          <li key={`${e.at}-${i}`} data-testid="guestbook-entry">
            <b>{ACTORS[e.actor] ?? '친구'}</b>
            <span>{e.text}</span>
            <small>{when(e.at, now)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ status */

export function StatusModal({ room, view, notify, onClose }: Base) {
  const current = view.life?.me.status?.text ?? '';
  const [text, setText] = useState(current);
  const [run, busy] = useLifeAction(room, notify);
  return (
    <Modal title="오늘의 한마디" onClose={onClose}>
      <p className="l-modal-intro">
        내가 마을에 없을 때 친구가 말을 걸면 내 캐릭터가 이 말을 해요.
      </p>
      <form
        className="l-status-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run({ kind: 'status', text }, text.trim() ? '한마디를 바꿨어요.' : '한마디를 지웠어요.'))
            onClose();
        }}
      >
        <input
          value={text}
          maxLength={STATUS_TEXT_MAX}
          placeholder="예: 오늘은 딸기 심는 날!"
          aria-label="오늘의 한마디"
          onChange={(e) => setText(e.target.value)}
          data-testid="status-text"
        />
        <small className="l-count">
          {Array.from(text).length}/{STATUS_TEXT_MAX}
        </small>
        <div className="l-modal-actions">
          {current && (
            <button type="button" className="l-secondary" disabled={busy} onClick={() => setText('')}>
              지우기
            </button>
          )}
          <button className="l-primary" disabled={busy || text.trim() === current} data-testid="status-save">
            저장
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Friend's look for avatars when only the actor is known. */
export const lookOf = (actor: number, look?: Look) => look ?? defaultLook(actor);
export type { LifeView };
