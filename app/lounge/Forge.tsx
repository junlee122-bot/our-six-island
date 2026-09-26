'use client';
// 대장간 (성장 P1): 무쇠 아저씨's counter. Before 마을 개척 “대장간 재건” the
// workshop is a ruin and the dialog shows the shared project (you can give
// right here). Afterwards: the tool rack (↑↓ + Enter), dropping a tool off
// (next day 06:00 KST; you keep working with the old one), picking it up with
// a small “hold it up” moment, and the village chief's first-tool gift.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { CloudRoom, CloudRoomView } from '../lounge-cloud-room';
import {
  FIRST_TOOL_ROCKS,
  TIER_NAME,
  TOOL_INFO,
  type ToolId,
  type ToolTier,
} from '../lounge-growth-data';
import type { ToolView } from '../lounge-growth';
import { ITEM_BY_ID } from '../lounge-items';
import { formatBeom, josa } from '../lounge-text';
import { lifeSfx } from '../lounge-audio-life';
import { ConfirmModal, Modal } from './Modal';
import { Glyph } from './field-glyphs';
import { ItemIcon } from './ItemIcon';
import type { Notify } from './Toast';
import { useLifeAction } from './LifePanels';
import { useServerClock } from './use-server-clock';
import { ResearchBoard } from './GrowthResearch';
import { TOOL_GLYPH } from './growth-glyphs';
import './farm-fish.css';
import './growth.css';

function untilText(ms: number) {
  const m = Math.max(1, Math.ceil(ms / 60_000));
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  return `${h}시간${m % 60 ? ` ${m % 60}분` : ''}`;
}
const toolWord = (id: ToolId, tier: number) =>
  `${TIER_NAME[tier as ToolTier]} ${TOOL_INFO[id].name}`;

