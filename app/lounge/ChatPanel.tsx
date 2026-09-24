'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, Users } from 'lucide-react';
import { ACTORS, ACTOR_COLORS } from '../lounge-roster';
import type { CloudRoomView, CloudRoom } from '../lounge-cloud-room';

/** The single chat UI used in the hall sidebar and the village chat modal. */
export function ChatPanel({
  room,
  view,
  title,
  className = '',
  headingLevel = 3,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  title: string;
  className?: string;
  headingLevel?: 2 | 3;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const connected = view.status === 'connected';
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [view.chat.length]);
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className={'l-chat ' + className}>
      <div>
        <Heading>{title}</Heading>
        <span>{connected ? `${view.players.length}명` : '연결 중'}</span>
      </div>
      <div className="l-chat-messages" aria-live="polite">
        {view.chat.length ? (
          view.chat.map((m) => (
            <p key={m.id}>
              <b style={{ color: ACTOR_COLORS[m.actor] }}>{ACTORS[m.actor]}</b>
              <span>{m.text}</span>
            </p>
          ))
        ) : (
          <div className="l-chat-welcome">
            <Users size={25} />
            <p>
              {connected
                ? '오늘의 첫 인사를 남겨 보세요.'
                : '마을에 연결되면 이곳에서 이야기할 수 있어요.'}
            </p>
          </div>
        )}
        <div ref={end} />
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const message = text.trim();
          if (!message || sending) return;
          setSending(true);
          // Optimistic clear; restore the text if the server refuses it.
          setText('');
          try {
            if (!(await room.action({ kind: 'chat', text: message })))
              setText((current) => current || message);
          } finally {
            setSending(false);
          }
        }}
      >
        <input
          aria-label="채팅 메시지"
          disabled={!connected}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="친구에게 한마디…"
          maxLength={120}
          enterKeyHint="send"
        />
        <button
          aria-label="보내기"
          disabled={!connected || sending || !text.trim()}
        >
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
