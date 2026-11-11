'use client';
import { useId, useState } from 'react';
import type { LifeView } from '../lounge-life';
import {
  returnBoardItems,
  returnBoardStoryNpcs,
  type ReturnBoardDestination,
  type ReturnBoardItem,
  type ReturnBoardOpen,
} from '../lounge-return-board';
import { Panel } from '../ui/Panel';
import { GameButton } from '../ui/GameButton';
import { EmptyState } from '../ui/EmptyState';
import { Glyph, type GlyphName } from '../ui/Glyph';
import { useTalkBooks } from './npc-talk-books';
import { useServerClock } from './use-server-clock';
import './return-board.css';

const GLYPHS: Record<ReturnBoardItem['kind'], GlyphName> = {
  harvest: 'basket',
  processing: 'timer',
  story: 'book',
  makeup: 'moon',
};
const OPEN_LABELS: Record<ReturnBoardItem['kind'], string> = {
  harvest: '밭 보기',
  processing: '가공 보기',
  story: '수첩 보기',
  makeup: '침대 안내',
};
const PRIORITY: Record<ReturnBoardItem['kind'], number> = {
  harvest: 0,
  processing: 1,
  makeup: 2,
  story: 3,
};

export type ReturnBoardProps = {
  life: LifeView | null | undefined;
  actor: number;
  clockOffset: number;
  onOpen: (target: ReturnBoardOpen) => void;
  onNavigate?: (target: ReturnBoardDestination) => void;
  onTargets?: () => void;
  onOrders?: () => void;
};

/** Personal tasks beside the welcome-back news; all actions stay in their original UI. */
export function ReturnBoard({
  life,
  actor,
  clockOffset,
  onOpen,
  onNavigate,
  onTargets,
  onOrders,
}: ReturnBoardProps) {
  const titleId = useId();
  const [expanded, setExpanded] = useState(false);
  const waiting = useTalkBooks(returnBoardStoryNpcs(life));
  const now = useServerClock(
    clockOffset,
    [...(life?.farmx?.machines.map((m) => m.doneAt) ?? []), life?.communityOrders?.endsAt],
    5_000,
  );
  const items = returnBoardItems(life, actor, now).sort(
    (a, b) => PRIORITY[a.kind] - PRIORITY[b.kind],
  );
  const shown = expanded ? items : items.slice(0, 6);
  const hidden = Math.max(0, items.length - 6);
  const orders = life?.communityOrders;
  const currentOrder = orders?.active;
  const claimable = orders ? [orders.active, ...orders.previous].filter((order) => order?.canClaim).length : 0;
  const finishedLines = currentOrder?.lines.filter((line) => line.remaining === 0).length ?? 0;
  return (
    <Panel
      variant="note"
      title={
        <>
          <Glyph name="checklist" size={21} /> 돌아온 오늘
        </>
      }
      titleId={titleId}
      actions={
        onTargets || onOrders ? <div className="l-return-board-links">
        {onTargets && (
          <GameButton
            size="s"
            glyph="bookmark"
            onClick={onTargets}
            data-testid="return-board-targets"
          >
            제작 목표 보기
          </GameButton>
        )}
        {onOrders && <GameButton size="s" glyph="people" onClick={onOrders} data-testid="return-board-orders">친구 공동 주문서{claimable > 0 ? ` · 기념품 ${claimable}` : ''}</GameButton>}
        </div> : undefined
      }
      className="l-return-board"
      data-testid="return-board"
    >
      <p className="l-return-board-intro">
        하고 싶은 일부터 골라 보세요. 수확과 수령, 대화가 끝나면 목록도
        바뀌어요.
      </p>
      {onOrders && orders && <p className="l-return-board-community" data-testid="return-board-community">
        <strong>친구들과 함께</strong>{' '}
        {claimable > 0 ? `받을 기념품이 ${claimable}개 있어요.` : currentOrder?.completedAt ? `‘${currentOrder.order.title}’ 주문을 함께 마쳤어요.` : currentOrder && now < orders.endsAt ? `‘${currentOrder.order.title}’ · ${finishedLines}/${currentOrder.lines.length}품목을 모았어요.` : '이번 주에 함께 준비할 주문을 골라 보세요.'}
      </p>}
      {waiting.size > 0 ? (
        <output className="l-help-text">
          이어갈 이야기를 확인하고 있어요.
        </output>
      ) : null}
      {!life ? (
        <output className="l-help-text">
          마을의 내 소식을 확인하고 있어요.
        </output>
      ) : !items.length && waiting.size === 0 ? (
        <EmptyState
          glyph="leaf"
          title="지금 기다리는 일은 없어요"
          hint="오늘은 마음 가는 곳부터 천천히 둘러보세요."
        />
      ) : items.length > 0 ? (
        <>
          <ul
            id={`${titleId}-list`}
            className="l-return-board-list"
            aria-label="돌아온 오늘의 할 일"
          >
            {shown.map((item) => (
              <li key={item.id} data-testid={`return-board-item-${item.id}`}>
                <span className="l-return-board-glyph">
                  <Glyph name={GLYPHS[item.kind]} size={26} />
                </span>
                <div className="l-return-board-copy">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <div className="l-return-board-actions">
                  <GameButton
                    size="s"
                    onClick={() => onOpen(item.open)}
                    aria-label={`${item.title} · ${OPEN_LABELS[item.kind]}`}
                  >
                    {OPEN_LABELS[item.kind]}
                  </GameButton>
                  {onNavigate && <GameButton
                    size="s"
                    variant="ghost"
                    glyph="compass"
                    onClick={() => onNavigate(item.destination)}
                    aria-label={`${item.title} · 길 안내`}
                  >
                    길 안내
                  </GameButton>}
                </div>
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <GameButton
              size="s"
              variant="ghost"
              aria-controls={`${titleId}-list`}
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              data-testid="return-board-expand"
            >
              {expanded ? '간단히 보기' : `나머지 ${hidden}건 보기`}
            </GameButton>
          )}
        </>
      ) : null}
    </Panel>
  );
}
