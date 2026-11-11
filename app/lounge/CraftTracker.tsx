'use client';
import { useMemo, useRef, useState, type SubmitEvent } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  craftTracker,
  craftTargetOptions,
  additionalCraftTarget,
  readCraftTargets,
  targetKey,
  type CraftMaterial,
  type CraftProduction,
  type CraftTargetKind,
  type CraftTargetPlan,
} from '../lounge-craft-tracker';
import { QUALITY_LABEL } from '../lounge-life-ui';
import { formatBeom } from '../lounge-text';
import { GameButton } from '../ui/GameButton';
import { EmptyState } from '../ui/EmptyState';
import { Panel } from '../ui/Panel';
import { Glyph } from '../ui/Glyph';
import type { Notify } from './Toast';
import { useServerClock } from './use-server-clock';
import './craft-tracker.css';

type Tools = { room: CloudRoom; view: CloudRoomView; notify: Notify };
const KIND_NAMES: Record<CraftTargetKind, string> = {
  cook: '요리',
  craft: '가구·만들기',
  farm: '농장 설비',
  facility: '시설 보유',
  good: '가공품',
};
const KINDS = Object.keys(KIND_NAMES) as CraftTargetKind[];
const number = (n: number) => n.toLocaleString('ko-KR');
const amount = (row: CraftMaterial, n: number) =>
  row.id === 'beom' ? formatBeom(n) : number(n);
const quantityOf = (s: string) =>
  /^\d+$/.test(s) && Number(s) >= 1 && Number(s) <= 999 ? Number(s) : null;

