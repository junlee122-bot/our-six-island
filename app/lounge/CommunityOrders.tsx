'use client';
import { useId, useRef, useState, type SubmitEvent } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import type {
  CommunityOrderAction,
  CommunityOrderLineView,
  CommunityOrderView,
  CommunityOrdersView,
} from '../lounge-community-orders';
import {
  COMMUNITY_ORDER_DIFFICULTY,
  communityOrderItemKind,
  communityOrderItemName,
  communityOrderItemSource,
  type CommunityOrderDef,
} from '../lounge-community-orders-data';
import { ACTORS } from '../lounge-roster';
import { QUALITY_LABEL } from '../lounge-life-ui';
import { josa } from '../lounge-text';
import { EmptyState } from '../ui/EmptyState';
import { GameButton } from '../ui/GameButton';
import { Glyph } from '../ui/Glyph';
import { Panel } from '../ui/Panel';
import { Tabs, tabPanelProps } from '../ui/Tabs';
import { ConfirmModal, Modal } from './Modal';
import { ItemIcon } from './ItemIcon';
import type { Notify } from './Toast';
import { useServerClock } from './use-server-clock';
import './community-orders.css';

type Tab = 'order' | 'contributions' | 'previous';
type Source = 'personal' | 'shared';
type Pending =
  | { kind: 'choose'; week: number; order: CommunityOrderDef }
  | {
      kind: 'shared';
      week: number;
      line: CommunityOrderLineView;
      n: number;
      done: () => void;
    };
const SOURCE = { personal: '내 가방·저장고', shared: '공동 창고' } as const;
const nameOf = (actor: number) => ACTORS[actor] ?? '친구';
const personalSource = (item: string) =>
  communityOrderItemSource(item) === 'private' ? '개인 저장고' : '내 가방';
const number = (n: number) => n.toLocaleString('ko-KR');
const quality = (q: number) =>
  q > 0 ? `${QUALITY_LABEL[q as 1 | 2 | 3]} 이상` : '품질 제한 없음';
