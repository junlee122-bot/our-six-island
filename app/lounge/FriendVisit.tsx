'use client';
// '놀러 가기': a friend's room, shared live with everyone else inside it
// ('home' + owner presence). Visitors walk, chat, send stickers and write in
// the guestbook; only the owner decorates (their edits reach us through the
// room revision in world.life). If the owner is away they stand in as an NPC.
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { BookOpen, Mail, MessageCircle, RotateCcw, X } from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { LoungeSave } from '../lounge-look';
import { ACTORS } from '../lounge-roster';
import { josa } from '../lounge-text';
import { boundAction, globalKeyTarget } from '../lounge-scene-keys';
import { visitFriend, type FriendVisit } from '../lounge-visit';
import { friendlyError } from './feedback';
import { rememberLook } from './friend-looks';
import { Guestbook } from './LifePanels';
import type { Notify } from './Toast';
import { useNow } from './use-now';
import './life.css';

const loadBedroom3D = () => import('../lounge-bedroom-3d');
const Bedroom3D = lazy(() =>
  loadBedroom3D().then((m) => ({ default: m.Bedroom3D })),
);

/**
 * Walking up to a friend's door starts loading their room (the room chunk and
 * the visit data), so going in plays the transition instead of a spinner.
 * A prefetched visit is reused for a short while only.
 */
const prefetched = new Map<number, { at: number; job: Promise<FriendVisit> }>();
const PREFETCH_MS = 20_000;
export function prefetchVisit(owner: number) {
  void loadBedroom3D().catch(() => {});
  const hit = prefetched.get(owner);
  if (hit && Date.now() - hit.at < PREFETCH_MS) return hit.job;
  const job = visitFriend(owner);
  job.catch(() => prefetched.delete(owner));
  prefetched.set(owner, { at: Date.now(), job });
  return job;
}
function takeVisit(owner: number, fresh: boolean) {
  const hit = prefetched.get(owner);
  prefetched.delete(owner);
  if (!fresh && hit && Date.now() - hit.at < PREFETCH_MS) return hit.job;
  return visitFriend(owner);
}

const AREA_NAMES: Record<string, string> = {
  village: '마을',
  lounge: '회관',
  casino: '카지노',
  home: '다른 친구 집',
};

/** Live presence for a room from the cloud view (players, room chat, my moves). */
export function roomPresence(room: CloudRoom, view: CloudRoomView) {
  const connected = view.status === 'connected';
  return {
    players: connected ? view.players : [],
    self: view.self,
    chat: view.chat,
    onMove: (x: number, y: number) => {
      if (room.snapshot().status === 'connected') void room.action({ kind: 'move', x, y });
    },
  };
}

