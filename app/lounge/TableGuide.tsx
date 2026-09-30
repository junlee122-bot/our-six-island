'use client';
// 규칙과 기록: the game screen's guide. One short rules card with examples,
// my record at this game, and this week's table (lounge-table-stats.ts).
import { useState } from 'react';
import { GAME_INFO, TABLE_AREA, type GameKind } from '../lounge-games';
import { VENUES } from '../lounge-venues';
import { ACTORS } from '../lounge-roster';
import { formatBeom } from '../lounge-text';
import type { CloudRoomView } from '../lounge-cloud-room';
import type { EconomyGame } from '../lounge-economy';
import type { GameStat } from '../lounge-table-stats';
import { Tabs, tabPanelProps } from '../ui/Tabs';
import { EmptyState } from '../ui/EmptyState';
import { Modal } from './Modal';
import { GAME_RULES } from './game-rules';
import './table-guide.css';

export type GuideTab = 'rules' | 'record' | 'week';
const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + formatBeom(Math.abs(n));
const staked = (kind: GameKind): kind is EconomyGame => kind !== 'liar';

function Record({ stat }: { stat: GameStat }) {
  const rate = stat.n ? Math.round((stat.w / stat.n) * 100) : 0;
  const rows: [string, string][] = [
    ['판 수', `${stat.n}판 · ${stat.w}승 ${stat.l}패${stat.n - stat.w - stat.l ? ` ${stat.n - stat.w - stat.l}무` : ''}`],
    ['승률', `${rate}%`],
    ['누적 손익', signed(stat.net)],
    ['가장 크게 딴 판', stat.best > 0 ? `+${formatBeom(stat.best)}` : '아직 없어요'],
    ['가장 큰 판돈', formatBeom(stat.pot)],
  ];
  return (
    <dl className="l-guide-record">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd data-testid={'guide-record-' + k}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TableGuide({
  kind,
  view,
  onClose,
  initial = 'rules',
}: {
  kind: GameKind;
  view: CloudRoomView;
  onClose: () => void;
  initial?: GuideTab;
}) {
  const [tab, setTab] = useState<GuideTab>(initial);
  const rules = GAME_RULES[kind],
    name = GAME_INFO[kind].name,
    stats = view.tableStats,
    me = view.players.find((p) => p.id === view.self)?.actor;
  const mine = staked(kind) ? stats?.mine[kind] : undefined,
    week = staked(kind) ? (stats?.week[kind] ?? []) : [],
    last = staked(kind) ? stats?.last[kind] : undefined;
  const idBase = 'table-guide-' + kind;
  return (
    <Modal
      title={`${name} 규칙과 기록`}
      onClose={onClose}
      venue={VENUES[TABLE_AREA[kind]].venue}
      className="l-table-guide"
      keyHints={[{ keys: [{ label: '1–3' }], does: '탭 넘기기' }]}
    >
      <Tabs
        items={[
          { id: 'rules', label: '규칙', glyph: 'book' },
          { id: 'record', label: '내 기록', glyph: 'award' },
          { id: 'week', label: '이번 주 순위', glyph: 'trophy' },
        ]}
        value={tab}
        onChange={setTab}
        label={`${name} 안내`}
        numberKeys
        idBase={idBase}
      />
      <div {...tabPanelProps(idBase, tab)} className="l-guide-page">
        {tab === 'rules' ? (
          <>
            <p className="l-guide-goal">{rules.goal}</p>
            <h3>내 차례에는</h3>
            <ol className="l-guide-turn">
              {rules.turn.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            <h3>예를 들면</h3>
            <dl className="l-guide-examples">
              {rules.examples.map((e) => (
                <div key={e.title}>
                  <dt>{e.title}</dt>
                  <dd>{e.body}</dd>
                </div>
              ))}
            </dl>
            <p className="l-guide-clock">{rules.clock}</p>
          </>
        ) : !staked(kind) ? (
          <EmptyState
            glyph="book"
            title="라이어 게임은 범이 오가지 않아 기록하지 않아요."
            hint="판마다 점수는 테이블 위 점수판에서 볼 수 있어요."
          />
        ) : tab === 'record' ? (
          mine ? (
            <Record stat={mine} />
          ) : (
            <EmptyState
              glyph="award"
              title={`아직 범을 건 ${name} 판이 없어요.`}
              hint="범이 걸린 판이 끝나면 여기에 쌓여요. 파티 판과 연습 판은 세지 않아요."
            />
          )
        ) : (
          <>
            {week.length ? (
              <ol className="l-guide-week" aria-label={`이번 주 ${name} 순위`}>
                {week.map((r, i) => (
                  <li key={r.actor} data-me={r.actor === me || undefined}>
                    <b>{i + 1}</b>
                    <span>{ACTORS[r.actor]}</span>
                    <small>
                      {r.n}판 {r.w}승
                    </small>
                    <em>{signed(r.net)}</em>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                glyph="trophy"
                title={`이번 주에는 아직 ${name} 판이 없어요.`}
                hint="범이 걸린 판의 손익으로 순위를 매겨요."
              />
            )}
            <p className="l-guide-clock">
              {last
                ? `지난주 1등은 ${ACTORS[last.actor]}(${signed(last.net)}, ${last.n}판)이에요. `
                : ''}
              순위는 월요일 0시에 새로 시작해요. 같은 손익이면 이긴 판이 많은 친구가 앞서요.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
