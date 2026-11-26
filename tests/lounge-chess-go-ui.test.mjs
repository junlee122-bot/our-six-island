import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { newChess, chessMove } from '../app/lounge-chess.ts';
import { ALL_CARDS, goNextSeat, goView, newGo } from '../app/lounge-gostop.ts';

// Render the actual table components. Only decorative/audio/motion children are
// stubbed: the authoritative board, public card view and all controls are real.
const stubKey = '__chessGoUiReview';
globalThis[stubKey] = {
  DealerHost: ({ children }) => createElement('div', null, children),
  useReactionReply: () => '', chessHostLine: () => '', gostopHostLine: () => '',
  TurnTimer: () => null, AWAY_LABEL: '자리 비움', GoBoard: () => null,
  playGoMotion: async () => {}, loungeAudio: { tap() {} },
  Expand: () => null, Layers: () => null, X: () => null,
  ArrowRight: () => null, Volume2: () => null, VolumeX: () => null,
};
const stubUrl = 'data:text/javascript;base64,' + Buffer.from(`export const {${Object.keys(globalThis[stubKey]).join(',')}}=globalThis.${stubKey};`).toString('base64');
const require = createRequire(import.meta.url);
async function loadTable(file) {
  const url = new URL('../app/' + file, import.meta.url);
  const { outputText } = ts.transpileModule(await readFile(url, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX,
  } });
  const stubs = new Set(['./lounge-dealer-host', './lounge-dealer-lines', './lounge-turn-timer', './lounge-go-motion', './lounge-audio', './ui/icons', './lounge-go-table']);
  const source = outputText.replace(/^import\s+['"][^'"]+\.css['"];?\s*$/gm, '').replace(/from\s+(['"])([^'"]+)\1/g, (_all, _quote, specifier) => {
    const resolved = stubs.has(specifier) ? stubUrl : specifier.startsWith('.') ? new URL(specifier + '.ts', url).href : pathToFileURL(require.resolve(specifier)).href;
    return `from ${JSON.stringify(resolved)}`;
  });
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}
const { ChessBoard } = await loadTable('lounge-boards.tsx');
const { GoBoard } = await loadTable('lounge-go-table.tsx');
const names = ['도원', '강재', '승준'];
const chessMarkup = (match, seat) => renderToStaticMarkup(createElement(ChessBoard, {
  match, seat, names, onMove() {}, onResign() {}, onDraw() {},
}));
const spread = [...ALL_CARDS].sort((a, b) => a.slice(4).localeCompare(b.slice(4)) || a.localeCompare(b));
const goMarkup = (match, seat) => renderToStaticMarkup(createElement(GoBoard, { match, seat, names, onAction() {} }));

test('chess shows the checked king, preserves legal orientation and has one keyboard entry', () => {
  let match = newChess('check');
  for (const [from, to] of [['e2', 'e4'], ['f7', 'f6'], ['d1', 'h5']]) {
    match = chessMove(match, match.moves.length % 2, from, to);
    assert.ok(match);
  }
  const white = chessMarkup(match, 0), black = chessMarkup(match, 1);
  assert.match(white, /e8 흑 킹 · 체크/);
  assert.match(white, /강재의 킹이 체크 중/);
  assert.match(black, /내 킹이 체크 중/);
  assert.equal((white.match(/tabindex="0"/g) ?? []).length, 1);
  assert.equal((black.match(/tabindex="0"/g) ?? []).length, 1);
  assert.ok(white.indexOf('aria-label="a8') < white.indexOf('aria-label="h1'));
  assert.ok(black.indexOf('aria-label="h1') < black.indexOf('aria-label="a8'));
  assert.match(white, /data-table-controls/);
  assert.match(white, /방향키로 칸 이동/);
});

test('chess spectators can inspect the board without resignation or draw controls', () => {
  const html = chessMarkup(newChess('watch'), -1);
  assert.match(html, /관전/);
  assert.doesNotMatch(html, />기권하기<|>무승부 제안</);
  assert.equal((html.match(/aria-pressed=/g) ?? []).length, 64);
});

test('go-stop decision and ended instructions match the actual available actions', () => {
  const base = goView(newGo('go-ui', spread), 0);
  const decide = goMarkup({ ...base, phase: 'decide' }, 0);
  assert.match(decide, /예상 정산을 보고 고 또는 스톱/);
  assert.doesNotMatch(decide, /낼 패를 골라 주세요/);
  assert.match(decide, /고! 한 번 더/);
  const over = goMarkup({ ...base, phase: 'over', reason: '나가리' }, 0);
  assert.match(over, /이번 판이 끝났어요/);
  assert.doesNotMatch(over, /친구의 차례를 기다려 주세요|다음 강재/);
});

test('go-stop next-seat caption skips empty hands and spectators receive no hidden cards', () => {
  const base = newGo('go-public', spread), view = goView(base, -1);
  assert.equal(goNextSeat([1, 0, 1], 0), 2);
  assert.equal(goNextSeat([1, 0, 0], 0), 0);
  assert.equal(goNextSeat([0, 0, 0], 2), null);
  const html = goMarkup({ ...view, handCounts: [1, 0, 1] }, -1);
  assert.match(html, /다음 승준/);
  assert.match(html, /공개 바닥패와 획득패/);
  for (const card of base.hands.flat()) assert.ok(!html.includes(`data-card-id="${card}"`), card + ' stays private');
  assert.deepEqual(view.hand, []);
});