const time = (at: number) => {
  const d = new Date(at + 9 * 3_600_000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
const quantityOf = (text: string) =>
  /^\d+$/.test(text) && Number.isSafeInteger(Number(text)) && Number(text) > 0
    ? Number(text)
    : 0;

function Reward({ order }: { order: CommunityOrderDef }) {
  return (
    <p className="l-community-reward">
      <Glyph name="gift" size={20} />
      <span>완료 보상 · {order.reward.label}</span>
    </p>
  );
}

function Candidate({
  order,
  busy,
  ended,
  onChoose,
}: {
  order: CommunityOrdersView['candidates'][number];
  busy: boolean;
  ended: boolean;
  onChoose: () => void;
}) {
  const why = ended
    ? '이번 주 주문을 고를 시간이 지났어요.'
    : order.lockedReason;
  return (
    <Panel
      variant="note"
      title={order.title}
      className="l-community-candidate"
      data-testid={`community-candidate-${order.id}`}
    >
      <p>
        <strong>{COMMUNITY_ORDER_DIFFICULTY[order.difficulty]}</strong> ·{' '}
        {order.note}
      </p>
      <ul className="l-community-needs" aria-label={`${order.title} 주문 품목`}>
        {order.needs.map((need, i) => (
          <li key={i}>
            <ItemIcon id={need.item} size={28} />
            <span>
              {communityOrderItemName(need.item)} {number(need.n)}개<br />
              <small>{quality(need.q ?? 0)}</small>
            </span>
          </li>
        ))}
      </ul>
      <Reward order={order} />
      <GameButton
        size="s"
        glyph="check"
        disabled={busy || !!why}
        disabledReason={why}
        onClick={onChoose}
        data-testid={`community-choose-${order.id}`}
      >
        이번 주 주문으로 고르기
      </GameButton>
      {why && <p className="l-community-note">{why}</p>}
    </Panel>
  );
}

function DeliveryLine({
  entry,
  order,
  actor,
  busy,
  ended,
  onAssign,
  onDeliver,
}: {
  entry: CommunityOrderLineView;
  order: CommunityOrderView;
  actor: number;
  busy: boolean;
  ended: boolean;
  onAssign: (assigned: boolean) => void;
  onDeliver: (n: number, source: Source, done: () => void) => void;
}) {
  const [source, setSource] = useState<Source>('personal');
  const [draft, setDraft] = useState('1');
  const n = quantityOf(draft),
    have = entry.have[source],
    max = Math.min(have, entry.remaining);
  const done = entry.remaining <= 0,
    mine = entry.assigned === actor,
    sharedSupported = communityOrderItemKind(entry.item) === 'crop';
  const stopped = ended || !!order.completedAt;
  const why = stopped
    ? '이 주문의 납품은 끝났어요.'
    : done
      ? '이 품목은 모두 모였어요.'
      : !have
        ? `${SOURCE[source]}에 납품할 품질의 물건이 없어요.`
        : !n
          ? '납품할 수량을 입력해 주세요.'
          : n > max
            ? `지금은 ${number(max)}개까지 납품할 수 있어요.`
            : undefined;
  const assignWhy =
    stopped || done
      ? '이 품목의 납품은 끝났어요.'
      : entry.assigned !== undefined && !mine
        ? `${josa(nameOf(entry.assigned), '이/가')} 맡은 품목이에요. 누구나 납품할 수 있어요.`
        : undefined;
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || why) return;
    onDeliver(n, source, () => {
      setDraft('1');
      setSource('personal');
    });
  };
  return (
    <li
      className="l-community-slot"
      data-testid={`community-line-${entry.line}`}
    >
      <div className="l-community-slot-head">
        <div className="l-community-item-name">
          <ItemIcon id={entry.item} size={40} />
          <div>
            <strong>{communityOrderItemName(entry.item)}</strong>
            <small>{quality(entry.q)}</small>
          </div>
        </div>
        <div className="l-community-assignment">
          <span>
            {entry.assigned === undefined
              ? '아직 맡은 친구가 없어요'
              : `${josa(nameOf(entry.assigned), '이/가')} 맡았어요`}
          </span>
          <GameButton
            size="s"
            variant="ghost"
            disabled={busy || !!assignWhy}
            disabledReason={assignWhy}
            onClick={() => onAssign(!mine)}
            aria-pressed={mine}
            data-testid={`community-assign-${entry.line}`}
          >
            {mine ? '맡음 해제' : '내가 맡기'}
          </GameButton>
        </div>
      </div>
      <p className="l-community-slot-progress">
        <strong>
          {number(entry.delivered)} / {number(entry.n)}개 납품
        </strong>{' '}
        · {done ? '다 모였어요' : `남은 수량 ${number(entry.remaining)}개`}
      </p>
      <div className="l-community-stock">
        <span>
          {personalSource(entry.item)} {number(entry.have.personal)}개
        </span>
        {sharedSupported && (
          <span>공동 창고 {number(entry.have.shared)}개</span>
        )}
      </div>
      {!stopped && !done && (
        <>
          <form className="l-community-delivery" onSubmit={submit}>
            <label>
              가져올 곳
              <select
                value={source}
                onChange={(event) => {
                  setSource(event.target.value as Source);
                  setDraft('1');
                }}
                data-testid={`community-source-${entry.line}`}
              >
                <option value="personal">{personalSource(entry.item)}</option>
                {sharedSupported && (
                  <option value="shared">공동 창고 · 확인 후 사용</option>
                )}
              </select>
            </label>
            <label>
              납품 수량
              <input
                type="number"
                min={1}
                max={Math.max(1, max)}
                step={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                data-testid={`community-quantity-${entry.line}`}
              />
            </label>
            <GameButton
              type="submit"
              size="s"
              glyph="basket"
              disabled={busy || !!why}
              disabledReason={why}
              data-testid={`community-deliver-${entry.line}`}
            >
              {source === 'shared' ? '공동 창고 납품 확인' : '납품하기'}
            </GameButton>
            <GameButton
              size="s"
              variant="ghost"
              disabled={busy || max < 1}
              onClick={() => setDraft(String(max))}
              data-testid={`community-max-${entry.line}`}
            >
              가능한 {number(max)}개
            </GameButton>
          </form>
          <p className="l-community-note">
            {source === 'shared'
              ? '공동 창고의 작물을 사용해요. 납품 전에 품목과 수량을 한 번 더 확인해요.'
              : `${personalSource(entry.item)}에서 가져와요.`}{' '}
            조건에 맞는 낮은 품질부터 사용해요.
          </p>
          {why && <output className="l-community-empty-source">{why}</output>}
        </>
      )}
      <p className="l-community-contributors">
        보탠 친구:{' '}
        {order.contributions
          .filter((c) => c.items[entry.line] > 0)
          .map(
            (c) =>
              `${nameOf(c.actor)} ${number(c.items[entry.line])}개${c.shared[entry.line] ? ` (공동 ${number(c.shared[entry.line])}개)` : ''}`,
          )
          .join(' · ') || '첫 납품을 기다리고 있어요'}
      </p>
    </li>
  );
}

function Claim({
  order,
  busy,
  ended = false,
  onClaim,
}: {
  order: CommunityOrderView;
  busy: boolean;
  ended?: boolean;
  onClaim: () => void;
}) {
  if (!order.completedAt)
    return (
      <div>
        <Reward order={order.order} />
        <p className="l-community-note">
          {order.expired || ended
            ? '마감 전까지 완성하지 못했어요.'
            : '모든 품목을 채우면 납품한 친구가 각자 완료 보상을 받을 수 있어요.'}
        </p>
      </div>
    );
  return (
    <div className="l-community-claim-head">
      <div>
        <Reward order={order.order} />
        <p className="l-community-note">
          {order.claimed
            ? '내 보상을 이미 받았어요.'
            : order.canClaim
              ? '내가 보탠 주문이 완성됐어요. 보상을 받아 가세요.'
              : '이 주문에 납품한 친구에게 완료 보상이 돌아가요.'}
        </p>
      </div>
      <GameButton
        size="s"
        glyph="gift"
        disabled={busy || !order.canClaim}
        onClick={onClaim}
        data-testid={`community-claim-${order.week}`}
      >
        {order.claimed ? '수령 완료' : '내 보상 받기'}
      </GameButton>
    </div>
  );
}

function ContributionLog({ order }: { order: CommunityOrderView }) {
  return (
    <>
      <h3>{order.order.title} · 보탠 친구들</h3>
      {!order.contributions.length ? (
        <EmptyState
          glyph="basket"
          title="첫 납품을 기다리고 있어요"
          hint="접속하는 시간이 달라도 조금씩 이어서 보탤 수 있어요."
        />
      ) : (
        <>
          <ul className="l-community-needs" aria-label="친구별 기여 합계">
            {order.contributions.map((c) => (
              <li key={c.actor}>
                <Glyph name="user" size={20} />
                <span>
                  <strong>{nameOf(c.actor)}</strong> · 총 {number(c.total)}개
                  {c.shared.some((n) => n > 0)
                    ? ` · 공동 창고 ${number(c.shared.reduce((sum, n) => sum + n, 0))}개 포함`
                    : ''}
                </span>
              </li>
            ))}
          </ul>
          <div className="l-community-log-wrap">
            <table
              className="l-community-log"
              aria-label="공동 주문 납품 기록"
              data-testid="community-contribution-log"
            >
              <thead>
                <tr>
                  <th scope="col">납품 시각</th>
                  <th scope="col">친구</th>
                  <th scope="col">품목</th>
                  <th scope="col">가져온 곳</th>
                  <th scope="col">수량</th>
                </tr>
              </thead>
              <tbody>
                {[...order.log].reverse().map((log, i) => (
                  <tr key={`${log.at}:${log.actor}:${i}`}>
                    <td>
                      <time dateTime={new Date(log.at).toISOString()}>
                        {time(log.at)}
                      </time>
                    </td>
                    <td>{nameOf(log.actor)}</td>
                    <td>
                      {communityOrderItemName(
                        order.order.needs[log.line]?.item ?? '',
                      )}
                    </td>
                    <td>
                      {log.source === 'shared'
                        ? SOURCE.shared
                        : personalSource(
                            order.order.needs[log.line]?.item ?? '',
                          )}
                    </td>
                    <td>{number(log.n)}개</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="l-community-note">
            시각은 한국 시각이에요. 최근 납품 기록을 보여 주며 기여 합계에는
            전체 납품이 남아요. 공동 창고 사용도 따로 표시해요.
          </p>
        </>
      )}
    </>
  );
}

export function CommunityOrdersBody({
  room,
  view,
  notify,
  numberKeys = false,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  /** The surrounding village board owns its own number shortcuts. */
  numberKeys?: boolean;
}) {
  const board = view.life?.communityOrders;
  const [tab, setTab] = useState<Tab>('order');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const now = useServerClock(view.clockOffset, [board?.endsAt], 30_000);
  const actor = view.life?.actors[view.self] ?? -1;
  const ended = !!board && now >= board.endsAt;
  const run = async (action: CommunityOrderAction, message: string) => {
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
  const deliver = (
    order: CommunityOrderView,
    line: CommunityOrderLineView,
    n: number,
    source: Source,
    done: () => void,
  ) => {
    if (source === 'shared')
      setPending({ kind: 'shared', week: order.week, line, n, done });
    else
      void run(
        {
          kind: 'communityOrder',
          op: 'deliver',
          week: order.week,
          line: line.line,
          n,
          source,
        },
        '공동 주문서에 보탰어요.',
      ).then((ok) => {
        if (ok) done();
      });
  };
  const claim = (order: CommunityOrderView) =>
    void run(
      { kind: 'communityOrder', op: 'claim', week: order.week },
      `${order.order.reward.label} 보상을 받았어요.`,
    );
  const confirm = async () => {
    if (!pending) return false;
    if (pending.kind === 'choose')
      return run(
        {
          kind: 'communityOrder',
          op: 'choose',
          week: pending.week,
          order: pending.order.id,
        },
        '이번 주 공동 주문을 골랐어요. 친구들과 조금씩 채워 봐요.',
      );
    const ok = await run(
      {
        kind: 'communityOrder',
        op: 'deliver',
        week: pending.week,
        line: pending.line.line,
        n: pending.n,
        source: 'shared',
        confirmShared: true,
      },
      '공동 창고에서 공동 주문서에 보탰어요.',
    );
    if (ok) pending.done();
    return ok;
  };
  const active = board?.active;
  const filled =
    active?.lines.reduce((sum, line) => sum + line.delivered, 0) ?? 0;
  const total = active?.lines.reduce((sum, line) => sum + line.n, 0) ?? 0;
  const unclaimed =
    board?.previous.filter((order) => order.canClaim).length ?? 0;
  const id = useId();
  return (
    <>
      <div className="l-community-orders" data-testid="community-orders">
        <p className="l-community-intro">
          이번 주 세 가지 주문 중 하나를 골라 함께 채워요. 서로 다른 시간에
          접속해도 품목을 맡고 조금씩 납품할 수 있어요.
        </p>
        {board && (
          <p className="l-community-deadline">
            <Glyph name="timer" size={18} />
            {time(board.startsAt)}부터 {time(board.endsAt)}까지 · 한국 시각
            {ended ? ' · 마감' : ''}
          </p>
        )}
        <Tabs
          items={[
            { id: 'order', label: '이번 주 주문', glyph: 'checklist' },
            { id: 'contributions', label: '기여 내역', glyph: 'people' },
            {
              id: 'previous',
              label: '지난 주문',
              glyph: 'gift',
              badge: unclaimed > 0 ? ` · 미수령 ${unclaimed}` : undefined,
            },
          ]}
          value={tab}
          onChange={setTab}
          label="공동 주문서 쪽"
          idBase={id}
          numberKeys={numberKeys}
        />
        <output className="l-community-live" aria-live="polite">
          {busy ? '주문서를 바꾸고 있어요…' : ''}
        </output>
        {!board ? (
          <EmptyState
            glyph="letter"
            title="공동 주문서를 불러오고 있어요"
            hint="마을에 연결되면 이번 주 주문이 보여요."
          />
        ) : (
          <div {...tabPanelProps(id, tab)}>
            {tab === 'order' ? (
              active ? (
                <Panel
                  variant="note"
                  title={active.order.title}
                  className="l-community-current"
                  data-testid="community-active-order"
                >
                  <p className="l-community-note">
                    {active.order.note} ·{' '}
                    {josa(nameOf(active.chosenBy), '이/가')} 골랐어요.
                  </p>
                  <p className="l-community-status">
                    <Glyph
                      name={
                        active.completedAt
                          ? 'check'
                          : active.expired || ended
                            ? 'timer'
                            : 'basket'
                      }
                      size={20}
                    />
                    <strong>
                      {active.completedAt
                        ? '주문 완료'
                        : active.expired || ended
                          ? '주문 마감'
                          : '함께 채우는 중'}
                    </strong>
                    {active.completedAt && (
                      <span>{time(active.completedAt)} 완성</span>
                    )}
                  </p>
                  <div className="l-community-progress">
                    <progress
                      max={Math.max(1, total)}
                      value={filled}
                      aria-label="공동 주문 전체 납품 수량"
                    />
                    <span>
                      {number(filled)} / {number(total)}개
                    </span>
                  </div>
                  <p className="l-community-note">
                    담당은 친구에게 알려 두는 표시예요. 누가 맡았든 누구나
                    납품할 수 있어요.
                  </p>
                  <ul className="l-community-slots">
                    {active.lines.map((line) => (
                      <DeliveryLine
                        key={`${active.week}:${line.line}`}
                        entry={line}
                        order={active}
                        actor={actor}
                        busy={busy}
                        ended={ended || active.expired}
                        onAssign={(assigned) =>
                          void run(
                            {
                              kind: 'communityOrder',
                              op: 'assign',
                              week: active.week,
                              line: line.line,
                              assigned,
                            },
                            assigned
                              ? '이 품목을 맡았어요.'
                              : '품목의 맡음을 해제했어요.',
                          )
                        }
                        onDeliver={(n, source, done) =>
                          deliver(active, line, n, source, done)
                        }
                      />
                    ))}
                  </ul>
                  <Claim
                    order={active}
                    busy={busy}
                    ended={ended}
                    onClaim={() => claim(active)}
                  />
                </Panel>
              ) : (
                <>
                  <p className="l-community-note">
                    친구 중 한 명이 고르면 이번 주 주문이 정해져요. 필요한
                    품목과 보상을 함께 살펴보세요.
                  </p>
                  <div className="l-community-candidates">
                    {board.candidates.map((order) => (
                      <Candidate
                        key={order.id}
                        order={order}
                        busy={busy}
                        ended={ended}
                        onChoose={() =>
                          setPending({
                            kind: 'choose',
                            week: board.week,
                            order,
                          })
                        }
                      />
                    ))}
                  </div>
                </>
              )
            ) : tab === 'contributions' ? (
              active ? (
                <ContributionLog order={active} />
              ) : (
                <EmptyState
                  glyph="basket"
                  title="아직 이번 주 주문을 고르지 않았어요"
                  hint="이번 주 주문 쪽에서 함께 채울 주문을 골라 보세요."
                />
              )
            ) : (
              <>
                <p className="l-community-note">
                  최근 {board.historyWeeks}주의 주문이에요. 완성한 주문에서 내
                  미수령 보상을 받을 수 있어요.
                </p>
                {!board.previous.length ? (
                  <EmptyState
                    glyph="book"
                    title="아직 지난 주문이 없어요"
                    hint="이번 주에 보탠 기록은 다음 주에도 여기서 확인할 수 있어요."
                  />
                ) : (
                  <div className="l-community-claims">
                    {board.previous.map((order) => (
                      <Panel
                        variant="note"
                        title={order.order.title}
                        key={order.week}
                        data-testid={`community-previous-${order.week}`}
                      >
                        <p className="l-community-status">
                          <strong>
                            {order.completedAt ? '완료' : '기간 만료'}
                          </strong>{' '}
                          · {time(order.chosenAt)}에 고른 주문
                        </p>
                        <p className="l-community-note">
                          {order.lines
                            .map(
                              (line) =>
                                `${communityOrderItemName(line.item)} ${number(line.delivered)}/${number(line.n)}개`,
                            )
                            .join(' · ')}
                        </p>
                        <Claim
                          order={order}
                          busy={busy}
                          onClaim={() => claim(order)}
                        />
                        <details>
                          <summary>기여 기록 보기</summary>
                          <ContributionLog order={order} />
                        </details>
                      </Panel>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {pending && (
        <ConfirmModal
          title={
            pending.kind === 'choose'
              ? '이번 주 공동 주문 고르기'
              : '공동 창고에서 납품할까요?'
          }
          body={
            pending.kind === 'choose' ? (
              <p>
                이번 주에는 <strong>{pending.order.title}</strong> 주문을 함께
                채울까요?
              </p>
            ) : (
              <p>
                친구들이 함께 쓰는 공동 창고의{' '}
                <strong>
                  {communityOrderItemName(pending.line.item)} 최대{' '}
                  {number(pending.n)}개
                </strong>
                를 이 주문에 사용해요. {quality(pending.line.q)}.
              </p>
            )
          }
          consequences={
            pending.kind === 'choose'
              ? [
                  '고른 주문은 이번 주 마감까지 함께 진행해요.',
                  '납품한 물건은 주문에 사용되며 되돌려 받을 수 없어요.',
                ]
              : [
                  '공동 창고에서 물건이 줄고 공동 주문의 납품 수량에 더해져요.',
                  '다른 친구가 먼저 채웠다면 남은 수량만 납품해요.',
                  '기여 기록에 공동 창고 사용으로 남아요.',
                ]
          }
          confirmLabel={
            pending.kind === 'choose'
              ? '이 주문으로 정하기'
              : `공동 창고에서 최대 ${number(pending.n)}개 납품`
          }
          busyLabel="전하는 중…"
          onClose={() => setPending(null)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}

export function CommunityOrdersPanel({
  room,
  view,
  notify,
  onClose,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
}) {
  return (
    <Modal
      title="친구 공동 주문서"
      wide
      onClose={onClose}
      className="l-community-orders-modal"
      keyHints={[{ keys: [{ label: '1–3' }], does: '쪽 넘기기' }]}
    >
      <CommunityOrdersBody room={room} view={view} notify={notify} numberKeys />
    </Modal>
  );
}
