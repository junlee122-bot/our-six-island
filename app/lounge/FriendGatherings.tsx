'use client';
import { useId, useRef, useState, type SubmitEvent } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type { GatheringAction, GatheringView } from '../lounge-gatherings';
import {
  GATHERING_ACTIVITY_LABEL,
  GATHERING_PLACES,
  gatheringPlace,
  type GatheringActivity,
  type GatheringPlaceId,
} from '../lounge-gatherings-data';
import { ACTORS } from '../lounge-roster';
import { presenceLine } from '../lounge-presence';
import { GameButton } from '../ui/GameButton';
import { EmptyState } from '../ui/EmptyState';
import { Glyph, type GlyphName } from '../ui/Glyph';
import { Panel } from '../ui/Panel';
import { Tabs, tabPanelProps } from '../ui/Tabs';
import { ConfirmModal, Modal } from './Modal';
import type { Notify } from './Toast';
import { useServerClock } from './use-server-clock';
import './friend-gatherings.css';

type Tab = 'open' | 'create' | 'previous';
type Duration = 30 | 60 | 120;
type Pending = { gathering: GatheringView; op: 'cancel' | 'finish' };
type Tools = {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onNavigate?: (place: GatheringPlaceId) => void;
};
const ACTIVITIES: GatheringActivity[] = ['fishing', 'meal', 'table'];
const ICONS: Record<GatheringActivity, GlyphName> = {
  fishing: 'fish',
  meal: 'pot',
  table: 'dice',
};
const STATUS = {
  scheduled: '시작을 기다려요',
  running: '지금 모이는 중',
  finished: '모임을 마쳤어요',
  cancelled: '취소한 모임',
  expired: '모임 시간이 지났어요',
} as const;
const DAY = 86_400_000;
const minute = 60_000;
const nameOf = (actor: number) => ACTORS[actor] ?? '친구';
const kstInput = (at: number) =>
  new Date(at + 9 * 3_600_000).toISOString().slice(0, 16);
