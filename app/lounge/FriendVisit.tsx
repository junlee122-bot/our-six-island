'use client';
// '놀러 가기': a friend's room, shared live with everyone else inside it
// ('home' + owner presence). Visitors walk, chat, send stickers and write in
// the guestbook; only the owner decorates (their edits reach us through the
// room revision in world.life). If the owner is away they stand in as an NPC.
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, MessageCircle, RotateCcw } from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { LoungeSave } from '../lounge-look';
import { ACTORS } from '../lounge-roster';
import { josa } from '../lounge-text';
import { visitFriend, type FriendVisit } from '../lounge-visit';
import { friendlyError } from './feedback';
import { rememberLook } from './friend-looks';
import { Guestbook } from './LifePanels';
import type { Notify } from './Toast';
import { useNow } from './use-now';
import './life.css';

const Bedroom3D = lazy(() =>
  import('../lounge-bedroom-3d').then((m) => ({ default: m.Bedroom3D })),
);

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
  const guestbookRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let live = true;
    visitFriend(owner).then(
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
  // Esc goes back to the village (unless a dialog is open or I am typing).
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      backRef.current();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const here = view.players.filter(
    (p) => p.id !== view.self && p.area === 'home' && p.home === owner,
  );
  return (
    <section className="l-visit b3-visit" aria-label={`${name}의 방`} data-testid="friend-visit">
      <div className="l-visit-bar b3-visit-bar">
        <button className="l-secondary b3-visit-back" onClick={onBack} data-testid="visit-back" aria-label="마을로 돌아가기 (Esc)">
          <ArrowLeft size={18} /> 마을로
        </button>
        <p>
          {here.length
            ? `지금 함께 있는 친구 · ${here.map((p) => ACTORS[p.actor]).join(', ')}`
            : `${name}의 방에 놀러 왔어요.`}
        </p>
        {onChat && (
          <button className="l-secondary" onClick={onChat} data-testid="visit-chat">
            <MessageCircle size={16} /> 수다
          </button>
        )}
        {owner !== save.actor && (
          <button className="l-secondary" onClick={() => onMail(owner)}>
            편지 보내기
          </button>
        )}
      </div>
      {error ? (
        <div className="l-empty">
          <p>{error}</p>
          <button className="l-primary" onClick={load}>
            <RotateCcw size={15} /> 다시 시도
          </button>
        </div>
      ) : !data ? (
        <div className="l-empty l-screen-loading">
          <span className="l-spinner" />
          <p>{josa(name, '을/를')} 만나러 가는 중…</p>
        </div>
      ) : (
        <>
          <div className="b3-visit-room">
            {data.status && (
              <p className="l-visit-status">
                <b>{name}의 오늘의 한마디</b> · {data.status.text}
              </p>
            )}
            <Suspense
              fallback={
                <div className="l-empty l-screen-loading">
                  <span className="l-spinner" />
                  <p>방을 여는 중…</p>
                </div>
              }
            >
              <Bedroom3D
                key={owner}
                save={save}
                visit={{ owner, ownerLook: data.look, bedroom: data.bedroom }}
                presence={roomPresence(room, view)}
              />
            </Suspense>
            {stickers && <div className="b3-visit-stickers">{stickers}</div>}
          </div>
          <div ref={guestbookRef} className="b3-visit-guestbook" id="visit-guestbook">
            <Guestbook
              room={room}
              owner={owner}
              entries={data.guestbook}
              notify={notify}
              now={now}
              onWritten={load}
            />
          </div>
          <button
            type="button"
            className="b3-guestbook-fab"
            onClick={() => guestbookRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            data-testid="visit-guestbook-jump"
          >
            <BookOpen size={17} /> 방명록 {data.guestbook.length ? data.guestbook.length : ''}
          </button>
        </>
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
