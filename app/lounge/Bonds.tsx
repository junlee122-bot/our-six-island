'use client';
// Friendship (LIFE-B): friend profiles with hearts per pair, gift tastes once
// known, today's requests from offline friends (talk → request card →
// deliver), the memories album (L) and "어제 마을 소식" (the daily digest).
import { useState } from 'react';
import {
  CalendarHeart,
  Droplets,
  Fish,
  Gift,
  Handshake,
  Heart,
  Landmark,
  Newspaper,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import { FRIEND_PROFILES, WEATHER_INFO } from '../lounge-calendar';
import { ACTORS } from '../lounge-roster';
import { AvatarView } from '../avatar-view';
import { formatBeom, josa } from '../lounge-text';
import { itemName } from '../lounge-life-plus';
import { bondHearts, categoryName, needHave, tastesKnown } from '../lounge-life-ui';
import { lifeSfx } from '../lounge-audio-life';
import { Modal } from './Modal';
import type { Notify } from './Toast';
import { ItemIcon } from './ItemIcon';
import { lookFor } from './friend-looks';
import { useLifeAction } from './LifePanels';
import './life-plus.css';

type Base = { room: CloudRoom; view: CloudRoomView; notify: Notify; onClose: () => void };
const dateText = (at: number) => {
  const d = new Date(at + 9 * 3_600_000);
  return `${d.getUTCFullYear()}.${d.getUTCMonth() + 1}.${d.getUTCDate()}`;
};

export function Hearts({ level, size = 14 }: { level: number; size?: number }) {
  const n = bondHearts(level);
  return (
    <span className="l-hearts" role="img" aria-label={`하트 ${n}개`}>
      {Array.from({ length: 10 }, (_, i) => (
        <Heart key={i} size={size} aria-hidden="true" fill={i < n ? '#e2574c' : 'none'} color={i < n ? '#c43d33' : '#c9bfb2'} />
      ))}
    </span>
  );
}

/** 친구 사이: every friend's hearts, tastes, status and today's request. */
export function FriendsLife({
  room,
  view,
  notify,
  onClose,
  selfActor,
  initial,
  onGift,
  onVisit,
}: Base & { selfActor: number; initial?: number; onGift: (actor: number) => void; onVisit: (actor: number) => void }) {
  const life = view.life;
  const others = ACTORS.map((_, a) => a).filter((a) => a !== selfActor);
  const [actor, setActor] = useState(initial ?? others[0]);
  const [run, busy] = useLifeAction(room, notify);
  if (!life)
    return (
      <Modal title="친구 사이" onClose={onClose}>
        <p className="l-help-text">마을에 연결되면 친구 사이를 볼 수 있어요.</p>
      </Modal>
    );
  const bond = life.me.bonds?.find((b) => b.actor === actor);
  const level = bond?.level ?? 0;
  const profile = FRIEND_PROFILES[actor];
  const known = tastesKnown(level);
  const status = Object.values(life.statuses ?? {}).find((s) => s.actor === actor);
  const request = life.me.requests?.find((r) => r.from === actor);
  const have = request ? needHave(life.me, { item: request.item }) : 0;
  const birthday = life.calendar?.events.find((e) => e.kind === 'birthday' && e.actor === actor);
  return (
    <Modal title="친구 사이" onClose={onClose} className="l-life-modal l-bonds" wide>
      <div className="l-bonds-body">
        <ul className="l-bond-list" aria-label="친구">
          {others.map((a) => {
            const b = life.me.bonds?.find((x) => x.actor === a);
            const req = life.me.requests?.find((r) => r.from === a && !r.done);
            return (
              <li key={a}>
                <button type="button" aria-pressed={actor === a} onClick={() => setActor(a)} data-testid={`bond-${a}`}>
                  <span className="l-bond-face" aria-hidden="true">
                    <AvatarView actor={a} look={lookFor(a)} portrait />
                  </span>
                  <span>
                    <strong>
                      {ACTORS[a]}
                      {req && <em className="l-req-dot">부탁</em>}
                    </strong>
                    <Hearts level={b?.level ?? 0} size={11} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <section className="l-bond-profile" aria-live="polite" data-testid="bond-profile">
          <header>
            <span className="l-bond-face big" aria-hidden="true">
              <AvatarView actor={actor} look={lookFor(actor)} portrait />
            </span>
            <div>
              <h3>
                {ACTORS[actor]} {birthday && <em className="l-badge-new">오늘 생일!</em>}
              </h3>
              <Hearts level={level} />
              <small>
                추억 {bond?.points ?? 0}
                {bond?.next ? ` · 다음 하트까지 ${bond.next - (bond.points ?? 0)}` : ' · 하트를 모두 모았어요'}
              </small>
              {status?.text && <p className="l-bond-status">“{status.text}”</p>}
            </div>
          </header>
          <dl className="l-bond-tastes">
            <dt>좋아하는 선물</dt>
            <dd>{known ? profile.likes.map(categoryName).join(', ') : '하트 하나를 모으면 알 수 있어요'}</dd>
            <dt>별로인 선물</dt>
            <dd>{known ? profile.dislikes.map(categoryName).join(', ') || '없어요' : '???'}</dd>
            <dt>생일</dt>
            <dd>{profile.birthday ? profile.birthday.replace('-', '월 ') + '일' : '아직 몰라요'}</dd>
          </dl>
          {request ? (
            <div className="l-request" data-done={request.done || undefined} data-testid="bond-request">
              <ItemIcon id={request.item} size={40} />
              <span>
                <strong>
                  오늘의 부탁 · {itemName(request.item)} {request.n}개
                </strong>
                <small>
                  {request.done ? '고마워! 부탁을 들어줬어요.' : `나는 ${have}개 · 보답 ${formatBeom(request.reward)}와 추억`}
                </small>
              </span>
              {!request.done && (
                <button
                  type="button"
                  className="l-primary"
                  disabled={busy || have < request.n}
                  onClick={() =>
                    void run({ kind: 'deliver', to: actor }, `${ACTORS[actor]}에게 ${josa(itemName(request.item), '을/를')} 전해 줬어요. 고마워해요!`).then(
                      (ok) => ok && lifeSfx('donate'),
                    )
                  }
                  data-testid="bond-deliver"
                >
                  <Handshake size={15} /> 전해 주기
                </button>
              )}
            </div>
          ) : (
            <p className="l-help-text">오늘은 {ACTORS[actor]}의 부탁이 없어요.</p>
          )}
          <div className="l-inv-actions">
            <button type="button" className="l-secondary" onClick={() => onGift(actor)} data-testid="bond-gift">
              <Gift size={15} /> 선물 보내기
            </button>
            <button type="button" className="l-secondary" onClick={() => onVisit(actor)}>
              <Users size={15} /> 방에 놀러 가기
            </button>
          </div>
          <p className="l-help-text">
            선물(하루 한 번), 방 방문, 친구 밭에 물 주기, 테이블 한 판, 부탁 들어주기로 추억이 쌓여요. 하트가 늘 때마다 추억 앨범(L)에 남아요.
          </p>
        </section>
      </div>
    </Modal>
  );
}

/** A friend NPC's request, opened by talking to them in the village. */
export function RequestCard({ room, view, notify, onClose, from }: Base & { from: number }) {
  const life = view.life;
  const [run, busy] = useLifeAction(room, notify);
  const request = life?.me.requests?.find((r) => r.from === from);
  if (!life || !request) return null;
  const have = needHave(life.me, { item: request.item });
  return (
    <Modal title={`${ACTORS[from]}의 부탁`} onClose={onClose} className="l-life-modal l-request-card">
      <div className="l-request-bubble" data-testid="request-card">
        <span className="l-bond-face big" aria-hidden="true">
          <AvatarView actor={from} look={lookFor(from)} portrait />
        </span>
        <p>
          {request.done
            ? `고마워! 덕분에 오늘 하루가 반짝였어.`
            : `혹시 ${itemName(request.item)} ${request.n}개 있어? 있으면 나눠 줄래? 보답으로 ${formatBeom(request.reward)}을 줄게!`}
        </p>
      </div>
      <div className="l-request" data-done={request.done || undefined}>
        <ItemIcon id={request.item} size={44} />
        <span>
          <strong>
            {itemName(request.item)} {request.n}개
          </strong>
          <small>
            나는 {have}개 가지고 있어요 · 보답 {formatBeom(request.reward)}
          </small>
        </span>
      </div>
      <div className="l-modal-actions">
        <button type="button" className="l-secondary" onClick={onClose}>
          {request.done ? '닫기' : '다음에'}
        </button>
        {!request.done && (
          <button
            type="button"
            className="l-primary"
            disabled={busy || have < request.n}
            onClick={() =>
              void run({ kind: 'deliver', to: from }, `${ACTORS[from]}의 부탁을 들어줬어요! +${formatBeom(request.reward)}`).then((ok) => {
                if (ok) {
                  lifeSfx('donate');
                  onClose();
                }
              })
            }
            data-testid="request-deliver"
          >
            <Handshake size={15} /> {have < request.n ? '아직 부족해요' : '전해 주기'}
          </button>
        )}
      </div>
    </Modal>
  );
}

const MEMORY_ICON: Record<string, LucideIcon> = {
  bond: Heart,
  bundle: Landmark,
  legend: Trophy,
  birthday: CalendarHeart,
};
/** 추억 앨범 (L): hearts gained, bundles restored, legends and birthdays. */
export function MemoriesAlbum({ view, onClose, selfActor }: { view: CloudRoomView; onClose: () => void; selfActor: number }) {
  const [mine, setMine] = useState(false);
  const all = [...(view.life?.memories ?? [])].reverse();
  const list = mine ? all.filter((m) => m.actors.includes(selfActor)) : all;
  return (
    <Modal title="추억 앨범" onClose={onClose} className="l-life-modal l-album" wide>
      <div className="l-mail-tabs" role="tablist" aria-label="추억">
        <button role="tab" aria-selected={!mine} onClick={() => setMine(false)}>
          마을의 추억 <small>{all.length}</small>
        </button>
        <button role="tab" aria-selected={mine} onClick={() => setMine(true)}>
          나의 추억 <small>{all.filter((m) => m.actors.includes(selfActor)).length}</small>
        </button>
      </div>
      {!list.length ? (
        <p className="l-help-text">아직 추억이 없어요. 친구와 하트를 쌓거나 꾸러미를 완성하면 여기에 남아요.</p>
      ) : (
        <ol className="l-memories" data-testid="memories">
          {list.map((m) => {
            const Icon = MEMORY_ICON[m.kind] ?? Sparkles;
            return (
              <li key={m.id} data-kind={m.kind}>
                <span className="l-memory-icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="l-memory-text">
                  <strong>{m.text}</strong>
                  <small>
                    {dateText(m.at)} · {m.actors.map((a) => ACTORS[a] ?? '친구').join(', ')}
                  </small>
                </span>
                <span className="l-memory-faces" aria-hidden="true">
                  {m.actors.slice(0, 4).map((a) => (
                    <span key={a} className="l-bond-face small">
                      <AvatarView actor={a} look={lookFor(a)} portrait />
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Modal>
  );
}

const DIGEST_ICON: Record<string, LucideIcon> = {
  water: Droplets,
  gift: Gift,
  visit: Users,
  table: Sparkles,
  bundle: Landmark,
  museum: Landmark,
  record: Fish,
  legend: Trophy,
  request: Handshake,
  bond: Heart,
};
/** "어제 마을 소식": yesterday's village lines, shown once a day on the first login. */
export function DigestCard({ view, onClose }: { view: CloudRoomView; onClose: () => void }) {
  const life = view.life;
  const digest = life?.digest;
  const d = digest ? new Date(digest.date + 'T00:00:00Z') : null;
  const weekday = d ? '일월화수목금토'[d.getUTCDay()] : '';
  return (
    <Modal title="어제 마을 소식" onClose={onClose} className="l-life-modal l-digest">
      <p className="l-modal-intro">
        <Newspaper size={15} aria-hidden="true" /> {d ? `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${weekday})` : ''}
        {life?.weather ? ` · 오늘은 ${WEATHER_INFO[life.weather.today].name}, 내일은 ${WEATHER_INFO[life.weather.tomorrow].name}` : ''}
      </p>
      {!digest?.lines.length ? (
        <p className="l-help-text" data-testid="digest-empty">
          어제는 조용한 하루였어요. 오늘은 친구 밭에 물을 주거나 낚시를 해 볼까요?
        </p>
      ) : (
        <ul className="l-digest-lines" data-testid="digest">
          {digest.lines.map((line, i) => {
            const Icon = DIGEST_ICON[line.kind] ?? Sparkles;
            return (
              <li key={i} data-kind={line.kind}>
                <Icon size={16} aria-hidden="true" />
                <span>{line.text}</span>
              </li>
            );
          })}
        </ul>
      )}
      <div className="l-modal-actions">
        <button type="button" className="l-primary" onClick={onClose} autoFocus data-testid="digest-close">
          오늘도 시작하기
        </button>
      </div>
    </Modal>
  );
}
