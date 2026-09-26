'use client';
// Friendship (LIFE-B): friend profiles with hearts per pair, gift tastes once
// known, today's requests from offline friends (talk → request card →
// deliver), the memories album (L) and "어제 마을 소식" (the daily digest).
import { useState } from 'react';
import {
  CalendarClock,
  CalendarHeart,
  Feather,
  PartyPopper,
  PenLine,
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
import { BOND_LEVELS } from '../lounge-life-plus';
import {
  BOND_GRACE_DAYS,
  FRIEND_GIFTS,
  HEART_REWARD_KIND,
  HEART_REWARD_LABEL,
  HEART_REWARD_LEVELS,
  MY_LINES_MAX,
  MY_LINE_TEXT_MAX,
} from '../lounge-social-defs';
import { FRIEND_LINES } from '../lounge-friend-lines';
import { DISH_BY_ID, FURNITURE_BY_REF } from '../lounge-items';
import './life-plus.css';
import './friend-life.css';

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
  const [writing, setWriting] = useState(false);
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
      {!!life.social?.titles?.length && (
        <p className="l-modal-intro l-titles" data-testid="bond-titles">
          <Trophy size={14} aria-hidden="true" /> 내 칭호 · {life.social.titles.join(', ')}
        </p>
      )}
      <div className="l-bonds-body">
        <ul className="l-bond-list" aria-label="친구">
          <li>
            <button type="button" aria-pressed={writing} onClick={() => setWriting(true)} data-testid="bond-my-lines">
              <span className="l-bond-face is-icon" aria-hidden="true">
                <PenLine size={18} />
              </span>
              <span>
                <strong>내 대사 쓰기</strong>
                <small>{life.social?.lines?.[selfActor]?.length ?? 0}/{MY_LINES_MAX}줄</small>
              </span>
            </button>
          </li>
          {others.map((a) => {
            const b = life.me.bonds?.find((x) => x.actor === a);
            const req = life.me.requests?.find((r) => r.from === a && !r.done);
            return (
              <li key={a}>
                <button
                  type="button"
                  aria-pressed={!writing && actor === a}
                  onClick={() => {
                    setActor(a);
                    setWriting(false);
                  }}
                  data-testid={`bond-${a}`}
                >
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
        {writing ? (
          <MyLinesEditor
            key={(life.social?.lines?.[selfActor] ?? []).join('\n')}
            initial={life.social?.lines?.[selfActor] ?? []}
            busy={busy}
            onSave={(lines) => run({ kind: 'myLines', lines }, lines.length ? `내 NPC 대사 ${lines.length}줄을 저장했어요.` : '내 NPC 대사를 비웠어요.')}
          />
        ) : (
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
          <HeartRewards
            level={level}
            points={bond?.points ?? 0}
            friend={actor}
            granted={life.social?.hearts?.[actor]?.granted ?? 0}
            idle={life.social?.hearts?.[actor]?.idle ?? 0}
            fading={!!life.social?.hearts?.[actor]?.fading}
          />
          <p className="l-help-text">
            선물(하루 한 번), 방 방문, 친구 밭에 물 주기, 테이블 한 판, 부탁 들어주기, 마을에서 쉬고 있는 친구와 이야기하기로 추억이 쌓여요. 하트가 늘 때마다 추억 앨범(L)에 남아요.
          </p>
        </section>
        )}
      </div>
    </Modal>
  );
}

/** Heart progress and the rewards at ♥2 / 4 / 6 / 8 / 10 from this friend. */
function HeartRewards({
  level,
  points,
  friend,
  granted,
  idle,
  fading,
}: {
  level: number;
  points: number;
  friend: number;
  granted: number;
  idle: number;
  fading: boolean;
}) {
  const prev = level ? BOND_LEVELS[level - 1] : 0,
    next = BOND_LEVELS[level] ?? null;
  const share = next === null ? 1 : Math.max(0, Math.min(1, (points - prev) / (next - prev)));
  const gifts = FRIEND_GIFTS[friend];
  const what = (l: (typeof HEART_REWARD_LEVELS)[number]) => {
    const kind = HEART_REWARD_KIND[l];
    return kind === 'recipe'
      ? `${DISH_BY_ID[gifts.dish]?.name ?? '요리'} 레시피 편지와 요리 2인분`
      : kind === 'furniture'
        ? `${FURNITURE_BY_REF[gifts.furniture]?.name ?? '가구'} (우편)`
        : kind === 'room'
          ? `${FURNITURE_BY_REF[gifts.room]?.name ?? '가구'}`
          : kind === 'signature'
            ? `${FURNITURE_BY_REF[gifts.signature]?.name ?? '선물'} · 칭호 “${FRIEND_LINES[friend]?.title ?? ''}”`
            : HEART_REWARD_LABEL[kind];
  };
  return (
    <div className="l-heart-track" data-testid="heart-rewards">
      <div className="l-heart-bar">
        <span>♥{level}</span>
        <progress max={1} value={share} aria-label={next === null ? '하트를 모두 모았어요' : `다음 하트까지 ${next - points}`} />
        <span>{next === null ? '최고' : `♥${level + 1}`}</span>
      </div>
      <ol className="l-heart-rewards">
        {HEART_REWARD_LEVELS.map((l) => (
          <li key={l} data-got={granted >= l || undefined} data-next={(granted < l && level < l && l === HEART_REWARD_LEVELS.find((x) => x > level)) || undefined}>
            <b>♥{l}</b>
            <span>{what(l)}</span>
            <small>{granted >= l ? '받았어요' : level >= l ? '다음 활동 때 도착해요' : ''}</small>
          </li>
        ))}
      </ol>
      {fading ? (
        <p className="l-heart-fade" data-testid="heart-fading">
          {idle}일째 소식이 없어서 추억이 조금씩 옅어지고 있어요. 이야기하거나 선물하면 멈춰요.
        </p>
      ) : (
        <p className="l-help-text">♥6부터는 {BOND_GRACE_DAYS}일 넘게 함께한 일이 없으면 추억이 조금씩 옅어져요 (♥5 아래로는 내려가지 않아요).</p>
      )}
    </div>
  );
}

/** "내 대사 쓰기": lines friends see when they talk to my NPC while I'm away. */
function MyLinesEditor({ initial, busy, onSave }: { initial: readonly string[]; busy: boolean; onSave: (lines: string[]) => Promise<boolean> }) {
  const [lines, setLines] = useState<string[]>(initial.length ? [...initial] : ['']);
  const clean = lines.map((l) => l.trim()).filter(Boolean);
  return (
    <section className="l-bond-profile l-my-lines" data-testid="my-lines">
      <header>
        <span className="l-bond-face big is-icon" aria-hidden="true">
          <Feather size={28} />
        </span>
        <div>
          <h3>내 NPC 대사</h3>
          <small>내가 쉬는 동안 친구가 내 NPC에게 말을 걸면 이 대사를 자주 들려줘요. 한 줄 {MY_LINE_TEXT_MAX}자, 최대 {MY_LINES_MAX}줄이에요.</small>
        </div>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSave(clean);
        }}
      >
        <ol className="l-my-lines-list">
          {lines.map((line, i) => (
            <li key={i}>
              <label>
                <span className="sr-only">{i + 1}번째 대사</span>
                <input
                  value={line}
                  maxLength={MY_LINE_TEXT_MAX}
                  placeholder={i === 0 ? '예: 오늘 밭에 물 줬어? 나는 벌써 줬지!' : '한 줄 더'}
                  onChange={(e) => setLines((all) => all.map((l, j) => (j === i ? e.target.value : l)))}
                  data-testid={`my-line-${i}`}
                />
              </label>
              <button
                type="button"
                className="l-secondary"
                aria-label={`${i + 1}번째 대사 지우기`}
                onClick={() => setLines((all) => (all.length > 1 ? all.filter((_, j) => j !== i) : ['']))}
              >
                지우기
              </button>
            </li>
          ))}
        </ol>
        <div className="l-inv-actions">
          <button type="button" className="l-secondary" disabled={lines.length >= MY_LINES_MAX} onClick={() => setLines((all) => [...all, ''])}>
            <PenLine size={15} /> 줄 추가
          </button>
          <button type="submit" className="l-primary" disabled={busy} data-testid="my-lines-save">
            저장하기
          </button>
        </div>
      </form>
      <p className="l-help-text">이모지나 특수 제어 문자는 저장되지 않아요. 친구를 속상하게 하는 말은 적지 않기로 해요.</p>
    </section>
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
  festival: PartyPopper,
  museum: Landmark,
  adapt: Sparkles,
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
  festival: PartyPopper,
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
      {!!life?.social?.tomorrow?.length && (
        <section className="l-digest-tomorrow" aria-label="내일 예고" data-testid="digest-tomorrow">
          <h3>
            <CalendarClock size={15} aria-hidden="true" /> 내일 예고
          </h3>
          <ul>
            {life.social.tomorrow.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      )}
      <div className="l-modal-actions">
        <button type="button" className="l-primary" onClick={onClose} autoFocus data-testid="digest-close">
          오늘도 시작하기
        </button>
      </div>
    </Modal>
  );
}