export function FriendVisitScreen({
  room,
  view,
  save,
  owner,
  notify,
  onBack,
  onMail,
  onChat,
  stickers,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  save: LoungeSave;
  owner: number;
  notify: Notify;
  onBack: () => void;
  onMail: (actor: number) => void;
  onChat?: () => void;
  stickers?: ReactNode;
}) {
  const [data, setData] = useState<FriendVisit | null>(null);
  const [error, setError] = useState('');
  const now = useNow(true, 30_000) + view.clockOffset;
  const [reload, setReload] = useState(0);
  const guestbookRef = useRef<HTMLElement>(null);
  useEffect(() => {
    let live = true;
    takeVisit(owner, reload > 0).then(
      (visit) => {
        if (!live) return;
        // Their outfit also shows on village NPCs and mail avatars.
        rememberLook(visit.owner, visit.look);
        setData(visit);
        setError('');
      },
      (e) => {
        if (live) setError(friendlyError(e, '친구 방을 불러오지 못했어요.'));
      },
    );
    return () => {
      live = false;
    };
  }, [owner, reload]);
  const load = () => setReload((n) => n + 1);
  const name = ACTORS[owner] ?? '친구';
  // The owner saved a decoration change (or changed who may visit): refetch.
  const roomState = view.life?.rooms?.[owner];
  const rev = roomState?.rev ?? 0;
  const firstRev = useRef(rev);
  useEffect(() => {
    if (rev !== firstRev.current) {
      firstRev.current = rev;
      setReload((n) => n + 1);
    }
  }, [rev]);
  const closed = roomState?.access === 'closed' && owner !== save.actor;
  const backRef = useRef(onBack);
  useLayoutEffect(() => {
    backRef.current = onBack;
  });
  useEffect(() => {
    if (!closed) return;
    notify(`${josa(name, '이/가')} 방문을 닫았어요. 마을로 돌아갈게요.`, 'info');
    backRef.current();
  }, [closed, name, notify]);
  // The guestbook is an in-scene panel (G or the dock button). Esc closes it
  // first; otherwise Esc opens the Esc menu like everywhere else (its
  // 마을로 나가기 leaves), so one Esc never walks me out of the room.
  const [bookOpen, setBookOpen] = useState(false);
  const bookRef = useRef(bookOpen);
  useLayoutEffect(() => {
    bookRef.current = bookOpen;
  });
  const closeBook = () => {
    setBookOpen(false);
    document.querySelector<HTMLElement>('[data-testid=bedroom-3d]')?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const escape = (e: Event) => {
      if (!bookRef.current) return;
      e.preventDefault();
      setBookOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      // Esc while typing in the guestbook closes the panel (the menu stays shut).
      if (
        e.key === 'Escape' &&
        bookRef.current &&
        !e.defaultPrevented &&
        e.target instanceof Element &&
        e.target.closest('#visit-guestbook')
      ) {
        e.preventDefault();
        setBookOpen(false);
        document.querySelector<HTMLElement>('[data-testid=bedroom-3d]')?.focus({ preventScroll: true });
        return;
      }
      if (e.code !== 'KeyG' || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.repeat)
        return;
      if (boundAction(e) || !globalKeyTarget(e)) return;
      e.preventDefault();
      setBookOpen((open) => !open);
    };
    window.addEventListener('bumtadew:escape', escape);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('bumtadew:escape', escape);
      window.removeEventListener('keydown', key);
    };
  }, []);
  // Opening the panel puts the cursor in the guestbook line.
  useEffect(() => {
    if (bookOpen)
      guestbookRef.current?.querySelector<HTMLElement>('input')?.focus({ preventScroll: true });
  }, [bookOpen]);
  const here = view.players.filter(
    (p) => p.id !== view.self && p.area === 'home' && p.home === owner,
  );
  const ownerHere = here.some((p) => p.actor === owner);
  const guests = here.filter((p) => p.actor !== owner);
  // Where the owner is when not home (online players only).
  const ownerAt = view.players.find((p) => p.actor === owner)?.area;
  const ownerLine = ownerHere
    ? `${name}도 방에 있어요`
    : ownerAt
      ? `${josa(name, '은/는')} 지금 ${AREA_NAMES[ownerAt] ?? '마을'}에 있어요`
      : `${josa(name, '은/는')} 지금 쉬는 중이에요`;
  return (
    <section className="l-visit b3-visit" aria-label={`${name}의 방`} data-testid="friend-visit">
      {error ? (
        <div className="l-empty b3-visit-wait">
          <p>{error}</p>
          <button className="l-primary" onClick={load}>
            <RotateCcw size={15} /> 다시 시도
          </button>
          <button className="l-secondary" onClick={onBack} data-testid="visit-back">
            마을로 나가기
          </button>
        </div>
      ) : !data ? (
        <div className="l-scene-wait b3-visit-wait">
          <p>
            <span className="l-spinner" /> {josa(name, '을/를')} 만나러 가는 중…
          </p>
        </div>
      ) : (
        <div className="b3-bedroom-experience">
          <Suspense
            fallback={
              <div className="l-scene-wait b3-visit-wait">
                <p>
                  <span className="l-spinner" /> 방을 여는 중…
                </p>
              </div>
            }
          >
            <Bedroom3D
              key={owner}
              save={save}
              onExit={onBack}
              visit={{ owner, ownerLook: data.look, bedroom: data.bedroom }}
              presence={roomPresence(room, view)}
            />
          </Suspense>
          {/* Who is here and the owner's line: small chips under the room's
              name chip, like my room's visitors chip. */}
          <div className="b3-visit-chips">
            <span className="b3-visit-chip" data-testid="visit-here">
              {ownerLine}
              {guests.length > 0 && ` · 함께 온 친구 ${guests.map((p) => ACTORS[p.actor]).join(', ')}`}
            </span>
            {data.status && (
              <span className="b3-visit-chip is-status">
                <b>오늘의 한마디</b> {data.status.text}
              </span>
            )}
          </div>
          <div className="b3-owner-bar b3-visit-dock">
            {onChat && (
              <button type="button" className="b3-chat-button" onClick={onChat} data-testid="visit-chat">
                <MessageCircle size={17} /> 이 방 수다
              </button>
            )}
            {stickers}
            {owner !== save.actor && (
              <button type="button" className="b3-chat-button" onClick={() => onMail(owner)}>
                <Mail size={17} /> 편지 보내기
              </button>
            )}
            <button
              type="button"
              className="b3-chat-button"
              aria-expanded={bookOpen}
              aria-controls="visit-guestbook"
              onClick={() => (bookOpen ? closeBook() : setBookOpen(true))}
              data-testid="visit-guestbook-jump"
            >
              <BookOpen size={17} /> 방명록{data.guestbook.length ? ` ${data.guestbook.length}` : ''}
              <kbd aria-hidden="true">G</kbd>
            </button>
          </div>
          {bookOpen && (
            // An in-scene panel, not a page section: Esc (or ✕) closes it.
            <aside
              ref={guestbookRef}
              className="b3-visit-guestbook"
              id="visit-guestbook"
              aria-label={`${name}의 방명록`}
            >
              <button type="button" className="l-icon b3-visit-guestbook-close" onClick={closeBook} aria-label="방명록 닫기 (Esc)">
                <X size={18} />
              </button>
              <Guestbook
                room={room}
                owner={owner}
                entries={data.guestbook}
                notify={notify}
                now={now}
                onWritten={load}
              />
            </aside>
          )}
        </div>
      )}
    </section>
  );
}