export function ForgePanel({
  room,
  view,
  notify,
  onClose,
  onGrowth,
}: {
  room: CloudRoom;
  view: CloudRoomView;
  notify: Notify;
  onClose: () => void;
  /** Opens the 성장 수첩 (tools page). */
  onGrowth?: () => void;
}) {
  const life = view.life;
  const g = life?.growth;
  const now = useServerClock(view.clockOffset, [g?.forge?.readyAt], 30_000);
  const [at, setAt] = useState(() =>
    Math.max(0, g?.tools.findIndex((t) => t.next && !t.next.why) ?? 0),
  );
  const [confirm, setConfirm] = useState<ToolView | null>(null);
  const [lifted, setLifted] = useState<{ tool: ToolId; tier: number } | null>(
    null,
  );
  const [run, busy] = useLifeAction(room, notify);
  const rackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      rackRef.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(id);
  }, []);
  if (!life || !g)
    return (
      <Modal title="대장간" onClose={onClose} className="l-forge">
        <p className="l-ledger-empty">
          마을에 연결되면 대장간에 들어갈 수 있어요.
        </p>
      </Modal>
    );
  if (!g.forgeOpen)
    return (
      <Modal
        title="무너진 공방"
        onClose={onClose}
        className="l-forge l-growth"
        wide
      >
        <div className="l-forge-ruin">
          <p className="l-forge-say">
            <Glyph name="anvil" size={22} />
            <span>
              지붕이 내려앉은 옛 공방이에요. 모루는 아직 멀쩡해 보여요. 마을
              친구들이 범과 나무·돌을 모으면 대장장이 <b>무쇠 아저씨</b>가 다시
              불을 지펴 준대요.
            </span>
          </p>
          <ResearchBoard room={room} view={view} notify={notify} compact />
        </div>
      </Modal>
    );
  const tools = g.tools;
  const tool = tools[at] ?? tools[0];
  const job = g.forge;
  const say = lifted
    ? `자, ${toolWord(lifted.tool, lifted.tier)}다! 손에 착 붙지?`
    : job?.ready
      ? `${josa(TOOL_INFO[job.tool].name, '이/가')} 다 됐다! 한번 쥐어 봐.`
      : job
        ? `${josa(TOOL_INFO[job.tool].name, '을/를')} 두드리는 중이야. 내일 아침 여섯 시에 와. 그동안은 쓰던 걸로 일하면 돼.`
        : '어서 와. 뭐 두드려 줄까? 맡기면 다음 날 아침 여섯 시에 찾아가.';
  const pickup = async () => {
    if (!job) return;
    const ok = await run(
      { kind: 'forgePickup' },
      `${toolWord(job.tool, job.to)}를 받았어요!`,
    );
    if (ok) {
      lifeSfx('fanfare');
      setLifted({ tool: job.tool, tier: job.to });
    }
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (
      t !== e.currentTarget &&
      t.tagName === 'BUTTON' &&
      (e.key === 'Enter' || e.key === ' ')
    )
      return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp')
      setAt(
        (i) =>
          (i + (e.key === 'ArrowDown' ? 1 : -1) + tools.length) % tools.length,
      );
    else if (e.key === 'Enter' || e.key === ' ') {
      if (job?.ready) void pickup();
      else if (!job && tool.next && !tool.next.why) setConfirm(tool);
    } else return;
    e.preventDefault();
    e.stopPropagation();
  };
  return (
    <>
      <Modal
        title="대장간 · 무쇠 아저씨"
        onClose={onClose}
        className="l-forge l-growth"
        wide
      >
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- ↑↓ pick a tool, Enter drops it off or picks it up. */}
        <div
          ref={rackRef}
          className="l-forge-body"
          tabIndex={-1}
          role="application"
          aria-roledescription="대장간"
          onKeyDown={onKey}
          data-testid="forge-panel"
        >
          <div className="l-forge-counter">
            <p className="l-forge-say" data-testid="forge-say">
              <span className="l-forge-smith" aria-hidden="true">
                <Glyph name="anvil" size={30} />
              </span>
              <span>
                <b>무쇠 아저씨</b> {say}
              </span>
            </p>
            {lifted ? (
              <div className="l-forge-lift" data-testid="forge-lifted">
                <span className="l-forge-raise" aria-hidden="true">
                  <Glyph name={TOOL_GLYPH[lifted.tool]} size={72} />
                </span>
                <strong>{toolWord(lifted.tool, lifted.tier)}</strong>
                <small>
                  {TOOL_INFO[lifted.tool].tiers[lifted.tier as ToolTier]}
                </small>
                <button
                  type="button"
                  className="l-ink l-small"
                  onClick={() => setLifted(null)}
                >
                  고마워요
                </button>
              </div>
            ) : job ? (
              <div
                className="l-forge-job"
                data-ready={job.ready || undefined}
                data-testid="forge-job"
              >
                <span className="l-forge-anvil" aria-hidden="true">
                  <Glyph name={TOOL_GLYPH[job.tool]} size={46} />
                </span>
                <span>
                  <strong>{toolWord(job.tool, job.to)}</strong>
                  <small>
                    {job.ready
                      ? '다 됐어요 · 지금 찾을 수 있어요'
                      : `${untilText(job.readyAt - now)} 뒤 (아침 6시)`}
                  </small>
                </span>
                {job.ready && (
                  <button
                    type="button"
                    className="l-leaf"
                    disabled={busy}
                    onClick={() => void pickup()}
                    data-testid="forge-pickup"
                  >
                    <Glyph name="anvil" /> 찾기 <kbd>Enter</kbd>
                  </button>
                )}
              </div>
            ) : null}
            {g.gift.available ? (
              <div className="l-forge-letter" data-testid="forge-gift">
                <Glyph name="book" size={22} />
                <span>
                  <b>촌장님 편지</b> 마을 바위를 {FIRST_TOOL_ROCKS}개 넘게
                  깼다지? 첫 도구는 마을이 선물할게요. 구리 곡괭이를 받아 가요.
                </span>
                <button
                  type="button"
                  className="l-leaf l-small"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      { kind: 'forgeGift' },
                      '구리 곡괭이를 선물받았어요!',
                    ).then((ok) => {
                      if (ok) {
                        lifeSfx('fanfare');
                        setLifted({ tool: 'pickaxe', tier: 2 });
                      }
                    })
                  }
                >
                  받기
                </button>
              </div>
            ) : !g.gift.claimed &&
              tools.find((t) => t.id === 'pickaxe')?.tier === 1 ? (
              <p className="l-ledger-aside">
                <Glyph name="book" size={16} /> 촌장님 편지: 마을 바위{' '}
                {FIRST_TOOL_ROCKS}개를 깨면 구리 곡괭이를 선물해요 (
                {Math.min(g.gift.rocks, FIRST_TOOL_ROCKS)}/{FIRST_TOOL_ROCKS})
              </p>
            ) : null}
          </div>
          <ul
            className="l-forge-rack"
            aria-label="도구 (↑↓로 고르기, Enter로 맡기기)"
          >
            {tools.map((t, i) => {
              const next = t.next;
              const away = job?.tool === t.id;
              const status = away
                ? job!.ready
                  ? '찾을 수 있어요'
                  : '맡김'
                : !next
                  ? '최고 단계'
                  : next.shop
                    ? '낚시 도구함에서'
                    : next.why
                      ? next.why === '재료가 부족해요.'
                        ? '재료 부족'
                        : '아직'
                      : '맡길 수 있어요';
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-current={i === at || undefined}
                    className="l-forge-tool"
                    data-state={
                      away ? 'away' : next && !next.why && !job ? 'ok' : 'no'
                    }
                    onClick={() => setAt(i)}
                    onDoubleClick={() =>
                      !job && next && !next.why && setConfirm(t)
                    }
                    data-testid={`forge-tool-${t.id}`}
                  >
                    <span className="l-tool-peg" aria-hidden="true">
                      <Glyph name={TOOL_GLYPH[t.id]} size={28} />
                    </span>
                    <span className="l-tool-main">
                      <strong>{toolWord(t.id, t.tier)}</strong>
                      <small>
                        {next && next.mats ? (
                          <>
                            → {next.to}단계 · {formatBeom(next.beom ?? 0)} ·{' '}
                            {Object.entries(next.mats)
                              .map(
                                ([id, n]) =>
                                  `${ITEM_BY_ID[id]?.name ?? id} ${n}`,
                              )
                              .join(' · ')}
                            {next.senior ? ' · 선배 할인' : ''}
                          </>
                        ) : next?.shop ? (
                          `→ ${next.to}단계는 낚시 도구함에서 바로`
                        ) : (
                          TOOL_INFO[t.id].tiers[t.tier as ToolTier]
                        )}
                      </small>
                    </span>
                    <span className="l-forge-status">{status}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <section className="l-forge-detail" aria-live="polite">
            <h4>
              {toolWord(tool.id, tool.tier)}
              {tool.next ? ` → ${TIER_NAME[tool.next.to as ToolTier]}` : ''}
            </h4>
            <p>
              지금: {TOOL_INFO[tool.id].tiers[tool.tier as ToolTier]}
              {tool.next ? (
                <>
                  <br />
                  다음: {TOOL_INFO[tool.id].tiers[tool.next.to as ToolTier]}
                </>
              ) : null}
            </p>
            {tool.next?.mats && (
              <ul className="l-tool-cost">
                <li
                  data-short={
                    view.wallet.balance < (tool.next.beom ?? 0) || undefined
                  }
                >
                  <Glyph name="sack" size={20} />{' '}
                  {formatBeom(tool.next.beom ?? 0)}
                </li>
                {Object.entries(tool.next.mats).map(([id, n]) => (
                  <li
                    key={id}
                    data-short={(life.me.inv?.[id] ?? 0) < n || undefined}
                  >
                    <ItemIcon id={id} size={22} /> {ITEM_BY_ID[id]?.name}{' '}
                    {Math.min(life.me.inv?.[id] ?? 0, n)}/{n}
                  </li>
                ))}
              </ul>
            )}
            {tool.next?.why && !tool.next.shop ? (
              <p className="l-why">{tool.next.why}</p>
            ) : null}
            <div className="l-ledger-row-actions">
              <button
                type="button"
                className="l-leaf"
                disabled={
                  busy ||
                  !!job ||
                  !tool.next ||
                  !!tool.next.why ||
                  view.wallet.balance < (tool.next.beom ?? 0)
                }
                onClick={() => setConfirm(tool)}
                data-testid="forge-drop"
              >
                <Glyph name="anvil" /> 맡기기 <kbd>Enter</kbd>
              </button>
              {onGrowth && (
                <button
                  type="button"
                  className="l-ink l-small"
                  onClick={onGrowth}
                >
                  성장 수첩
                </button>
              )}
            </div>
            <p className="l-ledger-keys" aria-hidden="true">
              <kbd>↑↓</kbd> 도구 고르기 <kbd>Enter</kbd> 맡기기·찾기{' '}
              <kbd>Esc</kbd> 나가기
            </p>
          </section>
        </div>
      </Modal>
      {confirm && confirm.next && (
        <ConfirmModal
          title={`${TOOL_INFO[confirm.id].name}를 맡길까요?`}
          body={
            <>
              <b>{toolWord(confirm.id, confirm.next.to)}</b>로 두드려 줄게.{' '}
              <b>{formatBeom(confirm.next.beom ?? 0)}</b>
              {Object.entries(confirm.next.mats ?? {}).map(
                ([id, n]) => ` · ${ITEM_BY_ID[id]?.name} ${n}개`,
              )}
              가 들어. 내일 아침 6시에 찾아가고, 그동안은 지금 도구로 일하면 돼.
            </>
          }
          confirmLabel="맡기기"
          busyLabel="맡기는 중…"
          cancelLabel="다음에"
          onClose={() => setConfirm(null)}
          onConfirm={async () => {
            const ok = await run(
              { kind: 'forge', tool: confirm.id },
              `${josa(TOOL_INFO[confirm.id].name, '을/를')} 맡겼어요. 내일 아침 6시에 찾아가요.`,
            );
            if (ok) lifeSfx('anvil');
            return ok;
          }}
        />
      )}
    </>
  );
}
