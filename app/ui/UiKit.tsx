'use client';
// Dev-only catalogue of the UI primitives (open with `?ui-kit`, see kit-gate.ts).
// Every variant on every venue, so contrast and hit sizes can be checked at a
// glance and by scripts/ui-shots.mjs.
import { useState } from 'react';
import { Modal } from '../lounge/Modal';
import { EmptyState } from './EmptyState';
import { GameButton } from './GameButton';
import { Glyph, GLYPH_NAMES } from './Glyph';
import { KeyHint, KeyHintBar } from './KeyHint';
import { CloseButton, Panel } from './Panel';
import { Tabs } from './Tabs';
import './ui-kit.css';

const VENUES = [
  ['village', undefined],
  ['hall', 'hall'],
  ['casino', 'casino'],
  ['tavern', 'tavern'],
] as const;

export default function UiKit() {
  const [tab, setTab] = useState<'buttons' | 'panels' | 'glyphs'>('buttons');
  const [open, setOpen] = useState(false);
  return (
    <main className="ui-kit l-app" data-testid="ui-kit">
      <header className="ui-kit-head">
        <h1>범타듀 UI 프리미티브</h1>
        <p>토큰: app/ui/tokens.css · 컴포넌트: app/ui/*.tsx · 이 쪽은 개발용이에요.</p>
      </header>
      <Tabs
        label="프리미티브"
        numberKeys
        value={tab}
        onChange={setTab}
        items={[
          { id: 'buttons', label: '버튼과 키', glyph: 'hand' },
          { id: 'panels', label: '창 껍데기', glyph: 'book' },
          { id: 'glyphs', label: '글리프', glyph: 'star' },
        ]}
      />
      {tab === 'buttons' && (
        <div className="ui-kit-grid">
          {VENUES.map(([name, venue]) => (
            <section key={name} className="ui-kit-venue" data-venue={venue}>
              <h2>{name}</h2>
              <div className="ui-kit-row">
                <GameButton variant="primary" glyph="check" keyAction="action">
                  거두기
                </GameButton>
                <GameButton variant="secondary" glyph="letter">
                  편지 쓰기
                </GameButton>
                <GameButton variant="danger">방 나가기</GameButton>
                <GameButton variant="ghost">자세히</GameButton>
              </div>
              <div className="ui-kit-row">
                <GameButton variant="primary" size="s">
                  작게
                </GameButton>
                <GameButton variant="primary" size="l" keyLabel="Enter">
                  시작하기
                </GameButton>
                <GameButton variant="secondary" glyph="plus" iconOnly>
                  더하기
                </GameButton>
                <CloseButton onClick={() => {}} />
              </div>
              <div className="ui-kit-row">
                <GameButton variant="primary" disabled disabledReason="재료가 부족해요">
                  만들기
                </GameButton>
                <GameButton variant="secondary" disabled>
                  비활성
                </GameButton>
                <GameButton variant="danger" disabled>
                  기권
                </GameButton>
              </div>
              <KeyHintBar
                items={[
                  { keys: ['up', 'left', 'down', 'right'], does: '칸 고르기' },
                  { keys: ['action'], does: '가꾸기' },
                  { keys: [{ code: 'Escape' }], does: '덮기' },
                ]}
              />
              <p className="ui-kit-copy">
                본문 글씨예요. <span className="ui-kit-soft">보조 문구는 이 색이에요.</span> 키캡은 <KeyHint action="inventory" /> 처럼 써요.
              </p>
            </section>
          ))}
        </div>
      )}
      {tab === 'panels' && (
        <div className="ui-kit-grid">
          <Panel variant="journal" title="텃밭 장부" titleId="kit-j" actions={<CloseButton onClick={() => {}} />} footer={<KeyHintBar items={[{ keys: ['action'], does: '가꾸기' }, { keys: [{ code: 'Escape' }], does: '덮기' }]} />}>
            <p className="ui-kit-copy">호두나무 제본, 크림 종이, 테이프 제목. 정보 창의 기본이에요.</p>
          </Panel>
          <Panel variant="note" title="마을 적응하기" titleId="kit-n">
            <p className="ui-kit-copy">테이프 붙은 쪽지예요. 소식, 편지, 체크리스트에 써요.</p>
          </Panel>
          <div className="ui-kit-stack">
            <Panel variant="sign" as="div">
              <Glyph name="sprout" size={22} /> 승준의 텃밭
            </Panel>
            <Panel variant="felt" title="블랙잭" titleId="kit-f">
              <p className="ui-kit-copy">펠트와 황동 — 카지노 판이에요.</p>
              <GameButton variant="primary">히트</GameButton> <GameButton variant="secondary" disabled>스탠드</GameButton>
            </Panel>
            <Panel variant="hanji" title="섯다" titleId="kit-h">
              <p className="ui-kit-copy">한지와 옻칠 — 회관 판이에요.</p>
              <GameButton variant="primary">콜</GameButton>
            </Panel>
          </div>
          <EmptyState
            glyph="camera"
            title="아직 추억이 없어요"
            hint="친구와 하트가 2개가 되면 첫 장이 생겨요."
            action={<GameButton variant="primary" onClick={() => setOpen(true)}>창 껍데기 열어 보기</GameButton>}
          />
        </div>
      )}
      {tab === 'glyphs' && (
        <ul className="ui-kit-glyphs" aria-label="글리프">
          {GLYPH_NAMES.map((n) => (
            <li key={n}>
              <Glyph name={n} size={32} />
              <span>{n}</span>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <Modal title="수첩 창" panel="journal" onClose={() => setOpen(false)} keyHints={[{ keys: ['action'], does: '고르기' }]}>
          <p className="ui-kit-copy">journal 껍데기: 닫기 버튼 44px, Esc로 닫혀요.</p>
        </Modal>
      )}
    </main>
  );
}
