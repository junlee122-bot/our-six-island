'use client';
// 우리 농장 F4 (handover/design/design-our-farm.md §4): the page of the farm's
// 축사 and 닭장 in the site window. My animals can move in from 닐라's ranch
// (and back), be cared for here, and every day they make 거름; 퇴비 turns it
// into 비료, and the 사일로 cuts my field's grass into 건초. The server
// (lounge-farm-barn.ts) decides; this shows the view and sends the choice.
import type { CloudRoomView } from '../lounge-cloud-room';
import type { LifeAction } from '../lounge-life';
import { MANURE_PER_FERT } from '../lounge-farm-barn-data';
import { ANIMALS } from '../lounge-stage3-data';
import { GameButton } from '../ui/GameButton';
import { MoreActions } from '../ui/MoreActions';

type Run = (a: LifeAction, done: string) => void;

export function FarmBarn({ view, act, busy, kind }: { view: CloudRoomView; act: Run; busy: boolean; kind: 'barn' | 'coop' }) {
  const life = view.life!;
  const barn = life.barn;
  const animals = life.stage3?.animals ?? [];
  const home = (k: string) => (ANIMALS[k as keyof typeof ANIMALS]?.home === 'coop' ? 'coop' : 'barn');
  const here = animals.map((a, i) => ({ a, i })).filter(({ a }) => home(a.k) === kind);
  const room = barn?.room[kind] ?? { max: 0, used: 0 };
  const inv = life.me.inv ?? {};
  const manure = inv.manure ?? 0;
  const hay = inv.hay ?? 0;
  const todo = here.filter(({ a }) => a.farm && !a.cared).length;
  const sideJobs = [!!barn?.manure, manure >= MANURE_PER_FERT, kind === 'barn' && !!barn?.grass].filter(Boolean).length;
  return (
    <>
      <section className="l-town-notice" aria-label={kind === 'barn' ? '축사' : '닭장'} data-testid={`farm-${kind}`}>
        <strong>
          내 칸 {room.used} / {room.max} · {kind === 'barn' ? '소·양' : '닭'}
        </strong>
        <p>닐라 목장의 내 동물을 데려와 여기서 돌볼 수 있어요. 농장에 사는 동물은 매일 거름을 하나씩 만들어요.</p>
        {here.length ? (
          <ul className="l-farm-site-mats" aria-label="내 동물">
            {here.map(({ a, i }) => (
              <li key={i}>
                <span>
                  {a.name} <small>{a.farm ? '농장' : '닐라 목장'} · 정 {a.love}{a.cared ? ' · 오늘 돌봄' : ''}</small>
                </span>
                <GameButton
                  size="s"
                  disabled={busy || (!a.farm && room.used >= room.max)}
                  onClick={() => act({ kind: 'barnMove', i, to: a.farm ? 'ranch' : 'farm' }, a.farm ? `${a.name}이(가) 닐라 목장으로 돌아갔어요.` : `${a.name}이(가) 우리 농장으로 이사 왔어요.`)}
                >
                  {a.farm ? '목장으로' : room.used >= room.max ? '칸이 없어요' : '농장으로'}
                </GameButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="l-farm-site-note">아직 {kind === 'barn' ? '소나 양' : '닭'}이 없어요. 닐라 목장에서 데려와요.</p>
        )}
        <span className="l-town-buttons">
          <GameButton size="s" variant="primary" disabled={busy || !todo || hay < 1} onClick={() => act({ kind: 'barnCare' }, '농장 동물들에게 건초를 주고 쓰다듬었어요.')}>
            {todo ? `돌보기 (${todo}마리 · 건초 ${hay})` : '오늘은 모두 돌봤어요'}
          </GameButton>
        </span>
      </section>
      {/* D10: 돌보기 is the window's main action; 거름·퇴비 and the 사일로 fold under 더 보기. */}
      <MoreActions
        label={kind === 'barn' ? '거름 · 퇴비 · 사일로' : '거름 · 퇴비'}
        hint={sideJobs ? `할 수 있는 일 ${sideJobs}` : undefined}
        open={!todo && sideJobs > 0}
        className="l-farm-site-more l-farm-barn-more"
        data-testid={`farm-${kind}-more`}
      >
        <section className="l-town-notice" aria-label="거름과 비료">
          <strong>거름 {barn?.manure ?? 0}개가 쌓였어요 · 가방 {manure}개</strong>
          <p>거름 {MANURE_PER_FERT}개로 비료 1개를 만들어요. 비료는 밭에 뿌려 품질을 올려요.</p>
          <span className="l-town-buttons">
            <GameButton size="s" disabled={busy || !barn?.manure} onClick={() => act({ kind: 'manureTake' }, `거름 ${barn?.manure ?? 0}개를 챙겼어요.`)}>
              거름 챙기기
            </GameButton>
            <GameButton
              size="s"
              disabled={busy || manure < MANURE_PER_FERT}
              onClick={() => act({ kind: 'compost', n: Math.floor(manure / MANURE_PER_FERT) }, `비료 ${Math.floor(manure / MANURE_PER_FERT)}개를 만들었어요.`)}
            >
              퇴비 만들기 ({Math.floor(manure / MANURE_PER_FERT)}개)
            </GameButton>
          </span>
        </section>
        {kind === 'barn' && (
          <section className="l-town-notice" aria-label="사일로" data-testid="farm-silo">
            <strong>사일로 · 내 밭의 풀 {barn?.grass ?? 0}칸</strong>
            <p>갈지 않은 풀밭을 베어 건초를 만들어요. 풀은 나의 하루마다 다시 자라요.</p>
            <GameButton size="s" disabled={busy || !barn?.grass} onClick={() => act({ kind: 'siloCut', tile: -1 }, `풀을 베어 건초 ${barn?.grass ?? 0}개를 만들었어요.`)}>
              풀 베기
            </GameButton>
          </section>
        )}
      </MoreActions>
    </>
  );
}