/** My own guestbook in my room: entries friends left, with an unread badge. */
export function OwnerGuestbook({ room, view }: { room: CloudRoom; view: CloudRoomView }) {
  const life = view.life;
  const unread = life?.me.guestbookUnread ?? 0;
  const [open, setOpen] = useState(false);
  const now = useNow(true, 30_000) + view.clockOffset;
  useEffect(() => {
    if (open && unread > 0) void room.life({ kind: 'readGuestbook' });
  }, [open, unread, room]);
  const entries = [...(life?.me.guestbook ?? [])].reverse();
  return (
    <section className="b3-owner-guestbook" aria-label="내 방명록">
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} data-testid="owner-guestbook">
        <BookOpen size={16} /> 내 방명록
        {unread > 0 && <em aria-label={`새 글 ${unread}개`}>{unread}</em>}
      </button>
      {open && (
        <ul>
          {!entries.length && <li className="b3-empty-note">아직 방명록이 비어 있어요. 친구가 놀러 오면 한 줄 남겨요.</li>}
          {entries.map((e, i) => (
            <li key={`${e.at}-${i}`}>
              <b>{ACTORS[e.actor] ?? '친구'}</b>
              <span>{e.text}</span>
              <small>{Math.max(0, Math.round((now - e.at) / 60_000)) < 60 ? `${Math.max(1, Math.round((now - e.at) / 60_000))}분 전` : new Date(e.at).toLocaleDateString('ko-KR')}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