const parseKst = (text: string) => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return NaN;
  const at = Date.parse(`${text}:00+09:00`);
  return Number.isFinite(at) && kstInput(at) === text ? at : NaN;
};
const time = (at: number) => {
  const d = new Date(at + 9 * 3_600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${'일월화수목금토'[d.getUTCDay()]}) ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
function statusAt(g: GatheringView, now: number): GatheringView['status'] {
  if (g.status !== 'scheduled' && g.status !== 'running') return g.status;
  return now >= g.endsAt
    ? 'expired'
    : now >= g.startsAt
      ? 'running'
      : 'scheduled';
}

function GatheringCard({
  gathering: g,
  view,
  now,
  busy,
  onAction,
  onHostAction,
  onNavigate,
  previous = false,
}: {
  gathering: GatheringView;
  view: CloudRoomView;
  now: number;
  busy: boolean;
  previous?: boolean;
  onAction: (op: 'join' | 'leave') => void;
  onHostAction: (op: 'cancel' | 'finish') => void;
  onNavigate?: (place: GatheringPlaceId) => void;
}) {
  const place = gatheringPlace(g.place);
  if (!place) return null;
  const status = statusAt(g, now),
    live = status === 'scheduled' || status === 'running';
  const actor = view.life?.actors[view.self];
  const joinWhy = !live ? '이 모임의 참가 신청은 끝났어요.' : g.blockedReason;
  return (
    <Panel
      variant="note"
      title={
        <>
          <Glyph name={ICONS[place.activity]} size={22} /> {nameOf(g.host)}의
          모임 · {GATHERING_ACTIVITY_LABEL[place.activity]}
        </>
      }
      className="l-gathering-card"
      data-testid={`gathering-card-${g.id}`}
    >
      <div className="l-gathering-card-head">
        <span className="l-gathering-status" data-status={status}>
          {STATUS[status]}
        </span>
        {g.isHost && <strong className="l-gathering-own">내가 연 모임</strong>}
        {g.joined && !g.isHost && (
          <strong className="l-gathering-own">참가 신청했어요</strong>
        )}
      </div>
      <p className="l-gathering-place">
        <Glyph name="compass" size={18} />
        <strong>{place.label}</strong>
      </p>
      <p className="l-gathering-time">
        <time dateTime={new Date(g.startsAt).toISOString()}>
          {time(g.startsAt)}
        </time>{' '}
        ~{' '}
        <time dateTime={new Date(g.endsAt).toISOString()}>
          {time(g.endsAt)}
        </time>
        <small>한국 시각 · {(g.endsAt - g.startsAt) / minute}분</small>
      </p>
      {g.note && <p className="l-gathering-memo">{g.note}</p>}
      <div className="l-gathering-participants">
        <strong>
          참가 신청 {g.participants.length}/{ACTORS.length}명
        </strong>
        <ul aria-label="모임 참가 신청자">
          {g.participants.map((a) => {
            const visible = view.players.find((p) => p.actor === a);
            return (
              <li key={a}>
                <span>
                  {nameOf(a)}
                  {a === g.host ? ' · 주최' : a === actor ? ' · 나' : ''}
                </span>
                {visible && <small>{presenceLine(visible, actor)}</small>}
              </li>
            );
          })}
        </ul>
      </div>
      {previous ? (
        <p className="l-gatherings-note">
          참가 신청 기록이에요.
          {g.closedAt
            ? ` ${time(g.closedAt)}에 ${status === 'cancelled' ? '취소했어요.' : status === 'expired' ? '모임 시간이 끝났어요.' : '주최자가 모임 약속을 마쳤어요.'}`
            : ''}
        </p>
      ) : (
        <>
          <p className="l-gatherings-note">{place.hint}</p>
          <div className="l-gathering-actions">
            {!g.joined && (
              <GameButton
                size="s"
                glyph="people"
                disabled={busy || !g.canJoin || !live}
                disabledReason={joinWhy ?? '지금은 참가할 수 없어요.'}
                onClick={() => onAction('join')}
                data-testid={`gathering-join-${g.id}`}
              >
                {status === 'running' ? '늦게 합류하기' : '참가할게요'}
              </GameButton>
            )}
            {g.joined && !g.isHost && (
              <GameButton
                size="s"
                variant="ghost"
                disabled={busy || !g.canLeave || !live}
                disabledReason={
                  !live ? '모임 시간이 지났어요.' : g.blockedReason
                }
                onClick={() => onAction('leave')}
                data-testid={`gathering-leave-${g.id}`}
              >
                참가에서 빠지기
              </GameButton>
            )}
            {onNavigate && live && (
              <GameButton
                size="s"
                glyph="compass"
                onClick={() => onNavigate(g.place)}
                data-testid={`gathering-guide-${g.id}`}
              >
                장소 길 안내
              </GameButton>
            )}
            {g.isHost && status === 'scheduled' && (
              <GameButton
                size="s"
                variant="ghost"
                disabled={busy || !g.canCancel}
                disabledReason={g.blockedReason}
                onClick={() => onHostAction('cancel')}
                data-testid={`gathering-cancel-${g.id}`}
              >
                예약 취소
              </GameButton>
            )}
            {g.isHost && status === 'running' && (
              <GameButton
                size="s"
                variant="ghost"
                disabled={busy || !g.canFinish}
                disabledReason={g.blockedReason}
                onClick={() => onHostAction('finish')}
                data-testid={`gathering-finish-${g.id}`}
              >
                모임 끝내기
              </GameButton>
            )}
          </div>
          {!g.joined && (!g.canJoin || !live) && joinWhy && (
            <p className="l-gatherings-note">{joinWhy}</p>
          )}
        </>
      )}
    </Panel>
  );
}

function CreateGathering({
  view,
  now,
  busy,
  onCreate,
}: {
  view: CloudRoomView;
  now: number;
  busy: boolean;
  onCreate: (
    action: Extract<GatheringAction, { op: 'create' }>,
  ) => Promise<boolean>;
}) {
  const board = view.life?.gatherings;
  const [activity, setActivity] = useState<GatheringActivity>('fishing');
  const [place, setPlace] = useState<GatheringPlaceId>('river-fishing');
  const [when, setWhen] = useState<'now' | 'scheduled'>('now');
  const [start, setStart] = useState(() =>
    kstInput(Math.ceil((now + 3_600_000) / minute) * minute),
  );
  const [duration, setDuration] = useState<Duration>(60);
  const [note, setNote] = useState('');
  const id = useId();
  const parsed = parseKst(start),
    at = when === 'now' ? now : parsed;
  const timeProblem =
    when === 'scheduled'
      ? !Number.isFinite(parsed)
        ? '예약할 날짜와 시각을 입력해 주세요.'
        : parsed <= now
          ? '지금보다 뒤의 시각으로 예약해 주세요.'
          : parsed > now + 7 * DAY
            ? '예약은 지금부터 7일 이내에 시작할 수 있어요.'
            : undefined
      : undefined;
  const why = !board?.canCreate
    ? (board?.createBlockedReason ?? '모임을 열 수 있는지 확인하고 있어요.')
    : timeProblem;
  const definition = gatheringPlace(place);
  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || why || !definition) return;
    const ok = await onCreate({
      kind: 'gathering',
      op: 'create',
      place,
      duration,
      ...(when === 'scheduled' ? { startsAt: parsed } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    if (ok) setNote('');
  };
  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="l-gathering-create"
      data-testid="gathering-create-form"
    >
      <p className="l-gatherings-note">
        내가 연 모임은 한 번에 하나씩 진행해요. 모임을 열면 주최자도 참가
        신청자에 들어가요.
      </p>
      <div className="l-gathering-form-grid">
        <label htmlFor={`${id}-activity`}>
          함께할 활동
          <select
            id={`${id}-activity`}
            value={activity}
            onChange={(event) => {
              const next = event.target.value as GatheringActivity;
              setActivity(next);
              const first = GATHERING_PLACES.find((p) => p.activity === next);
              if (first) setPlace(first.id);
            }}
            data-testid="gathering-activity"
          >
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>
                {GATHERING_ACTIVITY_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${id}-place`}>
          모일 장소
          <select
            id={`${id}-place`}
            value={place}
            onChange={(event) =>
              setPlace(event.target.value as GatheringPlaceId)
            }
            data-testid="gathering-place"
          >
            {GATHERING_PLACES.filter((p) => p.activity === activity).map(
              (p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
      {definition && (
        <p className="l-gatherings-note">
          <Glyph name={ICONS[activity]} size={18} /> {definition.hint}
        </p>
      )}
      <fieldset className="l-gathering-when">
        <legend>언제 모일까요?</legend>
        <label>
          <input
            type="radio"
            name={`${id}-when`}
            value="now"
            checked={when === 'now'}
            onChange={() => setWhen('now')}
            data-testid="gathering-when-now"
          />{' '}
          지금 모이기
        </label>
        <label>
          <input
            type="radio"
            name={`${id}-when`}
            value="scheduled"
            checked={when === 'scheduled'}
            onChange={() => setWhen('scheduled')}
            data-testid="gathering-when-scheduled"
          />{' '}
          시각 예약하기
        </label>
      </fieldset>
      <div className="l-gathering-form-grid">
        {when === 'scheduled' && (
          <label htmlFor={`${id}-start`}>
            시작 날짜·시각 · 한국 시각
            <input
              id={`${id}-start`}
              type="datetime-local"
              value={start}
              min={kstInput(Math.ceil(now / minute) * minute)}
              max={kstInput(Math.floor((now + 7 * DAY) / minute) * minute)}
              onChange={(event) => setStart(event.target.value)}
              required
              data-testid="gathering-starts-at"
            />
          </label>
        )}
        <label htmlFor={`${id}-duration`}>
          모임 시간
          <select
            id={`${id}-duration`}
            value={duration}
            onChange={(event) =>
              setDuration(Number(event.target.value) as Duration)
            }
            data-testid="gathering-duration"
          >
            <option value={30}>30분</option>
            <option value={60}>1시간</option>
            <option value={120}>2시간</option>
          </select>
        </label>
      </div>
      <label className="l-gathering-note-label" htmlFor={`${id}-note`}>
        친구에게 한마디 <span>{note.length}/80자 · 선택</span>
        <textarea
          id={`${id}-note`}
          value={note}
          maxLength={80}
          rows={2}
          onChange={(event) => setNote(event.target.value)}
          placeholder="늦게 와도 괜찮아요. 천천히 기다릴게요."
          data-testid="gathering-note"
        />
      </label>
      {definition && Number.isFinite(at) && !timeProblem && (
        <Panel
          variant="note"
          title="이렇게 모여요"
          className="l-gathering-preview"
          data-testid="gathering-create-preview"
        >
          <p>
            <strong>{definition.label}</strong>에서{' '}
            {GATHERING_ACTIVITY_LABEL[activity]} 모임
          </p>
          <p>
            {when === 'now' ? '지금부터' : `${time(at)}부터`}{' '}
            {time(at + duration * minute)}까지 · 한국 시각
          </p>
        </Panel>
      )}
      {why && (
        <p className="l-gatherings-note" role="alert">
          {why}
        </p>
      )}
      <GameButton
        type="submit"
        glyph="people"
        disabled={busy || !!why}
        disabledReason={why}
        data-testid="gathering-create-submit"
      >
        {when === 'now' ? '지금 모임 열기' : '예약 모임 열기'}
      </GameButton>
    </form>
  );
}

export function FriendGatheringsBody({
  room,
  view,
  notify,
  onNavigate,
  numberKeys = false,
}: Tools & { numberKeys?: boolean }) {
  const board = view.life?.gatherings;
  const [tab, setTab] = useState<Tab>('open');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const deadlines = [...(board?.open ?? [])].flatMap((g) => [
    g.startsAt,
    g.endsAt,
  ]);
  const now = useServerClock(view.clockOffset, deadlines, 15_000);
  const id = useId();
  const run = async (action: GatheringAction, message: string) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true);
    try {
      const ok = await room.life(action);
      if (ok) notify(message);
      return ok;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const joinOrLeave = (g: GatheringView, op: 'join' | 'leave') =>
    void run(
      { kind: 'gathering', op, id: g.id },
      op === 'join'
        ? '모임에 참가 신청했어요. 장소 길 안내로 찾아가요.'
        : '모임 참가 신청에서 빠졌어요.',
    );
  const create = async (action: Extract<GatheringAction, { op: 'create' }>) => {
    const ok = await run(action, '친구들과 모일 약속을 열었어요.');
    if (ok) setTab('open');
    return ok;
  };
  const confirm = () =>
    pending
      ? run(
          { kind: 'gathering', op: pending.op, id: pending.gathering.id },
          pending.op === 'cancel'
            ? '예약 모임을 취소했어요.'
            : '모임을 마쳤어요.',
        )
      : false;
  const card = (g: GatheringView, previous = false) => (
    <GatheringCard
      key={g.id}
      gathering={g}
      view={view}
      now={now}
      busy={busy}
      previous={previous}
      onAction={(op) => joinOrLeave(g, op)}
      onHostAction={(op) => setPending({ gathering: g, op })}
      onNavigate={onNavigate}
    />
  );
  return (
    <>
      <div className="l-friend-gatherings" data-testid="friend-gatherings">
        <p className="l-gatherings-intro">
          친구가 여는 낚시·식사·테이블 모임이에요. 편한 시간에 참가 신청하고,
          모일 시간이 되면 장소로 찾아가요.
        </p>
        <p className="l-gatherings-note">
          참가 신청은 약속을 남기는 표시예요. 식사와 테이블 게임은 도착한 뒤
          기존 화면에서 직접 즐겨요.
        </p>
        <Tabs
          items={[
            {
              id: 'open',
              label: '열린 모임',
              glyph: 'people',
              badge: board?.open.length ? ` · ${board.open.length}` : undefined,
            },
            { id: 'create', label: '모임 열기', glyph: 'plus' },
            { id: 'previous', label: '지난 모임', glyph: 'book' },
          ]}
          value={tab}
          onChange={setTab}
          label="친구 모임 쪽"
          idBase={id}
          numberKeys={numberKeys}
        />
        <output className="l-gatherings-live" aria-live="polite">
          {busy ? '모임 약속을 바꾸고 있어요…' : ''}
        </output>
        {!board ? (
          <EmptyState
            glyph="people"
            title="친구들의 모임을 확인하고 있어요"
            hint="마을에 연결되면 모임 약속이 보여요."
          />
        ) : (
          <section {...tabPanelProps(id, tab)}>
            {tab === 'open' ? (
              !board.open.length ? (
                <EmptyState
                  glyph="people"
                  title="지금 열린 모임은 없어요"
                  hint="모임 열기 쪽에서 친구들과의 약속을 만들어 보세요."
                />
              ) : (
                <div className="l-gatherings-list">
                  {board.open.map((g) => card(g))}
                </div>
              )
            ) : tab === 'create' ? (
              <CreateGathering
                view={view}
                now={now}
                busy={busy}
                onCreate={create}
              />
            ) : (
              <>
                <p className="l-gatherings-note">
                  최근 7일의 모임 약속을 최대 16개까지 보여 줘요. 참가 신청자와
                  모임 상태가 남아요.
                </p>
                {!board.previous.length ? (
                  <EmptyState glyph="book" title="아직 지난 모임이 없어요" />
                ) : (
                  <div className="l-gatherings-list">
                    {board.previous.map((g) => card(g, true))}
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
      {pending && (
        <ConfirmModal
          title={
            pending.op === 'cancel'
              ? '예약 모임을 취소할까요?'
              : '모임을 마칠까요?'
          }
          body={
            <p>
              <strong>{gatheringPlace(pending.gathering.place)?.label}</strong>
              에서 열기로 한 모임 약속을{' '}
              {pending.op === 'cancel' ? '취소해요.' : '마무리해요.'}
            </p>
          }
          consequences={
            pending.op === 'cancel'
              ? ['참가 신청한 친구들의 모임 목록에도 취소로 표시돼요.']
              : [
                  '모임 목록에 마친 약속으로 남아요.',
                  '장소에서 즐기던 활동은 계속할 수 있어요.',
                ]
          }
          confirmLabel={
            pending.op === 'cancel' ? '예약 취소하기' : '모임 마치기'
          }
          busyLabel="바꾸는 중…"
          onConfirm={confirm}
          onClose={() => setPending(null)}
        />
      )}
    </>
  );
}

export function FriendGatheringsPanel({
  room,
  view,
  notify,
  onClose,
  onNavigate,
}: Tools & { onClose: () => void }) {
  return (
    <Modal
      title="친구가 여는 모임"
      wide
      onClose={onClose}
      className="l-friend-gatherings-modal"
      keyHints={[{ keys: [{ label: '1–3' }], does: '쪽 넘기기' }]}
    >
      <FriendGatheringsBody
        room={room}
        view={view}
        notify={notify}
        onNavigate={onNavigate}
        numberKeys
      />
    </Modal>
  );
}