function MaterialTable({
  rows,
  label,
}: {
  rows: CraftMaterial[];
  label: string;
}) {
  if (!rows.length)
    return <p className="l-craft-note">더 준비할 재료가 없어요.</p>;
  return (
    <div className="l-craft-table-wrap">
      <table className="l-craft-table" aria-label={label}>
        <thead>
          <tr>
            <th scope="col">재료</th>
            <th scope="col">필요</th>
            <th scope="col">내 보유</th>
            <th scope="col">공동 창고</th>
            <th scope="col">더 준비</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} data-short={row.missing > 0 || undefined}>
              <th scope="row">
                {row.name}
                {row.quality > 0 && (
                  <small>{QUALITY_LABEL[row.quality]} 이상</small>
                )}
              </th>
              <td>{amount(row, row.required)}</td>
              <td>
                {amount(row, row.owned)}
                {row.private > 0 && (
                  <small>
                    가방 {number(row.bag)} · 저장고 {number(row.private)}
                  </small>
                )}
                {row.queued > 0 && <small>가공 중 {number(row.queued)}</small>}
                {row.planned > 0 && (
                  <small>다른 제작 뒤 남는 몫 {number(row.planned)}</small>
                )}
              </td>
              <td>{row.id === 'beom' ? '—' : number(row.shared)}</td>
              <td>
                <strong>{amount(row, row.missing)}</strong>
                {row.batches > 0 && (
                  <small>{number(row.batches)}번 만들어야 해요</small>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MaterialTree({ rows }: { rows: CraftMaterial[] }) {
  return (
    <ul className="l-craft-tree">
      {rows.map((row, i) => (
        <li key={`${row.key}:${i}`}>
          <span>
            {row.name}
            {row.quality > 0
              ? ` · ${QUALITY_LABEL[row.quality]} 이상`
              : ''}{' '}
            {amount(row, row.required)}
          </span>
          <small>
            내 몫 {amount(row, row.allocated)}
            {row.queued ? ` · 가공 중 ${number(row.queued)}` : ''}
            {row.planned ? ` · 앞선 제작 후 ${number(row.planned)}` : ''}
            {row.missing
              ? ` · 더 준비 ${amount(row, row.missing)}`
              : row.allocated >= row.required
                ? ' · 준비됨'
                : row.planned > 0
                  ? ' · 앞선 제작 뒤 확보'
                  : ' · 수령 대기'}
          </small>
          {row.warnings.map((warning) => (
            <p className="l-craft-note" key={warning}>
              {warning}
            </p>
          ))}
          {row.children.length > 0 && <MaterialTree rows={row.children} />}
        </li>
      ))}
    </ul>
  );
}

function ProductionList({
  rows,
  now,
}: {
  rows: CraftProduction[];
  now: number;
}) {
  if (!rows.length) return null;
  return (
    <ul className="l-craft-production" aria-label="가공 중인 재료">
      {rows.map((row) => {
        const ready = row.readyAt <= now;
        const at = new Date(row.readyAt + 9 * 3_600_000);
        const clock = `${at.getUTCMonth() + 1}/${at.getUTCDate()} ${String(at.getUTCHours()).padStart(2, '0')}:${String(at.getUTCMinutes()).padStart(2, '0')}`;
        return (
          <li key={row.slot}>
            <Glyph name="timer" size={16} />
            <span>
              {row.name} {number(row.quantity)}개 ·{' '}
              {ready ? '수령할 수 있어요' : `${clock} 완료 예정 (한국 시각)`}
              {row.allocated > 0
                ? ` · 목표에 필요한 ${number(row.allocated)}개`
                : ''}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function GoalCard({
  plan,
  room,
  notify,
  now,
}: Tools & { plan: CraftTargetPlan; now: number }) {
  const [edited, setEdited] = useState<string | null>(null);
  const draft = edited ?? String(plan.target.quantity);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const quantity = quantityOf(draft);
  const update = async (op: 'quantity' | 'remove') => {
    if (
      pending.current ||
      (op === 'quantity' && (!quantity || quantity === plan.target.quantity))
    )
      return;
    pending.current = true;
    setBusy(true);
    try {
      if (
        await room.life({
          kind: 'craftTarget',
          op,
          target: {
            ...plan.target,
            quantity: op === 'quantity' ? quantity! : plan.target.quantity,
          },
        })
      ) {
        setEdited(null);
        notify(
          op === 'remove'
            ? '제작 목표의 고정을 풀었어요.'
            : '목표 수량을 바꿨어요.',
        );
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const status = plan.complete
    ? '목표 수량 보유'
    : plan.queued >= plan.missing
      ? '가공품 수령 대기'
      : plan.ready
        ? '재료 준비됨'
        : '재료 준비 중';
  return (
    <Panel
      variant="note"
      title={plan.name}
      className="l-craft-goal"
      data-testid={`craft-goal-${plan.target.kind}-${plan.target.id}`}
    >
      <div className="l-craft-goal-head">
        <p>
          <strong>
            {number(plan.owned)} / {number(plan.target.quantity)}
          </strong>{' '}
          {plan.target.kind === 'facility' ? '곳 보유' : '개 보유'} · {status}
        </p>
        <GameButton
          size="s"
          variant="ghost"
          disabled={busy}
          onClick={() => void update('remove')}
          aria-label={`${plan.name} 목표 고정 해제`}
          data-testid={`craft-remove-${plan.target.kind}-${plan.target.id}`}
        >
          고정 해제
        </GameButton>
      </div>
      {plan.target.kind !== 'facility' && (
        <form
          className="l-craft-quantity"
          onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
            event.preventDefault();
            void update('quantity');
          }}
        >
          <label>
            보유 목표 수량{' '}
            <input
              type="number"
              min={1}
              max={999}
              step={1}
              value={draft}
              onChange={(event) => setEdited(event.target.value)}
              aria-label={`${plan.name} 목표 수량`}
              data-testid={`craft-quantity-${plan.target.kind}-${plan.target.id}`}
            />
          </label>
          <GameButton
            type="submit"
            size="s"
            disabled={busy || !quantity || quantity === plan.target.quantity}
          >
            수량 바꾸기
          </GameButton>
        </form>
      )}
      {plan.warnings.map((warning) => (
        <p className="l-craft-note" key={warning}>
          {warning}
        </p>
      ))}
      {!plan.complete && (
        <>
          <MaterialTable rows={plan.requirements} label={`${plan.name} 재료`} />
          <ProductionList rows={plan.production} now={now} />
          {plan.requirements.length > 0 && (
            <details className="l-craft-expand">
              <summary>원재료까지 펼쳐 보기</summary>
              <MaterialTree rows={plan.requirements} />
              <h4>이 목표의 원재료</h4>
              <MaterialTable rows={plan.raw} label={`${plan.name} 원재료`} />
            </details>
          )}
        </>
      )}
    </Panel>
  );
}

export function CraftTracker({ room, view, notify }: Tools) {
  const life = view.life;
  const actor = life?.actors[view.self];
  const now = useServerClock(
    view.clockOffset,
    life?.farmx?.machines.map((machine) => machine.doneAt) ?? [],
    30_000,
  );
  const targets = useMemo(
    () => readCraftTargets(life?.me.craftTargets),
    [life?.me.craftTargets],
  );
  const result = useMemo(
    () =>
      life
        ? craftTracker({
            life,
            actor,
            balance: view.wallet.balance,
            targets,
            now,
          })
        : null,
    [life, actor, view.wallet.balance, targets, now],
  );
  const options = useMemo(() => craftTargetOptions(), []);
  const [pick, setPick] = useState('');
  const [draft, setDraft] = useState('1');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const option = options.find((value) => targetKey(value) === pick);
  const quantity = option?.kind === 'facility' ? 1 : quantityOf(draft);
  const proposal =
    life && option && quantity
      ? additionalCraftTarget(life, option, quantity, actor)
      : null;
  const tracked = new Set(targets.map(targetKey));
  const add = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !life ||
      !option ||
      !quantity ||
      !proposal?.target ||
      pending.current ||
      targets.length >= 3 ||
      tracked.has(targetKey(option))
    )
      return;
    const target = proposal.target;
    pending.current = true;
    setBusy(true);
    try {
      if (await room.life({ kind: 'craftTarget', op: 'pin', target })) {
        setPick('');
        setDraft('1');
        notify('제작 목표를 고정했어요.');
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <div
      className="l-craft-tracker"
      data-testid="craft-tracker"
      aria-label="제작 재료 추적"
    >
      <header className="l-craft-heading">
        <h3>
          <Glyph name="bookmark" size={20} /> 제작 목표{' '}
          <small>{targets.length}/3</small>
        </h3>
        <p>
          만들고 싶은 것을 고정해 두면 재료와 가공 시각을 함께 볼 수 있어요.
        </p>
      </header>
      {!life || !result ? (
        <output>마을의 내 재료를 확인하고 있어요.</output>
      ) : (
        <>
          <form
            className="l-craft-add"
            onSubmit={(event) => void add(event)}
            data-testid="craft-add-form"
          >
            <label>
              새 목표{' '}
              <select
                value={pick}
                onChange={(event) => setPick(event.target.value)}
                data-testid="craft-add-select"
              >
                <option value="">만들고 싶은 것 고르기</option>
                {KINDS.map((kind) => (
                  <optgroup key={kind} label={KIND_NAMES[kind]}>
                    {options
                      .filter((value) => value.kind === kind)
                      .map((value) => (
                        <option
                          key={targetKey(value)}
                          value={targetKey(value)}
                          disabled={tracked.has(targetKey(value))}
                        >
                          {value.name}
                          {tracked.has(targetKey(value)) ? ' · 고정됨' : ''}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <label>
              추가로 만들 수량{' '}
              <input
                type="number"
                min={1}
                max={999}
                step={1}
                value={option?.kind === 'facility' ? '1' : draft}
                disabled={option?.kind === 'facility'}
                onChange={(event) => setDraft(event.target.value)}
                data-testid="craft-add-quantity"
              />
            </label>
            <GameButton
              type="submit"
              size="s"
              glyph="pin"
              disabled={
                busy ||
                !option ||
                !quantity ||
                !proposal?.target ||
                targets.length >= 3 ||
                !!(option && tracked.has(targetKey(option)))
              }
              disabledReason={
                targets.length >= 3
                  ? '목표 세 개가 찼어요. 하나를 풀면 새 목표를 고를 수 있어요.'
                  : (proposal?.problem ?? undefined)
              }
              data-testid="craft-add-submit"
            >
              목표로 고정
            </GameButton>
          </form>
          {proposal?.problem && (
            <p className="l-craft-note" role="alert">
              {proposal.problem}
            </p>
          )}
          <p className="l-craft-note">
            목표는 계정에 저장돼요. 요리·가구 만들기와 농장 설비 화면에서도
            고정할 수 있어요. 시설은 해당 종류 한 곳 보유가 목표예요.
          </p>
          <p className="l-craft-note">재료 표는 현재 보유량을 기준으로 한 계획이에요. 실제 제작과 수령은 원래 화면에서 진행해요.</p>
          {!result.targets.length ? (
            <EmptyState
              glyph="pin"
              title="아직 고정한 제작 목표가 없어요"
              hint="위에서 목표를 고르거나, 만들기 화면의 ‘목표로 고정’을 눌러 보세요."
            />
          ) : (
            <>
              <details
                className="l-craft-totals"
                open
                data-testid="craft-totals"
              >
                <summary>모든 목표의 재료 합계</summary>
                <p className="l-craft-note">
                  같은 재료를 여러 목표가 나눠 써요. 공동 창고는 참고 수량이며
                  내 몫에 더하지 않아요. 가공 중인 재료는 수령 시각과 함께
                  표시해요.
                </p>
                <MaterialTable
                  rows={result.totals}
                  label="모든 목표의 재료 합계"
                />
                <details className="l-craft-expand">
                  <summary>모든 목표의 원재료 합계</summary>
                  <MaterialTable
                    rows={result.raw}
                    label="모든 목표의 원재료 합계"
                  />
                </details>
              </details>
              <div className="l-craft-goals">
                {result.targets.map((plan) => (
                  <GoalCard
                    key={plan.key}
                    plan={plan}
                    room={room}
                    view={view}
                    notify={notify}
                    now={now}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
